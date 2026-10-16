/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function convertAll() {
  const rootDir = path.resolve(__dirname, '..');
  const targets = [
    { src: 'public/logo.png', dest: 'public/logo.webp' },
    { src: 'public/og-itclub.png', dest: 'public/og-itclub.webp' },
    { src: 'public/icon.png', dest: 'public/icon.webp' },
    { src: 'app/icon.png', dest: 'app/icon.webp' },
    { src: 'public/apple-icon.png', dest: 'public/apple-icon.webp' },
    { src: 'app/apple-icon.png', dest: 'app/apple-icon.webp' },
    { src: 'public/icon-192.png', dest: 'public/icon-192.webp' },
    { src: 'public/icon-512.png', dest: 'public/icon-512.webp' },
  ];

  console.log('--- Converting PNG Assets to Lossless WebP (effort: 6) ---');
  const results = [];
  let totalOriginal = 0;
  let totalConverted = 0;

  for (const { src, dest } of targets) {
    const srcPath = path.join(rootDir, src);
    const destPath = path.join(rootDir, dest);

    if (!fs.existsSync(srcPath)) {
      console.warn(`[WARN] Source file not found: ${src}`);
      continue;
    }

    const srcStat = fs.statSync(srcPath);
    totalOriginal += srcStat.size;

    await sharp(srcPath)
      .webp({
        lossless: true,
        effort: 6,
      })
      .toFile(destPath);

    const destStat = fs.statSync(destPath);
    totalConverted += destStat.size;

    const diff = destStat.size - srcStat.size;
    const pct = ((diff / srcStat.size) * 100).toFixed(2);

    results.push({
      src,
      dest,
      originalBytes: srcStat.size,
      webpBytes: destStat.size,
      diffBytes: diff,
      pctChange: pct,
    });

    console.log(`✓ ${src} (${srcStat.size} B) -> ${dest} (${destStat.size} B) [${pct}%]`);
  }

  const totalDiff = totalConverted - totalOriginal;
  const totalPct = ((totalDiff / totalOriginal) * 100).toFixed(2);

  console.log('\n--- Summary ---');
  console.log(`Total files converted: ${results.length}`);
  console.log(`Total PNG size before: ${totalOriginal.toLocaleString()} bytes (${(totalOriginal / 1024).toFixed(1)} KB)`);
  console.log(`Total WebP size after:  ${totalConverted.toLocaleString()} bytes (${(totalConverted / 1024).toFixed(1)} KB)`);
  console.log(`Net reduction:         ${Math.abs(totalDiff).toLocaleString()} bytes (${totalPct}%)`);

  return results;
}

convertAll().catch((err) => {
  console.error('Conversion failed:', err);
  process.exit(1);
});
