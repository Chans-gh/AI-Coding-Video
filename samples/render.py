"""把样片逐帧渲染成视频、静帧和缩略图。只依赖 Playwright（自带 Chromium）、Pillow 和 ffmpeg。

    python3 render.py C-001                # 横竖两版视频 + 静帧 + 缩略图
    python3 render.py C-001 C-064 --ar 16x9
    python3 render.py C-001 --sheet        # 只出联系表（每版 4 帧）到 out/，用来快速看效果

产出（都在 samples/<编号>/ 下）：
    <编号>-16x9.mp4 / <编号>-9x16.mp4   样片，30 fps，无声
    <编号>-16x9.jpg / <编号>-9x16.jpg   静帧（取场景的 still 时刻），长边 1280
并把 16:9 静帧缩成 640 宽写进 Skill 的 images/<编号>.jpg（不超过 100 KB）。
每帧只由时间 t 决定，所以同一份代码每次渲染结果一致。
"""
import argparse, io, os, shutil, subprocess, sys
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
THUMBS = HERE.parent / "skills" / "ai-coding-video" / "images"
ARGS = ["--force-color-profile=srgb", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
        "--allow-file-access-from-files", "--disable-web-security"]
SIZE = {"16x9": (1920, 1080), "9x16": (1080, 1920)}
# 可用环境变量 CHROME 指定浏览器；不设时先找预装的 Chromium，再用 Playwright 自带的
CHROME = os.environ.get("CHROME") or next((p for p in ["/opt/pw-browsers/chromium"] if os.path.exists(p)), None)


def ffmpeg():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


class Page:
    def __init__(self, pw, sid, ar):
        w, h = SIZE[ar]
        self.b = pw.chromium.launch(args=ARGS, executable_path=CHROME)
        self.pg = self.b.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
        self.pg.on("console", lambda m: print("console:", m.text) if m.type in ("error", "warning") else None)
        self.pg.on("pageerror", lambda e: print("pageerror:", e))
        self.pg.goto((HERE / "player.html").as_uri() + f"?s={sid}&ar={ar}&render=1&t=0")
        self.pg.wait_for_function("READY === true || document.title === 'ERROR'", timeout=600000)
        if self.pg.title() == "ERROR":
            sys.exit(f"{sid} {ar}: 页面出错，见上面的 console 输出")
        self.dur, self.fps = self.pg.evaluate("DUR"), self.pg.evaluate("FPS")
        self.still = self.pg.evaluate("SC.still ?? DUR * 0.7")

    def frame(self, t, fmt="jpeg"):
        self.pg.evaluate(f"seek({t})")
        return self.pg.screenshot(type=fmt, quality=95) if fmt == "jpeg" else self.pg.screenshot(type="png")

    def close(self):
        self.b.close()


def render(pw, sid, ar, sheet_only):
    p = Page(pw, sid, ar)
    d = HERE / sid
    if sheet_only:
        OUT.mkdir(exist_ok=True)
        ims = [Image.open(io.BytesIO(p.frame(p.dur * k))) for k in (0.1, 0.35, 0.6, 0.9)]
        w, h = ims[0].size; s = 480 / max(w, h)
        tw, th = round(w * s), round(h * s)
        sheet = Image.new("RGB", (tw * 4, th))
        for i, im in enumerate(ims):
            sheet.paste(im.resize((tw, th), Image.LANCZOS), (i * tw, 0))
        sheet.save(OUT / f"{sid}-{ar}-sheet.jpg", quality=85)
        p.close(); print(f"{sid} {ar}: 联系表 → out/{sid}-{ar}-sheet.jpg"); return
    mp4 = d / f"{sid}-{ar}.mp4"
    enc = subprocess.Popen([ffmpeg(), "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(p.fps),
                            "-vcodec", "mjpeg", "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "24",
                            "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(mp4)], stdin=subprocess.PIPE)
    n = round(p.dur * p.fps)
    for i in range(n):
        enc.stdin.write(p.frame(i / p.fps))
    enc.stdin.close(); enc.wait()
    still = Image.open(io.BytesIO(p.frame(p.still, "png"))).convert("RGB")
    p.close()
    big = still.copy(); big.thumbnail((1280, 1280), Image.LANCZOS)
    big.save(d / f"{sid}-{ar}.jpg", quality=88, optimize=True)
    if ar == "16x9":
        th = still.resize((640, 360), Image.LANCZOS)
        for q in (85, 78, 70, 60, 50):
            buf = io.BytesIO(); th.save(buf, "JPEG", quality=q, optimize=True)
            if buf.tell() <= 100_000:
                break
        (THUMBS / f"{sid}.jpg").write_bytes(buf.getvalue())
    print(f"{sid} {ar}: {n} 帧 → {mp4.name}（{mp4.stat().st_size / 1e6:.1f} MB）")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="+")
    ap.add_argument("--ar", choices=["16x9", "9x16", "both"], default="both")
    ap.add_argument("--sheet", action="store_true")
    a = ap.parse_args()
    if not (HERE / "node_modules" / "@fontsource").exists():
        sys.exit("缺字体：先在 samples/ 下运行 npm install")
    with sync_playwright() as pw:
        for sid in a.ids:
            for ar in (["16x9", "9x16"] if a.ar == "both" else [a.ar]):
                render(pw, sid, ar, a.sheet)


if __name__ == "__main__":
    main()
