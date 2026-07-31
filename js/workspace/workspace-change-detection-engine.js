/**
 * Two Marshalls Studios
 * TMS-OS Workspace Management System
 *
 * Workspace Change Detection Engine
 *
 * File:
 * js/workspace/workspace-change-detection-engine.js
 *
 * Version:
 * 1.0.0
 *
 * Purpose:
 * Loads and validates the governed workspace change report
 * foundation and compares two governed workspace snapshots.
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
 * - modify snapshots on disk;
 * - modify the governed change report on disk.
 */

(function initializeWorkspaceChangeDetectionEngine(global) {
    "use strict";

    const ENGINE_NAME =
        "Workspace Change Detection Engine";

    const ENGINE_VERSION = "1.0.0";

    const CHANGE_REPORT_DOCUMENT_PATH =
        "governance/workspace/changes/" +
        "WORKSPACE-CHANGE-REPORT-001.json";

    const EXPECTED_DOCUMENT_ID =
        "WORKSPACE-CHANGE-REPORT-001";

    const EXPECTED_REPORT_TYPE =
        "Workspace Change Report";

    const COMPARISON_METHOD =
        "Relative Path and File Metadata Comparison";

    const TMSWorkspaceChangeDetectionEngine = {
        engineName: ENGINE_NAME,
        version: ENGINE_VERSION,

        changeReportDocumentPath:
            CHANGE_REPORT_DOCUMENT_PATH,

        initialized: false,

        governedChangeReportDocument: null,
        currentSnapshot: null,
        runtimeChangeReport: null,
        validationReport: null,

        /**
         * Initializes the Workspace Change Detection Engine.
         *
         * Initialization loads and validates the governed
         * change report foundation and obtains the current
         * runtime snapshot from the Snapshot Engine.
         *
         * A baseline snapshot is not assumed during
         * initialization. Comparison begins only when
         * compareSnapshots() is called with two snapshots.
         *
         * @returns {Promise<boolean>}
         */
        async initialize() {
            this.resetRuntimeState();

            try {
                this.validateDependencies();

                this.governedChangeReportDocument =
                    await this.loadGovernedChangeReportDocument();

                this.currentSnapshot =
                    this.loadCurrentSnapshot();

                this.runtimeChangeReport =
                    this.createRuntimeChangeReport(
                        this.governedChangeReportDocument
                    );

                this.validationReport =
                    this.validateChangeReport(
                        this.runtimeChangeReport
                    );

                this.runtimeChangeReport.validation = {
                    validated:
                        this.validationReport.validated,

                    accepted:
                        this.validationReport.accepted
                };

                if (!this.validationReport.accepted) {
                    console.error(
                        `${ENGINE_NAME} initialization rejected.`,
                        this.validationReport
                    );

                    return false;
                }

                this.initialized = true;

                console.log(
                    `${ENGINE_NAME} Initialized`
                );

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

            this.governedChangeReportDocument = null;
            this.currentSnapshot = null;
            this.runtimeChangeReport = null;
            this.validationReport = null;
        },

        /**
         * Confirms that the Snapshot Engine exists and
         * has already initialized successfully.
         */
        validateDependencies() {
            if (!global.TMSWorkspaceSnapshotEngine) {
                throw new Error(
                    "Workspace Snapshot Engine is not available."
                );
            }

            if (
                typeof global.TMSWorkspaceSnapshotEngine
                    .getStatus !== "function"
            ) {
                throw new Error(
                    "Workspace Snapshot Engine status API " +
                    "is not available."
                );
            }

            const snapshotStatus =
                global.TMSWorkspaceSnapshotEngine.getStatus();

            if (
                !snapshotStatus ||
                !snapshotStatus.initialized
            ) {
                throw new Error(
                    "Workspace Snapshot Engine must be " +
                    "initialized first."
                );
            }

            if (!snapshotStatus.validationAccepted) {
                throw new Error(
                    "Workspace Snapshot Engine validation " +
                    "must be accepted first."
                );
            }
        },

        /**
         * Loads the governed change report foundation.
         *
         * @returns {Promise<Object>}
         */
        async loadGovernedChangeReportDocument() {
            const response = await fetch(
                this.changeReportDocumentPath,
                {
                    cache: "no-store"
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Unable to load governed workspace " +
                    "change report document. " +
                    `HTTP ${response.status} ` +
                    `${response.statusText}`
                );
            }

            const document = await response.json();

            console.log(
                "Governed workspace change report " +
                "document loaded."
            );

            return document;
        },

        /**
         * Loads a protected copy of the current snapshot
         * from the Workspace Snapshot Engine.
         *
         * @returns {Object}
         */
        loadCurrentSnapshot() {
            const snapshot =
                global.TMSWorkspaceSnapshotEngine
                    .getSnapshot();

            if (!snapshot) {
                throw new Error(
                    "Current workspace snapshot could " +
                    "not be loaded."
                );
            }

            return this.clone(snapshot);
        },

        /**
         * Creates a safe runtime copy of the governed
         * change report foundation.
         *
         * @param {Object} governedDocument
         * @returns {Object}
         */
        createRuntimeChangeReport(governedDocument) {
            const report =
                this.clone(governedDocument);

            if (
                !report.comparison ||
                typeof report.comparison !== "object"
            ) {
                report.comparison = {
                    baselineSnapshot: null,
                    currentSnapshot: null,
                    comparisonMethod: null
                };
            }

            if (
                !report.summary ||
                typeof report.summary !== "object"
            ) {
                report.summary =
                    this.createEmptySummary();
            }

            if (!Array.isArray(report.changes)) {
                report.changes = [];
            }

            if (
                !report.validation ||
                typeof report.validation !== "object"
            ) {
                report.validation = {
                    validated: false,
                    accepted: false
                };
            }

            return report;
        },

        /**
         * Compares a baseline snapshot with a current
         * snapshot and creates a runtime change report.
         *
         * This method does not write to disk.
         *
         * @param {Object} baselineSnapshot
         * @param {Object} currentSnapshot
         * @returns {Object}
         */
        compareSnapshots(
            baselineSnapshot,
            currentSnapshot
        ) {
            if (!this.initialized) {
                throw new Error(
                    "Workspace Change Detection Engine " +
                    "must be initialized first."
                );
            }

            this.validateSnapshotForComparison(
                baselineSnapshot,
                "Baseline"
            );

            this.validateSnapshotForComparison(
                currentSnapshot,
                "Current"
            );

            const changes = [];

            const baselineFolders =
                this.createItemMap(
                    baselineSnapshot.folders
                );

            const currentFolders =
                this.createItemMap(
                    currentSnapshot.folders
                );

            const baselineFiles =
                this.createItemMap(
                    baselineSnapshot.files
                );

            const currentFiles =
                this.createItemMap(
                    currentSnapshot.files
                );

            this.detectAddedItems(
                baselineFolders,
                currentFolders,
                "Folder",
                "New Folder",
                changes
            );

            this.detectDeletedItems(
                baselineFolders,
                currentFolders,
                "Folder",
                "Deleted Folder",
                changes
            );

            this.detectAddedItems(
                baselineFiles,
                currentFiles,
                "File",
                "New File",
                changes
            );

            this.detectDeletedItems(
                baselineFiles,
                currentFiles,
                "File",
                "Deleted File",
                changes
            );

            this.detectModifiedFiles(
                baselineFiles,
                currentFiles,
                changes
            );

            const sortedChanges =
                changes.sort((left, right) => {
                    const leftPath =
                        left.relativePath ?? "";

                    const rightPath =
                        right.relativePath ?? "";

                    const pathComparison =
                        leftPath.localeCompare(
                            rightPath
                        );

                    if (pathComparison !== 0) {
                        return pathComparison;
                    }

                    return (
                        left.changeType ?? ""
                    ).localeCompare(
                        right.changeType ?? ""
                    );
                });

            const summary =
                this.createSummary(sortedChanges);

            const report =
                this.createRuntimeChangeReport(
                    this.governedChangeReportDocument
                );

            report.status = "Compared";
            report.generatedAt =
                new Date().toISOString();

            report.generatedBy = ENGINE_NAME;

            report.comparison = {
                baselineSnapshot:
                    this.createSnapshotReference(
                        baselineSnapshot
                    ),

                currentSnapshot:
                    this.createSnapshotReference(
                        currentSnapshot
                    ),

                comparisonMethod:
                    COMPARISON_METHOD
            };

            report.summary = summary;
            report.changes = sortedChanges;

            const reportValidation =
                this.validateChangeReport(report);

            report.validation = {
                validated:
                    reportValidation.validated,

                accepted:
                    reportValidation.accepted
            };

            this.runtimeChangeReport = report;
            this.validationReport =
                reportValidation;

            return this.clone(report);
        },

        /**
         * Creates a map keyed by normalized relative path.
         *
         * @param {Array} items
         * @returns {Map<string, Object>}
         */
        createItemMap(items) {
            const map = new Map();

            for (const item of items) {
                const key =
                    this.normalizeRelativePath(
                        item.relativePath
                    );

                if (!key) {
                    continue;
                }

                map.set(
                    key,
                    this.clone(item)
                );
            }

            return map;
        },

        /**
         * Detects items present only in the current map.
         *
         * @param {Map} baselineMap
         * @param {Map} currentMap
         * @param {string} itemType
         * @param {string} changeType
         * @param {Array} changes
         */
        detectAddedItems(
            baselineMap,
            currentMap,
            itemType,
            changeType,
            changes
        ) {
            for (
                const [path, currentItem]
                of currentMap.entries()
            ) {
                if (baselineMap.has(path)) {
                    continue;
                }

                changes.push({
                    changeType,
                    itemType,
                    relativePath:
                        currentItem.relativePath,
                    previousRelativePath: null,
                    baselineItem: null,
                    currentItem:
                        this.clone(currentItem)
                });
            }
        },

        /**
         * Detects items present only in the baseline map.
         *
         * @param {Map} baselineMap
         * @param {Map} currentMap
         * @param {string} itemType
         * @param {string} changeType
         * @param {Array} changes
         */
        detectDeletedItems(
            baselineMap,
            currentMap,
            itemType,
            changeType,
            changes
        ) {
            for (
                const [path, baselineItem]
                of baselineMap.entries()
            ) {
                if (currentMap.has(path)) {
                    continue;
                }

                changes.push({
                    changeType,
                    itemType,
                    relativePath:
                        baselineItem.relativePath,
                    previousRelativePath:
                        baselineItem.relativePath,
                    baselineItem:
                        this.clone(baselineItem),
                    currentItem: null
                });
            }
        },

        /**
         * Detects file metadata changes for files found
         * at the same relative path in both snapshots.
         *
         * Version 1.0.0 compares:
         * - sizeBytes
         * - modifiedAt
         * - attributes
         * - isReadOnly
         *
         * @param {Map} baselineFiles
         * @param {Map} currentFiles
         * @param {Array} changes
         */
        detectModifiedFiles(
            baselineFiles,
            currentFiles,
            changes
        ) {
            for (
                const [path, baselineFile]
                of baselineFiles.entries()
            ) {
                if (!currentFiles.has(path)) {
                    continue;
                }

                const currentFile =
                    currentFiles.get(path);

                const differences =
                    this.getFileDifferences(
                        baselineFile,
                        currentFile
                    );

                if (differences.length === 0) {
                    continue;
                }

                changes.push({
                    changeType: "Modified File",
                    itemType: "File",
                    relativePath:
                        currentFile.relativePath,
                    previousRelativePath:
                        baselineFile.relativePath,
                    differences,
                    baselineItem:
                        this.clone(baselineFile),
                    currentItem:
                        this.clone(currentFile)
                });
            }
        },

        /**
         * Returns the compared file properties that differ.
         *
         * @param {Object} baselineFile
         * @param {Object} currentFile
         * @returns {Array}
         */
        getFileDifferences(
            baselineFile,
            currentFile
        ) {
            const properties = [
                "sizeBytes",
                "modifiedAt",
                "attributes",
                "isReadOnly"
            ];

            const differences = [];

            for (const property of properties) {
                const baselineValue =
                    baselineFile[property] ?? null;

                const currentValue =
                    currentFile[property] ?? null;

                if (baselineValue === currentValue) {
                    continue;
                }

                differences.push({
                    property,
                    baselineValue,
                    currentValue
                });
            }

            return differences;
        },

        /**
         * Builds the governed summary counts.
         *
         * Renamed and moved detection are reserved for a
         * later governed version because Version 1.0.0 does
         * not use content hashes or stable file identities.
         *
         * @param {Array} changes
         * @returns {Object}
         */
        createSummary(changes) {
            const summary =
                this.createEmptySummary();

            for (const change of changes) {
                switch (change.changeType) {
                    case "New Folder":
                        summary.newFolders += 1;
                        break;

                    case "Deleted Folder":
                        summary.deletedFolders += 1;
                        break;

                    case "New File":
                        summary.newFiles += 1;
                        break;

                    case "Deleted File":
                        summary.deletedFiles += 1;
                        break;

                    case "Modified File":
                        summary.modifiedFiles += 1;
                        break;

                    case "Renamed Item":
                        summary.renamedItems += 1;
                        break;

                    case "Moved Item":
                        summary.movedItems += 1;
                        break;

                    default:
                        break;
                }
            }

            summary.totalChanges =
                changes.length;

            return summary;
        },

        /**
         * Returns an empty governed summary.
         *
         * @returns {Object}
         */
        createEmptySummary() {
            return {
                totalChanges: 0,
                newFolders: 0,
                deletedFolders: 0,
                newFiles: 0,
                deletedFiles: 0,
                modifiedFiles: 0,
                renamedItems: 0,
                movedItems: 0
            };
        },

        /**
         * Creates a reference to a compared snapshot.
         *
         * @param {Object} snapshot
         * @returns {Object}
         */
        createSnapshotReference(snapshot) {
            return {
                documentId:
                    snapshot.documentId ?? null,

                version:
                    snapshot.version ?? null,

                snapshotNumber:
                    snapshot.snapshotNumber ?? null,

                generatedAt:
                    snapshot.generatedAt ?? null,

                generatedBy:
                    snapshot.generatedBy ?? null,

                folderCount:
                    snapshot.summary?.folderCount ??
                    snapshot.folders.length,

                fileCount:
                    snapshot.summary?.fileCount ??
                    snapshot.files.length
            };
        },

        /**
         * Validates a snapshot before comparison.
         *
         * @param {Object} snapshot
         * @param {string} label
         */
        validateSnapshotForComparison(
            snapshot,
            label
        ) {
            if (
                !snapshot ||
                typeof snapshot !== "object"
            ) {
                throw new Error(
                    `${label} snapshot must be a valid object.`
                );
            }

            if (
                snapshot.documentId !==
                "WORKSPACE-SNAPSHOT-001"
            ) {
                throw new Error(
                    `${label} snapshot has an invalid documentId.`
                );
            }

            if (!Array.isArray(snapshot.folders)) {
                throw new Error(
                    `${label} snapshot folders must be an array.`
                );
            }

            if (!Array.isArray(snapshot.files)) {
                throw new Error(
                    `${label} snapshot files must be an array.`
                );
            }
        },

        /**
         * Validates the runtime change report.
         *
         * @param {Object} report
         * @returns {Object}
         */
        validateChangeReport(report) {
            const errors = [];
            const warnings = [];

            if (
                !report ||
                typeof report !== "object"
            ) {
                errors.push(
                    "Change report must be a valid object."
                );
            }

            if (
                report?.documentId !==
                EXPECTED_DOCUMENT_ID
            ) {
                errors.push(
                    "Change report documentId must be " +
                    `"${EXPECTED_DOCUMENT_ID}".`
                );
            }

            if (
                report?.reportType !==
                EXPECTED_REPORT_TYPE
            ) {
                errors.push(
                    "Change report type must be " +
                    `"${EXPECTED_REPORT_TYPE}".`
                );
            }

            if (
                typeof report?.version !== "string" ||
                report.version.trim() === ""
            ) {
                errors.push(
                    "Change report version is required."
                );
            }

            if (
                typeof report?.reportNumber !== "number" ||
                report.reportNumber < 1
            ) {
                errors.push(
                    "Change report number must be greater than zero."
                );
            }

            if (
                !report?.comparison ||
                typeof report.comparison !== "object"
            ) {
                errors.push(
                    "Change report comparison information is required."
                );
            }

            if (
                !report?.summary ||
                typeof report.summary !== "object"
            ) {
                errors.push(
                    "Change report summary is required."
                );
            }

            if (!Array.isArray(report?.changes)) {
                errors.push(
                    "Change report changes must be an array."
                );
            }

            if (
                Array.isArray(report?.changes) &&
                report?.summary?.totalChanges !==
                report.changes.length
            ) {
                errors.push(
                    "Change report totalChanges does not " +
                    "match the changes array."
                );
            }

            if (!report?.generatedAt) {
                warnings.push(
                    "Change comparison has not yet been generated."
                );
            }

            if (!report?.generatedBy) {
                warnings.push(
                    "Change report generator identity has " +
                    "not yet been recorded."
                );
            }

            if (
                !report?.comparison?.baselineSnapshot
            ) {
                warnings.push(
                    "Baseline snapshot has not yet been assigned."
                );
            }

            if (
                !report?.comparison?.currentSnapshot
            ) {
                warnings.push(
                    "Current snapshot comparison reference " +
                    "has not yet been assigned."
                );
            }

            if (
                !report?.comparison?.comparisonMethod
            ) {
                warnings.push(
                    "Comparison method has not yet been recorded."
                );
            }

            const accepted =
                errors.length === 0;

            return {
                engine: ENGINE_NAME,
                engineVersion: ENGINE_VERSION,
                documentId:
                    report?.documentId ?? null,
                reportNumber:
                    report?.reportNumber ?? null,
                validated: true,
                accepted,
                errorCount: errors.length,
                warningCount: warnings.length,
                errors,
                warnings
            };
        },

        /**
         * Normalizes a relative path for comparison.
         *
         * Windows paths are compared without regard to case.
         *
         * @param {*} path
         * @returns {string|null}
         */
        normalizeRelativePath(path) {
            if (
                typeof path !== "string" ||
                path.trim() === ""
            ) {
                return null;
            }

            return path
                .replaceAll("/", "\\")
                .replace(/^\.\\/, "")
                .trim()
                .toLowerCase();
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

                governedChangeReportDocumentLoaded:
                    this.governedChangeReportDocument !== null,

                currentSnapshotLoaded:
                    this.currentSnapshot !== null,

                runtimeChangeReportInitialized:
                    this.runtimeChangeReport !== null,

                validationAccepted:
                    this.validationReport?.accepted ??
                    false,

                comparisonCompleted:
                    this.runtimeChangeReport?.status ===
                    "Compared"
            };
        },

        /**
         * Returns a protected copy of the current snapshot.
         *
         * @returns {Object|null}
         */
        getCurrentSnapshot() {
            return this.currentSnapshot
                ? this.clone(this.currentSnapshot)
                : null;
        },

        /**
         * Returns a protected copy of the governed change
         * report foundation document.
         *
         * @returns {Object|null}
         */
        getGovernedChangeReportDocument() {
            return this.governedChangeReportDocument
                ? this.clone(
                    this.governedChangeReportDocument
                )
                : null;
        },

        /**
         * Returns a protected copy of the runtime report.
         *
         * @returns {Object|null}
         */
        getChangeReport() {
            return this.runtimeChangeReport
                ? this.clone(this.runtimeChangeReport)
                : null;
        },

        /**
         * Returns a protected copy of the validation report.
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

    global.TMSWorkspaceChangeDetectionEngine =
        TMSWorkspaceChangeDetectionEngine;

    console.log(
        `${ENGINE_NAME} Loaded`
    );
})(window);