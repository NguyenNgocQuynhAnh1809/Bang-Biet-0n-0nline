import { addGratitude, EMOTIONS, hasSubmittedToday, getDateKey } from './firebase.js';

const moodListEl = document.getElementById('moodList');
const submitBtn = document.getElementById('submitBtn');
const textEl = document.getElementById('gratitude');

let chosenKey = null;

// Build mood buttons
for (const key of Object.keys(EMOTIONS)) {
  const m = EMOTIONS[key];
  const btn = document.createElement('button');
  btn.className = 'mood-btn';
  btn.dataset.key = key;
  btn.type = 'button';
  btn.innerHTML = `<div class="face">${m.icon}</div><div class="label">${m.label}</div>`;
  btn.addEventListener('click', () => {
    chosenKey = key;
    for (const b of moodListEl.querySelectorAll('.mood-btn')) b.classList.toggle('active', b === btn);
    updateSubmitState();
  });
  moodListEl.appendChild(btn);
}

textEl.addEventListener('input', updateSubmitState);

function updateSubmitState() {
  const valid = (textEl.value.trim().length > 0) && !!chosenKey;
  submitBtn.disabled = !valid;
}

// Anonymous client id (local)
function getClientId() {
  const key = 'gratitude_client_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID?.() || String(Math.random()).slice(2);
    localStorage.setItem(key, id);
  }
  return id;
}

submitBtn.addEventListener('click', async () => {
  const text = textEl.value.trim();
  if (!text || !chosenKey) return;

  const clientId = getClientId();
  const dateKey = getDateKey(); // Asia/Ho_Chi_Minh

  submitBtn.disabled = true;
  submitBtn.textContent = 'Đang gửi...';

  try {
    // Limit: 1 submission per day
    const already = await hasSubmittedToday(clientId, dateKey);
    if (already) {
      alert('Bạn đã gửi lời biết ơn hôm nay rồi. Hẹn bạn ngày mai nhé!');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Gửi và xem bảng';
      return;
    }

    const m = EMOTIONS[chosenKey];
    await addGratitude({
      text,
      emotionKey: chosenKey,
      emotionLabel: m.label,
      color: m.color,
      moodScore: m.score,
      clientId,
      dateKey
    });
    window.location.href = './board.html';
  } catch (e) {
    console.error(e);
    const errorMsg = e.code ? `Gửi thất bại (${e.code}). Vui lòng thử lại.` : 'Gửi thất bại. Vui lòng thử lại.';
    alert(errorMsg);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Gửi và xem bảng';
  }
});

// Share
document.getElementById('shareBtn')?.addEventListener('click', async () => {
  const url = location.origin + location.pathname.replace(/index\.html?$/, '');
  try {
    if (navigator.share) await navigator.share({ title: 'Bảng biết ơn', text: 'Gửi lời biết ơn hôm nay 🧡', url });
    else await navigator.clipboard.writeText(url), alert('Đã sao chép liên kết.');
  } catch {}
});