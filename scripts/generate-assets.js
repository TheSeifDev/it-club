/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const LOGO_PATH = path.join(__dirname, '..', 'public', 'logo.png');

function createIcoFromPngBuffers(pngBuffersWithSizes) {
  const count = pngBuffersWithSizes.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const totalDirSize = headerSize + count * dirEntrySize;

  let currentOffset = totalDirSize;
  const entries = [];

  for (const { size, buffer } of pngBuffersWithSizes) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2);                      // color palette count
    entry.writeUInt8(0, 3);                      // reserved
    entry.writeUInt16LE(1, 4);                   // color planes
    entry.writeUInt16LE(32, 6);                  // bits per pixel
    entry.writeUInt32LE(buffer.length, 8);       // size
    entry.writeUInt32LE(currentOffset, 12);      // offset

    entries.push(entry);
    currentOffset += buffer.length;
  }

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type (1 = ICO)
  header.writeUInt16LE(count, 4); // number of images

  return Buffer.concat([header, ...entries, ...pngBuffersWithSizes.map(p => p.buffer)]);
}

async function generateFavicons() {
  console.log('Generating favicons and browser icons from:', LOGO_PATH);

  // Generate PNG buffers for 16, 32, 48, 180
  const [png16, png32, png48, png180] = await Promise.all([
    sharp(LOGO_PATH).resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
    sharp(LOGO_PATH).resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
    sharp(LOGO_PATH).resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
    sharp(LOGO_PATH).resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
  ]);

  // Create multi-resolution .ico containing 16x16, 32x32, 48x48
  const icoBuffer = createIcoFromPngBuffers([
    { size: 16, buffer: png16 },
    { size: 32, buffer: png32 },
    { size: 48, buffer: png48 },
  ]);

  // Generate WebP buffers for modern browsers
  const [webp32, webp192, webp512] = await Promise.all([
    sharp(LOGO_PATH).resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ lossless: true, effort: 6 }).toBuffer(),
    sharp(LOGO_PATH).resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ lossless: true, effort: 6 }).toBuffer(),
    sharp(LOGO_PATH).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ lossless: true, effort: 6 }).toBuffer(),
  ]);

  // Write favicon.ico to app/ and public/
  fs.writeFileSync(path.join(__dirname, '..', 'app', 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.ico'), icoBuffer);
  console.log('✓ Wrote app/favicon.ico and public/favicon.ico (multi-res ICO: 16x16, 32x32, 48x48)');

  // Write icon.webp (32x32) to app/ and public/
  fs.writeFileSync(path.join(__dirname, '..', 'app', 'icon.webp'), webp32);
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'icon.webp'), webp32);
  console.log('✓ Wrote app/icon.webp and public/icon.webp (32x32)');

  // Write apple-icon.png (180x180) to app/ and public/ (Apple Touch Icon specification requires PNG)
  fs.writeFileSync(path.join(__dirname, '..', 'app', 'apple-icon.png'), png180);
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'apple-icon.png'), png180);
  console.log('✓ Wrote app/apple-icon.png and public/apple-icon.png (180x180)');

  // Write icon-192.webp and icon-512.webp to public/
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'icon-192.webp'), webp192);
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'icon-512.webp'), webp512);
  console.log('✓ Wrote public/icon-192.webp and public/icon-512.webp');
}

