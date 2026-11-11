"""维护者出样片用的适配命令：把 samples/tools/gen.py 的任务交给青水。只在本仓库，不随 Skill 安装。

    source scripts/providers/qingshui.env          # 三类都指向本文件
    python3 samples/tools/gen.py                   # 看三类是否都配好

青水的 Skill 在 Chans-gh/AI-Video-Project（原名 chans-gh/test）的 .claude/skills/qingshui/：生图、生视频走它的 scripts/run.js，语音走 scripts/api.js audio。
位置用环境变量 QINGSHUI_SKILL 指定，默认是和本仓库并排的 ../AI-Video-Project/.claude/skills/qingshui（旧的 ../test/ 也认）。
Key 只由青水的脚本从环境变量 QINGSHUI_API_KEY 读，本文件只查有没有，不读出来、不打印。
青水的输出含任务编号和带签名的下载链接：只进 gen.py 写的 out/gen/ 日志（不进仓库）。
"""
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
QS = Path(os.environ.get("QINGSHUI_SKILL") or next(
    (p for p in (ROOT.parent / n / ".claude" / "skills" / "qingshui" for n in ("AI-Video-Project", "test")) if p.is_dir()),
    ROOT.parent / "AI-Video-Project" / ".claude" / "skills" / "qingshui"))
UA = "AI-Coding-Video-sample-builder/0.1 (https://github.com/Chans-gh/AI-Coding-Video)"


def check():
    if not os.environ.get("QINGSHUI_API_KEY"):
        sys.exit("缺环境变量 QINGSHUI_API_KEY")
    if not (QS / "scripts" / "run.js").exists():
        sys.exit(f"找不到青水 Skill：{QS}（把 Chans-gh/AI-Video-Project 克隆到本仓库旁边，或设 QINGSHUI_SKILL）")


def fetch(url, dest):
    """带签名的临时链接：只下到输出目录，链接本身不留"""
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for i in range(4):
        try:
            with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as f:
                shutil.copyfileobj(r, f)
            return dest
        except Exception:
            if i == 3:
                raise
            time.sleep(2 * 2 ** i)


def logged(out, qjob):
    """run.js 的记录里有没有同一个任务（同提示词、同参数）已经拿到任务编号、没失败、但文件没下下来"""
    log = out / "gen" / "log.json"
    if not log.exists():
        return False
    e = next((e for e in reversed(json.loads(log.read_text(encoding="utf-8"))) if e.get("id") == qjob["id"]), None)
    return bool(e and e.get("task_id") and e.get("status") != "failed" and e.get("prompt") == qjob["prompt"] and e.get("options") == qjob["options"]
                and not any(g.suffix != ".json" for g in (out / "gen").glob(f"{qjob['id']}.*")))


def visual(job, out):
    """生图 / 生视频：写 run.js 的任务文件，生成的文件落在 <输出目录>/gen/"""
    jid = job["id"]
    qjob = {"id": jid, "type": job["type"], "prompt": job["prompt"], "options": {"model": job["model"], **job.get("params", {})}}
    if job.get("refs") and job["type"] == "video" and job["model"].startswith("grok"):
        qjob["frames"] = {"image": job["refs"][0]}      # grok 的参考图是「保持人物一致」，当首帧要走首尾帧模式
    elif job.get("refs"):
        qjob["refs"] = job["refs"]
        if job["model"].startswith("Doubao-Seedance"):
            qjob["refField"] = "referenceImage"
    jf = out / f"{jid}.qs.json"
    jf.write_text(json.dumps(qjob, ensure_ascii=False, indent=1), encoding="utf-8")
    subprocess.run(["node", str(QS / "scripts" / "run.js"), "check", str(jf)], check=True, stdout=sys.stderr)
    if logged(out, qjob):       # 上次已经生成、只是下载失败：接着下载，不再扣一次算力
        subprocess.run(["node", str(QS / "scripts" / "run.js"), "fetch", str(out), jid], check=True, stdout=sys.stderr)
    else:
        subprocess.run(["node", str(QS / "scripts" / "run.js"), str(jf)], check=True, stdout=sys.stderr)
    got = [g for g in sorted((out / "gen").glob(f"{jid}.*")) + sorted((out / "gen").glob(f"{jid}_*.*")) if g.suffix != ".json"]
    if not got:
        sys.exit("青水没有返回文件")
    return {"file": str(got[0])}


def subtitles(js):
    """青水（MiniMax）的逐字字幕：毫秒、timestamped_words → gen.py 的字幕格式（秒、words）"""
    rows = js if isinstance(js, list) else js.get("subtitles") or js.get("data") or []
    out, off = [], 0
    for seg in rows:
        s = {"text": seg.get("text", ""), "t0": seg["time_begin"] / 1000, "t1": seg["time_end"] / 1000}
        words = seg.get("timestamped_words") or []
        # 长稿分成几句返回时，word_begin / word_end 是整稿里的位置：减去前面几句的字数，换成这一句里的位置（gen.py 的约定）
        k = off if words and words[-1]["word_end"] > len(s["text"]) else 0
        if words:
            s["words"] = [{"t0": w["time_begin"] / 1000, "t1": w["time_end"] / 1000, "begin": w["word_begin"] - k, "end": w["word_end"] - k}
                          for w in words]
        off += len(s["text"])
        out.append(s)
    return out


def speech(job, out):
    if job.get("voice", "").startswith("clone_"):
        sys.exit("不用克隆音色，换一个公开音色")
    jid = job["id"]
    cmd = ["node", str(QS / "scripts" / "api.js"), "audio", "--text", job["text"], "--model", job["model"],
           "--voice-id", job["voice"], "--format", "mp3", "--subtitle", "--subtitle-type", "word", "--sample-rate", "32000"]
    for k, v in job.get("params", {}).items():
        cmd += [f"--{k}", str(v)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    sys.stderr.write(r.stdout + r.stderr)
    a = re.search(r"语音文件:\s*(\S+)", r.stdout)
    sub = re.search(r"字幕文件:\s*(\S+)", r.stdout)
    if r.returncode or not a:
        sys.exit("语音合成失败")
    res = {"file": str(fetch(a.group(1), out / f"{jid}.mp3"))}
    if sub:
        raw = fetch(sub.group(1), out / f"{jid}.qs-subs.json")
        sj = out / f"{jid}.subs.json"
        sj.write_text(json.dumps(subtitles(json.loads(raw.read_text(encoding="utf-8"))), ensure_ascii=False, indent=1), encoding="utf-8")
        res["subtitles"] = str(sj)
    return res


def main():
    job = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    check()
    res = speech(job, out) if job["type"] == "tts" else visual(job, out)
    print(json.dumps(res, ensure_ascii=False))


if __name__ == "__main__":
    main()
