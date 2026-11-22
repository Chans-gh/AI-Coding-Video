"""G-024 首尾帧变装卡点：从配乐算出节拍，打印 scene.js 里用的 BPM 和第一拍的时刻。

    python3 G-024/beats.py

做法：能量差分得到起音包络 → 自相关找 70–180 BPM 里最强的周期 → 在一拍之内找起音最对齐的相位。
"""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "lib"))
from synth import SR, load  # noqa: E402

x = load(Path(__file__).parent / "assets/music.mp3").mean(1)
hop = 512
e = np.array([np.sqrt((x[i:i + 1024] ** 2).mean()) for i in range(0, len(x) - 1024, hop)])
onset = np.maximum(0, np.diff(np.log(e + 1e-4)))
fps = SR / hop
ac = np.correlate(onset, onset, "full")[len(onset) - 1:]
lags = np.arange(int(fps * 60 / 180), int(fps * 60 / 70))
lag = lags[np.argmax(ac[lags])]
bpm = 60 * fps / lag
period = 60 / bpm
best = max(np.arange(0, period, 0.005),
           key=lambda p: sum(onset[int(round((p + k * period) * fps))] for k in range(int((len(onset) / fps - p) / period))))
print(f"BPM {bpm:.2f}，一拍 {period:.4f} 秒，第一拍 {best:.3f} 秒")
