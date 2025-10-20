import { listenGratitudes, EMOTIONS, updateGratitude } from "./firebase.js";

const gridEl = document.getElementById("grid");
const legendEl = document.getElementById("legend");
const barEl = document.getElementById("bar");
const totalEl = document.getElementById("total");

const commentModalEl = document.getElementById("comment-modal");
const closeModalBtn = document.querySelector(".close-comment-modal");
const modalCardDetailEl = document.getElementById("modal-card-detail");
const commentListEl = document.getElementById("comment-list");
const commentCountEl = document.getElementById("comment-count");
const commentInputEl = document.getElementById("comment-input");
const reactionBtns = document.querySelectorAll(".react-btn");
const reactionSummaryEl = document.getElementById("reaction-summary");

const orderKeys = ["notgreat", "okay", "good", "great"];

let currentItem = null;
let selectedReaction = null;

// --- RENDER FUNCTIONS ---

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
  items.forEach(it => {
    const div = document.createElement("article");
    div.className = "note";
    div.dataset.id = it.id;
    if (it.emotionKey) div.classList.add("emo-" + it.emotionKey);

    const watermarkHtml = it.emotionKey && EMOTIONS[it.emotionKey]?.img
        ? `<div class="mascot-watermark"><img src="${EMOTIONS[it.emotionKey].img}" alt="" loading="lazy" /></div>`
        : "";

    div.innerHTML = `
      ${watermarkHtml}
      <div class="text"></div>
      <div class="meta">
        <span class="badge">
          <span style="width:8px;height:8px;border-radius:50%;background:${it.color || "#eee"};display:inline-block"></span>
          ${it.emotionLabel || ""}
        </span>
        <span aria-hidden="true">•</span>
        <span>${timeAgo(it.createdAt || Date.now())}</span>
      </div>
    `;
    div.querySelector(".text").textContent = it.text;
    gridEl.appendChild(div);
  });
  gridEl.setAttribute("aria-busy", "false");
}

function renderCommentsAndReactions(item) {
    const comments = item.comments || [];
    const mascotImg = EMOTIONS[item.emotionKey]?.img;
    const reactionCounts = {};

    commentListEl.innerHTML = "";
    comments.forEach(comment => {
        const commentItem = document.createElement("div");
        commentItem.className = "comment-item";
        
        // THAY ĐỔI: Không hiển thị reaction riêng lẻ bên cạnh bình luận nữa
        commentItem.innerHTML = `
            <div class="comment-avatar"><img src="${mascotImg}" alt="" /></div>
            <div class="comment-content-wrapper">
                <div class="comment-content">${comment.text}</div>
            </div>
        `;
        commentListEl.appendChild(commentItem);

        if (comment.reaction) {
            reactionCounts[comment.reaction] = (reactionCounts[comment.reaction] || 0) + 1;
        }
    });

    // SỬA ĐỔI: Giữ nguyên logic hiển thị tóm tắt reaction ở dưới
    reactionSummaryEl.innerHTML = '';
    const sortedReactions = Object.keys(reactionCounts).sort((a,b) => reactionCounts[b] - reactionCounts[a]);
    
    let totalReactionCount = 0;
    sortedReactions.forEach(reactionId => {
        const count = reactionCounts[reactionId];
        totalReactionCount += count;
        if (count > 0) {
            const reactionCountEl = document.createElement('div');
            reactionCountEl.className = 'reaction-count-item';
            reactionCountEl.setAttribute('data-tooltip', count); 
            reactionCountEl.innerHTML = `<img src="${reactionId}.png" alt="">`;
            reactionSummaryEl.appendChild(reactionCountEl);
        }
    });

    if (totalReactionCount > 0) {
        const totalCountEl = document.createElement('span');
        totalCountEl.className = 'summary-count';
        totalCountEl.textContent = totalReactionCount;
        reactionSummaryEl.appendChild(totalCountEl);
    }

    commentCountEl.textContent = `${comments.length} bình luận`;
}


