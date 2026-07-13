# Frontend QLSV CRT

Giao diện React/Vite cho ba vai trò: quản trị viên, giảng viên và sinh viên.

## Chạy phát triển

```bash
npm ci
npm run dev
```

Mặc định frontend gọi backend qua biến `VITE_API_URL`. Khi chạy bằng Docker, Nginx proxy đường dẫn `/backend` tới service backend.

## Kiểm tra

```bash
npm run lint
npm run build
```
