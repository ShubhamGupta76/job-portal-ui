const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'dist');
const port = Number(process.env.PORT || 5173);
const backend = {
  hostname: '127.0.0.1',
  port: 8080,
};

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const proxyToBackend = (req, res) => {
  const proxyReq = http.request(
    {
      hostname: backend.hostname,
      port: backend.port,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${backend.hostname}:${backend.port}`,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  req.on('error', () => proxyReq.destroy());
  res.on('error', () => proxyReq.destroy());

  proxyReq.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    res.end('Backend is not reachable on 127.0.0.1:8080');
  });

  req.pipe(proxyReq);
};

const closeQuietly = (...streams) => {
  streams.forEach((stream) => {
    if (!stream || stream.destroyed) return;
    stream.destroy();
  });
};

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    proxyToBackend(req, res);
    return;
  }

  const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(root, safePath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(root, 'index.html');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server error');
      return;
    }

    res.writeHead(200, {
      'Content-Type': types[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(content);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}`);
});

server.on('upgrade', (req, socket, head) => {
  if (!req.url.startsWith('/interview-signal')) {
    socket.destroy();
    return;
  }

  const proxyReq = http.request({
    hostname: backend.hostname,
    port: backend.port,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${backend.hostname}:${backend.port}`,
    },
  });

  proxyReq.on('upgrade', (proxyRes, proxySocket) => {
    const closeSockets = () => closeQuietly(socket, proxySocket);
    socket.on('error', closeSockets);
    proxySocket.on('error', closeSockets);
    socket.on('close', () => closeQuietly(proxySocket));
    proxySocket.on('close', () => closeQuietly(socket));

    socket.write(
      [
        'HTTP/1.1 101 Switching Protocols',
        ...Object.entries(proxyRes.headers).map(([name, value]) => `${name}: ${value}`),
        '',
        '',
      ].join('\r\n'),
    );
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  socket.on('error', () => proxyReq.destroy());
  proxyReq.on('error', () => closeQuietly(socket));
  if (head.length) {
    proxyReq.write(head);
  }
  proxyReq.end();
});