// --- MODAL & EVENT HANDLERS ---

function openCommentModal(item) {
  currentItem = item;
  const emotionClass = item.emotionKey === 'notgreat' ? 'not-great' : item.emotionKey;
  const mascotImg = EMOTIONS[item.emotionKey]?.img;
  
  modalCardDetailEl.className = `gratitude-item-modal ${emotionClass}`;
  
  if (mascotImg) {
    modalCardDetailEl.style.setProperty('--modal-emoji-url', `url(${mascotImg})`);
    modalCardDetailEl.classList.add('has-emoji-image');
  } else {
    modalCardDetailEl.classList.remove('has-emoji-image');
  }

  modalCardDetailEl.innerHTML = `
    <div class="content"><p>${item.text}</p></div>
    <div class="footer">
      <span class="tag">
        <span class="dot" style="background-color: ${item.color || '#eee'}"></span>
        ${item.emotionLabel}
      </span>
      <span class="time">• ${timeAgo(item.createdAt || Date.now())}</span>
    </div>
  `;
  
  renderCommentsAndReactions(item);

  commentModalEl.style.display = 'flex';
  setTimeout(() => commentModalEl.classList.add('show'), 10);
}

function closeCommentModal() {
  commentModalEl.classList.remove('show');
  setTimeout(() => {
    commentModalEl.style.display = 'none';
    commentInputEl.value = '';
    currentItem = null;
    selectedReaction = null;
    reactionBtns.forEach(btn => btn.classList.remove('selected'));
  }, 300);
}

async function handleAddComment() {
    const commentText = commentInputEl.value.trim();
    if (commentText === '' || !currentItem) return;

    const newComment = {
        text: commentText,
        reaction: selectedReaction 
    };

    const newComments = currentItem.comments ? [...currentItem.comments, newComment] : [newComment];
    
    try {
        await updateGratitude(currentItem.id, { comments: newComments });
        currentItem.comments = newComments;
        renderCommentsAndReactions(currentItem);
        
        commentInputEl.value = '';
        selectedReaction = null;
        reactionBtns.forEach(btn => btn.classList.remove('selected'));

    } catch (error) {
        console.error("Lỗi khi thêm bình luận:", error);
        alert("Không thể thêm bình luận. Vui lòng thử lại.");
    }
}

// --- EVENT LISTENERS ---

gridEl.addEventListener('click', (e) => {
  const noteEl = e.target.closest('article.note');
  if (noteEl) {
    const itemId = noteEl.dataset.id;
    const allItems = window.gratitudeItems || [];
    const item = allItems.find(it => it.id === itemId);
    if (item) {
      openCommentModal(item);
    }
  }
});

closeModalBtn.addEventListener('click', closeCommentModal);
commentModalEl.addEventListener('click', (e) => {
  if (e.target === commentModalEl) closeCommentModal();
});

commentInputEl.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleAddComment();
});

reactionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const reactionId = btn.dataset.reaction;
        if (selectedReaction === reactionId) {
            selectedReaction = null;
            btn.classList.remove('selected');
        } else {
            selectedReaction = reactionId;
            reactionBtns.forEach(otherBtn => otherBtn.classList.remove('selected'));
            btn.classList.add('selected');
        }
    });
});

// --- FIREBASE LISTENER ---

listenGratitudes((items) => {
  window.gratitudeItems = items;

  const stats = { notgreat: 0, okay: 0, good: 0, great: 0 };
  items.forEach(it => {
    if (it?.emotionKey && stats.hasOwnProperty(it.emotionKey)) {
      stats[it.emotionKey]++;
    }
  });

  renderLegend(stats);
  renderBar(stats, items.length);
  renderGrid(items);

  if (currentItem) {
      const updatedItem = items.find(it => it?.id === currentItem.id);
      if (updatedItem) {
          currentItem = updatedItem;
          renderCommentsAndReactions(updatedItem);
      } else {
          closeCommentModal();
      }
  }
});
