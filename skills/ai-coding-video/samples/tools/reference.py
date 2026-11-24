"""Inspect, save, render, review and activate a reference-film template."""
import argparse
import json
import subprocess
from pathlib import Path

from reference_data import (
    ReferenceError, active_path, atomic_write, digest, json_text, mapping, markdown,
    read_json, read_template, require, template_path, validate,
)


def save(project, analysis, evidence):
    analysis = mapping(read_json(analysis), "拆解稿")
    evidence = mapping(read_json(evidence), "抽帧记录")
    source_fields = ("name", "sha256", "duration_ms", "width", "height", "fps", "audio", "flash_times_ms")
    analysis["source"] = {k: evidence[k] for k in source_fields}
    analysis.update(status="draft", validation={})
    data = validate(analysis)
    path = template_path(project, data["template_id"], data["version"])
    atomic_write(path, markdown(data), new=True)
    return path


def record(path, replay, episode, review):
    require(review.strip(), "需要记录人工对照结论")
    data = read_template(path)
    expected = digest(data)

    def report(directory, mode):
        directory = Path(directory)
        r = mapping(read_json(directory / "report.json"), f"{mode} 报告")
        require(r.get("template_sha256") == expected and r.get("mode") == mode and r.get("passed") is True,
                f"{mode} 报告需来自当前版本并通过出片自检")
        require((directory / "film.mp4").is_file() and (directory / "review.jpg").is_file(),
                f"{mode} 缺少成片或对照帧")
        return r

    reference, rethemed = report(replay, "replay"), report(episode, "episode")
    require(reference.get("theme") == data["topic"]["theme"] and rethemed.get("theme") != reference["theme"],
            "验收需要同题回放和一条换题样片")
    data["validation"] = {"replay": reference, "episode": rethemed, "review": review.strip()}
    data["status"] = "validated"
    atomic_write(Path(path), markdown(data))
    return path


def activate(project, path):
    data = read_template(path)
    key, version = data["template_id"], data["version"]
    require(Path(path).resolve() == template_path(project, key, version).resolve(),
            "只能启用此项目 reference-templates 下的模板版本")
    signature = digest(data)
    validation = data.get("validation") or {}
    require(data.get("status") == "validated" and validation.get("review")
            and all(validation.get(k, {}).get("template_sha256") == signature
                    and validation[k].get("passed") is True for k in ("replay", "episode")),
            "请先用 record 写入同题和换题验收")
    pointer = Path(project) / "reference-templates" / "active.json"
    atomic_write(pointer, json_text({"template_id": key, "version": version, "sha256": signature}))
    return pointer


def parser():
    cli = argparse.ArgumentParser(description=__doc__)
    commands = cli.add_subparsers(dest="command", required=True)
    inspect = commands.add_parser("inspect", help="从参考视频抽取时间点、缩略图和可听音轨")
    inspect.add_argument("video", type=Path)
    inspect.add_argument("out", type=Path)
    build = commands.add_parser("save", help="将八维拆解稿和参考片证据写成模板 Markdown")
    build.add_argument("project", type=Path)
    build.add_argument("analysis", type=Path)
    build.add_argument("--evidence", required=True, type=Path)
    produce = commands.add_parser("render", help="从模板回放同题或出一条换题短片")
    produce.add_argument("project", type=Path)
    produce.add_argument("out", type=Path)
    produce.add_argument("--template", type=Path)
    mode = produce.add_mutually_exclusive_group(required=True)
    mode.add_argument("--replay", action="store_true")
    mode.add_argument("--episode", type=Path)
    produce.add_argument("--ar", choices=("16:9", "9:16"))
    produce.add_argument("--duration-ms", type=int)
    produce.add_argument("--audio-dir", type=Path, help="按台词行 ID 提供 WAV，可与 TTS 混用")
    review = commands.add_parser("record", help="记录人工对照和同题、换题技术检查")
    review.add_argument("template", type=Path)
    review.add_argument("--replay", required=True, type=Path)
    review.add_argument("--episode", required=True, type=Path)
    review.add_argument("--review", required=True, help="关键帧、叙事和对白的人工对照结论")
    enable = commands.add_parser("activate", help="为项目启用已验收的模板版本")
    enable.add_argument("project", type=Path)
    enable.add_argument("template", type=Path)
    active = commands.add_parser("active", help="查项目的默认模板")
    active.add_argument("project", type=Path)
    return cli


def main(argv=None):
    cli = parser()
    a = cli.parse_args(argv)
    try:
        if a.command == "inspect":
            from reference_inspect import inspect

            inspect(a.video, a.out)
            output = a.out / "evidence.json"
        elif a.command == "save":
            output = save(a.project, a.analysis, a.evidence)
        elif a.command == "render":
            from reference_render import render

            data = read_template(a.template or active_path(a.project))
            episode = read_json(a.episode) if a.episode else None
            if a.episode:
                mapping(episode, "换题稿")
            render(data, a.out, episode, a.ar, a.duration_ms, a.audio_dir)
            output = a.out / "film.mp4"
        elif a.command == "record":
            output = record(a.template, a.replay, a.episode, a.review)
        elif a.command == "activate":
            output = activate(a.project, a.template)
        else:
            output = active_path(a.project)
        print(output.resolve())
        return 0
    except (ReferenceError, ImportError, OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError, RuntimeError) as error:
        cli.exit(2, f"参考片流程暂停 · {error}\n")


if __name__ == "__main__":
    raise SystemExit(main())
