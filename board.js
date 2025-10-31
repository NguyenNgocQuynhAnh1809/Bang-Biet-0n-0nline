import { listenGratitudes, EMOTIONS, updateGratitude } from "./firebase.js";

// Danh sách từ ngữ không phù hợp
const BAD_WORDS = [
  "địt",
  "qq",
  "QQ",
  "máy giặt nằm ngang",
  "j v tr",
  "ủa alo",
  "cạn phước",
  "xui xẻo",
  "phế",
  "tôm sông thủy tức sứa biển",
  "hết cứu",
  "nát",
  "dốt",
  "dạ dày 4 ngăn",
  "ngưu đầu mã diện",
  "phong lam tầm gửi",
  "không chào đón",
  "ko chào đón",
  "cút",
  "phắn",
  "lọt khe",
  "dume",
  "duma",
  "đụ mẹ",
  "đụ má",
  "đụ",
  "djt",
  "d!t",
  "d1t",
  "đjt",
  "đ1t",
  "cặc",
  "cak",
  "cak*",
  "c*k",
  "c@k",
  "cặk",
  "cặc*",
  "cặk*",
  "cạk",
  "cạk*",
  "lồn",
  "l0n",
  "l*n",
  "l@n",
  "lồn*",
  "l0z",
  "loz",
  "l0lz",
  "l*nz",
  "l*n*",
  "l0n*",
  "clm",
  "cl",
  "clo",
  "clq",
  "clgt",
  "clmm",
  "clmz",
  "clmn",
  "clq*",
  "clmm*",
  "d*tm*",
  "dmm",
  "dm",
  "dcm",
  "dmm*",
  "dm*",
  "dcm*",
  "đmm",
  "đm",
  "đcm",
  "đmm*",
  "đm*",
  "đcm*",
  "loz",
  "l0z",
  "l0zz",
  "l0zz*",
  "lozz",
  "lozz*",
  "buồi",
  "buoi",
  "bùi",
  "buồi*",
  "buoi*",
  "bùi*",
  "đụ",
  "đuỵt",
  "đụ*",
  "đuỵt*",
  "chó",
  "dmm",
  "cho*",
  "ch0",
  "ch0*",
  "chó*",
  "ch0z",
  "ch0z*",
  "đĩ",
  "di~",
  "dĩ",
  "đĩ*",
  "di~*",
  "dĩ*",
  "đéo",
  "déo",
  "đéo*",
  "déo*",
  "đell",
  "đell*",
  "dell",
  "dell*",
  "vãi",
  "vãi*",
  "vcl",
  "vkl",
  "vl",
  "vkl*",
  "vcl*",
  "vl*",
  "cc",
  "c*c",
  "c@c",
  "cc*",
  "cặc",
  "cặk",
  "cạk",
  "fuck",
  "f*ck",
  "fck",
  "f*ck*",
  "fck*",
  "fuk",
  "fuk*",
  "shit",
  "sh!t",
  "sh1t",
  "sh*t",
  "sh1t*",
  "shit*",
  "bitch",
  "b!tch",
  "b1tch",
  "b*tch",
  "bitch*",
  "ngu",
  "ngu*",
  "nguu",
  "nguu*",
  "ngốc",
  "ngốc*",
  "ngok",
  "ngok*",
  "khốn nạn",
  "khon nan",
  "khonnan",
  "khốn nạn*",
  "khonnan*",
  "mẹ mày",
  "me may",
  "mẹ mày*",
  "me may*",
  "mẹ m*",
  "me m*",
  "bố mày",
  "bo may",
  "bố mày*",
  "bo may*",
  "bố m*",
  "bo m*",
  "con mẹ mày",
  "con me may",
  "con mẹ mày*",
  "con me may*",
  "thằng chó",
  "thang cho",
  "thằng chó*",
  "thang cho*",
  "thằng lồn",
  "thang lon",
  "thằng lồn*",
  "thang lon*",
  "thằng ngu",
  "thang ngu",
  "thằng ngu*",
  "thang ngu*",
  "thằng đĩ",
  "thang di~",
  "thằng đĩ*",
  "thang di~*",
  "thằng cặc",
  "thang cak",
  "thằng cặc*",
  "thang cak*",
  "ml",
  "mẹ kiếp",
  "mẹ mìn",
  "mẹ cha",
  "mẹ cha mày",
  "mẹ cha mi",
  "mẹ cha nó",
  "mẹ cha tao",
  "bố láo",
  "bố láo*",
  "bố láo toét",
  "bố láo toét*",
  "bố đời",
  "bố đời*",
  "vô học",
  "vô học*",
  "vô văn hóa",
  "vô văn hoá",
  "vô văn hóa*",
  "vô văn hoá*",
  "phò",
  "phò*",
  "phò phạch",
  "phò phạch*",
  "dốt",
  "dốt*",
  "dốt nát",
  "dốt nát*",
  "đần",
  "đần*",
  "đần độn",
  "đần độn*",
  "óc chó",
  "óc cho",
  "óc chó*",
  "óc cho*",
  "óc lợn",
  "óc lợn*",
  "bựa",
  "bựa*",
  "bựa vãi",
  "bựa vãi*",
  "rảnh chó",
  "rảnh cho",
  "rảnh chó*",
  "rảnh cho*",
  "dơ",
  "dơ*",
  "dơ bẩn",
  "dơ bẩn*",
  "bẩn",
  "bẩn*",
  "bẩn thỉu",
  "bẩn thỉu*",
  "xàm",
  "xàm*",
  "xàm lol",
  "xàm lol*",
  "tởm",
  "tởm*",
  "tởm lợm",
  "tởm lợm*",
  "má m",
  "mẹ m",
  "má m*",
  "vô liêm sỉ",
  "vô liêm sỉ*",
  "đồ chó",
  "đồ chó*",
  "đồ ngu",
  "đồ ngu*",
  "đồ rác",
  "đồ rác*",
  "rác rưởi",
  "rác rưởi*",
  "đồ khốn",
  "đồ khốn*",
  "đồ khốn nạn",
  "đồ kh*n n*n",
  "đồ mất dạy",
  "đồ m*t d*y",
  "mất dạy",
  "m*t d*y",
  "đồ điên",
  "đồ điên*",
  "chó đẻ",
  "địt mẹ",
  "đồ thần kinh",
  "đồ thần kinh*",
  "đồ biến thái",
  "đồ biến thái*",
  "biến thái",
  "biến thái*",
  "đồ bệnh hoạn",
  "đồ bệnh hoạn*",
  "bệnh hoạn",
  "bệnh hoạn*",
  "đồ dở hơi",
  "đồ dở hơi*",
  "dở hơi",
  "dở hơi*",
  "đồ dở người",
  "dở người",
  "dở người*",
  "đồ ngu xuẩn",
  "stupid",
  "ngu xuẩn",
  "ngu ngốc",
  "đồ đầu bò",
  "óc bò",
  "đầu bò",
  "óc heo",
  "óc lợn",
  "óc chó",
  "óc tôm",
  "rắn độc",
  "rắn",
  "thất học",
  "ngu dốt",
  "giả tạo",
  "giả dối",
  "đồ đầu đất",
  "đồ đầu đất*",
  "đầu đất",
  "đầu đất*",
  "đồ đầu gỗ",
  "đồ đầu gỗ*",
  "đầu gỗ",
  "đầu gỗ*",
  "đồ đầu tôm",
  "đồ đầu tôm*",
  "đầu tôm",
  "đầu tôm*",
  "đồ đầu heo",
  "đồ đầu heo*",
  "đầu heo",
  "đầu heo*",
  "đồ đầu lợn",
  "đồ đầu lợn*",
  "đầu lợn",
  "đầu lợn*",
  "đồ đầu trâu",
  "đồ đầu trâu*",
  "đầu trâu",
  "đầu trâu*",
  "đồ đầu chó",
  "đồ đầu chó*",
];

