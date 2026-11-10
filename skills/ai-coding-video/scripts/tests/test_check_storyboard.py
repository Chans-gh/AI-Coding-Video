"""check_storyboard.py 的离线测试（无策划的分镜、逐字稿；接策划时 check_plan.py 也调它）：
python3 -m unittest discover -s <本 Skill 目录>/scripts/tests"""
import contextlib
import io
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import check_plan  # noqa: E402
import check_storyboard  # noqa: E402

SB = 'videos/demo/storyboard.json'
SC = 'videos/demo/script.json'


class CheckStoryboard(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp)

    def project(self, name='free', edit=None):
        """拷一份夹具；edit(sb, sc) 直接改两份 JSON，返回项目根目录"""
        d = Path(tempfile.mkdtemp(dir=self.tmp)) / name
        shutil.copytree(HERE / 'fixtures' / name, d)
        if edit:
            sb, sc = (json.loads((d / f).read_text(encoding='utf-8')) for f in (SB, SC))
            edit(sb, sc)
            for f, x in ((SB, sb), (SC, sc)):
                (d / f).write_text(json.dumps(x, ensure_ascii=False), encoding='utf-8')
        return d

    def run_check(self, d, *extra):
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = check_storyboard.main([str(d / SB), *extra])
        return code, out.getvalue()

    def assertFails(self, edit, needle, *extra):
        code, out = self.run_check(self.project(edit=edit), *extra)
        self.assertEqual(code, 1, out)
        self.assertIn(needle, out)
        return out

    # ---------- 无策划的例子 ----------
    def test_ok(self):
        code, out = self.run_check(self.project())
        self.assertEqual(code, 0, out)
        self.assertNotIn('✗', out)
        self.assertIn('带逐字稿', out)  # 默认读同目录的 script.json

    def test_ready_ok(self):
        def confirmed(sb, sc):
            sb['status'] = '用户确认'
        code, out = self.run_check(self.project(edit=confirmed), '--ready')
        self.assertEqual(code, 0, out)

    def test_table(self):
        def pending(sb, sc):
            sc['segments'][1]['facts'][1]['confirm'] = '待用户确认'
        code, out = self.run_check(self.project(edit=pending), '--table')
        self.assertEqual(code, 0, out)
        for x in ('| 段 | 讲什么 | 秒 | 样式 | 主角 |', 'C-036', '（典型样片）', '合计 30 秒，目标 30 秒', '全片统一：',
                  '旁白音色：', '待用户确认的事实：', 'P2：海拔 4000 米'):
            self.assertIn(x, out)

    def test_unreadable(self):
        d = self.project()
        (d / SB).write_text('{', encoding='utf-8')
        code, out = self.run_check(d)
        self.assertEqual(code, 2, out)

    # ---------- 验收的四种报错 ----------
    def test_no_unify(self):
        self.assertFails(lambda sb, sc: sb.pop('unify'), '缺 "unify"')

    def test_unify_incomplete(self):
        self.assertFails(lambda sb, sc: sb['unify'].pop('trans'), 'unify 缺 trans')

    def test_ref_not_found(self):
        def bad(sb, sc):
            sb['segments'][1]['uses'][0]['ref'] = 'C-999'
        self.assertFails(bad, "ref 'C-999' 不在 data/styles.json 里")

    def test_plan_and_brief(self):
        self.assertFails(lambda sb, sc: sb.update(plan='plans/demo/plan.md'), '"plan" 和 "brief" 只写一个')

    def test_ready_pending(self):
        def pending(sb, sc):
            sb['status'] = '用户确认'
            sc['segments'][1]['facts'][1]['confirm'] = '待用户确认'
        out = self.assertFails(pending, '还是「待用户确认」', '--ready')
        self.assertNotIn('status 是', out)
        code, out = self.run_check(self.project(edit=pending))  # 不加 --ready 时只是草稿，不报错
        self.assertEqual(code, 0, out)

    # ---------- 其余规矩 ----------
    def test_ready_draft(self):
        self.assertFails(None, "status 是 '草稿'", '--ready')

    def test_no_plan_no_brief(self):
        self.assertFails(lambda sb, sc: sb.pop('brief'), '缺 "plan" 或 "brief"')

    def test_brief_incomplete(self):
        self.assertFails(lambda sb, sc: sb['brief'].pop('gain'), 'brief 缺 gain')

    def test_old_style_field(self):
        self.assertFails(lambda sb, sc: sb.update(style='C-036'), '顶层 "style" 已去掉')

    def test_pack(self):
        def pack(sb, sc):
            sb['unify'] = {'pack': 'news-brief'}
            sb['segments'][2]['uses'][1] = {'what': '章节卡', 'ref': 'pack:news-brief'}
        code, out = self.run_check(self.project(edit=pack))
        self.assertEqual(code, 0, out)
        self.assertFails(lambda sb, sc: sb['unify'].update(pack='no-such'), "unify.pack 'no-such' 不在 packs/ 里")

    def test_no_uses(self):
        self.assertFails(lambda sb, sc: sb['segments'][0].update(uses=[]), 'uses 至少一条')

    def test_ref_and_class(self):
        def both(sb, sc):
            sb['segments'][1]['uses'][0]['class'] = 'C'
        self.assertFails(both, 'ref、class 只写一个')

    def test_bad_material(self):
        def bad(sb, sc):
            sb['segments'][0]['uses'][0]['materials'] = ['胶片']
        self.assertFails(bad, '不是 tags.json 的素材类型')

    def test_too_many_typical(self):
        def many(sb, sc):
            for s in sb['segments']:
                s['typical'] = True
        self.assertFails(many, '只标 1–2 段')

    def test_sec_off(self):
        self.assertFails(lambda sb, sc: sb['brief'].update(sec=60), 'brief.sec 是 60 秒')

    def test_seg_order(self):
        def swap(sb, sc):
            sb['segments'][1]['seg'] = sc['segments'][1]['seg'] = 'P5'
        self.assertFails(swap, '按播放顺序编 P1、P2')

    def test_script_mismatch(self):
        self.assertFails(lambda sb, sc: sc['segments'].pop(), '逐字稿有 2 段，分镜有 3 段')

    def test_fact_without_source(self):
        def nosrc(sb, sc):
            sc['segments'][2]['facts'][0]['src'] = None
        self.assertFails(nosrc, '没有出处')

    def test_fact_ref_without_plan(self):
        def ref(sb, sc):
            sc['segments'][2]['facts'][0]['ref'] = 'P3-1'
        self.assertFails(ref, '无策划时 ref 写 null')

    def test_bad_confirm(self):
        def bad(sb, sc):
            sc['segments'][2]['facts'][0]['confirm'] = '已确认'
        self.assertFails(bad, 'confirm 写「待用户确认」或「用户确认」')


    # ---------- 配音工具读的字段 ----------
    def test_voice_old_string(self):
        def old(sb, sc):
            sb['unify']['voice'] = '语音合成的公开音色，男声'
        code, out = self.run_check(self.project(edit=old))
        self.assertEqual(code, 0, out)
        self.assertIn('unify.voice 还是一句话', out)

    def test_voice_object_bad(self):
        def bad(sb, sc):
            sb['unify']['voice'] = {'model': 'kokoro-v1.1-zh', 'speed': 3}
        out = self.assertFails(bad, 'unify.voice 缺 voice')
        self.assertIn('unify.voice.speed 写 0.5–2', out)

    def test_heard(self):
        def ok(sb, sc):
            sc['heard'] = {'氢键': ['清箭', '轻剑']}
        code, out = self.run_check(self.project(edit=ok))
        self.assertEqual(code, 0, out)
        self.assertFails(lambda sb, sc: sc.update(heard={'氢键': '清箭'}), '逐字稿的 heard 写')

    def test_table_voice(self):
        code, out = self.run_check(self.project(), '--table')
        self.assertIn('旁白音色：zm_010（kokoro-v1.1-zh，语速 0.95）', out)

