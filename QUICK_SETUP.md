# 🚀 HƯỚNG DẪN SETUP NHANH - BẢO MẬT API KEY

## ✅ CÁC BƯỚC THỰC HIỆN

### **Bước 1: Cài đặt Firebase CLI**

```powershell
# Cài đặt Firebase CLI (nếu chưa có)
npm install -g firebase-tools

# Đăng nhập
firebase login
```

### **Bước 2: Cài đặt dependencies cho Functions**

```powershell
cd d:\Tool\QEthui\Bang-Biet-0n-0nline\functions
npm install
```

### **Bước 3: Lưu API Key vào Firebase Functions Config** ⭐

```powershell
# Chạy lệnh này (thay YOUR_API_KEY bằng key thực của bạn)
firebase functions:config:set perplexity.key="pplx-xxxxxxxxxxxxxxxxx"

# Kiểm tra đã lưu chưa
firebase functions:config:get

# Output sẽ là:
# {
#   "perplexity": {
#     "key": "pplx-xxxxxxxxxxxxxxxxx"
#   }
# }
```

### **Bước 4: Deploy Cloud Function**

```powershell
cd d:\Tool\QEthui\Bang-Biet-0n-0nline
firebase deploy --only functions
```

Sau khi deploy xong, bạn sẽ thấy:

```
✔  functions[chatWithAI(us-central1)]: Successful create operation.
Function URL: https://us-central1-bang-biet-on.cloudfunctions.net/chatWithAI
```

### **Bước 5: Tạo Config trong Firestore**

**Option A: Dùng Firebase Console (Khuyến nghị)**

1. Vào https://console.firebase.google.com/
2. Chọn project `bang-biet-on`
3. Firestore Database → Start collection
4. Collection ID: `config`
5. Document ID: `ai_chatbox`
6. Fields:

```json
{
  "enabled": true,
  "useCloudFunction": true,
  "functionUrl": "https://us-central1-bang-biet-on.cloudfunctions.net/chatWithAI",
  "model": "sonar"
}
```

**Option B: Dùng setup-firestore-config.html**

1. Mở file `setup-firestore-config.html` trong browser
2. Chọn "Sử dụng Cloud Function: Có"
3. Điền Function URL từ bước 4
4. Click "Lưu Config vào Firestore"
5. **XÓA FILE setup-firestore-config.html SAU ĐÓ!**

### **Bước 6: Test**

1. Mở `board.html` trong browser
2. Mở Console (F12)
3. Gửi message trong chatbox
4. Kiểm tra log:

```
🔄 Loading API config from Firestore...
✅ Using Cloud Function (API key is secure)
   Function URL: https://us-central1-...
🔄 Using Cloud Function (secure)...
✅ AI Response: "..."
```

### **Bước 7: Push lên GitHub** 🎉

```powershell
git add .
git commit -m "feat: Secure API key with Firebase Cloud Functions"
git push origin main
```

**✅ API key giờ đã được bảo mật hoàn toàn!**

---

## 🧪 TEST LOCAL (OPTIONAL)

Nếu muốn test trước khi deploy:

```powershell
# Chạy Firebase Emulator
firebase emulators:start --only functions

# Function sẽ chạy tại:
# http://localhost:5001/bang-biet-on/us-central1/chatWithAI

# Test bằng cURL
curl -X POST http://localhost:5001/bang-biet-on/us-central1/chatWithAI `
  -H "Content-Type: application/json" `
  -d '{\"message\":\"Hello\",\"history\":[]}'
```

---

## ⚠️ TROUBLESHOOTING

### Lỗi: "API key not configured"

```powershell
# Set lại API key
firebase functions:config:set perplexity.key="YOUR_KEY"

# Deploy lại
firebase deploy --only functions
```

### Lỗi: "CORS error"

- ✅ Đã xử lý trong `functions/index.js` (dùng package `cors`)

### Lỗi: "Function not found"

```powershell
# Kiểm tra function đã deploy chưa
firebase functions:list

# Nếu chưa có, deploy lại
firebase deploy --only functions
```

### Config trong Firestore không hoạt động

1. Kiểm tra Firestore Rules: `allow read: if true;`
2. Kiểm tra Collection ID: `config`
3. Kiểm tra Document ID: `ai_chatbox`
4. Kiểm tra field `useCloudFunction: true`

---

## 💰 CHI PHÍ

- ✅ Firebase Functions: **2 triệu lượt gọi/tháng MIỄN PHÍ**
- ✅ Firestore: **50K reads/day MIỄN PHÍ**
- ⚠️ Perplexity API: Phụ thuộc vào plan của bạn

---

## 📋 CHECKLIST TRƯỚC KHI PUBLIC

- [ ] API key đã được lưu trong Firebase Functions Config
- [ ] Cloud Function đã được deploy thành công
- [ ] Config trong Firestore đã được tạo với `useCloudFunction: true`
- [ ] File `.gitignore` đã có `functions/.runtimeconfig.json`
- [ ] File `setup-firestore-config.html` đã được xóa (nếu dùng)
- [ ] Test chatbox hoạt động bình thường
- [ ] Kiểm tra Console log: "Using Cloud Function (secure)"

✅ **Giờ có thể push lên GitHub an toàn!**
