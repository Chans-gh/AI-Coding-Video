"""重任务排队：回听、渲染这类吃内存的任务，同一台机器上一次只跑一个（4 核、15 GB 的容器同时跑两个会被杀）。

    from heavy import slot
    with slot("回听"):          # 前一个没跑完就打印「排队」、等它跑完
        ...

    python3 tools/heavy.py <命令…>   # 在命令行里排队跑一条命令

锁文件默认在系统临时目录的 aicv-heavy.lock，可用环境变量 AICV_HEAVY_LOCK 换。锁跟着进程走：进程被杀、退出，锁自动放开。
"""
import contextlib
import fcntl
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

LOCK = Path(os.environ.get("AICV_HEAVY_LOCK") or Path(tempfile.gettempdir()) / "aicv-heavy.lock")


@contextlib.contextmanager
def slot(what):
    LOCK.parent.mkdir(parents=True, exist_ok=True)
    with open(LOCK, "a+") as f:
        try:
            fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            f.seek(0)
            who = f.read().strip() or "另一个重任务"
            print(f"排队：{who} 还在跑，等它跑完再{what}", flush=True)
            t0 = time.time()
            fcntl.flock(f, fcntl.LOCK_EX)
            print(f"排到了（等了 {time.time() - t0:.0f} 秒），开始{what}", flush=True)
        f.seek(0); f.truncate()
        f.write(f"{what}（进程 {os.getpid()}，{time.strftime('%H:%M:%S')} 开始）"); f.flush()
        try:
            yield
        finally:
            f.seek(0); f.truncate(); f.flush()
            fcntl.flock(f, fcntl.LOCK_UN)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    with slot(" ".join(sys.argv[1:])[:60]):
        sys.exit(subprocess.call(sys.argv[1:]))
