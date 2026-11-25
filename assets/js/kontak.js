import {
    subscribeDocuments,
    createDocument,
    COLLECTIONS
} from "./data-service.js";

// ==================================================
// FALLBACK KONFIGURASI KONTAK
// ==================================================

const defaultContact = {
    namaPengelola: "Rusdiman",
    nomorWA: "+62 895-3696-66466",
    alamat: "Desa Mekarsari, Kec. Selaawi, Kab. Garut, Jawa Barat",
    kodePos: "44187",
    jamOperasional: "Senin - Minggu: 08.00 - 17.00 WIB",
    email: "info@eduwisatamekarsari.id",
    facebook: "",
    instagram: "",
    youtube: "",
    whatsapp: "+62 895-3696-66466",
    mapEmbedUrl: ""
};

// ==================================================
// DOM ELEMENTS
// ==================================================

const contactForm = document.getElementById("contact-form");
const alertBox = document.getElementById("form-alert");
const submitBtn = document.getElementById("submit-btn");
const btnText = document.getElementById("btn-text");
const btnIcon = document.getElementById("btn-icon");

const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

const infoNama = document.getElementById("info-nama");
const infoWA = document.getElementById("info-wa");
const infoWALink = document.getElementById("info-wa-link");
const infoAlamat = document.getElementById("info-alamat");
const infoJam = document.getElementById("info-jam");

const footerAlamat = document.getElementById("footer-alamat");
const footerWA = document.getElementById("footer-wa");
const footerEmail = document.getElementById("footer-email");

const mapFrame = document.querySelector(
    'iframe[title="Peta Lokasi Desa Mekarsari Selaawi Garut"]'
);

// ==================================================
// HELPER
// ==================================================

function cleanPhoneNumber(phone = "") {
    let number = String(phone).replace(/\D/g, "");

    // Mengubah awalan 0 menjadi 62
    if (number.startsWith("0")) {
        number = "62" + number.slice(1);
    }

    // Jika belum memakai kode negara Indonesia
    if (number && !number.startsWith("62")) {
        number = "62" + number;
    }

    return number;
}

function setText(element, value) {
    if (element && value !== undefined && value !== null && value !== "") {
        element.textContent = value;
    }
}

function setLink(element, url) {
    if (!element || !url) return;

    element.href = url;
    element.target = "_blank";
    element.rel = "noopener noreferrer";
}

function normalizeContact(data = {}) {
    return {
        namaPengelola:
            data.namaPengelola ||
            data.nama ||
            data.pengelola ||
            defaultContact.namaPengelola,

        nomorWA:
            data.nomorWA ||
            data.whatsapp ||
            data.nomorWhatsapp ||
            data.telepon ||
            data.phone ||
            defaultContact.nomorWA,

        alamat:
            data.alamat ||
            data.address ||
            defaultContact.alamat,

        kodePos:
            data.kodePos ||
            data.postalCode ||
            defaultContact.kodePos,

        jamOperasional:
            data.jamOperasional ||
            data.operasional ||
            data.jamBuka ||
            data.operatingHours ||
            defaultContact.jamOperasional,

        email:
            data.email ||
            defaultContact.email,

        facebook:
            data.facebook ||
            data.linkFacebook ||
            data.facebookUrl ||
            "",

        instagram:
            data.instagram ||
            data.linkInstagram ||
            data.instagramUrl ||
            "",

        youtube:
            data.youtube ||
            data.linkYoutube ||
            data.youtubeUrl ||
            "",

        whatsapp:
            data.whatsapp ||
            data.nomorWA ||
            data.nomorWhatsapp ||
            defaultContact.whatsapp,

        mapEmbedUrl:
            data.mapEmbedUrl ||
            data.mapsEmbed ||
            data.mapsUrl ||
            ""
    };
}

// ==================================================
// UPDATE INFORMASI KONTAK
// ==================================================

