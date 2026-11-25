/* =========================================================
   ADMIN IMAGES — MANAJEMEN GAMBAR WEBSITE
   Edu Wisata Bambu Mekarsari
   Penyimpanan foto: Google Drive
   Penyimpanan URL: Firestore
========================================================= */

import {
    subscribeDocuments,
    saveDocument,
    updateDocument,
    getDocument,
    COLLECTIONS
} from "./data-service.js";


/* =========================================================
   1. KONFIGURASI GAMBAR
========================================================= */

const managedImages = {
    // ================= BERANDA =================
    hero_beranda: {
        inputId: "url-hero-beranda",
        previewId: "preview-hero-beranda",
        buttonId: "btn-save-hero-beranda",
        defaultImage: "",
        label: "Banner Beranda"
    },

    about_beranda: {
        inputId: "url-about-beranda",
        previewId: "preview-about-beranda",
        buttonId: "btn-save-about-beranda",
        defaultImage: "",
        label: "Gambar Tentang Beranda"
    },

    // ================= HALAMAN TENTANG =================
    hero_tentang: {
        inputId: "url-hero-tentang",
        previewId: "preview-hero-tentang",
        buttonId: "btn-save-hero-tentang",
        defaultImage: "",
        label: "Hero Banner Halaman Tentang"
    },
    about_tentang: {
        inputId: "url-about-tentang",
        previewId: "preview-about-tentang",
        buttonId: "btn-save-about-tentang",
        defaultImage: "",
        label: "Gambar Pengenalan Tentang"
    },

    potensi_kerajinan: {
        inputId: "url-potensi-kerajinan",
        previewId: "preview-potensi-kerajinan",
        buttonId: "btn-save-potensi-kerajinan",
        defaultImage: "",
        label: "Gambar Potensi Kerajinan Bambu"
    },

    potensi_budaya: {
        inputId: "url-potensi-budaya",
        previewId: "preview-potensi-budaya",
        buttonId: "btn-save-potensi-budaya",
        defaultImage: "",
        label: "Gambar Potensi Budaya Sunda"
    },

    potensi_alam: {
        inputId: "url-potensi-alam",
        previewId: "preview-potensi-alam",
        buttonId: "btn-save-potensi-alam",
        defaultImage: "",
        label: "Gambar Potensi Wisata Alam"
    },

    potensi_kuliner: {
        inputId: "url-potensi-kuliner",
        previewId: "preview-potensi-kuliner",
        buttonId: "btn-save-potensi-kuliner",
        defaultImage: "",
        label: "Gambar Potensi Kuliner Tradisional"
    },
    hero_paket: {
        inputId: "url-hero-paket",
        previewId: "preview-hero-paket",
        buttonId: "btn-save-hero-paket",
        defaultImage: "",
        label: "Hero Banner Halaman Paket"
    },
    hero_galeri: {
        inputId: "url-hero-galeri",
        previewId: "preview-hero-galeri",
        buttonId: "btn-save-hero-galeri",
        defaultImage: "",
        label: "Hero Banner Halaman Galeri"
    },
    hero_kontak: {
        inputId: "url-hero-kontak",
        previewId: "preview-hero-kontak",
        buttonId: "btn-save-hero-kontak",
        defaultImage: "",
        label: "Hero Banner Halaman Kontak"
    },
    // ================= LOGIN ADMIN =================
    hero_login: {
        inputId: "url-hero-login",
        previewId: "preview-hero-login",
        buttonId: "btn-save-hero-login",
        defaultImage: "",
        label: "Gambar Halaman Login Admin"
    }
};


/* =========================================================
   2. STATE
========================================================= */

let managedImagesData = {};
let unsubscribeManagedImages = null;


/* =========================================================
   3. NOTIFIKASI
========================================================= */

function notify(message, type = "success") {
    if (typeof window.showToast === "function") {
        window.showToast(message, type);
    } else {
        alert(message);
    }
}


/* =========================================================
   4. KONVERSI URL GOOGLE DRIVE
   Admin cukup paste link Drive biasa
========================================================= */

