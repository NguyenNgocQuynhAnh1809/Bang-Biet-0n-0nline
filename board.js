import { listenGratitudes, EMOTIONS } from "./firebase.js";
import {
  addComment,
  listenComments,
  addReaction,
  listenReactions,
  removeReaction,
} from "./firebase.js";
import { REACTION_EMOJIS } from "./emoji-config.js";

const gridEl = document.getElementById("grid");
const legendEl = document.getElementById("legend");
const barEl = document.getElementById("bar");
const totalEl = document.getElementById("total");

// Modal elements
const modal = document.getElementById("noteModal");
const modalCardContent = document.getElementById("modalCardContent");
const emojiButtons = document.getElementById("emojiButtons");
const commentsList = document.getElementById("commentsList");
const commentsCount = document.getElementById("commentsCount");
const modalOverlay = document.querySelector(".modal-overlay");

let currentNoteId = null;
let currentUserReactions = {};
let currentNote = null;

const orderKeys = ["notgreat", "okay", "good", "great"];

// Render legend và bar (giữ nguyên)
function renderLegend(stats) {
  legendEl.innerHTML = "";
  for (const key of orderKeys) {
    const emo = EMOTIONS[key];
    const count = stats[key] || 0;
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `<span class="dot" style="background:${emo.color}"></span>${emo.label}: <strong>${count}</strong>`;
    legendEl.appendChild(chip);
  }
}

function renderBar(stats, total) {
  barEl.innerHTML = "";
  for (const key of orderKeys) {
    const emo = EMOTIONS[key];
    const count = stats[key] || 0;
    const pct = total ? (count / total) * 100 : 0;
    const seg = document.createElement("div");
    seg.className = "seg";
    seg.style.cssText = `width:${pct}%; background:${emo.color}`;
    seg.title = `${emo.label} ${Math.round(pct)}% (${count})`;
    barEl.appendChild(seg);
  }
  totalEl.textContent = `Tổng: ${total} mục`;
}

