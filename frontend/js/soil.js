
'use strict';

const uploadForm = document.getElementById('soilUploadForm');
const fileInput = document.getElementById('soilReportFile');
const uploadButton = document.getElementById('uploadButton');
const refreshButton = document.getElementById('refreshReportsButton');
const reportsList = document.getElementById('soilReportsList');
const messageBox = document.getElementById('soilMessage');
const soilAnalysisMessage = document.getElementById('soilAnalysisMessage');
const soilAnalysisResults = document.getElementById('soilAnalysisResults');

let cachedReports = [];
let selectedReportId = null;

function getFarmerId() {
    const keys = [
        'farmerId',
        'farmer_id',
        'userId',
        'user_id',
        'currentFarmerId'
    ];

    for (const key of keys) {
        const value = localStorage.getItem(key);

        if (value && value !== 'undefined' && value !== 'null') {
            return value;
        }
    }

    for (const key of ['user', 'farmer', 'currentUser']) {
        try {
            const value = JSON.parse(localStorage.getItem(key));

            if (value && typeof value === 'object') {
                const id = value.id ?? value.farmerId ?? value.farmer_id;

                if (id !== undefined && id !== null && String(id).trim()) {
                    return String(id);
                }
            }
        } catch (_) {
            // Ignore invalid JSON.
        }
    }

    return null;
}

function showMessage(message, type = 'success') {
    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.className = `soil-message ${type}`;
}

