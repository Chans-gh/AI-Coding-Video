"""T-013 的多机位对齐：三路机位各剪了一段（起点各不相同，代码不知道），用三段原声的互相关算出彼此差几秒，写进 assets/sync.json。

    python3 T-013/sync.py         # 素材下好之后跑一次；scene.js 读 sync.json 把三路放到同一条时间线上

做法：都转成 4 kHz 单声道，近景那路当基准，另外两路和它做互相关（FFT），峰值的位置就是时移；峰值的归一化高度记成 corr，
越接近 1 越可靠。同一份录像的倒计时牌在近景这路的 T0（第 8.3 秒，0.2 秒以内）读出，记成 t0。
另存每一路每 0.05 秒的响度（0–1），片头画声波对齐用。
"""
import json
import subprocess
from pathlib import Path

import numpy as np

D = Path(__file__).resolve().parent / "assets"
SR = 4000
REF, OTHERS = "closeup", ("tower", "wide")
T0 = 8.3        # 近景这路里倒计时归零的时刻（秒，从倒计时牌读出）
HOP = SR // 20  # 响度每 0.05 秒一个点


def pcm(name):
    a = subprocess.run(["ffmpeg", "-v", "error", "-i", str(D / f"{name}.mp3"), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                       capture_output=True, check=True).stdout
    x = np.frombuffer(a, np.int16).astype(float)
    return x - x.mean()


def lag(ref, y):
    """y 里的内容比 ref 晚多少秒出现（负数是早）"""
    n = 1 << (len(ref) + len(y) - 1).bit_length()
    c = np.fft.irfft(np.fft.rfft(y, n) * np.conj(np.fft.rfft(ref, n)), n)
    k = int(np.argmax(c))
    k = k - n if k > n // 2 else k
    return k / SR, float(c.max() / (np.linalg.norm(ref) * np.linalg.norm(y) + 1e-9))


def env(x):
    r = np.sqrt(np.add.reduceat(x ** 2, np.arange(0, len(x), HOP)) / HOP)
    r = 20 * np.log10(r / (np.abs(x).max() + 1e-9) + 1e-6)
    return [round(float(v), 2) for v in np.clip((r + 40) / 40, 0, 1)]


def main():
    ref = pcm(REF)
    out = {"ref": REF, "t0": T0, "hop": HOP / SR, "views": {REF: {"offset": 0.0, "corr": 1.0, "env": env(ref)}}}
    for v in OTHERS:
        y = pcm(v)
        dt, corr = lag(ref, y)
        # 基准里的 t 秒 = 这一路里的 t + dt 秒
        out["views"][v] = {"offset": round(dt, 3), "corr": round(corr, 2), "env": env(y)}
        print(f"{v:6} 比 {REF} 晚 {dt:+.3f} 秒（互相关峰值 {corr:.2f}）")
    (D / "sync.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
