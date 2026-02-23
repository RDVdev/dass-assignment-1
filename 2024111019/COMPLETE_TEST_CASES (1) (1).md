# Felicity EMS - Complete Test Cases Document
**Assignment 1 - DASS**

## Test Environment Setup
- Frontend URL: [Your Vercel URL]
- Backend URL: [Your Render URL]
- Test Browsers: Chrome, Firefox, Safari
- Test Devices: Desktop, Mobile

---

## Part 1: Core System Implementation [70 Marks]

### 1. Authentication & Security [8 Marks]

#### 1.1 Participant Registration [3 Marks]

**Test Case 1.1.1: IIIT Participant Registration - Valid Email**
- **Steps:**
  1. Navigate to registration page
  2. Select "IIIT Student" type
  3. Enter email: `test@iiit.ac.in`
  4. Fill remaining fields: First Name, Last Name, Password, Contact
  5. Click Register
- **Expected Result:**
  - Registration successful
  - Redirected to preferences/onboarding page
  - User record created in database with hashed password
  - Email domain validated as `@iiit.ac.in`

**Test Case 1.1.2: IIIT Participant Registration - Invalid Email Domain**
- **Steps:**
  1. Select "IIIT Student"
  2. Enter email: `test@gmail.com`
  3. Fill remaining fields
  4. Click Register
- **Expected Result:**
  - Error: "IIIT students must use @iiit.ac.in email"
  - Registration blocked

**Test Case 1.1.3: Non-IIIT Participant Registration**
- **Steps:**
  1. Select "Non-IIIT Participant"
  2. Enter email: `participant@college.edu`
  3. Fill: First Name, Last Name, Password, College Name, Contact
  4. Click Register
- **Expected Result:**
  - Registration successful
  - No email domain restriction
  - User created with participant type "Non-IIIT"

**Test Case 1.1.4: Duplicate Email Registration**
- **Steps:**
  1. Register with `test@iiit.ac.in`
  2. Try registering again with same email
- **Expected Result:**
  - Error: "Email already registered"

**Test Case 1.1.5: Weak Password Validation**
- **Steps:**
  1. Enter password: `123`
  2. Try to register
- **Expected Result:**
  - Error: "Password must be at least 6 characters"

**Test Case 1.1.6: Admin Account - No UI Registration**
- **Steps:**
  1. Check registration page
  2. Look for "Admin" role option
- **Expected Result:**
  - No Admin registration option in UI
  - Admin provisioned via backend only

**Test Case 1.1.7: Organizer - No Self Registration**
- **Steps:**
  1. Check registration page
  2. Look for "Organizer" role option
- **Expected Result:**
  - No Organizer registration option
  - Only Admin can create organizers

#### 1.2 Login & Authentication [3 Marks]

**Test Case 1.2.1: Valid Participant Login**
- **Steps:**
  1. Navigate to login page
  2. Enter valid credentials
  3. Click Login
- **Expected Result:**
  - Login successful
  - JWT token stored (check localStorage/cookies)
  - Redirected to Participant Dashboard
  - Token included in subsequent API requests

**Test Case 1.2.2: Invalid Credentials**
- **Steps:**
  1. Enter email: `test@iiit.ac.in`
  2. Enter wrong password
  3. Click Login
- **Expected Result:**
  - Error: "Invalid credentials"
  - Remain on login page

**Test Case 1.2.3: Organizer Login**
- **Steps:**
  1. Use organizer credentials (created by admin)
  2. Login
- **Expected Result:**
  - Redirected to Organizer Dashboard
  - Different navbar/menu than participant

**Test Case 1.2.4: Admin Login**
- **Steps:**
  1. Use admin credentials
  2. Login
- **Expected Result:**
  - Redirected to Admin Dashboard
  - Admin-specific menu visible

**Test Case 1.2.5: Password Hashing Verification**
- **Steps:**
  1. Register a user
  2. Check database directly
- **Expected Result:**
  - Password stored as bcrypt hash (starts with `$2a$` or `$2b$`)
  - Never stored in plaintext

**Test Case 1.2.6: JWT Token Validation**
- **Steps:**
  1. Login successfully
  2. Copy JWT token from browser storage
  3. Make API request without token
- **Expected Result:**
  - Request rejected with 401 Unauthorized

**Test Case 1.2.7: Role-Based Access Control**
- **Steps:**
  1. Login as participant
  2. Try accessing organizer-only route (e.g., create event)
- **Expected Result:**
  - Access denied / redirected
  - 403 Forbidden error

#### 1.3 Session Management [2 Marks]

**Test Case 1.3.1: Session Persistence - Browser Restart**
- **Steps:**
  1. Login successfully
  2. Close browser completely
  3. Reopen browser and navigate to app
- **Expected Result:**
  - User still logged in
  - No re-login required

**Test Case 1.3.2: Logout Functionality**
- **Steps:**
  1. Login successfully
  2. Click Logout
- **Expected Result:**
  - JWT token cleared from storage
  - Redirected to login page
  - Cannot access protected routes

**Test Case 1.3.3: Session After Token Expiry**
- **Steps:**
  1. Login successfully
  2. Wait for token expiry (or manually expire)
  3. Try accessing protected route
- **Expected Result:**
  - Redirected to login
  - Error: "Session expired"

---

### 2. User Onboarding & Preferences [3 Marks]

**Test Case 2.1: Onboarding - Select Preferences**
- **Steps:**
  1. Register as new participant
  2. On onboarding page, select:
     - Areas of Interest: Tech, Music, Gaming
     - Follow clubs: CodeClub, MusicClub
  3. Click Save/Continue
- **Expected Result:**
  - Preferences saved to database
  - Redirected to dashboard

