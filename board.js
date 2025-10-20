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
const reactionIconsContainer = document.querySelector('.reaction-icons');
const reactionSummaryEl = document.getElementById('reaction-summary');

const orderKeys = ["notgreat", "okay", "good", "great"];
let currentItem = null;

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
    div.dataset.id = it.id; 
    
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
    gridEl.appendChild(div);
  }
  gridEl.setAttribute("aria-busy", "false");
}

function renderComments(item) {
  const comments = item.comments || [];
  const mascotImg = EMOTIONS[item.emotionKey]?.img;

  commentListEl.innerHTML = "";
  comments.forEach(comment => {
    const commentItem = document.createElement("div");
    commentItem.className = "comment-item";
    
    let reactionHTML = '';
    if(comment.reaction) {
        reactionHTML = `<div class="comment-reaction"><img src="${comment.reaction}.png" alt="reaction ${comment.reaction}"></div>`;
    }

    commentItem.innerHTML = `
      <div class="comment-avatar">
        <img src="${mascotImg || 'default-avatar.png'}" alt="" />
      </div>
      <div class="comment-content-wrapper">
        <div class="comment-content">${comment.text}</div>
        ${reactionHTML}
      </div>
    `;
    commentListEl.appendChild(commentItem);
  });
  commentCountEl.textContent = `${comments.length} bình luận`;
}

function renderReactionSummary(item) {
    const reactions = item.reactions || {};
    const reactionCounts = Object.values(reactions).reduce((acc, reactionType) => {
        acc[reactionType] = (acc[reactionType] || 0) + 1;
        return acc;
    }, {});

    const sortedReactions = Object.keys(reactionCounts).sort((a, b) => reactionCounts[b] - reactionCounts[a]);
    const totalReactions = Object.keys(reactions).length;

    if (totalReactions === 0) {
        reactionSummaryEl.innerHTML = '';
        return;
    }

    let summaryHTML = '';
    sortedReactions.slice(0, 3).forEach(type => {
        summaryHTML += `<img src="${type}.png" alt="reaction ${type}">`;
    });
    
    summaryHTML += `<span class="reaction-total-count">${totalReactions}</span>`;

    let tooltipHTML = '<div class="reaction-tooltip">';
    Object.entries(reactionCounts).forEach(([type, count]) => {
        tooltipHTML += `<div class="tooltip-item"><img src="${type}.png" alt="reaction ${type}"><span>${count}</span></div>`;
    });
    tooltipHTML += '</div>';

    reactionSummaryEl.innerHTML = summaryHTML + tooltipHTML;
}


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
  
  renderComments(item);
  renderReactionSummary(item);

  commentModalEl.style.display = 'flex';
  setTimeout(() => commentModalEl.classList.add('show'), 10);
}

function closeCommentModal() {
  commentModalEl.classList.remove('show');
  setTimeout(() => {
    commentModalEl.style.display = 'none';
    commentInputEl.value = '';
    currentItem = null;
  }, 300);
}

async function handleAddComment(reactionType = null) {
    const commentText = commentInputEl.value.trim();
    if ((commentText === '' && !reactionType) || !currentItem) return;

    const newComment = {
        text: commentText,
        // Using a simple timestamp as a unique ID for the comment for now
        id: Date.now(), 
    };

    if (reactionType) {
        newComment.reaction = reactionType;
    }

    const newComments = currentItem.comments ? [...currentItem.comments, newComment] : [newComment];
    
    try {
        await updateGratitude(currentItem.id, { comments: newComments });
        currentItem.comments = newComments;
        renderComments(currentItem);
        commentInputEl.value = '';
    } catch (error) {
        console.error("Lỗi khi thêm bình luận:", error);
        alert("Không thể thêm bình luận. Vui lòng thử lại.");
    }
}

async function handleAddReaction(reactionType) {
    if (!currentItem) return;

    // For simplicity, we'll use a unique ID for the user. In a real app, this would be the logged-in user's ID.
    const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
    const newReactions = { ...(currentItem.reactions || {}) };
    newReactions[userId] = reactionType; // Each user can only have one reaction

    try {
        await updateGratitude(currentItem.id, { reactions: newReactions });
        currentItem.reactions = newReactions;
        renderReactionSummary(currentItem);
    } catch (error) {
        console.error("Lỗi khi thả reaction:", error);
        alert("Không thể thả reaction. Vui lòng thử lại.");
    }
}

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
  if (e.target === commentModalEl) {
    closeCommentModal();
  }
});

commentInputEl.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleAddComment();
  }
});

reactionIconsContainer.addEventListener('click', (e) => {
    const reactionButton = e.target.closest('.react-icon');
    if (reactionButton) {
        const reactionType = reactionButton.dataset.reaction;
        if (commentInputEl.value.trim() !== '') {
            // If there is text, post a comment with a reaction
            handleAddComment(reactionType);
        } else {
            // If there is no text, just add a reaction to the post
            handleAddReaction(reactionType);
        }
    }
});

listenGratitudes((items) => {
  window.gratitudeItems = items;

  const stats = { notgreat: 0, okay: 0, good: 0, great: 0 };
  items.forEach(it => {
    if (it && it.emotionKey && stats.hasOwnProperty(it.emotionKey)) {
      stats[it.emotionKey]++;
    }
  });

  renderLegend(stats);
  renderBar(stats, items.length);
  renderGrid(items);

  if (currentItem) {
      const updatedItem = items.find(it => it && it.id === currentItem.id);
      if (updatedItem) {
          currentItem = updatedItem;
          renderComments(updatedItem);
          renderReactionSummary(updatedItem);
      } else {
          closeCommentModal();
      }
  }
});
