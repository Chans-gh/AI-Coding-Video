#!/usr/bin/env python3
"""G-028 实景转粘土定格微缩重绘：青水生成海滨铁道写实街景与同构图手工粘土微缩模型重绘，并驱动粘土定格动画视频；Skia 绘制扫光前后对比与 12fps 抽帧定格质感（Posterize Time）。"""
import math
import subprocess
import sys
import tempfile
import wave
from pathlib import Path
import numpy as np
from PIL import Image
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


def load_img_rgba(path: Path, w: int, h: int) -> np.ndarray:
    im = Image.open(path).convert("RGBA")
    iw, ih = im.size
    scale = max(w / iw, h / ih)
    nw, nh = int(round(iw * scale)), int(round(ih * scale))
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    x0, y0 = (nw - w) // 2, (nh - h) // 2
    return np.array(im.crop((x0, y0, x0 + w, y0 + h)), dtype=np.uint8)


def decode_video(path: Path, w: int, h: int):
    cmd = [
        FFMPEG, "-i", str(path),
        "-vf", f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}",
        "-f", "rawvideo", "-pix_fmt", "rgba", "-"
    ]
    raw = subprocess.check_output(cmd, stderr=subprocess.DEVNULL)
    arr = np.frombuffer(raw, dtype=np.uint8)
    n = len(arr) // (w * h * 4)
    return arr[:n * w * h * 4].reshape((n, h, w, 4))


def ease(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return x * x * (3.0 - 2.0 * x)


def render_ar(ar: str, dur: float = 8.5, fps: int = 30):
    portrait = ar == "9x16"
    W, H = (720, 1280) if portrait else (1280, 720)
    sc = min(W, H) / 720.0
    n_frames = int(dur * fps)

    tf_zh = load_tf(["/System/Library/Fonts/STHeiti Medium.ttc", "/System/Library/Fonts/Hiragino Sans GB.ttc"])
    tf_mono = load_tf(["/System/Library/Fonts/Menlo.ttc", "/System/Library/Fonts/Courier.ttc"])
    f_title = skia.Font(tf_zh, 24 * sc)
    f_sub = skia.Font(tf_zh, 15 * sc)
    f_mono = skia.Font(tf_mono, 14 * sc)

    real_img = load_img_rgba(HERE / "assets/real_street.jpg", W, H)
    clay_img = load_img_rgba(HERE / "assets/clay_street.jpg", W, H)
    clay_vid = decode_video(HERE / "assets/clay_anim.mp4", W, H)
    n_vid = len(clay_vid)

    surface = skia.Surface(W, H)
    canvas = surface.getCanvas()

    with tempfile.TemporaryDirectory(prefix=f"g028_{ar}_") as td:
        m = synth.Mix(dur, seed=280)
        sound_mod.score(m)
        wav = Path(td) / "audio.wav"
        pcm = (np.clip(m.master(), -1.0, 1.0) * 32767).astype("<i2")
        with wave.open(str(wav), "wb") as wf:
            wf.setnchannels(2)
            wf.setsampwidth(2)
            wf.setframerate(synth.SR)
            wf.writeframes(pcm.tobytes())

        out_mp4 = HERE / f"G-028-{ar}.mp4"
        cmd = [
            FFMPEG, "-y", "-f", "rawvideo", "-vcodec", "rawvideo",
            "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
            "-i", str(wav), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
            "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-shortest", str(out_mp4),
        ]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)

        for fi in range(n_frames):
            t = fi / fps
            wipe_x = -1
            if t < 1.5:
                frame = real_img
                badge = "ORIGINAL SCENE · REALISTIC"
                zh_lbl = "写实海滨铁道街景原图"
                accent = skia.Color(203, 213, 225)
            elif t < 3.0:
                p = ease((t - 1.5) / 1.5)
                wipe_x = int(p * W)
                frame = real_img.copy()
                if wipe_x > 0:
                    frame[:, :wipe_x] = clay_img[:, :wipe_x]
                badge = "STYLE TRANSFER · CLAYMATION WIPE"
                zh_lbl = "同构图粘土微缩模型重绘"
                accent = skia.Color(251, 191, 36)
            else:
                # Posterize time to ~12fps for tactile handcrafted stop-motion cadence
                u = min(1.0, (t - 3.0) / (dur - 3.0))
                raw_idx = int(u * (n_vid - 1))
                stepped_idx = min(n_vid - 1, (raw_idx // 3) * 3)
                frame = clay_vid[stepped_idx]
                badge = "STOP-MOTION · 12FPS CLAY WORLD"
                zh_lbl = "手工粘土定格微缩动画"
                accent = skia.Color(52, 211, 153)

            img_sk = skia.Image.fromarray(frame, colorType=skia.kRGBA_8888_ColorType)
            zoom = 1.0 + 0.035 * (t / dur)
            canvas.save()
            canvas.translate(W / 2.0, H / 2.0)
            canvas.scale(zoom, zoom)
            canvas.translate(-W / 2.0, -H / 2.0)
            canvas.drawImage(img_sk, 0, 0)
            canvas.restore()

            if 0 < wipe_x < W:
                canvas.drawRect(skia.Rect.MakeXYWH(wipe_x - 3 * sc, 0, 6 * sc, H), skia.Paint(Color=skia.Color(251, 191, 36, 220), MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 8 * sc)))
                canvas.drawLine(wipe_x, 0, wipe_x, H, skia.Paint(Color=skia.Color(255, 251, 235), StrokeWidth=2.4 * sc))

            pad = 36 * sc
            canvas.drawRoundRect(skia.Rect.MakeXYWH(pad, pad, 316 * sc, 34 * sc), 17 * sc, 17 * sc, skia.Paint(Color=skia.Color(15, 23, 42, 190)))
            canvas.drawString(badge, pad + 16 * sc, pad + 22 * sc, f_mono, skia.Paint(Color=accent))
            canvas.drawString(zh_lbl, pad, pad + 64 * sc, f_title, skia.Paint(Color=skia.Color(248, 250, 252)))

            disc = "AI 生成 · 粘土定格微缩重绘"
            dw = f_sub.measureText(disc)
            by = H - pad - 34 * sc
            canvas.drawRoundRect(skia.Rect.MakeXYWH(W - pad - dw - 24 * sc, by, dw + 24 * sc, 34 * sc), 17 * sc, 17 * sc, skia.Paint(Color=skia.Color(15, 23, 42, 180)))
            canvas.drawString(disc, W - pad - dw - 12 * sc, by + 22 * sc, f_sub, skia.Paint(Color=skia.Color(226, 232, 240)))

            out_img = surface.makeImageSnapshot()
            proc.stdin.write(out_img.tobytes())

        proc.stdin.close()
        proc.wait()
        if proc.returncode != 0:
            raise RuntimeError(f"ffmpeg failed ({proc.returncode})")
    print(f"Rendered {out_mp4}")


if __name__ == "__main__":
    render_ar("16x9")
    render_ar("9x16")
