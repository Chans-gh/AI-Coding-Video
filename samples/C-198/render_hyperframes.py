#!/usr/bin/env python3
"""C-198 HyperFrames 编排发布片：用真实 HyperFrames CLI 渲染横竖两版 HTML/CSS/GSAP 合成，
混入 sound.py 电子音并导出封面图。
"""
import os
import shutil
import subprocess
import sys
import tempfile
import wave
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
SAMPLES = HERE.parent
sys.path.insert(0, str(SAMPLES / "lib"))
import synth
import sound as sound_mod

FFMPEG = str(Path.home() / ".local/bin/ffmpeg")
GSAP_LOCAL = SAMPLES / "node_modules/gsap/dist/gsap.min.js"


def build_html(ar: str, gsap_src: str) -> str:
    portrait = ar == "9x16"
    w, h = (1080, 1920) if portrait else (1920, 1080)
    res_attr = "portrait" if portrait else "landscape"
    pad_x = 64 if portrait else 110
    grid_cols = "1fr" if portrait else "repeat(3, 1fr)"
    h1_size = 76 if portrait else 92
    num_size = 112 if portrait else 136
    return f"""<!doctype html>
<html lang="zh-CN" data-resolution="{res_attr}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width={w}, height={h}" />
  <script src="{gsap_src}"></script>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    html, body {{
      width: {w}px; height: {h}px; overflow: hidden;
      background: radial-gradient(circle at 20% 20%, #172554 0%, #090d1a 55%, #04060d 100%);
      color: #f8fafc;
      font-family: "PingFang SC", "Noto Sans SC", -apple-system, sans-serif;
    }}
    #root {{
      position: relative; width: {w}px; height: {h}px;
    }}
    .sec-top {{
      position: absolute; left: {pad_x}px; right: {pad_x}px; top: {110 if portrait else 78}px;
    }}
    .sec-cards {{
      position: absolute; left: {pad_x}px; right: {pad_x}px; top: {520 if portrait else 390}px;
    }}
    .sec-finale {{
      position: absolute; left: {pad_x}px; right: {pad_x}px; bottom: {120 if portrait else 82}px;
    }}
    .grid-bg {{
      position: absolute; inset: 0; pointer-events: none;
      background-image:
        linear-gradient(rgba(56,189,248,0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(56,189,248,0.08) 1px, transparent 1px);
      background-size: 56px 56px;
    }}
    .sweep {{
      position: absolute; top: 0; bottom: 0; width: 220px; left: -260px;
      background: linear-gradient(90deg, transparent, rgba(56,189,248,0.28), transparent);
      transform: skewX(-18deg); pointer-events: none;
    }}
    .badge {{
      display: inline-flex; align-items: center; gap: 10px;
      padding: 10px 20px; border-radius: 999px;
      background: rgba(56,189,248,0.14); border: 1.5px solid rgba(56,189,248,0.45);
      font-family: "Menlo", monospace; font-size: 18px; color: #7dd3fc; letter-spacing: 0.08em;
      width: fit-content;
    }}
    .hero {{ position: relative; z-index: 2; margin-top: {36 if portrait else 24}px; }}
    .hero h1 {{ font-size: {h1_size}px; font-weight: 800; line-height: 1.08; letter-spacing: -0.03em; }}
    .hero h1 span {{
      background: linear-gradient(90deg, #38bdf8, #818cf8, #e879f9);
      -webkit-background-clip: text; color: transparent;
    }}
    .hero p {{ font-size: 26px; color: #94a3b8; margin-top: 18px; }}
    .cards {{
      position: relative; z-index: 2;
      display: grid; grid-template-columns: {grid_cols}; gap: 24px;
      margin: {32 if portrait else 20}px 0;
    }}
    .card {{
      padding: 30px; border-radius: 22px;
      background: linear-gradient(155deg, rgba(30,41,59,0.85), rgba(15,23,42,0.92));
      border: 1.5px solid rgba(148,163,184,0.22);
      box-shadow: 0 24px 60px rgba(0,0,0,0.45);
    }}
    .card .k {{ font-family: "Menlo", monospace; font-size: 16px; color: #38bdf8; }}
    .card .v {{ font-size: 46px; font-weight: 800; margin-top: 10px; font-family: "Menlo", monospace; }}
    .card .d {{ font-size: 20px; color: #94a3b8; margin-top: 8px; }}
    .finale {{
      position: relative; z-index: 2;
      display: flex; align-items: baseline; justify-content: space-between;
      padding: 28px 36px; border-radius: 24px;
      background: linear-gradient(135deg, rgba(14,165,233,0.18), rgba(99,102,241,0.18));
      border: 1.5px solid rgba(56,189,248,0.45);
    }}
    .finale .big {{ font-size: {num_size}px; font-weight: 900; font-family: "Menlo", monospace; color: #38bdf8; line-height: 1; }}
    .finale .meta {{ text-align: right; }}
    .finale .meta strong {{ display: block; font-size: 32px; color: #f8fafc; }}
    .finale .meta span {{ font-size: 20px; color: #94a3b8; font-family: "Menlo", monospace; }}
  </style>
</head>
<body>
  <div id="root" data-composition-id="main" data-start="0" data-duration="4.5" data-width="{w}" data-height="{h}">
    <div class="grid-bg"></div>
    <div class="sweep" id="sweep"></div>

    <div class="clip sec-top" data-start="0" data-duration="4.5" data-track-index="0">
      <div class="badge" id="badge">HYPERFRAMES v0.9 · DECLARATIVE HTML VIDEO</div>
      <div class="hero" id="hero">
        <h1>写网页，直接<span>渲染成片</span></h1>
        <p>HTML / CSS / SVG 声明式时间轴 · 确定性逐帧导出 MP4</p>
      </div>
    </div>

    <div class="cards clip sec-cards" data-start="0.9" data-duration="3.6" data-track-index="1">
      <div class="card" id="c1"><div class="k">01 · TIMELINE</div><div class="v">30 FPS</div><div class="d">GSAP 时间轴精确逐帧寻址</div></div>
      <div class="card" id="c2"><div class="k">02 · LAYOUT</div><div class="v">CSS Grid</div><div class="d">原生响应式横竖屏排版</div></div>
      <div class="card" id="c3"><div class="k">03 · EXPORT</div><div class="v">MP4 / H.264</div><div class="d">零手动剪辑，一键自动化出片</div></div>
    </div>

    <div class="finale clip sec-finale" id="finale" data-start="2.4" data-duration="2.1" data-track-index="2">
      <div class="big" id="bigNum">10×</div>
      <div class="meta">
        <strong>代码编排发布片</strong>
        <span>HyperFrames · {w}×{h}</span>
      </div>
    </div>
  </div>
  <script>
    window.__timelines = window.__timelines || {{}};
    const tl = gsap.timeline({{ paused: true }});
    tl.fromTo("#badge", {{ opacity: 0, y: -24 }}, {{ opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }}, 0.05)
      .fromTo("#hero", {{ opacity: 0, y: 42 }}, {{ opacity: 1, y: 0, duration: 0.65, ease: "power4.out" }}, 0.2)
      .fromTo("#sweep", {{ left: -260 }}, {{ left: {w + 260}, duration: 1.1, ease: "power2.inOut" }}, 0.55)
      .fromTo("#c1", {{ opacity: 0, y: 56, scale: 0.94 }}, {{ opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(1.4)" }}, 1.05)
      .fromTo("#c2", {{ opacity: 0, y: 56, scale: 0.94 }}, {{ opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(1.4)" }}, 1.32)
      .fromTo("#c3", {{ opacity: 0, y: 56, scale: 0.94 }}, {{ opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(1.4)" }}, 1.58)
      .fromTo("#sweep", {{ left: -260 }}, {{ left: {w + 260}, duration: 0.95, ease: "power2.inOut" }}, 2.45)
      .fromTo("#finale", {{ opacity: 0, y: 48, scale: 0.95 }}, {{ opacity: 1, y: 0, scale: 1, duration: 0.65, ease: "expo.out" }}, 2.75)
      .fromTo("#bigNum", {{ scale: 0.72 }}, {{ scale: 1, duration: 0.55, ease: "back.out(1.7)" }}, 2.85);
    window.__timelines["main"] = tl;
    tl.seek(0);
  </script>
</body>
</html>
"""


