"""Read, validate and write reference-film templates."""
import hashlib
import json
import os
import re
import tempfile
from pathlib import Path

DIMENSIONS = {
    "content": "内容方向", "storyboard": "叙事分镜", "visual": "视觉风格",
    "screen_copy": "屏幕文案与字幕", "editing": "时间剪辑", "sound": "声音音效",
    "composition": "构图道具", "dialogue": "文案对白",
}
CUES = ("action", "screen", "sound", "transition")
SLOTS = {"theme", "thesis", "prop", "actions", "screen", "speech", "ending"}
SCREEN_ROLES = {"headline", "label", "title", "translation", "tag", "epilogue", "caption"}
BLOCK = "<!-- ai-coding-video:reference-template -->\n````json\n"
NAME = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")
CUT_TOLERANCE_MS = 200


class ReferenceError(Exception):
    """Actionable input or pipeline error."""


def require(condition, message):
    if not condition:
        raise ReferenceError(message)


def mapping(value, name):
    require(isinstance(value, dict), f"{name} 应是对象")
    return value


def array(value, name):
    require(isinstance(value, list), f"{name} 应是列表")
    return value


def text(value, name):
    require(isinstance(value, str) and bool(value.strip()), f"{name} 需要填写")
    return value


def identifier(value, name):
    require(isinstance(value, str) and len(value) <= 64 and NAME.fullmatch(value), f"{name} 需用小写字母、数字和连字符")
    return value


def integer(value, name, lo, hi):
    require(type(value) is int and lo <= value <= hi, f"{name} 应是 {lo}–{hi} 的整数")
    return value


def index_by_id(rows, name):
    index = {}
    for row in array(rows, name):
        key = identifier(mapping(row, name).get("id"), f"{name}.id")
        require(key not in index, f"{name} 中的 {key} 重复")
        index[key] = row
    return index


def validate_speech(speech, beats, screen):
    mode = speech.get("mode")
    require(mode in ("visual_only", "voiceover", "character_dialogue", "uncertain"), "speech.mode 无效")
    speakers = index_by_id(speech.get("speakers"), "speech.speakers")
    lines = index_by_id(speech.get("lines"), "speech.lines")
    if mode in ("visual_only", "uncertain"):
        require(not speakers and not lines, f"{mode} 时说话人和台词列表须为空")
    if mode == "voiceover":
        require(len(speakers) == 1 and lines, "旁白需要一个说话人和至少一句台词")
    if mode == "character_dialogue":
        require(len({row.get("speaker_id") for row in lines.values()}) >= 2, "角色对白需要至少两位说话人轮流开口")
    for speaker in speakers.values():
        text(speaker.get("name"), "speaker.name")
        if "voice" in speaker:
            voice = mapping(speaker["voice"], "speaker.voice")
            text(voice.get("voice"), "speaker.voice.voice")
            speed = voice.get("speed", 1)
            require(type(speed) in (float, int) and 0.5 <= speed <= 2, "语速应在 0.5–2 之间")
    previous_end = 0
    for line in lines.values():
        beat = beats.get(line.get("beat_id"))
        require(beat is not None and line.get("speaker_id") in speakers, f"{line['id']} 的节拍或说话人不存在")
        at = integer(line.get("start_ms"), f"{line['id']} 起点", max(previous_end, beat["start_ms"]), beat["end_ms"] - 1)
        end = integer(line.get("end_ms"), f"{line['id']} 终点", at + 1, beat["end_ms"])
        previous_end = end
        for key in ("to", "source_text", "purpose", "delivery", "rewrite_rule"):
            text(line.get(key), f"{line['id']}.{key}")
        link = line.get("screen_copy_id")
        if link is not None:
            item = screen.get(link)
            require(item is not None and item["at_ms"] <= at < item["end_ms"],
                    f"{line['id']} 开口时的对应屏幕文案不存在")