**Test Case 2.2: Onboarding - Skip Preferences**
- **Steps:**
  1. Register as new participant
  2. Click "Skip" on onboarding
- **Expected Result:**
  - Can skip without error
  - Redirected to dashboard
  - Preferences empty in database

**Test Case 2.3: Edit Preferences from Profile**
- **Steps:**
  1. Login as participant
  2. Go to Profile page
  3. Update interests and followed clubs
  4. Save changes
- **Expected Result:**
  - Preferences updated in database
  - Success message shown

**Test Case 2.4: Preferences Influence Event Ordering**
- **Steps:**
  1. Set preferences: Follow "CodeClub"
  2. Browse events page
- **Expected Result:**
  - CodeClub events shown first/prioritized
  - Or separate "Recommended" section

---

### 3. User Data Models [2 Marks]

**Test Case 3.1: Participant Data Completeness**
- **Steps:**
  1. Register participant with all fields
  2. Check database
- **Expected Result:** Database contains:
  - firstName, lastName, email (unique)
  - participantType (IIIT/Non-IIIT)
  - collegeName, contactNumber
  - password (hashed)
  - interests, followedClubs (arrays)
  - createdAt, updatedAt

**Test Case 3.2: Organizer Data Completeness**
- **Steps:**
  1. Admin creates organizer
  2. Check database
- **Expected Result:** Database contains:
  - organizerName, category, description
  - contactEmail
  - password (hashed)
  - createdAt, updatedAt

**Test Case 3.3: Email Uniqueness Constraint**
- **Steps:**
  1. Create user with email@test.com
  2. Try creating another with same email
- **Expected Result:**
  - Database constraint violation
  - Error returned

---

### 4. Event Types & Attributes [4 Marks]

**Test Case 4.1: Normal Event Creation**
- **Steps:**
  1. Login as organizer
  2. Create event with type "Normal"
  3. Fill all required fields
  4. Add custom registration form fields
- **Expected Result:**
  - Event created with status "Draft"
  - All attributes stored correctly
  - Custom form fields saved

**Test Case 4.2: Merchandise Event Creation**
- **Steps:**
  1. Create event with type "Merchandise"
  2. Add item details: sizes (S, M, L), colors, variants
  3. Set stock quantity: 100
  4. Set purchase limit: 2 per participant
- **Expected Result:**
  - Event created with merchandise-specific fields
  - Stock tracking enabled
  - Purchase limit enforced

**Test Case 4.3: Event Attributes Validation**
- **Steps:**
  1. Create event
  2. Check all fields stored:
- **Expected Result:** Database contains:
  - eventName, description, type
  - eligibility, registrationDeadline
  - eventStartDate, eventEndDate
  - registrationLimit, registrationFee
  - organizerId, eventTags
  - customFormFields (for Normal)
  - merchandiseDetails (for Merchandise)

---

### 5. Participant Features [22 Marks]

#### 5.1 Navigation Menu [1 Mark]

**Test Case 5.1.1: Participant Navbar**
- **Steps:**
  1. Login as participant
  2. Check navbar
- **Expected Result:** Navbar shows:
  - Dashboard
  - Browse Events
  - Clubs/Organizers
  - Profile
  - Logout

#### 5.2 My Events Dashboard [6 Marks]

**Test Case 5.2.1: Upcoming Events Display**
- **Steps:**
  1. Register for 3 upcoming events
  2. Navigate to Dashboard
- **Expected Result:**
  - All 3 events displayed
  - Shows: name, type, organizer, date/time
  - Sorted by date (nearest first)

**Test Case 5.2.2: Participation History - Tabs**
- **Steps:**
  1. Register for events of different types
  2. Check "Participation History" section
- **Expected Result:** Tabs visible:
  - Normal Events
  - Merchandise
  - Completed
  - Cancelled/Rejected

**Test Case 5.2.3: Event Record Details**
- **Steps:**
  1. Click on any event in history
- **Expected Result:** Shows:
  - Event name, type, organizer
  - Participation status
  - Team name (if applicable)
  - Clickable Ticket ID

**Test Case 5.2.4: Empty Dashboard**
- **Steps:**
  1. Login as new participant (no registrations)
  2. Check dashboard
- **Expected Result:**
  - "No upcoming events" message
  - Empty participation history

**Test Case 5.2.5: Ticket ID Link**
- **Steps:**
  1. Click on ticket ID
- **Expected Result:**
  - Opens ticket details
  - Shows QR code
  - Shows event & participant info

#### 5.3 Browse Events Page [5 Marks]

**Test Case 5.3.1: Search - Partial Match**
- **Steps:**
  1. Search: "hack"
  2. Submit
- **Expected Result:**
  - Returns: "Hackathon 2024", "Hack the Night"
  - Partial matching works

**Test Case 5.3.2: Search - Fuzzy Match**
- **Steps:**
  1. Search: "workshp" (typo)
- **Expected Result:**
  - Returns: "Workshop: Web Dev"
  - Fuzzy matching works

**Test Case 5.3.3: Trending Events (Top 5/24h)**
- **Steps:**
  1. Check "Trending" section
- **Expected Result:**
  - Shows max 5 events
  - Based on registrations in last 24 hours

**Test Case 5.3.4: Filter - Event Type**
- **Steps:**
  1. Select filter: "Merchandise Only"
  2. Apply
- **Expected Result:**
  - Only merchandise events shown

**Test Case 5.3.5: Filter - Eligibility**
- **Steps:**
  1. Select: "IIIT Students Only"
- **Expected Result:**
  - Only events eligible for IIIT students shown

**Test Case 5.3.6: Filter - Date Range**
- **Steps:**
  1. Set: Start: Jan 1, End: Jan 31
  2. Apply
- **Expected Result:**
  - Only events in January shown

