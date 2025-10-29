# 🔒 BẢO MẬT API KEY - WORKFLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                     TRƯỚC KHI BẢO MẬT                           │
│                                                                 │
│  User Browser                                                   │
│     │                                                           │
│     │ 1. Gọi getDoc() từ Firestore                             │
│     │ ────────────────────────────────>                        │
│     │                                  Firestore               │
│     │ 2. Trả về config có API key      (config/ai_chatbox)    │
│     │ <────────────────────────────────                        │
│     │    {apiKey: "pplx-xxx"}                                  │
│     │                                                           │
│     │ 3. Gọi Perplexity API với key                            │
│     │ ──────────────────────────────────────────────────────>  │
│     │                                                           │
│     │ 4. Trả về response                Perplexity API         │
│     │ <──────────────────────────────────────────────────────  │
│     │                                                           │
│  ⚠️ NGUY HIỂM: User có thể xem API key trong Console!         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      SAU KHI BẢO MẬT                            │
│                                                                 │
│  User Browser         Firebase Cloud         Perplexity API    │
│                          Function                               │
│     │                       │                        │          │
│     │ 1. Đọc config         │                        │          │
│     │ ──────────>           │                        │          │
│     │  Firestore            │                        │          │
│     │ <──────────           │                        │          │
│     │  {useCloudFunction:   │                        │          │
│     │   true, functionUrl}  │                        │          │
│     │                       │                        │          │
│     │ 2. Gọi Cloud Function │                        │          │
│     │ ─────────────────────>│                        │          │
│     │  POST /chatWithAI     │                        │          │
│     │  {message: "..."}     │                        │          │
│     │                       │                        │          │
│     │                       │ 3. Lấy API key từ     │          │
│     │                       │    Functions Config   │          │
│     │                       │    (server-side)      │          │
│     │                       │                        │          │
│     │                       │ 4. Gọi Perplexity API │          │
│     │                       │ ──────────────────────>          │
│     │                       │    Authorization:      │          │
│     │                       │    Bearer pplx-xxx     │          │
│     │                       │                        │          │
│     │                       │ 5. Trả về response    │          │
│     │                       │ <──────────────────────          │
│     │                       │                        │          │
│     │ 6. Trả về response    │                        │          │
│     │ <─────────────────────│                        │          │
│     │  {success: true,      │                        │          │
│     │   response: "..."}    │                        │          │
│     │                       │                        │          │
│  ✅ AN TOÀN: User KHÔNG BAO GIỜ thấy được API key!            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    FIRESTORE CONFIG                             │
├─────────────────────────────────────────────────────────────────┤
│  TRƯỚC (Không bảo mật):                                         │
│  {                                                              │
│    "enabled": true,                                             │
│    "apiKey": "pplx-xxxxxxxxxxxxxxxxx",  ← ⚠️ LỘ API KEY!      │
│    "apiUrl": "https://api.perplexity.ai/...",                  │
│    "model": "sonar"                                             │
│  }                                                              │
├─────────────────────────────────────────────────────────────────┤
│  SAU (Bảo mật):                                                 │
│  {                                                              │
│    "enabled": true,                                             │
│    "useCloudFunction": true,            ← ✅ Dùng Function     │
│    "functionUrl": "https://us-central1-...",                   │
│    "model": "sonar"                                             │
│    // KHÔNG CÒN apiKey!                 ← ✅ An toàn!         │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   FIREBASE FUNCTIONS CONFIG                     │
│                   (Server-side, không public)                   │
├─────────────────────────────────────────────────────────────────┤
│  $ firebase functions:config:set perplexity.key="pplx-xxx"     │
│                                                                 │
│  Lưu tại:                                                       │
│  - Cloud: Firebase Functions Environment Variables             │
│  - Local: functions/.runtimeconfig.json (trong .gitignore)     │
│                                                                 │
│  ✅ User KHÔNG THỂ đọc được từ browser                         │
│  ✅ Chỉ Cloud Function mới truy cập được                       │
│  ✅ KHÔNG BAO GIỜ commit lên Git                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      FILE STRUCTURE                             │
├─────────────────────────────────────────────────────────────────┤
│  Bang-Biet-0n-0nline/                                           │
│  ├── .gitignore                  ← ✅ Đã có sẵn                │
│  │   └── functions/.runtimeconfig.json                          │
│  ├── chatbox.js                  ← ✅ Đã cập nhật              │
│  │   ├── loadConfigFromFirestore() → Kiểm tra useCloudFunction │
│  │   ├── callCloudFunction()       → Gọi Function (bảo mật)    │
│  │   └── callDirectAPI()           → Fallback (cũ)             │
│  ├── firestore.rules             ← ✅ Đã cập nhật              │
│  │   └── config/* allow read (nhưng KHÔNG có API key)          │
│  ├── functions/                                                 │
│  │   ├── index.js                 ← ✅ Đã cập nhật              │
│  │   │   ├── chatWithAI()         → HTTPS endpoint             │
│  │   │   └── getAIChatResponse()  → Legacy callable            │
│  │   ├── package.json             ← ✅ Đã thêm cors            │
│  │   └── .runtimeconfig.json      ← ⚠️ KHÔNG commit (gitignore)│
│  ├── setup-firestore-config.html ← ⚠️ XÓA SAU KHI SETUP!      │
│  ├── QUICK_SETUP.md              ← 📖 Hướng dẫn chi tiết       │
│  └── SECURITY_SETUP_GUIDE.md     ← 📖 Giải thích đầy đủ        │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 TÓM TẮT

### ❌ VẤN ĐỀ CŨ

- API key lưu trong Firestore
- Frontend đọc trực tiếp từ Firestore
- User mở Console → Thấy API key → Copy được!

### ✅ GIẢI PHÁP MỚI

1. **API key lưu trong Firebase Functions Config** (server-side, không public)
2. **Frontend gọi Cloud Function**, KHÔNG gọi Perplexity trực tiếp
3. **Cloud Function** lấy API key từ config (bảo mật) → Gọi Perplexity API
4. **User chỉ thấy response**, KHÔNG BAO GIỜ thấy API key

### 📋 CHECKLIST

- [x] Cập nhật `functions/index.js` - Tạo Cloud Function
- [x] Cập nhật `functions/package.json` - Thêm dependency `cors`
- [x] Cập nhật `chatbox.js` - Hỗ trợ gọi Cloud Function
- [x] Cập nhật `firestore.rules` - Không cho phép ghi config từ frontend
- [x] Tạo `QUICK_SETUP.md` - Hướng dẫn setup nhanh
- [x] Tạo `SECURITY_SETUP_GUIDE.md` - Giải thích chi tiết
- [x] Tạo `setup-firestore-config.html` - Tool setup config
- [ ] **Deploy Cloud Function** - Chạy `firebase deploy --only functions`
- [ ] **Set API key** - Chạy `firebase functions:config:set perplexity.key="YOUR_KEY"`
- [ ] **Tạo config trong Firestore** - Dùng Firebase Console hoặc setup HTML
- [ ] **Test chatbox** - Kiểm tra log "Using Cloud Function"
- [ ] **Xóa setup-firestore-config.html** - Trước khi push lên GitHub

### 🚀 BƯỚC TIẾP THEO (THỰC HIỆN NGAY)

```powershell
# 1. Cài đặt dependencies
cd d:\Tool\QEthui\Bang-Biet-0n-0nline\functions
npm install

# 2. Set API key (thay YOUR_KEY)
cd ..
firebase functions:config:set perplexity.key="YOUR_ACTUAL_API_KEY"

# 3. Deploy Cloud Function
firebase deploy --only functions

# 4. Copy Function URL từ output và tạo config trong Firestore
# Dùng Firebase Console hoặc mở setup-firestore-config.html

# 5. Test chatbox
# Mở board.html, kiểm tra Console log

# 6. Xóa file setup (nếu đã dùng)
Remove-Item setup-firestore-config.html

# 7. Push lên GitHub
git add .
git commit -m "feat: Secure API key with Cloud Functions"
git push
```
