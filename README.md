# LinguaFlow AI

Nền tảng học tiếng Trung cá nhân hóa bằng AI — MVP.

## Stack

- **Frontend:** Next.js 15, Tailwind CSS, TanStack Query
- **Backend:** NestJS, Prisma, PostgreSQL
- **AI:** Google Gemini
- **Auth:** JWT (access + refresh token)

## Yêu cầu

- Node.js >= 20
- pnpm >= 9
- Docker (cho PostgreSQL)

## Cài đặt

```bash
# Clone và cài dependencies
pnpm install

# Khởi động PostgreSQL
pnpm db:up

# Copy env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Chạy migration và seed dữ liệu demo
pnpm db:migrate
pnpm db:seed

# Build shared package
pnpm --filter @linguaflow/shared build
```

## Cấu hình

Chỉnh `apps/api/.env`:

```env
DATABASE_URL="postgresql://linguaflow:linguaflow@localhost:5432/linguaflow?schema=public"
JWT_ACCESS_SECRET="your-access-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
GEMINI_API_KEY="your-gemini-api-key"   # Bắt buộc cho sinh từ AI & gia sư
PORT=4000
CORS_ORIGIN="http://localhost:3000"
```

Chỉnh `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Chạy dev

```bash
# Chạy cả API + Web
pnpm dev

# Hoặc chạy riêng
pnpm dev:api   # http://localhost:4000
pnpm dev:web   # http://localhost:3000
```

## Tài khoản demo

Sau khi seed:

- **Email:** demo@linguaflow.ai
- **Mật khẩu:** demo123456

## Tính năng MVP

| Module     | Mô tả                                                              |
| ---------- | ------------------------------------------------------------------ |
| Auth       | Đăng ký, đăng nhập, JWT refresh                                    |
| AI sinh từ | Gemini tạo bộ từ theo chủ đề + HSK                                 |
| Decks      | Quản lý bộ từ, flashcard                                           |
| SRS        | Ôn tập spaced repetition (SM-2)                                    |
| Luyện tập  | 6 chế độ: Việt→Hán, Hán→Việt, nghe-gõ, điền từ, sắp xếp, hội thoại |
| Gia sư AI  | Giải thích ngữ pháp + hội thoại đóng vai                           |
| Thống kê   | Biểu đồ tiến bộ, độ chính xác                                      |

## Cấu trúc monorepo

```
apps/
  api/          NestJS backend
  web/          Next.js frontend
packages/
  shared/       Types & enums dùng chung
docker-compose.yml
```

## API endpoints

- `POST /auth/register`, `/auth/login`, `/auth/refresh`, `GET /auth/me`
- `GET /decks`, `GET /decks/:id`, `DELETE /decks/:id`
- `POST /ai/generate-vocab`
- `GET /srs/due`, `POST /srs/review`
- `GET /practice/:mode`, `POST /practice/grade`
- `POST /tutor/ask`, `POST /tutor/chat`, `GET /tutor/history`
- `GET /stats/overview`

## Phase tương lai

- Speech-to-Text (chấm phát âm)
- OCR, Video learning, Reading assistant
- Mobile app
  a