**Test Case 5.3.7: Filter - Followed Clubs**
- **Steps:**
  1. Follow "CodeClub"
  2. Apply filter: "Followed Clubs Only"
- **Expected Result:**
  - Only CodeClub events shown

**Test Case 5.3.8: Combined Search + Filters**
- **Steps:**
  1. Search: "workshop"
  2. Filter: Date range + Type
- **Expected Result:**
  - Results match both search AND filters

#### 5.4 Event Details Page [2 Marks]

**Test Case 5.4.1: Complete Event Information**
- **Steps:**
  1. Click any event
- **Expected Result:** Shows:
  - Name, description, type badge
  - Organizer, dates, eligibility
  - Registration fee, limit
  - Tags
  - Register/Purchase button

**Test Case 5.4.2: Registration Button - Deadline Passed**
- **Steps:**
  1. View event with past deadline
- **Expected Result:**
  - Button disabled
  - Message: "Registration closed"

**Test Case 5.4.3: Registration Button - Limit Reached**
- **Steps:**
  1. View event with full registrations
- **Expected Result:**
  - Button disabled
  - Message: "Event full"

**Test Case 5.4.4: Merchandise - Out of Stock**
- **Steps:**
  1. View merchandise event with 0 stock
- **Expected Result:**
  - Purchase blocked
  - Message: "Out of stock"

#### 5.5 Event Registration [5 Marks]

**Test Case 5.5.1: Normal Event Registration**
- **Steps:**
  1. Click Register on normal event
  2. Fill custom form fields
  3. Submit
- **Expected Result:**
  - Registration successful
  - Ticket generated with QR code
  - Email sent with ticket
  - Appears in "My Events"

**Test Case 5.5.2: Merchandise Purchase**
- **Steps:**
  1. Select merchandise event
  2. Choose: Size M, Color Blue, Quantity 2
  3. Complete purchase
- **Expected Result:**
  - Stock decremented by 2
  - Ticket with QR generated
  - Confirmation email sent
  - Shows in Merchandise tab

**Test Case 5.5.3: Merchandise - Purchase Limit**
- **Steps:**
  1. Event has limit: 2 per person
  2. Try buying 3 items
- **Expected Result:**
  - Error: "Purchase limit exceeded"
  - Transaction blocked

**Test Case 5.5.4: Duplicate Registration Prevention**
- **Steps:**
  1. Register for event
  2. Try registering again
- **Expected Result:**
  - Error: "Already registered"

**Test Case 5.5.5: Ticket Contents**
- **Steps:**
  1. View generated ticket
- **Expected Result:** Ticket shows:
  - Unique Ticket ID
  - QR code (scannable)
  - Event details (name, date, venue)
  - Participant details (name, email)

#### 5.6 Profile Page [2 Marks]

**Test Case 5.6.1: Edit Editable Fields**
- **Steps:**
  1. Go to Profile
  2. Edit: First Name, Last Name, Contact, College, Interests
  3. Save
- **Expected Result:**
  - Changes saved successfully
  - Database updated

**Test Case 5.6.2: Non-Editable Fields**
- **Steps:**
  1. Check Profile page
- **Expected Result:**
  - Email field disabled/grayed out
  - Participant Type not editable

**Test Case 5.6.3: Password Change**
- **Steps:**
  1. Click "Change Password"
  2. Enter: Old password, New password, Confirm
  3. Submit
- **Expected Result:**
  - Password changed
  - New hash stored in database
  - Can login with new password

**Test Case 5.6.4: Password Change - Wrong Old Password**
- **Steps:**
  1. Enter incorrect old password
  2. Try changing
- **Expected Result:**
  - Error: "Current password incorrect"

#### 5.7 Clubs/Organizers Listing [1 Mark]

**Test Case 5.7.1: View All Organizers**
- **Steps:**
  1. Navigate to Clubs/Organizers page
- **Expected Result:**
  - Lists all organizers
  - Shows: Name, Category, Description

**Test Case 5.7.2: Follow Club**
- **Steps:**
  1. Click "Follow" on CodeClub
- **Expected Result:**
  - Button changes to "Following"
  - Added to followedClubs in database

**Test Case 5.7.3: Unfollow Club**
- **Steps:**
  1. Click "Unfollow"
- **Expected Result:**
  - Button back to "Follow"
  - Removed from followedClubs

#### 5.8 Organizer Detail Page [1 Mark]

**Test Case 5.8.1: Organizer Information**
- **Steps:**
  1. Click on organizer
- **Expected Result:** Shows:
  - Name, Category, Description
  - Contact Email
  - Upcoming Events list
  - Past Events list

**Test Case 5.8.2: View Organizer Events**
- **Steps:**
  1. Check events section
- **Expected Result:**
  - Upcoming events listed first
  - Past events in separate section
  - Each event clickable

---

### 6. Organizer Features [18 Marks]

#### 6.1 Navigation Menu [1 Mark]

**Test Case 6.1.1: Organizer Navbar**
- **Steps:**
  1. Login as organizer
- **Expected Result:** Navbar shows:
  - Dashboard
  - Create Event
  - Ongoing Events
  - Profile
  - Logout

#### 6.2 Organizer Dashboard [3 Marks]

**Test Case 6.2.1: Events Carousel**
- **Steps:**
  1. Create 5 events with different statuses
  2. Check dashboard
- **Expected Result:**
  - All events shown as cards
  - Each card shows: Name, Type, Status
  - Status badges: Draft/Published/Ongoing/Closed
  - Click to view details

**Test Case 6.2.2: Event Analytics**
- **Steps:**
  1. Complete an event with registrations
  2. Check analytics section
- **Expected Result:** Shows:
  - Total registrations
  - Total sales/revenue
  - Attendance percentage
  - Stats for all completed events

