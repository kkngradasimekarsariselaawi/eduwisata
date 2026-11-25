
/* =========================================================
   PAKET WISATA — FIRESTORE REALTIME
   Edu Wisata Bambu Mekarsari
========================================================= */

import {
    subscribeDocuments,
    createDocument,
    COLLECTIONS
} from "./data-service.js";

/* =========================================================
   2. STATE
========================================================= */

let packagesData = [];

let activeCategory = "Semua";
let selectedPackage = null;

let unsubscribePackages = null;

/* =========================================================
   3. HELPER
========================================================= */

function formatRupiah(number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(number) || 0);
}

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}


function convertDriveImageUrl(url) {
    if (!url) return "";

    const link = String(url).trim();

    if (!link.includes("drive.google.com")) {
        return link;
    }

    let fileId = "";

    // Format: drive.google.com/file/d/FILE_ID/view
    const fileMatch = link.match(/\/file\/d\/([^/]+)/);

    // Format: drive.google.com/open?id=FILE_ID
    // Format: drive.google.com/uc?id=FILE_ID
    // Format: drive.google.com/thumbnail?id=FILE_ID
    const queryMatch = link.match(/[?&]id=([^&]+)/);

    if (fileMatch) {
        fileId = fileMatch[1];
    } else if (queryMatch) {
        fileId = queryMatch[1];
    }

    if (!fileId) {
        console.warn("ID Google Drive tidak ditemukan:", link);
        return link;
    }

    // URL thumbnail Google Drive
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
}


function normalizePackage(item) {
    const rawGallery =
        item.gallery ||
        item.galleries ||
        item.images ||
        [];

    // Pastikan gallery berbentuk array
    const galleryArray = Array.isArray(rawGallery)
        ? rawGallery
        : typeof rawGallery === "string"
            ? rawGallery.split(",").map(url => url.trim()).filter(Boolean)
            : [];

    // Konversi setiap URL galeri, termasuk Google Drive
    const gallery = galleryArray
        .map(url => convertDriveImageUrl(url))
        .filter(Boolean);

    // Konversi foto sampul
    const image = convertDriveImageUrl(
        item.image ||
        item.imageUrl ||
        item.gambar ||
        gallery[0] ||
        ""
    );

    return {
        id: String(item.id),

        title:
            item.title ||
            item.nama ||
            item.name ||
            "Paket Wisata",

        category:
            item.category ||
            item.kategori ||
            "Lainnya",

        price: Number(
            item.price ??
            item.harga ??
            0
        ),

        duration:
            item.duration ||
            item.durasi ||
            "-",

        minParticipants:
            item.minParticipants ||
            item.minPeserta ||
            item.minimumPeserta ||
            "Tanpa Minimal",

        schedule:
            item.schedule ||
            item.jadwal ||
            "Hubungi pengelola",

        image: image,

        gallery: gallery,

        shortDesc:
            item.shortDesc ||
            item.shortDescription ||
            item.deskripsiSingkat ||
            item.description ||
            item.deskripsi ||
            "",

        fullDesc:
            item.fullDesc ||
            item.fullDescription ||
            item.deskripsiLengkap ||
            item.description ||
            item.deskripsi ||
            "",

        features:
            Array.isArray(item.features)
                ? item.features
                : Array.isArray(item.fasilitas)
                    ? item.fasilitas
                    : typeof item.fasilitas === "string"
                        ? item.fasilitas.split(",").map(f => f.trim()).filter(Boolean)
                        : []
    };
}

/* =========================================================
   4. DOM ELEMENTS
========================================================= */

const packageGrid = document.getElementById("package-grid");
const emptyState = document.getElementById("empty-state");

const filterButtons = document.querySelectorAll(".filter-btn");

const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

const bookingModal = document.getElementById("booking-modal");
const bookingForm = document.getElementById("booking-form");

const packageSelect = document.getElementById("modal-package-select");

const lightboxModal = document.getElementById("lightbox-modal");

