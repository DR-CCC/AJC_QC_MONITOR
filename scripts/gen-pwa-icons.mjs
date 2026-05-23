import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, '../public/pwa-icon.svg');
const svg = readFileSync(svgPath);

for (const size of [192, 512]) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  const png = resvg.render().asPng();
  const outPath = join(__dirname, `../public/pwa-${size}.png`);
  writeFileSync(outPath, png);
  console.log(`Generated pwa-${size}.png`);
}
