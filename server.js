require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const publicDir = path.join(__dirname, 'public');

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

const QUIZ_SYSTEM = `You generate book memory quizzes. Return ONLY valid JSON, no markdown. Format: {"questions":[{"type":"Plot","question":"...","options":["A)...","B)...","C)...","D)..."],"correct":"A","explanation":"..."}]} — exactly 6 questions, last one type Reflection with no options (null).`;

app.post('/api/description', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
  }

  try {
    const { title, author, genre } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: 'Write a 2–3 sentence description of the book for a general reader. Plain text only — no markdown, titles, or labels.',
    });
    const userMessage = `Book: "${title}"${author ? ' by ' + author : ''}${genre ? '. Genre: ' + genre : ''}`;
    const result = await model.generateContent(userMessage);
    const description = result.response.text().trim();
    res.json({ description });
  } catch (e) {
    console.error('Description error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/quiz', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
  }

  console.log('Received request body:', req.body);
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
    res.json(JSON.parse(text));
  } catch (e) {
    console.error('Error:', e.message);
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
