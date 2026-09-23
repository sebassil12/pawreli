#!/usr/bin/env node
// Genera una mascota nueva: el archivo .md de la colección y un SVG de placa
// listo para grabado láser (medidas físicas en mm, capas corte/grabado). Uso:
//   npm run nueva-mascota -- --nombre "Luna" --raza "Golden Retriever" \
//     --tutor "María" --whatsapp 593999999999 --nota "Es nerviosa"
// Segundo contacto opcional: --tutor2 "Pedro" --whatsapp2 593988888888 (van juntos).
// Foto opcional: --foto ~/Descargas/luna.png (cualquier formato; se guarda como .jpg).
import { parseArgs } from 'node:util';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import QRCode from 'qrcode';
import sharp from 'sharp';

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
    tutor2: { type: 'string' },
    whatsapp2: { type: 'string' },
    nota: { type: 'string' },
    foto: { type: 'string' },
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

// Solo dígitos con código de país; mismo rango que el schema (8-15).
function telefono(flag) {
  const n = values[flag].replace(/\D/g, '');
  if (n.length < 8 || n.length > 15) {
    console.error(`\n${flag} inválido: "${values[flag]}". Usa solo dígitos, con código de país.\n`);
    process.exit(1);
  }
  return n;
}

const whatsapp = telefono('whatsapp');

if (!values.tutor2 !== !values.whatsapp2) {
  console.error('\n--tutor2 y --whatsapp2 van juntos: pasa los dos o ninguno.\n');
  process.exit(1);
}
const whatsapp2 = values.whatsapp2 && telefono('whatsapp2');

if (values.foto && !existsSync(values.foto)) {
  console.error(`\nNo encuentro la foto: "${values.foto}".\n`);
  process.exit(1);
}

// Token único de 8 hex; reintenta si ya existe.
let token;
do {
  token = randomBytes(4).toString('hex');
} while (existsSync(path.join(ROOT, 'src/content/pets', `${token}.md`)));

// 0. Foto: corrige la rotación del celular, achica a 1200 px de ancho (la página
// la muestra a 412) y la guarda como .jpg. Antes del .md: si falla, no queda nada a medias.
const fotoFile = path.join(ROOT, 'public/pets', `${token}.jpg`);
if (values.foto) {
  try {
    await sharp(values.foto)
      .rotate()
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(fotoFile);
  } catch (err) {
    console.error(`\nNo pude convertir la foto "${values.foto}": ${err.message}\n`);
    process.exit(1);
  }
}

// 1. Archivo de la mascota. JSON.stringify da comillas dobles YAML-seguras.
const q = (v) => JSON.stringify(v);
let frontmatter = `---
nombre: ${q(values.nombre)}
raza: ${q(values.raza)}
foto: ${q(`/pets/${token}.jpg`)}
tutor: ${q(values.tutor)}
whatsapp: ${q(whatsapp)}
`;
if (whatsapp2) frontmatter += `contacto2:\n  tutor: ${q(values.tutor2)}\n  whatsapp: ${q(whatsapp2)}\n`;
if (values.nota) frontmatter += `nota: ${q(values.nota)}\n`;
frontmatter += '---\n';

const petFile = path.join(ROOT, 'src/content/pets', `${token}.md`);
writeFileSync(petFile, frontmatter);