function convertDriveUrl(url) {
    if (!url) return "";

    url = url.trim();

    try {
        const parsedUrl = new URL(url);

        // Jika bukan Google Drive, gunakan URL asli
        if (
            !parsedUrl.hostname.includes("drive.google.com") &&
            !parsedUrl.hostname.includes("docs.google.com")
        ) {
            return url;
        }

        let fileId = "";

        // FORMAT 1:
        // drive.google.com/file/d/FILE_ID/view
        // drive.google.com/uc?id=FILE_ID
        // drive.google.com/open?id=FILE_ID
        // drive.google.com/thumbnail?id=FILE_ID

        const pathMatch = parsedUrl.pathname.match(/\/file\/d\/([^/]+)/);

        if (pathMatch) {
            fileId = pathMatch[1];
        }

        // Ambil ID dari parameter URL jika belum ditemukan
        if (!fileId) {
            fileId = parsedUrl.searchParams.get("id") || "";
        }

        // Format lain: docs.google.com/.../d/FILE_ID
        if (!fileId) {
            const docsMatch = parsedUrl.pathname.match(/\/d\/([^/]+)/);

            if (docsMatch) {
                fileId = docsMatch[1];
            }
        }

        // Jika ID tidak ditemukan, gunakan URL asli
        if (!fileId) {
            console.warn("File ID Google Drive tidak ditemukan:", url);
            return url;
        }

        // Konversi menjadi URL thumbnail
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;

    } catch (error) {
        console.error("Gagal mengonversi URL:", error);
        return url;
    }
}

window.convertDriveUrl = convertDriveUrl;
/* =========================================================
   5. PREVIEW GAMBAR
========================================================= */

function updateManagedImagePreview(key) {
    const config = managedImages[key];

    if (!config) return;

    const input = document.getElementById(config.inputId);
    const preview = document.getElementById(config.previewId);

    if (!input || !preview) return;

    const rawUrl = input.value.trim();

    if (!rawUrl) {
        preview.src = config.defaultImage;
        return;
    }

    preview.src = convertDriveUrl(rawUrl);
}


/* =========================================================
   6. LOAD DATA FIRESTORE
========================================================= */

function loadManagedImagesAdmin() {
    if (unsubscribeManagedImages) {
        unsubscribeManagedImages();
        unsubscribeManagedImages = null;
    }

    unsubscribeManagedImages = subscribeDocuments(
        COLLECTIONS.content,

        documents => {
            documents.forEach(item => {
                const key = item.imageKey || item.key || item.id;

                if (!managedImages[key]) return;

                managedImagesData[key] = item;

                const config = managedImages[key];
                const input = document.getElementById(config.inputId);
                const preview = document.getElementById(config.previewId);

                if (!input || !preview) return;

                const savedDriveUrl = item.driveUrl || item.imageUrl || "";

                // Isi input dengan link Drive yang tersimpan
                if (savedDriveUrl && input.value === "") {
                    input.value = savedDriveUrl;
                }

                // Ambil URL tampilan gambar
                const savedImageUrl =
                    item.imageUrl ||
                    convertDriveUrl(savedDriveUrl);

                if (savedImageUrl) {
                    preview.src = savedImageUrl;
                }
            });
        },

        {},

        error => {
            console.error("Gagal memuat gambar website:", error);

            notify("Gagal memuat data gambar website", "error");
        }
    );
}


/* =========================================================
   7. SIMPAN GAMBAR KE FIRESTORE
========================================================= */

async function saveManagedImage(key) {
    const config = managedImages[key];

    if (!config) {
        notify("Konfigurasi gambar tidak ditemukan", "error");
        return;
    }

    const input = document.getElementById(config.inputId);
    const button = document.getElementById(config.buttonId);

    if (!input) return;

    const driveUrl = input.value.trim();

    if (!driveUrl) {
        notify("Silakan masukkan URL gambar terlebih dahulu", "error");
        input.focus();
        return;
    }

    // Validasi format URL
    try {
        new URL(driveUrl);
    } catch (error) {
        notify("Format URL gambar tidak valid", "error");
        input.focus();
        return;
    }

    const imageUrl = convertDriveUrl(driveUrl);

    const originalButtonContent = button
        ? button.innerHTML
        : "";

    try {
        if (button) {
            button.disabled = true;
            button.innerHTML = `
                <i data-lucide="loader-circle"
                   class="w-4 h-4 animate-spin"></i>
                Menyimpan...
            `;

            if (typeof lucide !== "undefined") {
                lucide.createIcons();
            }
        }

        await saveDocument(
            COLLECTIONS.content,
            key,
            {
                imageKey: key,
                driveUrl: driveUrl,
                imageUrl: imageUrl,
                updatedAt: new Date().toISOString()
            }
        );

        managedImagesData[key] = {
            imageKey: key,
            driveUrl: driveUrl,
            imageUrl: imageUrl
        };

        // Update preview dashboard
        updateManagedImagePreview(key);

        notify(`${config.label} berhasil diperbarui`);

    } catch (error) {
        console.error("Gagal menyimpan gambar:", error);

        notify("Gagal menyimpan gambar. Silakan coba lagi.", "error");

    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalButtonContent;

            if (typeof lucide !== "undefined") {
                lucide.createIcons();
            }
        }
    }
}


