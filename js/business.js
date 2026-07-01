/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 044E — Business Renderer Uses StudioDB
File: js/business.js
*/

(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        renderBusinessProjects();
        renderBusinessStatus();

        console.log("Business page rendered successfully using StudioDB.");
    });

    function renderBusinessProjects() {
        const container = document.getElementById("business-project-list");
        if (!container) return;

        const projects = getRecords("projects");

        if (projects.length === 0) {
            container.innerHTML = `
                <div class="project-item">
                    <div>
                        <h3>No Business Projects</h3>
                        <p>No business projects have been added yet.</p>
                    </div>
                    <span class="project-status planned">Empty</span>
                </div>
            `;
            return;
        }

        container.innerHTML = projects.map(function (project) {
            return `
                <div class="project-item">
                    <div>
                        <h3>${safeText(project.name || project.title || "Unnamed Project")}</h3>
                        <p>${safeText(project.description || project.summary || "No description provided.")}</p>
                    </div>
                    <span class="project-status ${getStatusClass(project.status)}">${safeText(project.status || "Planned")}</span>
                </div>
            `;
        }).join("");
    }

    function renderBusinessStatus() {
        const container = document.getElementById("business-status-list");
        if (!container) return;

        const statusItems = getRecords("status");

        if (statusItems.length === 0) {
            container.innerHTML = `
                <div class="status-row">
                    <span>No Business Status Records</span>
                    <strong>Empty</strong>
                </div>
            `;
            return;
        }

        container.innerHTML = statusItems.map(function (item) {
            return `
                <div class="status-row">
                    <span>${safeText(item.label || item.name || "Status")}</span>
                    <strong>${safeText(item.value || item.status || "Not set")}</strong>
                </div>
            `;
        }).join("");
    }

    function getRecords(recordType) {
        if (window.StudioDB && typeof window.StudioDB.get === "function") {
            return window.StudioDB.get(recordType);
        }

        return [];
    }

    function getStatusClass(status) {
        const normalizedStatus = String(status || "").toLowerCase();

        if (normalizedStatus === "planned" || normalizedStatus === "deferred") {
            return "planned";
        }

        if (
            normalizedStatus === "active" ||
            normalizedStatus === "in progress" ||
            normalizedStatus === "in development"
        ) {
            return "active";
        }

        if (normalizedStatus === "complete" || normalizedStatus === "completed") {
            return "complete";
        }

        return "";
    }

    function safeText(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

})();