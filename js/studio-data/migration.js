/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 048D — Migration Engine Foundation
File: js/studio-data/migration.js
*/

(function () {
    "use strict";

    function getPackages() {
        if (window.StudioDB && typeof window.StudioDB.get === "function") {
            return window.StudioDB.get("migrationPackages");
        }

        return [];
    }

    function getPackageById(packageId) {
        if (window.StudioDB && typeof window.StudioDB.record === "function") {
            return window.StudioDB.record(packageId);
        }

        return null;
    }

    function byStatus(status) {
        const cleanStatus = String(status || "").toLowerCase().trim();

        return getPackages().filter(function (item) {
            return String(item.status || "").toLowerCase().trim() === cleanStatus;
        });
    }

    function byReviewStatus(reviewStatus) {
        const cleanReviewStatus = String(reviewStatus || "").toLowerCase().trim();

        return getPackages().filter(function (item) {
            return String(item.reviewStatus || "").toLowerCase().trim() === cleanReviewStatus;
        });
    }

    function active() {
        return byStatus("Active");
    }

    function needsReview() {
        return getPackages().filter(function (item) {
            const reviewStatus = String(item.reviewStatus || "").toLowerCase().trim();
            return reviewStatus === "pending" || reviewStatus === "needs review";
        });
    }

    function summary() {
        const packages = getPackages();

        const statusCounts = packages.reduce(function (counts, item) {
            const key = String(item.status || "Unknown").toLowerCase();
            counts[key] = (counts[key] || 0) + 1;
            return counts;
        }, {});

        const reviewCounts = packages.reduce(function (counts, item) {
            const key = String(item.reviewStatus || "Unknown").toLowerCase();
            counts[key] = (counts[key] || 0) + 1;
            return counts;
        }, {});

        return {
            totalMigrationPackages: packages.length,
            activePackages: active().length,
            needsReview: needsReview().length,
            status: statusCounts,
            reviewStatus: reviewCounts
        };
    }

    window.TMSMigration = {
        packages: getPackages,
        package: getPackageById,
        active: active,
        byStatus: byStatus,
        byReviewStatus: byReviewStatus,
        needsReview: needsReview,
        summary: summary
    };

    console.log("TMS Migration Engine loaded successfully.");
})();
