import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(process.cwd());
const PUBLIC_DIR = path.join(ROOT, 'public');
const OPTIMIZED_DIR = path.join(PUBLIC_DIR, 'images', 'optimized');
const FASHION_DIR = path.join(PUBLIC_DIR, 'images', 'fashion-wall');
const FASHION_CONFIG_PATH = path.join(PUBLIC_DIR, 'fashion-wall-config.json');
const FASHION_WALL_LIMIT = 72;
const FASHION_SOURCE_DIRS = [
  path.join(PUBLIC_DIR, 'images', 'instagram-harrytwstudio'),
  path.join(PUBLIC_DIR, 'images', 'IG portfolio'),
  path.join(PUBLIC_DIR, 'images', 'gallery'),
];
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.webp', '.avif', '.tif', '.tiff', '.heic', '.heif']);
const FASHION_WALL_WIDTH = 640;
const FASHION_WALL_HEIGHT = 920;

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

const DEFAULT_FASHION_WALL_CONFIG = {
  sections: {
    fashionWall: {
      label: 'Homepage Fashion Wall',
      sourceSet: 'images/IG portfolio',
      limit: FASHION_WALL_LIMIT,
      included: [],
      excluded: [],
      autoExcluded: [1, 2, 36, 96, 97, 100, 116, 124, 125, 165],
      autoExcludedRanges: [
        [38, 43],
        [154, 161],
        [166, 315],
      ],
    },
  },
};

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function expandNumberRanges(ranges = []) {
  const expanded = [];
  for (const pair of ranges) {
    if (!Array.isArray(pair) || pair.length !== 2) continue;
    const start = Number(pair[0]);
    const end = Number(pair[1]);
    if (!Number.isInteger(start) || !Number.isInteger(end) || end < start) continue;
    expanded.push(...range(start, end));
  }
  return expanded;
}

async function loadFashionWallConfig() {
  const config = await readJson(FASHION_CONFIG_PATH, DEFAULT_FASHION_WALL_CONFIG);
  const wall = {
    ...DEFAULT_FASHION_WALL_CONFIG.sections.fashionWall,
    ...(config?.sections?.fashionWall || {}),
  };

  return {
    ...wall,
    limit: Number.isInteger(Number(wall.limit)) ? Number(wall.limit) : FASHION_WALL_LIMIT,
    included: Array.isArray(wall.included) ? wall.included.map(Number).filter(Number.isInteger) : [],
    excluded: Array.isArray(wall.excluded) ? wall.excluded.map(Number).filter(Number.isInteger) : [],
    autoExcluded: Array.isArray(wall.autoExcluded) ? wall.autoExcluded.map(Number).filter(Number.isInteger) : [],
    autoExcludedRanges: Array.isArray(wall.autoExcludedRanges) ? wall.autoExcludedRanges : [],
  };
}

async function isFresh(source, target) {
  try {
    const [sourceStat, targetStat] = await Promise.all([fs.stat(source), fs.stat(target)]);
    return targetStat.mtimeMs >= sourceStat.mtimeMs;
  } catch {
    return false;
  }
}

function publicPathToFilePath(publicPath) {
  const clean = publicPath.replace(/^\/+/, '').split('/').map(decodeURIComponent);
  return path.join(PUBLIC_DIR, ...clean);
}

function toPublicPath(filePath) {
  return `/${path.relative(PUBLIC_DIR, filePath).split(path.sep).map(encodeURIComponent).join('/')}`;
}

async function listImageFiles(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
      .map((entry) => path.join(dir, entry.name))
      .sort((a, b) => path.basename(a).localeCompare(path.basename(b), 'en', { numeric: true }));
  } catch {
    return [];
  }
}

function fashionSourceLabel(dir) {
  return path.relative(PUBLIC_DIR, dir).split(path.sep).join('/');
}

async function findFashionSources(preferredLabel) {
  const preferredDir = FASHION_SOURCE_DIRS.find((dir) => fashionSourceLabel(dir) === preferredLabel);
  const orderedDirs = preferredDir
    ? [preferredDir, ...FASHION_SOURCE_DIRS.filter((dir) => dir !== preferredDir)]
    : FASHION_SOURCE_DIRS;

  for (const dir of orderedDirs) {
    const files = await listImageFiles(dir);
    if (!files.length) continue;
    return {
      label: fashionSourceLabel(dir),
      items: files.map((filePath, index) => ({
        number: index + 1,
        url: toPublicPath(filePath),
        source: filePath,
      })),
    };
  }

  return { label: 'none', items: [] };
}

function pickEvenly(items, limit) {
  if (items.length <= limit) return items;

  const picked = [];
  const used = new Set();
  for (let i = 0; i < limit; i += 1) {
    const index = Math.round((i * (items.length - 1)) / (limit - 1));
    if (used.has(index)) continue;
    used.add(index);
    picked.push(items[index]);
  }

  return picked;
}

