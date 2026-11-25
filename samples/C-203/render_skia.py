#!/usr/bin/env python3
"""C-203 动态数据排行竞速：NumPy 平滑插值历年数值与排名换位，Skia 离屏绘制高质感圆角渐变条形、动态反超、数值跳动与大号年份水印，零浏览器直接输出 MP4。"""
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


def render_ar(ar: str, dur: float = 4.5, fps: int = 30):
    portrait = ar == "9x16"
    W, H = (720, 1280) if portrait else (1280, 720)
    sc = min(W, H) / 720.0
    n_frames = int(dur * fps)

    tf_zh = load_tf(["/System/Library/Fonts/STHeiti Medium.ttc", "/System/Library/Fonts/Hiragino Sans GB.ttc"])
    tf_mono = load_tf(["/System/Library/Fonts/Menlo.ttc", "/System/Library/Fonts/Courier.ttc"])
    f_title = skia.Font(tf_zh, 34 * sc)
    f_sub = skia.Font(tf_mono, 15 * sc)
    f_lbl = skia.Font(tf_zh, (20 if not portrait else 19) * sc)
    f_val = skia.Font(tf_mono, 20 * sc)
    f_year = skia.Font(tf_mono, (108 if not portrait else 88) * sc)

    # Fictional AI code-video framework adoption index (2021..2026) with dramatic overtakes
    years = np.array([2021, 2022, 2023, 2024, 2025, 2026], dtype=np.float64)
    series = [
        ("代码视频管线", np.array([12, 24, 48, 92, 168, 245], dtype=np.float64), (skia.Color(56, 189, 248), skia.Color(99, 102, 241))),
        ("实时着色器",   np.array([45, 58, 76, 104, 148, 205], dtype=np.float64), (skia.Color(168, 85, 247), skia.Color(236, 72, 153))),
        ("数据动画引擎", np.array([62, 74, 88, 118, 142, 176], dtype=np.float64), (skia.Color(52, 211, 153), skia.Color(14, 165, 233))),
        ("传统剪辑脚本", np.array([95, 102, 108, 112, 118, 122], dtype=np.float64), (skia.Color(251, 191, 36), skia.Color(249, 115, 22))),
        ("3D 程序化",    np.array([28, 38, 56, 82, 116, 158], dtype=np.float64), (skia.Color(244, 114, 182), skia.Color(251, 113, 133))),
        ("矢量排版流",   np.array([34, 46, 60, 74, 92, 115], dtype=np.float64), (skia.Color(129, 140, 248), skia.Color(56, 189, 248))),
    ]

    # Precompute smooth frame-by-frame values & smoothed floating ranks via NumPy
    ts = np.linspace(years[0], years[-1], n_frames)
    vals_mat = np.array([np.interp(ts, years, s[1]) for s in series])  # (6, n_frames)
    raw_ranks = np.zeros_like(vals_mat)
    for fi in range(n_frames):
        order = np.argsort(-vals_mat[:, fi])
        for rk, idx in enumerate(order):
            raw_ranks[idx, fi] = rk

    # Exponentially smooth rank y-positions so overtakes glide like silk
    ranks = np.zeros_like(raw_ranks)
    ranks[:, 0] = raw_ranks[:, 0]
    for fi in range(1, n_frames):
        ranks[:, fi] = 0.80 * ranks[:, fi - 1] + 0.20 * raw_ranks[:, fi]

    surface = skia.Surface(W, H)
    canvas = surface.getCanvas()

    with tempfile.TemporaryDirectory(prefix=f"c203_{ar}_") as td:
        m = synth.Mix(dur, seed=203)
        sound_mod.score(m)
        wav = Path(td) / "audio.wav"
        pcm = (np.clip(m.master(), -1.0, 1.0) * 32767).astype("<i2")
        with wave.open(str(wav), "wb") as wf:
            wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(synth.SR)
            wf.writeframes(pcm.tobytes())

        out_mp4 = HERE / f"C-203-{ar}.mp4"
        proc = subprocess.Popen([
            FFMPEG, "-y",
            "-f", "rawvideo", "-vcodec", "rawvideo",
            "-s", f"{W}x{H}", "-pix_fmt", "rgba", "-r", str(fps), "-i", "-",
            "-i", str(wav),
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20",
            "-c:a", "aac", "-b:a", "128k",
            "-shortest", "-map_metadata", "-1", "-movflags", "+faststart",
            str(out_mp4),
        ], stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        p_ink = skia.Paint(Color=skia.Color(248, 250, 252), AntiAlias=True)
        p_cyan = skia.Paint(Color=skia.Color(103, 232, 249), AntiAlias=True)
        p_muted = skia.Paint(Color=skia.Color(148, 163, 184), AntiAlias=True)
        p_year = skia.Paint(Color=skia.Color(148, 163, 184, 55), AntiAlias=True)
        p_grid = skia.Paint(Color=skia.Color(148, 163, 184, 30), StrokeWidth=1.2)

        for fi in range(n_frames):
            cur_yr = ts[fi]
            cur_vals = vals_mat[:, fi]
            max_v = max(100.0, float(np.max(cur_vals)) * 1.14)

            bg_p = skia.Paint(
                Shader=skia.GradientShader.MakeLinear(
                    points=[(0, 0), (W, H)],
                    colors=[skia.Color(11, 17, 32), skia.Color(6, 9, 19)],
                )
            )
            canvas.drawRect(skia.Rect.MakeWH(W, H), bg_p)

            pad = 48 * sc
            canvas.drawString("BAR CHART RACE · NUMPY + SKIA", pad, pad + 18 * sc, f_sub, p_cyan)
            canvas.drawString("程序化视频路线活跃指数排行（虚构示例）", pad, pad + 56 * sc, f_title, p_ink)

            left_x = pad + (150 if not portrait else 135) * sc
            right_x = W - pad - 76 * sc
            bar_span = right_x - left_x
            top_y = pad + (116 if not portrait else 156) * sc
            row_h = (82 if not portrait else 116) * sc
            bar_h = (50 if not portrait else 58) * sc

            # Vertical reference gridlines
            for g_i in range(5):
                gx = left_x + (g_i / 4.0) * bar_span
                canvas.drawLine(gx, top_y - 16 * sc, gx, top_y + 6 * row_h, p_grid)

            # Giant year watermark bottom-right
            canvas.drawString(f"{int(cur_yr)}", W - pad - (265 if not portrait else 215) * sc, H - pad - 18 * sc, f_year, p_year)

            # Draw 6 racing bars
            for idx, (name, _, (c0, c1)) in enumerate(series):
                v = float(cur_vals[idx])
                rk = float(ranks[idx, fi])
                y = top_y + rk * row_h
                bw = max(14 * sc, (v / max_v) * bar_span)

                canvas.drawString(name, pad, y + bar_h * 0.64, f_lbl, p_ink)

                rect = skia.Rect.MakeXYWH(left_x, y, bw, bar_h)
                rrect = skia.RRect.MakeRectXY(rect, 12 * sc, 12 * sc)
                bp = skia.Paint(
                    AntiAlias=True,
                    Shader=skia.GradientShader.MakeLinear(points=[(left_x, y), (left_x + bw, y)], colors=[c0, c1]),
                )
                canvas.drawRRect(rrect, bp)
                canvas.drawString(f"{int(round(v))}", left_x + bw + 12 * sc, y + bar_h * 0.64, f_val, p_ink)

            # Bottom timeline bar
            prog = fi / max(1, n_frames - 1)
            by = H - pad + 10 * sc
            canvas.drawLine(pad, by, W - pad, by, skia.Paint(Color=skia.Color(51, 65, 85), StrokeWidth=4 * sc, AntiAlias=True))
            canvas.drawLine(pad, by, pad + (W - pad * 2) * prog, by, skia.Paint(Color=skia.Color(56, 189, 248), StrokeWidth=4 * sc, AntiAlias=True))

            proc.stdin.write(surface.makeImageSnapshot().tobytes())

        proc.stdin.close()
        proc.wait()
        if proc.returncode != 0:
            raise RuntimeError("ffmpeg failed for C-203")

        out_jpg = HERE / f"C-203-{ar}.jpg"
        subprocess.run([
            FFMPEG, "-y", "-ss", "3.4", "-i", str(out_mp4),
            "-frames:v", "1", "-q:v", "3", "-map_metadata", "-1",
            str(out_jpg),
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"OK C-203 {ar}: {out_mp4.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    render_ar("16x9")
    render_ar("9x16")
