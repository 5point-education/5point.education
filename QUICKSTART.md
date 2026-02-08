# Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or cloud like Supabase/Neon)
- Terminal/Command Prompt

## Step-by-Step Setup

### 1. Install Dependencies
```powershell
npm install
```

This will install all required packages including:
- Next.js, React, TypeScript
- Prisma, NextAuth, bcryptjs
- Tailwind CSS, shadcn/ui
- React Hook Form, Zod, Recharts

### 2. Set Up Database

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/5point_edu"
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

**For local PostgreSQL:**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/5point_edu"
```

**For Supabase:**
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres"
```

**For Neon:**
```env
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
```

**Generate NEXTAUTH_SECRET:**
```powershell
# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Or use this simple string for development:
NEXTAUTH_SECRET="development-secret-change-in-production-123456789"
```

### 3. Initialize Database

```powershell
# Push schema to database (creates all tables)
npm run db:push

# Generate Prisma Client
npx prisma generate

# Seed with sample data
npm run db:seed
```

You should see output like:
```
Starting seed...
Created admin: admin@5point.edu
Created receptionist: reception@5point.edu
Created teachers
Created batches
Created sample enquiries
Seed completed successfully!
```

### 4. Run Development Server

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Login with Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@5point.edu | admin123 |
| Receptionist | reception@5point.edu | reception123 |
| Teacher | teacher1@5point.edu | teacher123 |
| Student | student1@example.com | student123 |

## Troubleshooting

### Error: "Cannot find module '@prisma/client'"
```powershell
npx prisma generate
```

### Error: "Database connection failed"
- Check if PostgreSQL is running
- Verify DATABASE_URL in .env
- Test connection with: `npx prisma db push`

### Error: "Unable to communicate with Prisma Client" in Prisma Studio
Prisma CLI (including Studio) only loads **`.env`** by default, not `.env.local`. If your `DATABASE_URL` is in `.env.local`:
- Use **`npm run db:studio`** (this project’s script loads `.env.local` first), or
- Copy `DATABASE_URL` into a `.env` file in the project root.
Also ensure the database is running and reachable, then run `npx prisma generate` and restart Prisma Studio.

### Error: "NEXTAUTH_SECRET is not set"
- Make sure .env file exists in project root
- Restart dev server after creating .env

### Error: Module not found errors
```powershell
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

## Verify Installation

1. **Homepage** should load at `http://localhost:3000`
2. **Click "Get in Touch"** to test enquiry form
3. **Click "Sign In"** and login as Admin
4. You should be redirected to `/dashboard/admin`

## Database Management

```powershell
# Open Prisma Studio (visual database editor)
npm run db:studio
```

This opens a GUI at `http://localhost:5555` where you can:
- View all tables
- Edit records
- Add test data

## Next Steps

- Review [README.md](README.md) for full documentation
- Check [PROJECT_STATUS.md](PROJECT_STATUS.md) for implementation details
- Start building the remaining dashboard pages
- Customize the design to your needs

## Common Commands Reference

```powershell
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Run production build
npm run db:push          # Update database schema
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio GUI
npm run lint             # Run ESLint
```

## Need Help?

- Check the error message carefully
- Verify .env file is configured correctly
- Make sure all npm packages are installed
- Try deleting .next folder and restarting
- Check PostgreSQL is running and accessible
