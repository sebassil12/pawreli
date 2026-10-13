import sharp from 'sharp';

/** Longest side of the stored photo, in px. */
export const MAX_SIDE = 1200;
const MIN_SIDE = 600;
const MAX_RATIO = 2;

/**
 * Normalizes a customer photo for the public profile WITHOUT cropping it:
 * fixes phone rotation, shrinks it to fit MAX_SIDE (never upscales) and saves a JPEG.
 * The profile frames it with `object-fit: contain`, so the whole pet stays visible
 * whatever the original proportions are; `color` fills the empty frame area.
 */
export async function processPetPhoto(input, output) {
  const { width, height } = await sharp(input)
    .rotate()
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(output);

  const { dominant } = await sharp(output).stats();
  const color = '#' + [dominant.r, dominant.g, dominant.b].map((c) => c.toString(16).padStart(2, '0')).join('');

  // Operator-facing messages stay in Spanish (they are UI copy, not code).
  const warnings = [];
  if (Math.max(width, height) < MIN_SIDE) {
    warnings.push(`Foto de baja resolución (${width}×${height}); se verá borrosa. Pide una más grande.`);
  }
  if (Math.max(width, height) / Math.min(width, height) > MAX_RATIO) {
    warnings.push(
      `Proporción extrema (${width}×${height}); la mascota se verá pequeña. Pide una foto donde llene el cuadro.`
    );
  }

  return { width, height, color, warnings };
}
