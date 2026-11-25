// Shared Firestore CRUD and realtime helpers.
// Import this module from both admin and public pages.
import { db } from "./firebase-core.js";
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, where, orderBy, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

export const COLLECTIONS = {
  packages: "paket_wisata",
  destinations: "destinasi",
  gallery: "galeri",
  potentials: "potensi_wisata",
  content: "konten_website",
  contact: "config_kontak",
  bookings: "booking",
  users: "users",
  messages: "pesan_masuk",
  adminProfiles: "admin_profiles"
};

export async function listDocuments(collectionName, options = {}) {
  const ref = collection(db, collectionName);
  const constraints = [];
  if (options.publishedOnly) constraints.push(where("published", "==", true));
  if (options.orderBy) constraints.push(orderBy(options.orderBy, options.direction || "asc"));
  const snap = await getDocs(constraints.length ? query(ref, ...constraints) : ref);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getDocument(collectionName, id) {
  const snap = await getDoc(doc(db, collectionName, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createDocument(collectionName, data) {
  return addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function saveDocument(collectionName, id, data) {
  return setDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function updateDocument(collectionName, id, data) {
  return updateDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function removeDocument(collectionName, id) {
  return deleteDoc(doc(db, collectionName, id));
}

export function subscribeDocuments(collectionName, callback, options = {}, onError = console.error) {
  const ref = collection(db, collectionName);
  const constraints = [];
  if (options.publishedOnly) constraints.push(where("published", "==", true));
  if (options.orderBy) constraints.push(orderBy(options.orderBy, options.direction || "asc"));
  const q = constraints.length ? query(ref, ...constraints) : ref;
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onError);
}

export function subscribeDocument(collectionName, id, callback, onError = console.error) {
  return onSnapshot(doc(db, collectionName, id), snap => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  }, onError);
}

