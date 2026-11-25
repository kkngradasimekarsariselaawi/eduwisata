// ==========================================
// DESTINASI WISATA - FIRESTORE REALTIME
// ==========================================

import {
    subscribeDocuments,
    COLLECTIONS
} from "./data-service.js";

// ==========================================
// DATA FALLBACK
// ==========================================

const fallbackDestinations = [
    {
        id: "1",
        nama: "Bolang View",
        kategori: "alam",
        kategoriLabel: "Alam",
        deskripsi: "Panorama indah di tepian Sungai Cimanuk dengan spot foto perbukitan hijau Selaawi yang memanjakan mata.",
        fullDesc: "Bolang View menawarkan pemandangan alam perbukitan dan aliran sungai Cimanuk dari ketinggian. Tempat ini menjadi favorit para wisatawan untuk menikmati matahari terbit dan berfoto ria dengan latar belakang lanskap pedesaan yang asri.",
        gambar: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop",
        jamOperasional: "07.00 - 17.30 WIB",
        tiket: "Rp 10.000 / Orang"
    },
    {
        id: "2",
        nama: "Sentra Kerajinan Bambu",
        kategori: "edukasi",
        kategoriLabel: "Edukasi",
        deskripsi: "Saksikan langsung proses pembuatan kerajinan bambu khas Selaawi dan ciptakan karya anyaman Anda sendiri.",
        fullDesc: "Di Sentra Kerajinan Bambu Desa Mekarsari, pengunjung diajak berinteraksi langsung dengan para pengrajin lokal berpengalaman. Anda dapat belajar teknik membelah, menganyam, hingga merangkai bambu menjadi berbagai kerajinan.",
        gambar: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=800&auto=format&fit=crop",
        jamOperasional: "08.00 - 16.00 WIB",
        tiket: "Termasuk Paket Edukasi"
    },
    {
        id: "3",
        nama: "Ruang Budaya & Kabarulem",
        kategori: "budaya",
        kategoriLabel: "Budaya",
        deskripsi: "Nikmati pertunjukan budaya tradisional Sunda, Seni Calung, Angklung bambu, dan kisah sejarah lokal.",
        fullDesc: "Ruang Budaya & Kabarulem merupakan sanggar pertunjukan seni tempat dilestarikannya musik bambu tradisional Sunda. Pengunjung dapat menyaksikan penampilan Calung, Angklung, dan tarian daerah.",
        gambar: "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=800&auto=format&fit=crop",
        jamOperasional: "Sesuai Jadwal Pentas",
        tiket: "Rp 20.000 / Orang"
    },
    {
        id: "4",
        nama: "Area Aktivitas Outdoor",
        kategori: "petualangan",
        kategoriLabel: "Petualangan",
        deskripsi: "ATV, Lodong (meriam bambu), dan berbagai permainan tradisional khas anak desa Garut.",
        fullDesc: "Kawasan outdoor yang dirancang untuk keseruan bersama keluarga maupun rombongan gathering. Menyeberangi trek tanah dengan ATV, menjajal permainan tradisional lodong bambu, hingga ketangkasan egrang.",
        gambar: "https://images.unsplash.com/photo-1533561052604-c3beb6d55b8d?q=80&w=800&auto=format&fit=crop",
        jamOperasional: "08.00 - 17.00 WIB",
        tiket: "Mulai Rp 15.000"
    },
    {
        id: "5",
        nama: "Saung Kuliner Sunda",
        kategori: "kuliner",
        kategoriLabel: "Kuliner",
        deskripsi: "Cicipi sajian nasi liwet komplit, sambal dadak, lalapan segar, dan olahan makanan khas Desa Mekarsari.",
        fullDesc: "Resto saung bambu tepi sawah menyajikan kehangatan masakan Sunda otentik yang dimasak secara tradisional dengan tungku kayu bakar.",
        gambar: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop",
        jamOperasional: "09.00 - 20.00 WIB",
        tiket: "Sesuai Menu"
    },
    {
        id: "6",
        nama: "Kebun Konservasi Bambu",
        kategori: "edukasi",
        kategoriLabel: "Edukasi",
        deskripsi: "Mengenal puluhan spesies vegetasi bambu langka nusantara dan manfaat ekologisnya.",
        fullDesc: "Area pembibitan dan edupark yang menampung berbagai varietas bambu. Tempat ideal untuk penelitian, kunjungan sekolah, maupun pecinta lingkungan.",
        gambar: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800&auto=format&fit=crop",
        jamOperasional: "08.00 - 16.00 WIB",
        tiket: "Rp 10.000 / Orang"
    }
];

