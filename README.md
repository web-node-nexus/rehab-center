# Rehabilitation Center — Backend API

Node.js + Express + MySQL (Sequelize) REST API for managing students/patients, monthly medical records, and doctor visits.

## Prerequisites

- Node.js 18+
- MySQL 8+

## Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials and JWT secret
npm install
npm run setup   # creates DB (if needed), syncs tables, seeds admin user
npm run dev
```

API will be available at `http://localhost:4000`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon |
| `npm start` | Start production server |
| `npm run db:sync` | Create DB + sync Sequelize models |
| `npm run seed` | Seed default admin user from `.env` |
| `npm run setup` | `db:sync` + `seed` |

## Default Login

Configured via `.env` (defaults):

- Email: `admin@rehabcenter.com`
- Password: `Admin@123`

## Main Endpoints

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET/POST /api/students`
- `GET/PUT/DELETE /api/students/:id`
- `GET/POST /api/students/:studentId/initial-reports`
- `DELETE /api/initial-reports/:id`
- `GET/POST /api/students/:studentId/monthly-records`
- `PUT/DELETE /api/monthly-records/:id`
- `GET/POST /api/students/:studentId/doctor-visits`
- `PUT/DELETE /api/doctor-visits/:id`
- `GET /api/dashboard/stats`
- `GET /api/dashboard/reminders` → pending monthly tests + upcoming doctor visits
- `GET /api/students/:id/export-pdf` → combined PDF (profile + reports + monthly + visits)

All routes except login require `Authorization: Bearer <token>`.

Uploads are served from `/uploads/profiles`, `/uploads/reports`, `/uploads/prescriptions`.
