"""查风格包的转场是不是看得出不一样：每种转场用两块纯色（旧镜头蓝、新镜头黄）在 p = 0.2 / 0.5 / 0.8 各画一帧，
取画面正中一列和正中一行的像素，归成几类颜色（旧、新、白、黑、包里的强调色、其他），压成「颜色 × 长度」的游程签名；
任意两种转场在三个时刻的签名都一样，就算分不出（打 ✗，退出码 1）。

    python3 tools/trcheck.py news-brief                 # 包的 pack.js 里导出 TRANS（名字 → (ctx, K, p, drawA, drawB)）
    python3 tools/trcheck.py dark-keynote --obj DK --names transition,push,dissolve,zoom,wipe,flashCut,flip

做法：用 Playwright 打开包的 pack.js（网址带 ?ar=，lib.js 按它定画幅），再注入 lib.js 和 pack.js 运行。
"""
import argparse, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from render import ARGS, CHROME  # noqa: E402  和出片用同一个浏览器

HERE = Path(__file__).resolve().parent.parent
A, B = (32, 64, 128), (224, 224, 64)
PS = (.2, .5, .8)
JS = """([obj, names, A, B, ps]) => {
  const N = (0, eval)(obj), K = N.theme ? N.theme() : {}, out = {};
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const solid = col => x => { x.fillStyle = `rgb(${col})`; x.fillRect(0, 0, W, H); };
  const ns = names.length ? names : Object.keys(N.TRANS || {});
  for (const n of ns) {
    const f = (N.TRANS && N.TRANS[n]) || N[n]; if (!f) { out[n] = null; continue; }
    out[n] = ps.map(p => {
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      f(g, K, p, solid(A), solid(B));
      const col = Array.from(g.getImageData(W >> 1, 0, 1, H).data), row = Array.from(g.getImageData(0, H >> 1, W, 1).data);
      return [col, row];
    });
  }
  return out;
}"""


def classify(px, accents):
    pal = [("A", A), ("B", B), ("白", (255, 255, 255)), ("黑", (0, 0, 0))] + accents
    out = []
    for i in range(0, len(px), 4):
        r, g, b = px[i:i + 3]
        name, d = min(((n, sum((x - y) ** 2 for x, y in zip((r, g, b), c))) for n, c in pal), key=lambda q: q[1])
        out.append(name if d < 40 ** 2 else "?")
    return out


def runs(cls, bins=20):
    """游程签名：每段颜色和它占的长度（按 1/bins 取整），太短的段（< 1/bins）丢掉"""
    sig, n, i = [], len(cls), 0
    while i < n:
        j = i
        while j < n and cls[j] == cls[i]:
            j += 1
        k = round((j - i) / n * bins)
        if k:
            if sig and sig[-1][0] == cls[i]:
                sig[-1] = (cls[i], sig[-1][1] + k)
            else:
                sig.append((cls[i], k))
        i = j
    return tuple(sig)


def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("pack")
    ap.add_argument("--obj", help="pack.js 导出的全局对象名（默认取 pack.js 第一个 const XX = (() =>）")
    ap.add_argument("--names", default="", help="逗号分隔的转场函数名（默认用导出对象的 TRANS）")
    ap.add_argument("--ar", default="16x9,9x16")
    a = ap.parse_args()
    pack = HERE.parent / "packs" / a.pack / "pack.js"
    src = pack.read_text(encoding="utf-8")
    obj = a.obj
    if not obj:
        import re
        obj = re.search(r"^const (\w+) = \(\(\) =>", src, re.M).group(1)
    names = [n for n in a.names.split(",") if n]
    bad = 0
    with sync_playwright() as pw:
        br = pw.chromium.launch(args=ARGS, executable_path=CHROME)
        for ar in a.ar.split(","):
            pg = br.new_page()
            pg.goto(pack.as_uri() + f"?ar={ar}")
            pg.add_script_tag(path=str(HERE / "lib" / "lib.js"))
            pg.add_script_tag(path=str(pack))
            K = pg.evaluate(f"() => {{ const K = {obj}.theme ? {obj}.theme() : {{}}; return Object.fromEntries(Object.entries(K).filter(([k, v]) => typeof v === 'string' && /^#[0-9a-f]{{6}}$/i.test(v))); }}")
            acc = [(k, hex2rgb(v)) for k, v in K.items()]
            res = pg.evaluate(JS, [obj, names, ",".join(map(str, A)), ",".join(map(str, B)), list(PS)])
            sig = {}
            for n, frames in res.items():
                if frames is None:
                    print(f"✗ {ar} 没有转场 {n}"); bad += 1; continue
                sig[n] = tuple(runs(classify(c, acc)) + runs(classify(r, acc)) for c, r in frames)
            ns = list(sig)
            for i, x in enumerate(ns):
                for y in ns[i + 1:]:
                    if sig[x] == sig[y]:
                        print(f"✗ {ar} {x} 和 {y} 在 p = {PS} 的签名都一样"); bad += 1
            for n in ns:
                print(f"  {ar} {n:<10} " + " | ".join(" ".join(f"{c}{k}" for c, k in s) for s in sig[n]))
            pg.close()
        br.close()
    print(("✗ 有分不出的转场" if bad else f"✓ {len(ns)} 种转场两两可分"))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
