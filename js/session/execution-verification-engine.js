/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 101 — Execution Verification Engine v1.1.0
File: js/session/execution-verification-engine.js

Purpose:
Independently verify a completed six-document Permanent File Writer simulation
against its source Controlled Execution Plan.

This engine validates the six-document sequence, identities, ordering,
checksums, write-decision state, completion state, and non-destructive safety
controls.

This component does not write, replace, delete, restore, download, authorize,
or otherwise modify any permanent file.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.1.0";

    const VERIFICATION_TYPE =
        "TMS-OS Permanent Documentation Execution Verification";

    const EXPECTED_DOCUMENTS = Object.freeze([
        "WS-HIST-001",
        "STATE-001",
        "DOC-STATE-001",
        "DEC-LOG-001",
        "MILE-HIST-001",
        "WORKSPACE-SNAPSHOT-HISTORY-001"
    ]);

    let lastVerification = null;

    if (
        !window.TMSSessionContext ||
        !window.TMSPermanentFileWriter
    ) {
        console.error(
            "Execution Verification Engine could not initialize because its dependencies are unavailable."
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

    function createVerificationId(
        sessionNumber,
        generatedAt
    ) {
        const timestamp =
            generatedAt
                .replace(/[-:.TZ]/g, "")
                .slice(0, 14);

        return [
            "TMS",
            "EXECUTION-VERIFICATION",
            String(sessionNumber).padStart(3, "0"),
            timestamp
        ].join("-");
    }

    function validateSimulationStepState(
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
            step.actualWriteAttempted === false &&
            step.actualWriteExecuted === false &&
            step.permanentWriteExecuted === false &&
            step.executionAuthorized === false &&
            step.writeAuthorized === false &&
            step.rollbackAuthorized === false &&
            step.restoreExecuted === false;

        if (!baseValid) {
            return false;
        }

        if (step.permanentWriteRequired === true) {
            return (
                step.documentChanged === true &&
                step.rollbackRequiredBeforeWrite === true &&
                step.excludedFromExecution === false &&
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
            step.rollbackRequiredBeforeWrite === false &&
            step.excludedFromExecution === true &&
            step.simulatedAction ===
                "No Write Required" &&
            step.simulationStatus ===
                "Excluded — No Write Required" &&
            step.simulationDecision ===
                "No Simulation Execution Required"
        );
    }

    function validateSourceSimulation(
        simulation
    ) {
        const checks = [];

        let simulationValidation = {
            accepted: false,
            checks: []
        };

        if (isPlainObject(simulation)) {
            simulationValidation =
                window.TMSPermanentFileWriter
                    .validateSimulation(
                        simulation
                    );
        }

        checks.push(buildCheck(
            "Simulation exists",
            isPlainObject(simulation),
            "A Permanent File Writer simulation is required."
        ));

        checks.push(buildCheck(
            "Simulation accepted",
            Boolean(
                simulation &&
                simulation.accepted
            ),
            "The Permanent File Writer simulation must be accepted."
        ));

        checks.push(buildCheck(
            "Simulation validation accepted",
            Boolean(
                simulationValidation &&
                simulationValidation.accepted
            ),
            "The source simulation must pass Permanent File Writer validation."
        ));

        checks.push(buildCheck(
            "Simulation mode confirmed",
            Boolean(simulation) &&
                simulation.writerMode ===
                    "Simulation",
            "The source must be a simulation-only execution result."
        ));

        checks.push(buildCheck(
            "Expected simulated document count",
            Boolean(simulation) &&
                simulation.simulatedDocumentCount ===
                    EXPECTED_DOCUMENTS.length,
            "Exactly six permanent documents must be evaluated."
        ));

        checks.push(buildCheck(
            "Simulation completed",
            Boolean(simulation) &&
                simulation.simulationCompleted ===
                    true,
            "The simulation must be complete."
        ));

        checks.push(buildCheck(
            "Simulation ready",
            Boolean(simulation) &&
                simulation.simulationReady ===
                    true,
            "The simulation must have passed all prerequisites."
        ));

        checks.push(buildCheck(
            "Execution remains unauthorized",
            Boolean(simulation) &&
                simulation.executionAuthorized ===
                    false,
            "Execution authorization must remain locked."
        ));

        checks.push(buildCheck(
            "Write remains unauthorized",
            Boolean(simulation) &&
                simulation.writeAuthorized ===
                    false,
            "Permanent write authorization must remain locked."
        ));

        checks.push(buildCheck(
            "Rollback remains unauthorized",
            Boolean(simulation) &&
                simulation.rollbackAuthorized ===
                    false,
            "Rollback authorization must remain locked."
        ));

        checks.push(buildCheck(
            "No actual writes attempted",
            Boolean(simulation) &&
                simulation.actualWritesAttempted ===
                    false,
            "No actual permanent write may have been attempted."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(simulation) &&
                simulation.permanentWritesExecuted ===
                    false,
            "No permanent file may have been modified."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(simulation) &&
                simulation.restoreExecuted ===
                    false,
            "No rollback restore may have executed."
        ));

        const simulationSteps =
            simulation &&
            Array.isArray(
                simulation.simulationSteps
            )
                ? simulation.simulationSteps
                : [];

        const documentIds =
            simulationSteps.map(function (
                step
            ) {
                return step.documentId;
            });

        const documentSetValid =
            simulationSteps.length ===
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
            "Expected simulated document set",
            documentSetValid,
            "The simulation must contain the unique six-document permanent set."
        ));

        const stepStateValid =
            simulationSteps.length ===
                EXPECTED_DOCUMENTS.length &&
            simulationSteps.every(function (
                step,
                index
            ) {
                return validateSimulationStepState(
                    step,
                    index
                );
            });

        checks.push(buildCheck(
            "Simulation step safety state",
            stepStateValid,
            "Every simulation entry must preserve ordering, checksums, write decisions, and non-destructive safety controls."
        ));

        const writeRequiredCount =
            simulationSteps.filter(function (
                step
            ) {
                return (
                    step.permanentWriteRequired ===
                    true
                );
            }).length;

        const noWriteRequiredCount =
            simulationSteps.filter(function (
                step
            ) {
                return (
                    step.permanentWriteRequired ===
                    false
                );
            }).length;

        checks.push(buildCheck(
            "Simulation decision counts valid",
            Boolean(simulation) &&
                simulation.writeRequiredDocumentCount ===
                    writeRequiredCount &&
                simulation.noWriteRequiredDocumentCount ===
                    noWriteRequiredCount &&
                writeRequiredCount +
                    noWriteRequiredCount ===
                    EXPECTED_DOCUMENTS.length,
            "The simulation-level decision counts must match all six entries."
        ));

        return {
            accepted:
                checks.every(function (check) {
                    return check.passed;
                }),

            checks:
                checks,

            simulationValidation:
                simulationValidation
        };
    }

    function buildVerificationStep(
        simulationStep,
        index
    ) {
        const checks = [];

        checks.push(buildCheck(
            "Sequence matches expected order",
            simulationStep.sequence ===
                index + 1,
            "The simulated sequence must match the approved execution order."
        ));

        checks.push(buildCheck(
            "Document ID matches expected order",
            simulationStep.documentId ===
                EXPECTED_DOCUMENTS[index],
            "The document must appear in the approved six-document order."
        ));

        checks.push(buildCheck(
            "Simulation decision state valid",
            validateSimulationStepState(
                simulationStep,
                index
            ),
            "The simulation entry must preserve its approved write decision and safety state."
        ));

        checks.push(buildCheck(
            "Original checksum preserved",
            typeof simulationStep.originalChecksum ===
                "string" &&
            simulationStep.originalChecksum.length > 0,
            "The original-document checksum must remain present."
        ));

        checks.push(buildCheck(
            "Proposed checksum preserved",
            typeof simulationStep.proposedChecksum ===
                "string" &&
            simulationStep.proposedChecksum.length > 0,
            "The proposed-document checksum must remain present."
        ));

        checks.push(buildCheck(
            "No actual write attempted",
            simulationStep.actualWriteAttempted ===
                false,
            "The simulation must not attempt a real file write."
        ));

        checks.push(buildCheck(
            "No actual write executed",
            simulationStep.actualWriteExecuted ===
                false,
            "The simulation must not execute a real file write."
        ));

        checks.push(buildCheck(
            "Permanent write remains false",
            simulationStep.permanentWriteExecuted ===
                false,
            "No permanent file change may be recorded."
        ));

        checks.push(buildCheck(
            "Authorization locks preserved",
            simulationStep.writeAuthorized ===
                false &&
            simulationStep.executionAuthorized ===
                false &&
            simulationStep.rollbackAuthorized ===
                false,
            "Execution, write, and rollback authorization must remain locked."
        ));

        checks.push(buildCheck(
            "No restore executed",
            simulationStep.restoreExecuted ===
                false,
            "The simulation must not perform restoration."
        ));

        const accepted =
            checks.every(function (check) {
                return check.passed;
            });

        return {
            sequence:
                index + 1,

            documentId:
                simulationStep.documentId,

            order:
                simulationStep.order,

            updateMode:
                simulationStep.updateMode,

            targetPath:
                simulationStep.targetPath,

            backupPath:
                simulationStep.backupPath,

            proposedCopyPath:
                simulationStep.proposedCopyPath,

            originalChecksum:
                simulationStep.originalChecksum,

            proposedChecksum:
                simulationStep.proposedChecksum,

            documentChanged:
                simulationStep.documentChanged,

            permanentWriteRequired:
                simulationStep.permanentWriteRequired,

            rollbackRequiredBeforeWrite:
                simulationStep.rollbackRequiredBeforeWrite,

            excludedFromExecution:
                simulationStep.excludedFromExecution,

            sourceSimulationStatus:
                simulationStep.simulationStatus,

            simulationDecision:
                simulationStep.simulationDecision,

            accepted:
                accepted,

            checks:
                checks,

            verificationStatus:
                accepted
                    ? "Verified"
                    : "Rejected",

            actualWriteAttempted:
                false,

            actualWriteExecuted:
                false,

            permanentWriteExecuted:
                false,

            executionAuthorized:
                false,

            writeAuthorized:
                false,

            rollbackAuthorized:
                false,

            restoreExecuted:
                false
        };
    }

    function rejectedVerification(
        message,
        simulation,
        validation
    ) {
        const snapshot =
            window.TMSSessionContext
                .getSnapshot();

        const generatedAt =
            new Date().toISOString();

        return deepFreeze({
            verificationType:
                VERIFICATION_TYPE,

            engineVersion:
                ENGINE_VERSION,

            verificationId:
                createVerificationId(
                    snapshot.sessionNumber,
                    generatedAt
                ),

            generatedAt:
                generatedAt,

            sessionNumber:
                snapshot.sessionNumber,

            accepted:
                false,

            message:
                message,

            sourceSimulationAccepted:
                Boolean(
                    simulation &&
                    simulation.accepted
                ),

            sourceSimulationId:
                simulation
                    ? simulation.simulationId
                    : null,

            sourceSimulationStatus:
                simulation
                    ? simulation.simulationStatus
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

            verifiedDocumentCount:
                0,

            writeRequiredDocumentCount:
                0,

            noWriteRequiredDocumentCount:
                0,

            verificationSteps:
                [],

            executionOrderVerified:
                false,

            documentSetVerified:
                false,

            checksumPresenceVerified:
                false,

            simulationCompletionVerified:
                false,

            writeDecisionStateVerified:
                false,

            nonDestructiveStateVerified:
                false,

            verificationPassed:
                false,

            executionAuthorized:
                false,

            writeAuthorized:
                false,

            rollbackAuthorized:
                false,

            actualWritesAttempted:
                false,

            permanentWritesExecuted:
                false,

            restoreExecuted:
                false,

            verificationStatus:
                "Rejected",

            requiredNextAction:
                "Correct the failed simulation or verification prerequisite checks.",

            reviewRequired:
                true
        });
    }

    async function generateVerification(
        simulation
    ) {
        const sourceSimulation =
            simulation ||
            await window
                .TMSPermanentFileWriter
                .generateSimulation();

        const validation =
            validateSourceSimulation(
                sourceSimulation
            );

        if (!validation.accepted) {
            lastVerification =
                rejectedVerification(
                    "The Permanent File Writer simulation failed independent execution verification prerequisites.",
                    sourceSimulation,
                    validation
                );

            return lastVerification;
        }

        const orderedSteps =
            clone(
                sourceSimulation
                    .simulationSteps
            ).sort(function (
                first,
                second
            ) {
                return (
                    Number(first.sequence) -
                    Number(second.sequence)
                );
            });

        const verificationSteps =
            orderedSteps.map(function (
                simulationStep,
                index
            ) {
                return buildVerificationStep(
                    simulationStep,
                    index
                );
            });

        const allVerified =
            verificationSteps.every(function (
                step
            ) {
                return (
                    step.accepted === true &&
                    step.verificationStatus ===
                        "Verified"
                );
            });

        if (!allVerified) {
            lastVerification =
                rejectedVerification(
                    "One or more six-document simulation entries failed independent verification.",
                    sourceSimulation,
                    validation
                );

            return lastVerification;
        }

        const writeRequiredDocumentCount =
            verificationSteps.filter(
                function (step) {
                    return (
                        step
                            .permanentWriteRequired ===
                        true
                    );
                }
            ).length;

        const noWriteRequiredDocumentCount =
            verificationSteps.length -
            writeRequiredDocumentCount;

        const snapshot =
            window.TMSSessionContext
                .getSnapshot();

        const generatedAt =
            new Date().toISOString();

        lastVerification =
            deepFreeze({
                verificationType:
                    VERIFICATION_TYPE,

                engineVersion:
                    ENGINE_VERSION,

                verificationId:
                    createVerificationId(
                        snapshot.sessionNumber,
                        generatedAt
                    ),

                generatedAt:
                    generatedAt,

                sessionNumber:
                    snapshot.sessionNumber,

                accepted:
                    true,

                message:
                    "All six permanent-document simulation entries passed independent verification. " +
                    writeRequiredDocumentCount +
                    " write-required document(s) remain unexecuted, and " +
                    noWriteRequiredDocumentCount +
                    " document(s) require no permanent write. " +
                    "No permanent files were changed.",

                sourceSimulationAccepted:
                    true,

                sourceSimulationId:
                    sourceSimulation
                        .simulationId,

                sourceSimulationStatus:
                    sourceSimulation
                        .simulationStatus,

                sourceSimulationEngineVersion:
                    sourceSimulation
                        .engineVersion,

                sourceSimulationGeneratedAt:
                    sourceSimulation
                        .generatedAt,

                sourceExecutionPlanId:
                    sourceSimulation
                        .sourceExecutionPlanId,

                sourceCaptureId:
                    sourceSimulation
                        .sourceCaptureId,

                sourceRollbackPackageId:
                    sourceSimulation
                        .sourceRollbackPackageId,

                validationAccepted:
                    true,

                validationChecks:
                    validation.checks,

                expectedDocumentCount:
                    EXPECTED_DOCUMENTS.length,

                verifiedDocumentCount:
                    verificationSteps.length,

                writeRequiredDocumentCount:
                    writeRequiredDocumentCount,

                noWriteRequiredDocumentCount:
                    noWriteRequiredDocumentCount,

                verificationSteps:
                    verificationSteps,

                executionOrderVerified:
                    true,

                documentSetVerified:
                    true,

                checksumPresenceVerified:
                    true,

                simulationCompletionVerified:
                    true,

                writeDecisionStateVerified:
                    true,

                nonDestructiveStateVerified:
                    true,

                verificationPassed:
                    true,

                executionAuthorized:
                    false,

                writeAuthorized:
                    false,

                rollbackAuthorized:
                    false,

                actualWritesAttempted:
                    false,

                permanentWritesExecuted:
                    false,

                restoreExecuted:
                    false,

                verificationStatus:
                    "Passed — Six-Document Simulation Independently Verified",

                requiredNextAction:
                    "Submit the six-document verification report to the Execution Authorization Engine.",

                reviewRequired:
                    true,

                reviewChoices: [
                    "Approve Verification Results",
                    "Revise Session",
                    "Cancel Verification"
                ]
            });

        return lastVerification;
    }

    function validateVerification(
        verification
    ) {
        const current =
            verification ||
            lastVerification;

        const checks = [];

        checks.push(buildCheck(
            "Verification exists",
            isPlainObject(current),
            "An Execution Verification package is required."
        ));

        checks.push(buildCheck(
            "Verification accepted",
            Boolean(
                current &&
                current.accepted
            ),
            "The Execution Verification package must be accepted."
        ));

        checks.push(buildCheck(
            "Expected verified document count",
            Boolean(current) &&
                current.verifiedDocumentCount ===
                    EXPECTED_DOCUMENTS.length,
            "Exactly six permanent-document simulation entries must be verified."
        ));

        checks.push(buildCheck(
            "Execution order verified",
            Boolean(current) &&
                current.executionOrderVerified ===
                    true,
            "The controlled execution order must be verified."
        ));

        checks.push(buildCheck(
            "Document set verified",
            Boolean(current) &&
                current.documentSetVerified ===
                    true,
            "The unique six-document permanent set must be verified."
        ));

        checks.push(buildCheck(
            "Checksums verified",
            Boolean(current) &&
                current.checksumPresenceVerified ===
                    true,
            "Original and proposed checksum presence must be verified."
        ));

        checks.push(buildCheck(
            "Simulation completion verified",
            Boolean(current) &&
                current.simulationCompletionVerified ===
                    true,
            "Successful completion of the six-document simulation must be verified."
        ));

        checks.push(buildCheck(
            "Write-decision state verified",
            Boolean(current) &&
                current.writeDecisionStateVerified ===
                    true,
            "Every verification step must preserve the approved write decision."
        ));

        checks.push(buildCheck(
            "Non-destructive state verified",
            Boolean(current) &&
                current.nonDestructiveStateVerified ===
                    true,
            "The verification must confirm no permanent file changes."
        ));

        checks.push(buildCheck(
            "Verification passed",
            Boolean(current) &&
                current.verificationPassed ===
                    true,
            "The independent execution verification must pass."
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
            "No actual permanent write may have been attempted."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(current) &&
                current.permanentWritesExecuted ===
                    false,
            "No permanent file may have been modified."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(current) &&
                current.restoreExecuted ===
                    false,
            "No rollback restoration may have occurred."
        ));

        const verificationSteps =
            current &&
            Array.isArray(
                current.verificationSteps
            )
                ? current.verificationSteps
                : [];

        const documentIds =
            verificationSteps.map(function (
                step
            ) {
                return step.documentId;
            });

        const documentSetValid =
            verificationSteps.length ===
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
            "Expected verification document set",
            documentSetValid,
            "The verification must contain the unique six-document permanent set."
        ));

        const stepsValid =
            verificationSteps.length ===
                EXPECTED_DOCUMENTS.length &&
            verificationSteps.every(function (
                step,
                index
            ) {
                const baseValid =
                    step.sequence ===
                        index + 1 &&
                    step.documentId ===
                        EXPECTED_DOCUMENTS[index] &&
                    step.accepted === true &&
                    step.verificationStatus ===
                        "Verified" &&
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
                    step.executionAuthorized ===
                        false &&
                    step.writeAuthorized ===
                        false &&
                    step.rollbackAuthorized ===
                        false &&
                    step.restoreExecuted ===
                        false;

                if (!baseValid) {
                    return false;
                }

                if (
                    step.permanentWriteRequired ===
                    true
                ) {
                    return (
                        step.documentChanged ===
                            true &&
                        step.rollbackRequiredBeforeWrite ===
                            true &&
                        step.excludedFromExecution ===
                            false &&
                        step.sourceSimulationStatus ===
                            "Simulated Successfully"
                    );
                }

                return (
                    step.documentChanged ===
                        false &&
                    step.rollbackRequiredBeforeWrite ===
                        false &&
                    step.excludedFromExecution ===
                        true &&
                    step.sourceSimulationStatus ===
                        "Excluded — No Write Required"
                );
            });

        checks.push(buildCheck(
            "Verification steps valid",
            stepsValid,
            "Every verification step must pass independently, preserve its write decision, and retain all safety locks."
        ));

        const writeRequiredCount =
            verificationSteps.filter(
                function (step) {
                    return (
                        step
                            .permanentWriteRequired ===
                        true
                    );
                }
            ).length;

        const noWriteRequiredCount =
            verificationSteps.filter(
                function (step) {
                    return (
                        step
                            .permanentWriteRequired ===
                        false
                    );
                }
            ).length;

        checks.push(buildCheck(
            "Verification decision counts valid",
            Boolean(current) &&
                current.writeRequiredDocumentCount ===
                    writeRequiredCount &&
                current.noWriteRequiredDocumentCount ===
                    noWriteRequiredCount &&
                writeRequiredCount +
                    noWriteRequiredCount ===
                    EXPECTED_DOCUMENTS.length,
            "The verification-level decision counts must match all six entries."
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

            checks:
                checks
        });
    }

    async function formatVerificationReport(
        verification
    ) {
        const current =
            verification ||
            await generateVerification();

        const lines = [
            "TMS-OS PERMANENT DOCUMENTATION EXECUTION VERIFICATION",
            "Verification ID: " +
                current.verificationId,
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
            "Verification Status: " +
                current.verificationStatus,
            "Verified Documents: " +
                current.verifiedDocumentCount,
            "Write Required Documents: " +
                current.writeRequiredDocumentCount,
            "No Write Required Documents: " +
                current.noWriteRequiredDocumentCount,
            "Execution Order Verified: " +
                (
                    current.executionOrderVerified
                        ? "YES"
                        : "NO"
                ),
            "Document Set Verified: " +
                (
                    current.documentSetVerified
                        ? "YES"
                        : "NO"
                ),
            "Checksum Presence Verified: " +
                (
                    current.checksumPresenceVerified
                        ? "YES"
                        : "NO"
                ),
            "Simulation Completion Verified: " +
                (
                    current.simulationCompletionVerified
                        ? "YES"
                        : "NO"
                ),
            "Write Decision State Verified: " +
                (
                    current.writeDecisionStateVerified
                        ? "YES"
                        : "NO"
                ),
            "Non-Destructive State Verified: " +
                (
                    current.nonDestructiveStateVerified
                        ? "YES"
                        : "NO"
                ),
            "Verification Passed: " +
                (
                    current.verificationPassed
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
            current.verificationSteps || []
        ).forEach(function (step) {
            lines.push(
                step.sequence +
                " | " +
                step.documentId +
                " | " +
                step.verificationStatus +
                " | " +
                (
                    step.permanentWriteRequired
                        ? "WRITE REQUIRED — LOCKED"
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

    function getLastVerification() {
        return lastVerification;
    }

    function getExpectedDocuments() {
        return EXPECTED_DOCUMENTS.slice();
    }

    window.TMSExecutionVerificationEngine =
        Object.freeze({
            engineVersion:
                ENGINE_VERSION,

            generateVerification:
                generateVerification,

            validateVerification:
                validateVerification,

            formatVerificationReport:
                formatVerificationReport,

            getLastVerification:
                getLastVerification,

            getExpectedDocuments:
                getExpectedDocuments
        });

    console.log(
        "Execution Verification Engine v" +
        ENGINE_VERSION +
        " initialized for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());