// Hàm kiểm tra có chứa từ không phù hợp không
function containsBadWords(text) {
  const lower = text.toLowerCase().trim();
  return BAD_WORDS.some((word) => lower.includes(word));
}

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
let currentUserId = null; // Sử dụng để track user hiện tại

// Tạo userId duy nhất cho mỗi người dùng (lưu vào localStorage)
function getUserId() {
  if (!currentUserId) {
    currentUserId = localStorage.getItem("userId");
    if (!currentUserId) {
      currentUserId =
        "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("userId", currentUserId);
    }
  }
  return currentUserId;
}

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
  items.forEach((it) => {
    const div = document.createElement("article");
    div.className = "note";
    div.dataset.id = it.id;
    if (it.emotionKey) div.classList.add("emo-" + it.emotionKey);

    const watermarkHtml =
      it.emotionKey && EMOTIONS[it.emotionKey]?.img
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
        <span>${(it.comments || []).length} bình luận</span>
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
  const reactions = item.reactions || {};
  const userId = getUserId();

  // Đếm số lượng mỗi loại reaction
  const reactionCounts = {};
  Object.values(reactions).forEach((reactionId) => {
    reactionCounts[reactionId] = (reactionCounts[reactionId] || 0) + 1;
  });

  commentListEl.innerHTML = "";
  comments.forEach((comment) => {
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
  });

  // SỬA ĐỔI: Hiển thị reactions của bài viết (không phải của comment)
  reactionSummaryEl.innerHTML = "";
  const sortedReactions = Object.keys(reactionCounts)
    .filter((reactionId) => reactionId !== "bad")
    .sort((a, b) => reactionCounts[b] - reactionCounts[a]);

  let totalReactionCount = 0;
  sortedReactions.forEach((reactionId) => {
    const count = reactionCounts[reactionId];
    totalReactionCount += count;
    if (count > 0) {
      const reactionCountEl = document.createElement("div");
      reactionCountEl.className = "reaction-count-item";
      reactionCountEl.setAttribute("data-tooltip", count);
      // Use EMOTIONS mapping for correct image path
      const imgSrc =
        EMOTIONS[reactionId]?.img || `assets/images/${reactionId}.png`;
      reactionCountEl.innerHTML = `<img src="${imgSrc}" alt="">`;
      reactionSummaryEl.appendChild(reactionCountEl);
    }
  });

  if (totalReactionCount > 0) {
    const totalCountEl = document.createElement("span");
    totalCountEl.className = "summary-count";
    totalCountEl.textContent = totalReactionCount;
    reactionSummaryEl.appendChild(totalCountEl);
  }

  commentCountEl.textContent = `${comments.length} bình luận`;

  // Cập nhật trạng thái đã chọn của user hiện tại
  const userReaction = reactions[userId];
  console.log("User reaction:", userReaction, "All reactions:", reactions);
  reactionBtns.forEach((btn) => {
    if (btn.dataset.reaction === userReaction) {
      btn.classList.add("selected");
      console.log("Selected button:", btn.dataset.reaction);
    } else {
      btn.classList.remove("selected");
    }
  });
}

// --- MODAL & EVENT HANDLERS ---

function openCommentModal(item) {
  currentItem = item;
  if (item.emotionKey === "bad") {
    modalCardDetailEl.className = "gratitude-item-modal bad-support";
    modalCardDetailEl.style.setProperty("--modal-emoji-url", "none");
    modalCardDetailEl.classList.remove("has-emoji-image");
    modalCardDetailEl.innerHTML = `
      <div class="support-psychology">
        <div class="support-row">
          <img src="Hem202_logo.jpg" alt="Hẻm 202" class="support-logo" />
          <div class="support-info">
            <div>Trang kết nối hỗ trợ tư vấn tâm lý dành cho sinh viên Trường Đại Học FPT tại TP. Hồ Chí Minh.</div>
            <div><span class="support-phone">📞 028 7300 5585</span></div>
          </div>
        </div>
        <div class="support-row">
          <img src="BoYTeLogo.jpg" alt="Bộ Y Tế" class="support-logo" />
          <div class="support-info">
            <div>“CẤP CỨU TRẦM CẢM”</div>
            <div><span class="support-phone">📞 1900 1267</span></div>
          </div>
        </div>
        <div class="support-row support-callus">
          <img src="callus.png" alt="Call Us" class="callus-img" />
          <span class="callus-btn">CALL US</span>
        </div>
      </div>
      <div class="comment-blocked">Không thể bình luận với cảm xúc này.</div>
    `;
    commentInputEl.disabled = true;
  } else {
    const emotionClass =
      item.emotionKey === "notgreat" ? "not-great" : item.emotionKey;
    const mascotImg = EMOTIONS[item.emotionKey]?.img;
    modalCardDetailEl.className = `gratitude-item-modal ${emotionClass}`;
    if (mascotImg) {
      modalCardDetailEl.style.setProperty(
        "--modal-emoji-url",
        `url(${mascotImg})`
      );
      modalCardDetailEl.classList.add("has-emoji-image");
    } else {
      modalCardDetailEl.classList.remove("has-emoji-image");
    }
    modalCardDetailEl.innerHTML = `
      <div class="content"><p>${item.text}</p></div>
      <div class="footer">
        <span class="tag">
          <span class="dot" style="background-color: ${
            item.color || "#eee"
          }"></span>
          ${item.emotionLabel}
        </span>
        <span class="time">• ${(item.comments || []).length} bình luận</span>
      </div>
    `;
  }
  renderCommentsAndReactions(item);
  commentModalEl.style.display = "flex";
  setTimeout(() => commentModalEl.classList.add("show"), 10);
}

function closeCommentModal() {
  commentModalEl.classList.remove("show");
  setTimeout(() => {
    commentModalEl.style.display = "none";
    commentInputEl.value = "";
    currentItem = null;
  }, 300);
}

async function handleAddComment() {
  const commentText = commentInputEl.value.trim();
  if (commentText === "" || !currentItem || currentItem.emotionKey === "bad")
    return;

  // Kiểm tra bad words
  if (containsBadWords(commentText)) {
    alert(
      "❌ Bình luận chứa từ ngữ không phù hợp. Vui lòng sử dụng ngôn từ lịch sự hơn."
    );
    commentInputEl.focus();
    return;
  }

  const newComment = {
    text: commentText,
  };

  const newComments = currentItem.comments
    ? [...currentItem.comments, newComment]
    : [newComment];

  try {
    await updateGratitude(currentItem.id, { comments: newComments });
    currentItem.comments = newComments;
    renderCommentsAndReactions(currentItem);

    commentInputEl.value = "";
  } catch (error) {
    console.error("Lỗi khi thêm bình luận:", error);
    alert("Không thể thêm bình luận. Vui lòng thử lại.");
  }
}

// --- EVENT LISTENERS ---

gridEl.addEventListener("click", (e) => {
  const noteEl = e.target.closest("article.note");
  if (noteEl) {
    const itemId = noteEl.dataset.id;
    const allItems = window.gratitudeItems || [];
    const item = allItems.find((it) => it.id === itemId);
    if (item) {
      openCommentModal(item);
    }
  }
});

closeModalBtn.addEventListener("click", closeCommentModal);
commentModalEl.addEventListener("click", (e) => {
  if (e.target === commentModalEl) closeCommentModal();
});

// Validation real-time khi gõ bình luận
commentInputEl.addEventListener("input", function (e) {
  if (containsBadWords(commentInputEl.value)) {
    commentInputEl.setCustomValidity(
      "Vui lòng không sử dụng từ ngữ không phù hợp."
    );
    commentInputEl.style.borderColor = "#e74c3c";
  } else {
    commentInputEl.setCustomValidity("");
    commentInputEl.style.borderColor = "";
  }
});

commentInputEl.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleAddComment();
});

