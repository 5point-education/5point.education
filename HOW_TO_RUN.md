

# 5 Point Education Hub: Runbook

## Requirements

- Node.js 20 or newer
- pnpm
- A Supabase project with the database active

## First Setup

1. Install dependencies:

   ```powershell
   pnpm install
   ```

2. Copy `.env.example` to `.env` and fill in the Supabase values. For local `next dev`, `DATABASE_URL` must be the Supavisor **Session pooler** URL ending in `:5432`. Keep `DIRECT_URL` as the direct database URL for Prisma maintenance.

3. Generate Prisma Client:

   ```powershell
   pnpm exec prisma generate
   ```

4. Back up the database before applying the operational migration. Then apply the checked-in migration:

   ```powershell
   pnpm exec prisma migrate deploy
   ```

   Do not use `prisma db push` for the attendance, payment, notice, or audit changes.

5. Start development:

   ```powershell
   pnpm dev
   ```

   Open `http://localhost:3000`.

## Verify

Run these checks after a schema or route change:

```powershell
pnpm exec prisma validate
pnpm exec prisma generate
pnpm exec tsc --noEmit --pretty false
pnpm build
```

After login, these endpoints should respond without a database error:

- `/api/batches`
- `/api/teachers`
- `/api/fees`
- `/api/teacher-fee-sheets?month=2026-05`

## Operational Tools

- Reception: `/dashboard/reception/admissions-review` reviews duplicate subject enrollments.
- Reception: `/dashboard/reception/fees/reconciliation` previews stale fee balances.
- Admin: `/dashboard/admin/reports` provides date-filtered operational reports and CSV export.
- Teacher attendance supports regular and labelled extra-class sessions.

The daily automation endpoint requires `CRON_SECRET` and is called by the Netlify scheduled function. Never expose the service-role key or cron secret in browser code.

## Database Connection Troubleshooting

- Stop the dev server after changing `.env`; Next.js reads environment variables at process start.
- For local persistent development, use pooler port `5432`, not transaction pooler port `6543`.
- If a stale `.next` cache causes chunk errors, stop Node processes and remove `.next`, then restart `pnpm dev`.
- `P1001` means the configured host/port cannot be reached. Copy the Session pooler string again from Supabase Dashboard > Connect and URL-encode special characters in the password.
