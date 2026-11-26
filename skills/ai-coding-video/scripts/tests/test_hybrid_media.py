"""C 类主风格混入 T / G 素材工作流的离线测试：media_fit 元数据、pack:* 类别判定、L1 媒体插槽护栏、格式 5 联检与外部素材汇总表"""
import contextlib
import io
import json
import os
import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

HERE = Path(__file__).resolve().parent
SKILL_ROOT = HERE.parent.parent
sys.path.insert(0, str(HERE.parent))

import check_plan  # noqa: E402
import check_storyboard  # noqa: E402
import plan5  # noqa: E402


class HybridMediaTests(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp)
        self.packs_dir = self.tmp / 'custom-packs'
        self.packs_dir.mkdir()

    def _make_hybrid_pack(self, name='hybrid-demo', enabled=True, slots=None):
        d = self.packs_dir / name
        d.mkdir(parents=True, exist_ok=True)
        meta = {'from': 'C-044', 'name': '混用测试包'}
        if enabled:
            meta['media'] = {
                'enabled': True,
                'family': '暗色科技',
                'slots': slots if slots is not None else ['mediaBg', 'mediaSplit', 'mediaFrame', 'mediaPip'],
            }
        (d / 'meta.json').write_text(json.dumps(meta, ensure_ascii=False), encoding='utf-8')
        lk = {
            'sizes': {
                'bigNumber': {'top': ['to', 'suffix'], 'mid': ['label'], 'small': []},
                'line': {'top': ['title'], 'mid': ['unit'], 'small': ['labels']},
                'mediaFrame': {'top': ['title'], 'mid': ['kicker'], 'small': ['credit']},
                'mediaSplit': {'top': ['title', 'to'], 'mid': ['body', 'label'], 'small': ['kicker', 'credit']},
                'mediaPip': {'top': [], 'mid': [], 'small': ['label']},
            },
            'lead': {
                '一个数': {'part': ['bigNumber']},
                '走势': {'part': ['line']},
                '场景': {'part': ['mediaFrame', 'mediaSplit']},
                '实物': {'part': ['mediaFrame', 'mediaSplit']},
            },
            'motion': {
                'tension': {'1': {'min': 2.0, 'max': 8.0}, '2': {'min': 1.5, 'max': 5.0}, '3': {'min': 1.0, 'max': 3.0}},
                'pace': {'快': 0.8, '中': 1.0, '慢': 1.3},
                'mood': {'紧': '快切', '松': '慢推', '稳': '平推', '扬': '上推'},
            },
        }
        (d / 'lookup.json').write_text(json.dumps(lk, ensure_ascii=False), encoding='utf-8')
        return d

    def test_styles_json_media_fit_and_family_coverage(self):
        """211 个 C 类都有合法 media_fit（原生/条件/闭环）及对应 media_family，T/G 类为 None"""
        tags = json.loads((SKILL_ROOT / 'data' / 'tags.json').read_text(encoding='utf-8'))
        styles = json.loads((SKILL_ROOT / 'data' / 'styles.json').read_text(encoding='utf-8'))['styles']
        c_styles = [s for s in styles if s['class'] == 'C']
        self.assertGreaterEqual(len(c_styles), 211)
        fits = set(tags['media_fit'])
        fams = set(tags['media_family'])
        for s in c_styles:
            self.assertIn(s['media_fit'], fits, s['id'])
            if s['media_fit'] == '闭环':
                self.assertIsNone(s['media_family'], s['id'])
            else:
                self.assertIn(s['media_family'], fams, s['id'])
        for s in styles:
            if s['class'] != 'C':
                self.assertIsNone(s['media_fit'], s['id'])
                self.assertIsNone(s['media_family'], s['id'])

    def test_pack_class_inference_for_tg_and_c_packs(self):
        """pack:news-brief / pack:style-swap / pack:dark-keynote 按 meta.json.from 正确识别 T / G / C"""
        lib = check_storyboard.library([str(self.packs_dir)])
        styles, _, _, pack_meta = lib
        self._make_hybrid_pack('no-from-pack', enabled=False)
        (self.packs_dir / 'no-from-pack' / 'meta.json').write_text('{}', encoding='utf-8')
        lib = check_storyboard.library([str(self.packs_dir)])
        styles, _, _, pack_meta = lib

        errs, unv = [], set()
        self.assertEqual(check_storyboard.style_class({'ref': 'pack:dark-keynote'}, 's1', lib, errs, unv), 'C')
        self.assertEqual(check_storyboard.style_class({'ref': 'pack:news-brief'}, 's2', lib, errs, unv), 'T')
        self.assertEqual(check_storyboard.style_class({'ref': 'pack:style-swap'}, 's3', lib, errs, unv), 'G')
        self.assertEqual(check_storyboard.style_class({'ref': 'pack:no-from-pack'}, 's4', lib, errs, unv), 'C')
        self.assertEqual(errs, [])

        self.assertEqual(check_plan.item_class({'ref': 'pack:news-brief'}, styles, pack_meta), 'T')
        self.assertEqual(check_plan.item_class({'ref': 'pack:style-swap'}, styles, pack_meta), 'G')
        self.assertEqual(check_plan.item_class({'ref': 'pack:dark-keynote'}, styles, pack_meta), 'C')
        self.assertEqual(check_plan.item_class({'ref': 'pack:news-brief'}, styles), 'C')  # 未传 pack_meta 时回退 C

    def test_free_mode_hybrid_media_and_external_summary_table(self):
        """无策划模式下 C 主包 + L1 内嵌（T/G mediaSplit/mediaFrame/mediaBg）+ L2 客串通过并打印外部素材汇总表"""
        self._make_hybrid_pack('hybrid-demo', enabled=True)
        proj = self.tmp / 'free-hybrid'
        shutil.copytree(HERE / 'fixtures' / 'free', proj)
        sb_path = proj / 'videos/demo/storyboard.json'
        sb = json.loads(sb_path.read_text(encoding='utf-8'))
        sb['unify']['pack'] = 'pack:hybrid-demo'
        sb['segments'][0]['shots'] = [
            {'what': '开场纯 C 主标题', 'ref': 'pack:hybrid-demo', 'part': 'bigNumber', 'sec': 1.6, 'vo': 1},
            {'what': '左侧产品实拍，右侧核心卖点', 'class': 'T', 'part': 'mediaSplit',
             'src': 'assets/product.jpg', 'o': {'title': '实机外观', 'body': '铝合金机身'}, 'sec': 1.6, 'vo': 1},
            {'what': 'AI 生成情绪空镜压底', 'class': 'G', 'part': 'bigNumber',
             'src': 'assets/mood.mp4', 'o': {'bg': {'kind': 'G', 'dim': 0.6}, 'to': 99, 'suffix': '%'}, 'sec': 1.6, 'vo': 1},
            {'what': '前景抠像穿字技法客串', 'ref': 'T-022', 'src': 'assets/run.mp4', 'sec': 1.6, 'vo': 1},
            {'what': 'AI 概念插画画框展示', 'class': 'G', 'part': 'mediaFrame',
             'src': 'assets/concept.png', 'o': {'title': '概念示意'}, 'sec': 1.6, 'vo': 1},
        ]
        sb['segments'][0]['sec'] = 8
        sb_path.write_text(json.dumps(sb, ensure_ascii=False), encoding='utf-8')

        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = check_storyboard.main([str(sb_path), '--table', '--pack-root', str(self.packs_dir)])
        text = out.getvalue()
        self.assertEqual(code, 0, text)
        self.assertNotIn('未启用媒体插槽', text)
        self.assertIn('外部素材汇总', text)
        self.assertIn('T 真实素材', text)
        self.assertIn('G 生图', text)
        self.assertIn('G 生视频', text)
        self.assertIn('L1 内嵌（mediaSplit）', text)
        self.assertIn('L1 内嵌（mediaBg）', text)
        self.assertIn('L1 内嵌（mediaFrame）', text)
        self.assertIn('L2 客串（T-022）', text)
        self.assertIn('可降级', text)

    def test_media_slot_guardrail_notes_when_pack_disabled(self):
        """主包未启用 media.enabled 或缺少对应槽位时，check_shots 输出清晰提醒"""
        self._make_hybrid_pack('pure-c-only', enabled=False)
        self._make_hybrid_pack('partial-media', enabled=True, slots=['mediaFrame'])
        proj = self.tmp / 'guardrail'
        shutil.copytree(HERE / 'fixtures' / 'free', proj)
        sb_path = proj / 'videos/demo/storyboard.json'
        sb = json.loads(sb_path.read_text(encoding='utf-8'))
        sb['unify']['pack'] = 'pack:pure-c-only'
        sb['segments'][0]['sec'] = 8
        sb['segments'][0]['shots'] = [
            {'what': '实拍分屏', 'class': 'T', 'part': 'mediaSplit', 'src': 'assets/a.jpg', 'sec': 8, 'vo': 1},
        ]
        sb_path.write_text(json.dumps(sb, ensure_ascii=False), encoding='utf-8')

        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = check_storyboard.main([str(sb_path), '--pack-root', str(self.packs_dir)])
        self.assertEqual(code, 0, out.getvalue())
        self.assertIn('未启用媒体插槽', out.getvalue())
        self.assertIn('--add-media', out.getvalue())

        sb['unify']['pack'] = 'pack:partial-media'
        sb_path.write_text(json.dumps(sb, ensure_ascii=False), encoding='utf-8')
        out2 = io.StringIO()
        with contextlib.redirect_stdout(out2):
            code2 = check_storyboard.main([str(sb_path), '--pack-root', str(self.packs_dir)])
        self.assertEqual(code2, 0, out2.getvalue())
        self.assertIn('media.slots 未声明 mediaSplit', out2.getvalue())

    def test_v5_plan_hybrid_view_claim_and_lookup_top_size_check(self):
        """格式 5：C 主包 + class: G + part: mediaFrame 认领 H3，同时打通 view 来源核对与 lookup.json 顶档字号核对"""
        self._make_hybrid_pack('hybrid-demo', enabled=True)
        d = self.tmp / 'ok5-hybrid'
        shutil.copytree(HERE / 'fixtures' / 'ok5', d)
        c_path = d / 'plans/demo/content.md'
        c_text = c_path.read_text(encoding='utf-8').replace(
            '| H3 | 高原湖边一锅水冒泡，温度计停在 87 | 生图 | 场景 | 无 | 无 | S5 | P2-1、K1 |',
            '| H3 | 高原湖边一锅水冒泡，温度计停在 87 | 生图 | 场景 | 约 87 °C 沸腾 | 无 | S5 | P2-1、K1 |',
        )
        c_path.write_text(c_text, encoding='utf-8')

        sb_path = d / 'videos/demo/storyboard.json'
        sb = json.loads(sb_path.read_text(encoding='utf-8'))
        sb['unify']['pack'] = 'pack:hybrid-demo'
        for x in sb['segments'][0]['uses']:
            x['ref'] = 'pack:hybrid-demo'
        for x in sb['segments'][0]['shots']:
            x['ref'] = 'pack:hybrid-demo'
        sb['segments'][1]['shots'][0].update({
            'part': 'mediaFrame',
            'src': 'assets/plateau.png',
            'o': {'title': '约 87 °C 沸腾', 'kicker': '海拔 4000 米'},
        })
        sb_path.write_text(json.dumps(sb, ensure_ascii=False), encoding='utf-8')

        self.assertEqual(plan5.pack_of(sb['segments'][1]['shots'][0], sb), 'hybrid-demo')

        old_cwd = os.getcwd()
        os.chdir(d)
        try:
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                code = check_plan.main(['plans/demo', '--storyboard', 'videos/demo/storyboard.json',
                                        '--script', 'videos/demo/script.json', '--table',
                                        '--pack-root', str(self.packs_dir)])
            self.assertEqual(code, 0, out.getvalue())
            self.assertIn('外部素材汇总', out.getvalue())
            self.assertIn('L1 内嵌（mediaFrame）', out.getvalue())

            # 若最大的字没放进 mediaFrame 的顶档 title，check_layout 应拦截报错
            sb['segments'][1]['shots'][0]['o'] = {'title': '高原煮水', 'kicker': '约 87 °C 沸腾'}
            sb_path.write_text(json.dumps(sb, ensure_ascii=False), encoding='utf-8')
            out_bad = io.StringIO()
            with contextlib.redirect_stdout(out_bad):
                code_bad = check_plan.main(['plans/demo', '--storyboard', 'videos/demo/storyboard.json',
                                            '--script', 'videos/demo/script.json',
                                            '--pack-root', str(self.packs_dir)])
            self.assertEqual(code_bad, 1, out_bad.getvalue())
            self.assertIn('最大的字「约 87 °C 沸腾」要放在 mediaFrame 的顶档', out_bad.getvalue())
        finally:
            os.chdir(old_cwd)

    def test_new_pack_media_flags_and_three_tier_guardrails(self):
        """new_pack.py --media / --add-media / --force-media 三档护栏与 --add-media 字节级保护"""
        samples_dir = next(p for p in (HERE.parents[3] / 'samples', SKILL_ROOT / 'samples') if (p / 'new_pack.py').exists())
        sys.path.insert(0, str(samples_dir))
        import new_pack  # noqa: E402

        my_styles = self.tmp / 'ms'

        def run_np(*argv):
            buf = io.StringIO()
            with mock.patch.dict(os.environ, {'AICV_MY_STYLES': str(my_styles), 'AICV_SKILL': str(SKILL_ROOT)}):
                with mock.patch.object(sys, 'argv', ['new_pack.py', *argv]):
                    with contextlib.redirect_stdout(buf):
                        new_pack.main()
            return buf.getvalue()

        # 1. 闭环（C-013）默认拦截报错
        with self.assertRaises(SystemExit) as cm:
            run_np('shadow-bad', '--from', 'C-013', '--media', '--my-styles')
        self.assertIn('闭环', str(cm.exception))
        self.assertIn('L2', str(cm.exception))

        # 2. 闭环 + --force-media 放行并打印警告
        out_force = run_np('shadow-force', '--from', 'C-013', '--media', '--force-media', '--my-styles')
        self.assertIn('警告', out_force)
        self.assertTrue((my_styles / 'shadow-force' / 'media_slots.js').is_file())

        # 3. 原生（C-044）--media 直接生成 media_slots.js + 18 秒 6 镜演示片
        out_nat = run_np('native-media', '--from', 'C-044', '--accent', '#2BD99F', '--media', '--my-styles')
        self.assertIn('media_slots.js', out_nat)
        nd = my_styles / 'native-media'
        nmeta = json.loads((nd / 'meta.json').read_text(encoding='utf-8'))
        self.assertTrue(nmeta['media']['enabled'])
        self.assertEqual(nmeta['media']['family'], '暗色科技')
        self.assertEqual(nmeta['media']['slots'], ['mediaBg', 'mediaSplit', 'mediaFrame', 'mediaPip'])
        nsegs = json.loads((nd / 'demo/segments.json').read_text(encoding='utf-8'))['segs']
        self.assertEqual([s['part'] for s in nsegs], ['opener', 'headline', 'metric', 'mediaSplit', 'mediaFrame', 'outro'])
        self.assertEqual(sum(s['d'] for s in nsegs), 18.0)
        self.assertIn('../media_slots.js', (nd / 'demo/scene.js').read_text(encoding='utf-8'))
        self.assertIn('外部素材融入规范', (nd / 'STYLE.md').read_text(encoding='utf-8'))

        # 4. 条件（C-002）纯 C 包 → --add-media 无损挂载：pack.js 与 demo/segments.json 字节级零改动
        run_np('pure-wc', '--from', 'C-002', '--accent', '#E07A5F', '--my-styles')
        pd = my_styles / 'pure-wc'
        pack_before = (pd / 'pack.js').read_bytes()
        segs_before = (pd / 'demo/segments.json').read_bytes()
        out_add = run_np('--add-media', str(pd))
        self.assertIn('条件（纸面档案）', out_add)
        self.assertEqual((pd / 'pack.js').read_bytes(), pack_before)
        self.assertEqual((pd / 'demo/segments.json').read_bytes(), segs_before)
        self.assertTrue((pd / 'media_slots.js').is_file())
        pmeta = json.loads((pd / 'meta.json').read_text(encoding='utf-8'))
        self.assertEqual(pmeta['media']['family'], '纸面档案')
        self.assertIn('外部素材融入规范', (pd / 'STYLE.md').read_text(encoding='utf-8'))
        self.assertIn('PACK.mediaFrame', (pd / 'README.md').read_text(encoding='utf-8'))

    def test_dark_keynote_official_media_slots_integration(self):
        """官方标杆 packs/dark-keynote 启用 media_slots.js 后，格式 5 场景主角用 mediaFrame 直接过检且无未启用提醒"""
        d = self.tmp / 'ok5-dk'
        shutil.copytree(HERE / 'fixtures' / 'ok5', d)
        c_path = d / 'plans/demo/content.md'
        c_text = c_path.read_text(encoding='utf-8').replace(
            '| H3 | 高原湖边一锅水冒泡，温度计停在 87 | 生图 | 场景 | 无 | 无 | S5 | P2-1、K1 |',
            '| H3 | 高原湖边一锅水冒泡，温度计停在 87 | 生图 | 场景 | 约 87 °C 沸腾 | 无 | S5 | P2-1、K1 |',
        )
        c_path.write_text(c_text, encoding='utf-8')

        sb_path = d / 'videos/demo/storyboard.json'
        sb = json.loads(sb_path.read_text(encoding='utf-8'))
        sb['segments'][1]['shots'][0].update({
            'part': 'mediaFrame',
            'src': 'assets/plateau.png',
            'o': {'title': '约 87 °C 沸腾', 'kicker': 'ALTITUDE 4000M'},
        })
        sb_path.write_text(json.dumps(sb, ensure_ascii=False), encoding='utf-8')

        old_cwd = os.getcwd()
        os.chdir(d)
        try:
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                code = check_plan.main(['plans/demo', '--storyboard', 'videos/demo/storyboard.json',
                                        '--script', 'videos/demo/script.json', '--table'])
            text = out.getvalue()
            self.assertEqual(code, 0, text)
            self.assertNotIn('未启用媒体插槽', text)
            self.assertIn('外部素材汇总', text)
            self.assertIn('L1 内嵌（mediaFrame）', text)
        finally:
            os.chdir(old_cwd)


if __name__ == '__main__':
    unittest.main()
