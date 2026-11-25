#!/usr/bin/env python3
"""C-205 千人千面年度报告：Skia 离屏绘制 Wrapped 风格个人年度总结，含 52 周打卡热力图波浪点亮、核心指标滚动计数与成就徽章，零浏览器直接输出 MP4。"""
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


def ease_out(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 1.0 - (1.0 - x) ** 3


def render_ar(ar: str, dur: float = 4.0, fps: int = 30):
    portrait = ar == "9x16"
    W, H = (720, 1280) if portrait else (1280, 720)
    sc = min(W, H) / 720.0
    n_frames = int(dur * fps)

    tf_zh = load_tf(["/System/Library/Fonts/STHeiti Medium.ttc", "/System/Library/Fonts/Hiragino Sans GB.ttc"])
    tf_mono = load_tf(["/System/Library/Fonts/Menlo.ttc", "/System/Library/Fonts/Courier.ttc"])
    f_badge = skia.Font(tf_mono, 15 * sc)
    f_title = skia.Font(tf_zh, (38 if not portrait else 34) * sc)
    f_big = skia.Font(tf_mono, (66 if not portrait else 58) * sc)
    f_lbl = skia.Font(tf_zh, 18 * sc)
    f_small = skia.Font(tf_mono, 13 * sc)

    # Deterministic 52x7 activity heatmap (levels 0..4)
    rng = np.random.default_rng(205)
    weeks = 44 if not portrait else 26
    heat = rng.choice([0, 1, 2, 3, 4], size=(weeks, 7), p=[0.22, 0.24, 0.24, 0.18, 0.12])
    palette = [
        skia.Color(30, 41, 59),
        skia.Color(6, 95, 70),
        skia.Color(16, 185, 129),
        skia.Color(52, 211, 153),
        skia.Color(110, 231, 183),
    ]

    surface = skia.Surface(W, H)
    canvas = surface.getCanvas()

    with tempfile.TemporaryDirectory(prefix=f"c205_{ar}_") as td:
        m = synth.Mix(dur, seed=205)
        sound_mod.score(m)
        wav = Path(td) / "audio.wav"
        pcm = (np.clip(m.master(), -1.0, 1.0) * 32767).astype("<i2")
        with wave.open(str(wav), "wb") as wf:
            wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(synth.SR)
            wf.writeframes(pcm.tobytes())

        out_mp4 = HERE / f"C-205-{ar}.mp4"
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
        p_em = skia.Paint(Color=skia.Color(52, 211, 153), AntiAlias=True)
        p_cyan = skia.Paint(Color=skia.Color(56, 189, 248), AntiAlias=True)
        p_gold = skia.Paint(Color=skia.Color(251, 191, 36), AntiAlias=True)
        p_muted = skia.Paint(Color=skia.Color(148, 163, 184), AntiAlias=True)

        for fi in range(n_frames):
            t = fi / fps
            bg_p = skia.Paint(
                Shader=skia.GradientShader.MakeRadial(
                    center=(W * (0.75 - 0.15 * math.sin(t)), H * 0.2),
                    radius=max(W, H) * 0.9,
                    colors=[skia.Color(17, 45, 58), skia.Color(11, 17, 32), skia.Color(6, 9, 18)],
                    positions=[0.0, 0.5, 1.0],
                )
            )
            canvas.drawRect(skia.Rect.MakeWH(W, H), bg_p)

            pad = 48 * sc
            canvas.drawString("2026 WRAPPED · PERSONALIZED RECAP · SKIA", pad, pad + 18 * sc, f_badge, p_em)
            canvas.drawString("@Creator 的年度创作报告", pad, pad + 62 * sc, f_title, p_ink)

            # 3 Rolling Hero Stats
            p_cnt = ease_out(t / 2.2)
            stats = [
                (f"{int(round(312 * p_cnt))}", "活跃创作天数", p_em),
                (f"{int(round(1480 * p_cnt)):,}", "全年代码提交", p_cyan),
                (f"TOP {max(1, int(round(10 - 8 * p_cnt)))}%", "超越全站创作者", p_gold),
            ]
            st_top = pad + (98 if not portrait else 118) * sc
            if portrait:
                sw = W - pad * 2
                sh = 112 * sc
                sgap = 16 * sc
            else:
                sgap = 22 * sc
                sw = (W - pad * 2 - sgap * 2) / 3.0
                sh = 148 * sc

            for idx, (num_s, lbl_s, paint_c) in enumerate(stats):
                sx = pad if portrait else pad + idx * (sw + sgap)
                sy = (st_top + idx * (sh + sgap)) if portrait else st_top
                rrect = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(sx, sy, sw, sh), 18 * sc, 18 * sc)
                canvas.drawRRect(rrect, skia.Paint(Color=skia.Color(15, 23, 42, 215), AntiAlias=True))
                canvas.drawRRect(rrect, skia.Paint(Color=skia.Color(148, 163, 184, 55), Style=skia.Paint.kStroke_Style, StrokeWidth=1.4 * sc, AntiAlias=True))
                if portrait:
                    canvas.drawString(num_s, sx + 26 * sc, sy + 72 * sc, f_big, paint_c)
                    canvas.drawString(lbl_s, sx + sw - 165 * sc, sy + 64 * sc, f_lbl, p_ink)
                else:
                    canvas.drawString(num_s, sx + 24 * sc, sy + 78 * sc, f_big, paint_c)
                    canvas.drawString(lbl_s, sx + 24 * sc, sy + 118 * sc, f_lbl, p_muted)

            # Contribution Heatmap Card
            hm_top = (st_top + sh + 26 * sc) if not portrait else (st_top + 3 * (sh + sgap) + 18 * sc)
            hm_h = (255 if not portrait else 310) * sc
            hm_rect = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(pad, hm_top, W - pad * 2, hm_h), 20 * sc, 20 * sc)
            canvas.drawRRect(hm_rect, skia.Paint(Color=skia.Color(15, 23, 42, 225), AntiAlias=True))
            canvas.drawRRect(hm_rect, skia.Paint(Color=skia.Color(52, 211, 153, 85), Style=skia.Paint.kStroke_Style, StrokeWidth=1.5 * sc, AntiAlias=True))
            canvas.drawString("ANNUAL CONTRIBUTION HEATMAP · 52 WEEKS", pad + 24 * sc, hm_top + 34 * sc, f_small, p_em)

            gx0 = pad + 24 * sc
            gy0 = hm_top + 56 * sc
            cell_span = (W - pad * 2 - 48 * sc) / weeks
            cell = min(22 * sc, cell_span * 0.78)
            reveal_w = ease_out((t - 0.25) / 2.4) * weeks

            for w_i in range(weeks):
                if w_i > reveal_w:
                    continue
                for d_i in range(7):
                    lv = int(heat[w_i, d_i])
                    cx = gx0 + w_i * cell_span
                    cy = gy0 + d_i * (cell + 6 * sc)
                    cr = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(cx, cy, cell, cell), 4 * sc, 4 * sc)
                    canvas.drawRRect(cr, skia.Paint(Color=palette[lv], AntiAlias=True))

            # Achievement badge row bottom
            by = H - pad - 18 * sc
            canvas.drawString("年度勋章：深夜代码手 · 连续 60 天打卡 · 全栈自动化达人", pad, by, f_lbl, p_muted)

            proc.stdin.write(surface.makeImageSnapshot().tobytes())

        proc.stdin.close()
        proc.wait()
        if proc.returncode != 0:
            raise RuntimeError("ffmpeg failed for C-205")

        out_jpg = HERE / f"C-205-{ar}.jpg"
        subprocess.run([
            FFMPEG, "-y", "-ss", "2.9", "-i", str(out_mp4),
            "-frames:v", "1", "-q:v", "3", "-map_metadata", "-1",
            str(out_jpg),
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"OK C-205 {ar}: {out_mp4.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    render_ar("16x9")
    render_ar("9x16")
