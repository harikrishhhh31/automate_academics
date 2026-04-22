import { callGroq }   from './groq.js';
import { callGemini } from './gemini.js';
import { callCohere } from './cohere.js';
import { fetchWikiContext, extractKeyTerms } from '../utils/wikipedia.js';

// ─── Provider fallback chain ──────────────────────────────────────────────────
const providers = [
  { name: 'Groq',   fn: callGroq   },
  { name: 'Gemini', fn: callGemini },
  { name: 'Cohere', fn: callCohere },
];

/**
 * Try each provider in order. Returns { result, provider } or null if all fail.
 */
const callWithFallback = async (prompt, systemPrompt, send) => {
  for (const provider of providers) {
    try {
      const result = await provider.fn(prompt, systemPrompt);
      if (result && result.trim().length > 0) {
        return { result: result.trim(), provider: provider.name };
      }
    } catch (err) {
      send('log', `[LLM] ${provider.name} failed: ${err.message} — trying next provider`);
    }
  }
  return null; // all providers exhausted → triggers manual pause
};

// ─── System prompts ───────────────────────────────────────────────────────────
const SOLVER_SYSTEM = `You are an expert engineering tutor covering computer science, electronics, data science, mathematics, and all core engineering subjects. You will be given a multiple-choice question with Wikipedia context. Reason internally then respond with ONLY the exact text of the correct option. Nothing else. No explanation. No prefix. Just the option text.`;

const VERIFIER_SYSTEM = `You are a strict answer verifier for engineering MCQs. Given a question, its options, context, and a proposed answer — if the proposed answer is correct respond only with the word CONFIRM. If the proposed answer is wrong, respond only with the exact text of the correct option. Nothing else.`;

const TIEBREAKER_SYSTEM = `You are a senior engineering expert resolving a disputed MCQ answer. A solver and a verifier disagreed. Re-evaluate carefully with the Wikipedia context and respond with ONLY the exact text of the correct option. No explanation.`;

// ─── Main pipeline ────────────────────────────────────────────────────────────
/**
 * @param {string} question  - Full question text
 * @param {string[]} options - Array of option strings
 * @param {function} send    - WebSocket send helper (type, data)
 * @param {function} waitForManual - Called if all providers fail; returns user-typed answer
 * @returns {{ answer: string, confidence: 'CONFIRMED'|'OVERRIDDEN'|'TIEBROKEN'|'MANUAL' }}
 */
export const answerQuestion = async (question, options, send, waitForManual) => {
  // Step 1: Wikipedia context
  const terms = extractKeyTerms(question);
  send('log', `[LLM] Key terms: ${terms.join(', ')}`);

  const contextParts = await Promise.all(terms.map(t => fetchWikiContext(t)));
  const context = contextParts.filter(Boolean).join('\n\n').slice(0, 1200); // cap context size

  const questionBlock = [
    `Question: ${question}`,
    `Options:\n${options.map((o, i) => `  ${i + 1}. ${o}`).join('\n')}`,
    context ? `Wikipedia Context:\n${context}` : '',
  ].filter(Boolean).join('\n\n');

  // Step 2: Solver agent
  send('status', 'Solver agent thinking...');
  const solverRes = await callWithFallback(questionBlock, SOLVER_SYSTEM, send);

  if (!solverRes) {
    send('log', '[LLM] All providers failed on Solver — pausing for manual input');
    const manualAnswer = await waitForManual(question, options);
    return { answer: manualAnswer, confidence: 'MANUAL' };
  }

  const solverAnswer = solverRes.result;
  send('log', `[LLM] Solver (${solverRes.provider}): "${solverAnswer}"`);

  // Step 3: Verifier agent
  send('status', 'Verifier agent checking...');
  const verifierPrompt = [
    questionBlock,
    `Proposed answer: ${solverAnswer}`,
  ].join('\n\n');

  const verifierRes = await callWithFallback(verifierPrompt, VERIFIER_SYSTEM, send);

  if (!verifierRes) {
    send('log', '[LLM] Verifier failed — trusting Solver answer');
    return { answer: solverAnswer, confidence: 'CONFIRMED' };
  }

  const verifierResult = verifierRes.result;
  send('log', `[LLM] Verifier (${verifierRes.provider}): "${verifierResult}"`);

  // CONFIRMED — both agree
  if (verifierResult.toUpperCase() === 'CONFIRM') {
    return { answer: solverAnswer, confidence: 'CONFIRMED' };
  }

  // Disagreement → Tiebreaker
  send('status', 'Disagreement detected — running tiebreaker...');
  const tiebreakerPrompt = [
    questionBlock,
    `Solver answer: "${solverAnswer}"`,
    `Verifier critique: The verifier says the correct answer is "${verifierResult}"`,
    'Re-evaluate and respond with only the correct option text.',
  ].join('\n\n');

  const tiebreakerRes = await callWithFallback(tiebreakerPrompt, TIEBREAKER_SYSTEM, send);

  if (!tiebreakerRes) {
    // Tiebreaker also failed — go with verifier's suggestion
    send('log', '[LLM] Tiebreaker failed — using Verifier answer');
    return { answer: verifierResult, confidence: 'OVERRIDDEN' };
  }

  const finalAnswer = tiebreakerRes.result;
  send('log', `[LLM] Tiebreaker (${tiebreakerRes.provider}): "${finalAnswer}"`);

  const confidence = finalAnswer === solverAnswer ? 'OVERRIDDEN' : 'TIEBROKEN';
  return { answer: finalAnswer, confidence };
};

// ─── Best-match helper ────────────────────────────────────────────────────────
/**
 * Find the closest option to the LLM's text output (fuzzy match).
 * Handles minor whitespace / casing differences.
 */
export const matchToOption = (answer, options) => {
  if (!answer) return null;
  const norm = s => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const normAnswer = norm(answer);

  // Exact match first
  const exact = options.find(o => norm(o) === normAnswer);
  if (exact) return exact;

  // Starts-with match
  const starts = options.find(o => norm(o).startsWith(normAnswer) || normAnswer.startsWith(norm(o)));
  if (starts) return starts;

  // Substring match
  const sub = options.find(o => norm(o).includes(normAnswer) || normAnswer.includes(norm(o)));
  if (sub) return sub;

  // Fallback: return the LLM answer as-is
  return answer;
};
