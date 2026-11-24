"""Compile a reference template to the film tools' storyboard, script and timing."""
import copy
import os
import shutil
import subprocess
import tempfile
import wave
from pathlib import Path

from reference_data import (
    CUT_TOLERANCE_MS, atomic_write, digest, index_by_id,
    integer, json_text, mapping, require, text,
)
from reference_inspect import contact_sheet, ffmpeg, frame_stats, spec

HERE = Path(__file__).resolve().parent
ACTIONS = {"connect", "tug", "split", "suspend", "wrap", "close", "step", "release", "hold"}
SOUNDS = {"plink", "tension", "swish", "impact", "tag"}
AR = {"16:9": (1280, 720), "9:16": (720, 1280)}


def replacements(episode, key, ids, partial=False):
    values = mapping(episode.get(key), f"episode.{key}")
    require(set(values) <= set(ids) if partial else set(values) == set(ids), f"episode.{key} 的条目须匹配模板 ID")
    return values


def rewrite(plan, episode):
    topic = {k: text(episode.get(k), f"episode.{k}").strip() for k in ("theme", "thesis", "prop")}
    require(topic["theme"] != plan["topic"]["theme"], "同题回放请用 --replay")
    plan["topic"] = topic
    cues, speech = plan["cues"], plan["speech"]
    actions = index_by_id(cues["action"], "action")
    for key, kind in replacements(episode, "actions", actions).items():
        require(isinstance(kind, str) and kind in ACTIONS, f"动作 {key} 不能使用 {kind}")
        actions[key]["type"] = kind
    screen = index_by_id(cues["screen"], "screen")
    for key, entry in replacements(episode, "screen", screen).items():
        ref = screen[key]
        entry = mapping(entry, key)
        value = entry.get("text")
        require(isinstance(value, str), f"{key}.text 需要字符串")
        require(value.strip() or ref["role"] in ("label", "tag", "translation"), f"{key} 是必要的屏幕文字")
        ref["text"] = value.strip()
        ref.pop("accent", None)
        if "accent" in entry:
            require(isinstance(entry["accent"], str) and entry["accent"] in value, f"{key}.accent 须取自显示文字")
            ref["accent"] = entry["accent"]
    sounds = index_by_id(cues["sound"], "sound")
    for key, value in replacements(episode, "sounds", sounds, partial=True).items():
        require(isinstance(value, str) and value in SOUNDS, f"声音 {key} 不能使用 {value}")
        sounds[key]["type"] = value
    lines = index_by_id(speech["lines"], "speech.lines")
    for key, value in replacements(episode, "lines", lines).items():
        lines[key]["text"] = text(value, f"台词 {key}")
    for line in lines.values():
        linked_id = line.get("screen_copy_id")
        if linked_id:
            require(screen[linked_id]["text"], f"{line['id']} 需要对应的屏幕文案")
    cues["screen"] = [item for item in cues["screen"] if item["text"]]


