import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DIR = path.resolve(ROOT, 'public', 'images', 'downloaded_photos');
const MAP_PATH = path.join(DIR, 'rename-map.csv');

function csvEscape(value) {
  const str = String(value);
  return `"${str.replaceAll('"', '""')}"`;
}

function parseQuotedFields(line) {
  const fieldRegex = /"((?:[^"]|"")*)"/g;
  return Array.from(line.matchAll(fieldRegex), (m) => m[1].replaceAll('""', '"'));
}

async function main() {
  const text = await fs.readFile(MAP_PATH, 'utf8');
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) throw new Error('rename-map.csv is empty');

  const header = lines[0];
  const out = [header];

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    const fields = parseQuotedFields(line);
    if (fields.length < 4) {
      out.push(line);
      continue;
    }

    const index = Number.parseInt(fields[0], 10);
    const original = fields[1];
    const action = fields[3];

    if (Number.isFinite(index) && index >= 239) {
      const newIndex = index - 1;
      const newFinal = `${String(newIndex).padStart(3, '0')}.jpg`;
      out.push([csvEscape(newIndex), csvEscape(original), csvEscape(newFinal), csvEscape(action)].join(','));
    } else {
      out.push(line);
    }
  }

  await fs.writeFile(MAP_PATH, `${out.join('\r\n')}\r\n`, 'utf8');
  console.log(`Normalized ${path.relative(ROOT, MAP_PATH)} (shifted indices >= 239 down by 1).`);
}

await main();
