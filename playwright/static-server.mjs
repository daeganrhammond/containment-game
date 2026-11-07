import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const staticRoot = resolve(process.env.PLAYWRIGHT_STATIC_DIR ?? resolve(projectRoot, 'dist'));
const htmlPath = resolve(staticRoot, 'index.html');
const htmlContent = existsSync(htmlPath) ? readFileSync(htmlPath, 'utf8') : '';
const inferredBasePath = htmlContent.match(/src=["'](\/.*?)\/_expo\/static\/js\/web\//)?.[1] ?? '';
const basePath = (process.env.PLAYWRIGHT_BASE_PATH ?? inferredBasePath).replace(/\/$/, '');
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

if (!existsSync(staticRoot)) throw new Error(`Exported web build not found: ${staticRoot}`);

const server = createServer((request, response) => {
  let requestPath;
  try {
    requestPath = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Invalid URL');
    return;
  }
  if (basePath && (requestPath === basePath || requestPath.startsWith(`${basePath}/`))) {
    requestPath = requestPath.slice(basePath.length) || '/';
  }

  let target = resolve(staticRoot, `.${requestPath}`);
  if (target !== staticRoot && !target.startsWith(`${staticRoot}${sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  if (existsSync(target) && statSync(target).isDirectory()) target = resolve(target, 'index.html');
  if (!existsSync(target) || !statSync(target).isFile()) target = resolve(staticRoot, 'index.html');
  if (!existsSync(target)) {
    response.writeHead(404).end('Not found');
    return;
  }

  response.writeHead(200, {
    'content-type': mimeTypes[extname(target).toLowerCase()] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(target).pipe(response);
});

const port = Number(process.env.PLAYWRIGHT_STATIC_PORT ?? 8182);
server.listen(port, '127.0.0.1');
