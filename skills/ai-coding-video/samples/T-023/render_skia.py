#!/usr/bin/env python3
"""T-023 实拍物体追踪呼出标注：NumPy 逐帧检测 NASA 火箭实拍高亮喷口坐标并做 EMA 平滑导出 track.json，Skia 实时绘制追踪瞄准框、折线指引线与动态参数呼出卡。"""
import json
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


def decode_video(path: Path, w: int, h: int, n_frames: int):
    cmd = [
        FFMPEG, "-i", str(path),
        "-vf", f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}",
        "-frames:v", str(n_frames), "-f", "rawvideo", "-pix_fmt", "rgba", "-"
    ]
    raw = subprocess.check_output(cmd, stderr=subprocess.DEVNULL)
    arr = np.frombuffer(raw, dtype=np.uint8)
    actual = len(arr) // (w * h * 4)
    return arr[:actual * w * h * 4].reshape((actual, h, w, 4))


def track_nozzle(frames: np.ndarray):
    """Detect the bright rocket nozzle tip (top-most hot core) per frame with EMA smoothing."""
    n, H, W, _ = frames.shape
    pts = []
    sx, sy = W * 0.5, H * 0.35
    for i in range(n):
        rgb = frames[i, :, :, :3].astype(np.float32)
        lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
        thr = max(180.0, float(np.percentile(lum, 98.8)))
        ys, xs = np.where(lum >= thr)
        if len(xs) > 15:
            # Focus on the top 15% of bright pixels (the nozzle head at the leading tip of the plume)
            y_cut = np.percentile(ys, 15)
            top_mask = ys <= y_cut
            tx = float(np.mean(xs[top_mask]))
            ty = float(np.mean(ys[top_mask]))
            if i == 0:
                sx, sy = tx, ty
            else:
                sx = 0.72 * sx + 0.28 * tx
                sy = 0.72 * sy + 0.28 * ty
        pts.append((round(sx, 1), round(sy, 1)))
    return pts


