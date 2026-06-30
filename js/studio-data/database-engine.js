/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 036 — Studio Database Engine
File: js/studio-data/database-engine.js
*/

(function () {
    "use strict";

    function getDatabase() {
        if (window.studioDatabaseData && window.studioDatabaseData.records) {
            return window.studioDatabaseData.records;
        }

        return {};
    }

    function get(recordType) {
        const database = getDatabase();
        const records = database[recordType];

        if (Array.isArray(records)) {
            return records.slice();
        }

        return [];
    }

    function find(recordType, id) {
        return get(recordType).find(function (record) {
            return record.id === id;
        }) || null;
    }

    function filter(recordType, fieldName, value) {
        return get(recordType).filter(function (record) {
            return String(record[fieldName] || "").toLowerCase() === String(value || "").toLowerCase();
        });
    }

    function count(recordType) {
        return get(recordType).length;
    }

    function latest(recordType, limit) {
        const records = get(recordType);
        const max = limit || 5;

        return records.slice(0, max);
    }

    function search(query) {
        const database = getDatabase();
        const cleanQuery = String(query || "").toLowerCase().trim();

        if (!cleanQuery) {
            return [];
        }

        const results = [];

        Object.keys(database).forEach(function (recordType) {
            const records = database[recordType];

            if (!Array.isArray(records)) return;

            records.forEach(function (record) {
                const searchableText = Object.keys(record).map(function (key) {
                    return String(record[key] || "");
                }).join(" ").toLowerCase();

                if (searchableText.includes(cleanQuery)) {
                    results.push({
                        recordType: recordType,
                        record: record
                    });
                }
            });
        });

        return results;
    }

    window.StudioDB = {
        get: get,
        find: find,
        filter: filter,
        count: count,
        latest: latest,
        search: search
    };

    console.log("Studio database engine loaded successfully.");
})();