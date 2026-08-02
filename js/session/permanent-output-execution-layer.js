/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 103 — Permanent Output Execution Layer v1.0.0
Disabled Foundation
File: js/session/permanent-output-execution-layer.js

Purpose:
Consume the accepted twelve-stage Permanent Output Pipeline Review, the accepted
Permanent Write Execution Manifest, and the accepted Rollback Restoration
Manifest, validate their shared six-document contract, and produce one unified,
review-only execution package.

This layer does not write, replace, rename, move, delete, restore, download, or
otherwise modify any permanent file. It does not activate execution authority.
All operational behavior remains disabled.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const EXECUTION_MODE = "Disabled";
    const PACKAGE_TYPE =
        "TMS-OS Unified Permanent Output Execution Package";

    const EXPECTED_DOCUMENTS = Object.freeze([
        "WS-HIST-001",
        "STATE-001",
        "DOC-STATE-001",
        "DEC-LOG-001",
        "MILE-HIST-001",
        "WORKSPACE-SNAPSHOT-HISTORY-001"
    ]);

    let lastExecutionPackage = null;

    const REQUIRED_GLOBALS = Object.freeze([
        "TMSSessionContext",
        "TMSPermanentOutputOrchestrator",
        "TMSPermanentWriteExecutionEngine",
        "TMSRollbackExecutionEngine"
    ]);

    const missingDependencies =
        REQUIRED_GLOBALS.filter(function (name) {
            return !window[name];
        });

    if (missingDependencies.length > 0) {
        console.error(
            "Permanent Output Execution Layer could not initialize because dependencies are unavailable:",
            missingDependencies
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

    function createPackageId(sessionNumber, generatedAt) {
        const timestamp =
            generatedAt
                .replace(/[-:.TZ]/g, "")
                .slice(0, 14);

        return [
            "TMS",
            "PERMANENT-OUTPUT-EXECUTION-PACKAGE",
            String(sessionNumber).padStart(3, "0"),
            timestamp
        ].join("-");
    }

    function getDocumentIds(entries) {
        return entries.map(function (entry) {
            return entry.documentId;
        });
    }

    function hasExpectedDocumentSet(entries) {
        const ids = getDocumentIds(entries);

        return (
            entries.length === EXPECTED_DOCUMENTS.length &&
            EXPECTED_DOCUMENTS.every(function (documentId) {
                return ids.includes(documentId);
            }) &&
            new Set(ids).size === EXPECTED_DOCUMENTS.length
        );
    }

    function validateSources(
        pipelineReview,
        executionManifest,
        restoreManifest
    ) {
        const checks = [];

        const pipelineValidation =
            isPlainObject(pipelineReview)
                ? window.TMSPermanentOutputOrchestrator
                    .validatePipelineReview(pipelineReview)
                : { accepted: false, checks: [] };

        const executionValidation =
            isPlainObject(executionManifest)
                ? window.TMSPermanentWriteExecutionEngine
                    .validateExecutionManifest(executionManifest)
                : { accepted: false, checks: [] };

        const restoreValidation =
            isPlainObject(restoreManifest)
                ? window.TMSRollbackExecutionEngine
                    .validateRestoreManifest(restoreManifest)
                : { accepted: false, checks: [] };

        checks.push(buildCheck(
            "Pipeline review exists",
            isPlainObject(pipelineReview),
            "An accepted Permanent Output Pipeline Review is required."
        ));

        checks.push(buildCheck(
            "Pipeline review accepted",
            Boolean(pipelineReview && pipelineReview.accepted),
            "The twelve-stage pipeline review must be accepted."
        ));

        checks.push(buildCheck(
            "Pipeline review validation accepted",
            Boolean(pipelineValidation && pipelineValidation.accepted),
            "The twelve-stage pipeline review must pass validation."
        ));

        checks.push(buildCheck(
            "Pipeline review complete",
            Boolean(pipelineReview) &&
                pipelineReview.stageCount === 12 &&
                pipelineReview.completedStageCount === 12 &&
                pipelineReview.pipelineReady === true &&
                pipelineReview.pipelineCompleted === true &&
                pipelineReview.failedStage === null,
            "All twelve orchestrated stages must be complete."
        ));

        checks.push(buildCheck(
            "Human authorization retained",
            Boolean(pipelineReview) &&
                pipelineReview.humanAuthorizationVerified === true &&
                pipelineReview.humanAuthorizedDocumentCount === 5 &&
                pipelineReview.humanExcludedDocumentCount === 1,
            "The pipeline review must retain the six-document human authorization result."
        ));

        checks.push(buildCheck(
            "Execution manifest exists",
            isPlainObject(executionManifest),
            "An accepted Permanent Write Execution Manifest is required."
        ));

        checks.push(buildCheck(
            "Execution manifest accepted",
            Boolean(executionManifest && executionManifest.accepted),
            "The Permanent Write Execution Manifest must be accepted."
        ));

        checks.push(buildCheck(
            "Execution manifest validation accepted",
            Boolean(executionValidation && executionValidation.accepted),
            "The Permanent Write Execution Manifest must pass validation."
        ));

        checks.push(buildCheck(
            "Execution manifest ready",
            Boolean(executionManifest) &&
                executionManifest.executionMode === EXECUTION_MODE &&
                executionManifest.executionDocumentCount === 6 &&
                executionManifest.writeRequiredDocumentCount === 5 &&
                executionManifest.excludedDocumentCount === 1 &&
                executionManifest.manifestReady === true &&
                executionManifest.humanAuthorizationVerified === true,
            "The Disabled Mode execution manifest must be ready for all six documents."
        ));

        checks.push(buildCheck(
            "Restore manifest exists",
            isPlainObject(restoreManifest),
            "An accepted Rollback Restoration Manifest is required."
        ));

        checks.push(buildCheck(
            "Restore manifest accepted",
            Boolean(restoreManifest && restoreManifest.accepted),
            "The Rollback Restoration Manifest must be accepted."
        ));

        checks.push(buildCheck(
            "Restore manifest validation accepted",
            Boolean(restoreValidation && restoreValidation.accepted),
            "The Rollback Restoration Manifest must pass validation."
        ));

        checks.push(buildCheck(
            "Restore manifest ready",
            Boolean(restoreManifest) &&
                restoreManifest.executionMode === EXECUTION_MODE &&
                restoreManifest.restoreDocumentCount === 6 &&
                restoreManifest.restoreRequiredDocumentCount === 5 &&
                restoreManifest.noRestoreRequiredDocumentCount === 1 &&
                restoreManifest.restoreManifestReady === true &&
                restoreManifest.originalsVerified === true,
            "The Disabled Mode restore manifest must be ready for all six documents."
        ));

        checks.push(buildCheck(
            "Source session identity aligned",
            Boolean(pipelineReview) &&
                Boolean(executionManifest) &&
                Boolean(restoreManifest) &&
                pipelineReview.sessionNumber ===
                    executionManifest.sessionNumber &&
                executionManifest.sessionNumber ===
                    restoreManifest.sessionNumber,
            "All source packages must belong to the same work session."
        ));

        const executionEntries =
            executionManifest &&
            Array.isArray(executionManifest.executionEntries)
                ? executionManifest.executionEntries
                : [];

        const restoreEntries =
            restoreManifest &&
            Array.isArray(restoreManifest.restoreEntries)
                ? restoreManifest.restoreEntries
                : [];

        checks.push(buildCheck(
            "Execution document set valid",
            hasExpectedDocumentSet(executionEntries),
            "The execution manifest must contain the unique six-document permanent set."
        ));

        checks.push(buildCheck(
            "Restore document set valid",
            hasExpectedDocumentSet(restoreEntries),
            "The restore manifest must contain the unique six-document permanent set."
        ));

        const executionById = new Map(
            executionEntries.map(function (entry) {
                return [entry.documentId, entry];
            })
        );

        const restoreById = new Map(
            restoreEntries.map(function (entry) {
                return [entry.documentId, entry];
            })
        );

        const documentDecisionsAligned =
            EXPECTED_DOCUMENTS.every(function (documentId) {
                const executionEntry =
                    executionById.get(documentId);

                const restoreEntry =
                    restoreById.get(documentId);

                if (!executionEntry || !restoreEntry) {
                    return false;
                }

                return (
                    executionEntry.permanentWriteRequired ===
                        restoreEntry.permanentWriteRequired &&
                    executionEntry.originalChecksum ===
                        restoreEntry.originalChecksum &&
                    executionEntry.proposedChecksum ===
                        restoreEntry.proposedChecksum &&
                    executionEntry.targetPath ===
                        restoreEntry.targetPath
                );
            });

        checks.push(buildCheck(
            "Execution and restore document decisions aligned",
            documentDecisionsAligned,
            "Execution and restore manifests must agree on document identity, write decision, checksums, and target path."
        ));

        const allSourceSafeguardsLocked =
            Boolean(pipelineReview) &&
            Boolean(executionManifest) &&
            Boolean(restoreManifest) &&
            pipelineReview.authorizationGranted === false &&
            pipelineReview.executionAuthorized === false &&
            pipelineReview.writeAuthorized === false &&
            pipelineReview.rollbackAuthorized === false &&
            pipelineReview.restoreAuthorized === false &&
            pipelineReview.actualWritesAttempted === false &&
            pipelineReview.actualRestoresAttempted === false &&
            pipelineReview.permanentWritesExecuted === false &&
            pipelineReview.restoreExecuted === false &&
            executionManifest.executionAuthorized === false &&
            executionManifest.writeAuthorized === false &&
            executionManifest.rollbackAuthorized === false &&
            executionManifest.actualWritesAttempted === false &&
            executionManifest.permanentWritesExecuted === false &&
            executionManifest.restoreExecuted === false &&
            restoreManifest.rollbackAuthorized === false &&
            restoreManifest.restoreAuthorized === false &&
            restoreManifest.writeAuthorized === false &&
            restoreManifest.actualRestoresAttempted === false &&
            restoreManifest.permanentWritesExecuted === false &&
            restoreManifest.restoreExecuted === false;

        checks.push(buildCheck(
            "All source safeguards locked",
            allSourceSafeguardsLocked,
            "All operational execution, write, rollback, and restore controls must remain disabled."
        ));

        return {
            accepted:
                checks.every(function (check) {
                    return check.passed;
                }),
            checks: checks,
            pipelineValidation: pipelineValidation,
            executionValidation: executionValidation,
            restoreValidation: restoreValidation
        };
    }

    function buildDocumentRecord(
        executionEntry,
        restoreEntry,
        index
    ) {
        const writeRequired =
            executionEntry.permanentWriteRequired === true;

        return {
            sequence: index + 1,
            documentId: executionEntry.documentId,
            updateMode: executionEntry.updateMode,
            targetPath: executionEntry.targetPath,
            backupPath: executionEntry.backupPath,
            proposedCopyPath: executionEntry.proposedCopyPath,
            originalChecksum: executionEntry.originalChecksum,
            proposedChecksum: executionEntry.proposedChecksum,
            documentChanged:
                executionEntry.documentChanged === true,
            permanentWriteRequired:
                writeRequired,
            excludedFromExecution:
                executionEntry.excludedFromExecution === true,
            excludedFromRestore:
                restoreEntry.excludedFromRestore === true,
            executionDecision:
                executionEntry.executionDecision,
            restoreDecision:
                restoreEntry.restoreDecision,
            intendedExecutionAction:
                executionEntry.intendedAction,
            intendedRestoreAction:
                restoreEntry.intendedRestoreAction,
            executionStatus:
                executionEntry.executionStatus,
            restoreStatus:
                restoreEntry.restoreStatus,
            executionMode:
                EXECUTION_MODE,
            packageDecision:
                writeRequired
                    ? "Write and Restore Paths Verified — Disabled"
                    : "No Write / No Restore Required",
            authorizationGranted: false,
            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,
            restoreAuthorized: false,
            actualWriteAttempted: false,
            actualRestoreAttempted: false,
            permanentWriteExecuted: false,
            restoreExecuted: false
        };
    }

    function rejectedPackage(
        message,
        pipelineReview,
        executionManifest,
        restoreManifest,
        validation
    ) {
        const snapshot =
            window.TMSSessionContext.getSnapshot();

        const generatedAt =
            new Date().toISOString();

        return deepFreeze({
            packageType: PACKAGE_TYPE,
            engineVersion: ENGINE_VERSION,
            executionMode: EXECUTION_MODE,
            packageId:
                createPackageId(
                    snapshot.sessionNumber,
                    generatedAt
                ),
            generatedAt: generatedAt,
            sessionNumber: snapshot.sessionNumber,
            accepted: false,
            message: message,
            sourcePipelineReviewId:
                pipelineReview
                    ? pipelineReview.reviewId
                    : null,
            sourceExecutionManifestId:
                executionManifest
                    ? executionManifest.manifestId
                    : null,
            sourceRestoreManifestId:
                restoreManifest
                    ? restoreManifest.manifestId
                    : null,
            validationAccepted:
                Boolean(validation && validation.accepted),
            validationChecks:
                validation ? validation.checks : [],
            expectedDocumentCount:
                EXPECTED_DOCUMENTS.length,
            executionDocumentCount: 0,
            writeRequiredDocumentCount: 0,
            excludedDocumentCount: 0,
            restoreRequiredDocumentCount: 0,
            noRestoreRequiredDocumentCount: 0,
            documents: [],
            prerequisitesVerified: false,
            executionPackageReady: false,
            authorizationGranted: false,
            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,
            restoreAuthorized: false,
            actualWritesAttempted: false,
            actualRestoresAttempted: false,
            permanentWritesExecuted: false,
            restoreExecuted: false,
            packageStatus: "Rejected",
            requiredNextAction:
                "Correct the failed source package or execution-layer validation checks.",
            reviewRequired: true
        });
    }

    async function generateExecutionPackage(
        pipelineReview,
        executionManifest,
        restoreManifest
    ) {
        const sourcePipelineReview =
            pipelineReview ||
            window.TMSPermanentOutputOrchestrator
                .getLastPipelineReview();

        const sourceExecutionManifest =
            executionManifest ||
            window.TMSPermanentWriteExecutionEngine
                .getLastExecutionManifest();

        const sourceRestoreManifest =
            restoreManifest ||
            window.TMSRollbackExecutionEngine
                .getLastRestoreManifest();

        const validation =
            validateSources(
                sourcePipelineReview,
                sourceExecutionManifest,
                sourceRestoreManifest
            );

        if (!validation.accepted) {
            lastExecutionPackage =
                rejectedPackage(
                    "The Permanent Output Execution Layer source packages failed validation.",
                    sourcePipelineReview,
                    sourceExecutionManifest,
                    sourceRestoreManifest,
                    validation
                );

            return lastExecutionPackage;
        }

        const executionEntries =
            clone(
                sourceExecutionManifest
                    .executionEntries
            );

        const restoreEntries =
            clone(
                sourceRestoreManifest
                    .restoreEntries
            );

        const restoreById = new Map(
            restoreEntries.map(function (entry) {
                return [entry.documentId, entry];
            })
        );

        const orderedExecutionEntries =
            EXPECTED_DOCUMENTS.map(function (
                documentId
            ) {
                return executionEntries.find(
                    function (entry) {
                        return (
                            entry.documentId ===
                            documentId
                        );
                    }
                );
            });

        const documents =
            orderedExecutionEntries.map(function (
                executionEntry,
                index
            ) {
                return buildDocumentRecord(
                    executionEntry,
                    restoreById.get(
                        executionEntry.documentId
                    ),
                    index
                );
            });

        const writeRequiredDocumentCount =
            documents.filter(function (document) {
                return (
                    document
                        .permanentWriteRequired ===
                    true
                );
            }).length;

        const excludedDocumentCount =
            documents.length -
            writeRequiredDocumentCount;

        const restoreRequiredDocumentCount =
            documents.filter(function (document) {
                return (
                    document.excludedFromRestore ===
                    false
                );
            }).length;

        const noRestoreRequiredDocumentCount =
            documents.length -
            restoreRequiredDocumentCount;

        const documentRecordsSafe =
            documents.every(function (document) {
                const commonValid =
                    document.executionMode ===
                        EXECUTION_MODE &&
                    document.authorizationGranted ===
                        false &&
                    document.executionAuthorized ===
                        false &&
                    document.writeAuthorized ===
                        false &&
                    document.rollbackAuthorized ===
                        false &&
                    document.restoreAuthorized ===
                        false &&
                    document.actualWriteAttempted ===
                        false &&
                    document.actualRestoreAttempted ===
                        false &&
                    document.permanentWriteExecuted ===
                        false &&
                    document.restoreExecuted ===
                        false;

                if (!commonValid) {
                    return false;
                }

                if (
                    document.permanentWriteRequired ===
                    true
                ) {
                    return (
                        document.documentChanged ===
                            true &&
                        document.excludedFromExecution ===
                            false &&
                        document.excludedFromRestore ===
                            false &&
                        document.packageDecision ===
                            "Write and Restore Paths Verified — Disabled"
                    );
                }

                return (
                    document.documentChanged ===
                        false &&
                    document.excludedFromExecution ===
                        true &&
                    document.excludedFromRestore ===
                        true &&
                    document.packageDecision ===
                        "No Write / No Restore Required"
                );
            });

        if (!documentRecordsSafe) {
            lastExecutionPackage =
                rejectedPackage(
                    "One or more unified execution document records failed Disabled Mode safety validation.",
                    sourcePipelineReview,
                    sourceExecutionManifest,
                    sourceRestoreManifest,
                    validation
                );

            return lastExecutionPackage;
        }

        const snapshot =
            window.TMSSessionContext.getSnapshot();

        const generatedAt =
            new Date().toISOString();

        lastExecutionPackage =
            deepFreeze({
                packageType: PACKAGE_TYPE,
                engineVersion: ENGINE_VERSION,
                executionMode: EXECUTION_MODE,
                packageId:
                    createPackageId(
                        snapshot.sessionNumber,
                        generatedAt
                    ),
                generatedAt: generatedAt,
                sessionNumber:
                    snapshot.sessionNumber,
                sourceSessionNumber:
                    sourcePipelineReview
                        .sessionNumber,
                accepted: true,
                message:
                    "The accepted twelve-stage pipeline review, Disabled Mode write execution manifest, and Disabled Mode rollback restoration manifest were unified into one six-document execution package. No permanent file operations occurred.",
                sourcePipelineReviewId:
                    sourcePipelineReview.reviewId,
                sourcePipelineReviewStatus:
                    sourcePipelineReview.reviewStatus,
                sourceExecutionManifestId:
                    sourceExecutionManifest.manifestId,
                sourceExecutionManifestStatus:
                    sourceExecutionManifest.manifestStatus,
                sourceRestoreManifestId:
                    sourceRestoreManifest.manifestId,
                sourceRestoreManifestStatus:
                    sourceRestoreManifest.manifestStatus,
                validationAccepted: true,
                validationChecks:
                    validation.checks,
                expectedDocumentCount:
                    EXPECTED_DOCUMENTS.length,
                executionDocumentCount:
                    documents.length,
                writeRequiredDocumentCount:
                    writeRequiredDocumentCount,
                excludedDocumentCount:
                    excludedDocumentCount,
                restoreRequiredDocumentCount:
                    restoreRequiredDocumentCount,
                noRestoreRequiredDocumentCount:
                    noRestoreRequiredDocumentCount,
                documents: documents,
                pipelineVerified: true,
                executionManifestVerified: true,
                restoreManifestVerified: true,
                humanAuthorizationVerified: true,
                prerequisitesVerified: true,
                executionPackageReady: true,
                authorizationGranted: false,
                executionAuthorized: false,
                writeAuthorized: false,
                rollbackAuthorized: false,
                restoreAuthorized: false,
                actualWritesAttempted: false,
                actualRestoresAttempted: false,
                permanentWritesExecuted: false,
                restoreExecuted: false,
                packageStatus:
                    "Ready for Review — Unified Execution Disabled",
                requiredNextAction:
                    "Submit the unified Disabled Mode execution package for human review before any future write-enabled or restore-enabled execution design is considered.",
                reviewRequired: true,
                reviewChoices: [
                    "Approve Unified Execution Package Structure",
                    "Revise Session",
                    "Cancel Unified Execution Package"
                ]
            });

        return lastExecutionPackage;
    }

    function validateExecutionPackage(
        executionPackage
    ) {
        const current =
            executionPackage ||
            lastExecutionPackage;

        const checks = [];

        checks.push(buildCheck(
            "Execution package exists",
            isPlainObject(current),
            "A unified Permanent Output Execution Package is required."
        ));

        checks.push(buildCheck(
            "Execution package accepted",
            Boolean(current && current.accepted),
            "The unified execution package must be accepted."
        ));

        checks.push(buildCheck(
            "Execution mode is disabled",
            Boolean(current) &&
                current.executionMode ===
                    EXECUTION_MODE,
            "Version 1.0.0 must remain in Disabled Mode."
        ));

        checks.push(buildCheck(
            "Expected document count",
            Boolean(current) &&
                current.executionDocumentCount ===
                    EXPECTED_DOCUMENTS.length,
            "Exactly six permanent documents must be represented."
        ));

        checks.push(buildCheck(
            "Package decision counts valid",
            Boolean(current) &&
                current.writeRequiredDocumentCount === 5 &&
                current.excludedDocumentCount === 1 &&
                current.restoreRequiredDocumentCount === 5 &&
                current.noRestoreRequiredDocumentCount === 1,
            "The unified package must preserve five required and one excluded document for both write and restore paths."
        ));

        checks.push(buildCheck(
            "All source packages verified",
            Boolean(current) &&
                current.pipelineVerified === true &&
                current.executionManifestVerified === true &&
                current.restoreManifestVerified === true &&
                current.humanAuthorizationVerified === true,
            "All source package verification states must be retained."
        ));

        checks.push(buildCheck(
            "Prerequisites verified",
            Boolean(current) &&
                current.prerequisitesVerified ===
                    true,
            "All unified execution prerequisites must be verified."
        ));

        checks.push(buildCheck(
            "Execution package ready",
            Boolean(current) &&
                current.executionPackageReady ===
                    true,
            "The Disabled Mode execution package must be ready for review."
        ));

        [
            ["Authorization remains ungranted", "authorizationGranted"],
            ["Execution remains unauthorized", "executionAuthorized"],
            ["Write remains unauthorized", "writeAuthorized"],
            ["Rollback remains unauthorized", "rollbackAuthorized"],
            ["Restore remains unauthorized", "restoreAuthorized"],
            ["No actual writes attempted", "actualWritesAttempted"],
            ["No actual restores attempted", "actualRestoresAttempted"],
            ["No permanent writes executed", "permanentWritesExecuted"],
            ["No restore executed", "restoreExecuted"]
        ].forEach(function (item) {
            checks.push(buildCheck(
                item[0],
                Boolean(current) &&
                    current[item[1]] === false,
                item[0] + "."
            ));
        });

        const documents =
            current &&
            Array.isArray(current.documents)
                ? current.documents
                : [];

        checks.push(buildCheck(
            "Expected document set",
            hasExpectedDocumentSet(documents),
            "The unified package must contain the unique six-document permanent set."
        ));

        const documentsValid =
            documents.length ===
                EXPECTED_DOCUMENTS.length &&
            documents.every(function (
                document,
                index
            ) {
                const commonValid =
                    document.sequence ===
                        index + 1 &&
                    document.documentId ===
                        EXPECTED_DOCUMENTS[index] &&
                    document.executionMode ===
                        EXECUTION_MODE &&
                    typeof document.originalChecksum ===
                        "string" &&
                    document.originalChecksum.length > 0 &&
                    typeof document.proposedChecksum ===
                        "string" &&
                    document.proposedChecksum.length > 0 &&
                    document.authorizationGranted ===
                        false &&
                    document.executionAuthorized ===
                        false &&
                    document.writeAuthorized ===
                        false &&
                    document.rollbackAuthorized ===
                        false &&
                    document.restoreAuthorized ===
                        false &&
                    document.actualWriteAttempted ===
                        false &&
                    document.actualRestoreAttempted ===
                        false &&
                    document.permanentWriteExecuted ===
                        false &&
                    document.restoreExecuted ===
                        false;

                if (!commonValid) {
                    return false;
                }

                if (
                    document.permanentWriteRequired ===
                    true
                ) {
                    return (
                        document.documentChanged ===
                            true &&
                        document.excludedFromExecution ===
                            false &&
                        document.excludedFromRestore ===
                            false
                    );
                }

                return (
                    document.documentChanged ===
                        false &&
                    document.excludedFromExecution ===
                        true &&
                    document.excludedFromRestore ===
                        true
                );
            });

        checks.push(buildCheck(
            "Unified document records valid",
            documentsValid,
            "Every unified document record must be complete, ordered, checksum-backed, decision-valid, disabled, and non-destructive."
        ));

        return deepFreeze({
            validatorVersion:
                ENGINE_VERSION,
            accepted:
                checks.every(function (check) {
                    return check.passed;
                }),
            checks: checks
        });
    }

    async function formatExecutionPackage(
        executionPackage
    ) {
        const current =
            executionPackage ||
            await generateExecutionPackage();

        const lines = [
            "TMS-OS UNIFIED PERMANENT OUTPUT EXECUTION PACKAGE",
            "Package ID: " + current.packageId,
            "Accepted: " +
                (current.accepted ? "YES" : "NO"),
            "Work Session: " +
                current.sessionNumber,
            "Source Work Session: " +
                (current.sourceSessionNumber || "Unavailable"),
            "Engine Version: " +
                current.engineVersion,
            "Execution Mode: " +
                current.executionMode,
            "Package Status: " +
                current.packageStatus,
            "Execution Documents: " +
                current.executionDocumentCount,
            "Write Required Documents: " +
                current.writeRequiredDocumentCount,
            "No Write Required Documents: " +
                current.excludedDocumentCount,
            "Restore Required Documents: " +
                current.restoreRequiredDocumentCount,
            "No Restore Required Documents: " +
                current.noRestoreRequiredDocumentCount,
            "Pipeline Verified: " +
                (current.pipelineVerified ? "YES" : "NO"),
            "Execution Manifest Verified: " +
                (current.executionManifestVerified ? "YES" : "NO"),
            "Restore Manifest Verified: " +
                (current.restoreManifestVerified ? "YES" : "NO"),
            "Human Authorization Verified: " +
                (current.humanAuthorizationVerified ? "YES" : "NO"),
            "Authorization Granted: NO",
            "Execution Authorized: NO",
            "Write Authorized: NO",
            "Rollback Authorized: NO",
            "Restore Authorized: NO",
            "Actual Writes Attempted: NO",
            "Actual Restores Attempted: NO",
            "Permanent Writes Executed: NO",
            "Restore Executed: NO"
        ];

        (current.documents || []).forEach(
            function (document) {
                lines.push(
                    document.sequence +
                    " | " +
                    document.documentId +
                    " | " +
                    document.packageDecision
                );
            }
        );

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

    function getLastExecutionPackage() {
        return lastExecutionPackage;
    }

    function getExpectedDocuments() {
        return EXPECTED_DOCUMENTS.slice();
    }

    window.TMSPermanentOutputExecutionLayer =
        Object.freeze({
            engineVersion:
                ENGINE_VERSION,
            executionMode:
                EXECUTION_MODE,
            generateExecutionPackage:
                generateExecutionPackage,
            validateExecutionPackage:
                validateExecutionPackage,
            formatExecutionPackage:
                formatExecutionPackage,
            getLastExecutionPackage:
                getLastExecutionPackage,
            getExpectedDocuments:
                getExpectedDocuments
        });

    console.log(
        "Permanent Output Execution Layer v" +
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
