/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 042 — Connect All Permanent Documents
Step 5 — Catalog and Embedded Viewer Connection
File: js/documentation.js
*/

(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        const catalogContainer = document.getElementById("documentation-catalog-list");
        const searchInput = document.getElementById("documentation-search");
        const searchStatus = document.getElementById("documentation-search-status");

        if (!window.StudioDB) {
            showCatalogError(catalogContainer, searchStatus, "StudioDB is unavailable. Check loader.js and the page script order.");
            return;
        }

        if (!window.TMSDocumentViewer) {
            showCatalogError(catalogContainer, searchStatus, "The TMS Document Viewer Engine is unavailable. Check document-viewer.js and the page script order.");
            return;
        }

        if (!StudioDB.exists("documents")) {
            showCatalogError(catalogContainer, searchStatus, "The permanent document catalog is not registered in StudioDB.");
            return;
        }

        const documents = StudioDB.get("documents");
        renderCatalog(documents);
        updateSearchStatus(documents.length, documents.length, "");

        if (searchInput) {
            searchInput.addEventListener("input", function () {
                const query = searchInput.value.trim().toLowerCase();
                const filteredDocuments = documents.filter(function (record) {
                    return [record.id,record.title,record.name,record.department,record.category,record.status,record.summary,record.googleFolder,record.sourceType]
                        .map(function (value) { return String(value || "").toLowerCase(); })
                        .join(" ")
                        .includes(query);
                });
                renderCatalog(filteredDocuments);
                updateSearchStatus(filteredDocuments.length, documents.length, query);
            });
        }

        console.log("Documentation Catalog and Viewer connection loaded.", {
            documentCount: documents.length,
            connectedContentFiles: documents.filter(function (item) { return Boolean(item.documentDataFile); }).length,
            validation: StudioDB.validationReport()
        });
    });

    function renderCatalog(documents) {
        const container = document.getElementById("documentation-catalog-list");
        if (!container) return;

        if (!Array.isArray(documents) || documents.length === 0) {
            container.innerHTML = '<div class="project-item"><div><h3>No Documents Found</h3><p>No permanent documents match the current search.</p></div><span class="project-status planned">Empty</span></div>';
            return;
        }

        const groups = getDocumentGroups(documents);
        container.innerHTML = groups.map(renderDocumentGroup).join("");

        container.querySelectorAll("[data-document-id]").forEach(function (button) {
            button.addEventListener("click", function () {
                const documentId = button.getAttribute("data-document-id");
                const selectedDocument = documents.find(function (record) { return record.id === documentId; });
                if (selectedDocument) showDocumentSelection(selectedDocument);
            });
        });
    }

    function getDocumentGroups(documents) {
        const groupMap = {};
        documents.forEach(function (record) {
            const groupName = record.googleFolder || record.department || "Unassigned";
            if (!groupMap[groupName]) groupMap[groupName] = [];
            groupMap[groupName].push(record);
        });
        return Object.keys(groupMap).sort(compareGroupNames).map(function (groupName) {
            return { name: groupName, documents: groupMap[groupName].slice().sort(compareDocuments) };
        });
    }

    function compareGroupNames(a,b) {
        const an = getLeadingNumber(a), bn = getLeadingNumber(b);
        return an !== bn ? an - bn : a.localeCompare(b);
    }
    function getLeadingNumber(value) {
        const match = String(value || "").match(/^(\d+)/);
        return match ? Number(match[1]) : 9999;
    }
    function compareDocuments(a,b) {
        const c = String(a.category || "").localeCompare(String(b.category || ""));
        return c !== 0 ? c : String(a.id || "").localeCompare(String(b.id || ""));
    }

    function renderDocumentGroup(group) {
        return `
            <section class="documentation-catalog-group" style="margin-top:18px;">
                <div class="card-header" style="margin-bottom:10px;">
                    <span class="card-icon">📁</span>
                    <div><p class="section-label">Google Headquarters Location</p><h3>${safeText(group.name)}</h3></div>
                </div>
                <p class="section-label" style="margin-bottom:10px;">${group.documents.length} verified document${group.documents.length === 1 ? "" : "s"}</p>
                <div class="project-list">${group.documents.map(renderDocumentCard).join("")}</div>
            </section>
        `;
    }

    function renderDocumentCard(record) {
        const viewerState = record.documentFile ? "Viewer Ready" : "Cataloged";
        return `
            <button type="button" class="project-item" data-document-id="${safeText(record.id)}"
                style="width:100%;text-align:left;color:inherit;background:transparent;border:0;cursor:pointer;"
                aria-label="Open ${safeText(record.id)} ${safeText(record.title)}">
                <div>
                    <h3>${safeText(record.id)} — ${safeText(record.title)}</h3>
                    <p>${safeText(record.summary)}</p>
                    <p class="detail-label">${safeText(record.category)} · ${safeText(record.department)} · ${safeText(viewerState)}</p>
                </div>
                <span class="project-status">${safeText(record.status)}</span>
            </button>
        `;
    }

    async function showDocumentSelection(record) {
        const panel = document.getElementById("documentation-selection-panel");
        const title = document.getElementById("documentation-selection-title");
        const content = document.getElementById("documentation-selection-content");
        if (!panel || !title || !content) return;
        title.textContent = "Document Viewer";
        panel.hidden = false;
        await window.TMSDocumentViewer.open(record, content);
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function updateSearchStatus(resultCount,totalCount,query) {
        const status = document.getElementById("documentation-search-status");
        if (!status) return;
        status.textContent = !query
            ? "Showing all " + totalCount + " verified permanent document" + (totalCount === 1 ? "." : "s.")
            : "Showing " + resultCount + " of " + totalCount + " verified permanent documents.";
    }

    function showCatalogError(container,status,message) {
        if (status) status.textContent = message;
        if (container) container.innerHTML = '<div class="project-item"><div><h3>Documentation System Unavailable</h3><p>' + safeText(message) + '</p></div><span class="project-status planned">Error</span></div>';
    }

    function safeText(value) {
        return String(value || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
    }
})();
