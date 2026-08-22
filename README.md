# OmniChat with Integrated PromptVault

![Build Status]()

🚀 **Live Demo:** [Click here to test OmniChat](https://abhinavarnav314-collab.github.io/OMNICHAT4/)

<img width="720" height="1600" alt="1000062047" src="https://github.com/user-attachments/assets/6eebc2a4-fd78-4e01-bb66-1171af53d1ac" />
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=flat&logo=vite&logoColor=FFD62E)

OmniChat is a production-grade, zero-backend, open-source Progressive Web App (PWA) that serves as a universal AI chat client with a built-in prompt management system. It supports 15+ LLM providers directly from the browser, keeping all API keys encrypted locally.

## Features
- **Zero Backend**: Fully static architecture. All API calls are made directly from the browser.
- **Local Encryption**: API keys are securely encrypted using AES-GCM (PBKDF2, 210,000 iterations).
- **Multi-Provider Adapter System**: Native integrations with OpenAI, Anthropic, Gemini, DeepSeek, and many more.
- **Side-by-Side Comparison**: Run multiple models simultaneously against the same prompt.
- **PromptVault**: Create, organize, version, and chain your AI prompts.
- **Cost Tracking**: On-the-fly token estimation and cost tracking.
- **Privacy First**: No telemetry, no backend databases, your data stays in your browser's IndexedDB.

## Getting Started
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Build for production: `npm run build`

## Deployment
This project can be deployed to GitHub Pages, Cloudflare Pages, Vercel, or any static host.
No server environment is required.

## CORS Proxies
Because OmniChat is a pure frontend application, some providers (like OpenAI) block direct browser requests due to CORS (Cross-Origin Resource Sharing) policies.
- **Direct Access**: Anthropic, Gemini, Cohere, Groq, and others support direct browser requests.
- **Requires Proxy**: OpenAI requires a CORS proxy.

You can deploy a simple Cloudflare Worker as a proxy:
```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("target");
    if (!targetUrl) return new Response("Missing target", { status: 400 });
    
    const newRequest = new Request(targetUrl, request);
    const response = await fetch(newRequest);
    
    const newResponse = new Response(response.body, response);
    newResponse.headers.set("Access-Control-Allow-Origin", "*");
    newResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    newResponse.headers.set("Access-Control-Allow-Headers", "*");
    
    return newResponse;
  }
};
```
Once deployed, enter your Worker URL in OmniChat Settings > API Keys.

## Documentation
- [Security](SECURITY.md)
- [Contributing](CONTRIBUTING.md)

