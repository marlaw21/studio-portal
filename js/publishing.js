/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 031 — Publishing Page Rendering Engine
File: js/publishing.js
*/

(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        const data = window.studioData || window.studio || {};

        renderPublishingChannels(data);
        renderPublishingPipeline(data);

        console.log("Publishing page rendered successfully.");
    });

    function renderPublishingChannels(data) {
        const container = document.getElementById("publishing-channel-list");
        if (!container) return;

        const channels = findPublishingChannels(data);

        if (channels.length === 0) {
            container.innerHTML = `
                <div class="project-item">
                    <div>
                        <h3>No Publishing Channels</h3>
                        <p>No publishing channels have been added yet.</p>
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

    function renderPublishingPipeline(data) {
        const container = document.getElementById("publishing-pipeline-list");
        if (!container) return;

        const pipeline = findPublishingPipeline(data);

        if (pipeline.length === 0) {
            container.innerHTML = `
                <div class="area-item">
                    <span>✅</span>
                    <strong>No Publishing Pipeline Steps</strong>
                    <p>No publishing pipeline steps have been added yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = pipeline.map(function (step) {
            return `
                <div class="area-item">
                    <span>${safeText(step.icon || "✅")}</span>
                    <strong>${safeText(step.name || step.title || "Unnamed Step")}</strong>
                    <p>${safeText(step.description || "No description provided.")}</p>
                </div>
            `;
        }).join("");
    }

    function findPublishingChannels(data) {
        if (Array.isArray(data.publishingChannels)) return data.publishingChannels;
        if (data.publishing && Array.isArray(data.publishing.channels)) return data.publishing.channels;
        if (Array.isArray(data.publishing)) return data.publishing;
        return [];
    }

    function findPublishingPipeline(data) {
        if (Array.isArray(data.publishingPipeline)) return data.publishingPipeline;
        if (data.publishing && Array.isArray(data.publishing.pipeline)) return data.publishing.pipeline;
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