/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 034
Shared Components Engine

Purpose:
Provides reusable UI components for every department.
*/

(function () {
    "use strict";

    function safeText(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function renderEmptyCard(title, description, status) {
        return `
            <div class="project-item">
                <div>
                    <h3>${safeText(title)}</h3>
                    <p>${safeText(description)}</p>
                </div>
                <span class="project-status planned">
                    ${safeText(status || "Empty")}
                </span>
            </div>
        `;
    }

    function renderProjectCard(record) {

        const title =
            record.name ||
            record.title ||
            ("Work Session " + (record.number || ""));

        const description =
            record.description ||
            record.focus ||
            record.completed ||
            "";

        const category =
            record.category ||
            record.phase ||
            record.version ||
            "";

        const status =
            record.status ||
            "";

        const planned =
            status === "Planned" ||
            status === "Deferred";

        return `
            <div class="project-item">

                <div>

                    <h3>${safeText(title)}</h3>

                    <p>${safeText(description)}</p>

                    ${
                        category
                            ? `<p class="detail-label">${safeText(category)}</p>`
                            : ""
                    }

                </div>

                <span class="project-status ${planned ? "planned" : ""}">
                    ${safeText(status)}
                </span>

            </div>
        `;
    }

    window.TMSComponents = {

        renderProjectCard,

        renderEmptyCard

    };

})();