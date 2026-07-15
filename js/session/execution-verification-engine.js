/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 053 — Execution Verification Engine v1.0.0
File: js/session/execution-verification-engine.js

Purpose:
Independently verify a completed Permanent File Writer simulation against its
source Controlled Execution Plan.

This engine validates the simulated five-document execution sequence,
identities, ordering, checksums, completion state, and non-destructive safety
controls.

This component does not write, replace, delete, restore, download, authorize,
or otherwise modify any permanent file.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const VERIFICATION_TYPE =
        "TMS-OS Permanent Documentation Execution Verification";

    const EXPECTED_DOCUMENTS = Object.freeze([
        "WS-HIST-001",
        "STATE-001",
        "DOC-STATE-001",
        "DEC-LOG-001",
        "MILE-HIST-001"
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

    function createVerificationId(sessionNumber, generatedAt) {
        const timestamp = generatedAt
            .replace(/[-:.TZ]/g, "")
            .slice(0, 14);

        return [
            "TMS",
            "EXECUTION-VERIFICATION",
            String(sessionNumber).padStart(3, "0"),
            timestamp
        ].join("-");
    }

    function validateSourceSimulation(simulation) {
        const checks = [];

        let simulationValidation = {
            accepted: false,
            checks: []
        };

        if (isPlainObject(simulation)) {
            simulationValidation =
                window.TMSPermanentFileWriter
                    .validateSimulation(simulation);
        }

        checks.push(buildCheck(
            "Simulation exists",
            isPlainObject(simulation),
            "A Permanent File Writer simulation is required."
        ));

        checks.push(buildCheck(
            "Simulation accepted",
            Boolean(simulation && simulation.accepted),
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
                simulation.writerMode === "Simulation",
            "The source must be a simulation-only execution result."
        ));

        checks.push(buildCheck(
            "Expected simulated document count",
            Boolean(simulation) &&
                simulation.simulatedDocumentCount ===
                    EXPECTED_DOCUMENTS.length,
            "Exactly five document writes must be simulated."
        ));

        checks.push(buildCheck(
            "Simulation completed",
            Boolean(simulation) &&
                simulation.simulationCompleted === true,
            "The simulation must be complete."
        ));

        checks.push(buildCheck(
            "Simulation ready",
            Boolean(simulation) &&
                simulation.simulationReady === true,
            "The simulation must have passed all prerequisites."
        ));

        checks.push(buildCheck(
            "Execution remains unauthorized",
            Boolean(simulation) &&
                simulation.executionAuthorized === false,
            "Execution authorization must remain locked."
        ));

        checks.push(buildCheck(
            "Write remains unauthorized",
            Boolean(simulation) &&
                simulation.writeAuthorized === false,
            "Permanent write authorization must remain locked."
        ));

        checks.push(buildCheck(
            "Rollback remains unauthorized",
            Boolean(simulation) &&
                simulation.rollbackAuthorized === false,
            "Rollback authorization must remain locked."
        ));

        checks.push(buildCheck(
            "No actual writes attempted",
            Boolean(simulation) &&
                simulation.actualWritesAttempted === false,
            "No actual permanent write may have been attempted."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(simulation) &&
                simulation.permanentWritesExecuted === false,
            "No permanent file may have been modified."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(simulation) &&
                simulation.restoreExecuted === false,
            "No rollback restore may have executed."
        ));

        const simulationSteps =
            simulation &&
            Array.isArray(simulation.simulationSteps)
                ? simulation.simulationSteps
                : [];

        const documentIds =
            simulationSteps.map(function (step) {
                return step.documentId;
            });

        const documentSetValid =
            simulationSteps.length ===
                EXPECTED_DOCUMENTS.length &&
            EXPECTED_DOCUMENTS.every(function (documentId) {
                return documentIds.includes(documentId);
            }) &&
            new Set(documentIds).size ===
                EXPECTED_DOCUMENTS.length;

        checks.push(buildCheck(
            "Expected simulated document set",
            documentSetValid,
            "The simulation must contain the unique five-document permanent set."
        ));

        const stepStateValid =
            simulationSteps.length ===
                EXPECTED_DOCUMENTS.length &&
            simulationSteps.every(function (step, index) {
                return (
                    step.sequence === index + 1 &&
                    EXPECTED_DOCUMENTS.includes(
                        step.documentId
                    ) &&
                    step.simulationStatus ===
                        "Simulated Successfully" &&
                    step.actualWriteAttempted === false &&
                    step.actualWriteExecuted === false &&
                    step.permanentWriteExecuted === false &&
                    step.writeAuthorized === false &&
                    step.executionAuthorized === false &&
                    step.rollbackAuthorized === false &&
                    step.restoreExecuted === false &&
                    typeof step.originalChecksum ===
                        "string" &&
                    step.originalChecksum.length > 0 &&
                    typeof step.proposedChecksum ===
                        "string" &&
                    step.proposedChecksum.length > 0
                );
            });

        checks.push(buildCheck(
            "Simulation step safety state",
            stepStateValid,
            "Every simulated execution step must be successful, ordered, checksum-backed, and non-destructive."
        ));

        return {
            accepted: checks.every(function (check) {
                return check.passed;
            }),
            checks: checks,
            simulationValidation: simulationValidation
        };
    }

    function buildVerificationStep(simulationStep, index) {
        const checks = [];

        checks.push(buildCheck(
            "Sequence matches expected order",
            simulationStep.sequence === index + 1,
            "The simulated sequence must match the approved execution order."
        ));

        checks.push(buildCheck(
            "Document ID matches expected order",
            simulationStep.documentId ===
                EXPECTED_DOCUMENTS[index],
            "The document must appear in the controlled permanent-document order."
        ));

        checks.push(buildCheck(
            "Simulation completed successfully",
            simulationStep.simulationStatus ===
                "Simulated Successfully",
            "The simulated document write must report successful completion."
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
            simulationStep.actualWriteAttempted === false,
            "The simulation must not attempt a real file write."
        ));

        checks.push(buildCheck(
            "No actual write executed",
            simulationStep.actualWriteExecuted === false,
            "The simulation must not execute a real file write."
        ));

        checks.push(buildCheck(
            "Permanent write remains false",
            simulationStep.permanentWriteExecuted === false,
            "No permanent file change may be recorded."
        ));

        checks.push(buildCheck(
            "Authorization locks preserved",
            simulationStep.writeAuthorized === false &&
                simulationStep.executionAuthorized === false &&
                simulationStep.rollbackAuthorized === false,
            "Execution, write, and rollback authorization must remain locked."
        ));

        checks.push(buildCheck(
            "No restore executed",
            simulationStep.restoreExecuted === false,
            "The simulation must not perform restoration."
        ));

        return {
            sequence: index + 1,
            documentId: simulationStep.documentId,
            order: simulationStep.order,
            updateMode: simulationStep.updateMode,

            targetPath: simulationStep.targetPath,
            backupPath: simulationStep.backupPath,
            proposedCopyPath:
                simulationStep.proposedCopyPath,

            originalChecksum:
                simulationStep.originalChecksum,
            proposedChecksum:
                simulationStep.proposedChecksum,

            simulationStatus:
                simulationStep.simulationStatus,

            accepted: checks.every(function (check) {
                return check.passed;
            }),

            checks: checks,

            verificationStatus:
                checks.every(function (check) {
                    return check.passed;
                })
                    ? "Verified"
                    : "Rejected",

            actualWriteAttempted: false,
            actualWriteExecuted: false,
            permanentWriteExecuted: false,

            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,
            restoreExecuted: false
        };
    }

    function rejectedVerification(
        message,
        simulation,
        validation
    ) {
        const snapshot =
            window.TMSSessionContext.getSnapshot();

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

            accepted: false,
            message: message,

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

            verifiedDocumentCount: 0,
            verificationSteps: [],

            executionOrderVerified: false,
            documentSetVerified: false,
            checksumPresenceVerified: false,
            simulationCompletionVerified: false,
            nonDestructiveStateVerified: false,

            verificationPassed: false,

            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,

            actualWritesAttempted: false,
            permanentWritesExecuted: false,
            restoreExecuted: false,

            verificationStatus: "Rejected",

            requiredNextAction:
                "Correct the failed simulation or verification prerequisite checks.",

            reviewRequired: true
        });
    }

    async function generateVerification(simulation) {
        const sourceSimulation =
            simulation ||
            await window.TMSPermanentFileWriter
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
                sourceSimulation.simulationSteps
            ).sort(function (first, second) {
                return Number(first.sequence) -
                    Number(second.sequence);
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
            verificationSteps.every(function (step) {
                return step.accepted === true &&
                    step.verificationStatus ===
                        "Verified";
            });

        if (!allVerified) {
            lastVerification =
                rejectedVerification(
                    "One or more simulated permanent document executions failed independent verification.",
                    sourceSimulation,
                    validation
                );

            return lastVerification;
        }

        const snapshot =
            window.TMSSessionContext.getSnapshot();

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

                accepted: true,

                message:
                    "All five simulated permanent document executions passed independent verification. No permanent files were changed.",

                sourceSimulationAccepted: true,

                sourceSimulationId:
                    sourceSimulation.simulationId,

                sourceSimulationStatus:
                    sourceSimulation.simulationStatus,

                sourceSimulationEngineVersion:
                    sourceSimulation.engineVersion,

                sourceSimulationGeneratedAt:
                    sourceSimulation.generatedAt,

                sourceExecutionPlanId:
                    sourceSimulation
                        .sourceExecutionPlanId,

                sourceCaptureId:
                    sourceSimulation
                        .sourceCaptureId,

                sourceRollbackPackageId:
                    sourceSimulation
                        .sourceRollbackPackageId,

                validationAccepted: true,

                validationChecks:
                    validation.checks,

                expectedDocumentCount:
                    EXPECTED_DOCUMENTS.length,

                verifiedDocumentCount:
                    verificationSteps.length,

                verificationSteps:
                    verificationSteps,

                executionOrderVerified: true,
                documentSetVerified: true,
                checksumPresenceVerified: true,
                simulationCompletionVerified: true,
                nonDestructiveStateVerified: true,

                verificationPassed: true,

                executionAuthorized: false,
                writeAuthorized: false,
                rollbackAuthorized: false,

                actualWritesAttempted: false,
                permanentWritesExecuted: false,
                restoreExecuted: false,

                verificationStatus:
                    "Passed — Simulation Independently Verified",

                requiredNextAction:
                    "Submit the independent verification report for human review before designing any future real-write authorization layer.",

                reviewRequired: true,

                reviewChoices: [
                    "Approve Verification Results",
                    "Revise Session",
                    "Cancel Verification"
                ]
            });

        return lastVerification;
    }

    function validateVerification(verification) {
        const current =
            verification || lastVerification;

        const checks = [];

        checks.push(buildCheck(
            "Verification exists",
            isPlainObject(current),
            "An Execution Verification package is required."
        ));

        checks.push(buildCheck(
            "Verification accepted",
            Boolean(current && current.accepted),
            "The Execution Verification package must be accepted."
        ));

        checks.push(buildCheck(
            "Expected verified document count",
            Boolean(current) &&
                current.verifiedDocumentCount ===
                    EXPECTED_DOCUMENTS.length,
            "Exactly five simulated document executions must be verified."
        ));

        checks.push(buildCheck(
            "Execution order verified",
            Boolean(current) &&
                current.executionOrderVerified === true,
            "The controlled execution order must be verified."
        ));

        checks.push(buildCheck(
            "Document set verified",
            Boolean(current) &&
                current.documentSetVerified === true,
            "The unique five-document permanent set must be verified."
        ));

        checks.push(buildCheck(
            "Checksums verified",
            Boolean(current) &&
                current.checksumPresenceVerified === true,
            "Original and proposed checksum presence must be verified."
        ));

        checks.push(buildCheck(
            "Simulation completion verified",
            Boolean(current) &&
                current.simulationCompletionVerified === true,
            "Successful completion of the simulation must be verified."
        ));

        checks.push(buildCheck(
            "Non-destructive state verified",
            Boolean(current) &&
                current.nonDestructiveStateVerified === true,
            "The verification must confirm no permanent file changes."
        ));

        checks.push(buildCheck(
            "Verification passed",
            Boolean(current) &&
                current.verificationPassed === true,
            "The independent execution verification must pass."
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
            "No actual permanent write may have been attempted."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(current) &&
                current.permanentWritesExecuted === false,
            "No permanent file may have been modified."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(current) &&
                current.restoreExecuted === false,
            "No rollback restoration may have occurred."
        ));

        const verificationSteps =
            current &&
            Array.isArray(current.verificationSteps)
                ? current.verificationSteps
                : [];

        const documentIds =
            verificationSteps.map(function (step) {
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
            "The verification must contain the unique five-document permanent set."
        ));

        const stepsValid =
            verificationSteps.length ===
                EXPECTED_DOCUMENTS.length &&
            verificationSteps.every(function (
                step,
                index
            ) {
                return (
                    step.sequence === index + 1 &&
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
                    step.restoreExecuted === false
                );
            });

        checks.push(buildCheck(
            "Verification steps valid",
            stepsValid,
            "Every verification step must pass independently and preserve all non-destructive safety locks."
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