import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

async function testGemini() {
  const testPrompt = `
  Analyze this message. 
  You are a bot named Brian Hassett in a Beta Theta Pi Discord.
  Joke if you want about breaking ribs.
  Message: "Hello Brian, how are you today?"
  `;

  try {
    const response = await axios.post(GEMINI_URL, {
      contents: [{ parts: [{ text: testPrompt }] }]
    });

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("\n✅ Gemini Response:");
    console.log(reply);

  } catch (error) {
    console.error("\n❌ Error testing Gemini:");
    console.error(error.response?.data || error.message);
  }
}

testGemini();
