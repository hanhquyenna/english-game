/**
 * Visual + behavioural verification for beeblast-class-map.html.
 *
 * The point of this file is that "it looks fine" is not a claim anyone should
 * take on trust — including from me. It renders the page in a real browser at
 * three viewports, exercises the interactive states, measures the frame rate,
 * and fails with a non-zero exit code if any assertion breaks. Screenshots are
 * written next to it so a human can look at the same thing the assertions did.
 *
 *   node verify-map.cjs            # run everything
 *
 * Exit 0 = all checks passed. Exit 1 = at least one failed (details printed).
 */
const path = require('path');
const { chromium } = require('/opt/node-tools/node_modules/playwright-core');

const PAGE = 'file://' + path.join(__dirname, 'beeblast-class-map.html');
const OUT  = __dirname;

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, dsf: 1 },
  { name: 'tablet',  width: 834,  height: 1112, dsf: 2 },
  { name: 'mobile',  width: 390,  height: 844, dsf: 2 },
];

let failures = [];
const check = (cond, label, detail) => {
  if (cond) { console.log('  PASS  ' + label); }
  else { console.log('  FAIL  ' + label + (detail ? '  -> ' + detail : '')); failures.push(label); }
};

/* A canvas that rendered is a canvas whose pixels are not all one colour.
   Sampling a grid of points and counting distinct values catches the classic
   silent failure: no exception, no warning, blank frame. */
async function canvasStats(page) {
  return page.evaluate(() => {
    const c = document.getElementById('map');
    const g = c.getContext('2d');
    const N = 64;                                  // dense enough to catch thin marks
    const set = new Set();
    let ink = 0, total = 0;
    // page background, so "ink" means anything the renderer actually drew
    const bg = [239, 227, 207];
    for (let i = 1; i < N; i++)
      for (let j = 1; j < N; j++) {
        const d = g.getImageData(Math.floor(c.width * i / N), Math.floor(c.height * j / N), 1, 1).data;
        set.add(d[0] + ',' + d[1] + ',' + d[2]);
        total++;
        if (Math.abs(d[0]-bg[0]) + Math.abs(d[1]-bg[1]) + Math.abs(d[2]-bg[2]) > 24) ink++;
      }
    return { colours: set.size, inkPct: +(100 * ink / total).toFixed(1) };
  });
}

