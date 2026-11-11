"""出片核心：开浏览器逐帧截图、合成声音、编码视频、做静帧和缩略图。命令行入口是 batch.py。

依赖 Playwright（Chromium）、Pillow、numpy、scipy 和 ffmpeg。每帧只由时间 t 决定，所以同一份代码每次渲染结果一致。
声音由 <编号>/sound.py 用 lib/synth.py 现场合成：C 类只用自带的电子音（不用录音、曲库或声音模型）；
T 类、G 类照 assets.json 把 assets/ 里的旁白、配乐、音效摆好（synth.assets）。

产出（都在 samples/<编号>/ 下；风格包的演示片写成 pack:<名字>，按 meta.json 的 accents（品牌色）或 variants（别的切换维度，
比如画面组织、画风）每种出一支，产出在 packs/<名字>/demo/ 下，文件名是「包名-键-画幅」，不做缩略图；meta.json 写了 full 的包，
默认那一种在 full 画幅出完整演示片 scene.js + sound.py，其余组合出 15 秒切换片段 clip.js + clip_sound.py）：
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
# 在本仓库里，samples/ 和 skills/ai-coding-video/ 并排，出片时顺手更新 Skill 的缩略图；
# 随 Skill 安装或拷进别的项目时没有这个目录，就不写缩略图
THUMBS = HERE.parent / "skills" / "ai-coding-video" / "images"
PACKS = HERE.parent / "packs"
ARGS = ["--force-color-profile=srgb", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
        "--allow-file-access-from-files", "--disable-web-security"]
SIZE = {"16x9": (1920, 1080), "9x16": (1080, 1920)}
MAX_BYTES = 2_500_000          # C 类视频流体积上限：超过就加大压缩重编
ASSET_CLASSES = "TG"           # 带素材的 T 类、G 类：8–15 秒，每个视频（含声音）不超过 4 MB
MAX_FILE_TG = 4_000_000
MAX_BYTES_TG = 3_550_000
FULL_MAX_FILE = 20_000_000     # 风格包完整演示片（20–90 秒）每个视频不超过 20 MB


def is_asset_class(sid):
    """T 类、G 类样片，以及从 T、G 类条目做出来的风格包（meta.json 的 from）"""
    if sid.startswith("pack:"):
        return pack_meta(sid[5:].split("@")[0]).get("from", "")[:1] in ASSET_CLASSES
    return sid[:1] in ASSET_CLASSES
# 可用环境变量 CHROME 指定浏览器；不设时先找预装的 Chromium，再用 Playwright 自带的
CHROME = os.environ.get("CHROME") or next((p for p in ["/opt/pw-browsers/chromium"] if os.path.exists(p)), None)


class SceneError(Exception):
    pass


def is_remotion(sid):
    """Remotion 样片：目录里是 scene.jsx（React 组件），不是 scene.js"""
    return (where(sid) / "scene.jsx").exists()


class RemotionPage:
    """一个画幅的 Remotion 样片，接口和 Page 一样（dur/fps/still/frame/close）。

    背后是 remotion/serve.mjs：打包一次，之后按命令逐帧截图；浏览器用容器里已有的 Chromium，不额外下载。
    """

    def __init__(self, sid, ar, scale=1.0):
        self.sid, self.ar, self.scale = sid, ar, scale
        self.errors, self.log = [], []
        env = dict(os.environ, **({"CHROME": CHROME} if CHROME else {}))
        self.p = subprocess.Popen([shutil.which("node"), str(HERE / "remotion" / "serve.mjs"), sid, ar, str(scale)],
                                  stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd=HERE, env=env)
        line = self.p.stdout.readline().strip()
        if not line.startswith("{"):
            err = (line + self.p.stderr.read())[:600]
            raise SceneError(f"Remotion 打包失败：{err}")
        info = json.loads(line)
        self.dur, self.fps, self.still = info["dur"], info["fps"], info["still"]
        self.tmp = OUT / f"{stem(sid)}-{ar}-rm"
        self.tmp.mkdir(parents=True, exist_ok=True)

    def _cmd(self, *args):
        self.p.stdin.write("\t".join(str(a) for a in args) + "\n"); self.p.stdin.flush()
        out = self.p.stdout.readline()
        if not out.startswith("ok"):
            raise SceneError(f"Remotion 出错：{(out + self.p.stderr.read())[:400]}")
        return out.strip().split("\t")

    def frame(self, t, fmt="jpeg", quality=95):
        f = self.tmp / f"still-{t:.3f}.jpeg"
        self._cmd("still", f"{t:.4f}", str(f))
        b = f.read_bytes(); f.unlink()
        if fmt == "png":                                  # 静帧要 png：读回来再存一次
            return jpeg_to_png(b)
        return b

    def frames(self):
        """整段逐帧截图，返回每帧的 jpeg 字节（给 encode 用，比一帧一帧快）"""
        for old in self.tmp.glob("*.jpeg"):
            old.unlink()
        self._cmd("all", str(self.tmp))
        return [f.read_bytes() for f in sorted(self.tmp.glob("element-*.jpeg")) or sorted(self.tmp.glob("*.jpeg"))]

    def close(self):
        try:
            self.p.stdin.write("quit\n"); self.p.stdin.flush(); self.p.wait(timeout=30)
        except Exception:
            self.p.kill()
        shutil.rmtree(self.tmp, ignore_errors=True)


def jpeg_to_png(b):
    im = Image.open(io.BytesIO(b)); out = io.BytesIO(); im.save(out, "PNG")
    return out.getvalue()


def page(pw, sid, ar, scale=1.0, query=""):
    """按样片类型开页面：scene.jsx → Remotion，scene.js → 播放器"""
    return RemotionPage(sid, ar, scale) if is_remotion(sid) else Page(pw, sid, ar, scale, query)


def where(sid):
    """样片编号（C-044）→ samples/C-044/；风格包演示片 pack:<名字>[@<颜色>] → packs/<名字>/demo/"""
    return PACKS / sid[5:].split("@")[0] / "demo" if sid.startswith("pack:") else HERE / sid


def stem(sid):
    """产出文件名的前缀：样片用编号，风格包用「包名-颜色」"""
    return sid[5:].replace("@", "-") if sid.startswith("pack:") else sid


def pack_meta(pack):
    return json.loads((PACKS / pack / "meta.json").read_text(encoding="utf-8"))


def variants(pack):
    """风格包的几种切换：[(键, 中文名, 英文名, 值), …]，第一个是默认。
    切品牌色的包写 accents（值是色值，传给播放器的 accent）；切别的维度的写 variants（传给播放器的 v，值就是键）"""
    m = pack_meta(pack)
    return [tuple(a) for a in (m.get("variants") or m["accents"])]


def variant_query(pack, key):
    """某一种切换传给播放器的参数"""
    from urllib.parse import quote
    m = pack_meta(pack)
    if "variants" in m:
        return "&v=" + quote(key)
    return "&accent=" + quote(dict((a[0], a[3]) for a in m["accents"])[key])


def demo_files(sid, ar):
    """风格包演示片这一支用哪个场景和声音：(场景名, 声音文件名)。样片和没写 full 的包都是 scene、sound.py"""
    if sid.startswith("pack:"):
        base, _, key = sid[5:].partition("@")
        full, default = pack_meta(base).get("full"), variants(base)[0][0]
        if full and ((key or default) != default or ar != full):
            return "clip", "clip_sound.py"
    return "scene", "sound.py"


def is_full(sid, ar):
    """风格包的完整演示片（60–90 秒、每个视频不超过 20 MB）"""
    return sid.startswith("pack:") and bool(pack_meta(sid[5:].split("@")[0]).get("full")) and demo_files(sid, ar)[0] == "scene"


def expand(sid):
    """pack:<名字> 展开成每种切换一支（pack:<名字>@<键>）；样片编号和已带键的原样返回"""
    if not sid.startswith("pack:") or "@" in sid:
        return [sid]
    return [f"{sid}@{a[0]}" for a in variants(sid[5:])]


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
        self.pg.set_default_timeout(300000)   # 水彩笔刷这类重场景，单帧截图可能要几十秒
        self.pg.on("console", self._console)
        self.pg.on("pageerror", lambda e: (self.errors.append(str(e)), self.log.append(f"pageerror: {e}")))
        base, _, col = sid.partition("@")
        if col:                                   # 风格包的某一种切换（品牌色、画面组织、画风…）：从 meta.json 取参数传给播放器
            query += variant_query(base[5:], col)
        if demo_files(sid, ar)[0] != "scene":     # 风格包的 15 秒切换片段
            query += "&scene=" + demo_files(sid, ar)[0]
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


def scene_dur(sid, ar="16x9"):
    src = where(sid) / ("scene.jsx" if is_remotion(sid) else demo_files(sid, ar)[0] + ".js")
    m = re.search(r"\bdur[:=]\s*([\d.]+)", src.read_text(encoding="utf-8"))
    return float(m.group(1)) if m else 3.0


def make_sound(sid, dur, tag="", ar="16x9"):
    """有 sound.py 就合成声音，返回 (wav 路径, 母带, 混音原始电平)；没有就返回 (None, None, None)。"""
    src = where(sid) / demo_files(sid, ar)[1]
    if not src.exists():
        return None, None, None
    if str(HERE / "lib") not in sys.path:
        sys.path.insert(0, str(HERE / "lib"))
    from scipy.io import wavfile
    import synth
    spec = importlib.util.spec_from_file_location(f"sound_{stem(sid)}_{src.stem}".replace("-", "_"), src)
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
    limit = (FULL_MAX_FILE - 1_500_000 if is_full(sid, ar) else MAX_BYTES_TG if is_asset_class(sid)
             else MAX_BYTES * max(1, p.dur / 5))  # 风格包演示片更长，上限按时长放宽；完整演示片整个文件不超过 20 MB
    enc = subprocess.Popen([ffmpeg(), "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(p.fps),
                            "-vcodec", "mjpeg", "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "24",
                            "-pix_fmt", "yuv420p", str(silent)], stdin=subprocess.PIPE)
    frames = p.frames() if hasattr(p, "frames") else [p.frame(i / p.fps) for i in range(round(p.dur * p.fps))]
    for b in frames:
        enc.stdin.write(b)
    enc.stdin.close(); enc.wait()
    for crf in (27, 29, 31, 33, 36):              # 细节多的画面（海浪、噪点、实拍）体积大：超过上限就加大压缩重编
        if silent.stat().st_size <= limit:
            break
        log.append(f"视频 {silent.stat().st_size / 1e6:.2f} MB 超过上限，用 crf {crf} 重编")
        tmp = OUT / f"{stem(sid)}-{ar}-crf.mp4"
        subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-i", str(silent), "-c:v", "libx264", "-preset", "slow",
                        "-crf", str(crf), "-pix_fmt", "yuv420p", str(tmp)], check=True)
        tmp.replace(silent)
    vbytes = silent.stat().st_size
    wav, _, _ = make_sound(sid, p.dur, f"-{ar}", ar)
    audio = ["-i", str(wav), "-c:a", "aac", "-b:a", "128k"] if wav else []   # 不用 -shortest：声音按采样取整，比画面短一点点，-shortest 会剪掉最后几帧
    mp4 = where(sid) / f"{stem(sid)}-{ar}.mp4"
    # 去掉元数据和编码器信息（容器标签、x264 写进码流的参数 SEI），成片里不留软件、设备信息
    subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-i", str(silent), *audio, "-c:v", "copy",
                    "-bsf:v", "filter_units=remove_types=6", "-map_metadata", "-1", "-fflags", "+bitexact",
                    "-flags:a", "+bitexact", "-metadata:s:v:0", "encoder=", "-metadata:s:a:0", "encoder=",
                    "-movflags", "+faststart", str(mp4)], check=True)
    silent.unlink()
    if wav:
        wav.unlink()
    return frames, vbytes


def still_and_thumb(p, sid, ar):
    """静帧（长边 1280）；16:9 的再缩成 640 宽的缩略图写进 Skill 的 images/（只在本仓库里）"""
    still = Image.open(io.BytesIO(p.frame(p.still, "png"))).convert("RGB")
    big = still.copy(); big.thumbnail((1280, 1280), Image.LANCZOS)
    big.save(where(sid) / f"{stem(sid)}-{ar}.jpg", quality=88, optimize=True)
    if ar == "16x9" and not sid.startswith("pack:"):
        th = still.resize((640, 360), Image.LANCZOS)
        for q in (85, 78, 70, 60, 50):
            buf = io.BytesIO(); th.save(buf, "JPEG", quality=q, optimize=True)
            if buf.tell() <= 100_000:
                break
        if THUMBS.is_dir():
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
