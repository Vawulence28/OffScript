const sendTelegramNotification = async (message) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error('❌ TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing from environment variables.');
    return;
  }

  try {
    // Native global fetch in Node.js 18+ / 22+
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('❌ Telegram API Error:', data.description);
    } else {
      console.log('✅ Telegram notification sent successfully!');
    }
  } catch (err) {
    console.error('❌ Error sending Telegram notification:', err.message);
  }
};

module.exports = { sendTelegramNotification };