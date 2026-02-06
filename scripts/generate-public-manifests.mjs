import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const PUBLIC_DIR = path.join(ROOT, 'public');

function isImageFile(name) {
  return /\.(jpe?g|png|webp|avif)$/i.test(name);
}

function parseLeadingNumber(name) {
  const m = name.match(/^(\d+)\.(jpe?g|png|webp|avif)$/i);
  if (!m) return null;
  const digits = m[1];
  const number = Number.parseInt(digits, 10);
  if (!Number.isFinite(number)) return null;
  return { number, digitsLen: digits.length };
}

async function listDirSafe(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries;
  } catch {
    return [];
  }
}

async function generateGalleryManifest() {
  const galleryDir = path.join(PUBLIC_DIR, 'images', 'gallery');
  const entries = await listDirSafe(galleryDir);

  const candidates = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter(isImageFile);

  // Deduplicate by numeric prefix (prefer 3-digit canonical names like 010.jpg over 0010.jpg)
  const byNumber = new Map();
  for (const name of candidates) {
    const parsed = parseLeadingNumber(name);
    if (!parsed) continue;

    const url = `/images/gallery/${encodeURIComponent(name)}`;
    const current = byNumber.get(parsed.number);
    const next = { name, url, number: parsed.number, digitsLen: parsed.digitsLen };

    if (!current) {
      byNumber.set(parsed.number, next);
      continue;
    }

    const currentScore = current.digitsLen === 3 ? 0 : 1;
    const nextScore = next.digitsLen === 3 ? 0 : 1;
    if (nextScore < currentScore) byNumber.set(parsed.number, next);
  }

  const discovered = Array.from(byNumber.values())
    .sort((a, b) => a.number - b.number)
    .map(({ digitsLen, ...rest }) => rest);

  // If an existing public/gallery.json is present, preserve its ordering.
  // This lets the Gallery Admin UI reorder items without being overwritten by build-time generation.
  const existingPath = path.join(PUBLIC_DIR, 'gallery.json');
  let existingOrder = null;
  try {
    const raw = await fs.readFile(existingPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) existingOrder = parsed;
  } catch {
    existingOrder = null;
  }

  const keyFor = (it) => String(it?.url || (it?.name ? `/images/gallery/${encodeURIComponent(it.name)}` : ''));
  const existingIndexByKey = new Map();
  if (existingOrder) {
    for (let i = 0; i < existingOrder.length; i++) {
      const k = keyFor(existingOrder[i]);
      if (k && !existingIndexByKey.has(k)) existingIndexByKey.set(k, i);
    }
  }

  const ordered = [...discovered].sort((a, b) => {
    const ia = existingIndexByKey.has(a.url) ? existingIndexByKey.get(a.url) : Number.POSITIVE_INFINITY;
    const ib = existingIndexByKey.has(b.url) ? existingIndexByKey.get(b.url) : Number.POSITIVE_INFINITY;
    if (ia !== ib) return ia - ib;
    return a.number - b.number;
  });

  // Renumber sequentially to match displayed order.
  const items = ordered.map((it, i) => ({ name: it.name, url: it.url, number: i + 1 }));

  const outPath = path.join(PUBLIC_DIR, 'gallery.json');
  await fs.writeFile(outPath, JSON.stringify(items, null, 2) + '\n', 'utf8');
  return { outPath, count: items.length };
}

async function generateIntimacyManifest() {
  const intimacyRoot = path.join(PUBLIC_DIR, 'images', 'intimacy');
  const categories = ['bestie', 'family', 'pet'];

  const items = [];
  for (const category of categories) {
    const dir = path.join(intimacyRoot, category);
    const entries = await listDirSafe(dir);
    const files = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter(isImageFile)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    for (const name of files) {
      items.push({
        category,
        name,
        url: `/images/intimacy/${category}/${encodeURIComponent(name)}`
      });
    }
  }

  const outPath = path.join(PUBLIC_DIR, 'intimacy.json');
  await fs.writeFile(outPath, JSON.stringify(items, null, 2) + '\n', 'utf8');
  return { outPath, count: items.length };
}

async function generateProjectsManifest() {
  const projectsRoot = path.join(PUBLIC_DIR, 'images', 'projects');
  const entries = await listDirSafe(projectsRoot);
  const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  const items = [];
  for (const folder of folders) {
    const dir = path.join(projectsRoot, folder);
    const files = (await listDirSafe(dir))
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter(isImageFile)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    if (!files.length) continue;

    const coverCandidate = files.find((f) => /^cover\.(jpe?g|png|webp|avif)$/i.test(f));
    const coverName = coverCandidate || files[0];

    const images = files
      .filter((f) => f !== coverCandidate)
      .map((name) => `/images/projects/${encodeURIComponent(folder)}/${encodeURIComponent(name)}`);

    const coverUrl = `/images/projects/${encodeURIComponent(folder)}/${encodeURIComponent(coverName)}`;
    items.push({ id: folder, coverUrl, images: [coverUrl, ...images] });
  }

  const outPath = path.join(PUBLIC_DIR, 'projects.json');
  await fs.writeFile(outPath, JSON.stringify(items, null, 2) + '\n', 'utf8');
  return { outPath, count: items.length };
}

async function main() {
  const gallery = await generateGalleryManifest();
  const intimacy = await generateIntimacyManifest();
  const projects = await generateProjectsManifest();

  console.log(`[manifests] wrote ${path.relative(ROOT, gallery.outPath)} (${gallery.count} items)`);
  console.log(`[manifests] wrote ${path.relative(ROOT, intimacy.outPath)} (${intimacy.count} items)`);
  console.log(`[manifests] wrote ${path.relative(ROOT, projects.outPath)} (${projects.count} items)`);
}

main().catch((err) => {
  console.error('[manifests] failed', err);
  process.exit(1);
});
