/**
 * Simple static server for the demo with SPA fallback.
 * Serves from project root so /shared.css, /theme.js, /newchartjs.umd.js all resolve.
 */
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('..', import.meta.url));
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

async function tryFile(filePath) {
  try {
    const s = await stat(filePath);
    if (s.isFile()) return filePath;
  } catch {}
  return null;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = url.pathname;

  // Try: demo/{path}, demo/{path}.html, dist/{path}, then SPA fallback
  let file =
    await tryFile(join(__dirname, 'demo', pathname)) ||
    await tryFile(join(__dirname, 'dist', pathname)) ||
    await tryFile(join(__dirname, 'demo', pathname + '.html'));

  // SPA fallback: if no file found for a path without extension, serve demo/index.html
  if (!file && !extname(pathname)) {
    file = join(__dirname, 'demo', 'index.html');
  }

  if (!file) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = extname(file);
  const mime = MIME[ext] || 'application/octet-stream';

  try {
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  } catch {
    res.writeHead(500);
    res.end('Server error');
  }
});

server.listen(PORT, () => {
  console.log(`NewChart demo → http://localhost:${PORT}`);
});
