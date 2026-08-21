# Security Policy

## Supported Versions
Only the latest version of OmniChat is actively supported with security updates.

## Local Storage & Encryption
- OmniChat stores all data in the browser (IndexedDB & LocalStorage).
- API keys are encrypted at rest using AES-GCM (256-bit).
- Key derivation uses PBKDF2 with 210,000 iterations and a unique salt.
- A master passphrase is required to unlock the application and decrypt keys into memory.
- An auto-lock mechanism secures the app after inactivity, clearing decrypted keys from active memory.

## User-Provided CORS Proxies
Because OmniChat operates purely in the browser, some AI providers (like OpenAI) block requests due to CORS policies. Users have the option to configure a custom CORS proxy in the application settings.
**Security Warning:** If you choose to use a CORS proxy, be aware that all traffic (including your API keys) will flow through that proxy. We strongly recommend deploying your own private proxy (e.g., using Cloudflare Workers) rather than using public/shared proxies to ensure your API keys are not intercepted.

## Reporting a Vulnerability
If you discover a security vulnerability, please contact the maintainers directly via email (see GitHub profile). Do not report security vulnerabilities via public GitHub issues.
