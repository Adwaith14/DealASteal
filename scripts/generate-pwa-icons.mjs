/**
 * Generates solid-color PWA icons under public/pwa/.
 * Requires sharp (transitive via Next.js).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'public', 'pwa');

const brand = { r: 37, g: 99, b: 235 }; // #2563eb

async function writePng(size, filename) {
  const buf = await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: brand,
    },
  })
    .png()
    .toBuffer();
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, filename), buf);
}

await writePng(192, 'icon-192.png');
await writePng(512, 'icon-512.png');
console.log('Wrote public/pwa/icon-192.png and icon-512.png');
