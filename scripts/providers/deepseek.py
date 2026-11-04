"""维护者出样片用的适配命令：把 samples/tools/gen.py 的「生成矢量」任务交给 DeepSeek，让它写一份 SVG。只在本仓库，不随 Skill 安装。

    source scripts/providers/deepseek.env          # AICV_SVG_CMD 指向本文件
    python3 samples/tools/gen.py try svg

接口是 DeepSeek 的对话补全（https://api-docs.deepseek.com/），模型名写在任务的 model 里，没写用 deepseek-flash。
Key 只从环境变量 DEEPSEEK_API_KEY 读，只放进请求头，不打印、不写文件。返回里的请求编号只进 gen.py 写的 out/gen/ 日志。
"""
import json
import os
import re
import sys
import time
import urllib.request
from pathlib import Path

URL = "https://api.deepseek.com/chat/completions"
SYSTEM = ("你是矢量插画师，只输出一份完整的 SVG 代码，不要解释，不要 Markdown 代码块。"
          "SVG 要有 xmlns、viewBox 和 width、height；不用外部图片、字体、脚本和滤镜；每个图形元素写上 id，方便代码按 id 做动画。")


def main():
    job = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    if job["type"] != "svg":
        sys.exit(f"本适配命令只做生成矢量，不做 {job['type']}")
    key = os.environ.get("DEEPSEEK_API_KEY")
    if not key:
        sys.exit("缺环境变量 DEEPSEEK_API_KEY")
    p = job.get("params", {})
    body = {"model": job.get("model") or "deepseek-flash", "messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": job["prompt"]}],
            "thinking": {"type": p.get("thinking", "disabled")}, "temperature": p.get("temperature", 0.4),
            "max_tokens": p.get("max_tokens", 8000), "stream": False}
    req = urllib.request.Request(URL, data=json.dumps(body).encode(), method="POST",
                                 headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"})
    for i in range(4):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                res = json.load(r)
            break
        except Exception as e:
            print(f"请求失败（第 {i + 1} 次）：{type(e).__name__} {getattr(e, 'code', '')}", file=sys.stderr)
            if i == 3:
                sys.exit(1)
            time.sleep(2 * 2 ** i)
    print(json.dumps({"id": res.get("id"), "usage": res.get("usage")}), file=sys.stderr)
    txt = res["choices"][0]["message"]["content"]
    m = re.search(r"<svg\b.*</svg>", txt, re.S)
    if not m:
        print(txt[:2000], file=sys.stderr)
        sys.exit("返回里没有 <svg>…</svg>")
    dest = out / f"{job['id']}.svg"
    dest.write_text(m.group(0) + "\n", encoding="utf-8")
    print(json.dumps({"file": str(dest)}))


if __name__ == "__main__":
    main()
