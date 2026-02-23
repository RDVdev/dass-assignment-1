#!/bin/bash
# Comprehensive Test Script for Felicity Event Management App
set -e
BASE=http://localhost:5000/api
PASS=0
FAIL=0
TOTAL=0

check() {
  TOTAL=$((TOTAL+1))
  local test_name="$1"
  local expected="$2"
  local actual="$3"
  if echo "$actual" | grep -qi "$expected"; then
    echo "  ✓ $test_name"
    PASS=$((PASS+1))
  else
    echo "  ✗ $test_name"
    echo "    Expected: $expected"
    echo "    Got: $actual"
    FAIL=$((FAIL+1))
  fi
}

check_status() {
  TOTAL=$((TOTAL+1))
  local test_name="$1"
  local expected_code="$2"
  local actual_code="$3"
  local body="$4"
  if [ "$actual_code" = "$expected_code" ]; then
    echo "  ✓ $test_name (HTTP $actual_code)"
    PASS=$((PASS+1))
  else
    echo "  ✗ $test_name (Expected HTTP $expected_code, got $actual_code)"
    echo "    Body: $body"
    FAIL=$((FAIL+1))
  fi
}

# Helper: make request and capture status code + body
req() {
  local method="$1"
  local url="$2"
  local data="$3"
  local token="$4"
  local extra="$5"
  local headers="-H 'Content-Type: application/json'"
  if [ -n "$token" ]; then
    headers="$headers -H 'x-auth-token: $token'"
  fi
  if [ -n "$data" ]; then
    eval "curl -s -w '\n%{http_code}' -X $method $url $headers -d '$data' $extra"
  else
    eval "curl -s -w '\n%{http_code}' -X $method $url $headers $extra"
  fi
}

parse_response() {
  local resp="$1"
  BODY=$(echo "$resp" | sed '$d')
  CODE=$(echo "$resp" | tail -1)
}

extract_json() {
  echo "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d$2)" 2>/dev/null || echo ""
}

echo "=============================================="
echo "  FELICITY TEST SUITE"
echo "=============================================="

# Clean up test data from previous runs
echo "Cleaning up previous test data..."
cd /home/devansh/sem4/dass/dass-assignment-1/2024111019/backend
node fix_data.js
cd /home/devansh/sem4/dass/dass-assignment-1/2024111019

# ================================
echo ""
echo "--- 1. AUTHENTICATION & SECURITY ---"
echo ""

# Clean up test users first
echo "Cleaning up test data..."

# TEST 1.1: Registration with valid IIIT email
echo "Test 1.1: Registration with valid IIIT email"
RESP=$(req POST "$BASE/auth/register" '{"firstName":"TestA","lastName":"One","email":"testa1@students.iiit.ac.in","password":"Test@123","isIIIT":true}')
parse_response "$RESP"
check_status "1.1 Register IIIT student" "201" "$CODE" "$BODY"
check "1.1 Returns token" "token" "$BODY"
check "1.1 Role is participant" "participant" "$BODY"
IIIT_TOKEN=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])" 2>/dev/null || echo "")

# TEST 1.2: Registration with non-IIIT email
echo "Test 1.2: Registration with non-IIIT email"
RESP=$(req POST "$BASE/auth/register" '{"firstName":"TestB","lastName":"Two","email":"testb2@college.edu","password":"Test@123","isIIIT":false,"collegeName":"MIT"}')
parse_response "$RESP"
check_status "1.2 Register non-IIIT student" "201" "$CODE" "$BODY"
NON_IIIT_TOKEN=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])" 2>/dev/null || echo "")

# TEST 1.3: Duplicate email
echo "Test 1.3: Duplicate email registration"
RESP=$(req POST "$BASE/auth/register" '{"firstName":"TestA","lastName":"One","email":"testa1@students.iiit.ac.in","password":"Test@123","isIIIT":true}')
parse_response "$RESP"
check_status "1.3 Duplicate email rejected" "400" "$CODE" "$BODY"
check "1.3 Error message" "already" "$BODY"

# TEST 1.4: IIIT student with non-IIIT email
echo "Test 1.4: IIIT student with non-IIIT email"
RESP=$(req POST "$BASE/auth/register" '{"firstName":"Bad","lastName":"Email","email":"bad@gmail.com","password":"Test@123","isIIIT":true}')
parse_response "$RESP"
check_status "1.4 IIIT with wrong email rejected" "400" "$CODE" "$BODY"
check "1.4 Must use IIIT email" "IIIT email" "$BODY"

# TEST 1.5: Login with valid credentials
echo "Test 1.5: Login with valid credentials"
RESP=$(req POST "$BASE/auth/login" '{"email":"testa1@students.iiit.ac.in","password":"Test@123"}')
parse_response "$RESP"
check_status "1.5 Login success" "200" "$CODE" "$BODY"
check "1.5 Returns token" "token" "$BODY"
PARTICIPANT_TOKEN=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])" 2>/dev/null || echo "")

# TEST 1.6: Login with wrong password
echo "Test 1.6: Login with wrong password"
RESP=$(req POST "$BASE/auth/login" '{"email":"testa1@students.iiit.ac.in","password":"WrongPass"}')
parse_response "$RESP"
check_status "1.6 Wrong password rejected" "401" "$CODE" "$BODY"
check "1.6 Invalid credentials msg" "Invalid" "$BODY"

# TEST 1.7: JWT token validation
echo "Test 1.7: JWT token on protected route"
RESP=$(req GET "$BASE/auth/me" "" "$PARTICIPANT_TOKEN")
parse_response "$RESP"
check_status "1.7 Valid token works" "200" "$CODE" "$BODY"
check "1.7 Returns user data" "email" "$BODY"

