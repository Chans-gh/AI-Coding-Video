"""AI 生成素材的服务商接口：生图、生视频、语音合成、生成矢量四类，各用一个环境变量指定「适配命令」，不绑定哪一家服务。

    python3 tools/gen.py                 # 四类各配了没有
    python3 tools/gen.py try image       # 跑一个小任务试试（image / video / tts / svg）；配了的会真的调一次服务
    python3 tools/assets.py G-005        # 平时由 assets.py 照 assets.json 调用

环境变量（设在本机或云端环境里，不写进仓库）：
  AICV_IMAGE_CMD、AICV_VIDEO_CMD、AICV_TTS_CMD、AICV_SVG_CMD   四类的适配命令；没设的那类不生成，只打提示，其余照常
  AICV_IMAGE_MODEL、AICV_VIDEO_MODEL、AICV_TTS_MODEL、AICV_SVG_MODEL  可选：用这个模型，不用 assets.json 里记的
  AICV_TTS_VOICE                                   可选：用这个音色，不用 assets.json 里记的

适配命令的约定：在命令后面加两个参数 <任务.json> <输出目录> 运行，工作目录是 samples/（tools/ 的上一级）。
  任务.json：{"type": "image" | "video" | "tts" | "svg", "id": 文件名（不含扩展名）, "model", "params": {…},
             生图、生视频另有 "prompt"、"refs": [参考图或首帧的绝对路径]；语音另有 "text"、"voice"；
             生成矢量另有 "prompt"，交给语言模型写一份 SVG 代码（图标、插画、路径动画用的线稿）}
  成功：把文件写进输出目录，退出码 0，标准输出最后一行打 JSON {"file": 文件路径}；
        语音可以再带 "subtitles": 字幕 JSON 的路径，格式是
        [{"text": 一句, "t0": 秒, "t1": 秒, "words": [{"t0": 秒, "t1": 秒, "begin": 字在 text 里的起点, "end": 终点}]}]
        （没有逐字时间就省掉 words；没有字幕就不带，字幕行按字数从时长里分）
  失败：退出码非 0。
  Key 由适配命令自己从它的环境变量读，本工具不读、不打印。适配命令的输出可能有任务编号和带签名的链接，
  所以只写进 out/gen/<编号>/<文件名>.log（out/ 不进仓库）。

tools/adapters/placeholder.py 是不调任何服务的占位适配命令（纯色图、静帧视频、静音、几个圆圈的 SVG），配好它就能先把整条流程跑通。
"""
import json
import os
import shlex
import subprocess
import sys
import time
from pathlib import Path

SAMPLES = Path(__file__).resolve().parent.parent
GEN_OUT = SAMPLES / "out" / "gen"
KINDS = {  # 类型: (中文名, 环境变量前缀)
    "image": ("生图", "AICV_IMAGE"),
    "video": ("生视频", "AICV_VIDEO"),
    "tts": ("语音合成", "AICV_TTS"),
    "svg": ("生成矢量", "AICV_SVG"),
}
HELP = "配置方法见 Skill 的 materials.md「配置生成服务」一节"


def command(kind):
    return os.environ.get(KINDS[kind][1] + "_CMD", "").strip()


def missing(kind):
    """没配置时的提示；配了返回 None"""
    if command(kind):
        return None
    name, env = KINDS[kind]
    return f"没配置{name}服务（环境变量 {env}_CMD），{HELP}"


def usage(sid, file, kind, model):
    GEN_OUT.mkdir(parents=True, exist_ok=True)
    with open(GEN_OUT / "usage.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sid": sid, "file": file, "type": kind, "model": model,
                            "at": time.strftime("%Y-%m-%d %H:%M")}, ensure_ascii=False) + "\n")


def generate(kind, sid, jid, job):
    """交给适配命令生成一份素材。返回 (文件, 字幕 JSON 路径或 None)；没配置返回 None；生成失败抛 RuntimeError"""
    if missing(kind):
        return None
    _, env = KINDS[kind]
    job = {"type": kind, "id": jid, **job}
    if os.environ.get(env + "_MODEL"):
        job["model"] = os.environ[env + "_MODEL"]
    if kind == "tts" and os.environ.get("AICV_TTS_VOICE"):
        job["voice"] = os.environ["AICV_TTS_VOICE"]
    work = GEN_OUT / sid
    out = work / jid
    out.mkdir(parents=True, exist_ok=True)
    jf = work / f"{jid}.json"
    jf.write_text(json.dumps(job, ensure_ascii=False, indent=1), encoding="utf-8")
    usage(sid, jid, kind, job.get("model", ""))
    log = work / f"{jid}.log"
    with open(log, "w", encoding="utf-8") as f:
        r = subprocess.run(shlex.split(command(kind)) + [str(jf), str(out)], cwd=SAMPLES,
                           stdout=subprocess.PIPE, stderr=f, text=True)
        f.write(r.stdout)
    rel = log.relative_to(SAMPLES)
    if r.returncode:
        raise RuntimeError(f"{KINDS[kind][0]}失败，看 {rel} 的结尾")
    try:
        res = json.loads(r.stdout.strip().splitlines()[-1])
        got = Path(res["file"])
    except (IndexError, ValueError, KeyError, TypeError):
        raise RuntimeError(f"适配命令最后一行没有打出 {{\"file\": …}}，看 {rel}")
    got = got if got.is_absolute() else SAMPLES / got
    if not got.exists():
        raise RuntimeError(f"适配命令说生成了 {got.name}，但文件不存在，看 {rel}")
    subs = res.get("subtitles")
    if subs:
        subs = Path(subs) if Path(subs).is_absolute() else SAMPLES / subs
        subs = subs if subs.exists() else None
    return got, subs


TRY = {
    "image": {"model": "", "prompt": "测试：一只纸折的小船停在浅蓝色桌面上，柔和的侧光，没有文字", "params": {"aspectRatio": "16:9"}},
    "video": {"model": "", "prompt": "测试：一只纸折的小船在浅蓝色桌面上慢慢滑过，镜头静止", "params": {"aspectRatio": "16:9", "duration": 5}},
    "tts": {"model": "", "text": "这是一段测试旁白，用来确认语音合成服务已经配好。", "voice": "", "params": {}},
    "svg": {"model": "", "prompt": "测试：画一个纸船线条图标，viewBox 0 0 100 100，只用描边、不填色", "params": {}},
}


def main():
    a = sys.argv[1:]
    if not a:
        for k, (name, env) in KINDS.items():
            cmd = command(k)
            print(f"{'✓' if cmd else '–'} {name:4} {env}_CMD" + (f" = {cmd}" if cmd else "  没配置"))
        if not all(command(k) for k in KINDS):
            print(f"没配置的那类不会生成，只打提示，其余照常；{HELP}")
        return
    if a[0] != "try" or len(a) < 2 or a[1] not in KINDS:
        sys.exit(__doc__.split("\n\n")[1])
    kind = a[1]
    hint = missing(kind)
    if hint:
        print(f"– {hint}")
        return
    try:
        got, subs = generate(kind, "try", f"try-{kind}", TRY[kind])
    except RuntimeError as e:
        sys.exit(f"✗ {e}")
    print(f"✓ {KINDS[kind][0]}：{got.relative_to(SAMPLES) if got.is_relative_to(SAMPLES) else got}"
          + (f"，字幕 {subs.name}" if subs else ""))


if __name__ == "__main__":
    main()
