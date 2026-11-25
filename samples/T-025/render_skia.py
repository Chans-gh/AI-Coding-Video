#!/usr/bin/env python3
"""T-025 曲线变速卡点混剪：基于 NASA 国际空间站 720p 地球轨道实拍，NumPy 积分非线性速度曲线（0.35x 慢放 → 4.2x 极速冲刺 → 急停）并做多帧加权运动模糊与踩拍微缩放，Skia 实时叠加 Speed Ramp 速度曲线 HUD。"""
import math
import subprocess
import sys
import tempfile
import wave
from pathlib import Path
import numpy as np
import skia

HERE = Path(__file__).resolve().parent
SAMPLES = HERE.parent
sys.path.insert(0, str(SAMPLES / "lib"))
import synth
import sound as sound_mod

FFMPEG = str(Path.home() / ".local/bin/ffmpeg")


def load_tf(paths, fallback="Helvetica"):
    for p in paths:
        if Path(p).exists():
            tf = skia.Typeface.MakeFromFile(p)
            if tf is not None:
                return tf
    return skia.Typeface(fallback)


def decode_all_frames(path: Path, w: int, h: int):
    cmd = [
        FFMPEG, "-i", str(path),
        "-vf", f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}",
        "-f", "rawvideo", "-pix_fmt", "rgba", "-"
    ]
    raw = subprocess.check_output(cmd, stderr=subprocess.DEVNULL)
    arr = np.frombuffer(raw, dtype=np.uint8)
    n = len(arr) // (w * h * 4)
    return arr[:n * w * h * 4].reshape((n, h, w, 4))


def speed_at(t: float) -> float:
    """Smooth speed-ramp curve with three dramatic beat-synced surges (0.35x -> 4.2x -> 0.35x)."""
    base = 0.35
    surge1 = 3.85 * math.exp(-((t - 2.0) / 0.42) ** 2)
    surge2 = 3.95 * math.exp(-((t - 4.6) / 0.42) ** 2)
    surge3 = 3.70 * math.exp(-((t - 7.0) / 0.40) ** 2)
    return base + surge1 + surge2 + surge3


