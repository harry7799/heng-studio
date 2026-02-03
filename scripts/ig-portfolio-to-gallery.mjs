import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();

const IG_DIR_CANDIDATES = [
  path.join(projectRoot, 'public', 'images', 'IG portfolio'),
  path.join(projectRoot, 'public', 'images', 'ig-portfolio'),
];

const OUTPUT_DIR = path.join(projectRoot, 'public', 'images', 'gallery');
const MAP_CSV = path.join(OUTPUT_DIR, 'rename-map.csv');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.avif', '.heic', '.heif']);

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[\n\r\",]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function findInputDir() {
  for (const candidate of IG_DIR_CANDIDATES) {
    if (await pathExists(candidate)) return candidate;
  }
  throw new Error(
    `Could not find input folder. Looked for:\n- ${IG_DIR_CANDIDATES.join('\n- ')}`
  );
}

async function listImageFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXTS.has(ext)) continue;
    files.push(entry.name);
  }
  files.sort((a, b) => a.localeCompare(b, 'en'));
  return files;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function appendCsvLine(line) {
  const exists = await pathExists(MAP_CSV);
  if (!exists) {
    await fs.writeFile(MAP_CSV, 'index,output,source\n', 'utf8');
  }
  await fs.appendFile(MAP_CSV, line + '\n', 'utf8');
}

async function main() {
  const inputDir = await findInputDir();
  await ensureDir(OUTPUT_DIR);

  const files = await listImageFiles(inputDir);
  if (files.length === 0) {
    console.log(`No image files found in: ${inputDir}`);
    return;
  }

  console.log(`Input:  ${inputDir}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Found ${files.length} images. Converting/renaming to 001.jpg ...`);

  let written = 0;
  let skipped = 0;

  for (let i = 0; i < files.length; i++) {
    const index = i + 1;
    const outName = `${String(index).padStart(3, '0')}.jpg`;
    const outPath = path.join(OUTPUT_DIR, outName);

    if (await pathExists(outPath)) {
      skipped++;
      continue;
    }

    const inName = files[i];
    const inPath = path.join(inputDir, inName);

    try {
      // Normalize orientation and re-encode to consistent .jpg
      await sharp(inPath, { failOn: 'none' })
        .rotate()
        .jpeg({ quality: 88, progressive: true, mozjpeg: true })
        .toFile(outPath);

      const relIn = toPosix(path.relative(projectRoot, inPath));
      const relOut = toPosix(path.relative(projectRoot, outPath));
      await appendCsvLine(`${index},${csvEscape(relOut)},${csvEscape(relIn)}`);
      written++;

      if (written % 25 === 0) {
        console.log(`...written ${written} (skipped ${skipped})`);
      }
    } catch (err) {
      console.error(`Failed: ${inName}`);
      console.error(err);
    }
  }

  console.log(`Done. Written: ${written}, Skipped(existing): ${skipped}`);
  console.log(`Map: ${MAP_CSV}`);
}

await main();