**Test Case 6.2.3: Empty Dashboard**
- **Steps:**
  1. Login as new organizer (no events)
- **Expected Result:**
  - Message: "No events created yet"
  - "Create Event" button visible

#### 6.3 Event Detail Page (Organizer) [4 Marks]

**Test Case 6.3.1: Event Overview Section**
- **Steps:**
  1. Click on any event
- **Expected Result:** Shows:
  - Name, Type, Status
  - Dates, Eligibility, Pricing
  - Edit button (if allowed)

**Test Case 6.3.2: Analytics Tab**
- **Steps:**
  1. View completed event
- **Expected Result:** Shows:
  - Total registrations/sales
  - Attendance count
  - Team completion % (if team event)
  - Revenue generated

**Test Case 6.3.3: Participants List**
- **Steps:**
  1. View event with registrations
  2. Check Participants tab
- **Expected Result:** Shows table:
  - Name, Email, Registration Date
  - Payment Status, Team, Attendance
  - Pagination if >50 participants

**Test Case 6.3.4: Search Participants**
- **Steps:**
  1. Search: "John"
- **Expected Result:**
  - Filters list to matching participants

**Test Case 6.3.5: Export CSV**
- **Steps:**
  1. Click "Export CSV"
- **Expected Result:**
  - CSV file downloaded
  - Contains all participant data

#### 6.4 Event Creation & Editing [4 Marks]

**Test Case 6.4.1: Create Event - Draft**
- **Steps:**
  1. Click "Create Event"
  2. Fill required fields
  3. Save as Draft
- **Expected Result:**
  - Event saved with status "Draft"
  - Visible only to organizer
  - Can edit freely

**Test Case 6.4.2: Publish Event**
- **Steps:**
  1. Open draft event
  2. Click "Publish"
- **Expected Result:**
  - Status changed to "Published"
  - Visible to all participants
  - Appears in Browse Events

**Test Case 6.4.3: Edit Draft Event**
- **Steps:**
  1. Edit any field in draft
  2. Save
- **Expected Result:**
  - All changes allowed
  - Can change any field

**Test Case 6.4.4: Edit Published Event - Allowed Changes**
- **Steps:**
  1. Published event
  2. Try editing: Description, Deadline, Limit
- **Expected Result:**
  - These fields editable
  - Can extend deadline
  - Can increase limit
  - Cannot decrease limit/fee

**Test Case 6.4.5: Edit Published Event - Restricted Changes**
- **Steps:**
  1. Try editing: Event Name, Type, Fee
- **Expected Result:**
  - Error: "Cannot modify these fields"

**Test Case 6.4.6: Close Registrations**
- **Steps:**
  1. Published event
  2. Click "Close Registrations"
- **Expected Result:**
  - Status: "Closed"
  - New registrations blocked

**Test Case 6.4.7: Form Builder - Add Fields**
- **Steps:**
  1. Create normal event
  2. Add custom fields: Text, Dropdown, Checkbox, File
  3. Mark some as required
  4. Reorder fields
  5. Save
- **Expected Result:**
  - Custom form saved
  - Correct field types
  - Required validation works

**Test Case 6.4.8: Form Builder - Lock After Registration**
- **Steps:**
  1. Create event with custom form
  2. Get 1 registration
  3. Try editing form
- **Expected Result:**
  - Form locked
  - Cannot add/remove/edit fields

#### 6.5 Organizer Profile [4 Marks]

**Test Case 6.5.1: Edit Profile**
- **Steps:**
  1. Go to Profile
  2. Edit: Name, Category, Description, Contact
  3. Save
- **Expected Result:**
  - Changes saved
  - Login email non-editable

**Test Case 6.5.2: Discord Webhook Setup**
- **Steps:**
  1. Add Discord webhook URL
  2. Save
  3. Create and publish new event
- **Expected Result:**
  - Webhook URL saved
  - Event auto-posted to Discord channel

**Test Case 6.5.3: Discord Webhook - Invalid URL**
- **Steps:**
  1. Enter invalid webhook URL
  2. Save
- **Expected Result:**
  - Validation error
  - Not saved

**Test Case 6.5.4: Password Change**
- **Steps:**
  1. Change password
- **Expected Result:**
  - Password changed successfully
  - Can login with new password

---

### 7. Admin Features [6 Marks]

#### 7.1 Navigation Menu [1 Mark]

**Test Case 7.1.1: Admin Navbar**
- **Steps:**
  1. Login as admin
- **Expected Result:** Navbar shows:
  - Dashboard
  - Manage Clubs/Organizers
  - Password Reset Requests
  - Logout

#### 7.2 Club Management [5 Marks]

**Test Case 7.2.1: Add New Organizer**
- **Steps:**
  1. Go to Manage Clubs
  2. Click "Add New"
  3. Fill: Name, Category, Description, Contact
  4. Click Create
- **Expected Result:**
  - System auto-generates: Email, Password
  - Admin receives credentials
  - Organizer account created
  - Can immediately login

**Test Case 7.2.2: View All Organizers**
- **Steps:**
  1. Go to Manage Clubs
- **Expected Result:**
  - Lists all organizers
  - Shows: Name, Category, Status, Actions

**Test Case 7.2.3: Remove Organizer - Disable**
- **Steps:**
  1. Select organizer
  2. Click "Disable"
- **Expected Result:**
  - Account disabled
  - Cannot login
  - Events still visible

**Test Case 7.2.4: Remove Organizer - Delete**
- **Steps:**
  1. Select organizer
  2. Click "Delete" (with confirmation)
- **Expected Result:**
  - Account deleted from database
  - All associated events archived/deleted

