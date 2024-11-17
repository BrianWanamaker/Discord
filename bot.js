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

// Function to interact with ChatGPT
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

        // Remove surrounding quotes, if any
        reply = reply.replace(/^"(.*)"$/s, '$1').trim();
        console.log("Cleaned Response:", reply);

        return reply;
    } catch (error) {
        console.error("Error with OpenAI API:", error.response ? error.response.data : error.message);
        return "Oops, something went wrong!";
    }
}

// Event listener for when the bot is ready
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Event listener for new messages
client.on('messageCreate', async (message) => {
    // Ignore messages from the bot itself
    if (message.author.bot) return;

    console.log("Incoming Discord Message:", message.content);

    const discordMessage = message.content;
    const userName = `@${message.author.username}`;

    // Prompt instructing ChatGPT to analyze and respond
    const userPrompt = `
    Analyze the following message and determine if it is complaining, annoying, or aggressive. 
    If it is neither, respond only with "Do not respond." If it is complaining or annoying, respond aggressively but humorously as a bot named "Brian Hassett", 
    whose job is to yell at people. 
    Always joke about breaking ribs. Respond only with the final response.
    Message from ${userName}: "${discordMessage}"`;

    const botResponse = await chatWithGPT(userPrompt);

    // Check if the response is "Do not respond." If so, skip responding.
    if (botResponse.trim() === "Do not respond.") {
        console.log("No response generated for non-annoying or non-complaining message.");
        return;
    }

    // If there is a valid response, send it to the Discord channel
    if (botResponse && botResponse.trim().length > 0) {
        console.log("Bot Response to Send:", botResponse.trim());
        message.channel.send(botResponse.trim());
    } else {
        console.log("No valid response generated.");
    }
});

// Log in to Discord
client.login(token);
