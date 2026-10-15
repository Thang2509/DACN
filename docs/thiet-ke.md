# Phân tích & thiết kế hệ thống EduQuest

Tài liệu Đợt 1 (19–25/10): tác nhân, Use Case, ERD, kiến trúc. Quy tắc thưởng xem [quy-tac-thuong.md](quy-tac-thuong.md).

## 1. Tác nhân

| Tác nhân | Mô tả |
| --- | --- |
| Khách | Chưa đăng nhập: xem trang chủ, danh sách và chi tiết khóa học, bài học thử |
| Học viên | Học bài, ôn flashcard, nhận thưởng, nuôi thú cưng, mua khóa học |
| Giảng viên | Học viên được quản trị viên cấp quyền; soạn khóa học, chương, bài, khối nội dung |
| Quản trị viên | Quản lý người dùng, duyệt khóa học, cấu hình nhiệm vụ/huy hiệu/voucher, xem thống kê |
| MoMo (hệ thống ngoài) | Cổng thanh toán sandbox, gọi IPN báo kết quả giao dịch |
| Bộ lập lịch (hệ thống) | Chạy định kỳ: làm mới nhiệm vụ, giảm chỉ số thú cưng, chốt bảng xếp hạng tuần |

Học viên, Giảng viên, Quản trị viên kế thừa "Người dùng đã đăng nhập" (đăng nhập, đăng xuất, hồ sơ, đổi mật khẩu).

## 2. Use Case

### 2.1 Khách và người dùng đã đăng nhập

```mermaid
flowchart LR
  K((Khách))
  N((Người dùng))
  K --- UC01([UC01 Đăng ký tài khoản])
  K --- UC02([UC02 Đăng nhập])
  K --- UC03([UC03 Quên mật khẩu])
  K --- UC04([UC04 Xem, tìm kiếm, lọc khóa học])
  K --- UC05([UC05 Học thử bài miễn phí])
  N --- UC06([UC06 Xác thực email])
  N --- UC07([UC07 Cập nhật hồ sơ, ảnh đại diện])
  N --- UC08([UC08 Đổi mật khẩu])
  N --- UC09([UC09 Đăng xuất])
```

### 2.2 Học viên

```mermaid
flowchart LR
  HV((Học viên))
  MM((MoMo))
  HV --- UC10([UC10 Đăng ký khóa miễn phí])
  HV --- UC11([UC11 Mua khóa học qua MoMo])
  UC11 --- MM
  UC11 -. include .-> UC12([UC12 Áp dụng voucher])
  HV --- UC13([UC13 Học bài theo khối nội dung])
  UC13 -. extend .-> UC14([UC14 Làm quiz])
  UC13 -. extend .-> UC15([UC15 Chạy code sandbox])
  HV --- UC17([UC17 Ôn tập flashcard SM-2])
  HV --- UC18([UC18 Xem tiến độ, XP, cấp, chuỗi ngày])
  HV --- UC19([UC19 Làm nhiệm vụ ngày/tuần])
  HV --- UC20([UC20 Lập kế hoạch học tập])
  HV --- UC21([UC21 Xem bảng xếp hạng, huy hiệu])
  HV --- UC22([UC22 Đổi xu lấy voucher])
  HV --- UC23([UC23 Nuôi thú cưng: cho ăn, chơi, ngủ])
  HV --- UC24([UC24 Mua, trang bị vật phẩm])
  HV --- UC25([UC25 Trang trí phòng thú cưng])
  HV --- UC26([UC26 Chơi minigame])
```

### 2.3 Giảng viên và Quản trị viên

```mermaid
flowchart LR
  GV((Giảng viên))
  QT((Quản trị viên))
  GV --- UC30([UC30 Tạo, sửa khóa học])
  GV --- UC31([UC31 Quản lý chương, bài học])
  GV --- UC32([UC32 Soạn khối nội dung kéo-thả])
  GV --- UC33([UC33 Gửi khóa học chờ duyệt])
  GV --- UC34([UC34 Xem thống kê khóa học của mình])
  QT --- UC40([UC40 Quản lý người dùng, cấp vai trò])
  QT --- UC41([UC41 Duyệt / từ chối khóa học])
  QT --- UC42([UC42 Quản lý lộ trình học])
  QT --- UC43([UC43 Cấu hình nhiệm vụ, huy hiệu, voucher])
  QT --- UC44([UC44 Import khóa học từ Markdown])
  QT --- UC45([UC45 Xem thống kê hệ thống, đơn hàng])
```

### 2.4 Đặc tả Use Case chính

