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
        self.assertNotIn('提醒', out)
        self.assertIn('格式 3', out)

    def test_format2_accepted(self):
        code, out = self.run_check(self.project('format2'))
        self.assertEqual(code, 0, out)
        self.assertNotIn('✗', out)
        self.assertNotIn('C4', out)  # 旁白讲了「官方称」
        self.assertIn('旧格式', out)
        self.assertIn('格式 2、已交接', out)

    def test_format2_auto_confirm(self):
        d = self.project('format2', [('plans/demo/plan.md', '框架：用户确认两段', '框架：自动，未问用户（简单任务）。两段')])
        code, out = self.run_check(d)
        self.assertEqual(code, 0, out)
        self.assertIn('先请用户过一眼需求和框架', out)

    def test_format2_not_video(self):
        d = self.project('format2', [('plans/demo/plan.md', '| 输出形式 | 视频 |', '| 输出形式 | PPT |')])
        code, out = self.run_check(d)
        self.assertEqual(code, 2, out)
        self.assertIn('需求的「输出形式」', out)

    def test_format2_no_rule(self):
        d = self.project('format2', [('videos/demo/storyboard.json', '"ref": "C-038"}], "note": "测试夹具"},',
                                      '"ref": "C-038", "rule": "K1"}], "note": "测试夹具"},')])
        code, out = self.run_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('格式 2 没有约束', out)

    def test_format1_stops(self):
        code, out = self.run_check(self.project('format1'), videos=False)
        self.assertEqual(code, 2, out)
        self.assertIn('格式 1', out)
        self.assertIn('转成格式 3', out)

    def test_other_version_stops(self):
        d = self.project(edits=[('plans/demo/plan.md', 'ai-content-planner/3', 'ai-content-planner/4')])
        code, out = self.run_check(d)
        self.assertEqual(code, 2, out)
        self.assertIn('只认 ai-content-planner/2、ai-content-planner/3', out)

    def test_no_format_line_stops(self):
        d = self.project(edits=[('plans/demo/plan.md', '格式：ai-content-planner/3\n', '')])
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

    def test_effect_pending_stops(self):
        d = self.project(edits=[('plans/demo/plan.md', '状态：已交接', '状态：效果待确认')])
        code, out = self.run_check(d)
        self.assertEqual(code, 2, out)
        self.assertIn('效果待确认', out)

    def test_not_video(self):
        d = self.project(edits=[('plans/demo/plan.md', '| 输出形式和规格 | 视频；', '| 输出形式和规格 | PPT；')])
        code, out = self.run_check(d)
        self.assertEqual(code, 2, out)
        self.assertIn('形式的「输出形式和规格」', out)

    def test_old_need_table_not_read(self):
        """格式 3 不再从需求读输出形式：需求里写了视频、形式没写，照样停下"""
        d = self.project(edits=[('plans/demo/plan.md', '| 输出形式和规格 | 视频；9:16；中文；有旁白 | 用户定 | 用户给的 |\n', ''),
                                ('plans/demo/plan.md', '| 必须有 | 无 | 用户给的 |', '| 输出形式 | 视频 | 用户给的 |')])
        code, out = self.run_check(d)
        self.assertEqual(code, 2, out)

    def test_auto_confirm_reminds(self):
        d = self.project(edits=[('plans/demo/plan.md', '效果：用户确认', '效果：自动，未问用户（简单任务）。')])
        code, out = self.run_check(d)
        self.assertEqual(code, 0, out)
        self.assertIn('确认记录的「效果」', out)
        self.assertIn('先请用户过一眼效果和框架', out)

    def test_research_md_only(self):
        d = self.project()
        os.rename(d / 'plans/demo/content.md', d / 'plans/demo/research.md')
        code, out = self.run_check(d)
        self.assertEqual(code, 2, out)
        self.assertIn('research.md', out)

    # ---------- 框架 ----------
    def test_old_frame_head(self):
        d = self.project(edits=[('plans/demo/plan.md', '| 段 | 作用 | 受众：从 → 到 | 要讲的点 | 怎么证明 | 用到哪些输入 | 篇幅 |',
                                 '| 段 | 作用 | 受众收益 | 要讲的点 | 用到哪些输入 | 篇幅 |')])
        code, out = self.run_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('表头（格式 3）', out)

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

    # ---------- 格式 3：形式、说法、约束、素材 ----------
    def test_ar_follows_form(self):
        d = self.project(edits=[('videos/demo/storyboard.json', '"ar": "9:16"', '"ar": "16:9"')])
        code, out = self.run_check(d)
        self.assertEqual(code, 0, out)
        self.assertIn('策划定的是 9:16', out)

    def test_total_follows_form(self):
        d = self.project(edits=[('plans/demo/plan.md', '| 篇幅和注意力 | 30 秒；', '| 篇幅和注意力 | 1 分 30 秒；')])
        code, out = self.run_check(d)
        self.assertEqual(code, 0, out)
        self.assertIn('目标时长是 90 秒', out)

    def test_silent_needs_null_voice(self):
        d = self.project(edits=[('plans/demo/plan.md', '| 声音 | 讲解员「小水滴」第一人称，平实 |', '| 声音 | 不说话只上字 |')])
        code, out = self.run_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('unify.voice 写 null', out)
        self.assertIn('vo 写空数组', out)

    def test_say_needs_vo(self):
        d = self.project(edits=[('videos/demo/script.json', '"vo": ["我是小水滴。", "一个标准大气压下，水在一百度沸腾。"]', '"vo": []'),
                                ('videos/demo/script.json', '"vo": ["气压越低，沸点越低。"]', '"vo": []')])
        code, out = self.run_check(d)
        self.assertIn('说法写了 P1 的点', out)

    def test_say_point_not_in_frame(self):
        d = self.project(edits=[('plans/demo/plan.md', '| P2 b | 顺带一句产品 |', '| P2 c | 顺带一句产品 |')])
        code, out = self.run_check(d)
        self.assertEqual(code, 0, out)
        self.assertIn('P2 没有点 c', out)

    def test_rule_unknown(self):
        d = self.project(edits=[('videos/demo/storyboard.json', '"rule": "K1", "vo": 1', '"rule": "K9", "vo": 1')])
        code, out = self.run_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('rule K9 在 content.md 的约束表里找不到', out)

    def test_rule_bad_shape(self):
        d = self.project(edits=[('videos/demo/storyboard.json', '"rule": "K2"}', '"rule": "约束 2"}')])
        code, out = self.run_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('rule 写约束编号', out)

    def test_rule_array_ok(self):
        d = self.project(edits=[('videos/demo/storyboard.json', '"rule": "K1", "vo": 1', '"rule": ["K1", "K2"], "vo": 1')])
        code, out = self.run_check(d)
        self.assertEqual(code, 0, out)

    def test_g_shot_needs_rule(self):
        d = self.project(edits=[('videos/demo/storyboard.json', '"rule": "K1", "vo": 1', '"vo": 1')])
        code, out = self.run_check(d)
        self.assertEqual(code, 0, out)
        self.assertIn('分镜 3-1：G 类，框架 P2 的「怎么证明」要照 K1、K2', out)

    def test_no_generate_material_in_g_shot(self):
        d = self.project(edits=[('videos/demo/storyboard.json', '"src": "source/plateau/02.jpg"', '"src": ["source/qinghe/kettle.png"]')])
        code, out = self.run_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('分镜 3-1：M1', out)
        self.assertIn('不进生成模型', out)

    def test_pending_material_counts_as_no(self):
        d = self.project(edits=[('videos/demo/storyboard.json', '"src": "source/plateau/02.jpg"', '"src": "M3"')])
        code, out = self.run_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('〔待核实〕', out)
        self.assertIn('标「不用」', out)

    def test_reference_only_not_in_film(self):
        d = self.project(edits=[('videos/demo/storyboard.json', '"src": "source/qinghe/kettle.png"', '"src": "assets/source/plateau/03.jpg"')])
        code, out = self.run_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('M2', out)
        self.assertIn('只作参考，不进成片', out)

    def test_range_outside_not_matched(self):
        d = self.project(edits=[('videos/demo/storyboard.json', '"src": "source/qinghe/kettle.png"', '"src": "source/plateau/04.jpg"')])
        code, out = self.run_check(d)
        self.assertEqual(code, 0, out)

    def test_unknown_material_id(self):
        d = self.project(edits=[('videos/demo/storyboard.json', '"src": "source/plateau/02.jpg"', '"src": "M9"')])
        code, out = self.run_check(d)
        self.assertEqual(code, 0, out)
        self.assertIn('M9 在 content.md 的素材表里找不到', out)

    def test_bad_material_head(self):
        d = self.project(edits=[('plans/demo/content.md', '| 能怎么用 | 能不能送生成 | 用到哪段 |', '| 能怎么用 | 用到哪段 |')])
        code, out = self.run_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('「素材」的表头', out)

    def test_plan_field(self):
        d = self.project(edits=[('videos/demo/storyboard.json', '"plan": "plans/demo/plan.md"', '"plan": "plan.md"')])
        code, out = self.run_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('来自哪份 plan.md', out)


if __name__ == '__main__':
    unittest.main()
