/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 054 — Execution Authorization Engine v1.0.0
File: js/session/execution-authorization-engine.js

Purpose:
Consume an independently verified Permanent Documentation Execution
Verification package and generate a formal, immutable, review-only execution
authorization package.

This component validates that all five controlled permanent documents passed
simulation and independent verification. It does not write, replace, delete,
restore, download, or otherwise modify any permanent file.

Authorization remains locked by default. This version creates an authorization
eligibility package only and does not grant real execution or write authority.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";

    const AUTHORIZATION_TYPE =
        "TMS-OS Permanent Documentation Execution Authorization";

    const EXPECTED_DOCUMENTS = Object.freeze([
        "WS-HIST-001",
        "STATE-001",
        "DOC-STATE-001",
        "DEC-LOG-001",
        "MILE-HIST-001"
    ]);

    let lastAuthorization = null;

    if (
        !window.TMSSessionContext ||
        !window.TMSExecutionVerificationEngine
    ) {
        console.error(
            "Execution Authorization Engine could not initialize because its dependencies are unavailable."
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

    function createAuthorizationId(
        sessionNumber,
        generatedAt
    ) {
        const timestamp = generatedAt
            .replace(/[-:.TZ]/g, "")
            .slice(0, 14);

        return [
            "TMS",
            "EXECUTION-AUTHORIZATION",
            String(sessionNumber).padStart(3, "0"),
            timestamp
        ].join("-");
    }

    function validateVerificationPackage(
        verification
    ) {
        const checks = [];

        let verificationValidation = {
            accepted: false,
            checks: []
        };

        if (isPlainObject(verification)) {
            verificationValidation =
                window.TMSExecutionVerificationEngine
                    .validateVerification(
                        verification
                    );
        }

        checks.push(buildCheck(
            "Verification package exists",
            isPlainObject(verification),
            "An Execution Verification package is required."
        ));

        checks.push(buildCheck(
            "Verification package accepted",
            Boolean(
                verification &&
                verification.accepted
            ),
            "The Execution Verification package must be accepted."
        ));

        checks.push(buildCheck(
            "Verification validation accepted",
            Boolean(
                verificationValidation &&
                verificationValidation.accepted
            ),
            "The Execution Verification package must pass validation."
        ));

        checks.push(buildCheck(
            "Expected verified document count",
            Boolean(verification) &&
                verification.verifiedDocumentCount ===
                    EXPECTED_DOCUMENTS.length,
            "Exactly five permanent document executions must be verified."
        ));

        checks.push(buildCheck(
            "Execution order verified",
            Boolean(verification) &&
                verification.executionOrderVerified === true,
            "The controlled execution order must be verified."
        ));

        checks.push(buildCheck(
            "Document set verified",
            Boolean(verification) &&
                verification.documentSetVerified === true,
            "The unique five-document permanent set must be verified."
        ));

        checks.push(buildCheck(
            "Checksum presence verified",
            Boolean(verification) &&
                verification.checksumPresenceVerified === true,
            "Original and proposed checksum presence must be verified."
        ));

        checks.push(buildCheck(
            "Simulation completion verified",
            Boolean(verification) &&
                verification.simulationCompletionVerified === true,
            "The Permanent File Writer simulation must be verified as complete."
        ));

        checks.push(buildCheck(
            "Non-destructive state verified",
            Boolean(verification) &&
                verification.nonDestructiveStateVerified === true,
            "The verification package must confirm that no permanent files were changed."
        ));

        checks.push(buildCheck(
            "Independent verification passed",
            Boolean(verification) &&
                verification.verificationPassed === true,
            "Independent execution verification must pass."
        ));

        checks.push(buildCheck(
            "Execution remains unauthorized",
            Boolean(verification) &&
                verification.executionAuthorized === false,
            "Execution authorization must remain locked before authorization review."
        ));

        checks.push(buildCheck(
            "Write remains unauthorized",
            Boolean(verification) &&
                verification.writeAuthorized === false,
            "Permanent writing must remain unauthorized."
        ));

        checks.push(buildCheck(
            "Rollback remains unauthorized",
            Boolean(verification) &&
                verification.rollbackAuthorized === false,
            "Rollback execution must remain unauthorized."
        ));

        checks.push(buildCheck(
            "No actual writes attempted",
            Boolean(verification) &&
                verification.actualWritesAttempted === false,
            "No actual permanent file write may have been attempted."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(verification) &&
                verification.permanentWritesExecuted === false,
            "No permanent file may have been modified."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(verification) &&
                verification.restoreExecuted === false,
            "No rollback restoration may have occurred."
        ));

        const verificationSteps =
            verification &&
            Array.isArray(
                verification.verificationSteps
            )
                ? verification.verificationSteps
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
            "The verification package must contain the unique five-document permanent set."
        ));

        const verificationStepsValid =
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
            verificationStepsValid,
            "Every verified document must preserve the approved order, checksums, and non-destructive safety state."
        ));

        return {
            accepted: checks.every(function (check) {
                return check.passed;
            }),
            checks: checks,
            verificationValidation:
                verificationValidation
        };
    }

    function buildAuthorizationEntry(
        verificationStep,
        index
    ) {
        return {
            sequence: index + 1,
            order: verificationStep.order,
            documentId:
                verificationStep.documentId,
            updateMode:
                verificationStep.updateMode,

            targetPath:
                verificationStep.targetPath,
            backupPath:
                verificationStep.backupPath,
            proposedCopyPath:
                verificationStep.proposedCopyPath,

            originalChecksum:
                verificationStep.originalChecksum,
            proposedChecksum:
                verificationStep.proposedChecksum,

            sourceVerificationStatus:
                verificationStep.verificationStatus,

            prerequisiteChecks: [
                "Document simulation completed",
                "Independent verification passed",
                "Execution order verified",
                "Original checksum present",
                "Proposed checksum present",
                "No actual write attempted",
                "No permanent write executed",
                "No restore executed"
            ],

            prerequisiteStatus: "Passed",

            authorizationEligibility:
                "Eligible for Human Authorization Review",

            authorizationDecision:
                "Not Granted",

            authorizationStatus:
                "Locked — Awaiting Separate Human Authorization",

            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,

            actualWriteAttempted: false,
            permanentWriteExecuted: false,
            restoreExecuted: false
        };
    }

    function rejectedAuthorization(
        message,
        verification,
        validation
    ) {
        const snapshot =
            window.TMSSessionContext.getSnapshot();

        const generatedAt =
            new Date().toISOString();

        return deepFreeze({
            authorizationType:
                AUTHORIZATION_TYPE,

            engineVersion:
                ENGINE_VERSION,

            authorizationId:
                createAuthorizationId(
                    snapshot.sessionNumber,
                    generatedAt
                ),

            generatedAt:
                generatedAt,

            sessionNumber:
                snapshot.sessionNumber,

            accepted: false,
            message: message,

            sourceVerificationAccepted:
                Boolean(
                    verification &&
                    verification.accepted
                ),

            sourceVerificationId:
                verification
                    ? verification.verificationId
                    : null,

            sourceVerificationStatus:
                verification
                    ? verification.verificationStatus
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

            authorizationDocumentCount: 0,
            authorizationEntries: [],

            prerequisitesVerified: false,
            authorizationEligible: false,

            authorizationGranted: false,
            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,

            actualWritesAttempted: false,
            permanentWritesExecuted: false,
            restoreExecuted: false,

            authorizationStatus: "Rejected",

            requiredNextAction:
                "Correct the failed execution verification or authorization prerequisite checks.",

            reviewRequired: true
        });
    }

    async function generateAuthorization(
        verification
    ) {
        const sourceVerification =
            verification ||
            await window
                .TMSExecutionVerificationEngine
                .generateVerification();

        const validation =
            validateVerificationPackage(
                sourceVerification
            );

        if (!validation.accepted) {
            lastAuthorization =
                rejectedAuthorization(
                    "The Execution Verification package failed authorization prerequisite validation.",
                    sourceVerification,
                    validation
                );

            return lastAuthorization;
        }

        const orderedSteps =
            clone(
                sourceVerification
                    .verificationSteps
            ).sort(function (
                first,
                second
            ) {
                return Number(first.sequence) -
                    Number(second.sequence);
            });

        const authorizationEntries =
            orderedSteps.map(function (
                verificationStep,
                index
            ) {
                return buildAuthorizationEntry(
                    verificationStep,
                    index
                );
            });

        const allEligible =
            authorizationEntries.every(function (
                entry
            ) {
                return (
                    entry.prerequisiteStatus ===
                        "Passed" &&
                    entry.authorizationEligibility ===
                        "Eligible for Human Authorization Review" &&
                    entry.authorizationDecision ===
                        "Not Granted" &&
                    entry.executionAuthorized ===
                        false &&
                    entry.writeAuthorized ===
                        false &&
                    entry.rollbackAuthorized ===
                        false &&
                    entry.actualWriteAttempted ===
                        false &&
                    entry.permanentWriteExecuted ===
                        false &&
                    entry.restoreExecuted ===
                        false
                );
            });

        if (!allEligible) {
            lastAuthorization =
                rejectedAuthorization(
                    "One or more permanent document authorization entries failed eligibility validation.",
                    sourceVerification,
                    validation
                );

            return lastAuthorization;
        }

        const snapshot =
            window.TMSSessionContext.getSnapshot();

        const generatedAt =
            new Date().toISOString();

        lastAuthorization =
            deepFreeze({
                authorizationType:
                    AUTHORIZATION_TYPE,

                engineVersion:
                    ENGINE_VERSION,

                authorizationId:
                    createAuthorizationId(
                        snapshot.sessionNumber,
                        generatedAt
                    ),

                generatedAt:
                    generatedAt,

                sessionNumber:
                    snapshot.sessionNumber,

                accepted: true,

                message:
                    "All five permanent document executions are eligible for human authorization review. No execution or write authority was granted.",

                sourceVerificationAccepted:
                    true,

                sourceVerificationId:
                    sourceVerification
                        .verificationId,

                sourceVerificationStatus:
                    sourceVerification
                        .verificationStatus,

                sourceVerificationEngineVersion:
                    sourceVerification
                        .engineVersion,

                sourceVerificationGeneratedAt:
                    sourceVerification
                        .generatedAt,

                sourceSimulationId:
                    sourceVerification
                        .sourceSimulationId,

                sourceExecutionPlanId:
                    sourceVerification
                        .sourceExecutionPlanId,

                sourceCaptureId:
                    sourceVerification
                        .sourceCaptureId,

                sourceRollbackPackageId:
                    sourceVerification
                        .sourceRollbackPackageId,

                validationAccepted: true,

                validationChecks:
                    validation.checks,

                expectedDocumentCount:
                    EXPECTED_DOCUMENTS.length,

                authorizationDocumentCount:
                    authorizationEntries.length,

                authorizationEntries:
                    authorizationEntries,

                prerequisitesVerified: true,
                authorizationEligible: true,

                authorizationGranted: false,
                executionAuthorized: false,
                writeAuthorized: false,
                rollbackAuthorized: false,

                actualWritesAttempted: false,
                permanentWritesExecuted: false,
                restoreExecuted: false,

                authorizationStatus:
                    "Eligible — Authorization Locked",

                requiredNextAction:
                    "Submit this eligibility package to a future separate human execution authorization gate.",

                reviewRequired: true,

                reviewChoices: [
                    "Approve Authorization Package Structure",
                    "Revise Session",
                    "Cancel Authorization Package"
                ]
            });

        return lastAuthorization;
    }

    function validateAuthorization(
        authorization
    ) {
        const current =
            authorization ||
            lastAuthorization;

        const checks = [];

        checks.push(buildCheck(
            "Authorization package exists",
            isPlainObject(current),
            "An Execution Authorization package is required."
        ));

        checks.push(buildCheck(
            "Authorization package accepted",
            Boolean(
                current &&
                current.accepted
            ),
            "The Execution Authorization package must be accepted."
        ));

        checks.push(buildCheck(
            "Expected authorization document count",
            Boolean(current) &&
                current.authorizationDocumentCount ===
                    EXPECTED_DOCUMENTS.length,
            "Exactly five permanent documents must be included."
        ));

        checks.push(buildCheck(
            "Prerequisites verified",
            Boolean(current) &&
                current.prerequisitesVerified === true,
            "All execution authorization prerequisites must be verified."
        ));

        checks.push(buildCheck(
            "Authorization eligibility confirmed",
            Boolean(current) &&
                current.authorizationEligible === true,
            "The package must be eligible for human authorization review."
        ));

        checks.push(buildCheck(
            "Authorization remains ungranted",
            Boolean(current) &&
                current.authorizationGranted === false,
            "Version 1.0.0 must not grant real execution authorization."
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
            "No actual permanent file write may be attempted."
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
            Array.isArray(
                current.authorizationEntries
            )
                ? current.authorizationEntries
                : [];

        const documentIds =
            entries.map(function (entry) {
                return entry.documentId;
            });

        const documentSetValid =
            entries.length ===
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
            "Expected authorization document set",
            documentSetValid,
            "The authorization package must contain the unique five-document permanent set."
        ));

        const entriesValid =
            entries.length ===
                EXPECTED_DOCUMENTS.length &&
            entries.every(function (
                entry,
                index
            ) {
                return (
                    entry.sequence === index + 1 &&
                    entry.documentId ===
                        EXPECTED_DOCUMENTS[index] &&
                    entry.prerequisiteStatus ===
                        "Passed" &&
                    entry.authorizationEligibility ===
                        "Eligible for Human Authorization Review" &&
                    entry.authorizationDecision ===
                        "Not Granted" &&
                    entry.authorizationStatus ===
                        "Locked — Awaiting Separate Human Authorization" &&
                    typeof entry.originalChecksum ===
                        "string" &&
                    entry.originalChecksum.length > 0 &&
                    typeof entry.proposedChecksum ===
                        "string" &&
                    entry.proposedChecksum.length > 0 &&
                    entry.executionAuthorized ===
                        false &&
                    entry.writeAuthorized ===
                        false &&
                    entry.rollbackAuthorized ===
                        false &&
                    entry.actualWriteAttempted ===
                        false &&
                    entry.permanentWriteExecuted ===
                        false &&
                    entry.restoreExecuted === false
                );
            });

        checks.push(buildCheck(
            "Authorization entries valid",
            entriesValid,
            "Every authorization entry must be eligible, complete, checksum-backed, and authorization-locked."
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

    async function formatAuthorizationReport(
        authorization
    ) {
        const current =
            authorization ||
            await generateAuthorization();

        const lines = [
            "TMS-OS PERMANENT DOCUMENTATION EXECUTION AUTHORIZATION",
            "Authorization ID: " +
                current.authorizationId,
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
            "Authorization Status: " +
                current.authorizationStatus,
            "Authorization Documents: " +
                current.authorizationDocumentCount,
            "Prerequisites Verified: " +
                (
                    current.prerequisitesVerified
                        ? "YES"
                        : "NO"
                ),
            "Authorization Eligible: " +
                (
                    current.authorizationEligible
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
            current.authorizationEntries || []
        ).forEach(function (entry) {
            lines.push(
                entry.sequence +
                " | " +
                entry.documentId +
                " | " +
                entry.authorizationEligibility +
                " | AUTHORIZATION LOCKED"
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

    function getLastAuthorization() {
        return lastAuthorization;
    }

    function getExpectedDocuments() {
        return EXPECTED_DOCUMENTS.slice();
    }

    window.TMSExecutionAuthorizationEngine =
        Object.freeze({
            engineVersion:
                ENGINE_VERSION,

            generateAuthorization:
                generateAuthorization,

            validateAuthorization:
                validateAuthorization,

            formatAuthorizationReport:
                formatAuthorizationReport,

            getLastAuthorization:
                getLastAuthorization,

            getExpectedDocuments:
                getExpectedDocuments
        });

    console.log(
        "Execution Authorization Engine v" +
        ENGINE_VERSION +
        " initialized for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());