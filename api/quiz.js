const Anthropic = require('@anthropic-ai/sdk');

const QUIZ_SYSTEM = `You generate book memory quizzes. Return ONLY valid JSON, no markdown. Format: {"questions":[{"type":"Plot","question":"...","options":["A)...","B)...","C)...","D)..."],"correct":"A","explanation":"..."}]} — exactly 6 questions, last one type Reflection with no options (null).`;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function isRateLimitError(e) {
  return e.status === 429 ||
    /429|too many requests|rate limit|rate_limit/i.test(e.message || '');
}

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
    const { title, author, genre, notes } = req.body;
    const userMessage = `Book: "${title}"${author ? ' by ' + author : ''}${genre ? ', Genre: ' + genre : ''}${notes ? '. My notes: ' + notes : ''}`;
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: QUIZ_SYSTEM,
      messages: [{ role: 'user', content: userMessage }],
    });
    const text = message.content[0].text.replace(/```json|```/g, '').trim();
    return res.status(200).json(JSON.parse(text));
  } catch (e) {
    console.error('Quiz error:', e.message);
    if (isRateLimitError(e)) {
      return res.status(429).json({ error: 'rate_limited' });
    }
    return res.status(500).json({ error: e.message });
  }
};
