#!/usr/bin/env python3
"""C-071 Blender 程序化场景：调用 Blender 5.3 渲染横竖两版程序化夜景烟花，混入 sound.py 电子音并导出封面图"""
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
SAMPLES = HERE.parent
sys.path.insert(0, str(SAMPLES / "lib"))
import synth
import sound as sound_mod

BLENDER = "/Applications/Blender.app/Contents/MacOS/blender"
FFMPEG = str(Path.home() / ".local/bin/ffmpeg")


def render_ar(ar: str, dur: float = 4.5):
    with tempfile.TemporaryDirectory(prefix=f"c071_{ar}_") as td:
        frames_dir = Path(td) / "frames"
        subprocess.run(
            [BLENDER, "-b", "--python", str(HERE / "blender_scene.py"), "--", ar, str(frames_dir)],
            check=True,
        )
        import wave, numpy as np
        m = synth.Mix(dur, seed=71)
        sound_mod.score(m)
        wav = Path(td) / "audio.wav"
        pcm = (np.clip(m.master(), -1.0, 1.0) * 32767).astype("<i2")
        with wave.open(str(wav), "wb") as wf:
            wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(synth.SR)
            wf.writeframes(pcm.tobytes())

        out_mp4 = HERE / f"C-071-{ar}.mp4"
        subprocess.run([
            FFMPEG, "-y",
            "-framerate", "30",
            "-i", str(frames_dir / "f_%04d.jpg"),
            "-i", str(wav),
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22",
            "-c:a", "aac", "-b:a", "128k",
            "-shortest", "-map_metadata", "-1", "-movflags", "+faststart",
            str(out_mp4),
        ], check=True)

        out_jpg = HERE / f"C-071-{ar}.jpg"
        subprocess.run([
            FFMPEG, "-y", "-ss", "2.95", "-i", str(out_mp4),
            "-frames:v", "1", "-q:v", "3", "-map_metadata", "-1",
            str(out_jpg),
        ], check=True)
        print(f"OK C-071 {ar}: {out_mp4.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    render_ar("16x9")
    render_ar("9x16")