function pickEvenlyWithForced(sortedItems, limit) {
  if (sortedItems.length <= limit) return sortedItems;

  const forced = sortedItems.filter((item) => item.forced);
  const remainingSlots = Math.max(0, limit - forced.length);
  const picked = new Set(forced.map((item) => item.number));

  for (const item of pickEvenly(sortedItems.filter((item) => !item.forced), remainingSlots)) {
    picked.add(item.number);
  }

  return sortedItems.filter((item) => picked.has(item.number));
}

async function writeFashionWallImage(source, target) {
  const metadata = await sharp(source, { failOn: 'none' }).metadata();
  const sourceAspect = metadata.width && metadata.height ? metadata.width / metadata.height : FASHION_WALL_WIDTH / FASHION_WALL_HEIGHT;
  const targetAspect = FASHION_WALL_WIDTH / FASHION_WALL_HEIGHT;
  const needsContainedLayout = sourceAspect > targetAspect * 1.18 || sourceAspect < targetAspect * 0.82;

  if (!needsContainedLayout) {
    await sharp(source, { failOn: 'none' })
      .rotate()
      .resize({
        width: FASHION_WALL_WIDTH,
        height: FASHION_WALL_HEIGHT,
        fit: 'cover',
        position: sharp.strategy.attention,
      })
      .webp({ quality: 78, effort: 4 })
      .toFile(target);
    return 'cover';
  }

  const background = await sharp(source, { failOn: 'none' })
    .rotate()
    .resize({
      width: FASHION_WALL_WIDTH,
      height: FASHION_WALL_HEIGHT,
      fit: 'cover',
      position: sharp.strategy.attention,
    })
    .blur(24)
    .modulate({ brightness: 0.58, saturation: 0.82 })
    .toBuffer();

  const foreground = await sharp(source, { failOn: 'none' })
    .rotate()
    .resize({
      width: FASHION_WALL_WIDTH,
      height: FASHION_WALL_HEIGHT,
      fit: 'inside',
      withoutEnlargement: false,
    })
    .toBuffer({ resolveWithObject: true });

  await sharp(background)
    .composite([
      {
        input: foreground.data,
        left: Math.round((FASHION_WALL_WIDTH - foreground.info.width) / 2),
        top: Math.round((FASHION_WALL_HEIGHT - foreground.info.height) / 2),
      },
    ])
    .webp({ quality: 80, effort: 4 })
    .toFile(target);

  return 'contained';
}

function rgbToHsl(r, g, b) {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;
  const max = Math.max(nr, ng, nb);
  const min = Math.min(nr, ng, nb);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { hue: 0, saturation: 0, lightness };
  }

  const d = max - min;
  const saturation = lightness > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hue;

  switch (max) {
    case nr:
      hue = (ng - nb) / d + (ng < nb ? 6 : 0);
      break;
    case ng:
      hue = (nb - nr) / d + 2;
      break;
    default:
      hue = (nr - ng) / d + 4;
      break;
  }

  return { hue: hue * 60, saturation, lightness };
}

function hueToRainbowOrder(hue) {
  if (hue >= 330 || hue < 18) return 0;
  return Math.min(hue, 315);
}

function classifyPalette({ avgLightness, avgSaturation, whiteRatio, darkRatio, dominantHue }) {
  if (whiteRatio > 0.34 || (avgLightness > 0.72 && avgSaturation < 0.26)) {
    return {
      group: 'white',
      groupOrder: 0,
      sortValue: 1 - whiteRatio + (1 - avgLightness) * 0.25,
    };
  }

  if (darkRatio > 0.48 || avgLightness < 0.24) {
    return {
      group: 'black',
      groupOrder: 2,
      sortValue: avgLightness - darkRatio * 0.2,
    };
  }

  return {
    group: 'rainbow',
    groupOrder: 1,
    sortValue: hueToRainbowOrder(dominantHue),
  };
}

async function analyzePalette(filePath) {
  const { data, info } = await sharp(filePath)
    .resize({ width: 40, height: 56, fit: 'cover', position: sharp.strategy.attention })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixelCount = info.width * info.height;
  let lightnessTotal = 0;
  let saturationTotal = 0;
  let whiteCount = 0;
  let darkCount = 0;
  let hueX = 0;
  let hueY = 0;
  let hueWeightTotal = 0;

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const { hue, saturation, lightness } = rgbToHsl(r, g, b);

    lightnessTotal += lightness;
    saturationTotal += saturation;

    if (lightness > 0.74 && saturation < 0.34) whiteCount += 1;
    if (lightness < 0.22) darkCount += 1;

    if (saturation > 0.16 && lightness > 0.18 && lightness < 0.92) {
      const weight = saturation * (0.45 + Math.min(lightness, 0.82));
      const radians = (hue * Math.PI) / 180;
      hueX += Math.cos(radians) * weight;
      hueY += Math.sin(radians) * weight;
      hueWeightTotal += weight;
    }
  }

  const avgLightness = lightnessTotal / pixelCount;
  const avgSaturation = saturationTotal / pixelCount;
  const whiteRatio = whiteCount / pixelCount;
  const darkRatio = darkCount / pixelCount;
  const rawHue =
    hueWeightTotal > 0 ? (Math.atan2(hueY, hueX) * 180) / Math.PI : 0;
  const dominantHue = rawHue < 0 ? rawHue + 360 : rawHue;
  const palette = { avgLightness, avgSaturation, whiteRatio, darkRatio, dominantHue };

  return {
    ...palette,
    ...classifyPalette(palette),
  };
}

