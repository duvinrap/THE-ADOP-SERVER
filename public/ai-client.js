// THE ADOP — stable AI client
const THE_ADOP_SERVER = 'https://the-adop-server.vercel.app';

function getAdopApiBase() {
  return THE_ADOP_SERVER;
}

async function theAdopAI(tool, prompt) {
  const base = THE_ADOP_SERVER;
  const url = base + '/api/ai';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 65000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ tool: String(tool || '').trim(), prompt: String(prompt || '').trim() }),
      signal: controller.signal
    });
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch (_) {}
    if (!response.ok) throw new Error(data.error || ('Server error (HTTP ' + response.status + ').'));
    if (!data.text) throw new Error('AI returned an empty response.');
    return data.text;
  } catch (e) {
    if (e && e.name === 'AbortError') throw new Error('AI server timed out. Please try again.');
    if (e instanceof TypeError) throw new Error('Failed to fetch THE ADOP AI server. Check internet or Vercel deployment.');
    throw e instanceof Error ? e : new Error('Unexpected connection error.');
  } finally { clearTimeout(timer); }
}

// Available before any inline generator functions run.
window.theAdopAI = theAdopAI;
