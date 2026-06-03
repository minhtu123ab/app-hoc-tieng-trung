# Hướng dẫn Deploy LinguaFlow AI (Render.com)

Deploy **PostgreSQL + API + Web** tự động qua [Render Blueprint](https://render.com/docs/infrastructure-as-code).

## Chuẩn bị

1. Repo GitHub: `https://github.com/minhtu123ab/app-hoc-tieng-trung`
2. Tài khoản [Render.com](https://render.com) (đăng ký bằng GitHub)
3. **Gemini API Key** của bạn (bắt buộc cho sinh từ AI & gia sư)

## Bước 1 — Push code deploy lên GitHub

```bash
git add Dockerfile.api Dockerfile.web render.yaml .dockerignore DEPLOY.md
git add apps/api/src/health.controller.ts apps/api/src/app.module.ts apps/api/src/main.ts
git add apps/web/next.config.ts apps/web/src/lib/api.ts
git commit -m "chore: add Render deployment config"
git push origin main
```

## Bước 2 — Tạo Blueprint trên Render

1. Vào [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)
2. **New Blueprint Instance**
3. Chọn repo `app-hoc-tieng-trung` → branch `main`
4. Render đọc file `render.yaml` và tạo:
   - **linguaflow-db** — PostgreSQL (free)
   - **linguaflow-api** — NestJS API (Docker)
   - **linguaflow-web** — Next.js (Docker)
5. Khi hỏi **GEMINI_API_KEY** → dán key Gemini của bạn
6. Bấm **Apply** — chờ deploy ~10–15 phút

## Bước 3 — Seed dữ liệu demo (lần đầu)

Sau khi API deploy xong:

1. Vào service **linguaflow-api** trên Render
2. Tab **Shell** → chạy:

```bash
cd apps/api && pnpm exec prisma db seed
```

Tài khoản demo: `demo@linguaflow.ai` / `demo123456`

## URL sau deploy

| Dịch vụ | URL mẫu |
|---------|---------|
| Web app | `https://linguaflow-web.onrender.com` |
| API | `https://linguaflow-api.onrender.com` |
| Health check | `https://linguaflow-api.onrender.com/health` |

Web tự proxy API qua `/api/proxy` — không cần cấu hình CORS phức tạp phía browser.

## Biến môi trường (tự động)

| Biến | Nguồn |
|------|-------|
| `DATABASE_URL` | Postgres Render |
| `JWT_*_SECRET` | Render generate |
| `CORS_ORIGIN` | URL web service |
| `BACKEND_URL` | URL API service |
| `GEMINI_API_KEY` | **Bạn nhập thủ công** |

## Lưu ý free tier Render

- Service **sleep sau 15 phút** không dùng — lần mở đầu có thể chậm ~30s
- Postgres free **hết hạn sau 90 ngày** — nên upgrade hoặc backup trước
- Lần deploy đầu API chạy `prisma migrate deploy` tự động

## Deploy lại sau khi sửa code

Push lên `main` → Render tự rebuild (nếu bật Auto-Deploy).

## Chạy local bằng Docker (tùy chọn)

```bash
docker compose -f docker-compose.yml up -d   # Postgres local
# hoặc test build:
docker build -f Dockerfile.api -t linguaflow-api .
docker build -f Dockerfile.web -t linguaflow-web .
```

## Cần hỗ trợ?

Gửi cho tôi:
- **GEMINI_API_KEY** (nếu chưa set trên Render)
- Link Blueprint / log lỗi deploy nếu fail
