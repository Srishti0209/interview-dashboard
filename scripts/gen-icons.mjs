// Generates PWA PNG icons (no external deps) — a rounded indigo tile with a
// white "card + bookmark" motif. Writes maskable-safe icons.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}
function png(size, draw) {
  const px = Buffer.alloc(size * size * 4);
  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
  };
  draw(set, size);
  // add filter byte (0) per row
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function draw(set, size) {
  const bg = [79, 70, 229]; // indigo-600
  const card = [255, 255, 255];
  const accent = [251, 191, 36]; // amber-400 bookmark
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      set(x, y, bg[0], bg[1], bg[2]); // full-bleed bg (maskable safe)
    }
  }
  // white rounded card in the centre
  const m = Math.round(size * 0.26);
  const r = Math.round(size * 0.06);
  for (let y = m; y < size - m; y++) {
    for (let x = m; x < size - m; x++) {
      // rounded corners
      const cx = Math.min(x - m, size - m - 1 - x);
      const cy = Math.min(y - m, size - m - 1 - y);
      if (cx < r && cy < r) {
        const dx = r - cx, dy = r - cy;
        if (dx * dx + dy * dy > r * r) continue;
      }
      set(x, y, card[0], card[1], card[2]);
    }
  }
  // amber bookmark near the top-right of the card
  const bx0 = Math.round(size * 0.58);
  const bx1 = Math.round(size * 0.66);
  const by0 = m;
  const by1 = Math.round(size * 0.46);
  for (let y = by0; y < by1; y++) {
    for (let x = bx0; x < bx1; x++) {
      // notch at the bottom
      if (y > by1 - (bx1 - bx0) / 2) {
        const mid = (bx0 + bx1) / 2;
        if (Math.abs(x - mid) < by1 - y) continue;
      }
      set(x, y, accent[0], accent[1], accent[2]);
    }
  }
}

for (const size of [192, 512]) {
  writeFileSync(
    new URL(`../public/pwa-${size}.png`, import.meta.url),
    png(size, draw),
  );
  console.log(`wrote public/pwa-${size}.png`);
}