function clearMessage() {
    if (!messageBox) return;

    messageBox.textContent = '';
    messageBox.className = 'soil-message';
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function formatFileSize(bytes) {
    if (!Number.isFinite(Number(bytes))) return 'Unknown size';

    const size = Number(bytes);

    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(dateValue) {
    const date = new Date(dateValue);

    return Number.isNaN(date.getTime())
        ? 'Unknown date'
        : date.toLocaleString();
}

function valueForDisplay(value) {
    if (value === null || value === undefined || value === '') {
        return 'Not detected';
    }

    if (typeof value === 'object') {
        if ('value' in value) {
            const displayed =
                value.value === null ||
                value.value === undefined ||
                value.value === ''
                    ? 'Not detected'
                    : String(value.value);

            return value.uncertain
                ? `${displayed} (uncertain — verify)`
                : displayed;
        }

        return JSON.stringify(value);
    }

    return String(value);
}

function renderReports() {
    if (!reportsList) return;

    if (!cachedReports.length) {
        reportsList.innerHTML =
            '<p class="soil-empty">No soil reports uploaded yet. Upload your first report above.</p>';

        renderSoilAnalysis(null);
        return;
    }

    reportsList.innerHTML = cachedReports.map(report => `
        <article
            class="soil-report ${report.id === selectedReportId ? 'selected' : ''}"
            data-report-id="${escapeHtml(report.id)}"
            tabindex="0"
            role="button"
            aria-label="View analysis for ${escapeHtml(report.originalName)}"
        >
            <div>
                <h3>📄 ${escapeHtml(report.originalName || 'Soil report')}</h3>
                <p>Uploaded: ${escapeHtml(formatDate(report.uploadedAt))}</p>
                <p>File size: ${escapeHtml(formatFileSize(report.size))}</p>
                <p>Status: ${escapeHtml(report.status || 'Uploaded')}</p>
            </div>

            <div class="soil-report-actions">
                <button
                    type="button"
                    class="soil-btn"
                    data-action="download"
                    data-id="${escapeHtml(report.id)}"
                >Download</button>

                <button
                    type="button"
                    class="soil-btn soil-btn-danger"
                    data-action="delete"
                    data-id="${escapeHtml(report.id)}"
                >Delete</button>

                ${!report.analysis || !report.analysis.ai ? `
                    <button
                        type="button"
                        class="soil-btn"
                        data-action="analyze"
                        data-id="${escapeHtml(report.id)}"
                    >Analyze</button>
                ` : ''}
            </div>
        </article>
    `).join('');
}

async function loadSoilReports(options = {}) {
    const farmerId = getFarmerId();

    if (!farmerId) {
        if (reportsList) {
            reportsList.innerHTML =
                '<p class="soil-empty">Farmer ID was not found. Please log in again.</p>';
        }

        renderSoilAnalysis(null, 'Farmer ID not found. Please log in again.');
        return;
    }

    if (reportsList) {
        reportsList.innerHTML =
            '<p class="soil-empty">Loading reports...</p>';
    }

    try {
        const response = await fetch(
            `/api/farmers/${encodeURIComponent(farmerId)}/soil-reports`
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Could not load soil reports.');
        }

        cachedReports = Array.isArray(result.reports)
            ? result.reports
            : [];

        if (options.selectId) {
            selectedReportId = options.selectId;
        }

        let selected = cachedReports.find(
            report => report.id === selectedReportId
        );

        if (!selected && cachedReports.length) {
            selected = cachedReports[0];
            selectedReportId = selected.id;
        }

        if (!cachedReports.some(report => report.id === selectedReportId)) {
            selectedReportId = null;
        }

        renderReports();

        if (selected) {
            renderSoilAnalysis(selected);
        } else {
            renderSoilAnalysis(null);
        }
    } catch (error) {
        if (reportsList) {
            reportsList.innerHTML = `
                <p class="soil-empty">
                    ${escapeHtml(error.message || 'Unable to load reports.')}
                </p>
            `;
        }

        renderSoilAnalysis(null, error.message || 'Unable to load reports.');
    }
}

function renderList(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return '<p>None listed.</p>';
    }

    return `<ul>${items.map(item =>
        `<li>${escapeHtml(item)}</li>`
    ).join('')}</ul>`;
}


function renderSoilAnalysis(report, message = '') {
    if (!soilAnalysisMessage || !soilAnalysisResults) return;

    soilAnalysisResults.innerHTML = '';

    if (message) {
        soilAnalysisMessage.textContent = message;
        return;
    }

    if (!report) {
        soilAnalysisMessage.textContent =
            'Select a soil report to view your soil guidance.';
        return;
    }

    const analysis = report.analysis || {};
    const extraction = analysis.extraction || {};
    const ai = analysis.ai || {};

    soilAnalysisMessage.textContent =
        `Report status: ${report.status || 'Uploaded'}`;

    // Overall summary, not a separate summary for every sample.
    const farmerLines = Array.isArray(ai.farmerAnalysis)
        ? ai.farmerAnalysis
        : [];

    const cropSuggestions = Array.isArray(ai.cropSuggestions)
        ? ai.cropSuggestions
        : [];

    const nextSteps = Array.isArray(ai.nextSteps)
        ? ai.nextSteps
        : [];

    const limitations = Array.isArray(ai.limitations)
        ? ai.limitations
        : [];

    let html = `
        <section class="farmer-summary">
            <h2>Your Soil Report</h2>
            <p>
                This report helps you understand your soil and plan
                your next farming steps.
            </p>

            <h3>What your soil report tells you</h3>
    `;

    if (farmerLines.length) {
        html += `
            <ol class="farmer-analysis-list">
                ${farmerLines.map(line => `
                    <li>${escapeHtml(
                        String(line).replace(/^\s*\d+[\.\)]\s*/, '')
                    )}</li>
                `).join('')}
            </ol>
        `;
    } else if (ai.summary) {
        html += `<p>${escapeHtml(ai.summary)}</p>`;
    } else {
        html += `
            <p>
                A simple summary is not available yet.
                Try analyzing this report again.
            </p>
        `;
    }

    html += '<h3>What can you grow?</h3>';

    if (cropSuggestions.length) {
        html += '<ul class="farmer-crop-list">';

        cropSuggestions.forEach(item => {
            html += `
                <li>
                    <strong>${escapeHtml(item.crop)}</strong>
                    <p>${escapeHtml(item.reason)}</p>
                </li>
            `;
        });

        html += '</ul>';
    } else {
        html += `
            <p>
                More information about your location, water availability
                and growing season is needed before suggesting crops.
            </p>
        `;
    }

    html += '<h3>What should you do next?</h3>';

    if (nextSteps.length) {
        html += `
            <ul>
                ${nextSteps.map(step =>
                    `<li>${escapeHtml(step)}</li>`
                ).join('')}
            </ul>
        `;
    } else {
        html += `
            <p>
                Check any missing soil values with your local
                agricultural officer before making major decisions.
            </p>
        `;
    }

    if (
        report.status === 'Needs review' ||
        analysis.status === 'Needs review' ||
        limitations.length
    ) {
        html += `
            <p class="soil-warning">
                <strong>Please note:</strong>
                Some information may need verification.
                Check the original laboratory report before acting
                on the recommendations.
            </p>
        `;
    }

    html += `
        </section>

        <details class="soil-detailed-report">
            <summary>View Detailed Soil Report</summary>
            <div class="soil-detailed-content">
                <p>
                    These technical details are available if you,
                    a technician or an agricultural officer needs them.
                </p>
    `;

    // Technical measurements are hidden until the section is opened.
    if (Array.isArray(extraction.samples) &&
        extraction.samples.length) {

        html += '<h3>Laboratory Measurements</h3>';

        extraction.samples.forEach(sample => {
            html += `
                <h4>Sample ${escapeHtml(sample.sampleId || '')}</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Parameter</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(sample.measurements || {})
                            .map(([key, value]) => `
                                <tr>
                                    <td>${escapeHtml(key)}</td>
                                    <td>${escapeHtml(
                                        valueForDisplay(value)
                                    )}</td>
                                </tr>
                            `).join('')}
                    </tbody>
                </table>
            `;
        });
    } else {
        html += '<p>No extracted measurements are available.</p>';
    }

    const unreadable = Array.isArray(extraction.unreadableItems)
        ? extraction.unreadableItems
        : [];

    if (unreadable.length) {
        html += `
            <h3>Missing or unreadable values</h3>
            <ul>
                ${unreadable.map(item =>
                    `<li>${escapeHtml(item)}</li>`
                ).join('')}
            </ul>
        `;
    }

    if (ai.summary) {
        html += `
            <h3>AI Technical Summary</h3>
            <p>${escapeHtml(ai.summary)}</p>
        `;
    }

    if (Array.isArray(ai.samples) && ai.samples.length) {
        html += '<h3>Detailed AI Interpretation</h3>';

        ai.samples.forEach(sample => {
            html += `
                <h4>Sample ${escapeHtml(sample.sampleId || '')}</h4>
                <p><strong>Observations</strong></p>
                <ul>
                    ${(sample.observations || []).map(item =>
                        `<li>${escapeHtml(item)}</li>`
                    ).join('')}
                </ul>

                <p><strong>Possible concerns</strong></p>
                <ul>
                    ${(sample.possibleConcerns || []).map(item =>
                        `<li>${escapeHtml(item)}</li>`
                    ).join('')}
                </ul>

                <p><strong>Recommendations</strong></p>
                <ul>
                    ${(sample.recommendations || []).map(item =>
                        `<li>${escapeHtml(item)}</li>`
                    ).join('')}
                </ul>
            `;
        });
    }

    if (limitations.length) {
        html += `
            <h3>Limitations</h3>
            <ul>
                ${limitations.map(item =>
                    `<li>${escapeHtml(item)}</li>`
                ).join('')}
            </ul>
        `;
    }

    html += `
                <p>
                    <strong>Important:</strong>
                    ${escapeHtml(
                        ai.disclaimer ||
                        'Verify the original report and consult an agricultural expert before making treatment decisions.'
                    )}
                </p>
            </div>
        </details>
    `;

    soilAnalysisResults.innerHTML = html;
}


