import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  return table;
}

const CRC_TABLE = createCrcTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const c = crc32(typeAndData);
  chunk.writeUInt32BE(c, 8 + len);
  return chunk;
}

function generatePng(size, isMaskable = false) {
  const width = size;
  const height = size;
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(scanlineLength * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * (isMaskable ? 0.38 : 0.44);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep dark navy obsidian background
      let r = 8;
      let g = 14;
      let b = 32;
      let a = 255;

      // Outer gradient glow
      const t = (x + y) / (width + height);
      r = Math.floor(r + t * 12);
      g = Math.floor(g + t * 24);
      b = Math.floor(b + t * 45);

      // Subtle rounded container if not maskable
      if (!isMaskable) {
        const cornerDist = Math.max(Math.abs(dx), Math.abs(dy));
        if (cornerDist > width * 0.48) {
          // rounded squircle corner antialias
          const edge = Math.hypot(Math.max(0, Math.abs(dx) - width * 0.35), Math.max(0, Math.abs(dy) - height * 0.35));
          if (edge > width * 0.15) {
            a = Math.max(0, Math.min(255, Math.floor(255 - (edge - width * 0.15) * 40)));
          }
        }
      }

      // Mandala / Neural Ring
      if (Math.abs(dist - radius * 0.85) < 3) {
        r = 30; g = 64; b = 150;
      }
      if (Math.abs(dist - radius * 0.6) < 2) {
        r = 56; g = 189; b = 248; // cyan ring
      }

      // Central glowing diamond / lotus spark
      const diamondDist = Math.abs(dx) + Math.abs(dy);
      if (diamondDist < radius * 0.7) {
        const sparkT = 1 - (diamondDist / (radius * 0.7));
        r = Math.floor(56 * (1 - sparkT) + 251 * sparkT);
        g = Math.floor(189 * (1 - sparkT) + 191 * sparkT);
        b = Math.floor(248 * (1 - sparkT) + 36 * sparkT);
      }

      // Bright inner star
      if (diamondDist < radius * 0.35) {
        r = 255;
        g = 255;
        b = 255;
      }

      // Satellites
      const satDist1 = Math.hypot(dx - radius * 0.5, dy - radius * 0.5);
      const satDist2 = Math.hypot(dx + radius * 0.5, dy - radius * 0.5);
      const satDist3 = Math.hypot(dx - radius * 0.5, dy + radius * 0.5);
      const satDist4 = Math.hypot(dx + radius * 0.5, dy + radius * 0.5);

      if (satDist1 < radius * 0.08 || satDist2 < radius * 0.08 || satDist3 < radius * 0.08 || satDist4 < radius * 0.08) {
        r = 56;
        g = 189;
        b = 248;
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const compressedData = zlib.deflateSync(rawData);

  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePng(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generatePng(48, false));
console.log('PWA icons created successfully in public/!');