**UC13 – Học bài theo khối nội dung**

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Học viên (đã đăng ký khóa) |
| Tiền điều kiện | Đã đăng nhập, đã đăng ký khóa học (hoặc bài cho học thử) |
| Luồng chính | 1. Mở bài học → 2. Hệ thống tải danh sách khối theo thứ tự → 3. Học viên lần lượt xem văn bản, video, làm quiz, chạy code → 4. Bấm "Hoàn thành bài" → 5. Hệ thống ghi tiến độ, bắn sự kiện `LessonCompleted` → 6. Listener phát XP, xu, cập nhật chuỗi ngày, nhiệm vụ, chỉ số thú cưng → 7. Hiển thị phần thưởng |
| Luồng phụ | 4a. Bài đã hoàn thành trước đó: chỉ ghi tiến độ, không phát thưởng lại (khóa duy nhất trong `point_ledger`) |
| Hậu điều kiện | `lesson_progress` có bản ghi, `point_ledger` thêm tối đa một bản ghi cho mỗi quy tắc |

**UC11 – Mua khóa học qua MoMo**

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Học viên, MoMo |
| Luồng chính | 1. Chọn "Mua khóa" → 2. (Tùy chọn) chọn voucher → 3. Hệ thống tạo `orders` trạng thái `pending`, gọi API MoMo lấy `payUrl` → 4. Chuyển sang trang MoMo sandbox → 5. MoMo gọi IPN về backend → 6. Kiểm tra chữ ký, cập nhật đơn `paid`, tạo `enrollments`, đánh dấu voucher đã dùng (cùng transaction) → 7. Học viên quay lại trang kết quả |
| Luồng phụ | 6a. Chữ ký sai hoặc số tiền lệch: bỏ qua, ghi log. 6b. Giao dịch thất bại: đơn `failed` kèm lý do (hủy trên MoMo, không đủ tiền…), voucher không bị trừ. 6c. Đơn chờ quá 100 phút (bằng thời hạn link thanh toán MoMo): tra cứu MoMo lần cuối rồi đóng đơn, trả voucher. 6d. Học viên bấm "Thanh toán tiếp" (dùng lại link MoMo cũ) hoặc "Hủy đơn" |
| Ràng buộc | IPN có thể gọi nhiều lần → xử lý idempotent theo `momo_order_id`, email biên nhận chỉ gửi một lần. Mỗi khóa chỉ có một đơn chờ; voucher gắn vào đơn chờ bị giữ, không dùng cho đơn khác. Tiền đã trừ thì luôn ghi danh, kể cả đơn vừa bị đóng |

**UC33/UC41 – Gửi và duyệt khóa học**

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Giảng viên, Quản trị viên |
| Luồng chính | 1. Giảng viên bấm "Gửi duyệt" (khóa có ít nhất 1 bài) → trạng thái `pending` → 2. Quản trị viên xem danh sách chờ duyệt → 3. Duyệt: `published`, ghi `published_at` / Từ chối: `rejected` kèm `review_note` → 4. Giảng viên sửa khóa bị từ chối và gửi lại |
| Ràng buộc | Chỉ khóa `published` hiện với học viên. Sửa khóa đã xuất bản không cần duyệt lại (đơn giản hóa) |

## 3. ERD

Quy ước: mọi bảng có `id` và `created_at/updated_at` trừ khi ghi khác; khóa ngoại xóa theo (`cascade`) với dữ liệu con. Bảng mặc định của Laravel (`sessions`, `cache`, `jobs`, `password_reset_tokens`…) không vẽ.

### 3.1 Tài khoản & nội dung

```mermaid
erDiagram
  users ||--o{ courses : "giảng dạy"
  learning_paths ||--o{ course_learning_path : ""
  courses ||--o{ course_learning_path : ""
  courses ||--o{ chapters : "gồm"
  chapters ||--o{ lessons : "gồm"
  lessons ||--o{ lesson_blocks : "gồm"

  users {
    bigint id PK
    string name
    string email UK
    timestamp email_verified_at
    string password
    enum role "student | instructor | admin"
    string avatar_path
    text bio
  }
  learning_paths {
    bigint id PK
    string title
    string slug UK
    text description
  }
  course_learning_path {
    bigint learning_path_id FK
    bigint course_id FK
    int position
  }
  courses {
    bigint id PK
    bigint instructor_id FK
    string title
    string slug UK
    string summary
    text description
    enum level "beginner | intermediate | advanced"
    string category "database | frontend | backend | algorithms | devops | security"
    text playground_sql "SQL tạo bảng mẫu cho SQL Playground"
    string thumbnail_path
    int price "VND, 0 = miễn phí"
    enum status "draft | pending | published | rejected"
    text review_note
    timestamp published_at
  }
  chapters {
    bigint id PK
    bigint course_id FK
    string title
    int position
  }
  lessons {
    bigint id PK
    bigint chapter_id FK
    string title
    string slug "duy nhất trong khóa"
    text summary
    int duration_minutes
    int position
    bool is_preview "cho học thử"
  }
  lesson_blocks {
    bigint id PK
    bigint lesson_id FK
    enum type "section | markdown | video | quiz | animation | code | flashcard"
    json content
    int position
  }
```

