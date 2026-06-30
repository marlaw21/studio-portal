/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 044 — Assets Renderer Uses StudioDB
File: js/assets.js
*/

(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        renderAssetGroups();
        console.log("Assets page rendered successfully using StudioDB.");
    });

    function renderAssetGroups() {
        const container = document.getElementById("asset-group-list");
        if (!container) return;

        const assetGroups = getRecords("assetGroups");

        if (assetGroups.length === 0) {
            container.innerHTML = `
                <div class="area-item">
                    <span>🗂️</span>
                    <strong>No Asset Groups</strong>
                    <p>No asset groups have been added yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = assetGroups.map(function (group) {
            return `
                <div class="area-item">
                    <span>${safeText(group.icon || "🗂️")}</span>
                    <strong>${safeText(group.name || group.title || "Unnamed Asset Group")}</strong>
                    <p>${safeText(group.description || group.summary || "No description provided.")}</p>
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

    function safeText(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
})();