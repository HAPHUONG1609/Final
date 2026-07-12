# Deploy QLSV To AWS EC2 With Docker

## 1. EC2 setup

Use Ubuntu 22.04/24.04 with at least 2 vCPU and 4 GB RAM. Open these Security Group inbound ports:

- `22` for SSH from your IP
- `80` for the web app

The backend, Java crypto service, and SQL Server stay inside the Docker network by default.

Install Docker:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker ubuntu
newgrp docker
```

## 2. Upload source and configure env

From the `QLSV` folder:

```bash
cp .env.docker.example .env
nano .env
```

Change:

- `MSSQL_SA_PASSWORD` to a strong SQL Server password
- `SESSION_SECRET` to a long random string
- `CLIENT_ORIGIN` to `http://YOUR_EC2_PUBLIC_IP` or your domain

Keep `VITE_API_URL=/backend` when using the included Nginx proxy.
If your historical seed uses a different lecturer PIN than the default `123456`, also change `SEED_TEACHER_PIN`.

## 3. Build and run

```bash
docker compose up -d --build
```

Startup order is now:

1. `db` starts
2. `db-init` imports `Backend/QLSV_AT.sql`
3. `java-crypto` starts
4. `seed-history` runs `seedHistoricalEncryptedGrades_CRT`
5. `backend` starts
6. `frontend` starts

First run can take a while because SQL Server starts, the SQL file is imported, and historical CRT grades are seeded before backend is allowed to start.

Check status:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f db-init
docker compose logs -f seed-history
```

Open:

```text
http://YOUR_EC2_PUBLIC_IP
```

## 4. Useful commands

Stop:

```bash
docker compose down
```

Restart:

```bash
docker compose restart
```

Rebuild after code changes:

```bash
docker compose up -d --build
```

Reset database completely:

```bash
docker compose down -v
docker compose up -d --build
```

Only use reset when you accept losing database data in the SQL Server volume.
