// server.js
import express from "express";
import nacl from "tweetnacl";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;

app.post("/interactions", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    console.log("📩 Received POST /interactions");

    const signature = req.headers["x-signature-ed25519"];
    const timestamp = req.headers["x-signature-timestamp"];

    const isVerified = nacl.sign.detached.verify(
      Buffer.concat([Buffer.from(timestamp), req.body]),
      Buffer.from(signature, "hex"),
      Buffer.from(PUBLIC_KEY, "hex")
    );

    if (!isVerified) {
      console.log("❌ Signature verification failed");
      return res.status(401).send("Bad request signature");
    }

    const body = JSON.parse(req.body.toString("utf-8"));
    console.log("🧪 Body parsed:", body);

    if (body.type === 1) {
      console.log("✅ Responding to Discord PING");
      return res.status(200).json({ type: 1 });
    }

    console.log("⚠️ Not a PING — sending basic response");
    return res.status(200).json({ type: 5 }); // temporary response for slash commands
  } catch (err) {
    console.error("❌ ERROR inside /interactions:", err);
    return res.status(500).send("Internal error");
  }
});

// Health check route
app.get("/", (req, res) => {
  res.send("BrianBot is running!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server is live at http://localhost:${PORT}`);
});
