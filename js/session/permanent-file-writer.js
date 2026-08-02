/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 101 — Permanent File Writer v1.1.0
Simulation Mode
File: js/session/permanent-file-writer.js

Purpose:
Accept a validated six-document Controlled Execution Plan and simulate the
complete ordered permanent-output execution package.

Documents requiring a permanent write are represented as authorized simulation
candidates while unchanged documents remain in the controlled package for
traceability and are explicitly excluded from simulated write execution.

This version operates in Simulation Mode only. It does not write, replace,
delete, restore, download, authorize, or otherwise modify any permanent file.

Execution authorization, write authorization, and rollback authorization
remain locked.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.1.0";
    const WRITER_MODE = "Simulation";

    const SIMULATION_TYPE =
        "TMS-OS Permanent Documentation Write Simulation";

    const EXPECTED_DOCUMENTS = Object.freeze([
        "WS-HIST-001",
        "STATE-001",
        "DOC-STATE-001",
        "DEC-LOG-001",
        "MILE-HIST-001",
        "WORKSPACE-SNAPSHOT-HISTORY-001"
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

    function validateExecutionStepDecision(
        step
    ) {
        if (
            typeof step.documentChanged !== "boolean" ||
            typeof step.permanentWriteRequired !== "boolean" ||
            typeof step.rollbackRequiredBeforeWrite !== "boolean"
        ) {
            return false;
        }

        if (step.permanentWriteRequired === true) {
            return (
                step.documentChanged === true &&
                step.rollbackRequiredBeforeWrite === true &&
                step.executionAction ===
                    "Replace complete permanent JSON file" &&
                step.executionStatus ===
                    "Planned — Not Authorized" &&
                step.verificationStatus ===
                    "Pending Execution"
            );
        }

        return (
            step.documentChanged === false &&
            step.rollbackRequiredBeforeWrite === false &&
            step.executionAction ===
                "No Write Required" &&
            step.executionStatus ===
                "No Write Required" &&
            step.verificationStatus ===
                "Passed — No Write Required"
        );
    }

    function validateExecutionPlan(
        executionPlan
    ) {
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
            "The execution plan must contain six permanent documents."
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
            "Simulation Mode must not authorize execution."
        ));

        checks.push(buildCheck(
            "Write remains unauthorized",
            Boolean(executionPlan) &&
                executionPlan.writeAuthorized === false,
            "Simulation Mode must not authorize permanent writes."
        ));

        checks.push(buildCheck(
            "Rollback remains unauthorized",
            Boolean(executionPlan) &&
                executionPlan.rollbackAuthorized === false,
            "Simulation Mode must not authorize rollback execution."
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
            "The execution plan must contain the unique six-document permanent set."
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
                    step.documentId ===
                        EXPECTED_DOCUMENTS[index] &&
                    step.prerequisiteStatus ===
                        "Passed" &&
                    step.originalDocumentCaptured ===
                        true &&
                    step.proposedDocumentCaptured ===
                        true &&
                    typeof step.targetPath ===
                        "string" &&
                    step.targetPath.length > 0 &&
                    typeof step.backupPath ===
                        "string" &&
                    step.backupPath.length > 0 &&
                    typeof step.originalChecksum ===
                        "string" &&
                    step.originalChecksum.length > 0 &&
                    typeof step.proposedChecksum ===
                        "string" &&
                    step.proposedChecksum.length > 0 &&
                    validateExecutionStepDecision(step) &&
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
            "Every execution step must remain ordered, checksum-backed, decision-valid, and authorization-locked."
        ));

        const writeRequiredCount =
            executionSteps.filter(function (step) {
                return (
                    step.permanentWriteRequired === true
                );
            }).length;

        const noWriteRequiredCount =
            executionSteps.filter(function (step) {
                return (
                    step.permanentWriteRequired === false
                );
            }).length;

        checks.push(buildCheck(
            "Execution decision counts valid",
            Boolean(executionPlan) &&
                executionPlan.writeRequiredDocumentCount ===
                    writeRequiredCount &&
                executionPlan.noWriteRequiredDocumentCount ===
                    noWriteRequiredCount &&
                writeRequiredCount +
                    noWriteRequiredCount ===
                    EXPECTED_DOCUMENTS.length,
            "The plan-level write-decision counts must match the six execution steps."
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

        const writeRequired =
            executionStep.permanentWriteRequired ===
                true;

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

            documentChanged:
                executionStep.documentChanged,

            permanentWriteRequired:
                executionStep.permanentWriteRequired,

            rollbackRequiredBeforeWrite:
                executionStep.rollbackRequiredBeforeWrite,

            sourceVersion:
                executionStep.sourceVersion,

            proposedVersion:
                executionStep.proposedVersion,

            sourceSectionCount:
                executionStep.sourceSectionCount,

            proposedSectionCount:
                executionStep.proposedSectionCount,

            sourceCollectionName:
                executionStep.sourceCollectionName ||
                null,

            proposedCollectionName:
                executionStep.proposedCollectionName ||
                null,

            sourceItemCount:
                Number.isInteger(
                    executionStep.sourceItemCount
                )
                    ? executionStep.sourceItemCount
                    : executionStep.sourceSectionCount,

            proposedItemCount:
                Number.isInteger(
                    executionStep.proposedItemCount
                )
                    ? executionStep.proposedItemCount
                    : executionStep.proposedSectionCount,

            simulationStartedAt:
                simulationStartedAt,

            simulatedAt:
                simulatedAt,

            simulatedAction:
                writeRequired
                    ? "Replace complete permanent JSON file"
                    : "No Write Required",

            simulationChecks:
                writeRequired
                    ? [
                        "Target path verified",
                        "Original backup path verified",
                        "Original checksum present",
                        "Proposed checksum present",
                        "Document change confirmed",
                        "Execution order verified",
                        "Write authorization confirmed locked"
                    ]
                    : [
                        "Target path verified",
                        "Original checksum present",
                        "Proposed checksum present",
                        "No document change detected",
                        "No permanent write required",
                        "Execution order verified",
                        "Write authorization confirmed locked"
                    ],

            simulationStatus:
                writeRequired
                    ? "Simulated Successfully"
                    : "Excluded — No Write Required",

            simulationDecision:
                writeRequired
                    ? "Simulated but Not Executed"
                    : "No Simulation Execution Required",

            excludedFromExecution:
                !writeRequired,

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

            writeRequiredDocumentCount: 0,
            noWriteRequiredDocumentCount: 0,

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
                return (
                    Number(first.sequence) -
                    Number(second.sequence)
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

        const allSimulationEntriesSafe =
            simulationSteps.every(function (
                step
            ) {
                const commonSafetyState =
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
                        false;

                if (!commonSafetyState) {
                    return false;
                }

                if (
                    step.permanentWriteRequired ===
                    true
                ) {
                    return (
                        step.documentChanged === true &&
                        step.rollbackRequiredBeforeWrite ===
                            true &&
                        step.excludedFromExecution ===
                            false &&
                        step.simulatedAction ===
                            "Replace complete permanent JSON file" &&
                        step.simulationStatus ===
                            "Simulated Successfully" &&
                        step.simulationDecision ===
                            "Simulated but Not Executed"
                    );
                }

                return (
                    step.documentChanged === false &&
                    step.rollbackRequiredBeforeWrite ===
                        false &&
                    step.excludedFromExecution ===
                        true &&
                    step.simulatedAction ===
                        "No Write Required" &&
                    step.simulationStatus ===
                        "Excluded — No Write Required" &&
                    step.simulationDecision ===
                        "No Simulation Execution Required"
                );
            });

        if (!allSimulationEntriesSafe) {
            lastSimulation =
                rejectedSimulation(
                    "One or more permanent document simulation entries failed Disabled Mode safety validation.",
                    sourcePlan,
                    validation
                );

            return lastSimulation;
        }

        const writeRequiredDocumentCount =
            simulationSteps.filter(function (
                step
            ) {
                return (
                    step.permanentWriteRequired === true
                );
            }).length;

        const noWriteRequiredDocumentCount =
            simulationSteps.length -
            writeRequiredDocumentCount;

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
                    "All six permanent documents were evaluated in Simulation Mode. " +
                    writeRequiredDocumentCount +
                    " write-required document(s) were simulated without execution, and " +
                    noWriteRequiredDocumentCount +
                    " unchanged document(s) were excluded from simulated write execution. " +
                    "No permanent files were changed.",

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

                writeRequiredDocumentCount:
                    writeRequiredDocumentCount,

                noWriteRequiredDocumentCount:
                    noWriteRequiredDocumentCount,

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
                    writeRequiredDocumentCount > 0
                        ? "Completed — Write-Required Steps Simulated — No Permanent Writes"
                        : "Completed — No Permanent Writes Required",

                requiredNextAction:
                    "Submit the completed six-document simulation report for independent execution verification.",

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
            simulation ||
            lastSimulation;

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
            "The Permanent File Writer must remain in Simulation Mode."
        ));

        checks.push(buildCheck(
            "Expected simulated document count",
            Boolean(current) &&
                current.simulatedDocumentCount ===
                    EXPECTED_DOCUMENTS.length,
            "Exactly six permanent documents must be evaluated in the simulation."
        ));

        checks.push(buildCheck(
            "Simulation ready",
            Boolean(current) &&
                current.simulationReady === true,
            "Simulation prerequisites must pass."
        ));

        checks.push(buildCheck(
            "Simulation completed",
            Boolean(current) &&
                current.simulationCompleted ===
                    true,
            "The six-document simulation must complete."
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
            "Simulation Mode must not attempt any actual file write."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(current) &&
                current.permanentWritesExecuted ===
                    false,
            "Simulation Mode must not modify permanent files."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(current) &&
                current.restoreExecuted ===
                    false,
            "Simulation Mode must not perform rollback restoration."
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
            "The simulation must contain the unique six-document permanent set."
        ));

        const stepsValid =
            simulationSteps.length ===
                EXPECTED_DOCUMENTS.length &&
            simulationSteps.every(function (
                step,
                index
            ) {
                const baseValid =
                    step.sequence === index + 1 &&
                    step.documentId ===
                        EXPECTED_DOCUMENTS[index] &&
                    typeof step.originalChecksum ===
                        "string" &&
                    step.originalChecksum.length > 0 &&
                    typeof step.proposedChecksum ===
                        "string" &&
                    step.proposedChecksum.length > 0 &&
                    typeof step.documentChanged ===
                        "boolean" &&
                    typeof step.permanentWriteRequired ===
                        "boolean" &&
                    typeof step.rollbackRequiredBeforeWrite ===
                        "boolean" &&
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
                    step.restoreExecuted === false;

                if (!baseValid) {
                    return false;
                }

                if (
                    step.permanentWriteRequired ===
                    true
                ) {
                    return (
                        step.documentChanged === true &&
                        step.rollbackRequiredBeforeWrite ===
                            true &&
                        step.excludedFromExecution ===
                            false &&
                        step.simulatedAction ===
                            "Replace complete permanent JSON file" &&
                        step.simulationStatus ===
                            "Simulated Successfully" &&
                        step.simulationDecision ===
                            "Simulated but Not Executed"
                    );
                }

                return (
                    step.documentChanged === false &&
                    step.rollbackRequiredBeforeWrite ===
                        false &&
                    step.excludedFromExecution ===
                        true &&
                    step.simulatedAction ===
                        "No Write Required" &&
                    step.simulationStatus ===
                        "Excluded — No Write Required" &&
                    step.simulationDecision ===
                        "No Simulation Execution Required"
                );
            });

        checks.push(buildCheck(
            "Simulation steps valid",
            stepsValid,
            "Every simulation entry must preserve the controlled write decision, ordering, checksum state, and non-destructive safeguards."
        ));

        const writeRequiredCount =
            simulationSteps.filter(function (
                step
            ) {
                return (
                    step.permanentWriteRequired === true
                );
            }).length;

        const noWriteRequiredCount =
            simulationSteps.filter(function (
                step
            ) {
                return (
                    step.permanentWriteRequired === false
                );
            }).length;

        checks.push(buildCheck(
            "Simulation decision counts valid",
            Boolean(current) &&
                current.writeRequiredDocumentCount ===
                    writeRequiredCount &&
                current.noWriteRequiredDocumentCount ===
                    noWriteRequiredCount &&
                writeRequiredCount +
                    noWriteRequiredCount ===
                    EXPECTED_DOCUMENTS.length,
            "The simulation-level decision counts must match the six simulation entries."
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
            "Evaluated Documents: " +
                current.simulatedDocumentCount,
            "Write Required Documents: " +
                current.writeRequiredDocumentCount,
            "No Write Required Documents: " +
                current.noWriteRequiredDocumentCount,
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
                " | " +
                (
                    step.permanentWriteRequired
                        ? "SIMULATED — NO FILE CHANGE"
                        : "NO WRITE REQUIRED"
                )
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