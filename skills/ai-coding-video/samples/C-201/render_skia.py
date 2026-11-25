#!/usr/bin/env python3
"""C-201 Skia 离屏矢量动效：使用 skia-python 在内存离屏画布（skia.Surface）绘制抗锯齿渐变卡片、三组环形进度与发光曲线图，零浏览器直接管道输出 MP4。"""
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


def ease_out_cubic(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 1.0 - (1.0 - x) ** 3


def load_typeface(paths, fallback_name="Helvetica"):
    for p in paths:
        if Path(p).exists():
            tf = skia.Typeface.MakeFromFile(p)
            if tf is not None:
                return tf
    return skia.Typeface(fallback_name)


def render_ar(ar: str, dur: float = 4.0, fps: int = 30):
    portrait = ar == "9x16"
    W, H = (720, 1280) if portrait else (1280, 720)
    sc = min(W, H) / 720.0
    n_frames = int(dur * fps)

    tf_zh = load_typeface(["/System/Library/Fonts/STHeiti Medium.ttc", "/System/Library/Fonts/PingFang.ttc", "/System/Library/Fonts/Hiragino Sans GB.ttc"])
    tf_mono = load_typeface(["/System/Library/Fonts/Menlo.ttc", "/System/Library/Fonts/Courier.ttc"])

    f_title = skia.Font(tf_zh, 34 * sc)
    f_sub = skia.Font(tf_mono, 15 * sc)
    f_card_t = skia.Font(tf_zh, 18 * sc)
    f_num = skia.Font(tf_mono, 28 * sc)
    f_small = skia.Font(tf_mono, 13 * sc)

    surface = skia.Surface(W, H)
    canvas = surface.getCanvas()

    with tempfile.TemporaryDirectory(prefix=f"c201_{ar}_") as td:
        m = synth.Mix(dur, seed=201)
        sound_mod.score(m)
        wav = Path(td) / "audio.wav"
        pcm = (np.clip(m.master(), -1.0, 1.0) * 32767).astype("<i2")
        with wave.open(str(wav), "wb") as wf:
            wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(synth.SR)
            wf.writeframes(pcm.tobytes())

        out_mp4 = HERE / f"C-201-{ar}.mp4"
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

        cards = [
            ("渲染帧率", 0.96, "96%", (skia.Color(56, 189, 248), skia.Color(99, 102, 241))),
            ("抗锯齿度", 0.89, "89%", (skia.Color(168, 85, 247), skia.Color(236, 72, 153))),
            ("内存效率", 0.93, "93%", (skia.Color(52, 211, 153), skia.Color(14, 165, 233))),
        ]

        for fi in range(n_frames):
            t = fi / fps
            # Background radial gradient
            bg_paint = skia.Paint(
                Shader=skia.GradientShader.MakeRadial(
                    center=(W * (0.28 + 0.12 * math.sin(t * 0.9)), H * 0.22),
                    radius=max(W, H) * 0.85,
                    colors=[skia.Color(23, 37, 74), skia.Color(9, 13, 26), skia.Color(4, 6, 13)],
                    positions=[0.0, 0.55, 1.0],
                )
            )
            canvas.drawRect(skia.Rect.MakeWH(W, H), bg_paint)

            # Subtle grid
            grid_p = skia.Paint(Color=skia.Color(148, 163, 184, 18), StrokeWidth=1.0)
            step = int(48 * sc)
            for gx in range(0, W, step):
                canvas.drawLine(gx, 0, gx, H, grid_p)
            for gy in range(0, H, step):
                canvas.drawLine(0, gy, W, gy, grid_p)

            pad = 44 * sc
            # Header
            p_ink = skia.Paint(Color=skia.Color(248, 250, 252), AntiAlias=True)
            p_cyan = skia.Paint(Color=skia.Color(103, 232, 249), AntiAlias=True)
            p_muted = skia.Paint(Color=skia.Color(148, 163, 184), AntiAlias=True)

            canvas.drawString("SKIA-PYTHON · HEADLESS 2D ENGINE", pad, pad + 18 * sc, f_small, p_cyan)
            canvas.drawString("Skia 离屏矢量数据动效", pad, pad + 58 * sc, f_title, p_ink)
            canvas.drawString(f"skia.Surface({W}, {H})  |  C++ 2D Core  |  t = {t:.2f}s", pad, pad + 86 * sc, f_sub, p_muted)

            # 3 Vector Progress Ring Cards
            card_top = pad + (122 if not portrait else 130) * sc
            if portrait:
                cw = W - pad * 2
                ch = 196 * sc
                gap = 20 * sc
            else:
                gap = 24 * sc
                cw = (W - pad * 2 - gap * 2) / 3.0
                ch = 246 * sc

            for idx, (label, target_v, pct_str, (c0, c1)) in enumerate(cards):
                ap = ease_out_cubic((t - (0.18 + idx * 0.22)) / 0.65)
                if portrait:
                    cx0 = pad
                    cy0 = card_top + idx * (ch + gap) + (1.0 - ap) * 36 * sc
                else:
                    cx0 = pad + idx * (cw + gap)
                    cy0 = card_top + (1.0 - ap) * 42 * sc

                rect = skia.Rect.MakeXYWH(cx0, cy0, cw, ch)
                rrect = skia.RRect.MakeRectXY(rect, 18 * sc, 18 * sc)
                card_p = skia.Paint(
                    Color=skia.Color(17, 24, 39, int(218 * ap)),
                    AntiAlias=True,
                    ImageFilter=skia.ImageFilters.DropShadow(0, 12 * sc, 18 * sc, 18 * sc, skia.Color(0, 0, 0, int(110 * ap))),
                )
                canvas.drawRRect(rrect, card_p)
                border_p = skia.Paint(
                    Color=skia.Color(148, 163, 184, int(60 * ap)),
                    Style=skia.Paint.kStroke_Style,
                    StrokeWidth=1.5 * sc,
                    AntiAlias=True,
                )
                canvas.drawRRect(rrect, border_p)

                # Progress ring center
                ring_r = (58 if not portrait else 54) * sc
                rx = cx0 + (cw * 0.5 if not portrait else 96 * sc)
                ry = cy0 + (108 * sc if not portrait else ch * 0.5)
                arc_rect = skia.Rect.MakeXYWH(rx - ring_r, ry - ring_r, ring_r * 2, ring_r * 2)

                track_p = skia.Paint(Color=skia.Color(51, 65, 85, int(150 * ap)), Style=skia.Paint.kStroke_Style, StrokeWidth=11 * sc, AntiAlias=True)
                canvas.drawOval(arc_rect, track_p)

                prog = ease_out_cubic((t - (0.35 + idx * 0.22)) / 1.35) * target_v
                arc_p = skia.Paint(
                    Style=skia.Paint.kStroke_Style,
                    StrokeWidth=11 * sc,
                    StrokeCap=skia.Paint.kRound_Cap,
                    AntiAlias=True,
                    Shader=skia.GradientShader.MakeLinear(points=[(rx - ring_r, ry - ring_r), (rx + ring_r, ry + ring_r)], colors=[c0, c1]),
                )
                canvas.drawArc(arc_rect, -90.0, 360.0 * prog, False, arc_p)

                val_txt = f"{int(round(prog * 100))}%"
                if portrait:
                    canvas.drawString(val_txt, rx - 26 * sc, ry + 10 * sc, f_num, p_ink)
                    canvas.drawString(label, cx0 + 188 * sc, ry - 6 * sc, f_card_t, p_ink)
                    canvas.drawString("OFFSCREEN VECTOR RING", cx0 + 188 * sc, ry + 24 * sc, f_small, p_muted)
                else:
                    canvas.drawString(val_txt, rx - 26 * sc, ry + 10 * sc, f_num, p_ink)
                    canvas.drawString(label, cx0 + 24 * sc, cy0 + ch - 26 * sc, f_card_t, p_ink)

            # Bottom Spline Telemetry Chart
            chart_top = (card_top + ch + 28 * sc) if not portrait else (card_top + 3 * (ch + gap) + 12 * sc)
            chart_h = H - pad - chart_top
            if chart_h > 100 * sc:
                crect = skia.Rect.MakeXYWH(pad, chart_top, W - pad * 2, chart_h)
                crrect = skia.RRect.MakeRectXY(crect, 18 * sc, 18 * sc)
                canvas.drawRRect(crrect, skia.Paint(Color=skia.Color(15, 23, 42, 220), AntiAlias=True))
                canvas.drawRRect(crrect, skia.Paint(Color=skia.Color(56, 189, 248, 85), Style=skia.Paint.kStroke_Style, StrokeWidth=1.4 * sc, AntiAlias=True))
                canvas.drawString("REALTIME VECTOR SPLINE · ZERO BROWSER OVERHEAD", pad + 22 * sc, chart_top + 30 * sc, f_small, p_cyan)

                draw_p = ease_out_cubic((t - 0.5) / 2.9)
                x0, x1 = pad + 26 * sc, W - pad - 26 * sc
                y_bot = chart_top + chart_h - 24 * sc
                y_span = chart_h - 68 * sc
                n_pts = max(2, int(90 * draw_p))
                path = skia.Path()
                fill_path = skia.Path()
                last_x, last_y = x0, y_bot
                for j in range(n_pts):
                    u = j / 89.0
                    px = x0 + u * (x1 - x0)
                    yv = 0.45 + 0.34 * math.sin(u * 9.5 + t * 2.2) + 0.16 * math.cos(u * 4.2 - t * 1.4)
                    py = y_bot - yv * y_span
                    if j == 0:
                        path.moveTo(px, py)
                        fill_path.moveTo(px, y_bot)
                        fill_path.lineTo(px, py)
                    else:
                        path.lineTo(px, py)
                        fill_path.lineTo(px, py)
                    last_x, last_y = px, py
                fill_path.lineTo(last_x, y_bot)
                fill_path.close()

                fill_p = skia.Paint(
                    AntiAlias=True,
                    Shader=skia.GradientShader.MakeLinear(
                        points=[(0, chart_top + 36 * sc), (0, y_bot)],
                        colors=[skia.Color(56, 189, 248, 95), skia.Color(56, 189, 248, 0)],
                    ),
                )
                canvas.drawPath(fill_path, fill_p)
                stroke_p = skia.Paint(Color=skia.Color(56, 189, 248), Style=skia.Paint.kStroke_Style, StrokeWidth=3.2 * sc, AntiAlias=True)
                canvas.drawPath(path, stroke_p)
                canvas.drawCircle(last_x, last_y, 6.5 * sc, skia.Paint(Color=skia.Color(250, 204, 21), AntiAlias=True))

            img = surface.makeImageSnapshot()
            proc.stdin.write(img.tobytes())

        proc.stdin.close()
        proc.wait()
        if proc.returncode != 0:
            raise RuntimeError("ffmpeg failed for C-201")

        out_jpg = HERE / f"C-201-{ar}.jpg"
        subprocess.run([
            FFMPEG, "-y", "-ss", "2.6", "-i", str(out_mp4),
            "-frames:v", "1", "-q:v", "3", "-map_metadata", "-1",
            str(out_jpg),
        ], check=True)
        print(f"OK C-201 {ar}: {out_mp4.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    render_ar("16x9")
    render_ar("9x16")
