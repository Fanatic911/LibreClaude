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

const GITHUB_MODEL_MAP = {
  'mistral-ai/Codestral-2501':          'Codestral-2501',
  'openai/gpt-4o':                      'gpt-4o',
  'openai/gpt-4o-mini':                 'gpt-4o-mini',
  'openai/gpt-4.1':                     'gpt-4.1',
  'openai/gpt-4.1-mini':               'gpt-4.1-mini',
  'openai/o1-mini':                     'o1-mini',
  'deepseek/DeepSeek-R1':              'DeepSeek-R1',
  'deepseek/DeepSeek-V3-0324':         'DeepSeek-V3-0324',
  'meta/Llama-3.3-70B-Instruct':       'Llama-3.3-70B-Instruct',
  'meta/Meta-Llama-3.1-405B-Instruct': 'Meta-Llama-3.1-405B-Instruct',
  'mistral-ai/Mistral-Large-2411':     'Mistral-Large-2411',
  'microsoft/Phi-4':                   'Phi-4',
  'xai/grok-3':                        'grok-3',
};

const GROQ_MODEL_MAP = {
  'llama-3.3-70b-versatile': 'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant':    'llama-3.1-8b-instant',
  'openai/gpt-oss-20b':      'gpt-oss-20b',
  'openai/gpt-oss-120b':     'gpt-oss-120b',
  'qwen/qwen3-32b':          'qwen/qwen3-32b',
};

// Rate limit / daily quota error patterns
const RATE_LIMIT_PATTERNS = [
  'rate limit', 'ratelimit', 'rate_limit',
  'quota exceeded', 'daily limit', 'daily quota',
  'too many requests', 'limit exceeded',
  'x-ratelimit', 'requests per day',
];

function isRateLimitError(msg = '') {
  const lower = msg.toLowerCase();
  return RATE_LIMIT_PATTERNS.some(p => lower.includes(p));
}

function flattenContent(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map(part => {
        if (typeof part === 'string') return part;
        if (part?.type === 'text') return part.text ?? '';
        if (part?.type === 'image') return '[image]';
        return '';
      })
      .join('\n')
      .trim();
  }
  return String(content ?? '');
}

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

  const messages      = body.messages || [];
  const frontendModel = body.model    || 'mistral-ai/Codestral-2501';
  const username      = body.username || 'User';

  let apiUrl, apiKey, modelId, provider;

  if (frontendModel in GITHUB_MODEL_MAP) {
    provider = 'github';
    apiUrl   = 'https://models.inference.ai.azure.com/chat/completions';
    apiKey   = process.env.GITHUB_TOKEN;
    modelId  = GITHUB_MODEL_MAP[frontendModel];
  } else if (frontendModel in GROQ_MODEL_MAP) {
    provider = 'groq';
    apiUrl   = 'https://api.groq.com/openai/v1/chat/completions';
    apiKey   = process.env.GROQ_API_KEY;
    modelId  = GROQ_MODEL_MAP[frontendModel];
  } else {
    provider = 'github';
    apiUrl   = 'https://models.inference.ai.azure.com/chat/completions';
    apiKey   = process.env.GITHUB_TOKEN;
    modelId  = frontendModel;
  }

  writeLog(IS_LOCAL, { provider, model: modelId, status: 'calling', msgCount: messages.length });

  if (!apiKey) {
    return res.status(500).json({ error: `Missing API key for: ${provider}` });
  }

  const systemMsg = {
    role: 'system',
    content: `You are LibreClaude, a helpful AI assistant. The user's name is ${username}. Be concise, accurate, and friendly.`,
  };

  const validRoles = new Set(['user', 'assistant', 'system']);
  const apiMessages = [
    systemMsg,
    ...messages
      .filter(m => validRoles.has(m?.role))
      .map(m => ({
        role:    m.role,
        content: flattenContent(m.content),
      }))
      .filter(m => m.content.length > 0),
  ];

  try {
    const upstream = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       modelId,
        messages:    apiMessages,
        max_tokens:  2048,
        temperature: 0.7,
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      const errMsg = data?.error?.message || data?.error || `Error ${upstream.status}`;

      // Detect daily / rate limit errors
      if (upstream.status === 429 || isRateLimitError(errMsg)) {
        writeLog(IS_LOCAL, { provider, model: modelId, status: 429, error: errMsg });
        return res.status(429).json({ error: 'DAILY_LIMIT_REACHED' });
      }

      writeLog(IS_LOCAL, { provider, model: modelId, status: upstream.status, error: errMsg });
      return res.status(upstream.status).json({ error: errMsg });
    }

    const content = data?.choices?.[0]?.message?.content ?? '';
    writeLog(IS_LOCAL, { provider, model: modelId, status: 200, chars: content.length });
    return res.status(200).json({ content });

  } catch (err) {
    writeLog(IS_LOCAL, { provider, model: modelId, error: err.message });
    return res.status(502).json({ error: 'Unable to reach the API server.' });
  }
}

function writeLog(isLocal, info) {
  if (!isLocal) return;
  try {
    const logPath = path.resolve(process.cwd(), 'logs.txt');
    let logs = [];
    if (fs.existsSync(logPath)) {
      try { logs = JSON.parse(fs.readFileSync(logPath, 'utf8') || '[]'); } catch { logs = []; }
    }
    if (!Array.isArray(logs)) logs = [logs];
    logs.push({ timestamp: new Date().toISOString(), endpoint: 'api/chat', ...info });
    if (logs.length > 50) logs.splice(0, logs.length - 50);
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  } catch (e) { console.error('Log write error:', e); }
}
