console.log("Two Marshalls Studios Command Center Loaded");

function getStatusIcon(state) {
    if (state === "green") {
        return "🟢";
    }

    if (state === "yellow") {
        return "🟡";
    }

    if (state === "red") {
        return "🔴";
    }

    return "⚪";
}

function getRecordStatusClass(status) {
    if (!status) {
        return "project-status";
    }

    if (status.toLowerCase() === "planned") {
        return "project-status planned";
    }

    return "project-status";
}

function getRecordTitle(record) {
    return record.name || record.title || "Untitled";
}

function getRecordDescription(record) {
    return record.description || record.text || "";
}

function getRecordStatus(record) {
    return record.status || record.time || "";
}

function renderStudioHeader() {
    const studioName = document.getElementById("studio-name");
    const studioMission = document.getElementById("studio-mission");

    if (studioName) {
        studioName.textContent = studioData.studio.name;
    }

    if (studioMission) {
        studioMission.textContent = studioData.studio.mission;
    }
}

function renderCurrentWorkSession() {
    const focusText = document.getElementById("focus-text");
    const focusProject = document.getElementById("focus-project");
    const focusPhase = document.getElementById("focus-phase");
    const focusVersion = document.getElementById("focus-version");

    if (focusText) {
        focusText.textContent = studioData.currentWorkSession.focus;
    }

    if (focusProject) {
        focusProject.textContent = studioData.studio.portalName;
    }

    if (focusPhase) {
        focusPhase.textContent = studioData.currentWorkSession.phase;
    }

    if (focusVersion) {
        focusVersion.textContent = studioData.studio.currentVersion;
    }
}

function renderRecordList(containerId, records) {
    const recordList = document.getElementById(containerId);

    if (!recordList || !records) {
        return;
    }

    recordList.innerHTML = "";

    records.forEach(function (record) {
        const title = getRecordTitle(record);
        const description = getRecordDescription(record);
        const status = getRecordStatus(record);

        const recordItem = document.createElement("article");
        recordItem.className = "project-item";

        recordItem.innerHTML = `
            <div>
                <h3>${title}</h3>
                <p>${description}</p>
            </div>
            <span class="${getRecordStatusClass(status)}">${status}</span>
        `;

        recordList.appendChild(recordItem);
    });
}

function renderAreaGrid(containerId, records) {
    const areaGrid = document.getElementById(containerId);

    if (!areaGrid || !records) {
        return;
    }

    areaGrid.innerHTML = "";

    records.forEach(function (record) {
        const areaItem = document.createElement("div");
        areaItem.className = "area-item";

        areaItem.innerHTML = `
            <span>${record.icon || "📌"}</span>
            <strong>${getRecordTitle(record)}</strong>
            <p>${getRecordDescription(record)}</p>
        `;

        areaGrid.appendChild(areaItem);
    });
}

function renderStatusRows(containerId, rows) {
    const statusList = document.getElementById(containerId);

    if (!statusList || !rows) {
        return;
    }

    statusList.innerHTML = "";

    rows.forEach(function (row) {
        const statusRow = document.createElement("div");
        statusRow.className = "status-row";

        statusRow.innerHTML = `
            <span>${row.label}</span>
            <strong>${row.value}</strong>
        `;

        statusList.appendChild(statusRow);
    });
}

function renderStudioState() {
    if (!studioData.studioState) {
        return;
    }

    const rows = [
        {
            label: "Active Project",
            value: studioData.studioState.activeProject
        },
        {
            label: "Current Milestone",
            value: studioData.studioState.currentMilestone
        },
        {
            label: "Build Status",
            value: studioData.studioState.buildStatus
        },
        {
            label: "Current Sprint",
            value: studioData.studioState.currentSprint
        },
        {
            label: "Last Commit",
            value: studioData.studioState.lastCommit
        },
        {
            label: "Last Push",
            value: studioData.studioState.lastPush
        }
    ];

    renderStatusRows("studio-state-list", rows);
}

function renderProgress() {
    const progressList = document.getElementById("progress-list");

    if (!progressList || !studioData.progress) {
        return;
    }

    progressList.innerHTML = "";

    studioData.progress.forEach(function (item) {
        const progressRow = document.createElement("div");
        progressRow.className = "status-row";

        progressRow.innerHTML = `
            <span>${item.name}</span>
            <strong>${item.value}%</strong>
        `;

        progressList.appendChild(progressRow);
    });
}

function renderStatus() {
    const statusList = document.getElementById("status-list");

    if (!statusList || !studioData.status) {
        return;
    }

    statusList.innerHTML = "";

    studioData.status.forEach(function (statusItem) {
        const statusRow = document.createElement("div");
        statusRow.className = "status-row";

        statusRow.innerHTML = `
            <span>${statusItem.label}</span>
            <strong>${getStatusIcon(statusItem.state)} ${statusItem.value}</strong>
        `;

        statusList.appendChild(statusRow);
    });
}

function renderDepartments() {
    const departmentList = document.getElementById("department-list");

    if (!departmentList || !studioData.departments) {
        return;
    }

    departmentList.innerHTML = "";

    studioData.departments.forEach(function (department) {
        const departmentCard = document.createElement("a");
        departmentCard.className = "area-item area-link";
        departmentCard.href = department.url;

        departmentCard.innerHTML = `
            <span>${department.icon}</span>
            <strong>${department.name}</strong>
            <p>${department.description}</p>
        `;

        departmentList.appendChild(departmentCard);
    });
}

function renderFooter() {
    const footerCopyright = document.getElementById("footer-copyright");
    const footerVersion = document.getElementById("footer-version");

    if (footerCopyright) {
        footerCopyright.textContent =
            `${studioData.studio.name} © ${studioData.studio.copyrightYear}`;
    }

    if (footerVersion) {
        footerVersion.textContent =
            `Studio Headquarters Version ${studioData.studio.currentVersion}`;
    }
}

function renderDashboard() {
    if (typeof studioData === "undefined") {
        console.warn("studioData was not found. Make sure studio-data.js is loaded before app.js.");
        return;
    }

    renderStudioHeader();
    renderCurrentWorkSession();
    renderStudioState();

    renderRecordList("studio-command-list", studioData.studioCommands);
    renderRecordList("notification-list", studioData.notifications);
    renderStatusRows("system-config-list", studioData.systemConfig);

    renderRecordList("project-list", studioData.projects);
    renderRecordList("development-project-list", studioData.projects);
    renderRecordList("documentation-record-list", studioData.documentationRecords);
    renderRecordList("asset-category-list", studioData.assetCategories);
    renderAreaGrid("asset-group-list", studioData.assetGroups);
    renderRecordList("publishing-channel-list", studioData.publishingChannels);
    renderAreaGrid("publishing-pipeline-list", studioData.publishingPipeline);
    renderRecordList("marketing-channel-list", studioData.marketingChannels);
    renderAreaGrid("marketing-pipeline-list", studioData.marketingPipeline);

    renderStatus();
    renderProgress();
    renderRecordList("activity-feed", studioData.activityFeed);
    renderRecordList("version-history-list", studioData.versionHistory);
    renderDepartments();
    renderFooter();

    console.log("Studio dashboard rendered from studioData:", studioData);
}

renderDashboard();