#!/usr/bin/env python3
"""G-026 历史人物第一视角自拍 Vlog：青水生成虚构唐代年轻工匠定妆照与第一视角逛长安夜市视频，Skia 实时叠加拟真手机前置 REC 取景框、古风定位角标、滚动弹幕与口播大字幕。"""
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


def render_ar(ar: str, dur: float = 8.5, fps: int = 30):
    portrait = ar == "9x16"
    W, H = (720, 1280) if portrait else (1280, 720)
    sc = min(W, H) / 720.0
    n_frames = int(dur * fps)

    tf_zh = load_tf(["/System/Library/Fonts/STHeiti Medium.ttc", "/System/Library/Fonts/Hiragino Sans GB.ttc"])
    tf_mono = load_tf(["/System/Library/Fonts/Menlo.ttc", "/System/Library/Fonts/Courier.ttc"])
    f_sub = skia.Font(tf_zh, (30 if not portrait else 32) * sc)
    f_zh_sm = skia.Font(tf_zh, 16 * sc)
    f_danmu = skia.Font(tf_zh, 18 * sc)
    f_mono = skia.Font(tf_mono, 15 * sc)

    vid = decode_video(HERE / "assets/vlog.mp4", W, H)
    n_vid = len(vid)

    # Scrolling viewer danmaku comments
    danmu = [
        ("唐朝居然也有夜市灯会！", 0.19, 0.5, 1.0),
        ("工匠小哥这自拍构图太稳了", 0.25, 1.8, 0.92),
        ("求问西市胡饼多少钱一个？", 0.31, 3.1, 1.05),
        ("前面的灯笼也太壮观了！！", 0.22, 4.6, 0.96),
        ("AI 历史 Vlog 沉浸感拉满", 0.28, 6.0, 1.0),
    ]
    captions = [
        (0.3, 2.7, "家人们谁懂啊，刚下工就撞上长安开夜市！"),
        (2.8, 5.4, "你们看身后这条西市灯街，整条街全是胡商铺子"),
        (5.5, 8.3, "点赞过万，明天带你们夜探大明宫外墙！"),
    ]

    surface = skia.Surface(W, H)
    canvas = surface.getCanvas()

    with tempfile.TemporaryDirectory(prefix=f"g026_{ar}_") as td:
        m = synth.Mix(dur, seed=260)
        sound_mod.score(m)
        wav = Path(td) / "audio.wav"
        pcm = (np.clip(m.master(), -1.0, 1.0) * 32767).astype("<i2")
        with wave.open(str(wav), "wb") as wf:
            wf.setnchannels(2)
            wf.setsampwidth(2)
            wf.setframerate(synth.SR)
            wf.writeframes(pcm.tobytes())

        out_mp4 = HERE / f"G-026-{ar}.mp4"
        cmd = [
            FFMPEG, "-y", "-f", "rawvideo", "-vcodec", "rawvideo",
            "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
            "-i", str(wav), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
            "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-shortest", str(out_mp4),
        ]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)

        for fi in range(n_frames):
            t = fi / fps
            vidx = min(n_vid - 1, int(fi * (n_vid - 1) / max(1, n_frames - 1)))
            img_sk = skia.Image.fromarray(vid[vidx], colorType=skia.kRGBA_8888_ColorType)
            canvas.drawImage(img_sk, 0, 0)

            # Subtle viewfinder corner brackets
            pad = 28 * sc
            arm = 24 * sc
            bp = skia.Paint(Color=skia.Color(255, 255, 255, 175), Style=skia.Paint.kStroke_Style, StrokeWidth=2.5 * sc)
            for x0, dx in [(pad, 1), (W - pad, -1)]:
                for y0, dy in [(pad, 1), (H - pad, -1)]:
                    canvas.drawLine(x0, y0, x0 + dx * arm, y0, bp)
                    canvas.drawLine(x0, y0, x0, y0 + dy * arm, bp)

            # Top-left REC pill with blinking red dot
            rec_x, rec_y = pad + 18 * sc, pad + 14 * sc
            canvas.drawRoundRect(skia.Rect.MakeXYWH(rec_x, rec_y, 176 * sc, 36 * sc), 18 * sc, 18 * sc, skia.Paint(Color=skia.Color(15, 23, 42, 180)))
            if int(t * 2) % 2 == 0:
                canvas.drawCircle(rec_x + 20 * sc, rec_y + 18 * sc, 6.5 * sc, skia.Paint(Color=skia.Color(239, 68, 68)))
            sec_i = int(t)
            frac_i = int((t - sec_i) * 30)
            canvas.drawString(f"REC  00:0{sec_i}:{frac_i:02d}", rec_x + 36 * sc, rec_y + 23 * sc, f_mono, skia.Paint(Color=skia.Color(248, 250, 252)))

            # Top-right historical GPS location badge
            loc_txt = "长安西市 · 天宝元年"
            lw = f_zh_sm.measureText(loc_txt)
            lx = W - pad - 18 * sc - lw - 28 * sc
            canvas.drawRoundRect(skia.Rect.MakeXYWH(lx, rec_y, lw + 28 * sc, 36 * sc), 18 * sc, 18 * sc, skia.Paint(Color=skia.Color(15, 23, 42, 180)))
            canvas.drawString(loc_txt, lx + 14 * sc, rec_y + 24 * sc, f_zh_sm, skia.Paint(Color=skia.Color(253, 224, 71)))

            # Scrolling danmaku comments
            for text, y_frac, t0, spd in danmu:
                if t < t0:
                    continue
                x = W + 20 * sc - (t - t0) * 230 * sc * spd
                tw = f_danmu.measureText(text)
                if x + tw < -20:
                    continue
                dy = H * y_frac
                canvas.drawRoundRect(skia.Rect.MakeXYWH(x - 12 * sc, dy - 22 * sc, tw + 24 * sc, 30 * sc), 15 * sc, 15 * sc, skia.Paint(Color=skia.Color(15, 23, 42, 135)))
                canvas.drawString(text, x, dy, f_danmu, skia.Paint(Color=skia.Color(255, 255, 255, 235)))

            # Bottom vlog punchy caption
            for c0, c1, ctxt in captions:
                if c0 <= t <= c1:
                    cw = f_sub.measureText(ctxt)
                    cx = (W - cw) / 2.0
                    cy = H - (108 if not portrait else 180) * sc
                    canvas.drawRoundRect(skia.Rect.MakeXYWH(cx - 22 * sc, cy - 36 * sc, cw + 44 * sc, 52 * sc), 12 * sc, 12 * sc, skia.Paint(Color=skia.Color(9, 14, 24, 195)))
                    canvas.drawString(ctxt, cx, cy, f_sub, skia.Paint(Color=skia.Color(254, 240, 138)))

            # Bottom-right AI disclosure
            disc = "AI 生成 · 虚构历史 Vlog"
            dw = f_zh_sm.measureText(disc)
            canvas.drawString(disc, W - pad - 18 * sc - dw, H - pad - 14 * sc, f_zh_sm, skia.Paint(Color=skia.Color(226, 232, 240, 190)))

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