// XỬ LÝ REACT VÀO BÀI VIẾT (giống Facebook)
reactionBtns.forEach((btn) => {
  btn.addEventListener("click", async () => {
    if (!currentItem) return;

    const reactionId = btn.dataset.reaction;
    const userId = getUserId();
    const reactions = { ...(currentItem.reactions || {}) };

    console.log("Clicked reaction:", reactionId, "Current user:", userId);
    console.log("Before update:", reactions);

    // Toggle reaction: nếu đã chọn reaction này thì bỏ, nếu chưa/khác thì chọn
    if (reactions[userId] === reactionId) {
      // Bỏ reaction
      delete reactions[userId];
      console.log("Removing reaction");
    } else {
      // Thêm/đổi reaction
      reactions[userId] = reactionId;
      console.log("Adding/Changing reaction");
    }

    console.log("After update:", reactions);

    try {
      await updateGratitude(currentItem.id, { reactions });
      currentItem.reactions = reactions;
      renderCommentsAndReactions(currentItem);
    } catch (error) {
      console.error("Lỗi khi cập nhật reaction:", error);
    }
  });
});

// --- FIREBASE LISTENER ---

listenGratitudes((items) => {
  window.gratitudeItems = items;

  const stats = { notgreat: 0, okay: 0, good: 0, great: 0 };
  items.forEach((it) => {
    if (it?.emotionKey && stats.hasOwnProperty(it.emotionKey)) {
      stats[it.emotionKey]++;
    }
  });

  renderLegend(stats);
  renderBar(stats, items.length);
  renderGrid(items);

  if (currentItem) {
    const updatedItem = items.find((it) => it?.id === currentItem.id);
    if (updatedItem) {
      currentItem = updatedItem;
      renderCommentsAndReactions(updatedItem);
    } else {
      closeCommentModal();
    }
  }
});
