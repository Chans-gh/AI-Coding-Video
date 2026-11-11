"""check_plan.py 的离线测试：python3 -m unittest discover -s <本 Skill 目录>/scripts/tests"""
import contextlib
import io
import os
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import check_plan  # noqa: E402


class CheckPlan(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp)

    def project(self, name='ok', edits=()):
        """拷一份夹具，按 (文件, 旧, 新) 改几处，返回项目根目录"""
        d = self.tmp / name
        shutil.copytree(HERE / 'fixtures' / name, d)
        for f, old, new in edits:
            p = d / f
            t = p.read_text(encoding='utf-8')
            self.assertIn(old, t, f'{f} 里没有「{old}」')
            p.write_text(t.replace(old, new, 1), encoding='utf-8')
        return d

    def run_check(self, d, videos=True):
        args = ['plans/demo/plan.md']
        if videos:
            args += ['--storyboard', 'videos/demo/storyboard.json', '--script', 'videos/demo/script.json']
        out = io.StringIO()
        cwd = os.getcwd()
        os.chdir(d)
        try:
            with contextlib.redirect_stdout(out):
                code = check_plan.main(args)
        finally:
            os.chdir(cwd)
        return code, out.getvalue()

    # ---------- 认格式和状态 ----------
    def test_ok(self):
        code, out = self.run_check(self.project())
        self.assertEqual(code, 0, out)
        self.assertNotIn('✗', out)
        self.assertNotIn('C4', out)  # 旁白讲了「官方称」

    def test_format1_stops(self):
        code, out = self.run_check(self.project('format1'), videos=False)
        self.assertEqual(code, 2, out)
        self.assertIn('格式 1', out)
        self.assertIn('先用策划转成格式 2', out)

    def test_other_version_stops(self):
        d = self.project(edits=[('plans/demo/plan.md', 'ai-content-planner/2', 'ai-content-planner/3')])
        code, out = self.run_check(d)
        self.assertEqual(code, 2, out)
        self.assertIn('只认 ai-content-planner/2', out)

    def test_no_format_line_stops(self):
        d = self.project(edits=[('plans/demo/plan.md', '格式：ai-content-planner/2\n', '')])
        code, out = self.run_check(d)
        self.assertEqual(code, 2, out)

    def test_reflow_waits(self):
        d = self.project(edits=[('plans/demo/plan.md', '状态：已交接', '状态：回流中')])
        code, out = self.run_check(d)
        self.assertEqual(code, 2, out)
        self.assertIn('等策划改回「已交接」', out)

    def test_not_handed_off(self):
        d = self.project(edits=[('plans/demo/plan.md', '状态：已交接', '状态：补齐中')])
        code, out = self.run_check(d)
        self.assertEqual(code, 2, out)

    def test_not_video(self):
        d = self.project(edits=[('plans/demo/plan.md', '| 输出形式 | 视频 |', '| 输出形式 | PPT |')])
        code, out = self.run_check(d)
        self.assertEqual(code, 2, out)

    def test_auto_confirm_reminds(self):
        d = self.project(edits=[('plans/demo/plan.md', '框架：用户确认两段', '框架：自动，未问用户（简单任务）。两段')])
        code, out = self.run_check(d)
        self.assertEqual(code, 0, out)
        self.assertIn('先请用户过一眼需求和框架', out)

    def test_research_md_only(self):
        d = self.project()
        os.rename(d / 'plans/demo/content.md', d / 'plans/demo/research.md')
        code, out = self.run_check(d)
        self.assertEqual(code, 2, out)
        self.assertIn('research.md', out)

    # ---------- 框架 ----------
    def test_old_frame_head(self):
        d = self.project(edits=[('plans/demo/plan.md', '| 段 | 作用 | 受众收益 | 要讲的点 | 用到哪些输入 | 篇幅 |',
                                 '| 段 | 作用 | 受众收益 | 核心内容 | 素材编排 | 篇幅 |')])
        code, out = self.run_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('表头', out)

    def test_extent_not_seconds(self):
        d = self.project(edits=[('plans/demo/plan.md', '| 教材 | 15 秒 |', '| 教材 | 3 页 |')])
        code, out = self.run_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('单位是秒', out)

    def test_no_flow_line(self):
        d = self.project(edits=[('plans/demo/plan.md', '内容流程：', '流程：')])
        code, out = self.run_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('内容流程', out)

    # ---------- 分镜脚本、逐字稿 ----------
    def test_u_number_rejected(self):
        d = self.project(edits=[('videos/demo/script.json', '"ref": "P1-1"', '"ref": "U1-1"')])
        code, out = self.run_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('格式 1 的 U 编号', out)

    def test_not_used_rejected(self):
        d = self.project(edits=[('videos/demo/script.json', '"ref": "P1-1"', '"ref": "P1-3"')])
        code, out = self.run_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('不用', out)

    def test_setting_ref_null(self):
        d = self.project(edits=[('videos/demo/script.json', '"ref": null, "src": null}', '"ref": "P1-4", "src": null}')])
        code, out = self.run_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('ref 写 null', out)

    def test_missing_ref(self):
        d = self.project(edits=[('videos/demo/script.json', '"ref": "P2-1"', '"ref": "P2-9"')])
        code, out = self.run_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('找不到', out)

    def test_c4_reminds(self):
        d = self.project(edits=[('videos/demo/script.json', '青禾官方称，它的', '青禾的')])
        code, out = self.run_check(d)
        self.assertEqual(code, 0, out)
        self.assertIn('官方称', out)

    def test_shared_not_declared_reminds(self):
        d = self.project(edits=[('plans/demo/content.md', 'b（P2 a 也用）', 'b')])
        code, out = self.run_check(d)
        self.assertEqual(code, 0, out)
        self.assertIn('记在 P1', out)

    def test_seg_unused(self):
        d = self.project(edits=[('videos/demo/storyboard.json', '"seg": "P2"', '"seg": "P1"'),
                                ('videos/demo/script.json', '"seg": "P2"', '"seg": "P1"')])
        code, out = self.run_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('P2 在分镜脚本里一段都没用到', out)

    def test_plan_field(self):
        d = self.project(edits=[('videos/demo/storyboard.json', '"plan": "plans/demo/plan.md"', '"plan": "plan.md"')])
        code, out = self.run_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('来自哪份 plan.md', out)


if __name__ == '__main__':
    unittest.main()
