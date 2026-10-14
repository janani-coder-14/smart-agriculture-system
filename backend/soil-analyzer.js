
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { createWorker } = require('tesseract.js');

// Columns from the sample report's "Test Results" table.
// Values retain the original report's abbreviations.
const TEST_COLUMNS = [
    'HM%',
    'W/V',
    'CEC',
    'BS%',
    'Ac',
    'pH',
    'P-I',
    'K-I',
    'Ca%',
    'Mg%',
    'S-I',
    'Mn-I',
    'Mn-Al1',
    'Mn-Al2',
    'Zn-I',
    'Zn-Al',
    'Cu-I',
    'Na',
    'ESP',
    'SS-I',
    'NO3-N'
];

const NUMERIC_PATTERN = /[-+]?\d+(?:\.\d+)?/g;

function extractNumbers(text) {
    return (text.match(NUMERIC_PATTERN) || []).map(Number);
}

function cleanText(text) {
    return String(text || '')
        .replace(/\u00a0/g, ' ')
        .replace(/[–—]/g, '-')
        .replace(/[ \t]+/g, ' ')
        .trim();
}

function getParameterPatterns() {
    return {
        ph: [
            /\bpH\s*[:=]\s*(\d+(?:\.\d+)?)/i
        ],
        cec: [
            /\bCEC\s*[:=]\s*(\d+(?:\.\d+)?)/i
        ],
        organicCarbon: [
            /\borganic\s+carbon\b\s*[:=]?\s*(\d+(?:\.\d+)?)/i
        ],
        nitrogen: [
            /\b(?:available\s+)?nitrogen\b\s*[:=]?\s*(\d+(?:\.\d+)?)/i
        ],
        phosphorus: [
            /\b(?:available\s+)?phosphorus\b\s*[:=]?\s*(\d+(?:\.\d+)?)/i
        ],
        potassium: [
            /\b(?:available\s+)?potassium\b\s*[:=]?\s*(\d+(?:\.\d+)?)/i
        ],
        electricalConductivity: [
            /\b(?:electrical\s+conductivity|EC)\b\s*[:=]?\s*(\d+(?:\.\d+)?)/i
        ]
    };
}

function extractNamedParameter(text, patterns) {
    for (const pattern of patterns) {
        const match = text.match(pattern);

        if (match) {
            const value = Number(match[1]);

            if (Number.isFinite(value)) {
                return value;
            }
        }
    }

    return null;
}

function classifyPh(value) {
    if (value === null || value === undefined) {
        return 'Not detected';
    }

    if (value < 0 || value > 14) {
        return 'Needs review';
    }

    if (value < 5.5) return 'Strongly acidic';
    if (value < 6.5) return 'Moderately acidic';
    if (value <= 7.5) return 'Near neutral';
    if (value <= 8.5) return 'Alkaline';

    return 'Strongly alkaline';
}

function classifyOrganicCarbon(value) {
    if (value === null || value === undefined) {
        return 'Not detected';
    }

    if (value < 0 || value > 100) {
        return 'Needs review';
    }

    // Preliminary interpretation only. Confirm the laboratory's
    // reporting units and local agronomic standards before using it.
    if (value < 0.5) return 'Low';
    if (value < 0.75) return 'Moderate';

    return 'High';
}

function extractSoilClass(text) {
    const match = text.match(/\bSoil\s+Class\s*:\s*([^\r\n]+)/i);

    if (!match) return null;

    return match[1]
        .split(/\b(?:Sample ID|Test Results|Recommendations)\b/i)[0]
        .trim()
        .slice(0, 100) || null;
}

function extractSampleIds(text) {
    const ids = [];
    const pattern = /\bSample\s*ID\s*:\s*([A-Z0-9_-]+)/gi;
    let match;

    while ((match = pattern.exec(text)) !== null) {
        const id = match[1].trim();

        if (!ids.includes(id)) {
            ids.push(id);
        }
    }

    return ids;
}

