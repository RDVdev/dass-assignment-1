# Felicity Event Management System

> **Roll Number:** 2024111019

## Overview

A full-stack MERN application for managing **Felicity** — IIIT Hyderabad's annual college fest. The platform supports three user roles (**Admin**, **Organizer**, **Participant**) and handles the complete event lifecycle: creation, browsing, registration, merchandise sales, QR-based attendance, real-time discussions, and analytics.

### Deployment

| Layer | URL |
|-------|-----|
| Frontend (Vercel) | <https://dass-assignment-1-dun.vercel.app/> |
| Backend (Render) | <https://felicity-api-e94h.onrender.com> |

---

## Tech Stack & Libraries

### Backend

| Library | Version | Justification |
|---------|---------|---------------|
| **Express** | 4.19 | Industry-standard Node.js web framework; minimal, unopinionated, large middleware ecosystem. Provides robust routing, middleware chaining, and easy REST API design. |
| **Mongoose** | 8.5 | ODM for MongoDB that provides schema validation, type casting, query building, and middleware hooks — eliminates raw driver boilerplate while enforcing data integrity at the application layer. |
| **jsonwebtoken** | 9.0 | Stateless JWT-based authentication with configurable expiry (7-day tokens). Avoids server-side session storage and scales horizontally without sticky sessions. |
| **bcryptjs** | 2.4 | Pure-JS bcrypt implementation for secure password hashing with configurable salt rounds (10). Chosen over native `bcrypt` to avoid native compilation issues across environments. |
| **Socket.IO** | 4.8 | Enables real-time bidirectional communication for the live discussion forum. Handles WebSocket upgrade with automatic fallback to long-polling, room-based event scoping, and reconnection. |
| **multer** | 1.4 | Multipart form-data middleware for handling file uploads (payment proofs and form-field file attachments). Supports disk storage with custom filename generation and per-field size/type limits. |
| **qrcode** | 1.5 | Generates QR code Data URIs (`toDataURL`) embedded directly in tickets. Eliminates external service dependency; QR codes are stored as base64 strings in MongoDB. |
| **nodemailer** | 8.0 | SMTP-based email delivery for registration confirmations (with QR code) and password reset tokens. Configured for Gmail SMTP with app-password authentication. |
| **uuid** | 13.0 | Generates cryptographically random ticket IDs (`TKT-{uuid8}`) ensuring globally unique, human-readable identifiers for every registration and merchandise order. |
| **crypto** | (built-in) | Used for generating secure random tokens (`randomBytes(32)`) for password reset flows, with SHA-256 hashing for safe database storage. |
| **cors** | 2.8 | Configures Cross-Origin Resource Sharing to allow the Vercel-hosted frontend to communicate with the Render-hosted backend, with credentials support for cookie/token forwarding. |
| **dotenv** | 16.4 | Loads environment variables from `.env` files, keeping secrets (DB URI, JWT secret, SMTP credentials) out of source code. |
| **nodemon** | 3.1 *(dev)* | Auto-restarts the server on file changes during development, improving developer experience. |

### Frontend

| Library | Version | Justification |
|---------|---------|---------------|
| **React** | 18.3 | Component-based UI library with virtual DOM diffing for efficient re-renders. Hooks API (`useState`, `useEffect`, `useContext`, `useRef`, `useCallback`) keeps components functional and composable. |
| **React Router DOM** | 6.26 | Declarative client-side routing with nested routes, protected route wrappers, and programmatic navigation (`useNavigate`). Enables SPA behavior without full page reloads. |
| **Vite** | 5.3 | Next-generation build tool with near-instant HMR via native ES modules in development. Significantly faster than CRA/Webpack for both dev startup and production builds. |
| **Axios** | 1.7 | Promise-based HTTP client with interceptors, automatic JSON parsing, and cleaner API than native `fetch`. Used for all backend API communication. |
| **socket.io-client** | 4.8 | Client counterpart to Socket.IO server; manages WebSocket connection lifecycle, automatic reconnection, and event-based messaging for the real-time discussion forum. |
| **html5-qrcode** | 2.3 | Browser-based QR code scanning using device cameras (rear-facing preferred). Supports both live camera scanning and static image file decoding — used in the organizer's QR Scanner tab. |
| **@vitejs/plugin-react** | 4.3 *(dev)* | Vite plugin enabling React Fast Refresh (HMR) and JSX transformation via esbuild/SWC during development. |