# TEST 1.8: No token on protected route
echo "Test 1.8: No token on protected route"
RESP=$(req GET "$BASE/auth/me")
parse_response "$RESP"
check_status "1.8 No token rejected" "401" "$CODE" "$BODY"

# TEST 1.9: Invalid token
echo "Test 1.9: Invalid token"
RESP=$(req GET "$BASE/auth/me" "" "invalidtoken123")
parse_response "$RESP"
check_status "1.9 Invalid token rejected" "401" "$CODE" "$BODY"

# Login as admin
echo ""
echo "Logging in as admin..."
RESP=$(req POST "$BASE/auth/login" '{"email":"admin@felicity.iiit.ac.in","password":"Pass@123"}')
parse_response "$RESP"
ADMIN_TOKEN=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])" 2>/dev/null || echo "")
if [ -z "$ADMIN_TOKEN" ]; then
  echo "  WARNING: Admin login failed. Body: $BODY"
fi

# Login as organizer (ecell)
echo "Logging in as organizer..."
RESP=$(req POST "$BASE/auth/login" '{"email":"ecell@iiit.ac.in","password":"Pass@123"}')
parse_response "$RESP"
ORG_TOKEN=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])" 2>/dev/null || echo "")
ORG_ID=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin)['user']['id'])" 2>/dev/null || echo "")
if [ -z "$ORG_TOKEN" ]; then
  echo "  WARNING: Organizer login failed. Body: $BODY"
fi

# TEST 2.1: RBAC - Participant cannot create event
echo ""
echo "--- 2. ROLE-BASED ACCESS CONTROL ---"
echo ""
echo "Test 2.1: Participant cannot create event"
RESP=$(req POST "$BASE/events" '{"name":"Hack","type":"Normal","status":"Draft"}' "$PARTICIPANT_TOKEN")
parse_response "$RESP"
check_status "2.1 Participant cannot create event" "403" "$CODE" "$BODY"

# TEST 2.2: Participant cannot access admin routes
echo "Test 2.2: Participant cannot access admin routes"
RESP=$(req GET "$BASE/admin/organizers" "" "$PARTICIPANT_TOKEN")
parse_response "$RESP"
check_status "2.2 Participant cannot access admin" "403" "$CODE" "$BODY"

# TEST 2.3: Organizer cannot access admin routes
echo "Test 2.3: Organizer cannot access admin-only routes"
RESP=$(req POST "$BASE/admin/organizers" '{"name":"Fake Org","email":"fake@iiit.ac.in","password":"Test@123"}' "$ORG_TOKEN")
parse_response "$RESP"
check_status "2.3 Organizer cannot create organizer" "403" "$CODE" "$BODY"

# ================================
echo ""
echo "--- 3. ONBOARDING ---"
echo ""

# TEST 3.1: Onboarding not complete for new user
echo "Test 3.1: New user onboarding status"
RESP=$(req GET "$BASE/auth/me" "" "$PARTICIPANT_TOKEN")
parse_response "$RESP"
# The test user registered in 1.1 - check onboarding
ONBOARDING=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin).get('onboardingComplete', False))" 2>/dev/null)
check "3.1 Onboarding not complete" "False" "$ONBOARDING"

# TEST 3.2: Complete onboarding
echo "Test 3.2: Complete onboarding"
RESP=$(req POST "$BASE/auth/onboarding" '{"interests":["Technology","Music"],"following":[]}' "$PARTICIPANT_TOKEN")
parse_response "$RESP"
check_status "3.2 Onboarding success" "200" "$CODE" "$BODY"
check "3.2 Onboarding complete msg" "Onboarding complete" "$BODY"

# TEST 3.3: Verify onboarding complete
echo "Test 3.3: Verify onboarding persisted"
RESP=$(req GET "$BASE/auth/me" "" "$PARTICIPANT_TOKEN")
parse_response "$RESP"
ONBOARDING=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin).get('onboardingComplete', False))" 2>/dev/null)
check "3.3 Onboarding is now True" "True" "$ONBOARDING"

# ================================
echo ""
echo "--- 4. DATA MODELS ---"
echo ""

echo "Test 4.1: User model has required fields"
RESP=$(req GET "$BASE/auth/me" "" "$PARTICIPANT_TOKEN")
parse_response "$RESP"
check "4.1 Has email field" "email" "$BODY"
check "4.1 Has role field" "role" "$BODY"
check "4.1 Has interests field" "interests" "$BODY"

echo "Test 4.2: Event model check (from public events list)"
RESP=$(req GET "$BASE/events")
parse_response "$RESP"
check_status "4.2 Events list loads" "200" "$CODE" "$BODY"
check "4.2 Events have name" "name" "$BODY"
check "4.2 Events have type" "type" "$BODY"

# ================================
echo ""
echo "--- 5. PARTICIPANT FEATURES ---"
echo ""

# TEST 5.1: Browse events
echo "Test 5.1: Browse events"
RESP=$(req GET "$BASE/events")
parse_response "$RESP"
check_status "5.1 Browse events" "200" "$CODE" "$BODY"
EVENT_COUNT=$(echo "$BODY" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))" 2>/dev/null)
check "5.1 Has events" "true" "$([ "$EVENT_COUNT" -gt 0 ] && echo true || echo false)"

