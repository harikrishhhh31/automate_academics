const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const jitter = (base, lo = 2000, hi = 5000) => base + lo + Math.floor(Math.random() * (hi - lo));
const gapBetweenModules = () => 3000 + Math.floor(Math.random() * 5000);

export const handleSpringboard = async (ctx, courseUrl) => {
  const { page, send, waitForConfirm, isStop } = ctx;

  // Step 1: Open login page and let user log in manually
  send('status', 'Opening Springboard login page...');
  await page.goto('https://infyspringboard.onwingspan.com/en/user/login', { waitUntil: 'domcontentloaded' });
  send('status', 'Please login manually in the browser window. Watching for login completion...');
  send('log', 'Waiting for post-login redirect...');

  // Poll until URL changes away from login page
  let loginDetected = false;
  for (let i = 0; i < 120; i++) { // wait up to 2 min
    if (isStop()) return;
    const currentUrl = page.url();
    if (!currentUrl.includes('/login') && !currentUrl.includes('/user/login')) {
      loginDetected = true;
      break;
    }
    await sleep(1000);
  }

  if (!loginDetected) {
    send('error', 'Login timeout after 2 minutes. Please try again.');
    return;
  }

  send('log', 'Login detected! Navigating to course...');
  send('status', 'Navigating to course URL...');
  await page.goto(courseUrl, { waitUntil: 'domcontentloaded' });
  await sleep(3000);

  // Step 2: Scrape module list
  send('status', 'Scanning course modules...');
  const moduleLinks = await page.$$('[class*="playlist-item"], [class*="module-item"], [class*="courseContent"] li a');
  send('log', `Found ${moduleLinks.length} module(s) in course.`);

  // Step 3: Process each module
  for (let i = 0; i < moduleLinks.length; i++) {
    if (isStop()) return;

    const moduleEl = moduleLinks[i];
    const moduleText = (await moduleEl.textContent())?.trim() || `Module ${i + 1}`;
    send('status', `Processing module ${i + 1}/${moduleLinks.length}: ${moduleText.slice(0, 60)}`);

    await moduleEl.click();
    await sleep(2000);

    // Check if there's a video
    const video = await page.$('video');
    if (video) {
      send('log', `Module ${i + 1}: Video found — attempting Strategy 1 (90% seek)`);

      // Wait for video to be ready
      let strategy1Success = false;
      try {
        await page.waitForFunction(() => {
          const v = document.querySelector('video');
          return v && v.readyState === 4 && v.duration > 0;
        }, { timeout: 15000 });

        // Seek to 90% of duration
        await page.evaluate(() => {
          const v = document.querySelector('video');
          v.currentTime = v.duration * 0.9;
          v.play();
        });

        // Wait for video ended event or max 30s
        strategy1Success = await page.evaluate(() =>
          new Promise((resolve) => {
            const v = document.querySelector('video');
            const onEnd = () => { v.removeEventListener('ended', onEnd); resolve(true); };
            v.addEventListener('ended', onEnd);
            setTimeout(() => resolve(false), 30000);
          })
        );
      } catch {
        send('log', `Module ${i + 1}: Strategy 1 failed — switching to Strategy 2`);
      }

      if (!strategy1Success) {
        send('log', `Module ${i + 1}: Strategy 2 — chunked seeking`);
        try {
          const duration = await page.evaluate(() => document.querySelector('video')?.duration || 0);
          const chunkSize = duration / 4;
          for (let chunk = 1; chunk <= 4; chunk++) {
            if (isStop()) return;
            const seekTo = chunkSize * chunk;
            await page.evaluate((t) => { const v = document.querySelector('video'); if (v) v.currentTime = t; }, seekTo);
            await sleep(jitter(chunkSize * 250, 2000, 5000)); // fraction of real wait + jitter
            send('status', `Module ${i + 1}: Chunk ${chunk}/4 processed`);
          }
        } catch (e) {
          send('error', `Module ${i + 1}: Strategy 2 error: ${e.message}`);
        }
      }

      send('log', `Module ${i + 1} (${moduleText}): Complete ✓`);
    } else {
      send('log', `Module ${i + 1}: No video, marking complete.`);
    }

    // Gap between modules
    const gap = gapBetweenModules();
    send('status', `Module complete. Next in ${(gap / 1000).toFixed(1)}s...`);
    await sleep(gap);
  }

  // Step 4: Look for final assessment
  send('status', 'All modules done. Looking for final assessment...');
  const assessmentLink = await page.$('[class*="assessment"], a:has-text("Assessment"), a:has-text("Quiz")');
  if (assessmentLink) {
    send('log', 'Final assessment found — switching to quiz mode.');
    await assessmentLink.click();
    await sleep(2000);
  }

  send('status', 'Course complete. Waiting for your confirmation...');
  const result = await waitForConfirm();
  if (result === 'confirm') {
    send('status', 'Confirmed! Session complete.');
  } else {
    send('status', 'Session ended by user.');
  }
};
