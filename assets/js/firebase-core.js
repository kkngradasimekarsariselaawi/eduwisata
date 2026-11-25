import { initializeApp } from 
"https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import { getFirestore } from 
"https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { getAuth } from 
"https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };