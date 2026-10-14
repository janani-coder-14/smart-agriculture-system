
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createSoilService } = require('../../backend/soil-service');

const tempDirs = [];

function createTestService() {
    const tempDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'soil-service-test-')
    );

    tempDirs.push(tempDir);

    const dataFile = path.join(tempDir, 'soil-reports.json');
    const uploadDir = path.join(tempDir, 'uploads');

    const service = createSoilService({
        dataFile,
        uploadDir
    });

    return { service, dataFile, uploadDir };
}

afterEach(() => {
    while (tempDirs.length > 0) {
        const dir = tempDirs.pop();
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

function sampleFile(overrides = {}) {
    return {
        originalname: 'soil-report.png',
        filename: 'test-report.png',
        mimetype: 'image/png',
        size: 1024,
        ...overrides
    };
}

test('SOIL UNIT 1: add a soil report', () => {
    const { service } = createTestService();

    const report = service.add('101', sampleFile());

    assert.ok(report.id);
    assert.equal(report.farmerId, '101');
    assert.equal(report.originalName, 'soil-report.png');
    assert.equal(report.status, 'Uploaded - not yet analyzed');
    assert.equal(report.analysis, null);
});

test('SOIL UNIT 2: list reports for the correct farmer', () => {
    const { service } = createTestService();

    service.add('101', sampleFile());
    service.add('202', sampleFile({
        filename: 'another-report.png'
    }));

    const reports = service.list('101');

    assert.equal(reports.length, 1);
    assert.equal(reports[0].farmerId, '101');
});

test('SOIL UNIT 3: find an existing report', () => {
    const { service } = createTestService();

    const report = service.add('101', sampleFile());

    assert.equal(service.find('101', report.id).id, report.id);
});

test('SOIL UNIT 4: do not expose another farmer report', () => {
    const { service } = createTestService();

    const report = service.add('101', sampleFile());

    assert.equal(service.find('202', report.id), null);
});

test('SOIL UNIT 5: update and persist analysis', () => {
    const { service, dataFile } = createTestService();

    const report = service.add('101', sampleFile());

    const updated = service.updateAnalysis('101', report.id, {
        status: 'Analyzed',
        ai: { summary: 'Soil report reviewed' }
    });

    assert.equal(updated.status, 'Analyzed');
    assert.equal(updated.analysis.ai.summary, 'Soil report reviewed');
    assert.ok(updated.analysis.analyzedAt);

    const savedReports = JSON.parse(
        fs.readFileSync(dataFile, 'utf8')
    );

    assert.equal(savedReports.length, 1);
    assert.equal(savedReports[0].status, 'Analyzed');
});

test('SOIL UNIT 6: updating a missing report returns null', () => {
    const { service } = createTestService();

    const result = service.updateAnalysis(
        '101',
        'missing-report',
        { status: 'Analyzed' }
    );

    assert.equal(result, null);
});

test('SOIL UNIT 7: deleting a report removes its file and metadata', () => {
    const { service, uploadDir, dataFile } = createTestService();

    const report = service.add('101', sampleFile());

    const uploadedPath = path.join(uploadDir, report.filename);
    fs.writeFileSync(uploadedPath, 'test file content');

    const removed = service.remove('101', report.id);

    assert.equal(removed.id, report.id);
    assert.equal(service.find('101', report.id), null);
    assert.equal(fs.existsSync(uploadedPath), false);

    const savedReports = JSON.parse(
        fs.readFileSync(dataFile, 'utf8')
    );

    assert.equal(savedReports.length, 0);
});

test('SOIL UNIT 8: deleting a missing report returns null', () => {
    const { service } = createTestService();

    assert.equal(
        service.remove('101', 'missing-report'),
        null
    );
});

test('SOIL UNIT 9: analysis update cannot affect another farmer', () => {
    const { service } = createTestService();

    const report = service.add('101', sampleFile());

    const result = service.updateAnalysis('202', report.id, {
        status: 'Analyzed'
    });

    assert.equal(result, null);
    assert.equal(service.find('101', report.id).analysis, null);
});