### Database

- **MongoDB Atlas** — Cloud-hosted NoSQL database. Document-oriented storage aligns naturally with event/ticket data that varies per event type (Normal vs Merchandise). Flexible schemas accommodate dynamic form fields without migrations.

### Styling

- **Custom CSS** (~1900 lines) — Hand-crafted stylesheet with CSS variables for theming (dark theme with gold/amber accents matching the "Disco Edition" branding), responsive media queries, animations, and component-specific styles. No CSS framework dependency.

---

## Project Structure

```
2024111019/
├── backend/
│   ├── server.js              # Express + Socket.IO server entry point
│   ├── config/
│   │   └── db.js              # MongoDB connection via Mongoose
│   ├── controllers/
│   │   ├── authController.js  # Auth, profile, onboarding, password reset
│   │   ├── eventController.js # Event CRUD, registration, merch, QR, comments, analytics
│   │   └── adminController.js # Organizer management, reset requests, merch approvals
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT verification + role-based authorization
│   │   └── uploadMiddleware.js # Multer file upload (images 5MB / any 10MB)
│   ├── models/
│   │   ├── User.js            # Users (participant/organizer/admin)
│   │   ├── Event.js           # Events with embedded comments, form fields, variants
│   │   └── Ticket.js          # Registrations & merchandise orders with QR codes
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   └── adminRoutes.js
│   ├── seed.js                # Database seeder (admin + 5 orgs + 60 participants + 12 events)
│   └── uploads/               # File upload directory (gitignored)
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json            # SPA rewrite rule for Vercel
│   └── src/
│       ├── App.jsx            # Route definitions + ProtectedRoute
│       ├── styles.css         # Complete custom stylesheet
│       ├── context/
│       │   └── AuthContext.jsx # Auth state, token management, API helpers
│       ├── components/
│       │   ├── Navbar.jsx     # Role-aware navigation
│       │   ├── EventCard.jsx  # Reusable event card
│       │   └── WaterBackground.jsx # Decorative gradient overlay
│       └── pages/
│           ├── LandingPage.jsx
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── ForgotPassword.jsx
│           ├── Onboarding.jsx
│           ├── participant/
│           │   ├── Dashboard.jsx
│           │   ├── BrowseEvents.jsx
│           │   ├── EventDetails.jsx # Registration, discussion, calendar
│           │   ├── ClubsList.jsx
│           │   ├── OrganizerDetail.jsx
│           │   └── Profile.jsx
│           ├── organizer/
│           │   ├── OrgDashboard.jsx
│           │   ├── EventCreate.jsx   # Form builder + merch variant editor
│           │   ├── OrgEventDetail.jsx # QR scanner, analytics, comments, merch
│           │   ├── OrganizerProfile.jsx
│           │   └── MerchOrders.jsx
│           └── admin/
│               ├── AdminDashboard.jsx
│               ├── ManageOrganizers.jsx
│               └── ResetRequests.jsx
└── README.md
```

---

## Setup Instructions

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** (local instance or MongoDB Atlas cluster)
- *Optional:* Gmail account with App Password for email features

### 1. Clone & Navigate

```bash
git clone https://github.com/RDVdev/dass-assignment-1.git
cd dass-assignment-1/2024111019
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your_jwt_secret_here
PORT=5000
FRONTEND_URL=http://localhost:5173

# Optional — for email notifications (registration confirmations, password resets)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

Start the development server:

```bash
npm run dev    # Uses nodemon for auto-restart
# OR
node server.js # Direct start
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Optionally create a `.env` file (defaults to `http://localhost:5000`):

```env
VITE_API_URL=http://localhost:5000
```

Start the development server:

```bash
npm run dev    # Vite dev server on http://localhost:5173
```

### 4. Seed the Database

```bash
cd ../backend
node seed.js          # Creates admin + 5 organizers + 60 participants + 12 events
node seed.js --force  # Re-seeds (wipes existing non-admin data first)
```

