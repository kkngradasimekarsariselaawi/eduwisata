
/* =========================================================
   ADMIN GALERI — FIRESTORE REALTIME
   Edu Wisata Bambu Mekarsari
========================================================= */

import {
    subscribeDocuments,
    createDocument,
    saveDocument,
    removeDocument,
    COLLECTIONS
} from "./data-service.js";


/* =========================================================
   1. STATE
========================================================= */

let galeriData = [];
let unsubscribeGaleri = null;


/* =========================================================
   2. KONVERSI GOOGLE DRIVE KE THUMBNAIL
========================================================= */

function convertDriveUrl(url) {
    if (!url) return "";

    url = url.trim();

    // Ambil File ID dari berbagai format link Google Drive
    const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /[?&]id=([a-zA-Z0-9_-]+)/,
        /\/d\/([a-zA-Z0-9_-]+)/
    ];

    let fileId = null;

    for (const pattern of patterns) {
        const match = url.match(pattern);

        if (match && match[1]) {
            fileId = match[1];
            break;
        }
    }

    // Jika bukan link Google Drive, gunakan URL asli
    if (!fileId || !url.includes("drive.google.com")) {
        return url;
    }

    // Convert ke thumbnail ukuran besar
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
}


/* =========================================================
   3. RENDER GALERI ADMIN
========================================================= */

function renderGaleriGrid() {
    const grid = document.getElementById("galeri-grid");

    if (!grid) return;

    if (galeriData.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-12 text-center text-gray-400 text-sm">
                Belum ada foto galeri.
                Klik Tambah Foto Baru untuk mengunggah dokumentasi.
            </div>
        `;
        return;
    }

    grid.innerHTML = galeriData.map(g => `
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">

            <div class="h-40 w-full overflow-hidden relative bg-gray-100">

                <img
                    src="${g.image || ""}"
                    alt="${g.title || "Foto Galeri"}"
                    class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onerror="this.src=''"
                >

                <span class="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
                    ${g.category || "Umum"}
                </span>

            </div>

            <div class="p-3">

                <div class="flex items-start justify-between gap-2">

                    <p class="text-xs font-semibold text-gray-800">
                        ${g.title || "Tanpa Judul"}
                    </p>

                    <div class="flex items-center gap-1 flex-shrink-0">

                        <button
                            onclick="editGaleri('${g.id}')"
                            class="text-amber-500 hover:text-amber-700 p-1"
                            title="Edit foto"
                        >
                            <i data-lucide="pencil" class="w-4 h-4"></i>
                        </button>

                        <button
                            onclick="deleteGaleri('${g.id}')"
                            class="text-rose-500 hover:text-rose-700 p-1"
                            title="Hapus foto"
                        >
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>

                    </div>

                </div>

                ${g.caption ? `
                    <p class="text-xs text-gray-500 mt-1 line-clamp-2">
                        ${g.caption}
                    </p>
                ` : `
                    <p class="text-xs text-gray-400 mt-1 italic">
                        Belum ada caption
                    </p>
                `}

            </div>

        </div>
    `).join("");

    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}


/* =========================================================
   4. BUKA MODAL TAMBAH
========================================================= */

function openModalGaleri() {
    document.getElementById("form-galeri").reset();

    document.getElementById("galeri-id").value = "";

    document.getElementById("modal-galeri-title").innerText =
        "Tambah Foto Galeri";

    document.getElementById("modal-galeri").classList.remove("hidden");
}


/* =========================================================
   5. BUKA MODAL EDIT
========================================================= */

function editGaleri(id) {
    const item = galeriData.find(g => g.id === id);

    if (!item) {
        showToast("Data foto tidak ditemukan", "error");
        return;
    }

    document.getElementById("modal-galeri-title").innerText =
        "Edit Foto Galeri";

    document.getElementById("galeri-id").value = item.id;

    document.getElementById("galeri-judul").value =
        item.title || "";

    document.getElementById("galeri-caption").value =
        item.caption || "";

    document.getElementById("galeri-kategori").value =
        item.category || "Kegiatan";

    document.getElementById("galeri-url").value =
        item.image || "";

    document.getElementById("modal-galeri").classList.remove("hidden");
}


/* =========================================================
   6. TUTUP MODAL
========================================================= */

function closeModalGaleri() {
    document.getElementById("modal-galeri").classList.add("hidden");
}


/* =========================================================
   7. SIMPAN / UPDATE GALERI
========================================================= */

async function saveGaleri(e) {
    e.preventDefault();

    const id = document.getElementById("galeri-id").value;

    // Ambil URL dari input
    const rawImageUrl = document
        .getElementById("galeri-url")
        .value
        .trim();

    // Convert link Drive menjadi thumbnail
    const convertedImageUrl = convertDriveUrl(rawImageUrl);

    const item = {
        title: document.getElementById("galeri-judul").value.trim(),

        caption: document.getElementById("galeri-caption").value.trim(),

        category: document.getElementById("galeri-kategori").value,

        image: convertedImageUrl,

        published: true
    };

    if (!item.title || !item.image) {
        showToast("Judul dan URL gambar wajib diisi", "error");
        return;
    }

    try {
        if (id) {
            await saveDocument(COLLECTIONS.gallery, id, item);

            showToast("Foto galeri berhasil diperbarui");
        } else {
            await createDocument(COLLECTIONS.gallery, item);

            showToast("Foto galeri berhasil ditambahkan");
        }

        closeModalGaleri();

        document.getElementById("form-galeri").reset();
        document.getElementById("galeri-id").value = "";

    } catch (error) {
        console.error("Gagal menyimpan galeri:", error);

        showToast("Gagal menyimpan foto galeri", "error");
    }
}


/* =========================================================
   8. HAPUS GALERI
========================================================= */

async function deleteGaleri(id) {
    const item = galeriData.find(g => g.id === id);

    if (!item) return;

    if (!confirm(`Yakin ingin menghapus foto "${item.title}"?`)) {
        return;
    }

    try {
        await removeDocument(COLLECTIONS.gallery, id);

        showToast("Foto galeri berhasil dihapus");

    } catch (error) {
        console.error("Gagal menghapus galeri:", error);

        showToast("Gagal menghapus foto galeri", "error");
    }
}


/* =========================================================
   9. FIRESTORE REALTIME
========================================================= */

function initGaleriAdmin() {
    if (unsubscribeGaleri) {
        unsubscribeGaleri();
    }

    unsubscribeGaleri = subscribeDocuments(
        COLLECTIONS.gallery,

        firestoreData => {
            galeriData = firestoreData;

            renderGaleriGrid();
        },

        {},

        error => {
            console.error("Gagal mengambil data galeri:", error);

            showToast("Gagal memuat data galeri", "error");
        }
    );
}


/* =========================================================
   10. GLOBAL FUNCTIONS
   Dipanggil oleh onclick dan onsubmit di HTML
========================================================= */

window.renderGaleriGrid = renderGaleriGrid;
window.openModalGaleri = openModalGaleri;
window.editGaleri = editGaleri;
window.closeModalGaleri = closeModalGaleri;
window.saveGaleri = saveGaleri;
window.deleteGaleri = deleteGaleri;


/* =========================================================
   11. INITIALIZE
========================================================= */

initGaleriAdmin();
