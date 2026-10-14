
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const request = require('../../backend/node_modules/supertest');

const { createApp } = require('../../backend/app');
const { createService } = require('../../backend/service');
const { createSoilService } = require('../../backend/soil-service');

const extractorModule = require('../../backend/soil-image-extractor');
const aiModule = require('../../backend/soil-ai-service');

let app;
let farmerId;
let soilService;
let tempDir;

const originalExtractor = extractorModule.createSoilImageExtractor;
const originalAIService = aiModule.createSoilAIService;

test.before(() => {
    tempDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'soil-api-test-')
    );

    soilService = createSoilService({
        dataFile: path.join(tempDir, 'soil-reports.json'),
        uploadDir: path.join(tempDir, 'uploads')
    });

    const service = createService();

    const registration = service.register({
        name: 'Soil Test Farmer',
        mobile: '9876543210',
        email: 'soiltest@example.com',
        password: 'secret1',
        confirmPassword: 'secret1'
    });

    assert.equal(registration.status, 201);
    farmerId = registration.body.farmer.id;

    // Mock external AI services so tests do not call Gemini.
    extractorModule.createSoilImageExtractor = () => ({
        extractFromImage: async () => ({
            status: 'Extracted',
            columnHeadings: ['pH'],
            samples: [
                {
                    measurements: {
                        pH: { value: 6.5, uncertain: false }
                    }
                }
            ],
            unreadableItems: []
        })
    });

    aiModule.createSoilAIService = () => ({
        interpretSoilAnalysis: async () => ({
            summary: 'Mock soil analysis',
            cropSuggestions: ['Rice']
        })
    });

    app = createApp(service, soilService);
});

test.after(() => {
    extractorModule.createSoilImageExtractor = originalExtractor;
    aiModule.createSoilAIService = originalAIService;

    if (tempDir) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

test('SOIL API 1: list reports for an existing farmer', async () => {
    const response = await request(app)
        .get(`/api/farmers/${farmerId}/soil-reports`);

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body.reports));
});

test('SOIL API 2: listing reports for unknown farmer returns 404', async () => {
    const response = await request(app)
        .get('/api/farmers/unknown-farmer/soil-reports');

    assert.equal(response.status, 404);
});

test('SOIL API 3: upload without a file returns 400', async () => {
    const response = await request(app)
        .post(`/api/farmers/${farmerId}/soil-reports`);

    assert.equal(response.status, 400);
    assert.match(response.body.message, /select/i);
});

test('SOIL API 4: reject unsupported file type', async () => {
    const response = await request(app)
        .post(`/api/farmers/${farmerId}/soil-reports`)
        .attach('report', Buffer.from('not an image'), {
            filename: 'report.txt',
            contentType: 'text/plain'
        });

    assert.equal(response.status, 400);
});

test('SOIL API 5: upload a PNG and save analysis', async () => {
    const response = await request(app)
        .post(`/api/farmers/${farmerId}/soil-reports`)
        .attach('report', Buffer.from('mock image bytes'), {
            filename: 'soil-report.png',
            contentType: 'image/png'
        });

    assert.equal(response.status, 201);
    assert.ok(response.body.report.id);
    assert.equal(response.body.report.farmerId, String(farmerId));
    assert.equal(response.body.analysisSuccess, true);
    assert.equal(
        response.body.report.analysis.ai.summary,
        'Mock soil analysis'
    );
});

test('SOIL API 6: retrying analysis for missing report returns 404', async () => {
    const response = await request(app)
        .post(
            `/api/farmers/${farmerId}/soil-reports/missing-report/analyze`
        );

    assert.equal(response.status, 404);
    assert.match(response.body.message, /not found/i);
});

test('SOIL API 7: downloading missing report returns 404', async () => {
    const response = await request(app)
        .get(
            `/api/farmers/${farmerId}/soil-reports/missing-report/download`
        );

    assert.equal(response.status, 404);
});

test('SOIL API 8: deleting missing report returns 404', async () => {
    const response = await request(app)
        .delete(
            `/api/farmers/${farmerId}/soil-reports/missing-report`
        );

    assert.equal(response.status, 404);
});

test('SOIL API 9: delete an uploaded report', async () => {
    const upload = await request(app)
        .post(`/api/farmers/${farmerId}/soil-reports`)
        .attach('report', Buffer.from('mock image bytes'), {
            filename: 'delete-test.png',
            contentType: 'image/png'
        });

    assert.equal(upload.status, 201);

    const reportId = upload.body.report.id;

    const deletion = await request(app)
        .delete(`/api/farmers/${farmerId}/soil-reports/${reportId}`);

    assert.equal(deletion.status, 200);

    const listing = await request(app)
        .get(`/api/farmers/${farmerId}/soil-reports`);

    assert.equal(
        listing.body.reports.some(report => report.id === reportId),
        false
    );
});
