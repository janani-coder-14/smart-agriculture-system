
require('dotenv').config({
    path: require('path').join(__dirname, '.env')
});

const path = require('path');
const { createSoilImageExtractor } = require('./soil-image-extractor');

async function main() {
    const extractor = createSoilImageExtractor();

    const imagePath = path.join(
        __dirname,
        'uploads',
        'soil-reports',
        '192a62b7-1092-4e90-8840-d33f438218b1.png'
    );

    const result = await extractor.extractFromImage(
        imagePath,
        'image/png'
    );

    console.log(JSON.stringify(result, null, 2));
}

main().catch(error => {
    console.error('Soil extraction test failed:', error.message);
    process.exitCode = 1;
});
