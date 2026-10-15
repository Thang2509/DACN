---
title: Workflow đầu tiên
chapter: GitHub Actions
summary: Cấu trúc file YAML: on, jobs, steps.
duration: 15
---
## File workflow

Đặt trong `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
        working-directory: frontend
      - run: npm run lint && npm test && npm run build
        working-directory: frontend
```

- `on`: sự kiện kích hoạt.
- `jobs`: các công việc, mặc định chạy **song song**; `needs: [frontend]` để chạy sau.
- `steps`: `uses` dùng action có sẵn, `run` chạy lệnh shell.

## Ma trận

```yaml
strategy:
  matrix:
    php: ['8.2', '8.3']
```

Chạy cùng một job trên nhiều phiên bản.

```quiz quick
? Muốn job `deploy` chỉ chạy sau khi job `test` thành công, dùng khóa nào?
* needs: [test]
- after: test
- depends: test
> needs khai báo phụ thuộc giữa các job.
```

## Tổng kết

```flashcard
on :: Sự kiện kích hoạt workflow (push, pull_request…)
jobs :: Các công việc, mặc định chạy song song
uses :: Dùng action có sẵn
run :: Chạy lệnh shell
needs :: Job chỉ chạy sau khi job khác thành công
```
