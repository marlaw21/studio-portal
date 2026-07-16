/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 055 — Permanent Write Execution Engine v1.0.0
Disabled Foundation
File: js/session/permanent-write-execution-engine.js

Purpose:
Consume an accepted Execution Authorization package and generate a complete,
ordered permanent-write execution manifest while keeping all write capability
disabled.

This version does not write, replace, rename, move, delete, restore, download,
or otherwise modify any permanent file. It creates a review-only manifest that
describes the exact future execution sequence while preserving every safety lock.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const EXECUTION_MODE = "Disabled";
    const MANIFEST_TYPE =
        "TMS-OS Permanent Documentation Write Execution Manifest";

    const EXPECTED_DOCUMENTS = Object.freeze([
        "WS-HIST-001",
        "STATE-001",
        "DOC-STATE-001",
        "DEC-LOG-001",
        "MILE-HIST-001"
    ]);

    let lastExecutionManifest = null;

    if (
        !window.TMSSessionContext ||
        !window.TMSExecutionAuthorizationEngine
    ) {
        console.error(
            "Permanent Write Execution Engine could not initialize because its dependencies are unavailable."
        );
        return;
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function deepFreeze(value) {
        if (
            !value ||
            typeof value !== "object" ||
            Object.isFrozen(value)
        ) {
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
            "WRITE-EXECUTION-MANIFEST",
            String(sessionNumber).padStart(3, "0"),
            timestamp
        ].join("-");
    }

    function validateAuthorizationPackage(authorization) {
        const checks = [];

        let authorizationValidation = {
            accepted: false,
            checks: []
        };

        if (isPlainObject(authorization)) {
            authorizationValidation =
                window.TMSExecutionAuthorizationEngine
                    .validateAuthorization(authorization);
        }

        checks.push(buildCheck(
            "Authorization package exists",
            isPlainObject(authorization),
            "An Execution Authorization package is required."
        ));

        checks.push(buildCheck(
            "Authorization package accepted",
            Boolean(authorization && authorization.accepted),
            "The Execution Authorization package must be accepted."
        ));

        checks.push(buildCheck(
            "Authorization validation accepted",
            Boolean(
                authorizationValidation &&
                authorizationValidation.accepted
            ),
            "The Execution Authorization package must pass validation."
        ));

        checks.push(buildCheck(
            "Expected authorization document count",
            Boolean(authorization) &&
                authorization.authorizationDocumentCount ===
                    EXPECTED_DOCUMENTS.length,
            "Exactly five permanent documents must be present."
        ));

        checks.push(buildCheck(
            "Prerequisites verified",
            Boolean(authorization) &&
                authorization.prerequisitesVerified === true,
            "All execution prerequisites must be verified."
        ));

        checks.push(buildCheck(
            "Authorization eligibility confirmed",
            Boolean(authorization) &&
                authorization.authorizationEligible === true,
            "The package must be eligible for human authorization review."
        ));

        checks.push(buildCheck(
            "Authorization remains ungranted",
            Boolean(authorization) &&
                authorization.authorizationGranted === false,
            "Version 1.0.0 must not grant real execution authorization."
        ));

        checks.push(buildCheck(
            "Execution remains unauthorized",
            Boolean(authorization) &&
                authorization.executionAuthorized === false,
            "Execution authorization must remain locked."
        ));

        checks.push(buildCheck(
            "Write remains unauthorized",
            Boolean(authorization) &&
                authorization.writeAuthorized === false,
            "Permanent write authorization must remain locked."
        ));

        checks.push(buildCheck(
            "Rollback remains unauthorized",
            Boolean(authorization) &&
                authorization.rollbackAuthorized === false,
            "Rollback authorization must remain locked."
        ));

        checks.push(buildCheck(
            "No actual writes attempted",
            Boolean(authorization) &&
                authorization.actualWritesAttempted === false,
            "No actual permanent write may have been attempted."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(authorization) &&
                authorization.permanentWritesExecuted === false,
            "No permanent file may have been modified."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(authorization) &&
                authorization.restoreExecuted === false,
            "No rollback restoration may have occurred."
        ));

        const entries =
            authorization &&
            Array.isArray(authorization.authorizationEntries)
                ? authorization.authorizationEntries
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
            "Expected authorization document set",
            documentSetValid,
            "The authorization package must contain the unique five-document permanent set."
        ));

        const entriesValid =
            entries.length === EXPECTED_DOCUMENTS.length &&
            entries.every(function (entry, index) {
                return (
                    entry.sequence === index + 1 &&
                    entry.documentId === EXPECTED_DOCUMENTS[index] &&
                    entry.prerequisiteStatus === "Passed" &&
                    entry.authorizationEligibility ===
                        "Eligible for Human Authorization Review" &&
                    entry.authorizationDecision === "Not Granted" &&
                    entry.executionAuthorized === false &&
                    entry.writeAuthorized === false &&
                    entry.rollbackAuthorized === false &&
                    entry.actualWriteAttempted === false &&
                    entry.permanentWriteExecuted === false &&
                    entry.restoreExecuted === false &&
                    typeof entry.targetPath === "string" &&
                    entry.targetPath.length > 0 &&
                    typeof entry.backupPath === "string" &&
                    entry.backupPath.length > 0 &&
                    typeof entry.proposedCopyPath === "string" &&
                    entry.proposedCopyPath.length > 0 &&
                    typeof entry.originalChecksum === "string" &&
                    entry.originalChecksum.length > 0 &&
                    typeof entry.proposedChecksum === "string" &&
                    entry.proposedChecksum.length > 0
                );
            });

        checks.push(buildCheck(
            "Authorization entries valid",
            entriesValid,
            "Every authorization entry must be complete, checksum-backed, ordered, and authorization-locked."
        ));

        return {
            accepted: checks.every(function (check) {
                return check.passed;
            }),
            checks: checks,
            authorizationValidation: authorizationValidation
        };
    }

    function buildExecutionEntry(authorizationEntry, index) {
        return {
            sequence: index + 1,
            order: authorizationEntry.order,
            documentId: authorizationEntry.documentId,
            updateMode: authorizationEntry.updateMode,

            targetPath: authorizationEntry.targetPath,
            backupPath: authorizationEntry.backupPath,
            proposedCopyPath: authorizationEntry.proposedCopyPath,

            originalChecksum: authorizationEntry.originalChecksum,
            proposedChecksum: authorizationEntry.proposedChecksum,

            prerequisiteChecks: [
                "Authorization package accepted",
                "Authorization prerequisites verified",
                "Document identity verified",
                "Execution order verified",
                "Original checksum present",
                "Proposed checksum present",
                "Backup path present",
                "Execution mode confirmed disabled"
            ],

            prerequisiteStatus: "Passed",

            intendedAction:
                "Replace complete permanent JSON file",

            executionMode: EXECUTION_MODE,
            executionStatus:
                "Disabled — Manifest Only",

            executionDecision:
                "Not Executed",

            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,

            actualWriteAttempted: false,
            actualWriteExecuted: false,
            permanentWriteExecuted: false,
            restoreExecuted: false
        };
    }

    function rejectedManifest(message, authorization, validation) {
        const snapshot = window.TMSSessionContext.getSnapshot();
        const generatedAt = new Date().toISOString();

        return deepFreeze({
            manifestType: MANIFEST_TYPE,
            engineVersion: ENGINE_VERSION,
            executionMode: EXECUTION_MODE,

            manifestId: createManifestId(
                snapshot.sessionNumber,
                generatedAt
            ),

            generatedAt: generatedAt,
            sessionNumber: snapshot.sessionNumber,

            accepted: false,
            message: message,

            sourceAuthorizationAccepted: Boolean(
                authorization &&
                authorization.accepted
            ),

            sourceAuthorizationId:
                authorization
                    ? authorization.authorizationId
                    : null,

            sourceAuthorizationStatus:
                authorization
                    ? authorization.authorizationStatus
                    : "Unavailable",

            validationAccepted: Boolean(
                validation &&
                validation.accepted
            ),

            validationChecks:
                validation ? validation.checks : [],

            expectedDocumentCount:
                EXPECTED_DOCUMENTS.length,

            executionDocumentCount: 0,
            executionEntries: [],

            prerequisitesVerified: false,
            manifestReady: false,

            authorizationGranted: false,
            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,

            actualWritesAttempted: false,
            permanentWritesExecuted: false,
            restoreExecuted: false,

            manifestStatus: "Rejected",

            requiredNextAction:
                "Correct the failed authorization-package or execution-manifest prerequisite checks.",

            reviewRequired: true
        });
    }

    async function generateExecutionManifest(authorization) {
        const sourceAuthorization =
            authorization ||
            await window.TMSExecutionAuthorizationEngine
                .generateAuthorization();

        const validation =
            validateAuthorizationPackage(sourceAuthorization);

        if (!validation.accepted) {
            lastExecutionManifest =
                rejectedManifest(
                    "The Execution Authorization package failed Permanent Write Execution manifest validation.",
                    sourceAuthorization,
                    validation
                );

            return lastExecutionManifest;
        }

        const orderedEntries =
            clone(sourceAuthorization.authorizationEntries)
                .sort(function (first, second) {
                    return Number(first.sequence) -
                        Number(second.sequence);
                });

        const executionEntries =
            orderedEntries.map(function (
                authorizationEntry,
                index
            ) {
                return buildExecutionEntry(
                    authorizationEntry,
                    index
                );
            });

        const allEntriesSafe =
            executionEntries.every(function (entry) {
                return (
                    entry.prerequisiteStatus === "Passed" &&
                    entry.executionMode === EXECUTION_MODE &&
                    entry.executionStatus ===
                        "Disabled — Manifest Only" &&
                    entry.executionDecision ===
                        "Not Executed" &&
                    entry.executionAuthorized === false &&
                    entry.writeAuthorized === false &&
                    entry.rollbackAuthorized === false &&
                    entry.actualWriteAttempted === false &&
                    entry.actualWriteExecuted === false &&
                    entry.permanentWriteExecuted === false &&
                    entry.restoreExecuted === false
                );
            });

        if (!allEntriesSafe) {
            lastExecutionManifest =
                rejectedManifest(
                    "One or more permanent document execution entries failed disabled-mode safety validation.",
                    sourceAuthorization,
                    validation
                );

            return lastExecutionManifest;
        }

        const snapshot =
            window.TMSSessionContext.getSnapshot();

        const generatedAt =
            new Date().toISOString();

        lastExecutionManifest =
            deepFreeze({
                manifestType: MANIFEST_TYPE,
                engineVersion: ENGINE_VERSION,
                executionMode: EXECUTION_MODE,

                manifestId:
                    createManifestId(
                        snapshot.sessionNumber,
                        generatedAt
                    ),

                generatedAt: generatedAt,
                sessionNumber:
                    snapshot.sessionNumber,

                accepted: true,

                message:
                    "The five-document permanent write execution manifest was generated in Disabled mode. No files were changed and no authority was granted.",

                sourceAuthorizationAccepted: true,
                sourceAuthorizationId:
                    sourceAuthorization.authorizationId,
                sourceAuthorizationStatus:
                    sourceAuthorization.authorizationStatus,
                sourceAuthorizationEngineVersion:
                    sourceAuthorization.engineVersion,
                sourceAuthorizationGeneratedAt:
                    sourceAuthorization.generatedAt,

                sourceVerificationId:
                    sourceAuthorization.sourceVerificationId,
                sourceSimulationId:
                    sourceAuthorization.sourceSimulationId,
                sourceExecutionPlanId:
                    sourceAuthorization.sourceExecutionPlanId,
                sourceCaptureId:
                    sourceAuthorization.sourceCaptureId,
                sourceRollbackPackageId:
                    sourceAuthorization.sourceRollbackPackageId,

                validationAccepted: true,
                validationChecks: validation.checks,

                expectedDocumentCount:
                    EXPECTED_DOCUMENTS.length,

                executionDocumentCount:
                    executionEntries.length,

                executionEntries:
                    executionEntries,

                prerequisitesVerified: true,
                manifestReady: true,

                authorizationGranted: false,
                executionAuthorized: false,
                writeAuthorized: false,
                rollbackAuthorized: false,

                actualWritesAttempted: false,
                permanentWritesExecuted: false,
                restoreExecuted: false,

                manifestStatus:
                    "Ready for Review — Execution Disabled",

                requiredNextAction:
                    "Submit this disabled execution manifest for human review before any future write-enabled design is considered.",

                reviewRequired: true,

                reviewChoices: [
                    "Approve Disabled Manifest Structure",
                    "Revise Session",
                    "Cancel Manifest"
                ]
            });

        return lastExecutionManifest;
    }

    function validateExecutionManifest(manifest) {
        const current =
            manifest || lastExecutionManifest;

        const checks = [];

        checks.push(buildCheck(
            "Execution manifest exists",
            isPlainObject(current),
            "A Permanent Write Execution manifest is required."
        ));

        checks.push(buildCheck(
            "Execution manifest accepted",
            Boolean(current && current.accepted),
            "The execution manifest must be accepted."
        ));

        checks.push(buildCheck(
            "Execution mode is disabled",
            Boolean(current) &&
                current.executionMode === EXECUTION_MODE,
            "Version 1.0.0 must remain in Disabled mode."
        ));

        checks.push(buildCheck(
            "Expected execution document count",
            Boolean(current) &&
                current.executionDocumentCount ===
                    EXPECTED_DOCUMENTS.length,
            "Exactly five permanent documents must be included."
        ));

        checks.push(buildCheck(
            "Prerequisites verified",
            Boolean(current) &&
                current.prerequisitesVerified === true,
            "All execution-manifest prerequisites must be verified."
        ));

        checks.push(buildCheck(
            "Manifest ready",
            Boolean(current) &&
                current.manifestReady === true,
            "The disabled execution manifest must be ready for review."
        ));

        checks.push(buildCheck(
            "Authorization remains ungranted",
            Boolean(current) &&
                current.authorizationGranted === false,
            "The disabled foundation must not grant authorization."
        ));

        checks.push(buildCheck(
            "Execution remains unauthorized",
            Boolean(current) &&
                current.executionAuthorized === false,
            "Execution authorization must remain locked."
        ));

        checks.push(buildCheck(
            "Write remains unauthorized",
            Boolean(current) &&
                current.writeAuthorized === false,
            "Permanent write authorization must remain locked."
        ));

        checks.push(buildCheck(
            "Rollback remains unauthorized",
            Boolean(current) &&
                current.rollbackAuthorized === false,
            "Rollback authorization must remain locked."
        ));

        checks.push(buildCheck(
            "No actual writes attempted",
            Boolean(current) &&
                current.actualWritesAttempted === false,
            "No actual permanent write may be attempted."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(current) &&
                current.permanentWritesExecuted === false,
            "No permanent file may be modified."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(current) &&
                current.restoreExecuted === false,
            "No rollback restoration may occur."
        ));

        const entries =
            current &&
            Array.isArray(current.executionEntries)
                ? current.executionEntries
                : [];

        const documentIds =
            entries.map(function (entry) {
                return entry.documentId;
            });

        const documentSetValid =
            entries.length === EXPECTED_DOCUMENTS.length &&
            EXPECTED_DOCUMENTS.every(function (documentId) {
                return documentIds.includes(documentId);
            }) &&
            new Set(documentIds).size === EXPECTED_DOCUMENTS.length;

        checks.push(buildCheck(
            "Expected execution document set",
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
                    entry.executionStatus ===
                        "Disabled — Manifest Only" &&
                    entry.executionDecision ===
                        "Not Executed" &&
                    typeof entry.targetPath === "string" &&
                    entry.targetPath.length > 0 &&
                    typeof entry.backupPath === "string" &&
                    entry.backupPath.length > 0 &&
                    typeof entry.proposedCopyPath === "string" &&
                    entry.proposedCopyPath.length > 0 &&
                    typeof entry.originalChecksum === "string" &&
                    entry.originalChecksum.length > 0 &&
                    typeof entry.proposedChecksum === "string" &&
                    entry.proposedChecksum.length > 0 &&
                    entry.executionAuthorized === false &&
                    entry.writeAuthorized === false &&
                    entry.rollbackAuthorized === false &&
                    entry.actualWriteAttempted === false &&
                    entry.actualWriteExecuted === false &&
                    entry.permanentWriteExecuted === false &&
                    entry.restoreExecuted === false
                );
            });

        checks.push(buildCheck(
            "Execution entries valid",
            entriesValid,
            "Every manifest entry must be complete, ordered, checksum-backed, disabled, and non-destructive."
        ));

        return deepFreeze({
            validatorVersion: ENGINE_VERSION,
            accepted: checks.every(function (check) {
                return check.passed;
            }),
            checks: checks
        });
    }

    async function formatExecutionManifest(manifest) {
        const current =
            manifest ||
            await generateExecutionManifest();

        const lines = [
            "TMS-OS PERMANENT DOCUMENTATION WRITE EXECUTION MANIFEST",
            "Manifest ID: " + current.manifestId,
            "Accepted: " +
                (current.accepted ? "YES" : "NO"),
            "Work Session: " +
                current.sessionNumber,
            "Engine Version: " +
                current.engineVersion,
            "Execution Mode: " +
                current.executionMode,
            "Manifest Status: " +
                current.manifestStatus,
            "Execution Documents: " +
                current.executionDocumentCount,
            "Prerequisites Verified: " +
                (
                    current.prerequisitesVerified
                        ? "YES"
                        : "NO"
                ),
            "Manifest Ready: " +
                (
                    current.manifestReady
                        ? "YES"
                        : "NO"
                ),
            "Authorization Granted: NO",
            "Execution Authorized: NO",
            "Write Authorized: NO",
            "Rollback Authorized: NO",
            "Actual Writes Attempted: NO",
            "Permanent Writes Executed: NO",
            "Restore Executed: NO"
        ];

        (
            current.executionEntries || []
        ).forEach(function (entry) {
            lines.push(
                entry.sequence +
                " | " +
                entry.documentId +
                " | " +
                entry.updateMode +
                " | " +
                entry.executionStatus +
                " | NO FILE CHANGE"
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

    function getLastExecutionManifest() {
        return lastExecutionManifest;
    }

    function getExpectedDocuments() {
        return EXPECTED_DOCUMENTS.slice();
    }

    window.TMSPermanentWriteExecutionEngine =
        Object.freeze({
            engineVersion: ENGINE_VERSION,
            executionMode: EXECUTION_MODE,
            generateExecutionManifest:
                generateExecutionManifest,
            validateExecutionManifest:
                validateExecutionManifest,
            formatExecutionManifest:
                formatExecutionManifest,
            getLastExecutionManifest:
                getLastExecutionManifest,
            getExpectedDocuments:
                getExpectedDocuments
        });

    console.log(
        "Permanent Write Execution Engine v" +
        ENGINE_VERSION +
        " initialized in " +
        EXECUTION_MODE +
        " Mode for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());
