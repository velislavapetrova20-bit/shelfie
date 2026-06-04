require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const publicDir = path.join(__dirname, 'public');

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

const QUIZ_SYSTEM = `You generate book memory quizzes. Return ONLY valid JSON, no markdown. Format: {"questions":[{"type":"Plot","question":"...","options":["A)...","B)...","C)...","D)..."],"correct":"A","explanation":"..."}]} — exactly 6 questions, last one type Reflection with no options (null).`;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function isRateLimitError(e) {
  return e.status === 429 ||
    /429|too many requests|rate limit|rate_limit/i.test(e.message || '');
}

app.post('/api/description', async (req, res) => {
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
    res.json({ description });
  } catch (e) {
    console.error('Description error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/quiz', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' });
  }

  console.log('Received request body:', req.body);
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
    res.json(JSON.parse(text));
  } catch (e) {
    console.error('Error:', e.message);
    if (isRateLimitError(e)) {
      return res.status(429).json({ error: 'rate_limited' });
    }
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
