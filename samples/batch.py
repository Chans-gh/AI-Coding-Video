"""批量出片和自动检查。每个样片每个画幅只打一行摘要，详细日志写到 out/<编号>-<画幅>.log。

    python3 batch.py C-001 C-064            # 出横竖两版视频 + 声音 + 静帧 + 缩略图，并检查
    python3 batch.py C-001 --quick          # 不出视频：只抽几帧低分辨率截图、合成声音、检查（改代码时用）；
                                            # 风格包的完整演示片另外每个镜头抽一帧（按 demo/segments.json），拼成 out/quick/<名字>-<画幅>.jpg
    python3 batch.py all --quick            # 所有已有 scene.js 的样片
    python3 batch.py C-001 --ar 16x9        # 只出一个画幅
    python3 batch.py C-001 --sound          # 只合成声音到 out/C-001.wav，改配乐时试听
    python3 batch.py C-001 -j 2             # 并行数（默认 4）
    python3 batch.py C-001 --at 2.4         # 只截 2.4 秒那一帧（全分辨率）到 out/，单独看可疑的画面
    python3 batch.py C-178 C-179 --sheet    # 不重新出片：从已有的 mp4 抽帧，重画这几个样片的总览图
    python3 batch.py pack:dark-keynote      # 风格包的演示片（packs/dark-keynote/demo/），每种切换（品牌色、画面组织、画风…）一支，时长可到 30 秒
    python3 batch.py pack:dark-keynote@orange   # 只出一种品牌色（切别的维度的包写 variants 的键，如 pack:style-swap@clay）
    python3 batch.py pack:dark-keynote@purple --ar 16x9   # 只出完整演示片（meta.json 写了 full 的包：默认那一种在 full 画幅，20–90 秒）

检查项（任一项不过就打 ✗ 和原因）：脚本报错、黑屏或白屏、画面不动、声音静音或削波、时长、体积。
时长和体积：C 类 3–5 秒、视频流 2.5 MB 以内；T 类、G 类（带 assets/ 素材）8–15 秒、每个视频不超过 4 MB；风格包演示片 5–30 秒，
完整演示片 20–90 秒、每个视频不超过 20 MB。
总览图：out/sheet.jpg（每行一个样片，横竖各 4 帧，最多 6 个样片一张；多的写 sheet-2.jpg …）。
有 ✗ 时退出码为 1。
"""
import argparse, io, json, subprocess, sys, time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

import render as R

HERE = R.HERE
PICK = (.1, .35, .6, .9)        # 总览图取的时刻（占时长的比例）
GAP = .2                        # 查“画面不动”时比较相隔 0.2 秒的两帧（一拍二的定格动画也不会误报）
ROW_H = 240


def audio_stats(x, raw):
    """母带的峰值、RMS（dBFS），以及混音原始电平压进软限幅的比例"""
    peak = float(np.max(np.abs(x))) + 1e-12
    rms = float(np.sqrt(np.mean(x ** 2))) + 1e-12
    over = float(np.mean(np.abs(raw * 1.1) > 2.0))      # tanh(2) ≈ 0.96：这部分已被压平
    return 20 * np.log10(peak), 20 * np.log10(rms), over


def check_frames(grays, pairs):
    """grays：抽查的帧；pairs：相隔 GAP 秒的帧差。返回原因列表"""
    why = []
    black = sum(g.mean() < 3 and g.std() < 2 for g in grays)
    white = sum(g.mean() > 252 and g.std() < 2 for g in grays)
    if black * 2 >= len(grays):
        why.append(f"黑屏（{black}/{len(grays)} 帧）")
    if white * 2 >= len(grays):
        why.append(f"白屏（{white}/{len(grays)} 帧）")
    frozen = sum(d < .05 for d in pairs) / max(1, len(pairs))
    if frozen >= .4:
        why.append(f"画面不动（{frozen:.0%} 的时间）")
    return why


def small(jpeg, h=ROW_H):
    im = Image.open(io.BytesIO(jpeg)).convert("RGB")
    im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=85)
    return b.getvalue()


