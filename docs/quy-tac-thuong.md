# Quy tắc thưởng EduQuest

Mọi lần cộng/trừ XP hoặc xu ghi vào `point_ledger` (chỉ thêm) với **khóa duy nhất** (`idempotency_key`); số dư `wallets` cập nhật trong cùng transaction. Trùng khóa = đã thưởng → bỏ qua. Mỗi dòng dưới đây có test PHPUnit riêng.

## 1. Kiếm XP và xu

| Mã | Sự kiện | XP | Xu | Khóa duy nhất | Giới hạn |
| --- | --- | --- | --- | --- | --- |
| R01 | Hoàn thành bài học lần đầu | 20 | 5 | `lesson_completed:{user}:{lesson}` | 1 lần/bài |
| R02 | Trả lời đúng câu quiz lần đầu | 5 | 0 | `quiz_correct:{user}:{block}:{question}` | 1 lần/câu |
| R03 | Làm đúng 100% quiz ngay lần thử đầu tiên | 10 | 2 | `quiz_perfect:{user}:{block}` | 1 lần/khối |
| R04 | Hoàn thành khóa học (mọi bài xong) | 200 | 50 | `course_completed:{user}:{course}` | 1 lần/khóa |
| R05 | Ôn 1 thẻ flashcard đến hạn | 1 | 0 | `flashcard:{user}:{block}:{card}:{date}` | tối đa 30 XP/ngày |
| R06 | Giữ chuỗi ngày (ngày có ≥ 1 bài hoàn thành) | 0 | 5 | `streak_day:{user}:{date}` | 1 lần/ngày |
| R07 | Mốc chuỗi 7 / 30 / 100 ngày | 0 | 30 / 150 / 500 | `streak_milestone:{user}:{started_on}:{days}` | 1 lần/mốc/chuỗi |
| R08 | Hoàn thành nhiệm vụ ngày | theo `quests` | theo `quests` | `quest:{user}:{quest}:{period_start}` | 1 lần/kỳ |
| R09 | Hoàn thành nhiệm vụ tuần | theo `quests` | theo `quests` | như R08 | 1 lần/kỳ |
| R10 | Lên cấp | 0 | 10 × cấp mới | `level_up:{user}:{level}` | 1 lần/cấp |
| R11 | Đạt huy hiệu | 0 | theo huy hiệu | `badge:{user}:{badge}` | 1 lần/huy hiệu |
| R12 | Chơi minigame | 0 | điểm ÷ 100, tối đa 5 | `minigame:{user}:{date}:{lượt 1–4}` | 4 lượt thưởng/ngày |

Nhiệm vụ mặc định:

| Kỳ | Nhiệm vụ | Mục tiêu | Thưởng |
| --- | --- | --- | --- |
| Ngày | Hoàn thành 1 bài học | 1 | 15 XP, 10 xu |
| Ngày | Trả lời đúng 5 câu quiz | 5 | 10 XP, 5 xu |
| Ngày | Ôn 10 thẻ flashcard | 10 | 10 XP, 5 xu |
| Tuần | Hoàn thành 5 bài học | 5 | 50 XP, 40 xu |
| Tuần | Học 4 ngày trong tuần | 4 | 40 XP, 30 xu |

## 2. Cấp độ

XP cần để lên từ cấp `n` lên `n+1` là `100 × n` → tổng XP để đạt cấp `n` = `50 × n × (n − 1)`.

| Cấp | 1 | 2 | 3 | 4 | 5 | 10 | 20 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Tổng XP | 0 | 100 | 300 | 600 | 1 000 | 4 500 | 19 000 |

Công thức tính cấp từ XP: `cấp = floor((1 + √(1 + 8·XP/100)) / 2)`.

## 3. Chuỗi ngày

- Một ngày "có học" khi hoàn thành ≥ 1 bài (theo giờ Việt Nam, `Asia/Ho_Chi_Minh`).
- Học hôm nay và hôm qua cũng học → `current_days + 1`; bỏ ≥ 1 ngày → về 1, `started_on` = hôm nay.
- `longest_days` = max lịch sử.

## 4. Tiêu xu

| Mục | Giá (xu) | Khóa duy nhất |
| --- | --- | --- |
| Voucher giảm 10% (tối đa 50 000đ, hạn 30 ngày) | 200 | `voucher:{user_voucher_id}` |
| Voucher giảm 25% (tối đa 150 000đ, hạn 30 ngày) | 500 | như trên |
| Thức ăn thú cưng | 10–30 | `item:{user}:{uuid}` |
| Trang bị / nội thất | 50–300 | như trên |
| Trứng loài mới (bộ sưu tập) | 500 | `egg:{user}:{species}` |

