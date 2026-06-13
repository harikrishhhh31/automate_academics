const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const jitter = (base, range = 300) => base + Math.floor(Math.random() * range * 2) - range;

import { answerQuestion, matchToOption } from '../llm/pipeline.js';

export const handleGforms = async (ctx, url, userInfo) => {
  const { page, send, waitForConfirm, isStop } = ctx;

  const waitForManual = async (q, opts) => {
    send('status', `LLM failed. Please answer manually on stream: ${q.slice(0, 40)}...`);
    await waitForConfirm(); // Wait for user to manually click an option
    return null;
  };

  send('status', 'Opening Google Form...');
  await page.goto(url);
  
  // Step 1: Click "Sign in" button
  const signInButton = page.getByRole('button', { name: /sign in/i })
    .or(page.getByRole('link', { name: /sign in/i }));

  try {
    await signInButton.waitFor({ state: 'visible', timeout: 5000 });
    await signInButton.click();
    console.log('[Login] Clicked sign-in button');
  } catch (e) {
    console.error('[Login] Sign-in button not found. Current URL:', page.url());
    send({ type: 'error', message: 'Could not find Sign In button' });
    return;
  }

  // Step 2: Wait for Google login page
  try {
    await page.waitForURL('**/accounts.google.com/**', { timeout: 15000 });
    console.log('[Login] Reached Google login page');
  } catch (e) {
    console.error('[Login] Never reached accounts.google.com. Current URL:', page.url());
    send({ type: 'error', message: 'Login redirect failed' });
    return;
  }

  // Step 3: Type email — handle Google's varied input rendering
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  const emailSelector = 'input[type="email"], input[name="identifier"], input#identifierId';
  let emailFilled = false;

  try {
    await page.waitForSelector(emailSelector, { state: 'visible', timeout: 8000 });
    await page.type(emailSelector, userInfo.gmail, { delay: 80 });
    emailFilled = true;
    console.log('[Login] Typed email');
  } catch (e) {
    console.log('[Login] Email not in main frame, checking frames...');
    for (const frame of page.frames()) {
      try {
        const input = frame.locator(emailSelector).first();
        await input.waitFor({ state: 'visible', timeout: 3000 });
        await input.type(userInfo.gmail, { delay: 80 });
        emailFilled = true;
        console.log('[Login] Typed email in frame:', frame.url());
        break;
      } catch (_) {}
    }
  }

  if (!emailFilled) {
    console.error('[Login] Email input not found. URL:', page.url());
    send({ type: 'error', message: 'Email input not found' });
    return;
  }

  await page.keyboard.press('Enter');

  // Step 4: Type password
  await page.waitForSelector('input[type="password"]', { 
    state: 'visible', 
    timeout: 10000 
  });
  await page.waitForTimeout(600);
  await page.type('input[type="password"]', userInfo.password, { delay: 80 });
  await page.keyboard.press('Enter');

  // Step 5: Wait to return to form
  try {
    await page.waitForURL('**/docs.google.com/forms/**', { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    console.log('[Login] Back on form. Login successful.');
  } catch (e) {
    console.error('[Login] Did not return to form. Current URL:', page.url());
    send({ type: 'error', message: 'Login may have failed — check for CAPTCHA or 2FA' });
    return;
  }

  // Step 6: Email checkbox — first checkbox on page
  try {
    const emailCheckbox = page.locator('input[type="checkbox"]').first();
    await emailCheckbox.waitFor({ state: 'visible', timeout: 4000 });
    if (!await emailCheckbox.isChecked()) {
      await emailCheckbox.click({ force: true });
      console.log('[Form] Checked email checkbox');
    }
  } catch (e) {
    console.log('[Form] No email checkbox found, continuing');
  }

  // Small buffer before starting question extraction
  await page.waitForTimeout(1000);

  // Get all question containers
  const questions = await page.$$('div[role="listitem"]');
  send('log', `Found ${questions.length} question(s)`);

  let qIndex = 0;
  for (const question of questions) {
    if (isStop()) return;
    qIndex++;

    const labelEl = await question.$('div[role="heading"] span, .M7eMe');
    const label = labelEl ? (await labelEl.textContent()).trim() : '';
    send('status', `Processing field ${qIndex}: ${label.slice(0, 60)}...`);
    await sleep(jitter(600, 200));

    // Check if this is a name/email/roll field
    const labelLower = label.toLowerCase();
    const isNameField = labelLower.includes('name');
    const isEmailField = labelLower.includes('email') || labelLower.includes('mail');
    const isRollField = labelLower.includes('roll') || labelLower.includes('id') || labelLower.includes('number');

    // Short answer / paragraph
    const textInput = await question.$('input[type="text"], textarea');
    if (textInput) {
      let value = '';
      if (isNameField && userInfo?.name) value = userInfo.name;
      else if (isEmailField && userInfo?.email) value = userInfo.email;
      else if (isRollField && userInfo?.roll) value = userInfo.roll;
      else value = 'AutoLearn'; // fallback placeholder

      await textInput.click();
      await textInput.fill(value);
      send('log', `Q${qIndex} (text): filled "${value}"`);
      continue;
    }

    // MCQ (radio)
    const radioOptions = await question.$$('div[role="radio"]');
    if (radioOptions.length > 0) {
      const optionTexts = [];
      for (const opt of radioOptions) {
        optionTexts.push(await opt.getAttribute('aria-label') || await opt.textContent() || '');
      }
      
      const { answer, confidence } = await answerQuestion(label, optionTexts, send, waitForManual);
      
      if (answer) {
         const bestMatchIndex = optionTexts.findIndex(opt => matchToOption(answer, optionTexts) === opt);
         if(bestMatchIndex !== -1) {
             await radioOptions[bestMatchIndex].click();
             send('log', `Q${qIndex} (MCQ): selected "${optionTexts[bestMatchIndex]}" (confidence: ${confidence})`);
         } else {
             send('log', `Q${qIndex} (MCQ): LLM answered "${answer}" but it didn't match any option.`);
         }
      }
      continue;
    }

    // Checkbox
    const checkboxes = await question.$$('div[role="checkbox"]');
    if (checkboxes.length > 0) {
      await checkboxes[0].click();
      send('log', `Q${qIndex} (checkbox): checked option 1`);
      continue;
    }

    // Dropdown
    const dropdown = await question.$('div[role="listbox"], select');
    if (dropdown) {
      await dropdown.click();
      await sleep(500);
      const option = await page.$('div[role="option"], li[role="option"]');
      if (option) {
        await option.click();
        send('log', `Q${qIndex} (dropdown): selected first option`);
      }
      continue;
    }

    // Linear scale — click middle option
    const scaleOptions = await question.$$('div[role="radio"]');
    if (scaleOptions.length > 0) {
      const mid = Math.floor(scaleOptions.length / 2);
      await scaleOptions[mid].click();
      send('log', `Q${qIndex} (scale): selected option ${mid + 1}`);
    }
  }

  send('status', 'All fields filled. Waiting for your confirmation to submit...');
  const result = await waitForConfirm();

  if (result === 'confirm') {
    send('status', 'Submitting form...');
    const submitBtn = await page.$('div[role="button"][jsname="M2UYVd"], button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      send('status', 'Form submitted!');
      send('log', 'Form submitted successfully.');
    } else {
      send('error', 'Could not find submit button. Please submit manually.');
    }
  } else {
    send('status', 'Submission cancelled by user.');
  }
};
