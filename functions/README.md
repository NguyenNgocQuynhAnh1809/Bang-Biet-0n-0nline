# 🔐 Firebase Cloud Functions - AI Chatbox

## 📝 Mô tả

Cloud Function này đóng vai trò là proxy giữa frontend và Perplexity API, giúp bảo mật API key.

## 🔧 Setup

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Set API key

```bash
firebase functions:config:set perplexity.key="YOUR_API_KEY_HERE"
```

### 3. Deploy

```bash
cd ..
firebase deploy --only functions
```

## 🔌 Functions

### `chatWithAI` (HTTPS Endpoint)

- **Method:** POST
- **URL:** `https://us-central1-bang-biet-on.cloudfunctions.net/chatWithAI`
- **Request Body:**

```json
{
  "message": "Hello",
  "history": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello!" }
  ]
}
```

- **Response:**

```json
{
  "success": true,
  "response": "AI response here..."
}
```

### `getAIChatResponse` (Legacy Callable)

- Giữ lại để tương thích với code cũ
- Dùng `firebase.functions().httpsCallable()`

## 🧪 Test Local

```bash
# Chạy emulator
firebase emulators:start --only functions

# Test endpoint
curl -X POST http://localhost:5001/bang-biet-on/us-central1/chatWithAI \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","history":[]}'
```

## 📦 Dependencies

- `firebase-admin`: Quản lý Firebase services
- `firebase-functions`: Tạo Cloud Functions
- `cors`: Xử lý CORS cho HTTPS requests
- `node-fetch`: Gọi external APIs (Perplexity)

## 🔒 Security

- ✅ API key được lưu trong Functions Config (không public)
- ✅ CORS enabled cho frontend
- ✅ Error handling với fallback responses
- ✅ Input validation

## 💡 Notes

- API key **KHÔNG BAO GIỜ** được commit lên Git
- File `.runtimeconfig.json` đã được thêm vào `.gitignore`
- Config được lưu server-side, frontend không thể truy cập