def validate(data):
    mapping(data, "模板")
    require(data.get("schema_version") == 1, "只支持 schema_version 1")
    identifier(data.get("template_id"), "template_id")
    integer(data.get("version"), "version", 1, 1000000)
    defaults = mapping(data.get("defaults"), "defaults")
    duration = integer(defaults.get("duration_ms"), "defaults.duration_ms", 1, 24 * 3600000)
    for key in ("width", "height", "fps"):
        integer(defaults.get(key), f"defaults.{key}", 1, 16384 if key != "fps" else 240)
    source = mapping(data.get("source"), "source")
    source_length = integer(source.get("duration_ms"), "source.duration_ms", 1, 24 * 3600000)
    source_hash = source.get("sha256")
    require(isinstance(source_hash, str) and re.fullmatch(r"[0-9a-f]{64}", source_hash), "需要 inspect 生成的参考片 SHA-256")
    for at in array(source.get("flash_times_ms", []), "source.flash_times_ms"):
        integer(at, "source.flash_times_ms", 0, source_length)
    topic = mapping(data.get("topic"), "topic")
    for key in ("theme", "thesis", "prop"):
        text(topic.get(key), f"topic.{key}")
    slots = mapping(data.get("topic_slots"), "topic_slots")
    require(set(slots) == SLOTS, "topic_slots 需包含主题、主张、道具、动作、屏幕字、对白和结尾")
    for key, value in slots.items():
        text(value, f"topic_slots.{key}")
    dimensions = mapping(data.get("dimensions"), "dimensions")
    require(set(dimensions) == set(DIMENSIONS), "dimensions 需完整包含八个维度")
    for key, dim in dimensions.items():
        for rule in ("fixed", "rewrite"):
            text(mapping(dim, key).get(rule), f"{key}.{rule}")
        evidence = array(dim.get("evidence"), f"{key}.evidence")
        require(evidence, f"{key} 至少记录一项参考片证据或待核实事项")
        for item in evidence:
            at = integer(mapping(item, key).get("at_ms"), f"{key}.evidence.at_ms", 0, source_length)
            integer(item.get("end_ms", at), f"{key}.evidence.end_ms", at, source_length)
            require(item.get("kind") in ("observed", "inferred", "uncertain"), f"{key} 未标注证据类型")
            text(item.get("note"), f"{key}.evidence.note")
    beats = index_by_id(data.get("beats"), "beats")
    end = 0
    for key, beat in beats.items():
        require(beat.get("start_ms") == end and type(beat["start_ms"]) is int, f"{key} 起点应接在上一节拍后")
        end = integer(beat.get("end_ms"), f"{key} 终点", end + 1, duration)
        text(beat.get("purpose"), f"{key}.purpose")
        text(beat.get("expression"), f"{key}.expression")
    require(end == duration, "节拍须覆盖整片时长")
    cues = mapping(data.get("cues"), "cues")
    require(set(cues) == set(CUES), "cues 需包含动作、屏幕字、声音和转场")
    screen = {}
    for kind in CUES:
        rows = index_by_id(cues[kind], f"cues.{kind}")
        if kind == "screen":
            screen = rows
        for key, cue in rows.items():
            beat = beats.get(cue.get("beat_id"))
            require(beat is not None, f"{key} 的节拍不存在")
            at = integer(cue.get("at_ms"), f"{key} 起点", beat["start_ms"], beat["end_ms"] - 1)
            if kind in ("screen", "action"):
                integer(cue.get("end_ms"), f"{key} 终点", at + 1, duration)
            if kind == "screen":
                require(cue.get("role") in SCREEN_ROLES, f"{key} 的文字位置无效")
                text(cue.get("text"), f"{key}.text")
                if "accent" in cue:
                    require(isinstance(cue["accent"], str) and cue["accent"] in cue["text"], f"{key}.accent 须取自显示文字")
            else:
                identifier(cue.get("type"), f"{key}.type")
    validate_speech(mapping(data.get("speech"), "speech"), beats, screen)
    render = mapping(data.get("render"), "render")
    if render.get("style") is not None:
        identifier(render["style"], "render.style")
    for style in array(render.get("refs"), "render.refs"):
        text(style, "render.refs")
    if "layout" in render:
        layout = mapping(render["layout"], "render.layout")
        for key, value in layout.items():
            require(key in ("left", "right", "floor", "character_scale") and type(value) in (int, float) and .1 <= value <= 1,
                    f"render.layout.{key} 应为有效的画幅比例")
        require(layout.get("left", .29) < layout.get("right", .71), "左右角色站位顺序不对")
    return data


def digest(data):
    stable = {k: v for k, v in data.items() if k not in ("status", "validation")}
    return hashlib.sha256(json.dumps(stable, ensure_ascii=False, sort_keys=True).encode()).hexdigest()


def json_text(data):
    return json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + "\n"


def atomic_write(path, content, new=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent, delete=False) as tmp:
        pending = Path(tmp.name)
        try:
            tmp.write(content)
            tmp.close()
            if new:
                os.link(pending, path)
            else:
                os.replace(pending, path)
        finally:
            pending.unlink(missing_ok=True)


