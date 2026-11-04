"""占位适配命令：不调任何服务，按任务出一份占位素材，用来先把 tools/gen.py → assets.py → 出片的整条流程跑通。

    export AICV_IMAGE_CMD="python3 tools/adapters/placeholder.py"     # 三类都可以用它
    python3 tools/gen.py try image

生图：按 params.aspectRatio 出一张渐变色图（长边 1280）；生视频：参考图（没有就是渐变图）缓慢推近，长度取 params.duration（默认 5 秒）；
语音合成：静音，时长按字数估（每字 0.22 秒），字幕按句子、按字数分时间。写自己的适配命令时照这个文件的输入输出来，约定见 tools/gen.py 开头。
"""
import hashlib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image


def ffmpeg():
    exe = shutil.which("ffmpeg")
    if not exe:
        try:
            import imageio_ffmpeg
            exe = imageio_ffmpeg.get_ffmpeg_exe()
        except ImportError:
            sys.exit("缺 ffmpeg")
    return exe


def size(params, long=1280):
    w, h = (int(x) for x in str(params.get("aspectRatio", "16:9")).split(":"))
    return (long, round(long * h / w / 2) * 2) if w >= h else (round(long * w / h / 2) * 2, long)


def gradient(job, path):
    w, h = size(job.get("params", {}))
    seed = hashlib.sha1((job.get("prompt") or job["id"]).encode()).digest()
    a, b = seed[:3], seed[3:6]
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        for x in range(w):
            k = (x / w + y / h) / 2
            px[x, y] = tuple(int(a[i] * (1 - k) + b[i] * k) for i in range(3))
    img.save(path, quality=90)
    return path


def main():
    job = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    kind, jid, p = job["type"], job["id"], job.get("params", {})
    if kind == "image":
        print(json.dumps({"file": str(gradient(job, out / f"{jid}.jpg"))}))
    elif kind == "video":
        src = Path(job["refs"][0]) if job.get("refs") else gradient(job, out / f"{jid}.ref.jpg")
        w, h = size(p, 1280)
        dur = float(p.get("duration", 5))
        dest = out / f"{jid}.mp4"
        subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-loop", "1", "-i", str(src), "-t", str(dur),
                        "-vf", f"scale={w * 2}:{h * 2},zoompan=z='1+0.08*on/({dur}*24)':d=1:s={w}x{h}:fps=24,format=yuv420p",
                        "-c:v", "libx264", str(dest)], check=True)
        print(json.dumps({"file": str(dest)}))
    elif kind == "tts":
        text = job["text"]
        parts = [s for s in re.findall(r"[^。！？.!?]+[。！？.!?]?", text) if s.strip()]
        dur = round(max(1.0, len(re.sub(r"\s", "", text)) * 0.22), 3)
        dest = out / f"{jid}.mp3"
        subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=32000:cl=mono",
                        "-t", str(dur), "-c:a", "libmp3lame", "-q:a", "6", str(dest)], check=True)
        subs, t, total = [], 0.0, sum(len(s) for s in parts) or 1
        for s in parts:
            d = dur * len(s) / total
            subs.append({"text": s, "t0": round(t, 3), "t1": round(t + d, 3)})
            t += d
        sj = out / f"{jid}.subs.json"
        sj.write_text(json.dumps(subs, ensure_ascii=False, indent=1), encoding="utf-8")
        print(json.dumps({"file": str(dest), "subtitles": str(sj)}))
    else:
        sys.exit(f"不认识的任务类型：{kind}")


if __name__ == "__main__":
    main()
