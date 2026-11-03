"""出片核心：开浏览器逐帧截图、合成声音、编码视频、做静帧和缩略图。命令行入口是 batch.py。

依赖 Playwright（Chromium）、Pillow、numpy、scipy 和 ffmpeg。每帧只由时间 t 决定，所以同一份代码每次渲染结果一致。
声音由 <编号>/sound.py 用 lib/synth.py 的合成器现场合成（自带电子音，不用录音、曲库或声音模型）。

产出（都在 samples/<编号>/ 下；风格包的演示片写成 pack:<名字>，按 meta.json 的 accents 每种品牌色出一支，
产出在 packs/<名字>/demo/ 下，文件名是「包名-颜色-画幅」，不做缩略图）：
    <编号>-16x9.mp4 / <编号>-9x16.mp4   样片，30 fps，带声音
    <编号>-16x9.jpg / <编号>-9x16.jpg   静帧（取场景的 still 时刻），长边 1280
并把 16:9 静帧缩成 640 宽写进 Skill 的 images/<编号>.jpg（不超过 100 KB）。
"""
import importlib.util, io, json, os, re, shutil, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
THUMBS = HERE.parent / "skills" / "ai-coding-video" / "images"
PACKS = HERE.parent / "packs"
ARGS = ["--force-color-profile=srgb", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
        "--allow-file-access-from-files", "--disable-web-security"]
SIZE = {"16x9": (1920, 1080), "9x16": (1080, 1920)}
MAX_BYTES = 2_500_000          # 视频流体积上限：超过就加大压缩重编
# 可用环境变量 CHROME 指定浏览器；不设时先找预装的 Chromium，再用 Playwright 自带的
CHROME = os.environ.get("CHROME") or next((p for p in ["/opt/pw-browsers/chromium"] if os.path.exists(p)), None)


class SceneError(Exception):
    pass


def where(sid):
    """样片编号（C-044）→ samples/C-044/；风格包演示片 pack:<名字>[@<颜色>] → packs/<名字>/demo/"""
    return PACKS / sid[5:].split("@")[0] / "demo" if sid.startswith("pack:") else HERE / sid


def stem(sid):
    """产出文件名的前缀：样片用编号，风格包用「包名-颜色」"""
    return sid[5:].replace("@", "-") if sid.startswith("pack:") else sid


def accents(pack):
    """风格包 meta.json 里的品牌色：[(键, 中文名, 英文名, 色值), …]，第一个是默认色"""
    m = json.loads((PACKS / pack / "meta.json").read_text(encoding="utf-8"))
    return [tuple(a) for a in m["accents"]]


def expand(sid):
    """pack:<名字> 展开成每种品牌色一支（pack:<名字>@<颜色>）；样片编号和已带颜色的原样返回"""
    if not sid.startswith("pack:") or "@" in sid:
        return [sid]
    return [f"{sid}@{a[0]}" for a in accents(sid[5:])]


def ffmpeg():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


class Page:
    """一个画幅的播放器页面。scale < 1 时截图缩小（场景照常按全尺寸画），快速检查用。"""

    def __init__(self, pw, sid, ar, scale=1.0, query=""):
        w, h = SIZE[ar]
        self.errors, self.log = [], []
        self.b = pw.chromium.launch(args=ARGS, executable_path=CHROME)
        self.pg = self.b.new_page(viewport={"width": w, "height": h}, device_scale_factor=scale)
        self.pg.on("console", self._console)
        self.pg.on("pageerror", lambda e: (self.errors.append(str(e)), self.log.append(f"pageerror: {e}")))
        base, _, col = sid.partition("@")
        if col:                                   # 风格包的某种品牌色：从 meta.json 取色值传给播放器
            from urllib.parse import quote
            query += "&accent=" + quote(dict((a[0], a[3]) for a in accents(base[5:]))[col])
        self.pg.goto((HERE / "player.html").as_uri() + f"?s={base}&ar={ar}&render=1&t=0{query}")
        self.pg.wait_for_function("READY === true || document.title === 'ERROR'", timeout=600000)
        if self.pg.title() == "ERROR":
            self.close()
            raise SceneError(self.errors[0] if self.errors else "页面出错")
        self.dur, self.fps = self.pg.evaluate("DUR"), self.pg.evaluate("FPS")
        self.still = self.pg.evaluate("SC.still ?? DUR * 0.7")

    def _console(self, m):
        if m.type in ("error", "warning"):
            self.log.append(f"console.{m.type}: {m.text}")
            if m.type == "error":
                self.errors.append(m.text)

    def frame(self, t, fmt="jpeg", quality=95):
        self.pg.evaluate(f"seek({t})")
        return self.pg.screenshot(type=fmt, quality=quality) if fmt == "jpeg" else self.pg.screenshot(type="png")

    def close(self):
        self.b.close()


