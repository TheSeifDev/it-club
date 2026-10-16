import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

interface ConversionReport {
  originalPath: string;
  webpPath: string;
  originalSize: number;
  newSize: number;
  reductionBytes: number;
  percentageChange: string;
}

const TARGETS = [
  {
    input: "public/logo.png",
    output: "public/logo.webp",
  },
  {
    input: "public/spotlight-stage.jpg",
    output: "public/spotlight-stage.webp",
  },
  {
    input: "public/images/auth-building-night.jpg",
    output: "public/images/auth-building-night.webp",
  },
];

export async function convertImages(): Promise<ConversionReport[]> {
  const reports: ConversionReport[] = [];

  for (const target of TARGETS) {
    const inputPath = path.resolve(process.cwd(), target.input);
    const outputPath = path.resolve(process.cwd(), target.output);

    if (!fs.existsSync(inputPath)) {
      console.warn(`[optimize-images] Warning: File not found: ${target.input}`);
      continue;
    }

    const originalSize = fs.statSync(inputPath).size;

    await sharp(inputPath)
      .webp({
        lossless: true,
        effort: 6,
      })
      .toFile(outputPath);

    const newSize = fs.statSync(outputPath).size;
    const diff = originalSize - newSize;
    const pct = (((newSize - originalSize) / originalSize) * 100).toFixed(2);

    reports.push({
      originalPath: target.input,
      webpPath: target.output,
      originalSize,
      newSize,
      reductionBytes: diff,
      percentageChange: `${pct}%`,
    });
  }

  return reports;
}

if (process.argv[1]?.endsWith("optimize-images.ts") || process.argv[1]?.endsWith("optimize-images.js")) {
  convertImages().then((reports) => {
    console.log("=== Image Conversion Report ===");
    for (const r of reports) {
      console.log(
        `- ${r.originalPath} -> ${r.webpPath} | ${r.originalSize} B -> ${r.newSize} B (${r.percentageChange})`
      );
    }
  });
}