### Seed Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@felicity.iiit.ac.in` | `Pass@123` |
| Organizer (E-Cell) | `ecell@iiit.ac.in` | `Pass@123` |
| Organizer (Ping!) | `ping@iiit.ac.in` | `Pass@123` |
| Organizer (Apex) | `apex@iiit.ac.in` | `Pass@123` |
| Organizer (LitClub) | `litclub@iiit.ac.in` | `Pass@123` |
| Organizer (Dhun) | `dhun@iiit.ac.in` | `Pass@123` |
| Participant (sample) | `aarav.sharma@students.iiit.ac.in` | `Pass@123` |

All 60 seeded participants follow the pattern `firstname.lastname@students.iiit.ac.in` with password `Pass@123`.

---

## Architecture & Design Decisions

### Authentication

- **JWT with 7-day expiry** — Stateless tokens stored client-side. No server-side session store needed, enabling horizontal scaling.
- **Hybrid storage strategy** — `sessionStorage` for per-tab isolation (prevents cross-tab state leaks) with `localStorage` as persistent backup (survives browser restarts). On new tab open, bootstraps from localStorage to sessionStorage.
- **Triple token extraction** — Middleware checks `x-auth-token` header → `Authorization: Bearer` header → `?token=` query parameter, supporting diverse client contexts (SPA, API tools, email links).
- **Password policy** — Minimum 8 characters, must include uppercase, lowercase, digit, and special character. Enforced on both frontend (client-side validation) and backend.

### Event Lifecycle

- **Auto-status computation** — Every event fetch runs `computeEventStatus()` which transitions events from `Published → Ongoing → Completed` based on `startDate`/`endDate` vs current time. Organizers never need to manually start/end events.
- **Progressive edit locking** — Draft events allow full editing; Published events restrict edits to description, deadline, limit, and status; form fields lock after the first registration to maintain data consistency.
- **Discord webhook integration** — When an event transitions from Draft → Published, the system automatically posts an announcement to the organizer's configured Discord webhook URL.

### Search & Discovery

- **Fuzzy search** — The search endpoint generates a fuzzy regex that allows one character deviation between each pair of characters, enabling typo-tolerant matching on event names and descriptions.
- **Trending algorithm** — Top 5 events ranked by a combination of `viewCount` and `registrationCount`.
- **Interest-based personalization** — Results are re-sorted by tag overlap with the authenticated user's interest profile, surfacing more relevant events first.
- **Multi-faceted filtering** — Type, status, eligibility, date range, followed clubs, and search can all be combined.

### File Upload Architecture

- **Dual upload profiles** — `upload` middleware restricts to image MIME types with 5 MB limit (for payment proofs); `uploadAny` accepts all file types with 10 MB limit (for form-field attachments like resumes/documents).
- **Unique filenames** — `{timestamp}-{random}{extension}` pattern prevents collisions and enables cache-busting.
- **Static serving** — Uploaded files served via Express static middleware at `/uploads` path.

### Data Models

- **Embedded comments** — Comments are embedded within Event documents (not a separate collection) for atomic reads — fetching an event returns all its discussion data in one query. Supports threaded replies via `parentComment` references and multi-emoji reactions.
- **Dynamic form fields** — Events define custom registration forms via `formFields` array (5 field types: text, number, dropdown, checkbox, file). Participant responses stored as key-value `formData` in tickets. Form schema locks after first registration.
- **Compound unique index** — `{ event, user }` on Ticket model prevents duplicate registrations at the database level.

---

## Implemented Advanced Features (30 Marks)

### Tier A — 8 Marks Each

#### 1. Merchandise Payment Approval Workflow

- **Justification:** Merchandise events involve real monetary transactions. An approval workflow prevents fraudulent orders by requiring payment verification before confirming orders and generating entry QR codes. Without this, anyone could claim to have paid and receive merchandise.