def scene_dur(sid):
    m = re.search(r"\bdur:\s*([\d.]+)", (where(sid) / "scene.js").read_text(encoding="utf-8"))
    return float(m.group(1)) if m else 3.0


def make_sound(sid, dur, tag=""):
    """有 sound.py 就合成声音，返回 (wav 路径, 母带, 混音原始电平)；没有就返回 (None, None, None)。"""
    src = where(sid) / "sound.py"
    if not src.exists():
        return None, None, None
    if str(HERE / "lib") not in sys.path:
        sys.path.insert(0, str(HERE / "lib"))
    from scipy.io import wavfile
    import synth
    spec = importlib.util.spec_from_file_location(f"sound_{stem(sid)}".replace("-", "_"), src)
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    m = synth.Mix(dur)
    mod.score(m)
    raw = m.buf[: int(dur * synth.SR)].copy()
    x = m.master()
    OUT.mkdir(exist_ok=True)
    wav = OUT / f"{stem(sid)}{tag}.wav"
    wavfile.write(wav, synth.SR, (x * 32767).astype(np.int16))
    return wav, x, raw


def probe(jpeg):
    """截图 → 64 像素宽的灰度小图（numpy），用来查黑屏、画面不动"""
    im = Image.open(io.BytesIO(jpeg))
    im.draft("L", (im.width // 8, im.height // 8))
    im = im.convert("L")
    return np.asarray(im.resize((64, max(1, round(64 * im.height / im.width)))), dtype=np.float32)


def encode(p, sid, ar, log):
    """逐帧渲染并编码成带声音的 mp4，返回 (每帧 jpeg 的回调结果列表, 视频流字节数)。"""
    OUT.mkdir(exist_ok=True)
    silent = OUT / f"{stem(sid)}-{ar}-silent.mp4"
    limit = MAX_BYTES * max(1, p.dur / 5)         # 风格包演示片更长，上限按时长放宽
    enc = subprocess.Popen([ffmpeg(), "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(p.fps),
                            "-vcodec", "mjpeg", "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "24",
                            "-pix_fmt", "yuv420p", str(silent)], stdin=subprocess.PIPE)
    frames = []
    for i in range(round(p.dur * p.fps)):
        b = p.frame(i / p.fps)
        enc.stdin.write(b)
        frames.append(b)
    enc.stdin.close(); enc.wait()
    for crf in (28, 32, 36):                      # 细节多的画面（海浪、噪点）体积大：超过上限就加大压缩重编
        if silent.stat().st_size <= limit:
            break
        log.append(f"视频 {silent.stat().st_size / 1e6:.2f} MB 超过上限，用 crf {crf} 重编")
        tmp = OUT / f"{stem(sid)}-{ar}-crf.mp4"
        subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-i", str(silent), "-c:v", "libx264", "-preset", "slow",
                        "-crf", str(crf), "-pix_fmt", "yuv420p", str(tmp)], check=True)
        tmp.replace(silent)
    vbytes = silent.stat().st_size
    wav, _, _ = make_sound(sid, p.dur, f"-{ar}")
    audio = ["-i", str(wav), "-c:a", "aac", "-b:a", "128k", "-shortest"] if wav else []
    mp4 = where(sid) / f"{stem(sid)}-{ar}.mp4"
    subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-i", str(silent), *audio, "-c:v", "copy",
                    "-movflags", "+faststart", str(mp4)], check=True)
    silent.unlink()
    if wav:
        wav.unlink()
    return frames, vbytes


def still_and_thumb(p, sid, ar):
    """静帧（长边 1280）；16:9 的再缩成 640 宽的缩略图写进 Skill 的 images/"""
    still = Image.open(io.BytesIO(p.frame(p.still, "png"))).convert("RGB")
    big = still.copy(); big.thumbnail((1280, 1280), Image.LANCZOS)
    big.save(where(sid) / f"{stem(sid)}-{ar}.jpg", quality=88, optimize=True)
    if ar == "16x9" and not sid.startswith("pack:"):
        th = still.resize((640, 360), Image.LANCZOS)
        for q in (85, 78, 70, 60, 50):
            buf = io.BytesIO(); th.save(buf, "JPEG", quality=q, optimize=True)
            if buf.tell() <= 100_000:
                break
        (THUMBS / f"{sid}.jpg").write_bytes(buf.getvalue())


def mp4_duration(path):
    exe = shutil.which("ffprobe")
    if not exe:
        return None
    r = subprocess.run([exe, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                       capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return None
