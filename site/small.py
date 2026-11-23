"""给介绍页的卡片出小视频、小静帧：python3 site/small.py

读 site/media/ 里的原版 *.mp4、*.jpg（1080p），缩小后写进 site/media/s/，文件名不变。
卡片和风格包演示片用小版（显示只有几百像素宽），放大播放（lightbox）仍用原版。
首页大视频（HERO 里的几支，只出横版）另出一份 1280 宽的放进 site/media/m/。
发布时由 .github/workflows/pages.yml 在下载完视频后调用；本地由 site/build.py 拷完媒体后调用。
原版没变就不重出：按内容比（每个输出目录的 .src.json 记着出这份小版时原版的 sha256 和压缩参数），
线上每次重新下载、修改时间都是新的也认得出；没有记录的才退回按修改时间比。需要 ffmpeg（找不到就用 imageio-ffmpeg 自带的）。
"""
import hashlib
import json
import os
import shutil
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
MEDIA = HERE / "media"
OUT = MEDIA / "s"
# 长边像素：卡片最宽显示约 370 CSS 像素，风格包演示片约 660，都按 2 倍屏留余量
LONG = {"card": 768, "pack": 1280}
CRF = 27
# 首页轮播的样片，按这个顺序排，第一支是默认；site/build.py 也读这里
HERO = ("T-001", "G-005", "C-001")
HERO_LONG = 1280


def ffmpeg():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def scale(name, long=None):
    long = long or LONG["pack" if name.startswith("pack-") else "card"]
    short = long * 9 // 16
    w, h = (short, long) if "9x16" in name else (long, short)
    return f"scale={w}:{h}:flags=lanczos"


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def job(src, out=OUT, long=None, seen=None):
    """出一份小版；返回 (文件名, 这次新出了没有, 记录)。记录 = 原版 sha256 + 压缩参数，和 seen 里的一样就不重出"""
    dst = out / src.name
    if src.suffix == ".mp4":
        args = ["-vf", scale(src.name, long), "-c:v", "libx264", "-preset", "slow", "-crf", str(CRF), "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", "-threads", "2"]
    else:
        args = ["-vf", scale(src.name, long), "-q:v", "4", "-update", "1", "-frames:v", "1"]
    rec = sha256(src) + " " + " ".join(args)
    if dst.exists() and (rec == (seen or {}).get(src.name) or
                         (src.name not in (seen or {}) and dst.stat().st_mtime >= src.stat().st_mtime)):
        return src.name, False, rec
    tmp = dst.with_name(f".tmp-{dst.name}")
    subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-i", str(src), *args, "-map_metadata", "-1", "-f",
                    "mp4" if src.suffix == ".mp4" else "image2", str(tmp)], check=True)
    tmp.replace(dst)
    return src.name, True, rec


def main():
    srcs = sorted(p for p in MEDIA.glob("*") if p.suffix in (".mp4", ".jpg") and not p.name.startswith("case-"))   # 案例成片自带中版，不出小版
    if not srcs:
        sys.exit("site/media/ 里没有视频和静帧：先跑 site/build.py（线上由 pages.yml 下载）")
    hero = [p for p in srcs if p.stem in {f"{h}-16x9" for h in HERO}]
    jobs = [(p, OUT, None) for p in srcs] + [(p, OUT.parent / "m", HERO_LONG) for p in hero]
    for out, keep in ((OUT, srcs), (OUT.parent / "m", hero)):
        out.mkdir(exist_ok=True)
        names = {p.name for p in keep}
        for p in out.glob("*"):   # 原版已不在的小版删掉（记录文件 .src.json 留着）
            if p.name not in names and p.name != ".src.json":
                p.unlink()
    seen = {}
    for out in (OUT, OUT.parent / "m"):
        try:
            seen[out] = json.loads((out / ".src.json").read_text(encoding="utf-8"))
        except (OSError, ValueError):
            seen[out] = {}
    with ThreadPoolExecutor(max(1, (os.cpu_count() or 2) // 2)) as ex:
        res = list(ex.map(lambda j: (j[1], *job(*j, seen=seen[j[1]])), jobs))
    done = sum(made for _, _, made, _ in res)
    for out in seen:   # 只记这次还在的
        recs = {name: rec for o, name, _, rec in res if o == out}
        (out / ".src.json").write_text(json.dumps(recs, ensure_ascii=False, indent=0, sort_keys=True), encoding="utf-8")
    big = sum(p.stat().st_size for p in srcs)
    small = sum((OUT / p.name).stat().st_size for p in srcs)
    print(f"小版 {len(jobs)} 个（新出 {done} 个）：{big / 1e6:.0f} MB → {small / 1e6:.0f} MB")


if __name__ == "__main__":
    main()
