#!/usr/bin/env python3
"""G-027 穿物一镜到底微距穿越：青水生成咖啡液面与微观星云城市首尾帧并合成一镜到底穿越视频，NumPy + Skia 施加俯冲变速曲线、快门运动模糊与电影宽银幕黑边及景深字幕。"""
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


def speed_curve(t: float) -> float:
    """Slow macro hover -> dramatic 3.0x dive through liquid surface -> slow awe-inspiring reveal."""
    return 0.55 + 2.55 * math.exp(-((t - 3.6) / 0.85) ** 2)


def render_ar(ar: str, dur: float = 8.5, fps: int = 30):
    portrait = ar == "9x16"
    W, H = (720, 1280) if portrait else (1280, 720)
    sc = min(W, H) / 720.0
    n_frames = int(dur * fps)

    tf_zh = load_tf(["/System/Library/Fonts/STHeiti Medium.ttc", "/System/Library/Fonts/Hiragino Sans GB.ttc"])
    tf_mono = load_tf(["/System/Library/Fonts/Menlo.ttc", "/System/Library/Fonts/Courier.ttc"])
    f_title = skia.Font(tf_zh, (32 if not portrait else 34) * sc)
    f_sub = skia.Font(tf_zh, 15 * sc)
    f_mono = skia.Font(tf_mono, 14 * sc)

    vid = decode_video(HERE / "assets/fpv.mp4", W, H)
    n_vid = len(vid)

    dt = 1.0 / fps
    speeds = [speed_curve(i * dt) for i in range(n_frames)]
    cum = np.cumsum([s * dt for s in speeds])
    src_pos = (cum / cum[-1]) * (n_vid - 2)

    surface = skia.Surface(W, H)
    canvas = surface.getCanvas()

    with tempfile.TemporaryDirectory(prefix=f"g027_{ar}_") as td:
        m = synth.Mix(dur, seed=270)
        sound_mod.score(m)
        wav = Path(td) / "audio.wav"
        pcm = (np.clip(m.master(), -1.0, 1.0) * 32767).astype("<i2")
        with wave.open(str(wav), "wb") as wf:
            wf.setnchannels(2)
            wf.setsampwidth(2)
            wf.setframerate(synth.SR)
            wf.writeframes(pcm.tobytes())

        out_mp4 = HERE / f"G-027-{ar}.mp4"
        cmd = [
            FFMPEG, "-y", "-f", "rawvideo", "-vcodec", "rawvideo",
            "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
            "-i", str(wav), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
            "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-shortest", str(out_mp4),
        ]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)

        bar_h = (52 if not portrait else 84) * sc

        for fi in range(n_frames):
            t = fi / fps
            spd = speeds[fi]
            pos = src_pos[fi]
            idx = int(pos)

            if spd > 1.4:
                acc = np.zeros((H, W, 4), dtype=np.float32)
                wsum = 0.0
                for d in (-2, -1, 0, 1, 2):
                    j = max(0, min(n_vid - 1, idx + d))
                    wt = 1.0 / (1.0 + abs(d) * 0.7)
                    acc += vid[j].astype(np.float32) * wt
                    wsum += wt
                frame = np.clip(acc / wsum, 0, 255).astype(np.uint8)
            else:
                frame = vid[max(0, min(n_vid - 1, idx))]

            img_sk = skia.Image.fromarray(frame, colorType=skia.kRGBA_8888_ColorType)
            surge = max(0.0, (spd - 0.6) / 2.5)
            zoom = 1.0 + surge * 0.09
            canvas.save()
            canvas.translate(W / 2.0, H / 2.0)
            canvas.scale(zoom, zoom)
            canvas.translate(-W / 2.0, -H / 2.0)
            canvas.drawImage(img_sk, 0, 0)
            canvas.restore()

            # Cinematic letterbox bars
            canvas.drawRect(skia.Rect.MakeXYWH(0, 0, W, bar_h), skia.Paint(Color=skia.Color(6, 8, 12)))
            canvas.drawRect(skia.Rect.MakeXYWH(0, H - bar_h, W, bar_h), skia.Paint(Color=skia.Color(6, 8, 12)))

            pad = 32 * sc
            depth_mm = (t / dur) ** 2.1 * 120.0
            canvas.drawString("FPV MICRO-WORLD · SINGLE-TAKE DIVE", pad, bar_h * 0.64, f_mono, skia.Paint(Color=skia.Color(251, 191, 36)))
            d_txt = f"DEPTH: -{depth_mm:05.1f} mm  |  {spd:.2f}x"
            canvas.drawString(d_txt, W - pad - f_mono.measureText(d_txt), bar_h * 0.64, f_mono, skia.Paint(Color=skia.Color(203, 213, 225)))

            # Opening & finale titles
            if 0.4 <= t <= 2.5:
                a = int(255 * min(1.0, (t - 0.4) / 0.4, (2.5 - t) / 0.4))
                txt = "一杯拿铁之下"
                tw = f_title.measureText(txt)
                canvas.drawString(txt, (W - tw) / 2.0, H * 0.80, f_title, skia.Paint(Color=skia.Color(255, 251, 235, a)))
            elif t >= 5.2:
                a = int(255 * min(1.0, (t - 5.2) / 0.6))
                txt = "穿入微观星云之城"
                tw = f_title.measureText(txt)
                canvas.drawString(txt, (W - tw) / 2.0, H * 0.80, f_title, skia.Paint(Color=skia.Color(254, 240, 138, a)))

            disc = "AI 生成 · 首尾帧一镜到底"
            canvas.drawString(disc, pad, H - bar_h * 0.36, f_sub, skia.Paint(Color=skia.Color(148, 163, 184)))

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
