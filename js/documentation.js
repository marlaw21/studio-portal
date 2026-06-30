/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 038 — Documentation Renderer Uses StudioDB
File: js/documentation.js
*/

(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        const components = window.TMSComponents;

        if (!components) {
            console.warn("TMSComponents was not found. Check components.js script order.");
            return;
        }

        if (!window.StudioDB) {
            console.warn("StudioDB was not found. Check loader.js and script order.");
            return;
        }

        renderDocumentationList("documentation-build-session-list", StudioDB.get("workSessions"), "No Build Sessions", "No build sessions have been added yet.");
        renderDocumentationList("documentation-decision-list", StudioDB.get("decisions"), "No Decisions", "No studio decisions have been added yet.");
        renderDocumentationList("documentation-standard-list", StudioDB.get("standards"), "No Standards", "No studio standards have been added yet.");
        renderDocumentationList("documentation-procedure-list", StudioDB.get("procedures"), "No Procedures", "No procedures have been added yet.");
        renderDocumentationList("documentation-enhancement-list", StudioDB.get("enhancements"), "No Enhancements", "No enhancement ideas have been added yet.");

        console.log("Documentation page rendered successfully using StudioDB.", {
            workSessions: StudioDB.count("workSessions"),
            decisions: StudioDB.count("decisions"),
            standards: StudioDB.count("standards"),
            procedures: StudioDB.count("procedures"),
            enhancements: StudioDB.count("enhancements")
        });
    });

    function renderDocumentationList(elementId, records, emptyTitle, emptyDescription) {
        const container = document.getElementById(elementId);
        const components = window.TMSComponents;

        if (!container || !components) return;

        if (!Array.isArray(records) || records.length === 0) {
            container.innerHTML = components.renderEmptyCard(emptyTitle, emptyDescription, "Empty");
            return;
        }

        container.innerHTML = records.map(function (record) {
            return components.renderProjectCard(record);
        }).join("");
    }
})();