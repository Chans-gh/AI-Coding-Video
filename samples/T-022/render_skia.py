#!/usr/bin/env python3
"""T-022 文字穿插主体景深：基于公共领域实拍视频与逐帧前景遮罩，使用 NumPy + Skia 完成「原实拍背景 → 巨型动态排版大字 → 羽化前景人物」三层夹心合成，人物动作实时遮挡背后标题。"""
import math
import subprocess
import sys
import tempfile
import wave
from pathlib import Path
import numpy as np
from scipy.ndimage import gaussian_filter
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


def decode_video(path: Path, w: int, h: int, n_frames: int, start_sec: float = 0.8, gray: bool = False):
    pix = "gray" if gray else "rgba"
    ch = 1 if gray else 4
    cmd = [
        FFMPEG, "-ss", str(start_sec), "-i", str(path),
        "-vf", f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}",
        "-frames:v", str(n_frames), "-f", "rawvideo", "-pix_fmt", pix, "-"
    ]
    raw = subprocess.check_output(cmd, stderr=subprocess.DEVNULL)
    arr = np.frombuffer(raw, dtype=np.uint8)
    actual = len(arr) // (w * h * ch)
    arr = arr[:actual * w * h * ch].reshape((actual, h, w) if gray else (actual, h, w, ch))
    return arr


