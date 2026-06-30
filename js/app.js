/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 039 — Headquarters Uses StudioDB
File: js/app.js
*/

(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        const data = window.studio || window.studioData || {};

        if (!data || Object.keys(data).length === 0) {
            console.warn("Studio data was not found. Check studio-data files and loader.js.");
            return;
        }

        renderHeader(data);
        renderTodaysFocus(data);
        renderStudioState(data);
        renderNotifications();
        renderStudioCommands();
        renderSystemConfig();
        renderProjects();
        renderStudioStatus();
        renderProgress();
        renderStudioAreas();
        renderFooter(data);

        console.log("Headquarters rendered successfully using StudioDB.");
    });

    function renderHeader(data) {
        const headerTitle = document.querySelector(".studio-header h1");
        const headerSubtitle = document.querySelector(".header-subtitle");

        if (headerTitle && data.studio && data.studio.name) {
            headerTitle.textContent = data.studio.name;
        }

        if (headerSubtitle && data.studio && data.studio.mission) {
            headerSubtitle.textContent = data.studio.mission;
        }
    }

    function renderTodaysFocus(data) {
        const card = findCardByHeading("Today's Focus");
        if (!card || !data.studioState || !data.studio) return;

        const body = getCardBody(card);

        body.innerHTML = `
            <p class="focus-text">${safeText(data.studioState.currentMilestone || "Current work session")}</p>
            <div class="focus-details">
                <div>
                    <p class="detail-label">Project</p>
                    <strong>${safeText(data.studioState.activeProject || "Not set")}</strong>
                </div>
                <div>
                    <p class="detail-label">Phase</p>
                    <strong>${safeText(data.studioState.currentDepartment || "Not set")}</strong>
                </div>
                <div>
                    <p class="detail-label">Version</p>
                    <strong>${safeText(data.studio.currentVersion || "Not set")}</strong>
                </div>
            </div>
        `;
    }

    function renderStudioState(data) {
        const card = findCardByHeading("Studio State");
        if (!card || !data.studioState) return;

        const body = getCardBody(card);

        body.innerHTML = `
            <div class="status-list">
                ${renderStatusRow("Active Project", data.studioState.activeProject)}
                ${renderStatusRow("Current Milestone", data.studioState.currentMilestone)}
                ${renderStatusRow("Build Status", data.studioState.buildStatus)}
                ${renderStatusRow("Current Sprint", data.studioState.currentSprint)}
                ${renderStatusRow("Current Department", data.studioState.currentDepartment)}
                ${renderStatusRow("Last Commit", data.studioState.lastCommit)}
                ${renderStatusRow("Last Push", data.studioState.lastPush)}
            </div>
        `;
    }

    function renderNotifications() {
        const card = findCardByHeading("Notifications");
        const records = getStudioRecords("notifications");

        if (!card || records.length === 0) return;

        const body = getCardBody(card);

        body.innerHTML = `
            <div class="status-list">
                ${records.map(function (item) {
                    return `
                        <div class="status-row">
                            <div>
                                <strong>${safeText(item.title)}</strong>
                                <p>${safeText(item.description)}</p>
                            </div>
                            <span class="project-status">${safeText(item.status)}</span>
                        </div>
                    `;
                }).join("")}
            </div>
        `;
    }

    function renderStudioCommands() {
        const card = findCardByHeading("Studio Commands");
        const records = getStudioRecords("studioCommands");

        if (!card || records.length === 0) return;

        const body = getCardBody(card);

        body.innerHTML = `
            <div class="project-list">
                ${records.map(function (item) {
                    return renderProjectItem(item);
                }).join("")}
            </div>
        `;
    }

    function renderSystemConfig() {
        const card = findCardByHeading("Studio OS Configuration");
        const records = getStudioRecords("systemConfig");

        if (!card || records.length === 0) return;

        const body = getCardBody(card);

        body.innerHTML = `
            <div class="status-list">
                ${records.map(function (item) {
                    return renderStatusRow(item.label, item.value);
                }).join("")}
            </div>
        `;
    }

    function renderProjects() {
        const card = findCardByHeading("Current Projects");
        const records = getStudioRecords("projects");

        if (!card || records.length === 0) return;

        const body = getCardBody(card);

        body.innerHTML = `
            <div class="project-list">
                ${records.map(function (item) {
                    return renderProjectItem(item);
                }).join("")}
            </div>
        `;
    }

    function renderStudioStatus() {
        const card = findCardByHeading("Studio Status");
        const records = getStudioRecords("status");

        if (!card || records.length === 0) return;

        const body = getCardBody(card);

        body.innerHTML = `
            <div class="status-list">
                ${records.map(function (item) {
                    return renderStatusRow(item.label, item.value);
                }).join("")}
            </div>
        `;
    }

    function renderProgress() {
        const card = findCardByHeading("Foundation Progress");
        const records = getStudioRecords("progress");

        if (!card || records.length === 0) return;

        const body = getCardBody(card);

        body.innerHTML = `
            <div class="status-list">
                ${records.map(function (item) {
                    return renderStatusRow(item.name, item.value + "%");
                }).join("")}
            </div>
        `;
    }

    function renderStudioAreas() {
        const card = findCardByHeading("Studio Areas");
        const records = getStudioRecords("departments");

        if (!card || records.length === 0) return;

        const body = getCardBody(card);

        body.innerHTML = `
            <div class="area-grid">
                ${records.map(function (department) {
                    return `
                        <a class="area-item area-link" href="${safeAttribute(department.url)}">
                            <span>${safeText(department.icon)}</span>
                            <strong>${safeText(department.name)}</strong>
                            <p>${safeText(department.description)}</p>
                        </a>
                    `;
                }).join("")}
            </div>
        `;
    }

    function renderFooter(data) {
        const footer = document.querySelector(".studio-footer");
        if (!footer || !data.studio) return;

        footer.innerHTML = `
            <p>${safeText(data.studio.name || "Two Marshalls Studios")} © ${safeText(data.studio.copyrightYear || "2026")}</p>
            <p>Studio Headquarters Version ${safeText(data.studio.currentVersion || "Not set")}</p>
        `;
    }

    function getStudioRecords(recordType) {
        if (window.StudioDB && typeof window.StudioDB.get === "function") {
            return window.StudioDB.get(recordType);
        }

        return [];
    }

    function renderProjectItem(item) {
        return `
            <div class="project-item">
                <div>
                    <h3>${safeText(item.name)}</h3>
                    <p>${safeText(item.description)}</p>
                </div>
                <span class="project-status ${item.status === "Planned" ? "planned" : ""}">${safeText(item.status)}</span>
            </div>
        `;
    }

    function renderStatusRow(label, value) {
        return `
            <div class="status-row">
                <span>${safeText(label)}</span>
                <strong>${safeText(value || "Not set")}</strong>
            </div>
        `;
    }

    function findCardByHeading(headingText) {
        const headings = document.querySelectorAll("h2, h3");

        for (let index = 0; index < headings.length; index += 1) {
            const heading = headings[index];

            if (normalizeText(heading.textContent).includes(normalizeText(headingText))) {
                return heading.closest(".dashboard-card");
            }
        }

        return null;
    }

    function getCardBody(card) {
        let body = card.querySelector(".card-body");

        if (!body) {
            body = document.createElement("div");
            body.className = "card-body";
            card.appendChild(body);
        }

        Array.from(card.children).forEach(function (child) {
            if (!child.classList.contains("card-header") && !child.classList.contains("card-body")) {
                child.remove();
            }
        });

        return body;
    }

    function normalizeText(value) {
        return String(value || "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }

    function safeText(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function safeAttribute(value) {
        return safeText(value || "#");
    }
})();