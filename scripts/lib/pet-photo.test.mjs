import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { processPetPhoto, MAX_SIDE } from './pet-photo.mjs';

const dir = mkdtempSync(path.join(tmpdir(), 'pet-photo-'));

async function fixture(name, width, height) {
  const file = path.join(dir, `${name}.png`);
  await sharp({ create: { width, height, channels: 3, background: { r: 200, g: 120, b: 40 } } })
    .png()
    .toFile(file);
  return file;
}

for (const [name, w, h] of [
  ['landscape', 4000, 2250],
  ['portrait', 1500, 2000],
  ['square', 1000, 1000],
]) {
  test(`${name} photo keeps its aspect ratio and is never cropped`, async () => {
    const out = path.join(dir, `${name}.jpg`);
    const photo = await processPetPhoto(await fixture(name, w, h), out);
    assert.ok(Math.max(photo.width, photo.height) <= MAX_SIDE);
    assert.ok(Math.abs(photo.width / photo.height - w / h) < 0.01, `ratio ${photo.width}x${photo.height}`);
    const meta = await sharp(out).metadata();
    assert.deepEqual([meta.width, meta.height], [photo.width, photo.height]);
  });
}

test('reports the dominant color as a hex string', async () => {
  const photo = await processPetPhoto(await fixture('color', 800, 600), path.join(dir, 'color.jpg'));
  assert.match(photo.color, /^#[0-9a-f]{6}$/);
});

test('warns about low resolution and extreme ratios', async () => {
  const small = await processPetPhoto(await fixture('small', 400, 300), path.join(dir, 'small.jpg'));
  assert.equal(small.width, 400, 'never upscales');
  assert.equal(small.warnings.length, 1);
  const panorama = await processPetPhoto(await fixture('pano', 3000, 1000), path.join(dir, 'pano.jpg'));
  assert.equal(panorama.warnings.length, 1);
});
