    // admin-auth.js
    // Koneksi Firebase untuk halaman dashboard admin

    import { auth } from "./firebase-core.js";
    import { onAuthStateChanged } from
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

    // Simpan status auth agar bisa diakses script dashboard
    window.adminAuth = auth;
    window.adminUser = null;

    // Pantau status autentikasi Firebase
    onAuthStateChanged(auth, (user) => {
        window.adminUser = user;

        const emailEl = document.getElementById("admin-email");

        if (emailEl) {
            emailEl.textContent = user?.email || "Belum login Firebase";
        }
    });