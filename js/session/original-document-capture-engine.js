/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 050 — Original Document Capture Engine v1.0.0
File: js/session/original-document-capture-engine.js

Purpose:
Load and verify the five current live permanent JSON documents, capture
immutable recovery copies, calculate deterministic document checksums, and
produce a rollback-ready capture package before any permanent output execution
can be authorized.

This component does not write, replace, delete, restore, or download permanent
files. Write authorization remains locked.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const CAPTURE_TYPE = "TMS-OS Original Permanent Document Capture";
    const EXPECTED_DOCUMENTS = Object.freeze([
        "WS-HIST-001",
        "STATE-001",
        "DOC-STATE-001",
        "DEC-LOG-001",
        "MILE-HIST-001"
    ]);

    let lastCapture = null;

    if (!window.TMSSessionContext || !window.TMSRollbackPackageGenerator) {
        console.error(
            "Original Document Capture Engine could not initialize because its dependencies are unavailable."
        );
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

    function isPlainObject(value) {
        return Boolean(value) &&
            typeof value === "object" &&
            !Array.isArray(value);
    }

    function stableStringify(value) {
        if (value === null || typeof value !== "object") {
            return JSON.stringify(value);
        }

        if (Array.isArray(value)) {
            return "[" +
                value.map(stableStringify).join(",") +
                "]";
        }

        return "{" +
            Object.keys(value)
                .sort()
                .map(function (key) {
                    return JSON.stringify(key) +
                        ":" +
                        stableStringify(value[key]);
                })
                .join(",") +
            "}";
    }

    function calculateChecksum(value) {
        const text = stableStringify(value);
        let hash = 2166136261;

        for (let index = 0; index < text.length; index += 1) {
            hash ^= text.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }

        return "fnv1a32-" +
            (hash >>> 0)
                .toString(16)
                .padStart(8, "0");
    }

    function buildCheck(name, passed, message) {
        return {
            name: name,
            passed: Boolean(passed),
            message: message
        };
    }

    function createCaptureId(sessionNumber, generatedAt) {
        const timestamp = generatedAt
            .replace(/[-:.TZ]/g, "")
            .slice(0, 14);

        return [
            "TMS",
            "CAPTURE",
            String(sessionNumber).padStart(3, "0"),
            timestamp
        ].join("-");
    }

    function validateSourceRollbackPackage(rollbackPackage) {
        const checks = [];
        const packageValidation =
            window.TMSRollbackPackageGenerator.validateRollbackPackage(
                rollbackPackage
            );

        checks.push(buildCheck(
            "Rollback package exists",
            isPlainObject(rollbackPackage),
            "A Rollback Package Generator package is required."
        ));

        checks.push(buildCheck(
            "Rollback package accepted",
            Boolean(rollbackPackage && rollbackPackage.accepted),
            "The source rollback package must be accepted."
        ));

        checks.push(buildCheck(
            "Rollback package validation accepted",
            Boolean(packageValidation && packageValidation.accepted),
            "The source rollback package must pass generator validation."
        ));

        checks.push(buildCheck(
            "Expected rollback document count",
            Boolean(rollbackPackage) &&
                rollbackPackage.rollbackDocumentCount ===
                    EXPECTED_DOCUMENTS.length,
            "The source rollback package must contain five documents."
        ));

        checks.push(buildCheck(
            "Original documents not already captured",
            Boolean(rollbackPackage) &&
                rollbackPackage.originalDocumentsCaptured === false,
            "The source package must be awaiting original-document capture."
        ));

        checks.push(buildCheck(
            "Rollback not already ready",
            Boolean(rollbackPackage) &&
                rollbackPackage.rollbackReady === false,
            "The source rollback package must not already be rollback-ready."
        ));

        checks.push(buildCheck(
            "Write remains unauthorized",
            Boolean(rollbackPackage) &&
                rollbackPackage.writeAuthorized === false,
            "Permanent writing must remain unauthorized."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(rollbackPackage) &&
                rollbackPackage.permanentWritesExecuted === false,
            "No permanent writes may occur before original capture."
        ));

        const documentSetValid =
            Boolean(rollbackPackage) &&
            Array.isArray(rollbackPackage.documents) &&
            rollbackPackage.documents.length === EXPECTED_DOCUMENTS.length &&
            EXPECTED_DOCUMENTS.every(function (documentId) {
                return rollbackPackage.documents.some(function (document) {
                    return document.documentId === documentId &&
                        document.originalDocumentCaptured === false &&
                        document.originalDocument === null &&
                        document.proposedDocumentCaptured === true &&
                        isPlainObject(document.proposedDocument);
                });
            });

        checks.push(buildCheck(
            "Expected rollback document set",
            documentSetValid,
            "All five uncaptured rollback document entries are required."
        ));

        return {
            accepted: checks.every(function (check) {
                return check.passed;
            }),
            checks: checks,
            packageValidation: packageValidation
        };
    }

    async function loadJsonDocument(targetPath) {
        const response = await window.fetch(targetPath, {
            method: "GET",
            cache: "no-store",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(
                "Document request failed with HTTP status " +
                response.status +
                " for " +
                targetPath +
                "."
            );
        }

        const text = await response.text();
        let parsed;

        try {
            parsed = JSON.parse(text);
        } catch (error) {
            throw new SyntaxError(
                "The live permanent document is not valid JSON: " +
                targetPath +
                "."
            );
        }

        return {
            document: parsed,
            responseUrl: response.url || targetPath,
            contentLength: text.length
        };
    }

    async function captureDocument(rollbackEntry) {
        const checks = [];
        let loadedDocument = null;
        let responseUrl = null;
        let contentLength = null;
        let loadError = null;

        checks.push(buildCheck(
            "Rollback entry exists",
            isPlainObject(rollbackEntry),
            "A rollback document entry is required."
        ));

        checks.push(buildCheck(
            "Document ID is expected",
            Boolean(rollbackEntry) &&
                EXPECTED_DOCUMENTS.includes(rollbackEntry.documentId),
            "The rollback entry must target one of the five permanent documents."
        ));

        checks.push(buildCheck(
            "Target path exists",
            Boolean(rollbackEntry) &&
                typeof rollbackEntry.targetPath === "string" &&
                rollbackEntry.targetPath.trim().length > 0,
            "The rollback entry must contain a live permanent target path."
        ));

        if (checks.every(function (check) { return check.passed; })) {
            try {
                const loaded = await loadJsonDocument(
                    rollbackEntry.targetPath
                );

                loadedDocument = loaded.document;
                responseUrl = loaded.responseUrl;
                contentLength = loaded.contentLength;
            } catch (error) {
                loadError = error;
            }
        }

        checks.push(buildCheck(
            "Live document loaded",
            Boolean(loadedDocument) && !loadError,
            loadError
                ? loadError.message
                : "The current live permanent document must load successfully."
        ));

        checks.push(buildCheck(
            "Live document is an object",
            isPlainObject(loadedDocument),
            "The current live permanent document must be a JSON object."
        ));

        checks.push(buildCheck(
            "Live document ID matches target",
            Boolean(loadedDocument) &&
                loadedDocument.id === rollbackEntry.documentId,
            "The live permanent document ID must match the rollback target."
        ));

        checks.push(buildCheck(
            "Live document sections are valid",
            Boolean(loadedDocument) &&
                Array.isArray(loadedDocument.sections),
            "The live permanent document must contain a sections array."
        ));

        checks.push(buildCheck(
            "Live document revision history is valid",
            Boolean(loadedDocument) &&
                Array.isArray(loadedDocument.revisionHistory),
            "The live permanent document must contain revision history."
        ));

        const accepted = checks.every(function (check) {
            return check.passed;
        });

        if (!accepted) {
            return {
                accepted: false,
                documentId: rollbackEntry
                    ? rollbackEntry.documentId
                    : "Unknown",
                targetPath: rollbackEntry
                    ? rollbackEntry.targetPath
                    : null,
                message:
                    "The original permanent document failed capture validation.",
                checks: checks,
                originalDocumentCaptured: false,
                originalDocument: null,
                originalChecksum: null,
                responseUrl: responseUrl,
                contentLength: contentLength,
                captureStatus: "Rejected"
            };
        }

        const immutableOriginal =
            deepFreeze(clone(loadedDocument));

        return {
            accepted: true,
            documentId: rollbackEntry.documentId,
            targetPath: rollbackEntry.targetPath,
            message:
                "Original permanent document loaded, verified, and captured.",
            checks: checks,
            originalDocumentCaptured: true,
            originalDocument: immutableOriginal,
            originalChecksum: calculateChecksum(immutableOriginal),
            originalVersion: immutableOriginal.version || "Unknown",
            originalLastUpdated:
                immutableOriginal.lastUpdated || "Unknown",
            originalSectionCount:
                immutableOriginal.sections.length,
            originalRevisionCount:
                immutableOriginal.revisionHistory.length,
            responseUrl: responseUrl,
            contentLength: contentLength,
            captureStatus: "Captured and Verified"
        };
    }

    function buildCapturedDocumentEntry(
        rollbackEntry,
        captureResult
    ) {
        return {
            order: rollbackEntry.order,
            documentId: rollbackEntry.documentId,
            updateMode: rollbackEntry.updateMode,
            targetPath: rollbackEntry.targetPath,

            backupPath: rollbackEntry.backupPath,
            proposedCopyPath: rollbackEntry.proposedCopyPath,

            originalDocumentCaptureRequired: true,
            originalDocumentCaptured: true,
            originalDocument:
                clone(captureResult.originalDocument),

            proposedDocumentCaptured: true,
            proposedDocument:
                clone(rollbackEntry.proposedDocument),

            sourceVersion:
                captureResult.originalVersion,
            proposedVersion:
                rollbackEntry.proposedVersion,
            proposedLastUpdated:
                rollbackEntry.proposedLastUpdated,

            sourceSectionCount:
                captureResult.originalSectionCount,
            proposedSectionCount:
                rollbackEntry.proposedSectionCount,

            checksumRequired: true,
            originalChecksum:
                captureResult.originalChecksum,
            proposedChecksum:
                calculateChecksum(
                    rollbackEntry.proposedDocument
                ),

            rollbackRequiredBeforeWrite: true,
            rollbackSource:
                "Captured current live permanent JSON document",

            backupStatus: "Captured and Verified",
            executionStatus: "Not Started",
            restoreStatus: "Not Required",
            verificationStatus: "Passed",

            responseUrl:
                captureResult.responseUrl,
            contentLength:
                captureResult.contentLength,
            originalRevisionCount:
                captureResult.originalRevisionCount,

            writeAuthorized: false,
            rollbackAuthorized: false,
            permanentWriteExecuted: false,
            restoreExecuted: false
        };
    }

    function rejectedCapture(
        message,
        rollbackPackage,
        validation,
        captureResults
    ) {
        const snapshot =
            window.TMSSessionContext.getSnapshot();

        const generatedAt =
            new Date().toISOString();

        return deepFreeze({
            captureType: CAPTURE_TYPE,
            engineVersion: ENGINE_VERSION,
            captureId: createCaptureId(
                snapshot.sessionNumber,
                generatedAt
            ),
            generatedAt: generatedAt,
            sessionNumber: snapshot.sessionNumber,

            accepted: false,
            message: message,

            sourceRollbackPackageAccepted:
                Boolean(
                    rollbackPackage &&
                    rollbackPackage.accepted
                ),
            sourceRollbackPackageId:
                rollbackPackage
                    ? rollbackPackage.packageId
                    : null,

            validationAccepted:
                Boolean(validation && validation.accepted),
            validationChecks:
                validation ? validation.checks : [],

            expectedDocumentCount:
                EXPECTED_DOCUMENTS.length,
            capturedDocumentCount: 0,
            captureResults:
                captureResults || [],
            documents: [],

            originalDocumentsCaptured: false,
            proposedDocumentsCaptured: Boolean(
                rollbackPackage &&
                rollbackPackage.proposedDocumentsCaptured
            ),

            rollbackReady: false,
            rollbackAuthorized: false,
            writeAuthorized: false,

            permanentWritesExecuted: false,
            restoreExecuted: false,

            captureStatus: "Rejected",
            requiredNextAction:
                "Correct the failed source or document capture checks.",
            reviewRequired: true
        });
    }

    async function captureRollbackPackage(rollbackPackage) {
        const sourcePackage = rollbackPackage ||
            await window.TMSRollbackPackageGenerator
                .generateRollbackPackage();

        const validation =
            validateSourceRollbackPackage(sourcePackage);

        if (!validation.accepted) {
            lastCapture = rejectedCapture(
                "The rollback package failed original-document capture validation.",
                sourcePackage,
                validation,
                []
            );

            return lastCapture;
        }

        const captureResults = [];

        for (
            let index = 0;
            index < sourcePackage.documents.length;
            index += 1
        ) {
            captureResults.push(
                await captureDocument(
                    sourcePackage.documents[index]
                )
            );
        }

        const allCaptured =
            captureResults.every(function (result) {
                return result.accepted &&
                    result.originalDocumentCaptured;
            });

        if (!allCaptured) {
            lastCapture = rejectedCapture(
                "One or more original permanent documents failed capture.",
                sourcePackage,
                validation,
                captureResults
            );

            return lastCapture;
        }

        const capturedDocuments =
            sourcePackage.documents.map(function (
                rollbackEntry
            ) {
                const captureResult =
                    captureResults.find(function (
                        result
                    ) {
                        return result.documentId ===
                            rollbackEntry.documentId;
                    });

                return buildCapturedDocumentEntry(
                    rollbackEntry,
                    captureResult
                );
            });

        const snapshot =
            window.TMSSessionContext.getSnapshot();

        const generatedAt =
            new Date().toISOString();

        lastCapture = deepFreeze({
            captureType: CAPTURE_TYPE,
            engineVersion: ENGINE_VERSION,
            captureId: createCaptureId(
                snapshot.sessionNumber,
                generatedAt
            ),
            generatedAt: generatedAt,
            sessionNumber: snapshot.sessionNumber,

            accepted: true,
            message:
                "All five original permanent documents were loaded, " +
                "verified, and captured. No permanent files were changed.",

            sourceRollbackPackageAccepted: true,
            sourceRollbackPackageId:
                sourcePackage.packageId,
            sourceRollbackGeneratorVersion:
                sourcePackage.generatorVersion,
            sourceRollbackGeneratedAt:
                sourcePackage.generatedAt,

            validationAccepted: true,
            validationChecks:
                validation.checks,

            expectedDocumentCount:
                EXPECTED_DOCUMENTS.length,
            capturedDocumentCount:
                capturedDocuments.length,
            captureResults:
                captureResults,
            documents:
                capturedDocuments,

            originalDocumentsCaptured: true,
            proposedDocumentsCaptured: true,

            rollbackReady: true,
            rollbackAuthorized: false,
            writeAuthorized: false,

            permanentWritesExecuted: false,
            restoreExecuted: false,

            captureStatus:
                "Captured and Verified — Rollback Ready",

            requiredNextAction:
                "Submit the rollback-ready capture package to the future Controlled Execution Engine.",

            reviewRequired: true,
            reviewChoices: [
                "Approve Capture Package Structure",
                "Revise Session",
                "Cancel Capture Package"
            ]
        });

        return lastCapture;
    }

    function validateCapture(capturePackage) {
        const current =
            capturePackage || lastCapture;

        const checks = [];

        checks.push(buildCheck(
            "Capture package exists",
            isPlainObject(current),
            "An Original Document Capture package is required."
        ));

        checks.push(buildCheck(
            "Capture package accepted",
            Boolean(current && current.accepted),
            "The capture package must be accepted."
        ));

        checks.push(buildCheck(
            "Expected capture count",
            Boolean(current) &&
                current.capturedDocumentCount ===
                    EXPECTED_DOCUMENTS.length,
            "Exactly five original documents must be captured."
        ));

        checks.push(buildCheck(
            "Original documents captured",
            Boolean(current) &&
                current.originalDocumentsCaptured === true,
            "All original permanent documents must be captured."
        ));

        checks.push(buildCheck(
            "Proposed documents retained",
            Boolean(current) &&
                current.proposedDocumentsCaptured === true,
            "All proposed replacement documents must remain captured."
        ));

        checks.push(buildCheck(
            "Rollback package ready",
            Boolean(current) &&
                current.rollbackReady === true,
            "The capture package must be rollback-ready."
        ));

        checks.push(buildCheck(
            "Rollback remains unauthorized",
            Boolean(current) &&
                current.rollbackAuthorized === false,
            "Rollback execution must remain unauthorized."
        ));

        checks.push(buildCheck(
            "Write remains unauthorized",
            Boolean(current) &&
                current.writeAuthorized === false,
            "Permanent writing must remain unauthorized."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(current) &&
                current.permanentWritesExecuted === false,
            "The capture engine must not change permanent files."
        ));

        const documentEntriesValid =
            Boolean(current) &&
            Array.isArray(current.documents) &&
            current.documents.length ===
                EXPECTED_DOCUMENTS.length &&
            current.documents.every(function (document) {
                return EXPECTED_DOCUMENTS.includes(
                    document.documentId
                ) &&
                    document.originalDocumentCaptured === true &&
                    isPlainObject(document.originalDocument) &&
                    document.originalDocument.id ===
                        document.documentId &&
                    document.proposedDocumentCaptured === true &&
                    isPlainObject(document.proposedDocument) &&
                    typeof document.originalChecksum === "string" &&
                    document.originalChecksum.length > 0 &&
                    typeof document.proposedChecksum === "string" &&
                    document.proposedChecksum.length > 0 &&
                    document.backupStatus ===
                        "Captured and Verified" &&
                    document.verificationStatus === "Passed" &&
                    document.writeAuthorized === false &&
                    document.rollbackAuthorized === false &&
                    document.permanentWriteExecuted === false &&
                    document.restoreExecuted === false;
            });

        checks.push(buildCheck(
            "Captured document entries valid",
            documentEntriesValid,
            "Every document must contain verified original and proposed copies with checksums."
        ));

        return deepFreeze({
            validatorVersion: ENGINE_VERSION,
            accepted: checks.every(function (check) {
                return check.passed;
            }),
            checks: checks
        });
    }

    async function formatCaptureReport(capturePackage) {
        const current = capturePackage ||
            await captureRollbackPackage();

        const lines = [
            "TMS-OS ORIGINAL PERMANENT DOCUMENT CAPTURE",
            "Capture ID: " + current.captureId,
            "Accepted: " +
                (current.accepted ? "YES" : "NO"),
            "Work Session: " + current.sessionNumber,
            "Engine Version: " + current.engineVersion,
            "Capture Status: " + current.captureStatus,
            "Captured Documents: " +
                current.capturedDocumentCount,
            "Original Documents Captured: " +
                (
                    current.originalDocumentsCaptured
                        ? "YES"
                        : "NO"
                ),
            "Proposed Documents Captured: " +
                (
                    current.proposedDocumentsCaptured
                        ? "YES"
                        : "NO"
                ),
            "Rollback Ready: " +
                (
                    current.rollbackReady
                        ? "YES"
                        : "NO"
                ),
            "Rollback Authorized: NO",
            "Write Authorized: NO",
            "Permanent Writes Executed: NO",
            "Restore Executed: NO"
        ];

        (current.documents || []).forEach(function (document) {
            lines.push(
                document.order +
                " | " +
                document.documentId +
                " | " +
                document.backupStatus +
                " | " +
                document.originalChecksum +
                " | WRITE LOCKED"
            );
        });

        if (current.requiredNextAction) {
            lines.push(
                "Required Next Action: " +
                current.requiredNextAction
            );
        }

        if (current.reviewChoices) {
            lines.push(
                "Review Choices: " +
                current.reviewChoices.join(" | ")
            );
        }

        return lines.join("\n");
    }

    function getLastCapture() {
        return lastCapture;
    }

    function getExpectedDocuments() {
        return EXPECTED_DOCUMENTS.slice();
    }

    window.TMSOriginalDocumentCaptureEngine =
        Object.freeze({
            engineVersion: ENGINE_VERSION,
            captureRollbackPackage:
                captureRollbackPackage,
            validateCapture: validateCapture,
            formatCaptureReport:
                formatCaptureReport,
            getLastCapture: getLastCapture,
            getExpectedDocuments:
                getExpectedDocuments
        });

    console.log(
        "Original Document Capture Engine v" +
        ENGINE_VERSION +
        " initialized for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());
