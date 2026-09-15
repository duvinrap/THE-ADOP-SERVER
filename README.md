# The Adop — Real AI

A mobile-friendly game-development AI workspace with a secure backend.
Android app (WebView) + a backend that can run either as a plain Node.js
server (`server.js`, for your own PC) **or** as Vercel serverless
functions (`/api/*`, for a free public URL any phone can reach).

Backed by **Google Gemini** (free tier, no credit card required).

## Features
- Real AI generation for game idea, story, level, NPC, Godot code, asset prompts and mini GDD.
- API key stays on the server; it is never placed in browser code or the APK.
- In-app **⚙ AI Server** page — set the backend address on any phone, no rebuild needed.
- Local project save/export.
- Mobile-friendly UI, installable PWA shell, and a custom app icon (adaptive icon included).
- `/api/health` server status check.

## App identity
- Name: **The Adop**
- App icon: an original hexagon + neural-network mark (cyan-to-blue gradient), representing
  game (hexagon/controller space) + AI (connected nodes). Source layers:
  `app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png` /
  `ic_launcher_background.png` (Android adaptive icon), plus flattened legacy
  icons in every `mipmap-*` folder. Web/PWA icons are in
  `app/src/main/assets/web/icons/` (and mirrored in `public/icons/`).

## Built-in hosted backend
The app now defaults to `https://theadop-server.vercel.app` automatically (see
`getAdopApiBase()` in `ai-client.js`) whenever no other server address is saved — so a
fresh install works immediately with no setup. The **⚙ AI Server** page still lets you
add/save extra server addresses (e.g. a local dev server) and switch between them anytime.

## Get a free Gemini API key
1. Go to https://aistudio.google.com/apikey
2. Sign in with a Google account.
3. Click **Create API key** — no credit card required for the free tier.
4. Copy the key.

Free tier limits are generous enough for personal/testing use (a set number of
requests per minute/day; exact numbers are shown live at
https://ai.google.dev/gemini-api/docs/models once you're signed in). If Google
ever renames the default free Flash model, just update `GEMINI_MODEL` — no
code changes needed.

## Option A — Host it yourself (Node.js on a PC/server)
1. Install Node.js 18+.
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` (and optionally
   `GEMINI_MODEL`, default `gemini-3.8-flash` — Google's current flagship
   coding/agent model).
3. Start: `node server.js`
4. Test in a browser: `http://localhost:3000`
5. On each phone, open the app → **⚙ AI Server** → enter your PC's address
   (same Wi-Fi: `http://<your-pc-lan-ip>:3000`) → Save.

## Option B — Host it on Vercel (works from any phone, anywhere)
This repo is already structured for Vercel's zero-config "Other" preset:
- `/api/ai.js` and `/api/health.js` — serverless functions (replace `server.js` for this path).
- `/public/` — the static site Vercel serves at your project's root URL.

Steps:
1. Push this folder to a GitHub repo (or drag-and-drop deploy) and import it in Vercel.
2. In **Vercel → Project → Settings → Environment Variables**, add:
   - `GEMINI_API_KEY` = your free Gemini key
   - `GEMINI_MODEL` = `gemini-3.8-flash` (optional, this is already the default)
3. Deploy/redeploy so the functions pick up the new env vars.
4. Visit your Vercel URL (e.g. `https://your-app.vercel.app`) — the site should load directly
   (no more 404) and **⚙ AI Server → Test Connection** should say `✅ Server online`.
5. In the Android app, open **⚙ AI Server** and enter your Vercel URL, e.g.
   `https://your-app.vercel.app` (no trailing slash, no `/api`) → Save.
   The website itself (opened in a normal browser) needs no configuration — it calls
   its own `/api/*` routes automatically.

> If you previously deployed and got a 404, it's because the old `server.js` used Node's
> raw `http` module, which Vercel can't run as-is. The new `/api/ai.js` + `/api/health.js`
> + `/public/index.html` structure fixes that.

## Android Studio
Open this folder in Android Studio. Build > Build APK(s). The app loads the web UI from
`app/src/main/assets/web/` and shows the new **The Adop** app icon on the home screen.
For AI to work, point the app at a running backend (Option A or B above) via **⚙ AI Server**.

## Google Sign-In setup (required — one-time, in your own Google Cloud project)
The app now shows a **"Sign in with Google"** gate before use (`MainActivity.java` +
the `#gate` screen in `index.html`). Google issues sign-in credentials per app + per
developer, so this step can't be skipped or done on your behalf — here's exactly how:

1. **Get your app's SHA-1 fingerprint** (Google needs this to trust your APK).
   Run this on your dev machine (uses the default debug key while testing):
   ```
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
   Copy the `SHA1:` value. For a Play Store release build, repeat this with your real
   release keystore before publishing (a debug-key sign-in won't work on other people's phones).

2. **Google Cloud Console** → https://console.cloud.google.com/
   - Create a project (or reuse one).
   - **APIs & Services → OAuth consent screen** — fill in app name, support email,
     choose "External" (or "Internal" if using Google Workspace), save.
   - **APIs & Services → Credentials → Create Credentials → OAuth client ID**
     - Application type: **Android**
     - Package name: `com.theadop.v4` (must match `app/build.gradle`'s `applicationId`)
     - SHA-1 certificate fingerprint: paste the value from step 1
     - Create.

That's it — no client ID string needs to be pasted into the code. Android's Google
Sign-In matches sign-in requests to your OAuth client automatically by package name +
signing certificate. Rebuild and reinstall the APK, and the sign-in button will work.

**Notes:**
- This gate shows the user's name/email/photo and gets out of the way — it does not
  verify identity on the server. If you later want the backend to trust *who* is
  calling (e.g. per-user limits enforced server-side, not just on-device), that needs
  an extra step: request an ID token and verify it in `api/ai.js` — ask if you want
  that added.

## Google Sign-In for the website (browser) version
The Android app uses native sign-in (above). The **website** (`https://theadop-server.vercel.app`
opened in a normal browser) uses a separate, simpler flow — Google "Sign In With Google" JS —
which needs its own credential (a different type from the Android one):

1. Same Google Cloud project as before → **APIs & Services → Credentials → Create
   Credentials → OAuth client ID**
2. Application type: **Web application**
3. Authorized JavaScript origins → add:
   ```
   https://theadop-server.vercel.app
   ```
   (add `http://localhost:3000` too if you test locally with `server.js`)
4. Create → copy the **Client ID** (ends in `.apps.googleusercontent.com`)
5. Open `public/index.html`, find this line near the top of the big `<script>` block:
   ```js
   const WEB_GOOGLE_CLIENT_ID='YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';
   ```
   replace the placeholder with the Client ID you copied, save, then copy the same
   change into `app/src/main/assets/web/index.html` (keep both copies identical) —
   or just re-run this one edit in both files.
6. Push to GitHub → Vercel redeploys automatically → the website now shows a working
   Google Sign-In button too.

Until step 5 is done, visiting the website shows the sign-in screen with a note that
sign-in isn't configured yet — it will not block the Android app, which uses its own
separate native sign-in.


## V4.4.0 — Start Here tutorial

THE ADOP now includes a built-in introductory video at `/tutorial.mp4` and a **Start Here** section explaining the workflow: choose a tool → describe the idea → generate → build → save. The same tutorial is bundled in the Android app for the local fallback page.
