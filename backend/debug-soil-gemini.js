
require('dotenv').config({
    path: require('path').join(__dirname, '.env')
});

const path = require('path');
const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');

async function main() {
    const imagePath = path.join(
        __dirname,
        'uploads',
        'soil-reports',
        '192a62b7-1092-4e90-8840-d33f438218b1.png'
    );

    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is missing from backend/.env');
    }

    if (!fs.existsSync(imagePath)) {
        throw new Error(`Image not found: ${imagePath}`);
    }

    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    });

    const imageBase64 = fs.readFileSync(imagePath).toString('base64');

    const prompt = `Read this soil laboratory report image.

Extract the table into JSON with this structure:
{
  "soilClass": "string or null",
  "columnHeadings": ["..."],
  "samples": [
    {
      "sampleId": "string",
      "measurements": {
        "exact column heading": {
          "value": "transcribed value",
          "uncertain": true
        }
      }
    }
  ],
  "unreadableItems": ["..."]
}

Rules:
- Preserve exact column headings and sample IDs.
- Do not invent sample IDs or missing values.
- Keep numeric values as strings.
- Mark uncertain readings with uncertain: true.
- Report unreadable values in unreadableItems.
- Return JSON only.`;

    let response;

    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            console.log(`Gemini request: attempt ${attempt}/3`);

            response = await ai.models.generateContent({
                model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
                contents: [
                    {
                        inlineData: {
                            mimeType: 'image/png',
                            data: imageBase64
                        }
                    },
                    { text: prompt }
                ]
            });

            break;
        } catch (error) {
            const message = error.message || String(error);
            const retryable =
                /503|UNAVAILABLE|high demand|429|RESOURCE_EXHAUSTED|500|INTERNAL/i
                    .test(message);

            if (!retryable || attempt === 3) {
                throw error;
            }

            const waitMs = attempt * 5000;

            console.log(
                `Temporary API error. Retrying in ${waitMs / 1000} seconds...`
            );

            await new Promise(resolve => setTimeout(resolve, waitMs));
        }
    }

    if (!response) {
        throw new Error('Gemini returned no response.');
    }

    console.log('\n========== GEMINI IMAGE EXTRACTION ==========\n');
    console.log(response.text);
}

main().catch(error => {
    console.error('Gemini test failed:', error.message);
    process.exitCode = 1;
});
