"""T-017 的姿态和抠像：俯卧撑示范片 → 每帧骨骼点、肘角、躯干直线度、计数（assets/pose.json）和抠像遮罩（assets/mask.mp4）。

    pip install mediapipe opencv-python      # 只在出素材时用；出片不用
    python3 T-017/pose.py                    # 素材下好之后跑一次；scene.js 读 pose.json 和 mask.mp4

MediaPipe Pose Landmarker（full，模型第一次跑时下载到 out/models/，不进仓库）按视频模式逐帧跑，一帧最多找两个人，
同时输出每个人的分割遮罩。画面里还有一位跪着计数的考官：取身体最横（骨骼点横向跨度最大）的那个人。
肘角 = 肩-肘-腕的夹角（取离镜头近、可见度高的那一侧），躯干直线度 = 肩-髋-踝的夹角（180° 是一条直线）；
肘角先低于 DOWN 再回到 UP 以上记一次。遮罩缩到 320 宽存成灰度 H.264（去掉元数据），scene.js 当透明度用。
"""
import json
import math
import subprocess
import sys
import urllib.request
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
D = HERE / "assets"
MODELS = HERE.parent / "out" / "models"
URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task"
DOWN, UP = 100, 150
MW = 320
sys.path.insert(0, str(HERE.parent / "tools"))


def model():
    f = MODELS / URL.rsplit("/", 1)[1]
    if not f.exists():
        MODELS.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(URL, f)
    return str(f)


def angle(a, b, c):
    v1, v2 = (a[0] - b[0], a[1] - b[1]), (c[0] - b[0], c[1] - b[1])
    d = math.hypot(*v1) * math.hypot(*v2) + 1e-9
    return math.degrees(math.acos(max(-1, min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / d))))


def main():
    import cv2
    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions, vision
    import assets as A          # 复用 tools/assets.py 的视频处理（统一编码、去元数据）

    opt = vision.PoseLandmarkerOptions(base_options=BaseOptions(model_asset_path=model()), running_mode=vision.RunningMode.VIDEO,
                                       num_poses=2, output_segmentation_masks=True)
    det = vision.PoseLandmarker.create_from_options(opt)
    cap = cv2.VideoCapture(str(D / "drill.mp4"))
    fps = cap.get(cv2.CAP_PROP_FPS)
    W, H = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    MH = round(MW * H / W / 2) * 2
    raw = HERE.parent / "out" / "T-017-mask.raw.mp4"
    raw.parent.mkdir(parents=True, exist_ok=True)
    enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{MW}x{MH}", "-r", str(fps), "-i", "-",
                            "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", str(raw)], stdin=subprocess.PIPE)
    frames, k = [], 0
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        res = det.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)), round(k * 1000 / fps))
        k += 1
        best, m = None, np.zeros((MH, MW), np.uint8)
        if res.pose_landmarks:
            span = [max(p.x for p in L) - min(p.x for p in L) for L in res.pose_landmarks]
            i = int(np.argmax(span))
            best = res.pose_landmarks[i]
            if res.segmentation_masks:
                m = cv2.resize((res.segmentation_masks[i].numpy_view()[..., 0] * 255).astype(np.uint8), (MW, MH), interpolation=cv2.INTER_AREA)
        enc.stdin.write(m.tobytes())
        frames.append(None if best is None else [[round(p.x, 4), round(p.y, 4), round(p.visibility, 2)] for p in best])
    enc.stdin.close(); enc.wait()
    det.close()
    # 指标：左右两侧取可见度高的那一侧
    elbow, line, reps, down = [], [], [], False
    for i, L in enumerate(frames):
        if L is None:
            elbow.append(None); line.append(None); continue
        side = (11, 13, 15, 23, 27) if L[13][2] + L[15][2] >= L[14][2] + L[16][2] else (12, 14, 16, 24, 28)
        P = lambda j: (L[j][0] * W, L[j][1] * H)
        e = angle(P(side[0]), P(side[1]), P(side[2])); b = angle(P(side[0]), P(side[3]), P(side[4]))
        elbow.append(round(e, 1)); line.append(round(b, 1))
        if e < DOWN:
            down = True
        elif e > UP and down:
            down = False; reps.append(round(i / fps, 2))
    out = {"fps": fps, "w": W, "h": H, "side": "left" if side[0] == 11 else "right", "down": DOWN, "up": UP,
           "frames": frames, "elbow": elbow, "line": line, "reps": reps}
    (D / "pose.json").write_text(json.dumps(out, separators=(",", ":")) + "\n", encoding="utf-8")
    A.prep_video(raw, D / "mask.mp4", {"w": MW, "crf": 22})
    v = [x for x in elbow if x]
    print(f"{len(frames)} 帧，{sum(f is not None for f in frames)} 帧有人；肘角 {min(v):.0f}–{max(v):.0f}°；计数 {len(reps)} 次 @ {reps}")


if __name__ == "__main__":
    main()
