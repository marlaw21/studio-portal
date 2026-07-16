/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 056 — Rollback Execution Engine v1.0.0
Disabled Foundation
File: js/session/rollback-execution-engine.js

Purpose:
Consume an accepted Original Document Capture package and generate a complete,
ordered rollback restoration manifest while keeping all restore capability
disabled.

This version does not write, replace, rename, move, delete, restore, download,
or otherwise modify any permanent file. It creates a review-only restoration
manifest that describes the exact future rollback sequence while preserving
every safety lock.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const EXECUTION_MODE = "Disabled";
    const MANIFEST_TYPE =
        "TMS-OS Permanent Documentation Rollback Restoration Manifest";

    const EXPECTED_DOCUMENTS = Object.freeze([
        "MILE-HIST-001",
        "DEC-LOG-001",
        "DOC-STATE-001",
        "STATE-001",
        "WS-HIST-001"
    ]);

    let lastRestoreManifest = null;

    if (
        !window.TMSSessionContext ||
        !window.TMSOriginalDocumentCaptureEngine
    ) {
        console.error(
            "Rollback Execution Engine could not initialize because its dependencies are unavailable."
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

    function buildCheck(name, passed, message) {
        return {
            name: name,
            passed: Boolean(passed),
            message: message
        };
    }

    function createManifestId(sessionNumber, generatedAt) {
        const timestamp = generatedAt
            .replace(/[-:.TZ]/g, "")
            .slice(0, 14);

        return [
            "TMS",
            "ROLLBACK-RESTORE-MANIFEST",
            String(sessionNumber).padStart(3, "0"),
            timestamp
        ].join("-");
    }

    function validateCapturePackage(capturePackage) {
        const checks = [];
        let captureValidation = { accepted: false, checks: [] };

        if (isPlainObject(capturePackage)) {
            captureValidation =
                window.TMSOriginalDocumentCaptureEngine
                    .validateCapture(capturePackage);
        }

        checks.push(buildCheck(
            "Capture package exists",
            isPlainObject(capturePackage),
            "An Original Document Capture package is required."
        ));

        checks.push(buildCheck(
            "Capture package accepted",
            Boolean(capturePackage && capturePackage.accepted),
            "The Original Document Capture package must be accepted."
        ));

        checks.push(buildCheck(
            "Capture validation accepted",
            Boolean(captureValidation && captureValidation.accepted),
            "The Original Document Capture package must pass validation."
        ));

        checks.push(buildCheck(
            "Expected captured document count",
            Boolean(capturePackage) &&
                capturePackage.capturedDocumentCount === 5,
            "Exactly five original permanent documents must be captured."
        ));

        checks.push(buildCheck(
            "Original documents captured",
            Boolean(capturePackage) &&
                capturePackage.originalDocumentsCaptured === true,
            "All original permanent documents must be captured."
        ));

        checks.push(buildCheck(
            "Rollback ready",
            Boolean(capturePackage) &&
                capturePackage.rollbackReady === true,
            "The source package must be rollback-ready."
        ));

        checks.push(buildCheck(
            "Rollback remains unauthorized",
            Boolean(capturePackage) &&
                capturePackage.rollbackAuthorized === false,
            "Rollback authorization must remain locked."
        ));

        checks.push(buildCheck(
            "Write remains unauthorized",
            Boolean(capturePackage) &&
                capturePackage.writeAuthorized === false,
            "Permanent write authorization must remain locked."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(capturePackage) &&
                capturePackage.permanentWritesExecuted === false,
            "No permanent file may have been changed."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(capturePackage) &&
                capturePackage.restoreExecuted === false,
            "No rollback restore may have been executed."
        ));

        const documents = capturePackage && Array.isArray(capturePackage.documents)
            ? capturePackage.documents
            : [];

        const sourceIds = documents.map(function (document) {
            return document.documentId;
        });
        const expectedSourceIds = EXPECTED_DOCUMENTS.slice().reverse();

        const sourceSetValid =
            documents.length === expectedSourceIds.length &&
            expectedSourceIds.every(function (documentId) {
                return sourceIds.includes(documentId);
            }) &&
            new Set(sourceIds).size === expectedSourceIds.length;

        checks.push(buildCheck(
            "Expected captured document set",
            sourceSetValid,
            "The capture package must contain the unique five-document permanent set."
        ));

        const documentsValid =
            documents.length === expectedSourceIds.length &&
            documents.every(function (document) {
                return (
                    expectedSourceIds.includes(document.documentId) &&
                    document.originalDocumentCaptured === true &&
                    isPlainObject(document.originalDocument) &&
                    document.originalDocument.id === document.documentId &&
                    typeof document.originalChecksum === "string" &&
                    document.originalChecksum.length > 0 &&
                    typeof document.targetPath === "string" &&
                    document.targetPath.length > 0 &&
                    typeof document.backupPath === "string" &&
                    document.backupPath.length > 0 &&
                    document.backupStatus === "Captured and Verified" &&
                    document.verificationStatus === "Passed" &&
                    document.writeAuthorized === false &&
                    document.rollbackAuthorized === false &&
                    document.permanentWriteExecuted === false &&
                    document.restoreExecuted === false
                );
            });

        checks.push(buildCheck(
            "Captured originals valid",
            documentsValid,
            "Every captured original must be complete, verified, checksum-backed, and execution-locked."
        ));

        return {
            accepted: checks.every(function (check) {
                return check.passed;
            }),
            checks: checks,
            captureValidation: captureValidation
        };
    }

    function buildRestoreEntry(document, index) {
        return {
            sequence: index + 1,
            sourceOrder: document.order,
            documentId: document.documentId,
            updateMode: document.updateMode,
            targetPath: document.targetPath,
            backupPath: document.backupPath,
            proposedCopyPath: document.proposedCopyPath,
            originalChecksum: document.originalChecksum,
            proposedChecksum: document.proposedChecksum,
            originalVersion: document.sourceVersion,
            proposedVersion: document.proposedVersion,
            originalSectionCount: document.sourceSectionCount,
            proposedSectionCount: document.proposedSectionCount,
            prerequisiteChecks: [
                "Original document captured",
                "Original checksum present",
                "Backup path present",
                "Target path present",
                "Restore order verified",
                "Execution mode confirmed disabled"
            ],
            prerequisiteStatus: "Passed",
            intendedRestoreAction:
                "Restore complete original permanent JSON file",
            executionMode: EXECUTION_MODE,
            restoreStatus: "Disabled — Manifest Only",
            restoreDecision: "Not Executed",
            rollbackAuthorized: false,
            restoreAuthorized: false,
            writeAuthorized: false,
            actualRestoreAttempted: false,
            actualRestoreExecuted: false,
            permanentWriteExecuted: false
        };
    }

    function rejectedManifest(message, capturePackage, validation) {
        const snapshot = window.TMSSessionContext.getSnapshot();
        const generatedAt = new Date().toISOString();

        return deepFreeze({
            manifestType: MANIFEST_TYPE,
            engineVersion: ENGINE_VERSION,
            executionMode: EXECUTION_MODE,
            manifestId: createManifestId(snapshot.sessionNumber, generatedAt),
            generatedAt: generatedAt,
            sessionNumber: snapshot.sessionNumber,
            accepted: false,
            message: message,
            sourceCaptureAccepted: Boolean(capturePackage && capturePackage.accepted),
            sourceCaptureId: capturePackage ? capturePackage.captureId : null,
            sourceCaptureStatus: capturePackage
                ? capturePackage.captureStatus
                : "Unavailable",
            validationAccepted: Boolean(validation && validation.accepted),
            validationChecks: validation ? validation.checks : [],
            expectedDocumentCount: EXPECTED_DOCUMENTS.length,
            restoreDocumentCount: 0,
            restoreEntries: [],
            originalsVerified: false,
            restoreManifestReady: false,
            rollbackAuthorized: false,
            restoreAuthorized: false,
            writeAuthorized: false,
            actualRestoresAttempted: false,
            restoreExecuted: false,
            permanentWritesExecuted: false,
            manifestStatus: "Rejected",
            requiredNextAction:
                "Correct the failed capture-package or rollback-manifest prerequisite checks.",
            reviewRequired: true
        });
    }

    async function generateRestoreManifest(capturePackage) {
        const sourceCapture = capturePackage ||
            await window.TMSOriginalDocumentCaptureEngine
                .captureRollbackPackage();

        const validation = validateCapturePackage(sourceCapture);

        if (!validation.accepted) {
            lastRestoreManifest = rejectedManifest(
                "The Original Document Capture package failed Rollback Execution manifest validation.",
                sourceCapture,
                validation
            );
            return lastRestoreManifest;
        }

        const restoreOrderMap = new Map(
            EXPECTED_DOCUMENTS.map(function (documentId, index) {
                return [documentId, index];
            })
        );

        const orderedDocuments = clone(sourceCapture.documents)
            .sort(function (first, second) {
                return restoreOrderMap.get(first.documentId) -
                    restoreOrderMap.get(second.documentId);
            });

        const restoreEntries = orderedDocuments.map(function (document, index) {
            return buildRestoreEntry(document, index);
        });

        const allEntriesSafe = restoreEntries.every(function (entry) {
            return (
                entry.prerequisiteStatus === "Passed" &&
                entry.executionMode === EXECUTION_MODE &&
                entry.restoreStatus === "Disabled — Manifest Only" &&
                entry.restoreDecision === "Not Executed" &&
                entry.rollbackAuthorized === false &&
                entry.restoreAuthorized === false &&
                entry.writeAuthorized === false &&
                entry.actualRestoreAttempted === false &&
                entry.actualRestoreExecuted === false &&
                entry.permanentWriteExecuted === false
            );
        });

        if (!allEntriesSafe) {
            lastRestoreManifest = rejectedManifest(
                "One or more rollback restoration entries failed disabled-mode safety validation.",
                sourceCapture,
                validation
            );
            return lastRestoreManifest;
        }

        const snapshot = window.TMSSessionContext.getSnapshot();
        const generatedAt = new Date().toISOString();

        lastRestoreManifest = deepFreeze({
            manifestType: MANIFEST_TYPE,
            engineVersion: ENGINE_VERSION,
            executionMode: EXECUTION_MODE,
            manifestId: createManifestId(snapshot.sessionNumber, generatedAt),
            generatedAt: generatedAt,
            sessionNumber: snapshot.sessionNumber,
            accepted: true,
            message:
                "The five-document rollback restoration manifest was generated in Disabled mode. No files were changed and no restore authority was granted.",
            sourceCaptureAccepted: true,
            sourceCaptureId: sourceCapture.captureId,
            sourceCaptureStatus: sourceCapture.captureStatus,
            sourceCaptureEngineVersion: sourceCapture.engineVersion,
            sourceCaptureGeneratedAt: sourceCapture.generatedAt,
            sourceRollbackPackageId: sourceCapture.sourceRollbackPackageId,
            validationAccepted: true,
            validationChecks: validation.checks,
            expectedDocumentCount: EXPECTED_DOCUMENTS.length,
            restoreDocumentCount: restoreEntries.length,
            restoreEntries: restoreEntries,
            originalsVerified: true,
            restoreManifestReady: true,
            rollbackAuthorized: false,
            restoreAuthorized: false,
            writeAuthorized: false,
            actualRestoresAttempted: false,
            restoreExecuted: false,
            permanentWritesExecuted: false,
            manifestStatus: "Ready for Review — Restore Disabled",
            requiredNextAction:
                "Submit this disabled restoration manifest for human review before any future restore-enabled design is considered.",
            reviewRequired: true,
            reviewChoices: [
                "Approve Disabled Restore Manifest Structure",
                "Revise Session",
                "Cancel Restore Manifest"
            ]
        });

        return lastRestoreManifest;
    }

    function validateRestoreManifest(manifest) {
        const current = manifest || lastRestoreManifest;
        const checks = [];

        checks.push(buildCheck(
            "Restore manifest exists",
            isPlainObject(current),
            "A Rollback Restoration manifest is required."
        ));
        checks.push(buildCheck(
            "Restore manifest accepted",
            Boolean(current && current.accepted),
            "The restore manifest must be accepted."
        ));
        checks.push(buildCheck(
            "Execution mode is disabled",
            Boolean(current) && current.executionMode === EXECUTION_MODE,
            "Version 1.0.0 must remain in Disabled mode."
        ));
        checks.push(buildCheck(
            "Expected restore document count",
            Boolean(current) &&
                current.restoreDocumentCount === EXPECTED_DOCUMENTS.length,
            "Exactly five permanent documents must be included."
        ));
        checks.push(buildCheck(
            "Originals verified",
            Boolean(current) && current.originalsVerified === true,
            "All original permanent documents must be verified."
        ));
        checks.push(buildCheck(
            "Restore manifest ready",
            Boolean(current) && current.restoreManifestReady === true,
            "The disabled restoration manifest must be ready for review."
        ));
        checks.push(buildCheck(
            "Rollback remains unauthorized",
            Boolean(current) && current.rollbackAuthorized === false,
            "Rollback authorization must remain locked."
        ));
        checks.push(buildCheck(
            "Restore remains unauthorized",
            Boolean(current) && current.restoreAuthorized === false,
            "Restore authorization must remain locked."
        ));
        checks.push(buildCheck(
            "Write remains unauthorized",
            Boolean(current) && current.writeAuthorized === false,
            "Permanent write authorization must remain locked."
        ));
        checks.push(buildCheck(
            "No actual restores attempted",
            Boolean(current) && current.actualRestoresAttempted === false,
            "No actual restore may be attempted."
        ));
        checks.push(buildCheck(
            "No restore executed",
            Boolean(current) && current.restoreExecuted === false,
            "No rollback restoration may occur."
        ));
        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(current) && current.permanentWritesExecuted === false,
            "No permanent file may be modified."
        ));

        const entries = current && Array.isArray(current.restoreEntries)
            ? current.restoreEntries
            : [];
        const documentIds = entries.map(function (entry) {
            return entry.documentId;
        });

        const documentSetValid =
            entries.length === EXPECTED_DOCUMENTS.length &&
            EXPECTED_DOCUMENTS.every(function (documentId) {
                return documentIds.includes(documentId);
            }) &&
            new Set(documentIds).size === EXPECTED_DOCUMENTS.length;

        checks.push(buildCheck(
            "Expected restore document set",
            documentSetValid,
            "The manifest must contain the unique five-document permanent set."
        ));

        const entriesValid =
            entries.length === EXPECTED_DOCUMENTS.length &&
            entries.every(function (entry, index) {
                return (
                    entry.sequence === index + 1 &&
                    entry.documentId === EXPECTED_DOCUMENTS[index] &&
                    entry.prerequisiteStatus === "Passed" &&
                    entry.executionMode === EXECUTION_MODE &&
                    entry.restoreStatus === "Disabled — Manifest Only" &&
                    entry.restoreDecision === "Not Executed" &&
                    typeof entry.targetPath === "string" &&
                    entry.targetPath.length > 0 &&
                    typeof entry.backupPath === "string" &&
                    entry.backupPath.length > 0 &&
                    typeof entry.originalChecksum === "string" &&
                    entry.originalChecksum.length > 0 &&
                    entry.rollbackAuthorized === false &&
                    entry.restoreAuthorized === false &&
                    entry.writeAuthorized === false &&
                    entry.actualRestoreAttempted === false &&
                    entry.actualRestoreExecuted === false &&
                    entry.permanentWriteExecuted === false
                );
            });

        checks.push(buildCheck(
            "Restore entries valid",
            entriesValid,
            "Every restore entry must be complete, ordered, checksum-backed, disabled, and non-destructive."
        ));

        return deepFreeze({
            validatorVersion: ENGINE_VERSION,
            accepted: checks.every(function (check) {
                return check.passed;
            }),
            checks: checks
        });
    }

    async function formatRestoreManifest(manifest) {
        const current = manifest || await generateRestoreManifest();

        const lines = [
            "TMS-OS PERMANENT DOCUMENTATION ROLLBACK RESTORATION MANIFEST",
            "Manifest ID: " + current.manifestId,
            "Accepted: " + (current.accepted ? "YES" : "NO"),
            "Work Session: " + current.sessionNumber,
            "Engine Version: " + current.engineVersion,
            "Execution Mode: " + current.executionMode,
            "Manifest Status: " + current.manifestStatus,
            "Restore Documents: " + current.restoreDocumentCount,
            "Originals Verified: " +
                (current.originalsVerified ? "YES" : "NO"),
            "Restore Manifest Ready: " +
                (current.restoreManifestReady ? "YES" : "NO"),
            "Rollback Authorized: NO",
            "Restore Authorized: NO",
            "Write Authorized: NO",
            "Actual Restores Attempted: NO",
            "Restore Executed: NO",
            "Permanent Writes Executed: NO"
        ];

        (current.restoreEntries || []).forEach(function (entry) {
            lines.push(
                entry.sequence +
                " | " +
                entry.documentId +
                " | " +
                entry.restoreStatus +
                " | NO FILE CHANGE"
            );
        });

        if (current.requiredNextAction) {
            lines.push("Required Next Action: " + current.requiredNextAction);
        }

        if (current.reviewChoices) {
            lines.push("Review Choices: " + current.reviewChoices.join(" | "));
        }

        return lines.join("\n");
    }

    function getLastRestoreManifest() {
        return lastRestoreManifest;
    }

    function getExpectedDocuments() {
        return EXPECTED_DOCUMENTS.slice();
    }

    window.TMSRollbackExecutionEngine = Object.freeze({
        engineVersion: ENGINE_VERSION,
        executionMode: EXECUTION_MODE,
        generateRestoreManifest: generateRestoreManifest,
        validateRestoreManifest: validateRestoreManifest,
        formatRestoreManifest: formatRestoreManifest,
        getLastRestoreManifest: getLastRestoreManifest,
        getExpectedDocuments: getExpectedDocuments
    });

    console.log(
        "Rollback Execution Engine v" +
        ENGINE_VERSION +
        " initialized in " +
        EXECUTION_MODE +
        " Mode for Work Session " +
        window.TMSSessionContext.getSnapshot().sessionNumber +
        "."
    );
}());
