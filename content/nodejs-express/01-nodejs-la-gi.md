---
title: Node.js là gì
chapter: Làm quen Node.js
summary: Môi trường chạy JavaScript ngoài trình duyệt, module và npm.
duration: 12
preview: true
---
## JavaScript ngoài trình duyệt

Node.js dùng bộ máy V8 của Chrome để chạy JavaScript trên máy tính và máy chủ. Không có `document` hay `window`, thay vào đó có các module đọc file, mạng, hệ điều hành.

```bash
node --version
node app.js
```

## Module

```js
// math.js
export function sum(a, b) {
  return a + b
}

// app.js
import { sum } from './math.js'
import { readFile } from 'node:fs/promises'

console.log(sum(2, 3))
const text = await readFile('ghi-chu.txt', 'utf8')
```

## npm

```bash
npm init -y          # tạo package.json
npm install express  # cài thư viện vào node_modules
npm run dev          # chạy lệnh khai báo trong "scripts"
```

`package.json` ghi tên và phiên bản thư viện; không đưa `node_modules` lên Git.

```quiz quick
? Đối tượng nào **không** có trong Node.js?
- console
* document
- process
> document là DOM của trình duyệt, Node.js không có.
```

## Tổng kết

```flashcard
Node.js :: Chạy JavaScript ngoài trình duyệt bằng V8
package.json :: Khai báo thư viện và lệnh của dự án
npm install x :: Cài thư viện x vào node_modules
node:fs :: Module có sẵn để đọc ghi file
```