// ==========================================
// STATE
// ==========================================

let currentDestinations = [...fallbackDestinations];
let activeFilter = "semua";
let unsubscribeDestinations = null;

// ==========================================
// DOM ELEMENTS
// ==========================================

const destinationsGrid = document.getElementById("destinations-grid");
const filterBtns = document.querySelectorAll(".filter-btn");

const loadingState = document.getElementById("loading-state");
const emptyState = document.getElementById("empty-state");

const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

// Modal
const modal = document.getElementById("detail-modal");
const modalImg = document.getElementById("modal-img");
const modalCategory = document.getElementById("modal-category");
const modalTitle = document.getElementById("modal-title");
const modalDesc = document.getElementById("modal-desc");
const modalHours = document.getElementById("modal-hours");
const modalTicket = document.getElementById("modal-ticket");

const closeModalBtn = document.getElementById("close-modal-btn");
const modalSecondaryBtn = document.getElementById("modal-secondary-btn");

// ==========================================
// HELPER
// ==========================================

// Mencegah karakter HTML dari data database
// dimasukkan sebagai HTML mentah.
function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

// Menormalkan kemungkinan perbedaan nama field
// antara data dashboard dan data halaman publik.
function normalizeDestination(item) {
    const kategori = String(
        item.kategori || item.category || "lainnya"
    ).toLowerCase();

    const categoryLabels = {
        edukasi: "Edukasi",
        budaya: "Budaya",
        alam: "Alam",
        kuliner: "Kuliner",
        petualangan: "Petualangan"
    };

    return {
        id: String(item.id),

        nama: item.nama || item.title || item.name || "Destinasi",

        kategori: kategori,

        kategoriLabel:
            item.kategoriLabel ||
            item.categoryLabel ||
            categoryLabels[kategori] ||
            kategori,

        deskripsi:
            item.deskripsi ||
            item.description ||
            "",

        fullDesc:
            item.fullDesc ||
            item.detail ||
            item.deskripsiLengkap ||
            item.deskripsi ||
            item.description ||
            "",

        gambar:
            item.gambar ||
            item.image ||
            item.imageUrl ||
            "",

        jamOperasional:
            item.jamOperasional ||
            item.operatingHours ||
            item.hours ||
            "08.00 - 17.00 WIB",

        tiket:
            item.tiket ||
            item.ticket ||
            item.ticketPrice ||
            "Sesuai Paket"
    };
}

// ==========================================
// MOBILE MENU
// ==========================================

function initMobileMenu() {
    if (!mobileMenuBtn || !mobileMenu) return;

    mobileMenuBtn.addEventListener("click", () => {
        mobileMenu.classList.toggle("hidden");
    });

    mobileMenu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            mobileMenu.classList.add("hidden");
        });
    });
}

// ==========================================
// FILTER DESTINASI
// ==========================================

function getFilteredDestinations() {
    if (activeFilter === "semua") {
        return currentDestinations;
    }

    return currentDestinations.filter(item =>
        item.kategori.toLowerCase() === activeFilter.toLowerCase()
    );
}

function updateFilterButtons(selectedButton) {
    filterBtns.forEach(button => {
        button.classList.remove(
            "active",
            "bg-brand-dark",
            "text-white",
            "shadow-md"
        );

        button.classList.add(
            "bg-gray-100",
            "text-gray-600"
        );
    });

    selectedButton.classList.add(
        "active",
        "bg-brand-dark",
        "text-white",
        "shadow-md"
    );

    selectedButton.classList.remove(
        "bg-gray-100",
        "text-gray-600"
    );
}

function initFilters() {
    filterBtns.forEach(button => {
        button.addEventListener("click", () => {
            activeFilter = button.dataset.category || "semua";

            updateFilterButtons(button);

            renderDestinations(getFilteredDestinations());
        });
    });
}

// ==========================================
// RENDER DESTINASI
// ==========================================

