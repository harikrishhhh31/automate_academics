import axios from 'axios';

const WIKI_BASE = 'https://en.wikipedia.org/api/rest_v1/page/summary';

export const fetchWikiContext = async (term) => {
  try {
    const encodedTerm = encodeURIComponent(term.trim());
    const res = await axios.get(`${WIKI_BASE}/${encodedTerm}`, { timeout: 5000 });
    return res.data?.extract || '';
  } catch (e) {
    return ''; // Silently fail, LLM will proceed without context
  }
};

// Extract top 2-3 keywords from a question string
export const extractKeyTerms = (question) => {
  const stopWords = new Set(['a','an','the','is','are','was','were','what','which','how','why','when','where','does','do','did','can','could','would','should','of','in','on','to','for','with','this','that','these','those','be','by']);
  const words = question
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));
  return words.slice(0, 3);
};