def render_ar(ar: str, dur: float = 4.5):
    with tempfile.TemporaryDirectory(prefix=f"c198_{ar}_") as td:
        proj = Path(td)
        shutil.copy2(GSAP_LOCAL, proj / "gsap.min.js")
        (proj / "index.html").write_text(build_html(ar, "./gsap.min.js"), encoding="utf-8")
        raw_mp4 = proj / "raw.mp4"
        env = os.environ.copy()
        env["PATH"] = str(Path.home() / ".local/bin") + ":" + env.get("PATH", "")
        env["HYPERFRAMES_TELEMETRY"] = "0"
        subprocess.run(
            ["npx", "--prefix", str(SAMPLES), "hyperframes", "render", str(proj), "-f", "30", "-o", str(raw_mp4)],
            check=True, env=env,
        )

        m = synth.Mix(dur, seed=198)
        sound_mod.score(m)
        wav = proj / "audio.wav"
        pcm = (np.clip(m.master(), -1.0, 1.0) * 32767).astype("<i2")
        with wave.open(str(wav), "wb") as wf:
            wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(synth.SR)
            wf.writeframes(pcm.tobytes())

        out_mp4 = HERE / f"C-198-{ar}.mp4"
        subprocess.run([
            FFMPEG, "-y",
            "-i", str(raw_mp4),
            "-i", str(wav),
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22",
            "-c:a", "aac", "-b:a", "128k",
            "-shortest", "-map_metadata", "-1", "-movflags", "+faststart",
            str(out_mp4),
        ], check=True)

        out_jpg = HERE / f"C-198-{ar}.jpg"
        subprocess.run([
            FFMPEG, "-y", "-ss", "3.4", "-i", str(out_mp4),
            "-frames:v", "1", "-q:v", "3", "-map_metadata", "-1",
            str(out_jpg),
        ], check=True)
        print(f"OK C-198 {ar}: {out_mp4.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    render_ar("16x9")
    render_ar("9x16")
