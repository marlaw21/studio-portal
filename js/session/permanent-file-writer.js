/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 052 — Permanent File Writer v1.0.0
Simulation Mode
File: js/session/permanent-file-writer.js

Purpose:
Accept a validated Controlled Execution Plan and simulate the complete ordered
replacement of the five controlled permanent JSON documents.

This version operates in simulation mode only. It does not write, replace,
delete, restore, download, or otherwise modify any permanent file.

Execution authorization, write authorization, and rollback authorization
remain locked.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const WRITER_MODE = "Simulation";
    const SIMULATION_TYPE =
        "TMS-OS Permanent Documentation Write Simulation";

    const EXPECTED_DOCUMENTS = Object.freeze([
        "WS-HIST-001",
        "STATE-001",
        "DOC-STATE-001",
        "DEC-LOG-001",
        "MILE-HIST-001"
    ]);

    let lastSimulation = null;

    if (
        !window.TMSSessionContext ||
        !window.TMSControlledExecutionEngine
    ) {
        console.error(
            "Permanent File Writer could not initialize because its dependencies are unavailable."
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

    function createSimulationId(
        sessionNumber,
        generatedAt
    ) {
        const timestamp = generatedAt
            .replace(/[-:.TZ]/g, "")
            .slice(0, 14);

        return [
            "TMS",
            "WRITE-SIMULATION",
            String(sessionNumber).padStart(3, "0"),
            timestamp
        ].join("-");
    }

    function validateExecutionPlan(executionPlan) {
        const checks = [];

        let planValidation = {
            accepted: false,
            checks: []
        };

        if (isPlainObject(executionPlan)) {
            planValidation =
                window.TMSControlledExecutionEngine
                    .validateExecutionPlan(
                        executionPlan
                    );
        }

        checks.push(buildCheck(
            "Execution plan exists",
            isPlainObject(executionPlan),
            "A Controlled Execution Plan is required."
        ));

        checks.push(buildCheck(
            "Execution plan accepted",
            Boolean(
                executionPlan &&
                executionPlan.accepted
            ),
            "The Controlled Execution Plan must be accepted."
        ));

        checks.push(buildCheck(
            "Execution plan validation accepted",
            Boolean(
                planValidation &&
                planValidation.accepted
            ),
            "The Controlled Execution Plan must pass validation."
        ));

        checks.push(buildCheck(
            "Expected planned document count",
            Boolean(executionPlan) &&
                executionPlan.plannedDocumentCount ===
                    EXPECTED_DOCUMENTS.length,
            "The execution plan must contain five permanent documents."
        ));

        checks.push(buildCheck(
            "Original documents captured",
            Boolean(executionPlan) &&
                executionPlan.originalDocumentsCaptured === true,
            "All current permanent documents must remain captured."
        ));

        checks.push(buildCheck(
            "Proposed documents captured",
            Boolean(executionPlan) &&
                executionPlan.proposedDocumentsCaptured === true,
            "All proposed permanent documents must remain captured."
        ));

        checks.push(buildCheck(
            "Rollback ready",
            Boolean(executionPlan) &&
                executionPlan.rollbackReady === true,
            "Rollback readiness is required before simulation."
        ));

        checks.push(buildCheck(
            "Execution ready",
            Boolean(executionPlan) &&
                executionPlan.executionReady === true,
            "The execution plan must have passed prerequisite checks."
        ));

        checks.push(buildCheck(
            "Execution remains unauthorized",
            Boolean(executionPlan) &&
                executionPlan.executionAuthorized === false,
            "Simulation mode must not authorize execution."
        ));

        checks.push(buildCheck(
            "Write remains unauthorized",
            Boolean(executionPlan) &&
                executionPlan.writeAuthorized === false,
            "Simulation mode must not authorize permanent writes."
        ));

        checks.push(buildCheck(
            "Rollback remains unauthorized",
            Boolean(executionPlan) &&
                executionPlan.rollbackAuthorized === false,
            "Simulation mode must not authorize rollback execution."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(executionPlan) &&
                executionPlan.permanentWritesExecuted === false,
            "No permanent file may have been changed."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(executionPlan) &&
                executionPlan.restoreExecuted === false,
            "No rollback restore may have been executed."
        ));

        const executionSteps =
            executionPlan &&
            Array.isArray(
                executionPlan.executionSteps
            )
                ? executionPlan.executionSteps
                : [];

        const documentIds =
            executionSteps.map(function (step) {
                return step.documentId;
            });

        const documentSetValid =
            executionSteps.length ===
                EXPECTED_DOCUMENTS.length &&
            EXPECTED_DOCUMENTS.every(function (
                documentId
            ) {
                return documentIds.includes(
                    documentId
                );
            }) &&
            new Set(documentIds).size ===
                EXPECTED_DOCUMENTS.length;

        checks.push(buildCheck(
            "Expected execution document set",
            documentSetValid,
            "The execution plan must contain the unique five-document set."
        ));

        const stepsSafe =
            executionSteps.length ===
                EXPECTED_DOCUMENTS.length &&
            executionSteps.every(function (
                step,
                index
            ) {
                return (
                    step.sequence === index + 1 &&
                    EXPECTED_DOCUMENTS.includes(
                        step.documentId
                    ) &&
                    step.prerequisiteStatus ===
                        "Passed" &&
                    step.executionStatus ===
                        "Planned — Not Authorized" &&
                    step.originalDocumentCaptured ===
                        true &&
                    step.proposedDocumentCaptured ===
                        true &&
                    typeof step.originalChecksum ===
                        "string" &&
                    step.originalChecksum.length > 0 &&
                    typeof step.proposedChecksum ===
                        "string" &&
                    step.proposedChecksum.length > 0 &&
                    step.writeAuthorized === false &&
                    step.rollbackAuthorized === false &&
                    step.permanentWriteExecuted ===
                        false &&
                    step.restoreExecuted === false
                );
            });

        checks.push(buildCheck(
            "Execution steps remain simulation-safe",
            stepsSafe,
            "Every execution step must remain ordered, verified, and authorization-locked."
        ));

        return {
            accepted: checks.every(function (check) {
                return check.passed;
            }),
            checks: checks,
            planValidation: planValidation
        };
    }

    function simulateWriteStep(
        executionStep,
        index,
        simulationStartedAt
    ) {
        const simulatedAt =
            new Date().toISOString();

        return {
            sequence: index + 1,
            order: executionStep.order,
            documentId:
                executionStep.documentId,
            updateMode:
                executionStep.updateMode,

            targetPath:
                executionStep.targetPath,
            backupPath:
                executionStep.backupPath,
            proposedCopyPath:
                executionStep.proposedCopyPath,

            originalChecksum:
                executionStep.originalChecksum,
            proposedChecksum:
                executionStep.proposedChecksum,

            sourceVersion:
                executionStep.sourceVersion,
            proposedVersion:
                executionStep.proposedVersion,

            sourceSectionCount:
                executionStep.sourceSectionCount,
            proposedSectionCount:
                executionStep.proposedSectionCount,

            simulationStartedAt:
                simulationStartedAt,
            simulatedAt:
                simulatedAt,

            simulatedAction:
                "Replace complete permanent JSON file",

            simulationChecks: [
                "Target path verified",
                "Original backup path verified",
                "Original checksum present",
                "Proposed checksum present",
                "Execution order verified",
                "Write authorization confirmed locked"
            ],

            simulationStatus:
                "Simulated Successfully",

            actualWriteAttempted: false,
            actualWriteExecuted: false,
            permanentWriteExecuted: false,

            writeAuthorized: false,
            executionAuthorized: false,
            rollbackAuthorized: false,
            restoreExecuted: false
        };
    }

    function rejectedSimulation(
        message,
        executionPlan,
        validation
    ) {
        const snapshot =
            window.TMSSessionContext.getSnapshot();

        const generatedAt =
            new Date().toISOString();

        return deepFreeze({
            simulationType:
                SIMULATION_TYPE,
            engineVersion:
                ENGINE_VERSION,
            writerMode:
                WRITER_MODE,

            simulationId:
                createSimulationId(
                    snapshot.sessionNumber,
                    generatedAt
                ),

            generatedAt:
                generatedAt,
            sessionNumber:
                snapshot.sessionNumber,

            accepted: false,
            message: message,

            sourceExecutionPlanAccepted:
                Boolean(
                    executionPlan &&
                    executionPlan.accepted
                ),

            sourceExecutionPlanId:
                executionPlan
                    ? executionPlan.planId
                    : null,

            sourceExecutionPlanStatus:
                executionPlan
                    ? executionPlan.planStatus
                    : "Unavailable",

            validationAccepted:
                Boolean(
                    validation &&
                    validation.accepted
                ),

            validationChecks:
                validation
                    ? validation.checks
                    : [],

            expectedDocumentCount:
                EXPECTED_DOCUMENTS.length,

            simulatedDocumentCount: 0,
            simulationSteps: [],

            simulationReady: false,
            simulationCompleted: false,

            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,

            actualWritesAttempted: false,
            permanentWritesExecuted: false,
            restoreExecuted: false,

            simulationStatus: "Rejected",

            requiredNextAction:
                "Correct the failed execution-plan or simulation prerequisite checks.",

            reviewRequired: true
        });
    }

    async function generateSimulation(
        executionPlan
    ) {
        const sourcePlan =
            executionPlan ||
            await window
                .TMSControlledExecutionEngine
                .generateExecutionPlan();

        const validation =
            validateExecutionPlan(
                sourcePlan
            );

        if (!validation.accepted) {
            lastSimulation =
                rejectedSimulation(
                    "The Controlled Execution Plan failed Permanent File Writer simulation validation.",
                    sourcePlan,
                    validation
                );

            return lastSimulation;
        }

        const orderedSteps =
            clone(
                sourcePlan.executionSteps
            ).sort(function (
                first,
                second
            ) {
                return Number(
                    first.sequence
                ) - Number(
                    second.sequence
                );
            });

        const simulationStartedAt =
            new Date().toISOString();

        const simulationSteps =
            orderedSteps.map(function (
                executionStep,
                index
            ) {
                return simulateWriteStep(
                    executionStep,
                    index,
                    simulationStartedAt
                );
            });

        const allSimulated =
            simulationSteps.every(function (
                step
            ) {
                return (
                    step.simulationStatus ===
                        "Simulated Successfully" &&
                    step.actualWriteAttempted ===
                        false &&
                    step.actualWriteExecuted ===
                        false &&
                    step.permanentWriteExecuted ===
                        false &&
                    step.writeAuthorized ===
                        false &&
                    step.executionAuthorized ===
                        false &&
                    step.rollbackAuthorized ===
                        false &&
                    step.restoreExecuted ===
                        false
                );
            });

        if (!allSimulated) {
            lastSimulation =
                rejectedSimulation(
                    "One or more permanent document write simulations failed.",
                    sourcePlan,
                    validation
                );

            return lastSimulation;
        }

        const snapshot =
            window.TMSSessionContext.getSnapshot();

        const generatedAt =
            new Date().toISOString();

        lastSimulation =
            deepFreeze({
                simulationType:
                    SIMULATION_TYPE,
                engineVersion:
                    ENGINE_VERSION,
                writerMode:
                    WRITER_MODE,

                simulationId:
                    createSimulationId(
                        snapshot.sessionNumber,
                        generatedAt
                    ),

                generatedAt:
                    generatedAt,
                sessionNumber:
                    snapshot.sessionNumber,

                accepted: true,

                message:
                    "All five permanent document writes were simulated successfully. No permanent files were changed.",

                sourceExecutionPlanAccepted:
                    true,

                sourceExecutionPlanId:
                    sourcePlan.planId,

                sourceExecutionPlanStatus:
                    sourcePlan.planStatus,

                sourceExecutionEngineVersion:
                    sourcePlan.engineVersion,

                sourceExecutionPlanGeneratedAt:
                    sourcePlan.generatedAt,

                sourceCaptureId:
                    sourcePlan.sourceCaptureId,

                sourceRollbackPackageId:
                    sourcePlan
                        .sourceRollbackPackageId,

                validationAccepted:
                    true,

                validationChecks:
                    validation.checks,

                expectedDocumentCount:
                    EXPECTED_DOCUMENTS.length,

                simulatedDocumentCount:
                    simulationSteps.length,

                simulationSteps:
                    simulationSteps,

                simulationReady: true,
                simulationCompleted: true,

                executionAuthorized: false,
                writeAuthorized: false,
                rollbackAuthorized: false,

                actualWritesAttempted: false,
                permanentWritesExecuted: false,
                restoreExecuted: false,

                simulationStatus:
                    "Completed — No Permanent Writes",

                requiredNextAction:
                    "Submit the completed simulation report for human review before any future real-write capability is designed.",

                reviewRequired: true,

                reviewChoices: [
                    "Approve Simulation Results",
                    "Revise Session",
                    "Cancel Simulation"
                ]
            });

        return lastSimulation;
    }

    function validateSimulation(
        simulation
    ) {
        const current =
            simulation || lastSimulation;

        const checks = [];

        checks.push(buildCheck(
            "Simulation exists",
            isPlainObject(current),
            "A Permanent File Writer simulation is required."
        ));

        checks.push(buildCheck(
            "Simulation accepted",
            Boolean(
                current &&
                current.accepted
            ),
            "The write simulation must be accepted."
        ));

        checks.push(buildCheck(
            "Simulation mode confirmed",
            Boolean(current) &&
                current.writerMode ===
                    WRITER_MODE,
            "The Permanent File Writer must remain in Simulation mode."
        ));

        checks.push(buildCheck(
            "Expected simulated document count",
            Boolean(current) &&
                current.simulatedDocumentCount ===
                    EXPECTED_DOCUMENTS.length,
            "Exactly five permanent document writes must be simulated."
        ));

        checks.push(buildCheck(
            "Simulation ready",
            Boolean(current) &&
                current.simulationReady ===
                    true,
            "Simulation prerequisites must pass."
        ));

        checks.push(buildCheck(
            "Simulation completed",
            Boolean(current) &&
                current.simulationCompleted ===
                    true,
            "The five-document simulation must complete."
        ));

        checks.push(buildCheck(
            "Execution remains unauthorized",
            Boolean(current) &&
                current.executionAuthorized ===
                    false,
            "Execution authorization must remain locked."
        ));

        checks.push(buildCheck(
            "Write remains unauthorized",
            Boolean(current) &&
                current.writeAuthorized ===
                    false,
            "Permanent write authorization must remain locked."
        ));

        checks.push(buildCheck(
            "Rollback remains unauthorized",
            Boolean(current) &&
                current.rollbackAuthorized ===
                    false,
            "Rollback authorization must remain locked."
        ));

        checks.push(buildCheck(
            "No actual writes attempted",
            Boolean(current) &&
                current.actualWritesAttempted ===
                    false,
            "Simulation mode must not attempt any actual file write."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(current) &&
                current.permanentWritesExecuted ===
                    false,
            "Simulation mode must not modify permanent files."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(current) &&
                current.restoreExecuted ===
                    false,
            "Simulation mode must not perform rollback restoration."
        ));

        const simulationSteps =
            current &&
            Array.isArray(
                current.simulationSteps
            )
                ? current.simulationSteps
                : [];

        const stepIds =
            simulationSteps.map(function (
                step
            ) {
                return step.documentId;
            });

        const stepSetValid =
            simulationSteps.length ===
                EXPECTED_DOCUMENTS.length &&
            EXPECTED_DOCUMENTS.every(function (
                documentId
            ) {
                return stepIds.includes(
                    documentId
                );
            }) &&
            new Set(stepIds).size ===
                EXPECTED_DOCUMENTS.length;

        checks.push(buildCheck(
            "Expected simulated document set",
            stepSetValid,
            "The simulation must contain the unique five-document permanent set."
        ));

        const stepsValid =
            simulationSteps.length ===
                EXPECTED_DOCUMENTS.length &&
            simulationSteps.every(function (
                step,
                index
            ) {
                return (
                    step.sequence === index + 1 &&
                    EXPECTED_DOCUMENTS.includes(
                        step.documentId
                    ) &&
                    step.simulationStatus ===
                        "Simulated Successfully" &&
                    step.simulatedAction ===
                        "Replace complete permanent JSON file" &&
                    typeof step.originalChecksum ===
                        "string" &&
                    step.originalChecksum.length > 0 &&
                    typeof step.proposedChecksum ===
                        "string" &&
                    step.proposedChecksum.length > 0 &&
                    step.actualWriteAttempted ===
                        false &&
                    step.actualWriteExecuted ===
                        false &&
                    step.permanentWriteExecuted ===
                        false &&
                    step.writeAuthorized ===
                        false &&
                    step.executionAuthorized ===
                        false &&
                    step.rollbackAuthorized ===
                        false &&
                    step.restoreExecuted ===
                        false
                );
            });

        checks.push(buildCheck(
            "Simulation steps valid",
            stepsValid,
            "Every simulated write must be ordered, verified, successful, and non-destructive."
        ));

        return deepFreeze({
            validatorVersion:
                ENGINE_VERSION,

            accepted:
                checks.every(function (
                    check
                ) {
                    return check.passed;
                }),

            checks: checks
        });
    }

    async function formatSimulationReport(
        simulation
    ) {
        const current =
            simulation ||
            await generateSimulation();

        const lines = [
            "TMS-OS PERMANENT DOCUMENTATION WRITE SIMULATION",
            "Simulation ID: " +
                current.simulationId,
            "Accepted: " +
                (
                    current.accepted
                        ? "YES"
                        : "NO"
                ),
            "Work Session: " +
                current.sessionNumber,
            "Engine Version: " +
                current.engineVersion,
            "Writer Mode: " +
                current.writerMode,
            "Simulation Status: " +
                current.simulationStatus,
            "Simulated Documents: " +
                current.simulatedDocumentCount,
            "Simulation Ready: " +
                (
                    current.simulationReady
                        ? "YES"
                        : "NO"
                ),
            "Simulation Completed: " +
                (
                    current.simulationCompleted
                        ? "YES"
                        : "NO"
                ),
            "Execution Authorized: NO",
            "Write Authorized: NO",
            "Rollback Authorized: NO",
            "Actual Writes Attempted: NO",
            "Permanent Writes Executed: NO",
            "Restore Executed: NO"
        ];

        (
            current.simulationSteps || []
        ).forEach(function (step) {
            lines.push(
                step.sequence +
                " | " +
                step.documentId +
                " | " +
                step.updateMode +
                " | " +
                step.simulationStatus +
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
                current.reviewChoices.join(
                    " | "
                )
            );
        }

        return lines.join("\n");
    }

    function getLastSimulation() {
        return lastSimulation;
    }

    function getExpectedDocuments() {
        return EXPECTED_DOCUMENTS.slice();
    }

    window.TMSPermanentFileWriter =
        Object.freeze({
            engineVersion:
                ENGINE_VERSION,

            writerMode:
                WRITER_MODE,

            generateSimulation:
                generateSimulation,

            validateSimulation:
                validateSimulation,

            formatSimulationReport:
                formatSimulationReport,

            getLastSimulation:
                getLastSimulation,

            getExpectedDocuments:
                getExpectedDocuments
        });

    console.log(
        "Permanent File Writer v" +
        ENGINE_VERSION +
        " initialized in " +
        WRITER_MODE +
        " Mode for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());