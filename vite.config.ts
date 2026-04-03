import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin to handle gallery.json & pages.json save + image scanning
function galleryApiPlugin(): Plugin {
  return {
    name: 'gallery-api',
    configureServer(server) {
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
