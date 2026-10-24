// scripts/generate-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crcBuf]);
}

function createPng(width, height, renderFn) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  // Raw row scanlines
  const rowBytes = width * 4;
  const rawData = Buffer.alloc((rowBytes + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowBytes + 1);
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const rgba = renderFn(x, y, width, height);
      rawData[pixelOffset] = rgba[0];
      rawData[pixelOffset + 1] = rgba[1];
      rawData[pixelOffset + 2] = rgba[2];
      rawData[pixelOffset + 3] = rgba[3];
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Check point inside shield
function insideShield(nx, ny) {
  // nx in [-1, 1], ny in [-1, 1]
  if (ny < -0.85 || ny > 0.95 || Math.abs(nx) > 0.85) return false;
  // Shield curve formula
  const topCut = -0.85 + Math.abs(nx) * 0.15;
  if (ny < topCut) return false;
  if (ny > 0) {
    const bottomCurve = 0.95 - (1 - Math.abs(nx)) * 0.95 * Math.pow(1 - Math.abs(nx), 0.5);
    if (ny > bottomCurve) return false;
  }
  return true;
}

function renderPolySafeIcon(x, y, w, h) {
  // Normalize coordinates to -1 .. 1
  const nx = (x - w / 2) / (w * 0.44);
  const ny = (y - h / 2) / (h * 0.44);

  // Background Ivory/Paper
  const bg = [0xFA, 0xF8, 0xF5, 0xFF];
  const ink = [0x0B, 0x1B, 0x2B, 0xFF];
  const blue = [0x0E, 0x74, 0x90, 0xFF];
  const coral = [0xFF, 0x5C, 0x35, 0xFF];

  // Rotate point 45 deg for pill
  const cos45 = 0.7071;
  const sin45 = 0.7071;
  const px = nx * cos45 + ny * sin45;
  const py = -nx * sin45 + ny * cos45;

  // Check if inside pill
  const pillRadius = 0.22;
  const pillHalfLen = 0.38;
  const clampedX = Math.max(-pillHalfLen, Math.min(pillHalfLen, px));
  const distPill = Math.hypot(px - clampedX, py);

  const isPill = distPill <= pillRadius;
  const isPillBorder = Math.abs(distPill - pillRadius) <= 0.035;
  const isSeam = isPill && Math.abs(px) <= 0.025;

  // Shield check
  const inShield = insideShield(nx, ny);
  const inShieldBorder = insideShield(nx, ny) && !insideShield(nx * 0.93, ny * 0.93);

  if (isPillBorder || isSeam) {
    return ink;
  }
  if (isPill) {
    return px < 0 ? blue : coral;
  }
  if (inShieldBorder) {
    return ink;
  }
  if (inShield) {
    return [0xFF, 0xFF, 0xFF, 0xFF];
  }

  // Rounded outer squircle / canvas background
  const cornerDist = Math.hypot(Math.max(0, Math.abs(nx) - 0.7), Math.max(0, Math.abs(ny) - 0.7));
  if (cornerDist < 0.25) {
    return bg;
  }
  return [0, 0, 0, 0]; // Transparent outer
}

const publicDir = path.resolve(__dirname, '../frontend/public');
const p192 = createPng(192, 192, renderPolySafeIcon);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), p192);

const p512 = createPng(512, 512, renderPolySafeIcon);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), p512);

fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), p192);
console.log('Successfully generated PWA and Apple Touch icons!');
