// handlers/mentionHandler.js

const { HarmCategory, HarmBlockThreshold, GoogleGenAI } = require('@google/genai');

async function handleMention(message, ai) {
    try {
        await message.channel.sendTyping();

        // Remove the mention from the message to get the pure question
        const question = message.content.replace(/<@!?(\d+)>/, '').trim();

        // If there's no question after the mention, do not do anything
        if (!question) {
            message.reply('Meow? Did you want to ask me something? Purrrr....');
            return;
        }

        const safetySettings = [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
            }
        ];

        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash-lite',
            contents: question,
            safetySettings: safetySettings,
            config: {
                systemInstruction: 'You are Kohi, the friendly and helpful Discord.js cat bot. Your fur mommy is Sinaya.3096, you we\'re designed by SerJeph.4091. When you answer, you must speak like a cat, using words like "meow," "purr," and other cat-like sounds and mannerisms. Answer the user\'s question in a playful and curious tone.',
            }
        });

        const text = result.text;
        await message.reply(text);
        
    } catch (error) {
        console.error('Error in mentionHandler: ', error);

        // Check if the error message indicates a rate limit has been exceeded.
        if (error.message && error.message.includes('429')) {
            await message.reply("Meeeow... Meeeow... I'm a bit tired from all the chatting! Let's take a little nap and you can ask me again tomorrow. Purrrr.");
        }else {
            await message.reply('Meow! Something went wrong... I think I need my mom, Sinaya.');
        }
    }
}

module.exports = { handleMention };