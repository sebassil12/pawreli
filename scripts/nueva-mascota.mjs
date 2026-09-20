#!/usr/bin/env node
// Genera una mascota nueva: el archivo .md de la colección y un SVG de placa
// listo para grabado láser (medidas físicas en mm, capas corte/grabado). Uso:
//   npm run nueva-mascota -- --nombre "Luna" --raza "Golden Retriever" \
//     --tutor "María" --whatsapp 593999999999 --nota "Es nerviosa"
import { parseArgs } from 'node:util';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import QRCode from 'qrcode';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOMAIN = 'https://pawreli.com';

// npm strips the `--` separator; pnpm forwards it literally. Drop any stray `--`
// (and tolerate positionals) so `npm|pnpm run nueva-mascota -- --nombre ...` both work.
const args = process.argv.slice(2).filter((a) => a !== '--');
const { values } = parseArgs({
  args,
  allowPositionals: true,
  options: {
    nombre: { type: 'string' },
    raza: { type: 'string' },
    tutor: { type: 'string' },
    whatsapp: { type: 'string' },
    nota: { type: 'string' },
  },
});

const required = ['nombre', 'raza', 'tutor', 'whatsapp'];
const missing = required.filter((k) => !values[k]);
if (missing.length) {
  console.error(`\nFaltan datos: ${missing.join(', ')}\n`);
  console.error('Uso:');
  console.error(
    '  npm run nueva-mascota -- --nombre "Luna" --raza "Golden Retriever" \\\n' +
      '    --tutor "María" --whatsapp 593999999999 --nota "Es nerviosa con desconocidos"\n'
  );
  process.exit(1);
}

const whatsapp = values.whatsapp.replace(/\D/g, '');
if (whatsapp.length < 8) {
  console.error(`\nwhatsapp inválido: "${values.whatsapp}". Usa solo dígitos, con código de país.\n`);
  process.exit(1);
}

// Token único de 8 hex; reintenta si ya existe.
let token;
do {
  token = randomBytes(4).toString('hex');
} while (existsSync(path.join(ROOT, 'src/content/pets', `${token}.md`)));

// 1. Archivo de la mascota. JSON.stringify da comillas dobles YAML-seguras.
const q = (v) => JSON.stringify(v);
let frontmatter = `---
nombre: ${q(values.nombre)}
raza: ${q(values.raza)}
foto: ${q(`/pets/${token}.jpg`)}
tutor: ${q(values.tutor)}
whatsapp: ${q(whatsapp)}
`;
if (values.nota) frontmatter += `nota: ${q(values.nota)}\n`;
frontmatter += '---\n';

const petFile = path.join(ROOT, 'src/content/pets', `${token}.md`);
writeFileSync(petFile, frontmatter);

// 2. Placa lista para grabar: un solo SVG con medidas físicas reales (mm).
const url = `${DOMAIN}/${token}`; // URL humana (la ruta acepta mayúsculas y minúsculas)
const urlUpper = `${DOMAIN.toUpperCase()}/${token.toUpperCase()}`; // mayúsculas -> modo alfanumérico
const EC = 'Q'; // Q no cuesta módulos extra frente a M en esta URL, y tolera más rayones
const QUIET = 4; // zona de silencio, en módulos

// Geometría de la placa, en mm. Cambiá `faceMM` para probar otra medida.
const PLACA = {
  faceMM: 30, // cara cuadrada (donde va el QR)
  tabWmm: 10, // ancho de la pestaña superior
  tabHmm: 6, // alto de la pestaña (sobresale por encima de la cara)
  cornerR: 2, // radio de las esquinas de la cara
  holeDmm: 3, // diámetro del hueco de la argolla
  holeFromTopMM: 3, // centro del hueco, desde el borde superior
  qrMarginMM: 1.5, // margen del QR dentro de la cara, por lado
  textMM: 2, // altura deseada del código grabado (se ajusta si no cabe)
};

const qr = QRCode.create(urlUpper, { errorCorrectionLevel: EC });
const size = qr.modules.size; // p. ej. 25
const totalMods = size + 2 * QUIET; // 33
const qrAreaMM = PLACA.faceMM - 2 * PLACA.qrMarginMM; // 27 (incluye zona de silencio)
const moduleMM = qrAreaMM / totalMods; // ancho de un módulo, en mm

const canvasW = PLACA.faceMM; // 30
const canvasH = PLACA.tabHmm + PLACA.faceMM; // 36
const faceY0 = PLACA.tabHmm; // la cara empieza debajo de la pestaña (y=6)
const r = PLACA.cornerR;
const tabX0 = (PLACA.faceMM - PLACA.tabWmm) / 2; // 10
const tabX1 = tabX0 + PLACA.tabWmm; // 20

const fmt = (n) => Number(n.toFixed(4));

// --- corte (rojo): contorno de placa + pestaña como una sola silueta ---
const outline = [
  `M ${r},${faceY0}`,
  `H ${tabX0}`,
  `V 0`,
  `H ${tabX1}`,
  `V ${faceY0}`,
  `H ${canvasW - r}`,
  `A ${r} ${r} 0 0 1 ${canvasW},${faceY0 + r}`,
  `V ${canvasH - r}`,
  `A ${r} ${r} 0 0 1 ${canvasW - r},${canvasH}`,
  `H ${r}`,
  `A ${r} ${r} 0 0 1 0,${canvasH - r}`,
  `V ${faceY0 + r}`,
  `A ${r} ${r} 0 0 1 ${r},${faceY0}`,
  'Z',
].join(' ');
const holeCx = canvasW / 2; // 15
const holeCy = PLACA.holeFromTopMM; // 3
const holeR = PLACA.holeDmm / 2; // 1.5

