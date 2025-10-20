# Bảng biết ơn online
Tác giả
- Quỳnh Anh - Digital Marketing (code)
- Minh Thịnh - Software Engineering (code,fix)
- Thảo Vi - Digital Marketing (idea)
  
Mục tiêu
- Màn hình 1: Nhập lời biết ơn ở vùng giống dòng chữ trên ảnh; chọn cảm xúc (Bad → Great).
- Màn hình 2: Tổng hợp theo màu cảm xúc và hiển thị các lời biết ơn ẩn danh, realtime.
- Giới hạn: mỗi người (client ẩn danh) 1 lần/ngày theo múi giờ Việt Nam.

## Cấu hình Firebase
- Firestore nên ở region `asia-southeast1` để giảm độ trễ ở VN.
- `firebase-config.js` đã được cấu hình.
- Firestore → Rules → dán `firestore.rules` → Publish.

## Chạy thử cục bộ
- Cần một HTTP server tĩnh:
  - Node: `npx serve -l 5173` → mở http://localhost:5173
  - Hoặc Python: `python -m http.server 8000` → mở http://localhost:8000
  - Hoặc VS Code “Live Server”.
- Trang vào: `index.html` → nhập lời biết ơn → chọn cảm xúc → Gửi → chuyển `board.html`.
