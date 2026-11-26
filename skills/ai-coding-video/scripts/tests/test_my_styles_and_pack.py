"""个人风格库自动发现（~/aicv-my-styles/）、轻量风格包脚手架 new_pack.py 与 --vs 对比图测试"""
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
SAMPLES_DIR = next(
    p for p in (HERE.parents[3] / 'samples', SKILL_ROOT / 'samples') if (p / 'render.py').exists()
)

sys.path.insert(0, str(HERE.parent))
sys.path.insert(0, str(SAMPLES_DIR))

import check_storyboard  # noqa: E402
import new_pack  # noqa: E402
import plan5  # noqa: E402

try:
    import batch  # noqa: E402
    import render  # noqa: E402
    from PIL import Image  # noqa: E402
except ImportError:
    batch = render = Image = None


class MyStylesAndPackTests(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp)
        self.my_styles = self.tmp / 'my-styles'

    def _run_new_pack(self, *argv):
        buf = io.StringIO()
        with mock.patch.dict(os.environ, {'AICV_MY_STYLES': str(self.my_styles), 'AICV_SKILL': str(SKILL_ROOT)}):
            with mock.patch.object(sys, 'argv', ['new_pack.py', *argv]):
                with contextlib.redirect_stdout(buf):
                    new_pack.main()
        return buf.getvalue()

    def test_check_storyboard_and_plan5_autodiscover_my_styles(self):
        """AICV_MY_STYLES 下的包无需传 --pack-root 即可被 check_storyboard 和 plan5 识别"""
        proj = self.tmp / 'proj'
        shutil.copytree(HERE / 'fixtures' / 'free', proj)
        pack_dir = self.my_styles / 'auto-pack'
        pack_dir.mkdir(parents=True)
        (pack_dir / 'meta.json').write_text('{"name": "自动包"}', encoding='utf-8')
        (pack_dir / 'lookup.json').write_text('{"lead": {}}', encoding='utf-8')

        sb_path = proj / 'videos/demo/storyboard.json'
        sb = json.loads(sb_path.read_text(encoding='utf-8'))
        s = next(x for x in sb['segments'] if x.get('shots'))
        s['shots'][0].pop('class', None)
        s['shots'][0]['ref'] = 'pack:auto-pack'
        sb_path.write_text(json.dumps(sb, ensure_ascii=False), encoding='utf-8')

        with mock.patch.dict(os.environ, {'AICV_MY_STYLES': str(self.my_styles)}):
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                code = check_storyboard.main([str(sb_path)])
            self.assertEqual(code, 0, out.getvalue())
            looks = plan5.lookups()
            self.assertIn('auto-pack', looks)
            self.assertEqual(looks['auto-pack'], {'lead': {}})

    def test_new_pack_create_c_and_tg_and_no_overwrite(self):
        """new_pack.py 创建 C/T 类轻量包：仅 1 套配置、不写 full、已存在文件不覆盖"""
        out_c = self._run_new_pack('green-demo', '--from', 'C-044', '--accent', '#2bd99f', '--name', '绿科技', '--my-styles')
        self.assertIn('新建：', out_c)
        c_dir = self.my_styles / 'green-demo'
        meta = json.loads((c_dir / 'meta.json').read_text(encoding='utf-8'))
        self.assertEqual(meta['from'], 'C-044')
        self.assertNotIn('full', meta)
        self.assertEqual(meta['accents'], [['primary', '主色', 'Primary', '#2BD99F']])
        for f in ('pack.js', 'sound_kit.py', 'STYLE.md', 'CHANGES.md', 'README.md',
                  'demo/segments.json', 'demo/scene.js', 'demo/sound.py'):
            self.assertTrue((c_dir / f).is_file(), f'缺文件 {f}')
        idx = (self.my_styles / 'README.md').read_text(encoding='utf-8')
        self.assertIn('`green-demo`', idx)

        # 不覆盖已有文件
        (c_dir / 'STYLE.md').write_text('# custom', encoding='utf-8')
        out_again = self._run_new_pack('green-demo', '--from', 'C-044', '--my-styles')
        self.assertIn('全部文件已存在，未覆盖', out_again)
        self.assertEqual((c_dir / 'STYLE.md').read_text(encoding='utf-8'), '# custom')

        # T 类默认生成 switch + 1 项 variants
        t_dir = self.tmp / 'local-t'
        self._run_new_pack('news-lite', '--from', 'T-007', '--out', str(t_dir))
        t_meta = json.loads((t_dir / 'meta.json').read_text(encoding='utf-8'))
        self.assertEqual(t_meta['switch'], ['画面组织', '画面组织'])
        self.assertEqual(len(t_meta['variants']), 1)

    def test_new_pack_save_and_list(self):
        """--save 跳过缓存目录并更新 README.md；--list 列出已保存个人包"""
        src = self.tmp / 'src-pack'
        self._run_new_pack('local-lite', '--from', 'C-044', '--out', str(src))
        (src / 'out').mkdir()
        (src / 'out' / 'junk.tmp').write_text('x', encoding='utf-8')

        self._run_new_pack('--save', str(src), '--as', 'saved-lite')
        dst = self.my_styles / 'saved-lite'
        self.assertTrue((dst / 'meta.json').is_file())
        self.assertFalse((dst / 'out').exists())

        listed = self._run_new_pack('--list')
        self.assertIn('saved-lite', listed)

    @unittest.skipIf(render is None or batch is None, '需要 Pillow')
    def test_render_and_batch_vs_helpers(self):
        """render.pack_dir 解析 AICV_MY_STYLES；batch.make_vs_image 生成左右对比 JPEG"""
        self._run_new_pack('render-lite', '--from', 'C-044', '--accent', '#FF7A45', '--my-styles')
        with mock.patch.dict(os.environ, {'AICV_MY_STYLES': str(self.my_styles)}):
            self.assertEqual(render.pack_dir('render-lite'), self.my_styles / 'render-lite')
            self.assertEqual(render.where('pack:render-lite'), self.my_styles / 'render-lite' / 'demo')
            self.assertEqual(render.expand('pack:render-lite'), ['pack:render-lite@primary'])

        left_buf, right_buf = io.BytesIO(), io.BytesIO()
        Image.new('RGB', (320, 180), (20, 30, 50)).save(left_buf, 'JPEG')
        Image.new('RGB', (320, 180), (30, 80, 60)).save(right_buf, 'JPEG')
        vs_bytes = batch.make_vs_image(left_buf.getvalue(), right_buf.getvalue(), 'C-044 (2.1s)', 'pack:render-lite (7.5s)')
        im = Image.open(io.BytesIO(vs_bytes))
        self.assertEqual(im.format, 'JPEG')
        self.assertEqual(im.width, 960 * 2 + 12)
        self.assertGreater(im.height, 540)


if __name__ == '__main__':
    unittest.main()