- **Design Choices & Technical Decisions:**
  - **Deferred QR generation** — QR codes are NOT generated when a merchandise order is placed (status: `Pending Approval`). QR codes are only generated upon admin/organizer approval, preventing unauthorized claims.
  - **Stock management** — Stock is decremented only on approval (not on order placement), preventing inventory lock-up from pending/rejected orders.
  - **Per-user purchase limits** — `purchaseLimitPerUser` field enforced server-side by counting existing non-rejected orders, preventing hoarding.
  - **Variant system** — Merchandise supports multiple variants (e.g., Hoodie-M-Black, T-Shirt-L-White) with independent stock tracking per variant.
  - **Payment proof upload** — Multer-based image upload (5 MB limit, image MIME types only). Proof is stored as a URL and displayed as a clickable thumbnail in the organizer's review dashboard.
  - **Organizer-scoped access** — Organizers can only review orders for their own events; enforced via ownership check in the controller.

- **User Flow:**
  1. Participant selects variant, quantity, uploads payment screenshot → Order created as `Pending Approval`
  2. Organizer opens Merch Orders page → sees pending orders with payment proof thumbnails
  3. Organizer clicks Approve → QR generated, stock decremented, status → `Confirmed`
  4. Or Organizer clicks Reject → status → `Rejected`, no stock change

#### 2. QR Scanner & Attendance Tracking

- **Justification:** Manual attendance (checking names off a list) is slow and error-prone for large events. QR-based check-in enables sub-second verification, prevents duplicate entries, and produces accurate attendance analytics automatically.

- **Design Choices & Technical Decisions:**
  - **Three scanning methods** — (1) Live camera scanner using `html5-qrcode` library with rear-camera preference, (2) Image file upload for decoding QR from screenshots/photos, (3) Manual ticket ID text entry as fallback. This ensures attendance works even if camera access is denied or QR is damaged.
  - **Client-side QR decoding** — `html5-qrcode` runs entirely in the browser using the device camera, requiring no server-side image processing or external QR service.
  - **QR code as Data URI** — Generated via `qrcode.toDataURL()` and stored as a base64 string directly in MongoDB. No external file storage needed; the QR renders instantly in ticket views and emails.
  - **Duplicate detection** — Server rejects re-scanning with a clear "already attended" message, preventing double-counting.
  - **Event-scoped validation** — When scanning, the backend verifies the ticket belongs to the organizer's event, preventing cross-event scanning.
  - **Live scan counter** — The scanner tab shows real-time scanned/remaining/total counts, giving organizers instant visibility into check-in progress.
  - **CSV export** — One-click export of participant data including attendance status and timestamps for post-event analysis.
  - **Email with embedded QR** — Registration confirmation emails include the QR code as an inline image, so participants can check in directly from their inbox.

- **User Flow:**
  1. Participant registers → QR code generated and shown in dashboard + sent via email
  2. At event, organizer opens QR Scanner tab → points camera at participant's QR
  3. System decodes QR → validates ticket → marks attended → shows participant details
  4. Organizer views real-time attendance count; exports CSV when event ends

### Tier B — 6 Marks Each

#### 3. Organizer Password Reset Workflow

- **Justification:** Organizer accounts have elevated privileges (event creation, participant data access, merchandise management). A self-service password reset without oversight could be exploited if an organizer's email is compromised. The admin-in-the-loop workflow adds a security layer appropriate for privileged accounts, while participants can use standard email-based reset.

- **Design Choices & Technical Decisions:**
  - **Dual reset paths** — Organizers use an admin-mediated workflow (request → admin review → new password); participants use a standard email token flow with 15-minute expiry and SHA-256 hashed tokens.
  - **Secure token generation** — `crypto.randomBytes(32)` produces 256 bits of entropy. Token is SHA-256 hashed before database storage, so even database leaks don't expose valid tokens.
  - **Admin dashboard integration** — Pending reset requests appear in the admin's Reset Requests page with organizer name, email, and reason. Admin can approve (auto-generates secure password) or reject with one click.
  - **Auto-generated passwords** — On approval, a random password following the pattern `Org{random}!` is generated, hashed, and returned to the admin for secure distribution to the organizer.
  - **SMTP fallback** — If SMTP is not configured, the forgot-password endpoint returns the reset token directly in the API response (development convenience), while in production it sends a proper email with a reset link.

