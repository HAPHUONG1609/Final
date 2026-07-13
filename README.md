# Hệ thống quản lý điểm mã hóa CRT

Đồ án quản lý điểm sinh viên sử dụng Chinese Remainder Theorem (CRT), kết hợp dịch vụ mã hóa Java, backend Node.js, frontend React và SQL Server.

## Thành phần

```text
QLSV/
├── Backend/                 API Node.js, script seed và dữ liệu khởi tạo SQL
├── Frontend/                Giao diện React/Vite
├── java-crypto-service/     Dịch vụ mã hóa/giải mã CRT bằng Spring Boot
├── Excel_Diem&Excel_ThongTin/  Dữ liệu Excel phục vụ demo
├── docker-compose.yml       Khởi chạy toàn bộ hệ thống
├── .env.docker.example      Mẫu cấu hình Docker/EC2
└── DEPLOY_AWS_EC2.md        Hướng dẫn triển khai AWS EC2
```

## Chạy toàn bộ bằng Docker

Yêu cầu: Docker và Docker Compose.

```bash
cd QLSV
cp .env.docker.example .env
docker compose up -d --build
docker compose ps
```

Trên Windows PowerShell, dùng `Copy-Item .env.docker.example .env` thay cho lệnh `cp` nếu cần.

Compose chạy theo thứ tự an toàn:

1. SQL Server và dịch vụ Java CRT khởi động.
2. `db-init` import `Backend/QLSV_AT.sql` nếu database chưa tồn tại.
3. `seed-history` mã hóa và seed điểm lịch sử.
4. Backend chỉ khởi động khi seed hoàn tất thành công.
5. Frontend Nginx phục vụ ứng dụng tại `http://localhost` hoặc IP EC2.

Xem log khi cần:

```bash
docker compose logs --tail=200 db-init seed-history backend java-crypto
```

Xóa toàn bộ database Docker và chạy lại từ đầu:

```bash
docker compose down -v --remove-orphans
docker compose up -d --build
```

> Trước khi deploy, phải đổi các giá trị bí mật trong `.env`, đặc biệt là `MSSQL_SA_PASSWORD`, `SESSION_SECRET` và `SEED_TEACHER_PIN`.

## Chạy từng dịch vụ để phát triển

Java CRT:

```bash
cd QLSV/java-crypto-service
./mvnw spring-boot:run
```

Trên Windows dùng `.\mvnw.cmd spring-boot:run`.

Backend:

```bash
cd QLSV/Backend
npm ci
npm run seed:history
npm start
```

Frontend:

```bash
cd QLSV/Frontend
npm ci
npm run dev
```

## Kiểm tra trước khi nộp

```bash
cd QLSV/Backend
npm run check

cd ../Frontend
npm run lint
npm run build

cd ../java-crypto-service
./mvnw test
```

Không commit `.env`, `node_modules`, `dist` hoặc `target`. Các dependency được khôi phục từ `package-lock.json` và `pom.xml`.