# Get first published normal event for testing
EVENT_ID=$(echo "$BODY" | python3 -c "
import sys,json
events = json.load(sys.stdin)
for e in events:
    if e['type']=='Normal' and e['status']=='Published':
        print(e['_id']); break
" 2>/dev/null)
echo "  Using event ID: $EVENT_ID"

# Get a completed event for feedback testing
COMPLETED_EVENT_ID=$(echo "$BODY" | python3 -c "
import sys,json
events = json.load(sys.stdin)
for e in events:
    if e['status']=='Completed':
        print(e['_id']); break
" 2>/dev/null)
echo "  Completed event: $COMPLETED_EVENT_ID"

# Get a hackathon event
HACK_EVENT_ID=$(echo "$BODY" | python3 -c "
import sys,json
events = json.load(sys.stdin)
for e in events:
    if e['type']=='Hackathon' and e['status']=='Published':
        print(e['_id']); break
" 2>/dev/null)
echo "  Hackathon event: $HACK_EVENT_ID"

# Get a merchandise event (may be Published or Ongoing)
MERCH_EVENT_ID=$(echo "$BODY" | python3 -c "
import sys,json
events = json.load(sys.stdin)
for e in events:
    if e['type']=='Merchandise' and e['status'] in ('Published','Ongoing'):
        print(e['_id']); break
" 2>/dev/null)
echo "  Merch event: $MERCH_EVENT_ID"

# TEST 5.2: Filter events by type
echo "Test 5.2: Filter by type=Normal"
RESP=$(req GET "$BASE/events?type=Normal")
parse_response "$RESP"
check_status "5.2 Filter by type" "200" "$CODE" "$BODY"
ALL_NORMAL=$(echo "$BODY" | python3 -c "
import sys,json
events = json.load(sys.stdin)
print(all(e['type']=='Normal' for e in events))
" 2>/dev/null)
check "5.2 All results are Normal type" "True" "$ALL_NORMAL"

# TEST 5.3: Search events
echo "Test 5.3: Search events"
RESP=$(req GET "$BASE/events?search=hackathon")
parse_response "$RESP"
check_status "5.3 Search works" "200" "$CODE" "$BODY"
HAS_HACK=$(echo "$BODY" | python3 -c "
import sys,json
events = json.load(sys.stdin)
print(any('hack' in e['name'].lower() or 'hack' in (e.get('description','') or '').lower() for e in events))
" 2>/dev/null)
check "5.3 Search finds hackathon" "True" "$HAS_HACK"

# TEST 5.4: Filter by eligibility
echo "Test 5.4: Filter by eligibility"
RESP=$(req GET "$BASE/events?eligibility=IIIT")
parse_response "$RESP"
check_status "5.4 Filter by eligibility" "200" "$CODE" "$BODY"

# TEST 5.5: Trending events
echo "Test 5.5: Trending events"
RESP=$(req GET "$BASE/events?trending=true")
parse_response "$RESP"
check_status "5.5 Trending events" "200" "$CODE" "$BODY"
TRENDING_COUNT=$(echo "$BODY" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))" 2>/dev/null)
check "5.5 Returns max 5 trending" "true" "$([ "$TRENDING_COUNT" -le 5 ] && echo true || echo false)"

# TEST 5.6: Event details
echo "Test 5.6: Event details"
if [ -n "$EVENT_ID" ]; then
  RESP=$(req GET "$BASE/events/$EVENT_ID")
  parse_response "$RESP"
  check_status "5.6 Event details" "200" "$CODE" "$BODY"
  check "5.6 Has description" "description" "$BODY"
  check "5.6 Has organizer" "organizer" "$BODY"
  check "5.6 Has registrationCount" "registrationCount" "$BODY"
else
  echo "  SKIP: No event ID available"
fi

# TEST 5.7: Register for event
echo "Test 5.7: Register for event"
if [ -n "$EVENT_ID" ]; then
  RESP=$(req POST "$BASE/events/$EVENT_ID/register" '{"formData":{}}' "$PARTICIPANT_TOKEN")
  parse_response "$RESP"
  check_status "5.7 Register for event" "201" "$CODE" "$BODY"
  check "5.7 Ticket has ticketId" "ticketId" "$BODY"
  check "5.7 Ticket has qrCode" "qrCode" "$BODY"
  check "5.7 Status is Confirmed" "Confirmed" "$BODY"
  TICKET_ID=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin).get('ticketId',''))" 2>/dev/null)
  TICKET_OBJ_ID=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin).get('_id',''))" 2>/dev/null)
else
  echo "  SKIP: No event ID available"
fi

# TEST 5.8: Duplicate registration
echo "Test 5.8: Duplicate registration"
if [ -n "$EVENT_ID" ]; then
  RESP=$(req POST "$BASE/events/$EVENT_ID/register" '{"formData":{}}' "$PARTICIPANT_TOKEN")
  parse_response "$RESP"
  check_status "5.8 Duplicate registration rejected" "400" "$CODE" "$BODY"
  check "5.8 Already registered msg" "Already" "$BODY"
fi

# TEST 5.9: My tickets
echo "Test 5.9: My tickets"
RESP=$(req GET "$BASE/events/tickets/my-tickets" "" "$PARTICIPANT_TOKEN")
parse_response "$RESP"
check_status "5.9 My tickets" "200" "$CODE" "$BODY"
TICKET_COUNT=$(echo "$BODY" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))" 2>/dev/null)
check "5.9 Has tickets" "true" "$([ "$TICKET_COUNT" -gt 0 ] && echo true || echo false)"

# TEST 5.10: View ticket by ID
echo "Test 5.10: View ticket by ID"
if [ -n "$TICKET_ID" ]; then
  RESP=$(req GET "$BASE/events/tickets/$TICKET_ID" "" "$PARTICIPANT_TOKEN")
  parse_response "$RESP"
  check_status "5.10 Ticket by ID" "200" "$CODE" "$BODY"
  check "5.10 Has QR code" "qrCode" "$BODY"
fi

# TEST 5.11: Follow organizer (clubs)
echo "Test 5.11: Follow organizer"
if [ -n "$ORG_ID" ]; then
  RESP=$(req POST "$BASE/auth/organizers/$ORG_ID/follow" '{}' "$PARTICIPANT_TOKEN")
  parse_response "$RESP"
  check_status "5.11 Follow organizer" "200" "$CODE" "$BODY"
  check "5.11 Returns following list" "following" "$BODY"
