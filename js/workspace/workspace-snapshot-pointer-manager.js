/*
=========================================================
TMS-OS Workspace Snapshot Pointer Manager
---------------------------------------------------------
Document ID : WMS-ENGINE-009
Version     : 1.0.0
Status      : Foundation
Purpose     : Loads, validates, and exposes the governed
              latest workspace snapshot pointer without
              duplicating snapshot history or coordinator
              responsibilities.
Operating Mode:
              Read-Only Pointer Management
=========================================================
*/

(function (global) {
    "use strict";

    const MANAGER_NAME =
        "Workspace Snapshot Pointer Manager";

    const MANAGER_VERSION =
        "1.0.0";

    const OPERATING_MODE =
        "Read-Only Pointer Management";

    const POINTER_DOCUMENT_PATH =
        "governance/workspace/snapshots/WORKSPACE-SNAPSHOT-LATEST.json";

    const EXPECTED_DOCUMENT_ID =
        "WORKSPACE-SNAPSHOT-LATEST";

    const EXPECTED_DOCUMENT_TYPE =
        "Workspace Latest Snapshot Pointer";

    const SNAPSHOT_DOCUMENT_PATTERN =
        /^WORKSPACE-SNAPSHOT-(\d{3})$/;

    const SNAPSHOT_FILE_PATTERN =
        /^WORKSPACE-SNAPSHOT-(\d{3})\.json$/;

    const state = {
        initialized: false,
        pointerDocument: null,
        validationReport: null,
        lastOperation: null
    };

    function clone(value) {
        if (value === undefined) {
            return undefined;
        }

        return JSON.parse(
            JSON.stringify(value)
        );
    }

    function timestamp() {
        return new Date().toISOString();
    }

    function normalizeText(value) {
        return typeof value === "string"
            ? value.trim()
            : "";
    }

    function isPlainObject(value) {
        return (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        );
    }

    function createValidationReport() {
        return {
            manager:
                MANAGER_NAME,

            managerVersion:
                MANAGER_VERSION,

            validatedAt:
                timestamp(),

            accepted:
                false,

            totalChecks:
                0,

            passedChecks:
                0,

            failedChecks:
                0,

            checks:
                []
        };
    }

    function addCheck(
        report,
        checkId,
        description,
        passed,
        expected,
        actual
    ) {
        const check = {
            checkId,
            description,
            expected,
            actual,
            passed: Boolean(passed)
        };

        report.checks.push(check);
        report.totalChecks += 1;

        if (check.passed) {
            report.passedChecks += 1;
        } else {
            report.failedChecks += 1;
        }
    }

    function resetRuntimeState() {
        state.initialized = false;
        state.pointerDocument = null;
        state.validationReport = null;
        state.lastOperation = null;

        return true;
    }

    function validatePointerDocument(
        pointerDocument
    ) {
        const report =
            createValidationReport();

        const latestSnapshot =
            pointerDocument?.latestSnapshot;

        const snapshotNumber =
            latestSnapshot?.snapshotNumber;

        const snapshotDocumentId =
            normalizeText(
                latestSnapshot?.documentId
            );

        const snapshotFileName =
            normalizeText(
                latestSnapshot?.fileName
            );

        const snapshotPath =
            normalizeText(
                latestSnapshot?.path
            );

        const documentIdMatch =
            SNAPSHOT_DOCUMENT_PATTERN.exec(
                snapshotDocumentId
            );

        const fileNameMatch =
            SNAPSHOT_FILE_PATTERN.exec(
                snapshotFileName
            );

        const documentNumber =
            documentIdMatch
                ? Number(
                    documentIdMatch[1]
                )
                : null;

        const fileNumber =
            fileNameMatch
                ? Number(
                    fileNameMatch[1]
                )
                : null;

        addCheck(
            report,
            "WMS-POINTER-001",
            "Pointer document is an object.",
            isPlainObject(
                pointerDocument
            ),
            "Object",
            typeof pointerDocument
        );

        addCheck(
            report,
            "WMS-POINTER-002",
            "Pointer document ID is valid.",
            normalizeText(
                pointerDocument?.documentId
            ) === EXPECTED_DOCUMENT_ID,
            EXPECTED_DOCUMENT_ID,
            pointerDocument?.documentId ??
                null
        );

        addCheck(
            report,
            "WMS-POINTER-003",
            "Pointer document type is valid.",
            normalizeText(
                pointerDocument?.documentType
            ) === EXPECTED_DOCUMENT_TYPE,
            EXPECTED_DOCUMENT_TYPE,
            pointerDocument?.documentType ??
                null
        );

        addCheck(
            report,
            "WMS-POINTER-004",
            "Pointer status is Published.",
            normalizeText(
                pointerDocument?.status
            ) === "Published",
            "Published",
            pointerDocument?.status ??
                null
        );

        addCheck(
            report,
            "WMS-POINTER-005",
            "Latest snapshot metadata exists.",
            isPlainObject(
                latestSnapshot
            ),
            "Object",
            latestSnapshot ?? null
        );

        addCheck(
            report,
            "WMS-POINTER-006",
            "Latest snapshot number is valid.",
            Number.isInteger(
                snapshotNumber
            ) &&
                snapshotNumber > 0,
            "Positive integer",
            snapshotNumber ?? null
        );

        addCheck(
            report,
            "WMS-POINTER-007",
            "Latest snapshot document ID follows the governed pattern.",
            Boolean(
                documentIdMatch
            ),
            "WORKSPACE-SNAPSHOT-###",
            snapshotDocumentId || null
        );

        addCheck(
            report,
            "WMS-POINTER-008",
            "Latest snapshot filename follows the governed pattern.",
            Boolean(
                fileNameMatch
            ),
            "WORKSPACE-SNAPSHOT-###.json",
            snapshotFileName || null
        );

        addCheck(
            report,
            "WMS-POINTER-009",
            "Snapshot number matches document ID.",
            Number.isInteger(
                snapshotNumber
            ) &&
                documentNumber ===
                    snapshotNumber,
            snapshotNumber ?? null,
            documentNumber
        );

        addCheck(
            report,
            "WMS-POINTER-010",
            "Snapshot number matches filename.",
            Number.isInteger(
                snapshotNumber
            ) &&
                fileNumber ===
                    snapshotNumber,
            snapshotNumber ?? null,
            fileNumber
        );

        addCheck(
            report,
            "WMS-POINTER-011",
            "Latest snapshot path is present.",
            snapshotPath.length > 0,
            "Non-empty string",
            snapshotPath || null
        );

        addCheck(
            report,
            "WMS-POINTER-012",
            "Latest snapshot path ends with the governed filename.",
            snapshotPath.endsWith(
                "/" + snapshotFileName
            ) ||
                snapshotPath.endsWith(
                    "\\" + snapshotFileName
                ),
            snapshotFileName || null,
            snapshotPath || null
        );

        addCheck(
            report,
            "WMS-POINTER-013",
            "Pointer validation was accepted.",
            pointerDocument?.validation
                ?.accepted === true,
            true,
            pointerDocument?.validation
                ?.accepted ?? null
        );

        report.accepted =
            report.failedChecks === 0;

        return report;
    }

    async function loadPointerDocument() {
        const response =
            await fetch(
                POINTER_DOCUMENT_PATH,
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            throw new Error(
                "Unable to load governed latest snapshot pointer. HTTP " +
                response.status
            );
        }

        return response.json();
    }

    async function initialize() {
        resetRuntimeState();

        try {
            const pointerDocument =
                await loadPointerDocument();

            const validationReport =
                validatePointerDocument(
                    pointerDocument
                );

            state.pointerDocument =
                clone(
                    pointerDocument
                );

            state.validationReport =
                clone(
                    validationReport
                );

            if (!validationReport.accepted) {
                state.lastOperation = {
                    operation:
                        "Initialize Pointer Manager",

                    performedAt:
                        timestamp(),

                    accepted:
                        false,

                    validation:
                        clone(
                            validationReport
                        )
                };

                console.error(
                    "Workspace Snapshot Pointer Manager initialization rejected.",
                    validationReport
                );

                return false;
            }

            state.initialized = true;

            state.lastOperation = {
                operation:
                    "Initialize Pointer Manager",

                performedAt:
                    timestamp(),

                accepted:
                    true,

                latestSnapshotNumber:
                    pointerDocument
                        .latestSnapshot
                        .snapshotNumber,

                latestSnapshotDocumentId:
                    pointerDocument
                        .latestSnapshot
                        .documentId
            };

            console.log(
                "Workspace Snapshot Pointer Manager Initialized"
            );

            return true;
        } catch (error) {
            state.lastOperation = {
                operation:
                    "Initialize Pointer Manager",

                performedAt:
                    timestamp(),

                accepted:
                    false,

                error:
                    error instanceof Error
                        ? error.message
                        : String(error)
            };

            console.error(
                "Workspace Snapshot Pointer Manager initialization failed.",
                error
            );

            return false;
        }
    }

    function requireInitialized() {
        if (!state.initialized) {
            throw new Error(
                "Workspace Snapshot Pointer Manager must be initialized first."
            );
        }
    }

    function getPointerDocument() {
        requireInitialized();

        return clone(
            state.pointerDocument
        );
    }

    function getLatestSnapshotReference() {
        requireInitialized();

        return clone(
            state.pointerDocument
                .latestSnapshot
        );
    }

    function getLatestSnapshotNumber() {
        requireInitialized();

        return state.pointerDocument
            .latestSnapshot
            .snapshotNumber;
    }

    function getLatestSnapshotDocumentId() {
        requireInitialized();

        return state.pointerDocument
            .latestSnapshot
            .documentId;
    }

    function getLatestSnapshotFileName() {
        requireInitialized();

        return state.pointerDocument
            .latestSnapshot
            .fileName;
    }

    function getLatestSnapshotPath() {
        requireInitialized();

        return state.pointerDocument
            .latestSnapshot
            .path;
    }

    function getValidationReport() {
        return clone(
            state.validationReport
        );
    }

    function getLastOperation() {
        return clone(
            state.lastOperation
        );
    }

    function getStatus() {
        return {
            manager:
                MANAGER_NAME,

            version:
                MANAGER_VERSION,

            operatingMode:
                OPERATING_MODE,

            initialized:
                state.initialized,

            pointerDocumentPath:
                POINTER_DOCUMENT_PATH,

            pointerDocumentLoaded:
                state.pointerDocument !==
                null,

            validationAccepted:
                state.validationReport
                    ?.accepted ?? false,

            latestSnapshotNumber:
                state.pointerDocument
                    ?.latestSnapshot
                    ?.snapshotNumber ??
                null,

            latestSnapshotDocumentId:
                state.pointerDocument
                    ?.latestSnapshot
                    ?.documentId ??
                null,

            latestSnapshotPath:
                state.pointerDocument
                    ?.latestSnapshot
                    ?.path ??
                null,

            permanentWritesAuthorized:
                false,

            permanentWritesPerformed:
                false
        };
    }

    function getManagerInfo() {
        return {
            manager:
                MANAGER_NAME,

            version:
                MANAGER_VERSION,

            operatingMode:
                OPERATING_MODE,

            responsibilities: [
                "Load the governed latest snapshot pointer",
                "Validate pointer identity and structure",
                "Validate latest snapshot metadata consistency",
                "Expose latest snapshot reference data"
            ],

            nonResponsibilities: [
                "Creating snapshot files",
                "Registering snapshot history",
                "Writing permanent pointer documents",
                "Comparing snapshots",
                "Coordinating snapshot workflows"
            ],

            permanentWritesAuthorized:
                false,

            permanentWritesPerformed:
                false
        };
    }

    global.TMSWorkspaceSnapshotPointerManager =
        Object.freeze({
            managerName:
                MANAGER_NAME,

            version:
                MANAGER_VERSION,

            operatingMode:
                OPERATING_MODE,

            initialize,
            resetRuntimeState,
            validatePointerDocument,
            getPointerDocument,
            getLatestSnapshotReference,
            getLatestSnapshotNumber,
            getLatestSnapshotDocumentId,
            getLatestSnapshotFileName,
            getLatestSnapshotPath,
            getValidationReport,
            getLastOperation,
            getStatus,
            getManagerInfo,
            clone
        });

    console.log(
        "Workspace Snapshot Pointer Manager Loaded — v" +
        MANAGER_VERSION
    );

})(window);
