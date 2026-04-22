import axios from 'axios';

export const callGemini = async (prompt, systemPrompt) => {
  const fullPrompt = `${systemPrompt}\n\n${prompt}`;
  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { maxOutputTokens: 100, temperature: 0.1 },
    },
    { timeout: 15000 }
  );
  return res.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
};
