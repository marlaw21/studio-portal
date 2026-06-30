/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 031 — Business Operations Page Rendering Engine
File: js/business.js
*/

(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        const data = window.studioData || window.studio || {};

        renderBusinessProjects(data);
        renderBusinessStatus(data);

        console.log("Business page rendered successfully.");
    });

    function renderBusinessProjects(data) {
        const container = document.getElementById("business-project-list");
        if (!container) return;

        const projects = findBusinessProjects(data);

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
                        <p>${safeText(project.description || "No description provided.")}</p>
                    </div>
                    <span class="project-status ${getStatusClass(project.status)}">${safeText(project.status || "Planned")}</span>
                </div>
            `;
        }).join("");
    }

    function renderBusinessStatus(data) {
        const container = document.getElementById("business-status-list");
        if (!container) return;

        const statusItems = findBusinessStatus(data);

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

    function findBusinessProjects(data) {
        if (Array.isArray(data.businessProjects)) return data.businessProjects;
        if (data.business && Array.isArray(data.business.projects)) return data.business.projects;

        /*
        Temporary foundation fallback:
        Until business-specific records are added, the Business page may display
        current studio projects from the shared project list.
        */
        if (Array.isArray(data.projects)) return data.projects;

        return [];
    }

    function findBusinessStatus(data) {
        if (Array.isArray(data.businessStatus)) return data.businessStatus;
        if (data.business && Array.isArray(data.business.status)) return data.business.status;

        /*
        Temporary foundation fallback:
        Until business-specific records are added, the Business page may display
        shared studio status records.
        */
        if (Array.isArray(data.status)) return data.status;

        return [];
    }

    function getStatusClass(status) {
        const normalizedStatus = String(status || "").toLowerCase();

        if (normalizedStatus === "planned" || normalizedStatus === "deferred") {
            return "planned";
        }

        if (normalizedStatus === "active" || normalizedStatus === "in progress") {
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