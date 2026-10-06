/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'assets', 'bridge-command-full.png');
const outputPath = path.join(root, 'assets', 'bridge-command-interior.png');
const source = PNG.sync.read(fs.readFileSync(sourcePath));
const windowPolygons = [
  // Forward panoramic glass, inset slightly to protect the cockpit frame.
  [[238, 145], [1388, 145], [1478, 166], [1535, 208], [1609, 536],
    [1597, 598], [1450, 612], [220, 612], [70, 592], [56, 551],
    [119, 334], [177, 208], [218, 165]],
  // Narrow port and starboard panes. These were previously left baked into
  // the interior art, so they kept showing the original nebula when the vista
  // changed. Keep each mask inside the glass frame and clear its whole pane.
  [[0, 86], [137, 92], [168, 101], [141, 132], [111, 185], [76, 250], [42, 315], [0, 365]],
  [[1504, 101], [1535, 92], [1672, 86], [1672, 365], [1630, 315], [1596, 250], [1561, 185], [1531, 132]],
];

function insidePolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const crosses = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

if (source.width !== 1672 || source.height !== 941) {
  throw new Error(`Expected 1672x941 bridge art, got ${source.width}x${source.height}`);
}

for (let y = 0; y < source.height; y++) {
  for (let x = 0; x < source.width; x++) {
    if (windowPolygons.some(points => insidePolygon(x + 0.5, y + 0.5, points))) {
      source.data[(y * source.width + x) * 4 + 3] = 0;
    }
  }
}

fs.writeFileSync(outputPath, PNG.sync.write(source));
console.log(`Wrote transparent cockpit interior: ${path.relative(root, outputPath)}`);
