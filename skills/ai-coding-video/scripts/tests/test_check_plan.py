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

    def run_check(self, d, videos=True, extra=()):
        args = ['plans/demo/plan.md', *extra]
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
        self.assertIn('转成格式 5', out)

    def test_other_version_stops(self):
        d = self.project(edits=[('plans/demo/plan.md', 'ai-content-planner/3', 'ai-content-planner/6')])
        code, out = self.run_check(d)
        self.assertEqual(code, 2, out)
        self.assertIn('只认 ai-content-planner/2、ai-content-planner/3、ai-content-planner/4、ai-content-planner/5', out)

    def test_v5_in_plan_md_stops(self):
        d = self.project(edits=[('plans/demo/plan.md', 'ai-content-planner/3', 'ai-content-planner/5')])
        code, out = self.run_check(d)
        self.assertEqual(code, 2, out)
        self.assertIn('格式 5 只读 content.md', out)

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
        d = self.project(edits=[('videos/demo/script.json', '"vo": ["我是小水滴。", "一个标准大气压下，水在一百度沸腾。", "气压越低，沸点越低。"]', '"vo": []')])
        code, out = self.run_check(d)
        self.assertIn('说法写了 P1 的点', out)

    def test_seg_repeated(self):
        # 有策划也一段一个段号：配音（vo/<段号>_<句号>.wav）、出片（segments/<段号>.js）都按段号认
        self.bad([('videos/demo/storyboard.json', '"seg": "P2", "title": "高原"', '"seg": "P1", "title": "高原"')],
                 '第 2 段：seg P1 重复了', '写成这段的 shots')

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
        self.assertIn('分镜 2-1：G 类，框架 P2 的「怎么证明」要照 K1、K2', out)

    def test_no_generate_material_in_g_shot(self):
        d = self.project(edits=[('videos/demo/storyboard.json', '"src": "source/plateau/02.jpg"', '"src": ["source/qinghe/kettle.png"]')])
        code, out = self.run_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('分镜 2-1：M1', out)
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

    # ---------- 格式 4：表达、画面、制作条件、原句 ----------
    def v4(self, edits=()):
        return self.project('ok4', edits)

    def bad(self, edits, *want, code=1, videos=True):
        """改几处，跑检查，退出码是 code，输出里有 want 的每一句；返回输出"""
        c, out = self.run_check(self.v4(edits), videos)
        self.assertEqual(c, code, out)
        for w in want:
            self.assertIn(w, out)
        return out

    def test_v4_ok(self):
        out = self.bad([], '格式 4、已交接', '画面 4 行', '基调 讲透型、张力 1', code=0)
        self.assertNotIn('✗', out)
        self.assertNotIn('提醒', out)

    def test_v4_table(self):
        c, out = self.run_check(self.v4(), extra=['--table'])
        self.assertEqual(c, 0, out)
        self.assertIn('| H3 | P2 | 高原湖边一锅水冒泡，温度计停在 87 | 生图 | K1、M2 | 分镜 2-1 |', out)
        self.assertIn('原句和逐字稿', out)
        self.assertIn('| 对上 |', out)

    def test_v4_no_expr(self):
        self.bad([('plans/demo/plan.md', '## 表达', '## 表达方式')], '要有「## 表达」一节')

    def test_v4_expr_head(self):
        self.bad([('plans/demo/plan.md', '| 项 | 内容 | 由哪条效果推出 | 来源 |\n|---|---|---|---|\n| 基调',
                   '| 项 | 内容 | 来源 |\n|---|---|---|\n| 基调')], '「表达」的表头')

    def test_v4_expr_item_missing(self):
        self.bad([('plans/demo/plan.md', '| 情绪曲线 | 不以为然 → P2 高原 87 度到顶 → 收在「原来如此」 | 终点 | 建议 |\n', '')], '表达缺 情绪曲线')

    def test_v4_bad_tone(self):
        self.bad([('plans/demo/plan.md', '| 基调 | 讲透型', '| 基调 | 轻松活泼')], '基调「轻松活泼')

    def test_v4_custom_tone(self):
        self.bad([('plans/demo/plan.md', '| 基调 | 讲透型（备选：冷静播报）', '| 基调 | 自定：小水滴人设，平实')], '基调 自定', code=0)

    def test_v4_local_tone_seg(self):
        self.bad([('plans/demo/plan.md', '讲透型（备选：冷静播报）', '讲透型；P5 换直播间促单')], '提醒：表达的基调写了 P5 的局部档', code=0)

    def test_v4_bad_tension(self):
        self.bad([('plans/demo/plan.md', '| 张力 | 1：', '| 张力 | 要有张力：')], '张力「要有张力')

    def test_v4_make_unreadable(self):
        self.bad([('plans/demo/plan.md', '能用：代码画、照片（只用青禾给的产品图）、生图；不能用：录像、生视频', '无真人出镜')], '「制作条件」要写成')

    def test_v4_make_restriction(self):
        out = self.bad([('plans/demo/plan.md', '生图；不能用：录像、生视频', '生图：只出锅和水；不能用：录像、生视频')], code=0)
        self.assertNotIn('提醒', out)

    def test_v4_view_head(self):
        self.bad([('plans/demo/plan.md', '| # | 段 | 要看到什么 | 来源 | 用到 |', '| # | 段 | 画面 | 来源 |')], '「画面」的表头')

    def test_v4_no_view_section(self):
        self.bad([('plans/demo/plan.md', '## 画面', '## 画面清单')], '要有「## 画面」一节')

    def test_v4_view_dup(self):
        self.bad([('plans/demo/plan.md', '| H2 | P1 |', '| H1 | P1 |')], '画面 H1：编号重复了', 'view H2 在 plan.md 的画面表里找不到')

    def test_v4_view_seg(self):
        self.bad([('plans/demo/plan.md', '| H2 | P1 |', '| H2 | P9 |')], '画面 H2：段「P9」不在框架里')

    def test_v4_view_source(self):
        self.bad([('plans/demo/plan.md', '| 代码画 | P1-2 |', '| 动画 | P1-2 |')], '来源「动画」不是')

    def test_v4_view_refs(self):
        self.bad([('plans/demo/plan.md', '| 代码画 | P1-2 |', '| 代码画 | P1-9、X1、P1 c |')],
                 '用到的 P1-9 在 plan.md、content.md 里找不到', '「X1」认不出', '用到的 P1 c')

    def test_v4_view_source_cannot(self):
        self.bad([('plans/demo/plan.md', '| 照片 | M1、K2 |', '| 录像 | M1、K2 |')], '画面 H4：来源是录像，制作条件写着不能用')

    def test_v4_gap_downstream(self):
        self.bad([('plans/demo/plan.md', '| M1、K2 |', '| M1、K2、Q1 |')], '用到 Q1，归下游、待补', code=0)

    def test_v4_frame_seg_without_view(self):
        self.bad([('plans/demo/plan.md', '| H3 | P2 | 高原湖边一锅水冒泡，温度计停在 87 | 生图 | K1、M2 |\n', ''),
                  ('plans/demo/plan.md', '| H4 | P2 | 青禾电热壶的产品图 | 照片 | M1、K2 |\n', '')],
                 '提醒：框架 P2 没有画面行', code=0, videos=False)

    def test_v4_unclaimed(self):
        self.bad([('videos/demo/storyboard.json', ', "view": "H2"', '')], '画面 H2（P1，代码画', '没有分镜认领')

    def test_v4_view_unknown(self):
        self.bad([('videos/demo/storyboard.json', '"view": "H1"', '"view": "H9"')], 'view H9 在 plan.md 的画面表里找不到')

    def test_v4_view_bad_shape(self):
        self.bad([('videos/demo/storyboard.json', '"view": "H1"', '"view": "画面 1"')], 'view 写画面编号')

    def test_v4_view_array(self):
        self.bad([('videos/demo/storyboard.json', '"view": "H1"', '"view": ["H1"]')], code=0)

    def test_v4_view_wrong_seg(self):
        self.bad([('videos/demo/storyboard.json', '"view": "H3"', '"view": "H1"')], 'view H1 是 P1 的画面，这段是 P2', '画面 H3')

    def test_v4_class_mismatch(self):
        self.bad([('videos/demo/storyboard.json', '"class": "T", "src": "source/qinghe/kettle.png"', '"class": "C", "src": "source/qinghe/kettle.png"')],
                 '分镜 2-2：认领 H4，照片要 T 类，这里是 C 类')

    def test_v4_material_not_in_src(self):
        self.bad([('videos/demo/storyboard.json', '"src": "source/qinghe/kettle.png"', '"src": "assets/other.png"')], '用到 M1，认领它的分镜 src 里没有')

    def test_v4_material_uses_only(self):
        self.bad([('videos/demo/storyboard.json', ', "view": "H4"', ''),
                  ('videos/demo/storyboard.json', '"materials": ["照片"], "rule": "K2"}', '"materials": ["照片"], "rule": "K2", "view": "H4"}')],
                 '只在 uses 认领，拆到分镜', code=0)

    def test_v4_rule_missing(self):
        self.bad([('videos/demo/storyboard.json', '"rule": "K2", "view": "H4"', '"view": "H4"')], '画面 H4', '要守 K2')

    def test_v4_material_type_cannot(self):
        self.bad([('videos/demo/storyboard.json', '"materials": ["照片"]', '"materials": ["录像"]')], '用了 录像，制作条件写着不能用')

    def test_v4_no_generation(self):
        out = self.bad([('plans/demo/plan.md', '能用：代码画、照片（只用青禾给的产品图）、生图；不能用：录像、生视频', '能用：代码画、照片；不能用：生图、生视频')],
                       '来源是生图，制作条件写着不能用', '分镜 2-1：G 类，制作条件不能用生图、生视频')
        self.assertNotIn('voice', out)  # 语音合成不是画面来源，旁白照常合成

    def test_v3_no_view(self):
        d = self.project(edits=[('videos/demo/storyboard.json', '"ref": "C-038"}], "note": "测试夹具"},', '"ref": "C-038", "view": "H1"}], "note": "测试夹具"},')])
        code, out = self.run_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('交接格式 3 没有画面（H），不写 view', out)

    def test_v4_orig_changed(self):
        self.bad([('videos/demo/script.json', '水约八十七度就开了', '水约八十七度就沸腾了')], '说法 P2 a 是原句，逐字稿没照着念')

    def test_v4_orig_numbers(self):
        self.bad([('videos/demo/script.json', '海拔四千米', '海拔 4000 米')], '提醒：说法 P2 a 是原句，去掉数字才对得上', code=0)

    def test_v4_orig_show(self):
        out = self.bad([('plans/demo/plan.md', '「在海拔四千米，', '「在海拔 4000 米，'),
                        ('videos/demo/script.json', '{"plan": "plans/demo/plan.md",', '{"plan": "plans/demo/plan.md", "show": {"四千米": "4000 米"},')],
                       code=0)
        self.assertNotIn('提醒', out)

    def test_v4_orig_split(self):
        out = self.bad([('videos/demo/script.json', '"所以在海拔四千米，水约八十七度就开了。"', '"所以在海拔四千米", "水约八十七度就开了。"')], code=0)
        self.assertNotIn('原句', out)

    def test_v4_tension1_exclaim(self):
        self.bad([('videos/demo/script.json', '气压越低，沸点越低。', '气压越低，沸点越低！')], '提醒：表达的张力是 1', 'P1 第 3 句', code=0)

    def test_v4_tension2_exclaim_ok(self):
        out = self.bad([('plans/demo/plan.md', '| 张力 | 1：', '| 张力 | 2：'), ('videos/demo/script.json', '气压越低，沸点越低。', '气压越低，沸点越低！')], code=0)
        self.assertNotIn('张力是 1', out)


if __name__ == '__main__':
    unittest.main()
