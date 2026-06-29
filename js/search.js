console.log("TMS-OS Shared Search Engine Loaded");

function initializeSharedSearch(config) {
    const searchInput = document.getElementById(config.inputId);
    const searchStatus = document.getElementById(config.statusId);

    if (!searchInput) return;

    function filterRecords() {
        const query = searchInput.value.trim().toLowerCase();
        const searchableItems = document.querySelectorAll(`${config.sectionSelector} ${config.itemSelector}`);
        let visibleCount = 0;

        searchableItems.forEach(function (item) {
            const itemText = item.dataset.searchText || item.textContent.toLowerCase();
            const isMatch = query === "" || itemText.includes(query);

            item.style.display = isMatch ? "" : "none";

            if (isMatch) {
                visibleCount += 1;
            }
        });

        const sections = document.querySelectorAll(config.sectionSelector);

        sections.forEach(function (section) {
            const visibleItemsInSection = section.querySelectorAll(`${config.itemSelector}:not([style*='display: none'])`);
            section.style.display = visibleItemsInSection.length > 0 || query === "" ? "" : "none";
        });

        if (searchStatus) {
            if (query === "") {
                searchStatus.textContent = config.defaultMessage;
            } else {
                searchStatus.textContent = `Showing ${visibleCount} record(s) for "${searchInput.value}".`;
            }
        }
    }

    searchInput.addEventListener("input", filterRecords);
    filterRecords();
}

function initializeDocumentationSearch() {
    initializeSharedSearch({
        inputId: "documentation-search",
        statusId: "documentation-search-status",
        sectionSelector: ".documentation-search-section",
        itemSelector: ".project-item",
        defaultMessage: "Showing all documentation records."
    });
}