### 3.2 Học tập

```mermaid
erDiagram
  users ||--o{ enrollments : ""
  courses ||--o{ enrollments : ""
  users ||--o{ lesson_progress : ""
  lessons ||--o{ lesson_progress : ""
  users ||--o{ quiz_attempts : ""
  lesson_blocks ||--o{ quiz_attempts : ""
  users ||--o{ flashcard_reviews : ""
  lesson_blocks ||--o{ flashcard_reviews : ""
  users ||--o| study_plans : ""

  enrollments {
    bigint user_id FK "UK(user_id, course_id)"
    bigint course_id FK
    bigint order_id FK "null nếu miễn phí"
    timestamp completed_at
  }
  lesson_progress {
    bigint user_id FK "UK(user_id, lesson_id)"
    bigint lesson_id FK
    timestamp completed_at
  }
  quiz_attempts {
    bigint user_id FK
    bigint lesson_block_id FK
    json answers "null ở câu chưa trả lời"
    int correct_count
    timestamp completed_at "trả lời hết câu mới xong"
  }
  flashcard_reviews {
    bigint user_id FK "UK(user, block, card_index)"
    bigint lesson_block_id FK
    int card_index
    decimal easiness "SM-2, mặc định 2.5"
    int interval_days
    int repetitions "số lần nhớ liên tiếp"
    int review_count "tổng số lần ôn"
    date due_on
    timestamp last_reviewed_at
  }
  study_plans {
    bigint user_id PK
    json study_days "thứ theo ISO, vd [1,3,5]"
    int lessons_per_day
  }
```

### 3.3 Trò chơi hóa & thanh toán

```mermaid
erDiagram
  users ||--|| wallets : ""
  users ||--o{ point_ledger : ""
  users ||--|| streaks : ""
  quests ||--o{ user_quests : ""
  users ||--o{ user_quests : ""
  badges ||--o{ user_badges : ""
  users ||--o{ user_badges : ""
  vouchers ||--o{ user_vouchers : ""
  users ||--o{ user_vouchers : ""
  users ||--o{ orders : ""
  courses ||--o{ orders : ""
  user_vouchers |o--o| orders : "dùng cho"

  wallets {
    bigint user_id PK
    int xp
    int level
    int coins "luôn >= 0"
  }
  point_ledger {
    bigint id PK
    bigint user_id FK
    string reason
    int xp
    int coins "âm khi tiêu"
    string idempotency_key UK
    json meta
    timestamp created_at "chỉ thêm, không sửa"
  }
  streaks {
    bigint user_id PK
    int current_days
    int longest_days
    date last_active_on
    date started_on
  }
  quests {
    bigint id PK
    string code UK
    string title
    enum period "daily | weekly"
    string target_type "lessons_completed | quiz_correct | ..."
    int target_value
    int reward_xp
    int reward_coins
    bool is_active
  }
  user_quests {
    bigint user_id FK "UK(user, quest, period_start)"
    bigint quest_id FK
    date period_start
    int progress
    timestamp completed_at
  }
  badges {
    bigint id PK
    string code UK
    string name
    string description
    string icon "emoji"
    string condition_type
    int condition_value
    int reward_coins
    bool is_active
  }
  user_badges {
    bigint user_id FK
    bigint badge_id FK
    timestamp earned_at
  }
  vouchers {
    bigint id PK
    string name
    int discount_percent
    int max_discount
    int coin_cost
    int valid_days
    bool is_active
  }
  user_vouchers {
    bigint id PK
    bigint user_id FK
    bigint voucher_id FK
    string code UK
    date expires_on
    timestamp used_at
  }
  orders {
    bigint id PK
    bigint user_id FK
    bigint course_id FK
    bigint user_voucher_id FK
    int original_price
    int discount
    int amount
    enum status "pending | paid | failed"
    string momo_order_id UK
    string momo_trans_id
    string pay_url "link MoMo để thanh toán tiếp"
    string failure_reason
    timestamp paid_at
    timestamp expires_at "tạo đơn + 100 phút"
  }
```

### 3.4 Thú cưng

