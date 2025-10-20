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
const modalText = document.getElementById("modalText");
const modalMeta = document.getElementById("modalMeta");
const emojiButtons = document.getElementById("emojiButtons");
const commentsList = document.getElementById("commentsList");
const commentInput = document.getElementById("commentInput");
const submitCommentBtn = document.getElementById("submitComment");
const closeModalBtn = document.querySelector(".close-modal");
const modalOverlay = document.querySelector(".modal-overlay");

let currentNoteId = null;
let currentUserReactions = {}; // Track user's reaction per note

const orderKeys = ["notgreat", "okay", "good", "great"];

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

function renderGrid(items) {
  gridEl.innerHTML = "";
  for (const it of items) {
    const div = document.createElement("article");
    div.className = "note";
    if (it.emotionKey) div.classList.add("emo-" + it.emotionKey);

    const watermarkHtml =
      it.emotionKey && EMOTIONS[it.emotionKey] && EMOTIONS[it.emotionKey].img
        ? `<div class="mascot-watermark"><img src="${
            EMOTIONS[it.emotionKey].img
          }" alt="" loading="lazy" /></div>`
        : "";

    div.innerHTML = `
      ${watermarkHtml}
      <div class="text"></div>
      <div class="meta">
        <span class="badge">
          <span style="width:8px;height:8px;border-radius:50%;background:${
            it.color || "#eee"
          };display:inline-block"></span>
          ${it.emotionLabel || ""}
        </span>
        <span aria-hidden="true">•</span>
        <span>${timeAgo(it.createdAt || Date.now())}</span>
      </div>
    `;
    div.querySelector(".text").textContent = it.text;
    div.style.color = "var(--ink)";
    
    // Click to open modal
    div.addEventListener("click", () => openModal(it));
    
    gridEl.appendChild(div);
  }
  gridEl.setAttribute("aria-busy", "false");
}

// Open modal
function openModal(note) {
  currentNoteId = note.id;
  
  modalText.textContent = note.text;
  modalMeta.innerHTML = `
    <span style="width:8px;height:8px;border-radius:50%;background:${
      note.color || "#eee"
    };display:inline-block;margin-right:6px;"></span>
    ${note.emotionLabel || ""} • ${timeAgo(note.createdAt || Date.now())}
  `;
  
  renderEmojiButtons();
  loadReactions(note.id);
  loadComments(note.id);
  
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

// Close modal
function closeModal() {
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  currentNoteId = null;
  commentInput.value = "";
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
      <span class="count">0</span>
    `;
    btn.addEventListener("click", () => handleEmojiClick(emoji.id));
    emojiButtons.appendChild(btn);
  });
}

// Handle emoji click
async function handleEmojiClick(emojiId) {
  if (!currentNoteId) return;
  
  const clientId = getClientId();
  const currentReaction = currentUserReactions[currentNoteId];
  
  try {
    if (currentReaction === emojiId) {
      // Remove reaction
      await removeReaction(currentNoteId, clientId, emojiId);
      delete currentUserReactions[currentNoteId];
    } else {
      // Remove old reaction if exists
      if (currentReaction) {
        await removeReaction(currentNoteId, clientId, currentReaction);
      }
      // Add new reaction
      await addReaction(currentNoteId, clientId, emojiId);
      currentUserReactions[currentNoteId] = emojiId;
    }
  } catch (error) {
    console.error("Error handling reaction:", error);
  }
}

// Load reactions
function loadReactions(noteId) {
  listenReactions(noteId, (reactions) => {
    const buttons = emojiButtons.querySelectorAll(".emoji-btn");
    const clientId = getClientId();
    
    buttons.forEach((btn) => {
      const emojiId = btn.dataset.emojiId;
      const count = reactions[emojiId] || 0;
      btn.querySelector(".count").textContent = count;
      
      const userReacted = currentUserReactions[noteId] === emojiId;
      btn.classList.toggle("active", userReacted);
    });
  });
}

// Load comments
function loadComments(noteId) {
  listenComments(noteId, (comments) => {
    commentsList.innerHTML = "";
    
    if (comments.length === 0) {
      commentsList.innerHTML = '<p class="no-comments">Chưa có bình luận</p>';
      return;
    }
    
    comments.forEach((comment) => {
      const div = document.createElement("div");
      div.className = "comment";
      div.innerHTML = `
        <div class="comment-header">
          <span class="author">Ẩn danh</span>
          <span class="time">${timeAgo(comment.createdAt)}</span>
        </div>
        <div class="comment-text">${escapeHtml(comment.text)}</div>
      `;
      commentsList.appendChild(div);
    });
  });
}

// Submit comment
submitCommentBtn.addEventListener("click", async () => {
  const text = commentInput.value.trim();
  if (!text || !currentNoteId) return;
  
  submitCommentBtn.disabled = true;
  try {
    await addComment(currentNoteId, text);
    commentInput.value = "";
  } catch (error) {
    alert("Lỗi: " + error.message);
  } finally {
    submitCommentBtn.disabled = false;
  }
});

// Get client ID
function getClientId() {
  let id = localStorage.getItem("gratitude_client_id");
  if (!id) {
    id = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("gratitude_client_id", id);
  }
  return id;
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Close modal handlers
closeModalBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", closeModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
    closeModal();
  }
});

// Main listener
listenGratitudes((items) => {
  const stats = { notgreat: 0, okay: 0, good: 0, great: 0 };
  for (const it of items) {
    if (stats[it.emotionKey] !== undefined) stats[it.emotionKey]++;
  }
  renderLegend(stats);
  renderBar(stats, items.length);
  renderGrid(items);
});

document.querySelectorAll('a[aria-label="Facebook cá nhân"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const href = a.getAttribute("href");
    if (href) {
      setTimeout(() => {
        try {
          window.open(href, "_blank", "noopener");
        } catch {}
      }, 10);
    }
  });
});
