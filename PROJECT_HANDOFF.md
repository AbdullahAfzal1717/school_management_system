# School Management System - Project Handoff

## Purpose

This is a Next.js 14 school management dashboard originally built by following a Lama Dev tutorial. The original project was frontend-only and used static arrays. The current goal is to turn it into a complete application with PostgreSQL, Prisma, authentication, authorization, real CRUD operations, and completed frontend pages.

The developer is learning Prisma, PostgreSQL, Docker, authentication, and backend development for the first time. The next editor must teach each step clearly while implementing it.

## Teaching Contract

Follow these rules throughout the project:

1. Explain the concept before running a command or changing a file.
2. Explain every command in plain language: what it reads, creates, changes, and how to undo or stop it.
3. Before editing, inspect the current file and state one local hypothesis plus one cheap verification check.
4. Make one small, focused change at a time.
5. Immediately run focused validation after each substantive edit.
6. Do not run destructive commands such as `prisma migrate reset`, `docker compose down -v`, or `npm audit fix --force` without explicit user consent immediately beforehand.
7. Never silently replace user edits. Read files that may have changed before editing them.
8. After each milestone, explain what was created, why it exists, and how the pieces connect.
9. Tell the user which files changed and which commands passed or failed.
10. Prefer a working example over abstract explanation, but do not hide the underlying logic.
11. Use the existing project patterns where practical; avoid broad refactors.
12. Pause at meaningful milestones so the developer can understand the result before the next large feature.

## Current Stack

- Next.js `14.2.5`
- React 18
- TypeScript
- Tailwind CSS
- Prisma `7.10.0`
- PostgreSQL 16 running in Docker
- NextAuth `4.24.11` with credentials and JWT sessions
- `@prisma/adapter-pg` and `pg`
- `bcryptjs`
- Zod and React Hook Form
- `tsx` for TypeScript scripts

Important scripts in `package.json`:

```text
npm run dev
npm run build
npm run start
npm run lint
npm run db:seed
```

## Database Setup

Docker Compose is defined in `docker-compose.yml`.

It runs:

- Image: `postgres:16-alpine`
- Container: `school_management_postgres`
- Database: `school_management`
- User: `school_user`
- Password: `school_password`
- Host port: `5432`
- Persistent volume: `school_management_postgres_data`

Start the database:

```powershell
docker compose up -d
```

Check it:

```powershell
docker compose ps
docker info
```

Stop it while keeping data:

```powershell
docker compose stop
```

Do not use this casually because it deletes the database volume:

```powershell
docker compose down -v
```

The ignored `.env` contains the local connection URL:

```env
DATABASE_URL="postgresql://school_user:school_password@localhost:5432/school_management?schema=public"
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

Explain that the URL means PostgreSQL protocol, username, password, host, port, database, and schema. Explain that Docker runs the PostgreSQL server and Prisma connects to it.

## Prisma Setup

`prisma7.config.ts` loads `.env`, points to `prisma/schema.prisma`, stores migrations in `prisma/migrations`, and registers:

```text
seed: "tsx prisma/seed.ts"
```

`prisma/schema.prisma` currently contains:

- `User`
- `UserRole` enum: `ADMIN`, `TEACHER`, `STUDENT`, `PARENT`
- `TeacherProfile`
- `StudentProfile`
- `ParentProfile`
- `AcademicYear`
- `SchoolClass`
- `Subject`
- `Enrollment`
- `ParentStudent`
- `TeachingAssignment`

Important relationships:

- `User` stores login identity and role.
- A user has one optional role profile.
- A student can have many enrollments over academic years.
- A parent and student are many-to-many through `ParentStudent`.
- A teacher, subject, class, and academic year connect through `TeachingAssignment`.
- `SchoolClass` names are unique per academic year.

Migrations already applied:

- `20260930102154_add_user_model`
- `20260930105110_add_school_foundation`

Useful commands:

```powershell
npx prisma validate
npx prisma format
npx prisma migrate status
npx prisma migrate dev --name descriptive_name
npx prisma generate
npx prisma studio
npm run db:seed
```

The generated client is in `src/generated/prisma`. Do not edit generated files manually.

`src/lib/prisma.ts` creates the Prisma Client using `PrismaPg` and the `DATABASE_URL`. It uses a development singleton so Next.js hot reload does not create unlimited connections.

## Seed Data

`prisma/seed.ts` is idempotent and uses `upsert`, so it can be run repeatedly without duplicates.

It creates:

- Admin: `admin@school.local`
- Teacher: `teacher@school.local`
- Student: `student@school.local`
- Parent: `parent@school.local`
- Password for all development accounts: `password123`
- Academic year `2026-2027`
- Classes `5A` and `6B`
- Subjects Mathematics, English, Physics
- Student enrollment and parent relationship
- Three teaching assignments

Passwords are stored as bcrypt hashes, never plaintext. These credentials are development-only.

## Authentication Already Implemented

Authentication files:

- `src/lib/auth.ts`
- `src/types/next-auth.d.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/middleware.ts`
- `src/app/sign-in/page.tsx`

Current behavior:

- Credentials provider checks the email in PostgreSQL.
- Password is compared with bcrypt.
- JWT session stores user ID and role.
- Root `/` redirects unauthenticated users to `/sign-in`.
- Authenticated users redirect by role to `/admin`, `/teacher`, `/student`, or `/parent`.
- `src/middleware.ts` protects dashboard and list routes.
- Unauthenticated `/list/students` was verified to return `307` to `/sign-in?callbackUrl=...`.

Important: JWT sessions are being used, so NextAuth `Account` and `Session` tables have not been added to Prisma yet.

## Current Student Feature

The first real database-backed feature is students.

`src/app/(dashboard)/list/students/page.tsx`:

- Queries `StudentProfile` with `User` and latest enrollment.
- Maps relational data into the table display shape.
- Is dynamically rendered with `force-dynamic`.
- Links each view icon to `/list/students/[id]`.

`src/app/(dashboard)/list/students/[id]/page.tsx`:

- Reads the URL ID.
- Queries the selected student with Prisma.
- Displays real name, student number, email, phone, address, grade, and class.
- Calls `notFound()` if the student does not exist.

`src/app/actions/student.ts` contains:

- `createStudent`
- `updateStudent`
- `deleteStudent`

These actions:

- Validate input with Zod on the server.
- Require an authenticated `ADMIN` role.
- Hash passwords with bcrypt.
- Create/update `User` and `StudentProfile`.
- Delete the user so cascading relations clean up the student profile.
- Revalidate the students list and detail paths.

`src/components/forms/StudentForm.tsx`:

- Uses React Hook Form and Zod.
- Supports create and edit mode.
- Calls the correct server action.
- Displays server errors.

`src/components/FormModal.tsx`:

- Closes after successful student create/update.
- Handles student delete confirmation.
- Refreshes the route after deletion.
- Other resource delete actions are still placeholders.

Route states were added:

- `src/app/(dashboard)/list/students/loading.tsx`
- `src/app/(dashboard)/list/students/error.tsx`

## Verified Commands

These have passed after the latest authentication work:

```text
npx tsc --noEmit
npm run build
```

The build reports middleware and auth routes, including:

```text
ƒ Middleware
ƒ /api/auth/[...nextauth]
ƒ /list/students
ƒ /list/students/[id]
```

The development server URL is:

```text
http://localhost:3000
```

The current dev server may need to be restarted after middleware or major Next.js changes. A stale `.next` webpack chunk previously caused a temporary 500; restarting `npm run dev` fixed it.

## Known Git Issue

The repository's `.git/config` and remote tracking refs were previously corrupted with null bytes. They were repaired.

Recovered remote:

```text
https://github.com/AbdullahAfzal1717/school_management_system.git
```

`git fetch origin` succeeded and `main` tracks `origin/main`.

Backups of corrupted Git metadata exist under `.git/` and are internal metadata, not application files.

If Git reports a config error again, do not run destructive Git commands. Inspect `.git/config` and stop to diagnose the corruption.

## Remaining Important Work

### Immediate next phase: role-aware UI and authorization

1. Replace `export let role = "admin"` in `src/lib/data.ts` usage.
2. Make `Menu.tsx` read the real session role.
3. Make `Navbar.tsx` display the real session user.
4. Hide create/edit/delete controls based on session role.
5. Add page-level role checks, not just middleware authentication.
6. Add logout behavior with `signOut`.
7. Ensure all server actions perform their own authorization checks.
8. Decide whether teachers can manage students/classes and encode that policy explicitly.

### Complete student feature

1. Make edit password optional instead of requiring a new password every time.
2. Add class/enrollment selection to the student form.
3. Add photo storage later using object storage or a controlled local upload flow.
4. Add pagination, search, and filtering using URL search parameters.
5. Add proper not-found UI and mutation success messages.

### Expand CRUD

Implement one resource at a time using the same pattern:

1. Prisma model and relationships.
2. Migration.
3. Seed data.
4. Server query.
5. Zod server action.
6. Client form.
7. Loading/error/empty states.
8. Revalidation.
9. Role authorization.
10. Focused type-check and build.

Recommended order:

1. Teachers
2. Parents
3. Subjects
4. Classes and enrollments
5. Lessons
6. Exams
7. Assignments
8. Results
9. Attendance
10. Events and announcements
11. Messages

### Complete frontend gaps

Still missing or placeholder:

- Proper homepage behavior is now a role redirect, but no public marketing/home page exists.
- Signup/invitation/password setup.
- Forgot password/reset password.
- Profile page.
- Settings page.
- Messages page.
- Attendance page.
- Logout UI/action.
- Real dashboard statistics.
- Real charts and calendar data from Prisma.
- Teacher detail page still contains hardcoded data.
- Many list pages still use `src/lib/data.ts` mock arrays.
- Several forms still only call `console.log`.
- Dashboard layout contains a nested `html` element and should eventually be cleaned up.

## Recommended Working Style For The Next Editor

Start each turn with a short progress update. Gather only local context needed for the next change. State the concept and expected behavior. Make the smallest edit. Run a focused validation immediately. Explain the result in beginner-friendly language. Do not jump to a large architecture rewrite. Keep the developer aware of Docker state, database state, migrations, generated code, environment variables, and what is or is not persisted.
