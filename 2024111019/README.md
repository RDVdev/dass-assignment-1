# Felicity Event Management System

## Overview
A MERN-stack based centralized platform for managing college fests, allowing organizers to manage events and participants to register seamlessly.

## Tech Stack 
- **Frontend:** React.js (Vite), Tailwind CSS (for rapid UI development)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Atlas)
- **Authentication:** JWT, Bcrypt

## Setup Instructions
1. **Backend:**
   - `cd backend`
   - `npm install`
   - Create `.env` with `MONGO_URI` and `JWT_SECRET`.
   - `npm run dev`
2. **Frontend:**
   - `cd frontend`
   - `npm install`
   - `npm run dev`

## Implemented Advanced Features (30 Marks) [cite: 158]

### Tier A (8 Marks Each)
1. **Merchandise Payment Approval Workflow**
   - **Justification:** Essential for verifying real money transactions. Prevents fake orders.
   - **Implementation:** Users upload payment proof (image). Order status defaults to `Pending`. Organizers have a specialized dashboard to `Approve` (generate QR) or `Reject`.

2. **QR Scanner & Attendance Tracking**
   - **Justification:** Automates event check-in, replaces manual attendance.
   - **Implementation:** Organizer event detail page has a QR Scanner tab with camera scanner (via html5-qrcode), image upload, and manual ticket-ID entry. Attendance is tracked and exportable as CSV.

### Tier B (6 Marks Each)
1. **Organizer Password Reset Workflow** [cite: 188]
   - **Justification:** Enhances security by keeping admin in the loop for sensitive organizer accounts.
   - **Implementation:** Organizer requests reset -> Admin Dashboard shows request -> Admin approves -> New password generated.

2. **Real-Time Discussion Forum** [cite: 184]
   - **Justification:** Increases user engagement on event pages.
   - **Implementation:** Event details page contains a comment section where participants can discuss and organizers can moderate.

### Tier C (2 Marks)
1. **Add to Calendar Integration** [cite: 202]
   - **Justification:** Enhances participant experience by letting them sync event times to their personal calendars.
   - **Implementation:** Downloadable .ics files for universal import, plus direct Google Calendar and Outlook integration links on each event page.
