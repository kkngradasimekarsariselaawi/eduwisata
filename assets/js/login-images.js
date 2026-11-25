/* =========================================================
   LOGIN IMAGES — FIRESTORE
   Edu Wisata Bambu Mekarsari
========================================================= */

import {
    subscribeDocuments,
    COLLECTIONS
} from "./data-service.js";

const DEFAULT_IMAGE = "";

/* =========================================================
   KONVERSI GOOGLE DRIVE URL
========================================================= */

function convertDriveUrl(url) {
    if (!url) return DEFAULT_IMAGE;

    url = url.trim();

    if (!url.includes("drive.google.com")) {
        return url;
    }

    let fileId = "";

    const fileMatch = url.match(/\/file\/d\/([^/]+)/);

    if (fileMatch) {
        fileId = fileMatch[1];
    }

    if (!fileId) {
        try {
            const parsedUrl = new URL(url);
            fileId = parsedUrl.searchParams.get("id") || "";
        } catch (error) {
            console.error("URL Google Drive tidak valid:", error);
        }
    }

    if (!fileId) {
        return url;
    }

    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
}

/* =========================================================
   TERAPKAN GAMBAR KE MOBILE & DESKTOP
========================================================= */

function applyLoginImage(imageUrl) {
    const mobileImage = document.getElementById("login-hero-mobile");
    const desktopImage = document.getElementById("login-hero-desktop");

    if (!imageUrl) {
        imageUrl = DEFAULT_IMAGE;
    }

    if (mobileImage) {
        mobileImage.src = imageUrl;
    }

    if (desktopImage) {
        desktopImage.src = imageUrl;
    }
}

/* =========================================================
   LOAD GAMBAR LOGIN DARI FIRESTORE
========================================================= */

subscribeDocuments(
    COLLECTIONS.content,

    documents => {
        const loginImage = documents.find(item =>
            item.imageKey === "hero_login" ||
            item.key === "hero_login" ||
            item.id === "hero_login"
        );

        if (!loginImage) {
            applyLoginImage(DEFAULT_IMAGE);
            return;
        }

        const imageUrl =
            loginImage.imageUrl ||
            convertDriveUrl(loginImage.driveUrl);

        applyLoginImage(imageUrl);
    },

    {},

    error => {
        console.error("Gagal memuat gambar login:", error);
        applyLoginImage(DEFAULT_IMAGE);
    }
);