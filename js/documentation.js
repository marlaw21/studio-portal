/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 044 — End Session Automation
Bug Fix — Permanent Document Search Relevance
File: js/documentation.js

Purpose:
- Render the permanent documentation catalog.
- Load connected JSON document content into a structured searchable index.
- Rank exact IDs, titles, keywords, and section headings above general text.
- Search metadata, paragraphs, lists, tables, records, verification data,
  and related-document references without competing search controllers.
- Preserve the existing embedded viewer connection and grouped catalog.
*/

(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        initializeDocumentationCatalog();
    });

    async function initializeDocumentationCatalog() {
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
        const searchableDocuments = documents.map(createSearchableRecord);

        renderCatalog(documents);
        updateSearchStatus(documents.length, documents.length, "", false);

        if (searchInput) {
            searchInput.disabled = true;
            searchInput.setAttribute("aria-busy", "true");
        }

        await loadDocumentSearchContent(searchableDocuments);

        if (searchInput) {
            searchInput.disabled = false;
            searchInput.removeAttribute("aria-busy");
            searchInput.addEventListener("input", function () {
                const query = normalizeSearchText(searchInput.value);
                const rankedDocuments = searchableDocuments
                    .map(function (record) {
                        return {
                            record: record,
                            score: scoreSearchRecord(record, query)
                        };
                    })
                    .filter(function (result) {
                        return !query || result.score > 0;
                    })
                    .sort(function (a, b) {
                        if (b.score !== a.score) {
                            return b.score - a.score;
                        }

                        return compareDocuments(a.record.catalogRecord, b.record.catalogRecord);
                    })
                    .map(function (result) {
                        return result.record.catalogRecord;
                    });

                renderCatalog(rankedDocuments);
                updateSearchStatus(rankedDocuments.length, documents.length, query, true);
            });
        }

        updateSearchStatus(documents.length, documents.length, "", true);

        console.log("Documentation Catalog and Viewer connection loaded.", {
            documentCount: documents.length,
            connectedContentFiles: documents.filter(function (item) { return Boolean(item.documentDataFile); }).length,
            fullContentSearchFiles: searchableDocuments.filter(function (item) { return item.contentLoaded; }).length,
            validation: StudioDB.validationReport()
        });
    }

    function createSearchableRecord(record) {
        return {
            catalogRecord: record,
            idText: normalizeSearchText(record.id),
            titleText: normalizeSearchText(record.title),
            keywordTexts: normalizeTextArray(record.keywords),
            headingTexts: [],
            summaryText: normalizeSearchText(record.summary),
            metadataText: collectSearchText(record),
            contentText: "",
            contentLoaded: false
        };
    }

    async function loadDocumentSearchContent(searchableDocuments) {
        await Promise.all(searchableDocuments.map(async function (searchableRecord) {
            const record = searchableRecord.catalogRecord;

            if (!record.documentDataFile) {
                return;
            }

            try {
                const response = await fetch(record.documentDataFile, { cache: "no-store" });

                if (!response.ok) {
                    throw new Error("Document request failed with status " + response.status + ".");
                }

                const documentData = await response.json();
                searchableRecord.idText = normalizeSearchText(documentData.id || record.id);
                searchableRecord.titleText = normalizeSearchText(documentData.title || record.title);
                searchableRecord.keywordTexts = normalizeTextArray(documentData.keywords || record.keywords);
                searchableRecord.headingTexts = collectHeadingTexts(documentData.sections);
                searchableRecord.summaryText = normalizeSearchText(documentData.summary || record.summary);
                searchableRecord.contentText = collectSearchText(documentData);
                searchableRecord.contentLoaded = true;
            } catch (error) {
                console.warn("Documentation search could not index " + record.id + ".", error);
            }
        }));
    }

    function scoreSearchRecord(searchableRecord, query) {
        if (!query) {
            return 1;
        }

        const queryWords = query.split(" ").filter(Boolean);
        const allText = searchableRecord.metadataText + " " + searchableRecord.contentText;

        if (!queryWords.every(function (word) { return allText.includes(word); })) {
            return 0;
        }

        let score = 0;

        score += scoreExactAndPhrase(searchableRecord.idText, query, 1200, 900);
        score += scoreExactAndPhrase(searchableRecord.titleText, query, 1100, 800);
        score += scoreTextCollection(searchableRecord.keywordTexts, query, 1000, 700);
        score += scoreTextCollection(searchableRecord.headingTexts, query, 950, 650);
        score += scoreExactAndPhrase(searchableRecord.summaryText, query, 700, 500);
        score += scoreExactAndPhrase(searchableRecord.metadataText, query, 450, 300);
        score += scoreExactAndPhrase(searchableRecord.contentText, query, 350, 225);

        queryWords.forEach(function (word) {
            if (containsWholeWord(searchableRecord.idText, word)) score += 90;
            if (containsWholeWord(searchableRecord.titleText, word)) score += 75;
            if (collectionContainsWholeWord(searchableRecord.keywordTexts, word)) score += 65;
            if (collectionContainsWholeWord(searchableRecord.headingTexts, word)) score += 55;
            if (containsWholeWord(searchableRecord.summaryText, word)) score += 35;
            if (containsWholeWord(searchableRecord.contentText, word)) score += 10;
        });

        return score;
    }

    function scoreExactAndPhrase(text, query, exactScore, phraseScore) {
        if (!text) return 0;
        if (text === query) return exactScore;
        if (text.includes(query)) return phraseScore;
        return 0;
    }

    function scoreTextCollection(values, query, exactScore, phraseScore) {
        return values.reduce(function (score, value) {
            return Math.max(score, scoreExactAndPhrase(value, query, exactScore, phraseScore));
        }, 0);
    }

    function containsWholeWord(text, word) {
        return (" " + text + " ").includes(" " + word + " ");
    }

    function collectionContainsWholeWord(values, word) {
        return values.some(function (value) {
            return containsWholeWord(value, word);
        });
    }

    function normalizeTextArray(values) {
        if (!Array.isArray(values)) return [];
        return values.map(normalizeSearchText).filter(Boolean);
    }

    function collectHeadingTexts(sections) {
        if (!Array.isArray(sections)) return [];

        return sections.map(function (section) {
            const number = section && section.number ? String(section.number) : "";
            const title = section && section.title ? String(section.title) : "";
            return normalizeSearchText((number + " " + title).trim());
        }).filter(Boolean);
    }

    function collectSearchText(value) {
        const fragments = [];
        collectTextFragments(value, fragments, new Set());
        return normalizeSearchText(fragments.join(" "));
    }

    function collectTextFragments(value, fragments, visited) {
        if (value === null || value === undefined) {
            return;
        }

        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            fragments.push(String(value));
            return;
        }

        if (typeof value !== "object") {
            return;
        }

        if (visited.has(value)) {
            return;
        }

        visited.add(value);

        if (Array.isArray(value)) {
            value.forEach(function (item) {
                collectTextFragments(item, fragments, visited);
            });
            return;
        }

        Object.keys(value).forEach(function (key) {
            collectTextFragments(value[key], fragments, visited);
        });
    }

    function normalizeSearchText(value) {
        return String(value || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

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

    function compareGroupNames(a, b) {
        const an = getLeadingNumber(a);
        const bn = getLeadingNumber(b);
        return an !== bn ? an - bn : a.localeCompare(b);
    }

    function getLeadingNumber(value) {
        const match = String(value || "").match(/^(\d+)/);
        return match ? Number(match[1]) : 9999;
    }

    function compareDocuments(a, b) {
        const categoryComparison = String(a.category || "").localeCompare(String(b.category || ""));
        return categoryComparison !== 0 ? categoryComparison : String(a.id || "").localeCompare(String(b.id || ""));
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
        const viewerState = record.documentDataFile ? "Viewer Ready" : "Cataloged";
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

    function updateSearchStatus(resultCount, totalCount, query, indexReady) {
        const status = document.getElementById("documentation-search-status");
        if (!status) return;

        if (!indexReady) {
            status.textContent = "Loading full content for " + totalCount + " verified permanent document" + (totalCount === 1 ? "." : "s...");
            return;
        }

        status.textContent = !query
            ? "Showing all " + totalCount + " verified permanent document" + (totalCount === 1 ? "." : "s.")
            : "Showing " + resultCount + " of " + totalCount + " verified permanent documents.";
    }

    function showCatalogError(container, status, message) {
        if (status) status.textContent = message;
        if (container) container.innerHTML = '<div class="project-item"><div><h3>Documentation System Unavailable</h3><p>' + safeText(message) + '</p></div><span class="project-status planned">Error</span></div>';
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