// Glifos hex + guion como trazos vectoriales (sans-serif bold, sin depender de
// una fuente instalada). Normalizado 0..1 (y hacia abajo), escalado a cada celda.
function glyphD(ch, X, Y, W, H) {
  const x = (n) => +(X + n * W).toFixed(3);
  const y = (n) => +(Y + n * H).toFixed(3);
  const M = (a, b) => `M ${x(a)} ${y(b)}`;
  const L = (a, b) => `L ${x(a)} ${y(b)}`;
  const A = (rx, ry, sweep, a, b) => `A ${+(rx * W).toFixed(3)} ${+(ry * H).toFixed(3)} 0 0 ${sweep} ${x(a)} ${y(b)}`;
  const Lx = 0.16,
    Rx = 0.84,
    Cx = 0.5,
    Ty = 0.06,
    By = 0.94,
    My = 0.5;
  const rx = (Rx - Lx) / 2,
    ry = (By - Ty) / 2;
  switch (ch) {
    case '0':
      return `${M(Cx, Ty)} ${A(rx, ry, 1, Cx, By)} ${A(rx, ry, 1, Cx, Ty)}`;
    case '1':
      return `${M(Lx + 0.02, Ty + 0.2)} ${L(Cx, Ty)} ${L(Cx, By)} ${M(Lx, By)} ${L(Rx, By)}`;
    case '2':
      return `${M(Lx, Ty + 0.26)} ${A(rx, 0.22, 1, Rx, Ty + 0.26)} ${L(Lx, By)} ${L(Rx, By)}`;
    case '3':
      return `${M(Lx, Ty)} ${L(Rx, Ty)} ${L(Cx, My)} ${A(0.3, 0.26, 1, Lx + 0.02, By)}`;
    case '4':
      return `${M(Rx - 0.05, By)} ${L(Rx - 0.05, Ty)} ${L(Lx, My + 0.14)} ${L(Rx, My + 0.14)}`;
    case '5':
      return `${M(Rx, Ty)} ${L(Lx, Ty)} ${L(Lx, My)} ${L(Cx + 0.05, My)} ${A(0.3, 0.26, 1, Lx, By)}`;
    case '6': {
      const cy = By - 0.24;
      return `${M(Lx, cy)} ${A(0.34, 0.22, 1, Rx, cy)} ${A(0.34, 0.22, 1, Lx, cy)} ${M(Lx, cy)} ${L(Cx - 0.02, Ty)}`;
    }
    case '7':
      return `${M(Lx, Ty)} ${L(Rx, Ty)} ${L(Cx - 0.02, By)}`;
    case '8':
      return `${M(Cx, My)} ${A(0.3, 0.22, 1, Cx, Ty)} ${A(0.3, 0.22, 1, Cx, My)} ${A(0.34, 0.24, 0, Cx, By)} ${A(0.34, 0.24, 0, Cx, My)}`;
    case '9': {
      const cy = Ty + 0.24;
      return `${M(Lx, cy)} ${A(0.34, 0.22, 1, Rx, cy)} ${A(0.34, 0.22, 1, Lx, cy)} ${M(Rx, cy)} ${L(Cx + 0.02, By)}`;
    }
    case 'A':
      return `${M(Lx, By)} ${L(Cx, Ty)} ${L(Rx, By)} ${M(Lx + 0.12, My + 0.18)} ${L(Rx - 0.12, My + 0.18)}`;
    case 'B':
      return `${M(Lx, Ty)} ${L(Lx, By)} ${M(Lx, Ty)} ${L(Cx + 0.06, Ty)} ${A(0.26, 0.24, 1, Cx + 0.06, My)} ${L(Lx, My)} ${M(Cx + 0.06, My)} ${A(0.3, 0.24, 1, Cx + 0.06, By)} ${L(Lx, By)}`;
    case 'C':
      return `${M(Rx - 0.02, Ty + 0.18)} A ${+(0.4 * W).toFixed(3)} ${+(0.42 * H).toFixed(3)} 0 1 0 ${x(Rx - 0.02)} ${y(By - 0.18)}`;
    case 'D':
      return `${M(Lx, Ty)} ${L(Lx, By)} ${M(Lx, Ty)} ${L(Cx, Ty)} ${A(0.36, 0.44, 1, Cx, By)} ${L(Lx, By)}`;
    case 'E':
      return `${M(Rx, Ty)} ${L(Lx, Ty)} ${L(Lx, By)} ${L(Rx, By)} ${M(Lx, My)} ${L(Rx - 0.1, My)}`;
    case 'F':
      return `${M(Rx, Ty)} ${L(Lx, Ty)} ${L(Lx, By)} ${M(Lx, My)} ${L(Rx - 0.1, My)}`;
    case '-':
      return `${M(Lx + 0.04, My)} ${L(Rx - 0.04, My)}`;
    default:
      return '';
  }
}

// 2. Placa lista para grabar: un solo SVG con medidas físicas reales (mm).
const url = `${DOMAIN}/${token}`; // URL humana (la ruta acepta mayúsculas y minúsculas)
const urlUpper = `${DOMAIN.toUpperCase()}/${token.toUpperCase()}`; // mayúsculas -> modo alfanumérico
const EC = 'Q'; // Q no cuesta módulos extra frente a M en esta URL, y tolera más rayones
const QUIET = 4; // zona de silencio, en módulos

// Geometría de la placa, en mm. Cambiá bodyWmm/bodyHmm para probar otra medida.
// El hueco va integrado en el cuerpo (sin pestaña externa): más resistente en
// acrílico, sin esquinas rectas de 90° que concentren la fuerza de un tirón.
const PLACA = {
  bodyWmm: 30, // ancho del cuerpo
  bodyHmm: 36, // alto del cuerpo
  cornerR: 3, // radio de las esquinas (suaviza el punto de quiebre)
  holeDmm: 3, // diámetro del hueco de la argolla
  holeCyMM: 5, // centro del hueco desde arriba (deja >=3 mm de pared sólida)
  qrMarginMM: 2.5, // margen lateral libre del QR (aire para que la cámara enfoque)
  qrTopMM: 8, // borde superior del área del QR (deja lugar al hueco arriba)
  textMM: 2, // altura del código grabado
  textGapMM: 0.5, // separación mínima entre el QR y el código
};

