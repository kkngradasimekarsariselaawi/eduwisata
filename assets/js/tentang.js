import {
    subscribeDocuments,
    COLLECTIONS
} from "./data-service.js";


document.addEventListener("DOMContentLoaded", () => {
    initMobileNav();
    loadPotensiWisata();
});

/**
 * Pengaturan Navigasi Mobile (Hamburger Menu)
 */
function initMobileNav() {
    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const navMenu = document.getElementById("navMenu");

    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener("click", () => {
            navMenu.classList.toggle("active");
            const isExpanded = navMenu.classList.contains("active");
            hamburgerBtn.setAttribute("aria-expanded", isExpanded);
        });
    }
}

/**
 * Opsional: Mengambil data Potensi Wisata secara dinamis dari Firestore
 * jika ingin mengubah data statis menjadi dinamis.
 */
/**
 * Realtime Potensi Wisata dari Firestore
 */
function loadPotensiWisata() {
    const container = document.getElementById("potensiContainer");
    if (!container) return;

    subscribeDocuments(
        COLLECTIONS.potentials,
        (potensiData) => {

            // Pertahankan konten HTML bawaan jika database kosong
            if (!potensiData || potensiData.length === 0) {
                return;
            }

            // Data Firestore tersedia, ganti konten statis
            container.innerHTML = potensiData.map(data => `
                <div class="potensi-card">
                    <div class="potensi-img-box">
                        <img 
                            src="${data.imageUrl || data.image || ''}" 
                            alt="${data.title || 'Potensi wisata'}"
                        >
                    </div>

                    <div class="potensi-card-body">
                        <h3 class="potensi-title">
                            ${data.title || ''}
                        </h3>
                    </div>
                </div>
            `).join("");
        },
        {},
        (error) => {
            console.error(
                "Gagal memuat realtime potensi wisata:",
                error
            );
        }
    );
}