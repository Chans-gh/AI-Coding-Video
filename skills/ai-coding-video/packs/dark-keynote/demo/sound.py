"""风格包演示片的声音：时间点和 scene.js 的分段对齐，每个部件用 sound_kit 里对应的音。"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from sound_kit import bed, title_in, step_in, bars_in, number_in, transition


def score(m):
    bed(m)
    title_in(m, 0)
    transition(m, 3.4)
    for i in range(3):
        step_in(m, 3.4 + .55 + i * .75, i)
    transition(m, 8.2)
    bars_in(m, 8.2 + .35, 3, .375)
    number_in(m, 8.2 + 1.4)
    transition(m, 12.6)
    title_in(m, 12.6)
