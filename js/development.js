/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 044C — Development Renderer Uses StudioDB
File: js/development.js
*/

(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        renderDevelopmentProjects();

        console.log("Development page rendered successfully using StudioDB.");
    });

    function renderDevelopmentProjects() {
        const container = document.getElementById("development-project-list");

        if (!container) return;

        const projects = getRecords("projects");

        if (projects.length === 0) {
            container.innerHTML = `
                <div class="project-item">
                    <div>
                        <h3>No Development Projects</h3>
                        <p>No projects have been added yet.</p>
                    </div>
                    <span class="project-status planned">Empty</span>
                </div>
            `;
            return;
        }

        container.innerHTML = projects.map(renderProject).join("");
    }

    function renderProject(project) {
        const name = project.name || project.title || "Unnamed Project";
        const description = project.description || project.summary || "";
        const status = project.status || "Planned";

        return `
            <div class="project-item">
                <div>
                    <h3>${escapeHtml(name)}</h3>
                    <p>${escapeHtml(description)}</p>
                </div>
                <span class="project-status ${statusClass(status)}">${escapeHtml(status)}</span>
            </div>
        `;
    }

    function getRecords(recordType) {
        if (window.StudioDB && typeof window.StudioDB.get === "function") {
            return window.StudioDB.get(recordType);
        }

        return [];
    }

    function statusClass(status) {
        switch (String(status || "").toLowerCase()) {
            case "planned":
                return "planned";
            case "complete":
                return "complete";
            case "active":
                return "active";
            case "in progress":
            case "in development":
                return "active";
            default:
                return "";
        }
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
})();