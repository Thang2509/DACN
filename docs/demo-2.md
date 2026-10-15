# Kịch bản demo 2 (Đợt 3: 30/11–6/12)

## Chuẩn bị

1. Bật MySQL (XAMPP).
2. `cd backend && php artisan migrate:fresh --seed && php artisan serve`
3. Cửa sổ thứ hai: `cd backend && php artisan queue:work` (phát thưởng chạy qua hàng đợi, thiếu bước này sẽ không có XP/xu).
4. `cd frontend && npm run dev`, mở http://localhost:5173

Tài khoản (mật khẩu đều là `password`): `hocvien@eduquest.test` (có sẵn 1500 xu để demo), `giangvien@eduquest.test`, `admin@eduquest.test`.

Thanh toán dùng MoMo sandbox với bộ khóa test công khai (`MOMO_*` trong `.env`). Trên trang MoMo, chọn thẻ ATM nội địa và nhập thẻ test của MoMo: số `9704 0000 0000 0018`, tên `NGUYEN VAN A`, ngày phát hành `03/07`, OTP `OTP`; hoặc bấm "Quay về" để thử giao dịch bị hủy. Đơn chờ quá 100 phút (bằng hạn link MoMo) tự hết hạn. Email biên nhận gửi qua hàng đợi (cần `php artisan queue:work` ở bước 3, hoặc đặt `QUEUE_CONNECTION=sync` khi chạy backend bằng Apache XAMPP); với `MAIL_MAILER=log` email nằm trong `backend/storage/logs/laravel.log`.

## Luồng trình bày (~12 phút)

| # | Vai | Thao tác | Điểm cần nói |
| --- | --- | --- | --- |
| 1 | Học viên | Thú cưng → chọn 1 trong 3 trứng khởi đầu | Trứng low-poly dựng bằng code, lắc và nứt khoảng 2 giây rồi nở ngay thành thú mới nở |
| 2 | Học viên | Học 1 bài "SQL cơ bản" → Hoàn thành | Thông báo +XP/+xu hiện sau vài giây (Event → Listener qua hàng đợi) |
| 3 | Học viên | Menu Nhiệm vụ, Thành tích, Xếp hạng | Chuỗi ngày, nhiệm vụ ngày/tuần; lịch sử XP và xu lấy từ sổ cái `point_ledger` |
| 4 | Học viên | Cửa hàng → mua Cá nướng, Mũ tiệc, Khăn quàng; Nội thất: sofa, thảm tròn, ổ nằm | Trừ xu khóa dòng ví, thiếu xu thì từ chối, không ghi sổ cái |
| 5 | Học viên | Thú cưng → cho ăn, bấm Mũ tiệc, Khăn quàng; bấm sàn ném bóng, bấm vào thú | Thú chạy tới bát ăn (vụn thức ăn bay ra), nhặt bóng mang về, được vuốt ve thì bắn tim; trang bị gắn vào điểm neo đầu/cổ/lưng; thêm `?gio=21` vào URL để xem ban đêm (đèn bật, trăng sao) |
| 6 | Học viên | Cửa hàng → Trứng → mua trứng Nhím; Bộ sưu tập → chọn Nhím làm đồng hành | 8 loài; loài chưa có hiện bóng đen; chỉ thú đồng hành nhận XP |
| 7 | Học viên | Phòng → chọn Thảm tròn, rê chuột lên sàn, bấm đặt; chọn sofa, phím R xoay, đặt lên thảm → Lưu phòng | Lưới 8 × 8: xanh đặt được, đỏ bị chồng; thảm nằm dưới đồ khác; thú tự đi dạo tránh đồ (tìm đường theo lưới) |
| 8 | Học viên | Cửa hàng → Voucher → đổi "Giảm 10%" | Voucher có mã, hạn 30 ngày |
| 9 | Học viên | Khóa "JavaScript nền tảng" → chọn voucher → Thanh toán qua MoMo | Đơn `pending`, số tiền đã trừ voucher; chuyển sang trang MoMo sandbox |
| 10 | Học viên | Trên trang MoMo bấm "Quay về" → trang kết quả → Đơn hàng của tôi | Máy chủ kiểm tra chữ ký HMAC rồi tra cứu lại MoMo; giao dịch hủy thì voucher còn nguyên |
| 11 | Học viên | (Nếu thanh toán thật bằng app MoMo test) → "Vào học ngay" | Đơn `paid`, tự ghi danh, voucher đánh dấu đã dùng; IPN gọi nhiều lần vẫn chỉ xử lý 1 lần |

## Xem nhanh thú tiến hóa (tùy chọn)

Tiến hóa cần 3000 XP thú và chuỗi 7 ngày nên không đạt được trong buổi demo. Để minh họa, chạy:

```
php artisan tinker --execute "App\Models\UserPet::where('is_active', true)->update(['stage' => 'evolved', 'growth_xp' => 3100]);"
```

Mở lại trang Thú cưng: màn chúc mừng, lông đổi màu, vòng hào quang phát sáng (Bloom).

## Nguồn mô hình

- Thú cưng (8 loài: chó, mèo, thỏ, capybara, hamster, nhím), nội thất, trang bị và căn phòng đều dựng hoàn toàn bằng code three.js, không dùng file mô hình: thân thú dựng từ SDF thành một lưới liền có bộ xương, lông nhiều lớp bằng shader (nhím có gai cứng), chân đặt xuống sàn bằng IK; ánh sáng môi trường, bóng mềm và AO (N8AO). Trang `/design` xem cả 8 loài và từng tư thế.
