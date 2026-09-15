// THE ADOP V4 — AI Client
// Hosted backend: https://theadop-server.vercel.app

const THE_ADOP_SERVER = 'https://theadop-server.vercel.app';

function isFileProtocol() {
  try {
    return location.protocol === 'file:';
  } catch (_) {
    return false;
  }
}

function getAdopApiBase() {
  // Android can still provide a custom server, but the hosted THE ADOP
  // server is the safe default. Ignore the old emulator localhost default.
  try {
    if (
      window.AdopAndroid &&
      typeof window.AdopAndroid.getApiBase === 'function'
    ) {
      const nativeBase = String(window.AdopAndroid.getApiBase() || '').trim();
      if (
        nativeBase &&
        !/^(https?:\/\/)?(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?\/?$/i.test(nativeBase)
      ) {
        return nativeBase.replace(/\/+$/, '');
      }
    }
  } catch (_) {}

  // Packaged Android app and website both use the hosted backend.
  return THE_ADOP_SERVER;
}

async function theAdopAI(tool, prompt) {
  const base = getAdopApiBase().replace(/\/+$/, '');
  const url = `${base}/api/ai`;

  if (!base) {
    throw new Error('THE ADOP AI server address is missing.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        tool: String(tool || '').trim(),
        prompt: String(prompt || '').trim()
      }),
      signal: controller.signal
    });

    const raw = await response.text();

    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (_) {
      data = {
        error: raw || `Invalid server response (HTTP ${response.status}).`
      };
    }

    if (!response.ok) {
      throw new Error(
        data.error || `AI request failed (HTTP ${response.status}).`
      );
    }

    if (!data.text) {
      throw new Error('THE ADOP AI returned an empty response.');
    }

    return data.text;

  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new Error(
        'THE ADOP AI server did not respond within 60 seconds. Please try again.'
      );
    }

    // Do not hide the real HTTP/application error.
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      `Cannot connect to THE ADOP AI server at ${url}.`
    );

  } finally {
    clearTimeout(timeoutId);
  }
}

// Expose the API explicitly for inline button handlers and WebView pages.
window.theAdopAI = theAdopAI;
