# SmartSched

SmartSched is a full-stack **academic timetable** system. Staff configure departments, courses, subjects, rooms, faculty assignments, and time slots; the app can **generate** timetables and expose **role-based dashboards** (including HOD, faculty, and student views).

## Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | [Next.js](https://nextjs.org) (App Router), React, Tailwind CSS, MUI |
| Backend  | [NestJS](https://nestjs.com), JWT + HTTP-only cookies, Passport |
| Database | [PostgreSQL](https://www.postgresql.org) via [Prisma](https://www.prisma.io) |

## Repository layout

```
SmartSched/
├── frontend/   # Next.js UI (default dev port 3001)
├── backend/    # NestJS API (port 3000)
```

## Prerequisites

- **Node.js** (LTS recommended)
- **PostgreSQL** running locally or remotely, with a database created for this project

## Environment variables

### Backend (`backend/.env`)

Create `backend/.env` (not committed) with:

| Variable        | Description |
| --------------- | ------------------------------------ |
| `DATABASE_URL`  | PostgreSQL connection string for Prisma |
| `JWT_SECRET`    | Secret for signing JWTs (required at runtime) |

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/smartsched?schema=public"
JWT_SECRET="your-long-random-secret"
```

### Frontend (`frontend/.env.local`)

Optional. Defaults to `http://localhost:3000` if unset.

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Database setup

From the `backend` directory, after `DATABASE_URL` is set:

```bash
cd backend
npm install
npx prisma migrate deploy
```

For local development when you need to create or update migrations:

```bash
npx prisma migrate dev
```

Regenerate the Prisma client after schema changes if needed:

```bash
npx prisma generate
```

## Run locally

**Terminal 1 — API**

```bash
cd backend
npm install
npm run start:dev
```

API listens on **http://localhost:3000**. CORS is enabled for the frontend origin **http://localhost:3001**.

**Terminal 2 — Web app**

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3001**.

## Authentication and roles

The API exposes `/auth/register` and `/auth/login`. Login sets an HTTP-only `token` cookie used by the frontend. User roles in the data model include **admin**, **faculty**, **student**, and **hod**; the home route redirects logged-in users toward the appropriate dashboard (e.g. student, faculty, HOD).

## Main features (high level)

- **Configuration** — Departments, courses, subjects, rooms, faculty, sections, academic sessions, time slots (`/configData` and related API modules).
- **Timetable generation** — Generator service under `backend/src/time-table-generator` with UI at `/generateTimetable`.
- **Views** — Timetable listing and detail pages, faculty/student “my timetable” routes, and dashboards under `/dashboard/*`.

## Scripts reference

| Location | Command           | Purpose              |
| --------- | ----------------- | -------------------- |
| `backend` | `npm run start:dev` | API with file watch |
| `backend` | `npm run build` | Compile NestJS       |
| `backend` | `npm run start:prod`| Run compiled app     |
| `frontend`| `npm run dev`       | Next.js dev (port 3001) |
| `frontend`| `npm run build`     | Production build     |

## License

See individual `package.json` files in `frontend/` and `backend/` for dependency licenses. Project `license` fields may be `UNLICENSED` unless you add your own terms.