fi

# TEST 5.12: View organizers list
echo "Test 5.12: View organizers list (public)"
RESP=$(req GET "$BASE/auth/organizers")
parse_response "$RESP"
check_status "5.12 Organizers list" "200" "$CODE" "$BODY"
ORG_COUNT=$(echo "$BODY" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))" 2>/dev/null)
check "5.12 Has organizers" "true" "$([ "$ORG_COUNT" -gt 0 ] && echo true || echo false)"

# TEST 5.13: Profile update
echo "Test 5.13: Profile update"
RESP=$(req PUT "$BASE/auth/profile" '{"firstName":"TestUpdated","lastName":"UserUpdated","interests":["Technology","Sports"]}' "$PARTICIPANT_TOKEN")
parse_response "$RESP"
check_status "5.13 Profile update" "200" "$CODE" "$BODY"
check "5.13 Name updated" "TestUpdated" "$BODY"

# TEST 5.14: Change password
echo "Test 5.14: Change password"
RESP=$(req PUT "$BASE/auth/change-password" '{"currentPassword":"Test@123","newPassword":"NewPass@123"}' "$PARTICIPANT_TOKEN")
parse_response "$RESP"
check_status "5.14 Change password" "200" "$CODE" "$BODY"
check "5.14 Success msg" "Password changed" "$BODY"

# Change it back
req PUT "$BASE/auth/change-password" '{"currentPassword":"NewPass@123","newPassword":"Test@123"}' "$PARTICIPANT_TOKEN" > /dev/null 2>&1

# TEST 5.15: Add comment to event
echo "Test 5.15: Add comment to event"
if [ -n "$EVENT_ID" ]; then
  RESP=$(req POST "$BASE/events/$EVENT_ID/comments" '{"text":"This is a test comment!"}' "$PARTICIPANT_TOKEN")
  parse_response "$RESP"
  check_status "5.15 Add comment" "200" "$CODE" "$BODY"
  check "5.15 Comment has text" "test comment" "$BODY"
  COMMENT_ID=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin).get('_id',''))" 2>/dev/null)
fi

# TEST 5.16: React to comment
echo "Test 5.16: React to comment"
if [ -n "$EVENT_ID" ] && [ -n "$COMMENT_ID" ]; then
  RESP=$(req POST "$BASE/events/$EVENT_ID/comments/$COMMENT_ID/react" '{"emoji":"👍"}' "$PARTICIPANT_TOKEN")
  parse_response "$RESP"
  check_status "5.16 React to comment" "200" "$CODE" "$BODY"
  check "5.16 Has reactions" "reactions" "$BODY"
fi

# ================================
echo ""
echo "--- 6. ORGANIZER FEATURES ---"
echo ""

# TEST 6.1: Create event (Draft)
echo "Test 6.1: Create event as organizer"
RESP=$(req POST "$BASE/events" '{"name":"Test Workshop","type":"Normal","description":"A test workshop","eligibility":"All","startDate":"2026-08-01","endDate":"2026-08-02","regDeadline":"2026-07-30","limit":50,"price":100,"status":"Draft","tags":["test","workshop"],"formFields":[{"label":"Experience","fieldType":"dropdown","required":true,"options":["Beginner","Advanced"]}]}' "$ORG_TOKEN")
parse_response "$RESP"
check_status "6.1 Create event" "201" "$CODE" "$BODY"
check "6.1 Event has name" "Test Workshop" "$BODY"
check "6.1 Status is Draft" "Draft" "$BODY"
NEW_EVENT_ID=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin).get('_id',''))" 2>/dev/null)

# TEST 6.2: Update event (still Draft - full edit allowed)
echo "Test 6.2: Update draft event"
if [ -n "$NEW_EVENT_ID" ]; then
  RESP=$(req PUT "$BASE/events/$NEW_EVENT_ID" '{"description":"Updated description","price":200}' "$ORG_TOKEN")
  parse_response "$RESP"
  check_status "6.2 Update draft event" "200" "$CODE" "$BODY"
  check "6.2 Description updated" "Updated description" "$BODY"
fi

# TEST 6.3: Publish event
echo "Test 6.3: Publish event"
if [ -n "$NEW_EVENT_ID" ]; then
  RESP=$(req PUT "$BASE/events/$NEW_EVENT_ID" '{"status":"Published"}' "$ORG_TOKEN")
  parse_response "$RESP"
  check_status "6.3 Publish event" "200" "$CODE" "$BODY"
  check "6.3 Status is Published" "Published" "$BODY"
fi

# TEST 6.4: Edit published event (limited fields)
echo "Test 6.4: Edit published event - limited fields"
if [ -n "$NEW_EVENT_ID" ]; then
  RESP=$(req PUT "$BASE/events/$NEW_EVENT_ID" '{"description":"New description for published","limit":100}' "$ORG_TOKEN")
  parse_response "$RESP"
  check_status "6.4 Edit published event" "200" "$CODE" "$BODY"
fi

# TEST 6.5: Get organizer's events
echo "Test 6.5: Get my events (organizer)"
RESP=$(req GET "$BASE/events/organizer/my-events" "" "$ORG_TOKEN")
parse_response "$RESP"
check_status "6.5 Organizer's events" "200" "$CODE" "$BODY"
MY_EVENTS_COUNT=$(echo "$BODY" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))" 2>/dev/null)
check "6.5 Has events" "true" "$([ "$MY_EVENTS_COUNT" -gt 0 ] && echo true || echo false)"