def render_ar(ar: str, dur: float = 8.5, fps: int = 30):
    portrait = ar == "9x16"
    W, H = (720, 1280) if portrait else (1280, 720)
    sc = min(W, H) / 720.0
    n_frames = int(dur * fps)

    tf_zh = load_tf(["/System/Library/Fonts/STHeiti Medium.ttc", "/System/Library/Fonts/Hiragino Sans GB.ttc"])
    tf_mono = load_tf(["/System/Library/Fonts/Menlo.ttc", "/System/Library/Fonts/Courier.ttc"])

    f_title = skia.Font(tf_zh, 22 * sc)
    f_mono = skia.Font(tf_mono, 14 * sc)
    f_spd = skia.Font(tf_mono, 28 * sc)

    src_frames = decode_all_frames(HERE / "assets/orbit.mp4", W, H)
    n_src = len(src_frames)

    # Pre-integrate speed curve to map output time -> source frame index
    dt = 1.0 / fps
    speeds = [speed_at(i * dt) for i in range(n_frames)]
    cum = np.cumsum([s * dt for s in speeds])
    # Normalize cum so we traverse ~92% of the source clip smoothly
    src_positions = (cum / cum[-1]) * (n_src - 6)

    surface = skia.Surface(W, H)
    canvas = surface.getCanvas()

    with tempfile.TemporaryDirectory(prefix=f"t025_{ar}_") as td:
        m = synth.Mix(dur, seed=25)
        sound_mod.score(m)
        wav = Path(td) / "audio.wav"
        pcm = (np.clip(m.master(), -1.0, 1.0) * 32767).astype("<i2")
        with wave.open(str(wav), "wb") as wf:
            wf.setnchannels(2)
            wf.setsampwidth(2)
            wf.setframerate(synth.SR)
            wf.writeframes(pcm.tobytes())

        out_mp4 = HERE / f"T-025-{ar}.mp4"
        cmd = [
            FFMPEG, "-y", "-f", "rawvideo", "-vcodec", "rawvideo",
            "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
            "-i", str(wav), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
            "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-shortest", str(out_mp4),
        ]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)

        for fi in range(n_frames):
            t = fi / fps
            spd = speeds[fi]
            pos = src_positions[fi]
            idx0 = int(pos)
            frac = pos - idx0

            # Multi-frame shutter motion blur when speed > 1.2x
            if spd > 1.2:
                k_blur = min(4, int(spd))
                acc = np.zeros((H, W, 4), dtype=np.float32)
                wsum = 0.0
                for d in range(-k_blur, k_blur + 1):
                    j = max(0, min(n_src - 1, idx0 + d))
                    wt = 1.0 / (1.0 + abs(d) * 0.6)
                    acc += src_frames[j].astype(np.float32) * wt
                    wsum += wt
                blended = np.clip(acc / wsum, 0, 255).astype(np.uint8)
            else:
                j0 = max(0, min(n_src - 1, idx0))
                j1 = max(0, min(n_src - 1, idx0 + 1))
                blended = np.clip(
                    src_frames[j0].astype(np.float32) * (1.0 - frac) + src_frames[j1].astype(np.float32) * frac,
                    0, 255
                ).astype(np.uint8)

            img_bg = skia.Image.fromarray(blended, colorType=skia.kRGBA_8888_ColorType)

            # Punch-in zoom + subtle brightness flash on speed peaks
            surge_norm = max(0.0, (spd - 0.4) / 3.9)
            zoom = 1.0 + surge_norm * 0.11

            canvas.save()
            canvas.translate(W / 2.0, H / 2.0)
            canvas.scale(zoom, zoom)
            canvas.translate(-W / 2.0, -H / 2.0)
            canvas.drawImage(img_bg, 0, 0)
            canvas.restore()

            # Beat impact subtle flash
            if surge_norm > 0.78:
                flash_a = int((surge_norm - 0.78) / 0.22 * 48)
                canvas.drawRect(skia.Rect.MakeWH(W, H), skia.Paint(Color=skia.Color(255, 255, 255, flash_a)))

            # Top badge
            pad = 36 * sc
            canvas.drawRoundRect(skia.Rect.MakeXYWH(pad, pad, 290 * sc, 36 * sc), 18 * sc, 18 * sc, skia.Paint(Color=skia.Color(9, 14, 24, 190)))
            canvas.drawString("SPEED RAMP · TIME REMAP", pad + 16 * sc, pad + 23 * sc, f_mono, skia.Paint(Color=skia.Color(56, 189, 248)))
            canvas.drawString("NASA 空间站轨道曲线变速卡点", pad, pad + 64 * sc, f_title, skia.Paint(Color=skia.Color(248, 250, 252)))

            # Bottom Speed Ramp Curve HUD
            hud_h = 116 * sc
            hud_y = H - pad - hud_h
            hud_w = W - pad * 2
            hud_rect = skia.Rect.MakeXYWH(pad, hud_y, hud_w, hud_h)
            canvas.drawRoundRect(hud_rect, 14 * sc, 14 * sc, skia.Paint(Color=skia.Color(9, 14, 24, 212)))
            canvas.drawRoundRect(hud_rect, 14 * sc, 14 * sc, skia.Paint(Color=skia.Color(148, 163, 184, 70), Style=skia.Paint.kStroke_Style, StrokeWidth=1.2 * sc))

            # Curve plot area inside HUD
            cl = pad + 22 * sc
            cr = pad + hud_w - (170 if not portrait else 150) * sc
            ct = hud_y + 22 * sc
            cb = hud_y + hud_h - 22 * sc

            # Baseline 1.0x guide
            y_1x = cb - (1.0 / 4.6) * (cb - ct)
            canvas.drawLine(cl, y_1x, cr, y_1x, skia.Paint(Color=skia.Color(71, 85, 105, 160), StrokeWidth=1.0))

            # Full speed curve
            curve = skia.Path()
            for i in range(n_frames):
                px = cl + (i / (n_frames - 1)) * (cr - cl)
                py = cb - (speeds[i] / 4.6) * (cb - ct)
                if i == 0:
                    curve.moveTo(px, py)
                else:
                    curve.lineTo(px, py)
            canvas.drawPath(curve, skia.Paint(Color=skia.Color(56, 189, 248, 120), Style=skia.Paint.kStroke_Style, StrokeWidth=2.0 * sc, AntiAlias=True))

            # Played portion in bright amber/cyan
            played = skia.Path()
            for i in range(fi + 1):
                px = cl + (i / (n_frames - 1)) * (cr - cl)
                py = cb - (speeds[i] / 4.6) * (cb - ct)
                if i == 0:
                    played.moveTo(px, py)
                else:
                    played.lineTo(px, py)
            cur_col = skia.Color(251, 146, 60) if spd > 1.6 else skia.Color(56, 189, 248)
            canvas.drawPath(played, skia.Paint(Color=cur_col, Style=skia.Paint.kStroke_Style, StrokeWidth=3.0 * sc, AntiAlias=True))

            # Playhead dot
            cur_x = cl + (fi / (n_frames - 1)) * (cr - cl)
            cur_y = cb - (spd / 4.6) * (cb - ct)
            canvas.drawLine(cur_x, ct, cur_x, cb, skia.Paint(Color=skia.Color(248, 250, 252, 110), StrokeWidth=1.2 * sc))
            canvas.drawCircle(cur_x, cur_y, 6.0 * sc, skia.Paint(Color=cur_col, AntiAlias=True))

            # Right-side speed readout
            rx = cr + 20 * sc
            canvas.drawString("SPEED", rx, hud_y + 38 * sc, f_mono, skia.Paint(Color=skia.Color(148, 163, 184)))
            canvas.drawString(f"{spd:.2f}x", rx, hud_y + 74 * sc, f_spd, skia.Paint(Color=cur_col))
            mode = "RAMP SURGE" if spd > 1.6 else "SLOW-MO"
            canvas.drawString(mode, rx, hud_y + 98 * sc, f_mono, skia.Paint(Color=skia.Color(203, 213, 225)))

            img = surface.makeImageSnapshot()
            proc.stdin.write(img.tobytes())

        proc.stdin.close()
        proc.wait()
        if proc.returncode != 0:
            raise RuntimeError(f"ffmpeg failed ({proc.returncode})")
    print(f"Rendered {out_mp4}")


if __name__ == "__main__":
    render_ar("16x9")
    render_ar("9x16")
