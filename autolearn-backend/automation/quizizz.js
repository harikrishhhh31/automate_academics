const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const randDelay = () => Math.floor(1800 + Math.random() * 2400 + (Math.random() < 0.5 ? 1 : -1) * Math.random() * 300);

import { answerQuestion, matchToOption } from '../llm/pipeline.js';

export const handleQuizizz = async (ctx, url) => {
  const { page, send, waitForConfirm, isStop } = ctx;
  
  const waitForManual = async (q, opts) => {
      send('status', `LLM failed. Please answer manually on stream: ${q.slice(0, 40)}...`);
      await waitForConfirm(); // Wait for user to manually click an option
      return null;
  };

  send('status', 'Opening Quizizz...');
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await sleep(2000);

  send('status', 'Waiting for quiz to load...');
  send('log', 'Quizizz URL opened. Waiting for questions to appear.');

  let questionNumber = 0;

  while (!isStop()) {
    // Try to detect a question on screen
    let questionEl = null;
    try {
      questionEl = await page.waitForSelector(
        '.question-text, [class*="questionText"], [data-v*="question"]',
        { timeout: 8000, state: 'visible' }
      );
    } catch {
      // No question detected — might be end screen
      send('status', 'No more questions detected. Checking for end...');
      break;
    }

    questionNumber++;
    const questionText = await questionEl.textContent();
    send('status', `Q${questionNumber}: ${questionText?.trim().slice(0, 80)}...`);

    // Find all option buttons
    const options = await page.$$('[class*="option"], [class*="answer-option"], li.option');
    if (options.length === 0) {
      send('log', `Q${questionNumber}: No options found, skipping.`);
      await sleep(1000);
      continue;
    }

    const optionTexts = [];
    for (const o of options) {
      optionTexts.push((await o.textContent())?.trim() || '');
    }
    send('log', `Q${questionNumber} options: ${optionTexts.join(' | ')}`);

    // Human-like delay before answering
    const delay = randDelay();
    send('status', `Q${questionNumber}: Thinking... (${(delay / 1000).toFixed(1)}s)`);
    
    // Call LLM while waiting
    const llmPromise = answerQuestion(questionText, optionTexts, send, waitForManual);
    const [, llmResult] = await Promise.all([sleep(delay), llmPromise]);
    
    if (isStop()) return;

    if (llmResult.answer) {
        const bestMatchIndex = optionTexts.findIndex(opt => matchToOption(llmResult.answer, optionTexts) === opt);
        if (bestMatchIndex !== -1) {
            await options[bestMatchIndex].click();
            send('log', `Q${questionNumber}: Selected "${optionTexts[bestMatchIndex]}" (confidence: ${llmResult.confidence})`);
        } else {
             send('log', `Q${questionNumber}: LLM answered "${llmResult.answer}" but it didn't match any option.`);
             await options[0].click(); // fallback
        }
    }

    // Wait for next question to load
    await sleep(1500);

    // Check if this was the last question
    const isLast = await page.$('[class*="submit"], [class*="finish"], button:has-text("Finish")');
    if (isLast) {
      send('status', 'Last question answered. Waiting for your confirmation to submit...');
      const result = await waitForConfirm();
      if (result === 'confirm') {
        await isLast.click();
        send('status', 'Quiz submitted!');
        send('log', 'Final quiz submission completed.');
      } else {
        send('status', 'Submission cancelled.');
      }
      return;
    }
  }

  send('status', 'Quiz automation complete.');
};