function updateContactInformation(data) {
    const contact = normalizeContact(data);

    // Informasi utama
    setText(infoNama, contact.namaPengelola);
    setText(infoWA, contact.nomorWA);
    setText(infoAlamat, contact.alamat);
    setText(infoJam, contact.jamOperasional);

    // Link WhatsApp utama
    if (infoWALink) {
        const phone = cleanPhoneNumber(contact.nomorWA);

        if (phone) {
            infoWALink.href = `https://wa.me/${phone}`;
        }
    }

    // Footer
    // Footer
setText(footerAlamat, `${contact.alamat} ${contact.kodePos}`);
setText(footerWA, contact.nomorWA);
setText(footerEmail, contact.email);
    // Link media sosial
    setLink(
        document.getElementById("footer-facebook"),
        contact.facebook
    );

    setLink(
        document.getElementById("footer-instagram"),
        contact.instagram
    );

    setLink(
        document.getElementById("footer-youtube"),
        contact.youtube
    );

    // WhatsApp footer
    const footerSocialWA = document.getElementById("footer-social-wa");

    if (footerSocialWA) {
        const phone = cleanPhoneNumber(contact.whatsapp);

        if (phone) {
            footerSocialWA.href = `https://wa.me/${phone}`;
            footerSocialWA.target = "_blank";
            footerSocialWA.rel = "noopener noreferrer";
        }
    }

    // Update peta jika admin menyediakan URL embed
    if (mapFrame && contact.mapEmbedUrl) {
        mapFrame.src = contact.mapEmbedUrl;
    }
}

// ==================================================
// FIRESTORE REALTIME - KONFIGURASI KONTAK
// ==================================================

let unsubscribeContact = null;

function loadContactInformation() {
    unsubscribeContact = subscribeDocuments(
        COLLECTIONS.contact,

        documents => {
            if (documents && documents.length > 0) {

                // Jika terdapat dokumen main_config, gunakan dokumen tersebut.
                // Jika tidak, gunakan dokumen pertama.
                const config =
                    documents.find(item => item.id === "main_config") ||
                    documents[0];

                updateContactInformation(config);

            } else {
                // Database kosong, gunakan data bawaan
                updateContactInformation(defaultContact);
            }
        },

        {},

        error => {
            console.error("Gagal memuat konfigurasi kontak:", error);

            // Fallback jika terjadi error
            updateContactInformation(defaultContact);
        }
    );
}

// ==================================================
// NOTIFIKASI FORM
// ==================================================

function showAlert(message, type = "success") {
    if (!alertBox) return;

    alertBox.className = "mb-6 p-4 rounded-xl text-sm font-medium border";

    if (type === "success") {
        alertBox.classList.add(
            "bg-green-50",
            "text-green-800",
            "border-green-200"
        );

        alertBox.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fa-solid fa-circle-check text-green-600 text-lg"></i>
                <span>${message}</span>
            </div>
        `;
    } else {
        alertBox.classList.add(
            "bg-red-50",
            "text-red-800",
            "border-red-200"
        );

        alertBox.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fa-solid fa-circle-exclamation text-red-600 text-lg"></i>
                <span>${message}</span>
            </div>
        `;
    }

    alertBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

// ==================================================
// FORM KIRIM PESAN
// ==================================================

if (contactForm) {
    contactForm.addEventListener("submit", async event => {
        event.preventDefault();

        const nama = document.getElementById("nama").value.trim();
        const whatsapp = document.getElementById("whatsapp").value.trim();
        const email = document.getElementById("email").value.trim();
        const pesan = document.getElementById("pesan").value.trim();

        // Validasi
        if (!nama || !pesan) {
            showAlert(
                "Harap isi Nama Lengkap dan Pesan terlebih dahulu.",
                "error"
            );
            return;
        }

        // Loading
        if (submitBtn) submitBtn.disabled = true;

        if (btnText) {
            btnText.textContent = "Mengirim Pesan...";
        }

        if (btnIcon) {
            btnIcon.className = "fa-solid fa-spinner fa-spin text-sm";
        }

        try {
            // Simpan ke koleksi pesan_masuk pada Firestore utama
            await createDocument("pesan_masuk", {
                nama,
                whatsapp: whatsapp || "-",
                email: email || "-",
                pesan,
                status: "Belum Dibaca",
                waktu: new Date().toISOString()
            });

            showAlert(
                "Terima kasih! Pesan Anda berhasil dikirim. Pengelola kami akan segera menghubungi Anda.",
                "success"
            );

            contactForm.reset();

        } catch (error) {
            console.error("Gagal mengirim pesan:", error);

            showAlert(
                "Maaf, pesan gagal dikirim. Silakan coba kembali atau hubungi kami melalui WhatsApp.",
                "error"
            );

        } finally {
            if (submitBtn) submitBtn.disabled = false;

            if (btnText) {
                btnText.textContent = "Kirim Pesan";
            }

            if (btnIcon) {
                btnIcon.className =
                    "fa-solid fa-arrow-right text-sm group-hover:translate-x-1 transition-transform";
            }
        }
    });
}



// ==================================================
// INITIALIZATION
// ==================================================

loadContactInformation();

// Membersihkan realtime listener ketika halaman ditinggalkan
window.addEventListener("pagehide", () => {
    if (unsubscribeContact) {
        unsubscribeContact();
        unsubscribeContact = null;
    }
});