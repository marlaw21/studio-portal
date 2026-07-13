/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 042 — Document Template Engine
File: js/document-template.js
*/

(function () {
    "use strict";

    function safeText(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function validate(documentData) {
        const required = [
            "id", "title", "documentType", "department",
            "category", "status", "version", "summary", "sections"
        ];

        const missingFields = required.filter(function (field) {
            const value = documentData ? documentData[field] : null;

            if (field === "sections") {
                return !Array.isArray(value) || value.length === 0;
            }

            return value === undefined || value === null || value === "";
        });

        return {
            isValid: missingFields.length === 0,
            missingFields: missingFields
        };
    }

    function renderMetadataRow(label, value) {
        return `
            <div class="project-item">
                <div>
                    <h3>${safeText(label)}</h3>
                    <p>${safeText(value || "Not recorded")}</p>
                </div>
            </div>
        `;
    }

    function renderSection(section, index) {
        const content = [];

        if (section.text) {
            content.push(`<p>${safeText(section.text)}</p>`);
        }

        if (Array.isArray(section.paragraphs)) {
            section.paragraphs.forEach(function (paragraph) {
                content.push(`<p>${safeText(paragraph)}</p>`);
            });
        }

        if (Array.isArray(section.items) && section.items.length > 0) {
            content.push(`
                <ul>
                    ${section.items.map(function (item) {
                        return `<li>${safeText(item)}</li>`;
                    }).join("")}
                </ul>
            `);
        }

        if (Array.isArray(section.records) && section.records.length > 0) {
            content.push(`
                <div class="project-list">
                    ${section.records.map(function (record) {
                        return `
                            <div class="project-item">
                                <div>
                                    <h3>${safeText(record.title)}</h3>
                                    <p>${safeText(record.description || "")}</p>
                                </div>
                                ${
                                    record.status
                                        ? `<span class="project-status">${safeText(record.status)}</span>`
                                        : ""
                                }
                            </div>
                        `;
                    }).join("")}
                </div>
            `);
        }

        if (Array.isArray(section.tables) && section.tables.length > 0) {
            section.tables.forEach(function (table) {
                content.push(renderTable(table));
            });
        }

        return `
            <section>
                <h2>${safeText(section.number || String(index + 1))}. ${safeText(section.title)}</h2>
                ${content.join("")}
            </section>
        `;
    }

    function renderTable(table) {
        const headers = Array.isArray(table.headers) ? table.headers : [];
        const rows = Array.isArray(table.rows) ? table.rows : [];

        return `
            <div style="overflow-x:auto;margin-top:14px;margin-bottom:18px;">
                <table style="width:100%;border-collapse:collapse;">
                    ${
                        headers.length
                            ? `
                                <thead>
                                    <tr>
                                        ${headers.map(function (header) {
                                            return `<th style="text-align:left;padding:10px;border:1px solid rgba(255,255,255,0.18);">${safeText(header)}</th>`;
                                        }).join("")}
                                    </tr>
                                </thead>
                            `
                            : ""
                    }
                    <tbody>
                        ${rows.map(function (row) {
                            return `
                                <tr>
                                    ${row.map(function (cell) {
                                        return `<td style="vertical-align:top;padding:10px;border:1px solid rgba(255,255,255,0.18);">${safeText(cell)}</td>`;
                                    }).join("")}
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        `;
    }

    function render(documentData) {
        const validation = validate(documentData);

        if (!validation.isValid) {
            return `
                <div class="project-item">
                    <div>
                        <h3>Document Schema Validation Failed</h3>
                        <p>Missing required fields: ${safeText(validation.missingFields.join(", "))}</p>
                    </div>
                    <span class="project-status planned">Error</span>
                </div>
            `;
        }

        const metadata = [
            ["Document ID", documentData.id],
            ["Document Type", documentData.documentType],
            ["Department", documentData.department],
            ["Category", documentData.category],
            ["Owner", documentData.owner || "Two Marshalls Studios"],
            ["Status", documentData.status],
            ["Version", documentData.version],
            ["Created", documentData.created || "Not recorded"],
            ["Last Updated", documentData.lastUpdated || "Not recorded"]
        ];

        return `
            <article class="tms-document">
                <header class="tms-document-header">
                    <p class="section-label">Permanent Studio Document</p>
                    <h1>${safeText(documentData.id)} — ${safeText(documentData.title)}</h1>
                    <p>${safeText(documentData.organization || "Two Marshalls Studios — Studio Operating System (TMS-OS)")}</p>
                </header>

                <section>
                    <h2>Document Information</h2>
                    <div class="project-list">
                        ${metadata.map(function (item) {
                            return renderMetadataRow(item[0], item[1]);
                        }).join("")}
                    </div>
                </section>

                <section>
                    <h2>Summary</h2>
                    <p>${safeText(documentData.summary)}</p>
                    ${
                        Array.isArray(documentData.keywords) && documentData.keywords.length
                            ? `<p class="detail-label">Keywords: ${documentData.keywords.map(safeText).join(" · ")}</p>`
                            : ""
                    }
                </section>

                ${documentData.sections.map(renderSection).join("")}

                ${
                    Array.isArray(documentData.relatedDocuments) && documentData.relatedDocuments.length
                        ? `
                            <section>
                                <h2>Related Documents</h2>
                                <ul>
                                    ${documentData.relatedDocuments.map(function (id) {
                                        return `<li>${safeText(id)}</li>`;
                                    }).join("")}
                                </ul>
                            </section>
                        `
                        : ""
                }

                ${
                    Array.isArray(documentData.revisionHistory) && documentData.revisionHistory.length
                        ? `
                            <section>
                                <h2>Revision History</h2>
                                <div class="project-list">
                                    ${documentData.revisionHistory.map(function (revision) {
                                        return `
                                            <div class="project-item">
                                                <div>
                                                    <h3>${safeText(revision.version)} — ${safeText(revision.date || "Date not recorded")}</h3>
                                                    <p>${safeText(revision.summary)}</p>
                                                </div>
                                                <span class="project-status">${safeText(revision.status || "Recorded")}</span>
                                            </div>
                                        `;
                                    }).join("")}
                                </div>
                            </section>
                        `
                        : ""
                }

                ${
                    documentData.verification
                        ? `
                            <section>
                                <h2>Verification</h2>
                                <div class="project-list">
                                    ${renderMetadataRow("Verification Status", documentData.verification.status)}
                                    ${renderMetadataRow("Verified By", documentData.verification.verifiedBy)}
                                    ${renderMetadataRow("Verification Method", documentData.verification.method)}
                                </div>
                            </section>
                        `
                        : ""
                }
            </article>
        `;
    }

    window.TMSDocumentTemplate = {
        render: render,
        validate: validate
    };
})();