function renderDestinations(data) {
    if (!destinationsGrid) return;

    destinationsGrid.innerHTML = "";

    if (!data || data.length === 0) {
        emptyState?.classList.remove("hidden");
        return;
    }

    emptyState?.classList.add("hidden");

    data.forEach(item => {
        const card = document.createElement("article");

        card.className = `
            bg-white rounded-2xl overflow-hidden
            border border-gray-100 shadow-card
            hover:shadow-soft transition-all duration-300
            flex flex-col group
        `;

        const image = escapeHTML(item.gambar);
        const name = escapeHTML(item.nama);
        const categoryLabel = escapeHTML(item.kategoriLabel);
        const description = escapeHTML(item.deskripsi);
        const id = escapeHTML(item.id);

        card.innerHTML = `
            <div class="relative h-56 w-full overflow-hidden bg-gray-100">
                <img
                    src="${image}"
                    alt="${name}"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='https://placehold.co/600x400/064E36/FFFFFF?text=Destinasi';"
                >

                <span class="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-brand-dark font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    ${categoryLabel}
                </span>
            </div>

            <div class="p-6 flex flex-col flex-grow justify-between">
                <div>
                    <h3 class="text-xl font-extrabold text-gray-900 group-hover:text-brand-dark transition-colors mb-2">
                        ${name}
                    </h3>

                    <p class="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-2">
                        ${description}
                    </p>
                </div>

                <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button
                        data-id="${id}"
                        class="detail-btn inline-flex items-center text-sm font-bold text-brand-dark hover:text-emerald-700 transition-colors"
                    >
                        Lihat Detail
                        <span class="ml-1 text-base">→</span>
                    </button>

                    <button
                        data-id="${id}"
                        aria-label="Buka detail ${name}"
                        class="detail-btn w-9 h-9 rounded-full bg-brand-dark text-white flex items-center justify-center hover:bg-emerald-900 transition-colors shadow-sm"
                    >
                        <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;

        destinationsGrid.appendChild(card);
    });

    // Render Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Event detail buttons
    destinationsGrid.querySelectorAll(".detail-btn").forEach(button => {
        button.addEventListener("click", () => {
            openDetailModal(button.dataset.id);
        });
    });
}

// ==========================================
// MODAL DETAIL
// ==========================================

function openDetailModal(id) {
    const item = currentDestinations.find(
        destination => destination.id === String(id)
    );

    if (!item || !modal) return;

    modalImg.src = item.gambar;
    modalImg.alt = item.nama;

    modalCategory.textContent = item.kategoriLabel;
    modalTitle.textContent = item.nama;
    modalDesc.textContent = item.fullDesc || item.deskripsi;

    modalHours.textContent =
        item.jamOperasional || "08.00 - 17.00 WIB";

    modalTicket.textContent =
        item.tiket || "Sesuai Paket";

    modal.classList.remove("hidden");

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function closeModal() {
    modal?.classList.add("hidden");
}

function initModal() {
    closeModalBtn?.addEventListener("click", closeModal);
    modalSecondaryBtn?.addEventListener("click", closeModal);

    modal?.addEventListener("click", event => {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeModal();
        }
    });
}

// ==========================================
// FIRESTORE REALTIME
// ==========================================

function loadDestinations() {
    if (!destinationsGrid) return;

    loadingState?.classList.remove("hidden");

    // Tampilkan fallback sementara saat menunggu Firestore
    renderDestinations(getFilteredDestinations());

    unsubscribeDestinations = subscribeDocuments(
        COLLECTIONS.destinations,

        (firestoreData) => {
            const normalizedData = firestoreData.map(
                normalizeDestination
            );

            // Firestore kosong -> fallback
            if (!normalizedData.length) {
                currentDestinations = [...fallbackDestinations];
            } else {
                currentDestinations = normalizedData;
            }

            loadingState?.classList.add("hidden");

            // Render mengikuti filter yang sedang aktif
            renderDestinations(getFilteredDestinations());
        },

        {},

        (error) => {
            console.error(
                "Gagal memuat destinasi dari Firestore:",
                error
            );

            // Jika error, gunakan fallback
            currentDestinations = [...fallbackDestinations];

            loadingState?.classList.add("hidden");

            renderDestinations(getFilteredDestinations());
        }
    );
}

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    initMobileMenu();
    initFilters();
    initModal();

    if (window.lucide) {
        window.lucide.createIcons();
    }

    loadDestinations();
});

// Cleanup listener jika halaman ditinggalkan
window.addEventListener("pagehide", () => {
    if (typeof unsubscribeDestinations === "function") {
        unsubscribeDestinations();
    }
});