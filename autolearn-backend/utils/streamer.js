export const startStreaming = (page, ws) => {
  return setInterval(async () => {
    try {
      const screenshot = await page.screenshot({ type: 'jpeg', quality: 60 })
      ws.send(JSON.stringify({
        type: 'stream',
        data: screenshot.toString('base64')
      }))
    } catch (e) {
      // Ignored
    }
  }, 800)
}
