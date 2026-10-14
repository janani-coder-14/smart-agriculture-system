
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createSoilService(options = {}) {
    const dataFile = options.dataFile ||
        path.join(__dirname, 'data', 'soil-reports.json');

    const uploadDir = options.uploadDir ||
        path.join(__dirname, 'uploads', 'soil-reports');

    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.mkdirSync(uploadDir, { recursive: true });

    let reports = [];

    if (fs.existsSync(dataFile)) {
        try {
            reports = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

            if (!Array.isArray(reports)) {
                reports = [];
            }
        } catch (error) {
            console.error('Could not read soil report data:', error.message);
            reports = [];
        }
    }

    // Save report metadata and analysis results to JSON.
    function save() {
        const tempFile = dataFile + '.tmp';

        fs.writeFileSync(
            tempFile,
            JSON.stringify(reports, null, 2),
            'utf8'
        );

        fs.renameSync(tempFile, dataFile);
    }

    // Return reports belonging to the requested farmer.
    function list(farmerId) {
        return reports.filter(
            report => String(report.farmerId) === String(farmerId)
        );
    }

    // Create a report record after successful file upload.
    function add(farmerId, file) {
        const report = {
            id: crypto.randomUUID(),
            farmerId: String(farmerId),
            originalName: file.originalname,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            status: 'Uploaded - not yet analyzed',
            analysis: null
        };

        reports.push(report);

        try {
            save();
        } catch (error) {
            reports = reports.filter(item => item.id !== report.id);
            throw error;
        }

        return report;
    }

    // Store analysis output for an existing report.
    function updateAnalysis(farmerId, reportId, analysis) {
        const report = find(farmerId, reportId);

        if (!report) {
            return null;
        }

        const previousAnalysis = report.analysis;
        const previousStatus = report.status;

        report.analysis = {
            ...analysis,
            analyzedAt: analysis.analyzedAt || new Date().toISOString()
        };

        report.status = analysis.status || 'Analyzed';

        try {
            save();
        } catch (error) {
            report.analysis = previousAnalysis;
            report.status = previousStatus;
            throw error;
        }

        return report;
    }

    // Retrieve one report belonging to the requested farmer.
    function find(farmerId, reportId) {
        return reports.find(
            report =>
                report.id === reportId &&
                String(report.farmerId) === String(farmerId)
        ) || null;
    }

    // Delete a report and its uploaded file.
    function remove(farmerId, reportId) {
        const index = reports.findIndex(
            report =>
                report.id === reportId &&
                String(report.farmerId) === String(farmerId)
        );

        if (index === -1) {
            return null;
        }

        const report = reports[index];
        const filePath = path.join(uploadDir, report.filename);

        // Remove the file first, then persist the metadata change.
        // If the file is already missing, allow metadata deletion.
        try {
            fs.unlinkSync(filePath);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

        reports.splice(index, 1);

        try {
            save();
        } catch (error) {
            reports.splice(index, 0, report);
            throw error;
        }

        return report;
    }

    return {
        list,
        add,
        find,
        remove,
        updateAnalysis,
        uploadDir
    };
}

module.exports = { createSoilService };
