---
title: Form có kiểm soát
chapter: Tương tác
summary: Gắn ô nhập với state và xử lý gửi form.
duration: 12
---
## Controlled input

```jsx
function SignupForm() {
  const [email, setEmail] = useState('')

  const submit = (event) => {
    event.preventDefault()
    if (!email.includes('@')) return alert('Email chưa đúng')
    console.log('Gửi', email)
  }

  return (
    <form onSubmit={submit}>
      <input value={email} onChange={(event) => setEmail(event.target.value)} />
      <button>Đăng ký</button>
    </form>
  )
}
```

Giá trị ô nhập luôn bằng state: React là "nguồn sự thật" duy nhất, dễ kiểm tra và xóa form.

## Nhiều ô nhập

```jsx
const [form, setForm] = useState({ name: '', email: '' })
const bind = (field) => ({
  value: form[field],
  onChange: (e) => setForm({ ...form, [field]: e.target.value }),
})
<input {...bind('name')} />
```

```quiz test
? Thuộc tính nào gắn giá trị ô nhập với state?
* value
- defaultValue
- name
> value + onChange tạo thành ô nhập có kiểm soát.
? Vì sao gọi `event.preventDefault()` trong onSubmit?
- Để xóa form
* Để trình duyệt không tải lại trang
- Để chạy kiểm tra dữ liệu
> Mặc định gửi form sẽ tải lại trang và mất state.
```

## Tổng kết

```flashcard
Controlled input :: value lấy từ state, onChange cập nhật state
[field]: value :: Tên thuộc tính tính toán khi sửa một trường form
onSubmit + preventDefault :: Tự xử lý gửi form trong React
```
