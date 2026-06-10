const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();

const TELEGRAM_BOT_TOKEN = defineSecret("TELEGRAM_BOT_TOKEN");

const CHAT_ID = "598876080";

exports.sendLeadToTelegram = onDocumentCreated(
  {
    document: "leads/{leadId}",
    secrets: [TELEGRAM_BOT_TOKEN]
  },
  async (event) => {
    const lead = event.data.data();

    const name = lead.name || "-";
    const phone = lead.phone || "-";
    const message = lead.message || "-";
    const source = lead.source || "Сайт";

    const text =
`📩 НОВА ЗАЯВКА — Райський Сад

👤 Імʼя: ${name}
📞 Телефон: ${phone}
💬 Повідомлення: ${message}
🌐 Джерело: ${source}`;

    const token = TELEGRAM_BOT_TOKEN.value();

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text
      })
    });

    if (!response.ok) {
      const result = await response.text();
      throw new Error("Telegram error: " + result);
    }
  }
);