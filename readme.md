LibreClaude is an open-source, unrestricted AI ecosystem designed to provide developers, creators, and daily users with top-tier artificial intelligence tools completely free of charge. Built with the philosophy of unrestricted access to knowledge, LibreClaude removes the barriers of traditional AI platforms by offering a diverse selection of models tailored for specialized tasks.

---

## Key Features

- **100% Free & Unlimited** — No hidden fees, no premium tiers, and absolutely no token limits. Code, write, and process large datasets without worrying about quotas.
- **Multi-Model Architecture** — Integrates a variety of specialized models across multiple infrastructures for maximum efficiency.
- **Image Generation** — Generate images directly in the chat using Pollinations.ai — completely free, no API key required.
- **Syntax Highlighting** — Code blocks are rendered with full language detection and a one-click copy button.
- **Cloudflare Turnstile Protection** — Bot protection via Turnstile, bypassed automatically in local development.
- **Conversation History** — Conversations are saved locally and accessible from the sidebar.
- **File Attachments** — Attach images and documents directly in the chat.
- **Local Development Logging** — Structured JSON logs (`logs.txt`, `configlogs.txt`, `imagelogs.txt`) generated automatically in local mode.
- **Secure Deployment** — API keys are never exposed to the client. All sensitive logic runs server-side.

---

## Supported Models

### Groq Infrastructure
Fast inference, low latency.

| Model | ID | Description |
|---|---|---|
| Qwen 3 32B | `qwen/qwen3-32b` | Powerful general-purpose and code model |
| Llama 3.3 70B | `llama-3.3-70b-versatile` | Versatile and powerful |
| Llama 3.1 8B | `llama-3.1-8b-instant` | Ultra-fast and lightweight |
| GPT-OSS 20B | `openai/gpt-oss-20b` | Efficient open-source architecture |
| GPT-OSS 120B | `openai/gpt-oss-120b` | Advanced reasoning and coding |

### GitHub Infrastructure
Microsoft-hosted, heavyweight models.

| Model | ID | Description |
|---|---|---|
| Codestral | `mistral-ai/Codestral-2501` | Code specialist |
| GPT-4o | `openai/gpt-4o` | Multimodal, versatile |
| GPT-4o mini | `openai/gpt-4o-mini` | Fast and efficient |
| GPT-4.1 | `openai/gpt-4.1` | Advanced coding workflows |
| GPT-4.1 mini | `openai/gpt-4.1-mini` | Rapid code generation |
| o1-mini | `openai/o1-mini` | Complex reasoning |
| DeepSeek R1 | `deepseek/DeepSeek-R1` | Multi-step logic and reasoning |
| DeepSeek V3 | `deepseek/DeepSeek-V3-0324` | Clean code generation |
| Llama 3.3 70B Instruct | `meta/Llama-3.3-70B-Instruct` | Instruction-tuned, versatile |
| Llama 3.1 405B | `meta/Meta-Llama-3.1-405B-Instruct` | Massive scale, deep comprehension |
| Mistral Large | `mistral-ai/Mistral-Large-2411` | Flagship European model |
| Phi-4 | `microsoft/Phi-4` | Compact and smart |
| Grok 3 | `xai/grok-3` | Bleeding-edge reasoning |

### Image Generation (Pollinations.ai)
Free image generation, no API key required.

| Model | ID | Description |
|---|---|---|
| Flux | `flux` | High quality, default |
| Flux Realism | `flux-realism` | Photorealistic output |
| Flux Anime | `flux-anime` | Anime and illustration style |
| Flux 3D | `flux-3d` | 3D render style |
| Turbo | `turbo` | Faster generation |

---

## Installation

### Prerequisites
- [Node.js](https://nodejs.org) v18+
- [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`

### Local Development

```bash
git clone https://github.com/Fanatic911/LibreClaude.git
cd LibreClaude
cp .env.example .env
# Fill in your API keys in .env
vercel dev
```

The app will be available at `http://localhost:3000`.

### Production Deployment

```bash
vercel --prod
```

Set your environment variables in the Vercel dashboard under **Settings → Environment Variables**. Do not commit your `.env` file.

For a full setup guide: [libreclaude.xyz/Documentation](https://libreclaude.xyz/Documentation)

---

## Project Structure

```
LibreClaude/
├── api/
│   ├── chat.js       # Text generation endpoint
│   ├── config.js     # Config and Turnstile key endpoint
│   ├── image.js      # Image generation endpoint
│   └── links.js      # Community links endpoint
├── index.html        # Frontend (single-page app)
├── Source.css        # Styles
├── Icon.png          # App icon
├── vercel.json       # Vercel configuration
├── .env.example      # Environment variable template
└── package.json
```

---

## Feedback & Community

We rely on community feedback to improve the platform, expand model support, and optimize routing.

- **Discord:** [discord.gg/6sExYntnc](https://discord.gg/6sExYntnc)
- **GitHub:** [github.com/Fanatic911/Libre-Claude](https://github.com/Fanatic911/Libre-Claude)
- **Email:** Contact@libreclaude.xyz