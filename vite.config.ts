import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const PUBLIC_DIR = path.resolve(__dirname, 'public');
const FASHION_CONFIG_FILE = path.join(PUBLIC_DIR, 'fashion-wall-config.json');
const FASHION_MANIFEST_FILE = path.join(PUBLIC_DIR, 'fashion-wall.json');
const FASHION_SOURCE_SETS = [
  {
    label: 'images/instagram-harrytwstudio',
    dir: path.join(PUBLIC_DIR, 'images', 'instagram-harrytwstudio'),
  },
  {
    label: 'images/IG portfolio',
    dir: path.join(PUBLIC_DIR, 'images', 'IG portfolio'),
  },
  {
    label: 'images/gallery',
    dir: path.join(PUBLIC_DIR, 'images', 'gallery'),
  },
];
const FASHION_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.webp', '.avif', '.tif', '.tiff', '.heic', '.heif']);
const DEFAULT_FASHION_WALL_CONFIG = {
  sections: {
    fashionWall: {
      label: '首頁時尚動態牆',
      sourceSet: 'images/IG portfolio',
      limit: 72,
      included: [] as number[],
      excluded: [] as number[],
      autoExcluded: [1, 2, 36, 96, 97, 100, 116, 124, 125, 165],
      autoExcludedRanges: [
        [38, 43],
        [154, 161],
        [166, 315],
      ] as [number, number][],
    },
  },
};

function sendJson(res: any, payload: unknown, statusCode = 200) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function writeJsonFile(filePath: string, payload: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function readRequestJson(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    let bytes = 0;

    req.on('data', (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > 2_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      body += chunk;
    });

    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (err: any) {
        reject(new Error(err?.message || 'Invalid JSON'));
      }
    });

    req.on('error', reject);
  });
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function normalizeNumberList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map(Number)
        .filter((item) => Number.isInteger(item) && item > 0)
    )
  ).sort((a, b) => a - b);
}

function normalizeRanges(value: unknown): [number, number][] {
  if (!Array.isArray(value)) return [];
  return value
    .map((pair) => {
      if (!Array.isArray(pair) || pair.length !== 2) return null;
      const start = Number(pair[0]);
      const end = Number(pair[1]);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start <= 0 || end < start) return null;
      return [start, end] as [number, number];
    })
    .filter((pair): pair is [number, number] => Boolean(pair));
}

function expandNumberRanges(ranges: [number, number][] = []) {
  return ranges.flatMap(([start, end]) => range(start, end));
}

function normalizeFashionWallConfig(input: any) {
  const base = DEFAULT_FASHION_WALL_CONFIG.sections.fashionWall;
  const section = input?.sections?.fashionWall || input?.fashionWall || {};
  const rawLimit = Number(section.limit ?? base.limit);
  const limit = Number.isInteger(rawLimit) ? Math.min(144, Math.max(12, rawLimit)) : base.limit;

  return {
    sections: {
      fashionWall: {
        ...base,
        ...section,
        label: String(section.label || base.label),
        sourceSet: String(section.sourceSet || base.sourceSet),
        limit,
        included: normalizeNumberList(section.included ?? base.included),
        excluded: normalizeNumberList(section.excluded ?? base.excluded),
        autoExcluded: normalizeNumberList(section.autoExcluded ?? base.autoExcluded),
        autoExcludedRanges: normalizeRanges(section.autoExcludedRanges ?? base.autoExcludedRanges),
      },
    },
  };
}

function readFashionWallConfig() {
  return normalizeFashionWallConfig(readJsonFile(FASHION_CONFIG_FILE, DEFAULT_FASHION_WALL_CONFIG));
}

function availableSourceSets() {
  return FASHION_SOURCE_SETS.map((sourceSet) => {
    let count = 0;
    try {
      count = fs
        .readdirSync(sourceSet.dir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && FASHION_IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())).length;
    } catch {
      count = 0;
    }
    return { label: sourceSet.label, count };
  });
}

function pickSourceSet(label: string) {
  const preferred = FASHION_SOURCE_SETS.find((sourceSet) => sourceSet.label === label);
  const ordered = preferred
    ? [preferred, ...FASHION_SOURCE_SETS.filter((sourceSet) => sourceSet !== preferred)]
    : FASHION_SOURCE_SETS;

  for (const sourceSet of ordered) {
    if (!fs.existsSync(sourceSet.dir)) continue;
    const count = fs
      .readdirSync(sourceSet.dir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && FASHION_IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())).length;
    if (count > 0) return sourceSet;
  }

  return ordered[0];
}

function publicImageUrl(sourceSetLabel: string, fileName: string) {
  return `/${[...sourceSetLabel.split('/'), fileName].map(encodeURIComponent).join('/')}`;
}

