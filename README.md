# Bảng biết ơn online (2 màn hình)

Mục tiêu
- Màn hình 1: Nhập lời biết ơn ở vùng giống dòng chữ trên ảnh; chọn cảm xúc (Bad → Great).
- Màn hình 2: Tổng hợp theo màu cảm xúc và hiển thị các lời biết ơn ẩn danh, realtime.
- Giới hạn: mỗi người (client ẩn danh) 1 lần/ngày theo múi giờ Việt Nam.

## Chạy thử cục bộ
1. Tạo file `firebase-config.js` từ `firebase-config.sample.js` và dán cấu hình Firebase Web App của bạn.
2. Dùng bất kỳ HTTP server tĩnh (VS Code Live Server, `npx serve`, v.v.) để mở `index.html`.

## Deploy GitHub Pages
- Settings → Pages → Deploy from a branch → Branch: `main` / `root`.
- Trang sẽ xuất bản tại `https://<username>.github.io/bang-biet-on`.

## Cách làm việc
- `index.html` + `app.js`: nhập lời biết ơn và chọn cảm xúc. Nút gửi sẽ kiểm tra đã gửi hôm nay chưa.
- `board.html` + `board.js`: nghe realtime từ Firestore, hiển thị thống kê + lưới ghi chú.
- `firebase.js`: tích hợp Firebase, mô hình cảm xúc (`EMOTIONS`), limit 1 lần/ngày (docId = `clientId_dateKey`).
- `firestore.rules`: enforce chỉ tạo mới, đúng schema, đúng docId, không cho sửa/xoá.

## Tuỳ biến
- Màu sắc: sửa các biến trong `styles.css` (`--bad`, `--notgreat`, `--okay`, `--good`, `--great`).
- Ảnh thẻ: tuỳ ý thay phần `.artwork` (CSS) hoặc chèn `<img>` vào vùng polaroid.
- Nhãn cảm xúc: trong `firebase.js` → `EMOTIONS`.

## Quyền riêng tư
- Không thu thập tên/email. Chỉ lưu text, cảm xúc, thời điểm, `clientId` ẩn danh và `dateKey`.