```mermaid
erDiagram
  pet_species ||--o{ user_pets : ""
  users ||--o{ user_pets : ""
  users ||--o{ user_items : "kho đồ"
  pet_items ||--o{ user_items : ""
  user_pets ||--o{ pet_equipment : ""
  pet_items ||--o{ pet_equipment : ""
  users ||--o{ room_items : ""
  pet_items ||--o{ room_items : ""
  users ||--o{ minigame_scores : ""

  pet_species {
    bigint id PK
    string code UK
    string name
    string description
    string egg_color "màu trứng"
    int egg_price "xu"
    bool is_starter "chọn được làm trứng đầu tiên"
  }
  user_pets {
    bigint id PK
    bigint user_id FK
    bigint pet_species_id FK
    string nickname
    enum stage "hatchling | baby | adult | evolved"
    int growth_xp
    int fullness "0-100"
    int happiness "0-100"
    int energy "0-100"
    bool is_sleeping
    bool is_active
    timestamp stats_updated_at
  }
  pet_items {
    bigint id PK
    string code UK
    string name
    enum type "food | accessory | furniture"
    string bone_slot "head | neck | back"
    int price "xu"
    json effect "thức ăn: fullness; thảm: floor"
    int size_x "số ô chiếm trên sàn"
    int size_z
  }
  user_items {
    bigint user_id FK "UK(user, item)"
    bigint pet_item_id FK
    int quantity
  }
  pet_equipment {
    bigint user_pet_id FK "UK(pet, slot)"
    string slot
    bigint pet_item_id FK
  }
  room_items {
    bigint user_id FK
    bigint pet_item_id FK
    int x "ô trên lưới 8 x 8"
    int z
    int rotation "số lần xoay 90 độ"
  }
  minigame_scores {
    bigint user_id FK
    string game "runner | keywords"
    int score
    int duration_seconds
    timestamp created_at
  }
```

## 4. Kiến trúc

### 4.1 Tổng thể

```mermaid
flowchart LR
  subgraph Client[Trình duyệt]
    SPA[React SPA<br/>Router · TanStack Query · Tailwind]
    R3F[Three.js / R3F<br/>thú cưng 3D]
    SBX[iframe cách ly JS<br/>sql.js]
  end
  subgraph Server[Laravel API]
    MW[Middleware<br/>Sanctum · role · throttle]
    C[Controllers + Form Requests]
    S[Services<br/>Course · Reward · Payment · Pet]
    E[Events → Queue database → Listeners]
    M[Eloquent Models]
  end
  DB[(MySQL / XAMPP)]
  MOMO[MoMo sandbox]
  SPA -- "JSON qua /api, cookie phiên + XSRF" --> MW --> C --> S --> M --> DB
  S --> E --> S
  S -- "tạo giao dịch" --> MOMO
  MOMO -- "IPN" --> C
```

- **SPA + API:** React gọi `/api/*` bằng cookie phiên Sanctum (khi dev, Vite proxy về `php artisan serve`; khi deploy, cùng domain).
- **Controller mỏng:** nhận request đã kiểm tra bởi Form Request, gọi Service, trả JSON (API Resource khi cần ẩn trường).
- **Service:** chứa nghiệp vụ và transaction. Không có tầng Repository.
- **Phân quyền:** cột `users.role` + Gate (`can:admin`, `can:teach`) cho nhóm route; Gate `manage-course` kiểm tra quyền sở hữu khóa học.
- **Hàng đợi `database`:** phát thưởng chạy qua Listener trong hàng đợi, khi dev cần chạy thêm `php artisan queue:work`. Chỉ số thú cưng (giảm theo giờ) và kỳ nhiệm vụ ngày/tuần được tính lại khi đọc nên không cần lịch chạy.

### 4.2 Luồng phát thưởng

```mermaid
sequenceDiagram
  participant FE as React
  participant LC as LearningController
  participant PS as LearningService
  participant Q as Queue (database)
  participant L as GrantLessonRewards (Listener)
  participant RS as RewardService
  participant DB as MySQL
  FE->>LC: POST /api/lessons/{id}/complete
  LC->>PS: completeLesson(user, lesson)
  PS->>DB: insert lesson_progress (bỏ qua nếu đã có)
  PS-->>Q: event LessonCompleted
  LC-->>FE: 200 {completed: true}
  Q->>L: handle(event)
  L->>RS: grant(user, "lesson_completed:{user}:{lesson}", xp, coins)
  RS->>DB: BEGIN; insert point_ledger (UK idempotency_key); update wallets; COMMIT
  Note over RS,DB: Trùng khóa → bỏ qua, không cộng lần 2
```

### 4.3 Cấu trúc mã nguồn

```
backend/app/Http/Controllers   mỗi tính năng 1 controller (AuthController, CourseController…)
backend/app/Http/Requests      kiểm tra dữ liệu gửi lên
backend/app/Services           CourseService, RewardService, PaymentService, PetService
backend/app/Providers          AppServiceProvider: Gate admin, teach, manage-course (quyền sở hữu khóa)
frontend/src/features/<tính năng>   trang + component + api.js của tính năng
frontend/src/components        component dùng chung (ui.jsx…)
```
