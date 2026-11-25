#!/usr/bin/env python3
"""C-210 财报与经营 KPI 拆解盘：NumPy 驱动季度经营数据与同比计算，Skia 离屏绘制 3 张核心 KPI 翻牌计数卡、营收拆解瀑布图与转化漏斗，零浏览器直接输出 MP4。"""
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


def ease_out_cubic(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 1.0 - (1.0 - x) ** 3


def render_ar(ar: str, dur: float = 4.5, fps: int = 30):
    portrait = ar == "9x16"
    W, H = (720, 1280) if portrait else (1280, 720)
    sc = min(W, H) / 720.0
    n_frames = int(dur * fps)

    tf_zh = load_tf(["/System/Library/Fonts/STHeiti Medium.ttc", "/System/Library/Fonts/Hiragino Sans GB.ttc"])
    tf_mono = load_tf(["/System/Library/Fonts/Menlo.ttc", "/System/Library/Fonts/Courier.ttc"])

    f_eyebrow = skia.Font(tf_mono, 13 * sc)
    f_title = skia.Font(tf_zh, (28 if not portrait else 30) * sc)
    f_k_lbl = skia.Font(tf_zh, 15 * sc)
    f_k_val = skia.Font(tf_mono, (30 if not portrait else 26) * sc)
    f_k_delta = skia.Font(tf_mono, 14 * sc)
    f_sec = skia.Font(tf_zh, 17 * sc)
    f_bar = skia.Font(tf_zh, 13 * sc)
    f_num = skia.Font(tf_mono, 13 * sc)

    kpis = [
        ("季度总营收", 48.6, "亿", "+28.4% YoY", skia.Color(56, 189, 248)),
        ("综合毛利率", 64.2, "%", "+3.1pp", skia.Color(52, 211, 153)),
        ("经营净现金流", 12.3, "亿", "+41.2% YoY", skia.Color(251, 191, 36)),
    ]

    # Waterfall bridge: Revenue (48.6) -> COGS (-17.4) -> R&D (-9.2) -> S&M (-8.1) -> Net Profit (13.9)
    wf_items = [
        ("总营收", 0.0, 48.6, skia.Color(56, 189, 248), "+48.6"),
        ("营业成本", 31.2, 48.6, skia.Color(248, 113, 113), "-17.4"),
        ("研发投入", 22.0, 31.2, skia.Color(251, 146, 60), "-9.2"),
        ("销售管理", 13.9, 22.0, skia.Color(251, 191, 36), "-8.1"),
        ("净利润", 0.0, 13.9, skia.Color(52, 211, 153), "+13.9"),
    ]

    funnel_items = [
        ("曝光触达", 100.0, "12.8M", skia.Color(56, 189, 248)),
        ("产品试用", 44.0, "5.63M", skia.Color(99, 102, 241)),
        ("核心活跃", 24.5, "3.14M", skia.Color(168, 85, 247)),
        ("付费转化", 11.8, "1.51M", skia.Color(52, 211, 153)),
    ]

    surface = skia.Surface(W, H)
    canvas = surface.getCanvas()

    with tempfile.TemporaryDirectory(prefix=f"c210_{ar}_") as td:
        m = synth.Mix(dur, seed=210)
        sound_mod.score(m)
        wav = Path(td) / "audio.wav"
        pcm = (np.clip(m.master(), -1.0, 1.0) * 32767).astype("<i2")
        with wave.open(str(wav), "wb") as wf:
            wf.setnchannels(2)
            wf.setsampwidth(2)
            wf.setframerate(synth.SR)
            wf.writeframes(pcm.tobytes())

        out_mp4 = HERE / f"C-210-{ar}.mp4"
        cmd = [
            FFMPEG, "-y", "-f", "rawvideo", "-vcodec", "rawvideo",
            "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
            "-i", str(wav), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
            "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-shortest", str(out_mp4),
        ]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)

        for fi in range(n_frames):
            t = fi / fps
            canvas.clear(skia.Color(9, 14, 24))

            # Subtle grid
            grid_p = skia.Paint(Color=skia.Color(30, 41, 59, 95), StrokeWidth=1.0)
            step = int(48 * sc)
            for gx in range(0, W, step):
                canvas.drawLine(gx, 0, gx, H, grid_p)
            for gy in range(0, H, step):
                canvas.drawLine(0, gy, W, gy, grid_p)

            pad = 44 * sc if not portrait else 34 * sc
            # Header
            canvas.drawString("Q3 2026 EARNINGS · FINANCIAL BRIEF", pad, (46 if not portrait else 64) * sc, f_eyebrow, skia.Paint(Color=skia.Color(56, 189, 248)))
            canvas.drawString("财报与经营 KPI 拆解盘", pad, (82 if not portrait else 104) * sc, f_title, skia.Paint(Color=skia.Color(248, 250, 252)))

            # Live quarter badge on right
            badge_r = skia.Rect.MakeXYWH(W - pad - 148 * sc, (44 if not portrait else 62) * sc, 148 * sc, 34 * sc)
            canvas.drawRoundRect(badge_r, 17 * sc, 17 * sc, skia.Paint(Color=skia.Color(16, 185, 129, 36)))
            canvas.drawRoundRect(badge_r, 17 * sc, 17 * sc, skia.Paint(Color=skia.Color(52, 211, 153, 150), Style=skia.Paint.kStroke_Style, StrokeWidth=1.2 * sc))
            canvas.drawString("NON-GAAP · RMB", badge_r.left() + 14 * sc, badge_r.top() + 22 * sc, f_num, skia.Paint(Color=skia.Color(110, 231, 183)))

            # KPI row
            kpi_y = (108 if not portrait else 136) * sc
            kpi_h = (118 if not portrait else 112) * sc
            kpi_gap = 16 * sc
            kpi_w = (W - pad * 2 - kpi_gap * 2) / 3.0 if not portrait else (W - pad * 2)

            for i, (lbl, target_v, unit, delta, col) in enumerate(kpis):
                p_k = ease_out_cubic((t - 0.12 - i * 0.16) / 0.95)
                if not portrait:
                    kx = pad + i * (kpi_w + kpi_gap)
                    ky = kpi_y
                    kw, kh = kpi_w, kpi_h
                else:
                    kx = pad
                    ky = kpi_y + i * (kpi_h * 0.84 + 12 * sc)
                    kw, kh = kpi_w, kpi_h * 0.84

                rect = skia.Rect.MakeXYWH(kx, ky, kw, kh)
                canvas.drawRoundRect(rect, 14 * sc, 14 * sc, skia.Paint(Color=skia.Color(17, 25, 40, 235)))
                canvas.drawRoundRect(rect, 14 * sc, 14 * sc, skia.Paint(Color=skia.Color(148, 163, 184, 52), Style=skia.Paint.kStroke_Style, StrokeWidth=1.2 * sc))
                # Left accent bar
                canvas.drawRoundRect(skia.Rect.MakeXYWH(kx, ky + 16 * sc, 4 * sc, kh - 32 * sc), 2 * sc, 2 * sc, skia.Paint(Color=col))

                val_now = target_v * p_k
                val_str = f"{val_now:.1f}"
                if not portrait:
                    canvas.drawString(lbl, kx + 20 * sc, ky + 32 * sc, f_k_lbl, skia.Paint(Color=skia.Color(148, 163, 184)))
                    canvas.drawString(val_str, kx + 20 * sc, ky + 76 * sc, f_k_val, skia.Paint(Color=skia.Color(248, 250, 252)))
                    canvas.drawString(unit, kx + 20 * sc + f_k_val.measureText(val_str) + 6 * sc, ky + 74 * sc, f_k_lbl, skia.Paint(Color=skia.Color(148, 163, 184)))
                    canvas.drawString(delta, kx + 20 * sc, ky + 102 * sc, f_k_delta, skia.Paint(Color=col))
                else:
                    canvas.drawString(lbl, kx + 20 * sc, ky + 34 * sc, f_k_lbl, skia.Paint(Color=skia.Color(148, 163, 184)))
                    canvas.drawString(delta, kx + 20 * sc, ky + 68 * sc, f_k_delta, skia.Paint(Color=col))
                    tw = f_k_val.measureText(val_str)
                    canvas.drawString(val_str, kx + kw - tw - 48 * sc, ky + 58 * sc, f_k_val, skia.Paint(Color=skia.Color(248, 250, 252)))
                    canvas.drawString(unit, kx + kw - 40 * sc, ky + 56 * sc, f_k_lbl, skia.Paint(Color=skia.Color(148, 163, 184)))

            # Panels: Waterfall + Funnel
            if not portrait:
                wf_box = skia.Rect.MakeXYWH(pad, 252 * sc, 720 * sc, 416 * sc)
                fn_box = skia.Rect.MakeXYWH(pad + 742 * sc, 252 * sc, W - pad * 2 - 742 * sc, 416 * sc)
            else:
                wf_box = skia.Rect.MakeXYWH(pad, 466 * sc, W - pad * 2, 384 * sc)
                fn_box = skia.Rect.MakeXYWH(pad, 872 * sc, W - pad * 2, 354 * sc)

            for box, sec_title in [(wf_box, "利润拆解瀑布图（单位：亿元）"), (fn_box, "季度增长转化漏斗")]:
                canvas.drawRoundRect(box, 16 * sc, 16 * sc, skia.Paint(Color=skia.Color(15, 23, 42, 235)))
                canvas.drawRoundRect(box, 16 * sc, 16 * sc, skia.Paint(Color=skia.Color(148, 163, 184, 50), Style=skia.Paint.kStroke_Style, StrokeWidth=1.2 * sc))
                canvas.drawString(sec_title, box.left() + 22 * sc, box.top() + 34 * sc, f_sec, skia.Paint(Color=skia.Color(226, 232, 240)))

            # Draw Waterfall bars
            chart_l = wf_box.left() + 26 * sc
            chart_r = wf_box.right() - 26 * sc
            chart_t = wf_box.top() + 68 * sc
            chart_b = wf_box.bottom() - 52 * sc
            chart_h = chart_b - chart_t
            max_v = 54.0

            # Horizontal guide lines
            for v_tick in [0, 15, 30, 45]:
                gy = chart_b - (v_tick / max_v) * chart_h
                canvas.drawLine(chart_l, gy, chart_r, gy, skia.Paint(Color=skia.Color(51, 65, 85, 130), StrokeWidth=1.0))

            n_wf = len(wf_items)
            slot_w = (chart_r - chart_l) / n_wf
            bar_w = slot_w * 0.56
            for i, (name, lo, hi, col, tag) in enumerate(wf_items):
                p_b = ease_out_cubic((t - 0.95 - i * 0.25) / 0.55)
                bx = chart_l + i * slot_w + (slot_w - bar_w) / 2
                y_top_full = chart_b - (hi / max_v) * chart_h
                y_bot_full = chart_b - (lo / max_v) * chart_h
                cur_h = (y_bot_full - y_top_full) * p_b
                y_top = y_bot_full - cur_h
                if cur_h > 1:
                    canvas.drawRoundRect(skia.Rect.MakeXYWH(bx, y_top, bar_w, cur_h), 6 * sc, 6 * sc, skia.Paint(Color=col))
                if p_b > 0.3:
                    tw = f_num.measureText(tag)
                    canvas.drawString(tag, bx + (bar_w - tw) / 2, y_top - 8 * sc, f_num, skia.Paint(Color=skia.Color(241, 245, 249)))
                lw = f_bar.measureText(name)
                canvas.drawString(name, bx + (bar_w - lw) / 2, chart_b + 24 * sc, f_bar, skia.Paint(Color=skia.Color(148, 163, 184)))

            # Draw Funnel bars
            fn_l = fn_box.left() + 24 * sc
            fn_w_max = fn_box.width() - 48 * sc
            fn_y0 = fn_box.top() + 72 * sc
            row_h = (fn_box.height() - 96 * sc) / len(funnel_items)
            for i, (stage, pct, cnt_str, col) in enumerate(funnel_items):
                p_f = ease_out_cubic((t - 1.75 - i * 0.24) / 0.6)
                ry = fn_y0 + i * row_h
                bw = fn_w_max * (0.28 + 0.72 * (pct / 100.0)) * p_f
                bx = fn_l + (fn_w_max - bw) / 2
                bh = row_h * 0.56
                canvas.drawRoundRect(skia.Rect.MakeXYWH(fn_l, ry, fn_w_max, bh), 8 * sc, 8 * sc, skia.Paint(Color=skia.Color(30, 41, 59, 140)))
                if bw > 4:
                    canvas.drawRoundRect(skia.Rect.MakeXYWH(bx, ry, bw, bh), 8 * sc, 8 * sc, skia.Paint(Color=col))
                canvas.drawString(stage, fn_l + 10 * sc, ry + bh * 0.68, f_bar, skia.Paint(Color=skia.Color(248, 250, 252)))
                info = f"{cnt_str} ({pct:.1f}%)"
                iw = f_num.measureText(info)
                canvas.drawString(info, fn_l + fn_w_max - iw - 10 * sc, ry + bh * 0.68, f_num, skia.Paint(Color=skia.Color(248, 250, 252)))

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
