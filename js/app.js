console.log("Two Marshalls Studios Command Center Loaded");

function getStatusIcon(state) {
    if (state === "green") return "🟢";
    if (state === "yellow") return "🟡";
    if (state === "red") return "🔴";
    return "⚪";
}

function getRecordStatusClass(status) {
    if (!status) return "project-status";
    if (status.toLowerCase() === "planned") return "project-status planned";
    return "project-status";
}

function getRecordTitle(record) {
    return record.name || record.title || "Untitled";
}

function getRecordDescription(record) {
    return record.description || record.focus || record.completed || "";
}

function getRecordStatus(record) {
    return record.status || record.version || record.time || "";
}

function getCurrentSession() {
    return studioData.sessionLog[0];
}

function renderStudioHeader() {
    const studioName = document.getElementById("studio-name");
    const studioMission = document.getElementById("studio-mission");

    if (studioName) studioName.textContent = studioData.studio.name;
    if (studioMission) studioMission.textContent = studioData.studio.mission;
}

function renderCurrentWorkSession() {
    const currentSession = getCurrentSession();

    document.getElementById("focus-text").textContent = currentSession.focus;
    document.getElementById("focus-project").textContent = studioData.studio.portalName;
    document.getElementById("focus-phase").textContent = currentSession.phase;
    document.getElementById("focus-version").textContent = currentSession.version;
}

function renderRecordList(containerId, records) {
    const recordList = document.getElementById(containerId);
    if (!recordList || !records) return;

    recordList.innerHTML = "";

    records.forEach(function (record) {
        const recordItem = document.createElement("article");
        recordItem.className = "project-item";

        recordItem.innerHTML = `
            <div>
                <h3>${getRecordTitle(record)}</h3>
                <p>${getRecordDescription(record)}</p>
            </div>
            <span class="${getRecordStatusClass(getRecordStatus(record))}">${getRecordStatus(record)}</span>
        `;

        recordList.appendChild(recordItem);
    });
}

function renderAreaGrid(containerId, records) {
    const areaGrid = document.getElementById(containerId);
    if (!areaGrid || !records) return;

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
    if (!statusList || !rows) return;

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
    const currentSession = getCurrentSession();

    const rows = [
        { label: "Active Project", value: studioData.studioState.activeProject },
        { label: "Current Milestone", value: studioData.studioState.currentMilestone },
        { label: "Build Status", value: studioData.studioState.buildStatus },
        { label: "Current Sprint", value: studioData.studioState.currentSprint },
        { label: "Current Session", value: `Work Session ${currentSession.number}` },
        { label: "Session Status", value: currentSession.status }
    ];

    renderStatusRows("studio-state-list", rows);
}

function renderProgress() {
    const progressList = document.getElementById("progress-list");
    if (!progressList || !studioData.progress) return;

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
    if (!statusList || !studioData.status) return;

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
    if (!departmentList || !studioData.departments) return;

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
        footerCopyright.textContent = `${studioData.studio.name} © ${studioData.studio.copyrightYear}`;
    }

    if (footerVersion) {
        footerVersion.textContent = `Studio Headquarters Version ${studioData.studio.currentVersion}`;
    }
}

function renderDashboard() {
    if (typeof studioData === "undefined") return;

    renderStudioHeader();
    renderCurrentWorkSession();
    renderStudioState();

    renderRecordList("session-log-list", studioData.sessionLog);
    renderRecordList("notification-list", studioData.notifications);
    renderRecordList("studio-command-list", studioData.studioCommands);
    renderStatusRows("system-config-list", studioData.systemConfig);

    renderRecordList("project-list", studioData.projects);
    renderStatus();
    renderProgress();
    renderDepartments();
    renderFooter();

    console.log("Studio dashboard rendered from session log:", studioData);
}

renderDashboard();