**Test Case 7.2.5: Reactivate Disabled Organizer**
- **Steps:**
  1. Disabled organizer
  2. Click "Enable"
- **Expected Result:**
  - Account reactivated
  - Can login again

---

### 8. Deployment [5 Marks]

**Test Case 8.1: Frontend Deployment**
- **Steps:**
  1. Check provided frontend URL
  2. Open in browser
- **Expected Result:**
  - App loads successfully
  - No console errors
  - All pages accessible

**Test Case 8.2: Backend Deployment**
- **Steps:**
  1. Check API base URL
  2. Test endpoint: `/api/health`
- **Expected Result:**
  - Returns 200 OK
  - API accessible

**Test Case 8.3: Database Connection**
- **Steps:**
  1. Perform any operation (register user)
  2. Check MongoDB Atlas
- **Expected Result:**
  - Data saved to Atlas
  - Connection string in env variable

**Test Case 8.4: Environment Variables**
- **Steps:**
  1. Check if sensitive data exposed
- **Expected Result:**
  - No hardcoded secrets in code
  - All configs in env variables

**Test Case 8.5: deployment.txt File**
- **Steps:**
  1. Check root directory
- **Expected Result:**
  - File exists with:
    - Frontend URL
    - Backend URL

---

## Part 2: Advanced Features [30 Marks]

### Tier A Features (Choose 2 - 8 marks each)

#### A1: Hackathon Team Registration [8 Marks]

**Test Case A1.1: Create Team**
- **Steps:**
  1. Register for hackathon event
  2. Choose "Create Team"
  3. Enter: Team name, Set size: 4
  4. Create
- **Expected Result:**
  - Team created
  - User becomes team leader
  - Unique team code generated

**Test Case A1.2: Generate Invite Link**
- **Steps:**
  1. As team leader, view team
  2. Copy invite link/code
- **Expected Result:**
  - Shareable link generated
  - Code visible

**Test Case A1.3: Join Team via Code**
- **Steps:**
  1. As another user, register for event
  2. Choose "Join Team"
  3. Enter team code
  4. Submit
- **Expected Result:**
  - Request sent to team leader
  - Pending status

**Test Case A1.4: Accept Team Member**
- **Steps:**
  1. As team leader, view pending invites
  2. Click "Accept"
- **Expected Result:**
  - Member added to team
  - Member count updated

**Test Case A1.5: Reject Team Member**
- **Steps:**
  1. As team leader
  2. Click "Reject" on pending invite
- **Expected Result:**
  - Invite rejected
  - Member can try joining another team

**Test Case A1.6: Team Full - Auto Complete**
- **Steps:**
  1. Accept members until team size reached (4/4)
- **Expected Result:**
  - Team status: "Complete"
  - Registration marked complete
  - Tickets generated for ALL members
  - Email sent to all members

**Test Case A1.7: Leave Team**
- **Steps:**
  1. As team member (not leader)
  2. Click "Leave Team"
- **Expected Result:**
  - Removed from team
  - Can join another team

**Test Case A1.8: Disband Team**
- **Steps:**
  1. As team leader
  2. Click "Disband Team"
- **Expected Result:**
  - Team deleted
  - All members notified
  - Can form new teams

**Test Case A1.9: Team Management Dashboard**
- **Steps:**
  1. As team leader, view dashboard
- **Expected Result:** Shows:
  - Current members
  - Pending invites
  - Team code
  - Team completion status

#### A2: Merchandise Payment Approval [8 Marks]

**Test Case A2.1: Purchase with Payment Proof**
- **Steps:**
  1. Select merchandise
  2. Add to cart
  3. Checkout
  4. Upload payment proof (image)
  5. Submit order
- **Expected Result:**
  - Order status: "Pending Approval"
  - Stock NOT yet decremented
  - NO QR code generated
  - Order appears in organizer approval queue

**Test Case A2.2: Organizer View Pending Orders**
- **Steps:**
  1. Login as organizer
  2. Go to "Pending Approvals" tab
- **Expected Result:** Shows list with:
  - Order ID, Participant name, Item details
  - Payment proof (viewable)
  - Status: Pending
  - Actions: Approve/Reject

**Test Case A2.3: View Payment Proof**
- **Steps:**
  1. Click on payment proof image
- **Expected Result:**
  - Image opens in modal/new tab
  - Can zoom/download

**Test Case A2.4: Approve Payment**
- **Steps:**
  1. Click "Approve" on order
  2. Confirm
- **Expected Result:**
  - Order status: "Successful"
  - Stock decremented
  - QR code + ticket generated
  - Confirmation email sent
  - Order moves to "Approved" tab

**Test Case A2.5: Reject Payment**
- **Steps:**
  1. Click "Reject" on order
  2. Enter reason: "Invalid payment proof"
  3. Submit
- **Expected Result:**
  - Order status: "Rejected"
  - Stock NOT decremented
  - NO ticket/QR generated
  - Rejection email sent with reason
  - Participant can resubmit

**Test Case A2.6: Resubmit After Rejection**
- **Steps:**
  1. Participant views rejected order
  2. Uploads new payment proof
  3. Resubmit
- **Expected Result:**
  - Order back to "Pending"
  - Appears in approval queue again

**Test Case A2.7: Multiple Orders Management**
- **Steps:**
  1. Create 10 pending orders
  2. Approve 5, Reject 3
  3. Check tabs
- **Expected Result:**
  - Pending tab: 2 orders
  - Approved tab: 5 orders
  - Rejected tab: 3 orders

#### A3: QR Scanner & Attendance [8 Marks]

**Test Case A3.1: Access QR Scanner**
- **Steps:**
  1. Login as organizer
  2. Open ongoing event
  3. Click "Scan QR"
- **Expected Result:**
  - Camera permission requested
  - Scanner interface opens