# TEST 6.6: Event stats/analytics
echo "Test 6.6: Event stats"
# Use one of the organizer's existing seeded events
ORG_EVENT_ID=$(echo "$BODY" | python3 -c "
import sys,json
events = json.load(sys.stdin)
for e in events:
    if e.get('registrationCount',0)>0:
        print(e['_id']); break
" 2>/dev/null)
if [ -n "$ORG_EVENT_ID" ]; then
  RESP=$(req GET "$BASE/events/$ORG_EVENT_ID/stats" "" "$ORG_TOKEN")
  parse_response "$RESP"
  check_status "6.6 Event stats" "200" "$CODE" "$BODY"
  check "6.6 Has totalRegistrations" "totalRegistrations" "$BODY"
  check "6.6 Has confirmed" "confirmed" "$BODY"
  check "6.6 Has revenue" "revenue" "$BODY"
fi

# TEST 6.7: Export participants CSV
echo "Test 6.7: Export participants CSV"
if [ -n "$ORG_EVENT_ID" ]; then
  RESP=$(curl -s -w '\n%{http_code}' -H "x-auth-token: $ORG_TOKEN" "$BASE/events/$ORG_EVENT_ID/export")
  parse_response "$RESP"
  check_status "6.7 Export CSV" "200" "$CODE" "$BODY"
  check "6.7 Has CSV header" "Name,Email" "$BODY"
fi

# TEST 6.8: Organizer analytics
echo "Test 6.8: Overall organizer analytics"
RESP=$(req GET "$BASE/events/organizer/analytics" "" "$ORG_TOKEN")
parse_response "$RESP"
check_status "6.8 Organizer analytics" "200" "$CODE" "$BODY"
check "6.8 Has totalEvents" "totalEvents" "$BODY"

# TEST 6.9: Organizer profile update
echo "Test 6.9: Organizer profile update"
RESP=$(req PUT "$BASE/auth/profile" '{"description":"Updated bio for testing","website":"https://test.com"}' "$ORG_TOKEN")
parse_response "$RESP"
check_status "6.9 Organizer profile update" "200" "$CODE" "$BODY"
check "6.9 Description updated" "Updated bio" "$BODY"

# TEST 6.10: Delete event
echo "Test 6.10: Delete event"
if [ -n "$NEW_EVENT_ID" ]; then
  RESP=$(req DELETE "$BASE/events/$NEW_EVENT_ID" "" "$ORG_TOKEN")
  parse_response "$RESP"
  check_status "6.10 Delete event" "200" "$CODE" "$BODY"
  check "6.10 Delete msg" "deleted" "$BODY"
fi

# TEST 6.11: Pin comment (organizer moderation)
echo "Test 6.11: Pin comment"
if [ -n "$EVENT_ID" ] && [ -n "$COMMENT_ID" ]; then
  # Need to use the organizer who owns this event
  # Get event organizer
  EVENT_ORG=$(curl -s "$BASE/events/$EVENT_ID" | python3 -c "import sys,json;print(json.load(sys.stdin)['organizer']['_id'])" 2>/dev/null)
  # Login as that organizer
  EVENT_ORG_EMAIL=$(curl -s "$BASE/events/$EVENT_ID" | python3 -c "import sys,json;print(json.load(sys.stdin)['organizer']['email'])" 2>/dev/null)
  RESP2=$(req POST "$BASE/auth/login" "{\"email\":\"$EVENT_ORG_EMAIL\",\"password\":\"Pass@123\"}")
  parse_response "$RESP2"
  EVENT_ORG_TOKEN=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])" 2>/dev/null)
  
  if [ -n "$EVENT_ORG_TOKEN" ]; then
    RESP=$(req PUT "$BASE/events/$EVENT_ID/comments/$COMMENT_ID/pin" '{}' "$EVENT_ORG_TOKEN")
    parse_response "$RESP"
    check_status "6.11 Pin comment" "200" "$CODE" "$BODY"
    check "6.11 Pin toggled msg" "Pin toggled" "$BODY"
  else
    echo "  SKIP: Could not login as event organizer"
  fi
fi

# TEST 6.12: Delete comment
echo "Test 6.12: Delete comment (organizer moderation)"
if [ -n "$EVENT_ID" ] && [ -n "$COMMENT_ID" ] && [ -n "$EVENT_ORG_TOKEN" ]; then
  RESP=$(req DELETE "$BASE/events/$EVENT_ID/comments/$COMMENT_ID" "" "$EVENT_ORG_TOKEN")
  parse_response "$RESP"
  check_status "6.12 Delete comment" "200" "$CODE" "$BODY"
  check "6.12 Comment deleted msg" "deleted" "$BODY"
fi

# ================================
echo ""
echo "--- 7. ADMIN FEATURES ---"
echo ""

# TEST 7.1: Get organizers (admin)
echo "Test 7.1: Admin get organizers"
RESP=$(req GET "$BASE/admin/organizers" "" "$ADMIN_TOKEN")
parse_response "$RESP"
check_status "7.1 Admin get organizers" "200" "$CODE" "$BODY"

# TEST 7.2: Create organizer
echo "Test 7.2: Admin create organizer"
RESP=$(req POST "$BASE/admin/organizers" '{"name":"Test Club","email":"testclub@iiit.ac.in","password":"Club@123","category":"Testing","description":"A test club"}' "$ADMIN_TOKEN")
parse_response "$RESP"
check_status "7.2 Create organizer" "201" "$CODE" "$BODY"
check "7.2 Has generatedPassword" "generatedPassword" "$BODY"
NEW_ORG_ID=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

# TEST 7.3: Disable organizer
echo "Test 7.3: Disable organizer"
if [ -n "$NEW_ORG_ID" ]; then
  RESP=$(req PUT "$BASE/admin/organizers/$NEW_ORG_ID/toggle" '{}' "$ADMIN_TOKEN")
  parse_response "$RESP"
  check_status "7.3 Disable organizer" "200" "$CODE" "$BODY"
  check "7.3 Disabled msg" "disabled" "$BODY"
fi

