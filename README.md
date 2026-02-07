# DASS Assignment 1 - MERN Event Management System

This repository implements the assignment in `dass-assignment-1` with:

- Role-based MERN app (`participant`, `organizer`, `admin`)
- Event browsing, registration, and ticket history
- Organizer event management and analytics
- Admin organizer management and password-reset flow

## Selected Advanced Features (Total: 30 Marks)

- Tier A (2 x 8):
  - Payment Proof Verification
  - QR Scanner Check-in
- Tier B (2 x 6):
  - Discussion Forum
  - Organizer Password Reset
- Tier C (1 x 2):
  - Calendar Integration (Google Calendar link)

Total = `16 + 12 + 2 = 30`

## Project Structure

- `backend/` Express + MongoDB API
- `frontend/` React + Vite client

## Backend Setup

1. `cd backend`
2. `cp .env.example .env`
3. `npm install`
4. `npm run seed:admin`
5. `npm run dev`

### Core API Groups

- `POST /api/auth/signup` participant signup
- `POST /api/auth/login` all role login
- `GET /api/auth/me` current user
- `POST /api/events` organizer create event
- `PATCH /api/events/:id/publish` organizer publish event
- `POST /api/tickets/register` participant registration/purchase
- `PATCH /api/tickets/payment-proof` participant submits proof
- `PATCH /api/tickets/payment-review` organizer approves/rejects
- `POST /api/tickets/check-in-qr` organizer check-in via QR token
- `GET/POST /api/forum/events/:eventId/posts` discussion forum
- `POST /api/auth/organizer-password-reset/request` admin requests token
- `POST /api/auth/organizer-password-reset/confirm` organizer sets new password

## Frontend Setup

1. `cd frontend`
2. `cp .env.example .env`
3. `npm install`
4. `npm run dev`

## Notes

- Admin has no public signup. Create via seed script.
- Organizer accounts are created by Admin only.
- Participant signup auto-detects IIIT vs non-IIIT by domain.
