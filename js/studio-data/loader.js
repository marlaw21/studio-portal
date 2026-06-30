/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 043 — StudioDB Dynamic Record Types
File: js/studio-data/loader.js
*/

(function () {
    "use strict";

    window.studioData = {
        ...(window.studioCoreData || {}),
        ...(window.studioDocumentationData || {}),
        ...(window.studioDepartmentData || {})
    };

    if (window.studioDatabaseData && window.studioDatabaseData.records) {
        window.studioData.database = window.studioDatabaseData;
        window.studioData.records = window.studioDatabaseData.records;
    }

    window.studio = window.studioData;

    window.StudioDB = {
        get: function (recordType) {
            return getRecords(recordType).slice();
        },

        find: function (recordType, id) {
            return getRecords(recordType).find(function (record) {
                return record.id === id;
            }) || null;
        },

        filter: function (recordType, fieldName, value) {
            return getRecords(recordType).filter(function (record) {
                return String(record[fieldName] || "").toLowerCase() === String(value || "").toLowerCase();
            });
        },

        count: function (recordType) {
            return getRecords(recordType).length;
        },

        latest: function (recordType, limit) {
            const max = limit || 5;
            return getRecords(recordType).slice(0, max);
        },

        search: function (query) {
            const cleanQuery = String(query || "").toLowerCase().trim();
            const results = [];

            if (!cleanQuery) return results;

            getAllRecordTypes().forEach(function (recordType) {
                getRecords(recordType).forEach(function (record) {
                    const text = Object.keys(record).map(function (key) {
                        return String(record[key] || "");
                    }).join(" ").toLowerCase();

                    if (text.includes(cleanQuery)) {
                        results.push({
                            recordType: recordType,
                            record: record
                        });
                    }
                });
            });

            return results;
        },

        types: function () {
            return getAllRecordTypes();
        }
    };

    function getRecords(recordType) {
        if (
            window.studioData &&
            window.studioData.records &&
            Array.isArray(window.studioData.records[recordType])
        ) {
            return window.studioData.records[recordType];
        }

        return [];
    }

    function getAllRecordTypes() {
        if (
            window.studioData &&
            window.studioData.records &&
            typeof window.studioData.records === "object"
        ) {
            return Object.keys(window.studioData.records);
        }

        return [];
    }

    console.log("Studio data and StudioDB loaded successfully:", {
        studioData: window.studioData,
        StudioDB: window.StudioDB
    });
})();