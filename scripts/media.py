"""样片和风格包演示片的视频放在 GitHub Release「media」里，不进 Git 仓库；仓库只留清单 media.json（文件名、位置、大小、sha256）。

    python3 scripts/media.py upload [--gh]   # 把本地新出或改过的视频传上去，并更新 media.json（之后要提交它）
    python3 scripts/media.py pull [编号…]     # 从 Release 下载视频到原来的位置（已有且一致的跳过）
    python3 scripts/media.py check           # 清单里的每个文件 Release 上都有、大小一致；有 meta.json 的样片横竖两版都在清单里

upload 默认不需要 GitHub 令牌：把要传的视频放进一个只含它们的中转分支 media-upload/<时间> 推上去，
由 .github/workflows/media.yml 传到 Release、删掉中转分支、重新发布介绍页（一两分钟）。
本机 gh 已登录的可以加 --gh，直接 gh release upload。
"""
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "media.json"
REPO = "Chans-gh/AI-Coding-Video"
TAG = "media"
DOWNLOAD = f"https://github.com/{REPO}/releases/download/{TAG}/"


def local_files():
    """{Release 里的文件名: 本地路径}。风格包演示片加前缀 pack-，和介绍页 media/ 的命名一致。"""
    out = {}
    for p in sorted(ROOT.glob("samples/*/*.mp4")):
        if p.stem.startswith(p.parent.name + "-"):
            out[p.name] = p
    for p in sorted(ROOT.glob("packs/*/demo/*.mp4")):
        out["pack-" + p.name] = p
    return out


def sha256(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def load():
    if MANIFEST.exists():
        return json.loads(MANIFEST.read_text(encoding="utf-8"))
    return {"release": DOWNLOAD, "files": {}}


def save(m):
    m["files"] = dict(sorted(m["files"].items()))
    MANIFEST.write_text(json.dumps(m, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def git(*a, env=None, inp=None):
    return subprocess.run(["git", *a], cwd=ROOT, env=env, input=inp, capture_output=True, text=True, check=True).stdout.strip()


def upload(use_gh):
    m = load()
    todo = {}
    for name, p in local_files().items():
        rec = {"path": str(p.relative_to(ROOT)), "bytes": p.stat().st_size, "sha256": sha256(p)}
        if m["files"].get(name) != rec:
            todo[name] = (p, rec)
    if not todo:
        print("没有要传的视频")
        return
    if use_gh:
        subprocess.run(["gh", "release", "upload", TAG, "--clobber", "-R", REPO, *[str(p) for p, _ in todo.values()]], check=True)
    else:
        # 中转提交只含工作流文件和要传的视频，没有父提交：推送时只发新视频，删掉分支后不留在仓库历史里
        with tempfile.TemporaryDirectory() as d:
            env = {**os.environ, "GIT_INDEX_FILE": str(Path(d) / "index")}
            wf = ".github/workflows/media.yml"
            blob = git("hash-object", "-w", wf)
            git("update-index", "--add", "--cacheinfo", f"100644,{blob},{wf}", env=env)
            for name, (p, _) in todo.items():
                blob = git("hash-object", "-w", str(p))
                git("update-index", "--add", "--cacheinfo", f"100644,{blob},media/{name}", env=env)
            tree = git("write-tree", env=env)
        commit = git("commit-tree", tree, "-m", f"中转 {len(todo)} 个视频到 Release {TAG}")
        branch = f"media-upload/{time.strftime('%Y%m%d-%H%M%S', time.gmtime())}"
        for wait in (0, 2, 4, 8, 16):
            time.sleep(wait)
            if subprocess.run(["git", "push", "-q", "origin", f"{commit}:refs/heads/{branch}"], cwd=ROOT).returncode == 0:
                break
        else:
            sys.exit("推送中转分支失败")
        print(f"已推送 {branch}，GitHub Actions 的 media 工作流会传到 Release（一两分钟），可用 check 确认")
    for name, (_, rec) in todo.items():
        m["files"][name] = rec
    save(m)
    total = sum(r["bytes"] for _, r in todo.values()) / 1e6
    print(f"传了 {len(todo)} 个视频，{total:.1f} MB；media.json 已更新，记得提交")


def pull(ids):
    m = load()
    n = 0
    for name, rec in m["files"].items():
        if ids and not any(name.startswith(i + "-") or name.startswith("pack-" + i) for i in ids):
            continue
        p = ROOT / rec["path"]
        if p.exists() and p.stat().st_size == rec["bytes"] and sha256(p) == rec["sha256"]:
            continue
        p.parent.mkdir(parents=True, exist_ok=True)
        tmp = p.with_suffix(".part")
        urllib.request.urlretrieve(DOWNLOAD + name, tmp)
        if sha256(tmp) != rec["sha256"]:
            tmp.unlink()
            sys.exit(f"✗ {name}：下载的文件和清单对不上（Release 上的可能还没传完，或被别的分支覆盖了）")
        tmp.replace(p)
        n += 1
    print(f"下载了 {n} 个视频")


def check():
    m = load()
    req = urllib.request.Request(f"https://api.github.com/repos/{REPO}/releases/tags/{TAG}",
                                 headers={"Accept": "application/vnd.github+json"})
    assets = {a["name"]: a for a in json.load(urllib.request.urlopen(req))["assets"]}
    bad = []
    for name, rec in m["files"].items():
        a = assets.get(name)
        if not a:
            bad.append(f"Release 上没有 {name}")
        elif a["size"] != rec["bytes"] or (a.get("digest") and a["digest"] != "sha256:" + rec["sha256"]):
            bad.append(f"{name} 和清单不一致")
    for meta in sorted(ROOT.glob("samples/*/meta.json")):
        sid = meta.parent.name
        for ar in ("16x9", "9x16"):
            if f"{sid}-{ar}.mp4" not in m["files"]:
                bad.append(f"清单里没有 {sid}-{ar}.mp4")
    for b in bad[:20]:
        print("✗", b)
    extra = sorted(set(assets) - set(m["files"]))
    print(f"清单 {len(m['files'])} 个，Release {len(assets)} 个" + (f"，Release 多出 {len(extra)} 个：{' '.join(extra[:5])}" if extra else "")
          + ("" if bad else "，一致"))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "upload":
        upload("--gh" in sys.argv)
    elif cmd == "pull":
        pull(sys.argv[2:])
    elif cmd == "check":
        check()
    else:
        print(__doc__)
        sys.exit(1)
