"""长录像（发布会、讲座、访谈）→ 逐词文字稿 + 断句，供挑金句、切附带短片用。

    pip install faster-whisper                   # 只在出素材时用；出片不用
    python3 cases/tools/transcribe.py <录像或音频> <输出.json> [--model base.en] [--lang en] [--beam 1]

输出 {"model", "words": [[词, 起, 止], …], "sents": [{"t0", "t1", "text", "n" 词数}]}，时间是秒，相对文件开头。
断句和 samples/T-016/edit.py 一样：句号、问号、感叹号断开，逗号后面接 so、and、but、now 的也断开。
文字稿只是找片段的索引：进成片的原话要对照原声再核一遍（log.md 记）。
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

JOIN = {"so", "and", "but", "now"}


def pcm16k(f):
    a = subprocess.run(["ffmpeg", "-v", "error", "-i", str(f), "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                       capture_output=True, check=True).stdout
    return np.frombuffer(a, np.int16).astype(np.float32) / 32768


def bare(w):
    return re.sub(r"[^a-z']", "", w.lower())


def sentences(words):
    out, cur = [], []
    for i, w in enumerate(words):
        cur.append(i)
        nxt = bare(words[i + 1][0]) if i + 1 < len(words) else ""
        if re.search(r"[.?!]$", w[0]) or (w[0].endswith(",") and nxt in JOIN):
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return [{"t0": words[s[0]][1], "t1": words[s[-1]][2], "text": " ".join(words[i][0] for i in s), "n": len(s)} for s in out]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--model", default="base.en")
    ap.add_argument("--lang", default="en")
    ap.add_argument("--beam", type=int, default=1, help="束搜索宽度：长录像用 1（快几倍），短片段可用 5")
    a = ap.parse_args()
    from faster_whisper import WhisperModel
    m = WhisperModel(a.model, device="cpu", compute_type="int8")
    seg, _ = m.transcribe(pcm16k(a.src), word_timestamps=True, language=a.lang, beam_size=a.beam, condition_on_previous_text=False, vad_filter=True)
    words = []
    for s in seg:
        words += [[w.word.strip(), round(w.start, 2), round(w.end, 2)] for w in s.words]
        print(f"{s.end:7.0f}s", file=sys.stderr, end="\r")
    Path(a.out).write_text(json.dumps({"model": a.model, "words": words, "sents": sentences(words)}, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{len(words)} 个词 → {a.out}")


if __name__ == "__main__":
    main()