def ease_out_cubic(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 1.0 - (1.0 - x) ** 3


def render_ar(ar: str, dur: float = 8.5, fps: int = 30):
    portrait = ar == "9x16"
    W, H = (720, 1280) if portrait else (1280, 720)
    sc = min(W, H) / 720.0
    n_frames = int(dur * fps)

    tf_zh = load_tf(["/System/Library/Fonts/STHeiti Medium.ttc", "/System/Library/Fonts/Hiragino Sans GB.ttc"])
    tf_mono = load_tf(["/System/Library/Fonts/Menlo.ttc", "/System/Library/Fonts/Courier.ttc"])

    f_title = skia.Font(tf_zh, 20 * sc)
    f_zh_sm = skia.Font(tf_zh, 14 * sc)
    f_mono = skia.Font(tf_mono, 14 * sc)
    f_mono_lg = skia.Font(tf_mono, 20 * sc)

    frames = decode_video(HERE / "assets/track.mp4", W, H, n_frames)
    total = len(frames)
    pts = track_nozzle(frames)

    if ar == "16x9":
        (HERE / "assets/track.json").write_text(
            json.dumps({"width": W, "height": H, "fps": fps, "points": pts}, indent=2),
            encoding="utf-8",
        )

    surface = skia.Surface(W, H)
    canvas = surface.getCanvas()

    with tempfile.TemporaryDirectory(prefix=f"t023_{ar}_") as td:
        m = synth.Mix(dur, seed=23)
        sound_mod.score(m)
        wav = Path(td) / "audio.wav"
        pcm = (np.clip(m.master(), -1.0, 1.0) * 32767).astype("<i2")
        with wave.open(str(wav), "wb") as wf:
            wf.setnchannels(2)
            wf.setsampwidth(2)
            wf.setframerate(synth.SR)
            wf.writeframes(pcm.tobytes())

        out_mp4 = HERE / f"T-023-{ar}.mp4"
        cmd = [
            FFMPEG, "-y", "-f", "rawvideo", "-vcodec", "rawvideo",
            "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
            "-i", str(wav), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
            "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-shortest", str(out_mp4),
        ]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)

        for fi in range(n_frames):
            t = fi / fps
            idx = min(total - 1, int(fi * (total - 1) / max(1, n_frames - 1)))
            img_bg = skia.Image.fromarray(frames[idx], colorType=skia.kRGBA_8888_ColorType)
            canvas.drawImage(img_bg, 0, 0)

            tx, ty = pts[idx]
            prev_x, prev_y = pts[max(0, idx - 1)]
            vel = math.hypot(tx - prev_x, ty - prev_y) * fps

            # Target lock reticle
            p_lock = ease_out_cubic((t - 0.15) / 0.45)
            r_box = (38 + (1.0 - p_lock) * 32) * sc
            cyan = skia.Color(56, 189, 248)
            green = skia.Color(52, 211, 153)
            ret_col = green if t >= 0.6 else cyan

            # Corner brackets
            p_b = skia.Paint(Color=ret_col, Style=skia.Paint.kStroke_Style, StrokeWidth=2.6 * sc, AntiAlias=True)
            arm = 14 * sc
            for dx in (-1, 1):
                for dy in (-1, 1):
                    cx_c = tx + dx * r_box
                    cy_c = ty + dy * r_box
                    canvas.drawLine(cx_c, cy_c, cx_c - dx * arm, cy_c, p_b)
                    canvas.drawLine(cx_c, cy_c, cx_c, cy_c - dy * arm, p_b)

            # Rotating dashed circle around nozzle
            canvas.save()
            canvas.translate(tx, ty)
            canvas.rotate(t * 45.0)
            canvas.drawCircle(0, 0, r_box * 0.72, skia.Paint(Color=skia.Color(56, 189, 248, 160), Style=skia.Paint.kStroke_Style, StrokeWidth=1.4 * sc, AntiAlias=True))
            canvas.restore()
            canvas.drawCircle(tx, ty, 4.5 * sc, skia.Paint(Color=ret_col, AntiAlias=True))

            # Smart callout card placement (avoid going off-screen)
            card_w = (320 if not portrait else 310) * sc
            card_h = 148 * sc
            on_right = tx < W * 0.56
            elbow_x = tx + (86 * sc if on_right else -86 * sc)
            elbow_y = max(120 * sc, min(H - card_h - 80 * sc, ty - 42 * sc))
            card_x = elbow_x + (32 * sc if on_right else -32 * sc - card_w)
            card_x = max(28 * sc, min(W - card_w - 28 * sc, card_x))
            card_y = elbow_y - 24 * sc

            p_card = ease_out_cubic((t - 0.55) / 0.5)
            if p_card > 0.02:
                # Leader polyline
                line_end_x = card_x if on_right else card_x + card_w
                path = skia.Path()
                path.moveTo(tx + (r_box if on_right else -r_box), ty)
                path.lineTo(elbow_x, elbow_y)
                path.lineTo(line_end_x, elbow_y)
                canvas.drawPath(path, skia.Paint(Color=skia.Color(56, 189, 248, int(235 * p_card)), Style=skia.Paint.kStroke_Style, StrokeWidth=2.0 * sc, AntiAlias=True))
                canvas.drawCircle(line_end_x, elbow_y, 4.0 * sc, skia.Paint(Color=cyan, AntiAlias=True))

                # Callout glass card
                rect = skia.Rect.MakeXYWH(card_x, card_y, card_w, card_h)
                canvas.drawRoundRect(rect, 12 * sc, 12 * sc, skia.Paint(Color=skia.Color(10, 17, 30, int(218 * p_card))))
                canvas.drawRoundRect(rect, 12 * sc, 12 * sc, skia.Paint(Color=skia.Color(56, 189, 248, int(190 * p_card)), Style=skia.Paint.kStroke_Style, StrokeWidth=1.4 * sc))

                a = int(255 * p_card)
                canvas.drawCircle(card_x + 18 * sc, card_y + 24 * sc, 5 * sc, skia.Paint(Color=skia.Color(52, 211, 153, a)))
                canvas.drawString("TARGET LOCKED · 99.4%", card_x + 30 * sc, card_y + 29 * sc, f_mono, skia.Paint(Color=skia.Color(110, 231, 183, a)))
                canvas.drawString("核心主发动机尾焰喷口", card_x + 16 * sc, card_y + 60 * sc, f_title, skia.Paint(Color=skia.Color(248, 250, 252, a)))
                canvas.drawString(f"POS: ({int(tx):04d}, {int(ty):04d}) px", card_x + 16 * sc, card_y + 92 * sc, f_mono, skia.Paint(Color=skia.Color(125, 211, 252, a)))
                alt = 12.4 + t * 1.85
                canvas.drawString(f"ALT: {alt:.1f} km  VEL: {vel:.0f} px/s", card_x + 16 * sc, card_y + 116 * sc, f_mono, skia.Paint(Color=skia.Color(203, 213, 225, a)))
                canvas.drawString("NASA Artemis I 实拍追踪标注", card_x + 16 * sc, card_y + 138 * sc, f_zh_sm, skia.Paint(Color=skia.Color(148, 163, 184, a)))

            # Top-left HUD badge
            pad = 32 * sc
            canvas.drawRoundRect(skia.Rect.MakeXYWH(pad, pad, 272 * sc, 34 * sc), 17 * sc, 17 * sc, skia.Paint(Color=skia.Color(10, 17, 30, 195)))
            canvas.drawString("2D TRACKING CALLOUT · LIVE", pad + 16 * sc, pad + 22 * sc, f_mono, skia.Paint(Color=cyan))

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
