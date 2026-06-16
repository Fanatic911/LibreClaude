
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
  
  const responseData = {
    discord: process.env.DISCORD_LINK || '#',
    github:  process.env.GITHUB_LINK  || '#',
  };

  if (IS_LOCAL) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        endpoint: "api/links",
        method: req.method,
        response: responseData
      };
      
      const logPath = path.resolve(process.cwd(), 'logs.txt');
      
      fs.writeFileSync(logPath, JSON.stringify(logEntry, null, 2));
    } catch (logErr) {
      console.error("Erreur d'écriture dans logs.txt depuis links.js:", logErr);
    }
  }
  // ------------------------------------------------------

  res.status(200).json(responseData);
}