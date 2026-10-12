# EduQuest 2.0 (tên chính thức đặt sau)

Đồ án Chuyên ngành: **Xây dựng hệ thống học tập trực tuyến tích hợp đổi thưởng**.
Sinh viên: Võ Quốc Thắng · GVHD: ThS. Phạm Thị Trúc Mai.
Plan đầy đủ: https://claude.ai/code/artifact/c094295d-140b-4d74-9f09-fb8f453e4df9

## Quy tắc làm việc (bắt buộc)

- **Có thắc mắc phải hỏi trước khi làm.** Trước mỗi tính năng mới, hỏi các yêu cầu còn thiếu rồi mới viết code.
- **Cấu trúc thật sạch.** Không tạo thư mục, file, lớp trừu tượng hay thư viện khi chưa thật sự cần. Ưu tiên ít file, tên rõ nghĩa.
- **Chỉ dùng công nghệ trong danh sách bên dưới.** Muốn thêm thư viện mới phải hỏi và nêu lý do.
- Code dễ đọc cho sinh viên: hàm ngắn, đặt tên rõ, chỉ comment chỗ khó hiểu (viết tiếng Việt).
- Làm xong mỗi phần: chạy test liên quan, tóm tắt ngắn những gì đã thay đổi.

## Phạm vi

- Ứng dụng web, 3 vai trò: học viên, giảng viên, quản trị viên.
- Khóa học chỉ thuộc lĩnh vực lập trình/IT, có cấp độ Beginner, Intermediate, Advanced.
- Bài học tổ chức theo kiểu Sydexa (sydexa.com): mỗi bài là chuỗi khối nội dung.
- Thanh toán chỉ dùng MoMo sandbox. Video nhúng từ link ngoài hoặc tệp MP4.
- **Không làm:** AI, cấp chứng chỉ, app di động, hạ tầng lưu video riêng. Deploy làm sau cùng.
- Demo trước 3 khóa: **SQL cơ bản, JavaScript nền tảng, Cấu trúc dữ liệu & giải thuật** (mỗi khóa 8–10 bài). Sau này thêm khoảng 40 khóa qua import Markdown.

## Công nghệ

| Phần | Dùng |
| --- | --- |
| Frontend | React + Vite (**JavaScript**, không TypeScript), React Router, TanStack Query, Tailwind CSS, CodeMirror, sql.js |
| 3D | Three.js qua React Three Fiber, drei, @react-three/postprocessing; mô hình glTF **low-poly** |
| Backend | Laravel (PHP ≥ 8.2), Sanctum (cookie SPA); Queue và Cache dùng driver `database` |
| CSDL | MySQL chạy trên **XAMPP** |
| Kiểm thử | PHPUnit, Vitest |

Đã bỏ, không dùng: TypeScript, Redis, Zustand, shadcn/ui, Framer Motion, Sandpack, Pyodide, thư viện vật lý, Docker (chỉ dùng khi deploy).

## Cấu trúc thư mục

```
eduquest/
├── backend/                  Laravel, giữ cấu trúc chuẩn
│   ├── app/
│   │   ├── Http/Controllers/  mỗi tính năng 1 controller
│   │   ├── Http/Requests/     kiểm tra dữ liệu gửi lên
│   │   ├── Models/
│   │   ├── Services/          nghiệp vụ: RewardService, PaymentService…
│   │   ├── Events/
│   │   ├── Listeners/
│   │   └── Console/Commands/  lệnh import nội dung
│   ├── database/              migrations, seeders
│   ├── routes/api.php
│   └── tests/
├── frontend/
│   ├── public/models/         file .glb thú cưng
│   └── src/
│       ├── main.jsx
│       ├── App.jsx            router + layout
│       ├── lib/api.js         gọi API dùng chung
│       ├── components/        component dùng ở nhiều tính năng
│       └── features/          auth, courses, lesson, gamification, pet, payment, admin
├── content/                   bài học Markdown để import
└── CLAUDE.md
```

