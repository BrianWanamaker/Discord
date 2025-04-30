const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [
  {
    name: 'talk',
    description: 'Talk to BrianBot using Gemini AI',
    options: [
      {
        name: 'message',
        type: 3, // STRING
        description: 'What you want to say',
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
