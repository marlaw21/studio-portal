const TMSPermanentDocumentationExecutionController = (() => {
    "use strict";

    const CONTROLLER_NAME =
        "TMSPermanentDocumentationExecutionController";

    const ENGINE_VERSION = "1.0.0";

    const VALIDATION_MODE = "Disabled";

    const SOURCE_REPORT_TYPE =
        "TMS-OS Permanent Documentation Execution Authorization Report";

    const REPORT_TYPE =
        "TMS-OS Permanent Documentation Execution Report";

    function isObject(value) {
        return (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        );
    }

    function isNonEmptyString(value) {
        return (
            typeof value === "string" &&
            value.trim().length > 0
        );
    }

    function cloneValue(value) {
        if (value === undefined) {
            return null;
        }

        return JSON.parse(
            JSON.stringify(value)
        );
    }

    function createTimestamp() {
        return new Date().toISOString();
    }

    function createCompactTimestamp(timestamp) {
        return timestamp
            .replace(/[-:.TZ]/g, "")
            .slice(0, 14);
    }

    function createReportId(sessionNumber, timestamp) {
        const safeSessionNumber =
            isNonEmptyString(sessionNumber)
                ? sessionNumber.trim()
                : "UNKNOWN";

        return [
            "TMS",
            "PERMANENT",
            "DOCUMENTATION",
            "EXECUTION",
            safeSessionNumber,
            createCompactTimestamp(timestamp)
        ].join("-");
    }

    function createCheck(
        checkName,
        satisfied,
        expected,
        actual
    ) {
        return {
            checkName,
            satisfied: satisfied === true,
            expected,
            actual
        };
    }

    function summarizeChecks(checks) {
        const passedChecks = checks.filter(
            check => check.satisfied === true
        );

        const failedChecks = checks.filter(
            check => check.satisfied !== true
        );

        return {
            accepted: failedChecks.length === 0,
            totalCheckCount: checks.length,
            passedCheckCount: passedChecks.length,
            failedCheckCount: failedChecks.length,
            checks,
            failedChecks
        };
    }

    function getControllerInfo() {
        return {
            controllerName: CONTROLLER_NAME,
            engineVersion: ENGINE_VERSION,
            validationMode: VALIDATION_MODE,
            sourceReportType: SOURCE_REPORT_TYPE,
            reportType: REPORT_TYPE,
            status: "Ready"
        };
    }

    function validateSourceReport(sourceReport) {
        const sourceIsObject =
            isObject(sourceReport);

        const authorization =
            sourceIsObject &&
            isObject(sourceReport.authorization)
                ? sourceReport.authorization
                : null;

        const authorizationOfficer =
            sourceIsObject &&
            isObject(sourceReport.authorizationOfficer)
                ? sourceReport.authorizationOfficer
                : null;

        const disabledMode =
            sourceIsObject &&
            isObject(sourceReport.disabledMode)
                ? sourceReport.disabledMode
                : null;

        const checks = [
            createCheck(
                "Source report is an object",
                sourceIsObject,
                "Object",
                sourceReport === null
                    ? "null"
                    : typeof sourceReport
            ),

            createCheck(
                "Source report type is valid",
                sourceIsObject &&
                    sourceReport.reportType ===
                        SOURCE_REPORT_TYPE,
                SOURCE_REPORT_TYPE,
                sourceIsObject
                    ? sourceReport.reportType ?? null
                    : null
            ),

            createCheck(
                "Source report is accepted",
                sourceIsObject &&
                    sourceReport.accepted === true,
                true,
                sourceIsObject
                    ? sourceReport.accepted ?? null
                    : null
            ),

            createCheck(
                "Source validation mode remains Disabled",
                sourceIsObject &&
                    sourceReport.validationMode ===
                        VALIDATION_MODE,
                VALIDATION_MODE,
                sourceIsObject
                    ? sourceReport.validationMode ?? null
                    : null
            ),

            createCheck(
                "Source report ID exists",
                sourceIsObject &&
                    isNonEmptyString(
                        sourceReport.reportId
                    ),
                "Non-empty reportId",
                sourceIsObject
                    ? sourceReport.reportId ?? null
                    : null
            ),

            createCheck(
                "Source session number exists",
                sourceIsObject &&
                    isNonEmptyString(
                        sourceReport.sessionNumber
                    ),
                "Non-empty sessionNumber",
                sourceIsObject
                    ? sourceReport.sessionNumber ?? null
                    : null
            ),

            createCheck(
                "Source version exists",
                sourceIsObject &&
                    isNonEmptyString(
                        sourceReport.version
                    ),
                "Non-empty version",
                sourceIsObject
                    ? sourceReport.version ?? null
                    : null
            ),

            createCheck(
                "Source milestone exists",
                sourceIsObject &&
                    isNonEmptyString(
                        sourceReport.milestone
                    ),
                "Non-empty milestone",
                sourceIsObject
                    ? sourceReport.milestone ?? null
                    : null
            ),

            createCheck(
                "Authorization object is valid",
                authorization !== null,
                "Object",
                authorization === null
                    ? null
                    : "object"
            ),

            createCheck(
                "Authorization decision is Authorize",
                authorization !== null &&
                    authorization.authorizationDecision ===
                        "Authorize",
                "Authorize",
                authorization !== null
                    ? authorization.authorizationDecision ??
                        null
                    : null
            ),

            createCheck(
                "Authorization was recorded",
                authorization !== null &&
                    authorization.authorizationRecorded ===
                        true,
                true,
                authorization !== null
                    ? authorization.authorizationRecorded ??
                        null
                    : null
            ),

            createCheck(
                "Authorization remains an artifact only",
                authorization !== null &&
                    authorization.authorizationArtifactOnly ===
                        true,
                true,
                authorization !== null
                    ? authorization.authorizationArtifactOnly ??
                        null
                    : null
            ),

            createCheck(
                "Authorization officer object is valid",
                authorizationOfficer !== null,
                "Object",
                authorizationOfficer === null
                    ? null
                    : "object"
            ),

            createCheck(
                "Authorization officer name exists",
                authorizationOfficer !== null &&
                    isNonEmptyString(
                        authorizationOfficer
                            .authorizationOfficerName
                    ),
                "Non-empty authorizationOfficerName",
                authorizationOfficer !== null
                    ? authorizationOfficer
                        .authorizationOfficerName ?? null
                    : null
            ),

            createCheck(
                "Current state exists",
                sourceIsObject &&
                    isNonEmptyString(
                        sourceReport.currentState
                    ),
                "Non-empty currentState",
                sourceIsObject
                    ? sourceReport.currentState ?? null
                    : null
            ),

            createCheck(
                "Requested state exists",
                sourceIsObject &&
                    isNonEmptyString(
                        sourceReport.requestedState
                    ),
                "Non-empty requestedState",
                sourceIsObject
                    ? sourceReport.requestedState ?? null
                    : null
            ),

            createCheck(
                "State identity is satisfied",
                sourceIsObject &&
                    sourceReport.stateIdentitySatisfied ===
                        true,
                true,
                sourceIsObject
                    ? sourceReport.stateIdentitySatisfied ??
                        null
                    : null
            ),

            createCheck(
                "Source Disabled Mode object is valid",
                disabledMode !== null,
                "Object",
                disabledMode === null
                    ? null
                    : "object"
            ),

            createCheck(
                "Source Disabled Mode is enforced",
                disabledMode !== null &&
                    disabledMode.disabledModeEnforced ===
                        true,
                true,
                disabledMode !== null
                    ? disabledMode.disabledModeEnforced ??
                        null
                    : null
            ),

            createCheck(
                "Source granted no authorization",
                disabledMode !== null &&
                    disabledMode.authorizationGranted ===
                        false,
                false,
                disabledMode !== null
                    ? disabledMode.authorizationGranted ??
                        null
                    : null
            ),

            createCheck(
                "Source executed no authorization",
                disabledMode !== null &&
                    disabledMode.authorizationExecuted ===
                        false,
                false,
                disabledMode !== null
                    ? disabledMode.authorizationExecuted ??
                        null
                    : null
            ),

            createCheck(
                "Source authorized no execution",
                disabledMode !== null &&
                    disabledMode.executionAuthorized ===
                        false,
                false,
                disabledMode !== null
                    ? disabledMode.executionAuthorized ??
                        null
                    : null
            ),

            createCheck(
                "Source performed no execution",
                disabledMode !== null &&
                    disabledMode.executionPerformed ===
                        false,
                false,
                disabledMode !== null
                    ? disabledMode.executionPerformed ??
                        null
                    : null
            ),

            createCheck(
                "Source authorized no permanent writes",
                disabledMode !== null &&
                    disabledMode
                        .permanentWritesAuthorized ===
                        false,
                false,
                disabledMode !== null
                    ? disabledMode
                        .permanentWritesAuthorized ?? null
                    : null
            ),

            createCheck(
                "Source performed no permanent writes",
                disabledMode !== null &&
                    disabledMode
                        .permanentWritesPerformed ===
                        false,
                false,
                disabledMode !== null
                    ? disabledMode
                        .permanentWritesPerformed ?? null
                    : null
            ),

            createCheck(
                "Source performed no rollback",
                disabledMode !== null &&
                    disabledMode.rollbackPerformed ===
                        false,
                false,
                disabledMode !== null
                    ? disabledMode.rollbackPerformed ??
                        null
                    : null
            ),

            createCheck(
                "Source performed no restore",
                disabledMode !== null &&
                    disabledMode.restorePerformed ===
                        false,
                false,
                disabledMode !== null
                    ? disabledMode.restorePerformed ??
                        null
                    : null
            ),

            createCheck(
                "Source changed no documentation state",
                disabledMode !== null &&
                    disabledMode
                        .documentationStateChanged ===
                        false,
                false,
                disabledMode !== null
                    ? disabledMode
                        .documentationStateChanged ?? null
                    : null
            )
        ];

        return summarizeChecks(checks);
    }

    function createExecutionReport(
        sourceReport,
        executionOperator = {},
        comments = ""
    ) {
        const generatedAt =
            createTimestamp();

        const sourceValidation =
            validateSourceReport(sourceReport);

        const operatorIsObject =
            isObject(executionOperator);

        const operatorName =
            operatorIsObject
                ? executionOperator.executionOperatorName
                : null;

        const operatorId =
            operatorIsObject
                ? executionOperator.executionOperatorId
                : null;

        const operatorChecks = [
            createCheck(
                "Execution operator object is valid",
                operatorIsObject,
                "Object",
                executionOperator === null
                    ? "null"
                    : typeof executionOperator
            ),

            createCheck(
                "Execution operator name exists",
                operatorIsObject &&
                    isNonEmptyString(operatorName),
                "Non-empty executionOperatorName",
                operatorName ?? null
            ),

            createCheck(
                "Execution operator ID format is valid",
                operatorId === undefined ||
                    operatorId === null ||
                    typeof operatorId === "string",
                "String or empty",
                operatorId ?? null
            )
        ];

        const combinedChecks = [
            ...sourceValidation.checks,
            ...operatorChecks
        ];

        const validation =
            summarizeChecks(combinedChecks);

        const accepted =
            validation.accepted === true;

        const sessionNumber =
            isObject(sourceReport)
                ? sourceReport.sessionNumber ?? ""
                : "";

        const version =
            isObject(sourceReport)
                ? sourceReport.version ?? ""
                : "";

        const milestone =
            isObject(sourceReport)
                ? sourceReport.milestone ?? ""
                : "";

        const currentState =
            isObject(sourceReport)
                ? sourceReport.currentState ?? ""
                : "";

        const requestedState =
            isObject(sourceReport)
                ? sourceReport.requestedState ?? ""
                : "";

        const stateIdentitySatisfied =
            isObject(sourceReport) &&
            sourceReport.stateIdentitySatisfied === true;

        const sourceReportId =
            isObject(sourceReport)
                ? sourceReport.reportId ?? ""
                : "";

        const executionStatus =
            accepted
                ? "Execution Simulation Completed — Disabled Mode"
                : "Execution Simulation Rejected — Disabled Mode";

        return {
            reportType: REPORT_TYPE,
            engineVersion: ENGINE_VERSION,
            controllerName: CONTROLLER_NAME,
            validationMode: VALIDATION_MODE,

            reportId: createReportId(
                sessionNumber,
                generatedAt
            ),

            generatedAt,
            sessionNumber,
            version,
            milestone,

            module:
                "Permanent Documentation Execution Controller",

            accepted,

            executionStatus,

            sourceAuthorizationReportExists:
                isObject(sourceReport),

            sourceAuthorizationReportId:
                sourceReportId,

            sourceAuthorizationReportAccepted:
                isObject(sourceReport) &&
                sourceReport.accepted === true,

            sourceAuthorizationReportSessionNumber:
                sessionNumber,

            currentState,
            requestedState,
            stateIdentitySatisfied,

            executionOperator: {
                executionOperatorName:
                    isNonEmptyString(operatorName)
                        ? operatorName.trim()
                        : "",

                executionOperatorId:
                    typeof operatorId === "string"
                        ? operatorId.trim()
                        : "",

                executionStartedAt:
                    generatedAt,

                executionCompletedAt:
                    generatedAt
            },

            execution: {
                executionDecision:
                    accepted
                        ? "Simulate"
                        : "Reject",

                executionRecorded:
                    accepted,

                executionSimulationCompleted:
                    accepted,

                executionArtifactOnly:
                    true,

                comments:
                    typeof comments === "string"
                        ? comments
                        : "",

                executionEffect:
                    "None",

                permanentDocumentationEffect:
                    "None",

                stateChangeEffect:
                    "None"
            },

            disabledMode: {
                validationMode:
                    VALIDATION_MODE,

                disabledModeEnforced:
                    true,

                executionArtifactCreated:
                    accepted,

                executionSimulationRecorded:
                    accepted,

                authorizationGranted:
                    false,

                authorizationExecuted:
                    false,

                executionAuthorized:
                    false,

                executionPerformed:
                    false,

                permanentWritesAuthorized:
                    false,

                permanentWritesPerformed:
                    false,

                rollbackAuthorized:
                    false,

                rollbackPerformed:
                    false,

                restoreAuthorized:
                    false,

                restorePerformed:
                    false,

                documentationStateChangeAuthorized:
                    false,

                documentationStateChanged:
                    false
            },

            executionSummary: {
                executionMode:
                    "Simulation Only",

                sourceAuthorizationValidated:
                    sourceValidation.accepted,

                executionOperatorValidated:
                    operatorChecks.every(
                        check => check.satisfied === true
                    ),

                permanentDocumentCount:
                    0,

                permanentWriteCount:
                    0,

                rollbackCount:
                    0,

                restoreCount:
                    0,

                documentationStateChangeCount:
                    0
            },

            validation: {
                ...validation,

                sourceValidationAccepted:
                    sourceValidation.accepted,

                executionOperatorValidationAccepted:
                    operatorChecks.every(
                        check => check.satisfied === true
                    )
            },

            sourceAuthorizationReportSnapshot:
                cloneValue(sourceReport),

            message:
                accepted
                    ? "The Permanent Documentation Execution simulation was recorded successfully. Disabled Mode remains enforced. No execution was authorized, no permanent writes occurred, and no documentation state changed."
                    : "The Permanent Documentation Execution simulation request was rejected because one or more required validation checks failed. Disabled Mode remains enforced, and no execution or permanent documentation change occurred."
        };
    }

    return {
        getControllerInfo,
        validateSourceReport,
        createExecutionReport
    };
})();