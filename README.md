# 5 Point Education Hub — Coaching Center Management System

A comprehensive, production-ready web application for managing coaching centers with support for tuition batches and home tutoring services.

--

## 🚀 Features

### Public Feature

* **Landing Page:** Professional homepage with service showcase
* **Enquiry Form:** Public form for capturing leads with validation
* **Service Types:** Supports both **Tuition Batch** and **Home Tutor** modes

### Role-Based Dashboards

#### 🧑‍💼 Admin Dashboard

* Revenue analytics and KPIs
* Conversion rate tracking
* Lost leads analysis by reason
* Subject demand visualization
* Pending follow-ups monitoring

#### 👩‍💼 Receptionist Dashboard

* Enquiry management with status tracking
* Lead conversion workflow
* Multi-step admission form
* Payment recording
* Student onboarding

#### 👨‍🏫 Teacher Dashboard

* Manage assigned batches
* View students in each batch
* Create and manage exams
* Enter and update student scores

#### 👨‍🎓 Student Dashboard

* Performance tracking with charts
* Exam results history
* Pending fees display
* Upcoming classes information

---

## 🛠️ Tech Stack

* **Framework:** Next.js 14+ (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS + shadcn/ui
* **Database:** PostgreSQL (Supabase / Neon compatible)
* **ORM:** Prisma
* **Authentication:** NextAuth.js
* **Forms:** React Hook Form + Zod
* **Charts:** Recharts
* **State Management:** React Query (TanStack Query)

---

## 📋 Prerequisites

* Node.js 18+
* PostgreSQL database (local or cloud)
* npm or yarn

---

## 🔧 Installation & Setup

### 1️⃣ Clone and Install Dependencies

```bash
# Navigate to project directory
cd 5_point_coaching_quoder

# Install dependencies
npm install
```

---

### 2️⃣ Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database - Replace with your PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/5point_edu?schema=public"

# NextAuth - Generate a random secret: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

---

### 3️⃣ Initialize Database

```bash
# Push Prisma schema to database
npm run db:push

# Generate Prisma Client
npx prisma generate

# Seed database with sample data
npm run db:seed
```

---

### 4️⃣ Run Development Server

```bash
npm run dev
```

Visit:

```
http://localhost:3000
```

---

## 👥 Demo Credentials

After seeding, log in using:

* **Admin:** [admin@5point.edu](mailto:admin@5point.edu) / admin123
* **Receptionist:** [reception@5point.edu](mailto:reception@5point.edu) / reception123
* **Teacher:** [teacher1@5point.edu](mailto:teacher1@5point.edu) / teacher123
* **Student:** [student1@example.com](mailto:student1@example.com) / student123

---

## 📊 Database Schema

### Key Models

* **User:** Unified user model with roles
* **StudentProfile:** Extended student information
* **TeacherProfile:** Qualifications & specializations
* **Enquiry:** Lead management with status tracking
* **Batch:** Group classes with teacher assignments
* **Admission:** Student enrollment records
* **Payment:** Fee tracking
* **Exam:** Assessments
* **Result:** Student exam scores

### Enums

* **Role:** ADMIN, RECEPTIONIST, TEACHER, STUDENT
* **ServiceType:** HOME_TUTOR, TUITION_BATCH
* **Board:** ICSE, CBSE, WBBSE
* **EnquiryStatus:** PENDING, FEES_DISCUSSED, ADMITTED, LOST
* **LostReason:** FEES, TIMING, SUBJECT_ISSUES, OTHER

---

## 🎯 Key Features Implementation

### 1️⃣ Automatic Role-Based Redirection

Users are redirected automatically to their dashboard after login.

### 2️⃣ Lead Management

* Enquiry status tracking
* Mandatory lost reason
* Follow-up date reminders

### 3️⃣ Student Onboarding

* Multi-step admission process
* Automatic user creation
* Temporary password display

### 4️⃣ Security

* Protected routes via middleware
* Role-based API checks
* Session-based authentication

---

## 📁 Project Structure

```
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── api/
│   │   ├── auth/
│   │   └── enquiry/
│   ├── dashboard/
│   │   ├── admin/
│   │   ├── reception/
│   │   ├── teacher/
│   │   └── student/
│   ├── enquiry/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── middleware.ts
```

---

## 🔐 Role-Based Access Control

| Path                 | Access       |
| -------------------- | ------------ |
| /dashboard/admin     | Admin        |
| /dashboard/reception | Receptionist |
| /dashboard/teacher   | Teacher      |
| /dashboard/student   | Student      |

---

## 🗄️ Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:push
npm run db:seed
npm run db:studio
```

---

## 📦 Next Steps for Production

* Configure production environment variables
* Add email service for password distribution
* Implement document uploads
* Add SMS follow-up notifications
* Integrate payment gateway
* Add reports + PDF receipts
* Set up automated database backups

---

## 🐛 Troubleshooting

### Database Issues

* Check `DATABASE_URL`
* Ensure PostgreSQL is running
* Verify cloud firewall rules

### Authentication Issues

* Clear cookies
* Ensure `NEXTAUTH_SECRET` is set
* Check `NEXTAUTH_URL`

### Build Errors

* Delete `node_modules` and `.next`
* Run install again
* Confirm env variables

---

## 📄 License

This project is created for **educational and demonstration purposes**.