class CheckPlanCallsCommon(unittest.TestCase):
    """接策划时 check_plan.py 调通用检查"""
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp)

    def run_plan(self, edit=None, *extra):
        d = self.tmp / 'ok'
        shutil.copytree(HERE / 'fixtures' / 'ok', d)
        if edit:
            sb = json.loads((d / SB).read_text(encoding='utf-8'))
            edit(sb)
            (d / SB).write_text(json.dumps(sb, ensure_ascii=False), encoding='utf-8')
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = check_plan.main([str(d / 'plans/demo/plan.md'), '--root', str(d), '--storyboard', str(d / SB),
                                    '--script', str(d / SC), *extra])
        return code, out.getvalue()

    def test_no_unify(self):
        code, out = self.run_plan(lambda sb: sb.pop('unify'))
        self.assertEqual(code, 1, out)
        self.assertIn('缺 "unify"', out)

    def test_brief_with_plan(self):
        code, out = self.run_plan(lambda sb: sb.update(brief={}))
        self.assertEqual(code, 1, out)
        self.assertIn('"plan" 和 "brief" 只写一个', out)

    def test_ready_and_table(self):
        code, out = self.run_plan(None, '--ready', '--table')
        self.assertEqual(code, 1, out)
        self.assertIn("status 是 '草稿'", out)
        self.assertIn('| 段 | 讲什么 |', out)


if __name__ == '__main__':
    unittest.main()
