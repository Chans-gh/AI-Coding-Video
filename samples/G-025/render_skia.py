#!/usr/bin/env python3
"""G-025 实拍产品 AI 换景重打光：保留棚拍级产品原图细节，用青水参考图重打光生成极光冰川与赛博雨夜两套环境并通过首尾帧生视频衔接，Skia 绘制青金扫光前后对比与色温光影仪表 HUD。"""
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
    f_val = skia.Font(tf_mono, 20 * sc)

    raw_img = load_img_rgba(HERE / "assets/raw.jpg", W, H)
    ice_img = load_img_rgba(HERE / "assets/relight_ice.jpg", W, H)
    vid_frames = decode_video(HERE / "assets/relight.mp4", W, H)
    n_vid = len(vid_frames)

    surface = skia.Surface(W, H)
    canvas = surface.getCanvas()

    with tempfile.TemporaryDirectory(prefix=f"g025_{ar}_") as td:
        m = synth.Mix(dur, seed=250)
        sound_mod.score(m)
        wav = Path(td) / "audio.wav"
        pcm = (np.clip(m.master(), -1.0, 1.0) * 32767).astype("<i2")
        with wave.open(str(wav), "wb") as wf:
            wf.setnchannels(2)
            wf.setsampwidth(2)
            wf.setframerate(synth.SR)
            wf.writeframes(pcm.tobytes())

        out_mp4 = HERE / f"G-025-{ar}.mp4"
        cmd = [
            FFMPEG, "-y", "-f", "rawvideo", "-vcodec", "rawvideo",
            "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
            "-i", str(wav), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
            "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-shortest", str(out_mp4),
        ]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)

        for fi in range(n_frames):
            t = fi / fps
            # Phase 1 (0.0-1.6s): Clean studio raw product
            # Phase 2 (1.6-3.1s): Glowing scanline wipe from Raw -> Arctic Aurora Relight
            # Phase 3 (3.1-8.5s): Smooth AI video relighting morph Arctic Ice -> Cyber Neon Rain
            wipe_x = -1
            if t < 1.6:
                frame = raw_img
                stage_lbl = "STAGE 01 · STUDIO RAW"
                stage_zh = "棚拍原图底版 · 产品本体锁定"
                kelvin = 5600
                accent = skia.Color(203, 213, 225)
            elif t < 3.1:
                p = ease((t - 1.6) / 1.5)
                wipe_x = int(p * W)
                frame = raw_img.copy()
                if wipe_x > 0:
                    frame[:, :wipe_x] = ice_img[:, :wipe_x]
                stage_lbl = "STAGE 02 · AI RELIGHT WIPE"
                stage_zh = "AI 换景重打光 · 极光冰川反射"
                kelvin = int(5600 + p * 2600)
                accent = skia.Color(56, 189, 248)
            else:
                u = min(1.0, (t - 3.1) / (dur - 3.1))
                vidx = min(n_vid - 1, int(u * (n_vid - 1)))
                frame = vid_frames[vidx]
                stage_lbl = "STAGE 03 · DYNAMIC RELIGHT MORPH"
                stage_zh = "首尾帧动态光影迁移 · 极光 → 赛博霓虹"
                kelvin = int(8200 - u * 4800)
                accent = skia.Color(244, 114, 182) if u > 0.5 else skia.Color(56, 189, 248)

            img_sk = skia.Image.fromarray(frame, colorType=skia.kRGBA_8888_ColorType)
            zoom = 1.0 + 0.04 * (t / dur)
            canvas.save()
            canvas.translate(W / 2.0, H / 2.0)
            canvas.scale(zoom, zoom)
            canvas.translate(-W / 2.0, -H / 2.0)
            canvas.drawImage(img_sk, 0, 0)
            canvas.restore()

            # Glowing scanline during wipe
            if 0 < wipe_x < W:
                canvas.drawRect(skia.Rect.MakeXYWH(wipe_x - 3 * sc, 0, 6 * sc, H), skia.Paint(Color=skia.Color(56, 189, 248, 220), MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 8 * sc)))
                canvas.drawLine(wipe_x, 0, wipe_x, H, skia.Paint(Color=skia.Color(240, 249, 255), StrokeWidth=2.4 * sc))

            pad = 36 * sc
            # Top HUD
            canvas.drawRoundRect(skia.Rect.MakeXYWH(pad, pad, 310 * sc, 34 * sc), 17 * sc, 17 * sc, skia.Paint(Color=skia.Color(9, 14, 24, 195)))
            canvas.drawString(stage_lbl, pad + 16 * sc, pad + 22 * sc, f_mono, skia.Paint(Color=accent))
            canvas.drawString(stage_zh, pad, pad + 64 * sc, f_title, skia.Paint(Color=skia.Color(248, 250, 252)))

            # Bottom lighting telemetry pill + AI disclosure
            by = H - pad - 56 * sc
            canvas.drawRoundRect(skia.Rect.MakeXYWH(pad, by, 260 * sc, 52 * sc), 12 * sc, 12 * sc, skia.Paint(Color=skia.Color(9, 14, 24, 200)))
            canvas.drawString("ENV COLOR TEMP", pad + 16 * sc, by + 20 * sc, f_mono, skia.Paint(Color=skia.Color(148, 163, 184)))
            canvas.drawString(f"{kelvin} K", pad + 16 * sc, by + 44 * sc, f_val, skia.Paint(Color=accent))

            disc = "AI 生成 · 虚构商品演示"
            dw = f_sub.measureText(disc)
            canvas.drawRoundRect(skia.Rect.MakeXYWH(W - pad - dw - 24 * sc, by + 16 * sc, dw + 24 * sc, 34 * sc), 17 * sc, 17 * sc, skia.Paint(Color=skia.Color(9, 14, 24, 180)))
            canvas.drawString(disc, W - pad - dw - 12 * sc, by + 38 * sc, f_sub, skia.Paint(Color=skia.Color(203, 213, 225)))

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
