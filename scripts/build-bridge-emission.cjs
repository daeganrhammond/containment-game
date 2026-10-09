// Build a source-registered glow plate from the bright cyan and amber pixels
// in the transparent bridge foreground. The alpha is clipped to the art so
// light never spills into the vista window.
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = process.cwd();
const sourcePath = path.join(root, 'assets', process.argv[2] || 'bridge-command-foreground.png');
const outputPath = path.join(root, 'assets', process.argv[3] || 'bridge-ambient-emission.png');
const source = PNG.sync.read(fs.readFileSync(sourcePath));
const { width, height, data } = source;
const cyan = new Float32Array(width * height);
const amber = new Float32Array(width * height);

for (let i = 0; i < width * height; i++) {
  const p = i * 4;
  const r = data[p], g = data[p + 1], b = data[p + 2];
  if (data[p + 3] < 200) continue;
  const bright = Math.max(r, g, b);
  if (b > r * 1.42 && g > r * 1.22 && bright > 150) {
    cyan[i] = Math.min(1, (bright - 120) / 135);
  } else if (r > g * 1.28 && g > b * 1.2 && r > 182 && g > 78) {
    amber[i] = Math.min(1, (r - 150) / 105);
  }
}

function blur(input, sigma) {
  const radius = Math.ceil(sigma * 3);
  const kernel = new Float32Array(radius * 2 + 1);
  let total = 0;
  for (let x = -radius; x <= radius; x++) {
    const value = Math.exp(-(x * x) / (2 * sigma * sigma));
    kernel[x + radius] = value;
    total += value;
  }
  for (let i = 0; i < kernel.length; i++) kernel[i] /= total;
  const horizontal = new Float32Array(input.length);
  const output = new Float32Array(input.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let k = -radius; k <= radius; k++) {
      const xx = Math.max(0, Math.min(width - 1, x + k));
      sum += input[y * width + xx] * kernel[k + radius];
    }
    horizontal[y * width + x] = sum;
  }
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let k = -radius; k <= radius; k++) {
      const yy = Math.max(0, Math.min(height - 1, y + k));
      sum += horizontal[yy * width + x] * kernel[k + radius];
    }
    output[y * width + x] = sum;
  }
  return output;
}

const cyanGlow = blur(cyan, 9);
const amberGlow = blur(amber, 9);
const emission = new PNG({ width, height });
let activePixels = 0;
for (let i = 0; i < width * height; i++) {
  const p = i * 4;
  const sourceAlpha = data[p + 3] / 255;
  const cool = cyanGlow[i];
  const warm = amberGlow[i];
  const energy = Math.max(cool, warm);
  const alpha = Math.min(0.42, energy * 1.9) * sourceAlpha;
  if (alpha < 0.004) continue;
  activePixels++;
  const isCool = cool >= warm;
  emission.data[p] = isCool ? 105 : 255;
  emission.data[p + 1] = isCool ? 225 : 167;
  emission.data[p + 2] = isCool ? 255 : 83;
  emission.data[p + 3] = Math.round(alpha * 255);
}

fs.writeFileSync(outputPath, PNG.sync.write(emission, { colorType: 6, inputColorType: 6 }));
console.log(`Wrote ${path.relative(root, outputPath)} (${width}×${height}; ${activePixels} softly lit pixels).`);
