const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  if (req.url === '/projekt-4dpf-alarm.tar.gz' || req.url === '/download') {
    const filePath = path.join(__dirname, 'projekt-4dpf-alarm.tar.gz');
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      'Content-Type': 'application/gzip',
      'Content-Length': stat.size,
      'Content-Disposition': 'attachment; filename=projekt-4dpf-alarm.tar.gz'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<h1>4 DPF Alarm</h1><p><a href="/projekt-4dpf-alarm.tar.gz">Stáhnout projekt</a></p>');
  }
});

server.listen(5000, '0.0.0.0', () => {
  console.log('Server running on port 5000');
});