def compile_plan(data, episode=None, ar=None, duration_ms=None):
    render = data["render"]
    require(render.get("style") == "dark-puppet", "模板需要已支持的渲染样式，首版支持 dark-puppet")
    require(data["speech"]["mode"] != "uncertain", "请先核实参考片的人声模式")
    specs = {**data["defaults"]}
    source_ms = specs["duration_ms"]
    target_ms = duration_ms if duration_ms is not None else source_ms
    integer(target_ms, "成片时长（毫秒）", 8000, 20000)
    fps = integer(specs["fps"], "成片帧率", 12, 60)
    if ar is None:
        w, h = specs["width"], specs["height"]
        require(w * 9 == h * 16 or w * 16 == h * 9, "首版可渲染横屏或竖屏，请指定 --ar")
        ar = "16:9" if w >= h else "9:16"
        require(w % 2 == h % 2 == 0 and 256 <= min(w, h) and max(w, h) <= 1920,
                "默认分辨率超出可渲染范围，请指定 --ar")
    else:
        specs["width"], specs["height"] = AR[ar]
    nframes = round(target_ms * fps / 1000)
    specs["duration_ms"] = round(nframes * 1000 / fps)

    def frame_ms(value):
        return (round(value * nframes / source_ms) * 1000) // fps

    plan = {k: copy.deepcopy(data[k]) for k in ("topic", "beats", "speech", "cues")}
    for line in plan["speech"]["lines"]:
        line["text"] = line["source_text"]
    if episode is not None:
        rewrite(plan, mapping(episode, "换题稿"))
    for beat in plan["beats"]:
        beat["start_ms"], beat["end_ms"] = frame_ms(beat["start_ms"]), frame_ms(beat["end_ms"])
        require(beat["end_ms"] - beat["start_ms"] >= 500, "调整时长后有节拍短于 0.5 秒")
    for kind, rows in plan["cues"].items():
        for cue in rows:
            cue["at_ms"] = frame_ms(cue["at_ms"])
            if "end_ms" in cue:
                cue["end_ms"] = frame_ms(cue["end_ms"])
                require(cue["end_ms"] > cue["at_ms"], f"{cue['id']} 调整后没有可用帧")
            require(cue["at_ms"] < specs["duration_ms"], f"{cue['id']} 调整后落在成片之外")
    for line in plan["speech"]["lines"]:
        line["start_ms"], line["end_ms"] = frame_ms(line["start_ms"]), frame_ms(line["end_ms"])
    cues = plan["cues"]
    require(all(c["type"] in ACTIONS for c in cues["action"]), "此舞台有未实现的道具动作")
    require(all(c["type"] in SOUNDS for c in cues["sound"]), "此舞台有未实现的声音事件")
    require(len(cues["transition"]) == 1 and cues["transition"][0]["type"] == "flash", "此舞台需要一道闪白切入片名")
    flash = cues["transition"][0]["at_ms"]
    require(500 <= flash <= specs["duration_ms"] - 500, "闪白前后的两个分镜各需至少 0.5 秒")
    titles = [c for c in cues["screen"] if c["role"] == "title"]
    require(len(titles) == 1 and titles[0]["at_ms"] == flash, "片名须和闪白同帧")
    require(any(c["type"] == "impact" and abs(c["at_ms"] - flash) <= 2000 / fps for c in cues["sound"]),
            "闪白两帧内需要一个片名重音")
    require(len([c for c in cues["screen"] if c["role"] == "tag"]) <= 8, "此舞台最多显示八张吊牌")
    return {**plan, "spec": specs, "ar": ar, "frames": nframes, "layout": render.get("layout", {}),
            "mode": "replay" if episode is None else "episode"}


def take_voices(plan, out, audio_dir):
    from gen import generate, missing

    items = []
    speakers = index_by_id(plan["speech"]["speakers"], "speakers")
    lines = plan["speech"]["lines"]
    if not lines:
        return items
    entry_ids = {line["speaker_id"] for line in lines
                 if not audio_dir or not (Path(audio_dir) / f"{line['id']}.wav").is_file()}
    if len(entry_ids) > 1:
        require(not os.environ.get("AICV_TTS_VOICE"), "多角色合成请取消全局 AICV_TTS_VOICE，按说话人指定音色")
        voices_used = {(speakers[key].get("voice") or {}).get("voice") for key in entry_ids}
        require(len(voices_used) == len(entry_ids) and None not in voices_used, "多角色合成需要分别配置不同音色")
    voices = out / "vo"
    voices.mkdir()
    for line in lines:
        key = line["id"]
        person = speakers[line["speaker_id"]]
        picked = Path(audio_dir) / f"{key}.wav" if audio_dir else None
        if picked and picked.is_file():
            source = picked
        else:
            voice = person.get("voice")
            require(voice, f"台词 {key} 需要 {key}.wav 或为 {person['name']} 配置音色")
            missing_tts = missing("tts")
            require(missing_tts is None, missing_tts or "")
            result = generate("tts", "reference", key, {
                "model": voice.get("model", ""), "voice": voice["voice"], "text": line["text"],
                "sentences": [line["text"]], "params": {"speed": voice.get("speed", 1)},
            }, work=out / "tts")
            source, _ = result
        target = voices / f"{key}.wav"
        ffmpeg("-i", source, "-map", "0:a:0", "-ac", 1, "-ar", 44100, "-c:a", "pcm_s16le", target, capture=False)
        with wave.open(str(target), "rb") as wav:
            seconds = wav.getnframes() / wav.getframerate()
        window = (line["end_ms"] - line["start_ms"]) / 1000
        require(0 < seconds <= window, f"台词 {key} 实长 {seconds:.2f} 秒，时窗 {window:.2f} 秒。缩句或重新排时再渲染")
        linked = next((c["text"] for c in plan["cues"]["screen"] if c["id"] == line.get("screen_copy_id")), None)
        items.append({"id": key, "speaker_id": person["id"], "screen_copy_id": line.get("screen_copy_id"),
                      "file": f"vo/{target.name}", "at": line["start_ms"] / 1000, "t": seconds,
                      "text": line["text"], "show": linked or line["text"]})
    return items