**Test Case A3.2: Scan Valid QR - Camera**
- **Steps:**
  1. Point camera at participant's ticket QR
  2. Wait for scan
- **Expected Result:**
  - QR decoded
  - Participant details shown
  - "Mark Attendance" button

**Test Case A3.3: Mark Attendance**
- **Steps:**
  1. After scanning valid QR
  2. Click "Mark Attendance"
- **Expected Result:**
  - Attendance marked
  - Timestamp recorded
  - Success message
  - Participant marked as "Attended"

**Test Case A3.4: Duplicate Scan Prevention**
- **Steps:**
  1. Scan same QR again
  2. Try marking attendance
- **Expected Result:**
  - Error: "Already marked present"
  - Shows previous attendance time

**Test Case A3.5: Scan QR - File Upload**
- **Steps:**
  1. Click "Upload QR Image"
  2. Select QR code image file
  3. Upload
- **Expected Result:**
  - QR decoded from image
  - Same flow as camera scan

**Test Case A3.6: Invalid QR Code**
- **Steps:**
  1. Scan random QR (not event ticket)
- **Expected Result:**
  - Error: "Invalid ticket"
  - No attendance marked

**Test Case A3.7: Live Attendance Dashboard**
- **Steps:**
  1. View event attendance page
- **Expected Result:** Shows:
  - Total registered: 100
  - Scanned: 75
  - Not scanned: 25
  - Real-time updates
  - List of participants with status

**Test Case A3.8: Export Attendance Report**
- **Steps:**
  1. Click "Export CSV"
- **Expected Result:**
  - CSV downloaded with:
    - Name, Email, Registration Date
    - Attendance Status, Timestamp

**Test Case A3.9: Manual Attendance Override**
- **Steps:**
  1. Find participant in list
  2. Click "Mark Present" manually
  3. Enter reason: "Lost ticket"
- **Expected Result:**
  - Attendance marked
  - Audit log entry created
  - Reason recorded

**Test Case A3.10: Audit Log**
- **Steps:**
  1. View attendance audit log
- **Expected Result:** Shows:
  - All manual overrides
  - Who performed action
  - Timestamp, Reason

---

### Tier B Features (Choose 2 - 6 marks each)

#### B1: Real-Time Discussion Forum [6 Marks]

**Test Case B1.1: Access Discussion Forum**
- **Steps:**
  1. Register for event
  2. Go to Event Details page
  3. Check for Discussion tab/section
- **Expected Result:**
  - Forum visible
  - Can view messages
  - Post message box visible

**Test Case B1.2: Post Message - Participant**
- **Steps:**
  1. Type message: "What's the venue?"
  2. Click Post
- **Expected Result:**
  - Message appears immediately (real-time)
  - Shows author name
  - Timestamp

**Test Case B1.3: Post Message - Organizer**
- **Steps:**
  1. Login as organizer
  2. Post message in event forum
- **Expected Result:**
  - Message posted
  - Badge shows "Organizer"
  - Different styling

**Test Case B1.4: Real-Time Message Delivery**
- **Steps:**
  1. Open forum in two browsers
  2. Post in browser A
- **Expected Result:**
  - Message appears in browser B INSTANTLY
  - No page refresh needed

**Test Case B1.5: Post Announcement**
- **Steps:**
  1. As organizer
  2. Check "Post as Announcement"
  3. Post message
- **Expected Result:**
  - Message highlighted/pinned at top
  - Icon/badge shows "Announcement"

**Test Case B1.6: Pin Message**
- **Steps:**
  1. As organizer
  2. Click "Pin" on participant message
- **Expected Result:**
  - Message pinned to top
  - Shows pin icon

**Test Case B1.7: Delete Message**
- **Steps:**
  1. As organizer
  2. Click "Delete" on message
- **Expected Result:**
  - Message removed
  - "Message deleted" shown

**Test Case B1.8: React to Message**
- **Steps:**
  1. Click reaction button on message
  2. Select emoji: 👍
- **Expected Result:**
  - Reaction added
  - Count updated
  - Real-time for all users

**Test Case B1.9: Message Threading**
- **Steps:**
  1. Click "Reply" on message
  2. Post reply
- **Expected Result:**
  - Reply indented/nested
  - Shows parent message

**Test Case B1.10: Notification for New Messages**
- **Steps:**
  1. New message posted in forum
  2. Check for notification
- **Expected Result:**
  - Notification badge on Discussion tab
  - Unread count shown

#### B2: Organizer Password Reset [6 Marks]

**Test Case B2.1: Request Password Reset**
- **Steps:**
  1. Login as organizer
  2. Go to Profile → Security
  3. Click "Request Password Reset"
  4. Enter reason: "Forgot password"
  5. Submit
- **Expected Result:**
  - Request created
  - Status: "Pending"
  - Admin notified

**Test Case B2.2: Admin View Reset Requests**
- **Steps:**
  1. Login as admin
  2. Go to "Password Reset Requests"
- **Expected Result:** Lists all requests with:
  - Organizer name
  - Request date
  - Reason
  - Status (Pending/Approved/Rejected)
  - Actions

**Test Case B2.3: Admin Approve Reset**
- **Steps:**
  1. Select pending request
  2. Click "Approve"
  3. Confirm
- **Expected Result:**
  - System auto-generates new password
  - Admin receives password (in UI)
  - Request status: "Approved"
  - Organizer notified

**Test Case B2.4: Admin Reject Reset**
- **Steps:**
  1. Select pending request
  2. Click "Reject"
  3. Enter comment: "Identity not verified"
  4. Submit
- **Expected Result:**
  - Status: "Rejected"
  - Comment saved
  - Organizer notified with reason