const qr = QRCode.create(urlUpper, { errorCorrectionLevel: EC });
const size = qr.modules.size; // p. ej. 25
const totalMods = size + 2 * QUIET; // 33
const qrAreaMM = PLACA.bodyWmm - 2 * PLACA.qrMarginMM; // ancho del QR (incluye zona de silencio)
const moduleMM = qrAreaMM / totalMods; // ancho de un módulo, en mm

const canvasW = PLACA.bodyWmm;
const canvasH = PLACA.bodyHmm;
const r = PLACA.cornerR;
const fmt = (n) => Number(n.toFixed(4));

// --- corte (rojo): cuerpo redondeado + hueco interior de la argolla ---
const body = [
  `M ${r} 0`,
  `H ${canvasW - r}`,
  `A ${r} ${r} 0 0 1 ${canvasW} ${r}`,
  `V ${canvasH - r}`,
  `A ${r} ${r} 0 0 1 ${canvasW - r} ${canvasH}`,
  `H ${r}`,
  `A ${r} ${r} 0 0 1 0 ${canvasH - r}`,
  `V ${r}`,
  `A ${r} ${r} 0 0 1 ${r} 0`,
  'Z',
].join(' ');
const holeCx = canvasW / 2;
const holeCy = PLACA.holeCyMM;
const holeR = PLACA.holeDmm / 2;

// --- grabado (negro): módulos del QR ---
const originX = PLACA.qrMarginMM + QUIET * moduleMM; // primer módulo oscuro
const originY = PLACA.qrTopMM + QUIET * moduleMM;
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

// --- grabado (negro): código corto en sans-serif bold trazado (sin fuentes) ---
const codigo = `${token.slice(0, 4)}-${token.slice(4)}`.toUpperCase();
const qrBottom = PLACA.qrTopMM + qrAreaMM;
const bandTop = qrBottom + PLACA.textGapMM;
const bandH = canvasH - bandTop - 0.3; // -0.3 mm de margen inferior
const textH = Math.min(PLACA.textMM, bandH);
const textClamped = textH < PLACA.textMM;
const stroke = fmt(0.2 * textH); // trazo grueso (bold): profundidad de grabado, la pintura agarra
const gw = textH * 0.62; // ancho de glifo
const gap = textH * 0.34; // separación entre glifos
const totalTextW = codigo.length * gw + (codigo.length - 1) * gap;
let gx = (canvasW - totalTextW) / 2;
const gy = bandTop + (bandH - textH) / 2;
let glyphs = '';
for (const ch of codigo) {
  glyphs += `<path d="${glyphD(ch, gx, gy, gw, textH)}"/>`;
  gx += gw + gap;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}mm" height="${canvasH}mm" viewBox="0 0 ${canvasW} ${canvasH}">
  <g id="corte" fill="none" stroke="#FF0000" stroke-width="0.01">
    <path d="${body}"/>
    <circle cx="${holeCx}" cy="${holeCy}" r="${holeR}"/>
  </g>
  <g id="grabado" fill="#000000" stroke="none">
    ${rects}
    <g fill="none" stroke="#000000" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${glyphs}</g>
  </g>
</svg>
`;

const qrDir = path.join(ROOT, 'qr', token);
mkdirSync(qrDir, { recursive: true });
const svgName = `placa-${PLACA.bodyWmm}x${PLACA.bodyHmm}mm.svg`;
writeFileSync(path.join(qrDir, svgName), svg);

// 3. Salida para el operador.
console.log(`\n✓ Mascota creada: ${values.nombre}\n`);
console.log(`  Token:            ${token}`);
console.log(`  Código a grabar:  ${codigo}`);
console.log(`  URL:              ${url}`);
console.log(`  URL codificada:   ${urlUpper}`);
console.log(`  Archivo:          src/content/pets/${token}.md`);
console.log(
  values.foto ? `  Foto:             public/pets/${token}.jpg` : `  Pon la foto en:   public/pets/${token}.jpg`
);
console.log(`  Placa (SVG):      qr/${token}/${svgName}\n`);
console.log(`  Lienzo:           ${canvasW} × ${canvasH} mm`);
console.log(`  QR:               versión ${qr.version} · ${size}×${size} módulos (+${QUIET} de silencio/lado)`);
console.log(`  Tamaño de módulo: ${moduleMM.toFixed(2)} mm\n`);
if (moduleMM < 0.7) {
  console.log(
    `  ⚠ Módulo ${moduleMM.toFixed(2)} mm < 0.70 mm: a este tamaño el escaneo es poco\n` +
      `    confiable en celulares de gama media. Agrandá la placa (subí bodyWmm).\n`
  );
}
if (textClamped) {
  console.log(
    `  ⚠ El código se grabó a ${textH.toFixed(2)} mm (no ${PLACA.textMM} mm): no entra debajo\n` +
      `    del QR. Subí bodyHmm o bajá qrTopMM para darle más lugar.\n`
  );
}
