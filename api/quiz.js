const { GoogleGenerativeAI } = require('@google/generative-ai');

const QUIZ_SYSTEM = `You generate book memory quizzes. Return ONLY valid JSON, no markdown. Format: {"questions":[{"type":"Plot","question":"...","options":["A)...","B)...","C)...","D)..."],"correct":"A","explanation":"..."}]} — exactly 6 questions, last one type Reflection with no options (null).`;

function isRateLimitError(e) {
  return e.status === 429 ||
    /429|too many requests|resource_exhausted|rate limit/i.test(e.message || '');
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

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
  }

  try {
    const { title, author, genre, notes } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: QUIZ_SYSTEM,
    });
    const userMessage = `Book: "${title}"${author ? ' by ' + author : ''}${genre ? ', Genre: ' + genre : ''}${notes ? '. My notes: ' + notes : ''}`;
    const result = await model.generateContent(userMessage);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    return res.status(200).json(JSON.parse(text));
  } catch (e) {
    console.error('Quiz error:', e.message);
    if (isRateLimitError(e)) {
      return res.status(429).json({ error: 'rate_limited' });
    }
    return res.status(500).json({ error: e.message });
  }
};
