/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 046 — Document Writer Registry v1.0.0
File: js/session/document-writer-registry.js

Purpose:
Register compatible permanent-document writers, validate their contracts, execute
registered writers in deterministic order, and collect review-only drafts into one
immutable Draft Package. This registry never writes permanent files.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const writers = new Map();
    let lastPackage = null;

    if (!window.TMSSessionContext) {
        console.error("Document Writer Registry could not initialize because Session Context is unavailable.");
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

    function normalizeRegistration(registration) {
        if (!registration || typeof registration !== "object") {
            throw new Error("A writer registration object is required.");
        }

        const requiredTextFields = ["writerId", "documentId", "writerVersion", "updateMode"];
        requiredTextFields.forEach(function (field) {
            if (typeof registration[field] !== "string" || !registration[field].trim()) {
                throw new Error("Writer registration requires a non-empty " + field + ".");
            }
        });

        if (typeof registration.generateDraft !== "function") {
            throw new Error("Writer registration requires generateDraft().");
        }

        const order = Number.isFinite(Number(registration.order))
            ? Number(registration.order)
            : 1000;

        return Object.freeze({
            writerId: registration.writerId.trim(),
            documentId: registration.documentId.trim(),
            writerVersion: registration.writerVersion.trim(),
            updateMode: registration.updateMode.trim(),
            order: order,
            generateDraft: registration.generateDraft,
            formatDraftText: typeof registration.formatDraftText === "function"
                ? registration.formatDraftText
                : null,
            getLastDraft: typeof registration.getLastDraft === "function"
                ? registration.getLastDraft
                : null
        });
    }

    function register(registration) {
        const normalized = normalizeRegistration(registration);

        if (writers.has(normalized.writerId)) {
            return false;
        }

        const documentAlreadyRegistered = Array.from(writers.values()).some(function (writer) {
            return writer.documentId === normalized.documentId;
        });

        if (documentAlreadyRegistered) {
            throw new Error("A writer is already registered for " + normalized.documentId + ".");
        }

        writers.set(normalized.writerId, normalized);
        return true;
    }

    function getOrderedWriters() {
        return Array.from(writers.values()).sort(function (a, b) {
            if (a.order !== b.order) {
                return a.order - b.order;
            }
            return a.documentId.localeCompare(b.documentId);
        });
    }

    function getRegisteredWriters() {
        return deepFreeze(getOrderedWriters().map(function (writer) {
            return {
                writerId: writer.writerId,
                documentId: writer.documentId,
                writerVersion: writer.writerVersion,
                updateMode: writer.updateMode,
                order: writer.order
            };
        }));
    }

    function validateRegistry() {
        const registered = getRegisteredWriters();
        const documentIds = registered.map(function (writer) {
            return writer.documentId;
        });

        return deepFreeze({
            valid: registered.length > 0 && new Set(documentIds).size === documentIds.length,
            registeredWriterCount: registered.length,
            registeredDocumentCount: new Set(documentIds).size,
            writers: registered
        });
    }

    async function generateDraftPackage() {
        const registryValidation = validateRegistry();
        const generatedAt = new Date().toISOString();

        if (!registryValidation.valid) {
            lastPackage = deepFreeze({
                packageType: "TMS-OS Permanent Document Draft Package",
                registryVersion: ENGINE_VERSION,
                generatedAt: generatedAt,
                accepted: false,
                message: "No valid document writers are registered.",
                registryValidation: registryValidation,
                drafts: [],
                acceptedDraftCount: 0,
                rejectedDraftCount: 0,
                permanentWritesExecuted: false,
                reviewRequired: true
            });
            return lastPackage;
        }

        const orderedWriters = getOrderedWriters();
        const drafts = [];

        for (const writer of orderedWriters) {
            try {
                const draft = await writer.generateDraft();
                drafts.push({
                    writerId: writer.writerId,
                    documentId: writer.documentId,
                    writerVersion: writer.writerVersion,
                    updateMode: writer.updateMode,
                    order: writer.order,
                    accepted: Boolean(draft && draft.accepted),
                    draft: clone(draft)
                });
            } catch (error) {
                drafts.push({
                    writerId: writer.writerId,
                    documentId: writer.documentId,
                    writerVersion: writer.writerVersion,
                    updateMode: writer.updateMode,
                    order: writer.order,
                    accepted: false,
                    draft: {
                        accepted: false,
                        message: error.message,
                        permanentWriteExecuted: false
                    }
                });
            }
        }

        const acceptedDraftCount = drafts.filter(function (item) {
            return item.accepted;
        }).length;
        const rejectedDraftCount = drafts.length - acceptedDraftCount;

        lastPackage = deepFreeze({
            packageType: "TMS-OS Permanent Document Draft Package",
            registryVersion: ENGINE_VERSION,
            generatedAt: generatedAt,
            sessionNumber: window.TMSSessionContext.getSnapshot().sessionNumber,
            accepted: acceptedDraftCount === drafts.length && drafts.length > 0,
            message: acceptedDraftCount === drafts.length
                ? "All registered writers generated reviewable drafts. No permanent files were changed."
                : "One or more registered writers rejected or failed draft generation.",
            registryValidation: registryValidation,
            drafts: drafts,
            totalDraftCount: drafts.length,
            acceptedDraftCount: acceptedDraftCount,
            rejectedDraftCount: rejectedDraftCount,
            permanentWritesExecuted: false,
            reviewRequired: true,
            reviewChoices: ["Approve Draft Package", "Revise Session", "Cancel Draft Package"]
        });

        return lastPackage;
    }

    async function formatDraftPackageText(draftPackage) {
        const currentPackage = draftPackage || await generateDraftPackage();
        const lines = [
            "TMS-OS PERMANENT DOCUMENT DRAFT PACKAGE",
            "Accepted: " + (currentPackage.accepted ? "YES" : "NO"),
            "Work Session: " + (currentPackage.sessionNumber || window.TMSSessionContext.getSnapshot().sessionNumber),
            "Registry Version: " + ENGINE_VERSION,
            "Permanent Writes Executed: NO",
            "Registered Writers: " + currentPackage.registryValidation.registeredWriterCount,
            "Generated Drafts: " + (currentPackage.totalDraftCount || 0),
            "Accepted Drafts: " + (currentPackage.acceptedDraftCount || 0),
            "Rejected Drafts: " + (currentPackage.rejectedDraftCount || 0)
        ];

        (currentPackage.drafts || []).forEach(function (item) {
            lines.push(
                item.documentId + " | " + item.updateMode + " | " + (item.accepted ? "ACCEPTED" : "REJECTED")
            );
        });

        if (currentPackage.reviewChoices) {
            lines.push("Review Choices: " + currentPackage.reviewChoices.join(" | "));
        }

        return lines.join("\n");
    }

    function getLastPackage() {
        return lastPackage;
    }

    window.TMSDocumentWriterRegistry = Object.freeze({
        engineVersion: ENGINE_VERSION,
        register: register,
        getRegisteredWriters: getRegisteredWriters,
        validateRegistry: validateRegistry,
        generateDraftPackage: generateDraftPackage,
        formatDraftPackageText: formatDraftPackageText,
        getLastPackage: getLastPackage
    });

    console.log(
        "Document Writer Registry v" + ENGINE_VERSION +
        " initialized for Work Session " + window.TMSSessionContext.getSnapshot().sessionNumber + "."
    );
}());