async function analyzeReport(reportId, button) {
    const farmerId = getFarmerId();

    if (!farmerId || !reportId) {
        showMessage('Farmer or report information is missing.', 'error');
        return;
    }

    const originalText = button ? button.textContent : '';

    if (button) {
        button.disabled = true;
        button.textContent = 'Analyzing...';
    }

    try {
        const response = await fetch(
            `/api/farmers/${encodeURIComponent(farmerId)}/soil-reports/${encodeURIComponent(reportId)}/analyze`,
            { method: 'POST' }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Soil analysis failed.');
        }

        showMessage(result.message || 'Soil report analyzed successfully.');
        selectedReportId = reportId;

        await loadSoilReports({ selectId: reportId });
    } catch (error) {
        showMessage(error.message || 'Could not analyze the soil report.', 'error');
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalText || 'Analyze';
        }
    }
}

if (uploadForm) {
    uploadForm.addEventListener('submit', async event => {
        event.preventDefault();
        clearMessage();

        const farmerId = getFarmerId();
        const file = fileInput?.files?.[0];

        if (!farmerId) {
            showMessage('Farmer ID not found. Please log in again.', 'error');
            return;
        }

        if (!file) {
            showMessage('Please select a soil report.', 'error');
            return;
        }

        if (!/\.(pdf|jpg|jpeg|png)$/i.test(file.name)) {
            showMessage('Only PDF, JPG, JPEG and PNG files are allowed.', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showMessage('The file must be 10 MB or smaller.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('report', file);

        if (uploadButton) {
            uploadButton.disabled = true;
            uploadButton.textContent = 'Uploading...';
        }

        try {
            const response = await fetch(
                `/api/farmers/${encodeURIComponent(farmerId)}/soil-reports`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Upload failed.');
            }

            showMessage(result.message || 'Soil report uploaded successfully.');
            uploadForm.reset();

            await loadSoilReports();
        } catch (error) {
            showMessage(error.message || 'Could not upload the soil report.', 'error');
        } finally {
            if (uploadButton) {
                uploadButton.disabled = false;
                uploadButton.textContent = 'Upload Report';
            }
        }
    });
}

if (reportsList) {
    reportsList.addEventListener('click', async event => {
        const button = event.target.closest('button[data-action]');
        const reportElement = event.target.closest('[data-report-id]');

        if (button) {
            const farmerId = getFarmerId();
            const reportId = button.dataset.id;

            if (!farmerId || !reportId) {
                showMessage('Farmer or report information is missing.', 'error');
                return;
            }

            const baseUrl =
                `/api/farmers/${encodeURIComponent(farmerId)}` +
                `/soil-reports/${encodeURIComponent(reportId)}`;

            if (button.dataset.action === 'download') {
                window.location.href = `${baseUrl}/download`;
                return;
            }

            if (button.dataset.action === 'analyze') {
                await analyzeReport(reportId, button);
                return;
            }

            if (button.dataset.action === 'delete') {
                if (!window.confirm('Are you sure you want to delete this soil report?')) {
                    return;
                }

                button.disabled = true;

                try {
                    const response = await fetch(baseUrl, {
                        method: 'DELETE'
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.message || 'Could not delete report.');
                    }

                    if (selectedReportId === reportId) {
                        selectedReportId = null;
                    }

                    showMessage(result.message || 'Soil report deleted successfully.');
                    await loadSoilReports();
                } catch (error) {
                    showMessage(error.message || 'Could not delete the report.', 'error');
                    button.disabled = false;
                }

                return;
            }
        }

        if (reportElement) {
            selectedReportId = reportElement.dataset.reportId;

            const report = cachedReports.find(
                item => item.id === selectedReportId
            );

            renderReports();
            renderSoilAnalysis(report || null);
        }
    });

    reportsList.addEventListener('keydown', event => {
        if (
            (event.key === 'Enter' || event.key === ' ') &&
            event.target.matches('[data-report-id]')
        ) {
            event.preventDefault();

            selectedReportId = event.target.dataset.reportId;

            renderReports();

            renderSoilAnalysis(
                cachedReports.find(item => item.id === selectedReportId) || null
            );
        }
    });
}

if (refreshButton) {
    refreshButton.addEventListener('click', () => {
        clearMessage();
        loadSoilReports();
    });
}

loadSoilReports();
