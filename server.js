// server.js
import express from "express";
import nacl from "tweetnacl";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;

app.post("/interactions", express.raw({ type: "application/json" }), (req, res) => {
  console.log("📩 Received /interactions");

  try {
    const signature = req.headers["x-signature-ed25519"];
    const timestamp = req.headers["x-signature-timestamp"];

    if (!signature || !timestamp) {
      console.log("❌ Missing headers");
      return res.status(401).send("Missing signature headers");
    }

    const isValid = nacl.sign.detached.verify(
      Buffer.from(timestamp + req.body),
      Buffer.from(signature, "hex"),
      Buffer.from(PUBLIC_KEY, "hex")
    );

    if (!isValid) {
      console.log("❌ Invalid signature");
      return res.status(401).send("Invalid request signature");
    }

    const body = JSON.parse(req.body.toString("utf-8"));

    // Respond to Discord PING
    if (body.type === 1) {
      console.log("✅ Responding to PING");
      return res.status(200).json({ type: 1 });
    }

    // Placeholder for other command types
    console.log("⚠️ Not a PING");
    return res.status(200).json({ type: 5 });
  } catch (err) {
    console.error("❌ Failed to process request:", err);
    return res.status(500).send("Internal server error");
  }
});

app.get("/", (req, res) => {
  res.send("✅ BrianBot is running!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