// =========================================================
// PROFIL ADMIN — SIMPAN FOTO
// =========================================================

async function saveAdminProfilePhoto() {
    const input = document.getElementById("url-admin-profile");
    const button = document.getElementById("btn-save-admin-profile");
    const preview = document.getElementById("preview-admin-profile");

    if (!input || !button) return;

    const driveUrl = input.value.trim();
    const adminUid = window.adminProfileUid;

    if (!adminUid) {
        notify("UID admin belum tersedia. Pastikan sudah login.", "error");
        return;
    }

    if (!driveUrl) {
        notify("Silakan masukkan URL foto terlebih dahulu.", "error");
        input.focus();
        return;
    }

    // Validasi URL
    try {
        new URL(driveUrl);
    } catch (error) {
        notify("Format URL foto tidak valid.", "error");
        input.focus();
        return;
    }

    // Konversi URL Drive ke URL gambar
    const imageUrl = convertDriveUrl(driveUrl);

    // Validasi foto sebelum disimpan
    const testImage = new Image();

    testImage.onload = async () => {
        const originalButton = button.innerHTML;

        try {
            button.disabled = true;
            button.innerHTML = `
                <i data-lucide="loader-circle"
                   class="w-4 h-4 animate-spin"></i>
                Menyimpan...
            `;

            if (window.lucide) lucide.createIcons();

            // Simpan foto hanya pada dokumen admin yang login
            await updateDocument(
                COLLECTIONS.adminProfiles,
                adminUid,
                {
                    foto: driveUrl
                }
            );

            // Update foto pada kartu admin yang sedang login
            const currentAdminPhoto = document.getElementById("current-admin-photo");

            if (currentAdminPhoto) {
                currentAdminPhoto.onerror = () => {
                    currentAdminPhoto.src = "assets/images/logo.png";
                };

                currentAdminPhoto.src = imageUrl;
            }

            // Update preview lama jika masih ada
            if (preview) {
                preview.src = imageUrl;
            }

            // Update foto sidebar langsung
            const sidebarPhoto = document.getElementById("admin-photo");
            const fallback = document.getElementById("admin-avatar-fallback");

            if (sidebarPhoto) {
                sidebarPhoto.onload = () => {
                    sidebarPhoto.classList.remove("hidden");

                    if (fallback) {
                        fallback.classList.add("hidden");
                    }
                };

                sidebarPhoto.onerror = () => {
                    sidebarPhoto.classList.add("hidden");

                    if (fallback) {
                        fallback.classList.remove("hidden");
                    }
                };

                sidebarPhoto.src = imageUrl;
            }

            notify("Foto profil admin berhasil diperbarui!");

        } catch (error) {
            console.error("Gagal menyimpan foto profil:", error);

            notify(
                "Foto gagal disimpan. Periksa Firestore Rules.",
                "error"
            );

        } finally {
            button.disabled = false;
            button.innerHTML = originalButton;

            if (window.lucide) lucide.createIcons();
        }
    };

    testImage.onerror = () => {
        notify(
            "Foto tidak bisa dimuat. Periksa link Google Drive dan izin akses.",
            "error"
        );
    };

    // Tes apakah gambar bisa dimuat terlebih dahulu
    testImage.src = imageUrl;
}


// Jadikan fungsi tersedia untuk tombol HTML
window.saveAdminProfilePhoto = saveAdminProfilePhoto;


/* =========================================================
   8. EVENT PREVIEW INPUT
========================================================= */

function initManagedImagePreviewEvents() {
    Object.keys(managedImages).forEach(key => {
        const config = managedImages[key];
        const input = document.getElementById(config.inputId);

        if (!input) return;

        input.addEventListener("input", () => {
            updateManagedImagePreview(key);
        });
    });
}


/* =========================================================
   9. GLOBAL FUNCTION
========================================================= */

window.saveManagedImage = saveManagedImage;


/* =========================================================
   10. INITIALIZE
========================================================= */

initManagedImagePreviewEvents();
loadManagedImagesAdmin();

// Preview foto profil saat URL diubah
const adminProfileInput = document.getElementById("url-admin-profile");
const adminProfilePreview = document.getElementById("preview-admin-profile");

if (adminProfileInput && adminProfilePreview) {
    adminProfileInput.addEventListener("input", () => {
        const url = adminProfileInput.value.trim();

        if (!url) {
            adminProfilePreview.src = "assets/images/logo.png";
            return;
        }

        adminProfilePreview.src = convertDriveUrl(url);
    });
}