- Trừ xu: khóa dòng `wallets` (`lockForUpdate`), số dư không đủ → từ chối, không ghi ledger.
- Mỗi đơn hàng dùng tối đa 1 voucher; voucher chỉ bị đánh dấu dùng khi đơn `paid`.

## 5. Thú cưng

| Sự kiện | Đầy bụng | Vui | Năng lượng | XP thú |
| --- | --- | --- | --- | --- |
| Hoàn thành bài học | +15 | +10 | 0 | +50% XP người dùng nhận |
| Quiz đúng | 0 | +2 | 0 | như trên |
| Cho ăn (dùng thức ăn) | theo vật phẩm | +5 | 0 | 0 |
| Chơi minigame | 0 | +15 | −10 | 0 |
| Ngủ (mỗi giờ) | 0 | 0 | +20 | 0 |
| Mỗi giờ trôi qua | −3 | −2 | −1 | 0 |

- Chỉ số nằm trong 0–100, tính lại khi đọc dựa trên `stats_updated_at` (không cần cron mỗi giờ).
- Trứng nở ngay khi nhận (không cần ấp), thú bắt đầu ở giai đoạn mới nở. Giai đoạn theo XP thú: mới nở (0) → con non (300) → trưởng thành (1 000) → tiến hóa (3 000 và chuỗi ≥ 7 ngày).
- Tâm trạng hiển thị: vui nếu cả 3 chỉ số ≥ 60, buồn nếu có chỉ số < 25, ngủ nếu năng lượng < 15.

## 6. Chống gian lận

- Mọi phần thưởng tính ở backend dựa trên dữ liệu đã lưu; frontend chỉ hiển thị.
- Không thưởng cho khóa học của chính giảng viên đó.
- Các khóa duy nhất bảo đảm gọi lại API hoặc chạy lại job không cộng điểm 2 lần.

## 7. Ôn tập flashcard (SM-2)

- Thẻ trong khối flashcard của bài đã hoàn thành vào hàng ôn, đến hạn ngay hôm đó.
- Mỗi lần ôn chọn mức nhớ: Quên (q = 1), Khó (3), Nhớ (4), Dễ (5).
- Độ dễ mới `EF' = max(1,3; EF + 0,1 − (5 − q)(0,08 + (5 − q) × 0,02))`.
- q < 3: học lại, ôn sau 1 ngày. Nhớ: lần 1 sau 1 ngày, lần 2 sau 6 ngày, sau đó `khoảng cũ × EF`.
- Chỉ ôn thẻ **đến hạn** mới được thưởng R05 và tính vào nhiệm vụ "Ôn 10 thẻ flashcard".

## 8. Huy hiệu

| Huy hiệu | Điều kiện | Xu |
| --- | --- | --- |
| Bước đầu tiên | Hoàn thành 1 bài | 10 |
| Chăm chỉ / Học giả | Hoàn thành 10 / 30 bài | 30 / 80 |
| Về đích | Hoàn thành 1 khóa | 50 |
| Lửa bền bỉ / Không bỏ cuộc | Chuỗi dài nhất 7 / 30 ngày | 30 / 150 |
| Ngôi sao mới / Ngôi sao sáng | Đạt cấp 5 / 10 | 30 / 80 |
| Bách phát bách trúng | 10 quiz đúng hết ngay lần đầu | 40 |
| Trí nhớ vàng | Ôn flashcard 100 lượt | 40 |
| Nhà sưu tầm | Có 3 loài thú | 50 |
| Tay chơi | 500 điểm trong một minigame | 20 |

- Kiểm tra sau mỗi lần phát thưởng (bài học, quiz, ôn thẻ, minigame) và sau khi mua trứng.
- Quản trị viên thêm/sửa/tắt huy hiệu ở trang Quản trị → Phần thưởng.

## 9. Minigame

| Game | Cách tính điểm |
| --- | --- |
| Vượt chướng ngại | 1 điểm mỗi đơn vị quãng đường; tốc độ 5 → 12 đơn vị/giây |
| Hứng từ khóa code | +10 mỗi chữ đúng chủ đề; hứng sai mất 1 trong 3 mạng; tối đa 60 giây |

- Điểm gửi lên bị từ chối nếu vượt 40 điểm/giây chơi (chống gửi điểm giả).
- 4 lượt đầu mỗi ngày được thưởng R12; lượt nào cũng làm thú vui +15, năng lượng −10.