function fashionAdminData() {
  const config = readFashionWallConfig();
  const wall = config.sections.fashionWall;
  const sourceSet = pickSourceSet(wall.sourceSet);
  const manifest = readJsonFile<any[]>(FASHION_MANIFEST_FILE, []);
  const selectedNumbers = new Set(
    Array.isArray(manifest)
      ? manifest
          .filter((item) => item?.sourceSet === sourceSet.label)
          .map((item) => Number(item?.sourceNumber))
          .filter(Number.isInteger)
      : []
  );
  const included = new Set(wall.included);
  const excluded = new Set(wall.excluded);
  const autoExcluded = new Set([...wall.autoExcluded, ...expandNumberRanges(wall.autoExcludedRanges)]);

  let files: fs.Dirent[] = [];
  try {
    files = fs.readdirSync(sourceSet.dir, { withFileTypes: true });
  } catch {
    files = [];
  }

  const items = files
    .filter((entry) => entry.isFile() && FASHION_IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }))
    .map((entry, index) => {
      const sourceNumber = index + 1;
      const filePath = path.join(sourceSet.dir, entry.name);
      const stat = fs.statSync(filePath);
      return {
        sourceNumber,
        name: entry.name,
        url: publicImageUrl(sourceSet.label, entry.name),
        size: stat.size,
        selected: selectedNumbers.has(sourceNumber),
        manualIncluded: included.has(sourceNumber),
        manualExcluded: excluded.has(sourceNumber),
        autoExcluded: autoExcluded.has(sourceNumber),
      };
    });

  return {
    config,
    sourceSet: sourceSet.label,
    sourceSets: availableSourceSets(),
    currentCount: selectedNumbers.size,
    items,
  };
}

function runMediaGenerator() {
  return new Promise<{ output: string[] }>((resolve, reject) => {
    execFile(
      process.execPath,
      ['scripts/generate-optimized-media.mjs'],
      { cwd: __dirname, windowsHide: true, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        const output = `${stdout || ''}\n${stderr || ''}`
          .trim()
          .split(/\r?\n/)
          .filter(Boolean)
          .slice(-20);

        if (error) {
          reject(Object.assign(error, { output }));
          return;
        }

        resolve({ output });
      }
    );
  });
}

// Plugin to handle gallery.json & pages.json save + image scanning
function galleryApiPlugin(): Plugin {
  return {
    name: 'gallery-api',
    configureServer(server) {
      server.middlewares.use('/api/fashion-wall-admin-data', (req, res) => {
        if (req.method !== 'GET') {
          sendJson(res, { error: 'Method not allowed' }, 405);
          return;
        }

        try {
          sendJson(res, fashionAdminData());
        } catch (err: any) {
          sendJson(res, { error: err?.message || 'Failed to load fashion wall data' }, 500);
        }
      });

      server.middlewares.use('/api/save-fashion-wall-config', async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, { error: 'Method not allowed' }, 405);
          return;
        }

        try {
          const body = await readRequestJson(req);
          const config = normalizeFashionWallConfig(body?.config || body);
          writeJsonFile(FASHION_CONFIG_FILE, config);
          sendJson(res, { success: true, config });
        } catch (err: any) {
          sendJson(res, { error: err?.message || 'Failed to save fashion wall config' }, 500);
        }
      });

      server.middlewares.use('/api/generate-fashion-wall', async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, { error: 'Method not allowed' }, 405);
          return;
        }

        try {
          const body = await readRequestJson(req);
          if (body?.config) {
            const config = normalizeFashionWallConfig(body.config);
            writeJsonFile(FASHION_CONFIG_FILE, config);
          }

          const result = await runMediaGenerator();
          sendJson(res, { success: true, output: result.output, data: fashionAdminData() });
        } catch (err: any) {
          sendJson(res, {
            error: err?.message || 'Failed to regenerate fashion wall',
            output: Array.isArray(err?.output) ? err.output : [],
          }, 500);
        }
      });

      // Save gallery.json
      server.middlewares.use('/api/save-gallery', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const filePath = path.resolve(__dirname, 'public/gallery.json');
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });

      // Save pages.json
      server.middlewares.use('/api/save-pages', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const filePath = path.resolve(__dirname, 'public/pages.json');
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });

      // Scan images in a directory
      server.middlewares.use('/api/scan-images', (req, res) => {
        try {
          const url = new URL(req.url || '/', `http://${req.headers.host}`);
          const dir = url.searchParams.get('dir') || '';
          // Sanitize: only allow alphanumeric, dash, underscore, slash
          const safeDir = dir.replace(/[^a-zA-Z0-9\-_\/]/g, '');
          const dirPath = path.resolve(__dirname, 'public/images', safeDir);

          // Prevent directory traversal
          const publicImages = path.resolve(__dirname, 'public/images');
          if (!dirPath.startsWith(publicImages)) {
            res.statusCode = 403;
            res.end(JSON.stringify({ error: 'Forbidden' }));
            return;
          }

          if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify([]));
            return;
          }

          const scanDir = (dir: string, prefix: string): string[] => {
            const results: string[] = [];
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
              if (entry.isDirectory()) {
                results.push(...scanDir(path.join(dir, entry.name), rel));
              } else if (/\.(jpe?g|png|webp|avif)$/i.test(entry.name)) {
                results.push(`/images/${safeDir}/${rel}`);
              }
            }
            return results;
          };

          const files = scanDir(dirPath, '').sort();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(files));
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:8787',
            changeOrigin: true,
          },
          '/uploads': {
            target: 'http://localhost:8787',
            changeOrigin: true,
          },
        },
      },
      plugins: [react(), galleryApiPlugin()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        target: 'es2020',
        minify: 'esbuild',
        cssMinify: true,
        sourcemap: false,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
            },
          },
        },
        chunkSizeWarningLimit: 500,
      },
      optimizeDeps: {
        include: ['react', 'react-dom'],
      },
    };
});
