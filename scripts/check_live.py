"""用无头浏览器打开线上介绍页，只打一行结果：卡片数、脚本报错、加载失败的文件。

    python3 scripts/check_live.py [网址]      # 默认 https://chans-gh.github.io/AI-Coding-Video/
"""
import os
import sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "https://chans-gh.github.io/AI-Coding-Video/"
CHROME = os.environ.get("CHROME") or next((p for p in ["/opt/pw-browsers/chromium"] if os.path.exists(p)), None)

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME)
    pg = b.new_page(viewport={"width": 1280, "height": 900})
    errs, bad = [], []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    # 资源 404 在 console 里也会报一次：记到“加载失败”里，并带上文件名（浏览器自己去取的 favicon.ico 不算）
    def console(m):
        if m.type != "error":
            return
        if m.text.startswith("Failed to load resource"):
            u = (m.location or {}).get("url", "")
            if not u.endswith("favicon.ico"):
                bad.append(f"{m.text.split('status of ')[-1].split()[0]} {u.rsplit('/', 1)[-1]}")
        else:
            errs.append(m.text)
    pg.on("console", console)
    pg.on("requestfailed", lambda r: bad.append(f"失败 {r.url.rsplit('/', 1)[-1]}"))
    pg.goto(URL, wait_until="networkidle", timeout=60000)
    pg.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    pg.wait_for_timeout(1500)
    cards = pg.locator(".card").count()
    b.close()
bad = sorted(set(bad))
ok = cards and not errs and not bad
print(f"{'✓' if ok else '✗'} {URL}  卡片 {cards}" + (f"  报错 {len(errs)}：{errs[0][:80]}" if errs else "") +
      (f"  加载失败 {len(bad)}：{'、'.join(bad[:5])}" if bad else ""))
sys.exit(0 if ok else 1)