def cell(value):
    return str(value).replace("|", "\\|").replace("\n", " ")


def markdown(data):
    source = data["source"]
    mode = data["speech"]["mode"]
    specs = data["defaults"]
    rows = [
        f"# {data['topic']['theme']} · 参考片模板", "",
        f"模板 `{data['template_id']}` · 第 {data['version']} 版 · {data['status']}", "",
        f"参考片 `{source.get('name', source['sha256'][:12])}` · "
        f"{specs['width']}×{specs['height']} · {specs['fps']} fps · {specs['duration_ms'] / 1000:g} 秒", "",
        "## 八维规则", "",
        "| 维度 | 参考片证据 | 固定规则 | 换题规则 |", "|---|---|---|---|",
    ]
    labels = {"observed": "观察", "inferred": "推断", "uncertain": "待确认"}
    for key, label in DIMENSIONS.items():
        item = data["dimensions"][key]
        evidence = " / ".join(f"{r['at_ms'] / 1000:g}s {labels[r['kind']]} · {r['note']}" for r in item["evidence"])
        rows.append("| " + " | ".join(map(cell, (label, evidence, item["fixed"], item["rewrite"]))) + " |")
    rows += ["", "## 时间轴", "", "| 起止（秒） | 分镜目的 | 表达作用 |", "|---|---|---|"]
    for beat in data["beats"]:
        rows.append(f"| {beat['start_ms'] / 1000:g}–{beat['end_ms'] / 1000:g} | {cell(beat['purpose'])} | {cell(beat['expression'])} |")
    rows += ["", "| 时间（秒） | 事件 | 节拍 | 内容 |", "|---|---|---|---|"]
    cues = [(r["at_ms"], kind, r) for kind in CUES for r in data["cues"][kind]]
    for at, kind, cue in sorted(cues, key=lambda r: r[0]):
        rows.append(f"| {at / 1000:g} | {kind} | {cue['beat_id']} | {cell(cue.get('text', cue.get('type')))} |")
    rows += ["", "## 文案对白", "", f"人声模式 `{mode}`", ""]
    if data["speech"]["lines"]:
        rows += ["| 时窗（秒） | 说话人 → 对象 | 原句 | 演绎 | 作用与改写 | 屏幕字 |", "|---|---|---|---|---|---|"]
        speakers = {s["id"]: s["name"] for s in data["speech"]["speakers"]}
        for line in data["speech"]["lines"]:
            when = f"{line['start_ms'] / 1000:g}–{line['end_ms'] / 1000:g}"
            fields = (when, f"{speakers[line['speaker_id']]} → {line['to']}", line["source_text"],
                      line["delivery"], line["purpose"] + " · " + line["rewrite_rule"], line.get("screen_copy_id") or "—")
            rows.append("| " + " | ".join(map(cell, fields)) + " |")
    rows += ["", "## 验收记录", ""]
    validation = data.get("validation") or {}
    if validation:
        rows.append(f"- 同题《{validation['replay']['theme']}》与换题《{validation['episode']['theme']}》通过技术检查。")
        reference_delta = validation["replay"].get("source_flash_delta_ms")
        if reference_delta is not None:
            rows.append(f"- 同题闪白相对参考片的误差为 {reference_delta} 毫秒。")
        rows.append(f"- 人工对照记录 · {validation['review']}")
    else:
        rows.append("待运行同题回放和换题样片。")
    rows += ["", "## 结构化模板", "", BLOCK + json_text(data) + "````", ""]
    return "\n".join(rows)


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def read_template(path):
    body = Path(path).read_text(encoding="utf-8")
    blocks = body.split(BLOCK)
    require(len(blocks) == 2 and "\n````" in blocks[1], f"{path} 缺少唯一的参考片 JSON 结构块")
    return validate(json.loads(blocks[1].split("\n````", 1)[0]))


def template_path(project, key, version):
    identifier(key, "template_id")
    integer(version, "version", 1, 1000000)
    return Path(project) / "reference-templates" / f"{key}-v{version}.md"


def active_path(project):
    pointer = Path(project) / "reference-templates" / "active.json"
    require(pointer.is_file(), "此项目还没有启用参考片模板")
    active = mapping(read_json(pointer), "active.json")
    path = template_path(project, active.get("template_id"), active.get("version"))
    data = read_template(path)
    require(data.get("status") == "validated" and digest(data) == active.get("sha256"),
            "默认模板已变更，需重新验收并启用")
    return path
