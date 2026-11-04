// Remotion 样片的出片桥：由 render.py 启动，先打包一次，然后按 stdin 的命令逐帧截图。
//   node remotion/serve.mjs <样片编号> <画幅 16x9|9x16> [缩放]
// 打包好后打印一行 JSON（{dur, fps, still, w, h}），之后每读到一行命令做一件事：
//   still<TAB><秒><TAB><输出 jpg 路径>   截那一帧，做完打印 ok
//   all<TAB><输出目录>                   按帧率截完整段，做完打印 ok<TAB><帧数>
//   quit                                 退出
// 浏览器用容器里已有的 Chromium（CHROME 环境变量，默认 /opt/pw-browsers/chromium），不额外下载。
import { bundle } from '@remotion/bundler';
import { renderStill, renderFrames, selectComposition, openBrowser } from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SAMPLES = path.resolve(HERE, '..');
const [sid, ar, scaleArg] = process.argv.slice(2);
const scale = Number(scaleArg || 1);
const SIZE = { '16x9': [1920, 1080], '9x16': [1080, 1920] }[ar];
const CHROME0 = process.env.CHROME || '/opt/pw-browsers/chromium';
const CHROME = fs.existsSync(CHROME0) ? CHROME0 : null;   // 本机没有这个 Chromium 就交给 Remotion 自己找

const scenePath = path.join(SAMPLES, sid, 'scene.jsx');
const src = fs.readFileSync(scenePath, 'utf8');
const num = (k, d) => { const m = src.match(new RegExp(`export const ${k}\\\\s*=\\\\s*([\\\\d.]+)`)); return m ? Number(m[1]) : d; };
const dur = num('dur', 5), fps = num('fps', 30), still = num('still', dur * 0.7);

// 打包用的入口：注册一个 Composition，画幅和时长从样片里取
const entry = path.join(HERE, `.entry-${sid}-${ar}.jsx`);
fs.writeFileSync(entry, `import React from 'react';
import { registerRoot, Composition } from 'remotion';
import { Scene } from ${JSON.stringify(pathToFileURL(scenePath).href.replace('file://', ''))};
registerRoot(() => (
  <Composition id="main" component={Scene} durationInFrames={${Math.round(dur * fps)}} fps={${fps}}
    width={${SIZE[0]}} height={${SIZE[1]}} defaultProps={{ ar: ${JSON.stringify(ar)} }} />
));
`);

const serveUrl = await bundle({ entryPoint: entry, onProgress: () => {} });
const browser = await openBrowser('chrome', CHROME ? { browserExecutable: CHROME } : {});
const composition = await selectComposition({ serveUrl, id: 'main', inputProps: { ar }, puppeteerInstance: browser });
process.stdout.write(JSON.stringify({ dur, fps, still, w: SIZE[0], h: SIZE[1] }) + '\n');

const rl = readline.createInterface({ input: process.stdin });
for await (const line of rl) {
  const [cmd, a, b] = line.split('\t');
  if (cmd === 'quit') break;
  if (cmd === 'still') {
    await renderStill({ composition, serveUrl, output: b, frame: Math.round(Number(a) * fps), imageFormat: 'jpeg',
      jpegQuality: 92, scale, puppeteerInstance: browser, inputProps: { ar }, overwrite: true });
    process.stdout.write('ok\n');
  } else if (cmd === 'all') {
    fs.mkdirSync(a, { recursive: true });
    const { frameCount } = await renderFrames({ composition, serveUrl, outputDir: a, imageFormat: 'jpeg', jpegQuality: 92,
      scale, puppeteerInstance: browser, inputProps: { ar }, onFrameUpdate: () => {}, onStart: () => {},
      concurrency: 2, frameRange: [0, Math.round(dur * fps) - 1] });
    process.stdout.write(`ok\t${frameCount ?? Math.round(dur * fps)}\n`);
  }
}
await browser.close();
fs.rmSync(entry, { force: true });
