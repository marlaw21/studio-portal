/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 031 — Development Page Rendering Engine
File: js/development.js

Purpose:
- Render the Development page from structured studio data.
- Keep app.js focused on Headquarters.
- Keep Development rendering modular.
*/

(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {

        const data = window.studioData || window.studio || {};

        renderDevelopmentProjects(data);

        console.log("Development page rendered successfully.");
    });

    function renderDevelopmentProjects(data) {

        const container = document.getElementById("development-project-list");

        if (!container) {
            return;
        }

        const projects = Array.isArray(data.projects) ? data.projects : [];

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

        const name = project.name || "Unnamed Project";
        const description = project.description || "";
        const status = project.status || "Planned";

        return `
            <div class="project-item">

                <div>

                    <h3>${escapeHtml(name)}</h3>

                    <p>${escapeHtml(description)}</p>

                </div>

                <span class="project-status ${statusClass(status)}">

                    ${escapeHtml(status)}

                </span>

            </div>
        `;
    }

    function statusClass(status) {

        switch (status.toLowerCase()) {

            case "planned":
                return "planned";

            case "complete":
                return "complete";

            case "active":
                return "active";

            case "in progress":
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