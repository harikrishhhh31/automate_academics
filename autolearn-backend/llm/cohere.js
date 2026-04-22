import axios from 'axios';

export const callCohere = async (prompt, systemPrompt) => {
  const res = await axios.post(
    'https://api.cohere.com/v2/chat',
    {
      model: 'command-r',
      messages: [
        { role: 'system',  content: systemPrompt },
        { role: 'user',    content: prompt },
      ],
      max_tokens: 100,
      temperature: 0.1,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  );
  return res.data.message?.content?.[0]?.text?.trim() || null;
};
