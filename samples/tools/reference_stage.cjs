// Dark puppet stage. All motion, copy and cuts are addressed by the reference timeline.
const { once } = require('node:events');
const { spawn } = require('node:child_process');
const { readFileSync } = require('node:fs');

const TAU = Math.PI * 2;
const WHITE = '#fff0dc';
const RED = '#ed555b';
const clamp = (n) => Math.max(0, Math.min(1, n));
const mix = (a, b, n) => a + (b - a) * n;
const smooth = (n) => clamp(n) ** 2 * (3 - 2 * clamp(n));

function canvasModule() {
  const paths = [__dirname, process.cwd()];
  if (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) {
    paths.push(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES);
  }
  try {
    return require(require.resolve('@napi-rs/canvas', { paths }));
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
    throw new Error('暗红木偶舞台需要 @napi-rs/canvas。在项目目录运行 npm install @napi-rs/canvas。');
  }
}

function stage(createCanvas, plan) {
  const { width, height, duration_ms: duration } = plan.spec;
  const canvas = createCanvas(width, height);
  const c = canvas.getContext('2d');
  const H = 720;
  const W = H * width / height;
  const mid = W / 2;
  const portrait = width < height;
  const layout = plan.layout;
  const floor = H * (layout.floor ?? .79);
  const scale = (portrait ? .74 : 1) * (layout.character_scale ?? .91);
  c.scale(width / W, height / H);

  function line(points, color, w) {
    c.beginPath();
    points.forEach(([x, y], i) => i === 0 ? c.moveTo(x, y) : c.lineTo(x, y));
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.strokeStyle = color;
    c.lineWidth = w;
    c.stroke();
  }

  function dot(x, y, radius, color) {
    c.beginPath();
    c.arc(x, y, radius, 0, TAU);
    c.fillStyle = color;
    c.fill();
  }

  function glow(x, y, rx, ry, stops) {
    c.save();
    c.translate(x, y);
    c.scale(rx, ry);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
    for (const [stop, color] of stops) g.addColorStop(stop, color);
    c.fillStyle = g;
    c.fillRect(-1, -1, 2, 2);
    c.restore();
  }

  function plate(title) {
    c.fillStyle = title ? '#090203' : '#100706';
    c.fillRect(0, 0, W, H);
    glow(mid, H * .48, W * .58, H * .7,
      title ? [[0, '#921b22'], [.45, '#450b10'], [1, '#18060800']]
        : [[0, '#632421'], [.50, '#2d100f'], [1, '#220d1000']]);
    if (title) return;
    c.save();
    c.beginPath();
    c.moveTo(mid - W * .033, 0);
    c.lineTo(mid + W * .033, 0);
    c.lineTo(mid + W * .25, floor + 70);
    c.lineTo(mid - W * .25, floor + 70);
    c.closePath();
    const beam = c.createLinearGradient(0, 0, 0, floor + 70);
    beam.addColorStop(0, '#ffe0bb1e');
    beam.addColorStop(.5, '#ff907f4c');
    beam.addColorStop(1, '#ef765301');
    c.fillStyle = beam;
    c.fill();
    c.restore();
    glow(mid, floor + 6, W * .24, 43, [[0, '#f87f6a47'], [1, '#ce575600']]);
  }

  function air(t) {
    for (let i = 0; i < 64; i++) {
      const x = W * ((i * .618034) % 1) + 7 * Math.sin(t / 1500 + i);
      const y = (H * (1 + (i * .381966) % 1) - t * (.003 + .002 * (i % 3))) % H;
      const a = .025 + .095 * (Math.sin(t / 1050 + i) + 1) / 2;
      dot(x, y, .5 + i % 4 * .4, 'rgba(248, 163, 142, ' + a + ')');
    }
  }

  function pose(x, y, facing, motion) {
    const { lift, shift, bend, pull } = motion;
    const pt = (a, b) => [x + facing * a * scale, y + b * scale];
    const hip = pt(0, 0);
    const shoulder = pt(12 * bend, -81);
    return {
      head: pt(25 * bend, -130), hip, shoulder,
      elbow: pt(39, -55 - pull * 33),
      hand: pt(91, -31 - pull * 130 - lift * 37),
      farShoulder: pt(-20, -75), farElbow: pt(-26 - lift * 29, -44),
      farHand: pt(-31 - lift * 55, -11 - lift * 94),
      knees: [pt(-13 + shift * 7, 57), pt(13 - shift * 4, 56)],
      feet: [pt(-18 - shift * 20, 118 - lift * 11), pt(18 + shift * 24, 118 - lift * 16)],
    };
  }

  function puppet(p, red, alpha = 1) {
    const colors = red ? ['#e6686c', '#ff9a8c', '#8e393f'] : ['#efdbc1', '#fff7e5', '#a48c76'];
    const [body, rim, hinge] = colors;
    c.save();
    c.globalAlpha = alpha;
    function limb(a, b, w) {
      line([a, b], '#3d1619', scale * (w + 2));
      line([a, b], body, scale * w);
      line([[a[0] - scale, a[1]], [b[0] - scale, b[1]]], rim, scale * w * .19);
    }
    limb(p.farShoulder, p.farElbow, 13);
    limb(p.farElbow, p.farHand, 11);
    for (let k = 0; k < 2; k++) {
      limb([p.hip[0] + (k ? 10 : -10) * scale, p.hip[1]], p.knees[k], 17);
      limb(p.knees[k], p.feet[k], 14);
    }
    limb(p.hip, p.shoulder, 47);
    limb([p.head[0], p.head[1] + 22 * scale], p.shoulder, 12);
    glow(...p.head, 39 * scale, 43 * scale, [[0, rim + '66'], [1, rim + '00']]);
    dot(...p.head, 24 * scale, body);
    dot(p.head[0] - 4 * scale, p.head[1] - 5 * scale, 18 * scale, rim + '9c');
    limb(p.shoulder, p.elbow, 14);
    limb(p.elbow, p.hand, 12);
    for (const joint of [p.shoulder, p.farShoulder, p.hip, p.elbow, p.farElbow, ...p.knees]) {
      dot(...joint, 4 * scale, hinge);
    }
    c.restore();
  }

  function thread(a, b, slack, opacity = 1, progress = 1) {
    if (opacity <= 0 || progress <= 0) return;
    const pts = Array.from({ length: 17 }, (_, i) => {
      const p = i * progress / 16;
      return [mix(a[0], b[0], p), mix(a[1], b[1], p) + slack * 4 * p * (1 - p)];
    });
    c.save();
    c.globalAlpha = opacity;
    line(pts, '#e6293855', 9);
    line(pts, '#ed4141af', 4);
    line(pts, '#ff9b83', 1.45);
    c.restore();
  }

  function fence(x, y, level, gate, opacity) {
    const rx = Math.min(W * .22, 158) * mix(.70, 1, level);
    for (const height of [0, 22, 55, 88, 120, 151].slice(0, 2 + Math.floor(level * 4))) {
      const pts = Array.from({ length: 33 }, (_, i) => {
        const a = mix(gate, TAU - gate, i / 32) - Math.PI / 2;
        return [x + rx * Math.cos(a), y - height * scale + 26 * Math.sin(a)];
      });
      c.save();
      c.globalAlpha = opacity;
      line(pts, '#fe293b59', 8);
      line(pts, '#ff8577', 2.0);
      c.restore();
    }
  }

  function live(t) {
    const phases = plan.cues.action.map((cue) => ({
      type: cue.type, p: clamp((t - cue.at_ms) / (cue.end_ms - cue.at_ms)),
    }));
    const amount = (type) => phases.filter((a) => a.type === type).reduce((n, a) => n + smooth(a.p), 0);
    const pulse = Math.max(0, ...phases.filter((a) => a.type === 'tug').map((a) => Math.sin(Math.PI * a.p)));
    const release = clamp(amount('release'));
    const suspend = clamp(amount('suspend'));
    const split = clamp(amount('split'));
    const loops = clamp(amount('wrap') / 2);
    const step = clamp(amount('step'));
    const shut = clamp(amount('close'));
    const tugs = clamp(amount('tug') / 3);
    const x0 = W * (layout.left ?? .29), x1 = W * (layout.right ?? .71);
    const y = floor - 118 * scale + .9 * Math.sin(t / 370);
    const wx = mix(x0 + W * (.13 * tugs + .09 * step), mid, suspend);
    const l = pose(wx, y - suspend * 81, 1, { lift: suspend, shift: pulse + step, bend: pulse,
      pull: pulse * .29 + suspend * .27 });
    const r = pose(x1, y + 2 - suspend * 60, -1, { lift: 0, shift: 0, bend: 0,
      pull: split * .97 + pulse * .20 });
    const connect = clamp(amount('connect'));
    const slack = mix(24, 4, tugs) + 35 * release;
    const bar = [[mid - W * .17, 140], [mid + W * .17, 140]];
    thread(l.hand, r.hand, slack, (1 - suspend) * (1 - .72 * release), connect);
    if (split > 0) {
      for (const [i, target] of [l.head, l.hand, l.farHand, l.hip, l.feet[1]].entries()) {
        const anchor = [mix(r.hand[0], mix(bar[0][0], bar[1][0], i / 4), suspend),
          mix(r.hand[1], bar[0][1], suspend)];
        thread(anchor, target, 2, (1 - release) * .82, clamp(split * 1.8 - i * .16));
      }
    }
    if (suspend > 0) {
      c.save();
      c.globalAlpha = suspend;
      line(bar, '#d09a63', 11);
      line(bar, '#f0c190', 2);
      c.restore();
    }
    puppet(r, true, 1 - suspend);
    puppet(l, false);
    if (loops > 0 || shut > 0) {
      fence(wx + W * .028, floor, Math.max(loops, shut), .15 + .90 * (1 - shut) + release * .75,
        clamp(loops * 2 + shut) * (1 - release * .55));
    }
    if (connect > .2 && connect < 1 && release === 0) {
      const x = mix(l.hand[0], r.hand[0], connect);
      const y = mix(l.hand[1], r.hand[1], connect) + 4 * slack * connect * (1 - connect);
      glow(x, y, 20, 20, [[0, '#ffd1a0'], [1, '#fa423900']]);
    }
  }

  function copy(cue, t, x, y, size, limit, fadeMs = 230) {
    const alpha = clamp((t - cue.at_ms + 35) / fadeMs) * clamp((cue.end_ms - t) / 130);
    c.save();
    c.globalAlpha = alpha;
    c.font = '700 ' + size + 'px "Noto Serif CJK SC", "Songti SC", SimSun, serif';
    const length = c.measureText(cue.text).width;
    c.translate(x, y);
    c.scale(Math.min(1, limit / Math.max(length, 1)), 1);
    c.textBaseline = 'middle';
    c.shadowBlur = cue.role === 'title' ? 24 : 6;
    c.shadowColor = '#ff514cb0';
    const emphasis = cue.accent ? cue.text.indexOf(cue.accent) : -1;
    const parts = emphasis === -1 ? [cue.text] : [
      cue.text.slice(0, emphasis), cue.accent, cue.text.slice(emphasis + cue.accent.length),
    ];
    let at = -length / 2;
    for (let i = 0; i < parts.length; i++) {
      c.fillStyle = i === 1 ? RED : WHITE;
      c.fillText(parts[i], at, 0);
      at += c.measureText(parts[i]).width;
    }
    c.restore();
  }

  function titleBackdrop(t, flashAt) {
    const elapsed = t - flashAt;
    const span = W * (portrait ? .55 : .36);
    const barY = portrait ? 194 : 78;
    line([[mid - span / 2, barY], [mid + span / 2, barY]], '#d6935d', 12);
    line([[mid - span / 2, barY - 2], [mid + span / 2, barY - 2]], '#ffe5ac', 2);
    for (let i = 0; i < 18; i++) {
      const x = mid + span * (i / 17 - .5);
      thread([x, barY + 2], [x + (i % 3 - 1) * 42, H], 0, .18 + .06 * (i % 4));
    }
    const used = new Set(plan.cues.action.map((cue) => cue.type));
    if (used.has('wrap') || used.has('close') || used.has('release')) {
      fence(mid, H * .73, 1, used.has('release') ? 1.2 : .14, .34);
    } else {
      const lifted = pose(mid, H * .62, 1, { lift: .75, shift: 0, bend: 0, pull: 0 });
      puppet(lifted, false, .12 * smooth(elapsed / 650));
    }
  }

  function frame(t) {
    const flash = plan.cues.transition.find((cue) => cue.type === 'flash' && t >= cue.at_ms);
    const isTitle = Boolean(flash);
    plate(isTitle);
    if (flash) titleBackdrop(t, flash.at_ms);
    else live(t);
    air(t);
    const tags = plan.cues.screen.filter((cue) => cue.role === 'tag');
    for (const cue of plan.cues.screen) {
      if (t < cue.at_ms || t >= cue.end_ms) continue;
      switch (cue.role) {
        case 'headline': copy(cue, t, mid, H * .15, portrait ? 38 : 67, W * .88); break;
        case 'label': copy(cue, t, mid, H * .48, portrait ? 26 : 38, W * .57); break;
        case 'title': copy(cue, t, mid, H * .46, portrait ? 95 : 174, W * (portrait ? .88 : .62)); break;
        case 'translation': copy(cue, t, mid, H * .62, portrait ? 17 : 22, W * .58); break;
        case 'epilogue': copy(cue, t, mid, H * .78, portrait ? 31 : 49, W * (portrait ? .91 : .72)); break;
        case 'caption': copy(cue, t, mid, H * .885, portrait ? 34 : 56, W * .89); break;
        case 'tag': {
          const index = tags.indexOf(cue);
          const u = smooth((t - cue.at_ms) / 330);
          const x = W * (index % 2 === 0 ? .145 : .855);
          const y = H * (.28 + .15 * Math.floor(index / 2)) - 115 * (1 - u);
          const w = W * (portrait ? .24 : .13);
          line([[x, 0], [x, y]], '#e0675e90', 1);
          c.fillStyle = '#efd8be';
          c.fillRect(x - w / 2, y, w, 30);
          // Draw the lettering in dark ink on the light wooden plaque.
          c.fillStyle = '#692d32';
          c.font = '600 ' + (portrait ? 15 : 22) + 'px "Noto Serif CJK SC", serif';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText(cue.text, x, y + 15, w * .89);
          c.textAlign = 'start';
          break;
        }
      }
    }
    if (flash) {
      const level = Math.max(0, 1 - (t - flash.at_ms) / 190);
      c.fillStyle = 'rgba(255, 242, 222, ' + level * .94 + ')';
      c.fillRect(0, 0, W, H);
    }
    // Keep the final frame readable up to the audio tail.
    const tail = clamp((t - duration + 95) / 95);
    c.fillStyle = 'rgba(12, 2, 3, ' + tail * .20 + ')';
    c.fillRect(0, 0, W, H);
    return canvas;
  }
  return frame;
}