# TEST 7.4: Disabled organizer cannot login
echo "Test 7.4: Disabled organizer login attempt"
RESP=$(req POST "$BASE/auth/login" '{"email":"testclub@iiit.ac.in","password":"Club@123"}')
parse_response "$RESP"
check_status "7.4 Disabled login rejected" "403" "$CODE" "$BODY"
check "7.4 Disabled msg" "disabled" "$BODY"

# TEST 7.5: Enable organizer
echo "Test 7.5: Re-enable organizer"
if [ -n "$NEW_ORG_ID" ]; then
  RESP=$(req PUT "$BASE/admin/organizers/$NEW_ORG_ID/toggle" '{}' "$ADMIN_TOKEN")
  parse_response "$RESP"
  check_status "7.5 Enable organizer" "200" "$CODE" "$BODY"
  check "7.5 Enabled msg" "enabled" "$BODY"
fi

# TEST 7.6: Delete organizer (cascade)
echo "Test 7.6: Delete organizer (cascade)"
if [ -n "$NEW_ORG_ID" ]; then
  RESP=$(req DELETE "$BASE/admin/organizers/$NEW_ORG_ID" "" "$ADMIN_TOKEN")
  parse_response "$RESP"
  check_status "7.6 Delete organizer" "200" "$CODE" "$BODY"
  check "7.6 Deleted msg" "deleted" "$BODY"
fi

# TEST 7.7: Get reset requests
echo "Test 7.7: Get reset requests"
RESP=$(req GET "$BASE/admin/reset-requests" "" "$ADMIN_TOKEN")
parse_response "$RESP"
check_status "7.7 Get reset requests" "200" "$CODE" "$BODY"

# ================================
echo ""
echo "--- 8. TIER A: HACKATHON TEAMS ---"
echo ""

# TEST A1.1: Create team
echo "Test A1.1: Create team for hackathon"
if [ -n "$HACK_EVENT_ID" ]; then
  RESP=$(req POST "$BASE/teams" "{\"name\":\"Test Team Alpha\",\"eventId\":\"$HACK_EVENT_ID\"}" "$PARTICIPANT_TOKEN")
  parse_response "$RESP"
  check_status "A1.1 Create team" "201" "$CODE" "$BODY"
  check "A1.1 Has inviteCode" "inviteCode" "$BODY"
  check "A1.1 Status is Forming" "Forming" "$BODY"
  TEAM_ID=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin).get('_id',''))" 2>/dev/null)
  INVITE_CODE=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin).get('inviteCode',''))" 2>/dev/null)
fi

# TEST A1.2: Join team with invite code
echo "Test A1.2: Join team with invite code"
if [ -n "$INVITE_CODE" ]; then
  RESP=$(req POST "$BASE/teams/join" "{\"inviteCode\":\"$INVITE_CODE\"}" "$NON_IIIT_TOKEN")
  parse_response "$RESP"
  check_status "A1.2 Join team" "200" "$CODE" "$BODY"
  MEMBER_COUNT=$(echo "$BODY" | python3 -c "import sys,json;print(len(json.load(sys.stdin).get('members',[])))" 2>/dev/null)
  check "A1.2 Team has 2 members" "2" "$MEMBER_COUNT"
fi

# TEST A1.3: Cannot join same team twice
echo "Test A1.3: Cannot join same team twice"
if [ -n "$INVITE_CODE" ]; then
  RESP=$(req POST "$BASE/teams/join" "{\"inviteCode\":\"$INVITE_CODE\"}" "$NON_IIIT_TOKEN")
  parse_response "$RESP"
  check_status "A1.3 Duplicate join rejected" "400" "$CODE" "$BODY"
fi

# TEST A1.4: Get my teams
echo "Test A1.4: Get my teams"
RESP=$(req GET "$BASE/teams/mine" "" "$PARTICIPANT_TOKEN")
parse_response "$RESP"
check_status "A1.4 My teams" "200" "$CODE" "$BODY"

# TEST A1.5: Get team by ID
echo "Test A1.5: Get team by ID"
if [ -n "$TEAM_ID" ]; then
  RESP=$(req GET "$BASE/teams/$TEAM_ID" "" "$PARTICIPANT_TOKEN")
  parse_response "$RESP"
  check_status "A1.5 Team details" "200" "$CODE" "$BODY"
  check "A1.5 Has members" "members" "$BODY"
fi

# TEST A1.6: Register team (leader only)
echo "Test A1.6: Register team"
if [ -n "$TEAM_ID" ]; then
  RESP=$(req POST "$BASE/teams/$TEAM_ID/register" '{}' "$PARTICIPANT_TOKEN")
  parse_response "$RESP"
  check_status "A1.6 Register team" "200" "$CODE" "$BODY"
  check "A1.6 Team registered msg" "registered" "$BODY"
fi

# TEST A1.7: Cannot leave registered team
echo "Test A1.7: Cannot leave registered team"
if [ -n "$TEAM_ID" ]; then
  RESP=$(req POST "$BASE/teams/$TEAM_ID/leave" '{}' "$NON_IIIT_TOKEN")
  parse_response "$RESP"
  check_status "A1.7 Cannot leave registered" "400" "$CODE" "$BODY"
fi

# ================================
echo ""
echo "--- 9. TIER A: MERCHANDISE & PAYMENT ---"
echo ""

# TEST A2.1: Order merchandise
echo "Test A2.1: Order merchandise"
if [ -n "$MERCH_EVENT_ID" ]; then
  RESP=$(req POST "$BASE/events/$MERCH_EVENT_ID/merch-order" '{"variant":"Hoodie","size":"M","color":"Black","quantity":1}' "$PARTICIPANT_TOKEN")
  parse_response "$RESP"
  check_status "A2.1 Order merchandise" "201" "$CODE" "$BODY"
  check "A2.1 Status pending" "Pending Approval" "$BODY"
  MERCH_TICKET_ID=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin).get('_id',''))" 2>/dev/null)