**Test Case B2.5: View Reset History**
- **Steps:**
  1. Check organizer profile
- **Expected Result:**
  - Shows all past reset requests
  - Dates, status, comments

**Test Case B2.6: Login with New Password**
- **Steps:**
  1. After approval, organizer receives new password
  2. Logout
  3. Login with new password
- **Expected Result:**
  - Login successful
  - Old password no longer works

#### B3: Team Chat [6 Marks]

**Test Case B3.1: Access Team Chat**
- **Steps:**
  1. Form complete team (Tier A feature)
  2. Go to Team Dashboard
  3. Click "Team Chat"
- **Expected Result:**
  - Chat room opens
  - Shows team members list
  - Message input box

**Test Case B3.2: Send Message**
- **Steps:**
  1. Type: "Hello team!"
  2. Press Enter/Send
- **Expected Result:**
  - Message sent
  - Appears in chat immediately
  - Timestamp shown

**Test Case B3.3: Real-Time Delivery**
- **Steps:**
  1. Open chat in two team members' browsers
  2. Send message from A
- **Expected Result:**
  - Message appears in B instantly
  - No refresh needed

**Test Case B3.4: Message History**
- **Steps:**
  1. Send 50 messages
  2. Scroll up
- **Expected Result:**
  - All messages visible
  - Oldest at top
  - Pagination or infinite scroll

**Test Case B3.5: Online Status**
- **Steps:**
  1. Check team members list
- **Expected Result:**
  - Online members: Green dot
  - Offline members: Gray dot

**Test Case B3.6: Typing Indicator**
- **Steps:**
  1. Member A starts typing
  2. Check member B's view
- **Expected Result:**
  - "Member A is typing..." shown

**Test Case B3.7: File Sharing**
- **Steps:**
  1. Click attach file
  2. Upload: document.pdf
  3. Send
- **Expected Result:**
  - File uploaded
  - Link/preview shown in chat
  - Others can download

**Test Case B3.8: Link Sharing**
- **Steps:**
  1. Post: https://github.com/...
- **Expected Result:**
  - Link clickable
  - Preview shown (if possible)

**Test Case B3.9: Notification for New Messages**
- **Steps:**
  1. New message received when chat closed
- **Expected Result:**
  - Notification badge
  - Unread count

---

### Tier C Features (Choose 1 - 2 marks each)

#### C1: Anonymous Feedback System [2 Marks]

**Test Case C1.1: Submit Feedback**
- **Steps:**
  1. Attend and complete event
  2. Go to event page
  3. Click "Leave Feedback"
  4. Select rating: 4 stars
  5. Comment: "Great event!"
  6. Submit
- **Expected Result:**
  - Feedback saved anonymously
  - No name shown to organizer
  - Success message

**Test Case C1.2: One Feedback Per Event**
- **Steps:**
  1. Submit feedback
  2. Try submitting again
- **Expected Result:**
  - Error: "Already submitted"
  - Or message: "You gave X stars"

**Test Case C1.3: View Feedback - Organizer**
- **Steps:**
  1. Login as organizer
  2. Go to completed event
  3. Click "Feedback" tab
- **Expected Result:** Shows:
  - Total feedback count
  - Average rating
  - Rating distribution (5★: 10, 4★: 5, etc.)
  - Anonymous comments list

**Test Case C1.4: Filter by Rating**
- **Steps:**
  1. Click "5 Stars Only"
- **Expected Result:**
  - Only 5-star feedback shown

**Test Case C1.5: Export Feedback**
- **Steps:**
  1. Click "Export CSV"
- **Expected Result:**
  - CSV downloaded with:
    - Rating, Comment, Date
    - NO participant names (anonymous)

#### C2: Add to Calendar [2 Marks]

**Test Case C2.1: Download .ics File**
- **Steps:**
  1. Register for event
  2. Click "Add to Calendar"
  3. Select "Download .ics"
- **Expected Result:**
  - .ics file downloaded
  - Can import to any calendar app

**Test Case C2.2: Google Calendar Integration**
- **Steps:**
  1. Click "Add to Calendar"
  2. Select "Google Calendar"
- **Expected Result:**
  - Redirects to Google Calendar
  - Event pre-filled
  - Click Add confirms

**Test Case C2.3: Outlook Integration**
- **Steps:**
  1. Select "Outlook"
- **Expected Result:**
  - Opens Outlook (web/app)
  - Event details pre-filled

**Test Case C2.4: Timezone Handling**
- **Steps:**
  1. Event in: IST
  2. User timezone: EST
  3. Add to calendar
- **Expected Result:**
  - Time converted correctly
  - Shows in user's timezone

**Test Case C2.5: Reminder Configuration**
- **Steps:**
  1. Before downloading
  2. Set reminder: "1 hour before"
  3. Download
- **Expected Result:**
  - Reminder included in .ics
  - Calendar app honors reminder

**Test Case C2.6: Batch Export**
- **Steps:**
  1. Select multiple registered events
  2. Click "Export All"
- **Expected Result:**
  - Single .ics with all events
  - Or multiple .ics files

#### C3: Bot Protection [2 Marks]

**Test Case C3.1: CAPTCHA on Registration**
- **Steps:**
  1. Navigate to registration page
  2. Fill form
- **Expected Result:**
  - CAPTCHA challenge shown
  - Must complete before submit

**Test Case C3.2: CAPTCHA on Login**
- **Steps:**
  1. Go to login page
- **Expected Result:**
  - CAPTCHA shown (reCAPTCHA v2/v3)
  - Must verify

**Test Case C3.3: Failed Login Rate Limiting**
- **Steps:**
  1. Try logging in with wrong password 5 times
- **Expected Result:**
  - After 5 attempts: Temporary block
  - Message: "Too many attempts, try later"
  - Block duration: 15 minutes

