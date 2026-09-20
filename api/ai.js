// THE ADOP — Vercel AI endpoint
const roles = {
  gameIdea: 'You are a professional game designer. Create original practical game concepts with genre, core loop, mechanics, progression, art direction and a short pitch.',
  story: 'You are a game narrative designer. Create original stories, characters, motivations, world, conflicts and mission hooks.',
  level: 'You are a level designer. Create playable missions with objectives, layout, encounters, checkpoints, rewards and progression.',
  npc: 'You are a game AI/NPC designer. Create NPC roles, personality, behavior, AI states, quest hooks and dialogue hooks.',
  code: 'You are a senior game developer. Follow the requested engine/language. If none is given, use Godot GDScript. Give complete readable starter code, required nodes/imports, file location and setup steps.',
  asset: 'You are a game art director. Create detailed production-friendly prompts for game assets, characters, environments, UI and VFX.',
  gdd: 'You are a game producer. Create a concise mini Game Design Document covering vision, audience, gameplay, systems, story, levels, art, audio and roadmap.'
};

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
}

async function bodyJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (_) { return null; }
  }
  return new Promise(resolve => {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch (_) { resolve(null); } });
    req.on('error', () => resolve(null));
  });
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, service: 'THE ADOP AI API', aiConfigured: Boolean(process.env.GEMINI_API_KEY), model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
  }
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Use POST for AI generation.' });

  try {
    const key = String(process.env.GEMINI_API_KEY || '').trim();
    const model = String(process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
    if (!key) return res.status(503).json({ ok: false, error: 'GEMINI_API_KEY is missing in Vercel Environment Variables.' });

    const body = await bodyJson(req);
    if (!body || typeof body !== 'object') return res.status(400).json({ ok: false, error: 'Invalid JSON request.' });
    const tool = String(body.tool || '').trim();
    const prompt = String(body.prompt || '').trim();
    if (!roles[tool]) return res.status(400).json({ ok: false, error: 'Unknown AI tool: ' + tool });
    if (!prompt) return res.status(400).json({ ok: false, error: 'Prompt is empty.' });
    if (prompt.length > 20000) return res.status(413).json({ ok: false, error: 'Prompt is too long.' });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 50000);
    let response;
    try {
      response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: { parts: [{ text: roles[tool] }] },
          contents: [{ role: 'user', parts: [{ text: prompt + '\n\nReturn a useful structured answer. Be original.' }] }]
        })
      });
    } catch (e) {
      return res.status(e && e.name === 'AbortError' ? 504 : 502).json({ ok: false, error: e && e.name === 'AbortError' ? 'Gemini request timed out. Try again.' : 'Could not connect to Gemini. Try again.' });
    } finally { clearTimeout(timer); }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status === 429 ? 429 : 502).json({ ok: false, error: data?.error?.message || ('Gemini request failed (HTTP ' + response.status + ').') });
    }
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
    if (!text) return res.status(502).json({ ok: false, error: 'Gemini returned no text. Try again.' });
    return res.status(200).json({ ok: true, text });
  } catch (e) {
    console.error('THE ADOP API error:', e);
    return res.status(500).json({ ok: false, error: 'Unexpected server error. Please try again.' });
  }
};
