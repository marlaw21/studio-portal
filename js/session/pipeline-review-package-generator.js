/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 058 — Pipeline Review Package Generator v1.0.0
Disabled Foundation
File: js/session/pipeline-review-package-generator.js

Purpose:
Consume the Permanent Output Orchestrator review and generate one consolidated,
immutable, review-only package for the complete controlled permanent-output
pipeline.

This version remains fully disabled and non-destructive. It does not write,
replace, rename, move, delete, restore, download, authorize, or otherwise
modify any permanent file.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const PACKAGE_MODE = "Disabled";
    const PACKAGE_TYPE =
        "TMS-OS Controlled Permanent Output Consolidated Review Package";

    let lastReviewPackage = null;

    if (
        !window.TMSSessionContext ||
        !window.TMSPermanentOutputOrchestrator
    ) {
        console.error(
            "Pipeline Review Package Generator could not initialize because its dependencies are unavailable."
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
        const timestamp = generatedAt
            .replace(/[-:.TZ]/g, "")
            .slice(0, 14);

        return [
            "TMS",
            "PIPELINE-REVIEW-PACKAGE",
            String(sessionNumber).padStart(3, "0"),
            timestamp
        ].join("-");
    }

    function validatePipelineReview(review) {
        const checks = [];

        let orchestratorValidation = {
            accepted: false,
            checks: []
        };

        if (isPlainObject(review)) {
            orchestratorValidation =
                window.TMSPermanentOutputOrchestrator
                    .validatePipelineReview(review);
        }

        checks.push(buildCheck(
            "Pipeline review exists",
            isPlainObject(review),
            "A Permanent Output Orchestrator review is required."
        ));

        checks.push(buildCheck(
            "Pipeline review accepted",
            Boolean(review && review.accepted),
            "The orchestrator review must be accepted."
        ));

        checks.push(buildCheck(
            "Pipeline review validation accepted",
            Boolean(orchestratorValidation && orchestratorValidation.accepted),
            "The orchestrator review must pass validation."
        ));

        checks.push(buildCheck(
            "Orchestration mode disabled",
            Boolean(review) && review.orchestrationMode === "Disabled",
            "The orchestrator must remain in Disabled mode."
        ));

        checks.push(buildCheck(
            "Pipeline ready",
            Boolean(review) && review.pipelineReady === true,
            "The complete pipeline must be ready."
        ));

        checks.push(buildCheck(
            "Pipeline completed",
            Boolean(review) && review.pipelineCompleted === true,
            "The complete pipeline must be completed."
        ));

        checks.push(buildCheck(
            "All stages completed",
            Boolean(review) &&
                Number(review.completedStageCount) === Number(review.stageCount) &&
                Number(review.stageCount) > 0,
            "Every orchestrated pipeline stage must complete."
        ));

        checks.push(buildCheck(
            "Authorization remains ungranted",
            Boolean(review) && review.authorizationGranted === false,
            "The consolidated package must not grant authorization."
        ));

        checks.push(buildCheck(
            "Execution remains unauthorized",
            Boolean(review) && review.executionAuthorized === false,
            "Execution authorization must remain locked."
        ));

        checks.push(buildCheck(
            "Write remains unauthorized",
            Boolean(review) && review.writeAuthorized === false,
            "Permanent write authorization must remain locked."
        ));

        checks.push(buildCheck(
            "Rollback remains unauthorized",
            Boolean(review) && review.rollbackAuthorized === false,
            "Rollback authorization must remain locked."
        ));

        checks.push(buildCheck(
            "Restore remains unauthorized",
            Boolean(review) && review.restoreAuthorized === false,
            "Restore authorization must remain locked."
        ));

        checks.push(buildCheck(
            "No actual writes attempted",
            Boolean(review) && review.actualWritesAttempted === false,
            "No actual write may be attempted."
        ));

        checks.push(buildCheck(
            "No actual restores attempted",
            Boolean(review) && review.actualRestoresAttempted === false,
            "No actual restore may be attempted."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(review) && review.permanentWritesExecuted === false,
            "No permanent file may be modified."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(review) && review.restoreExecuted === false,
            "No rollback restoration may occur."
        ));

        const stages = review && Array.isArray(review.stages)
            ? review.stages
            : [];

        const stagesValid =
            stages.length > 0 &&
            stages.length === Number(review.stageCount) &&
            stages.every(function (stage, index) {
                return (
                    stage.sequence === index + 1 &&
                    stage.accepted === true &&
                    stage.completed === true &&
                    typeof stage.stageName === "string" &&
                    stage.stageName.length > 0
                );
            });

        checks.push(buildCheck(
            "Pipeline stages valid",
            stagesValid,
            "Every pipeline stage must be accepted, complete, ordered, and named."
        ));

        return {
            accepted: checks.every(function (check) {
                return check.passed;
            }),
            checks: checks,
            orchestratorValidation: orchestratorValidation
        };
    }

    function buildStageSummary(stage) {
        return {
            sequence: stage.sequence,
            stageName: stage.stageName,
            accepted: stage.accepted,
            completed: stage.completed,
            status: stage.status,
            sourceId: stage.sourceId || null,
            safetyState: clone(stage.safetyState || {})
        };
    }

    function rejectedPackage(message, review, validation) {
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
            sourceReviewAccepted: Boolean(review && review.accepted),
            sourceReviewId: review ? review.reviewId : null,
            sourceReviewStatus: review ? review.reviewStatus : "Unavailable",
            validationAccepted: Boolean(validation && validation.accepted),
            validationChecks: validation ? validation.checks : [],
            pipelineStageCount: 0,
            completedStageCount: 0,
            stageSummaries: [],
            pipelineReady: false,
            pipelineCompleted: false,
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
                "Correct the failed orchestrator review or package prerequisite checks.",
            reviewRequired: true
        });
    }

    async function generateReviewPackage(orchestratorReview) {
        const sourceReview =
            orchestratorReview ||
            await window.TMSPermanentOutputOrchestrator
                .generatePipelineReview();

        const validation = validatePipelineReview(sourceReview);

        if (!validation.accepted) {
            lastReviewPackage = rejectedPackage(
                "The Permanent Output Orchestrator review failed consolidated package validation.",
                sourceReview,
                validation
            );

            return lastReviewPackage;
        }

        const stageSummaries =
            clone(sourceReview.stages)
                .sort(function (first, second) {
                    return Number(first.sequence) - Number(second.sequence);
                })
                .map(buildStageSummary);

        const allStagesSafe =
            stageSummaries.every(function (stage, index) {
                return (
                    stage.sequence === index + 1 &&
                    stage.accepted === true &&
                    stage.completed === true
                );
            });

        if (!allStagesSafe) {
            lastReviewPackage = rejectedPackage(
                "One or more consolidated pipeline stage summaries failed validation.",
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
            accepted: true,
            message:
                "The complete controlled permanent-output pipeline was consolidated into one review package in Disabled mode. No permanent file operations occurred.",
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
            pipelineReady: true,
            pipelineCompleted: true,
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
            packageStatus: "Ready for Human Review — Disabled",
            requiredNextAction:
                "Submit this consolidated review package for human approval before any future write-enabled or restore-enabled design is considered.",
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
            "A consolidated pipeline review package is required."
        ));

        checks.push(buildCheck(
            "Review package accepted",
            Boolean(current && current.accepted),
            "The consolidated review package must be accepted."
        ));

        checks.push(buildCheck(
            "Package mode disabled",
            Boolean(current) && current.packageMode === PACKAGE_MODE,
            "Version 1.0.0 must remain in Disabled mode."
        ));

        checks.push(buildCheck(
            "Pipeline stages present",
            Boolean(current) && current.pipelineStageCount > 0,
            "The package must contain pipeline stage summaries."
        ));

        checks.push(buildCheck(
            "All stages completed",
            Boolean(current) &&
                current.completedStageCount === current.pipelineStageCount,
            "Every pipeline stage must be complete."
        ));

        checks.push(buildCheck(
            "Pipeline ready",
            Boolean(current) && current.pipelineReady === true,
            "The complete pipeline must be ready."
        ));

        checks.push(buildCheck(
            "Pipeline completed",
            Boolean(current) && current.pipelineCompleted === true,
            "The complete pipeline must be completed."
        ));

        checks.push(buildCheck(
            "Package ready",
            Boolean(current) && current.packageReady === true,
            "The consolidated package must be ready for review."
        ));

        checks.push(buildCheck(
            "Authorization remains ungranted",
            Boolean(current) && current.authorizationGranted === false,
            "The package must not grant authorization."
        ));

        checks.push(buildCheck(
            "Execution remains unauthorized",
            Boolean(current) && current.executionAuthorized === false,
            "Execution authorization must remain locked."
        ));

        checks.push(buildCheck(
            "Write remains unauthorized",
            Boolean(current) && current.writeAuthorized === false,
            "Permanent write authorization must remain locked."
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
            "No actual writes attempted",
            Boolean(current) && current.actualWritesAttempted === false,
            "No actual write may be attempted."
        ));

        checks.push(buildCheck(
            "No actual restores attempted",
            Boolean(current) && current.actualRestoresAttempted === false,
            "No actual restore may be attempted."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(current) && current.permanentWritesExecuted === false,
            "No permanent file may be modified."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(current) && current.restoreExecuted === false,
            "No rollback restoration may occur."
        ));

        const stages = current && Array.isArray(current.stageSummaries)
            ? current.stageSummaries
            : [];

        const stagesValid =
            stages.length === Number(current.pipelineStageCount) &&
            stages.every(function (stage, index) {
                return (
                    stage.sequence === index + 1 &&
                    stage.accepted === true &&
                    stage.completed === true &&
                    typeof stage.stageName === "string" &&
                    stage.stageName.length > 0
                );
            });

        checks.push(buildCheck(
            "Stage summaries valid",
            stagesValid,
            "Every consolidated stage summary must be accepted, complete, ordered, and named."
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
        const current = reviewPackage || await generateReviewPackage();

        const lines = [
            "TMS-OS CONTROLLED PERMANENT OUTPUT CONSOLIDATED REVIEW PACKAGE",
            "Package ID: " + current.packageId,
            "Accepted: " + (current.accepted ? "YES" : "NO"),
            "Work Session: " + current.sessionNumber,
            "Engine Version: " + current.engineVersion,
            "Package Mode: " + current.packageMode,
            "Package Status: " + current.packageStatus,
            "Pipeline Stages: " + current.pipelineStageCount,
            "Completed Stages: " + current.completedStageCount,
            "Pipeline Ready: " + (current.pipelineReady ? "YES" : "NO"),
            "Pipeline Completed: " + (current.pipelineCompleted ? "YES" : "NO"),
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

        if (current.requiredNextAction) {
            lines.push(
                "Required Next Action: " + current.requiredNextAction
            );
        }

        if (current.reviewChoices) {
            lines.push(
                "Review Choices: " + current.reviewChoices.join(" | ")
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
