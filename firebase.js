// Firebase v10 modular via CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js';
import {
  getFirestore, collection, doc, setDoc, getDoc,
  addDoc, serverTimestamp, onSnapshot, query, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

// Import user-provided config (create firebase-config.js from sample)
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Emotion model (one source of truth)
export const EMOTIONS = {
  bad:      { label:'Bad',       icon:'😠', color:'var(--bad)', score:1 },
  notgreat: { label:'Not Great', icon:'😕', color:'var(--notgreat)', score:2 },
  okay:     { label:'Okay',      icon:'😐', color:'var(--okay)', score:3 },
  good:     { label:'Good',      icon:'🙂', color:'var(--good)', score:4 },
  great:    { label:'Great',     icon:'😄', color:'var(--great)', score:5 },
};

// Vietnam local date key (YYYY-MM-DD) for daily limit
export function getDateKey(tz='Asia/Ho_Chi_Minh'){
  const d = new Date();
  const y = new Intl.DateTimeFormat('en-CA',{ timeZone: tz, year:'numeric'}).format(d);
  const m = new Intl.DateTimeFormat('en-CA',{ timeZone: tz, month:'2-digit'}).format(d);
  const day = new Intl.DateTimeFormat('en-CA',{ timeZone: tz, day:'2-digit'}).format(d);
  return `${y}-${m}-${day}`;
}

// Check if the client has submitted today
export async function hasSubmittedToday(clientId, dateKey=getDateKey()){
  const docId = `${clientId}_${dateKey}`;
  const ref = doc(db, 'gratitudes', docId);
  const snap = await getDoc(ref);
  return snap.exists();
}

// Write an entry (one per client/day)
// Uses deterministic docId so rules can enforce uniqueness
export async function addGratitude({ text, emotionKey, emotionLabel, color, moodScore, clientId, dateKey }) {
  const clean = text.replace(/\s+/g,' ').trim().slice(0, 240);
  if (!clean) throw new Error('Empty text');

  const payload = {
    text: clean,
    emotionKey, emotionLabel, color, moodScore,
    createdAt: serverTimestamp(),
    clientId: String(clientId || ''),
    dateKey: String(dateKey || getDateKey()),
  };

  const docId = `${payload.clientId}_${payload.dateKey}`;
  // setDoc on a non-existing path counts as "create" (rules allow), on existing path counts as "update" (rules deny).
  await setDoc(doc(db, 'gratitudes', docId), payload);
  return docId;
}

// Listen to latest entries (real-time)
export function listenGratitudes(callback){
  const qy = query(collection(db, 'gratitudes'), orderBy('createdAt','desc'), limit(300));
  return onSnapshot(qy, (snap) => {
    const items = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        text: data.text || '',
        emotionKey: data.emotionKey || '',
        emotionLabel: data.emotionLabel || '',
        color: data.color || '#eee',
        createdAt: (data.createdAt && data.createdAt.toMillis) ? data.createdAt.toMillis() : Date.now(),
      };
    });
    callback(items);
  });
}