fi

# TEST A2.2: Get merch orders (organizer)
echo "Test A2.2: Get merch orders"
# Get the organizer of the merch event
if [ -n "$MERCH_EVENT_ID" ]; then
  MERCH_ORG_EMAIL=$(curl -s "$BASE/events/$MERCH_EVENT_ID" | python3 -c "import sys,json;print(json.load(sys.stdin)['organizer']['email'])" 2>/dev/null)
  RESP2=$(req POST "$BASE/auth/login" "{\"email\":\"$MERCH_ORG_EMAIL\",\"password\":\"Pass@123\"}")
  parse_response "$RESP2"
  MERCH_ORG_TOKEN=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])" 2>/dev/null)
  
  RESP=$(req GET "$BASE/admin/merch-orders" "" "$MERCH_ORG_TOKEN")
  parse_response "$RESP"
  check_status "A2.2 Get merch orders" "200" "$CODE" "$BODY"
fi

# TEST A2.3: Approve merch order
echo "Test A2.3: Approve merch order"
if [ -n "$MERCH_TICKET_ID" ] && [ -n "$MERCH_ORG_TOKEN" ]; then
  RESP=$(req PUT "$BASE/admin/merch-orders/$MERCH_TICKET_ID" '{"action":"approve"}' "$MERCH_ORG_TOKEN")
  parse_response "$RESP"
  check_status "A2.3 Approve order" "200" "$CODE" "$BODY"
  check "A2.3 Status confirmed" "Confirmed" "$BODY"
  check "A2.3 QR generated" "qrCode" "$BODY"
fi

# ================================
echo ""
echo "--- 10. TIER A: QR SCANNER & ATTENDANCE ---"
echo ""

# TEST A3.1: Mark attendance by ticket ID
echo "Test A3.1: Mark attendance"
if [ -n "$TICKET_OBJ_ID" ] && [ -n "$EVENT_ORG_TOKEN" ]; then
  RESP=$(req PUT "$BASE/events/tickets/$TICKET_OBJ_ID/attend" '{}' "$EVENT_ORG_TOKEN")
  parse_response "$RESP"
  check_status "A3.1 Mark attendance" "200" "$CODE" "$BODY"
  check "A3.1 Attended true" "true" "$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin).get('attended',False))" 2>/dev/null)"
fi

# TEST A3.2: Duplicate scan
echo "Test A3.2: Duplicate scan detection"
if [ -n "$TICKET_OBJ_ID" ] && [ -n "$EVENT_ORG_TOKEN" ]; then
  RESP=$(req PUT "$BASE/events/tickets/$TICKET_OBJ_ID/attend" '{}' "$EVENT_ORG_TOKEN")
  parse_response "$RESP"
  check_status "A3.2 Duplicate scan rejected" "400" "$CODE" "$BODY"
  check "A3.2 Already scanned msg" "Already scanned" "$BODY"
fi

# TEST A3.3: Scan QR with ticketId
echo "Test A3.3: Scan QR by ticketId string"
if [ -n "$TICKET_ID" ] && [ -n "$EVENT_ORG_TOKEN" ]; then
  # Already attended, so should get duplicate
  RESP=$(req POST "$BASE/events/scan-qr" "{\"ticketId\":\"$TICKET_ID\",\"eventId\":\"$EVENT_ID\"}" "$EVENT_ORG_TOKEN")
  parse_response "$RESP"
  check_status "A3.3 QR scan (already scanned)" "400" "$CODE" "$BODY"
fi

# ================================
echo ""
echo "--- 11. TIER B: DISCUSSION FORUM (Comments) ---"
echo ""

# TEST B1.1: Add threaded comment (reply)
echo "Test B1.1: Add comment with parent"
if [ -n "$EVENT_ID" ]; then
  # First add a fresh comment
  RESP=$(req POST "$BASE/events/$EVENT_ID/comments" '{"text":"Parent comment for threading test"}' "$PARTICIPANT_TOKEN")
  parse_response "$RESP"
  PARENT_COMMENT_ID=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin).get('_id',''))" 2>/dev/null)
  
  # Reply to it
  if [ -n "$PARENT_COMMENT_ID" ]; then
    RESP=$(req POST "$BASE/events/$EVENT_ID/comments" "{\"text\":\"This is a reply\",\"parentComment\":\"$PARENT_COMMENT_ID\"}" "$NON_IIIT_TOKEN")
    parse_response "$RESP"
    check_status "B1.1 Threaded reply" "200" "$CODE" "$BODY"
    check "B1.1 Has parentComment" "parentComment" "$BODY"
  fi
fi

# ================================
echo ""
echo "--- 12. TIER B: PASSWORD RESET ---"
echo ""

# TEST B2.1: Forgot password
echo "Test B2.1: Forgot password request"
RESP=$(req POST "$BASE/auth/forgot-password" '{"email":"testa1@students.iiit.ac.in"}')
parse_response "$RESP"
check_status "B2.1 Forgot password" "200" "$CODE" "$BODY"
RESET_TOKEN=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin).get('resetToken',''))" 2>/dev/null)

# TEST B2.2: Reset password with valid token
echo "Test B2.2: Reset password with token"
if [ -n "$RESET_TOKEN" ]; then
  RESP=$(req POST "$BASE/auth/reset-password" "{\"token\":\"$RESET_TOKEN\",\"newPassword\":\"Test@123\"}")
  parse_response "$RESP"
  check_status "B2.2 Reset password" "200" "$CODE" "$BODY"
  check "B2.2 Success msg" "successful" "$BODY"
fi

