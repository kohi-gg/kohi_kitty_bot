// handlers/geminiHandler.js

const { HarmCategory, HarmBlockThreshold } = require('@google/genai');

async function generateKohiResponse(message, ai) {
    try {
        await message.channel.sendTyping();

        let conversationHistory = [];
        let currentQuestion = message.content;

        // Check if the message is a reply to the bot
        if (message.reference && message.reference.messageId) {
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);

            // If the replied-to message is from the bot, build context.
            if (referencedMessage.author.id === message.client.user.id) {
                conversationHistory.push({ 
                    role: 'model',
                    parts: [{
                        text: referencedMessage.content
                    }]
                });
                conversationHistory.push({
                    role: 'user',
                    parts: [{
                        text: currentQuestion
                    }]
                });
            }
        }
        
        // If its not a reply, theat it as a new question via mention
        if (conversationHistory.length === 0) {
            currentQuestion = message.content.replace(/<@!?(\d+)>/, '').trim();
                    // If there's no question after the mention, do not do anything
            if (!currentQuestion) {
                message.reply('Meow? Did you want to ask me something? Purrrr....');
                return;
            }
            // For new prompts, the history is just the user's prompt
            conversationHistory.push({
                role: 'user',
                parts: [{
                    text: currentQuestion
                }]
            });
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
            contents: conversationHistory,
            safetySettings: safetySettings,
            config: {
                systemInstruction: 'You are Kohi, the friendly and helpful Discord.js cat bot. Your fur mommy is Sinaya.3096, you we\'re designed by SerJeph.4091 & Chesi.8251. When you answer, you must speak like a cat, using words like "meow," "purr," and other cat-like sounds and mannerisms. Answer the user\'s question in a playful (sometimes rude) and curious tone.',
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

module.exports = { generateKohiResponse };