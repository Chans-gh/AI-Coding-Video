"""案例的素材：照 cases/<名字>/assets.json 下载、截取、生成、统一处理，写进 cases/<名字>/assets/。

    python3 cases/tools/assets.py news-artemis                 # 补齐缺的素材（已有的不动）
    python3 cases/tools/assets.py news-artemis --only assets/vo.mp3 --force
    python3 cases/tools/assets.py news-artemis --check         # 只查：文件在不在、元数据是否干净、进仓库的合计是否超过 30 MB

做法和字段全部沿用 samples/tools/assets.py（见它开头的说明），只有三处不同：
- 目录是 cases/<名字>/，生成记录在 samples/out/gen/case-<名字>/（不进仓库）。
- 长录像不整个下载：prep 里有 ss 的录像、原声，ffmpeg 直接从 download 地址按时间段截取（HTTP 分段读取）。
- 能从公开地址重新下载、或由本仓库代码从它们算出来的素材放在 assets/dl/（.gitignore 排除，不进仓库）；
  生成的素材和处理过、没法重新下载的放在 assets/ 下，进仓库，合计不超过 30 MB（cases/README.md 的规矩）。
"""
import argparse
import subprocess
import sys
from pathlib import Path

CASES = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(CASES.parent / "samples" / "tools"))
import assets as A  # noqa: E402  samples/tools/assets.py

LIMIT = 30_000_000
STREAM = (".mp4", ".mov", ".m4v", ".webm", ".mp3", ".m4a", ".wav")
_fetch = A.fetch


def fetch(url):
    """长录像、长音频：返回地址本身，交给 ffmpeg 按 -ss / -t 分段读取；其余照常下载到缓存"""
    if url.split("?")[0].lower().endswith(STREAM):
        return url
    return _fetch(url)


def tracked(d):
    """进仓库的素材（assets/ 下、不在 assets/dl/ 里）"""
    return [f for f in (d / "assets").rglob("*") if f.is_file() and "dl" not in f.relative_to(d / "assets").parts[:1]]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("case")
    ap.add_argument("--only", nargs="+")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    d = CASES / a.case
    A.where = lambda sid: d
    A.fetch = fetch
    A.LIMIT = float("inf")                       # 合计按进仓库的部分另算
    ok = A.build("case-" + a.case, a.only, a.force, a.check)
    total = sum(f.stat().st_size for f in tracked(d))
    over = total > LIMIT
    print(f"{'✗' if over else '✓'} 进仓库的素材合计 {total / 1e6:.2f} MB（上限 30 MB；assets/dl/ 不进仓库）")
    sys.exit(0 if ok and not over else 1)


if __name__ == "__main__":
    main()