def ease_out_cubic(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 1.0 - (1.0 - x) ** 3


def render_ar(ar: str, dur: float = 8.5, fps: int = 30):
    portrait = ar == "9x16"
    W, H = (720, 1280) if portrait else (1280, 720)
    sc = min(W, H) / 720.0
    n_frames = int(dur * fps)

    tf_zh = load_tf(["/System/Library/Fonts/STHeiti Medium.ttc", "/System/Library/Fonts/Hiragino Sans GB.ttc"])
    tf_bold = load_tf(["/System/Library/Fonts/Supplemental/Impact.ttf", "/System/Library/Fonts/HelveticaNeue.ttc"])
    tf_mono = load_tf(["/System/Library/Fonts/Menlo.ttc", "/System/Library/Fonts/Courier.ttc"])

    f_big = skia.Font(tf_bold, (176 if not portrait else 132) * sc)
    f_big_zh = skia.Font(tf_zh, (116 if not portrait else 96) * sc)
    f_sub = skia.Font(tf_zh, 22 * sc)
    f_mono = skia.Font(tf_mono, 14 * sc)

    drill = decode_video(HERE / "assets/drill.mp4", W, H, n_frames, start_sec=1.0, gray=False)
    masks = decode_video(HERE / "assets/mask.mp4", W, H, n_frames, start_sec=1.0, gray=True)
    total = min(len(drill), len(masks), n_frames)

    text_surf = skia.Surface(W, H)
    text_cvs = text_surf.getCanvas()
    hud_surf = skia.Surface(W, H)
    hud_cvs = hud_surf.getCanvas()

    # Precompute subtle cinematic dark vignette
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    nx = (xx - W / 2.0) / (W / 2.0)
    ny = (yy - H / 2.0) / (H / 2.0)
    vig = np.clip(1.0 - 0.34 * (nx * nx + ny * ny), 0.58, 1.0)[..., None]

    with tempfile.TemporaryDirectory(prefix=f"t022_{ar}_") as td:
        m = synth.Mix(dur, seed=22)
        sound_mod.score(m)
        wav = Path(td) / "audio.wav"
        pcm = (np.clip(m.master(), -1.0, 1.0) * 32767).astype("<i2")
        with wave.open(str(wav), "wb") as wf:
            wf.setnchannels(2)
            wf.setsampwidth(2)
            wf.setframerate(synth.SR)
            wf.writeframes(pcm.tobytes())

        out_mp4 = HERE / f"T-022-{ar}.mp4"
        cmd = [
            FFMPEG, "-y", "-f", "rawvideo", "-vcodec", "rawvideo",
            "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
            "-i", str(wav), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
            "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-shortest", str(out_mp4),
        ]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)

        for fi in range(n_frames):
            t = fi / fps
            idx = min(fi, total - 1)
            frame = drill[idx].astype(np.float32)
            # Cinematic teal/slate grade on background
            bg = frame.copy()
            bg[..., 0] = np.clip(bg[..., 0] * 0.88, 0, 255)
            bg[..., 1] = np.clip(bg[..., 1] * 0.94, 0, 255)
            bg[..., 2] = np.clip(bg[..., 2] * 1.06, 0, 255)
            bg[..., :3] *= vig

            # Softly feathered subject alpha mask
            raw_m = masks[idx].astype(np.float32) / 255.0
            alpha = np.clip((gaussian_filter(raw_m, sigma=1.6) - 0.18) / 0.65, 0.0, 1.0)[..., None]

            # Layer 1: Giant kinetic text placed BEHIND the subject
            text_cvs.clear(skia.Color(0, 0, 0, 0))
            p_rise = ease_out_cubic((t - 0.35) / 1.0)
            p_swap = ease_out_cubic((t - 4.30) / 0.85)

            # Vertical anchor sits right behind the athlete's torso/head so the body cleanly occludes the letters
            base_y = (H * 0.62 if not portrait else H * 0.56) + (1.0 - p_rise) * 140 * sc
            drift_x = math.sin(t * 0.9) * 18 * sc

            if t < 4.30:
                word = "ENDURANCE"
                tw = f_big.measureText(word)
                tx = (W - tw) / 2.0 + drift_x
                # Glow backing
                text_cvs.drawString(word, tx, base_y, f_big, skia.Paint(Color=skia.Color(56, 189, 248, 70), MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 14 * sc)))
                text_cvs.drawString(word, tx, base_y, f_big, skia.Paint(Color=skia.Color(248, 250, 252, int(245 * p_rise)), AntiAlias=True))
                # Secondary row slightly below
                sub_w = "BREAK YOUR LIMITS"
                sw = f_mono.measureText(sub_w)
                text_cvs.drawString(sub_w, (W - sw) / 2.0, base_y + 38 * sc, f_mono, skia.Paint(Color=skia.Color(56, 189, 248, int(220 * p_rise))))
            else:
                word = "突破体能极限"
                tw = f_big_zh.measureText(word)
                tx = (W - tw) / 2.0 + drift_x
                y2 = (H * 0.61 if not portrait else H * 0.56) + (1.0 - p_swap) * 100 * sc
                text_cvs.drawString(word, tx, y2, f_big_zh, skia.Paint(Color=skia.Color(251, 146, 60, 85), MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 14 * sc)))
                text_cvs.drawString(word, tx, y2, f_big_zh, skia.Paint(Color=skia.Color(255, 237, 213, int(248 * p_swap)), AntiAlias=True))

            txt_arr = np.frombuffer(text_surf.makeImageSnapshot().tobytes(), dtype=np.uint8).reshape((H, W, 4)).astype(np.float32)
            ta = txt_arr[..., 3:4] / 255.0

            # Sandwich composite: BG -> Text -> Foreground Subject (using alpha mask)
            comp = bg[..., :3] * (1.0 - ta) + txt_arr[..., :3] * ta
            # Foreground subject sits cleanly ON TOP of text
            comp = comp * (1.0 - alpha) + frame[..., :3] * alpha

            # Layer 3: Subtle minimal editorial HUD on top
            hud_cvs.clear(skia.Color(0, 0, 0, 0))
            pad = 36 * sc
            hud_cvs.drawRoundRect(skia.Rect.MakeXYWH(pad, pad, 326 * sc, 34 * sc), 17 * sc, 17 * sc, skia.Paint(Color=skia.Color(15, 23, 42, 185)))
            hud_cvs.drawString("TEXT BEHIND SUBJECT · 3-LAYER MASK", pad + 14 * sc, pad + 22 * sc, f_mono, skia.Paint(Color=skia.Color(125, 211, 252)))

            # Bottom subtle caption bar
            bar_y = H - 56 * sc
            hud_cvs.drawString("前景人物遮罩实时遮挡背景大字", pad, bar_y, f_sub, skia.Paint(Color=skia.Color(226, 232, 240, 210)))
            hud_arr = np.frombuffer(hud_surf.makeImageSnapshot().tobytes(), dtype=np.uint8).reshape((H, W, 4)).astype(np.float32)
            ha = hud_arr[..., 3:4] / 255.0
            final_rgb = comp * (1.0 - ha) + hud_arr[..., :3] * ha

            out_rgba = np.empty((H, W, 4), dtype=np.uint8)
            out_rgba[..., :3] = np.clip(final_rgb, 0, 255).astype(np.uint8)
            out_rgba[..., 3] = 255
            proc.stdin.write(out_rgba.tobytes())

        proc.stdin.close()
        proc.wait()
        if proc.returncode != 0:
            raise RuntimeError(f"ffmpeg failed ({proc.returncode})")
    print(f"Rendered {out_mp4}")


if __name__ == "__main__":
    render_ar("16x9")
    render_ar("9x16")