- **User Flow (Organizer):**
  1. Organizer navigates to Profile → clicks "Request Password Reset" → enters reason
  2. Admin sees request in Reset Requests dashboard → clicks Approve
  3. System generates new password → Admin communicates it to organizer securely
  4. Organizer logs in with new password → changes it from Profile

- **User Flow (Participant — Forgot Password):**
  1. Click "Forgot Password?" on login page → enter email
  2. Receive email with reset token → enter token + new password
  3. Password updated → redirected to login

#### 4. Real-Time Discussion Forum

- **Justification:** Event pages are typically static — participants have no way to ask questions, share excitement, or get quick answers from organizers before/during events. A real-time discussion forum increases engagement, reduces separate communication channels (WhatsApp groups, emails), and gives organizers a built-in communication tool with moderation capabilities.

- **Design Choices & Technical Decisions:**
  - **Socket.IO rooms** — Each event has its own room (`event-{eventId}`). Users join on navigating to the event page and leave on departure, ensuring messages are scoped and efficiently broadcast only to interested users.
  - **Embedded comments model** — Comments are stored as a subdocument array within the Event document rather than a separate collection. This enables atomic reads (one query fetches event + all comments) and avoids cross-collection joins. Suitable for the expected comment volume per event.
  - **Threaded replies** — Comments support `parentComment` references enabling nested conversation threads, making discussions more organized than flat comment lists.
  - **Multi-emoji reactions** — Five reaction types (👍 ❤️ 😂 🎉 🔥) with per-user toggle (click to add, click again to remove). Stored as `[{ user, emoji }]` arrays per comment.
  - **Comment pinning** — Organizers can pin important comments (announcements, FAQs) which are highlighted with a gold border and shown prominently. Toggle pin/unpin functionality.
  - **Moderation** — Organizers and admins can delete any comment; broadcast `commentDeleted` event removes it in real-time for all connected users.
  - **Real-time broadcast events** — `commentAdded`, `commentDeleted`, `commentPinned`, `reactionUpdated` are broadcast to the room, keeping all connected clients in sync without polling.
  - **New comment badge** — A counter badge shows unread comment count when the discussion section is collapsed, drawing attention to new activity.

- **User Flow:**
  1. Participant opens event page → discussion section at bottom loads existing comments via REST
  2. Socket.IO connection established → joins event room
  3. User types comment → sent via REST POST → server broadcasts `commentAdded` to room
  4. All connected users see the new comment appear in real-time
  5. Users toggle emoji reactions → broadcast `reactionUpdated`
  6. Organizer pins important comment → broadcast `commentPinned` → all users see gold highlight

### Tier C — 2 Marks

#### 5. Add to Calendar Integration

- **Justification:** Participants register for multiple events across different dates. Without calendar integration, they must manually track event times, leading to missed events. One-click calendar sync eliminates this friction and reduces no-shows.

- **Design Choices & Technical Decisions:**
  - **Three calendar targets** — (1) Downloadable `.ics` file for universal import (Apple Calendar, Thunderbird, etc.), (2) Google Calendar deep link (pre-fills event details in Google's "new event" page), (3) Outlook Web deep link. Covers all major calendar ecosystems.
  - **Server-generated iCalendar** — The backend generates RFC 5545-compliant `.ics` files with `VCALENDAR`/`VEVENT` structure including `DTSTART`, `DTEND`, `SUMMARY`, `DESCRIPTION`, `ORGANIZER`, and `LOCATION` fields. `PRODID` set to `Felicity IIITH`.
  - **No external dependency** — The `.ics` generation is implemented with plain string templating (no ical library needed), keeping the dependency footprint minimal.
  - **Deep link construction** — Google Calendar and Outlook links are constructed client-side using their respective URL schemas with URL-encoded event parameters, opening in a new tab.

- **User Flow:**
  1. Participant views event details page → sees "Add to Calendar" section with three buttons
  2. Clicks "Download .ics" → browser downloads calendar file → opens in default calendar app
  3. Or clicks "Google Calendar" → opens Google Calendar with pre-filled event details
  4. Or clicks "Outlook" → opens Outlook Web with pre-filled event details
