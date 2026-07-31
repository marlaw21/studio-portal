"use strict";

/*
=========================================================
 TMS-OS Validation Pipeline Runner
 Version: 1.0.0
 Status: Active
 Mode: Disabled
=========================================================
*/

(function () {
    const RUNNER_VERSION = "1.0.0";
    const RUNNER_NAME = "Validation Pipeline Runner";
    const RUNNER_MODE = "Disabled";

    let running = false;
    let lastValidation = null;

    function deepFreeze(value) {
        if (
            value === null ||
            typeof value !== "object" ||
            Object.isFrozen(value)
        ) {
            return value;
        }

        Object.getOwnPropertyNames(value).forEach(
            function (propertyName) {
                deepFreeze(value[propertyName]);
            }
        );

        return Object.freeze(value);
    }

    function createRunId(generatedAt) {
        const timestamp = generatedAt
            .replace(/[-:.TZ]/g, "")
            .slice(0, 14);

        return "TMS-VALIDATION-RUN-" + timestamp;
    }

    function getOrchestrator() {
        return window.TMSPermanentOutputOrchestrator;
    }

    function validateDependencies() {
        const failures = [];
        const orchestrator = getOrchestrator();

        if (!window.TMSValidationHarness) {
            failures.push(
                "TMSValidationHarness is not loaded."
            );
        }

        if (!orchestrator) {
            failures.push(
                "TMSPermanentOutputOrchestrator is not loaded."
            );
        } else if (
            typeof orchestrator.generatePipelineReview !==
            "function"
        ) {
            failures.push(
                "TMSPermanentOutputOrchestrator.generatePipelineReview is unavailable."
            );
        }

        return deepFreeze({
            accepted: failures.length === 0,
            failureCount: failures.length,
            failures: failures
        });
    }

    function buildRejectedResult(message, error) {
        const generatedAt = new Date().toISOString();

        return deepFreeze({
            validationType:
                "TMS-OS Controlled Permanent Output Validation Run",

            runnerName: RUNNER_NAME,
            runnerVersion: RUNNER_VERSION,
            runnerMode: RUNNER_MODE,

            validationRunId:
                createRunId(generatedAt),

            generatedAt: generatedAt,

            accepted: false,
            completed: false,

            validationStatus:
                "Validation Run Rejected",

            message: message,

            errorName:
                error && error.name
                    ? error.name
                    : null,

            errorMessage:
                error && error.message
                    ? error.message
                    : null,

            durationMilliseconds: 0,

            stageCount: 0,
            completedStageCount: 0,
            failedStage: null,

            pipelineReady: false,
            pipelineCompleted: false,

            permanentWritesExecuted: false,
            restoreExecuted: false,

            pipelineReview: null
        });
    }

    async function runValidation() {
        if (running) {
            lastValidation = buildRejectedResult(
                "A validation run is already in progress.",
                null
            );

            return lastValidation;
        }

        const dependencyValidation =
            validateDependencies();

        if (!dependencyValidation.accepted) {
            lastValidation = buildRejectedResult(
                dependencyValidation.failures.join(" "),
                null
            );

            return lastValidation;
        }

        running = true;

        const startedAt = new Date();
        const orchestrator = getOrchestrator();

        try {
            const pipelineReview =
                await orchestrator.generatePipelineReview();

            const completedAt = new Date();

            const durationMilliseconds =
                completedAt.getTime() -
                startedAt.getTime();

            const accepted =
                pipelineReview &&
                pipelineReview.accepted === true;

            lastValidation = deepFreeze({
                validationType:
                    "TMS-OS Controlled Permanent Output Validation Run",

                runnerName: RUNNER_NAME,
                runnerVersion: RUNNER_VERSION,
                runnerMode: RUNNER_MODE,

                validationRunId:
                    createRunId(
                        completedAt.toISOString()
                    ),

                startedAt:
                    startedAt.toISOString(),

                generatedAt:
                    completedAt.toISOString(),

                sessionNumber:
                    pipelineReview &&
                    pipelineReview.sessionNumber
                        ? pipelineReview.sessionNumber
                        : null,

                accepted: accepted,
                completed: true,

                validationStatus: accepted
                    ? "Validation Run Completed"
                    : "Validation Run Completed With Rejection",

                message:
                    pipelineReview &&
                    pipelineReview.message
                        ? pipelineReview.message
                        : "The orchestrator returned no validation message.",

                durationMilliseconds:
                    durationMilliseconds,

                stageCount:
                    pipelineReview &&
                    Number.isInteger(
                        pipelineReview.stageCount
                    )
                        ? pipelineReview.stageCount
                        : 0,

                completedStageCount:
                    pipelineReview &&
                    Number.isInteger(
                        pipelineReview.completedStageCount
                    )
                        ? pipelineReview.completedStageCount
                        : 0,

                failedStage:
                    pipelineReview
                        ? pipelineReview.failedStage
                        : null,

                pipelineReady:
                    pipelineReview &&
                    pipelineReview.pipelineReady === true,

                pipelineCompleted:
                    pipelineReview &&
                    pipelineReview.pipelineCompleted === true,

                permanentWritesExecuted:
                    pipelineReview &&
                    pipelineReview
                        .permanentWritesExecuted === true,

                restoreExecuted:
                    pipelineReview &&
                    pipelineReview.restoreExecuted === true,

                pipelineReview:
                    pipelineReview || null
            });

            return lastValidation;
        } catch (error) {
            lastValidation = buildRejectedResult(
                "The validation runner encountered an unexpected error.",
                error
            );

            return lastValidation;
        } finally {
            running = false;
        }
    }

    function getLastValidation() {
        return lastValidation;
    }

    function getInformation() {
        return deepFreeze({
            runnerName: RUNNER_NAME,
            runnerVersion: RUNNER_VERSION,
            runnerMode: RUNNER_MODE,

            initialized: true,
            running: running,

            orchestratorAvailable:
                Boolean(getOrchestrator()),

            dependencies:
                validateDependencies(),

            lastValidation:
                lastValidation
        });
    }

    window.TMSValidationPipelineRunner =
        Object.freeze({
            engineVersion: RUNNER_VERSION,

            runValidation,
            getLastValidation,
            getInformation,
            validateDependencies
        });
})();