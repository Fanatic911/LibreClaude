import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const IS_LOCAL = process.env.VERCEL !== '1' && process.env.VERCEL_ENV == null;

if (IS_LOCAL) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const idx = t.indexOf('=');
      if (idx === -1) continue;
      const key = t.slice(0, idx).trim();
      const val = t.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const VALID_MODELS = new Set(['flux', 'flux-realism', 'flux-anime', 'flux-3d', 'turbo']);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (!body || typeof body === 'string') {
    try {
      const raw = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
      body = raw ? JSON.parse(raw) : {};
    } catch { body = {}; }
  }

  const prompt = (body.prompt || '').trim();
  const model = VALID_MODELS.has(body.model) ? body.model : 'flux';
  const width = Math.min(parseInt(body.width) || 1024, 1024);
  const height = Math.min(parseInt(body.height) || 1024, 1024);

  if (!prompt) return res.status(400).json({ error: 'Prompt required' });

  const seed = Math.floor(Math.random() * 999999);
  const encoded = encodeURIComponent(prompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?model=${model}&width=${width}&height=${height}&seed=${seed}&nologo=true&referrer=LibreClaude`;

  writeLog(IS_LOCAL, { model, prompt: prompt.slice(0, 80), status: 200 });

  return res.status(200).json({ url: imageUrl, prompt });
}

function writeLog(isLocal, info) {
  if (!isLocal) return;
  try {
    const logPath = path.resolve(process.cwd(), 'imagelogs.txt');
    let logs = [];
    if (fs.existsSync(logPath)) {
      try { logs = JSON.parse(fs.readFileSync(logPath, 'utf8') || '[]'); } catch { logs = []; }
    }
    if (!Array.isArray(logs)) logs = [logs];
    logs.push({ timestamp: new Date().toISOString(), endpoint: 'api/image', ...info });
    if (logs.length > 50) logs.splice(0, logs.length - 50);
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  } catch (e) { console.error('Log write error:', e); }
}
