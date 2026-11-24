"""Original score for the dark puppet stage, mixed by film.py."""
import json
from pathlib import Path

from synth import bell, drone, fade, impact, pad, pluck, thud, whoosh, woodblock


def score(mix, timing):
    cues = json.loads(Path(__file__).with_name("timing.json").read_text(encoding="utf-8"))["reference"]["cues"]["sound"]
    dur = timing["dur"]
    mix.put(fade(drone(49, dur, .16), .40, .45), 0, .067)
    mix.put(pad([98, 116.54, 146.83], dur, cutoff=570, a=.45, rel=.55), 0, .038)
    for i, cue in enumerate(cues):
        at = cue["at_ms"] / 1000
        kind = cue["type"]
        if kind == "plink":
            mix.put(bell(419, .58, ratio=2.4, index=1.1), at, .12, -.18)
        elif kind == "tension":
            mix.put(pluck(152 + i * 21, .31, bright=2100), at, .22, .25)
        elif kind == "swish":
            mix.put(whoosh(mix, .31, f0=690, f1=1500), at, .11)
        elif kind == "impact":
            mix.put(impact(mix), at, .38)
            mix.put(thud(mix, .53), at, .22)
        elif kind == "tag":
            mix.put(woodblock(570 + i * 27, .13), at, .105, .27 * (-1) ** i)
