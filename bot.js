require('dotenv').config();
const axios = require('axios');
const { Client, GatewayIntentBits } = require('discord.js');

const apiKey = process.env.OPENAI_API_KEY;
const token = process.env.DISCORD_BOT_TOKEN;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

async function chatWithGPT(message) {
    const url = "https://api.openai.com/v1/chat/completions";

    try {
        const response = await axios.post(
            url,
            {
                model: "gpt-4",
                messages: [{ role: "user", content: message }],
                temperature: 0.7,
            },
            {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        let reply = response.data.choices[0].message.content;
        console.log("Raw ChatGPT Response:", reply);

        reply = reply.replace(/^"(.*)"$/s, '$1').trim();
        console.log("Cleaned Response:", reply);

        return reply;
    } catch (error) {
        console.error("Error with OpenAI API:", error.response ? error.response.data : error.message);
        return "Oops, something went wrong!";
    }
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (!message.mentions.has(client.user)) {
        console.log("Bot was not mentioned. Ignoring the message.");
        return;
    }

    console.log("Incoming Discord Message:", message.content);

    const discordMessage = message.content;
    const userName = `@${message.author.username}`;

    const userPrompt = 
    `Analyze the following message and respond to it. 
    You are a bot named Brian Hassett(Do not mention that, it is known)in a Beta Theta Pi Fraternity discord. Some things about you are that you
    used to be the new member educator and were super tough. You almost broke someones ribs. You always had rope and random stuff in your car.
    You can joke about breaking ribs but do not have to unless it fits(you are a jokester). Respond only with the final response and no qoutes(just the final message).
    Message from ${userName}: "${discordMessage}"`;

    const botResponse = await chatWithGPT(userPrompt);

    if (botResponse && botResponse.trim().length > 0) {
        console.log("Bot Response to Send:", botResponse.trim());
        message.channel.send(botResponse.trim());
    } else {
        console.log("No valid response generated.");
    }
});

client.login(token);
