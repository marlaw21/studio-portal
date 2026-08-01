/*
=========================================================
TMS-OS Workspace Snapshot Coordinator
Document ID : WMS-ENGINE-008
Version     : 1.2.0
Status      : Foundation
Operating Mode: Read-Only Runtime Coordination
=========================================================
*/

(function (global) {
    "use strict";

    const NAME = "Workspace Snapshot Coordinator";
    const VERSION = "1.2.0";
    const MODE = "Read-Only Runtime Coordination";
    const SNAPSHOT_DIRECTORY = "governance/workspace/snapshots";
    const SNAPSHOT_PATTERN = /^WORKSPACE-SNAPSHOT-(\d{3})$/;

    const state = {
        initialized: false,
        snapshotEngine: null,
        historyManager: null,
        pointerManager: null,
        validationReport: null,
        lastOperation: null,
        lastLoadedSnapshot: null,
        lastRegistrationResult: null,
        latestDiscoveredSnapshotNumber: null,
        automaticProcessingResult: null
    };

    function clone(value) {
        return value === undefined
            ? undefined
            : JSON.parse(JSON.stringify(value));
    }

    function timestamp() {
        return new Date().toISOString();
    }

    function text(value) {
        return typeof value === "string" ? value.trim() : "";
    }

    function object(value) {
        return value !== null &&
            typeof value === "object" &&
            !Array.isArray(value);
    }

    function createReport() {
        return {
            coordinator: NAME,
            coordinatorVersion: VERSION,
            validatedAt: timestamp(),
            accepted: false,
            totalChecks: 0,
            passedChecks: 0,
            failedChecks: 0,
            checks: []
        };
    }

    function addCheck(report, checkId, description, passed, expected, actual) {
        report.checks.push({
            checkId,
            description,
            expected,
            actual,
            passed: Boolean(passed)
        });

        report.totalChecks += 1;

        if (passed) {
            report.passedChecks += 1;
        } else {
            report.failedChecks += 1;
        }
    }

    function resetRuntimeState() {
        state.initialized = false;
        state.snapshotEngine = null;
        state.historyManager = null;
        state.pointerManager = null;
        state.validationReport = null;
        state.lastOperation = null;
        state.lastLoadedSnapshot = null;
        state.lastRegistrationResult = null;
        state.latestDiscoveredSnapshotNumber = null;
        state.automaticProcessingResult = null;
        return true;
    }

    function validateDependencies() {
        const report = createReport();
        const snapshotEngine = global.TMSWorkspaceSnapshotEngine;
        const historyManager = global.TMSWorkspaceSnapshotHistoryManager;
        const pointerManager = global.TMSWorkspaceSnapshotPointerManager;

        addCheck(
            report,
            "WMS-COORDINATOR-DEP-001",
            "Workspace Snapshot Engine exists.",
            object(snapshotEngine),
            "Object",
            typeof snapshotEngine
        );

        addCheck(
            report,
            "WMS-COORDINATOR-DEP-002",
            "Workspace Snapshot History Manager exists.",
            object(historyManager),
            "Object",
            typeof historyManager
        );
        addCheck(
            report,
            "WMS-COORDINATOR-DEP-002A",
            "Workspace Snapshot Pointer Manager exists.",
            object(pointerManager),
            "Object",
            typeof pointerManager
        );

        addCheck(
            report,
            "WMS-COORDINATOR-DEP-002B",
            "Workspace Snapshot Pointer Manager is initialized.",
            pointerManager?.getStatus?.()?.initialized === true,
            true,
            pointerManager?.getStatus?.()?.initialized ?? null
        );

        addCheck(
            report,
            "WMS-COORDINATOR-DEP-002C",
            "Pointer Manager exposes getLatestSnapshotPath().",
            typeof pointerManager?.getLatestSnapshotPath === "function",
            "function",
            typeof pointerManager?.getLatestSnapshotPath
        );


        addCheck(
            report,
            "WMS-COORDINATOR-DEP-003",
            "Workspace Snapshot Engine is initialized.",
            snapshotEngine?.getStatus?.()?.initialized === true,
            true,
            snapshotEngine?.getStatus?.()?.initialized ?? null
        );

        addCheck(
            report,
            "WMS-COORDINATOR-DEP-004",
            "Workspace Snapshot History Manager is initialized.",
            historyManager?.getStatus?.()?.initialized === true,
            true,
            historyManager?.getStatus?.()?.initialized ?? null
        );

        addCheck(
            report,
            "WMS-COORDINATOR-DEP-005",
            "Snapshot Engine exposes getSnapshot().",
            typeof snapshotEngine?.getSnapshot === "function",
            "function",
            typeof snapshotEngine?.getSnapshot
        );

        addCheck(
            report,
            "WMS-COORDINATOR-DEP-006",
            "History Manager exposes registerSnapshot().",
            typeof historyManager?.registerSnapshot === "function",
            "function",
            typeof historyManager?.registerSnapshot
        );

        report.accepted = report.failedChecks === 0;
        return report;
    }

    function validateSnapshotIdentity(snapshot) {
        const report = createReport();
        const documentId = text(snapshot?.documentId);
        const match = SNAPSHOT_PATTERN.exec(documentId);
        const documentNumber = match ? Number(match[1]) : null;

        addCheck(
            report,
            "WMS-COORDINATOR-SNAPSHOT-001",
            "Snapshot is an object.",
            object(snapshot),
            "Object",
            typeof snapshot
        );

        addCheck(
            report,
            "WMS-COORDINATOR-SNAPSHOT-002",
            "Snapshot document ID follows the governed pattern.",
            Boolean(match),
            "WORKSPACE-SNAPSHOT-###",
            documentId || null
        );

        addCheck(
            report,
            "WMS-COORDINATOR-SNAPSHOT-003",
            "Snapshot number is a positive integer.",
            Number.isInteger(snapshot?.snapshotNumber) &&
                snapshot.snapshotNumber > 0,
            "Positive integer",
            snapshot?.snapshotNumber ?? null
        );

        addCheck(
            report,
            "WMS-COORDINATOR-SNAPSHOT-004",
            "Document ID number matches snapshotNumber.",
            match !== null &&
                documentNumber === snapshot?.snapshotNumber,
            documentNumber,
            snapshot?.snapshotNumber ?? null
        );

        addCheck(
            report,
            "WMS-COORDINATOR-SNAPSHOT-005",
            "Snapshot contains a folders collection.",
            Array.isArray(snapshot?.folders),
            "Array",
            Array.isArray(snapshot?.folders)
                ? snapshot.folders.length
                : null
        );

        addCheck(
            report,
            "WMS-COORDINATOR-SNAPSHOT-006",
            "Snapshot contains a files collection.",
            Array.isArray(snapshot?.files),
            "Array",
            Array.isArray(snapshot?.files)
                ? snapshot.files.length
                : null
        );

        addCheck(
            report,
            "WMS-COORDINATOR-SNAPSHOT-007",
            "Snapshot validation was accepted.",
            snapshot?.validation?.accepted === true,
            true,
            snapshot?.validation?.accepted ?? null
        );

        report.accepted = report.failedChecks === 0;
        return report;
    }

    function createSnapshotPath(snapshotNumber) {
        if (!Number.isInteger(snapshotNumber) ||
            snapshotNumber < 1 ||
            snapshotNumber > 999) {
            throw new Error(
                "Snapshot number must be an integer from 1 through 999."
            );
        }

        const padded = String(snapshotNumber).padStart(3, "0");

        return (
            SNAPSHOT_DIRECTORY +
            "/WORKSPACE-SNAPSHOT-" +
            padded +
            ".json"
        );
    }

    async function loadSnapshotDocument(snapshotPath) {
        if (!state.initialized) {
            throw new Error(
                "Workspace Snapshot Coordinator must be initialized first."
            );
        }

        const path = text(snapshotPath);

        if (!path) {
            throw new Error("A governed snapshot path is required.");
        }

        const response = await fetch(path, { cache: "no-store" });

        if (!response.ok) {
            throw new Error(
                "Unable to load governed snapshot document. HTTP " +
                response.status +
                ": " +
                path
            );
        }

        const snapshot = await response.json();
        const validation = validateSnapshotIdentity(snapshot);

        if (!validation.accepted) {
            state.lastOperation = {
                operation: "Load Snapshot Document",
                performedAt: timestamp(),
                accepted: false,
                snapshotPath: path,
                validation: clone(validation)
            };

            throw new Error(
                "Governed snapshot document validation failed."
            );
        }

        state.lastLoadedSnapshot = clone(snapshot);

        state.lastOperation = {
            operation: "Load Snapshot Document",
            performedAt: timestamp(),
            accepted: true,
            snapshotPath: path,
            documentId: snapshot.documentId,
            snapshotNumber: snapshot.snapshotNumber
        };

        return clone(snapshot);
    }

    async function loadSnapshotByNumber(snapshotNumber) {
        return loadSnapshotDocument(
            createSnapshotPath(snapshotNumber)
        );
    }

    function registerSnapshot(snapshot) {
        if (!state.initialized) {
            throw new Error(
                "Workspace Snapshot Coordinator must be initialized first."
            );
        }

        const validation = validateSnapshotIdentity(snapshot);

        if (!validation.accepted) {
            const rejected = {
                accepted: false,
                registered: false,
                reason: "Snapshot identity validation failed.",
                validation: clone(validation),
                snapshotRecord: null
            };

            state.lastRegistrationResult = clone(rejected);
            state.lastOperation = {
                operation: "Register Snapshot",
                performedAt: timestamp(),
                accepted: false,
                documentId: snapshot?.documentId ?? null
            };

            return rejected;
        }

        const result = state.historyManager.registerSnapshot(
            clone(snapshot)
        );

        state.lastRegistrationResult = clone(result);
        state.lastOperation = {
            operation: "Register Snapshot",
            performedAt: timestamp(),
            accepted: result?.accepted === true,
            registered: result?.registered === true,
            documentId: snapshot.documentId,
            snapshotNumber: snapshot.snapshotNumber
        };

        return clone(result);
    }

    function registerCurrentSnapshot() {
        if (!state.initialized) {
            throw new Error(
                "Workspace Snapshot Coordinator must be initialized first."
            );
        }

        const snapshot = state.snapshotEngine.getSnapshot();

        if (!snapshot) {
            throw new Error(
                "Workspace Snapshot Engine does not currently contain a snapshot."
            );
        }

        return registerSnapshot(snapshot);
    }

    async function processSnapshotDocument(snapshotPath) {
        const snapshot = await loadSnapshotDocument(snapshotPath);
        const registration = registerSnapshot(snapshot);

        return {
            operationType: "Workspace Snapshot Coordination Result",
            coordinatorVersion: VERSION,
            generatedAt: timestamp(),
            accepted: registration?.accepted === true,
            snapshotPath: text(snapshotPath),
            snapshot: {
                documentId: snapshot.documentId,
                snapshotNumber: snapshot.snapshotNumber,
                generatedAt: snapshot.generatedAt ?? null
            },
            registration: clone(registration),
            permanentWritesAuthorized: false,
            permanentWritesPerformed: false
        };
    }

    async function processSnapshotNumber(snapshotNumber) {
        return processSnapshotDocument(
            createSnapshotPath(snapshotNumber)
        );
    }

    function discoverLatestSnapshotNumber() {
        if (!state.initialized) {
            throw new Error(
                "Workspace Snapshot Coordinator must be initialized first."
            );
        }

        const latestSnapshotNumber =
            state.pointerManager
                .getLatestSnapshotNumber();

        if (
            !Number.isInteger(latestSnapshotNumber) ||
            latestSnapshotNumber < 1
        ) {
            throw new Error(
                "Workspace Snapshot Pointer Manager returned an invalid latest snapshot number."
            );
        }

        state.latestDiscoveredSnapshotNumber =
            latestSnapshotNumber;

        state.lastOperation = {
            operation:
                "Read Latest Snapshot Number from Pointer Manager",
            performedAt:
                timestamp(),
            accepted:
                true,
            latestSnapshotNumber
        };

        return latestSnapshotNumber;
    }

    async function processLatestSnapshot() {
        if (!state.initialized) {
            throw new Error(
                "Workspace Snapshot Coordinator must be initialized first."
            );
        }

        const latestSnapshotNumber =
            discoverLatestSnapshotNumber();

        const latestSnapshotPath =
            state.pointerManager
                .getLatestSnapshotPath();

        if (!text(latestSnapshotPath)) {
            throw new Error(
                "Workspace Snapshot Pointer Manager returned an empty latest snapshot path."
            );
        }

        const result =
            await processSnapshotDocument(
                latestSnapshotPath
            );

        if (
            result?.snapshot?.snapshotNumber !==
            latestSnapshotNumber
        ) {
            throw new Error(
                "Latest snapshot pointer number does not match the loaded snapshot."
            );
        }

        state.automaticProcessingResult =
            clone(result);

        return clone(result);
    }

    function getStatus() {
        return {
            coordinator: NAME,
            version: VERSION,
            operatingMode: MODE,
            initialized: state.initialized,
            snapshotEngineLoaded: state.snapshotEngine !== null,
            historyManagerLoaded: state.historyManager !== null,
            pointerManagerLoaded: state.pointerManager !== null,
            validationAccepted:
                state.validationReport?.accepted ?? false,
            lastLoadedSnapshot:
                state.lastLoadedSnapshot?.documentId ?? null,
            lastRegistrationAccepted:
                state.lastRegistrationResult?.accepted ?? null,
            lastRegistrationCompleted:
                state.lastRegistrationResult?.registered ?? null,
            latestDiscoveredSnapshotNumber:
                state.latestDiscoveredSnapshotNumber,
            automaticProcessingAccepted:
                state.automaticProcessingResult?.accepted ?? null,
            permanentWritesAuthorized: false,
            permanentWritesPerformed: false
        };
    }

    function getValidationReport() {
        return clone(state.validationReport);
    }

    function getLastOperation() {
        return clone(state.lastOperation);
    }

    function getLastLoadedSnapshot() {
        return clone(state.lastLoadedSnapshot);
    }

    function getLastRegistrationResult() {
        return clone(state.lastRegistrationResult);
    }

    function getCoordinatorInfo() {
        return {
            coordinator: NAME,
            version: VERSION,
            operatingMode: MODE,
            responsibilities: [
                "Validate required runtime dependencies",
                "Load governed snapshot documents",
                "Validate governed snapshot identity",
                "Coordinate runtime history registration",
                "Read the latest governed snapshot reference from the Pointer Manager",
                "Automatically process the latest governed snapshot during initialization",
                "Expose coordination results and status"
            ],
            nonResponsibilities: [
                "Scanning the file system",
                "Creating snapshot JSON files",
                "Writing permanent history documents",
                "Comparing snapshots",
                "Authorizing permanent actions"
            ],
            permanentWritesAuthorized: false,
            permanentWritesPerformed: false
        };
    }

    async function initialize() {
        resetRuntimeState();

        const validation = validateDependencies();
        state.validationReport = clone(validation);

        if (!validation.accepted) {
            console.error(
                "Workspace Snapshot Coordinator initialization rejected.",
                validation
            );
            return false;
        }

        state.snapshotEngine = global.TMSWorkspaceSnapshotEngine;
        state.historyManager =
            global.TMSWorkspaceSnapshotHistoryManager;
        state.pointerManager =
            global.TMSWorkspaceSnapshotPointerManager;
        state.initialized = true;
        state.lastOperation = {
            operation: "Initialize Coordinator",
            performedAt: timestamp(),
            accepted: true
        };

        try {
            const automaticResult =
                await processLatestSnapshot();

            state.automaticProcessingResult =
                clone(automaticResult);
        } catch (error) {
            state.initialized = false;

            state.lastOperation = {
                operation:
                    "Automatic Latest Snapshot Processing",
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
                "Workspace Snapshot Coordinator automatic processing failed.",
                error
            );

            return false;
        }

        console.log(
            "Workspace Snapshot Coordinator Initialized"
        );

        return true;
    }

    global.TMSWorkspaceSnapshotCoordinator = Object.freeze({
        coordinatorName: NAME,
        version: VERSION,
        operatingMode: MODE,
        initialize,
        resetRuntimeState,
        validateDependencies,
        validateSnapshotIdentity,
        createSnapshotPath,
        loadSnapshotDocument,
        loadSnapshotByNumber,
        registerSnapshot,
        registerCurrentSnapshot,
        processSnapshotDocument,
        processSnapshotNumber,
        discoverLatestSnapshotNumber,
        processLatestSnapshot,
        getStatus,
        getValidationReport,
        getLastOperation,
        getLastLoadedSnapshot,
        getLastRegistrationResult,
        getCoordinatorInfo,
        clone
    });

    console.log(
        "Workspace Snapshot Coordinator Loaded — v" +
        VERSION
    );

})(window);
