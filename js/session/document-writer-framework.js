/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 046 — Generic Document Writer Framework v1.0.0
File: js/session/document-writer-framework.js

Purpose:
Provide shared, review-only permanent-document draft services for document-specific
writers. This framework loads source documents, validates approved proposals,
preserves metadata, manages revision history, freezes returned drafts, and never
writes permanent files.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";

    if (!window.TMSDocumentUpdateEngine || !window.TMSSessionContext) {
        console.error("Generic Document Writer Framework could not initialize because its dependencies are unavailable.");
        return;
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function deepFreeze(value) {
        if (!value || typeof value !== "object" || Object.isFrozen(value)) {
            return value;
        }
        Object.keys(value).forEach(function (key) {
            deepFreeze(value[key]);
        });
        return Object.freeze(value);
    }

    function documentUrl(fileName) {
        const path = window.location.pathname;
        const pageFolderIndex = path.lastIndexOf("/pages/");
        const projectRootPath = pageFolderIndex >= 0
            ? path.slice(0, pageFolderIndex + 1)
            : path.slice(0, path.lastIndexOf("/") + 1);
        return window.location.origin + projectRootPath + "pages/documents/" + fileName;
    }

    function normalizedText(entry) {
        if (typeof entry === "string") {
            return entry;
        }
        if (entry && typeof entry === "object") {
            return entry.description || entry.name || entry.title || entry.path || JSON.stringify(entry);
        }
        return String(entry);
    }

    function nextSectionNumber(documentData) {
        const numbers = (documentData.sections || []).map(function (section) {
            const parsed = parseInt(section.number, 10);
            return Number.isFinite(parsed) ? parsed : 0;
        });
        return String((numbers.length ? Math.max.apply(null, numbers) : 0) + 1);
    }

    function getProposal(plan, documentId) {
        if (!plan || !plan.accepted || !Array.isArray(plan.proposals)) {
            return null;
        }
        return plan.proposals.find(function (item) {
            return item.documentId === documentId;
        }) || null;
    }

    async function loadSourceDocument(documentId) {
        const response = await fetch(documentUrl(documentId + ".json"), { cache: "no-store" });
        if (!response.ok) {
            throw new Error("HTTP " + response.status + " while loading " + documentId + ".json");
        }

        const sourceDocument = await response.json();
        if (!sourceDocument || sourceDocument.id !== documentId || !Array.isArray(sourceDocument.sections)) {
            throw new Error("The source document does not match the expected permanent-document schema.");
        }
        return sourceDocument;
    }

    function appendRevisionHistory(proposedDocument, revisionEntry) {
        proposedDocument.revisionHistory = Array.isArray(proposedDocument.revisionHistory)
            ? proposedDocument.revisionHistory
            : [];
        proposedDocument.revisionHistory.push(clone(revisionEntry));
    }

    function rejectedDraft(config, message) {
        return deepFreeze({
            draftType: "TMS-OS Permanent Document Draft",
            frameworkVersion: ENGINE_VERSION,
            writerVersion: config.writerVersion,
            documentId: config.documentId,
            generatedAt: new Date().toISOString(),
            accepted: false,
            message: message,
            sourceLoaded: false,
            reviewRequired: true,
            permanentWriteExecuted: false,
            proposedDocument: null
        });
    }

    async function createDraft(config) {
        if (!config || typeof config !== "object") {
            throw new Error("A document writer configuration object is required.");
        }
        if (!config.documentId || !config.requiredAction || typeof config.transform !== "function") {
            throw new Error("Document writer configuration requires documentId, requiredAction, and transform.");
        }

        const plan = window.TMSDocumentUpdateEngine.generatePlan();
        const proposal = getProposal(plan, config.documentId);

        if (!proposal || proposal.action !== config.requiredAction || !proposal.payload) {
            return rejectedDraft(
                config,
                "An approved " + config.documentId + " " + config.requiredAction + " proposal is required before a draft can be generated."
            );
        }

        try {
            const sourceDocument = await loadSourceDocument(config.documentId);
            const proposedDocument = clone(sourceDocument);
            const transformResult = await config.transform({
                proposal: clone(proposal),
                sourceDocument: clone(sourceDocument),
                proposedDocument: proposedDocument,
                helpers: Object.freeze({
                    clone: clone,
                    normalizedText: normalizedText,
                    nextSectionNumber: nextSectionNumber,
                    appendRevisionHistory: appendRevisionHistory
                })
            });

            const generatedAt = new Date().toISOString();
            const resultDetails = transformResult && typeof transformResult === "object" ? transformResult : {};
            const draft = Object.assign({
                draftType: "TMS-OS Permanent Document Draft",
                frameworkVersion: ENGINE_VERSION,
                writerVersion: config.writerVersion,
                documentId: config.documentId,
                generatedAt: generatedAt,
                accepted: true,
                message: "Reviewable replacement-document draft generated. No permanent file was changed.",
                sourceLoaded: true,
                sourceSectionCount: sourceDocument.sections.length,
                proposedSectionCount: proposedDocument.sections.length,
                proposedDocument: proposedDocument,
                reviewRequired: true,
                reviewChoices: ["Approve Draft", "Revise Session", "Cancel Draft"],
                permanentWriteExecuted: false
            }, resultDetails);

            return deepFreeze(clone(draft));
        } catch (error) {
            return rejectedDraft(config, error.message);
        }
    }

    window.TMSDocumentWriterFramework = Object.freeze({
        engineVersion: ENGINE_VERSION,
        createDraft: createDraft,
        clone: clone,
        deepFreeze: deepFreeze,
        normalizedText: normalizedText,
        nextSectionNumber: nextSectionNumber
    });

    console.log(
        "Generic Document Writer Framework v" + ENGINE_VERSION +
        " initialized for Work Session " + window.TMSSessionContext.getSnapshot().sessionNumber + "."
    );
}());
