"""占位适配命令：不调任何服务，按任务出一份占位素材，用来先把 tools/gen.py → assets.py → 出片的整条流程跑通。

    export AICV_IMAGE_CMD="python3 tools/adapters/placeholder.py"     # 三类都可以用它
    python3 tools/gen.py try image

生图：按 params.aspectRatio 出一张渐变色图（长边 1280）；生视频：参考图（没有就是渐变图）缓慢推近，长度取 params.duration（默认 5 秒）；
语音合成：每个字一声轻哼、标点处停顿（见 hum），字幕一句一行、带逐字时间；生成矢量：两个同心圆。写自己的适配命令时照这个文件的输入输出来，约定见 tools/gen.py 开头。
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


def hum(job, path, sr=24000):
    """语音合成的占位：每个字一声 0.2 秒的轻哼，逗号停 0.25 秒、句号停 0.5 秒，字幕一句一行、带逐字时间。
    有声、有停顿、有逐字时间，配音工具的切句和切点检查能照真的跑"""
    import numpy as np
    from scipy.io import wavfile
    speed = float(job.get("params", {}).get("speed") or 1)
    text = job["text"]
    parts = [s for s in re.findall(r"[^。！？.!?]+[。！？.!?]?", text) if s.strip()]
    one, buf, subs, t, pos = .2 / speed, [np.zeros(int(.3 * sr))], [], .3, 0
    for s in parts:
        line, words = {"text": s, "t0": round(t, 3)}, []
        for k, ch in enumerate(s):
            if re.match(r"[\s，、；：,;:]", ch):
                buf.append(np.zeros(int(.25 * sr))); t += .25
            elif re.match(r"[。！？.!?…“”\"'（）()]", ch):
                continue
            else:
                n = int(one * sr)
                f = 180 + (hashlib.sha1(ch.encode()).digest()[0] % 60)
                x = np.sin(2 * np.pi * f * np.arange(n) / sr) * np.hanning(n) * .3
                buf.append(x); words.append({"t0": round(t, 3), "t1": round(t + one, 3), "begin": k, "end": k + 1})
                buf.append(np.zeros(int(.03 * sr))); t += one + .03
        line["t1"], line["words"] = round(t, 3), words
        subs.append(line)
        buf.append(np.zeros(int(.5 * sr))); t += .5
    wavfile.write(path, sr, (np.concatenate(buf) * 32767).astype(np.int16))
    return path, subs


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
        dest, subs = hum(job, out / f"{jid}.wav")
        sj = out / f"{jid}.subs.json"
        sj.write_text(json.dumps(subs, ensure_ascii=False, indent=1), encoding="utf-8")
        print(json.dumps({"file": str(dest), "subtitles": str(sj)}))
    elif kind == "svg":
        dest = out / f"{jid}.svg"
        dest.write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" fill="none" '
                        'stroke="#333" stroke-width="4"><circle cx="50" cy="50" r="40"/><circle cx="50" cy="50" r="20"/></svg>\n', encoding="utf-8")
        print(json.dumps({"file": str(dest)}))
    else:
        sys.exit(f"不认识的任务类型：{kind}")


if __name__ == "__main__":
    main()
