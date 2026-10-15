---
title: Custom hook và Context
chapter: Tái sử dụng
summary: Tách logic dùng chung và chia sẻ dữ liệu toàn cây.
duration: 15
---
## Custom hook

Hàm bắt đầu bằng `use` và gọi hook khác bên trong:

```jsx
function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => JSON.parse(localStorage.getItem(key)) ?? initial)
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value])
  return [value, setValue]
}

const [theme, setTheme] = useLocalStorage('theme', 'light')
```

## Context

Chia sẻ dữ liệu cho nhiều tầng con mà không truyền props qua từng tầng:

```jsx
const ThemeContext = createContext('light')

function App() {
  return <ThemeContext value="dark"><Page /></ThemeContext>
}

function Button() {
  const theme = useContext(ThemeContext)
  return <button className={theme}>OK</button>
}
```

Dùng Context cho dữ liệu "toàn cục" ít đổi (người dùng đang đăng nhập, giao diện, ngôn ngữ). Dữ liệu từ máy chủ nên dùng thư viện như TanStack Query.

```quiz test
? Quy ước bắt buộc của custom hook là gì?
* Tên bắt đầu bằng use
- Phải trả về JSX
- Phải dùng useEffect
> Tiền tố use giúp React và công cụ lint kiểm tra luật của hook.
? Context phù hợp nhất với dữ liệu nào?
- Danh sách khóa học tải từ API, đổi liên tục
* Người dùng đang đăng nhập, giao diện sáng/tối
- State của một ô nhập
> Context hợp với dữ liệu dùng chung, ít thay đổi.
```

## Tổng kết

```flashcard
Custom hook :: Hàm use… gom logic dùng chung giữa component
createContext :: Tạo kênh chia sẻ dữ liệu cho cây component
useContext :: Đọc giá trị Context gần nhất phía trên
```