// --- grabado (negro): módulos del QR ---
const originX = PLACA.qrMarginMM + QUIET * moduleMM; // primer módulo oscuro
const originY = faceY0 + PLACA.qrMarginMM + QUIET * moduleMM;
let rects = '';
for (let row = 0; row < size; row++) {
  for (let col = 0; col < size; col++) {
    if (!qr.modules.data[row * size + col]) continue;
    const x = fmt(originX + col * moduleMM);
    const y = fmt(originY + row * moduleMM);
    const m = fmt(moduleMM);
    rects += `<rect x="${x}" y="${y}" width="${m}" height="${m}"/>`;
  }
}

// --- grabado (negro): código corto en 7 segmentos (trazos, sin depender de fuentes) ---
const codigo = `${token.slice(0, 4)}-${token.slice(4)}`.toUpperCase();
// El único espacio libre fuera de la zona de silencio es el margen inferior de la
// cara (qrMarginMM). Si textMM no cabe ahí, se reduce y se avisa en consola.
const strip = PLACA.qrMarginMM;
const textH = Math.min(PLACA.textMM, strip - 0.2);
const textClamped = textH < PLACA.textMM;
const th = textH * 0.16; // grosor de segmento
const gw = textH * 0.6; // ancho de glifo
const gap = textH * 0.28; // separación entre glifos
const vseg = (textH - 3 * th) / 2; // largo de los segmentos verticales
// Segmentos encendidos por carácter (a=arriba, b=arr-der, c=ab-der, d=abajo,
// e=ab-izq, f=arr-izq, g=medio). Cubre 0-9, A-F y el guion.
const SEG = {
  0: 'abcdef',
  1: 'bc',
  2: 'abdeg',
  3: 'abcdg',
  4: 'bcfg',
  5: 'acdfg',
  6: 'acdefg',
  7: 'abc',
  8: 'abcdefg',
  9: 'abcdfg',
  A: 'abcefg',
  B: 'cdefg',
  C: 'adef',
  D: 'bcdeg',
  E: 'adefg',
  F: 'aefg',
  '-': 'g',
};
const totalTextW = codigo.length * gw + (codigo.length - 1) * gap;
let tx = (canvasW - totalTextW) / 2;
const ty = canvasH - strip + (strip - textH) / 2; // centrado en el margen inferior
const seg = (x, y, w, h) => `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}"/>`;
let glyphs = '';
for (const ch of codigo) {
  const on = SEG[ch] || '';
  if (on.includes('a')) glyphs += seg(tx + th, ty, gw - 2 * th, th);
  if (on.includes('g')) glyphs += seg(tx + th, ty + th + vseg, gw - 2 * th, th);
  if (on.includes('d')) glyphs += seg(tx + th, ty + 2 * th + 2 * vseg, gw - 2 * th, th);
  if (on.includes('f')) glyphs += seg(tx, ty + th, th, vseg);
  if (on.includes('b')) glyphs += seg(tx + gw - th, ty + th, th, vseg);
  if (on.includes('e')) glyphs += seg(tx, ty + 2 * th + vseg, th, vseg);
  if (on.includes('c')) glyphs += seg(tx + gw - th, ty + 2 * th + vseg, th, vseg);
  tx += gw + gap;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}mm" height="${canvasH}mm" viewBox="0 0 ${canvasW} ${canvasH}">
  <g id="corte" fill="none" stroke="#FF0000" stroke-width="0.01">
    <path d="${outline}"/>
    <circle cx="${holeCx}" cy="${holeCy}" r="${holeR}"/>
  </g>
  <g id="grabado" fill="#000000" stroke="none">
    ${rects}
    ${glyphs}
  </g>
</svg>
`;

const qrDir = path.join(ROOT, 'qr', token);
mkdirSync(qrDir, { recursive: true });
const svgName = `placa-${PLACA.faceMM}mm.svg`;
writeFileSync(path.join(qrDir, svgName), svg);

// 3. Salida para el operador.
console.log(`\n✓ Mascota creada: ${values.nombre}\n`);
console.log(`  Token:            ${token}`);
console.log(`  Código a grabar:  ${codigo}`);
console.log(`  URL:              ${url}`);
console.log(`  URL codificada:   ${urlUpper}`);
console.log(`  Archivo:          src/content/pets/${token}.md`);
console.log(`  Pon la foto en:   public/pets/${token}.jpg`);
console.log(`  Placa (SVG):      qr/${token}/${svgName}\n`);
console.log(`  Lienzo:           ${canvasW} × ${canvasH} mm`);
console.log(`  QR:               versión ${qr.version} · ${size}×${size} módulos (+${QUIET} de silencio/lado)`);
console.log(`  Tamaño de módulo: ${moduleMM.toFixed(2)} mm\n`);
if (moduleMM < 0.7) {
  console.log(
    `  ⚠ Módulo ${moduleMM.toFixed(2)} mm < 0.70 mm: a este tamaño el escaneo es poco\n` +
      `    confiable en celulares de gama media. Agrandá la placa (subí faceMM).\n`
  );
}
if (textClamped) {
  console.log(
    `  ⚠ El código se grabó a ${textH.toFixed(2)} mm (no ${PLACA.textMM} mm): con QR de ${qrAreaMM} mm\n` +
      `    centrado en ${PLACA.faceMM} mm, el único margen libre es ${strip} mm. Subí faceMM para más altura.\n`
  );
}
