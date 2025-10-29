# 🔒 HƯỚNG DẪN BẢO MẬT API KEY

## ⚠️ VẤN ĐỀ HIỆN TẠI

- API key Perplexity đang lưu trong Firestore và có thể đọc được qua console
- Cần giấu API key để không bị lộ khi public repo lên GitHub

---

## ✅ GIẢI PHÁP: SỬ DỤNG FIREBASE CLOUD FUNCTIONS (KHUYẾN NGHỊ)

### **BƯỚC 1: Cài đặt Firebase CLI**

```powershell
# Cài đặt Firebase CLI (nếu chưa có)
npm install -g firebase-tools

# Đăng nhập vào Firebase
firebase login

# Khởi tạo Functions trong project (nếu chưa có)
cd d:\Tool\QEthui\Bang-Biet-0n-0nline
firebase init functions
# Chọn: Use an existing project -> bang-biet-on
# Chọn: JavaScript
# Chọn: No ESLint
# Chọn: Yes install dependencies
```

---

### **BƯỚC 2: Lưu API Key vào Firebase Functions Config (BẢO MẬT)**

```powershell
# Thay YOUR_API_KEY bằng API key Perplexity thực của bạn
firebase functions:config:set perplexity.key="YOUR_ACTUAL_API_KEY_HERE"

# Kiểm tra config đã lưu
firebase functions:config:get
```

**✨ API key giờ đã được lưu an toàn trong Firebase Functions Config (không public, không thể đọc từ frontend)**

---

### **BƯỚC 3: Deploy Cloud Function**

```powershell
# Deploy function lên Firebase
firebase deploy --only functions

# Sau khi deploy xong, bạn sẽ nhận được URL:
# https://us-central1-bang-biet-on.cloudfunctions.net/chatWithAI
```

---

### **BƯỚC 4: Cập nhật Frontend để gọi Cloud Function**

File `chatbox.js` đã được cập nhật để:

1. ✅ Gọi Cloud Function thay vì gọi Perplexity trực tiếp
2. ✅ Không cần lưu API key trong Firestore nữa
3. ✅ User không thể xem được API key

**Code đã sửa:**

- ✅ `loadConfigFromFirestore()` - Đọc `useCloudFunction: true`
- ✅ `callAIAPI()` - Gọi Cloud Function nếu enabled
- ✅ Fallback về direct API nếu Cloud Function chưa setup

---

### **BƯỚC 5: Tạo Config Document trong Firestore**

Tạo document trong Firestore Console:

- Collection: `config`
- Document ID: `ai_chatbox`
- Fields:

```json
{
  "enabled": true,
  "useCloudFunction": true,
  "functionUrl": "https://us-central1-bang-biet-on.cloudfunctions.net/chatWithAI",
  "model": "sonar"
}
```

**Hoặc tạo file HTML để setup:**

```html
<!-- Mở file này trong browser để tạo config -->
```

---

### **BƯỚC 6: Cập nhật Firestore Rules (Xóa quyền đọc API key)**

File `firestore.rules` đã được cập nhật:

```
match /config/{docId} {
  allow read: if true;  // Vẫn cho phép đọc config (nhưng không có API key)
  allow write: if false; // Không cho phép ghi từ frontend
}
```

**✅ Giờ config chỉ chứa `useCloudFunction: true` và `functionUrl`, KHÔNG chứa API key**

---

## 🔄 WORKFLOW SAU KHI SETUP

### **Frontend (chatbox.js)**

```
User gửi message
  ↓
Frontend gửi request tới Cloud Function
  ↓
Cloud Function (có API key bảo mật)
  ↓
Cloud Function gọi Perplexity API
  ↓
Trả response về Frontend
```

---

## 🧪 TEST SETUP

### **1. Test local trước khi deploy:**

```powershell
# Chạy Firebase Functions Emulator
firebase emulators:start --only functions

# Function sẽ chạy tại:
# http://localhost:5001/bang-biet-on/us-central1/chatWithAI
```

### **2. Test bằng cURL:**

```powershell
# Test Cloud Function
curl -X POST https://us-central1-bang-biet-on.cloudfunctions.net/chatWithAI `
  -H "Content-Type: application/json" `
  -d '{\"message\":\"Hello\",\"history\":[]}'
```

### **3. Test trên Frontend:**

1. Mở `board.html`
2. Mở Console (F12)
3. Gửi message trong chatbox
4. Kiểm tra Console log: `"🔄 Using Cloud Function..."`

---

## 📦 CHECKLIST TRƯỚC KHI PUBLIC LÊN GITHUB

- [ ] ✅ API key đã được lưu trong Firebase Functions Config
- [ ] ✅ Cloud Function đã được deploy
- [ ] ✅ Frontend gọi Cloud Function (không gọi Perplexity trực tiếp)
- [ ] ✅ Firestore config không chứa API key
- [ ] ✅ File `.gitignore` đã thêm:
  ```
  functions/.runtimeconfig.json
  functions/node_modules/
  .env
  *.key
  ```
- [ ] ✅ Test chatbox hoạt động bình thường

---

## 🆘 TROUBLESHOOTING

### **Lỗi: "API key not configured"**

```powershell
# Set lại API key
firebase functions:config:set perplexity.key="YOUR_KEY"
firebase deploy --only functions
```

### **Lỗi: CORS khi gọi Cloud Function**

- ✅ Đã xử lý trong `functions/index.js` với `cors: true`

### **Lỗi: Function timeout**

- Tăng timeout trong `functions/index.js`: `timeoutSeconds: 60`

---

## 💰 CHI PHÍ

- ✅ Firebase Functions: **2 triệu lượt gọi/tháng MIỄN PHÍ**
- ✅ Firestore: **50K reads/day MIỄN PHÍ**
- ⚠️ Sau khi vượt quota, cần nâng cấp lên Blaze Plan (pay-as-you-go)

---

## 🔄 ALTERNATIVE: Nếu không muốn dùng Cloud Functions

Có thể dùng **Environment Variables** nhưng vẫn cần backend:

1. Tạo `.env` file (local only, không commit)
2. Tạo backend server (Node.js/Express) để proxy requests
3. Deploy backend lên Heroku/Railway/Vercel
4. Frontend gọi backend thay vì gọi Perplexity trực tiếp

**Nhưng Cloud Functions đơn giản hơn và tích hợp sẵn với Firebase!**
