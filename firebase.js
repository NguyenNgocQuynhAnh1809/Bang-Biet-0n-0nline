// Firebase v10 modular qua CDN, bật cache offline để mượt
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js';
import {
  getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, setDoc, getDoc, serverTimestamp,
  onSnapshot, query, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

import { firebaseConfig } from './firebase-config.js';

// Khởi tạo Firestore với cache bền (IndexedDB)
const app = initializeApp(firebaseConfig);
initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  ignoreUndefinedProperties: true
});
const db = getFirestore(app);

// Cảm xúc
export const EMOTIONS = {
  bad:      { label:'Bad',       icon:'😠', color:'var(--bad)', score:1 },
  notgreat: { label:'Not Great', icon:'😕', color:'var(--notgreat)', score:2 },
  okay:     { label:'Okay',      icon:'😐', color:'var(--okay)', score:3 },
  good:     { label:'Good',      icon:'🙂', color:'var(--good)', score:4 },
  great:    { label:'Great',     icon:'😄', color:'var(--great)', score:5 },
};

// Tạo khoá ngày theo múi giờ VN
export function getDateKey(tz='Asia/Ho_Chi_Minh'){
  const d = new Date();
  const y = new Intl.DateTimeFormat('en-CA',{ timeZone: tz, year:'numeric'}).format(d);
  const m = new Intl.DateTimeFormat('en-CA',{ timeZone: tz, month:'2-digit'}).format(d);
  const day = new Intl.DateTimeFormat('en-CA',{ timeZone: tz, day:'2-digit'}).format(d);
  return `${y}-${m}-${day}`;
}

export async function hasSubmittedToday(clientId, dateKey=getDateKey()) {
  const id = `${clientId}_${dateKey}`;
  const snap = await getDoc(doc(db, 'gratitudes', id));
  return snap.exists();
}

// Ghi dữ liệu: 1/ngày theo docId cố định
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
  await setDoc(doc(db, 'gratitudes', docId), payload);
  return docId;
}

// Lắng nghe realtime (mới nhất)
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