"""T 类、G 类样片的素材：照 <编号>/assets.json 下载或生成，统一处理、去掉元数据，放进 <编号>/assets/。

    python3 tools/assets.py T-001            # 补齐缺的素材（已有的不动），最后打每份的体积和合计
    python3 tools/assets.py T-001 --only assets/vo.mp3 --force   # 重做某一份
    python3 tools/assets.py T-001 --check    # 不下载、不生成：只查文件在不在、元数据是否干净、合计是否超过 10 MB
    python3 tools/assets.py T-001 --subs     # 不再调语音合成：用 out/gen/ 里存的逐字时间重排字幕行（改了断句规则或 show 之后）
    python3 tools/assets.py pack:news-brief  # 风格包演示片的素材（packs/<名字>/demo/assets.json）
    python3 tools/assets.py --usage          # 本机调用生成服务的次数（记在 out/gen/usage.jsonl，不进仓库）

assets.json 是 {"items": [...]}，每份素材一项：
  file      放在哪（相对样片目录，assets/ 下）
  kind      素材种类：T 类 录像 / 录屏 / 照片 / 数据，G 类 生图（含语言模型写的 SVG）/ 生视频 / 语音合成（G 类的旁白记这个）；声音另记 旁白 / 原声 / 配乐 / 音效
  下载的（T 类素材、公开曲库的配乐音效）：source 出处页面、download 文件地址、license 许可、author 作者、credit 署名
  生成的（G 类素材、旁白）：model 模型名、prompt 提示词（语音写 text、voice 公开音色）、params 参数、ref 首帧图（相对样片目录）
  拿到后又改过的（裁切、局部模糊等）：edit 写改了什么、为什么
  prep      怎么处理：图片 {max 长边, crop [x, y, w, h]（0–1）, q 质量}；PDF 的一页 {page 页码, dpi}（存成图片），
            存成 .json 时是这一页的文字层（每个词和它的位置）；视频 {ss 起点, t 长度, w 宽, crop}，统一成 30 帧/秒、无声 H.264；
            音频 {ss, t, mono}，统一响度后存 mp3；数据默认原样保存，另有 {drop_comments}（CSV 去掉 # 注释行）、
            {hurdat: 风暴编号}（NOAA 最佳路径取一场）、{horizons: true}（JPL Horizons 的状态向量 → CSV）、
            {month_table: true}（网页里「年份 + 12 个月」的表 → year,month,value 的 CSV，如美国垦务局的水库月末水位）、
            {cols: [列名], skip: 开头跳过几行}（CSV 只留这几列、去掉缺值的行）、{points: [属性], sort, top}（GeoJSON 点 → CSV）、{bbox}（GeoJSON 线面裁到框里）
  of        生视频自带的声音：写那段视频的 file，从生成的原始视频里取出音轨另存（视频本身进仓库时不带声音）；
            model、prompt 照抄那段视频的
  record    录屏（本仓库自己的页面）：见 record() 的说明；录完写回鼠标轨迹 cursor
  at、gain  声音在成片里的时刻和音量（synth.assets 用）；语音合成后由本脚本写回 dur 和逐句字幕 lines

生成（生图、生视频、语音合成、生成矢量：file 以 .svg 结尾的生图）经 tools/gen.py 交给环境变量里配的适配命令，不绑定哪一家服务；没配置的那类只打提示、跳过，
其余素材照常处理。服务的 Key 由适配命令自己读，本工具不碰。
脱敏：下载和生成的原始文件、生成服务的记录只放在 out/（不进仓库）；进仓库的文件重新编码，去掉元数据和编码器信息，
assets.json 只记模型名、参数和提示词。
"""
import argparse
import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

from PIL import Image

import gen

