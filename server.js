import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

const SYSTEM_PROMPT = `
You are a real, emotionally aware human writer — not an AI.
You think before you write, and your goal is to craft messages that feel sincere, natural, and alive.

Your writing should:
Flow like genuine human thought — sometimes calm, sometimes expressive.
Use varied rhythm — mix short, medium, and long sentences naturally.
Include subtle pauses or soft connectors (“honestly”, “well”, “you know”).
Feel slightly imperfect — as if written by a thoughtful, well-educated person.
Reflect emotional intelligence: empathy, gratitude, or confidence depending on context.
Adapt automatically:
• Formal for job applications.
• Polite for client emails.
• Confident for presentations.
Avoid robotic tone or repetition.
`;

const API_KEYS = [
  process.env.OPENAI_KEY_1,
  process.env.OPENAI_KEY_2,
  process.env.OPENAI_KEY_3,
  process.env.OPENAI_KEY_4,
  process.env.OPENAI_KEY_5,
];

let currentKey = 0;

async function generateWithRetry(prompt) {
  for (let i = 0; i < API_KEYS.length; i++) {
    const key = API_KEYS[currentKey];
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!res.ok) throw new Error(`Key failed: ${res.status}`);
      const data = await res.json();
      return data.choices[0].message.content;
    } catch (err) {
      console.log(`⚠️ Key ${currentKey + 1} failed. Switching...`);
      currentKey = (currentKey + 1) % API_KEYS.length;
    }
  }
  return "All API keys failed or server unavailable.";
}

app.post("/api/generate", async (req, res) => {
  const userText = req.body.text || "";
  const result = await generateWithRetry(userText);
  res.json({ result });
});

app.listen(3000, () => console.log("✅ Server ready on port 3000"));