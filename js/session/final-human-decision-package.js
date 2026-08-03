/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 105 — Final Human Decision Package v1.0.0
Disabled Foundation
File: js/session/final-human-decision-package.js

Purpose:
Consume an accepted Final Human Approval Gateway package and produce the final
immutable, review-only governance artifact before any future execution-enabled
architecture is considered.

This version remains fully disabled and non-destructive. It does not grant
execution, write, rollback, or restore authority. It does not write, replace,
rename, move, delete, restore, download, or otherwise modify any permanent file.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const DECISION_MODE = "Disabled";
    const PACKAGE_TYPE =
        "TMS-OS Final Human Decision Governance Package";

    const ALLOWED_DECISIONS = Object.freeze([
        "Approve Governance Structure",
        "Revise Governance Package",
        "Cancel Governance Package"
    ]);

    let lastDecisionPackage = null;

    if (
        !window.TMSSessionContext ||
        !window.TMSFinalHumanApprovalGateway
    ) {
        console.error(
            "Final Human Decision Package could not initialize because its dependencies are unavailable."
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

    function normalizeText(value) {
        return typeof value === "string"
            ? value.trim()
            : "";
    }

    function createPackageId(sessionNumber, generatedAt) {
        const timestamp =
            generatedAt
                .replace(/[-:.TZ]/g, "")
                .slice(0, 14);

        return [
            "TMS",
            "FINAL-HUMAN-DECISION",
            String(sessionNumber).padStart(3, "0"),
            timestamp
        ].join("-");
    }

    function validateGatewayPackage(gatewayPackage) {
        const checks = [];

        const gatewayValidation =
            isPlainObject(gatewayPackage)
                ? window.TMSFinalHumanApprovalGateway
                    .validateGatewayPackage(
                        gatewayPackage
                    )
                : {
                    accepted: false,
                    checks: []
                };

        checks.push(buildCheck(
            "Gateway package exists",
            isPlainObject(gatewayPackage),
            "An accepted Final Human Approval Gateway package is required."
        ));

        checks.push(buildCheck(
            "Gateway package accepted",
            Boolean(
                gatewayPackage &&
                gatewayPackage.accepted
            ),
            "The Final Human Approval Gateway package must be accepted."
        ));

        checks.push(buildCheck(
            "Gateway validation accepted",
            Boolean(
                gatewayValidation &&
                gatewayValidation.accepted
            ),
            "The Final Human Approval Gateway package must pass validation."
        ));

        checks.push(buildCheck(
            "Gateway mode disabled",
            Boolean(gatewayPackage) &&
                gatewayPackage.gatewayMode ===
                    DECISION_MODE,
            "The source gateway must remain in Disabled mode."
        ));

        checks.push(buildCheck(
            "Twelve-stage pipeline retained",
            Boolean(gatewayPackage) &&
                gatewayPackage.pipelineStageCount ===
                    12 &&
                gatewayPackage.completedStageCount ===
                    12,
            "The source gateway must retain all twelve completed pipeline stages."
        ));

        checks.push(buildCheck(
            "Human review eligible",
            Boolean(gatewayPackage) &&
                gatewayPackage.humanReviewEligible ===
                    true,
            "The source gateway must be eligible for final human review."
        ));

        checks.push(buildCheck(
            "Gateway human decision remains unrecorded",
            Boolean(gatewayPackage) &&
                gatewayPackage.humanDecisionRecorded ===
                    false,
            "The gateway must remain locked before the separate decision package is created."
        ));

        checks.push(buildCheck(
            "Gateway human approval remains ungranted",
            Boolean(gatewayPackage) &&
                gatewayPackage.humanApprovalGranted ===
                    false,
            "The gateway must not grant execution approval."
        ));

        const safeguardsLocked =
            Boolean(gatewayPackage) &&
            gatewayPackage.authorizationGranted ===
                false &&
            gatewayPackage.executionAuthorized ===
                false &&
            gatewayPackage.writeAuthorized ===
                false &&
            gatewayPackage.rollbackAuthorized ===
                false &&
            gatewayPackage.restoreAuthorized ===
                false &&
            gatewayPackage.actualWritesAttempted ===
                false &&
            gatewayPackage.actualRestoresAttempted ===
                false &&
            gatewayPackage.permanentWritesExecuted ===
                false &&
            gatewayPackage.restoreExecuted ===
                false;

        checks.push(buildCheck(
            "Gateway safeguards locked",
            safeguardsLocked,
            "All authorization, execution, write, rollback, and restore controls must remain disabled."
        ));

        return {
            accepted:
                checks.every(function (check) {
                    return check.passed;
                }),
            checks: checks,
            gatewayValidation:
                gatewayValidation
        };
    }

    function validateDecisionInput(decisionInput) {
        const checks = [];
        const input =
            isPlainObject(decisionInput)
                ? decisionInput
                : {};

        const decision =
            normalizeText(input.decision);

        const decisionOfficer =
            isPlainObject(input.decisionOfficer)
                ? input.decisionOfficer
                : {};

        const officerName =
            normalizeText(decisionOfficer.name);

        const officerId =
            normalizeText(decisionOfficer.id);

        const officerRole =
            normalizeText(decisionOfficer.role);

        checks.push(buildCheck(
            "Decision input exists",
            isPlainObject(decisionInput),
            "A final human decision input object is required."
        ));

        checks.push(buildCheck(
            "Decision is allowed",
            ALLOWED_DECISIONS.includes(
                decision
            ),
            "The final decision must be one of the approved governance decisions."
        ));

        checks.push(buildCheck(
            "Decision officer exists",
            isPlainObject(
                input.decisionOfficer
            ),
            "A decision officer object is required."
        ));

        checks.push(buildCheck(
            "Decision officer name exists",
            officerName.length > 0,
            "The decision officer name is required."
        ));

        checks.push(buildCheck(
            "Decision officer ID exists",
            officerId.length > 0,
            "The decision officer ID is required."
        ));

        checks.push(buildCheck(
            "Decision officer role exists",
            officerRole.length > 0,
            "The decision officer role is required."
        ));

        return {
            accepted:
                checks.every(function (check) {
                    return check.passed;
                }),
            checks: checks,
            normalized: {
                decision: decision,
                comments:
                    normalizeText(
                        input.comments
                    ),
                decisionOfficer: {
                    name: officerName,
                    id: officerId,
                    role: officerRole
                }
            }
        };
    }

    function rejectedPackage(
        message,
        gatewayPackage,
        gatewayValidation,
        decisionValidation
    ) {
        const snapshot =
            window.TMSSessionContext.getSnapshot();

        const generatedAt =
            new Date().toISOString();

        return deepFreeze({
            packageType: PACKAGE_TYPE,
            engineVersion: ENGINE_VERSION,
            decisionMode: DECISION_MODE,
            packageId:
                createPackageId(
                    snapshot.sessionNumber,
                    generatedAt
                ),
            generatedAt: generatedAt,
            sessionNumber:
                snapshot.sessionNumber,
            accepted: false,
            message: message,
            sourceGatewayAccepted:
                Boolean(
                    gatewayPackage &&
                    gatewayPackage.accepted
                ),
            sourceGatewayId:
                gatewayPackage
                    ? gatewayPackage.gatewayId
                    : null,
            sourceGatewayStatus:
                gatewayPackage
                    ? gatewayPackage.gatewayStatus
                    : "Unavailable",
            gatewayValidationAccepted:
                Boolean(
                    gatewayValidation &&
                    gatewayValidation.accepted
                ),
            gatewayValidationChecks:
                gatewayValidation
                    ? gatewayValidation.checks
                    : [],
            decisionValidationAccepted:
                Boolean(
                    decisionValidation &&
                    decisionValidation.accepted
                ),
            decisionValidationChecks:
                decisionValidation
                    ? decisionValidation.checks
                    : [],
            pipelineStageCount: 0,
            completedStageCount: 0,
            humanReviewEligible: false,
            finalDecisionRecorded: false,
            finalDecision:
                "Not Recorded",
            finalDecisionStatus:
                "Rejected",
            decisionOfficer: null,
            decisionComments: "",
            governanceApprovalRecorded: false,
            executionApprovalGranted: false,
            authorizationGranted: false,
            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,
            restoreAuthorized: false,
            actualWritesAttempted: false,
            actualRestoresAttempted: false,
            permanentWritesExecuted: false,
            restoreExecuted: false,
            decisionPackageReady: false,
            packageStatus: "Rejected",
            requiredNextAction:
                "Correct the failed gateway or final human decision validation checks.",
            reviewRequired: true
        });
    }

    async function createDecisionPackage(
        decisionInput,
        gatewayPackage
    ) {
        const sourceGateway =
            gatewayPackage ||
            window.TMSFinalHumanApprovalGateway
                .getLastGatewayPackage();

        const gatewayValidation =
            validateGatewayPackage(
                sourceGateway
            );

        const decisionValidation =
            validateDecisionInput(
                decisionInput
            );

        if (
            !gatewayValidation.accepted ||
            !decisionValidation.accepted
        ) {
            lastDecisionPackage =
                rejectedPackage(
                    "The Final Human Decision Package prerequisites failed validation.",
                    sourceGateway,
                    gatewayValidation,
                    decisionValidation
                );

            return lastDecisionPackage;
        }

        const normalizedDecision =
            decisionValidation.normalized;

        const governanceApproved =
            normalizedDecision.decision ===
            "Approve Governance Structure";

        const snapshot =
            window.TMSSessionContext.getSnapshot();

        const generatedAt =
            new Date().toISOString();

        lastDecisionPackage =
            deepFreeze({
                packageType: PACKAGE_TYPE,
                engineVersion: ENGINE_VERSION,
                decisionMode: DECISION_MODE,
                packageId:
                    createPackageId(
                        snapshot.sessionNumber,
                        generatedAt
                    ),
                generatedAt: generatedAt,
                sessionNumber:
                    snapshot.sessionNumber,
                accepted: true,
                message:
                    "The final human governance decision was recorded in Disabled mode. No execution, write, rollback, or restore authority was granted.",
                sourceGatewayAccepted: true,
                sourceGatewayId:
                    sourceGateway.gatewayId,
                sourceGatewayStatus:
                    sourceGateway.gatewayStatus,
                sourceGatewayEngineVersion:
                    sourceGateway.engineVersion,
                sourceGatewayGeneratedAt:
                    sourceGateway.generatedAt,
                sourceReviewPackageId:
                    sourceGateway.sourcePackageId,
                gatewayValidationAccepted: true,
                gatewayValidationChecks:
                    gatewayValidation.checks,
                decisionValidationAccepted: true,
                decisionValidationChecks:
                    decisionValidation.checks,
                pipelineStageCount:
                    sourceGateway.pipelineStageCount,
                completedStageCount:
                    sourceGateway.completedStageCount,
                humanReviewEligible: true,
                finalDecisionRecorded: true,
                finalDecision:
                    normalizedDecision.decision,
                finalDecisionStatus:
                    governanceApproved
                        ? "Governance Structure Approved — Execution Disabled"
                        : normalizedDecision.decision ===
                            "Revise Governance Package"
                            ? "Revision Requested — Execution Disabled"
                            : "Governance Package Cancelled — Execution Disabled",
                decisionOfficer:
                    clone(
                        normalizedDecision
                            .decisionOfficer
                    ),
                decisionComments:
                    normalizedDecision.comments,
                governanceApprovalRecorded:
                    governanceApproved,
                executionApprovalGranted: false,
                authorizationGranted: false,
                executionAuthorized: false,
                writeAuthorized: false,
                rollbackAuthorized: false,
                restoreAuthorized: false,
                actualWritesAttempted: false,
                actualRestoresAttempted: false,
                permanentWritesExecuted: false,
                restoreExecuted: false,
                decisionPackageReady: true,
                packageStatus:
                    governanceApproved
                        ? "Final Governance Decision Recorded — Execution Locked"
                        : normalizedDecision.decision ===
                            "Revise Governance Package"
                            ? "Final Governance Revision Recorded — Execution Locked"
                            : "Final Governance Cancellation Recorded — Execution Locked",
                requiredNextAction:
                    governanceApproved
                        ? "Retain this immutable Disabled Mode governance artifact. Any future execution-enabled design requires a separate approved module."
                        : normalizedDecision.decision ===
                            "Revise Governance Package"
                            ? "Return the governance package for revision. Do not enable execution."
                            : "Stop this governance package path. Do not enable execution.",
                reviewRequired: false,
                reviewChoices: []
            });

        return lastDecisionPackage;
    }

    function validateDecisionPackage(
        decisionPackage
    ) {
        const current =
            decisionPackage ||
            lastDecisionPackage;

        const checks = [];

        checks.push(buildCheck(
            "Decision package exists",
            isPlainObject(current),
            "A Final Human Decision Package is required."
        ));

        checks.push(buildCheck(
            "Decision package accepted",
            Boolean(
                current &&
                current.accepted
            ),
            "The Final Human Decision Package must be accepted."
        ));

        checks.push(buildCheck(
            "Decision mode disabled",
            Boolean(current) &&
                current.decisionMode ===
                    DECISION_MODE,
            "Version 1.0.0 must remain in Disabled mode."
        ));

        checks.push(buildCheck(
            "Source gateway accepted",
            Boolean(current) &&
                current.sourceGatewayAccepted ===
                    true,
            "The package must retain an accepted Final Human Approval Gateway source."
        ));

        checks.push(buildCheck(
            "Gateway validation accepted",
            Boolean(current) &&
                current.gatewayValidationAccepted ===
                    true,
            "The source gateway must have passed validation."
        ));

        checks.push(buildCheck(
            "Decision validation accepted",
            Boolean(current) &&
                current.decisionValidationAccepted ===
                    true,
            "The human decision input must have passed validation."
        ));

        checks.push(buildCheck(
            "Twelve-stage evidence retained",
            Boolean(current) &&
                current.pipelineStageCount ===
                    12 &&
                current.completedStageCount ===
                    12,
            "All twelve completed pipeline stages must be retained."
        ));

        checks.push(buildCheck(
            "Human review eligibility retained",
            Boolean(current) &&
                current.humanReviewEligible ===
                    true,
            "The package must retain final human review eligibility."
        ));

        checks.push(buildCheck(
            "Final decision recorded",
            Boolean(current) &&
                current.finalDecisionRecorded ===
                    true &&
                ALLOWED_DECISIONS.includes(
                    current.finalDecision
                ),
            "A valid final governance decision must be recorded."
        ));

        checks.push(buildCheck(
            "Decision officer valid",
            Boolean(current) &&
                isPlainObject(
                    current.decisionOfficer
                ) &&
                normalizeText(
                    current.decisionOfficer.name
                ).length > 0 &&
                normalizeText(
                    current.decisionOfficer.id
                ).length > 0 &&
                normalizeText(
                    current.decisionOfficer.role
                ).length > 0,
            "The final decision officer must be complete."
        ));

        checks.push(buildCheck(
            "Decision package ready",
            Boolean(current) &&
                current.decisionPackageReady ===
                    true,
            "The final governance decision package must be ready."
        ));

        checks.push(buildCheck(
            "Execution approval remains ungranted",
            Boolean(current) &&
                current.executionApprovalGranted ===
                    false,
            "The final governance decision must not grant execution approval."
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
                Boolean(current) &&
                    current[item[1]] === false,
                item[0] + "."
            ));
        });

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

    async function formatDecisionPackage(
        decisionPackage
    ) {
        const current =
            decisionPackage ||
            lastDecisionPackage;

        if (!current) {
            return [
                "TMS-OS FINAL HUMAN DECISION PACKAGE",
                "No decision package has been created."
            ].join("\n");
        }

        const lines = [
            "TMS-OS FINAL HUMAN DECISION PACKAGE",
            "Package ID: " +
                current.packageId,
            "Accepted: " +
                (current.accepted
                    ? "YES"
                    : "NO"),
            "Work Session: " +
                current.sessionNumber,
            "Engine Version: " +
                current.engineVersion,
            "Decision Mode: " +
                current.decisionMode,
            "Package Status: " +
                current.packageStatus,
            "Pipeline Stages: " +
                current.pipelineStageCount,
            "Completed Stages: " +
                current.completedStageCount,
            "Human Review Eligible: " +
                (current.humanReviewEligible
                    ? "YES"
                    : "NO"),
            "Final Decision Recorded: " +
                (current.finalDecisionRecorded
                    ? "YES"
                    : "NO"),
            "Final Decision: " +
                current.finalDecision,
            "Final Decision Status: " +
                current.finalDecisionStatus,
            "Governance Approval Recorded: " +
                (current.governanceApprovalRecorded
                    ? "YES"
                    : "NO"),
            "Execution Approval Granted: NO",
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

        if (current.decisionOfficer) {
            lines.push(
                "Decision Officer: " +
                current.decisionOfficer.name +
                " | " +
                current.decisionOfficer.id +
                " | " +
                current.decisionOfficer.role
            );
        }

        if (current.decisionComments) {
            lines.push(
                "Decision Comments: " +
                current.decisionComments
            );
        }

        if (current.requiredNextAction) {
            lines.push(
                "Required Next Action: " +
                current.requiredNextAction
            );
        }

        return lines.join("\n");
    }

    function getLastDecisionPackage() {
        return lastDecisionPackage;
    }

    function getAllowedDecisions() {
        return ALLOWED_DECISIONS.slice();
    }

    window.TMSFinalHumanDecisionPackage =
        Object.freeze({
            engineVersion:
                ENGINE_VERSION,
            decisionMode:
                DECISION_MODE,
            createDecisionPackage:
                createDecisionPackage,
            validateDecisionPackage:
                validateDecisionPackage,
            formatDecisionPackage:
                formatDecisionPackage,
            getLastDecisionPackage:
                getLastDecisionPackage,
            getAllowedDecisions:
                getAllowedDecisions
        });

    console.log(
        "Final Human Decision Package v" +
        ENGINE_VERSION +
        " initialized in " +
        DECISION_MODE +
        " Mode for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());
