require('dotenv').config();
const axios = require('axios');

const apiKey = process.env.OPENAI_API_KEY;

async function chatWithGPT(message) {
    const url = "https://api.openai.com/v1/chat/completions";
    
    try {
        const response = await axios.post(
            url,
            {
                model: "gpt-4o-mini",
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
        
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Error with OpenAI API:", error.response ? error.response.data : error.message);
        return "Oops, something went wrong!";
    }
}

(async () => {
    const discordMessage = "Ugh, I can't believe we have to do this again. This is so unfair.";
    const userName = "@Brian Wanamaker";
    const userMessage = 
    `The message below is from a Discord user named ${userName}. Determine if the message is complaining or annoying.
    1. Message: "${discordMessage}"
    2. Is the message complaining? (Yes/No)
    3. Is the message annoying? (Yes/No)
    4. If 2 or 3 is a No, DO NOT give a response.
    5. Write an aggressive but funny response, who is a bot whose job is to yell at people. 
    Always joke about breaking their ribs. Include a response that fits the tone of the message.`;
    const reply = await chatWithGPT(userMessage);
    console.log(reply);
})();
