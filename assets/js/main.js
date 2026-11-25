import {
    subscribeDocuments,
    COLLECTIONS
} from "./data-service.js";

// Data Fallback jika Firestore kosong/belum diisi


document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    fetchPaketUnggulan();
    loadFooterContact();
    loadManagedImages();
});

// 1. Mobile Menu Toggle
function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!menuBtn || !mobileMenu) return;

    // Toggle hamburger
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        const isHidden = mobileMenu.classList.contains('hidden');

        mobileMenu.classList.toggle('hidden');
        menuBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    });

    // Tutup ketika link menu diklik
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            menuBtn.setAttribute('aria-expanded', 'false');
        });
    });

    // Tutup ketika klik area di luar menu dan tombol
    document.addEventListener('click', (e) => {
        if (
            !mobileMenu.contains(e.target) &&
            !menuBtn.contains(e.target)
        ) {
            mobileMenu.classList.add('hidden');
            menuBtn.setAttribute('aria-expanded', 'false');
        }
    });

    // Tutup ketika tekan Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            mobileMenu.classList.add('hidden');
            menuBtn.setAttribute('aria-expanded', 'false');
        }
    });
}

function convertDriveImage(url) {
    if (!url) return "";

    const match = url.match(/\/file\/d\/([^/]+)/);

    if (match) {
        const fileId = match[1];

        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }

    return url;
}

// 2. Realtime Paket Wisata Unggulan — 3 Paket Terbaru
function fetchPaketUnggulan() {
    const container = document.getElementById('paket-container');
    if (!container) return;

    subscribeDocuments(
        COLLECTIONS.packages,
        (packagesData) => {

            // Jika data paket kosong
            if (!packagesData || packagesData.length === 0) {
                renderPackages([], container);
                return;
            }

            // Ambil tanggal pembuatan paket
            function getCreatedDate(item) {
                const dateValue =
                    item.createdAt ||
                    item.created_at ||
                    item.tanggalDibuat ||
                    item.tanggal_dibuat ||
                    item.created ||
                    item.tanggal;

                if (!dateValue) return 0;

                if (dateValue.seconds) {
                    return dateValue.seconds * 1000;
                }

                if (dateValue instanceof Date) {
                    return dateValue.getTime();
                }

                const parsed = new Date(dateValue).getTime();

                return isNaN(parsed) ? 0 : parsed;
            }

            // Urutkan paket terbaru
            const sortedPackages = [...packagesData].sort((a, b) => {
                return getCreatedDate(b) - getCreatedDate(a);
            });

            // Tampilkan maksimal 3 paket terbaru
            const latestPackages = sortedPackages.slice(0, 3);

            renderPackages(latestPackages, container);
        },
        {},
        (error) => {
            console.error("Gagal memuat paket wisata:", error);

            renderPackages([], container);
        }
    );
}

