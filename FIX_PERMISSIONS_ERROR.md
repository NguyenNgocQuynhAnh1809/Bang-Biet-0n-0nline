# 🔥 FIX LỖI: Missing or insufficient permissions

## 🎯 NGUYÊN NHÂN

Lỗi `Missing or insufficient permissions` xảy ra vì:
- ✅ Config đã được tạo trong Firestore (đúng)
- ❌ Firestore Rules chưa được deploy (sai)
- ❌ Frontend không được phép đọc collection `config`

---

## 🚀 GIẢI PHÁP - DEPLOY FIRESTORE RULES QUA FIREBASE CONSOLE

### **Bước 1: Vào Firebase Console**
1. Mở https://console.firebase.google.com/
2. Chọn project **"BANG BIET ON"**
3. Click **"Firestore Database"** ở menu bên trái

### **Bước 2: Vào tab Rules**
1. Click tab **"Rules"** (ở trên cùng, bên cạnh "Data", "Indexes", "Usage")
2. Bạn sẽ thấy editor với rules hiện tại

### **Bước 3: Thêm rules cho collection config**
1. Tìm dòng cuối cùng của rules (trước dấu `}` cuối cùng)
2. Thêm đoạn code này vào:

```
    // ===== THÊM MỚI: Rule cho AI Chatbox Config =====
    match /config/{docId} {
      // ✅ Cho phép đọc config (nhưng KHÔNG LƯU API KEY ở đây)
      // Config chỉ chứa: useCloudFunction, functionUrl, model, enabled
      allow read: if true;
      
      // ❌ KHÔNG cho phép ghi từ frontend (chỉ thông qua Firebase Console)
      // Để bảo mật, chỉ admin có thể cập nhật config
      allow write: if false;
    }
```

