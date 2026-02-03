import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'data', 'projects.json');
const BACKUP_DIR = path.join(__dirname, 'data', 'backups');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

const ADMIN_TOKEN = (process.env.ADMIN_TOKEN || '').trim();

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!ADMIN_TOKEN) {
    return res.status(503).json({ error: 'Admin is not configured. Set ADMIN_TOKEN on the API server.' });
  }

  const provided = String(req.header('x-admin-token') || '').trim();
  if (!provided || provided !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

const categoryEnum = z.enum(['Fashion', 'Wedding', 'Kunqu Opera', 'Dance/Theater', 'Styling']);

const metadataSchema = z
  .object({
    iso: z.string().min(1),
    aperture: z.string().min(1),
    shutter: z.string().min(1),
    date: z.string().min(1)
  })
  .partial()
  .refine(
    (m) => {
      const hasAny = Object.values(m).some((v) => typeof v === 'string' && v.trim().length > 0);
      const hasAll = ['iso', 'aperture', 'shutter', 'date'].every(
        (k) => typeof (m as any)[k] === 'string' && (m as any)[k].trim().length > 0
      );
      return !hasAny || hasAll;
    },
    { message: 'metadata must be either omitted/empty or include iso/aperture/shutter/date' }
  );

const projectCreateSchema = z.object({
  title: z.string().min(1).max(120),
  category: categoryEnum,
  imageUrl: z
    .string()
    .min(1)
    .refine(
      (v) => {
        const trimmed = v.trim();
        if (trimmed.startsWith('/uploads/')) return true;
        try {
          new URL(trimmed);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'imageUrl must be an absolute URL or a local path starting with /uploads/' }
    ),
  metadata: metadataSchema.optional()
});

const projectUpdateSchema = projectCreateSchema.partial().refine((obj) => Object.keys(obj).length > 0, {
  message: 'At least one field is required'
});

type StoredProject = {
  id: string;
  title: string;
  category: z.infer<typeof categoryEnum>;
  imageUrl: string;
  metadata?: {
    iso: string;
    aperture: string;
    shutter: string;
    date: string;
  };
};

async function readProjects(): Promise<StoredProject[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data as StoredProject[];
    return [];
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
      await writeProjects([]);
      return [];
    }
    throw err;
  }
}

async function writeProjects(projects: StoredProject[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });

  // Best-effort backup of current file before overwriting.
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `projects.${stamp}.json`);
    await fs.writeFile(backupPath, raw, 'utf-8');

    // Keep only the most recent 20 backups.
    const entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && e.name.startsWith('projects.') && e.name.endsWith('.json'))
      .map((e) => e.name)
      .sort()
      .reverse();
    const toDelete = files.slice(20);
    await Promise.all(toDelete.map((name) => fs.unlink(path.join(BACKUP_DIR, name)).catch(() => undefined)));
  } catch (err: any) {
    if (err?.code !== 'ENOENT') {
      // ignore backup errors
    }
  }

  const tmp = DATA_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(projects, null, 2) + '\n', 'utf-8');
  await fs.rename(tmp, DATA_FILE);
}

function normalizeMetadata(input: any): StoredProject['metadata'] | undefined {
  if (!input) return undefined;
  const keys = ['iso', 'aperture', 'shutter', 'date'] as const;
  const hasAny = keys.some((k) => typeof input[k] === 'string' && input[k].trim().length > 0);
  if (!hasAny) return undefined;
  return {
    iso: String(input.iso).trim(),
    aperture: String(input.aperture).trim(),
    shutter: String(input.shutter).trim(),
    date: String(input.date).trim()
  };
}

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Admin-Token']
  })
);

app.use('/uploads', express.static(UPLOAD_DIR));

