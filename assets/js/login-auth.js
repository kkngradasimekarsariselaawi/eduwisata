// ============================================
// LOGIN ADMIN - FIREBASE AUTH
// LOGIN LIMIT + LOCK 1 JAM + RESET PASSWORD
// ============================================

import { auth } from "./firebase-core.js";

import {
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {

    // =========================================
    // DOM ELEMENTS
    // =========================================

    const loginForm = document.getElementById("adminLoginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const rememberCheckbox = document.getElementById("rememberMe");

    const alertBox = document.getElementById("alertBox");
    const alertIcon = document.getElementById("alertIcon");
    const alertTitle = document.getElementById("alertTitle");
    const alertMessage = document.getElementById("alertMessage");

    const submitBtn = document.getElementById("submitBtn");
    const btnIcon = document.getElementById("btnIcon");
    const btnSpinner = document.getElementById("btnSpinner");
    const btnText = document.getElementById("btnText");

    // Reset Password Elements
    const resetModal = document.getElementById("resetPasswordModal");
    const closeResetModalBtn = document.getElementById("closeResetPasswordModal");
    const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");

    const resetEmailInput = document.getElementById("resetEmail");
    const resetPasswordForm = document.getElementById("resetPasswordForm");
    const resetPasswordMessage = document.getElementById("resetPasswordAlert");

    const sendResetEmailBtn = document.getElementById("resetPasswordSubmit");
    const resetBtnText = document.getElementById("resetBtnText");
    const backToLoginBtn = document.getElementById("backToLoginBtn");

    // =========================================
    // KONFIGURASI LOCK LOGIN
    // =========================================

    const MAX_ATTEMPTS = 3;
    const LOCK_DURATION = 60 * 60 * 1000; // 1 jam

    let isLoading = false;
    let countdownInterval = null;

    // Key lock disimpan berdasarkan email
    function getLockKey(email) {
        return "ewbm_login_lock_" + email.toLowerCase().trim();
    }

    function getAttemptKey(email) {
        return "ewbm_login_attempt_" + email.toLowerCase().trim();
    }

    function getAttempts(email) {
        return Number(localStorage.getItem(getAttemptKey(email))) || 0;
    }

    function setAttempts(email, attempts) {
        localStorage.setItem(getAttemptKey(email), attempts);
    }

    function getLockUntil(email) {
        return Number(localStorage.getItem(getLockKey(email))) || 0;
    }

    function setLock(email, time) {
        localStorage.setItem(getLockKey(email), time);
    }

    function clearLoginAttempts(email) {
        localStorage.removeItem(getAttemptKey(email));
        localStorage.removeItem(getLockKey(email));
    }

    // =========================================
    // ALERT
    // =========================================

    function showAlert(type, title, message) {

        alertBox.classList.remove("hidden");

        alertBox.classList.remove(
            "bg-red-50",
            "text-red-800",
            "border-red-200",
            "bg-emerald-50",
            "text-emerald-900",
            "border-emerald-200"
        );

        if (type === "error") {

            alertBox.classList.add(
                "bg-red-50",
                "text-red-800",
                "border",
                "border-red-200"
            );

            alertIcon.setAttribute("data-lucide", "alert-circle");
            alertIcon.classList.add("text-red-600");
            alertIcon.classList.remove("text-emerald-600");

        } else {

            alertBox.classList.add(
                "bg-emerald-50",
                "text-emerald-900",
                "border",
                "border-emerald-200"
            );

            alertIcon.setAttribute("data-lucide", "check-circle-2");
            alertIcon.classList.add("text-emerald-600");
            alertIcon.classList.remove("text-red-600");
        }

        alertTitle.textContent = title;
        alertMessage.textContent = message;

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    function hideAlert() {
        alertBox.classList.add("hidden");
    }

    // =========================================
    // LOADING
    // =========================================

    function setLoading(loading) {

        isLoading = loading;

        usernameInput.disabled = loading;
        passwordInput.disabled = loading;

        if (loading) {

            submitBtn.disabled = true;
            btnIcon.classList.add("hidden");
            btnSpinner.classList.remove("hidden");
            btnText.textContent = "Memverifikasi Akses...";

        } else {

            btnIcon.classList.remove("hidden");
            btnSpinner.classList.add("hidden");
            btnText.textContent = "Masuk ke Dashboard";

            refreshLockState();
        }
    }

    // =========================================
    // FORMAT COUNTDOWN
    // =========================================

    function formatCountdown(ms) {

        const totalSeconds = Math.max(0, Math.ceil(ms / 1000));

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return [
            String(hours).padStart(2, "0"),
            String(minutes).padStart(2, "0"),
            String(seconds).padStart(2, "0")
        ].join(":");
    }

    // =========================================
    // CEK LOCK LOGIN
    // =========================================

    function refreshLockState() {

        if (isLoading) return;

        const email = usernameInput.value.trim().toLowerCase();

        if (!email || !email.includes("@")) {
            submitBtn.disabled = false;
            return;
        }

        const lockUntil = getLockUntil(email);
        const remaining = lockUntil - Date.now();

        if (remaining > 0) {

            submitBtn.disabled = true;

            showAlert(
                "error",
                "Login Dikunci",
                `Terlalu banyak percobaan login gagal. Silakan coba kembali dalam ${formatCountdown(remaining)}.`
            );

        } else {

            // Jika waktu lock sudah habis, reset percobaan
            if (lockUntil > 0) {
                clearLoginAttempts(email);
            }

            submitBtn.disabled = false;

            // Bersihkan alert lock
            if (alertTitle.textContent === "Login Dikunci") {
                hideAlert();
            }
        }
    }

    // Countdown berjalan setiap detik
    function startCountdown() {

        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        countdownInterval = setInterval(() => {
            refreshLockState();
        }, 1000);
    }

    // =========================================
    // TAMBAH PERCOBAAN GAGAL
    // =========================================

    function registerFailedAttempt(email) {

        let attempts = getAttempts(email);

        attempts++;

        setAttempts(email, attempts);

        if (attempts >= MAX_ATTEMPTS) {

            const lockUntil = Date.now() + LOCK_DURATION;

            setLock(email, lockUntil);

            showAlert(
                "error",
                "Login Dikunci",
                "3 kali percobaan login gagal. Akses login dikunci selama 1 jam."
            );

            refreshLockState();

        } else {

            const remainingAttempts = MAX_ATTEMPTS - attempts;

            showAlert(
                "error",
                "Login Gagal",
                `Email atau password salah. Sisa kesempatan login: ${remainingAttempts} kali.`
            );
        }
    }

    // =========================================
    // ERROR FIREBASE
    // =========================================

    function getErrorMessage(error) {

        switch (error.code) {

            case "auth/invalid-email":
                return "Format email tidak valid.";

            case "auth/user-not-found":
            case "auth/invalid-credential":
            case "auth/wrong-password":
                return "Email atau password yang dimasukkan salah.";

            case "auth/user-disabled":
                return "Akun admin ini telah dinonaktifkan.";

            case "auth/too-many-requests":
                return "Firebase mendeteksi terlalu banyak percobaan. Silakan tunggu sebelum mencoba kembali.";

            case "auth/network-request-failed":
                return "Koneksi internet bermasalah. Periksa koneksi lu.";

            case "auth/operation-not-allowed":
                return "Login Email/Password belum diaktifkan di Firebase.";

            default:
                return "Login gagal. Silakan coba kembali.";
        }
    }

    // =========================================
    // RESTORE EMAIL
    // =========================================

    const savedEmail = localStorage.getItem("ewbm_admin_user");

    if (savedEmail) {
        usernameInput.value = savedEmail;
        rememberCheckbox.checked = true;
    }

    usernameInput.addEventListener("input", () => {
        hideAlert();
        refreshLockState();
    });

    // Cek apakah email yang tersimpan sedang dikunci
    refreshLockState();
    startCountdown();

    // =========================================
    // LOGIN
    // =========================================

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        hideAlert();

        const email = usernameInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (!email || !password) {

            showAlert(
                "error",
                "Data belum lengkap",
                "Email dan password wajib diisi."
            );

            return;
        }

        if (!email.includes("@")) {

            showAlert(
                "error",
                "Format login tidak sesuai",
                "Gunakan alamat email admin, bukan username."
            );

            return;
        }

        // Periksa apakah email sedang dikunci
        const lockUntil = getLockUntil(email);

        if (lockUntil > Date.now()) {

            refreshLockState();
            return;
        }

        // Lock lama sudah kedaluwarsa
        if (lockUntil > 0) {
            clearLoginAttempts(email);
        }

        setLoading(true);

        try {

            // Atur persistensi login
            await setPersistence(
                auth,
                rememberCheckbox.checked
                    ? browserLocalPersistence
                    : browserSessionPersistence
            );

            // Login Firebase
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            // LOGIN BERHASIL: reset percobaan gagal
            clearLoginAttempts(email);

            // Simpan email jika checkbox aktif
            if (rememberCheckbox.checked) {
                localStorage.setItem("ewbm_admin_user", email);
            } else {
                localStorage.removeItem("ewbm_admin_user");
            }

            console.log("Login Firebase berhasil:", user.uid);

            showAlert(
                "success",
                "Login Berhasil",
                "Autentikasi berhasil. Mengalihkan ke dashboard..."
            );

            btnIcon.setAttribute("data-lucide", "check");
            btnIcon.classList.remove("hidden");
            btnSpinner.classList.add("hidden");
            btnText.textContent = "Berhasil Masuk!";

            if (window.lucide) {
                lucide.createIcons();
            }

            setTimeout(() => {
                window.location.href = "admin.html";
            }, 800);

        } catch (error) {

            console.error("Firebase Login Error:", error);

            setLoading(false);

            // Hanya kegagalan kredensial yang dihitung
            if (
                error.code === "auth/invalid-credential" ||
                error.code === "auth/wrong-password" ||
                error.code === "auth/user-not-found"
            ) {

                registerFailedAttempt(email);

            } else {

                showAlert(
                    "error",
                    "Login Gagal",
                    getErrorMessage(error)
                );
            }
        }
    });

    // =========================================
    // MODAL RESET PASSWORD
    // =========================================

    function openResetModal() {

        resetModal.classList.remove("hidden");
        resetModal.classList.add("flex");

        resetPasswordMessage.classList.add("hidden");

        // Otomatis isi email login jika ada
        resetEmailInput.value = usernameInput.value.trim();

        setTimeout(() => {
            resetEmailInput.focus();
        }, 100);
    }

    function closeResetModalDialog() {
        resetModal.classList.add("hidden");
        resetModal.classList.remove("flex");
    }

    forgotPasswordBtn.addEventListener("click", openResetModal);

    closeResetModalBtn.addEventListener(
        "click",
        closeResetModalDialog
    );
    backToLoginBtn.addEventListener("click", closeResetModalDialog);

    resetModal.addEventListener("click", (e) => {
        if (e.target === resetModal) {
            closeResetModalDialog();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (
            e.key === "Escape" &&
            !resetModal.classList.contains("hidden")
        ) {
            closeResetModalDialog();
        }
    });

    // =========================================
    // KIRIM EMAIL RESET PASSWORD
    // =========================================

    // =========================================
// KIRIM EMAIL RESET PASSWORD
// =========================================

resetPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = resetEmailInput.value.trim();

    resetPasswordMessage.classList.add("hidden");

    if (!email || !email.includes("@")) {
        resetPasswordMessage.textContent =
            "Masukkan alamat email yang valid.";

        resetPasswordMessage.className =
            "mt-4 p-3 rounded-xl text-sm bg-red-50 text-red-600";

        resetPasswordMessage.classList.remove("hidden");
        return;
    }

    sendResetEmailBtn.disabled = true;
    resetBtnText.textContent = "Mengirim Email...";

    try {
        await sendPasswordResetEmail(auth, email);

        resetPasswordMessage.textContent =
            "Jika email terdaftar, link reset password akan dikirim. Silakan periksa inbox atau folder spam.";

        resetPasswordMessage.className =
            "mt-4 p-3 rounded-xl text-sm bg-emerald-50 text-emerald-700";

        resetPasswordMessage.classList.remove("hidden");

    } catch (error) {
        console.error("Reset Password Error:", error);

        if (error.code === "auth/invalid-email") {
            resetPasswordMessage.textContent =
                "Format email tidak valid.";
        } else {
            resetPasswordMessage.textContent =
                "Gagal mengirim link reset. Periksa koneksi internet dan coba lagi.";
        }

        resetPasswordMessage.className =
            "mt-4 p-3 rounded-xl text-sm bg-red-50 text-red-600";

        resetPasswordMessage.classList.remove("hidden");

    } finally {
        sendResetEmailBtn.disabled = false;
        resetBtnText.textContent = "Kirim Link Reset";
    }
});

});