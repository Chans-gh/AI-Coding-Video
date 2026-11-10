"""本地语音合成的适配命令：sherpa-onnx 跑 Kokoro v1.1-zh（Apache 2.0，24 kHz），不调云端服务、不花钱，不装 torch。

    pip install sherpa-onnx                                     # 一次
    export AICV_TTS_CMD="python3 tools/adapters/kokoro.py"
    python3 tools/gen.py try tts                                # 首次用时下载模型（约 360 MB，解开约 400 MB）

模型放在环境变量 AICV_MODELS 指的目录（默认 ~/.cache/aicv/models/），不放进项目。
音色写 Kokoro 的音色名（zf_083、zm_010…，见 Skill 的 sound.md），语速写 params.speed（默认 1）。
任务带 sentences 的，一句一次合成，句间留 0.5 秒静音拼成一个文件，字幕一句一行（Kokoro 没有逐字时间）。
输入输出的约定见 tools/gen.py 开头。
"""
import json
import os
import re
import sys
import tarfile
import urllib.request
from pathlib import Path

URL = "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_1.tar.bz2"
NAME = "kokoro-multi-lang-v1_1"
GAP = 0.5
# sherpa-onnx 的 voices.bin 按这个顺序排音色（它的 scripts/kokoro/v1.1-zh/generate_voices_bin.py）：
# 3 个英文音色，然后 zf_、zm_ 各按编号从小到大；编号对照 huggingface.co/hexgrad/Kokoro-82M-v1.1-zh 的 voices/ 核过
ZF = "1 2 3 4 5 6 7 8 17 18 19 21 22 23 24 26 27 28 32 36 38 39 40 42 43 44 46 47 48 49 51 59 60 67 70 71 72 73 74 75 76 77 78 79 83 84 85 86 87 88 90 92 93 94 99"
ZM = "9 10 11 12 13 14 15 16 20 25 29 30 31 33 34 35 37 41 45 50 52 53 54 55 56 57 58 61 62 63 64 65 66 68 69 80 81 82 89 91 95 96 97 98 100"
VOICES = ["af_maple", "af_sol", "bf_vale"] + [f"zf_{int(n):03d}" for n in ZF.split()] + [f"zm_{int(n):03d}" for n in ZM.split()]


def model_dir():
    root = Path(os.environ.get("AICV_MODELS") or Path.home() / ".cache" / "aicv" / "models")
    d = root / NAME
    if not (d / "model.onnx").exists():
        root.mkdir(parents=True, exist_ok=True)
        tmp = root / f"{NAME}.tar.bz2"
        print(f"首次使用：下载 Kokoro 模型到 {root}（约 360 MB）", file=sys.stderr)
        urllib.request.urlretrieve(URL, tmp)
        with tarfile.open(tmp) as t:
            t.extractall(root, filter="data")
        tmp.unlink()
    return d


def engine():
    try:
        import sherpa_onnx
    except ImportError:
        sys.exit("缺 sherpa-onnx：pip install sherpa-onnx")
    d = model_dir()
    cfg = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
                model=str(d / "model.onnx"), voices=str(d / "voices.bin"), tokens=str(d / "tokens.txt"),
                data_dir=str(d / "espeak-ng-data"), dict_dir=str(d / "dict"),
                lexicon=f"{d / 'lexicon-us-en.txt'},{d / 'lexicon-zh.txt'}"),
            num_threads=min(4, os.cpu_count() or 1)),
        rule_fsts=",".join(str(d / f) for f in ("phone-zh.fst", "date-zh.fst", "number-zh.fst")),
        max_num_sentences=1)
    return sherpa_onnx.OfflineTts(cfg)


def main():
    import numpy as np
    from scipy.io import wavfile
    job = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    if job.get("type") != "tts":
        sys.exit("kokoro.py 只做语音合成")
    voice = job.get("voice") or "zf_083"
    if voice not in VOICES:
        sys.exit(f"Kokoro 没有音色 {voice}（有 {VOICES[0]}…{VOICES[-1]}，见 sound.md）")
    speed = float(job.get("params", {}).get("speed") or 1)
    lines = job.get("sentences") or [s for s in re.findall(r"[^。！？.!?]+[。！？.!?]?", job["text"]) if s.strip()]
    tts = engine()
    sr, buf, subs, t = 24000, [], [], 0.0
    for i, line in enumerate(lines):
        a = tts.generate(line, sid=VOICES.index(voice), speed=speed)
        sr = a.sample_rate
        x = np.asarray(a.samples, dtype=np.float32)
        if i:
            buf.append(np.zeros(int(GAP * sr), np.float32)); t += GAP
        buf.append(x)
        subs.append({"text": line, "t0": round(t, 3), "t1": round(t + len(x) / sr, 3)})
        t += len(x) / sr
    dest = out / f"{job['id']}.wav"
    wavfile.write(dest, sr, (np.clip(np.concatenate(buf), -1, 1) * 32767).astype(np.int16))
    sj = out / f"{job['id']}.subs.json"
    sj.write_text(json.dumps(subs, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps({"file": str(dest), "subtitles": str(sj)}))


if __name__ == "__main__":
    main()
