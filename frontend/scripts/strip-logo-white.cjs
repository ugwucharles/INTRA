/**
 * Removes the “white box” around the INTRA wordmark.
 *
 * 1) Pixels that are light neutral (min(R,G,B) high) become fully transparent.
 *    This clears anti-aliased cream/white halos that a simple R,G,B>248 rule misses.
 * 2) Optional trim removes empty transparent margin.
 *
 * Run from frontend root: npm run strip-logo-white
 *
 * Env:
 *   LOGO_MIN_CHANNEL (default 170) — raise toward 200 if a faint halo remains;
 *     lower toward 150 only if thin strokes start disappearing.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const MIN_CHANNEL = Number(process.env.LOGO_MIN_CHANNEL || 170);
const TRIM = process.env.LOGO_NO_TRIM !== '1';

async function stripWhite(relativeToFrontendRoot) {
  const abs = path.join(__dirname, '..', relativeToFrontendRoot);
  if (!fs.existsSync(abs)) {
    console.error('Missing file:', abs);
    process.exit(1);
  }

  const { data, info } = await sharp(abs)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const buf = Buffer.from(data);
  for (let i = 0; i < buf.length; i += 4) {
    const r = buf[i];
    const g = buf[i + 1];
    const b = buf[i + 2];
    const m = Math.min(r, g, b);
    if (m >= MIN_CHANNEL) {
      buf[i + 3] = 0;
    }
  }

  let pipeline = sharp(buf, {
    raw: { width, height, channels: 4 },
  }).png();

  if (TRIM) {
    pipeline = pipeline.trim();
  }

  await pipeline.toFile(abs);

  const meta = await sharp(abs).metadata();
  console.log('Transparent PNG written:', abs, `(${meta.width}×${meta.height})`);
}

(async () => {
  const defaults = ['public/intra.logo.1.png', 'public/intra-logo-new.png'];
  const files = process.argv.slice(2).length ? process.argv.slice(2) : defaults;
  for (const f of files) {
    await stripWhite(f);
  }
})();
