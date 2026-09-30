import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../_site/', import.meta.url));
const base = (process.env.STUDY_BASEURL || '').replace(/\/$/, '');
const host = process.env.STUDY_HOST || '127.0.0.1';
const port = Number(process.env.STUDY_PORT || 4173);
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.pdf':'application/pdf', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.glb':'model/gltf-binary' };
await stat(path.join(root, 'room/index.html')).catch(() => { throw new Error('Build the site before starting the preview.'); });
http.createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (base && pathname !== base && !pathname.startsWith(base + '/')) { res.writeHead(404); res.end('Not found'); return; }
    pathname = pathname.slice(base.length);
    let file = path.resolve(root, '.' + (pathname || '/'));
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) { res.writeHead(403); res.end(); return; }
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port, host, () => console.log(`Preview: http://${host}:${port}${base}/room/?lang=zh`));
