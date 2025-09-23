const { Events } = require("discord.js");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Ignore bot messages
    if (message.author.bot) return;

    // 20% chance to trigger (optional, adjust if you want always-on)
    if (Math.random() > 0.2) return;

    // Transform the message into meow-speak
    const meowified = meowify(message.content);

    // Reply with the meowified version
    if (meowified !== message.content) {
      await message.reply(meowified);
    }
  },
};

function meowify(text) {
  // Replace vowels randomly with "meow"
  return text.replace(/[aeiou]/gi, (char) => {
    if (Math.random() > 0.5) {
      return "meow";
    }
    return char;
  });
}