function timeAgo(ts) {
  const t = typeof ts === "number" ? ts : +ts;
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return `${s}s trước`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}p trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}g trước`;
  const d = Math.floor(h / 24);
  return `${d} ngày trước`;
}

// Render grid
function renderGrid(items) {
  gridEl.innerHTML = "";
  for (const it of items) {
    const div = document.createElement("article");
    div.className = "note";
    if (it.emotionKey) div.classList.add("emo-" + it.emotionKey);

    const watermarkHtml =
      it.emotionKey && EMOTIONS[it.emotionKey] && EMOTIONS[it.emotionKey].img
        ? `<div class="mascot-watermark"><img src="${EMOTIONS[it.emotionKey].img}" alt="" loading="lazy" /></div>`
        : "";

    div.innerHTML = `
      ${watermarkHtml}
      <div class="text">${it.text || ""}</div>
      <div class="meta">
        ${
          it.emotionLabel
            ? `<span class="badge"><span style="color:${it.color}">●</span> ${it.emotionLabel}</span>`
            : ""
        }
        <span>• ${timeAgo(it.createdAt)}</span>
      </div>
    `;

    // Click vào thẻ để mở modal
    div.addEventListener("click", () => openModal(it));
    
    gridEl.appendChild(div);
  }
}

// Mở modal với thông tin thẻ
function openModal(note) {
  currentNoteId = note.id;
  currentNote = note;
  
  // Render nội dung thẻ chính
  const modalMain = document.querySelector(".modal-main-card");
  modalMain.className = "modal-main-card";
  if (note.emotionKey) {
    modalMain.classList.add("emo-" + note.emotionKey);
  }

  // Tạo watermark lớn phía sau
  const emotion = EMOTIONS[note.emotionKey];
  const watermarkHtml = emotion && emotion.img
    ? `<div class="modal-mascot-bg"><img src="${emotion.img}" alt="" /></div>`
    : "";

  const badgeHtml = emotion
    ? `<div class="modal-emotion-badge" style="background: ${emotion.color}; color: white;">
         ${emotion.label}
       </div>`
    : "";

  modalCardContent.innerHTML = `
    ${watermarkHtml}
    ${badgeHtml}
    <div style="position: relative; z-index: 1;">${note.text || ""}</div>
  `;

  // Render emoji reactions
  renderEmojiButtons();

  // Listen comments
  listenComments(note.id, renderComments);

  // Listen reactions
  listenReactions(note.id, (reactions) => {
    updateEmojiCounts(reactions);
  });

  // Hiện modal
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

// Render emoji buttons
function renderEmojiButtons() {
  emojiButtons.innerHTML = "";
  
  REACTION_EMOJIS.forEach((emoji) => {
    const btn = document.createElement("button");
    btn.className = "emoji-btn";
    btn.dataset.emojiId = emoji.id;
    
    btn.innerHTML = `
      <img src="${emoji.image}" alt="${emoji.name}" />
      <span class="emoji-count" style="display: none;">0</span>
    `;

    btn.addEventListener("click", () => handleEmojiClick(emoji));
    
    emojiButtons.appendChild(btn);
  });
}

// Xử lý click emoji
async function handleEmojiClick(emoji) {
  if (!currentNoteId) return;

  const userReaction = currentUserReactions[currentNoteId];
  
  if (userReaction === emoji.id) {
    // Bỏ reaction
    await removeReaction(currentNoteId, emoji.id);
    delete currentUserReactions[currentNoteId];
  } else {
    // Thêm hoặc thay đổi reaction
    if (userReaction) {
      await removeReaction(currentNoteId, userReaction);
    }
    await addReaction(currentNoteId, emoji.id);
    currentUserReactions[currentNoteId] = emoji.id;
  }
}

// Update emoji counts
function updateEmojiCounts(reactions) {
  const counts = {};
  reactions.forEach((r) => {
    counts[r.emojiId] = (counts[r.emojiId] || 0) + 1;
  });

  REACTION_EMOJIS.forEach((emoji) => {
    const btn = emojiButtons.querySelector(`[data-emoji-id="${emoji.id}"]`);
    if (btn) {
      const countEl = btn.querySelector(".emoji-count");
      const count = counts[emoji.id] || 0;
      
      if (count > 0) {
        countEl.textContent = count;
        countEl.style.display = "block";
      } else {
        countEl.style.display = "none";
      }

      // Highlight nếu user đã react
      const userReaction = currentUserReactions[currentNoteId];
      btn.classList.toggle("active", userReaction === emoji.id);
    }
  });
}

// Render comments
function renderComments(comments) {
  if (!comments || comments.length === 0) {
    commentsList.innerHTML = '<div class="no-comments">Chưa có bình luận nào</div>';
    commentsCount.textContent = "0 bình luận";
    return;
  }

  commentsCount.textContent = `${comments.length} bình luận`;
  
  commentsList.innerHTML = "";
  comments.forEach((comment) => {
    const emoji = REACTION_EMOJIS.find((e) => e.id === comment.emojiId);
    
    const div = document.createElement("div");
    div.className = "comment-item";
    div.innerHTML = `
      <div class="comment-emoji">
        <img src="${emoji ? emoji.image : "./emoji1.png"}" alt="" />
      </div>
      <div class="comment-content">
        <div class="comment-text">${comment.text || ""}</div>
      </div>
    `;
    
    commentsList.appendChild(div);
  });
}

// Đóng modal
function closeModal() {
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  currentNoteId = null;
  currentNote = null;
}

// Event listeners
modalOverlay.addEventListener("click", closeModal);

// Listen gratitudes
listenGratitudes((items) => {
  const stats = {};
  for (const k of orderKeys) stats[k] = 0;
  for (const it of items) {
    if (it.emotionKey && stats[it.emotionKey] !== undefined) {
      stats[it.emotionKey]++;
    }
  }
  renderLegend(stats);
  renderBar(stats, items.length);
  renderGrid(items);
  gridEl.setAttribute("aria-busy", "false");
});
