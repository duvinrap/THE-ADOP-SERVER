// THE ADOP — health endpoint
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Use GET.' });
  return res.status(200).json({ ok: true, aiConfigured: Boolean(process.env.GEMINI_API_KEY), model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
};
