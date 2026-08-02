/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 101 — Human Controlled Execution Authorization Engine v1.1.0
File: js/session/human-controlled-execution-authorization-engine.js

Purpose:
Consume an accepted six-document Execution Authorization package, record an
explicit human authorization decision, separate write-required documents from
no-write-required documents, and produce the immutable authorization record
required by the Permanent Write Execution Engine v2.1.0.

This engine remains non-destructive. It does not write, replace, rename, move,
delete, restore, download, or otherwise modify any permanent file.

The record may preserve human-approved source authorization intent for later
Disabled Mode manifest planning, while no file operation is performed here.
*/

(function () {
    "use strict";

    const ENGINE_NAME =
        "TMSHumanControlledExecutionAuthorizationEngine";

    const ENGINE_VERSION = "1.1.0";

    const AUTHORIZATION_MODE = "Disabled";

    const AUTHORIZATION_TYPE =
        "TMS-OS Human Controlled Execution Authorization Record";

    const APPROVE_DECISION =
        "Approve Execution Authorization";

    const ALLOWED_DECISIONS = Object.freeze([
        APPROVE_DECISION,
        "Reject Execution Authorization"
    ]);

    const EXPECTED_DOCUMENTS = Object.freeze([
        "WS-HIST-001",
        "STATE-001",
        "DOC-STATE-001",
        "DEC-LOG-001",
        "MILE-HIST-001",
        "WORKSPACE-SNAPSHOT-HISTORY-001"
    ]);

    let lastAuthorizationRecord = null;

    if (
        !window.TMSSessionContext ||
        !window.TMSExecutionAuthorizationEngine
    ) {
        console.error(
            "Human Controlled Execution Authorization Engine could not initialize because its dependencies are unavailable."
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

    function hasText(value) {
        return typeof value === "string" &&
            value.trim().length > 0;
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
        const timestamp =
            generatedAt
                .replace(/[-:.TZ]/g, "")
                .slice(0, 14);

        return [
            "TMS",
            "HUMAN-CONTROLLED-EXECUTION-AUTHORIZATION",
            String(sessionNumber).padStart(3, "0"),
            timestamp
        ].join("-");
    }

    function normalizeOfficer(officer) {
        return {
            name:
                hasText(officer && officer.name)
                    ? officer.name.trim()
                    : (
                        hasText(
                            officer &&
                            officer.authorizationOfficerName
                        )
                            ? officer.authorizationOfficerName.trim()
                            : ""
                    ),

            id:
                hasText(officer && officer.id)
                    ? officer.id.trim()
                    : (
                        hasText(
                            officer &&
                            officer.authorizationOfficerId
                        )
                            ? officer.authorizationOfficerId.trim()
                            : ""
                    ),

            role:
                hasText(officer && officer.role)
                    ? officer.role.trim()
                    : (
                        hasText(
                            officer &&
                            officer.authorizationOfficerRole
                        )
                            ? officer.authorizationOfficerRole.trim()
                            : ""
                    )
        };
    }

    function validateSourceEntry(entry, index) {
        const baseValid =
            isPlainObject(entry) &&
            entry.sequence === index + 1 &&
            entry.documentId ===
                EXPECTED_DOCUMENTS[index] &&
            entry.prerequisiteStatus ===
                "Passed" &&
            entry.authorizationDecision ===
                "Not Granted" &&
            typeof entry.originalChecksum ===
                "string" &&
            entry.originalChecksum.length > 0 &&
            typeof entry.proposedChecksum ===
                "string" &&
            entry.proposedChecksum.length > 0 &&
            typeof entry.documentChanged ===
                "boolean" &&
            typeof entry.permanentWriteRequired ===
                "boolean" &&
            typeof entry.rollbackRequiredBeforeWrite ===
                "boolean" &&
            entry.executionAuthorized === false &&
            entry.writeAuthorized === false &&
            entry.rollbackAuthorized === false &&
            entry.actualWriteAttempted === false &&
            entry.permanentWriteExecuted === false &&
            entry.restoreExecuted === false &&
            typeof entry.targetPath === "string" &&
            entry.targetPath.length > 0;

        if (!baseValid) {
            return false;
        }

        if (entry.permanentWriteRequired === true) {
            return (
                entry.documentChanged === true &&
                entry.rollbackRequiredBeforeWrite === true &&
                entry.excludedFromExecution === false &&
                entry.authorizationEligibility ===
                    "Eligible for Human Authorization Review" &&
                entry.authorizationStatus ===
                    "Locked — Awaiting Separate Human Authorization" &&
                typeof entry.backupPath === "string" &&
                entry.backupPath.length > 0 &&
                typeof entry.proposedCopyPath === "string" &&
                entry.proposedCopyPath.length > 0
            );
        }

        return (
            entry.documentChanged === false &&
            entry.rollbackRequiredBeforeWrite === false &&
            entry.excludedFromExecution === true &&
            entry.authorizationEligibility ===
                "No Authorization Required" &&
            entry.authorizationStatus ===
                "Excluded — No Write Required"
        );
    }

    function validateExecutionAuthorizationPackage(
        authorization
    ) {
        const checks = [];

        let sourceValidation = {
            accepted: false,
            checks: []
        };

        if (isPlainObject(authorization)) {
            sourceValidation =
                window.TMSExecutionAuthorizationEngine
                    .validateAuthorization(
                        authorization
                    );
        }

        const entries =
            authorization &&
            Array.isArray(
                authorization.authorizationEntries
            )
                ? authorization.authorizationEntries
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
                return documentIds.includes(documentId);
            }) &&
            new Set(documentIds).size ===
                EXPECTED_DOCUMENTS.length;

        const entriesValid =
            entries.length ===
                EXPECTED_DOCUMENTS.length &&
            entries.every(function (
                entry,
                index
            ) {
                return validateSourceEntry(
                    entry,
                    index
                );
            });

        const writeRequiredCount =
            entries.filter(function (entry) {
                return (
                    entry.permanentWriteRequired ===
                    true
                );
            }).length;

        const noWriteRequiredCount =
            entries.filter(function (entry) {
                return (
                    entry.permanentWriteRequired ===
                    false
                );
            }).length;

        checks.push(buildCheck(
            "Execution authorization package exists",
            isPlainObject(authorization),
            "An Execution Authorization package is required."
        ));

        checks.push(buildCheck(
            "Execution authorization package accepted",
            Boolean(
                authorization &&
                authorization.accepted
            ),
            "The source Execution Authorization package must be accepted."
        ));

        checks.push(buildCheck(
            "Execution authorization validation accepted",
            Boolean(
                sourceValidation &&
                sourceValidation.accepted
            ),
            "The source Execution Authorization package must pass validation."
        ));

        checks.push(buildCheck(
            "Expected authorization document count",
            Boolean(authorization) &&
                authorization.authorizationDocumentCount ===
                    EXPECTED_DOCUMENTS.length,
            "Exactly six permanent documents must be represented."
        ));

        checks.push(buildCheck(
            "Expected authorization document set",
            documentSetValid,
            "The source package must contain the unique six-document permanent set."
        ));

        checks.push(buildCheck(
            "Authorization entries valid",
            entriesValid,
            "Every source authorization entry must preserve order, checksums, write decisions, and locked operational controls."
        ));

        checks.push(buildCheck(
            "Authorization decision counts valid",
            Boolean(authorization) &&
                authorization.writeRequiredDocumentCount ===
                    writeRequiredCount &&
                authorization.noWriteRequiredDocumentCount ===
                    noWriteRequiredCount &&
                writeRequiredCount +
                    noWriteRequiredCount ===
                    EXPECTED_DOCUMENTS.length,
            "The source authorization decision counts must match all six entries."
        ));

        checks.push(buildCheck(
            "Source authorization remains ungranted",
            Boolean(authorization) &&
                authorization.authorizationGranted ===
                    false,
            "The source eligibility package must not have granted human authorization."
        ));

        checks.push(buildCheck(
            "Source execution remains unauthorized",
            Boolean(authorization) &&
                authorization.executionAuthorized ===
                    false,
            "The source package must remain operationally locked."
        ));

        checks.push(buildCheck(
            "Source write remains unauthorized",
            Boolean(authorization) &&
                authorization.writeAuthorized ===
                    false,
            "The source package must not authorize permanent writing."
        ));

        checks.push(buildCheck(
            "Source rollback remains unauthorized",
            Boolean(authorization) &&
                authorization.rollbackAuthorized ===
                    false,
            "The source package must not authorize rollback execution."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(authorization) &&
                authorization.permanentWritesExecuted ===
                    false,
            "No permanent file may have been modified."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(authorization) &&
                authorization.restoreExecuted ===
                    false,
            "No rollback restoration may have occurred."
        ));

        return {
            accepted:
                checks.every(function (check) {
                    return check.passed;
                }),

            checks:
                checks,

            sourceValidation:
                sourceValidation
        };
    }

    function buildAuthorizedDocument(
        entry
    ) {
        return {
            sequence:
                entry.sequence,

            order:
                entry.order,

            documentId:
                entry.documentId,

            updateMode:
                entry.updateMode,

            documentChanged:
                true,

            permanentWriteRequired:
                true,

            rollbackRequiredBeforeWrite:
                true,

            excludedFromExecution:
                false,

            executionAction:
                "Replace complete permanent JSON file",

            targetPath:
                entry.targetPath,

            backupPath:
                entry.backupPath,

            proposedCopyPath:
                entry.proposedCopyPath,

            originalChecksum:
                entry.originalChecksum,

            proposedChecksum:
                entry.proposedChecksum,

            authorizationStatus:
                "Human Authorized — Awaiting Execution",

            executionAuthorized:
                true,

            writeAuthorized:
                true,

            rollbackAuthorized:
                true,

            permanentWriteExecuted:
                false,

            restoreExecuted:
                false
        };
    }

    function buildExcludedDocument(
        entry
    ) {
        return {
            sequence:
                entry.sequence,

            order:
                entry.order,

            documentId:
                entry.documentId,

            updateMode:
                entry.updateMode,

            documentChanged:
                false,

            permanentWriteRequired:
                false,

            rollbackRequiredBeforeWrite:
                false,

            excludedFromExecution:
                true,

            executionAction:
                "No Write Required",

            targetPath:
                entry.targetPath,

            backupPath:
                null,

            proposedCopyPath:
                null,

            originalChecksum:
                entry.originalChecksum,

            proposedChecksum:
                entry.proposedChecksum,

            authorizationStatus:
                "Excluded — No Write Required",

            executionAuthorized:
                false,

            writeAuthorized:
                false,

            rollbackAuthorized:
                false,

            permanentWriteExecuted:
                false,

            restoreExecuted:
                false
        };
    }

    function rejectedAuthorizationRecord(
        message,
        sourceAuthorization,
        validation,
        officer,
        humanDecision
    ) {
        const snapshot =
            window.TMSSessionContext
                .getSnapshot();

        const generatedAt =
            new Date().toISOString();

        return deepFreeze({
            authorizationType:
                AUTHORIZATION_TYPE,

            engineName:
                ENGINE_NAME,

            engineVersion:
                ENGINE_VERSION,

            authorizationMode:
                AUTHORIZATION_MODE,

            authorizationId:
                createAuthorizationId(
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

            sourceAuthorizationAccepted:
                Boolean(
                    sourceAuthorization &&
                    sourceAuthorization.accepted
                ),

            sourceAuthorizationId:
                sourceAuthorization
                    ? sourceAuthorization.authorizationId
                    : null,

            sourceAuthorizationStatus:
                sourceAuthorization
                    ? sourceAuthorization.authorizationStatus
                    : "Unavailable",

            sourceExecutionPlanId:
                sourceAuthorization
                    ? sourceAuthorization.sourceExecutionPlanId
                    : null,

            validationAccepted:
                Boolean(
                    validation &&
                    validation.accepted
                ),

            validationChecks:
                validation
                    ? validation.checks
                    : [],

            authorizationOfficerName:
                officer.name,

            authorizationOfficerId:
                officer.id,

            authorizationOfficerRole:
                officer.role,

            humanDecision:
                humanDecision || "Unavailable",

            humanApprovalSatisfied:
                false,

            expectedDocumentCount:
                EXPECTED_DOCUMENTS.length,

            plannedDocumentCount:
                0,

            authorizedDocumentCount:
                0,

            excludedDocumentCount:
                0,

            authorizedDocuments:
                [],

            excludedDocuments:
                [],

            executionAuthorized:
                false,

            writeAuthorized:
                false,

            rollbackAuthorized:
                false,

            permanentWritesExecuted:
                false,

            restoreExecuted:
                false,

            authorizationStatus:
                "Rejected",

            requiredNextAction:
                "Correct the failed source, officer, decision, or document authorization checks.",

            reviewRequired:
                true
        });
    }

    function createAuthorizationRecord(
        configuration
    ) {
        const options =
            isPlainObject(configuration)
                ? configuration
                : {};

        const sourceAuthorization =
            options.sourceAuthorization ||
            window.TMSExecutionAuthorizationEngine
                .getLastAuthorization();

        const humanDecision =
            hasText(options.humanDecision)
                ? options.humanDecision.trim()
                : "";

        const officer =
            normalizeOfficer(
                options.authorizationOfficer ||
                options.officer
            );

        const validation =
            validateExecutionAuthorizationPackage(
                sourceAuthorization
            );

        const officerValid =
            hasText(officer.name) &&
            hasText(officer.id) &&
            hasText(officer.role);

        const decisionValid =
            ALLOWED_DECISIONS.includes(
                humanDecision
            );

        const approvalRequested =
            humanDecision ===
                APPROVE_DECISION;

        if (
            !validation.accepted ||
            !officerValid ||
            !decisionValid ||
            !approvalRequested
        ) {
            lastAuthorizationRecord =
                rejectedAuthorizationRecord(
                    "The Human Controlled Execution Authorization Record failed prerequisite validation or did not receive the exact approval decision.",
                    sourceAuthorization,
                    validation,
                    officer,
                    humanDecision
                );

            return lastAuthorizationRecord;
        }

        const orderedEntries =
            clone(
                sourceAuthorization
                    .authorizationEntries
            ).sort(function (
                first,
                second
            ) {
                return (
                    Number(first.sequence) -
                    Number(second.sequence)
                );
            });

        const authorizedDocuments =
            orderedEntries
                .filter(function (entry) {
                    return (
                        entry
                            .permanentWriteRequired ===
                        true
                    );
                })
                .map(buildAuthorizedDocument);

        const excludedDocuments =
            orderedEntries
                .filter(function (entry) {
                    return (
                        entry
                            .permanentWriteRequired ===
                        false
                    );
                })
                .map(buildExcludedDocument);

        const plannedDocumentCount =
            authorizedDocuments.length +
            excludedDocuments.length;

        const documentIds =
            authorizedDocuments
                .concat(excludedDocuments)
                .map(function (document) {
                    return document.documentId;
                });

        const documentSetValid =
            plannedDocumentCount ===
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

        if (!documentSetValid) {
            lastAuthorizationRecord =
                rejectedAuthorizationRecord(
                    "The generated human authorization document sets did not preserve the unique six-document contract.",
                    sourceAuthorization,
                    validation,
                    officer,
                    humanDecision
                );

            return lastAuthorizationRecord;
        }

        const snapshot =
            window.TMSSessionContext
                .getSnapshot();

        const generatedAt =
            new Date().toISOString();

        lastAuthorizationRecord =
            deepFreeze({
                authorizationType:
                    AUTHORIZATION_TYPE,

                engineName:
                    ENGINE_NAME,

                engineVersion:
                    ENGINE_VERSION,

                authorizationMode:
                    AUTHORIZATION_MODE,

                authorizationId:
                    createAuthorizationId(
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
                    "Human execution authorization was recorded for the six-document controlled package. " +
                    authorizedDocuments.length +
                    " write-required document(s) were marked as human-authorized source inputs for Disabled Mode manifest planning, and " +
                    excludedDocuments.length +
                    " no-write document(s) remained excluded. No permanent files were changed.",

                sourceAuthorizationAccepted:
                    true,

                sourceAuthorizationId:
                    sourceAuthorization
                        .authorizationId,

                sourceAuthorizationStatus:
                    sourceAuthorization
                        .authorizationStatus,

                sourceAuthorizationEngineVersion:
                    sourceAuthorization
                        .engineVersion,

                sourceAuthorizationGeneratedAt:
                    sourceAuthorization
                        .generatedAt,

                sourceVerificationId:
                    sourceAuthorization
                        .sourceVerificationId,

                sourceSimulationId:
                    sourceAuthorization
                        .sourceSimulationId,

                sourceExecutionPlanId:
                    sourceAuthorization
                        .sourceExecutionPlanId,

                sourceCaptureId:
                    sourceAuthorization
                        .sourceCaptureId,

                sourceRollbackPackageId:
                    sourceAuthorization
                        .sourceRollbackPackageId,

                validationAccepted:
                    true,

                validationChecks:
                    validation.checks,

                authorizationOfficerName:
                    officer.name,

                authorizationOfficerId:
                    officer.id,

                authorizationOfficerRole:
                    officer.role,

                humanDecision:
                    humanDecision,

                humanApprovalSatisfied:
                    true,

                expectedDocumentCount:
                    EXPECTED_DOCUMENTS.length,

                plannedDocumentCount:
                    plannedDocumentCount,

                authorizedDocumentCount:
                    authorizedDocuments.length,

                excludedDocumentCount:
                    excludedDocuments.length,

                authorizedDocuments:
                    authorizedDocuments,

                excludedDocuments:
                    excludedDocuments,

                executionAuthorized:
                    true,

                writeAuthorized:
                    authorizedDocuments.length > 0,

                rollbackAuthorized:
                    authorizedDocuments.length > 0,

                permanentWritesExecuted:
                    false,

                restoreExecuted:
                    false,

                authorizationStatus:
                    "Human Authorized — Execution Manifest Pending",

                requiredNextAction:
                    "Generate the Permanent Write Execution Manifest in Disabled Mode.",

                reviewRequired:
                    true,

                reviewChoices: [
                    "Approve Authorization Record Structure",
                    "Revise Session",
                    "Cancel Authorization Record"
                ]
            });

        return lastAuthorizationRecord;
    }

    function validateAuthorizationRecord(
        authorization
    ) {
        const current =
            authorization ||
            lastAuthorizationRecord;

        const checks = [];

        const authorizedDocuments =
            current &&
            Array.isArray(
                current.authorizedDocuments
            )
                ? current.authorizedDocuments
                : [];

        const excludedDocuments =
            current &&
            Array.isArray(
                current.excludedDocuments
            )
                ? current.excludedDocuments
                : [];

        const allDocuments =
            authorizedDocuments.concat(
                excludedDocuments
            );

        const documentIds =
            allDocuments.map(function (
                document
            ) {
                return document.documentId;
            });

        const documentSetValid =
            allDocuments.length ===
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

        const sequenceValid =
            allDocuments
                .slice()
                .sort(function (
                    first,
                    second
                ) {
                    return (
                        Number(first.sequence) -
                        Number(second.sequence)
                    );
                })
                .every(function (
                    document,
                    index
                ) {
                    return (
                        document.sequence ===
                            index + 1 &&
                        document.documentId ===
                            EXPECTED_DOCUMENTS[index]
                    );
                });

        const authorizedDocumentsValid =
            authorizedDocuments.every(
                function (document) {
                    return (
                        document.documentChanged ===
                            true &&
                        document.permanentWriteRequired ===
                            true &&
                        document.rollbackRequiredBeforeWrite ===
                            true &&
                        document.excludedFromExecution ===
                            false &&
                        document.executionAction ===
                            "Replace complete permanent JSON file" &&
                        document.authorizationStatus ===
                            "Human Authorized — Awaiting Execution" &&
                        document.executionAuthorized ===
                            true &&
                        document.writeAuthorized ===
                            true &&
                        document.rollbackAuthorized ===
                            true &&
                        document.permanentWriteExecuted ===
                            false &&
                        document.restoreExecuted ===
                            false &&
                        typeof document.targetPath ===
                            "string" &&
                        document.targetPath.length > 0 &&
                        typeof document.backupPath ===
                            "string" &&
                        document.backupPath.length > 0 &&
                        typeof document.proposedCopyPath ===
                            "string" &&
                        document.proposedCopyPath.length > 0 &&
                        typeof document.originalChecksum ===
                            "string" &&
                        document.originalChecksum.length > 0 &&
                        typeof document.proposedChecksum ===
                            "string" &&
                        document.proposedChecksum.length > 0
                    );
                }
            );

        const excludedDocumentsValid =
            excludedDocuments.every(
                function (document) {
                    return (
                        document.documentChanged ===
                            false &&
                        document.permanentWriteRequired ===
                            false &&
                        document.rollbackRequiredBeforeWrite ===
                            false &&
                        document.excludedFromExecution ===
                            true &&
                        document.executionAction ===
                            "No Write Required" &&
                        document.authorizationStatus ===
                            "Excluded — No Write Required" &&
                        document.executionAuthorized ===
                            false &&
                        document.writeAuthorized ===
                            false &&
                        document.rollbackAuthorized ===
                            false &&
                        document.permanentWriteExecuted ===
                            false &&
                        document.restoreExecuted ===
                            false &&
                        typeof document.targetPath ===
                            "string" &&
                        document.targetPath.length > 0 &&
                        document.backupPath ===
                            null &&
                        document.proposedCopyPath ===
                            null &&
                        typeof document.originalChecksum ===
                            "string" &&
                        document.originalChecksum.length > 0 &&
                        typeof document.proposedChecksum ===
                            "string" &&
                        document.proposedChecksum.length > 0
                    );
                }
            );

        checks.push(buildCheck(
            "Authorization record exists",
            isPlainObject(current),
            "A Human Controlled Execution Authorization Record is required."
        ));

        checks.push(buildCheck(
            "Authorization record accepted",
            Boolean(
                current &&
                current.accepted
            ),
            "The authorization record must be accepted."
        ));

        checks.push(buildCheck(
            "Authorization mode is disabled",
            Boolean(current) &&
                current.authorizationMode ===
                    AUTHORIZATION_MODE,
            "The engine must remain in Disabled Mode."
        ));

        checks.push(buildCheck(
            "Exact human approval satisfied",
            Boolean(current) &&
                current.humanApprovalSatisfied ===
                    true &&
                current.humanDecision ===
                    APPROVE_DECISION,
            "The exact human approval decision is required."
        ));

        checks.push(buildCheck(
            "Authorization officer identity valid",
            Boolean(current) &&
                hasText(
                    current.authorizationOfficerName
                ) &&
                hasText(
                    current.authorizationOfficerId
                ) &&
                hasText(
                    current.authorizationOfficerRole
                ),
            "A complete authorization officer identity is required."
        ));

        checks.push(buildCheck(
            "Expected planned document count",
            Boolean(current) &&
                current.plannedDocumentCount ===
                    EXPECTED_DOCUMENTS.length,
            "Exactly six permanent documents must be represented."
        ));

        checks.push(buildCheck(
            "Authorization counts valid",
            Boolean(current) &&
                current.authorizedDocumentCount ===
                    authorizedDocuments.length &&
                current.excludedDocumentCount ===
                    excludedDocuments.length &&
                current.plannedDocumentCount ===
                    allDocuments.length,
            "Authorized and excluded document counts must match the record."
        ));

        checks.push(buildCheck(
            "Expected authorization document set",
            documentSetValid,
            "The record must contain the unique six-document permanent set."
        ));

        checks.push(buildCheck(
            "Expected document sequence",
            sequenceValid,
            "The six permanent documents must retain their approved sequence."
        ));

        checks.push(buildCheck(
            "Authorized documents valid",
            authorizedDocumentsValid,
            "Every authorized document must be checksum-backed, rollback-protected, and human-authorized."
        ));

        checks.push(buildCheck(
            "Excluded documents valid",
            excludedDocumentsValid,
            "Every no-write document must remain complete, excluded, and unauthorized."
        ));

        checks.push(buildCheck(
            "Execution authorization valid",
            Boolean(current) &&
                current.executionAuthorized ===
                    true,
            "The accepted human authorization record must authorize controlled source execution."
        ));

        checks.push(buildCheck(
            "Write authorization valid",
            Boolean(current) &&
                current.writeAuthorized ===
                    (authorizedDocuments.length > 0),
            "Write authorization must match whether write-required documents exist."
        ));

        checks.push(buildCheck(
            "Rollback authorization valid",
            Boolean(current) &&
                current.rollbackAuthorized ===
                    (authorizedDocuments.length > 0),
            "Rollback authorization must accompany authorized writes."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(current) &&
                current.permanentWritesExecuted ===
                    false,
            "No permanent write may occur in this engine."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(current) &&
                current.restoreExecuted ===
                    false,
            "No rollback restoration may occur in this engine."
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

    function getLastAuthorizationRecord() {
        return lastAuthorizationRecord;
    }

    function getExpectedDocuments() {
        return EXPECTED_DOCUMENTS.slice();
    }

    function getEngineInfo() {
        return {
            engineName:
                ENGINE_NAME,

            engineVersion:
                ENGINE_VERSION,

            authorizationMode:
                AUTHORIZATION_MODE,

            expectedDocumentCount:
                EXPECTED_DOCUMENTS.length,

            expectedDocuments:
                EXPECTED_DOCUMENTS.slice(),

            allowedDecisions:
                ALLOWED_DECISIONS.slice()
        };
    }

    async function formatAuthorizationRecord(
        authorization
    ) {
        const current =
            authorization ||
            lastAuthorizationRecord;

        if (!current) {
            return "No Human Controlled Execution Authorization Record is available.";
        }

        const lines = [
            "TMS-OS HUMAN CONTROLLED EXECUTION AUTHORIZATION RECORD",
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
            "Authorization Mode: " +
                current.authorizationMode,
            "Authorization Status: " +
                current.authorizationStatus,
            "Human Decision: " +
                current.humanDecision,
            "Authorization Officer: " +
                current.authorizationOfficerName,
            "Planned Documents: " +
                current.plannedDocumentCount,
            "Authorized Documents: " +
                current.authorizedDocumentCount,
            "Excluded Documents: " +
                current.excludedDocumentCount,
            "Execution Authorized in Source Record: " +
                (
                    current.executionAuthorized
                        ? "YES"
                        : "NO"
                ),
            "Write Authorized in Source Record: " +
                (
                    current.writeAuthorized
                        ? "YES"
                        : "NO"
                ),
            "Rollback Authorized in Source Record: " +
                (
                    current.rollbackAuthorized
                        ? "YES"
                        : "NO"
                ),
            "Permanent Writes Executed: NO",
            "Restore Executed: NO"
        ];

        (
            current.authorizedDocuments || []
        ).forEach(function (document) {
            lines.push(
                document.sequence +
                " | " +
                document.documentId +
                " | HUMAN AUTHORIZED | AWAITING DISABLED MANIFEST"
            );
        });

        (
            current.excludedDocuments || []
        ).forEach(function (document) {
            lines.push(
                document.sequence +
                " | " +
                document.documentId +
                " | NO WRITE REQUIRED | EXCLUDED"
            );
        });

        if (current.requiredNextAction) {
            lines.push(
                "Required Next Action: " +
                current.requiredNextAction
            );
        }

        return lines.join("\n");
    }

    window.TMSHumanControlledExecutionAuthorizationEngine =
        Object.freeze({
            engineName:
                ENGINE_NAME,

            engineVersion:
                ENGINE_VERSION,

            authorizationMode:
                AUTHORIZATION_MODE,

            createAuthorizationRecord:
                createAuthorizationRecord,

            validateAuthorizationRecord:
                validateAuthorizationRecord,

            formatAuthorizationRecord:
                formatAuthorizationRecord,

            getLastAuthorizationRecord:
                getLastAuthorizationRecord,

            getExpectedDocuments:
                getExpectedDocuments,

            getEngineInfo:
                getEngineInfo
        });

    console.log(
        "Human Controlled Execution Authorization Engine v" +
        ENGINE_VERSION +
        " initialized in " +
        AUTHORIZATION_MODE +
        " Mode for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());