def task(sid, ar, quick):
    from playwright.sync_api import sync_playwright
    log, why, t0 = [], [], time.time()
    res = {"sid": sid, "ar": ar, "thumbs": []}
    try:
        with sync_playwright() as pw:
            try:
                p = R.page(pw, sid, ar, scale=.5 if quick else 1.0)
            except R.SceneError as e:
                log.append(f"脚本报错：{e}")
                return finish(res, [f"脚本报错：{str(e)[:80]}"], log, t0, "")
            dur, fps, gap = p.dur, p.fps, round(GAP * p.fps)
            if quick:
                shots = [(p.frame(dur * k, quality=80), p.frame(dur * k + GAP, quality=80)) for k in PICK]
                grays = [R.probe(a) for a, _ in shots]
                pairs = [float(np.abs(R.probe(a) - R.probe(b)).mean()) for a, b in shots]
                res["thumbs"] = [small(a) for a, _ in shots]
                size = ""
                if R.is_full(sid, ar):                    # 完整演示片：另外每个镜头抽一帧，拼成 out/quick/<名字>-<画幅>.jpg
                    ts = shot_times(sid, dur)
                    full_sheet([p.frame(t, quality=80) for t in ts], ts, R.OUT / "quick" / f"{R.stem(sid)}-{ar}.jpg")
            else:
                frames, vbytes = R.encode(p, sid, ar, log)
                grays = [R.probe(b) for b in frames]
                pairs = [float(np.abs(grays[i] - grays[i - gap]).mean()) for i in range(gap, len(grays))]
                res["thumbs"] = [small(frames[min(len(frames) - 1, round(dur * k * fps))]) for k in PICK]
                R.still_and_thumb(p, sid, ar)
                mp4 = R.where(sid) / f"{R.stem(sid)}-{ar}.mp4"
                size = f"{mp4.stat().st_size / 1e6:.1f} MB"
                if R.is_full(sid, ar):
                    if mp4.stat().st_size > R.FULL_MAX_FILE:
                        why.append(f"体积超限（{mp4.stat().st_size / 1e6:.1f} MB > 20 MB）")
                elif R.is_asset_class(sid):
                    if mp4.stat().st_size > R.MAX_FILE_TG:
                        why.append(f"体积超限（{mp4.stat().st_size / 1e6:.1f} MB > 4 MB）")
                elif vbytes > R.MAX_BYTES * max(1, dur / 5):
                    why.append(f"体积超限（视频 {vbytes / 1e6:.1f} MB）")
                real = R.mp4_duration(mp4)
                if real is not None and abs(real - dur) > .15:
                    why.append(f"成片时长 {real:.2f}s ≠ {dur}s")
            p.close()
            why += [f"脚本报错：{e[:80]}" for e in p.errors[:1]]
            log += p.log
            why += check_frames(grays, pairs)
            log.append(f"帧差（相隔 {GAP}s）：" + " ".join(f"{d:.2f}" for d in pairs[:: max(1, len(pairs) // 12)]))
            lo, hi = ((20, 90) if R.is_full(sid, ar) else (5, 30) if sid.startswith("pack:")   # 风格包完整演示片、切换片段、带素材的样片更长
                      else (8, 15) if R.is_asset_class(sid) else (3, 5))
            if not lo <= dur <= hi:
                why.append(f"时长 {dur}s 不在 {lo}–{hi} 秒")
            snd = ""
            _, x, raw = R.make_sound(sid, dur, f"-{ar}-chk", ar)
            if x is None:
                why.append("没有 sound.py")
            else:
                (R.OUT / f"{R.stem(sid)}-{ar}-chk.wav").unlink()
                pk, rms, over = audio_stats(x, raw)
                snd = f"声 {rms:.0f} dB"
                log.append(f"声音：峰值 {pk:.1f} dBFS，RMS {rms:.1f} dBFS，压平 {over:.2%}")
                if rms < -40:
                    why.append(f"声音静音（RMS {rms:.0f} dB）")
                if over > .01:
                    why.append(f"声音削波（{over:.1%} 的采样被压平，调小音量）")
            motion = f"动 {np.median(pairs):.1f}" if pairs else ""
            return finish(res, why, log, t0, "  ".join(s for s in (f"{dur:g}s", size, motion, snd) if s))
    except Exception as e:                                   # 出片流程本身出错
        log.append(f"异常：{e!r}")
        return finish(res, [f"出片失败：{str(e)[:80]}"], log, t0, "")


def shot_times(sid, dur):
    """完整演示片每个镜头取哪一刻看：有 demo/segments.json 就取每段的 3/4 处（入场动画已经走完），没有就每 2 秒一帧"""
    f = R.where(sid) / "segments.json"
    if not f.exists():
        return [k * 2.0 + 1.0 for k in range(int((dur - 1.0) // 2) + 1)]
    at, ts = 0.0, []
    for g in json.loads(f.read_text(encoding="utf-8"))["segs"]:
        ts.append(round(at + g["d"] * .75, 3)); at += g["d"]
    return ts


def full_sheet(jpegs, ts, out, cols=8):
    """一串抽帧拼成一张总览图，每格左上角标出第几个镜头和秒数"""
    ims = [Image.open(io.BytesIO(b)).convert("RGB") for b in jpegs]
    w = 480; h = round(w * ims[0].height / ims[0].width)
    sheet = Image.new("RGB", (cols * w, -(-len(ims) // cols) * h), "black")
    d = ImageDraw.Draw(sheet)
    for k, im in enumerate(ims):
        x, y = k % cols * w, k // cols * h
        sheet.paste(im.resize((w, h), Image.LANCZOS), (x, y))
        d.rectangle([x, y, x + 96, y + 22], fill="black"); d.text((x + 4, y + 3), f"{k + 1} · {ts[k]:.1f}s", fill="white", font=font(16))
    out.parent.mkdir(parents=True, exist_ok=True); sheet.save(out, quality=82)


def finish(res, why, log, t0, info):
    res["ok"] = not why
    mark = "✓" if not why else "✗ " + "；".join(why)
    res["line"] = f"{'✓' if not why else '✗'} {res['sid']} {res['ar']:5} {info}  {time.time() - t0:.0f}s" + ("" if not why else "  " + "；".join(why))
    R.OUT.mkdir(exist_ok=True)
    (R.OUT / f"{R.stem(res['sid'])}-{res['ar']}.log").write_text("\n".join(log + [mark]) + "\n", encoding="utf-8")
    return res


def font(size):
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


SIZE_W = {"16x9": 16 / 9, "9x16": 9 / 16}


def sheets(ids, results, ars):
    """每行一个样片：编号 + 横版 4 帧 + 竖版 4 帧；每张最多 6 行"""
    R.OUT.mkdir(exist_ok=True)
    for old in R.OUT.glob("sheet*.jpg"):
        old.unlink()
    lab, pad = 150, 8
    slot = {ar: round(ROW_H * SIZE_W[ar]) + pad for ar in ars}
    x0 = {ar: lab + sum(4 * slot[b] for b in ars[:ars.index(ar)]) for ar in ars}
    width = lab + sum(4 * slot[ar] for ar in ars)
    paths = []
    for k in range(0, len(ids), 6):
        chunk = ids[k:k + 6]
        sheet = Image.new("RGB", (width, len(chunk) * (ROW_H + pad) + pad), (24, 24, 24))
        d = ImageDraw.Draw(sheet)
        for j, sid in enumerate(chunk):
            y = pad + j * (ROW_H + pad)
            d.text((12, y + 10), sid, fill=(240, 240, 240), font=font(30))
            for n, ar in enumerate(ars):
                r = results.get((sid, ar))
                ok = bool(r and r["ok"])
                d.text((12, y + 60 + 40 * n), f"{ar} {'OK' if ok else 'X'}",
                       fill=(120, 230, 120) if ok else (255, 90, 90), font=font(24))
                for m, b in enumerate(r["thumbs"] if r else []):
                    sheet.paste(Image.open(io.BytesIO(b)), (x0[ar] + m * slot[ar], y))
        p = R.OUT / ("sheet.jpg" if k == 0 else f"sheet-{k // 6 + 1}.jpg")
        sheet.save(p, quality=85)
        paths.append(p)
    return paths


def all_ids():
    return sorted({p.parent.name for c in "CTG" for pat in (f"{c}-*/scene.js", f"{c}-*/scene.jsx") for p in HERE.glob(pat)})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="+")
    ap.add_argument("--quick", action="store_true")
    ap.add_argument("--sound", action="store_true")
    ap.add_argument("--ar", choices=["16x9", "9x16", "both"], default="both")
    ap.add_argument("-j", type=int, default=4)
    ap.add_argument("--at", type=float)
    ap.add_argument("--sheet", action="store_true")
    a = ap.parse_args()
    ids = all_ids() if a.ids == ["all"] else [x for i in a.ids for x in R.expand(i)]
    if a.sound:
        ar = "9x16" if a.ar == "9x16" else "16x9"         # 风格包：完整演示片和切换片段的声音不同，按 --ar 取
        for sid in ids:
            wav, x, raw = R.make_sound(sid, R.scene_dur(sid, ar), "", ar)
            if wav is None:
                print(f"✗ {sid} 没有 sound.py"); continue
            pk, rms, over = audio_stats(x, raw)
            print(f"{sid} → out/{wav.name}  峰值 {pk:.1f} dBFS  RMS {rms:.1f} dBFS  压平 {over:.2%}")
        return
    if not (HERE / "node_modules" / "@fontsource").exists():
        sys.exit("缺字体：先在 samples/ 下运行 npm install")
    missing = [s for s in ids if not any((R.where(s) / n).exists() for n in ("scene.js", "scene.jsx"))]
    if missing:
        sys.exit(f"没有 scene.js：{' '.join(missing)}（先用 new.py 起骨架）")
    ars = ["16x9", "9x16"] if a.ar == "both" else [a.ar]
    if a.sheet:
        results = {}
        for sid in ids:
            for ar in ars:
                mp4 = R.where(sid) / f"{R.stem(sid)}-{ar}.mp4"
                real = R.mp4_duration(mp4) if mp4.exists() else None
                if real is None:
                    print(f"✗ {sid} {ar} 没有成片"); continue
                thumbs = [small(subprocess.run([R.ffmpeg(), "-loglevel", "error", "-ss", f"{real * k:.3f}", "-i", str(mp4), "-frames:v", "1",
                                                "-f", "image2pipe", "-vcodec", "mjpeg", "-"], capture_output=True, check=True).stdout) for k in PICK]
                results[(sid, ar)] = {"ok": True, "thumbs": thumbs}
        paths = sheets(ids, results, ars)
        print("总览图 → " + "、".join(f"out/{p.name}" for p in paths))
        return
    if a.at is not None:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            for sid in ids:
                for ar in ars:
                    p = R.page(pw, sid, ar)
                    out = R.OUT / f"{R.stem(sid)}-{ar}-{a.at:g}s.jpg"
                    R.OUT.mkdir(exist_ok=True); out.write_bytes(p.frame(a.at, quality=90)); p.close()
                    print(f"{sid} {ar} {a.at:g}s → out/{out.name}" + (f"  报错：{p.errors[0][:80]}" if p.errors else ""))
        return
    jobs = [(s, ar) for s in ids for ar in ars]
    results, t0 = {}, time.time()
    with ProcessPoolExecutor(max_workers=a.j) as ex:
        futs = {ex.submit(task, s, ar, a.quick): (s, ar) for s, ar in jobs}
        for f in as_completed(futs):
            r = f.result()
            results[(r["sid"], r["ar"])] = r
            print(r["line"], flush=True)
    bad = [k for k, r in results.items() if not r["ok"]]
    paths = sheets(ids, results, ars)
    print(f"{len(jobs) - len(bad)}/{len(jobs)} 通过，用时 {time.time() - t0:.0f}s；总览图 → " +
          "、".join(f"out/{p.name}" for p in paths) + ("；日志在 out/<编号>-<画幅>.log" if bad else ""))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
