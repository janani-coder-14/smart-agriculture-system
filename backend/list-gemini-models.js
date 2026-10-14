
require('dotenv').config({
    path: require('path').join(__dirname, '.env')
});

const { GoogleGenAI } = require('@google/genai');

async function main() {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is missing from .env');
    }

    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    });

    const models = await ai.models.list();

    console.log('\nAvailable Gemini models:\n');

    for await (const model of models) {
        if (
            model.supportedActions?.includes('generateContent') ||
            model.supportedGenerationMethods?.includes('generateContent')
        ) {
            console.log(model.name);
        }
    }
}

main().catch(error => {
    console.error('Could not list models:', error.message);
});
