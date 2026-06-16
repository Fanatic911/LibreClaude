import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const IS_LOCAL = process.env.VERCEL !== '1' && process.env.VERCEL_ENV == null;

if (IS_LOCAL) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const envPath   = path.resolve(__dirname, '..', '.env');
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

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const isLocal = IS_LOCAL;

  if (isLocal) {
    try {
      const logPath = path.resolve(process.cwd(), 'configlogs.txt');
      let logs = [];
      if (fs.existsSync(logPath)) {
        try { logs = JSON.parse(fs.readFileSync(logPath, 'utf8') || '[]'); } catch { logs = []; }
      }
      if (!Array.isArray(logs)) logs = [logs];
      logs.push({
        timestamp: new Date().toISOString(),
        endpoint: 'api/config',
        method: req.method,
        isLocal,
        turnstileSiteKey: process.env.TURNSTILE_SITE_KEY ? '***set***' : '(empty)',
      });
      if (logs.length > 50) logs.splice(0, logs.length - 50);
      fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
    } catch (e) { console.error('configlogs write error:', e); }
  }

  res.status(200).json({
    turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || '',
    isLocal,
  });
}