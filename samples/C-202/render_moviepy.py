#!/usr/bin/env python3
"""C-202 MoviePy 卡点字卡片头：Pillow 绘制四张高对比卡点字卡，MoviePy v2 编排多镜头缩放脉冲、转场与音频时间轴直接导出 MP4。"""
import math
import subprocess
import sys
import tempfile
import wave
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy import AudioFileClip, VideoClip, concatenate_videoclips

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


def make_card_clip(W: int, H: int, dur: float, spec: dict, idx: int, total: int):
    sc = min(W, H) / 720.0
    portrait = H > W
    f_tag = load_font(FONT_MONO, int(18 * sc))
    f_big = load_font(FONT_ZH, int((84 if not portrait else 74) * sc))
    f_sub = load_font(FONT_ZH, int((26 if not portrait else 24) * sc))
    f_foot = load_font(FONT_MONO, int(15 * sc))

    bg_col = spec["bg"]
    acc_col = spec["accent"]
    headline = spec["headline"]
    sub = spec["sub"]
    tag = spec["tag"]

    def make_frame(t):
        u = max(0.0, min(1.0, t / max(dur, 1e-4)))
        ease = 1.0 - (1.0 - min(1.0, u / 0.35)) ** 3
        zoom = 1.0 + 0.06 * u

        img = Image.new("RGB", (W, H), bg_col)
        dr = ImageDraw.Draw(img)

        # Geometric diagonal accent bars
        bar_w = int(W * 0.28 * zoom)
        dr.polygon([
            (W - bar_w, 0), (W, 0), (W, H), (W - int(bar_w * 0.55), H)
        ], fill=acc_col)

        # Subtle dot matrix
        step = int(42 * sc)
        for gx in range(step, int(W * 0.72), step):
            for gy in range(step, H, step):
                dr.ellipse((gx - 1, gy - 1, gx + 1, gy + 1), fill=(255, 255, 255))

        # Re-tint dots softly by blending with bg
        base = Image.new("RGB", (W, H), bg_col)
        img = Image.blend(base, img, 0.22)
        dr = ImageDraw.Draw(img)

        # Crisp accent stripe on left
        pad = int((68 if not portrait else 52) * sc)
        stripe_h = int((260 if not portrait else 320) * sc * ease)
        cy = int(H * 0.48)
        dr.rounded_rectangle(
            (pad, cy - stripe_h // 2, pad + int(10 * sc), cy + stripe_h // 2),
            radius=int(5 * sc),
            fill=acc_col,
        )

        # Tag pill
        tx = pad + int(34 * sc)
        ty_tag = cy - int((115 if not portrait else 135) * sc) + int((1.0 - ease) * 28 * sc)
        dr.rounded_rectangle(
            (tx, ty_tag, tx + int(280 * sc), ty_tag + int(38 * sc)),
            radius=int(8 * sc),
            fill=acc_col,
        )
        dr.text((tx + int(14 * sc), ty_tag + int(8 * sc)), tag, font=f_tag, fill=(10, 14, 24))

        # Big headline
        ty_big = cy - int((58 if not portrait else 68) * sc) + int((1.0 - ease) * 40 * sc)
        dr.text((tx, ty_big), headline, font=f_big, fill=(248, 250, 252))

        # Subtitle
        ty_sub = cy + int((58 if not portrait else 52) * sc) + int((1.0 - ease) * 22 * sc)
        dr.text((tx, ty_sub), sub, font=f_sub, fill=(203, 213, 225))

        # Bottom timeline progress bar
        by = H - int(58 * sc)
        bw = W - pad * 2
        dr.rounded_rectangle((pad, by, pad + bw, by + int(8 * sc)), radius=4, fill=(30, 41, 59))
        overall = (idx + u) / total
        dr.rounded_rectangle((pad, by, pad + int(bw * overall), by + int(8 * sc)), radius=4, fill=acc_col)
        dr.text((pad, by - int(26 * sc)), f"MOVIEPY v2 TIMELINE · CLIP {idx + 1}/{total} · t={idx + t:.2f}s", font=f_foot, fill=(148, 163, 184))

        return np.array(img)

    return VideoClip(make_frame, duration=dur)


def render_ar(ar: str, dur: float = 4.0, fps: int = 30):
    portrait = ar == "9x16"
    W, H = (720, 1280) if portrait else (1280, 720)

    cards = [
        {"tag": "01 · PYTHON CODE", "headline": "写代码做视频", "sub": "MoviePy + Pillow + NumPy 纯代码管线", "bg": (10, 15, 30), "accent": (56, 189, 248)},
        {"tag": "02 · ZERO BROWSER", "headline": "零浏览器依赖", "sub": "服务器 / Docker 容器直接批量渲染", "bg": (18, 12, 34), "accent": (192, 132, 252)},
        {"tag": "03 · BEAT SYNCED", "headline": "节拍精准卡点", "sub": "按时间轴自动切镜、缩放入场与转场", "bg": (10, 24, 24), "accent": (52, 211, 153)},
        {"tag": "04 · SHIP MP4", "headline": "一键自动化出片", "sub": "横竖屏同源脚本 · 确定性可复现", "bg": (24, 15, 14), "accent": (251, 191, 36)},
    ]

    with tempfile.TemporaryDirectory(prefix=f"c202_{ar}_") as td:
        m = synth.Mix(dur, seed=202)
        sound_mod.score(m)
        wav = Path(td) / "audio.wav"
        pcm = (np.clip(m.master(), -1.0, 1.0) * 32767).astype("<i2")
        with wave.open(str(wav), "wb") as wf:
            wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(synth.SR)
            wf.writeframes(pcm.tobytes())

        clips = [make_card_clip(W, H, 1.0, spec, i, len(cards)) for i, spec in enumerate(cards)]
        final = concatenate_videoclips(clips, method="compose")
        audio = AudioFileClip(str(wav))
        final = final.with_audio(audio)

        raw_mp4 = Path(td) / "moviepy_raw.mp4"
        final.write_videofile(
            str(raw_mp4),
            fps=fps,
            codec="libx264",
            audio_codec="aac",
            temp_audiofile=str(Path(td) / "temp_audio.m4a"),
            bitrate="1800k",
            logger=None,
        )
        final.close()
        audio.close()

        # Strip metadata cleanly via ffmpeg
        out_mp4 = HERE / f"C-202-{ar}.mp4"
        subprocess.run([
            FFMPEG, "-y", "-i", str(raw_mp4),
            "-c", "copy", "-map_metadata", "-1", "-movflags", "+faststart",
            str(out_mp4),
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        out_jpg = HERE / f"C-202-{ar}.jpg"
        subprocess.run([
            FFMPEG, "-y", "-ss", "2.45", "-i", str(out_mp4),
            "-frames:v", "1", "-q:v", "3", "-map_metadata", "-1",
            str(out_jpg),
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"OK C-202 {ar}: {out_mp4.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    render_ar("16x9")
    render_ar("9x16")
