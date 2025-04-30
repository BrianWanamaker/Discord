import express from "express";
import nacl from "tweetnacl";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

const PORT = process.env.PORT || 3000;

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

function verifyDiscordRequest(req) {
  const signature = req.headers["x-signature-ed25519"];
  const timestamp = req.headers["x-signature-timestamp"];
  const isValid = nacl.sign.detached.verify(
    Buffer.from(timestamp + req.rawBody),
    Buffer.from(signature, "hex"),
    Buffer.from(PUBLIC_KEY, "hex")
  );
  return isValid;
}

app.post("/interactions", async (req, res) => {
  if (!verifyDiscordRequest(req)) {
    return res.status(401).send("Bad request signature");
  }

  const body = req.body;

  if (body.type === 1) {
    return res.status(200).json({ type: 1 });
  }

  if (body.data?.name === "talk") {
    const userInput = body.data.options[0]?.value || "Hello!";
    const userName = body.member.user.username;

    const prompt = `
Analyze the following message and respond to it. 
You are a bot named Brian Hassett (do not mention that) in a Beta Theta Pi Fraternity Discord. 
You used to be the new member educator and were super tough. 
You almost broke someone's ribs. You always had rope and random stuff in your car.
You can joke about breaking ribs but only if it fits (you are a jokester).
Respond only with the final response, no quotes.
Message from @${userName}: "${userInput}"
`;

    // Respond to Discord quickly
    res.status(200).json({ type: 5 });

    try {
      const geminiResponse = await axios.post(GEMINI_URL, {
        contents: [{ parts: [{ text: prompt }] }],
      }, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });

      const geminiText =
        geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini gave no response.";

      await axios.post(
        `https://discord.com/api/v10/webhooks/${body.application_id}/${body.token}`,
        { content: geminiText.trim() }
      );
    } catch (err) {
      console.error("❌ Gemini error:", err.response?.data || err.message);
      await axios.post(
        `https://discord.com/api/v10/webhooks/${body.application_id}/${body.token}`,
        { content: "❌ Gemini failed." }
      );
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 BrianBot server running on port ${PORT}`);
});
