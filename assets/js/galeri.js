/* =========================================================
   GALERI PUBLIK — FIRESTORE REALTIME
   Edu Wisata Bambu Mekarsari
========================================================= */

import {
    subscribeDocuments,
    COLLECTIONS
} from "./data-service.js";

/* =========================================================
   1. STATE
========================================================= */

let galeriData = [];
let filteredGaleri = [];
let activeFilter = "semua";
let currentLightboxIndex = 0;
let unsubscribeGaleri = null;

/* =========================================================
   2. NORMALISASI KATEGORI
========================================================= */

function normalizeCategory(category = "") {
    const value = category.toLowerCase().trim();

    if (value.includes("kegiatan") || value.includes("aktivitas") || value.includes("edukasi")) {
        return "kegiatan";
    }

    if (value.includes("kerajinan")) {
        return "kerajinan";
    }

    if (value.includes("budaya") || value.includes("tradisi")) {
        return "budaya";
    }

    if (value.includes("alam")) {
        return "alam";
    }

    if (value.includes("kuliner") || value.includes("makanan")) {
        return "kuliner";
    }

    return "kegiatan";
}

function getCategoryLabel(category) {
    const labels = {
        kegiatan: "Kegiatan",
        kerajinan: "Kerajinan",
        budaya: "Budaya",
        alam: "Alam",
        kuliner: "Kuliner"
    };

    return labels[category] || "Dokumentasi";
}

/* =========================================================
   3. NORMALISASI DATA FIRESTORE
========================================================= */

function normalizeGaleri(item) {
    const rawCategory = item.category || item.kategori || "";

    return {
        id: item.id,
        title: item.title || item.judul || "Dokumentasi",
        image: item.image || item.url || "",
        category: normalizeCategory(rawCategory),
        categoryLabel: getCategoryLabel(
            normalizeCategory(rawCategory)
        ),
        caption: item.caption || item.deskripsi || ""
    };
}

/* =========================================================
   4. FILTER GALERI
========================================================= */

function filterGallery(category) {
    activeFilter = category;

    filteredGaleri = category === "semua"
        ? galeriData
        : galeriData.filter(item => item.category === category);

    renderGallery();
    updateFilterButtons();
}

function updateFilterButtons() {
    document.querySelectorAll("[onclick^='filterGallery']").forEach(button => {
        const onclickValue = button.getAttribute("onclick") || "";
        const isActive = onclickValue.includes(`'${activeFilter}'`);

        button.classList.toggle("active", isActive);
    });
}

/* =========================================================
   5. RENDER GALERI
========================================================= */

