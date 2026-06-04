const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' });
  }

  try {
    const { title, author, genre } = req.body;
    const userMessage = `Book: "${title}"${author ? ' by ' + author : ''}${genre ? '. Genre: ' + genre : ''}`;
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: 'Write exactly 2 sentences describing this book for a general reader. Plain text only — no markdown, titles, or labels.',
      messages: [{ role: 'user', content: userMessage }],
    });
    const description = message.content[0].text.trim();
    return res.status(200).json({ description });
  } catch (e) {
    console.error('Description error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
