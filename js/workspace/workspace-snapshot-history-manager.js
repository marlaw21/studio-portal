(function () {
    "use strict";

    const MANAGER_NAME = "TMS Workspace Snapshot History Manager";
    const MANAGER_VERSION = "1.0.0";

    const HISTORY_DOCUMENT_PATH =
        "governance/workspace/snapshots/WORKSPACE-SNAPSHOT-HISTORY-001.json";

    let initialized = false;
    let governedHistoryDocument = null;
    let runtimeHistory = null;
    let validationReport = null;

    function clone(value) {
        if (value === undefined) {
            return undefined;
        }

        return JSON.parse(JSON.stringify(value));
    }

    function createTimestamp() {
        return new Date().toISOString();
    }

    function normalizeString(value) {
        return typeof value === "string" ? value.trim() : "";
    }

    function isPlainObject(value) {
        return (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        );
    }

    function createEmptyValidationReport() {
        return {
            managerName: MANAGER_NAME,
            managerVersion: MANAGER_VERSION,
            validatedAt: createTimestamp(),
            accepted: false,
            totalChecks: 0,
            passedChecks: 0,
            failedChecks: 0,
            checks: []
        };
    }

    function addValidationCheck(report, name, passed, details) {
        const check = {
            name,
            passed: Boolean(passed),
            details: details || null
        };

        report.checks.push(check);
        report.totalChecks += 1;

        if (check.passed) {
            report.passedChecks += 1;
        } else {
            report.failedChecks += 1;
        }
    }

    async function loadGovernedHistoryDocument() {
        const response = await fetch(HISTORY_DOCUMENT_PATH, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(
                `Unable to load governed snapshot history document. HTTP ${response.status}`
            );
        }

        const document = await response.json();

        console.log(
            "Governed workspace snapshot history document loaded."
        );

        return document;
    }

    function validateHistoryDocument(document) {
        const report = createEmptyValidationReport();

        addValidationCheck(
            report,
            "History document exists",
            isPlainObject(document),
            "The governed snapshot history document must be a valid object."
        );

        addValidationCheck(
            report,
            "Document ID is valid",
            normalizeString(document?.documentId) ===
                "WORKSPACE-SNAPSHOT-HISTORY-001",
            document?.documentId || null
        );

        addValidationCheck(
            report,
            "Version exists",
            normalizeString(document?.version).length > 0,
            document?.version || null
        );

        addValidationCheck(
            report,
            "Document type is valid",
            normalizeString(document?.documentType) ===
                "Workspace Snapshot History",
            document?.documentType || null
        );

        addValidationCheck(
            report,
            "Summary exists",
            isPlainObject(document?.summary),
            document?.summary || null
        );

        addValidationCheck(
            report,
            "Snapshots collection exists",
            Array.isArray(document?.snapshots),
            Array.isArray(document?.snapshots)
                ? `Snapshots found: ${document.snapshots.length}`
                : null
        );

        addValidationCheck(
            report,
            "Validation object exists",
            isPlainObject(document?.validation),
            document?.validation || null
        );

        report.accepted = report.failedChecks === 0;

        return report;
    }

    function validateSnapshot(snapshot) {
        const report = createEmptyValidationReport();

        addValidationCheck(
            report,
            "Snapshot is an object",
            isPlainObject(snapshot),
            null
        );

        const snapshotId =
            normalizeString(snapshot?.snapshotId) ||
            normalizeString(snapshot?.documentId);

        addValidationCheck(
            report,
            "Snapshot ID exists",
            snapshotId.length > 0,
            snapshotId || null
        );

        addValidationCheck(
            report,
            "Snapshot contains folders collection",
            Array.isArray(snapshot?.folders),
            Array.isArray(snapshot?.folders)
                ? `Folders: ${snapshot.folders.length}`
                : null
        );

        addValidationCheck(
            report,
            "Snapshot contains files collection",
            Array.isArray(snapshot?.files),
            Array.isArray(snapshot?.files)
                ? `Files: ${snapshot.files.length}`
                : null
        );

        addValidationCheck(
            report,
            "Snapshot generated timestamp exists",
            normalizeString(snapshot?.generatedAt).length > 0,
            snapshot?.generatedAt || null
        );

        report.accepted = report.failedChecks === 0;

        return report;
    }

    function buildSnapshotRecord(snapshot) {
        const snapshotId =
            normalizeString(snapshot.snapshotId) ||
            normalizeString(snapshot.documentId);

        return {
            snapshotId,
            documentId:
                normalizeString(snapshot.documentId) || snapshotId,
            version: normalizeString(snapshot.version) || null,
            status: normalizeString(snapshot.status) || null,
            generatedAt: snapshot.generatedAt || null,
            generatedBy: snapshot.generatedBy || null,
            registeredAt: createTimestamp(),
            summary: {
                totalFolders: Array.isArray(snapshot.folders)
                    ? snapshot.folders.length
                    : 0,
                totalFiles: Array.isArray(snapshot.files)
                    ? snapshot.files.length
                    : 0,
                totalItems:
                    (Array.isArray(snapshot.folders)
                        ? snapshot.folders.length
                        : 0) +
                    (Array.isArray(snapshot.files)
                        ? snapshot.files.length
                        : 0)
            },
            sourceSnapshot: clone(snapshot)
        };
    }

    function updateSummary() {
        if (!runtimeHistory) {
            return;
        }

        const snapshots = runtimeHistory.snapshots;

        runtimeHistory.summary.totalSnapshots = snapshots.length;
        runtimeHistory.summary.latestSnapshot =
            snapshots.length > 0
                ? snapshots[snapshots.length - 1].snapshotId
                : null;

        runtimeHistory.summary.previousSnapshot =
            snapshots.length > 1
                ? snapshots[snapshots.length - 2].snapshotId
                : null;
    }

    function registerSnapshot(snapshot) {
        if (!initialized || !runtimeHistory) {
            throw new Error(
                "Workspace Snapshot History Manager is not initialized."
            );
        }

        const snapshotValidation = validateSnapshot(snapshot);

        if (!snapshotValidation.accepted) {
            return {
                accepted: false,
                registered: false,
                reason: "Snapshot validation failed.",
                validation: snapshotValidation,
                snapshotRecord: null
            };
        }

        const snapshotRecord = buildSnapshotRecord(snapshot);

        const duplicate = runtimeHistory.snapshots.find(
            (record) => record.snapshotId === snapshotRecord.snapshotId
        );

        if (duplicate) {
            return {
                accepted: false,
                registered: false,
                reason: `Snapshot ${snapshotRecord.snapshotId} is already registered.`,
                validation: snapshotValidation,
                snapshotRecord: clone(duplicate)
            };
        }

        runtimeHistory.snapshots.push(snapshotRecord);
        runtimeHistory.generatedAt = createTimestamp();
        runtimeHistory.generatedBy = MANAGER_NAME;
        runtimeHistory.status = "Runtime";
        updateSummary();

        runtimeHistory.validation = {
            validated: true,
            accepted: true
        };

        return {
            accepted: true,
            registered: true,
            reason: "Snapshot registered successfully.",
            validation: snapshotValidation,
            snapshotRecord: clone(snapshotRecord)
        };
    }

    function getSnapshotRecords() {
        if (!runtimeHistory) {
            return [];
        }

        return clone(runtimeHistory.snapshots);
    }

    function getSnapshotCount() {
        return runtimeHistory?.snapshots?.length || 0;
    }

    function getSnapshotById(snapshotId) {
        const normalizedSnapshotId = normalizeString(snapshotId);

        if (!normalizedSnapshotId || !runtimeHistory) {
            return null;
        }

        const record = runtimeHistory.snapshots.find(
            (snapshot) =>
                snapshot.snapshotId === normalizedSnapshotId ||
                snapshot.documentId === normalizedSnapshotId
        );

        return record ? clone(record) : null;
    }

    function getLatestSnapshotRecord() {
        if (
            !runtimeHistory ||
            runtimeHistory.snapshots.length === 0
        ) {
            return null;
        }

        return clone(
            runtimeHistory.snapshots[
                runtimeHistory.snapshots.length - 1
            ]
        );
    }

    function getPreviousSnapshotRecord() {
        if (
            !runtimeHistory ||
            runtimeHistory.snapshots.length < 2
        ) {
            return null;
        }

        return clone(
            runtimeHistory.snapshots[
                runtimeHistory.snapshots.length - 2
            ]
        );
    }

    function getLatestSnapshot() {
        const record = getLatestSnapshotRecord();

        return record ? clone(record.sourceSnapshot) : null;
    }

    function getPreviousSnapshot() {
        const record = getPreviousSnapshotRecord();

        return record ? clone(record.sourceSnapshot) : null;
    }

    function getHistoryDocument() {
        return clone(runtimeHistory);
    }

    function getGovernedHistoryDocument() {
        return clone(governedHistoryDocument);
    }

    function getValidationReport() {
        return clone(validationReport);
    }

    function getStatus() {
        return {
            managerName: MANAGER_NAME,
            managerVersion: MANAGER_VERSION,
            initialized,
            historyDocumentPath: HISTORY_DOCUMENT_PATH,
            governedDocumentLoaded:
                governedHistoryDocument !== null,
            runtimeHistoryCreated: runtimeHistory !== null,
            snapshotCount: getSnapshotCount(),
            latestSnapshot:
                runtimeHistory?.summary?.latestSnapshot || null,
            previousSnapshot:
                runtimeHistory?.summary?.previousSnapshot || null,
            validationAccepted:
                validationReport?.accepted || false
        };
    }

    function getManagerInfo() {
        return {
            managerName: MANAGER_NAME,
            managerVersion: MANAGER_VERSION,
            mode: "Read-Only Runtime Management",
            responsibilities: [
                "Load governed workspace snapshot history",
                "Validate snapshot history structure",
                "Validate snapshots before registration",
                "Register snapshots in runtime history",
                "Retrieve snapshots by identity",
                "Retrieve latest and previous snapshots",
                "Provide snapshot history statistics"
            ],
            permanentWritesAuthorized: false,
            permanentWritesPerformed: false
        };
    }

    function reset() {
        initialized = false;
        governedHistoryDocument = null;
        runtimeHistory = null;
        validationReport = null;

        return true;
    }

    async function initialize() {
        reset();

        try {
            governedHistoryDocument =
                await loadGovernedHistoryDocument();

            validationReport =
                validateHistoryDocument(
                    governedHistoryDocument
                );

            if (!validationReport.accepted) {
                console.error(
                    "Workspace Snapshot History Manager initialization failed validation.",
                    validationReport
                );

                return false;
            }

            runtimeHistory = clone(governedHistoryDocument);

            runtimeHistory.generatedAt = createTimestamp();
            runtimeHistory.generatedBy = MANAGER_NAME;
            runtimeHistory.status = "Runtime";

            if (!Array.isArray(runtimeHistory.snapshots)) {
                runtimeHistory.snapshots = [];
            }

            updateSummary();

            runtimeHistory.validation = {
                validated: true,
                accepted: true
            };

            initialized = true;

            console.log(
                "Workspace Snapshot History Manager Initialized"
            );

            return true;
        } catch (error) {
            console.error(
                "Workspace Snapshot History Manager initialization failed.",
                error
            );

            reset();
            return false;
        }
    }

    window.TMSWorkspaceSnapshotHistoryManager = Object.freeze({
        initialize,
        reset,
        registerSnapshot,
        validateSnapshot,
        getSnapshotRecords,
        getSnapshotCount,
        getSnapshotById,
        getLatestSnapshotRecord,
        getPreviousSnapshotRecord,
        getLatestSnapshot,
        getPreviousSnapshot,
        getHistoryDocument,
        getGovernedHistoryDocument,
        getValidationReport,
        getStatus,
        getManagerInfo,
        clone
    });

    console.log(
        `Workspace Snapshot History Manager Loaded — v${MANAGER_VERSION}`
    );
})();