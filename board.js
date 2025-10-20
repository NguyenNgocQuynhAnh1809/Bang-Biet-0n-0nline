import { listenGratitudes, EMOTIONS, updateGratitude } from "./firebase.js"; // Giả sử có hàm updateGratitude

const gridEl = document.getElementById("grid");
const legendEl = document.getElementById("legend");
const barEl = document.getElementById("bar");
const totalEl = document.getElementById("total");

// BẮT ĐẦU: Lấy các phần tử HTML của Modal
const commentModalEl = document.getElementById("comment-modal");
const closeModalBtn = document.querySelector(".close-comment-modal");
const modalCardDetailEl = document.getElementById("modal-card-detail");
const commentListEl = document.getElementById("comment-list");
const commentCountEl = document.getElementById("comment-count");
const commentInputEl = document.getElementById("comment-input");
// KẾT THÚC: Lấy các phần tử HTML của Modal

// Chỉ còn 4 cảm xúc
const orderKeys = ["notgreat", "okay", "good", "great"];

// Biến để lưu trữ item hiện tại đang được xem trong modal
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
    // Thêm data-id để xác định item nào được click
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

// BẮT ĐẦU: Các hàm xử lý Modal
function renderComments(item) {
  const comments = item.comments || [];
  const mascotImg = EMOTIONS[item.emotionKey]?.img;

  commentListEl.innerHTML = "";
  comments.forEach(commentText => {
    const commentItem = document.createElement("div");
    commentItem.className = "comment-item";
    commentItem.innerHTML = `
      <div class="comment-avatar">
        <img src="${mascotImg}" alt="" style="width: 32px; height: 32px;" />
      </div>
      <div class="comment-content">${commentText}</div>
    `;
    commentListEl.appendChild(commentItem);
  });
  commentCountEl.textContent = `${comments.length} bình luận`;
}

function openCommentModal(item) {
  currentItem = item;
  const emotionClass = `emo-${item.emotionKey}`;
  const mascotImg = EMOTIONS[item.emotionKey]?.img;
  
  modalCardDetailEl.className = `gratitude-item-modal ${emotionClass}`;
  modalCardDetailEl.dataset.emoji = mascotImg ? '' : '❓'; // Nếu không có ảnh, dùng emoji
  if (mascotImg) {
    modalCardDetailEl.style.setProperty('--modal-emoji-url', `url(${mascotImg})`);
    modalCardDetailEl.classList.add('has-emoji-image');
  } else {
    modalCardDetailEl.style.setProperty('--modal-emoji-url', '');
    modalCardDetailEl.classList.remove('has-emoji-image');
  }

  modalCardDetailEl.innerHTML = `
    <div class="content">${item.text}</div>
    <div class="footer">
      <span class="category-tag">${item.emotionLabel}</span>
    </div>
  `;
  
  renderComments(item);

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

async function handleAddComment() {
    const commentText = commentInputEl.value.trim();
    if (commentText === '' || !currentItem) return;

    // Tạo mảng comments mới
    const newComments = currentItem.comments ? [...currentItem.comments, commentText] : [commentText];
    
    try {
        // Cập nhật lại document trong Firebase
        await updateGratitude(currentItem.id, { comments: newComments });
        // Firebase listener sẽ tự động cập nhật UI, nhưng để phản hồi nhanh hơn, ta có thể cập nhật ngay lập tức
        currentItem.comments = newComments;
        renderComments(currentItem);
        commentInputEl.value = '';
    } catch (error) {
        console.error("Lỗi khi thêm bình luận:", error);
        alert("Không thể thêm bình luận. Vui lòng thử lại.");
    }
}

// Thêm sự kiện click cho grid để mở modal
gridEl.addEventListener('click', (e) => {
  const noteEl = e.target.closest('article.note');
  if (noteEl) {
    const itemId = noteEl.dataset.id;
    // Tìm item tương ứng trong danh sách đã tải
    const allItems = window.gratitudeItems || [];
    const item = allItems.find(it => it.id === itemId);
    if (item) {
      openCommentModal(item);
    }
  }
});

// Thêm sự kiện để đóng modal
closeModalBtn.addEventListener('click', closeCommentModal);
commentModalEl.addEventListener('click', (e) => {
  if (e.target === commentModalEl) {
    closeCommentModal();
  }
});

// Thêm sự kiện để gửi bình luận
commentInputEl.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleAddComment();
  }
});
// KẾT THÚC: Các hàm xử lý Modal


listenGratitudes((items) => {
  // Lưu danh sách items vào biến toàn cục để truy cập khi click
  window.gratitudeItems = items;

  const stats = { notgreat: 0, okay: 0, good: 0, great: 0 };
  // Dùng forEach an toàn hơn
  items.forEach(it => {
    if (it && it.emotionKey && stats.hasOwnProperty(it.emotionKey)) {
      stats[it.emotionKey]++;
    }
  });

  renderLegend(stats);
  renderBar(stats, items.length);
  renderGrid(items);

  // Cập nhật modal nếu nó đang mở
  if (currentItem) {
      const updatedItem = items.find(it => it && it.id === currentItem.id);
      if (updatedItem) {
          currentItem = updatedItem; // Cập nhật state của item hiện tại
          renderComments(updatedItem); // Vẽ lại comment với dữ liệu mới
      } else {
          // Nếu item không còn tồn tại (ví dụ: bị xóa), đóng modal lại
          closeCommentModal();
      }
  }
});

// Ensure Facebook icon opens the link (defensive handler)
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