// Find a numeric test row in a sample section.
// The table has 21 columns, so a row with 21 values is preferred.
// OCR may insert spaces or line breaks, so we inspect lines first.
function extractTestRow(section) {
    const lines = section
        .split(/\r?\n/)
        .map(line => cleanText(line))
        .filter(Boolean);

    for (const line of lines) {
        if (/Test Results|Recommendations|Sample ID|Soil Class/i.test(line)) {
            continue;
        }

        const values = extractNumbers(line);

        if (values.length >= TEST_COLUMNS.length) {
            return values.slice(0, TEST_COLUMNS.length);
        }
    }

    // Fallback: find a sufficiently long numeric sequence in the section.
    // Do not guess if there are too few values to map to the table.
    const candidates = lines
        .filter(line => !/Test Results|Recommendations|Sample ID|Soil Class/i.test(line))
        .map(line => extractNumbers(line))
        .filter(values => values.length >= TEST_COLUMNS.length);

    return candidates.length ? candidates[0].slice(0, TEST_COLUMNS.length) : null;
}

function extractSamples(text) {
    const samplePattern =
        /\bSample\s*ID\s*:\s*([A-Z0-9_-]+)/gi;

    const matches = [];
    let match;

    while ((match = samplePattern.exec(text)) !== null) {
        matches.push({
            id: match[1].trim(),
            start: match.index,
            end: samplePattern.lastIndex
        });
    }

    if (matches.length === 0) {
        return [];
    }

    const samples = [];

    for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const next = matches[i + 1];

        const section = text.slice(
            current.start,
            next ? next.start : text.length
        );

        const values = extractTestRow(section);

        const measurements = {};

        if (values) {
            TEST_COLUMNS.forEach((column, index) => {
                measurements[column] = values[index];
            });
        }

        // The pH value is also exposed directly for the frontend.
        const ph = measurements.pH ?? null;

        samples.push({
            sampleId: current.id,
            soilClass: extractSoilClass(section),
            measurements,
            interpretation: {
                ph: classifyPh(ph)
            },
            extractionStatus: values ? 'Extracted - verify values' : 'Needs review'
        });
    }

    return samples;
}

async function readPdf(filePath) {
    const buffer = fs.readFileSync(filePath);
    const result = await pdfParse(buffer);

    return {
        text: result.text || '',
        extractionMethod: 'PDF text extraction',
        note: result.text && result.text.trim()
            ? null
            : 'No selectable text found. This PDF may be scanned; use OCR on a page image.'
    };
}

async function readImage(filePath) {
    const worker = await createWorker('eng');

    try {
        const result = await worker.recognize(filePath);

        return {
            text: result.data.text || '',
            extractionMethod: 'OCR',
            note: null
        };
    } finally {
        await worker.terminate();
    }
}

async function readReport(filePath, mimetype) {
    if (!fs.existsSync(filePath)) {
        throw new Error('Soil report file was not found.');
    }

    if (mimetype === 'application/pdf') {
        return readPdf(filePath);
    }

    if (
        mimetype === 'image/jpeg' ||
        mimetype === 'image/png'
    ) {
        return readImage(filePath);
    }

    throw new Error('Unsupported soil report file type.');
}

async function analyzeSoilReport(filePath, mimetype) {
    const extracted = await readReport(filePath, mimetype);
    const text = cleanText(extracted.text);

    const samples = extractSamples(text);
    const namedPatterns = getParameterPatterns();

    // Some laboratory reports use full parameter names instead of
    // the abbreviations in the sample table.
    const namedMeasurements = {};

    for (const [name, patterns] of Object.entries(namedPatterns)) {
        namedMeasurements[name] = extractNamedParameter(text, patterns);
    }

    const detectedSampleValues = samples.reduce(
        (count, sample) => count +
            Object.values(sample.measurements).filter(
                value => value !== undefined && value !== null
            ).length,
        0
    );

    const status =
        samples.length > 0 && detectedSampleValues > 0
            ? 'Analyzed'
            : 'Needs review';

    return {
        status,
        extractionMethod: extracted.extractionMethod,
        analyzedAt: new Date().toISOString(),
        sampleCount: samples.length,
        samples,
        namedMeasurements,
        detectedParameters: detectedSampleValues,
        note: extracted.note ||
            (
                samples.length === 0
                    ? 'No sample sections were detected. Check the report layout or review it manually.'
                    : detectedSampleValues === 0
                        ? 'Sample IDs were found, but the test-result rows could not be mapped reliably.'
                        : 'Automatically extracted table values must be verified against the original report.'
            )
    };
}

module.exports = {
    analyzeSoilReport,
    extractSamples,
    classifyPh,
    classifyOrganicCarbon
};
