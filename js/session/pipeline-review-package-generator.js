/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 104 — Pipeline Review Package Generator v2.0.0
File: js/session/pipeline-review-package-generator.js

Purpose:
Consume an accepted Permanent Output Execution Layer package and its matching
twelve-stage Permanent Output Orchestrator review, then produce one immutable,
review-only governance package for the Final Human Approval Gateway.

Disabled Mode only. No permanent write, rollback, restore, authorization, file
move, rename, delete, or download operation is performed.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "2.0.0";
    const PACKAGE_MODE = "Disabled";
    const PACKAGE_TYPE =
        "TMS-OS Controlled Permanent Output Consolidated Review Package";

    const EXPECTED_DOCUMENTS = Object.freeze([
        "WS-HIST-001",
        "STATE-001",
        "DOC-STATE-001",
        "DEC-LOG-001",
        "MILE-HIST-001",
        "WORKSPACE-SNAPSHOT-HISTORY-001"
    ]);

    let lastReviewPackage = null;

    if (
        !window.TMSSessionContext ||
        !window.TMSPermanentOutputExecutionLayer ||
        !window.TMSPermanentOutputOrchestrator
    ) {
        console.error(
            "Pipeline Review Package Generator could not initialize because dependencies are unavailable."
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

    function createPackageId(sessionNumber, generatedAt) {
        return [
            "TMS",
            "PIPELINE-REVIEW-PACKAGE",
            String(sessionNumber).padStart(3, "0"),
            generatedAt.replace(/[-:.TZ]/g, "").slice(0, 14)
        ].join("-");
    }

    function hasExpectedDocuments(documents) {
        const ids = documents.map(function (document) {
            return document.documentId;
        });

        return (
            documents.length === EXPECTED_DOCUMENTS.length &&
            EXPECTED_DOCUMENTS.every(function (documentId) {
                return ids.includes(documentId);
            }) &&
            new Set(ids).size === EXPECTED_DOCUMENTS.length
        );
    }

    function buildStageSummary(stage) {
        return {
            sequence: stage.sequence,
            stageName: stage.stageName,
            accepted: stage.accepted === true,
            completed: stage.completed === true,
            status: stage.status,
            sourceId: stage.sourceId || null,
            safetyState: clone(stage.safetyState || {})
        };
    }

    function buildDocumentSummary(document) {
        return {
            sequence: document.sequence,
            documentId: document.documentId,
            updateMode: document.updateMode,
            targetPath: document.targetPath,
            documentChanged: document.documentChanged === true,
            permanentWriteRequired:
                document.permanentWriteRequired === true,
            excludedFromExecution:
                document.excludedFromExecution === true,
            excludedFromRestore:
                document.excludedFromRestore === true,
            executionDecision: document.executionDecision,
            restoreDecision: document.restoreDecision,
            packageDecision: document.packageDecision,
            executionMode: document.executionMode,
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

    function validateSources(executionPackage, review) {
        const checks = [];

        const executionValidation = isPlainObject(executionPackage)
            ? window.TMSPermanentOutputExecutionLayer
                .validateExecutionPackage(executionPackage)
            : { accepted: false, checks: [] };

        const reviewValidation = isPlainObject(review)
            ? window.TMSPermanentOutputOrchestrator
                .validatePipelineReview(review)
            : { accepted: false, checks: [] };

        checks.push(buildCheck(
            "Unified execution package exists",
            isPlainObject(executionPackage),
            "An accepted Permanent Output Execution Layer package is required."
        ));

        checks.push(buildCheck(
            "Unified execution package accepted",
            Boolean(executionPackage && executionPackage.accepted),
            "The unified execution package must be accepted."
        ));

        checks.push(buildCheck(
            "Unified execution package validation accepted",
            executionValidation.accepted === true,
            "The unified execution package must pass validation."
        ));

        checks.push(buildCheck(
            "Unified execution package ready",
            Boolean(executionPackage) &&
                executionPackage.executionMode === PACKAGE_MODE &&
                executionPackage.executionPackageReady === true &&
                executionPackage.prerequisitesVerified === true,
            "The unified execution package must be ready in Disabled Mode."
        ));

        checks.push(buildCheck(
            "Six-document decision contract",
            Boolean(executionPackage) &&
                executionPackage.executionDocumentCount === 6 &&
                executionPackage.writeRequiredDocumentCount === 5 &&
                executionPackage.excludedDocumentCount === 1 &&
                executionPackage.restoreRequiredDocumentCount === 5 &&
                executionPackage.noRestoreRequiredDocumentCount === 1,
            "The unified execution package must preserve the six-document write and restore decisions."
        ));

        checks.push(buildCheck(
            "Unified source verification retained",
            Boolean(executionPackage) &&
                executionPackage.pipelineVerified === true &&
                executionPackage.executionManifestVerified === true &&
                executionPackage.restoreManifestVerified === true &&
                executionPackage.humanAuthorizationVerified === true,
            "All source verification states must be retained."
        ));

        checks.push(buildCheck(
            "Orchestrator review exists",
            isPlainObject(review),
            "The matching twelve-stage orchestrator review is required."
        ));

        checks.push(buildCheck(
            "Orchestrator review accepted",
            Boolean(review && review.accepted),
            "The orchestrator review must be accepted."
        ));

        checks.push(buildCheck(
            "Orchestrator review validation accepted",
            reviewValidation.accepted === true,
            "The orchestrator review must pass validation."
        ));

        checks.push(buildCheck(
            "Twelve-stage pipeline complete",
            Boolean(review) &&
                review.stageCount === 12 &&
                review.completedStageCount === 12 &&
                review.pipelineReady === true &&
                review.pipelineCompleted === true &&
                review.failedStage === null,
            "All twelve pipeline stages must be complete."
        ));

        checks.push(buildCheck(
            "Source review aligned",
            Boolean(executionPackage) &&
                Boolean(review) &&
                executionPackage.sourcePipelineReviewId === review.reviewId &&
                executionPackage.sourceSessionNumber === review.sessionNumber,
            "The unified execution package must reference the same orchestrator review."
        ));

        const documents = executionPackage &&
            Array.isArray(executionPackage.documents)
            ? executionPackage.documents
            : [];

        checks.push(buildCheck(
            "Expected unified document set",
            hasExpectedDocuments(documents),
            "The unique six-document permanent set is required."
        ));

        const safeguardsLocked =
            Boolean(executionPackage) &&
            Boolean(review) &&
            executionPackage.authorizationGranted === false &&
            executionPackage.executionAuthorized === false &&
            executionPackage.writeAuthorized === false &&
            executionPackage.rollbackAuthorized === false &&
            executionPackage.restoreAuthorized === false &&
            executionPackage.actualWritesAttempted === false &&
            executionPackage.actualRestoresAttempted === false &&
            executionPackage.permanentWritesExecuted === false &&
            executionPackage.restoreExecuted === false &&
            review.authorizationGranted === false &&
            review.executionAuthorized === false &&
            review.writeAuthorized === false &&
            review.rollbackAuthorized === false &&
            review.restoreAuthorized === false &&
            review.actualWritesAttempted === false &&
            review.actualRestoresAttempted === false &&
            review.permanentWritesExecuted === false &&
            review.restoreExecuted === false;

        checks.push(buildCheck(
            "All safeguards locked",
            safeguardsLocked,
            "All authorization, execution, write, rollback, and restore controls must remain disabled."
        ));

        return {
            accepted: checks.every(function (check) {
                return check.passed;
            }),
            checks: checks,
            executionValidation: executionValidation,
            reviewValidation: reviewValidation
        };
    }

    function rejectedPackage(message, executionPackage, review, validation) {
        const snapshot = window.TMSSessionContext.getSnapshot();
        const generatedAt = new Date().toISOString();

        return deepFreeze({
            packageType: PACKAGE_TYPE,
            engineVersion: ENGINE_VERSION,
            packageMode: PACKAGE_MODE,
            packageId: createPackageId(snapshot.sessionNumber, generatedAt),
            generatedAt: generatedAt,
            sessionNumber: snapshot.sessionNumber,
            accepted: false,
            message: message,
            sourceExecutionPackageAccepted:
                Boolean(executionPackage && executionPackage.accepted),
            sourceExecutionPackageId:
                executionPackage ? executionPackage.packageId : null,
            sourceExecutionPackageStatus:
                executionPackage ? executionPackage.packageStatus : "Unavailable",
            sourceReviewAccepted: Boolean(review && review.accepted),
            sourceReviewId: review ? review.reviewId : null,
            sourceReviewStatus: review ? review.reviewStatus : "Unavailable",
            validationAccepted: Boolean(validation && validation.accepted),
            validationChecks: validation ? validation.checks : [],
            pipelineStageCount: 0,
            completedStageCount: 0,
            stageSummaries: [],
            expectedDocumentCount: EXPECTED_DOCUMENTS.length,
            reviewDocumentCount: 0,
            writeRequiredDocumentCount: 0,
            excludedDocumentCount: 0,
            restoreRequiredDocumentCount: 0,
            noRestoreRequiredDocumentCount: 0,
            documentSummaries: [],
            pipelineReady: false,
            pipelineCompleted: false,
            unifiedExecutionPackageVerified: false,
            humanAuthorizationVerified: false,
            packageReady: false,
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
                "Correct the failed unified execution package, orchestrator review, or governance prerequisite checks.",
            reviewRequired: true
        });
    }

    async function generateReviewPackage(unifiedExecutionPackage) {
        const sourceExecutionPackage =
            unifiedExecutionPackage ||
            window.TMSPermanentOutputExecutionLayer
                .getLastExecutionPackage();

        const sourceReview =
            window.TMSPermanentOutputOrchestrator
                .getLastPipelineReview();

        const validation =
            validateSources(sourceExecutionPackage, sourceReview);

        if (!validation.accepted) {
            lastReviewPackage = rejectedPackage(
                "The unified Permanent Output Execution package failed consolidated governance review validation.",
                sourceExecutionPackage,
                sourceReview,
                validation
            );
            return lastReviewPackage;
        }

        const stageSummaries = clone(sourceReview.stages)
            .sort(function (first, second) {
                return Number(first.sequence) - Number(second.sequence);
            })
            .map(buildStageSummary);

        const documentSummaries =
            clone(sourceExecutionPackage.documents)
                .sort(function (first, second) {
                    return Number(first.sequence) - Number(second.sequence);
                })
                .map(buildDocumentSummary);

        const stagesValid =
            stageSummaries.length === 12 &&
            stageSummaries.every(function (stage, index) {
                return (
                    stage.sequence === index + 1 &&
                    stage.accepted === true &&
                    stage.completed === true
                );
            });

        const documentsValid =
            hasExpectedDocuments(documentSummaries) &&
            documentSummaries.every(function (document, index) {
                return (
                    document.sequence === index + 1 &&
                    document.documentId === EXPECTED_DOCUMENTS[index] &&
                    document.executionMode === PACKAGE_MODE &&
                    document.authorizationGranted === false &&
                    document.executionAuthorized === false &&
                    document.writeAuthorized === false &&
                    document.rollbackAuthorized === false &&
                    document.restoreAuthorized === false &&
                    document.actualWriteAttempted === false &&
                    document.actualRestoreAttempted === false &&
                    document.permanentWriteExecuted === false &&
                    document.restoreExecuted === false
                );
            });

        if (!stagesValid || !documentsValid) {
            lastReviewPackage = rejectedPackage(
                "One or more consolidated stage or document summaries failed Disabled Mode safety validation.",
                sourceExecutionPackage,
                sourceReview,
                validation
            );
            return lastReviewPackage;
        }

        const snapshot = window.TMSSessionContext.getSnapshot();
        const generatedAt = new Date().toISOString();

        lastReviewPackage = deepFreeze({
            packageType: PACKAGE_TYPE,
            engineVersion: ENGINE_VERSION,
            packageMode: PACKAGE_MODE,
            packageId: createPackageId(snapshot.sessionNumber, generatedAt),
            generatedAt: generatedAt,
            sessionNumber: snapshot.sessionNumber,
            sourceSessionNumber: sourceExecutionPackage.sourceSessionNumber,
            accepted: true,
            message:
                "The unified six-document execution package and twelve-stage pipeline evidence were consolidated into one Disabled Mode governance review package. No permanent file operations occurred.",
            sourceExecutionPackageAccepted: true,
            sourceExecutionPackageId: sourceExecutionPackage.packageId,
            sourceExecutionPackageStatus: sourceExecutionPackage.packageStatus,
            sourceExecutionPackageEngineVersion:
                sourceExecutionPackage.engineVersion,
            sourceExecutionPackageGeneratedAt:
                sourceExecutionPackage.generatedAt,
            sourceReviewAccepted: true,
            sourceReviewId: sourceReview.reviewId,
            sourceReviewStatus: sourceReview.reviewStatus,
            sourceReviewEngineVersion: sourceReview.engineVersion,
            sourceReviewGeneratedAt: sourceReview.generatedAt,
            validationAccepted: true,
            validationChecks: validation.checks,
            pipelineStageCount: stageSummaries.length,
            completedStageCount: stageSummaries.length,
            stageSummaries: stageSummaries,
            executionSequence: clone(sourceReview.executionSequence || []),
            expectedDocumentCount: EXPECTED_DOCUMENTS.length,
            reviewDocumentCount: documentSummaries.length,
            writeRequiredDocumentCount:
                sourceExecutionPackage.writeRequiredDocumentCount,
            excludedDocumentCount:
                sourceExecutionPackage.excludedDocumentCount,
            restoreRequiredDocumentCount:
                sourceExecutionPackage.restoreRequiredDocumentCount,
            noRestoreRequiredDocumentCount:
                sourceExecutionPackage.noRestoreRequiredDocumentCount,
            documentSummaries: documentSummaries,
            pipelineReady: true,
            pipelineCompleted: true,
            unifiedExecutionPackageVerified: true,
            humanAuthorizationVerified:
                sourceExecutionPackage.humanAuthorizationVerified === true,
            packageReady: true,
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
                "Ready for Human Review — Unified Execution Disabled",
            requiredNextAction:
                "Submit this consolidated governance package to the Final Human Approval Gateway. Version 2.0.0 remains non-executing.",
            reviewRequired: true,
            reviewChoices: [
                "Approve Consolidated Review Package",
                "Revise Session",
                "Cancel Review Package"
            ]
        });

        return lastReviewPackage;
    }

    function validateReviewPackage(reviewPackage) {
        const current = reviewPackage || lastReviewPackage;
        const checks = [];

        checks.push(buildCheck(
            "Review package exists",
            isPlainObject(current),
            "A consolidated review package is required."
        ));

        checks.push(buildCheck(
            "Review package accepted",
            Boolean(current && current.accepted),
            "The consolidated review package must be accepted."
        ));

        checks.push(buildCheck(
            "Package mode disabled",
            Boolean(current) && current.packageMode === PACKAGE_MODE,
            "Version 2.0.0 must remain in Disabled mode."
        ));

        checks.push(buildCheck(
            "Twelve stages present",
            Boolean(current) &&
                current.pipelineStageCount === 12 &&
                current.completedStageCount === 12,
            "All twelve pipeline stages must be represented and complete."
        ));

        checks.push(buildCheck(
            "Six governed documents present",
            Boolean(current) &&
                current.expectedDocumentCount === 6 &&
                current.reviewDocumentCount === 6,
            "All six governed permanent documents must be represented."
        ));

        checks.push(buildCheck(
            "Decision counts valid",
            Boolean(current) &&
                current.writeRequiredDocumentCount === 5 &&
                current.excludedDocumentCount === 1 &&
                current.restoreRequiredDocumentCount === 5 &&
                current.noRestoreRequiredDocumentCount === 1,
            "Five required and one excluded document must be preserved for both write and restore paths."
        ));

        checks.push(buildCheck(
            "Pipeline and unified package verified",
            Boolean(current) &&
                current.pipelineReady === true &&
                current.pipelineCompleted === true &&
                current.unifiedExecutionPackageVerified === true &&
                current.humanAuthorizationVerified === true &&
                current.packageReady === true,
            "The complete governance package must be verified and ready."
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
                Boolean(current) && current[item[1]] === false,
                item[0] + "."
            ));
        });

        const stages = current && Array.isArray(current.stageSummaries)
            ? current.stageSummaries
            : [];

        checks.push(buildCheck(
            "Stage summaries valid",
            stages.length === 12 &&
                stages.every(function (stage, index) {
                    return (
                        stage.sequence === index + 1 &&
                        stage.accepted === true &&
                        stage.completed === true &&
                        typeof stage.stageName === "string" &&
                        stage.stageName.length > 0
                    );
                }),
            "Every stage summary must be accepted, complete, ordered, and named."
        ));

        const documents =
            current && Array.isArray(current.documentSummaries)
                ? current.documentSummaries
                : [];

        checks.push(buildCheck(
            "Document summaries valid",
            hasExpectedDocuments(documents) &&
                documents.every(function (document, index) {
                    return (
                        document.sequence === index + 1 &&
                        document.documentId === EXPECTED_DOCUMENTS[index] &&
                        document.executionMode === PACKAGE_MODE &&
                        document.authorizationGranted === false &&
                        document.executionAuthorized === false &&
                        document.writeAuthorized === false &&
                        document.rollbackAuthorized === false &&
                        document.restoreAuthorized === false &&
                        document.actualWriteAttempted === false &&
                        document.actualRestoreAttempted === false &&
                        document.permanentWriteExecuted === false &&
                        document.restoreExecuted === false
                    );
                }),
            "Every document summary must be complete, ordered, disabled, and non-destructive."
        ));

        return deepFreeze({
            validatorVersion: ENGINE_VERSION,
            accepted: checks.every(function (check) {
                return check.passed;
            }),
            checks: checks
        });
    }

    async function formatReviewPackage(reviewPackage) {
        const current =
            reviewPackage || await generateReviewPackage();

        const lines = [
            "TMS-OS CONTROLLED PERMANENT OUTPUT CONSOLIDATED REVIEW PACKAGE",
            "Package ID: " + current.packageId,
            "Accepted: " + (current.accepted ? "YES" : "NO"),
            "Work Session: " + current.sessionNumber,
            "Source Work Session: " +
                (current.sourceSessionNumber || "Unavailable"),
            "Engine Version: " + current.engineVersion,
            "Package Mode: " + current.packageMode,
            "Package Status: " + current.packageStatus,
            "Pipeline Stages: " + current.pipelineStageCount,
            "Completed Stages: " + current.completedStageCount,
            "Governed Documents: " + current.reviewDocumentCount,
            "Write Required Documents: " +
                current.writeRequiredDocumentCount,
            "No Write Required Documents: " +
                current.excludedDocumentCount,
            "Restore Required Documents: " +
                current.restoreRequiredDocumentCount,
            "No Restore Required Documents: " +
                current.noRestoreRequiredDocumentCount,
            "Unified Execution Package Verified: " +
                (current.unifiedExecutionPackageVerified ? "YES" : "NO"),
            "Human Authorization Verified: " +
                (current.humanAuthorizationVerified ? "YES" : "NO"),
            "Package Ready: " + (current.packageReady ? "YES" : "NO"),
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

        (current.stageSummaries || []).forEach(function (stage) {
            lines.push(
                stage.sequence +
                " | " +
                stage.stageName +
                " | " +
                stage.status +
                " | " +
                (stage.accepted ? "PASSED" : "STOPPED")
            );
        });

        (current.documentSummaries || []).forEach(function (document) {
            lines.push(
                document.sequence +
                " | " +
                document.documentId +
                " | " +
                document.packageDecision
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

    function getLastReviewPackage() {
        return lastReviewPackage;
    }

    window.TMSPipelineReviewPackageGenerator = Object.freeze({
        engineVersion: ENGINE_VERSION,
        packageMode: PACKAGE_MODE,
        generateReviewPackage: generateReviewPackage,
        validateReviewPackage: validateReviewPackage,
        formatReviewPackage: formatReviewPackage,
        getLastReviewPackage: getLastReviewPackage
    });

    console.log(
        "Pipeline Review Package Generator v" +
        ENGINE_VERSION +
        " initialized in " +
        PACKAGE_MODE +
        " Mode for Work Session " +
        window.TMSSessionContext.getSnapshot().sessionNumber +
        "."
    );
}());