# TEST B2.3: Invalid reset token
echo "Test B2.3: Invalid reset token"
RESP=$(req POST "$BASE/auth/reset-password" '{"token":"invalidtoken","newPassword":"Test@123"}')
parse_response "$RESP"
check_status "B2.3 Invalid token" "400" "$CODE" "$BODY"

# TEST B2.4: Organizer password reset request
echo "Test B2.4: Organizer reset request (to admin)"
RESP=$(req POST "$BASE/auth/reset-request" '{"reason":"Forgot my password"}' "$ORG_TOKEN")
parse_response "$RESP"
check_status "B2.4 Organizer reset request" "200" "$CODE" "$BODY"
check "B2.4 Request submitted" "submitted" "$BODY"

# TEST B2.5: Admin approve reset
echo "Test B2.5: Admin approve organizer reset"
# Get the reset request
RESP=$(req GET "$BASE/admin/reset-requests" "" "$ADMIN_TOKEN")
parse_response "$RESP"
RESET_ORG_ID=$(echo "$BODY" | python3 -c "import sys,json;reqs=json.load(sys.stdin);print(reqs[0]['_id'] if reqs else '')" 2>/dev/null)
if [ -n "$RESET_ORG_ID" ]; then
  RESP=$(req PUT "$BASE/admin/reset-requests/$RESET_ORG_ID" '{"action":"approve"}' "$ADMIN_TOKEN")
  parse_response "$RESP"
  check_status "B2.5 Approve reset" "200" "$CODE" "$BODY"
  check "B2.5 Has temp password" "temporaryPassword" "$BODY"
fi

# ================================
echo ""
echo "--- 13. TIER B: TEAM CHAT ---"
echo ""

# TEST B3.1: Send message (requires team membership)
echo "Test B3.1: Send team message"
if [ -n "$TEAM_ID" ]; then
  RESP=$(req POST "$BASE/chat/$TEAM_ID/messages" '{"text":"Hello team!"}' "$PARTICIPANT_TOKEN")
  parse_response "$RESP"
  check_status "B3.1 Send message" "201" "$CODE" "$BODY"
  check "B3.1 Has text" "Hello team" "$BODY"
fi

# TEST B3.2: Get messages (paginated)
echo "Test B3.2: Get team messages"
if [ -n "$TEAM_ID" ]; then
  RESP=$(req GET "$BASE/chat/$TEAM_ID/messages" "" "$PARTICIPANT_TOKEN")
  parse_response "$RESP"
  check_status "B3.2 Get messages" "200" "$CODE" "$BODY"
  check "B3.2 Has messages array" "messages" "$BODY"
  check "B3.2 Has pagination" "total" "$BODY"
fi

# TEST B3.3: Non-member cannot access chat
echo "Test B3.3: Non-member cannot access chat"
if [ -n "$TEAM_ID" ]; then
  # Create a new user who's not in the team
  RESP=$(req POST "$BASE/auth/register" '{"firstName":"Outsider","lastName":"User","email":"outsider99@college.edu","password":"Test@123","isIIIT":false}')
  parse_response "$RESP"
  OUTSIDER_TOKEN=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])" 2>/dev/null)
  
  RESP=$(req GET "$BASE/chat/$TEAM_ID/messages" "" "$OUTSIDER_TOKEN")
  parse_response "$RESP"
  check_status "B3.3 Non-member rejected" "403" "$CODE" "$BODY"
fi

# ================================
echo ""
echo "--- 14. TIER C: FEEDBACK ---"
echo ""

# TEST C1.1: Submit feedback for completed event
echo "Test C1.1: Submit feedback"
if [ -n "$COMPLETED_EVENT_ID" ]; then
  # First need to register for event to give feedback
  # Check if participant has a ticket for this completed event
  RESP=$(req POST "$BASE/events/$COMPLETED_EVENT_ID/feedback" '{"rating":4,"comment":"Great event, well organized!"}' "$PARTICIPANT_TOKEN")
  parse_response "$RESP"
  # May get 403 if not registered - that's expected behavior to check
  echo "  C1.1 Feedback result: HTTP $CODE"
fi

# TEST C1.2: Get feedback
echo "Test C1.2: Get feedback for event"
if [ -n "$COMPLETED_EVENT_ID" ]; then
  RESP=$(req GET "$BASE/events/$COMPLETED_EVENT_ID/feedback")
  parse_response "$RESP"
  check_status "C1.2 Get feedback" "200" "$CODE" "$BODY"
  check "C1.2 Has averageRating" "averageRating" "$BODY"
  check "C1.2 Has feedback array" "feedback" "$BODY"
fi

# TEST C1.3: Filter feedback by rating
echo "Test C1.3: Filter feedback by rating"
if [ -n "$COMPLETED_EVENT_ID" ]; then
  RESP=$(req GET "$BASE/events/$COMPLETED_EVENT_ID/feedback?rating=5")
  parse_response "$RESP"
  check_status "C1.3 Filter feedback" "200" "$CODE" "$BODY"
fi

# ================================
echo ""
echo "--- 15. TIER C: CALENDAR ---"
echo ""

# TEST C2.1: Download .ics calendar file
echo "Test C2.1: Download calendar .ics"
if [ -n "$EVENT_ID" ]; then
  RESP=$(curl -s -w '\n%{http_code}' "$BASE/events/$EVENT_ID/calendar")
  parse_response "$RESP"
  check_status "C2.1 Calendar download" "200" "$CODE" "$BODY"
  check "C2.1 Has VCALENDAR" "VCALENDAR" "$BODY"
  check "C2.1 Has VEVENT" "VEVENT" "$BODY"
  check "C2.1 Has DTSTART" "DTSTART" "$BODY"
fi

# ================================
echo ""
echo "=============================================="
echo "  TEST RESULTS"
echo "=============================================="
echo "  Total: $TOTAL"
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
echo "=============================================="
