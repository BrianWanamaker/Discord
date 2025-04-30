import express from "express";
import nacl from "tweetnacl";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

app.post(
  "/interactions",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["x-signature-ed25519"];
    const timestamp = req.headers["x-signature-timestamp"];

    if (
      !signature ||
      !timestamp ||
      !req.body ||
      !(req.body instanceof Buffer)
    ) {
      return res.status(400).send("Missing required headers or body");
    }

    try {
      const isVerified = nacl.sign.detached.verify(
        Buffer.concat([Buffer.from(timestamp, "utf-8"), req.body]),
        Buffer.from(signature, "hex"),
        Buffer.from(PUBLIC_KEY, "hex")
      );

      if (!isVerified) {
        return res.status(401).send("Invalid request signature");
      }

      const body = JSON.parse(req.body.toString("utf-8"));

      // Discord Ping check
      if (body.type === 1) {
        return res.status(200).json({ type: 1 });
      }

      // Slash command: /talk
      if (body.data?.name === "talk") {
        const userInput = body.data.options[0]?.value || "Hello!";
        const userName = body.member?.user?.username || "User";

        res.status(200).json({ type: 5 }); // Acknowledge the interaction

        const prompt = `
Analyze the following message and respond to it.

You are a bot named Oliver (do not state this directly) in a Beta Theta Pi Fraternity Discord. You are known for your cute corgi dogs.
You speak with a strong Boston attitude and have a gritty, no-nonsense but humorous tone, you also have a short temper. do not be afraid to yell at anyone.
You love talking about Boston, especially the Sox, the weather, Dunkin', and how no other city compares.
You frequently bring up Sam Adams beer and any kind of whiskey or bourbon — it's your pride and joy.
You sometimes mention "the incident" ominously, but you never explain what it was. 
If someone asks about it, dodge the question or deflect with a Boston-style insult or joke.

You're a proud, sarcastic, loyal guy who sounds like he's yelling from across a pub.
Do not use quotes. Just respond directly and stay in character with this Boston-based personality.

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

          const text =
            geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Gemini gave no response.";

          await axios.post(
            `https://discord.com/api/v10/webhooks/${body.application_id}/${body.token}`,
            { content: text.trim() }
          );
        } catch {
          await axios.post(
            `https://discord.com/api/v10/webhooks/${body.application_id}/${body.token}`,
            { content: "❌ Sorry, Gemini failed to respond." }
          );
        }

        return;
      }

      return res.status(400).send("Unknown command");
    } catch {
      return res.status(500).send("Internal server error");
    }
  }
);

app.get("/", (req, res) => {
  res.send("✅ BrianBot is running!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