- Mỗi thư mục trong `features/` chứa trang, component riêng và một file `api.js` của tính năng đó. Chỉ tạo thư mục con khi một tính năng có quá nhiều file.
- Backend: Controller chỉ nhận và kiểm tra dữ liệu, nghiệp vụ nằm ở Service. Không thêm tầng Repository.

## Nội dung bài học

- Cấu trúc: Lộ trình → Khóa học → Chương → Bài học → Khối nội dung.
- Loại khối: văn bản Markdown, video, quiz (có giải thích), animation tương tác (component React bằng SVG + CSS, có tham số), code sandbox (JavaScript trong iframe cách ly, SQL bằng sql.js), flashcard tổng kết.
- Bài lưu trong bảng `lesson_blocks`: loại khối + nội dung JSON + thứ tự.
- Nhập nội dung 2 cách: giao diện kéo-thả khối cho giảng viên, và `php artisan content:import content/<khoa-hoc>` từ file Markdown. Định dạng file Markdown sẽ chốt khi làm tính năng import.
- Flashcard ôn tập lặp lại ngắt quãng (SM-2). Không làm tính năng ghi chú bài học (đã bỏ).

## Trò chơi hóa

- XP và cấp độ, xu (điểm thưởng), chuỗi ngày học, nhiệm vụ ngày/tuần, kế hoạch học tập, bảng xếp hạng, huy hiệu, voucher giảm giá khi mua khóa học.
- Phát thưởng theo sự kiện: Service bắn Event (vd. `LessonCompleted`) → Listener chạy qua hàng đợi xử lý thưởng.
- **Toàn vẹn điểm:** mọi lần phát thưởng ghi vào `point_ledger` (chỉ thêm, không sửa) với khóa duy nhất, ví dụ `lesson_completed:{user}:{lesson}`; số dư ví cập nhật trong cùng transaction. Mỗi quy tắc thưởng phải có test PHPUnit.

## Thú cưng 3D (trọng tâm, cần đẹp nhất)

- Phong cách low-poly, mô hình glTF có khung xương (nguồn CC0 như Quaternius, Kenney; chỉnh trong Blender), nén Draco.
- Hoạt ảnh: đứng, đi, chạy, nhảy, ăn, ngủ, vui, buồn; trộn hoạt ảnh mượt.
- Vòng đời: trứng → nở → con non → trưởng thành → tiến hóa. Chỉ số no, vui, năng lượng tăng khi học.
- Bộ sưu tập 6–8 loài (bắt đầu với 3), trang bị gắn vào xương, phòng thú cưng 3D, 2 minigame (tự xử lý va chạm).

## Tiến độ (theo đề cương)

| Giai đoạn | Việc chính |
| --- | --- |
| 11–18/10 | Tạo repo, cấu hình XAMPP, design system; làm thử 1 thú cưng có hoạt ảnh |
| Đợt 1: 19–25/10 | Use Case, quy tắc thưởng, ERD, kiến trúc; báo cáo chương 1 |
| 26/10–8/11 | Migration, dữ liệu mẫu, tài khoản, phân quyền, quản lý khóa học/bài, trình soạn khối |
| Đợt 2: 9–15/11 | Tìm kiếm, lọc, đăng ký khóa; trình học bài đủ khối; tiến độ; demo 1 |
| 16–29/11 | Sổ cái điểm, XP, cấp độ, chuỗi ngày, nhiệm vụ; 3 loài thú đầu và vòng đời |
| Đợt 3: 30/11–6/12 | Voucher, MoMo sandbox, bộ sưu tập, trang bị, phòng thú cưng; demo 2 |
| 7–20/12 | Minigame, ôn tập flashcard, bảng xếp hạng, huy hiệu, quản trị, thống kê, test |
| Đợt 4: 21–27/12 | Kiểm thử, sửa lỗi, tối ưu, hoàn thiện giao diện; báo cáo, poster, slide |

## Trước khi bắt đầu

Kiểm tra: `php -v` (≥ 8.2), `composer -V`, `node -v`. XAMPP đã bật Apache và MySQL.
