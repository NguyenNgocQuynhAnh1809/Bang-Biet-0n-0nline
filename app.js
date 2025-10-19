import {
  addGratitude,
  EMOTIONS,
  hasSubmittedToday,
  getDateKey,
} from "./firebase.js";

const moodListEl = document.getElementById("moodList");
const submitBtn = document.getElementById("submitBtn");
const textEl = document.getElementById("gratitude");

let chosenKey = null;

// Build mood buttons (4 ảnh)
for (const key of Object.keys(EMOTIONS)) {
  const m = EMOTIONS[key];
  const btn = document.createElement("button");
  btn.className = "mood-btn";
  btn.dataset.key = key;
  btn.type = "button";

  if (m.img) {
    btn.classList.add("has-img");
    btn.innerHTML = `
      <div class="face"><img src="${m.img}" alt="${m.label}" loading="lazy"></div>
      <div class="label">${m.label}</div>
    `;
  } else {
    btn.innerHTML = `<div class="face">${
      m.icon || ""
    }</div><div class="label">${m.label}</div>`;
  }

  btn.addEventListener("click", () => {
    chosenKey = key;
    for (const b of moodListEl.querySelectorAll(".mood-btn"))
      b.classList.toggle("active", b === btn);
    updateSubmitState();
  });
  moodListEl.appendChild(btn);
}

// Danh sách từ tục tĩu tiếng Việt cần chặn (có thể mở rộng)
const BAD_WORDS = [
  "địt",
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
  "cho",
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
  "bố láo",
  "bố láo*",
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
  "bố mày",
  "bố mày*",
  "bố m*",
  "mẹ mày",
  "mẹ mày*",
  "mẹ m*",
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
  "đồ dở hơi",
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
  "đồ đầu bò",
  "đồ đầu bò*",
  "đầu bò",
  "đầu bò*",
  "đồ đầu chó",
  "đồ đầu chó*",
  "ml",
  "vkl",
  "vcl",
  "clgt",
  "clmm",
  "clmz",
  "clmn",
  "clq",
  "clq*",
  "clmm*",
  "clmz*",
  "clmn*",
];

function containsBadWords(text) {
  const lower = text.toLowerCase();
  return BAD_WORDS.some((word) => lower.includes(word));
}

textEl.addEventListener("input", function (e) {
  if (containsBadWords(textEl.value)) {
    textEl.setCustomValidity("Vui lòng không sử dụng từ ngữ không phù hợp.");
    textEl.reportValidity();
    submitBtn.disabled = true;
  } else {
    textEl.setCustomValidity("");
    updateSubmitState();
  }
});

function updateSubmitState() {
  const valid = textEl.value.trim().length > 0 && !!chosenKey;
  submitBtn.disabled = !valid;
}

// Anonymous client id (local)
function getClientId() {
  const key = "gratitude_client_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID?.() || String(Math.random()).slice(2);
    localStorage.setItem(key, id);
  }
  return id;
}

submitBtn.addEventListener("click", async () => {
  const text = textEl.value.trim();
  if (!text || !chosenKey) return;

  const clientId = getClientId();
  const dateKey = getDateKey(); // Asia/Ho_Chi_Minh

  submitBtn.disabled = true;
  submitBtn.textContent = "Đang gửi...";

  try {
    // Limit: 1 submission per day
    const already = await hasSubmittedToday(clientId, dateKey);
    if (already) {
      alert("Bạn đã gửi lời biết ơn hôm nay rồi. Hẹn bạn ngày mai nhé!");
      submitBtn.disabled = false;
      submitBtn.textContent = "Gửi và xem bảng";
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
      dateKey,
    });
    window.location.href = "./board.html";
  } catch (e) {
    console.error(e);
    alert("Gửi thất bại. Vui lòng thử lại.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Gửi và xem bảng";
  }
});

// Share
// Menu + share + view board
const menuBtn = document.getElementById("menuBtn");
const menuPopover = document.getElementById("menuPopover");
const menuShareBtn = document.getElementById("menuShareBtn");
const viewBoardBtn = document.getElementById("viewBoardBtn");

function toggleMenu(show) {
  const is =
    typeof show === "boolean"
      ? show
      : menuPopover.getAttribute("aria-hidden") === "true";
  menuPopover.setAttribute("aria-hidden", String(!is));
}

menuBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  const hidden = menuPopover.getAttribute("aria-hidden") === "true";
  menuPopover.setAttribute("aria-hidden", hidden ? "false" : "true");
});

// close menu when clicking outside
document.addEventListener("click", (e) => {
  if (!menuPopover) return;
  if (menuPopover.getAttribute("aria-hidden") === "true") return;
  if (!menuPopover.contains(e.target) && e.target !== menuBtn) {
    menuPopover.setAttribute("aria-hidden", "true");
  }
});

menuShareBtn?.addEventListener("click", async () => {
  const url = location.origin + location.pathname.replace(/index\.html?$/, "");
  try {
    if (navigator.share)
      await navigator.share({
        title: "Bảng biết ơn",
        text: "Gửi lời biết ơn hôm nay 🧡",
        url,
      });
    else
      await navigator.clipboard.writeText(url), alert("Đã sao chép liên kết.");
  } catch {}
  menuPopover?.setAttribute("aria-hidden", "true");
});

// Xem bảng biết ơn: chỉ cho phép nếu đã gửi lời biết ơn hôm nay
viewBoardBtn?.addEventListener("click", async () => {
  const clientId = getClientId();
  const dateKey = getDateKey();
  try {
    const already = await hasSubmittedToday(clientId, dateKey);
    if (already) {
      window.location.href = "./board.html";
    } else {
      alert(
        "Bạn chưa gửi lời biết ơn hôm nay. Vui lòng viết trước khi xem bảng."
      );
    }
  } catch (e) {
    console.error(e);
    alert("Không thể kiểm tra trạng thái gửi. Vui lòng thử lại.");
  } finally {
    menuPopover?.setAttribute("aria-hidden", "true");
  }
});
