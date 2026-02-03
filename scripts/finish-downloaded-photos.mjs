import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const DIR = path.resolve(ROOT, 'public', 'images', 'downloaded_photos');
const MAP_PATH = path.join(DIR, 'rename-map.csv');
const FAIL_PATH = path.join(DIR, 'rename-failures-sharp.csv');

function isNumericJpg(fileName) {
  return /^\d+\.jpg$/i.test(fileName);
}

function parseNumberFromNumericJpg(fileName) {
  return Number.parseInt(fileName.replace(/\.jpg$/i, ''), 10);
}

function csvEscape(value) {
  // Existing CSV uses double quotes; escape quotes by doubling.
  const str = String(value);
  return `"${str.replaceAll('"', '""')}"`;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function getMaxMappedIndex() {
  if (!(await fileExists(MAP_PATH))) return 0;

  const text = await fs.readFile(MAP_PATH, 'utf8');
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return 0;

  let max = 0;
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    const match = line.match(/^\s*"(\d+)"\s*,/);
    if (!match) continue;
    const value = Number.parseInt(match[1], 10);
    if (Number.isFinite(value) && value > max) max = value;
  }
  return max;
}

async function readRenameMapByOriginal() {
  if (!(await fileExists(MAP_PATH))) return new Map();
  const text = await fs.readFile(MAP_PATH, 'utf8');
  const lines = text.split(/\r?\n/).filter(Boolean);
  const result = new Map();

  const fieldRegex = /"((?:[^"]|"")*)"/g;
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    const fields = Array.from(line.matchAll(fieldRegex), (m) => m[1].replaceAll('""', '"'));
    if (fields.length < 3) continue;

    const original = fields[1];
    const finalName = fields[2];
    if (!original || !finalName) continue;
    result.set(original.toLowerCase(), finalName);
  }

  return result;
}

async function unlinkWithRetry(filePath, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await fs.unlink(filePath);
      return { ok: true };
    } catch (error) {
      const code = error?.code;
      if ((code === 'EBUSY' || code === 'EPERM') && attempt < attempts) {
        await new Promise((r) => setTimeout(r, 250 * attempt));
        continue;
      }
      return { ok: false, error };
    }
  }
  return { ok: false, error: new Error('unlink failed') };
}

