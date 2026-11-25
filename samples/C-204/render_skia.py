#!/usr/bin/env python3
"""C-204 金融 K 线行情复盘：NumPy 生成确定性 OHLC 行情与 MA5/MA12 均线，Skia 离屏绘制暗色交易终端 K 线图、成交量柱与突破买点标注，零浏览器直接输出 MP4。"""
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


def render_ar(ar: str, dur: float = 4.5, fps: int = 30):
    portrait = ar == "9x16"
    W, H = (720, 1280) if portrait else (1280, 720)
    sc = min(W, H) / 720.0
    n_frames = int(dur * fps)

    tf_zh = load_tf(["/System/Library/Fonts/STHeiti Medium.ttc", "/System/Library/Fonts/Hiragino Sans GB.ttc"])
    tf_mono = load_tf(["/System/Library/Fonts/Menlo.ttc", "/System/Library/Fonts/Courier.ttc"])
    f_title = skia.Font(tf_zh, 30 * sc)
    f_price = skia.Font(tf_mono, (34 if not portrait else 30) * sc)
    f_sub = skia.Font(tf_mono, 15 * sc)
    f_tag = skia.Font(tf_zh, 16 * sc)

    # Deterministic fictional OHLCV series (48 bars) with consolidation -> breakout rally
    rng = np.random.default_rng(204)
    N = 48
    closes = np.zeros(N)
    opens = np.zeros(N)
    highs = np.zeros(N)
    lows = np.zeros(N)
    vols = np.zeros(N)
    price = 102.0
    for i in range(N):
        drift = 0.05 if i < 20 else (0.95 if i < 38 else 0.35)
        chg = drift + rng.normal(0, 1.35)
        opens[i] = price
        closes[i] = price + chg
        highs[i] = max(opens[i], closes[i]) + abs(rng.normal(0.6, 0.5))
        lows[i] = min(opens[i], closes[i]) - abs(rng.normal(0.6, 0.5))
        vols[i] = rng.uniform(18, 42) * (1.8 if 20 <= i <= 26 else 1.0)
        price = closes[i]

    ma5 = np.convolve(closes, np.ones(5) / 5, mode="same")
    ma12 = np.convolve(closes, np.ones(12) / 12, mode="same")
    for k in range(5):
        ma5[k] = np.mean(closes[:k + 1])
    for k in range(12):
        ma12[k] = np.mean(closes[:k + 1])

    p_min, p_max = float(np.min(lows)) - 2.0, float(np.max(highs)) + 3.0
    v_max = float(np.max(vols)) * 1.15
    breakout_idx = 22

    surface = skia.Surface(W, H)
    canvas = surface.getCanvas()

    with tempfile.TemporaryDirectory(prefix=f"c204_{ar}_") as td:
        m = synth.Mix(dur, seed=204)
        sound_mod.score(m)
        wav = Path(td) / "audio.wav"
        pcm = (np.clip(m.master(), -1.0, 1.0) * 32767).astype("<i2")
        with wave.open(str(wav), "wb") as wf:
            wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(synth.SR)
            wf.writeframes(pcm.tobytes())

        out_mp4 = HERE / f"C-204-{ar}.mp4"
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
        p_muted = skia.Paint(Color=skia.Color(148, 163, 184), AntiAlias=True)
        p_up = skia.Paint(Color=skia.Color(34, 197, 94), AntiAlias=True)
        p_dn = skia.Paint(Color=skia.Color(244, 63, 94), AntiAlias=True)
        p_up_v = skia.Paint(Color=skia.Color(34, 197, 94, 110), AntiAlias=True)
        p_dn_v = skia.Paint(Color=skia.Color(244, 63, 94, 110), AntiAlias=True)
        p_grid = skia.Paint(Color=skia.Color(148, 163, 184, 24), StrokeWidth=1.0)
        p_ma5 = skia.Paint(Color=skia.Color(251, 191, 36), Style=skia.Paint.kStroke_Style, StrokeWidth=2.6 * sc, AntiAlias=True)
        p_ma12 = skia.Paint(Color=skia.Color(56, 189, 248), Style=skia.Paint.kStroke_Style, StrokeWidth=2.6 * sc, AntiAlias=True)

        for fi in range(n_frames):
            t = fi / fps
            vis = max(2, min(N, int(2 + (N - 2) * min(1.0, t / (dur - 0.6)))))

            canvas.drawRect(skia.Rect.MakeWH(W, H), skia.Paint(Color=skia.Color(9, 13, 22)))

            pad = 44 * sc
            cur_p = closes[vis - 1]
            pct = (cur_p / opens[0] - 1.0) * 100.0
            pct_col = p_up if pct >= 0 else p_dn

            # Header ticker bar
            canvas.drawString("DAILY MARKET RECAP · NUMPY + SKIA (DEMO)", pad, pad + 16 * sc, f_sub, p_muted)
            canvas.drawString("AI-IDX 科技指数日线复盘", pad, pad + 52 * sc, f_title, p_ink)
            px_right = W - pad - (290 if not portrait else 245) * sc
            canvas.drawString(f"{cur_p:6.2f}  ({pct:+.1f}%)", px_right, pad + 52 * sc, f_price, pct_col)

            # Chart geometry
            c_left = pad
            c_right = W - pad
            c_top = pad + (92 if not portrait else 120) * sc
            c_mid = H - pad - (150 if not portrait else 220) * sc
            v_top = c_mid + 24 * sc
            v_bot = H - pad - 24 * sc
            c_h = c_mid - c_top
            v_h = v_bot - v_top

            def py(val):
                return c_top + (1.0 - (val - p_min) / (p_max - p_min)) * c_h

            # Horizontal grid + price labels
            for gi in range(5):
                gy = c_top + (gi / 4.0) * c_h
                canvas.drawLine(c_left, gy, c_right, gy, p_grid)
                gv = p_max - (gi / 4.0) * (p_max - p_min)
                canvas.drawString(f"{gv:.0f}", c_left + 4 * sc, gy - 5 * sc, f_sub, p_muted)

            slot = (c_right - c_left) / N
            bw = max(4.0, slot * 0.62)

            # Candlesticks + volume bars
            for i in range(vis):
                cx = c_left + (i + 0.5) * slot
                is_up = closes[i] >= opens[i]
                cp = p_up if is_up else p_dn
                vp = p_up_v if is_up else p_dn_v
                canvas.drawLine(cx, py(highs[i]), cx, py(lows[i]), skia.Paint(Color=cp.getColor(), StrokeWidth=1.8 * sc, AntiAlias=True))
                y0, y1 = py(opens[i]), py(closes[i])
                top_b, bot_b = min(y0, y1), max(y0, y1)
                canvas.drawRect(skia.Rect.MakeXYWH(cx - bw / 2, top_b, bw, max(2.5 * sc, bot_b - top_b)), cp)
                vh = (vols[i] / v_max) * v_h
                canvas.drawRect(skia.Rect.MakeXYWH(cx - bw / 2, v_bot - vh, bw, vh), vp)

            # MA5 & MA12 polylines
            path5, path12 = skia.Path(), skia.Path()
            for i in range(vis):
                cx = c_left + (i + 0.5) * slot
                if i == 0:
                    path5.moveTo(cx, py(ma5[i]))
                    path12.moveTo(cx, py(ma12[i]))
                else:
                    path5.lineTo(cx, py(ma5[i]))
                    path12.lineTo(cx, py(ma12[i]))
            canvas.drawPath(path5, p_ma5)
            canvas.drawPath(path12, p_ma12)

            # Breakout buy signal callout pill once bar 22 appears
            if vis > breakout_idx:
                bx = c_left + (breakout_idx + 0.5) * slot
                by = py(lows[breakout_idx])
                canvas.drawCircle(bx, by + 10 * sc, 6 * sc, skia.Paint(Color=skia.Color(251, 191, 36), AntiAlias=True))
                pill_x = max(c_left + 10 * sc, min(c_right - 220 * sc, bx - 90 * sc))
                pill_y = min(c_mid - 48 * sc, by + 24 * sc)
                pr = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(pill_x, pill_y, 210 * sc, 36 * sc), 9 * sc, 9 * sc)
                canvas.drawRRect(pr, skia.Paint(Color=skia.Color(20, 83, 45, 230), AntiAlias=True))
                canvas.drawRRect(pr, skia.Paint(Color=skia.Color(34, 197, 94), Style=skia.Paint.kStroke_Style, StrokeWidth=1.5 * sc, AntiAlias=True))
                canvas.drawString("金叉突破买点 · 放量", pill_x + 14 * sc, pill_y + 24 * sc, f_tag, p_ink)

            # Legend bottom
            canvas.drawString("MA5 (GOLD)   MA12 (CYAN)   VOLUME", pad, H - pad + 4 * sc, f_sub, p_muted)

            proc.stdin.write(surface.makeImageSnapshot().tobytes())

        proc.stdin.close()
        proc.wait()
        if proc.returncode != 0:
            raise RuntimeError("ffmpeg failed for C-204")

        out_jpg = HERE / f"C-204-{ar}.jpg"
        subprocess.run([
            FFMPEG, "-y", "-ss", "3.4", "-i", str(out_mp4),
            "-frames:v", "1", "-q:v", "3", "-map_metadata", "-1",
            str(out_jpg),
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"OK C-204 {ar}: {out_mp4.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    render_ar("16x9")
    render_ar("9x16")
