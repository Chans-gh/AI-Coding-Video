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

    # ---------- check_copy.py --plan ----------
    def test_copy_redline_words(self):
        sys.path.insert(0, str(HERE.parent.parent / 'samples' / 'tools'))
        import check_copy
        d = self.v5([(SB, '"大数字 100 °C 数上来"', '"大数字 100 °C 永远是沸点"')])
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