SAMPLES = Path(__file__).resolve().parent.parent
OUT = SAMPLES / "out"
DL = OUT / "dl"
LIMIT = 10_000_000
UA = "AI-Coding-Video-sample-builder/0.1 (https://github.com/Chans-gh/AI-Coding-Video)"
IMG, VID, AUD = {".jpg", ".jpeg", ".png", ".webp"}, {".mp4", ".webm"}, {".mp3", ".ogg", ".wav", ".m4a"}
SVG = ".svg"


def ffmpeg():
    return shutil.which("ffmpeg") or sys.exit("缺 ffmpeg")


def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode:
        raise RuntimeError(f"{Path(cmd[0]).name} 出错：{(r.stderr or r.stdout)[-400:]}")
    return r.stdout


# ---------- 下载（带缓存；公共站点限流时按 Retry-After 等） ----------
def fetch(url):
    DL.mkdir(parents=True, exist_ok=True)
    ext = Path(url.split("?")[0]).suffix[:6]
    dest = DL / (hashlib.sha1(url.encode()).hexdigest()[:16] + ext)
    if dest.exists() and dest.stat().st_size:
        return dest
    for i in range(6):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as f:
                shutil.copyfileobj(r, f)
            return dest
        except urllib.error.HTTPError as e:
            if e.code not in (429, 500, 502, 503, 504) or i == 5:
                raise RuntimeError(f"下载失败 {e.code}：{url}")
            time.sleep(float(e.headers.get("Retry-After") or 5 * 2 ** i) + 1)
        except urllib.error.URLError as e:
            if i == 5:
                raise RuntimeError(f"下载失败 {e.reason}：{url}")
            time.sleep(3 * 2 ** i)


# ---------- 处理：统一格式、去掉元数据 ----------
STRIP = ["-map_metadata", "-1", "-map_chapters", "-1", "-fflags", "+bitexact", "-flags:v", "+bitexact", "-flags:a", "+bitexact",
         "-metadata:s:v:0", "encoder=", "-metadata:s:a:0", "encoder="]


def prep_image(src, dest, o):
    im = Image.open(src)
    im.load()
    if im.mode.startswith("I"):                         # 16 位灰度（国会图书馆的 TIFF 母版）→ 8 位
        im = im.point(lambda v: v / 256).convert("L") if im.mode != "I" or im.getextrema()[1] > 255 else im.convert("L")
    im = im.convert("RGBA" if dest.suffix == ".png" and im.mode in ("RGBA", "LA", "P") else "RGB")
    if o.get("crop"):
        x, y, w, h = o["crop"]
        im = im.crop((round(x * im.width), round(y * im.height), round((x + w) * im.width), round((y + h) * im.height)))
    if o.get("max"):
        im.thumbnail((o["max"], o["max"]), Image.LANCZOS)
    clean = Image.new(im.mode, im.size)                 # 只拷像素：EXIF、ICC、XMP、文字块都不带
    clean.paste(im)
    if dest.suffix == ".png":
        clean.save(dest, optimize=True)
    else:
        clean.save(dest, quality=o.get("q", 86), optimize=True, progressive=True)


def prep_video(src, dest, o):
    vf = []
    if o.get("crop"):
        vf.append(f"crop={o['crop']}")
    vf.append(f"scale={o.get('w', 1280)}:-2:flags=lanczos")
    vf.append("fps=30")
    cut = (["-ss", str(o["ss"])] if o.get("ss") else []) + ["-i", str(src)] + (["-t", str(o["t"])] if o.get("t") else [])
    run([ffmpeg(), "-y", "-loglevel", "error", *cut, "-an", "-vf", ",".join(vf), "-c:v", "libx264", "-preset", "slow",
         "-crf", str(o.get("crf", 24)), "-pix_fmt", "yuv420p",
         *STRIP, "-bsf:v", "filter_units=remove_types=6", "-movflags", "+faststart", str(dest)])
    tmp = dest.with_name(dest.stem + ".tmp" + dest.suffix)   # 编码时 ffmpeg 会再写上 encoder 标签：原样转封装一遍去掉
    run([ffmpeg(), "-y", "-loglevel", "error", "-i", str(dest), "-c", "copy", *STRIP, "-movflags", "+faststart", str(tmp)])
    tmp.replace(dest)


