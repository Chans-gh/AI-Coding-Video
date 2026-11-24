"""Regression tests for templates distributed with the installed Skill."""
import copy
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "samples" / "tools"))
import reference
import reference_data as rd
import reference_render as rr


def template():
    return {
        "schema_version": 1, "template_id": "puppet-test", "version": 1,
        "source": {"sha256": "ab" * 32, "duration_ms": 12000, "flash_times_ms": [7200], "audio": True},
        "defaults": {"width": 1280, "height": 720, "fps": 30, "duration_ms": 12000},
        "topic": {"theme": "绳线", "thesis": "动作传达意图", "prop": "红绳"},
        "dimensions": {key: {"fixed": "固定规则", "rewrite": "换题规则",
                             "evidence": [{"at_ms": 0, "kind": "observed", "note": "证据"}]}
                       for key in rd.DIMENSIONS},
        "topic_slots": {key: "替换规则" for key in rd.SLOTS},
        "render": {"style": "dark-puppet", "refs": ["C-013", "C-121"]},
        "beats": [
            {"id": "stage", "start_ms": 0, "end_ms": 7200, "purpose": "交代道具", "expression": "关系建立"},
            {"id": "title", "start_ms": 7200, "end_ms": 12000, "purpose": "转场", "expression": "点题"},
        ],
        "cues": {
            "action": [{"id": "a", "beat_id": "stage", "at_ms": 1000, "end_ms": 2000, "type": "connect"}],
            "screen": [{"id": "headline", "beat_id": "stage", "at_ms": 0, "end_ms": 7000, "role": "headline", "text": "连接"},
                       {"id": "title", "beat_id": "title", "at_ms": 7200, "end_ms": 12000, "role": "title", "text": "绳线"}],
            "transition": [{"id": "cut", "beat_id": "title", "at_ms": 7200, "type": "flash"}],
            "sound": [{"id": "hit", "beat_id": "title", "at_ms": 7200, "type": "impact"}],
        },
        "speech": {"mode": "visual_only", "speakers": [], "lines": []},
        "status": "draft",
    }


class ReferenceTests(unittest.TestCase):
    def test_missing_dialogue_dimension(self):
        data = template()
        del data["dimensions"]["dialogue"]
        with self.assertRaisesRegex(rd.ReferenceError, "八个维度"):
            rd.validate(data)

    def test_default_pointer_requires_validation_and_detects_an_edited_template(self):
        data = rd.validate(template())
        with tempfile.TemporaryDirectory() as tmp:
            project = Path(tmp)
            path = rd.template_path(project, data["template_id"], data["version"])
            rd.atomic_write(path, rd.markdown(data), new=True)
            with self.assertRaisesRegex(rd.ReferenceError, "验收"):
                reference.activate(project, path)
            for mode, theme in (("replay", "绳线"), ("episode", "独处")):
                out = project / mode
                info = {"mode": mode, "theme": theme, "passed": True, "template_sha256": rd.digest(data)}
                rd.atomic_write(out / "report.json", rd.json_text(info), new=True)
                for name in ("film.mp4", "review.jpg"):
                    (out / name).touch()
            reference.record(path, project / "replay", project / "episode", "比较了道具和片名")
            reference.activate(project, path)
            self.assertEqual(rd.active_path(project), path)
            path.write_text(path.read_text().replace('"prop": "红绳"', '"prop": "白绳"'))
            with self.assertRaisesRegex(rd.ReferenceError, "已变更"):
                rd.active_path(project)

    def test_retheme_and_reframe_share_a_single_cut(self):
        data = rd.validate(template())
        episode = {"theme": "独处", "thesis": "留出空间", "prop": "松开的线",
                   "actions": {"a": "release"}, "screen": {"headline": {"text": "放开"}, "title": {"text": "独处"}},
                   "lines": {}, "sounds": {}}
        plan = rr.compile_plan(data, episode, "9:16", 10000)
        self.assertEqual((plan["spec"]["width"], plan["spec"]["height"], plan["frames"]), (720, 1280, 300))
        cut = plan["cues"]["transition"][0]["at_ms"]
        self.assertEqual(cut, 6000)
        self.assertEqual(plan["cues"]["screen"][1]["at_ms"], cut)
        self.assertEqual(plan["cues"]["sound"][0]["at_ms"], cut)
        self.assertEqual(plan["cues"]["action"][0]["type"], "release")
        self.assertEqual(data["cues"]["action"][0]["type"], "connect")

    def test_rejects_overlapping_dialogue_turns(self):
        data = template()
        common = {"beat_id": "stage", "to": "对方", "source_text": "你好", "purpose": "问候",
                  "delivery": "平静", "rewrite_rule": "沿用问候的作用", "screen_copy_id": "headline"}
        lines = [{**common, "id": "one", "speaker_id": "red", "start_ms": 1000, "end_ms": 2400},
                 {**common, "id": "two", "speaker_id": "white", "start_ms": 2300, "end_ms": 4000}]
        data["speech"] = {"mode": "character_dialogue", "speakers": [{"id": "red", "name": "红木偶"},
                                                                   {"id": "white", "name": "白木偶"}], "lines": lines}
        with self.assertRaisesRegex(rd.ReferenceError, "two 起点"):
            rd.validate(data)
        fixed = copy.deepcopy(data)
        fixed["speech"]["lines"][1]["start_ms"] = 2500
        self.assertEqual(len(rd.validate(fixed)["speech"]["lines"]), 2)

    def test_impact_uses_onset_even_when_a_later_cycle_is_louder(self):
        power = [0.03] * 48 + [0.49, 0.2, 0.1, 0.11] + [0.05] * 36 + [0.94, 0.2]
        self.assertEqual(rr.impact_onset(power, 48), 48)
        early = [0.03] * 29 + [0.49, 0.2, 0.1, 0.11] + [0.05] * 55 + [0.94, 0.2]
        self.assertEqual(rr.impact_onset(early, 48), 29)


if __name__ == "__main__":
    unittest.main()
