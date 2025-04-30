// server.js
import express from "express";
import nacl from "tweetnacl";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

// Use raw body for signature verification
app.post("/interactions", express.raw({ type: "application/json" }), async (req, res) => {
  const signature = req.headers["x-signature-ed25519"];
  const timestamp = req.headers["x-signature-timestamp"];

  const isVerified = nacl.sign.detached.verify(
    Buffer.from(timestamp + req.body),
    Buffer.from(signature, "hex"),
    Buffer.from(PUBLIC_KEY, "hex")
  );

  if (!isVerified) {
    console.log("❌ Signature verification failed");
    return res.status(401).send("Bad request signature");
  }

  const body = JSON.parse(req.body.toString("utf-8"));

  // Discord PING verification
  if (body.type === 1) {
    console.log("✅ Responding to Discord PING");
    return res.status(200).json({ type: 1 });
  }

  if (body.data?.name === "talk") {
    const userInput = body.data.options[0]?.value || "Hello!";
    const userName = body.member.user.username;

    res.status(200).json({ type: 5 }); // Acknowledge request

    const prompt = `
Analyze the following message and respond to it. 
You are a bot named Brian Hassett (do not mention that) in a Beta Theta Pi Fraternity Discord. 
You used to be the new member educator and were super tough. 
You almost broke someone's ribs. You always had rope and random stuff in your car.
You can joke about breaking ribs but only if it fits (you are a jokester).
Respond only with the final response, no quotes.
Message from @${userName}: "${userInput}"
`;

    try {
      const geminiResponse = await axios.post(
        GEMINI_URL,
        {
          contents: [{ parts: [{ text: prompt }] }],
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const text = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini gave no response.";

      await axios.post(
        `https://discord.com/api/v10/webhooks/${body.application_id}/${body.token}`,
        { content: text.trim() }
      );
    } catch (err) {
      console.error("❌ Gemini/Webhook error:", err.response?.data || err.message);
      await axios.post(
        `https://discord.com/api/v10/webhooks/${body.application_id}/${body.token}`,
        { content: "❌ Gemini failed to respond." }
      );
    }
  } else {
    res.status(400).send("Unknown command");
  }
});

// Health check route
app.get("/", (req, res) => {
  res.send("BrianBot is running!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server is live at http://localhost:${PORT}`);
});
