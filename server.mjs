// Adaptateur d'entrée pour les formulaires historiques. Le reverse proxy public
// dirige les pages vers ce processus, qui relaie /api/* vers Quarkus.
import { createServer, request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const assets = new URL('./dist/viewer/browser/', import.meta.url);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.ico':'image/x-icon'};
createServer(async (req,res) => {
  res.setHeader('Cache-Control','no-store');
  try {
    const path = new URL(req.url,'http://localhost').pathname;
    if (path.startsWith('/api/')) {
      const target = new URL((process.env.API_BACK || 'http://localhost:8080/docviewer-service/api').replace(/\/$/, '') + req.url.slice(4));
      const request = target.protocol === 'https:' ? httpsRequest : httpRequest;
      const upstream = request(target, {method: req.method, headers: {...req.headers, host: target.host}}, response => {
        res.writeHead(response.statusCode || 502, response.headers);
        response.pipe(res);
      });
      upstream.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end(); });
      upstream.setTimeout(30000, () => upstream.destroy());
      req.pipe(upstream);
      return;
    }
    if (path === '/' || path === '/viewer' || path === '/faces/view.faces') {
      let html = await readFile(new URL('index.html',assets),'utf8');
      if (req.method === 'POST') {
        if (!req.headers['content-type']?.startsWith('application/x-www-form-urlencoded')) {
          res.writeHead(415).end(); return;
        }
        const chunks = [];
        let length = 0;
        for await (const chunk of req) {
          length += chunk.length;
          if (length > 1048576) { res.writeHead(413).end(); return; }
          chunks.push(chunk);
        }
        const fields = new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
        const data = JSON.stringify(Object.fromEntries(fields)).replaceAll('<','\\u003c');
        html = html.replace('</head>', () => '<script id="viewer-launch" type="application/json">'+data+'</script></head>');
      } else if (req.method !== 'GET') { res.writeHead(405).end(); return; }
      res.writeHead(200,{'Content-Type':types['.html']}).end(html);
    } else if (req.method === 'GET' && /^\/[\w.-]+$/.test(path) && Object.hasOwn(types,extname(path))) {
      const body = await readFile(new URL(path.slice(1),assets));
      res.writeHead(200,{'Content-Type':types[extname(path)]}).end(body);
    } else { res.writeHead(404).end(); }
  } catch { res.writeHead(404).end(); }
}).listen(Number(process.env.PORT || 4201),'127.0.0.1');