async function generateHero() {
  const source = path.join(PUBLIC_DIR, 'images', 'hero-cover.jpg');
  const heroTarget = path.join(OPTIMIZED_DIR, 'hero-cover.webp');
  const ogTarget = path.join(OPTIMIZED_DIR, 'hero-og.jpg');
  let generated = 0;

  if (!(await isFresh(source, heroTarget))) {
    await sharp(source)
      .rotate()
      .resize({ width: 2200, withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toFile(heroTarget);
    generated += 1;
  }

  if (!(await isFresh(source, ogTarget))) {
    await sharp(source)
      .rotate()
      .resize({
        width: 1200,
        height: 630,
        fit: 'cover',
        position: sharp.strategy.attention,
      })
      .jpeg({ quality: 84, mozjpeg: true })
      .toFile(ogTarget);
    generated += 1;
  }

  return { generated };
}

async function generateFashionWall() {
  const wallConfig = await loadFashionWallConfig();
  const { label: sourceLabel, items } = await findFashionSources(wallConfig.sourceSet);
  const included = new Set(wallConfig.included);
  const manualExcluded = new Set(wallConfig.excluded);
  const autoExcluded = new Set([
    ...wallConfig.autoExcluded,
    ...expandNumberRanges(wallConfig.autoExcludedRanges),
  ]);
  const existingManifest = await readJson(path.join(PUBLIC_DIR, 'fashion-wall.json'), []);
  const previousOriginalBySrc = new Map(
    Array.isArray(existingManifest)
      ? existingManifest.map((item) => [item?.src, item?.original])
      : []
  );
  const previousLayoutBySrc = new Map(
    Array.isArray(existingManifest)
      ? existingManifest.map((item) => [item?.src, item?.layout])
      : []
  );
  let generated = 0;
  let excludedCount = 0;

  const candidates = [];
  for (const item of items) {
    if (!item?.url || !item?.source) continue;
    const forced = included.has(item.number);
    if (!forced && (manualExcluded.has(item.number) || autoExcluded.has(item.number))) {
      excludedCount += 1;
      continue;
    }

    try {
      const palette = await analyzePalette(item.source);
      candidates.push({ ...item, forced, palette });
    } catch (error) {
      console.warn(`[media] skipped ${path.basename(item.source)} (${error?.message ?? error})`);
    }
  }

  const sorted = candidates.sort((a, b) => {
    if (a.palette.groupOrder !== b.palette.groupOrder) {
      return a.palette.groupOrder - b.palette.groupOrder;
    }
    if (a.palette.sortValue !== b.palette.sortValue) {
      return a.palette.sortValue - b.palette.sortValue;
    }
    return a.number - b.number;
  });
  const selected = pickEvenlyWithForced(sorted, Math.max(1, wallConfig.limit));

  const manifest = [];
  for (let index = 0; index < selected.length; index += 1) {
    const item = selected[index];
    const fileName = `${String(index + 1).padStart(3, '0')}.webp`;
    const src = `/images/fashion-wall/${fileName}`;
    const target = path.join(FASHION_DIR, fileName);
    const sameSourceAtRank = previousOriginalBySrc.get(src) === item.url;
    const previousLayout = previousLayoutBySrc.get(src);
    let layout = previousLayout || 'cover';

    if (!sameSourceAtRank || !previousLayout || !(await isFresh(item.source, target))) {
      layout = await writeFashionWallImage(item.source, target);
      generated += 1;
    }

    manifest.push({
      number: index + 1,
      sourceNumber: item.number,
      src,
      original: item.url,
      sourceSet: sourceLabel,
      layout,
      palette: {
        group: item.palette.group,
        hue: Math.round(item.palette.dominantHue),
        lightness: Number(item.palette.avgLightness.toFixed(3)),
        saturation: Number(item.palette.avgSaturation.toFixed(3)),
      },
    });
  }

  await fs.writeFile(path.join(PUBLIC_DIR, 'fashion-wall.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  return { count: manifest.length, generated, sourceCount: candidates.length, excluded: excludedCount, sourceLabel };
}

async function main() {
  await ensureDir(OPTIMIZED_DIR);
  await ensureDir(FASHION_DIR);

  const hero = await generateHero();
  const fashion = await generateFashionWall();

  console.log(`[media] hero optimized (${hero.generated ? 'generated' : 'fresh'})`);
  console.log(
    `[media] fashion wall ${fashion.count}/${fashion.sourceCount} items from ${fashion.sourceLabel} (${fashion.excluded} excluded, ${fashion.generated} generated)`
  );
}

main().catch((err) => {
  console.error('[media] failed', err);
  process.exit(1);
});
