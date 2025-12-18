const http = require('http');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

const mimeTypes = {
  '.html': 'text/html',
  '.gz': 'application/gzip',
  '.tar.gz': 'application/gzip',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(publicDir, req.url === '/' ? 'index.html' : req.url);
  
  console.log('Request:', req.url, '->', filePath);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const stat = fs.statSync(filePath);
    
    const headers = {
      'Content-Type': contentType,
      'Content-Length': stat.size,
    };
    
    if (ext === '.gz' || filePath.endsWith('.tar.gz')) {
      headers['Content-Disposition'] = 'attachment; filename=' + path.basename(filePath);
    }
    
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found: ' + req.url);
  }
});

server.listen(5000, '0.0.0.0', () => {
  console.log('Static server running on http://0.0.0.0:5000');
});
