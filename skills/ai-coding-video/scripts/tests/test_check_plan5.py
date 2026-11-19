"""check_plan.py 认交接格式 5（content.md 唯一交付物）的离线测试：python3 -m unittest discover -s <本 Skill 目录>/scripts/tests"""
import contextlib
import io
import itertools
import json
import os
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import check_plan  # noqa: E402

C = 'plans/demo/content.md'
SB = 'videos/demo/storyboard.json'
SC = 'videos/demo/script.json'


class CheckPlan5(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp)
        self.n = itertools.count()

    def v5(self, edits=()):
        """拷一份 ok5 夹具，按 (文件, 旧, 新) 改几处，返回项目根目录"""
        d = self.tmp / f'ok5-{next(self.n)}'
        shutil.copytree(HERE / 'fixtures' / 'ok5', d)
        for f, old, new in edits:
            p = d / f
            t = p.read_text(encoding='utf-8')
            self.assertIn(old, t, f'{f} 里没有「{old}」')
            p.write_text(t.replace(old, new, 1), encoding='utf-8')
        return d

    def run5(self, d, entry='plans/demo', videos=True, extra=()):
        args = [entry, *extra]
        if videos:
            args += ['--storyboard', SB, '--script', SC]
        return self.run_args(d, args)

    def run_args(self, d, args):
        out = io.StringIO()
        cwd = os.getcwd()
        os.chdir(d)
        try:
            with contextlib.redirect_stdout(out):
                code = check_plan.main(args)
        finally:
            os.chdir(cwd)
        return code, out.getvalue()

    def assertErr(self, d, text, **kw):
        code, out = self.run5(d, **kw)
        self.assertEqual(code, 1, out)
        self.assertIn(text, out)
        return out

    def timing(self, d, p1_dur=15, p2_dur=15, shots1=((0, 7.5), (7.5, 15))):
        """写一份 timing.json：P1 四句（0、3.5、8、11.5 秒起，各 3 秒）、P2 两句，分镜起止"""
        t = {'fps': 30, 'segments': [
            {'seg': 'P1', 'dur': p1_dur, 'vo': [{'at': a, 't': 3} for a in (0, 3.5, 8, 11.5)],
             'shots': [{'t0': x, 't1': y} for x, y in shots1]},
            {'seg': 'P2', 'dur': p2_dur, 'vo': [{'at': 0.5, 't': 5}, {'at': 7, 't': 5}], 'shots': [{'t0': 0, 't1': p2_dur}]}]}
        (d / 'videos/demo/timing.json').write_text(json.dumps(t), encoding='utf-8')

    # ---------- 入口和读表 ----------
    def test_v5_ok(self):
        d = self.v5()
        before = (d / 'plans/demo/plan.md').read_bytes()
        for entry in ('plans/demo', C, 'plans/demo/plan.md'):
            code, out = self.run5(d, entry=entry)
            self.assertEqual(code, 0, out)
            self.assertNotIn('✗', out)
            self.assertIn('格式 5、已交接', out)
            self.assertIn('下游回报 2 行', out)
        self.assertEqual(before, (d / 'plans/demo/plan.md').read_bytes())

    def test_v5_table(self):
        code, out = self.run5(self.v5(), extra=['--table'])
        self.assertEqual(code, 0, out)
        self.assertIn('| S3 | P1 | 必讲 |', out)
        self.assertIn('| 压缩 | X2 |', out)
        self.assertIn('| 删了 | X1 |', out)
        self.assertIn('bigNumber（顶档「100 °C」）', out)
        self.assertIn('| 版式 |', out)
        self.assertIn('B3：不把 87 度', out)
        self.assertIn('| P1 | 稳 · 中 | 15 秒 | 68 |', out)

    def test_v5_head_exact(self):
        d = self.v5([(C, '| # | 点 | 句 | 级 | 依据 |', '| # | 点 | 句子 | 级 | 依据 |')])
        self.assertErr(d, '「念什么」的表头要是「# | 点 | 句 | 级 | 依据」')

    def test_v5_missing_section(self):
        d = self.v5([(C, '## 衍生\n\n无\n', '')])
        self.assertErr(d, 'content.md 缺这几节：衍生')

    def test_v5_status_reflow_stops(self):
        d = self.v5([(C, '状态：已交接', '状态：回流中')])
        code, out = self.run5(d)
        self.assertEqual(code, 2, out)

    def test_v5_bad_values(self):
        d = self.v5([(C, '| 语速 | 中 |', '| 语速 | 飞快 |'), (C, '| 一个数 | 100 °C |', '| 大数 | 100 °C |'),
                     (C, '词：「永远是」', '查词：「永远是」'), (C, '| 情绪 | 稳 |', '| 情绪 | 平 |')])
        out = self.assertErr(d, '语速「飞快」')
        self.assertIn('主角「大数」', out)
        self.assertIn('「怎么查」要以「词：」', out)
        self.assertIn('情绪「平」', out)

    def test_v5_with_other_segment(self):
        d = self.v5([(C, '| S3 | P1-2 |', '| S5 | P1-2 |')])
        self.assertErr(d, '配哪句 S5 是 P2 的句子')

    # ---------- 逐字稿 ↔ 念什么 ----------
    def test_v5_orig_changed(self):
        d = self.v5([(SC, '"在海拔四千米，水约八十七度就开了。"', '"在四千米高的地方，水八十七度就开了。"')])
        self.assertErr(d, '念什么 S5 是原句，逐字稿没照着念')

    def test_v5_must_missing(self):
        d = self.v5([(SC, '"say": ["S5", "S6"]', '"say": ["S5", null]')])
        out = self.assertErr(d, '念什么 S6（P2，必讲）没有 vo 认领')
        self.assertIn('不是念什么里的（say 写了 null）', out)

    def test_v5_say_shape(self):
        d = self.v5([(SC, '"say": ["S5", "S6"]', '"say": ["S5"]')])
        self.assertErr(d, 'say 要是和 vo 一样长的数组')
        d = self.v5([(SC, '"say": ["S5", "S6"]', '"say": ["S5", "S3"]')])
        self.assertErr(d, 'say S3 是 P1 的句子，要在同一段念')
        d = self.v5([(SC, ', "say": ["S5", "S6"]', '')])
        self.assertErr(d, '缺 say')

    def test_v5_one_vo_two_sentences(self):
        d = self.v5([(SC, '["在海拔四千米，水约八十七度就开了。", "所以在高原上煮面，要多煮一会儿。"], "say": ["S5", "S6"]',
                      '["在海拔四千米，水约八十七度就开了。所以在高原上煮面，要多煮一会儿。"], "say": [["S5", "S6"]]'),
                     (SB, '"view": "H3", "vo": [1, 2]', '"view": "H3", "vo": [1]')])
        code, out = self.run5(d)
        self.assertEqual(code, 0, out)

    def test_v5_cut_without_report(self):
        d = self.v5([(C, '| X1 | P2 | 删减 | S7 |', '| X1 | P2 | 压缩 | S6 |')])
        self.assertErr(d, '念什么 S7（P2，可删①）删了，下游回报里没有它的「删减」行')

    def test_v5_cut_order(self):
        d = self.v5([(C, '| 可删① | 观点 |', '| 可删② | 观点 |\n| S8 | a | 「水开得早，可温度不高。」 | 可删① | 过渡 |'),
                     (SC, '"所以在高原上煮面，要多煮一会儿。"], "say": ["S5", "S6"]',
                      '"所以在高原上煮面，要多煮一会儿。", "水开得早，可温度不高。"], "say": ["S5", "S6", "S8"]'),
                     (SB, '"view": "H3", "vo": [1, 2]', '"view": "H3", "vo": [1, 2, 3]')])
        code, out = self.run5(d)
        self.assertEqual(code, 0, out)
        self.assertIn('P2 删了可删②，却留着 S8', out)

    def test_v5_must_compressed_note(self):
        d = self.v5([(C, '| X2 | P1 | 压缩 | S3 |', '| X2 | P1 | 删减 | S7 |')])
        code, out = self.run5(d)
        self.assertEqual(code, 0, out)
        self.assertIn('S3（必讲）和 vo 不一样', out)

    # ---------- 分镜 ↔ 看什么、信息 ----------
    def test_v5_view_unclaimed(self):
        d = self.v5([(SB, '"view": "H2", ', '')])
        self.assertErr(d, '画面 H2（P1，代码画')
        d = self.v5([(SB, '"view": "H2", ', ''),
                     (C, '| X2 | P1 | 压缩 | S3 | 压成「气压越低，沸点越低」 | 下游 | 已知悉 |  |',
                      '| X2 | P1 | 压缩 | S3 | 压成「气压越低，沸点越低」 | 下游 | 已知悉 |  |\n'
                      '| X3 | P1 | 偏离 | H2 | 折线改成口播带过 | 下游 | 已知悉 |  |')])
        code, out = self.run5(d)
        self.assertEqual(code, 0, out)

    def test_v5_fact_not_told(self):
        d = self.v5([(SC, '"ref": "P1-2"', '"ref": "P1-3"')])
        self.assertErr(d, 'P1-3 的去向是「不讲」，不进成片')

    def test_v5_info_unused(self):
        d = self.v5([(C, '| X1 | P2 | 删减 | S7 |', '| X1 | P2 | 压缩 | S6 |'),
                     (C, '不讲：和 P1-1 冲突 |', '念 S7 |')])
        self.assertErr(d, '信息 P1-3（P1）去向是「念 S7」，成片里一处都没用到')

    def test_v5_redline_word(self):
        d = self.v5([(SC, '"所以一百度，其实是有条件的。"', '"所以一百度，不一定是沸点。"')])
        self.assertErr(d, '出现红线 B1 的词「一定是」')
        d = self.v5([(SB, '"label": "一个标准大气压下"', '"label": "永远是一百度？"')])
        self.assertErr(d, '分镜 1-1 的 o：出现红线 B1 的词「永远是」')

    # ---------- 下游回报 ----------
    def test_v5_report_values(self):
        d = self.v5([(C, '| X2 | P1 | 压缩 | S3 |', '| X3 | P1 | 改了 | S9 |')])
        out = self.assertErr(d, '这一行该是 X2')
        self.assertIn('类型「改了」', out)
        self.assertIn('对象 S9 在 content.md 里找不到', out)

    def test_v5_report_needs_reflow(self):
        d = self.v5([(C, '| 下游 | 已知悉 |  |\n| X2', '| 策划 | 待补 |  |\n| X2')])
        self.assertErr(d, '状态行要改成「回流中」')

    # ---------- 版式（查表） ----------
    def test_v5_layout_lead(self):
        d = self.v5([(SB, '"part": "bigNumber",\n              "o": {"to": 100, "suffix": " °C", "label": "一个标准大气压下"}',
                      '"part": "quote", "o": {"text": "100 °C"}')])
        self.assertErr(d, 'H1 的主角是「一个数」，查表给的是 bigNumber，这里用 quote')

    def test_v5_layout_top(self):
        d = self.v5([(SB, '"o": {"to": 100, "suffix": " °C", "label": "一个标准大气压下"}',
                      '"o": {"to": 99, "suffix": " °C", "label": "100 °C"}')])
        self.assertErr(d, 'H1 的最大的字「100 °C」要放在 bigNumber 的顶档')

    def test_v5_layout_needs_part(self):
        d = self.v5([(SB, '"part": "bigNumber",\n              "o": {"to": 100, "suffix": " °C", "label": "一个标准大气压下"}, ', '')])
        self.assertErr(d, '写 part（用哪个部件')

    def test_part_shape(self):
        d = self.v5([(SB, '"part": "bigNumber"', '"part": 3')])
        self.assertErr(d, 'part 写风格包里的部件名')

    # ---------- 配音后 ----------
    def test_v5_timing_ok(self):
        d = self.v5()
        self.timing(d)
        code, out = self.run5(d)
        self.assertEqual(code, 0, out)

    def test_v5_timing_overlap(self):
        d = self.v5()
        self.timing(d, shots1=((0, 3), (3, 15)))
        self.assertErr(d, '认领 H1，配的 S2 在 3.5–6.5 秒念，时间上不重叠')

    def test_v5_timing_length(self):
        d = self.v5()
        self.timing(d, p1_dur=24, p2_dur=24, shots1=((0, 6), (6, 24)))
        out = self.assertErr(d, '配音后全片 48.0 秒')
        self.assertIn('P1 配音后 24.0 秒，篇幅 15 秒', out)
        self.assertIn('分镜 1-2 18.0 秒，查表（张力 1、节奏 中）是 5.0–9.0 秒', out)


    # ---------- 批 J2 回放查出来的 ----------
    def keep_s7(self):
        """S7（可删①）不删：念进 P2，去掉 X1；X2 改成 X1"""
        return self.v5([(C, '| X1 | P2 | 删减 | S7 | 时长不够，删可删① | 下游 | 已知悉 |  |\n| X2 |', '| X1 |'),
                        (SC, '"所以在高原上煮面，要多煮一会儿。"], "say": ["S5", "S6"]',
                         '"所以在高原上煮面，要多煮一会儿。", "水开得早，可温度不高。"], "say": ["S5", "S6", "S7"]'),
                        (SB, '"view": "H3", "vo": [1, 2]', '"view": "H3", "vo": [1, 2, 3]')])

    def long_timing(self, d, p2_vo=2):
        """配音后 P1、P2 各 24 秒，全片 48 秒（总则 30 秒，25–35；上限的 115% 是 40.25 秒）"""
        t = {'fps': 30, 'segments': [
            {'seg': 'P1', 'dur': 24, 'vo': [{'at': a, 't': 5} for a in (0, 6, 12, 18)],
             'shots': [{'t0': 0, 't1': 12}, {'t0': 12, 't1': 24}]},
            {'seg': 'P2', 'dur': 24, 'vo': [{'at': 0.5 + 8 * k, 't': 6} for k in range(p2_vo)],
             'shots': [{'t0': 0, 't1': 24}]}]}
        (d / 'videos/demo/timing.json').write_text(json.dumps(t), encoding='utf-8')

    def test_j2_overrun_cut_first(self):
        """F3：超时还留着可删的，先按圈号删（报出删哪句、约省几秒），不能只写一行「偏离」"""
        d = self.keep_s7()
        self.long_timing(d, p2_vo=3)
        out = self.assertErr(d, '先按圈号从小到大删可删：可删① S7')
        self.assertIn('约 6.0 秒', out)

    def test_j2_overrun_needs_reflow(self):
        """F3：可删都删完还超，要有归「策划」的「压缩」或「删减」回报，回流"""
        d = self.v5()
        self.long_timing(d)
        out = self.assertErr(d, '可删已经删完，还超')
        self.assertIn('类型写「压缩」或「删减」、归「策划」', out)
        self.assertIn('P1 配音后 24.0 秒，篇幅 15 秒', out)
        # 写成「偏离」不算
        d = self.v5([(C, '| X2 | P1 | 压缩 | S3 | 压成「气压越低，沸点越低」 | 下游 | 已知悉 |  |',
                      '| X2 | P1 | 压缩 | S3 | 压成「气压越低，沸点越低」 | 下游 | 已知悉 |  |\n'
                      '| X3 | 全部 | 偏离 | S3 | 配音 48 秒，超篇幅 | 下游 | 已知悉 |  |')])
        self.long_timing(d)
        out = self.assertErr(d, '「偏离」只用于画面做法和策划写的不一样')
        self.assertIn('可删已经删完，还超', out)
        # 回报了、状态改回流中：停下等策划
        d = self.v5([(C, '| X2 | P1 | 压缩 | S3 | 压成「气压越低，沸点越低」 | 下游 | 已知悉 |  |',
                      '| X2 | P1 | 压缩 | S3 | 压成「气压越低，沸点越低」 | 下游 | 已知悉 |  |\n'
                      '| X3 | 全部 | 压缩 | S2、S3 | 删完可删仍超 37%，请压必讲 | 策划 | 待补 |  |'),
                     (C, '状态：已交接', '状态：回流中')])
        self.long_timing(d)
        code, out = self.run5(d)
        self.assertEqual(code, 2, out)

    def test_j2_overrun_reported_to_planner(self):
        """F3：有归「策划」的压缩行时，超时那条不再报错（状态行另查）"""
        d = self.v5([(C, '| X2 | P1 | 压缩 | S3 | 压成「气压越低，沸点越低」 | 下游 | 已知悉 |  |',
                      '| X2 | P1 | 压缩 | S3 | 压成「气压越低，沸点越低」 | 下游 | 已知悉 |  |\n'
                      '| X3 | 全部 | 压缩 | S2、S3 | 删完可删仍超 37%，请压必讲 | 策划 | 待补 |  |')])
        self.long_timing(d)
        out = self.assertErr(d, '状态行要改成「回流中」')
        self.assertNotIn('可删已经删完，还超', out)

    def test_j2_onscreen_text(self):
        """F4：「上屏的字」逐项和分镜上屏的字比，对不上的列出来；有「偏离」回报的放过"""
        d = self.v5([(C, '| 「一个标准大气压下」 |', '| 「一个标准大气压下」「海平面」 |'),
                     (C, '| 气压越低，沸点越低 | 无 |', '| 气压越低，沸点越低 | 「高压锅」「气压计」「海拔 8848 米」 |')])
        out = self.assertErr(d, 'H1「上屏的字」的「海平面」')
        self.assertIn('H2「上屏的字」的「高压锅」「气压计」「海拔 8848 米」', out)
        self.assertNotIn('「一个标准大气压下」在', out)
        d = self.v5([(C, '| 「一个标准大气压下」 |', '| 「一个标准大气压下」「海平面」 |'),
                     (C, '| X2 | P1 | 压缩 | S3 | 压成「气压越低，沸点越低」 | 下游 | 已知悉 |  |',
                      '| X2 | P1 | 压缩 | S3 | 压成「气压越低，沸点越低」 | 下游 | 已知悉 |  |\n'
                      '| X3 | P1 | 偏离 | H1 | 「海平面」改成口播带过 | 下游 | 已知悉 |  |')])
        code, out = self.run5(d)
        self.assertEqual(code, 0, out)
        # 写的是要求不是字（「不写比例数字」）不算要上屏的字
        d = self.v5([(C, '| 气压越低，沸点越低 | 无 |', '| 气压越低，沸点越低 | 不写比例数字 |')])
        code, out = self.run5(d)
        self.assertEqual(code, 0, out)
        # 只跳过写要求的句式；「无风」「不倒翁」这种以不、无开头的字照样要上屏
        d = self.v5([(C, '| 气压越低，沸点越低 | 无 |', '| 气压越低，沸点越低 | 无风、不倒翁、别写单位 |')])
        out = self.assertErr(d, 'H2「上屏的字」的「无风」「不倒翁」在')
        self.assertNotIn('「别写单位」', out)

    def test_j2_show_back_to_original(self):
        """F5：vo 按 show 换回字幕写法要等于原文：漏了 show 报错；show 的键在 vo 里找不到也报错"""
        d = self.v5([(C, '「在海拔四千米，水约八十七度就开了。」', '「在海拔 4000 米，水约 87 度就开了。」')])
        self.assertErr(d, '念什么 S5 的字幕对不上原文')
        d = self.v5([(C, '「在海拔四千米，水约八十七度就开了。」', '「在海拔 4000 米，水约 87 度就开了。」'),
                     (SC, '{"plan": "plans/demo/content.md",', '{"plan": "plans/demo/content.md", "show": {"四千米": "4000 米", "八十七度": "87 度"},')])
        code, out = self.run5(d)
        self.assertEqual(code, 0, out)
        d = self.v5([(SC, '{"plan": "plans/demo/content.md",', '{"plan": "plans/demo/content.md", "show": {"一点四倍": "1.4 倍"},')])
        self.assertErr(d, 'show 的键「一点四倍」在哪句 vo 里都没有')
        # 必讲只差数字写法的也一样
        d = self.v5([(C, '「所以在高原上煮面，要多煮一会儿。」', '「所以在 4000 米煮面，要多煮一会儿。」'),
                     (SC, '"所以在高原上煮面，要多煮一会儿。"', '"所以在四千米煮面，要多煮一会儿。"')])
        self.assertErr(d, '念什么 S6 的字幕对不上原文')

    def test_j2_with_list(self):
        """N13：配哪句可以写几句（S1、S2 或 S1–S2），按列表读"""
        for cell in ('S1、S2', 'S1–S2'):
            d = self.v5([(C, '| 「一个标准大气压下」 | S2 |', f'| 「一个标准大气压下」 | {cell} |')])
            code, out = self.run5(d)
            self.assertEqual(code, 0, out)
            self.timing(d)
            code, out = self.run5(d)
            self.assertEqual(code, 0, out)
        d = self.v5([(C, '| 「一个标准大气压下」 | S2 |', '| 「一个标准大气压下」 | S2、S9 |')])
        self.assertErr(d, '配哪句的 S9 在念什么里找不到')

    def test_j2_redline_except(self):
        """N15：「；除外：S4、题目」写到的句子和题目不查；别的写法读不出：按没有例外查，交人工看，不判回流"""
        d = self.v5([(C, '词：「永远是」「一定是」', '词：「永远是」「一定是」「不总是」；除外：S4、题目'),
                     (SC, '"所以一百度，其实是有条件的。"', '"所以一百度，不一定是沸点。"'),
                     (SB, '"label": "一个标准大气压下"', '"label": "一个标准大气压下", "kicker": "水为什么不总是一百度开"')])
        code, out = self.run5(d)
        self.assertEqual(code, 0, out)
        self.assertNotIn('一定是', out.replace('「永远是」「一定是」', ''))
        self.assertNotIn('不总是', out.replace('「不总是」；', ''))
        d = self.v5([(C, '词：「永远是」「一定是」', '词：「永远是」「一定是」；除外：S9')])
        self.assertErr(d, '除外的 S9 在念什么里找不到')
        d = self.v5([(C, '词：「永远是」「一定是」', '词：「永远是」「一定是」；题目和引述观众的话除外'),
                     (SC, '"所以一百度，其实是有条件的。"', '"所以一百度，不一定是沸点。"')])
        code, out = self.run5(d)
        self.assertEqual(code, 0, out)
        self.assertIn('例外读不出', out)
        self.assertNotIn('回流', out.split('例外读不出')[1].split('\n')[0].replace('不直接回流', ''))
        self.assertIn('交人工看', out)

    def test_j2_measured_speed(self):
        """F2′：配音后报一句实测语速（按念法数、含停顿）"""
        d = self.v5()
        self.timing(d)
        code, out = self.run5(d, extra=['--table'])
        self.assertEqual(code, 0, out)
        self.assertIn('实测语速：每秒 2.4 字（按念法数，含停顿', out)
        # 建议倍速只按实测算，不带某次测出来的固定比例
        d = self.v5([(SB, '"speed": 1.08', '"speed": 0.9')])
        self.timing(d)
        code, out = self.run5(d, extra=['--table'])
        self.assertIn('unify.voice.speed 可以从 0.9 按比例调到约 1.71', out)
        self.assertIn('以实测为准', out)
        self.assertNotIn('13%', out)

    def test_j2_c4_opinion(self):
        """N14：C4 写了讲成观点的，不再要求「官方称」"""
        d = self.v5([(C, '| P2-1 | a | 海拔 4000 米处，水约 87 °C 沸腾 | B6 | 用 P1-2 和教材的气压表 | 公式、用到的编号 | 已核实 | 念 S5 |',
                      '| P2-1 | a | 海拔 4000 米处，水约 87 °C 沸腾 | B6 | 用 P1-2 和教材的气压表 | 公式、用到的编号 | 已核实 | 念 S5 |\n'
                      '| P2-2 | a | 作者觉得高原煮面最好用高压锅 | C4 | 作者 · 2026-11-09 | 是用户（作者）的观点，讲成观点 | 已核实 | 念 S6 |'),
                     (SC, '"calc": "由 P1-2 和气压表推出"}', '"calc": "由 P1-2 和气压表推出"}, {"what": "作者的建议", "ref": "P2-2", "src": null}')])
        code, out = self.run5(d)
        self.assertNotIn('官方称', out)
        d = self.v5([(C, '| P2-1 | a | 海拔 4000 米处，水约 87 °C 沸腾 | B6 | 用 P1-2 和教材的气压表 | 公式、用到的编号 | 已核实 | 念 S5 |',
                      '| P2-1 | a | 海拔 4000 米处，水约 87 °C 沸腾 | B6 | 用 P1-2 和教材的气压表 | 公式、用到的编号 | 已核实 | 念 S5 |\n'
                      '| P2-2 | a | 厂家称高压锅 3 分钟煮好 | C4 | 厂家官网 · 2026-11-09 | 讲成「官方称」 | 已核实 | 念 S6 |'),
                     (SC, '"calc": "由 P1-2 和气压表推出"}', '"calc": "由 P1-2 和气压表推出"}, {"what": "厂家的数", "ref": "P2-2", "src": null}')])
        code, out = self.run5(d)
        self.assertIn('官方称', out)
        # 写的是「不要讲成观点」：照旧要「官方称」
        d = self.v5([(C, '| P2-1 | a | 海拔 4000 米处，水约 87 °C 沸腾 | B6 | 用 P1-2 和教材的气压表 | 公式、用到的编号 | 已核实 | 念 S5 |',
                      '| P2-1 | a | 海拔 4000 米处，水约 87 °C 沸腾 | B6 | 用 P1-2 和教材的气压表 | 公式、用到的编号 | 已核实 | 念 S5 |\n'
                      '| P2-2 | a | 厂家称高压锅 3 分钟煮好 | C4 | 厂家官网 · 2026-11-09 | 是厂家的数，不要讲成观点 | 已核实 | 念 S6 |'),
                     (SC, '"calc": "由 P1-2 和气压表推出"}', '"calc": "由 P1-2 和气压表推出"}, {"what": "厂家的数", "ref": "P2-2", "src": null}')])
        code, out = self.run5(d)
        self.assertIn('官方称', out)

    def test_docs_no_past_cases(self):
        """规则写成通用的：语速和示例不写某次的题目、配音服务和测出来的数"""
        root = HERE.parent.parent
        for name in ('sound.md', 'storyboard.md', 'film.md'):
            text = (root / name).read_text(encoding='utf-8')
            for bad in ('ep05', 'J2', 'speech-2.8', '约慢 13%', '扣 50%', '保费'):
                self.assertNotIn(bad, text, f'{name} 里有「{bad}」')

    def test_speed_table_is_downstream(self):
        """上游 0.8.2 只定三档的字数；倍速对照是下游按自己的引擎测的，写明引擎，不写成上游规定的"""
        root = HERE.parent.parent
        sound = (root / 'sound.md').read_text(encoding='utf-8')
        board = (root / 'storyboard.md').read_text(encoding='utf-8')
        for bad in ('0.95 / 1.08 / 1.2', '0.95、1.08、1.2', '| 中 | 4.5 | 1.08 |'):
            self.assertNotIn(bad, sound + board)
        self.assertIn('按自己用的配音引擎实测换算', sound)
        self.assertIn('测的引擎：Kokoro v1.1-zh', sound)

    def test_speed_tier_from_general_only(self):
        """语速档只认总则「语速」一行的 慢、中、快；「快一点」不是档，材料里说的快慢不改档"""
        d = self.v5([(C, '| 语速 | 中 | 测试 |', '| 语速 | 快一点 | 测试 |')])
        self.assertErr(d, '总则的语速「快一点」要是 慢、中、快 之一')
        d = self.v5([(C, '| P1-2 | b | 气压越低，水的沸点越低 |', '| P1-2 | b | 气压越低，水的沸点越低；用户说节奏快一点 |')])
        self.timing(d)
        code, out = self.run5(d, extra=['--table'])
        self.assertIn('语速档「中」是每秒 4.5 字', out)

    def test_j2_part_values(self):
        """F6：上屏不写数时，部件的数值要取信息里的（按 0.8 / 0.2 画，信息写的是 50%）"""
        d = self.v5([(C, '| 折线：海拔升高，沸点往下走 | 代码画 | 走势 | 气压越低，沸点越低 | 无 |',
                      '| 折线：海拔升高，沸点往下走 | 代码画 | 走势 | 气压越低，沸点越低 | 不写比例数字 |'),
                     (C, '| 气压越低，水的沸点越低 | E2 |', '| 气压越低，水的沸点越低；山顶的气压约为海平面的 50% | E2 |'),
                     (SB, '"values": [100, 97, 93, 90, 87]', '"values": [0.8, 0.2]')])
        code, out = self.run5(d)
        self.assertEqual(code, 0, out)
        self.assertIn('分镜 1-2 的 o 里 0.8、0.2 在 H2 用到的信息里找不到', out)
        d = self.v5([(C, '| 折线：海拔升高，沸点往下走 | 代码画 | 走势 | 气压越低，沸点越低 | 无 |',
                      '| 折线：海拔升高，沸点往下走 | 代码画 | 走势 | 气压越低，沸点越低 | 不写比例数字 |'),
                     (C, '| 气压越低，水的沸点越低 | E2 |', '| 气压越低，水的沸点越低；山顶的气压约为海平面的 50% | E2 |'),
                     (SB, '"values": [100, 97, 93, 90, 87]', '"values": [0.5, 0.5]')])
        code, out = self.run5(d)
        self.assertNotIn('在 H2 用到的信息里找不到', out)

    def copy_check(self, d, plan=True):
        sys.path.insert(0, str(HERE.parent.parent / 'samples' / 'tools'))
        import check_copy
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = check_copy.main([str(d / 'videos/demo')] + (['--plan', str(d / C)] if plan else []))
        return code, out.getvalue()

    def test_j2_copy_onscreen_only(self):
        """9：极限词、禁用词只查上屏的（部件的字、分镜的 o、字幕），不查 what 描述"""
        d = self.v5([(SB, '"大数字 100 °C 数上来"', '"最大的字最显眼：100 °C 数上来"')])
        code, out = self.copy_check(d, plan=False)
        self.assertEqual(code, 0, out)
        self.assertNotIn('极限词', out)
        d = self.v5([(SB, '"label": "一个标准大气压下"', '"label": "最准的沸点"')])
        code, out = self.copy_check(d, plan=False)
        self.assertIn('极限词「最」', out)

    def test_j2_copy_except(self):
        """N15：check_copy --plan 也认「；除外：」：题目不查，写到的句子的字幕不查"""
        d = self.v5([(C, '词：「永远是」「一定是」', '词：「永远是」「一定是」「不总是」；除外：S4、题目'),
                     (SC, '"所以一百度，其实是有条件的。"', '"所以一百度，不一定是沸点。"'),
                     (SB, '"label": "一个标准大气压下"', '"label": "一个标准大气压下", "kicker": "水为什么不总是一百度开"')])
        code, out = self.copy_check(d)
        self.assertEqual(code, 0, out)
        d = self.v5([(SC, '"所以在高原上煮面，要多煮一会儿。"', '"所以在高原上，不一定是要多煮。"')])
        code, out = self.copy_check(d)
        self.assertEqual(code, 1, out)
        self.assertIn('禁用词「一定是」', out)

    def test_j2_heard_anomaly(self):
        """10：回听多字、吞字、尾音单独标出来请人确认；heard_ok 记了人确认过的才算过"""
        sys.path.insert(0, str(HERE.parent.parent / 'samples' / 'tools'))
        import voice
        self.assertEqual(voice.anomaly(['yi', 'bai', 'du'], ['yi', 'bai', 'du', 'e']), '尾音多了「e」')
        self.assertEqual(voice.anomaly(['yi', 'bai', 'du'], ['en', 'yi', 'bai', 'du']), '句首多了「en」')
        self.assertEqual(voice.anomaly(['yi', 'bai', 'du', 'ma'], ['yi', 'bai', 'ma']), '吞字：少了「du」')
        self.assertEqual(voice.anomaly(['yi', 'bai', 'du'], ['yi', 'bai', 'ge', 'du']), '多字：多了「ge」')
        self.assertIsNone(voice.anomaly(['yi', 'bai', 'du'], ['er', 'shi', 'ge']))
        self.assertTrue(voice.confirmed({'一百度。': '一百度额'}, '一百度。', '一百度额'))
        self.assertFalse(voice.confirmed({'一百度。': '一百度额'}, '一百度。', '一百度嗯'))
        import check_storyboard
        self.assertEqual(check_storyboard.check_heard_ok({'heard_ok': {'一百度。': '一百度额'}}), [])
        self.assertTrue(check_storyboard.check_heard_ok({'heard_ok': ['一百度额']}))

    # ---------- check_copy.py --plan ----------
    def test_copy_redline_words(self):
        sys.path.insert(0, str(HERE.parent.parent / 'samples' / 'tools'))
        import check_copy
        d = self.v5([(SB, '"label": "一个标准大气压下"', '"label": "沸点永远是一百度"')])
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = check_copy.main([str(d / 'videos/demo'), '--plan', str(d / C)])
        self.assertEqual(code, 1, out.getvalue())
        self.assertIn('禁用词「永远是」（红线 B1', out.getvalue())
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = check_copy.main([str(d / 'videos/demo')])
        self.assertEqual(code, 0, out.getvalue())


if __name__ == '__main__':
    unittest.main()
