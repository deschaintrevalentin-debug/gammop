const http = require('http');
const https = require('https');

const PORT = 3000;

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Route: /api/discord/users/:userId
    const match = req.url.match(/^\/api\/discord\/users\/(\d+)$/);
    if (match && req.method === 'GET') {
        const userId = match[1];
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing Authorization header' }));
            return;
        }

        // Forward request to Discord API
        const options = {
            hostname: 'discord.com',
            port: 443,
            path: `/api/v10/users/${userId}`,
            method: 'GET',
            headers: {
                'Authorization': authHeader
            }
        };

        const proxyReq = https.request(options, (proxyRes) => {
            let data = '';

            proxyRes.on('data', (chunk) => {
                data += chunk;
            });

            proxyRes.on('end', () => {
                res.writeHead(proxyRes.statusCode, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(data);
            });
        });

        proxyReq.on('error', (error) => {
            console.error('Proxy error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Proxy error', message: error.message }));
        });

        proxyReq.end();
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Discord Proxy server running on http://localhost:${PORT}`);
    console.log(`📡 Proxying requests to Discord API with CORS support`);
});
