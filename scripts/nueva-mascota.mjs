#!/usr/bin/env node
// Genera una mascota nueva: el archivo .md de la colección y los cuatro SVG de
// QR para el taller de grabado. Uso:
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

// 2. Los cuatro QR en SVG (vector para grabado láser).
const url = `${DOMAIN}/${token}`; // minúsculas, modo byte
const urlUpper = `${DOMAIN.toUpperCase()}/${token.toUpperCase()}`; // mayúsculas, modo alfanumérico
const variantes = [
  { file: 'qr-min-M.svg', data: url, ec: 'M' },
  { file: 'qr-min-Q.svg', data: url, ec: 'Q' },
  { file: 'qr-may-M.svg', data: urlUpper, ec: 'M' },
  { file: 'qr-may-Q.svg', data: urlUpper, ec: 'Q' },
];

const qrDir = path.join(ROOT, 'qr', token);
mkdirSync(qrDir, { recursive: true });

const opts = (ec) => ({ errorCorrectionLevel: ec, margin: 4, color: { dark: '#000000', light: '#ffffff' } });
const filas = [];
for (const v of variantes) {
  const svg = await QRCode.toString(v.data, { type: 'svg', ...opts(v.ec) });
  writeFileSync(path.join(qrDir, v.file), svg);
  const qr = QRCode.create(v.data, opts(v.ec)); // version + tamaño de módulos
  filas.push({
    archivo: v.file,
    version: qr.version,
    modulos: `${qr.modules.size}×${qr.modules.size}`,
    codifica: v.data,
  });
}

// 3. Salida para el operador.
const codigo = `${token.slice(0, 4)}-${token.slice(4)}`.toUpperCase();
console.log(`\n✓ Mascota creada: ${values.nombre}\n`);
console.log(`  Token:            ${token}`);
console.log(`  Código a grabar:  ${codigo}`);
console.log(`  URL:              ${url}`);
console.log(`  Archivo:          src/content/pets/${token}.md`);
console.log(`  Pon la foto en:   public/pets/${token}.jpg`);
console.log(`  QR (SVG):         qr/${token}/\n`);
console.table(filas);
console.log('Versión más baja = módulos más grandes = mejor escaneo en placa chica.\n');
