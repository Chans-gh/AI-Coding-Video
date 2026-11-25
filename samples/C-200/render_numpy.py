#!/usr/bin/env python3
"""C-200 NumPy 干涉像素场：纯 Python 无浏览器管线，NumPy 向量化逐帧算三波源光学干涉像素矩阵，Pillow 叠加中文标题、波源准星与实时截面波形，直接管道输出 MP4。"""
import math
import subprocess
import sys
import tempfile
import wave
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
SAMPLES = HERE.parent
sys.path.insert(0, str(SAMPLES / "lib"))
import synth
import sound as sound_mod

FFMPEG = str(Path.home() / ".local/bin/ffmpeg")
FONT_ZH = "/System/Library/Fonts/STHeiti Medium.ttc"
FONT_MONO = "/System/Library/Fonts/Menlo.ttc"


def load_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def render_ar(ar: str, dur: float = 4.0, fps: int = 30):
    portrait = ar == "9x16"
    W, H = (720, 1280) if portrait else (1280, 720)
    sc = min(W, H) / 720.0
    n_frames = int(dur * fps)

    # Precompute normalized coordinate grid for fast vectorized NumPy wave math
    aspect = W / H
    xs = np.linspace(-aspect, aspect, W, dtype=np.float32)
    ys = np.linspace(-1.0, 1.0, H, dtype=np.float32)
    X, Y = np.meshgrid(xs, ys)

    f_title = load_font(FONT_ZH, int(34 * sc))
    f_sub = load_font(FONT_MONO, int(15 * sc))
    f_tag = load_font(FONT_MONO, int(13 * sc))

    with tempfile.TemporaryDirectory(prefix=f"c200_{ar}_") as td:
        # Synthesize C-class electronic audio
        m = synth.Mix(dur, seed=200)
        sound_mod.score(m)
        wav = Path(td) / "audio.wav"
        pcm = (np.clip(m.master(), -1.0, 1.0) * 32767).astype("<i2")
        with wave.open(str(wav), "wb") as wf:
            wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(synth.SR)
            wf.writeframes(pcm.tobytes())

        out_mp4 = HERE / f"C-200-{ar}.mp4"
        proc = subprocess.Popen([
            FFMPEG, "-y",
            "-f", "rawvideo", "-vcodec", "rawvideo",
            "-s", f"{W}x{H}", "-pix_fmt", "rgb24", "-r", str(fps), "-i", "-",
            "-i", str(wav),
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "21",
            "-c:a", "aac", "-b:a", "128k",
            "-shortest", "-map_metadata", "-1", "-movflags", "+faststart",
            str(out_mp4),
        ], stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        for fi in range(n_frames):
            t = fi / fps
            # 3 orbiting coherent wave sources
            s1 = (0.55 * math.cos(t * 1.1), 0.36 * math.sin(t * 1.4))
            s2 = (-0.52 * math.cos(t * 0.9 + 1.2), 0.42 * math.cos(t * 1.2))
            s3 = (0.28 * math.sin(t * 1.6), -0.44 * math.sin(t * 0.8 + 0.7))

            d1 = np.sqrt((X - s1[0]) ** 2 + (Y - s1[1]) ** 2)
            d2 = np.sqrt((X - s2[0]) ** 2 + (Y - s2[1]) ** 2)
            d3 = np.sqrt((X - s3[0]) ** 2 + (Y - s3[1]) ** 2)

            k = 18.0 + 3.5 * math.sin(t * 1.2)
            w = (
                np.sin(d1 * k - t * 6.5) / (1.0 + d1 * 1.2)
                + np.sin(d2 * (k * 1.12) - t * 5.8) / (1.0 + d2 * 1.2)
                + np.sin(d3 * (k * 0.88) - t * 7.2) / (1.0 + d3 * 1.2)
            )
            val = 0.5 + 0.5 * np.tanh(w * 0.85)

            # Rich cosine palette (deep indigo -> cyan -> magenta -> gold)
            r = np.clip((0.12 + 0.72 * np.power(val, 1.5) + 0.25 * np.sin(val * 5.2 + 0.4)) * 255, 0, 255).astype(np.uint8)
            g = np.clip((0.10 + 0.68 * np.sin(val * 3.14) + 0.18 * np.cos(val * 6.0)) * 255, 0, 255).astype(np.uint8)
            b = np.clip((0.24 + 0.74 * np.power(1.0 - np.abs(val - 0.55), 1.3)) * 255, 0, 255).astype(np.uint8)
            rgb = np.stack([r, g, b], axis=-1)

            # Pillow overlay: translucent HUD cards, source reticles, live cross-section wave
            img = Image.fromarray(rgb, mode="RGB").convert("RGBA")
            ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            dr = ImageDraw.Draw(ov)

            # Draw 3 source reticles
            for idx, (sx, sy) in enumerate((s1, s2, s3), 1):
                px = int((sx / aspect * 0.5 + 0.5) * W)
                py = int((sy * 0.5 + 0.5) * H)
                rr = int(14 * sc)
                dr.ellipse((px - rr, py - rr, px + rr, py + rr), outline=(103, 232, 249, 220), width=max(2, int(2 * sc)))
                dr.ellipse((px - 3, py - 3, px + 3, py + 3), fill=(250, 204, 21, 255))
                dr.text((px + rr + 6, py - 8), f"S{idx}", font=f_tag, fill=(226, 232, 240, 220))

            pad = int(34 * sc)
            # Top-left title panel
            pw, ph = int((470 if not portrait else W - pad * 2) * sc if not portrait else W - pad * 2), int(92 * sc)
            dr.rounded_rectangle((pad, pad, pad + pw, pad + ph), radius=int(12 * sc), fill=(8, 12, 24, 195), outline=(56, 189, 248, 130), width=2)
            dr.text((pad + int(18 * sc), pad + int(12 * sc)), "NumPy 干涉像素场", font=f_title, fill=(248, 250, 252, 255))
            dr.text((pad + int(18 * sc), pad + int(58 * sc)), f"NumPy {W}×{H} RGB  |  k={k:.1f}  |  t={t:.2f}s", font=f_sub, fill=(103, 232, 249, 230))

            # Bottom cross-section waveform bar
            bh = int(84 * sc)
            by = H - pad - bh
            dr.rounded_rectangle((pad, by, W - pad, H - pad), radius=int(12 * sc), fill=(8, 12, 24, 195), outline=(232, 121, 249, 120), width=2)
            dr.text((pad + int(16 * sc), by + int(10 * sc)), "CENTERLINE AMPLITUDE SLICE (Pillow + NumPy)", font=f_tag, fill=(148, 163, 184, 230))
            mid_row = w[H // 2, ::max(1, W // 140)]
            pts = []
            x0, x1 = pad + int(16 * sc), W - pad - int(16 * sc)
            cy = by + int(52 * sc)
            for j, mv in enumerate(mid_row):
                u = j / max(1, len(mid_row) - 1)
                pts.append((x0 + u * (x1 - x0), cy - float(np.tanh(mv * 0.7)) * 22 * sc))
            if len(pts) > 1:
                dr.line(pts, fill=(56, 189, 248, 245), width=max(2, int(2.5 * sc)))

            out_rgb = Image.alpha_composite(img, ov).convert("RGB")
            proc.stdin.write(out_rgb.tobytes())

        proc.stdin.close()
        proc.wait()
        if proc.returncode != 0:
            raise RuntimeError("ffmpeg failed for C-200")

        out_jpg = HERE / f"C-200-{ar}.jpg"
        subprocess.run([
            FFMPEG, "-y", "-ss", "2.1", "-i", str(out_mp4),
            "-frames:v", "1", "-q:v", "3", "-map_metadata", "-1",
            str(out_jpg),
        ], check=True)
        print(f"OK C-200 {ar}: {out_mp4.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    render_ar("16x9")
    render_ar("9x16")
