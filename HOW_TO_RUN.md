# How To Run

This project uses **Next.js + Prisma + Supabase**.

## 1) Prerequisites

- Node.js 18+ (recommended: latest LTS)
- `pnpm` installed globally
- Valid `.env` file in project root

Install pnpm (if needed):

```powershell
npm install -g pnpm
```

## 2) Install dependencies

From project root:

```powershell
pnpm.cmd install
```

## 3) Prisma setup

Set DB URLs in `.env` before running:

- `DATABASE_URL`: Supavisor **Session pooler** string (`aws-...pooler.supabase.com:5432`) for local `next dev`
- `DIRECT_URL`: direct DB string (`db.<project_ref>.supabase.co:5432`) for Prisma `db push` / migrations
- `:6543` transaction pooler is for serverless/auto-scaling deployments, not default local runtime

Validate schema and generate client:

```powershell
npx prisma validate
npx prisma generate
```

If DB schema changes are pending:

```powershell
npx prisma db push
```

## 4) Run development server

```powershell
pnpm.cmd dev
```

Open:

- `http://localhost:3000`

## 5) Build check (production compile)

```powershell
pnpm.cmd build
```

## 6) Start production server (after build)

```powershell
pnpm.cmd start
```

## Common Windows fix (EPERM `.next/trace`)

If you see:
`EPERM: operation not permitted, open .next\trace`

Run:

```powershell
taskkill /F /IM node.exe
Remove-Item -Recurse -Force .next
pnpm.cmd dev
```

## Optional checks

Lint:

```powershell
pnpm.cmd lint
```

Prisma Studio:

```powershell
npx prisma studio
```