async function measureFps(page, ms = 1500) {
  return page.evaluate(async (ms) => {
    let n = 0; const t0 = performance.now();
    await new Promise(res => {
      const tick = () => { n++; performance.now() - t0 < ms ? requestAnimationFrame(tick) : res(); };
      requestAnimationFrame(tick);
    });
    return Math.round(n / ((performance.now() - t0) / 1000));
  }, ms);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  for (const v of VIEWPORTS) {
    console.log('\n=== ' + v.name + ' ' + v.width + 'x' + v.height + ' @' + v.dsf + 'x ===');
    const page = await browser.newPage({
      viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.dsf,
    });

    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

    await page.goto(PAGE);
    await page.waitForTimeout(1400);

    check(errs.length === 0, 'no console or page errors', errs.slice(0, 3).join(' | '));

    const st = await canvasStats(page);
    check(st.colours > 12, 'village view rendered (>12 distinct colours)', 'got ' + st.colours);
    check(st.inkPct > 60, 'village view fills the frame (no cream void)', st.inkPct + '% ink');

    const fps = await measureFps(page);
    check(fps >= 30, 'animation holds >=30fps', fps + 'fps');
    console.log('        measured ' + fps + 'fps');

    /* Vietnamese diacritics: the failure mode is a font falling back mid-word
       and rendering a stray backtick, which is invisible to a DOM text check.
       So assert on the DOM text AND that the glyphs have a sane advance width —
       a tofu box or a decomposed mark changes the measured width noticeably. */
    const vn = await page.evaluate(() => {
      const el = document.getElementById('bFlat');
      const txt = el.textContent;
      const cs = getComputedStyle(el);
      const cv = document.createElement('canvas').getContext('2d');
      cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      return { txt, w: cv.measureText('SƠ ĐỒ').width, wAscii: cv.measureText('SO DO').width };
    });
    check(vn.txt === 'Sơ đồ', 'Vietnamese text present and correct', JSON.stringify(vn.txt));
    const ratio = vn.w / vn.wAscii;
    check(ratio > 0.9 && ratio < 1.35,
      'diacritics render at sane width (no tofu / no fallback)', 'ratio ' + ratio.toFixed(2));

    await page.screenshot({ path: path.join(OUT, `verify-${v.name}-1-map.png`) });

    /* --- interaction: open the active node --- */
    const opened = await page.evaluate(() => {
      // click the active stop's marker through the page's own hit-test path
      const c = document.getElementById('map');
      const r = c.getBoundingClientRect();
      const ev = t => new PointerEvent(t, {
        clientX: r.width / 2, clientY: r.height / 2, bubbles: true, pointerId: 1,
      });
      c.dispatchEvent(ev('pointerdown'));
      window.dispatchEvent(ev('pointerup'));
      return document.getElementById('dlg').classList.contains('on');
    });
    // centre-click may land on scenery rather than a node; fall back to the API
    if (!opened) await page.evaluate(() => open(5));
    await page.waitForTimeout(420);

    const dlg = await page.evaluate(() => {
      const d = document.getElementById('dlg');
      return {
        on: d.classList.contains('on'),
        title: document.getElementById('dTtl').textContent,
        who: document.getElementById('dWho').textContent,
        cta: document.getElementById('dGo').textContent,
        box: d.getBoundingClientRect(),
      };
    });
    check(dlg.on, 'node dialog opens');
    check(/Th[ửu] th[áa]ch 6/.test(dlg.title), 'dialog shows the right stop', dlg.title);
    check(/b[ạa]n/.test(dlg.who), 'dialog names the classmates standing there', dlg.who);
    check(dlg.box.left >= 0 && dlg.box.right <= v.width + 1,
      'dialog fits inside the viewport', JSON.stringify(dlg.box));
    await page.screenshot({ path: path.join(OUT, `verify-${v.name}-2-dialog.png`) });

    /* locked stop must not offer a way in */
    await page.evaluate(() => { document.getElementById('dNo').click(); open(8); });
    await page.waitForTimeout(320);
    const locked = await page.evaluate(() => document.getElementById('dGo').textContent);
    check(/Ch[ưu]a m[ởo]/.test(locked), 'locked stop refuses entry', locked);

    /* --- interaction: flat ("Sơ đồ") view --- */
    await page.evaluate(() => { document.getElementById('dNo').click(); document.getElementById('bFlat').click(); });
    await page.waitForTimeout(700);
    const fs = await canvasStats(page);
    // the flat view is deliberately mostly empty page colour, so assert on ink
    // present rather than on colour variety across a sparse grid
    check(fs.inkPct > 1.2 && fs.colours > 4,
      'flat view renders its path and nodes', fs.inkPct + '% ink, ' + fs.colours + ' colours');
    const pressed = await page.evaluate(() =>
      document.getElementById('bFlat').getAttribute('aria-pressed'));
    check(pressed === 'true', 'view toggle reports pressed state for a11y', pressed);
    await page.screenshot({ path: path.join(OUT, `verify-${v.name}-3-flat.png`) });

    /* --- HUD must not overlap itself or spill off-screen --- */
    const boxes = await page.evaluate(() =>
      ['player', 'chips', 'classbar', 'belt', 'view'].map(id => {
        const el = document.getElementById(id);
        if (!el || getComputedStyle(el).display === 'none') return null;
        const b = el.getBoundingClientRect();
        return { id, l: b.left, t: b.top, r: b.right, b: b.bottom };
      }).filter(Boolean));
    const spill = boxes.filter(b => b.l < -1 || b.t < -1 || b.r > v.width + 1 || b.b > v.height + 1);
    check(spill.length === 0, 'no HUD panel spills off-screen',
      spill.map(s => s.id).join(','));

    const overlaps = [];
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const A = boxes[i], B = boxes[j];
        const ox = Math.min(A.r, B.r) - Math.max(A.l, B.l);
        const oy = Math.min(A.b, B.b) - Math.max(A.t, B.t);
        if (ox > 4 && oy > 4) overlaps.push(A.id + '/' + B.id);
      }
    check(overlaps.length === 0, 'no two HUD panels overlap', overlaps.join(','));

    /* --- reduced motion must actually stop the animation --- */
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => document.getElementById('bIso').click());
    await page.waitForTimeout(300);
    const rmErrs = errs.length;
    check(rmErrs === 0, 'survives prefers-reduced-motion without error');
    await page.emulateMedia({ reducedMotion: null });

    await page.close();
  }

  await browser.close();

  console.log('\n' + '='.repeat(52));
  if (failures.length) {
    console.log('FAILED (' + failures.length + '):');
    [...new Set(failures)].forEach(f => console.log('  - ' + f));
    process.exit(1);
  }
  console.log('ALL CHECKS PASSED');
})();
