export const startStreaming = (page, ws) => {
  let isCapturing = false;
  return setInterval(async () => {
    if (isCapturing) return;
    isCapturing = true;
    try {
      const screenshot = await page.screenshot({ type: 'jpeg', quality: 50 });
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(JSON.stringify({
          type: 'stream',
          data: screenshot.toString('base64')
        }));
      }
    } catch (e) {
      // Ignored
    } finally {
      isCapturing = false;
    }
  }, 600);
};
