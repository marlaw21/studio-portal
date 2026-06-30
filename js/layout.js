/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 033 — Shared Layout Engine
File: js/layout.js
*/

(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        renderSharedHeader();
        renderSharedNavigation();
        renderSharedFooter();

        console.log("Shared layout rendered successfully.");
    });

    function renderSharedHeader() {
        const header = document.getElementById("studio-header");
        if (!header) return;

        const pageTitle = header.getAttribute("data-page-title") || "Two Marshalls Studios";
        const pageSubtitle = header.getAttribute("data-page-subtitle") || "Command Center for games, systems, publishing, and studio operations.";
        const eyebrow = header.getAttribute("data-eyebrow") || "Studio Headquarters";

        header.className = "studio-header";
        header.innerHTML = `
            <div class="header-content">
                <p class="eyebrow">${safeText(eyebrow)}</p>
                <h1>${safeText(pageTitle)}</h1>
                <p class="header-subtitle">${safeText(pageSubtitle)}</p>
            </div>
        `;
    }

    function renderSharedNavigation() {
        const nav = document.getElementById("studio-nav");
        if (!nav) return;

        const prefix = getPathPrefix();
        const currentPage = getCurrentPage();

        const links = [
            { key: "headquarters", label: "🏠 Headquarters", href: prefix + "index.html" },
            { key: "documentation", label: "📚 Documentation", href: prefix + "pages/documentation.html" },
            { key: "development", label: "🛠 Development", href: prefix + "pages/development.html" },
            { key: "assets", label: "🎨 Assets", href: prefix + "pages/assets.html" },
            { key: "publishing", label: "🚀 Publishing", href: prefix + "pages/publishing.html" },
            { key: "marketing", label: "📣 Marketing", href: prefix + "pages/marketing.html" },
            { key: "business", label: "🏢 Business", href: prefix + "pages/business.html" }
        ];

        nav.className = "global-nav";
        nav.innerHTML = `
            <ul>
                ${links.map(function (link) {
                    const activeClass = link.key === currentPage ? " class=\"active\"" : "";
                    return `<li><a${activeClass} href="${safeAttribute(link.href)}">${safeText(link.label)}</a></li>`;
                }).join("")}
            </ul>
        `;
    }

    function renderSharedFooter() {
        const footer = document.getElementById("studio-footer");
        if (!footer) return;

        const data = window.studioData || window.studio || {};
        const studio = data.studio || {};

        footer.className = "studio-footer";
        footer.innerHTML = `
            <p id="footer-copyright">${safeText(studio.name || "Two Marshalls Studios")} © ${safeText(studio.copyrightYear || "2026")}</p>
            <p id="footer-version">Studio Headquarters Version ${safeText(studio.currentVersion || "Not set")}</p>
        `;
    }

    function getPathPrefix() {
        const path = String(window.location.pathname || "").toLowerCase();
        return path.indexOf("/pages/") !== -1 ? "../" : "";
    }

    function getCurrentPage() {
        const path = String(window.location.pathname || "").toLowerCase();

        if (path.indexOf("documentation.html") !== -1) return "documentation";
        if (path.indexOf("development.html") !== -1) return "development";
        if (path.indexOf("assets.html") !== -1) return "assets";
        if (path.indexOf("publishing.html") !== -1) return "publishing";
        if (path.indexOf("marketing.html") !== -1) return "marketing";
        if (path.indexOf("business.html") !== -1) return "business";

        return "headquarters";
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