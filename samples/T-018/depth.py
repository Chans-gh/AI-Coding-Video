"""T-018 的深度图：一张公共领域照片 → assets/depth.png（白色近、黑色远），scene.js 用它把照片拆成远近层做视差推镜。

    pip install onnxruntime pillow numpy         # 只在出素材时用；出片不用
    python3 T-018/depth.py                       # 照片下好之后跑一次
    python3 T-018/depth.py <照片> <深度图.png>     # 给别的照片估（如风格包 news-brief 的视差分层）

模型：Depth Anything V2 Small（Apache-2.0）的 ONNX 版，第一次跑时下载到 out/models/（约 100 MB，不进仓库），CPU 上几秒。
输入按长边 770 缩放、边长取 14 的倍数，ImageNet 归一化；输出的是相对视差（越大越近），去掉两头 1% 的极端值后归一到 0–1，
缩到 1000 宽存成 8 位灰度 PNG（去掉元数据）。
"""
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
D = HERE / "assets"
MODELS = HERE.parent / "out" / "models"
URL = "https://huggingface.co/onnx-community/depth-anything-v2-small/resolve/main/onnx/model.onnx"
LONG = 770


def model():
    f = MODELS / "depth-anything-v2-small.onnx"
    if not f.exists():
        MODELS.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(URL, f)
    return str(f)


def main(src=D / "photo.jpg", dest=D / "depth.png"):
    import onnxruntime as ort
    im = Image.open(src).convert("RGB")
    k = LONG / max(im.size)
    w, h = (round(im.width * k / 14) * 14, round(im.height * k / 14) * 14)
    x = np.asarray(im.resize((w, h), Image.BICUBIC), np.float32) / 255
    x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    s = ort.InferenceSession(model(), providers=["CPUExecutionProvider"])
    d = s.run(None, {s.get_inputs()[0].name: x})[0][0]
    lo, hi = np.percentile(d, [1, 99])
    d = np.clip((d - lo) / (hi - lo), 0, 1)
    out = Image.fromarray((d * 255).astype(np.uint8), "L").resize((1000, round(1000 * im.height / im.width)), Image.BICUBIC)
    clean = Image.new("L", out.size); clean.paste(out)
    clean.save(dest, optimize=True)
    print(f"深度图 {out.size}，输入 {w}×{h}")


if __name__ == "__main__":
    import sys
    main(*map(Path, sys.argv[1:3])) if len(sys.argv) > 2 else main()
