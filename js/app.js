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

    if (!recordList) {
        return;
    }

    recordList.innerHTML = "";

    records.forEach(function (record) {
        const recordItem = document.createElement("article");
        recordItem.className = "project-item";

        recordItem.innerHTML = `
            <div>
                <h3>${record.name}</h3>
                <p>${record.description}</p>
            </div>
            <span class="${getProjectStatusClass(record.status)}">${record.status}</span>
        `;

        recordList.appendChild(recordItem);
    });
}

function renderAreaGrid(containerId, records) {
    const areaGrid = document.getElementById(containerId);

    if (!areaGrid) {
        return;
    }

    areaGrid.innerHTML = "";

    records.forEach(function (record) {
        const areaItem = document.createElement("div");
        areaItem.className = "area-item";

        areaItem.innerHTML = `
            <span>${record.icon}</span>
            <strong>${record.name}</strong>
            <p>${record.description}</p>
        `;

        areaGrid.appendChild(areaItem);
    });
}

function renderStatusRows(containerId, rows) {
    const statusList = document.getElementById(containerId);

    if (!statusList) {
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

function renderActivityFeed() {
    const activityFeed = document.getElementById("activity-feed");

    if (!activityFeed || !studioData.activityFeed) {
        return;
    }

    activityFeed.innerHTML = "";

    studioData.activityFeed.forEach(function (activity) {
        const activityItem = document.createElement("article");
        activityItem.className = "project-item";

        activityItem.innerHTML = `
            <div>
                <h3>${activity.title}</h3>
                <p>${activity.description}</p>
            </div>
            <span class="project-status">${activity.time}</span>
        `;

        activityFeed.appendChild(activityItem);
    });
}

function renderProjects() {
    renderRecordList("project-list", studioData.projects);
}

function renderDevelopmentProjects() {
    renderRecordList("development-project-list", studioData.projects);
}

function renderDocumentationRecords() {
    const documentationRecords = [
        {
            name: "Build Session Log",
            description: "Tracks what was completed during each work session.",
            status: "Planned"
        },
        {
            name: "Decision Log",
            description: "Records important studio decisions and why they were made.",
            status: "Planned"
        },
        {
            name: "Enhancement Ideas Log",
            description: "Stores future ideas without interrupting active development.",
            status: "Planned"
        }
    ];

    renderRecordList("documentation-record-list", documentationRecords);
}

function renderAssetCategories() {
    const assetCategories = [
        {
            name: "3D Models",
            description: "Unity and Blender models.",
            status: "Active"
        },
        {
            name: "Textures & Materials",
            description: "Surfaces, shaders, and reusable materials.",
            status: "Active"
        },
        {
            name: "Audio Library",
            description: "Music, ambience, sound effects, and voice.",
            status: "Planned"
        }
    ];

    renderRecordList("asset-category-list", assetCategories);
}

function renderAssetGroups() {
    const assetGroups = [
        {
            icon: "🪓",
            name: "Weapons",
            description: "Tools, melee, ranged weapons, and upgrades."
        },
        {
            icon: "🌲",
            name: "Environment",
            description: "Trees, rocks, terrain, foliage, and props."
        },
        {
            icon: "🏠",
            name: "Buildings",
            description: "Structures, interiors, furniture, and modular kits."
        },
        {
            icon: "🎵",
            name: "Audio",
            description: "Music, ambience, effects, and voice assets."
        },
        {
            icon: "🖥️",
            name: "UI Assets",
            description: "Icons, menus, HUD elements, and interface graphics."
        },
        {
            icon: "🎬",
            name: "Animations",
            description: "Character, creature, and object animations."
        }
    ];

    renderAreaGrid("asset-group-list", assetGroups);
}

function renderPublishingChannels() {
    const publishingChannels = [
        {
            name: "Apple App Store",
            description: "iPhone and iPad publishing path.",
            status: "Planned"
        },
        {
            name: "Google Play",
            description: "Android phone and tablet publishing path.",
            status: "Planned"
        },
        {
            name: "Steam",
            description: "PC publishing and distribution path.",
            status: "Planned"
        }
    ];

    renderRecordList("publishing-channel-list", publishingChannels);
}

function renderPublishingPipeline() {
    const publishingPipeline = [
        {
            icon: "✅",
            name: "Prepare",
            description: "Confirm game build, store assets, screenshots, descriptions, and requirements."
        },
        {
            icon: "📦",
            name: "Package",
            description: "Create the correct release build for the target platform."
        },
        {
            icon: "🧪",
            name: "Review",
            description: "Test release candidates before submitting to any platform."
        },
        {
            icon: "🚀",
            name: "Submit",
            description: "Upload the release package to the correct store or distribution channel."
        },
        {
            icon: "📣",
            name: "Launch",
            description: "Coordinate launch timing, marketing, announcements, and release notes."
        },
        {
            icon: "📊",
            name: "Track",
            description: "Monitor downloads, feedback, ratings, issues, and revenue after release."
        }
    ];

    renderAreaGrid("publishing-pipeline-list", publishingPipeline);
}

function renderMarketingChannels() {
    const marketingChannels = [
        {
            name: "Game Store Assets",
            description: "Screenshots, icons, descriptions, capsule art, and feature graphics.",
            status: "Planned"
        },
        {
            name: "Trailers & Video",
            description: "Gameplay trailers, teaser videos, development updates, and launch videos.",
            status: "Planned"
        },
        {
            name: "Community Updates",
            description: "Player-facing updates, development news, and release announcements.",
            status: "Planned"
        }
    ];

    renderRecordList("marketing-channel-list", marketingChannels);
}

function renderMarketingPipeline() {
    const marketingPipeline = [
        {
            icon: "🧠",
            name: "Message",
            description: "Define what the game is, who it is for, and why players should care."
        },
        {
            icon: "📸",
            name: "Capture",
            description: "Create screenshots, clips, gameplay footage, and visual materials."
        },
        {
            icon: "🎬",
            name: "Produce",
            description: "Build trailers, store graphics, announcements, and release content."
        },
        {
            icon: "📢",
            name: "Publish",
            description: "Post updates, store materials, community announcements, and launch messages."
        },
        {
            icon: "👥",
            name: "Engage",
            description: "Respond to feedback, track interest, and build trust with players."
        },
        {
            icon: "📈",
            name: "Measure",
            description: "Review traffic, wishlists, downloads, engagement, reviews, and conversion."
        }
    ];

    renderAreaGrid("marketing-pipeline-list", marketingPipeline);
}

function renderStatus() {
    const statusList = document.getElementById("status-list");

    if (!statusList) {
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

    if (!departmentList) {
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
    renderProjects();
    renderDevelopmentProjects();
    renderDocumentationRecords();
    renderAssetCategories();
    renderAssetGroups();
    renderPublishingChannels();
    renderPublishingPipeline();
    renderMarketingChannels();
    renderMarketingPipeline();
    renderStatus();
    renderProgress();
    renderActivityFeed();
    renderDepartments();
    renderFooter();

    console.log("Studio dashboard rendered from studioData:", studioData);
}

renderDashboard();