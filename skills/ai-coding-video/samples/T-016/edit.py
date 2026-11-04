"""T-016 的文字稿剪辑：一段 54 秒的访谈 → 逐词时间、句子打分、要删的词、人脸轨迹，写进 assets/edit.json。

    pip install faster-whisper mediapipe          # 只在出素材时用；出片不用
    python3 T-016/edit.py                         # 素材下好之后跑一次；scene.js、sound.py 读 edit.json

1. 语音转文字：faster-whisper small.en（CPU，int8）出逐词时间；提示词里带 um、uh，它才会把口头禅也写出来。
2. 高光打分：按句号、问号、感叹号断句（逗号后面接 so、and、but、now 的也断开），每句的分 = 金句词（great、new era、proud、cool…）+ 长度合适（5–14 个词）
   − 太长（超过 14 个词，每多一个扣 1）− 口头禅占比；取分最高的 3 句，按原来的先后排。换成让语言模型打分也行：把每句的文字交给它，换掉 score()。
3. 删字：句子里的口头禅（um、uh、you know）、含糊的「kind of a」、句首的「and so」「so」删掉；删字 = 删掉这几个词的时间段，
   剩下的词连成几段 [起, 止]（各留 0.04 秒余量），就是剪辑表。
4. 人脸轨迹：MediaPipe 的人脸检测（BlazeFace，模型第一次跑时下载到 out/models/，不进仓库）每 0.1 秒一次，
   取最大的那张脸，中心做滑动平均，竖屏裁切框跟着走。
"""
import json
import re
import subprocess
from pathlib import Path

import numpy as np

D = Path(__file__).resolve().parent / "assets"
MODELS = Path(__file__).resolve().parent.parent / "out" / "models"
FACE_URL = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite"
FILLER = {"um", "uh", "uhm", "er"}
HEDGE = [("you", "know"), ("kind", "of", "a")]
LEAD = [("and", "so"), ("so",)]          # 只在句首删
JOIN = {"so", "and", "but", "now"}       # 逗号后面跟着这几个词，也当一句的开头（识别常把两句连成一句）
GOLD = {"great": 2, "new era": 3, "proud": 2, "cool": 2, "exciting": 2, "future": 1, "exploration": 1, "super": 1}
PAD = .04
HOP = .1


def pcm16k(f):
    a = subprocess.run(["ffmpeg", "-v", "error", "-i", str(f), "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                       capture_output=True, check=True).stdout
    return np.frombuffer(a, np.int16).astype(np.float32) / 32768


def transcribe():
    from faster_whisper import WhisperModel
    m = WhisperModel("small.en", device="cpu", compute_type="int8")
    seg, _ = m.transcribe(pcm16k(D / "talk.mp3"), word_timestamps=True, language="en", condition_on_previous_text=False,
                          initial_prompt="Um, uh, so, uh, I think, um, you know, it was, uh, great.")
    return [[w.word.strip(), round(w.start, 2), round(w.end, 2)] for s in seg for w in s.words]


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
    return out + ([cur] if cur else [])


def drops(words, idx):
    """这句里要删的词：口头禅、含糊的短语"""
    b = [bare(words[i][0]) for i in idx]
    out = {idx[k] for k, x in enumerate(b) if x in FILLER}
    for h in HEDGE:
        for k in range(len(b) - len(h) + 1):
            if tuple(b[k:k + len(h)]) == h:
                out |= set(idx[k:k + len(h)])
    for h in LEAD:
        if tuple(b[:len(h)]) == h:
            out |= set(idx[:len(h)])
            break
    return out


def score(text, n, nfill):
    t = text.lower()
    s = sum(v for k, v in GOLD.items() if k in t)
    s += 2 if 5 <= n <= 11 else -max(0, n - 14)
    return round(s - 4 * nfill / max(n, 1), 2)


def model(url):
    f = MODELS / url.rsplit("/", 1)[1]
    if not f.exists():
        import urllib.request
        MODELS.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(url, f)
    return str(f)


def faces(video):
    import cv2
    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions, vision
    det = vision.FaceDetector.create_from_options(vision.FaceDetectorOptions(base_options=BaseOptions(model_asset_path=model(FACE_URL))))
    cap = cv2.VideoCapture(str(video))
    fps, n = cap.get(cv2.CAP_PROP_FPS), int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    W, H = cap.get(cv2.CAP_PROP_FRAME_WIDTH), cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    xs, ys, ss, last = [], [], [], (.5, .3, .15)
    for k in range(int(n / fps / HOP)):
        cap.set(cv2.CAP_PROP_POS_FRAMES, round(k * HOP * fps))
        ok, fr = cap.read()
        if ok:
            img = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(fr, cv2.COLOR_BGR2RGB))
            got = [d.bounding_box for d in det.detect(img).detections]
            if got:
                r = max(got, key=lambda r: r.width * r.height)
                last = ((r.origin_x + r.width / 2) / W, (r.origin_y + r.height / 2) / H, r.height / H)
        xs.append(last[0]); ys.append(last[1]); ss.append(last[2])
    k = np.ones(9) / 9                     # 0.9 秒的滑动平均：裁切框跟脸，但不抖
    sm = lambda a: [round(float(v), 4) for v in np.convolve(np.pad(a, 4, mode="edge"), k, "valid")]
    return {"hop": HOP, "x": sm(xs), "y": sm(ys), "size": sm(ss)}


def main():
    words = transcribe()
    sents = []
    for idx in sentences(words):
        dr = drops(words, idx)
        text = " ".join(words[i][0] for i in idx)
        nf = sum(bare(words[i][0]) in FILLER for i in idx)
        sents.append({"w": [idx[0], idx[-1]], "text": text, "score": score(text, len(idx) - len(dr), nf), "drop": sorted(dr)})
    best = sorted(sorted(range(len(sents)), key=lambda i: -sents[i]["score"])[:3])
    cuts = []
    for i in best:
        sents[i]["pick"] = True
        a, b = sents[i]["w"]
        run = None
        for j in range(a, b + 1):
            if j in sents[i]["drop"]:
                if run:
                    cuts.append(run); run = None
                continue
            run = [run[0] if run else words[j][1] - PAD, words[j][2] + PAD]
        cuts.append(run)
        print(f"{sents[i]['score']:5.1f}  {sents[i]['text']}")
    cuts = [[round(float(a), 2), round(float(b), 2)] for a, b in cuts]
    print("剪辑表", cuts, f"合计 {sum(b - a for a, b in cuts):.2f} 秒")
    out = {"words": words, "sentences": sents, "cuts": cuts, "face": faces(D / "talk.mp4")}
    (D / "edit.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
