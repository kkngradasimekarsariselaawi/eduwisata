
// ============================================
// ADMIN PAKET WISATA - FIRESTORE REALTIME
// ============================================

import {
    COLLECTIONS,
    subscribeDocuments,
    saveDocument,
    removeDocument
} from "./data-service.js";

let paketData = [];
let paketUnsubscribe = null;

// ============================================
// HELPER
// ============================================

// Helper agar teks aman ditampilkan ke HTML
function escapeHTML(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// Konversi link Google Drive menjadi URL thumbnail gambar
function convertDriveImage(url = "") {
    if (!url) return "";

    const match = url.match(/\/file\/d\/([^/]+)/)
        || url.match(/[?&]id=([^&]+)/);

    if (match) {
        const fileId = match[1];
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }

    return url;
}

// Format Rupiah
function formatRupiah(value) {
    return Number(value || 0).toLocaleString("id-ID");
}

// Konversi string koma menjadi array
function stringToArray(value = "") {
    if (Array.isArray(value)) return value;

    return String(value)
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
}

// Konversi array menjadi string untuk form
function arrayToString(value = []) {
    if (Array.isArray(value)) {
        return value.join(", ");
    }

    return String(value || "");
}

// ============================================
// REALTIME FIRESTORE
// ============================================

function initPaketRealtime() {
    if (paketUnsubscribe) paketUnsubscribe();

    paketUnsubscribe = subscribeDocuments(
        COLLECTIONS.packages,
        (data) => {
            paketData = data;

            renderPaketGrid();

            const stat = document.getElementById("stat-paket");
            if (stat) stat.textContent = paketData.length;
        },
        {},
        (error) => {
            console.error("Gagal mengambil data paket:", error);
            showToast("Gagal memuat paket wisata dari Firebase", "error");
        }
    );
}

// ============================================
// RENDER PAKET
// ============================================

function renderPaketGrid() {
    const grid = document.getElementById("paket-grid");
    if (!grid) return;

    const stat = document.getElementById("stat-paket");
    if (stat) stat.textContent = paketData.length;

    if (paketData.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-12 text-center text-gray-400 text-sm">
                Belum ada paket wisata di database.
                Klik Tambah Paket Baru untuk membuat paket.
            </div>
        `;
        return;
    }

    grid.innerHTML = paketData.map(p => `
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm
                    overflow-hidden flex flex-col justify-between hover:shadow-md transition">

            <div>
                <div class="h-44 w-full relative overflow-hidden bg-gray-100">
                    <img
                        src="${escapeHTML(convertDriveImage(p.image || p.gambar || ""))}"
                        alt="${escapeHTML(p.title || p.nama || "")}"
                        class="w-full h-full object-cover"
                        onerror="this.onerror=null; this.src='https://placehold.co/600x400?text=Foto+Paket'">

                    <span class="absolute top-3 left-3 bg-[#064E36] text-white
                                 text-[10px] font-bold px-2.5 py-1 rounded-full
                                 uppercase tracking-wider shadow">
                        ${escapeHTML(p.category || p.kategori || "-")}
                    </span>
                </div>

                <div class="p-5 space-y-2">
                    <h4 class="font-bold text-gray-800 text-base leading-snug">
                        ${escapeHTML(p.title || p.nama || "-")}
                    </h4>

                    <p class="text-xs text-gray-500 line-clamp-2">
                        ${escapeHTML(p.shortDesc || p.deskripsi || "-")}
                    </p>

                    <div class="pt-2 flex items-center justify-between text-xs text-gray-600">
                        <span>Durasi: <b>${escapeHTML(p.duration || p.durasi || "-")}</b></span>
                        <span>Min: <b>${escapeHTML(p.minParticipants || p.minPeserta || "-")}</b></span>
                    </div>

                    <div class="text-base font-extrabold text-brand-dark pt-1">
                        Rp ${formatRupiah(p.price ?? p.harga)}
                        <span class="text-xs font-normal text-gray-400">/ pax</span>
                    </div>
                </div>
            </div>

            <div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <button
                    onclick="editPaket('${escapeHTML(p.id)}')"
                    class="px-3 py-1.5 bg-amber-50 text-amber-700
                           hover:bg-amber-100 rounded-lg text-xs font-semibold transition">
                    Edit
                </button>

                <button
                    onclick="deletePaket('${escapeHTML(p.id)}')"
                    class="px-3 py-1.5 bg-rose-50 text-rose-700
                           hover:bg-rose-100 rounded-lg text-xs font-semibold transition">
                    Hapus
                </button>
            </div>
        </div>
    `).join("");

    if (window.lucide) lucide.createIcons();
}

// ============================================
// MODAL TAMBAH PAKET
// ============================================

function openModalPaket() {
    document.getElementById("modal-paket-title").innerText =
        "Tambah Paket Wisata Baru";

    document.getElementById("form-paket").reset();
    document.getElementById("paket-id").value = "";

    document.getElementById("modal-paket").classList.remove("hidden");
}

function closeModalPaket() {
    document.getElementById("modal-paket").classList.add("hidden");
}

// ============================================
// SIMPAN / UPDATE PAKET
// ============================================

async function savePaket(e) {
    e.preventDefault();

    const id = document.getElementById("paket-id").value;

    // Ambil data dari form
    const nama = document.getElementById("paket-nama").value.trim();
    const kategori = document.getElementById("paket-kategori").value;
    const harga = Number(document.getElementById("paket-harga").value) || 0;
    const durasi = document.getElementById("paket-durasi").value.trim();
    const minPeserta = document.getElementById("paket-min").value.trim();
    const jadwal = document.getElementById("paket-jadwal").value.trim();
    const gambar = document.getElementById("paket-gambar").value.trim();

    const galeri = stringToArray(
        document.getElementById("paket-galeri").value
    );

    const deskripsiSingkat = document.getElementById("paket-deskripsi").value.trim();

    const deskripsiLengkap = document.getElementById(
        "paket-deskripsi-lengkap"
    ).value.trim();

    const fasilitas = stringToArray(
        document.getElementById("paket-fasilitas").value
    );

    // ========================================
    // STRUKTUR DATA FIRESTORE
    // Mendukung field publik dan field admin lama
    // ========================================

    const item = {
        // FIELD STRUKTUR PUBLIK
        title: nama,
        category: kategori,
        price: harga,
        duration: durasi,
        minParticipants: minPeserta,
        schedule: jadwal,
        image: gambar,
        gallery: galeri,
        shortDesc: deskripsiSingkat,
        fullDesc: deskripsiLengkap,
        features: fasilitas,

        // FIELD KOMPATIBILITAS ADMIN LAMA
        nama: nama,
        kategori: kategori,
        harga: harga,
        durasi: durasi,
        minPeserta: minPeserta,
        fasilitas: fasilitas,
        gambar: gambar,
        deskripsi: deskripsiSingkat,

        // STATUS PUBLIKASI
        published: true
    };

    try {
        const documentId = id || `pkt-${Date.now()}`;

        await saveDocument(
            COLLECTIONS.packages,
            documentId,
            item
        );

        closeModalPaket();

        showToast(
            id
                ? "Paket wisata berhasil diperbarui"
                : "Paket wisata baru berhasil ditambahkan"
        );

        // Firestore realtime otomatis memperbarui grid.

    } catch (error) {
        console.error("Gagal menyimpan paket:", error);
        showToast("Paket gagal disimpan ke database", "error");
    }
}

// ============================================
// EDIT PAKET
// ============================================

function editPaket(id) {
    const p = paketData.find(item => item.id === id);
    if (!p) return;

    document.getElementById("modal-paket-title").innerText =
        "Edit Paket Wisata";

    // ========================================
    // IDENTITAS & INFORMASI UTAMA
    // ========================================

    document.getElementById("paket-id").value = p.id;

    document.getElementById("paket-nama").value =
        p.title || p.nama || "";

    document.getElementById("paket-kategori").value =
        p.category || p.kategori || "";

    document.getElementById("paket-harga").value =
        p.price ?? p.harga ?? 0;

    document.getElementById("paket-durasi").value =
        p.duration || p.durasi || "";

    document.getElementById("paket-min").value =
        p.minParticipants || p.minPeserta || "";

    // ========================================
    // JADWAL
    // ========================================

    document.getElementById("paket-jadwal").value =
        p.schedule || "";

    // ========================================
    // GAMBAR & GALERI
    // ========================================

    document.getElementById("paket-gambar").value =
        p.image || p.gambar || "";

    document.getElementById("paket-galeri").value =
        arrayToString(p.gallery || []);

    // ========================================
    // DESKRIPSI
    // ========================================

    document.getElementById("paket-deskripsi").value =
        p.shortDesc || p.deskripsi || "";

    document.getElementById("paket-deskripsi-lengkap").value =
        p.fullDesc || "";

    // ========================================
    // APA YANG DIDAPATKAN / FEATURES
    // Mendukung data lama berbentuk string
    // dan data baru berbentuk array
    // ========================================

    document.getElementById("paket-fasilitas").value =
        arrayToString(p.features || p.fasilitas || []);

    document.getElementById("modal-paket").classList.remove("hidden");
}

// ============================================
// HAPUS PAKET
// ============================================

async function deletePaket(id) {
    const p = paketData.find(item => item.id === id);
    if (!p) return;

    const namaPaket = p.title || p.nama || "Paket wisata";

    if (!confirm(`Yakin ingin menghapus paket "${namaPaket}"?`)) {
        return;
    }

    try {
        await removeDocument(COLLECTIONS.packages, id);

        showToast("Paket wisata berhasil dihapus");

        // Grid otomatis diperbarui melalui realtime listener.

    } catch (error) {
        console.error("Gagal menghapus paket:", error);
        showToast("Paket gagal dihapus dari database", "error");
    }
}

// ============================================
// HUBUNGKAN KE HTML
// ============================================

window.renderPaketGrid = renderPaketGrid;
window.openModalPaket = openModalPaket;
window.closeModalPaket = closeModalPaket;
window.savePaket = savePaket;
window.editPaket = editPaket;
window.deletePaket = deletePaket;

// ============================================
// MULAI REALTIME
// ============================================

initPaketRealtime();
