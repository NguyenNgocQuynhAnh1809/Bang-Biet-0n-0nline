// Firebase v10 modular via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Chỉ còn 4 cảm xúc, dùng ảnh PNG bạn cung cấp
export const EMOTIONS = {
  notgreat: {
    label: "Not Great",
    img: "./notgreat.png",
    color: "var(--notgreat)",
    score: 1,
  },
  okay: { label: "Okay", img: "./okay.png", color: "var(--okay)", score: 2 },
  good: { label: "Good", img: "./good.png", color: "var(--good)", score: 3 },
  great: {
    label: "Great",
    img: "./great.png",
    color: "var(--great)",
    score: 4,
  },
};

// Vietnam local date key (YYYY-MM-DD) for daily limit
export function getDateKey(tz = "Asia/Ho_Chi_Minh") {
  const d = new Date();
  const y = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
  }).format(d);
  const m = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    month: "2-digit",
  }).format(d);
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    day: "2-digit",
  }).format(d);
  return `${y}-${m}-${day}`;
}

export async function hasSubmittedToday(clientId, dateKey = getDateKey()) {
  const docId = `${clientId}_${dateKey}`;
  const ref = doc(db, "gratitudes", docId);
  const snap = await getDoc(ref);
  return snap.exists();
}

export async function addGratitude({
  text,
  emotionKey,
  emotionLabel,
  color,
  moodScore,
  clientId,
  dateKey,
}) {
  const clean = text.replace(/\s+/g, " ").trim().slice(0, 240);
  if (!clean) throw new Error("Empty text");

  const payload = {
    text: clean,
    emotionKey,
    emotionLabel,
    color,
    moodScore,
    createdAt: serverTimestamp(),
    clientId: String(clientId || ""),
    dateKey: String(dateKey || getDateKey()),
  };

  const docId = `${payload.clientId}_${payload.dateKey}`;
  await setDoc(doc(db, "gratitudes", docId), payload);
  return docId;
}

export function listenGratitudes(callback) {
  const qy = query(
    collection(db, "gratitudes"),
    orderBy("createdAt", "desc"),
    limit(300)
  );
  return onSnapshot(qy, (snap) => {
    const items = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        text: data.text || "",
        emotionKey: data.emotionKey || "",
        emotionLabel: data.emotionLabel || "",
        color: data.color || "",
        createdAt: data.createdAt?.toMillis
          ? data.createdAt.toMillis()
          : Date.now(),
      };
    });
    callback(items);
  });
}

// Add comment
export async function addComment(noteId, text) {
  const clean = text.trim().slice(0, 500);
  if (!clean) throw new Error("Empty comment");

  const commentsRef = collection(db, "gratitudes", noteId, "comments");
  const newDoc = doc(commentsRef);
  
  await setDoc(newDoc, {
    text: clean,
    createdAt: serverTimestamp(),
  });
  
  return newDoc.id;
}

// Listen comments
export function listenComments(noteId, callback) {
  const commentsRef = collection(db, "gratitudes", noteId, "comments");
  const q = query(commentsRef, orderBy("createdAt", "asc"));
  
  return onSnapshot(q, (snap) => {
    const comments = snap.docs.map((d) => ({
      id: d.id,
      text: d.data().text || "",
      createdAt: d.data().createdAt?.toMillis?.() || Date.now(),
    }));
    callback(comments);
  });
}

// Add reaction
export async function addReaction(noteId, clientId, emojiId) {
  const reactionRef = doc(db, "gratitudes", noteId, "reactions", clientId);
  await setDoc(reactionRef, {
    emojiId,
    createdAt: serverTimestamp(),
  });
}

// Remove reaction
export async function removeReaction(noteId, clientId) {
  const reactionRef = doc(db, "gratitudes", noteId, "reactions", clientId);
  await setDoc(reactionRef, {
    emojiId: null,
    removedAt: serverTimestamp(),
  });
}

// Listen reactions
export function listenReactions(noteId, callback) {
  const reactionsRef = collection(db, "gratitudes", noteId, "reactions");
  
  return onSnapshot(reactionsRef, (snap) => {
    const counts = {};
    snap.docs.forEach((d) => {
      const emojiId = d.data().emojiId;
      if (emojiId) {
        counts[emojiId] = (counts[emojiId] || 0) + 1;
      }
    });
    callback(counts);
  });
}
