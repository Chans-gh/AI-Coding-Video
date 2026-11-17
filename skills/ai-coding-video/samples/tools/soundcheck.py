"""快速检查样片的 sound.py 能否跑通：python3 tools/soundcheck.py C-001 C-002 …（不出片，只跑 score）。"""
import importlib.util, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'lib'))
from synth import Mix  # noqa: E402

for sid in sys.argv[1:]:
    d = ROOT / sid
    dur = float(re.search(r"dur:\s*([\d.]+)", (d / 'scene.js').read_text()).group(1))
    spec = importlib.util.spec_from_file_location('snd', d / 'sound.py')
    mod = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(mod)
        m = Mix(dur)
        mod.score(m)
        print('✓', sid)
    except Exception as e:  # noqa: BLE001
        print('✗', sid, type(e).__name__, e)