async function main() {
  const [file, dest] = process.argv.slice(2);
  const plan = JSON.parse(readFileSync(file, 'utf8')).reference;
  const { fps, duration_ms: duration } = plan.spec;
  const { createCanvas } = canvasModule();
  const frame = stage(createCanvas, plan);
  const processVideo = spawn('ffmpeg', [
    '-nostdin', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-vcodec', 'mjpeg',
    '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-preset', 'fast', '-threads', '2', '-crf', '20',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', dest,
  ], { stdio: ['pipe', 'ignore', 'inherit'] });
  const closed = once(processVideo, 'close');
  processVideo.stdin.on('error', (e) => {
    if (e.code !== 'EPIPE') processVideo.kill();
  });
  const frames = Math.round(fps * duration / 1000);
  try {
    for (let i = 0; i < frames; i++) {
      if (processVideo.stdin.destroyed) break;
      const jpg = await frame(i * 1000 / fps).encode('jpeg', 93);
      if (!processVideo.stdin.write(jpg)) {
        await Promise.race([once(processVideo.stdin, 'drain'), closed]);
      }
    }
    processVideo.stdin.end();
  } catch (error) {
    processVideo.kill();
    await closed;
    throw error;
  }
  const [code] = await closed;
  if (code !== 0) throw new Error('FFmpeg 编码失败');
}

main().catch((error) => {
  process.stderr.write(error.message + '\n');
  process.exitCode = 1;
});
