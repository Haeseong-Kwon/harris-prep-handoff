// E2E용 정적 서버. astro preview는 머신당 1개 데몬이라 두 빌드를 동시에 띄울 수 없다.
// 사용: node scripts/serve-static.mjs <dir> <port>
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const [dir, port] = process.argv.slice(2);
const root = resolve(dir);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };

function resolveFile(urlPath) {
  const safe = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  const base = join(root, safe);
  if (!base.startsWith(root)) return null;
  for (const candidate of [base, join(base, 'index.html'), `${base}.html`]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

createServer((req, res) => {
  const file = resolveFile(new URL(req.url, 'http://x').pathname);
  const target = file ?? join(root, '404.html');
  res.writeHead(file ? 200 : 404, { 'Content-Type': TYPES[extname(target)] ?? 'application/octet-stream' });
  createReadStream(target).pipe(res);
}).listen(Number(port));
