import nacl from "tweetnacl";
import axios from "axios";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
  maxDuration: 10,
};

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

function verifyDiscordRequest(req, bodyBuffer) {
  try {
    const signature = req.headers["x-signature-ed25519"];
    const timestamp = req.headers["x-signature-timestamp"];

    console.log("🧪 Signature:", signature);
    console.log("🧪 Timestamp:", timestamp);
    console.log("🧪 Public Key:", PUBLIC_KEY?.slice(0, 10), "...");

    const isValid = nacl.sign.detached.verify(
      Buffer.from(timestamp + bodyBuffer),
      Buffer.from(signature, "hex"),
      Buffer.from(PUBLIC_KEY, "hex")
    );

    console.log("🔐 Signature valid?", isValid);
    return isValid;
  } catch (err) {
    console.error("❌ Error in verifyDiscordRequest:", err);
    return false;
  }
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  console.log("🔥 Incoming Discord request");

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const rawBody = await getRawBody(req);

  if (!verifyDiscordRequest(req, rawBody)) {
    console.log("❌ Signature verification failed");
    return res.status(401).send("Bad request signature");
  }
  console.log("✅ Signature verified");

  const body = JSON.parse(rawBody.toString("utf-8"));

  if (body.type === 1) {
    console.log("✅ Responding to PING");
    return res.status(200).json({ type: 1 });
  }

  if (body.data?.name === "talk") {
    const userInput = body.data.options[0]?.value || "Hello!";
    const userName = body.member.user.username;

    console.log("✅ /talk command from:", userName);
    console.log("🧠 Prompt:", userInput);

    // Defer response so Discord doesn't timeout
    res.status(200).json({ type: 5 });

    const prompt = `
Analyze the following message and respond to it. 
You are a bot named Brian Hassett (do not mention that) in a Beta Theta Pi Fraternity Discord. 
You used to be the new member educator and were super tough. 
You almost broke someone's ribs. You always had rope and random stuff in your car.
You can joke about breaking ribs but only if it fits (you are a jokester).
Respond only with the final response, no quotes.
Message from @${userName}: "${userInput}"
`;

    await (async () => {
      try {
        console.log("🌐 Testing external API (GitHub)...");

        const githubResponse = await axios.get("https://api.github.com");

        console.log("📦 GitHub response:", githubResponse.data);

        const reply =
          githubResponse.data?.current_user_url || "No response from GitHub";

        await axios.post(
          `https://discord.com/api/v10/webhooks/${body.application_id}/${body.token}`,
          {
            content: `✅ GitHub API responded. Example field: ${reply}`,
          }
        );
      } catch (err) {
        console.error(
          "❌ GitHub test failed:",
          err.response?.data || err.message
        );
        await axios.post(
          `https://discord.com/api/v10/webhooks/${body.application_id}/${body.token}`,
          {
            content: "❌ GitHub API test failed.",
          }
        );
      }
    })();

    return;
  }

  console.log("❓ Unknown command received");
  return res.status(400).send("Unknown command");
}
