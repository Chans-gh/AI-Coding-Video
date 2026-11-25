#!/usr/bin/env python3
"""C-211 产品多维横评对比卡：NumPy 计算六维雷达图几何与综合得分，Skia 离屏绘制双机雷达叠加、参数逐项胜出对比表与旋转盖章结论，零浏览器直接输出 MP4。"""
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


def ease_out_back(x: float) -> float:
    x = max(0.0, min(1.0, x))
    c1 = 1.70158
    c3 = c1 + 1.0
    return 1.0 + c3 * ((x - 1.0) ** 3) + c1 * ((x - 1.0) ** 2)


def render_ar(ar: str, dur: float = 4.5, fps: int = 30):
    portrait = ar == "9x16"
    W, H = (720, 1280) if portrait else (1280, 720)
    sc = min(W, H) / 720.0
    n_frames = int(dur * fps)

    tf_zh = load_tf(["/System/Library/Fonts/STHeiti Medium.ttc", "/System/Library/Fonts/Hiragino Sans GB.ttc"])
    tf_mono = load_tf(["/System/Library/Fonts/Menlo.ttc", "/System/Library/Fonts/Courier.ttc"])

    f_eyebrow = skia.Font(tf_mono, 13 * sc)
    f_title = skia.Font(tf_zh, (28 if not portrait else 30) * sc)
    f_sec = skia.Font(tf_zh, 17 * sc)
    f_zh_sm = skia.Font(tf_zh, 15 * sc)
    f_zh_xs = skia.Font(tf_zh, 13 * sc)
    f_mono = skia.Font(tf_mono, 15 * sc)
    f_score = skia.Font(tf_mono, 32 * sc)
    f_stamp = skia.Font(tf_zh, 22 * sc)

    axes = ["性能", "续航", "影像", "屏幕", "手感", "性价比"]
    scores_a = np.array([96, 88, 94, 92, 82, 85], dtype=float)  # Pro X1
    scores_b = np.array([84, 78, 80, 86, 95, 90], dtype=float)  # Air S9
    col_a = skia.Color(56, 189, 248)   # Cyan Blue
    col_b = skia.Color(251, 146, 60)   # Amber Orange

    specs = [
        ("主控芯片", "X4 Pro 3nm", "S9 Lite 4nm", 0),
        ("电池续航", "6200mAh / 18h", "4900mAh / 14h", 0),
        ("主摄光圈", "1\" f/1.4 潜望", "1/1.5\" f/1.8", 0),
        ("机身重量", "218g 钛金属", "164g 超轻薄", 1),
        ("首发定价", "RMB 5,499", "RMB 4,699", 1),
    ]

    surface = skia.Surface(W, H)
    canvas = surface.getCanvas()

    with tempfile.TemporaryDirectory(prefix=f"c211_{ar}_") as td:
        m = synth.Mix(dur, seed=211)
        sound_mod.score(m)
        wav = Path(td) / "audio.wav"
        pcm = (np.clip(m.master(), -1.0, 1.0) * 32767).astype("<i2")
        with wave.open(str(wav), "wb") as wf:
            wf.setnchannels(2)
            wf.setsampwidth(2)
            wf.setframerate(synth.SR)
            wf.writeframes(pcm.tobytes())

        out_mp4 = HERE / f"C-211-{ar}.mp4"
        cmd = [
            FFMPEG, "-y", "-f", "rawvideo", "-vcodec", "rawvideo",
            "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
            "-i", str(wav), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
            "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-shortest", str(out_mp4),
        ]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)

        for fi in range(n_frames):
            t = fi / fps
            canvas.clear(skia.Color(10, 14, 23))

            # Subtle diagonal accents
            gp = skia.Paint(Color=skia.Color(30, 41, 59, 85), StrokeWidth=1.0)
            step = int(48 * sc)
            for gx in range(0, W, step):
                canvas.drawLine(gx, 0, gx, H, gp)
            for gy in range(0, H, step):
                canvas.drawLine(0, gy, W, gy, gp)

            pad = 44 * sc if not portrait else 34 * sc

            # Header
            canvas.drawString("HEAD-TO-HEAD BENCHMARK · 2026 FLAGSHIP", pad, (46 if not portrait else 64) * sc, f_eyebrow, skia.Paint(Color=col_a))
            canvas.drawString("旗舰机型多维横评对比", pad, (82 if not portrait else 104) * sc, f_title, skia.Paint(Color=skia.Color(248, 250, 252)))

            # Legend badges
            lx = W - pad - 280 * sc if not portrait else pad
            ly = (52 if not portrait else 128) * sc
            for idx, (label, col) in enumerate([("Pro X1", col_a), ("Air S9", col_b)]):
                bx = lx + idx * 144 * sc
                canvas.drawRoundRect(skia.Rect.MakeXYWH(bx, ly, 130 * sc, 30 * sc), 15 * sc, 15 * sc, skia.Paint(Color=skia.Color(30, 41, 59, 220)))
                canvas.drawCircle(bx + 18 * sc, ly + 15 * sc, 6 * sc, skia.Paint(Color=col))
                canvas.drawString(label, bx + 34 * sc, ly + 20 * sc, f_mono, skia.Paint(Color=skia.Color(241, 245, 249)))

            # Layout boxes
            if not portrait:
                rad_box = skia.Rect.MakeXYWH(pad, 114 * sc, 510 * sc, 558 * sc)
                tbl_box = skia.Rect.MakeXYWH(pad + 532 * sc, 114 * sc, W - pad * 2 - 532 * sc, 558 * sc)
            else:
                rad_box = skia.Rect.MakeXYWH(pad, 178 * sc, W - pad * 2, 468 * sc)
                tbl_box = skia.Rect.MakeXYWH(pad, 668 * sc, W - pad * 2, 558 * sc)

            for box, stitle in [(rad_box, "六维实测雷达评分"), (tbl_box, "核心规格逐项横评")]:
                canvas.drawRoundRect(box, 18 * sc, 18 * sc, skia.Paint(Color=skia.Color(15, 23, 42, 238)))
                canvas.drawRoundRect(box, 18 * sc, 18 * sc, skia.Paint(Color=skia.Color(148, 163, 184, 52), Style=skia.Paint.kStroke_Style, StrokeWidth=1.2 * sc))
                canvas.drawString(stitle, box.left() + 22 * sc, box.top() + 34 * sc, f_sec, skia.Paint(Color=skia.Color(226, 232, 240)))

            # Radar chart
            cx = rad_box.centerX()
            cy = rad_box.top() + (rad_box.height() * 0.49 if not portrait else rad_box.height() * 0.50)
            R = (165 if not portrait else 148) * sc
            angles = np.linspace(-math.pi / 2, 3 * math.pi / 2, len(axes), endpoint=False)

            # Concentric hex rings
            for lvl in [0.25, 0.5, 0.75, 1.0]:
                path = skia.Path()
                for k, ang in enumerate(angles):
                    px = cx + math.cos(ang) * R * lvl
                    py = cy + math.sin(ang) * R * lvl
                    if k == 0:
                        path.moveTo(px, py)
                    else:
                        path.lineTo(px, py)
                path.close()
                canvas.drawPath(path, skia.Paint(Color=skia.Color(71, 85, 105, 120), Style=skia.Paint.kStroke_Style, StrokeWidth=1.1 * sc, AntiAlias=True))

            # Spokes & labels
            for k, ang in enumerate(angles):
                px = cx + math.cos(ang) * R
                py = cy + math.sin(ang) * R
                canvas.drawLine(cx, cy, px, py, skia.Paint(Color=skia.Color(71, 85, 105, 100), StrokeWidth=1.0))
                lx_a = cx + math.cos(ang) * (R + 28 * sc)
                ly_a = cy + math.sin(ang) * (R + 24 * sc) + 5 * sc
                tw = f_zh_sm.measureText(axes[k])
                canvas.drawString(axes[k], lx_a - tw / 2, ly_a, f_zh_sm, skia.Paint(Color=skia.Color(203, 213, 225)))

            # Animated polygons
            p_b = ease_out_cubic((t - 0.30) / 0.85)
            p_a = ease_out_cubic((t - 0.65) / 0.90)
            for scores, prog, col, fill_a in [(scores_b, p_b, col_b, 58), (scores_a, p_a, col_a, 72)]:
                if prog <= 0.01:
                    continue
                path = skia.Path()
                pts = []
                for k, ang in enumerate(angles):
                    r = (scores[k] / 100.0) * R * prog
                    px = cx + math.cos(ang) * r
                    py = cy + math.sin(ang) * r
                    pts.append((px, py))
                    if k == 0:
                        path.moveTo(px, py)
                    else:
                        path.lineTo(px, py)
                path.close()
                r_c, g_c, b_c = skia.ColorGetR(col), skia.ColorGetG(col), skia.ColorGetB(col)
                canvas.drawPath(path, skia.Paint(Color=skia.Color(r_c, g_c, b_c, fill_a), AntiAlias=True))
                canvas.drawPath(path, skia.Paint(Color=col, Style=skia.Paint.kStroke_Style, StrokeWidth=2.6 * sc, AntiAlias=True))
                for px, py in pts:
                    canvas.drawCircle(px, py, 4.2 * sc, skia.Paint(Color=col, AntiAlias=True))

            # Bottom total scores inside radar box
            score_y = rad_box.bottom() - 26 * sc
            avg_a = float(np.mean(scores_a)) * p_a
            avg_b = float(np.mean(scores_b)) * p_b
            canvas.drawString(f"Pro X1: {avg_a:.1f}", rad_box.left() + 34 * sc, score_y, f_mono, skia.Paint(Color=col_a))
            b_txt = f"Air S9: {avg_b:.1f}"
            canvas.drawString(b_txt, rad_box.right() - f_mono.measureText(b_txt) - 34 * sc, score_y, f_mono, skia.Paint(Color=col_b))

            # Spec comparison table
            tx = tbl_box.left() + 24 * sc
            tw_box = tbl_box.width() - 48 * sc
            col1_x = tx
            col2_x = tx + tw_box * 0.24
            col3_x = tx + tw_box * 0.62

            hdr_y = tbl_box.top() + 72 * sc
            canvas.drawString("评测维度", col1_x, hdr_y, f_zh_xs, skia.Paint(Color=skia.Color(148, 163, 184)))
            canvas.drawString("Pro X1", col2_x, hdr_y, f_mono, skia.Paint(Color=col_a))
            canvas.drawString("Air S9", col3_x, hdr_y, f_mono, skia.Paint(Color=col_b))
            canvas.drawLine(tx, hdr_y + 12 * sc, tx + tw_box, hdr_y + 12 * sc, skia.Paint(Color=skia.Color(51, 65, 85), StrokeWidth=1.2))

            row_h = (64 if not portrait else 62) * sc
            for i, (dim, va, vb, winner) in enumerate(specs):
                p_row = ease_out_cubic((t - 1.15 - i * 0.28) / 0.42)
                if p_row <= 0.01:
                    continue
                ry = hdr_y + 24 * sc + i * row_h
                alpha = int(255 * p_row)
                slide_y = (1.0 - p_row) * 14 * sc
                # Row card
                canvas.drawRoundRect(
                    skia.Rect.MakeXYWH(tx, ry + slide_y, tw_box, row_h - 10 * sc),
                    10 * sc, 10 * sc,
                    skia.Paint(Color=skia.Color(30, 41, 59, int(170 * p_row)))
                )
                ty = ry + slide_y + (row_h - 10 * sc) * 0.64
                canvas.drawString(dim, col1_x + 10 * sc, ty, f_zh_sm, skia.Paint(Color=skia.Color(203, 213, 225, alpha)))

                # Winner highlight pill
                win_x = col2_x - 8 * sc if winner == 0 else col3_x - 8 * sc
                win_col = col_a if winner == 0 else col_b
                r_w, g_w, b_w = skia.ColorGetR(win_col), skia.ColorGetG(win_col), skia.ColorGetB(win_col)
                if p_row > 0.6:
                    canvas.drawRoundRect(
                        skia.Rect.MakeXYWH(win_x, ry + slide_y + 8 * sc, tw_box * 0.35, row_h - 26 * sc),
                        8 * sc, 8 * sc,
                        skia.Paint(Color=skia.Color(r_w, g_w, b_w, int(42 * p_row)))
                    )
                    # Draw crisp vector checkmark on right side of winner pill
                    cx_k = win_x + tw_box * 0.35 - 20 * sc
                    cy_k = ry + slide_y + (row_h - 10 * sc) * 0.50
                    chk = skia.Path()
                    chk.moveTo(cx_k - 5 * sc, cy_k)
                    chk.lineTo(cx_k - 1 * sc, cy_k + 4 * sc)
                    chk.lineTo(cx_k + 6 * sc, cy_k - 5 * sc)
                    canvas.drawPath(chk, skia.Paint(Color=win_col, Style=skia.Paint.kStroke_Style, StrokeWidth=2.2 * sc, StrokeCap=skia.Paint.kRound_Cap, StrokeJoin=skia.Paint.kRound_Join, AntiAlias=True))
                canvas.drawString(va, col2_x, ty, f_zh_xs, skia.Paint(Color=skia.Color(248, 250, 252, alpha) if winner == 0 else skia.Color(148, 163, 184, alpha)))
                canvas.drawString(vb, col3_x, ty, f_zh_xs, skia.Paint(Color=skia.Color(248, 250, 252, alpha) if winner == 1 else skia.Color(148, 163, 184, alpha)))

            # Final verdict bar & stamp at bottom of table box
            v_y = tbl_box.bottom() - 88 * sc
            p_v = ease_out_cubic((t - 2.95) / 0.45)
            if p_v > 0.01:
                canvas.drawRoundRect(
                    skia.Rect.MakeXYWH(tx, v_y, tw_box, 68 * sc),
                    12 * sc, 12 * sc,
                    skia.Paint(Color=skia.Color(14, 116, 144, int(72 * p_v)))
                )
                canvas.drawRoundRect(
                    skia.Rect.MakeXYWH(tx, v_y, tw_box, 68 * sc),
                    12 * sc, 12 * sc,
                    skia.Paint(Color=skia.Color(56, 189, 248, int(200 * p_v)), Style=skia.Paint.kStroke_Style, StrokeWidth=1.5 * sc)
                )
                canvas.drawString("综合推荐：Pro X1（性能 / 续航 / 影像 3:2 胜出）", tx + 18 * sc, v_y + 41 * sc, f_zh_sm, skia.Paint(Color=skia.Color(240, 249, 255, int(255 * p_v))))

            # Impact stamp
            p_st = ease_out_back((t - 3.25) / 0.32)
            if t >= 3.25:
                canvas.save()
                st_cx = tbl_box.right() - 108 * sc
                st_cy = v_y + 24 * sc
                s_scale = 1.65 - 0.65 * min(1.0, p_st)
                canvas.translate(st_cx, st_cy)
                canvas.rotate(-11.0)
                canvas.scale(s_scale, s_scale)
                st_rect = skia.Rect.MakeXYWH(-76 * sc, -24 * sc, 152 * sc, 48 * sc)
                canvas.drawRoundRect(st_rect, 8 * sc, 8 * sc, skia.Paint(Color=skia.Color(239, 68, 68, 42)))
                canvas.drawRoundRect(st_rect, 8 * sc, 8 * sc, skia.Paint(Color=skia.Color(248, 113, 113), Style=skia.Paint.kStroke_Style, StrokeWidth=3.0 * sc))
                st_txt = "编辑推荐"
                sw = f_stamp.measureText(st_txt)
                canvas.drawString(st_txt, -sw / 2, 8 * sc, f_stamp, skia.Paint(Color=skia.Color(254, 202, 202)))
                canvas.restore()

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