async function main() {
  const dirents = await fs.readdir(DIR, { withFileTypes: true });
  const files = dirents.filter((d) => d.isFile()).map((d) => d.name);

  const maxMapped = await getMaxMappedIndex();
  const mapByOriginal = await readRenameMapByOriginal();
  const numericJpgs = files.filter(isNumericJpg);
  const maxOnDisk = numericJpgs.length ? Math.max(...numericJpgs.map(parseNumberFromNumericJpg)) : 0;
  const maxExisting = Math.max(maxMapped, maxOnDisk);

  const existingNumericJpgNames = new Set(numericJpgs.map((n) => n.toLowerCase()));

  const pngs = files
    .filter((name) => name.toLowerCase().endsWith('.png'))
    .sort((a, b) => a.localeCompare(b, 'en'));

  if (pngs.length === 0) {
    console.log('No .png files found. Nothing to do.');
    return;
  }

  let nextIndex = maxExisting;
  const finalMax = maxExisting + pngs.length;
  const padWidth = Math.max(3, String(finalMax).length);

  const failures = [];
  const appendedLines = [];

  for (const pngName of pngs) {
    const inPath = path.join(DIR, pngName);

    // If this PNG already has a mapped output (from a previous run), only try to delete it.
    const mappedFinal = mapByOriginal.get(pngName.toLowerCase());
    if (mappedFinal) {
      const mappedPath = path.join(DIR, mappedFinal);
      if (await fileExists(mappedPath)) {
        const unlinkResult = await unlinkWithRetry(inPath, 5);
        if (!unlinkResult.ok) {
          failures.push({
            original: pngName,
            reason: `Already converted (${mappedFinal}) but source could not be deleted: ${String(
              unlinkResult.error?.message ?? unlinkResult.error
            )}`,
          });
        } else {
          console.log(`${pngName} deleted (already converted -> ${mappedFinal})`);
        }
        continue;
      }
    }

    // Find next unused numeric jpg name.
    let indexToUse = nextIndex + 1;
    let outName = `${String(indexToUse).padStart(padWidth, '0')}.jpg`;
    while (existingNumericJpgNames.has(outName.toLowerCase())) {
      indexToUse += 1;
      outName = `${String(indexToUse).padStart(padWidth, '0')}.jpg`;
    }

    const outPath = path.join(DIR, outName);

    try {
      if (await fileExists(outPath)) {
        // Resume mode: if a previous run already produced the output, just map it and try deleting the source.
        const unlinkResult = await unlinkWithRetry(inPath, 3);
        if (!unlinkResult.ok) {
          failures.push({
            original: pngName,
            reason: `Converted previously (output exists: ${outName}) but source could not be deleted: ${String(
              unlinkResult.error?.message ?? unlinkResult.error
            )}`,
          });
        }

        appendedLines.push(
          [
            csvEscape(indexToUse),
            csvEscape(pngName),
            csvEscape(outName),
            csvEscape('convert-png-sharp-resume'),
          ].join(',')
        );

        existingNumericJpgNames.add(outName.toLowerCase());
        nextIndex = Math.max(nextIndex, indexToUse);
        console.log(`${pngName} -> ${outName} (resume)`);
        continue;
      }

      const tmpPath = `${outPath}.tmp`;
      if (await fileExists(tmpPath)) {
        await fs.unlink(tmpPath);
      }

      const inputBuffer = await fs.readFile(inPath);
      await sharp(inputBuffer)
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: 92, mozjpeg: true })
        .toFile(tmpPath);

      await fs.rename(tmpPath, outPath);

      const unlinkResult = await unlinkWithRetry(inPath, 3);
      if (!unlinkResult.ok) {
        failures.push({
          original: pngName,
          reason: `Converted to ${outName} but source could not be deleted: ${String(
            unlinkResult.error?.message ?? unlinkResult.error
          )}`,
        });
      }

      appendedLines.push(
        [
          csvEscape(indexToUse),
          csvEscape(pngName),
          csvEscape(outName),
          csvEscape('convert-png-sharp'),
        ].join(',')
      );

      existingNumericJpgNames.add(outName.toLowerCase());
      nextIndex = Math.max(nextIndex, indexToUse);
      console.log(`${pngName} -> ${outName}`);
    } catch (error) {
      failures.push({ original: pngName, reason: String(error?.message ?? error) });
      console.warn(`FAILED: ${pngName}: ${String(error?.message ?? error)}`);
    }
  }

  if (appendedLines.length > 0) {
    const hasMap = await fileExists(MAP_PATH);
    if (!hasMap) {
      const header = ['Index', 'Original', 'Final', 'Action'].map(csvEscape).join(',');
      await fs.writeFile(MAP_PATH, `${header}\r\n${appendedLines.join('\r\n')}\r\n`, 'utf8');
    } else {
      const prefix = (await fs.readFile(MAP_PATH, 'utf8')).endsWith('\n') ? '' : '\r\n';
      await fs.appendFile(MAP_PATH, `${prefix}${appendedLines.join('\r\n')}\r\n`, 'utf8');
    }
  }

  if (failures.length > 0) {
    const header = [csvEscape('Original'), csvEscape('Reason')].join(',');
    const lines = failures.map((f) => [csvEscape(f.original), csvEscape(f.reason)].join(','));
    await fs.writeFile(FAIL_PATH, `${header}\r\n${lines.join('\r\n')}\r\n`, 'utf8');
    console.log(`Wrote failures to ${path.relative(ROOT, FAIL_PATH)}`);
  }

  console.log(`Done. Converted ${appendedLines.length}/${pngs.length} PNG(s). New max index is ${nextIndex}.`);
}

await main();
