// Generates the PWA raster icons (192 / 512) without any image dependency.
// The artwork mirrors public/icon.svg: a stylised neuron on a teal rounded square.
// Run with: npm run icons
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function roundRectContains(x, y, size, radius) {
  if (x < 0 || y < 0 || x > size || y > size) return false;
  const cx = Math.min(Math.max(x, radius), size - radius);
  const cy = Math.min(Math.max(y, radius), size - radius);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function segmentDistance(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const len = vx * vx + vy * vy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / len));
  const dx = px - (ax + t * vx);
  const dy = py - (ay + t * vy);
  return Math.hypot(dx, dy);
}

const STROKES = [
  [230, 238, 152, 168],
  [284, 234, 368, 162],
  [214, 292, 128, 332],
  [300, 294, 392, 338],
  [256, 224, 256, 124],
  [256, 314, 256, 402],
  [256, 402, 208, 446],
  [256, 402, 304, 446],
];

const NODES = [
  [152, 168, 17],
  [368, 162, 17],
  [128, 332, 17],
  [392, 338, 17],
  [256, 124, 17],
  [208, 446, 17],
  [304, 446, 17],
];

const SOMA = [256, 270, 46];
const STROKE_HALF = 10;
const SS = 2; // supersampling factor

function render(size) {
  const big = size * SS;
  const scale = big / 512;
  const px = new Uint8ClampedArray(big * big * 4);

  const top = [0x0f, 0x76, 0x6e];
  const bottom = [0x0b, 0x4f, 0x6c];

  for (let y = 0; y < big; y += 1) {
    for (let x = 0; x < big; x += 1) {
      const ux = x / scale;
      const uy = y / scale;
      const idx = (y * big + x) * 4;

      if (!roundRectContains(ux, uy, 512, 112)) {
        px[idx + 3] = 0;
        continue;
      }

      const t = Math.max(0, Math.min(1, (ux + uy) / 1024));
      let r = top[0] + (bottom[0] - top[0]) * t;
      let g = top[1] + (bottom[1] - top[1]) * t;
      let b = top[2] + (bottom[2] - top[2]) * t;

      let fg = false;
      for (const [ax, ay, bx, by] of STROKES) {
        if (segmentDistance(ux, uy, ax, ay, bx, by) <= STROKE_HALF) {
          fg = true;
          break;
        }
      }
      if (!fg && Math.hypot(ux - SOMA[0], uy - SOMA[1]) <= SOMA[2]) fg = true;
      if (!fg) {
        for (const [cx, cy, rad] of NODES) {
          if (Math.hypot(ux - cx, uy - cy) <= rad) {
            fg = true;
            break;
          }
        }
      }
      if (fg) {
        r = 0xea;
        g = 0xff;
        b = 0xfb;
      }

      px[idx] = r;
      px[idx + 1] = g;
      px[idx + 2] = b;
      px[idx + 3] = 255;
    }
  }

  // Downsample (box filter) for antialiasing.
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          const i = ((y * SS + sy) * big + (x * SS + sx)) * 4;
          const alpha = px[i + 3] / 255;
          r += px[i] * alpha;
          g += px[i + 1] * alpha;
          b += px[i + 2] * alpha;
          a += alpha;
        }
      }
      const n = SS * SS;
      const o = (y * size + x) * 4;
      out[o] = a === 0 ? 0 : Math.round(r / a);
      out[o + 1] = a === 0 ? 0 : Math.round(g / a);
      out[o + 2] = a === 0 ? 0 : Math.round(b / a);
      out[o + 3] = Math.round((a / n) * 255);
    }
  }
  return encodePng(size, size, out);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of [192, 512]) {
  const file = resolve(OUT_DIR, `icon-${size}.png`);
  writeFileSync(file, render(size));
  console.log(`wrote ${file}`);
}