def write_film_files(out, plan, voice_items, dimensions):
    topic, beats = plan["topic"], plan["beats"]
    cut_ms = plan["cues"]["transition"][0]["at_ms"]
    duration = plan["frames"] / plan["spec"]["fps"]
    stages = [
        {"what": f"全景 · 两只木偶围绕{topic['prop']}完成动作递进", "ref": "C-013", "sec": cut_ms / 1000},
        {"what": f"片名特写 · {topic['theme']}", "ref": "C-121", "sec": duration - cut_ms / 1000, "cut": "硬切"},
    ]
    speech = plan["speech"]
    voiceover = None
    if speech["mode"] == "voiceover":
        speaker = speech["speakers"][0]
        voiceover = speaker.get("voice") or {"model": "recorded", "voice": speaker["name"], "speed": 1}
    storyboard = {
        "brief": {"for": "短片观众", "gain": topic["thesis"], "line": topic["thesis"], "sec": duration,
                  "lang": "zh", "voice": speech["mode"] == "voiceover", "must": [], "avoid": []},
        "ar": plan["ar"], "status": "草稿",
        "unify": {"pack": None, "palette": dimensions["visual"]["fixed"], "fonts": "宋体或 Noto Serif CJK SC",
                  "subs": dimensions["screen_copy"]["fixed"], "trans": "单段内闪白",
                  "music": dimensions["sound"]["fixed"], "voice": voiceover},
        "segments": [{"seg": "P1", "title": topic["theme"], "content": topic["thesis"], "sec": duration, "lead": "C",
                      "uses": [{"what": "木偶关节与红线", "ref": "C-013"}, {"what": "片名与吊牌", "ref": "C-121"}],
                      "shots": stages, "note": " / ".join(beat["expression"] for beat in beats)}],
    }
    script = {"segments": [{"seg": "P1", "vo": [line["text"] for line in voice_items], "facts": []}],
              "speech": {"mode": speech["mode"], "speakers": speech["speakers"]}}
    timing = {
        "fps": plan["spec"]["fps"], "voice": voiceover,
        "segments": [{"seg": "P1", "dur": duration, "vo": voice_items,
                      "shots": [{"t0": 0, "t1": cut_ms / 1000, "cut": "硬切"},
                                {"t0": cut_ms / 1000, "t1": duration, "cut": "硬切"}]}],
        "reference": {key: plan[key] for key in ("beats", "cues", "spec", "layout")},
    }
    for name, value in (("storyboard", storyboard), ("script", script), ("timing", timing)):
        atomic_write(out / f"{name}.json", json_text(value), new=True)
    shutil.copyfile(HERE / "reference_score.py", out / "sound.py")