/* =========================================================
   5. MOBILE MENU
========================================================= */

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

/* =========================================================
   6. CATEGORY FILTER
========================================================= */

function setupCategoryFilters() {
    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            activeCategory = button.dataset.category || "Semua";

            filterButtons.forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            renderCatalog();
        });
    });
}

function getFilteredPackages() {
    if (activeCategory === "Semua") {
        return packagesData;
    }

    return packagesData.filter(pkg =>
        String(pkg.category).toLowerCase() ===
        String(activeCategory).toLowerCase()
    );
}

/* =========================================================
   7. RENDER KATALOG
========================================================= */

function renderCatalog() {
    if (!packageGrid) return;

    const filteredData = getFilteredPackages();

    if (filteredData.length === 0) {
        packageGrid.innerHTML = "";
        emptyState?.classList.remove("hidden");
        return;
    }

    emptyState?.classList.add("hidden");

    packageGrid.innerHTML = filteredData.map(pkg => {
        const id = escapeHTML(pkg.id);
        const title = escapeHTML(pkg.title);
        const category = escapeHTML(pkg.category);
        const image = escapeHTML(pkg.image);
        const shortDesc = escapeHTML(pkg.shortDesc);
        const duration = escapeHTML(pkg.duration);
        const minParticipants = escapeHTML(pkg.minParticipants);

        const hasMinimum =
            pkg.minParticipants !== "Tanpa Minimal" &&
            pkg.minParticipants !== "" &&
            pkg.minParticipants !== "-";

        return `
            <div class="bg-white rounded-3xl overflow-hidden
                shadow-md hover:shadow-2xl transition-all duration-300
                border border-gray-100 flex flex-col justify-between group">

                <div>
                    <div class="relative overflow-hidden aspect-[4/3] bg-gray-100">
                        <img
                            src="${image}"
                            alt="${title}"
                            class="w-full h-full object-cover
                            group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            onerror="this.onerror=null;this.src='https://placehold.co/600x400/064E36/FFFFFF?text=Paket+Wisata'">

                        <div class="absolute top-4 left-4">
                            <span class="badge-category px-3.5 py-1
                                rounded-full text-xs font-bold uppercase tracking-wide">
                                ${category}
                            </span>
                        </div>
                    </div>

                    <div class="p-6">
                        <h3 class="text-xl font-bold text-brand-dark mb-2
                            group-hover:text-brand-primary transition-colors">
                            ${title}
                        </h3>

                        <p class="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">
                            ${shortDesc}
                        </p>

                        <div class="space-y-2 pt-2 border-t border-gray-100">
                            <div class="flex items-baseline gap-1">
                                <span class="text-2xl font-extrabold text-brand-dark">
                                    ${formatRupiah(pkg.price)}
                                </span>

                                <span class="text-xs text-gray-400 font-medium">
                                    / Orang
                                </span>
                            </div>

                            <div class="flex items-center gap-4 text-xs
                                font-semibold text-gray-600 pt-1">

                                <span class="flex items-center gap-1.5">
                                    <i class="fa-regular fa-clock text-brand-primary"></i>
                                    ${duration}
                                </span>

                                ${hasMinimum ? `
                                    <span class="flex items-center gap-1.5">
                                        <i class="fa-solid fa-users text-brand-primary"></i>
                                        Min. ${minParticipants}
                                    </span>
                                ` : ""}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="p-6 pt-0">
                    <button
                        onclick="openDetailView('${id}')"
                        class="w-full py-3 bg-brand-bg hover:bg-brand-dark
                        text-brand-dark hover:text-white font-bold rounded-2xl
                        transition-all flex items-center justify-between px-5
                        group-hover:shadow-md">

                        <span>Detail Paket</span>

                        <div class="w-8 h-8 rounded-full bg-white text-brand-dark
                            flex items-center justify-center shadow-sm
                            group-hover:bg-brand-primary group-hover:text-white transition-all">

                            <i class="fa-solid fa-arrow-right text-xs"></i>
                        </div>
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

/* =========================================================
   8. VIEW SWITCHER
========================================================= */

function switchView(viewName) {
    const catalogView = document.getElementById("catalog-view");
    const detailView = document.getElementById("detail-view");

    if (viewName === "catalog") {
        catalogView?.classList.remove("hidden");
        detailView?.classList.add("hidden");
    } else {
        catalogView?.classList.add("hidden");
        detailView?.classList.remove("hidden");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* =========================================================
   9. PACKAGE DETAIL
========================================================= */

function openDetailView(packageId) {
    const pkg = packagesData.find(
        item => String(item.id) === String(packageId)
    );

    if (!pkg) return;

    selectedPackage = pkg;

    // Hero background
    const detailHero = document.getElementById("detail-hero-bg");

    if (detailHero) {
        detailHero.style.backgroundImage =
            `url('${pkg.image}')`;
    }

    // Breadcrumb
    document.getElementById("detail-breadcrumb-title").textContent =
        pkg.title;

    // Main image
    const mainImage = document.getElementById("main-detail-img");

    mainImage.src = pkg.image;
    mainImage.alt = pkg.title;

    // Gallery
    const galleryThumbs =
        document.getElementById("detail-gallery-thumbs");

    const galleryImages = [
        pkg.image,
        ...(pkg.gallery || [])
    ].filter(Boolean);


    const uniqueImages = [...new Set(galleryImages)];

    galleryThumbs.innerHTML = uniqueImages.map((image, index) => {
        const safeImage = escapeHTML(image);

        return `
            <div
                onclick="changeMainImage('${safeImage}', this)"
                class="rounded-xl overflow-hidden aspect-square border-2
                ${index === 0 ? "border-brand-primary" : "border-transparent"}
                hover:border-brand-primary cursor-pointer transition-all">

                <img
                src="${safeImage}"
                alt="Foto ${escapeHTML(pkg.title)}"
                class="w-full h-full object-cover"
                loading="lazy"
                onerror="this.onerror=null;this.src='https://placehold.co/400x400?text=Foto+Tidak+Tersedia'">
            </div>
        `;
    }).join("");

    // Detail information
    document.getElementById("detail-title").textContent =
        pkg.title;

    document.getElementById("detail-category-badge").textContent =
        pkg.category;

    document.getElementById("detail-price").textContent =
        formatRupiah(pkg.price);

    document.getElementById("detail-duration").textContent =
        pkg.duration;

    document.getElementById("detail-min-participants").textContent =
        pkg.minParticipants;

    document.getElementById("detail-description").textContent =
        pkg.fullDesc;

    document.getElementById("detail-schedule").textContent =
        pkg.schedule;

    document.getElementById("sticky-package-name").textContent =
        pkg.title;

    // Features
    const featuresList =
        document.getElementById("detail-features-list");

    featuresList.innerHTML = (pkg.features || []).map(feature => `
        <li class="flex items-start gap-3 text-gray-700 text-sm md:text-base">
            <div class="w-6 h-6 rounded-full bg-emerald-100
                text-brand-primary flex items-center justify-center
                shrink-0 mt-0.5">
                <i class="fa-solid fa-check text-xs"></i>
            </div>

            <span>${escapeHTML(feature)}</span>
        </li>
    `).join("");

    // Preselect package in booking form
    populateSelectDropdown();

    if (packageSelect) {
        packageSelect.value = pkg.id;
    }

    switchView("detail");
}

/* =========================================================
   10. IMAGE GALLERY
========================================================= */

function changeMainImage(url, thumbnailElement = null) {
    const mainImage = document.getElementById("main-detail-img");

    if (mainImage) {
        mainImage.src = url;
    }

    // Update selected thumbnail border
    if (thumbnailElement) {
        const gallery = document.getElementById("detail-gallery-thumbs");

        gallery?.querySelectorAll("div").forEach(item => {
            item.classList.remove("border-brand-primary");
            item.classList.add("border-transparent");
        });

        thumbnailElement.classList.remove("border-transparent");
        thumbnailElement.classList.add("border-brand-primary");
    }
}

/* =========================================================
   11. BOOKING DROPDOWN
========================================================= */

function populateSelectDropdown() {
    if (!packageSelect) return;

    packageSelect.innerHTML = `
        <option value="">
            ${packagesData.length
                ? "Pilih Paket Wisata"
                : "Belum ada paket wisata tersedia"}
        </option>
    `;

    packagesData.forEach(pkg => {
        const option = document.createElement("option");

        option.value = pkg.id;
        option.textContent =
            `${pkg.title} - ${formatRupiah(pkg.price)}`;

        packageSelect.appendChild(option);
        
    });
}

/* =========================================================
   12. BOOKING PRICE CALCULATION
========================================================= */

function calculateBookingTotal() {
    const packageId = packageSelect?.value;

    const pkg = packagesData.find(
        item => String(item.id) === String(packageId)
    );

    const quantity = Math.max(
        1,
        Number(document.getElementById("booking-qty")?.value) || 1
    );

    const packagePrice = pkg ? Number(pkg.price) : 0;

    const subtotalPackage = packagePrice * quantity;

    let subtotalAddon = 0;

    document.querySelectorAll(".booking-addon:checked")
        .forEach(addon => {
            subtotalAddon +=
                Number(addon.dataset.price || 0) * quantity;
        });

    const grandTotal = subtotalPackage + subtotalAddon;

    document.getElementById("booking-package-price").textContent =
        formatRupiah(packagePrice);

    document.getElementById("booking-subtotal").textContent =
        formatRupiah(subtotalPackage);

    document.getElementById("booking-addon-total").textContent =
        formatRupiah(subtotalAddon);

    document.getElementById("booking-grand-total").textContent =
        formatRupiah(grandTotal);
}

/* =========================================================
   13. BOOKING MODAL
========================================================= */

function openBookingModal() {
    populateSelectDropdown();

    bookingModal?.classList.remove("hidden");

    calculateBookingTotal();
}

function openBookingModalFromDetail() {
    if (selectedPackage && packageSelect) {
        packageSelect.value = selectedPackage.id;
    }

    openBookingModal();
}

function closeBookingModal() {
    bookingModal?.classList.add("hidden");

    bookingForm?.reset();

    // Reset dropdown to package pertama
    populateSelectDropdown();

    calculateBookingTotal();
}

/* =========================================================
   14. LIGHTBOX
========================================================= */

function openLightbox(imgSrc) {
    const image = document.getElementById("lightbox-img");

    if (image) {
        image.src = imgSrc;
    }

    lightboxModal?.classList.remove("hidden");
}

function closeLightbox() {
    lightboxModal?.classList.add("hidden");
}

/* =========================================================
   15. BOOKING FIRESTORE + WHATSAPP
========================================================= */


async function handleFormSubmit(event) {
    event.preventDefault();

    const submitButton = bookingForm?.querySelector('button[type="submit"]');

    if (submitButton?.disabled) return;

    const packageId = packageSelect?.value;

    const pkg = packagesData.find(
        item => String(item.id) === String(packageId)
    );

    if (!pkg) {
        alert("Silakan pilih paket wisata terlebih dahulu.");
        return;
    }

    const name = document.getElementById("booking-name").value.trim();
    const phone = document.getElementById("booking-phone").value.trim();

    const quantity = Math.max(
        1,
        Number(document.getElementById("booking-qty").value) || 1
    );

    const date = document.getElementById("booking-date").value;
    const notes = document.getElementById("booking-notes").value.trim();

    if (!name || !phone || !date) {
        alert("Mohon lengkapi nama, WhatsApp, dan tanggal kunjungan.");
        return;
    }

    // =========================================
    // GENERATE ID BOOKING PERSONAL
    // Format: EDU-DDMMYYYY-HHmmss
    // Contoh: EDU-20112026-191945
    // =========================================

    const now = new Date();

    const pad = number => String(number).padStart(2, "0");

    const bookingDateCode =
        pad(now.getDate()) +
        pad(now.getMonth() + 1) +
        now.getFullYear();

    const bookingTimeCode =
        pad(now.getHours()) +
        pad(now.getMinutes()) +
        pad(now.getSeconds());

    const bookingId = `EDU-${bookingDateCode}-${bookingTimeCode}`;

    // =========================================
    // HITUNG PAKET
    // =========================================

    const packagePrice = Number(pkg.price) || 0;
    const subtotalPackage = packagePrice * quantity;

    // =========================================
    // HITUNG ADD ON
    // =========================================

    const selectedAddons = [];
    let subtotalAddon = 0;

    document.querySelectorAll(".booking-addon:checked").forEach(addon => {
        const addonName = addon.dataset.name || addon.value;
        const addonPrice = Number(addon.dataset.price) || 0;

        selectedAddons.push({
            id: addon.value,
            nama: addonName,
            harga: addonPrice,
            jumlah: quantity,
            subtotal: addonPrice * quantity
        });

        subtotalAddon += addonPrice * quantity;
    });

    const grandTotal = subtotalPackage + subtotalAddon;

    // =========================================
    // DATA BOOKING
    // =========================================

    const bookingData = {
        bookingId: bookingId,

        nama: name,
        whatsapp: phone,
        tanggal: date,

        jumlahPeserta: quantity,
        jumlah: quantity,

        paketId: pkg.id,
        paket: pkg.title,
        namaPaket: pkg.title,

        hargaPaket: packagePrice,
        subtotalPaket: subtotalPackage,

        addons: selectedAddons,
        subtotalAddon: subtotalAddon,

        total: grandTotal,
        totalHarga: grandTotal,

        catatan: notes,

        status: "Menunggu Konfirmasi",
        sumber: "Website",

        waktu: now.toISOString()
    };

    // =========================================
    // PESAN KONFIRMASI WHATSAPP
    // =========================================

    const message = `
*PEMESANAN EDU WISATA BAMBU MEKARSARI*

Halo Admin, saya ingin mengonfirmasi pemesanan dari website.

*ID BOOKING:* ${bookingId}

*DETAIL PEMESANAN*
- Paket: ${pkg.title}
- Harga Paket/Orang: ${formatRupiah(packagePrice)}
- Jumlah Peserta: ${quantity} orang
- Subtotal Paket: ${formatRupiah(subtotalPackage)}

*ADD ON PRODUK*
${selectedAddons.length
    ? selectedAddons.map(addon =>
        `- ${addon.nama}: ${formatRupiah(addon.harga)} x ${quantity} = ${formatRupiah(addon.subtotal)}`
    ).join("\n")
    : "- Tidak ada"}

- Subtotal Add On: ${formatRupiah(subtotalAddon)}
- *TOTAL PEMESANAN: ${formatRupiah(grandTotal)}*

*DATA PEMESAN*
- Nama: ${name}
- WhatsApp: ${phone}
- Tanggal Kunjungan: ${date}
- Catatan: ${notes || "-"}

Mohon informasi dan konfirmasi lebih lanjut. Terima kasih.
`;

    const whatsappURL =
        `https://wa.me/6283173134395?text=${encodeURIComponent(message)}`;

    // =========================================
    // LOADING BUTTON
    // =========================================

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add("opacity-60", "cursor-not-allowed");

        submitButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Menyimpan Pemesanan...
        `;
    }

    // =========================================
    // SIMPAN FIRESTORE
    // =========================================

    try {
        await createDocument(COLLECTIONS.bookings, bookingData);

        // TUTUP MODAL FORM
        if (typeof closeBookingModal === "function") {
            closeBookingModal();
        }

        // TAMPILKAN POPUP BERHASIL
        showBookingSuccessModal(bookingId, whatsappURL);

        // Reset form setelah berhasil
        bookingForm?.reset();

        // Update tampilan harga jika ada fungsi kalkulasi
        if (typeof updateBookingSummary === "function") {
            updateBookingSummary();
        }

    } catch (error) {
        console.error("Gagal menyimpan pemesanan:", error);

        alert(
            "Pemesanan gagal disimpan. Silakan coba kembali atau hubungi pengelola."
        );

    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.classList.remove("opacity-60", "cursor-not-allowed");

            submitButton.innerHTML = `
                <i class="fa-solid fa-paper-plane text-xl"></i>
                Kirim Pemesanan
            `;
        }
    }
}





function showBookingSuccessModal(bookingId, whatsappURL) {
    const modal = document.getElementById("booking-success-modal");
    const bookingIdElement = document.getElementById("success-booking-id");
    const whatsappButton = document.getElementById("success-whatsapp-button");

    if (!modal || !bookingIdElement || !whatsappButton) {
        alert("Pemesanan berhasil disimpan! ID Booking: " + bookingId);
        return;
    }

    bookingIdElement.textContent = bookingId;
    whatsappButton.href = whatsappURL;

    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

window.closeBookingSuccessModal = function () {
    const modal = document.getElementById("booking-success-modal");

    if (!modal) return;

    modal.classList.add("hidden");
    modal.classList.remove("flex");
};

/* =========================================================
   16. REALTIME FIRESTORE
========================================================= */

function loadPackages() {
    if (!packageGrid) return;

    // Awal halaman: tidak ada data dummy
    packagesData = [];
    renderCatalog();

    unsubscribePackages = subscribeDocuments(
        COLLECTIONS.packages,

        firestoreData => {
            // PURE FIRESTORE
            packagesData = firestoreData.map(normalizePackage);

            renderCatalog();
            populateSelectDropdown();
            calculateBookingTotal();

            // Refresh detail jika paket sedang dibuka
            if (selectedPackage) {
                const updatedPackage = packagesData.find(
                    item => String(item.id) === String(selectedPackage.id)
                );

                if (updatedPackage) {
                    selectedPackage = updatedPackage;
                    openDetailView(updatedPackage.id);
                } else {
                    selectedPackage = null;
                    switchView("catalog");
                }
            }
        },

        { publishedOnly: true },

        error => {
            console.error("Gagal memuat paket wisata realtime:", error);

            // Tidak menggunakan fallback/dummy lagi
            packagesData = [];

            renderCatalog();
            populateSelectDropdown();
            calculateBookingTotal();
        }
    );
}
/* =========================================================
   17. EVENT LISTENERS
========================================================= */

function initBookingEvents() {
    document.getElementById("booking-qty")
        ?.addEventListener("input", calculateBookingTotal);

    packageSelect
        ?.addEventListener("change", calculateBookingTotal);

    document.querySelectorAll(".booking-addon")
        .forEach(addon => {
            addon.addEventListener("change", calculateBookingTotal);
        });

    bookingForm?.addEventListener("submit", handleFormSubmit);
}

/* =========================================================
   18. INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initMobileMenu();

    setupCategoryFilters();

    initBookingEvents();

    populateSelectDropdown();

    loadPackages();
});

/* =========================================================
   19. EXPOSE FUNCTIONS FOR HTML INLINE EVENTS
========================================================= */

window.openDetailView = openDetailView;
window.switchView = switchView;

window.changeMainImage = changeMainImage;

window.openBookingModal = openBookingModal;
window.openBookingModalFromDetail = openBookingModalFromDetail;
window.closeBookingModal = closeBookingModal;

window.calculateBookingTotal = calculateBookingTotal;
window.handleFormSubmit = handleFormSubmit;

window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;

/* =========================================================
   20. CLEANUP REALTIME LISTENER
========================================================= */

window.addEventListener("pagehide", () => {
    if (typeof unsubscribePackages === "function") {
        unsubscribePackages();
    }
});