def prep_audio(src, dest, o):
    cut = (["-ss", str(o["ss"])] if o.get("ss") else []) + ["-i", str(src)] + (["-t", str(o["t"])] if o.get("t") else [])
    af = "loudnorm=I=-16:TP=-1.5:LRA=11" if o.get("norm", True) else "anull"
    run([ffmpeg(), "-y", "-loglevel", "error", *cut, "-vn", "-af", af, "-ar", "44100", "-ac", "1" if o.get("mono") else "2",
         "-c:a", "libmp3lame", "-b:a", o.get("br", "128k"), "-write_xing", "0", "-id3v2_version", "0", "-write_id3v1", "0",
         *STRIP, str(dest)])


def pdf_words(src, dest, page):
    """PDF 某一页的文字层 → JSON：[[词, x0, y0, x1, y1], …]，坐标是占页面宽高的比例（0–1），代码按它找引文在页面上的位置"""
    import html
    xml = run(["pdftotext", "-f", str(page), "-l", str(page), "-bbox", str(src), "-"])
    pw, ph = (float(v) for v in re.search(r'<page width="([\d.]+)" height="([\d.]+)"', xml).groups())
    rows = [[html.unescape(w), round(float(x0) / pw, 4), round(float(y0) / ph, 4), round(float(x1) / pw, 4), round(float(y1) / ph, 4)]
            for x0, y0, x1, y1, w in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', xml)]
    dest.write_text(json.dumps(rows, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")


def prep(src, dest, o):
    dest.parent.mkdir(parents=True, exist_ok=True)
    ext = dest.suffix.lower()
    if o.get("page") and Path(src).suffix.lower() == ".pdf":
        if ext == ".json":                              # 文字层
            return pdf_words(src, dest, o["page"])
        tmp = OUT / "pdfpage"                            # 页面图：pdftoppm 渲染成 PNG，再照图片处理
        run(["pdftoppm", "-f", str(o["page"]), "-l", str(o["page"]), "-r", str(o.get("dpi", 150)), "-png", "-singlefile", str(src), str(tmp)])
        src = tmp.with_suffix(".png")
    if ext in IMG:
        prep_image(src, dest, o)
    elif ext in VID:
        prep_video(src, dest, o)
    elif ext in AUD:
        prep_audio(src, dest, o)
    elif ext == SVG:                                    # 只留 <svg>…</svg>：去掉注释、<metadata>、XML 声明
        txt = Path(src).read_text(encoding="utf-8")
        m = re.search(r"<svg\b.*</svg>", txt, re.S)
        if not m:
            raise RuntimeError("生成结果里没有 <svg>…</svg>")
        txt = re.sub(r"<!--.*?-->|<metadata\b.*?</metadata>", "", m.group(0), flags=re.S)
        dest.write_text(txt.strip() + "\n", encoding="utf-8")
    elif o.get("hurdat"):                               # NOAA HURDAT2 最佳路径：只取一场风暴 → CSV
        lines = Path(src).read_text(encoding="utf-8").splitlines()
        i = next(k for k, l in enumerate(lines) if l.startswith(o["hurdat"] + ","))
        n = int(lines[i].split(",")[2])
        out = ["date,time,record,status,lat,lon,wind_kt,pressure_mb"]
        for l in lines[i + 1:i + 1 + n]:
            f = [x.strip() for x in l.split(",")]
            lat = float(f[4][:-1]) * (1 if f[4].endswith("N") else -1)
            lon = float(f[5][:-1]) * (-1 if f[5].endswith("W") else 1)
            out.append(",".join([f[0], f[1], f[2], f[3], f"{lat:g}", f"{lon:g}", f[6], f[7]]))
        dest.write_text("\n".join(out) + "\n", encoding="utf-8")
    elif o.get("horizons"):                             # JPL Horizons 的状态向量（CSV_FORMAT）：只留 $$SOE…$$EOE 之间的数据行 → CSV
        rows = Path(src).read_text(encoding="utf-8").split("$$SOE")[1].split("$$EOE")[0].strip().splitlines()
        out = ["jd,date,x_km,y_km,z_km,vx_kms,vy_kms,vz_kms"]
        for l in rows:
            f = [x.strip() for x in l.split(",") if x.strip()]
            out.append(",".join([f[0], f[1].replace("A.D. ", "")] + [f"{float(v):.6g}" for v in f[2:8]]))
        dest.write_text("\n".join(out) + "\n", encoding="utf-8")
    elif o.get("month_table"):                          # 网页里的「年份 JAN … DEC」表：去掉标签，每行年份后跟 12 个数（缺的写 ---）→ year,month,value
        import html as H
        txt = H.unescape(re.sub(r"<[^>]+>", " ", Path(src).read_text(encoding="utf-8", errors="replace")))
        out, seen = ["year,month,value"], set()
        for m in re.finditer(r"\b(1[89]\d\d|20\d\d)((?:\s+(?:-?\d+(?:\.\d+)?|---)){12})", txt):
            if m.group(1) in seen:
                continue
            seen.add(m.group(1))
            out += [f"{m.group(1)},{k + 1},{v}" for k, v in enumerate(m.group(2).split()) if v != "---"]
        dest.write_text("\n".join(out) + "\n", encoding="utf-8")
    elif o.get("points"):                               # GeoJSON 点 → CSV（只留要的属性，可按 sort 排序取前 top 个）
        js = json.loads(Path(src).read_text(encoding="utf-8"))
        rows = [{**{k: f["properties"].get(k) for k in o["points"]}, "lon": f["geometry"]["coordinates"][0], "lat": f["geometry"]["coordinates"][1]}
                for f in js["features"]]
        if o.get("sort"):
            rows.sort(key=lambda r: -(r.get(o["sort"]) or 0))
        rows = rows[:o.get("top", len(rows))]
        keys = list(o["points"]) + ["lon", "lat"]
        dest.write_text(",".join(keys) + "\n" + "\n".join(",".join(str(r[k]).replace(",", " ") for k in keys) for r in rows) + "\n", encoding="utf-8")
    elif o.get("bbox"):                                 # GeoJSON 线、面 → 只留框里的折线 [[lon, lat], …]，坐标保留 3 位小数
        x0, y0, x1, y1 = o["bbox"]
        js = json.loads(Path(src).read_text(encoding="utf-8"))
        lines = []
        for f in js["features"]:
            g = f["geometry"]
            parts = [g["coordinates"]] if g["type"] == "LineString" else g["coordinates"] if g["type"] in ("MultiLineString", "Polygon") else [r for poly in g["coordinates"] for r in poly]
            for part in parts:
                cur = []
                for lon, lat in part:
                    if x0 <= lon <= x1 and y0 <= lat <= y1:
                        cur.append([round(lon, 3), round(lat, 3)])
                    elif cur:
                        lines.append(cur); cur = []
                if len(cur) > 1:
                    lines.append(cur)
        dest.write_text(json.dumps({"bbox": o["bbox"], "lines": lines}, separators=(",", ":")) + "\n", encoding="utf-8")
    elif ext == ".csv" and o.get("cols"):              # 跳过开头 skip 行标题，只留 cols 这几列，缺值（*** 或空）的行不要
        import csv
        lines = Path(src).read_text(encoding="utf-8").splitlines()[o.get("skip", 0):]
        rows = list(csv.DictReader(lines))
        keep = [r for r in rows if all((r.get(c) or "").strip() not in ("", "***") for c in o["cols"])]
        dest.write_text(",".join(o["cols"]) + "\n" + "\n".join(",".join(r[c].strip() for c in o["cols"]) for r in keep) + "\n", encoding="utf-8")
    elif ext == ".csv" and o.get("drop_comments"):     # 只留表头和数据行（说明、联系方式等注释行不带）
        rows = [l for l in Path(src).read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")]
        dest.write_text("\n".join(rows) + "\n", encoding="utf-8")
    else:
        shutil.copyfile(src, dest)                     # 数据（CSV、JSON）原样保存


def duration(f):
    out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)])
    return float(out.strip())


def dirty(f):
    """查进仓库的文件还有没有元数据：图片看 EXIF/ICC/文字块，音视频看容器和流的标签"""
    ext = f.suffix.lower()
    if ext in IMG:
        im = Image.open(f)
        keys = set(im.info) - {"jfif", "jfif_version", "jfif_unit", "jfif_density", "dpi", "progressive", "progression", "aspect"}
        return sorted(keys)
    if ext in VID | AUD:
        d = json.loads(run(["ffprobe", "-v", "error", "-show_entries", "format_tags:stream_tags", "-of", "json", str(f)]))
        tags = dict(d.get("format", {}).get("tags", {}))
        for s in d.get("streams", []):
            tags.update(s.get("tags", {}))
        ok = {"handler_name", "vendor_id", "language", "major_brand", "minor_version", "compatible_brands"}
        bad = sorted(k for k in tags if k not in ok)
        if ext in VID and b"x264 - core" in f.read_bytes()[:400000]:
            bad.append("x264 参数")
        return bad
    return []


# ---------- 生成：生图、生视频、语音合成都交给 tools/gen.py ----------
class Skipped(Exception):
    """这一类生成服务没配置：只提示，不算出错"""


def job_id(item):
    return re.sub(r"\W", "_", Path(item["file"]).stem)


def gen_visual(sid, d, item):
    """生图 / 生视频；返回生成的原始文件（在 out/gen/<编号>/ 下，不进仓库）"""
    ext = Path(item["file"]).suffix.lower()
    kind = "video" if ext in VID else "svg" if ext == SVG else "image"
    job = {"model": item["model"], "prompt": item["prompt"], "params": item.get("params", {})}
    if item.get("ref"):
        job["refs"] = [str((d / item["ref"]).resolve())]
    res = gen.generate(kind, sid, job_id(item), job)
    if res is None:
        raise Skipped(gen.missing(kind))
    return res[0]


def raw_video(sid, raws, of):
    """生视频的原始文件（带声音）：这次刚生成的，或 out/gen/<编号>/<文件名>/ 里上次留下的"""
    if of in raws:
        return raws[of]
    got = sorted(f for f in (gen.GEN_OUT / sid / job_id({"file": of})).glob("*") if f.suffix.lower() in VID)
    if not got:
        raise RuntimeError(f"找不到 {of} 生成时的原始视频（在 out/gen/{sid}/ 下），先重做 {of}")
    return got[-1]


def gen_speech(sid, d, item):
    """语音合成（公开音色），同时要逐句字幕；返回 (音频, 字幕行)"""
    job = {"model": item["model"], "text": item["text"], "voice": item.get("voice", ""), "params": item.get("params", {})}
    res = gen.generate("tts", sid, job_id(item), job)
    if res is None:
        raise Skipped(gen.missing("tts"))
    raw, subs = res
    lines = []
    if subs:
        js = json.loads(subs.read_text(encoding="utf-8"))
        (gen.GEN_OUT / sid / f"{job_id(item)}.subs.json").write_text(json.dumps(js, ensure_ascii=False, indent=1), encoding="utf-8")
        lines = sub_lines(js, item.get("show", {}))
    return raw, lines


def sub_lines(js, show=None):
    """字幕 JSON（格式见 tools/gen.py 开头）→ 按标点断成的字幕行 [{t0, t1, text}]（秒）。
    show 是 {念法: 显示}：旁白里数字要写成念法（一九七二年），字幕上换回 1972 年"""
    out = []
    for seg in js:
        text, words = seg.get("text", ""), seg.get("words") or []
        if not words:                                                    # 只有句级时间
            out.append({"t0": seg["t0"], "t1": seg["t1"], "text": text})
            continue
        cur = None
        for w in words:
            a, b = w["t0"], w["t1"]
            if cur is None:
                cur = {"t0": a, "t1": b, "text": ""}
            cur["text"] += text[w["begin"]:w["end"]]
            cur["t1"] = b
            nxt = text[w["end"]:w["end"] + 1]
            plain = re.sub(r"[，。！？；：,.!?;:—…、\s]", "", cur["text"])
            if nxt and (nxt in "。！？；.!?;" or (nxt in "，：,:—" and len(plain) >= 9)):   # 句末断行；逗号处够长才断
                out.append(cur); cur = None
        if cur:
            out.append(cur)
    for i, l in enumerate(out):                                          # 行首的问号、叹号属于上一行
        m = re.match(r"\s*([？！?!…]+)", l["text"])
        if m and i:
            out[i - 1]["text"] += m.group(1)
            l["text"] = l["text"][m.end():]
    for l in out:
        t = l["text"].strip().strip("，。；：,;:、")
        for k, v in (show or {}).items():
            t = t.replace(k, v)
        t = re.sub(r"([\u4e00-\u9fff])([0-9A-Za-z])", r"\1 \2", t)          # 中文和数字、字母之间留一个空格
        t = re.sub(r"([0-9A-Za-z%])([\u4e00-\u9fff])", r"\1 \2", t)
        l.update(t0=round(l["t0"], 3), t1=round(l["t1"], 3), text=t)
    return [l for l in out if l["text"]]


# ---------- 录屏：用 Playwright 照 steps 操作本仓库的页面，同时记下鼠标轨迹 ----------
def record(sid, item):
    """item["record"] = {"page": 相对样片目录的 HTML, "size": [宽, 高], "steps": [[动作, 参数…], …]}
    动作：wait 秒 / move 选择器 [秒] / click 选择器 [秒]（先移过去再点）/ scroll 选择器 [留出的像素] [秒]（平滑滚到它）/ key 按键。
    交给 tools/record.js（Node 版 Playwright）去录；返回 (原始 webm, 鼠标轨迹 [[秒, x, y, 是否按下], …])，坐标是 0–1，画面里由 scene.js 重画鼠标"""
    spec = item["record"]
    work = OUT / "rec" / sid
    shutil.rmtree(work, ignore_errors=True); work.mkdir(parents=True)
    job = {"url": (SAMPLES / sid / spec["page"]).resolve().as_uri(), "size": spec.get("size", [1280, 720]), "steps": spec["steps"]}
    (work / "spec.json").write_text(json.dumps(job, ensure_ascii=False), encoding="utf-8")
    r = subprocess.run(["node", str(Path(__file__).with_name("record.js")), str(work / "spec.json"), str(work)],
                       cwd=SAMPLES, capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError("录屏失败：" + (r.stderr.strip().splitlines() or ["?"])[-1])
    return work / "video.webm", json.loads((work / "track.json").read_text())


# ---------- 主流程 ----------
def where(sid):
    """样片编号 → samples/<编号>/；风格包 pack:<名字> → packs/<名字>/demo/（随 Skill 安装时 samples/ 和 packs/ 也并排）"""
    return SAMPLES.parent / "packs" / sid[5:] / "demo" if sid.startswith("pack:") else SAMPLES / sid


def build(sid, only=None, force=False, check=False):
    d = where(sid)
    af = d / "assets.json"
    if not af.exists():
        print(f"✗ {sid}：没有 assets.json"); return False
    A = json.loads(af.read_text(encoding="utf-8"))
    ok, changed, total, seen, skipped, raws = True, False, 0, set(), [], {}
    sid = sid.replace(":", "-")                         # 生成记录的目录名（out/gen/pack-<名字>/）
    for it in A["items"]:
        dest = d / it["file"]
        if it["file"] in seen:                          # 同一个文件被几项引用（如一段原声分几处用）：只处理、只计一次
            continue
        seen.add(it["file"])
        if only and it["file"] not in only:
            if dest.exists():
                total += dest.stat().st_size
            continue
        if not check and (force or not dest.exists()):
            try:
                if it.get("model") and it.get("text"):
                    raw, lines = gen_speech(sid, d, it)
                    prep(raw, dest, {**it.get("prep", {}), "mono": True})
                    it["dur"] = round(duration(dest), 3)
                    if lines:
                        it["lines"] = lines
                    changed = True
                elif it.get("of"):
                    prep(raw_video(sid, raws, it["of"]), dest, it.get("prep", {}))
                elif it.get("model"):
                    raws[it["file"]] = gen_visual(sid, d, it)
                    prep(raws[it["file"]], dest, it.get("prep", {}))
                elif it.get("record"):
                    raw, it["cursor"] = record(sid, it)
                    prep(raw, dest, it.get("prep", {}))
                    changed = True
                elif it.get("download"):
                    prep(fetch(it["download"]), dest, it.get("prep", {}))
                    if Path(it["file"]).suffix.lower() in AUD and it.get("kind") in ("旁白", "原声", "语音合成"):
                        it["dur"] = round(duration(dest), 3); changed = True
            except Skipped as e:
                if str(e) not in skipped:
                    print(f"– {e}")
                skipped.append(str(e))
                if not dest.exists():
                    print(f"– {it['file']}：先跳过"); continue
                print(f"– {it['file']}：先跳过，用原来的文件")
            except Exception as e:
                print(f"✗ {it['file']}：{e}"); ok = False; continue
        if not dest.exists():
            print(f"✗ {it['file']}：不存在"); ok = False; continue
        bad = dirty(dest)
        size = dest.stat().st_size
        total += size
        extra = f"  {duration(dest):.1f}s" if dest.suffix.lower() in VID | AUD else ""
        print(f"{'✗' if bad else '✓'} {it['file']:28} {it['kind']:4} {size / 1e3:7.0f} KB{extra}" + (f"  残留元数据：{', '.join(bad)}" if bad else ""))
        ok &= not bad
    if changed:
        af.write_text(json.dumps(A, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    over = total > LIMIT
    print(f"{'✗' if over else '✓'} {sid} 素材合计 {total / 1e6:.2f} MB" + ("（超过 10 MB）" if over else "")
          + (f"；{len(skipped)} 份要生成的没配置服务，先跳过" if skipped else ""))
    return ok and not over


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="*")
    ap.add_argument("--only", nargs="+")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--usage", action="store_true")
    ap.add_argument("--subs", action="store_true")
    a = ap.parse_args()
    if a.subs:
        for sid in a.ids:
            af = where(sid) / "assets.json"
            A = json.loads(af.read_text(encoding="utf-8"))
            for it in A["items"]:
                sj = gen.GEN_OUT / sid.replace(":", "-") / (job_id(it) + ".subs.json")
                if it.get("text") and sj.exists():
                    it["lines"] = sub_lines(json.loads(sj.read_text(encoding="utf-8")), it.get("show", {}))
                    print(f"{sid} {it['file']}：" + " / ".join(l["text"] for l in it["lines"]))
            af.write_text(json.dumps(A, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        return
    if a.usage:
        f = gen.GEN_OUT / "usage.jsonl"
        rows = [json.loads(l) for l in f.read_text(encoding="utf-8").splitlines()] if f.exists() else []
        by = {}
        for r in rows:
            by.setdefault((r["sid"], r["type"]), []).append(r["model"])
        for (sid, t), ms in sorted(by.items()):
            print(f"{sid} {t:5} {len(ms)} 次  " + "、".join(sorted(set(ms))))
        print(f"合计 {len(rows)} 次")
        return
    good = all([build(s, a.only, a.force, a.check) for s in a.ids])
    sys.exit(0 if good else 1)


if __name__ == "__main__":
    main()