def impact_onset(power, anchor):
    require(len(power) > 2 and anchor > 1, "读不到片名重音")
    baseline = sorted(power[:anchor // 2])
    threshold = max(3 * baseline[round(.9 * (len(baseline) - 1))], .15 * max(power), .00001)
    index = next((i for i, sample in enumerate(power) if sample >= threshold), None)
    require(index is not None, "没有在闪白附近检测到片名重音")
    return index


def check_render(data, plan, dest, project):
    import film
    import numpy as np

    video = dest / "film.mp4"
    duration = project.dur
    meta = spec(video)
    fps = plan["spec"]["fps"]
    nframes, jitter = film.frame_gaps(video, fps)
    require(meta["audio"] and (meta["width"], meta["height"]) == (plan["spec"]["width"], plan["spec"]["height"])
            and nframes == plan["frames"] and jitter < .5 / fps
            and abs(meta["duration_ms"] / 1000 - duration) < 1 / fps, "画幅、音轨、帧数或帧间隔不符合时间轴")
    lu, tp = film.probe_loud(video)
    require(abs(lu - film.LUFS) <= 1 and tp <= film.TP, f"声音自检未通过（{lu:.1f} LUFS，{tp:.1f} dBTP）")
    require(not film.blacks(video), "成片出现黑段")
    worst_voice = 0
    if project.segs[0]["vo"]:
        from synth import SR, load

        worst_voice, missed = film.align(project, load(video), SR)
        require(not missed, "对白位置对不上：" + "、".join(missed))

    target = plan["cues"]["transition"][0]["at_ms"]
    flashes, _ = frame_stats(video, duration, fps=fps)
    require(flashes, "没有在成片检测到闪白")
    flash = min(flashes, key=lambda value: abs(value - target))
    require(abs(flash - target) <= 1000 / fps + 1, "成片闪白与时间轴相差超过一帧")
    source_flashes = data["source"].get("flash_times_ms", [])
    source_delta = None
    if source_flashes and plan["mode"] == "replay":
        source_delta = min(abs(flash - at) for at in source_flashes)
        require(source_delta <= CUT_TOLERANCE_MS, f"同题闪白与参考片相差 {source_delta} 毫秒")

    window_ms = 240
    raw = ffmpeg("-ss", max(0, (flash - window_ms) / 1000), "-i", video, "-t", 2 * window_ms / 1000,
                 "-vn", "-ac", 1, "-ar", 16000, "-f", "f32le", "-")
    audio = np.frombuffer(raw, dtype="<f4")
    hop = 80
    power = np.mean(audio[:len(audio) // hop * hop].reshape(-1, hop) ** 2, axis=1)
    # Measure the start of the decoded accent. The reverberation can peak later.
    impact_at = flash - window_ms + impact_onset(power, window_ms // 5) * 5
    impact_delta = abs(impact_at - flash)
    require(impact_delta <= 2000 / fps + 1, f"闪白与片名重音相差 {impact_delta} 毫秒")
    take = sorted({min(meta["duration_ms"] - round(1000 / fps), (b["start_ms"] + b["end_ms"]) // 2)
                   for b in plan["beats"]} | {flash})
    last = meta["duration_ms"] - round(1000 / fps)
    take = sorted(set(take) | {max(0, flash - 200), min(last, flash + 450), max(0, last - 300)})
    contact_sheet(video, take, dest / "review.jpg")
    return {"passed": True, "theme": plan["topic"]["theme"], "mode": plan["mode"],
            "template_sha256": digest(data), "video_duration_ms": meta["duration_ms"],
            "width": meta["width"], "height": meta["height"], "fps": fps, "frames": nframes,
            "flash_ms": flash, "source_flash_delta_ms": source_delta, "impact_delta_ms": impact_delta,
            "speech_mode": plan["speech"]["mode"], "speech_lines": len(project.segs[0]["vo"]),
            "speech_max_offset_ms": round(worst_voice * 1000), "lufs": lu, "dbtp": tp}


def render(data, dest, episode=None, ar=None, duration_ms=None, audio_dir=None):
    import film

    require(shutil.which("node") and shutil.which("ffmpeg") and shutil.which("ffprobe"),
            "出片需要 Node.js、FFmpeg 和 FFprobe")
    plan = compile_plan(data, episode, ar, duration_ms)
    dest = Path(dest).resolve()
    require(not dest.exists(), f"输出目录已存在：{dest}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".reference-", dir=dest.parent) as root:
        out = Path(root) / "build"
        out.mkdir()
        lines = take_voices(plan, out, audio_dir)
        write_film_files(out, plan, lines, data["dimensions"])
        silent = out / "picture.mp4"
        subprocess.run(["node", str(HERE / "reference_stage.cjs"), str(out / "timing.json"), str(silent)], check=True)
        project = film.Project(out)
        wav = out / "mix.wav"
        film.write_mix(project, wav)
        film.mux(silent, wav, out / "film.mp4")
        report = check_render(data, plan, out, project)
        for temp in (silent, wav):
            temp.unlink()
        if (out / "tts").exists():
            shutil.rmtree(out / "tts")
        atomic_write(out / "report.json", json_text(report), new=True)
        out.rename(dest)
    return report
