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

function getProjectStatusClass(status) {
    if (status.toLowerCase() === "planned") {
        return "project-status planned";
    }

    return "project-status";
}

function renderStudioHeader() {
    document.getElementById("studio-name").textContent = studioData.studio.name;
    document.getElementById("studio-mission").textContent = studioData.studio.mission;
}

function renderCurrentWorkSession() {
    document.getElementById("focus-text").textContent = studioData.currentWorkSession.focus;
    document.getElementById("focus-project").textContent = studioData.studio.portalName;
    document.getElementById("focus-phase").textContent = studioData.currentWorkSession.phase;
    document.getElementById("focus-version").textContent = studioData.studio.currentVersion;
}

function renderProjects() {
    const projectList = document.getElementById("project-list");

    projectList.innerHTML = "";

    studioData.projects.forEach(function (project) {
        const projectItem = document.createElement("article");
        projectItem.className = "project-item";

        projectItem.innerHTML = `
            <div>
                <h3>${project.name}</h3>
                <p>${project.description}</p>
            </div>
            <span class="${getProjectStatusClass(project.status)}">${project.status}</span>
        `;

        projectList.appendChild(projectItem);
    });
}

function renderStatus() {
    const statusList = document.getElementById("status-list");

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
    document.getElementById("footer-copyright").textContent =
        `${studioData.studio.name} © ${studioData.studio.copyrightYear}`;

    document.getElementById("footer-version").textContent =
        `Studio Headquarters Version ${studioData.studio.currentVersion}`;
}

function renderDashboard() {
    if (typeof studioData === "undefined") {
        console.warn("studioData was not found. Make sure studio-data.js is loaded before app.js.");
        return;
    }

    renderStudioHeader();
    renderCurrentWorkSession();
    renderProjects();
    renderStatus();
    renderDepartments();
    renderFooter();

    console.log("Studio dashboard rendered from studioData:", studioData);
}

renderDashboard();