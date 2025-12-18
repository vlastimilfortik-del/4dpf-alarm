const http = require('http');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'dpf-alarm-projekt.tar.gz');

const server = http.createServer((req, res) => {
  console.log('Request:', req.url);
  
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      'Content-Type': 'application/gzip',
      'Content-Length': stat.size,
      'Content-Disposition': 'attachment; filename=dpf-alarm-projekt.tar.gz',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Soubor nenalezen');
  }
});

server.listen(5000, '0.0.0.0', () => {
  console.log('Download server running on port 5000');
  console.log('File size:', fs.statSync(filePath).size, 'bytes');
});