3. Rules đầy đủ sẽ như thế này:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /gratitudes/{docId} {
      allow read: if true;
      
      allow create: if request.resource.data.keys().hasOnly([
        'text','emotionKey','emotionLabel','color','moodScore','createdAt','clientId','dateKey'
      ])
      && request.resource.data.text is string
      && request.resource.data.text.size() > 0
      && request.resource.data.text.size() <= 240
      && request.resource.data.emotionKey in ['bad','notgreat','okay','good','great']
      && request.time == request.resource.data.createdAt
      && docId == request.resource.data.clientId + '_' + request.resource.data.dateKey
      && !exists(/databases/$(database)/documents/gratitudes/$(docId));

      allow update: if 
        request.writeFields.hasOnly(['comments', 'reactions'])
        && (!request.writeFields.hasAny(['comments']) || request.resource.data.comments is list)
        && (!request.writeFields.hasAny(['reactions']) || request.resource.data.reactions is map);

      allow delete: if false;
    }

    // ===== THÊM MỚI: Rule cho AI Chatbox Config =====
    match /config/{docId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### **Bước 4: Publish Rules**
1. Click nút **"Publish"** màu xanh ở góc trên bên phải
2. Đợi vài giây để rules được deploy

---

## 🧪 TEST LẠI

### **1. Clear cache browser:**
```
Nhấn Ctrl + Shift + Delete
→ Chọn "Cached images and files"
→ Click "Clear data"
```

### **2. Hard refresh:**
```
Mở board.html
Nhấn Ctrl + F5
```

### **3. Mở Console (F12) và kiểm tra log:**

**✅ Nếu thành công, bạn sẽ thấy:**
```
🔄 Loading API config from Firestore...
✅ Using Cloud Function (API key is secure)
   Function URL: https://us-central1-bang-biet-on.cloudfunctions.net/chatWithAI
✅ API config loaded successfully from Firestore
```

**❌ Nếu vẫn lỗi:**
```
❌ Error loading config from Firestore: FirebaseError: Missing or insufficient permissions.
```
→ Rules chưa được publish hoặc chưa có hiệu lực (đợi 1-2 phút)

---

## 📋 CHECKLIST DEBUG

- [ ] Rules đã được publish trên Firebase Console
- [ ] Collection `config` đã tồn tại
- [ ] Document `ai_chatbox` đã có đầy đủ fields:
  - `enabled: true` (boolean)
  - `useCloudFunction: true` (boolean)
  - `functionUrl: "https://..."` (string)
  - `model: "sonar"` (string)
- [ ] Browser cache đã được clear
- [ ] Page đã được hard refresh (Ctrl + F5)

---

## 🔍 KIỂM TRA RULES ĐÃ DEPLOY CHƯA

### **Cách 1: Qua Firebase Console**
1. Vào Firestore Database → Rules
2. Kiểm tra có đoạn code `match /config/{docId}` không
3. Nếu có → Rules đã deploy ✅
4. Nếu không → Làm lại bước 3-4 ở trên

### **Cách 2: Test trực tiếp**
1. Mở Console trong browser (F12)
2. Chạy đoạn code này:

```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDPa37-e-Cn3_uKfibpfRFNerAJ7fD0i2Q",
  authDomain: "bang-biet-on.firebaseapp.com",
  projectId: "bang-biet-on",
  storageBucket: "bang-biet-on.firebasestorage.app",
  messagingSenderId: "713568812269",
  appId: "1:713568812269:web:5d4f097ed2b6361739a0e4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const configDoc = await getDoc(doc(db, "config", "ai_chatbox"));
console.log("Config exists:", configDoc.exists());
console.log("Config data:", configDoc.data());
```

3. Nếu thấy data → Rules đã hoạt động ✅
4. Nếu lỗi permission → Rules chưa deploy hoặc chưa có hiệu lực

---

## 🆘 NẾU VẪN KHÔNG HOẠT ĐỘNG

### **Option 1: Dùng test mode (Temporary)**
1. Vào Firestore Database → Rules
2. Thay rules bằng:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Publish
4. Test lại
5. **CHÚ Ý: ĐÂY CHỈ LÀ TEST MODE - KHÔNG AN TOÀN CHO PRODUCTION!**

### **Option 2: Cài Firebase CLI và deploy qua terminal**
```powershell
# Cài Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy rules
cd d:\Tool\QEthui\Bang-Biet-0n-0nline
firebase deploy --only firestore:rules
```

---

## 📸 HÌNH ẢNH THAM KHẢO

### **Tab Rules trong Firebase Console:**
```
┌────────────────────────────────────────────────────────┐
│  Firestore Database                                    │
├────────────────────────────────────────────────────────┤
│  Data  |  Rules  |  Indexes  |  Usage  |  ...          │
│        ▼                                               │
│  ┌──────────────────────────────────────────────────┐ │
│  │ rules_version = '2';                             │ │
│  │ service cloud.firestore {                        │ │
│  │   match /databases/{database}/documents {        │ │
│  │     match /gratitudes/{docId} {                  │ │
│  │       allow read: if true;                       │ │
│  │       ...                                        │ │
│  │     }                                            │ │
│  │                                                  │ │
│  │     // ← THÊM ĐOẠN NÀY                          │ │
│  │     match /config/{docId} {                     │ │
│  │       allow read: if true;                      │ │
│  │       allow write: if false;                    │ │
│  │     }                                           │ │
│  │   }                                             │ │
│  │ }                                               │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  [Publish] ← Click nút này                            │
└────────────────────────────────────────────────────────┘
```

---

## ✅ KẾT QUẢ MONG ĐỢI

Sau khi deploy rules thành công:

1. **Console log sẽ hiển thị:**
```
🔄 Loading API config from Firestore...
✅ Using Cloud Function (API key is secure)
   Function URL: https://us-central1-bang-biet-on.cloudfunctions.net/chatWithAI
✅ API config loaded successfully from Firestore
```

2. **Khi gửi message:**
```
📋 History BEFORE API call: []
🔄 Using Cloud Function (secure)...
✅ History AFTER Cloud Function: ["user", "assistant"]
```

3. **Chatbox sẽ trả lời bình thường!** 🎉
