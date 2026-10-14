
const path = require('path');
const sharp = require('sharp');
const { createWorker } = require('tesseract.js');

async function main() {
    const imagePath = path.join(
        __dirname,
        'uploads',
        'soil-reports',
        '192a62b7-1092-4e90-8840-d33f438218b1.png'
    );

    const processedPath = path.join(
        __dirname,
        'uploads',
        'soil-reports',
        'soil-report-processed.png'
    );

    try {
        await sharp(imagePath)
            .rotate()
            .resize({ width: 2400, withoutEnlargement: false })
            .greyscale()
            .normalize()
            .sharpen()
            .png()
            .toFile(processedPath);

        console.log('Preprocessed image saved:', processedPath);

        const worker = await createWorker('eng');

        try {
            for (const psm of [6, 11]) {
                await worker.setParameters({
                    tessedit_pageseg_mode: psm
                });

                const result = await worker.recognize(processedPath);

                console.log(`\n========== OCR MODE ${psm} ==========`);
                console.log(result.data.text);
            }
        } finally {
            await worker.terminate();
        }
    } catch (error) {
        console.error('OCR test failed:', error.message);
    }
}

main();
