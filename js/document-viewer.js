/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 042 — Structured Document Viewer
File: js/document-viewer.js
*/

(function () {
    "use strict";

    async function open(documentRecord, targetElement) {
        if (!targetElement) {
            return { success: false, message: "Viewer target not found." };
        }

        if (!window.TMSDocumentTemplate) {
            renderMessage(targetElement, "Template Engine Unavailable", "Check document-template.js script order.", "Error");
            return { success: false, message: "Template engine unavailable." };
        }

        if (!documentRecord || !documentRecord.id) {
            renderMessage(targetElement, "Document Unavailable", "The selected document record is invalid.", "Error");
            return { success: false, message: "Invalid document record." };
        }

        if (!documentRecord.documentDataFile) {
            renderMessage(
                targetElement,
                "Document Content Not Connected",
                documentRecord.id + " is cataloged, but its structured data file has not yet been created.",
                "Pending"
            );
            return { success: false, message: "No structured data file connected." };
        }

        renderMessage(
            targetElement,
            "Loading Document",
            "Loading " + documentRecord.id + " — " + documentRecord.title + "...",
            "Loading"
        );

        try {
            const response = await fetch(documentRecord.documentDataFile, { cache: "no-store" });

            if (!response.ok) {
                throw new Error("Document request failed with status " + response.status + ".");
            }

            const documentData = await response.json();
            const validation = window.TMSDocumentTemplate.validate(documentData);

            if (!validation.isValid) {
                throw new Error("Missing required fields: " + validation.missingFields.join(", "));
            }

            targetElement.innerHTML = window.TMSDocumentTemplate.render(documentData);

            return {
                success: true,
                documentId: documentRecord.id,
                documentDataFile: documentRecord.documentDataFile
            };
        } catch (error) {
            console.error("TMS Document Viewer could not load the document.", error);

            renderMessage(
                targetElement,
                "Document Load Failed",
                "Confirm the JSON file exists at " + documentRecord.documentDataFile + " and use Live Server or GitHub Pages.",
                "Error"
            );

            return { success: false, message: error.message };
        }
    }

    function renderMessage(targetElement, title, description, status) {
        targetElement.innerHTML = `
            <div class="project-list">
                <div class="project-item">
                    <div>
                        <h3>${safeText(title)}</h3>
                        <p>${safeText(description)}</p>
                    </div>
                    <span class="project-status ${status === "Pending" || status === "Error" ? "planned" : ""}">
                        ${safeText(status)}
                    </span>
                </div>
            </div>
        `;
    }

    function safeText(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    window.TMSDocumentViewer = {
        open: open
    };
})();
