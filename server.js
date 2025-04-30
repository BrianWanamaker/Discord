import express from "express";
import nacl from "tweetnacl";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;

// Only for Discord signature verification
app.post(
  "/interactions",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    console.log("📩 Received /interactions");

    const signature = req.headers["x-signature-ed25519"];
    const timestamp = req.headers["x-signature-timestamp"];

    // Log body type and content for debugging
    console.log("🔍 req.body type:", typeof req.body);
    console.log("🔍 req.body instance:", req.body instanceof Buffer);
    console.log("🔍 Signature:", signature);
    console.log("🔍 Timestamp:", timestamp);

    if (!signature || !timestamp || !req.body || !(req.body instanceof Buffer)) {
      console.log("❌ Missing or invalid signature/timestamp/body");
      return res.status(400).send("Missing or invalid headers/body");
    }

    try {
      const message = Buffer.concat([
        Buffer.from(timestamp, "utf-8"),
        req.body,
      ]);

      const isVerified = nacl.sign.detached.verify(
        message,
        Buffer.from(signature, "hex"),
        Buffer.from(PUBLIC_KEY, "hex")
      );

      if (!isVerified) {
        console.log("❌ Signature verification failed");
        return res.status(401).send("Bad request signature");
      }

      const body = JSON.parse(req.body.toString("utf-8"));

      if (body.type === 1) {
        console.log("✅ Responding to Discord PING");
        return res.status(200).json({ type: 1 });
      }

      console.log("✅ Valid interaction but not a PING");
      return res.status(200).json({ type: 5 });
    } catch (err) {
      console.error("❌ Failed to process request:", err);
      return res.status(500).send("Internal server error");
    }
  }
);

// Health check
app.get("/", (req, res) => {
  res.send("✅ BrianBot is running!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