async function generateOpenGraphImage() {
  const width = 1200;
  const height = 630;

  console.log('Generating Open Graph 1200x630 share image...');

  // 1. Resize official logo to 370x370 with crisp contain
  const logoResized = await sharp(LOGO_PATH)
    .resize(370, 370, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // 2. SVG canvas containing brand typography, emerald accents, and dark background
  const svgOverlay = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgGlow" cx="24%" cy="50%" r="55%">
          <stop offset="0%" stop-color="#00e599" stop-opacity="0.16"/>
          <stop offset="50%" stop-color="#18c8ed" stop-opacity="0.06"/>
          <stop offset="100%" stop-color="#050708" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="accentGlow" cx="72%" cy="45%" r="48%">
          <stop offset="0%" stop-color="#00e599" stop-opacity="0.09"/>
          <stop offset="100%" stop-color="#050708" stop-opacity="0"/>
        </radialGradient>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#ffffff" fill-opacity="0.03"/>
        </pattern>
        <linearGradient id="emeraldLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#00e599" stop-opacity="0.95"/>
          <stop offset="45%" stop-color="#18c8ed" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#00e599" stop-opacity="0.15"/>
        </linearGradient>
        <linearGradient id="dividerLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.16"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
        </linearGradient>
      </defs>

      <!-- Base Dark Background -->
      <rect width="${width}" height="${height}" fill="#050708"/>

      <!-- Atmospheric Radial Glows -->
      <rect width="${width}" height="${height}" fill="url(#bgGlow)"/>
      <rect width="${width}" height="${height}" fill="url(#accentGlow)"/>

      <!-- Subtle Dot Matrix Pattern -->
      <rect width="${width}" height="${height}" fill="url(#grid)"/>

      <!-- Top Border Emerald Accent Line -->
      <rect x="0" y="0" width="${width}" height="4" fill="url(#emeraldLine)"/>

      <!-- Outer Frame Border -->
      <rect x="0.5" y="0.5" width="1199" height="629" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1"/>

      <!-- Right Column: Brand Hierarchy -->
      <!-- Eyebrow Pill -->
      <g transform="translate(500, 135)">
        <rect x="0" y="0" width="490" height="30" rx="6" fill="#00e599" fill-opacity="0.12" stroke="#00e599" stroke-opacity="0.35" stroke-width="1"/>
        <circle cx="15" cy="15" r="4.5" fill="#00e599"/>
        <text x="30" y="20" font-family="'Montserrat', -apple-system, system-ui, sans-serif" font-size="11.5" font-weight="800" letter-spacing="2" fill="#00e599">
          BORG AL ARAB TECHNOLOGICAL UNIVERSITY
        </text>
      </g>

      <!-- Editorial Headline -->
      <text x="500" y="250" font-family="'Montserrat', -apple-system, system-ui, sans-serif" font-size="78" font-weight="900" letter-spacing="-2" fill="#ffffff">
        IT <tspan fill="#00e599">CLUB</tspan>
      </text>

      <!-- Sub-headline -->
      <text x="500" y="315" font-family="'Montserrat', -apple-system, system-ui, sans-serif" font-size="32" font-weight="800" letter-spacing="4" fill="#f1f5f9">
        RECRUITMENT <tspan fill="#00e599">2026</tspan>
      </text>

      <!-- Divider -->
      <line x1="500" y1="360" x2="1080" y2="360" stroke="url(#dividerLine)" stroke-width="1.5"/>

      <!-- Core Pillars -->
      <text x="500" y="410" font-family="'Montserrat', -apple-system, system-ui, sans-serif" font-size="20" font-weight="600" letter-spacing="1" fill="#94a3b8">
        Learn  ·  Build  ·  Collaborate  ·  Grow
      </text>

      <!-- Arabic Tagline -->
      <text x="500" y="455" font-family="'Alexandria', system-ui, sans-serif" font-size="18" font-weight="500" fill="#64748b">
        مجتمع تقني طلابي للتعلم والابتكار والتطوير المشترك
      </text>

      <!-- Institutional Footer Attribution -->
      <g transform="translate(500, 505)">
        <text x="0" y="15" font-family="'Montserrat', monospace, sans-serif" font-size="12" font-weight="700" letter-spacing="2" fill="#475569">
          OFFICIAL STUDENT TECHNOLOGY COMMUNITY  ·  BATU
        </text>
      </g>
    </svg>
  `);

  // 3. Composite official 3D logo onto the canvas
  const ogWebpBuffer = await sharp(svgOverlay)
    .composite([
      {
        input: logoResized,
        top: 130,
        left: 80,
      },
    ])
    .webp({ lossless: true, effort: 6 })
    .toBuffer();

  const ogWebpPath = path.join(__dirname, '..', 'public', 'og-itclub.webp');
  fs.writeFileSync(ogWebpPath, ogWebpBuffer);
  console.log(`✓ Wrote ${ogWebpPath} (1200x630, ${(ogWebpBuffer.length / 1024).toFixed(1)} KB)`);
}

async function main() {
  await generateFavicons();
  await generateOpenGraphImage();
  console.log('\nAll assets generated successfully!');
}

main().catch(err => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
