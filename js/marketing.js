/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 031 — Marketing Page Rendering Engine
File: js/marketing.js
*/

(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        const data = window.studioData || window.studio || {};

        renderMarketingChannels(data);
        renderMarketingPipeline(data);

        console.log("Marketing page rendered successfully.");
    });

    function renderMarketingChannels(data) {
        const container = document.getElementById("marketing-channel-list");
        if (!container) return;

        const channels = findMarketingChannels(data);

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
                        <p>${safeText(channel.description || "No description provided.")}</p>
                    </div>
                    <span class="project-status ${getStatusClass(channel.status)}">${safeText(channel.status || "Planned")}</span>
                </div>
            `;
        }).join("");
    }

    function renderMarketingPipeline(data) {
        const container = document.getElementById("marketing-pipeline-list");
        if (!container) return;

        const pipeline = findMarketingPipeline(data);

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
                    <p>${safeText(step.description || "No description provided.")}</p>
                </div>
            `;
        }).join("");
    }

    function findMarketingChannels(data) {
        if (Array.isArray(data.marketingChannels)) return data.marketingChannels;
        if (data.marketing && Array.isArray(data.marketing.channels)) return data.marketing.channels;
        if (Array.isArray(data.marketing)) return data.marketing;
        return [];
    }

    function findMarketingPipeline(data) {
        if (Array.isArray(data.marketingPipeline)) return data.marketingPipeline;
        if (data.marketing && Array.isArray(data.marketing.pipeline)) return data.marketing.pipeline;
        return [];
    }

    function getStatusClass(status) {
        if (status === "Planned" || status === "Deferred") {
            return "planned";
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