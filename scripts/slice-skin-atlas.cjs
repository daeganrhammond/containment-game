// Slice a square N x N PNG sprite atlas into deterministic cell images.
// Usage: node scripts/slice-skin-atlas.cjs <atlas.png> <output-dir> <grid-size> <prefix>
const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const [source, outputDir, gridArg, prefix] = process.argv.slice(2);
const grid = Number(gridArg);
if (!source || !outputDir || !Number.isInteger(grid) || grid < 1 || !prefix) {
  throw new Error('Usage: node scripts/slice-skin-atlas.cjs <atlas.png> <output-dir> <grid-size> <prefix>');
}
const atlas = PNG.sync.read(fs.readFileSync(source));
if (atlas.width !== atlas.height) throw new Error('Atlas must be square.');
fs.mkdirSync(outputDir, { recursive: true });
for (let row = 0; row < grid; row += 1) {
  for (let col = 0; col < grid; col += 1) {
    const left = Math.floor((col * atlas.width) / grid);
    const right = Math.floor(((col + 1) * atlas.width) / grid);
    const top = Math.floor((row * atlas.height) / grid);
    const bottom = Math.floor(((row + 1) * atlas.height) / grid);
    const tile = new PNG({ width: right - left, height: bottom - top });
    for (let y = top; y < bottom; y += 1) {
      const sourceStart = (y * atlas.width + left) * 4;
      const sourceEnd = (y * atlas.width + right) * 4;
      const targetStart = ((y - top) * tile.width) * 4;
      atlas.data.copy(tile.data, targetStart, sourceStart, sourceEnd);
    }
    const filename = `${prefix}-${row * grid + col + 1}.png`;
    fs.writeFileSync(path.join(outputDir, filename), PNG.sync.write(tile));
  }
}