const upload = multer({
  storage: multer.diskStorage({
    destination: async (_req, _file, cb) => {
      try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        cb(null, UPLOAD_DIR);
      } catch (e) {
        cb(e as any, UPLOAD_DIR);
      }
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').slice(0, 12);
      const name = `${crypto.randomUUID()}${ext}`;
      cb(null, name);
    }
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const okMime = typeof file.mimetype === 'string' && file.mimetype.startsWith('image/');
    const ext = path.extname(file.originalname || '').toLowerCase();
    const okExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'].includes(ext);
    if (okMime && okExt) return cb(null, true);
    cb(new Error('Only image uploads are allowed'));
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

const GALLERY_DIR = path.join(__dirname, '..', 'public', 'images', 'gallery');

app.get('/api/gallery', async (_req, res) => {
  try {
    const entries = await fs.readdir(GALLERY_DIR, { withFileTypes: true });
    const candidates = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((name) => /\.(jpe?g|png|webp|avif)$/i.test(name));

    const byNumber = new Map<
      number,
      { name: string; url: string; number: number; digitsLen: number }
    >();

    for (const name of candidates) {
      const m = name.match(/^(\d+)\.(jpe?g|png|webp|avif)$/i);
      if (!m) continue;
      const digits = m[1];
      const number = Number.parseInt(digits, 10);
      if (!Number.isFinite(number)) continue;

      const url = `/images/gallery/${encodeURIComponent(name)}`;
      const current = byNumber.get(number);
      const next = { name, url, number, digitsLen: digits.length };

      if (!current) {
        byNumber.set(number, next);
        continue;
      }

      // Prefer canonical 3-digit names (e.g. 010.jpg) over odd 4-digit ones (e.g. 0010.jpg).
      const currentScore = current.digitsLen === 3 ? 0 : 1;
      const nextScore = next.digitsLen === 3 ? 0 : 1;
      if (nextScore < currentScore) {
        byNumber.set(number, next);
      }
    }

    const items = Array.from(byNumber.values())
      .sort((a, b) => a.number - b.number)
      .map((i) => ({ name: i.name, url: i.url, number: i.number }));

    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to read gallery', detail: String(err?.message || err) });
  }
});

app.get('/api/media', requireAdmin, async (_req, res) => {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const entries = await fs.readdir(UPLOAD_DIR, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile()).map((e) => e.name);

  const items = await Promise.all(
    files.map(async (name) => {
      const stat = await fs.stat(path.join(UPLOAD_DIR, name));
      return {
        name,
        url: `/uploads/${encodeURIComponent(name)}`,
        size: stat.size,
        mtimeMs: stat.mtimeMs
      };
    })
  );

  items.sort((a, b) => b.mtimeMs - a.mtimeMs);
  res.json(items);
});

app.post('/api/uploads', requireAdmin, upload.single('file'), async (req, res) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  res.json({
    ok: true,
    item: {
      name: file.filename,
      url: `/uploads/${encodeURIComponent(file.filename)}`,
      size: file.size,
      mtimeMs: Date.now()
    }
  });
});

app.get('/api/projects', async (_req, res) => {
  const projects = await readProjects();
  res.json(projects);
});

app.get('/api/projects/:id', async (req, res) => {
  const projects = await readProjects();
  const found = projects.find((p) => p.id === req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  res.json(found);
});

app.post('/api/projects', requireAdmin, async (req, res) => {
  const parsed = projectCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', issues: parsed.error.issues });

  const projects = await readProjects();
  const project: StoredProject = {
    id: crypto.randomUUID(),
    title: parsed.data.title,
    category: parsed.data.category,
    imageUrl: parsed.data.imageUrl,
    metadata: normalizeMetadata(parsed.data.metadata)
  };
  projects.unshift(project);
  await writeProjects(projects);
  res.status(201).json(project);
});

app.put('/api/projects/:id', requireAdmin, async (req, res) => {
  const parsed = projectCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', issues: parsed.error.issues });

  const projects = await readProjects();
  const idx = projects.findIndex((p) => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });

  const next: StoredProject = {
    id: projects[idx].id,
    title: parsed.data.title,
    category: parsed.data.category,
    imageUrl: parsed.data.imageUrl,
    metadata: normalizeMetadata(parsed.data.metadata)
  };

  projects[idx] = next;
  await writeProjects(projects);
  res.json(next);
});

app.patch('/api/projects/:id', requireAdmin, async (req, res) => {
  const parsed = projectUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', issues: parsed.error.issues });

  const projects = await readProjects();
  const idx = projects.findIndex((p) => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });

  const current = projects[idx];
  const next: StoredProject = {
    ...current,
    ...parsed.data,
    metadata: parsed.data.metadata === undefined ? current.metadata : normalizeMetadata(parsed.data.metadata)
  };

  projects[idx] = next;
  await writeProjects(projects);
  res.json(next);
});

app.delete('/api/projects/:id', requireAdmin, async (req, res) => {
  const projects = await readProjects();
  const idx = projects.findIndex((p) => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });

  const [deleted] = projects.splice(idx, 1);
  await writeProjects(projects);
  res.json({ ok: true, deleted });
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
