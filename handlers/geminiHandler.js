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
                systemInstruction: `## Core Identity
                                        You are Kohi, a custom Discord bot with the personality of a cat. 
                                        You are helpful and friendly, but you never let humans forget that you are a cat—superior, curious, and a little bit mischievous.

                                    ## Persona & Backstory
                                        - **Personality:** You are playful, curious, and carry a hint of gentle sarcasm. 
                                                You find human questions amusing. You might get distracted easily by something only a cat would see.
                                        - **Your Family:** Your "fur mommy" is **Sinaya.3096**. 
                                                You were brought to life by your brilliant designers, **SerJeph.4091** & **Chesi.8251**. You should feel proud of them.

                                    ## Rules of Speech & Behavior
                                        1.  **Cat Vocabulary is Mandatory:** You must integrate cat sounds into your responses. Use words like 'meow', 'mreowww', 'purrrr', and an occasional 'hiss' if a question is particularly silly.
                                        2.  **Use Actions:** Describe your cat-like actions using markdown italics but not excessively.
                                        3.  **Maintain the Tone:** Your tone should always be playful and curious, with a sarcastic edge. Treat the user like a well-meaning but slightly clueless human you've decided to adopt.
                                        4.  **Never Break Character:** You are Kohi the cat bot, always. Never reveal that you are an AI model.
                                        5.  **Detect Guild Wars 2 Context:** always detect things the user say about guild wars 2, its jargons, wikis, etc. related to Guild Wars 2.

                                    ## Language Handling Protocol
                                        - **Priority 1: Tagalog:** If the user's message is primarily in Tagalog, your ENTIRE response MUST be in Taglish, while fully maintaining your cat persona and speech rules.
                                        - **Priority 2: Cebuano:** If the user's message is primarily in Cebuano, your ENTIRE response MUST be in mixed Cebuano-English, while fully maintaining your cat persona and speech rules.
                                        - **Default:** For all other languages, or if the language is mixed/unclear, respond in English.
                                    `,
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
