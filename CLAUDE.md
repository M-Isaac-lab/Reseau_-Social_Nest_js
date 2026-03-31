# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A social network application with a monorepo layout containing two independent projects:

- **`Reseau_-Social_Nest_js/`** — Backend REST API (NestJS 10, TypeScript strict, Prisma, PostgreSQL)
- **`reseau_social_next_js/`** — Frontend (Next.js 16, React 19, Tailwind CSS 4, App Router)

The frontend is in a fresh bootstrapped state. The backend is a fully functional API with auth, posts, comments, likes, and follow system.

## Monorepo Setup

This is an **npm workspaces** monorepo. Always run `npm install` from the root.

- **Packages:** `@reseau-social/backend` (`Reseau_-Social_Nest_js/`) and `@reseau-social/frontend` (`reseau_social_next_js/`)
- **Single lockfile:** `package-lock.json` at root only
- **Hoisted dependencies:** shared `node_modules/` at root

To target a specific workspace: `npm run -w @reseau-social/backend <script>`

## Common Commands

### Root (monorepo)

```bash
npm run dev                # Start backend + frontend concurrently
npm run dev:backend        # Backend dev server only (port 3000)
npm run dev:frontend       # Frontend dev server only (port 3001)
npm run build              # Build both projects
npm run lint               # Lint both projects
npm run test               # Test both projects
npm run prisma:generate    # Regenerate Prisma client
npm run prisma:migrate     # Create and apply a migration
npm run prisma:studio      # Visual DB browser
```

### Backend (`Reseau_-Social_Nest_js/`)

```bash
npm run build:backend      # Compile to dist/
npm run test:backend       # Unit tests (Jest)
npm run test:e2e           # E2E tests
npm run format             # Prettier formatting
```

### Frontend (`reseau_social_next_js/`)

```bash
npm run build:frontend     # Production build
npm run lint:frontend      # ESLint
```

**Important:** This uses Next.js 16 with breaking changes from earlier versions. Before writing frontend code, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.

## Environment Variables

Backend requires a `.env` file (see `.env.example`):

- `DATABASE_URL` — PostgreSQL connection string
- `SECRET_KEY` — JWT signing secret
- `CORS_ORIGIN` — Allowed frontend origin (default `http://localhost:3001`)
- `APP_URL` — Backend URL for email links (default `http://localhost:3000`)
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` — SMTP config (optional, falls back to local test server)

## Architecture

### Backend Module Structure

```
AppModule
├── UserModule        — Auth, profile, password reset, account deletion
├── PostModule        — CRUD posts + feed endpoint
├── CommentModule     — CRUD comments (nested under posts)
├── LikeModule        — Like/unlike posts
├── FollowModule      — Follow/unfollow users
├── HealthModule      — GET / health check
├── PrismaModule      — Global; wraps Prisma client
└── MailerModule      — Global; configurable SMTP via env vars
```

Each feature module follows: `module.ts` → `controller.ts` → `service.ts` → `dto/` directory.

### Database (Prisma + PostgreSQL)

Five models: `User`, `Post`, `Comment`, `Like` (unique per user+post), `Follow` (unique per follower+following). All with cascade deletes. Schema at `prisma/schema.prisma`.

### Authentication Flow

1. JWT strategy via Passport (`strategie.service.ts`). Access token (15min) + refresh token (7 days).
2. Protected endpoints use `@UseGuards(AuthGuard("jwt"))`. User accessed via `request.user!.userId` (typed via `src/types/express.d.ts`).
3. Per-user OTP secrets stored in DB. Password reset and account deletion require TOTP confirmation (speakeasy, 5-digit, 15-min window).
4. Refresh endpoint at `POST /auth/refresh`.

### API Endpoints (RESTful)

Swagger docs at `/api`. All responses wrapped: `{ statusCode, data, message }`.

| Area | Key Routes |
|------|-----------|
| Auth | `POST /auth/signup`, `POST /auth/signin`, `POST /auth/refresh` |
| Profile | `GET /auth/profile`, `PATCH /auth/profile` (protected) |
| Public profile | `GET /users/:id` |
| Password reset | `POST /auth/reset-password`, `POST /auth/reset-password/confirm` |
| Account | `DELETE /auth/account`, `DELETE /auth/account/confirm` (protected) |
| Posts | `POST /posts`, `GET /posts?page=&limit=`, `PATCH /posts/:id`, `DELETE /posts/:id` |
| Feed | `GET /posts/feed` (protected, posts from followed users) |
| Comments | `GET /posts/:postId/comments`, `POST /posts/:postId/comments`, `PATCH /comments/:id`, `DELETE /comments/:id` |
| Likes | `POST /posts/:id/like`, `DELETE /posts/:id/like`, `GET /posts/:id/likes` |
| Follow | `POST /users/:id/follow`, `DELETE /users/:id/follow`, `GET /users/:id/followers`, `GET /users/:id/following` |

### Global middleware stack (main.ts)

- CORS (configurable origin)
- `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`
- `ResponseInterceptor` — wraps all responses in `{ statusCode, data, message }`
- `HttpExceptionFilter` — formats errors as `{ statusCode, message, error, timestamp }`
- `ThrottlerGuard` — global rate limiting (20 req/min), stricter on auth endpoints (5 req/min)

### Frontend

- App Router with `app/` directory, TypeScript strict mode
- Path alias: `@/*` maps to project root
- Styling: Tailwind CSS 4 with dark mode support
- No API client, auth, state management, or additional routes implemented yet

### Key Conventions

- TypeScript strict mode enabled
- DTOs use `class-validator` decorators with `!` definite assignment assertions
- Swagger plugin enabled in `nest-cli.json` — DTO properties auto-documented
- Services throw NestJS HTTP exceptions: `ConflictException`, `NotFoundException`, `UnauthorizedException`, `ForbiddenException`
- Ownership checks happen in services before mutation operations
- Express User type extended in `src/types/express.d.ts`
