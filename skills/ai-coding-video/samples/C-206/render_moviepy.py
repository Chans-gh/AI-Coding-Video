#!/usr/bin/env python3
"""C-206 电商卖点与价签参数卡：Pillow 按品牌规范绘制新品卖点卡、新旧款参数对比表与划线价爆炸贴，MoviePy v2 编排三段带货快切与音频时间轴，零浏览器批量出片。"""
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


def ease_out(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 1.0 - (1.0 - x) ** 3


def scene_selling_points(W, H, dur):
    sc = min(W, H) / 720.0
    portrait = H > W
    f_badge = load_font(FONT_MONO, int(16 * sc))
    f_h1 = load_font(FONT_ZH, int((54 if not portrait else 48) * sc))
    f_card = load_font(FONT_ZH, int(24 * sc))
    f_val = load_font(FONT_MONO, int(34 * sc))
    pad = int((56 if not portrait else 44) * sc)

    items = [
        ("超长续航", "48H", (249, 115, 22)),
        ("旗舰降噪", "-52dB", (56, 189, 248)),
        ("极速闪充", "10min", (52, 211, 153)),
    ]

    def make_frame(t):
        img = Image.new("RGB", (W, H), (16, 14, 24))
        dr = ImageDraw.Draw(img)
        dr.rounded_rectangle((pad, pad, pad + int(250 * sc), pad + int(36 * sc)), radius=8, fill=(249, 115, 22))
        dr.text((pad + int(14 * sc), pad + int(8 * sc)), "NEW ARRIVAL · SKU #A9", font=f_badge, fill=(15, 12, 20))
        dr.text((pad, pad + int(58 * sc)), "声学旗舰耳机 Pro 2", font=f_h1, fill=(248, 250, 252))

        top_y = pad + int((175 if not portrait else 220) * sc)
        for i, (lbl, val, col) in enumerate(items):
            ap = ease_out((t - (0.12 + i * 0.22)) / 0.42)
            if portrait:
                cw, ch = W - pad * 2, int(148 * sc)
                cx, cy = pad, top_y + i * (ch + int(22 * sc)) + int((1 - ap) * 40 * sc)
            else:
                gap = int(24 * sc)
                cw = (W - pad * 2 - gap * 2) // 3
                ch = int(250 * sc)
                cx, cy = pad + i * (cw + gap), top_y + int((1 - ap) * 50 * sc)
            dr.rounded_rectangle((cx, cy, cx + cw, cy + ch), radius=int(20 * sc), fill=(26, 24, 38), outline=col, width=2)
            dr.text((cx + int(26 * sc), cy + int(32 * sc)), val, font=f_val, fill=col)
            dr.text((cx + int(26 * sc), cy + int((96 if portrait else 120) * sc)), lbl, font=f_card, fill=(248, 250, 252))
        return np.array(img)

    return VideoClip(make_frame, duration=dur)


def scene_spec_table(W, H, dur):
    sc = min(W, H) / 720.0
    portrait = H > W
    f_h1 = load_font(FONT_ZH, int((40 if not portrait else 36) * sc))
    f_row = load_font(FONT_ZH, int((22 if not portrait else 20) * sc))
    f_mono = load_font(FONT_MONO, int(16 * sc))
    pad = int((56 if not portrait else 44) * sc)

    rows = [
        ("主动降噪深度", "-38 dB", "-52 dB  ▲"),
        ("综合续航时长", "28 小时", "48 小时  ▲"),
        ("蓝牙音频协议", "AAC", "LDAC 无损 ▲"),
        ("单耳机身重量", "5.8 g", "4.6 g  ▼"),
    ]

    def make_frame(t):
        img = Image.new("RGB", (W, H), (12, 16, 28))
        dr = ImageDraw.Draw(img)
        dr.text((pad, pad), "SPEC COMPARISON · 实测参数对照", font=f_mono, fill=(56, 189, 248))
        dr.text((pad, pad + int(32 * sc)), "旧款标准版  VS  Pro 2 新款", font=f_h1, fill=(248, 250, 252))

        ty = pad + int((125 if not portrait else 160) * sc)
        rh = int((86 if not portrait else 112) * sc)
        bw = W - pad * 2
        for i, (k, old_v, new_v) in enumerate(rows):
            ap = ease_out((t - (0.08 + i * 0.18)) / 0.35)
            y = ty + i * (rh + int(16 * sc)) + int((1 - ap) * 30 * sc)
            dr.rounded_rectangle((pad, y, pad + bw, y + rh), radius=int(14 * sc), fill=(22, 30, 48), outline=(51, 65, 85), width=2)
            dr.text((pad + int(24 * sc), y + int(rh * 0.34)), k, font=f_row, fill=(203, 213, 225))
            dr.text((pad + int(bw * 0.46), y + int(rh * 0.34)), old_v, font=f_row, fill=(148, 163, 184))
            dr.text((pad + int(bw * 0.68), y + int(rh * 0.34)), new_v, font=f_row, fill=(52, 211, 153))
        return np.array(img)

    return VideoClip(make_frame, duration=dur)


def scene_price_drop(W, H, dur):
    sc = min(W, H) / 720.0
    portrait = H > W
    f_tag = load_font(FONT_ZH, int(24 * sc))
    f_old = load_font(FONT_ZH, int(30 * sc))
    f_big = load_font(FONT_MONO, int((112 if not portrait else 96) * sc))
    f_cta = load_font(FONT_ZH, int(30 * sc))
    pad = int((56 if not portrait else 44) * sc)

    def make_frame(t):
        ap = ease_out(t / 0.42)
        img = Image.new("RGB", (W, H), (24, 12, 16))
        dr = ImageDraw.Draw(img)

        # Bold promo card centered
        cw = W - pad * 2
        ch = int((460 if not portrait else 620) * sc)
        cx, cy = pad, (H - ch) // 2 + int((1 - ap) * 40 * sc)
        dr.rounded_rectangle((cx, cy, cx + cw, cy + ch), radius=int(28 * sc), fill=(36, 16, 22), outline=(249, 115, 22), width=3)

        dr.text((cx + int(44 * sc), cy + int(42 * sc)), "限时首发直降 · 官方现货（虚构示例）", font=f_tag, fill=(253, 186, 116))

        # Strikethrough original price
        old_y = cy + int(105 * sc)
        dr.text((cx + int(44 * sc), old_y), "日常价 ¥2,999", font=f_old, fill=(148, 163, 184))
        dr.line((cx + int(40 * sc), old_y + int(22 * sc), cx + int(310 * sc), old_y + int(22 * sc)), fill=(244, 63, 94), width=4)

        # Explosive promo price
        dr.text((cx + int(44 * sc), cy + int((168 if not portrait else 190) * sc)), "¥1,899", font=f_big, fill=(251, 191, 36))

        # CTA button
        btn_y = cy + ch - int(110 * sc)
        dr.rounded_rectangle((cx + int(44 * sc), btn_y, cx + cw - int(44 * sc), btn_y + int(70 * sc)), radius=int(18 * sc), fill=(249, 115, 22))
        dr.text((cx + int(76 * sc), btn_y + int(18 * sc)), "限时立省 ¥1,100 · 立即抢购 →", font=f_cta, fill=(15, 12, 20))
        return np.array(img)

    return VideoClip(make_frame, duration=dur)


def render_ar(ar: str, dur: float = 4.5, fps: int = 30):
    portrait = ar == "9x16"
    W, H = (720, 1280) if portrait else (1280, 720)

    with tempfile.TemporaryDirectory(prefix=f"c206_{ar}_") as td:
        m = synth.Mix(dur, seed=206)
        sound_mod.score(m)
        wav = Path(td) / "audio.wav"
        pcm = (np.clip(m.master(), -1.0, 1.0) * 32767).astype("<i2")
        with wave.open(str(wav), "wb") as wf:
            wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(synth.SR)
            wf.writeframes(pcm.tobytes())

        clips = [
            scene_selling_points(W, H, 1.5),
            scene_spec_table(W, H, 1.5),
            scene_price_drop(W, H, 1.5),
        ]
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

        out_mp4 = HERE / f"C-206-{ar}.mp4"
        subprocess.run([
            FFMPEG, "-y", "-i", str(raw_mp4),
            "-c", "copy", "-map_metadata", "-1", "-movflags", "+faststart",
            str(out_mp4),
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        out_jpg = HERE / f"C-206-{ar}.jpg"
        subprocess.run([
            FFMPEG, "-y", "-ss", "3.6", "-i", str(out_mp4),
            "-frames:v", "1", "-q:v", "3", "-map_metadata", "-1",
            str(out_jpg),
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"OK C-206 {ar}: {out_mp4.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    render_ar("16x9")
    render_ar("9x16")
