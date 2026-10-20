# Checklist 10 task theo đề BrewLite (2026–2027)

**Phân biệt:** "đã viết mã nguồn" không đồng nghĩa "đã đạt Definition of Done". Cần chạy build/test/demo và có Git commit được review.

| Task | Sprint | Phạm vi trong bản dễ hiểu | Cần xác minh/bàn giao |
|---|---|---|---|
| 1. Khởi tạo project | 1 | Monorepo frontend Next.js + backend NestJS, README, .env | npm install/build, Git, Hello/health |
| 2. GET /products | 1 | Controller + PostgreSQL seed 32 món | GET thật từ backend |
| 3. Trang Menu | 1 | Component Menu, loading/error/empty | Dữ liệu API lên giao diện |
| 4. Chi tiết sản phẩm | 1 | Popup size S/M/L, topping, tính tạm tiền | Kiểm tra nhiều tổ hợp |
| 5. Giỏ hàng | 2 | Context; tăng/giảm/xóa, tổng tiền, badge, localStorage | Kiểm tra sau refresh |
| 6. POST /orders | 2 | Validate + lưu đơn PENDING + trừ kho transactional | Kiểm tra stock, giá từ DB |
| 7. JWT | 2 | bcrypt, đăng ký, đăng nhập, JWT guard | Token sai/hết hạn bị 401 |
| 8. Ví/Thẻ mock | 3 | POST /payments; PAID/PAYMENT_FAILED | Thử thành công & lỗi |
| 9. Xác nhận/lịch sử/bàn giao | 3 | Mã đơn PAID, GET /orders/me, Compose/README | Demo 3 container end-to-end |
| 10. Nghiệp vụ nâng cao | 3 | State machine, Idempotency-Key, optimistic stock, voucher/loyalty | Test thật (a), (b), (c) theo đề; integration DB |

## Kế hoạch nhóm cần tự bổ sung

- **Roles:** Product Owner, Scrum Master, Development Team (điền tên người phụ trách).
- **Events:** Sprint Planning, Daily Scrum, Sprint Review, Sprint Retrospective (biên bản/ngày tháng).
- **Artifacts:** Product Backlog (bảng trên là điểm khởi đầu), Sprint Backlog, Increment; Burndown cuối mỗi ngày.
- **DoD:** source chạy được không lỗi build, test/validate, commit Git + review, README có cách chạy.
- **Bàn giao:** repo Git, hướng dẫn cấu hình, demo đặt hàng end-to-end và Sprint Retrospective.

Đề yêu cầu phản hồi API <500ms với dữ liệu mẫu; **chưa đo benchmark**. Nên dùng công cụ đo nhiều lượt sau khi backend chạy ổn định.