**Test Case C3.4: IP-Based Blocking**
- **Steps:**
  1. Simulate 10 failed logins from same IP
- **Expected Result:**
  - IP blocked
  - All requests from that IP rejected

**Test Case C3.5: Admin Security Dashboard**
- **Steps:**
  1. Login as admin
  2. Go to Security Events
- **Expected Result:** Shows:
  - Failed login attempts
  - Blocked IPs
  - CAPTCHA challenge stats
  - Timestamp, User attempts

**Test Case C3.6: Unblock IP**
- **Steps:**
  1. Select blocked IP
  2. Click "Unblock"
- **Expected Result:**
  - IP removed from blocklist
  - Can access again

---

## Cross-Cutting Test Cases

### Performance Tests

**Test Case P.1: Page Load Time**
- **Steps:** Load any page
- **Expected Result:** < 3 seconds

**Test Case P.2: API Response Time**
- **Steps:** Make API call
- **Expected Result:** < 500ms for most endpoints

**Test Case P.3: Large Dataset Handling**
- **Steps:** Browse events with 1000+ events
- **Expected Result:** Pagination works, no lag

### Security Tests

**Test Case S.1: SQL Injection Prevention**
- **Steps:** Try SQL in search: `' OR '1'='1`
- **Expected Result:** Treated as string, no injection

**Test Case S.2: XSS Prevention**
- **Steps:** Post message: `<script>alert('XSS')</script>`
- **Expected Result:** Sanitized, no script execution

**Test Case S.3: CSRF Protection**
- **Steps:** Make API call without CSRF token
- **Expected Result:** Request rejected

### Responsive Design Tests

**Test Case R.1: Mobile View**
- **Steps:** Open app on mobile device
- **Expected Result:** Responsive layout, all features work

**Test Case R.2: Tablet View**
- **Steps:** Open on tablet
- **Expected Result:** Optimized layout

**Test Case R.3: Desktop View**
- **Steps:** Various screen sizes
- **Expected Result:** Scales properly

### Browser Compatibility Tests

**Test Case B.1: Chrome**
- **Expected Result:** All features work

**Test Case B.2: Firefox**
- **Expected Result:** All features work

**Test Case B.3: Safari**
- **Expected Result:** All features work

**Test Case B.4: Edge**
- **Expected Result:** All features work

---

## Evaluation Preparation

### Code Explanation Tests

Be prepared to explain:

1. **Authentication Flow**
   - How JWT works
   - Token generation/validation
   - Role-based middleware

2. **Database Schema**
   - Why certain fields
   - Relationships
   - Indexes

3. **Real-Time Implementation**
   - Socket.IO setup
   - Event handling
   - Room management

4. **State Management**
   - React Context/Redux
   - Why chosen approach

5. **API Design**
   - RESTful principles
   - Error handling
   - Status codes

### Demo Scenarios

**Scenario 1: Complete Participant Journey**
1. Register → Set preferences → Browse → Register for event → Receive ticket → Provide feedback

**Scenario 2: Organizer Workflow**
1. Login → Create event → Publish → View registrations → Mark attendance → View analytics

**Scenario 3: Admin Tasks**
1. Create organizer → Manage password reset → View security logs

**Scenario 4: Team Event**
1. Create team → Invite members → Complete team → Get tickets

**Scenario 5: Merchandise with Approval**
1. Purchase → Upload proof → Organizer approve → Receive ticket

---

## Test Data Setup

### Users to Create:

1. **Admin**
   - Email: admin@felicity.com
   - Password: Admin@123

2. **Participants**
   - IIIT: student@iiit.ac.in
   - Non-IIIT: participant@college.edu

3. **Organizers**
   - CodeClub
   - MusicClub
   - SportsClub

### Events to Create:

1. **Normal Event**
   - Workshop: Web Development
   - Deadline: Future
   - Custom form fields

2. **Merchandise Event**
   - T-Shirt Sale
   - Multiple variants
   - Limited stock

3. **Team Event** (if Tier A1 implemented)
   - Hackathon 2024
   - Team size: 4

4. **Completed Event**
   - Past event with attendees
   - For testing feedback

---

## Success Criteria Summary

### Core Features (70 Marks):
- ✅ Authentication & Security (8)
- ✅ Onboarding & Preferences (3)
- ✅ Data Models (2)
- ✅ Event Management (4)
- ✅ Participant Features (22)
- ✅ Organizer Features (18)
- ✅ Admin Features (6)
- ✅ Deployment (5)

### Advanced Features (30 Marks):
- ✅ Tier A: 2 features (16 marks)
- ✅ Tier B: 2 features (12 marks)
- ✅ Tier C: 1 feature (2 marks)

**Total: 100 Marks**

---

## Notes for Testing

1. **Test in Order**: Follow test case numbers sequentially
2. **Document Issues**: Note any failing test cases
3. **Screenshot Evidence**: Capture key flows
4. **Performance Metrics**: Record load times
5. **Browser Console**: Check for errors
6. **Network Tab**: Verify API calls
7. **Database**: Verify data integrity

## Final Checklist

- [ ] All authentication flows work
- [ ] All user roles function correctly
- [ ] Events can be created, edited, published
- [ ] Registration/purchase workflows complete
- [ ] Tickets generated with QR codes
- [ ] Email notifications sent
- [ ] Real-time features work (if implemented)
- [ ] Payment approval flow works (if implemented)
- [ ] Team features work (if implemented)
- [ ] Feedback system works (if implemented)
- [ ] Deployed and accessible
- [ ] deployment.txt file present
- [ ] README.md documents features
- [ ] Can explain all code written

---

**Good luck with your testing and evaluation!** 🚀
