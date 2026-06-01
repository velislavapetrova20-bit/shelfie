const { GoogleGenerativeAI } = require('@google/generative-ai');

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
    const { title, author, genre } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: 'Write exactly 2 sentences describing this book for a general reader. Plain text only — no markdown, titles, or labels.',
    });
    const userMessage = `Book: "${title}"${author ? ' by ' + author : ''}${genre ? '. Genre: ' + genre : ''}`;
    const result = await model.generateContent(userMessage);
    const description = result.response.text().trim();
    return res.status(200).json({ description });
  } catch (e) {
    console.error('Description error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