// 3. Render Component Cards into DOM
function renderPackages(items, container) {
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="col-span-1 md:col-span-3 text-center py-16 px-6">
                <div class="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <i class="fa-solid fa-box-open text-2xl text-gray-400"></i>
                </div>

                <h3 class="text-lg md:text-xl font-bold text-brand-dark mb-2">
                    Paket Belum Ditambahkan
                </h3>

                <p class="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
                    Paket wisata sedang dipersiapkan. Nantikan pengalaman seru berikutnya di Edu Wisata Bambu Mekarsari.
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML = items.map(item => {

        // Sesuaikan field dengan data dari Dashboard
        const title = item.nama || item.title || "Paket Wisata";
        const description = item.deskripsi || item.description || "";
        const price = item.harga ?? item.price ?? 0;
        const rawImage = item.image || item.gambar || item.foto || "";
        const image = convertDriveImage(rawImage);
        const id = item.id || "";

        return `
            <article class="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group">

                <!-- Image Frame -->
                <div class="relative h-56 overflow-hidden">
                    <img
                        src="${image}"
                        alt="${title}"
                        class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                        onerror="this.onerror=null; this.removeAttribute('src'); this.alt='Gambar tidak tersedia'; this.style.display='none';"
                    >
                    <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                </div>

                <!-- Content Area -->
                <div class="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                        <h3 class="text-xl font-bold text-brand-dark group-hover:text-brand-green transition-colors leading-snug">
                            ${title}
                        </h3>

                        <p class="text-gray-500 text-sm mt-2 line-clamp-2 leading-relaxed">
                            ${description}
                        </p>
                    </div>

                    <!-- Price and Action Button -->
                    <div class="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div>
                            <span class="text-xs text-gray-400 block font-medium">Mulai dari</span>

                            <span class="text-lg font-extrabold text-brand-dark">
                                Rp ${Number(price).toLocaleString('id-ID')}
                            </span>

                            <span class="text-xs text-gray-500 font-medium">/ Orang</span>
                        </div>

                        <a
                            href="paket.html"
                            class="w-11 h-11 rounded-full bg-brand-dark hover:bg-brand-green text-white flex items-center justify-center shadow-md transition-all duration-300 transform group-hover:scale-105"
                            aria-label="Detail ${title}"
                        >
                            <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}



// =========================================================
// FOOTER — KONFIGURASI REALTIME FIRESTORE
// =========================================================

let unsubscribeFooterContact = null;

function loadFooterContact() {

    // Hindari listener ganda
    if (unsubscribeFooterContact) {
        unsubscribeFooterContact();
        unsubscribeFooterContact = null;
    }

    unsubscribeFooterContact = subscribeDocuments(
        COLLECTIONS.contact,

        (documents) => {

            if (!documents || documents.length === 0) {
                return;
            }

            // Gunakan dokumen konfigurasi utama yang sama dengan Dashboard
            const config = documents.find(
                item => item.id === "GJ62CtVFYxrHqnJczdkQ"
            );

            if (!config) {
                console.error("Dokumen konfigurasi utama tidak ditemukan!");
                return;
            }
            console.log("DATA CONFIG:", config);
            console.log("URL LOGO FIRESTORE:", config.logo);
            console.log("URL LOGO CONVERT:", config.logo ? convertDriveImage(config.logo) : "KOSONG");

            // =========================================
// DEBUG UPDATE LOGO HEADER & FOOTER
// =========================================

const logoUrl = config.logo
    ? convertDriveImage(config.logo)
    : "assets/images/logo.png";

console.log("LOGO URL YANG AKAN DIPAKAI:", logoUrl);

const logoHeader = document.getElementById("site-logo-header");
const logoFooter = document.getElementById("site-logo-footer");

if (logoHeader) {
    logoHeader.src = logoUrl;

    logoHeader.onerror = function () {
        console.error("LOGO HEADER GAGAL DIMUAT:", logoUrl);
        this.src = "assets/images/logo.png";
    };
}

if (logoFooter) {
    logoFooter.src = logoUrl;

    logoFooter.onerror = function () {
        console.error("LOGO FOOTER GAGAL DIMUAT:", logoUrl);
        this.src = "assets/images/logo.png";
    };
}
            
           
            // =========================================================
            // KONTAK — HALAMAN KONTAK
            // =========================================================

            // Nomor WhatsApp
            const infoWA = document.getElementById("info-wa");
            const infoWALink = document.getElementById("info-wa-link");

            if (config.telp) {
                if (infoWA) {
                    infoWA.textContent = config.telp;
                }

                if (infoWALink) {
                    let nomor = config.telp.replace(/\D/g, "");

                    if (nomor.startsWith("0")) {
                        nomor = "62" + nomor.slice(1);
                    } else if (!nomor.startsWith("62")) {
                        nomor = "62" + nomor;
                    }

                    infoWALink.href = `https://wa.me/${nomor}`;
                }
            }


            // Jam operasional
            const infoJam = document.getElementById("info-jam");

            if (infoJam && config.jam) {
                infoJam.textContent = config.jam;
            }

            // ALAMAT
            const footerAlamat = document.getElementById("footer-alamat");

            if (footerAlamat) {
                const alamat = config.alamat || "";
                const wilayah = config.wilayah || "";

                footerAlamat.textContent = [alamat, wilayah]
                    .filter(Boolean)
                    .join(", ");
            }

            // NOMOR TELEPON
            const footerWA = document.getElementById("footer-wa");

            if (footerWA) {
                footerWA.textContent = config.telp || "-";
            }

            // EMAIL
            const footerEmail = document.getElementById("footer-email");

            if (footerEmail) {
                footerEmail.textContent = config.email || "-";
            }

            // INSTAGRAM
            const footerInstagram =
                document.getElementById("footer-instagram");

            if (footerInstagram && config.instagram) {
                footerInstagram.href = config.instagram;
                footerInstagram.target = "_blank";
                footerInstagram.rel = "noopener noreferrer";
            }

            // YOUTUBE
            const footerYoutube =
                document.getElementById("footer-youtube");

            if (footerYoutube && config.youtube) {
                footerYoutube.href = config.youtube;
                footerYoutube.target = "_blank";
                footerYoutube.rel = "noopener noreferrer";
            }

            // WHATSAPP
            const footerSocialWA =
                document.getElementById("footer-social-wa");

            if (footerSocialWA && config.telp) {

                let nomor = config.telp.replace(/\D/g, "");

                if (nomor.startsWith("0")) {
                    nomor = "62" + nomor.slice(1);
                } else if (!nomor.startsWith("62")) {
                    nomor = "62" + nomor;
                }

                footerSocialWA.href = `https://wa.me/${nomor}`;
                footerSocialWA.target = "_blank";
                footerSocialWA.rel = "noopener noreferrer";
            }

        },

        {},

        (error) => {
            console.error(
                "Gagal memuat konfigurasi footer:",
                error
            );
        }
    );
}

// =========================================================
// MANAJEMEN GAMBAR WEBSITE — REALTIME FIRESTORE
// =========================================================

let unsubscribeManagedImages = null;

function loadManagedImages() {

    // Hindari listener ganda
    if (unsubscribeManagedImages) {
        unsubscribeManagedImages();
        unsubscribeManagedImages = null;
    }

    unsubscribeManagedImages = subscribeDocuments(
        COLLECTIONS.content,

        (documents) => {

            if (!documents || documents.length === 0) {
                return;
            }

            documents.forEach(item => {

                // Identifikasi gambar menggunakan document ID atau imageKey
                const imageKey = item.imageKey || item.key || item.id;

                // URL gambar yang tersimpan
                const imageUrl =
                    item.imageUrl ||
                    item.url ||
                    item.gambar ||
                    item.image ||
                    item.foto ||
                    "";

                if (!imageKey || !imageUrl) return;

                // Cari elemen gambar yang cocok di halaman
                const imageElement = document.querySelector(
                    `[data-image-key="${imageKey}"]`
                );

                if (!imageElement) return;

                // Jika elemen berupa IMG
                if (imageElement.tagName === "IMG") {
                    if (imageElement.src !== imageUrl) {
                        imageElement.src = imageUrl;
                    }
                }

                // Jika elemen berupa background (Hero Banner)
                else {
                    const newBackground = `url("${imageUrl}")`;

                    if (imageElement.style.backgroundImage !== newBackground) {
                        imageElement.style.backgroundImage = newBackground;
                    }
                }

            });

        },

        {},

        (error) => {
            console.error(
                "Gagal memuat gambar website:",
                error
            );
        }
    );
}