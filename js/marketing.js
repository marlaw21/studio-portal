/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 044D — Marketing Renderer Uses StudioDB
File: js/marketing.js
*/

(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        renderMarketingChannels();
        renderMarketingPipeline();

        console.log("Marketing page rendered successfully using StudioDB.");
    });

    function renderMarketingChannels() {
        const container = document.getElementById("marketing-channel-list");
        if (!container) return;

        const channels = getRecords("marketingChannels");

        if (channels.length === 0) {
            container.innerHTML = `
                <div class="project-item">
                    <div>
                        <h3>No Marketing Channels</h3>
                        <p>No marketing channels have been added yet.</p>
                    </div>
                    <span class="project-status planned">Empty</span>
                </div>
            `;
            return;
        }

        container.innerHTML = channels.map(function (channel) {
            return `
                <div class="project-item">
                    <div>
                        <h3>${safeText(channel.name || channel.title || "Unnamed Channel")}</h3>
                        <p>${safeText(channel.description || channel.summary || "No description provided.")}</p>
                    </div>
                    <span class="project-status ${getStatusClass(channel.status)}">${safeText(channel.status || "Planned")}</span>
                </div>
            `;
        }).join("");
    }

    function renderMarketingPipeline() {
        const container = document.getElementById("marketing-pipeline-list");
        if (!container) return;

        const pipeline = getRecords("marketingPipeline");

        if (pipeline.length === 0) {
            container.innerHTML = `
                <div class="area-item">
                    <span>🎬</span>
                    <strong>No Marketing Pipeline Steps</strong>
                    <p>No marketing pipeline steps have been added yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = pipeline.map(function (step) {
            return `
                <div class="area-item">
                    <span>${safeText(step.icon || "🎬")}</span>
                    <strong>${safeText(step.name || step.title || "Unnamed Step")}</strong>
                    <p>${safeText(step.description || step.summary || "No description provided.")}</p>
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
        switch (String(status || "").toLowerCase()) {
            case "planned":
            case "deferred":
                return "planned";

            case "active":
                return "active";

            case "complete":
                return "complete";

            default:
                return "";
        }
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