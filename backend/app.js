const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');

const { createService } = require('./service');
const { createSoilService } = require('./soil-service');
const { createWeatherService } = require('./weather-service');

function createApp(
    service = createService(),
    soilService = createSoilService(),
    weatherService = createWeatherService()
) {
    const app = express();

    // Initialize AI services only when analysis is requested.
    let soilAIService;
    let soilImageExtractor;

    function getSoilAIService() {
        if (!soilAIService) {
            const { createSoilAIService } = require('./soil-ai-service');
            soilAIService = createSoilAIService();
        }
        return soilAIService;
    }

    function getSoilImageExtractor() {
        if (!soilImageExtractor) {
            const {
                createSoilImageExtractor
            } = require('./soil-image-extractor');

            soilImageExtractor = createSoilImageExtractor();
        }
        return soilImageExtractor;
    }

    app.use(express.json());

    // --------------------------------------------------
    // FILE UPLOAD CONFIGURATION
    // --------------------------------------------------

    const storage = multer.diskStorage({
        destination: (req, file, callback) => {
            callback(null, soilService.uploadDir);
        },
        filename: (req, file, callback) => {
            const extension = path.extname(file.originalname).toLowerCase();
            callback(null, `${crypto.randomUUID()}${extension}`);
        }
    });

    const allowedTypes = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png'
    };

    const upload = multer({
        storage,
        limits: {
            fileSize: 10 * 1024 * 1024
        },
        fileFilter: (req, file, callback) => {
            const extension = path.extname(file.originalname).toLowerCase();
            const expectedMimeType = allowedTypes[extension];

            if (!expectedMimeType || file.mimetype !== expectedMimeType) {
                return callback(
                    new Error(
                        'Only PDF, JPG, JPEG and PNG reports are allowed'
                    )
                );
            }

            callback(null, true);
        }
    });

    const send = (res, result) => {
        return res.status(result.status).json(result.body);
    };

    // --------------------------------------------------
    // FARMER AND ADMIN AUTHENTICATION
    // --------------------------------------------------

    app.post('/api/register', (req, res) => {
        return send(res, service.register(req.body));
    });

    app.post('/api/login', (req, res) => {
        return send(res, service.login(req.body));
    });

    app.post('/api/admin/login', (req, res) => {
        return send(res, service.adminLogin(req.body));
    });

    // --------------------------------------------------
    // FARMER PROFILE
    // --------------------------------------------------

    app.get('/api/farmers/:id', (req, res) => {
        return send(res, service.getFarmer(req.params.id));
    });

    app.put('/api/farmers/:id', (req, res) => {
        return send(
            res,
            service.updateFarmer(req.params.id, req.body)
        );
    });

    // --------------------------------------------------
    // SOIL ANALYSIS PIPELINE
    // --------------------------------------------------

    async function analyzeAndSaveReport(farmerId, report) {
        const filePath = path.join(
            soilService.uploadDir,
            report.filename
        );

        try {
            // Stage 1: Extract the table directly from an image.
            const extractor = getSoilImageExtractor();

            const extracted = await extractor.extractFromImage(
                filePath,
                report.mimetype
            );

            const hasUncertainValues = extracted.samples.some(sample =>
                Object.values(sample.measurements).some(
                    measurement => measurement.uncertain === true
                )
            );

            const hasMissingColumns = extracted.samples.some(sample =>
                extracted.columnHeadings.some(
                    heading =>
                        !Object.prototype.hasOwnProperty.call(
                            sample.measurements,
                            heading
                        )
                )
            );

            const needsReview =
                extracted.status === 'Needs review' ||
                hasUncertainValues ||
                hasMissingColumns ||
                extracted.unreadableItems.length > 0;

            // Save extraction before interpretation.
            soilService.updateAnalysis(farmerId, report.id, {
                status: 'Needs review',
                extraction: extracted,
                ai: null,
                error: null
            });

            // Stage 2: Interpret extracted measurements.
            const aiService = getSoilAIService();

            const interpretation =
                await aiService.interpretSoilAnalysis(extracted);

            // Stage 3: Save extraction and interpretation.
            const finalStatus = needsReview
                ? 'Needs review'
                : 'Analyzed';

            const updatedReport = soilService.updateAnalysis(
                farmerId,
                report.id,
                {
                    status: finalStatus,
                    extraction: extracted,
                    ai: interpretation,
                    error: null
                }
            );

            return {
                success: true,
                report: updatedReport
            };
        } catch (error) {
            console.error(
                `Soil analysis failed for report ${report.id}:`,
                error.message
            );

            // Preserve any extraction already saved.
            try {
                const currentReport = soilService.find(
                    farmerId,
                    report.id
                );

                const existingAnalysis = currentReport?.analysis || {};

                soilService.updateAnalysis(farmerId, report.id, {
                    ...existingAnalysis,
                    status: 'Needs review',
                    error:
                        'Analysis could not be completed. Retry or review the report manually.'
                });
            } catch (saveError) {
                console.error(
                    'Could not save analysis error:',
                    saveError.message
                );
            }

            return {
                success: false,
                stage: 'analysis',
                message:
                    'Report saved, but analysis could not be completed.'
            };
        }
    }

    // --------------------------------------------------
    // UPLOAD SOIL REPORT AND ANALYZE AUTOMATICALLY
    // --------------------------------------------------

    app.post(
        '/api/farmers/:id/soil-reports',
        upload.single('report'),
        async (req, res) => {
            const farmerId = req.params.id;
            const farmerResult = service.getFarmer(farmerId);

            if (farmerResult.status !== 200) {
                if (req.file) {
                    try {
                        fs.unlinkSync(req.file.path);
                    } catch (error) {
                        console.error(
                            'Upload cleanup failed:',
                            error.message
                        );
                    }
                }

                return send(res, farmerResult);
            }

            if (!req.file) {
                return res.status(400).json({
                    message: 'Please select a soil report to upload'
                });
            }

            let report;

            try {
                report = soilService.add(farmerId, req.file);
            } catch (error) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (cleanupError) {
                    console.error(
                        'Upload cleanup failed:',
                        cleanupError.message
                    );
                }

                console.error('Soil report save failed:', error.message);

                return res.status(500).json({
                    message: 'Could not save soil report'
                });
            }

            // The report remains saved if analysis fails.
            const result = await analyzeAndSaveReport(farmerId, report);
            const savedReport = soilService.find(farmerId, report.id);

            return res.status(201).json({
                message: result.success
                    ? 'Soil report uploaded and analyzed'
                    : result.message,
                report: savedReport,
                analysisSuccess: result.success
            });
        }
    );

    // --------------------------------------------------
    // LIST SOIL REPORTS
    // --------------------------------------------------

    app.get('/api/farmers/:id/soil-reports', (req, res) => {
        const farmerResult = service.getFarmer(req.params.id);

        if (farmerResult.status !== 200) {
            return send(res, farmerResult);
        }

        return res.json({
            reports: soilService.list(req.params.id)
        });
    });

    // --------------------------------------------------
    // RETRY ANALYSIS FOR AN EXISTING REPORT
    // --------------------------------------------------

    app.post(
        '/api/farmers/:id/soil-reports/:reportId/analyze',
        async (req, res) => {
            const farmerId = req.params.id;
            const farmerResult = service.getFarmer(farmerId);

            if (farmerResult.status !== 200) {
                return send(res, farmerResult);
            }

            const report = soilService.find(
                farmerId,
                req.params.reportId
            );

            if (!report) {
                return res.status(404).json({
                    message: 'Soil report not found'
                });
            }

            const result = await analyzeAndSaveReport(farmerId, report);

            const updatedReport = soilService.find(
                farmerId,
                report.id
            );

            if (!result.success) {
                return res.status(502).json({
                    message: result.message,
                    report: updatedReport
                });
            }

            return res.json({
                message: 'Soil report analyzed successfully',
                report: updatedReport
            });
        }
    );

    // --------------------------------------------------
    // DOWNLOAD SOIL REPORT
    // --------------------------------------------------

    app.get(
        '/api/farmers/:id/soil-reports/:reportId/download',
        (req, res) => {
            const report = soilService.find(
                req.params.id,
                req.params.reportId
            );

            if (!report) {
                return res.status(404).json({
                    message: 'Soil report not found'
                });
            }

            const filePath = path.join(
                soilService.uploadDir,
                report.filename
            );

            return res.download(filePath, report.originalName, error => {
                if (error && !res.headersSent) {
                    if (error.code === 'ENOENT') {
                        return res.status(404).json({
                            message: 'Soil report file not found'
                        });
                    }

                    console.error('Download failed:', error.message);

                    return res.status(500).json({
                        message: 'Could not download soil report'
                    });
                }
            });
        }
    );

    // --------------------------------------------------
    // DELETE SOIL REPORT
    // --------------------------------------------------

    app.delete(
        '/api/farmers/:id/soil-reports/:reportId',
        (req, res) => {
            const farmerId = req.params.id;

            const report = soilService.find(
                farmerId,
                req.params.reportId
            );

            if (!report) {
                return res.status(404).json({
                    message: 'Soil report not found'
                });
            }

            try {
                soilService.remove(farmerId, req.params.reportId);

                return res.json({
                    message: 'Soil report deleted successfully'
                });
            } catch (error) {
                console.error(
                    'Report deletion failed:',
                    error.message
                );

                return res.status(500).json({
                    message: 'Could not delete soil report'
                });
            }
        }
    );

    // --------------------------------------------------
    // WEATHER MONITORING AND FORECAST
    // --------------------------------------------------

    // Current weather conditions: Weather Monitoring
    app.get('/api/weather/current', async (req, res) => {
        try {
            const weather = await weatherService.fetchWeather(
                req.query.latitude,
                req.query.longitude
            );

            return res.json({
                message: 'Current weather retrieved successfully',
                location: weather.location,
                current: weather.current
            });
        } catch (error) {
            return res.status(error.statusCode || 500).json({
                message:
                    error.message || 'Could not retrieve current weather'
            });
        }
    });

    // Seven-day forecast: Weather Forecasting
    app.get('/api/weather/forecast', async (req, res) => {
        try {
            const weather = await weatherService.fetchWeather(
                req.query.latitude,
                req.query.longitude
            );

            return res.json({
                message: 'Weather forecast retrieved successfully',
                location: weather.location,
                forecast: weather.forecast
            });
        } catch (error) {
            return res.status(error.statusCode || 500).json({
                message:
                    error.message || 'Could not retrieve weather forecast'
            });
        }
    });

    // --------------------------------------------------
    // UNKNOWN API ROUTES
    // --------------------------------------------------

    app.use('/api', (req, res) => {
        return res.status(404).json({
            message: 'API endpoint not found'
        });
    });

    // --------------------------------------------------
    // FRONTEND STATIC FILES
    // --------------------------------------------------

    app.use(express.static(path.join(__dirname, '..', 'frontend')));

    // --------------------------------------------------
    // ERROR HANDLING
    // --------------------------------------------------

    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        if (
            err &&
            (
                err.type === 'entity.parse.failed' ||
                err instanceof SyntaxError
            )
        ) {
            return res.status(400).json({
                message: 'Invalid JSON in request body'
            });
        }

        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({
                    message: 'File must be 10 MB or smaller'
                });
            }

            return res.status(400).json({
                message: 'File upload failed'
            });
        }

        if (
            err &&
            err.message ===
                'Only PDF, JPG, JPEG and PNG reports are allowed'
        ) {
            return res.status(400).json({
                message: err.message
            });
        }

        console.error(err);

        return res.status(500).json({
            message: 'Internal server error'
        });
    });

    return app;
}

module.exports = { createApp };