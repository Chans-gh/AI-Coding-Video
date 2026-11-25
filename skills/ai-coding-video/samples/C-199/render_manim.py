#!/usr/bin/env python3
"""C-199 Manim 数学几何证明：调用 Manim CE 渲染 16:9 和 9:16 视频，混入 sound.py 电子音并导出封面图"""
import os
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
SAMPLES = HERE.parent
sys.path.insert(0, str(SAMPLES / "lib"))
import synth
import sound as sound_mod

MANIM = "/Users/chenzepeng/.local/envs/manim/bin/manim"
FFMPEG = str(Path.home() / ".local/bin/ffmpeg")


def render_ar(ar: str, dur: float):
    w, h = (1920, 1080) if ar == "16x9" else (1080, 1920)
    with tempfile.TemporaryDirectory(prefix=f"c199_{ar}_") as td:
        env = os.environ.copy()
        env["MANIM_AR"] = ar
        env["PATH"] = str(Path.home() / ".local/bin") + ":" + env.get("PATH", "")
        cmd = [
            MANIM, "render",
            "--fps", "30",
            "-r", f"{w},{h}",
            "--media_dir", td,
            "--format", "mp4",
            str(HERE / "manim_scene.py"),
            "UnitCircleSineProof",
        ]
        subprocess.run(cmd, check=True, env=env)
        mp4s = list(Path(td).rglob("UnitCircleSineProof.mp4"))
        if not mp4s:
            raise RuntimeError("Manim did not produce UnitCircleSineProof.mp4")
        raw_mp4 = mp4s[0]

        # Synthesize C-class electronic audio via synth.py
        import wave, numpy as np
        m = synth.Mix(dur, seed=199)
        sound_mod.score(m)
        wav = Path(td) / "audio.wav"
        pcm = (np.clip(m.master(), -1.0, 1.0) * 32767).astype("<i2")
        with wave.open(str(wav), "wb") as wf:
            wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(synth.SR)
            wf.writeframes(pcm.tobytes())

        out_mp4 = HERE / f"C-199-{ar}.mp4"
        subprocess.run([
            FFMPEG, "-y",
            "-i", str(raw_mp4),
            "-i", str(wav),
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22",
            "-c:a", "aac", "-b:a", "128k",
            "-shortest", "-map_metadata", "-1", "-movflags", "+faststart",
            str(out_mp4),
        ], check=True)

        # Extract still frame at t=2.4s
        out_jpg = HERE / f"C-199-{ar}.jpg"
        subprocess.run([
            FFMPEG, "-y", "-ss", "2.4", "-i", str(out_mp4),
            "-frames:v", "1", "-q:v", "3", "-map_metadata", "-1",
            str(out_jpg),
        ], check=True)
        print(f"OK C-199 {ar}: {out_mp4.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    render_ar("16x9", 4.5)
    render_ar("9x16", 4.5)
