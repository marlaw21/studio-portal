/**
 * Two Marshalls Studios
 * TMS-OS Workspace Management System
 *
 * Workspace Snapshot Engine
 *
 * File:
 * js/workspace/workspace-snapshot-engine.js
 *
 * Version:
 * 1.0.1
 *
 * Purpose:
 * Loads, validates, and prepares the governed workspace snapshot document.
 *
 * Operating mode:
 * Read-only
 *
 * This engine does not:
 * - scan the Windows file system;
 * - create folders;
 * - create files;
 * - rename files;
 * - move files;
 * - archive files;
 * - delete files;
 * - modify the governed snapshot document on disk.
 */

(function initializeWorkspaceSnapshotEngine(global) {
    "use strict";

    const ENGINE_NAME = "Workspace Snapshot Engine";
    const ENGINE_VERSION = "1.0.1";

    const SNAPSHOT_DOCUMENT_PATH =
        "governance/workspace/snapshots/WORKSPACE-SNAPSHOT-001.json";

    const EXPECTED_DOCUMENT_ID = "WORKSPACE-SNAPSHOT-001";
    const EXPECTED_SNAPSHOT_TYPE = "Workspace Snapshot";

    const TMSWorkspaceSnapshotEngine = {
        engineName: ENGINE_NAME,
        version: ENGINE_VERSION,
        snapshotDocumentPath: SNAPSHOT_DOCUMENT_PATH,

        initialized: false,

        workspaceConfiguration: null,
        repositoryConfiguration: null,

        governedSnapshotDocument: null,
        snapshot: null,
        validationReport: null,

        /**
         * Initializes the Workspace Snapshot Engine.
         *
         * @returns {Promise<boolean>}
         */
        async initialize() {
            this.resetRuntimeState();

            try {
                this.validateDependencies();

                this.workspaceConfiguration =
                    this.loadWorkspaceConfiguration();

                this.repositoryConfiguration =
                    this.loadRepositoryConfiguration();

                this.governedSnapshotDocument =
                    await this.loadGovernedSnapshotDocument();

                this.snapshot =
                    this.createRuntimeSnapshot(
                        this.governedSnapshotDocument
                    );

                this.validationReport =
                    this.validateSnapshot(this.snapshot);

                this.snapshot.validation = {
                    validated: this.validationReport.validated,
                    accepted: this.validationReport.accepted
                };

                if (!this.validationReport.accepted) {
                    console.error(
                        `${ENGINE_NAME} initialization rejected.`,
                        this.validationReport
                    );

                    return false;
                }

                this.initialized = true;

                console.log(`${ENGINE_NAME} Initialized`);

                return true;
            } catch (error) {
                this.initialized = false;

                this.validationReport = {
                    engine: ENGINE_NAME,
                    engineVersion: ENGINE_VERSION,
                    validated: true,
                    accepted: false,
                    errors: [
                        error instanceof Error
                            ? error.message
                            : String(error)
                    ],
                    warnings: []
                };

                console.error(
                    `${ENGINE_NAME} initialization failed.`,
                    error
                );

                return false;
            }
        },

        /**
         * Clears runtime state before initialization.
         */
        resetRuntimeState() {
            this.initialized = false;

            this.workspaceConfiguration = null;
            this.repositoryConfiguration = null;

            this.governedSnapshotDocument = null;
            this.snapshot = null;
            this.validationReport = null;
        },

        /**
         * Confirms required upstream engines exist and are initialized.
         */
        validateDependencies() {
            if (!global.TMSWorkspaceDiscoveryEngine) {
                throw new Error(
                    "Workspace Discovery Engine is not available."
                );
            }

            if (!global.TMSRepositoryDiscoveryEngine) {
                throw new Error(
                    "Repository Discovery Engine is not available."
                );
            }

            const workspaceStatus =
                global.TMSWorkspaceDiscoveryEngine.getStatus();

            if (!workspaceStatus || !workspaceStatus.initialized) {
                throw new Error(
                    "Workspace Discovery Engine must be initialized first."
                );
            }

            const repositoryStatus =
                global.TMSRepositoryDiscoveryEngine.getStatus();

            if (!repositoryStatus || !repositoryStatus.initialized) {
                throw new Error(
                    "Repository Discovery Engine must be initialized first."
                );
            }
        },

        /**
         * Retrieves the approved workspace configuration.
         *
         * @returns {Object}
         */
        loadWorkspaceConfiguration() {
            const configuration =
                global.TMSWorkspaceDiscoveryEngine.getConfiguration();

            if (!configuration) {
                throw new Error(
                    "Approved workspace configuration could not be loaded."
                );
            }

            return this.clone(configuration);
        },

        /**
         * Retrieves the approved repository configuration.
         *
         * @returns {Object}
         */
        loadRepositoryConfiguration() {
            const repositoryEngine =
                global.TMSRepositoryDiscoveryEngine;

            let configuration = null;

            if (
                typeof repositoryEngine.getConfiguration ===
                "function"
            ) {
                configuration =
                    repositoryEngine.getConfiguration();
            } else if (
                typeof repositoryEngine
                    .getRepositoryConfiguration ===
                "function"
            ) {
                configuration =
                    repositoryEngine.getRepositoryConfiguration();
            }

            if (!configuration) {
                throw new Error(
                    "Approved repository configuration could not be loaded."
                );
            }

            return this.clone(configuration);
        },

        /**
         * Loads the governed snapshot JSON document.
         *
         * @returns {Promise<Object>}
         */
        async loadGovernedSnapshotDocument() {
            const response = await fetch(
                this.snapshotDocumentPath,
                {
                    cache: "no-store"
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Unable to load governed snapshot document. ` +
                    `HTTP ${response.status} ${response.statusText}`
                );
            }

            const document = await response.json();

            console.log(
                "Governed workspace snapshot document loaded."
            );

            return document;
        },

        /**
         * Creates the runtime snapshot without modifying the source document.
         *
         * @param {Object} governedDocument
         * @returns {Object}
         */
        createRuntimeSnapshot(governedDocument) {
            const runtimeSnapshot =
                this.clone(governedDocument);

            runtimeSnapshot.workspace = {
                rootPath: this.resolveWorkspaceRootPath(),
                repositoryPath: this.resolveRepositoryPath()
            };

            if (
                !runtimeSnapshot.capture ||
                typeof runtimeSnapshot.capture !== "object"
            ) {
                runtimeSnapshot.capture = {};
            }

            if (
                !runtimeSnapshot.summary ||
                typeof runtimeSnapshot.summary !== "object"
            ) {
                runtimeSnapshot.summary = {
                    folderCount: 0,
                    fileCount: 0
                };
            }

            if (!Array.isArray(runtimeSnapshot.folders)) {
                runtimeSnapshot.folders = [];
            }

            if (!Array.isArray(runtimeSnapshot.files)) {
                runtimeSnapshot.files = [];
            }

            runtimeSnapshot.summary.folderCount =
                runtimeSnapshot.folders.length;

            runtimeSnapshot.summary.fileCount =
                runtimeSnapshot.files.length;

            return runtimeSnapshot;
        },

        /**
         * Resolves the approved workspace root path.
         *
         * @returns {string|null}
         */
        resolveWorkspaceRootPath() {
            const configuration =
                this.workspaceConfiguration;

            return (
                configuration?.workspace?.rootPath ??
                configuration?.rootPath ??
                null
            );
        },

        /**
         * Resolves the approved repository path.
         *
         * Supports the current Repository Discovery Engine schema:
         *
         * {
         *     path: "C:\\Two Marshalls Studios\\studio-portal"
         * }
         *
         * Additional fallbacks are retained for compatibility with
         * earlier or future governed configuration structures.
         *
         * @returns {string|null}
         */
        resolveRepositoryPath() {
            const repositoryConfiguration =
                this.repositoryConfiguration;

            const workspaceConfiguration =
                this.workspaceConfiguration;

            return (
                repositoryConfiguration?.path ??
                repositoryConfiguration?.repositoryPath ??
                repositoryConfiguration?.repository?.path ??
                repositoryConfiguration
                    ?.repository
                    ?.repositoryPath ??
                workspaceConfiguration
                    ?.workspace
                    ?.repositoryPath ??
                workspaceConfiguration?.repository?.path ??
                workspaceConfiguration
                    ?.repository
                    ?.repositoryPath ??
                workspaceConfiguration?.repositoryPath ??
                null
            );
        },

        /**
         * Validates the runtime snapshot.
         *
         * @param {Object} snapshot
         * @returns {Object}
         */
        validateSnapshot(snapshot) {
            const errors = [];
            const warnings = [];

            if (!snapshot || typeof snapshot !== "object") {
                errors.push(
                    "Snapshot must be a valid object."
                );
            }

            if (
                snapshot?.documentId !==
                EXPECTED_DOCUMENT_ID
            ) {
                errors.push(
                    `Snapshot documentId must be ` +
                    `"${EXPECTED_DOCUMENT_ID}".`
                );
            }

            if (
                snapshot?.snapshotType !==
                EXPECTED_SNAPSHOT_TYPE
            ) {
                errors.push(
                    `Snapshot type must be ` +
                    `"${EXPECTED_SNAPSHOT_TYPE}".`
                );
            }

            if (
                typeof snapshot?.version !== "string" ||
                snapshot.version.trim() === ""
            ) {
                errors.push(
                    "Snapshot version is required."
                );
            }

            if (
                typeof snapshot?.snapshotNumber !== "number" ||
                snapshot.snapshotNumber < 1
            ) {
                errors.push(
                    "Snapshot number must be a number greater than zero."
                );
            }

            if (
                !snapshot?.workspace ||
                typeof snapshot.workspace !== "object"
            ) {
                errors.push(
                    "Snapshot workspace information is required."
                );
            }

            if (
                !snapshot?.workspace?.rootPath ||
                typeof snapshot.workspace.rootPath !== "string"
            ) {
                errors.push(
                    "Approved workspace root path is required."
                );
            }

            if (
                !snapshot?.workspace?.repositoryPath ||
                typeof snapshot.workspace.repositoryPath !== "string"
            ) {
                errors.push(
                    "Approved repository path is required."
                );
            }

            if (!Array.isArray(snapshot?.folders)) {
                errors.push(
                    "Snapshot folders must be an array."
                );
            }

            if (!Array.isArray(snapshot?.files)) {
                errors.push(
                    "Snapshot files must be an array."
                );
            }

            if (
                !snapshot?.summary ||
                typeof snapshot.summary !== "object"
            ) {
                errors.push(
                    "Snapshot summary is required."
                );
            }

            if (
                snapshot?.summary?.folderCount !==
                snapshot?.folders?.length
            ) {
                errors.push(
                    "Snapshot folder count does not match the folders array."
                );
            }

            if (
                snapshot?.summary?.fileCount !==
                snapshot?.files?.length
            ) {
                errors.push(
                    "Snapshot file count does not match the files array."
                );
            }

            if (!snapshot?.generatedAt) {
                warnings.push(
                    "Snapshot has not yet been generated by the file-system capture tool."
                );
            }

            if (!snapshot?.generatedBy) {
                warnings.push(
                    "Snapshot generator identity has not yet been recorded."
                );
            }

            if (!snapshot?.capture?.captureMethod) {
                warnings.push(
                    "Snapshot capture method has not yet been recorded."
                );
            }

            const accepted =
                errors.length === 0;

            return {
                engine: ENGINE_NAME,
                engineVersion: ENGINE_VERSION,
                documentId:
                    snapshot?.documentId ?? null,
                snapshotNumber:
                    snapshot?.snapshotNumber ?? null,
                validated: true,
                accepted,
                errorCount: errors.length,
                warningCount: warnings.length,
                errors,
                warnings
            };
        },

        /**
         * Returns current engine status.
         *
         * @returns {Object}
         */
        getStatus() {
            return {
                engine: ENGINE_NAME,
                version: ENGINE_VERSION,
                initialized: this.initialized,

                workspaceConfigurationLoaded:
                    this.workspaceConfiguration !== null,

                repositoryConfigurationLoaded:
                    this.repositoryConfiguration !== null,

                governedSnapshotDocumentLoaded:
                    this.governedSnapshotDocument !== null,

                snapshotInitialized:
                    this.snapshot !== null,

                validationAccepted:
                    this.validationReport?.accepted ?? false
            };
        },

        /**
         * Returns a protected copy of the runtime snapshot.
         *
         * @returns {Object|null}
         */
        getSnapshot() {
            return this.snapshot
                ? this.clone(this.snapshot)
                : null;
        },

        /**
         * Returns a protected copy of the original governed document.
         *
         * @returns {Object|null}
         */
        getGovernedSnapshotDocument() {
            return this.governedSnapshotDocument
                ? this.clone(this.governedSnapshotDocument)
                : null;
        },

        /**
         * Returns the validation report.
         *
         * @returns {Object|null}
         */
        getValidationReport() {
            return this.validationReport
                ? this.clone(this.validationReport)
                : null;
        },

        /**
         * Creates a deep copy of JSON-compatible data.
         *
         * @param {*} value
         * @returns {*}
         */
        clone(value) {
            if (
                value === null ||
                value === undefined
            ) {
                return value;
            }

            return JSON.parse(
                JSON.stringify(value)
            );
        }
    };

    global.TMSWorkspaceSnapshotEngine =
        TMSWorkspaceSnapshotEngine;

    console.log(
        `${ENGINE_NAME} Loaded`
    );
})(window);