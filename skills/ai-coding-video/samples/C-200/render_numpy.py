#!/usr/bin/env python3
"""C-200 播客金句与频谱卡：纯 Python 无浏览器管线，NumPy 对真实音频做 FFT 频谱分析驱动动态柱状声波，Pillow 绘制播客金句卡片、逐字高亮字幕与播放进度条，直接管道输出 MP4。"""
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


def compute_fft_bands(audio_mono: np.ndarray, sr: int, n_frames: int, fps: int, n_bands: int = 36):
    """Compute real log-spaced FFT magnitude bands per video frame from the actual audio buffer."""
    win = 2048
    hann = np.hanning(win)
    freqs = np.fft.rfftfreq(win, 1.0 / sr)
    edges = np.geomspace(55.0, 7500.0, n_bands + 1)
    raw = np.zeros((n_frames, n_bands), dtype=np.float32)

    for fi in range(n_frames):
        center = int((fi / fps) * sr)
        start = max(0, center - win // 2)
        seg = audio_mono[start:start + win]
        if len(seg) < win:
            seg = np.pad(seg, (0, win - len(seg)))
        spec = np.abs(np.fft.rfft(seg * hann))
        for b in range(n_bands):
            mask = (freqs >= edges[b]) & (freqs < edges[b + 1])
            if np.any(mask):
                raw[fi, b] = float(np.sqrt(np.mean(spec[mask] ** 2)))

    # Normalize & temporal smooth for pleasing studio-meter motion
    peak = np.percentile(raw, 98) + 1e-6
    norm = np.clip(raw / peak, 0.0, 1.0)
    smooth = np.zeros_like(norm)
    smooth[0] = norm[0]
    for fi in range(1, n_frames):
        smooth[fi] = 0.55 * norm[fi] + 0.45 * smooth[fi - 1]
    return smooth


def render_ar(ar: str, dur: float = 4.0, fps: int = 30):
    portrait = ar == "9x16"
    W, H = (720, 1280) if portrait else (1280, 720)
    sc = min(W, H) / 720.0
    n_frames = int(dur * fps)

    f_badge = load_font(FONT_MONO, int(15 * sc))
    f_show = load_font(FONT_ZH, int(24 * sc))
    f_quote = load_font(FONT_ZH, int((44 if not portrait else 40) * sc))
    f_meta = load_font(FONT_MONO, int(14 * sc))

    # Synthesize real audio first so NumPy FFT visualizes the exact soundtrack
    m = synth.Mix(dur, seed=200)
    sound_mod.score(m)
    stereo = m.master()
    mono = stereo.mean(axis=1)
    n_bands = 40 if not portrait else 28
    bands = compute_fft_bands(mono, synth.SR, n_frames, fps, n_bands=n_bands)

    quote_lines = (
        ["“好工具不是替你做决定，", "而是把重复渲染变成一行代码。”"]
        if not portrait
        else ["“好工具不是替你做决定，", "而是把重复渲染", "变成一行代码。”"]
    )
    total_chars = sum(len(ln) for ln in quote_lines)

    # Precompute dark warm-indigo gradient background via NumPy
    yy = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    xx = np.linspace(0, 1, W, dtype=np.float32)[None, :]
    glow = np.exp(-((xx - 0.22) ** 2 + (yy - 0.18) ** 2) * 3.5)
    bg_r = np.clip((10 + 26 * glow + 8 * yy) , 0, 255).astype(np.uint8)
    bg_g = np.clip((14 + 34 * glow + 6 * yy) , 0, 255).astype(np.uint8)
    bg_b = np.clip((26 + 62 * glow + 14 * (1 - yy)), 0, 255).astype(np.uint8)
    bg_base = Image.fromarray(np.stack([bg_r, bg_g, bg_b], axis=-1))

    with tempfile.TemporaryDirectory(prefix=f"c200_{ar}_") as td:
        wav = Path(td) / "audio.wav"
        pcm = (np.clip(stereo, -1.0, 1.0) * 32767).astype("<i2")
        with wave.open(str(wav), "wb") as wf:
            wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(synth.SR)
            wf.writeframes(pcm.tobytes())

        out_mp4 = HERE / f"C-200-{ar}.mp4"
        proc = subprocess.Popen([
            FFMPEG, "-y",
            "-f", "rawvideo", "-vcodec", "rawvideo",
            "-s", f"{W}x{H}", "-pix_fmt", "rgb24", "-r", str(fps), "-i", "-",
            "-i", str(wav),
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20",
            "-c:a", "aac", "-b:a", "128k",
            "-shortest", "-map_metadata", "-1", "-movflags", "+faststart",
            str(out_mp4),
        ], stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        for fi in range(n_frames):
            t = fi / fps
            prog = min(1.0, t / max(dur - 0.25, 0.1))
            img = bg_base.copy()
            dr = ImageDraw.Draw(img)

            pad = int((56 if not portrait else 44) * sc)
            card_top = pad
            card_bot = H - pad
            dr.rounded_rectangle(
                (pad, card_top, W - pad, card_bot),
                radius=int(24 * sc),
                fill=(15, 22, 38),
                outline=(56, 189, 248),
                width=2,
            )

            # Podcast header: avatar circle + show name + episode pill
            hx = pad + int(36 * sc)
            hy = card_top + int(34 * sc)
            av_r = int(26 * sc)
            dr.ellipse((hx, hy, hx + av_r * 2, hy + av_r * 2), fill=(14, 165, 233))
            dr.ellipse((hx + 6, hy + 6, hx + av_r * 2 - 6, hy + av_r * 2 - 6), fill=(56, 189, 248))
            dr.text((hx + av_r * 2 + int(16 * sc), hy + int(2 * sc)), "代码造物播客 · AI 工程夜话", font=f_show, fill=(248, 250, 252))
            dr.text((hx + av_r * 2 + int(16 * sc), hy + int(32 * sc)), "EP.42  |  NUMPY REAL FFT + PILLOW", font=f_badge, fill=(103, 232, 249))

            # Highlighted word-by-word quote block
            lit_chars = int(round(prog * total_chars))
            qy = card_top + int((150 if not portrait else 230) * sc)
            line_h = int((72 if not portrait else 68) * sc)
            seen = 0
            for ln in quote_lines:
                qx = hx
                for ch in ln:
                    is_lit = seen < lit_chars
                    col = (248, 250, 252) if is_lit else (100, 116, 139)
                    if is_lit and seen >= lit_chars - 2:
                        col = (56, 189, 248)
                    dr.text((qx, qy), ch, font=f_quote, fill=col)
                    bbox = dr.textbbox((qx, qy), ch, font=f_quote)
                    qx = bbox[2] + int(1 * sc)
                    seen += 1
                qy += line_h

            # Real NumPy FFT spectrum bars
            spec_top = H - pad - int((210 if not portrait else 290) * sc)
            spec_bot = H - pad - int((92 if not portrait else 120) * sc)
            spec_h = spec_bot - spec_top
            sx0 = hx
            sx1 = W - pad - int(36 * sc)
            slot = (sx1 - sx0) / n_bands
            bw = max(4, int(slot * 0.62))
            vals = bands[fi]
            for b in range(n_bands):
                bh = max(int(8 * sc), int(vals[b] * spec_h))
                bx = int(sx0 + b * slot)
                u = b / max(1, n_bands - 1)
                col = (
                    int(56 + (232 - 56) * u),
                    int(189 + (121 - 189) * u),
                    int(248 + (249 - 248) * u),
                )
                dr.rounded_rectangle(
                    (bx, spec_bot - bh, bx + bw, spec_bot),
                    radius=max(2, bw // 2),
                    fill=col,
                )

            # Audio playback progress bar & timestamps
            py = H - pad - int((48 if not portrait else 62) * sc)
            dr.rounded_rectangle((sx0, py, sx1, py + int(8 * sc)), radius=4, fill=(30, 41, 59))
            dr.rounded_rectangle((sx0, py, sx0 + int((sx1 - sx0) * (t / dur)), py + int(8 * sc)), radius=4, fill=(56, 189, 248))
            dr.text((sx0, py + int(14 * sc)), f"00:0{int(t)}.{int((t % 1)*10)}", font=f_meta, fill=(148, 163, 184))
            dr.text((sx1 - int(66 * sc), py + int(14 * sc)), "00:04.0", font=f_meta, fill=(148, 163, 184))

            proc.stdin.write(img.tobytes())

        proc.stdin.close()
        proc.wait()
        if proc.returncode != 0:
            raise RuntimeError("ffmpeg failed for C-200")

        out_jpg = HERE / f"C-200-{ar}.jpg"
        subprocess.run([
            FFMPEG, "-y", "-ss", "2.35", "-i", str(out_mp4),
            "-frames:v", "1", "-q:v", "3", "-map_metadata", "-1",
            str(out_jpg),
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"OK C-200 {ar}: {out_mp4.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    render_ar("16x9")
    render_ar("9x16")
