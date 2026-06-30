/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 043 — Cross-Department Global Search
File: js/search.js

Purpose:
- Provide one shared search UI controller.
- Delegate database searching to StudioDB.search().
- Add department-aware search result labels.
*/

(function () {
    "use strict";

    const TMS_SEARCH_VERSION = "0.43.0";

    const DEPARTMENT_ICONS = {
        "Headquarters": "🏠",
        "Core Architecture": "🧠",
        "Documentation": "📚",
        "Development": "🛠",
        "Assets": "🎨",
        "Publishing": "🚀",
        "Marketing": "📣",
        "Business Operations": "🏢",
        "Planning": "🧭",
        "Testing": "🧪"
    };

    document.addEventListener("DOMContentLoaded", function () {
        setupSearchInputs();
        exposeSearchApi();

        console.log("Cross-department global search loaded successfully.");
    });

    function exposeSearchApi() {
        window.TMSSharedSearch = {
            version: TMS_SEARCH_VERSION,
            search: runSearch
        };
    }

    function setupSearchInputs() {
        const inputs = findSearchInputs();

        inputs.forEach(function (input) {
            const resultsBox = getOrCreateResultsBox(input);

            input.setAttribute("autocomplete", "off");
            input.setAttribute("aria-label", input.getAttribute("aria-label") || "Search Two Marshalls Studios");
            input.setAttribute("role", "searchbox");

            input.addEventListener("input", function () {
                const query = input.value.trim();
                renderResults(query, resultsBox);
            });

            input.addEventListener("keydown", function (event) {
                if (event.key === "Escape") {
                    input.value = "";
                    clearResults(resultsBox);
                }
            });

            document.addEventListener("click", function (event) {
                if (!resultsBox.contains(event.target) && event.target !== input) {
                    clearResults(resultsBox);
                }
            });
        });
    }

    function findSearchInputs() {
        const selectors = [
            "#studio-search",
            "#search",
            "#searchInput",
            "#sharedSearchInput",
            "#documentation-search",
            ".studio-search",
            ".search-input",
            "input[type='search']"
        ];

        const found = [];

        selectors.forEach(function (selector) {
            document.querySelectorAll(selector).forEach(function (input) {
                if (found.indexOf(input) === -1) {
                    found.push(input);
                }
            });
        });

        return found;
    }

    function getOrCreateResultsBox(input) {
        const existingId = input.getAttribute("aria-controls");

        if (existingId) {
            const existing = document.getElementById(existingId);

            if (existing) {
                existing.classList.add("search-results");
                return existing;
            }
        }

        const resultsBox = document.createElement("div");
        const id = "search-results-" + Math.random().toString(36).slice(2, 9);

        resultsBox.id = id;
        resultsBox.className = "search-results";
        resultsBox.setAttribute("role", "listbox");
        resultsBox.setAttribute("aria-label", "Search results");
        resultsBox.hidden = true;

        input.setAttribute("aria-controls", id);

        if (input.parentElement) {
            input.parentElement.appendChild(resultsBox);
        } else {
            document.body.appendChild(resultsBox);
        }

        return resultsBox;
    }

    function runSearch(query) {
        const cleanQuery = cleanText(query);

        if (!cleanQuery) {
            return [];
        }

        if (!window.StudioDB || typeof window.StudioDB.search !== "function") {
            console.warn("StudioDB.search was not found. Check loader.js and script order.");
            return [];
        }

        return window.StudioDB.search(cleanQuery)
            .map(normalizeResult)
            .sort(function (a, b) {
                return scoreResult(b, cleanQuery) - scoreResult(a, cleanQuery);
            })
            .slice(0, 12);
    }

    function normalizeResult(result) {
        const record = result.record || {};
        const recordType = result.recordType || "record";
        const department = record.department || getDepartmentFromRecordType(recordType);

        return {
            id: record.id || recordType + "-" + normalizeId(record.title || record.name || record.label || record.summary || "record"),
            title: record.title || record.name || record.label || "Untitled Record",
            department: department,
            departmentIcon: getDepartmentIcon(department),
            type: formatRecordType(recordType),
            description: record.summary || record.description || record.value || "",
            url: getRecordUrl(recordType, record)
        };
    }

    function scoreResult(result, query) {
        const cleanQuery = cleanText(query).toLowerCase();
        const title = cleanText(result.title).toLowerCase();
        const department = cleanText(result.department).toLowerCase();
        const type = cleanText(result.type).toLowerCase();
        const description = cleanText(result.description).toLowerCase();

        let score = 0;

        if (title === cleanQuery) score += 100;
        if (title.includes(cleanQuery)) score += 60;
        if (department.includes(cleanQuery)) score += 35;
        if (type.includes(cleanQuery)) score += 25;
        if (description.includes(cleanQuery)) score += 15;

        cleanQuery.split(" ").filter(Boolean).forEach(function (word) {
            if (title.includes(word)) score += 12;
            if (department.includes(word)) score += 8;
            if (type.includes(word)) score += 6;
            if (description.includes(word)) score += 4;
        });

        return score;
    }

    function renderResults(query, resultsBox) {
        const results = runSearch(query);

        if (!query) {
            clearResults(resultsBox);
            return;
        }

        resultsBox.innerHTML = "";
        resultsBox.hidden = false;

        if (results.length === 0) {
            const empty = document.createElement("div");
            empty.className = "search-result search-result-empty";
            empty.textContent = "No results found.";
            resultsBox.appendChild(empty);
            return;
        }

        results.forEach(function (result) {
            resultsBox.appendChild(createResultElement(result));
        });
    }

    function createResultElement(result) {
        const link = document.createElement("a");

        link.className = "search-result";
        link.href = result.url || "#";
        link.setAttribute("role", "option");

        const title = document.createElement("strong");
        title.className = "search-result-title";
        title.textContent = result.title || "Untitled Result";

        const meta = document.createElement("span");
        meta.className = "search-result-meta";
        meta.textContent = [
            result.departmentIcon + " " + result.department,
            result.type
        ].filter(Boolean).join(" • ");

        const description = document.createElement("span");
        description.className = "search-result-description";
        description.textContent = result.description || "";

        link.appendChild(title);
        link.appendChild(meta);
        link.appendChild(description);

        return link;
    }

    function clearResults(resultsBox) {
        if (!resultsBox) return;

        resultsBox.innerHTML = "";
        resultsBox.hidden = true;
    }

    function getRecordUrl(recordType, record) {
        if (record && record.url) {
            return normalizeUrl(record.url);
        }

        const currentPrefix = getPathPrefix();

        const map = {
            workSessions: currentPrefix + "pages/documentation.html",
            decisions: currentPrefix + "pages/documentation.html",
            standards: currentPrefix + "pages/documentation.html",
            procedures: currentPrefix + "pages/documentation.html",
            enhancements: currentPrefix + "pages/documentation.html",

            projects: currentPrefix + "pages/development.html",

            assetCategories: currentPrefix + "pages/assets.html",
            assetGroups: currentPrefix + "pages/assets.html",

            publishingChannels: currentPrefix + "pages/publishing.html",
            publishingPipeline: currentPrefix + "pages/publishing.html",

            marketingChannels: currentPrefix + "pages/marketing.html",
            marketingPipeline: currentPrefix + "pages/marketing.html",

            status: currentPrefix + "index.html",
            notifications: currentPrefix + "index.html",
            studioCommands: currentPrefix + "index.html",
            systemConfig: currentPrefix + "index.html",
            progress: currentPrefix + "index.html",
            departments: currentPrefix + "index.html"
        };

        return map[recordType] || currentPrefix + "index.html";
    }

    function getPathPrefix() {
        const path = String(window.location.pathname || "").toLowerCase();
        return path.indexOf("/pages/") !== -1 ? "../" : "";
    }

    function normalizeUrl(url) {
        if (!url || typeof url !== "string") return "#";

        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("#")) {
            return url;
        }

        if (url.startsWith("pages/")) {
            return getPathPrefix() + url;
        }

        if (url === "index.html") {
            return getPathPrefix() + "index.html";
        }

        return url;
    }

    function getDepartmentFromRecordType(recordType) {
        const map = {
            workSessions: "Documentation",
            decisions: "Documentation",
            standards: "Documentation",
            procedures: "Documentation",
            enhancements: "Documentation",

            projects: "Development",

            assetCategories: "Assets",
            assetGroups: "Assets",

            publishingChannels: "Publishing",
            publishingPipeline: "Publishing",

            marketingChannels: "Marketing",
            marketingPipeline: "Marketing",

            status: "Headquarters",
            notifications: "Headquarters",
            studioCommands: "Headquarters",
            systemConfig: "Headquarters",
            progress: "Headquarters",
            departments: "Headquarters"
        };

        return map[recordType] || "Studio Database";
    }

    function getDepartmentIcon(department) {
        return DEPARTMENT_ICONS[department] || "🗂️";
    }

    function formatRecordType(recordType) {
        const map = {
            workSessions: "Work Session",
            decisions: "Decision",
            standards: "Standard",
            procedures: "Procedure",
            enhancements: "Enhancement",
            projects: "Project",
            status: "Status",
            notifications: "Notification",
            studioCommands: "Studio Command",
            systemConfig: "System Config",
            progress: "Progress",
            departments: "Department",
            assetCategories: "Asset Category",
            assetGroups: "Asset Group",
            publishingChannels: "Publishing Channel",
            publishingPipeline: "Publishing Pipeline",
            marketingChannels: "Marketing Channel",
            marketingPipeline: "Marketing Pipeline"
        };

        return map[recordType] || String(recordType || "Record");
    }

    function cleanText(value) {
        return String(value || "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function normalizeId(value) {
        return cleanText(value)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 80);
    }
})();