# THE ADOP Server

Hosted backend for THE ADOP AI.

## Vercel
Use the project root containing `api/`, `public/`, `package.json`, and `vercel.json`.

Environment variables:
- `GEMINI_API_KEY` = your Gemini API key
- `GEMINI_MODEL` = `gemini-3.8-flash`

The frontend and Android app use:
`https://the-adop-server.vercel.app`

Health check:
`/api/health`

AI endpoint:
`POST /api/ai`
