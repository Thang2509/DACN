---
title: Bí mật và triển khai
chapter: GitHub Actions
summary: secrets, môi trường và triển khai qua SSH.
duration: 15
---
## Secrets

Mật khẩu, khóa SSH, khóa API **không** viết vào file workflow. Khai báo trong *Settings → Secrets and variables → Actions*, dùng qua `secrets`:

```yaml
deploy:
  needs: [frontend, backend]
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  environment: production
  steps:
    - uses: actions/checkout@v4
    - name: Triển khai qua SSH
      env:
        SSH_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
      run: |
        echo "$SSH_KEY" > key && chmod 600 key
        ssh -i key -o StrictHostKeyChecking=accept-new deploy@${{ secrets.HOST }} \
          "cd /var/www/eduquest && git pull && composer install --no-dev && php artisan migrate --force"
```

GitHub tự che giá trị secret trong log.

## Môi trường và duyệt

`environment: production` cho phép yêu cầu **người duyệt** trước khi job chạy, và tách secret theo môi trường (staging/production).

## Quay lui

Luôn có cách quay về bản trước: giữ bản build cũ, gắn tag phiên bản, hoặc `git revert` rồi để pipeline chạy lại.

```quiz test
? Mật khẩu CSDL production nên đặt ở đâu?
- Trong file workflow
- Trong file .env đưa lên Git
* Trong GitHub Secrets
> Secrets được mã hóa và tự che trong log.
? `if: github.ref == 'refs/heads/main'` có tác dụng gì?
* Chỉ chạy job khi đẩy lên nhánh main
- Chỉ chạy khi có pull request
- Chạy trên mọi nhánh
> Tránh triển khai từ nhánh tính năng.
```

## Tổng kết

```flashcard
secrets.TEN :: Đọc giá trị bí mật trong workflow
environment :: Tách cấu hình, yêu cầu người duyệt trước khi triển khai
if: github.ref :: Giới hạn job theo nhánh
Rollback :: Kế hoạch quay về bản trước khi triển khai lỗi
```
