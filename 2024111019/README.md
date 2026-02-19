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
1. **Hackathon Team Registration** [cite: 169]
   - **Justification:** High-value feature for tech fests. Enables team leaders to create teams and generate invite codes.
   - **Implementation:** Created a `Team` model. Registration is only confirmed when all members join using the unique code.

2. **Merchandise Payment Approval Workflow**
   - **Justification:** Essential for verifying real money transactions. Prevents fake orders.
   - **Implementation:** Users upload payment proof (image). Order status defaults to `Pending`. Organizers have a specialized dashboard to `Approve` (generate QR) or `Reject`.

### Tier B (6 Marks Each)
1. **Organizer Password Reset Workflow** [cite: 188]
   - **Justification:** Enhances security by keeping admin in the loop for sensitive organizer accounts.
   - **Implementation:** Organizer requests reset -> Admin Dashboard shows request -> Admin approves -> New password generated.

2. **Real-Time Discussion Forum** [cite: 184]
   - **Justification:** Increases user engagement on event pages.
   - **Implementation:** Event details page contains a comment section where participants can discuss and organizers can moderate.

### Tier C (2 Marks)
1. **Anonymous Feedback System** [cite: 200]
   - **Justification:** Helps organizers improve future events without user fear of judgment.
   - **Implementation:** Simple form on completed events allowing 1-5 star rating and text feedback.