function renderGallery() {

    const grid = document.getElementById("gallery-grid");
    const loading = document.getElementById("gallery-loading");
    const empty = document.getElementById("gallery-empty");

    if (!grid) return;

    // Pastikan grid tampil setelah data berhasil dirender
    grid.classList.remove("hidden");

    if (loading) loading.classList.add("hidden");

    // Jika data galeri kosong
    if (filteredGaleri.length === 0) {

        grid.innerHTML = "";

        if (empty) {
            empty.classList.remove("hidden");

            empty.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-5xl mb-4">📸</div>

                    <h3 class="text-lg font-bold text-gray-700 mb-2">
                        Tidak ada foto dalam kategori ini
                    </h3>

                    <p class="text-sm text-gray-500">
                        Dokumentasi foto akan segera ditambahkan.
                    </p>
                </div>
            `;
        }

        return;
    }

    if (empty) empty.classList.add("hidden");

    // Render card galeri
    grid.innerHTML = filteredGaleri.map((item, index) => `
        <article
            class="gallery-card cursor-pointer group relative"
            data-gallery-index="${index}"
        >

            <!-- FOTO -->
            <div class="overflow-hidden relative">

                <img
                    src="${escapeHTML(item.image)}"
                    alt="${escapeHTML(item.title)}"
                    loading="lazy"
                    class="gallery-image"
                >

                <!-- GRADIENT OVERLAY -->
                <div class="absolute inset-0
                bg-gradient-to-t
                from-black/80
                via-black/20
                to-transparent
                opacity-100 md:opacity-0
                group-hover:opacity-100
                transition-opacity duration-300
                flex flex-col justify-end p-4 sm:p-5
                w-full min-w-0 overflow-hidden">

                    <!-- KATEGORI -->
                    <span class="text-xs font-bold uppercase tracking-wider
                        text-green-300 bg-brand-dark/80
                        px-2.5 py-1 rounded-md w-max mb-2">
                        ${escapeHTML(item.categoryLabel)}
                    </span>

                    <!-- JUDUL -->
                    <h3 class="text-white font-bold text-base leading-snug">
                        ${escapeHTML(item.title)}
                    </h3>

                    <!-- CAPTION -->
                    ${item.caption ? `
                        <p class="text-gray-200 text-xs leading-relaxed
                            line-clamp-2 mt-1
                            break-words [overflow-wrap:anywhere]
                            max-w-full overflow-hidden">
                            ${escapeHTML(item.caption)}
                        </p>
                    ` : ""}

                </div>

            </div>

        </article>
    `).join("");

    // Event klik card untuk membuka lightbox
    grid.querySelectorAll("[data-gallery-index]").forEach(card => {

        card.addEventListener("click", () => {

            const index = Number(card.dataset.galleryIndex);

            openLightbox(index);

        });

    });

}

/* =========================================================
   6. HTML ESCAPE
========================================================= */

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

/* =========================================================
   7. LIGHTBOX
========================================================= */

function openLightbox(index) {
    if (!filteredGaleri.length) return;

    currentLightboxIndex = index;
    updateLightbox();

    const lightbox = document.getElementById("lightbox");

    if (lightbox) {
        lightbox.classList.remove("hidden");
        lightbox.classList.add("flex");
        document.body.style.overflow = "hidden";
    }
}

function updateLightbox() {
    const item = filteredGaleri[currentLightboxIndex];

    if (!item) return;

    const image = document.getElementById("lightbox-img");
    const category = document.getElementById("lightbox-category");
    const title = document.getElementById("lightbox-title");
    const caption = document.getElementById("lightbox-caption");

    if (image) {
        image.src = item.image;
        image.alt = item.title;
    }

    if (category) category.textContent = item.categoryLabel;
    if (title) title.textContent = item.title;
    if (caption) caption.textContent = item.caption || "";
}

function closeLightbox() {
    const lightbox = document.getElementById("lightbox");

    if (lightbox) {
        lightbox.classList.add("hidden");
        lightbox.classList.remove("flex");
    }

    document.body.style.overflow = "";
}

function prevLightboxImage() {
    if (!filteredGaleri.length) return;

    currentLightboxIndex =
        (currentLightboxIndex - 1 + filteredGaleri.length)
        % filteredGaleri.length;

    updateLightbox();
}

function nextLightboxImage() {
    if (!filteredGaleri.length) return;

    currentLightboxIndex =
        (currentLightboxIndex + 1)
        % filteredGaleri.length;

    updateLightbox();
}

/* =========================================================
   8. REALTIME FIRESTORE
========================================================= */

function initGaleri() {
    if (unsubscribeGaleri) {
        unsubscribeGaleri();
    }

    unsubscribeGaleri = subscribeDocuments(
        COLLECTIONS.gallery,
        firestoreData => {

    galeriData = firestoreData
        .filter(item => item.published !== false)
        .map(normalizeGaleri)
        .filter(item => item.image);

    

    filterGallery(activeFilter);

},
        {
            publishedOnly: true
        },
        error => {
            console.error("Gagal memuat galeri:", error);

            const loading = document.getElementById("gallery-loading");
            const empty = document.getElementById("gallery-empty");

            if (loading) loading.classList.add("hidden");
            if (empty) empty.classList.remove("hidden");
        }
    );
}

/* =========================================================
   9. KEYBOARD NAVIGATION
========================================================= */

document.addEventListener("keydown", event => {
    const lightbox = document.getElementById("lightbox");

    if (!lightbox || lightbox.classList.contains("hidden")) return;

    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") prevLightboxImage();
    if (event.key === "ArrowRight") nextLightboxImage();
});

/* =========================================================
   10. EXPOSE FUNCTIONS TO HTML
========================================================= */

window.filterGallery = filterGallery;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.prevLightboxImage = prevLightboxImage;
window.nextLightboxImage = nextLightboxImage;

/* =========================================================
   11. START
========================================================= */

initGaleri();