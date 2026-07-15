/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 049 — Session Context Engine v1.5.0
File: js/session/session-context.js

Purpose:
Maintain and safely persist the active work session context in localStorage.

Version 1.5.0 introduces session-aware persistence. Each work session receives
its own storage key, while an active-session pointer identifies which session
should be restored when the Studio Portal reloads.

This module does not render UI, write permanent documentation, perform Git
operations, create ZIP packages, or synchronize data across computers.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.5.0";
    const STORAGE_SCHEMA_VERSION = 1;
    const DEFAULT_SESSION_NUMBER = "049";
    const ACTIVE_SESSION_POINTER_KEY = "tms-os:session-context:active:v1";

    const COLLECTION_NAMES = [
        "objectives",
        "completedTasks",
        "deferredTasks",
        "filesAdded",
        "filesModified",
        "filesRemoved",
        "tests",
        "bugsFixed",
        "knownBugs",
        "decisions",
        "technicalDebt",
        "enhancementIdeas",
        "documentationUpdates",
        "risks"
    ];

    const COLLECTION_ALIASES = {
        objective: "objectives",
        completedTask: "completedTasks",
        deferredTask: "deferredTasks",
        fileAdded: "filesAdded",
        fileModified: "filesModified",
        fileRemoved: "filesRemoved",
        test: "tests",
        bugFixed: "bugsFixed",
        knownBug: "knownBugs",
        decision: "decisions",
        technicalDebtItem: "technicalDebt",
        enhancementIdea: "enhancementIdeas",
        documentationUpdate: "documentationUpdates",
        risk: "risks"
    };

    let persistenceAvailable = canUseLocalStorage();
    let restorationStatus = "new";
    let activeSessionNumber = resolveActiveSessionNumber();
    let activeStorageKey = createStorageKey(activeSessionNumber);
    let state = restoreState(activeSessionNumber) ||
        createInitialState({
            sessionNumber: activeSessionNumber
        });

    if (restorationStatus !== "restored") {
        persistState();
    } else {
        persistActiveSessionPointer(activeSessionNumber);
    }

    function createStorageKey(sessionNumber) {
        return [
            "tms-os",
            "session-context",
            normalizeSessionNumber(sessionNumber),
            "v" + STORAGE_SCHEMA_VERSION
        ].join(":");
    }

    function normalizeSessionNumber(value) {
        const normalized = String(value == null ? "" : value).trim();

        if (!normalized) {
            throw new TypeError(
                "Session Context sessionNumber cannot be empty."
            );
        }

        if (!/^\d+$/.test(normalized)) {
            throw new TypeError(
                "Session Context sessionNumber must contain only numbers."
            );
        }

        return normalized.padStart(3, "0");
    }

    function createInitialState(overrides) {
        const now = new Date().toISOString();

        const initial = {
            engineVersion: ENGINE_VERSION,
            schemaVersion: STORAGE_SCHEMA_VERSION,
            sessionNumber: DEFAULT_SESSION_NUMBER,
            version: "v0.28.1",
            milestone: "Controlled Permanent Output Execution",
            module: "Rollback Package Generator",
            status: "Active",
            startedAt: now,
            updatedAt: now,
            objectives: [],
            completedTasks: [],
            deferredTasks: [],
            filesAdded: [],
            filesModified: [],
            filesRemoved: [],
            tests: [],
            bugsFixed: [],
            knownBugs: [],
            decisions: [],
            technicalDebt: [],
            enhancementIdeas: [],
            documentationUpdates: [],
            risks: []
        };

        return applyMetadata(
            initial,
            overrides || {},
            false
        );
    }

    function canUseLocalStorage() {
        try {
            const probeKey =
                "tms-os:session-context:storage-probe";

            window.localStorage.setItem(probeKey, "1");
            window.localStorage.removeItem(probeKey);

            return true;
        } catch (error) {
            console.warn(
                "Session Context persistence is unavailable. " +
                "Runtime tracking will continue without storage.",
                error
            );

            return false;
        }
    }

    function resolveActiveSessionNumber() {
        if (!persistenceAvailable) {
            return DEFAULT_SESSION_NUMBER;
        }

        const storedSessionNumber =
            window.localStorage.getItem(
                ACTIVE_SESSION_POINTER_KEY
            );

        if (!storedSessionNumber) {
            return DEFAULT_SESSION_NUMBER;
        }

        try {
            return normalizeSessionNumber(storedSessionNumber);
        } catch (error) {
            window.localStorage.removeItem(
                ACTIVE_SESSION_POINTER_KEY
            );

            console.warn(
                "The active Session Context pointer was invalid " +
                "and has been reset.",
                error
            );

            return DEFAULT_SESSION_NUMBER;
        }
    }

    function persistActiveSessionPointer(sessionNumber) {
        if (!persistenceAvailable) {
            return false;
        }

        try {
            window.localStorage.setItem(
                ACTIVE_SESSION_POINTER_KEY,
                normalizeSessionNumber(sessionNumber)
            );

            return true;
        } catch (error) {
            persistenceAvailable = false;

            console.warn(
                "The active Session Context pointer could not be saved. " +
                "Runtime tracking will continue without persistence.",
                error
            );

            return false;
        }
    }

    function restoreState(sessionNumber) {
        if (!persistenceAvailable) {
            restorationStatus = "unavailable";
            return null;
        }

        activeStorageKey = createStorageKey(sessionNumber);

        const storedText =
            window.localStorage.getItem(activeStorageKey);

        if (!storedText) {
            restorationStatus = "new";
            return null;
        }

        try {
            const parsed = JSON.parse(storedText);

            validateStoredState(
                parsed,
                sessionNumber
            );

            parsed.engineVersion = ENGINE_VERSION;
            parsed.schemaVersion = STORAGE_SCHEMA_VERSION;

            restorationStatus = "restored";

            return parsed;
        } catch (error) {
            restorationStatus = "recovered";

            window.localStorage.removeItem(
                activeStorageKey
            );

            console.warn(
                "Stored Session Context was invalid and has been " +
                "safely reset.",
                error
            );

            return null;
        }
    }

    function validateStoredState(
        candidate,
        expectedSessionNumber
    ) {
        if (
            !candidate ||
            typeof candidate !== "object" ||
            Array.isArray(candidate)
        ) {
            throw new TypeError(
                "Stored Session Context must be an object."
            );
        }

        if (
            candidate.schemaVersion !==
            STORAGE_SCHEMA_VERSION
        ) {
            throw new RangeError(
                "Stored Session Context schema version is unsupported."
            );
        }

        [
            "sessionNumber",
            "version",
            "milestone",
            "module",
            "status",
            "startedAt",
            "updatedAt"
        ].forEach(function (field) {
            if (
                typeof candidate[field] !== "string" ||
                !candidate[field].trim()
            ) {
                throw new TypeError(
                    "Stored Session Context field is invalid: " +
                    field
                );
            }
        });

        const candidateSessionNumber =
            normalizeSessionNumber(
                candidate.sessionNumber
            );

        const requiredSessionNumber =
            normalizeSessionNumber(
                expectedSessionNumber
            );

        if (
            candidateSessionNumber !==
            requiredSessionNumber
        ) {
            throw new RangeError(
                "Stored Session Context belongs to another work session."
            );
        }

        candidate.sessionNumber =
            candidateSessionNumber;

        [
            "startedAt",
            "updatedAt"
        ].forEach(function (field) {
            if (
                Number.isNaN(
                    new Date(candidate[field]).getTime()
                )
            ) {
                throw new TypeError(
                    "Stored Session Context date is invalid: " +
                    field
                );
            }
        });

        COLLECTION_NAMES.forEach(
            function (collectionName) {
                if (
                    !Array.isArray(
                        candidate[collectionName]
                    )
                ) {
                    throw new TypeError(
                        "Stored Session Context collection is invalid: " +
                        collectionName
                    );
                }

                candidate[collectionName].forEach(
                    normalizeEntry
                );
            }
        );
    }

    function persistState() {
        if (!persistenceAvailable) {
            return false;
        }

        try {
            activeStorageKey = createStorageKey(
                state.sessionNumber
            );

            window.localStorage.setItem(
                activeStorageKey,
                JSON.stringify(state)
            );

            persistActiveSessionPointer(
                state.sessionNumber
            );

            return true;
        } catch (error) {
            persistenceAvailable = false;

            console.warn(
                "Session Context could not be saved. " +
                "Runtime tracking will continue without persistence.",
                error
            );

            return false;
        }
    }

    function applyMetadata(
        target,
        updates,
        shouldPersist
    ) {
        const allowedFields = [
            "sessionNumber",
            "version",
            "milestone",
            "module",
            "status",
            "startedAt"
        ];

        allowedFields.forEach(function (field) {
            if (
                Object.prototype.hasOwnProperty.call(
                    updates,
                    field
                )
            ) {
                target[field] =
                    normalizeMetadataValue(
                        field,
                        updates[field]
                    );
            }
        });

        target.updatedAt =
            new Date().toISOString();

        if (shouldPersist !== false) {
            persistState();
        }

        return target;
    }

    function normalizeMetadataValue(
        field,
        value
    ) {
        if (field === "sessionNumber") {
            return normalizeSessionNumber(value);
        }

        if (field === "startedAt") {
            const date = new Date(value);

            if (Number.isNaN(date.getTime())) {
                throw new TypeError(
                    "Session Context startedAt must be a valid date value."
                );
            }

            return date.toISOString();
        }

        const normalized =
            String(
                value == null ? "" : value
            ).trim();

        if (!normalized) {
            throw new TypeError(
                "Session Context " +
                field +
                " cannot be empty."
            );
        }

        return normalized;
    }

    function normalizeCollectionName(name) {
        if (
            COLLECTION_NAMES.indexOf(name) !== -1
        ) {
            return name;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                COLLECTION_ALIASES,
                name
            )
        ) {
            return COLLECTION_ALIASES[name];
        }

        throw new RangeError(
            "Unknown Session Context collection: " +
            name
        );
    }

    function normalizeEntry(entry) {
        if (typeof entry === "string") {
            const text = entry.trim();

            if (!text) {
                throw new TypeError(
                    "Session Context entries cannot be empty."
                );
            }

            return text;
        }

        if (
            entry &&
            typeof entry === "object" &&
            !Array.isArray(entry)
        ) {
            return cloneValue(entry);
        }

        throw new TypeError(
            "Session Context entries must be non-empty strings " +
            "or plain objects."
        );
    }

    function createEntrySignature(entry) {
        return stableStringify(entry).toLowerCase();
    }

    function stableStringify(value) {
        if (
            value === null ||
            typeof value !== "object"
        ) {
            return JSON.stringify(value);
        }

        if (Array.isArray(value)) {
            return "[" +
                value.map(stableStringify).join(",") +
                "]";
        }

        return "{" +
            Object.keys(value)
                .sort()
                .map(function (key) {
                    return JSON.stringify(key) +
                        ":" +
                        stableStringify(value[key]);
                })
                .join(",") +
            "}";
    }

    function cloneValue(value) {
        if (value === undefined) {
            return undefined;
        }

        return JSON.parse(
            JSON.stringify(value)
        );
    }

    function deepFreeze(value) {
        if (
            !value ||
            typeof value !== "object" ||
            Object.isFrozen(value)
        ) {
            return value;
        }

        Object.freeze(value);

        Object.keys(value).forEach(
            function (key) {
                deepFreeze(value[key]);
            }
        );

        return value;
    }

    function touchAndPersist() {
        state.updatedAt =
            new Date().toISOString();

        persistState();
    }

    function addEntry(
        collectionName,
        entry
    ) {
        const normalizedCollection =
            normalizeCollectionName(
                collectionName
            );

        const normalizedEntry =
            normalizeEntry(entry);

        const signature =
            createEntrySignature(
                normalizedEntry
            );

        const collection =
            state[normalizedCollection];

        const duplicateExists =
            collection.some(function (
                existingEntry
            ) {
                return createEntrySignature(
                    existingEntry
                ) === signature;
            });

        if (duplicateExists) {
            return false;
        }

        collection.push(normalizedEntry);
        touchAndPersist();

        return true;
    }

    function removeEntry(
        collectionName,
        entry
    ) {
        const normalizedCollection =
            normalizeCollectionName(
                collectionName
            );

        const normalizedEntry =
            normalizeEntry(entry);

        const signature =
            createEntrySignature(
                normalizedEntry
            );

        const collection =
            state[normalizedCollection];

        const originalLength =
            collection.length;

        state[normalizedCollection] =
            collection.filter(function (
                existingEntry
            ) {
                return createEntrySignature(
                    existingEntry
                ) !== signature;
            });

        if (
            state[normalizedCollection].length !==
            originalLength
        ) {
            touchAndPersist();
            return true;
        }

        return false;
    }

    function clearCollection(collectionName) {
        const normalizedCollection =
            normalizeCollectionName(
                collectionName
            );

        if (
            state[normalizedCollection].length === 0
        ) {
            return false;
        }

        state[normalizedCollection] = [];
        touchAndPersist();

        return true;
    }

    function updateMetadata(updates) {
        if (
            !updates ||
            typeof updates !== "object" ||
            Array.isArray(updates)
        ) {
            throw new TypeError(
                "Session Context metadata updates must be provided as an object."
            );
        }

        if (
            Object.prototype.hasOwnProperty.call(
                updates,
                "sessionNumber"
            )
        ) {
            const requestedSessionNumber =
                normalizeSessionNumber(
                    updates.sessionNumber
                );

            if (
                requestedSessionNumber !==
                state.sessionNumber
            ) {
                throw new RangeError(
                    "updateMetadata cannot move the context to another " +
                    "work session. Use beginSession instead."
                );
            }
        }

        applyMetadata(
            state,
            updates,
            true
        );

        return getSnapshot();
    }

    function beginSession(
        sessionNumber,
        metadata
    ) {
        const nextSessionNumber =
            normalizeSessionNumber(
                sessionNumber
            );

        const sessionMetadata =
            metadata == null
                ? {}
                : metadata;

        if (
            typeof sessionMetadata !== "object" ||
            Array.isArray(sessionMetadata)
        ) {
            throw new TypeError(
                "Session metadata must be provided as an object."
            );
        }

        if (
            nextSessionNumber ===
            state.sessionNumber
        ) {
            throw new RangeError(
                "The requested work session is already active."
            );
        }

        persistState();

        activeSessionNumber =
            nextSessionNumber;

        activeStorageKey =
            createStorageKey(
                activeSessionNumber
            );

        const storedSession =
            restoreState(
                activeSessionNumber
            );

        if (storedSession) {
            state = storedSession;
        } else {
            const nextMetadata =
                Object.assign(
                    {},
                    sessionMetadata,
                    {
                        sessionNumber:
                            activeSessionNumber
                    }
                );

            state =
                createInitialState(
                    nextMetadata
                );

            restorationStatus = "new";
            persistState();
        }

        persistActiveSessionPointer(
            activeSessionNumber
        );

        return getSnapshot();
    }

    function setStatus(status) {
        return updateMetadata({
            status: status
        });
    }

    function getSnapshot() {
        return deepFreeze(
            cloneValue(state)
        );
    }

    function getCollection(collectionName) {
        const normalizedCollection =
            normalizeCollectionName(
                collectionName
            );

        return deepFreeze(
            cloneValue(
                state[normalizedCollection]
            )
        );
    }

    function getPersistenceInfo() {
        return deepFreeze({
            available: persistenceAvailable,
            storageKey: activeStorageKey,
            activeSessionPointerKey:
                ACTIVE_SESSION_POINTER_KEY,
            activeSessionNumber:
                state.sessionNumber,
            schemaVersion:
                STORAGE_SCHEMA_VERSION,
            restorationStatus:
                restorationStatus
        });
    }

    function reset(overrides) {
        const resetOverrides =
            overrides == null
                ? {}
                : overrides;

        if (
            typeof resetOverrides !== "object" ||
            Array.isArray(resetOverrides)
        ) {
            throw new TypeError(
                "Session Context reset overrides must be provided as an object."
            );
        }

        if (
            Object.prototype.hasOwnProperty.call(
                resetOverrides,
                "sessionNumber"
            )
        ) {
            const requestedSessionNumber =
                normalizeSessionNumber(
                    resetOverrides.sessionNumber
                );

            if (
                requestedSessionNumber !==
                state.sessionNumber
            ) {
                throw new RangeError(
                    "reset cannot move the context to another work session. " +
                    "Use beginSession instead."
                );
            }
        }

        if (persistenceAvailable) {
            window.localStorage.removeItem(
                activeStorageKey
            );
        }

        restorationStatus = "reset";

        state = createInitialState(
            Object.assign(
                {},
                resetOverrides,
                {
                    sessionNumber:
                        activeSessionNumber
                }
            )
        );

        persistState();

        return getSnapshot();
    }

    function clearStoredContext() {
        if (!persistenceAvailable) {
            return false;
        }

        const existed =
            window.localStorage.getItem(
                activeStorageKey
            ) !== null;

        window.localStorage.removeItem(
            activeStorageKey
        );

        return existed;
    }

    const api = {
        engineVersion: ENGINE_VERSION,
        collectionNames:
            deepFreeze(
                COLLECTION_NAMES.slice()
            ),
        add: addEntry,
        remove: removeEntry,
        clear: clearCollection,
        updateMetadata: updateMetadata,
        beginSession: beginSession,
        setStatus: setStatus,
        getSnapshot: getSnapshot,
        getCollection: getCollection,
        getPersistenceInfo:
            getPersistenceInfo,
        reset: reset,
        clearStoredContext:
            clearStoredContext
    };

    Object.keys(
        COLLECTION_ALIASES
    ).forEach(function (methodSuffix) {
        const collectionName =
            COLLECTION_ALIASES[
                methodSuffix
            ];

        const methodName =
            "add" +
            methodSuffix.charAt(0).toUpperCase() +
            methodSuffix.slice(1);

        api[methodName] =
            function (entry) {
                return addEntry(
                    collectionName,
                    entry
                );
            };
    });

    window.TMSSessionContext =
        Object.freeze(api);

    console.log(
        "Session Context Engine v" +
        ENGINE_VERSION +
        " initialized for Work Session " +
        state.sessionNumber +
        " (" +
        restorationStatus +
        ")."
    );
}());