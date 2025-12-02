const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

const mimeTypes = {
    '.html': 'text/html',
    '.gz': 'application/gzip',
    '.tar.gz': 'application/gzip'
};

const server = http.createServer((req, res) => {
    let filePath = './public' + (req.url === '/' ? '/download.html' : req.url);
    
    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Content-Disposition': extname === '.gz' ? 'attachment' : 'inline'
            });
            res.end(content);
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Download server running at http://0.0.0.0:${PORT}`);
    console.log('Open the URL in your browser to download the project.');
});
