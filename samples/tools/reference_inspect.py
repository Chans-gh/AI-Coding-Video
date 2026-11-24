"""Collect time-coded visual and audio evidence from a reference clip."""
import hashlib
import io
import json
import math
import shutil
import subprocess
import tempfile
from fractions import Fraction
from pathlib import Path

from reference_data import atomic_write, json_text, require

INSPECTION_LIMIT = 45


def ffmpeg(*args, capture=True):
    return subprocess.run(
        ["ffmpeg", "-nostdin", "-v", "error", *map(str, args)],
        check=True, stdout=subprocess.PIPE if capture else None,
    ).stdout


def probe(path):
    result = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path),
    ])
    return json.loads(result)


def spec(path):
    media = probe(path)
    video = next((v for v in media["streams"] if v["codec_type"] == "video"
                  and not v.get("disposition", {}).get("attached_pic")), None)
    require(video is not None, "参考片缺少画面")
    rate = next((Fraction(value) for value in (video.get("avg_frame_rate"), video.get("r_frame_rate"))
                 if value not in (None, "", "0/0", "0")), 0)
    require(rate > 0, "读不到视频帧率")
    duration = float(video.get("duration") or media["format"]["duration"])
    require(math.isfinite(duration) and duration > 0, "读不到视频时长")
    rotation = next((d.get("rotation", 0) for d in video.get("side_data_list", [])
                     if "rotation" in d), 0)
    dims = (video["width"], video["height"])
    width, height = dims[::-1] if abs(rotation) % 180 == 90 else dims
    return {"duration_ms": round(duration * 1000), "width": width, "height": height,
            "fps": str(rate), "audio": any(s["codec_type"] == "audio" for s in media["streams"])}


def frame_stats(path, duration, fps=30):
    import numpy as np

    raw = ffmpeg("-t", f"{duration:.6f}", "-i", path, "-map", "0:V:0", "-an",
                 "-vf", f"fps={fps},scale=32:18,format=gray", "-threads", 1, "-f", "rawvideo", "-")
    frames = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 576).astype(np.float32)
    require(len(frames) > 0, "参考片中没有可分析的画面")
    luma = frames.mean(axis=1)
    change = np.abs(np.diff(frames, axis=0)).mean(axis=1)
    flashes = np.flatnonzero((luma[1:] >= 72) & (np.diff(luma) >= 30)) + 1
    cuts = np.flatnonzero(change > 32) + 1

    def times(indices):
        return [round(i * 1000 / fps) for i in indices]

    return times(flashes), times(cuts)


def thumbnail(path, at_ms, max_width=320):
    return ffmpeg("-ss", f"{at_ms / 1000:.3f}", "-i", path, "-map", "0:V:0", "-frames:v", 1,
                  "-vf", f"scale={max_width}:-2", "-threads", 1, "-c:v", "mjpeg", "-f", "image2pipe", "-")


def contact_sheet(path, times, dest):
    from PIL import Image, ImageDraw

    cols, w, h, header = 4, 240, 138, 18
    sheet = Image.new("RGB", (cols * w, math.ceil(len(times) / cols) * (h + header)), "#16141b")
    draw = ImageDraw.Draw(sheet)
    for i, at_ms in enumerate(times):
        data = thumbnail(path, at_ms)
        if not data:
            continue
        with Image.open(io.BytesIO(data)) as frame:
            frame.thumbnail((w, h))
            x, y = (i % cols) * w, (i // cols) * (h + header)
            sheet.paste(frame, (x + (w - frame.width) // 2, y))
            draw.text((x + 5, y + h), f"{at_ms / 1000:.3f}s", fill="#f5efe6")
    sheet.save(dest, quality=87)


def inspect(path, dest):
    path, dest = Path(path).resolve(), Path(dest)
    require(path.is_file(), f"找不到参考片 {path}")
    require(shutil.which("ffmpeg") and shutil.which("ffprobe"), "请安装 FFmpeg 和 FFprobe")
    meta = spec(path)
    limit = min(meta["duration_ms"], INSPECTION_LIMIT * 1000)
    flashes, cuts = frame_stats(path, limit / 1000)
    last = max(0, limit - math.ceil(1000 / float(Fraction(meta["fps"]))))
    step = max(500, limit // 28)
    times = sorted({min(last, t) for t in range(0, limit, step)} | {last} | {
        max(0, min(last, t + shift)) for t in flashes[:4] for shift in (-100, 0, 200)
    })
    checksum = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1 << 20), b""):
            checksum.update(chunk)
    evidence = {**meta, "name": path.name, "sha256": checksum.hexdigest(), "inspected_ms": limit,
                "flash_times_ms": flashes, "cut_candidates_ms": cuts, "frame_times_ms": times}
    require(not dest.exists(), f"抽帧目录已存在：{dest}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".reference-evidence-", dir=dest.parent) as root:
        out = Path(root) / "evidence"
        out.mkdir()
        contact_sheet(path, times, out / "frames.jpg")
        if meta["audio"]:
            ffmpeg("-i", path, "-t", f"{limit / 1000:.3f}", "-map", "0:a:0", "-ac", 1, "-ar", 16000,
                   str(out / "audio.wav"), capture=False)
        atomic_write(out / "evidence.json", json_text(evidence), new=True)
        out.rename(dest)
    return evidence
