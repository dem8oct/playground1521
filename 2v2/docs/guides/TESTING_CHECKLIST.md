# Testing Checklist - 2v2 Kick Off Night Tracker

## Testing Progress

**Last Updated:** 2025-11-28
**Current Status:** 1/10 tests completed

---

## Test Results

### ✅ Test 1: Authentication Flow (PASSED)
**Status:** Completed ✅

**Steps Tested:**
1. Click "Sign In to Create" button
2. Enter email address
3. Click "Send Magic Link"
4. Check email for magic link
5. Click magic link
6. Verify redirect and auto-login

**Result:** All steps passed successfully
- Magic link received
- Login worked after clicking link
- "What would you like to do?" screen displayed correctly

---

### 🔄 Test 2: Session Creation (IN PROGRESS)
**Status:** Ready to test

**Steps to Complete:**
1. Click "Create New Session" button
2. Click "Create Session" button
3. Verify success toast with join code appears
4. Verify automatic navigation to Session Lobby
5. Verify lobby elements:
   - Header: "SESSION LOBBY" title
   - Top right: "Sign Out" and "End Session" buttons
   - Join Code card (green) with 6-character code
   - Status badge: Green "Active"
   - Expiration time displayed
   - Players section: "Players (0/10)"
   - Warning: "⚠️ Need at least 4 players to start logging matches"
   - Add player form with input and "Add" button
   - Continue button: "View Dashboard" (grayed out)
6. **IMPORTANT:** Note the join code for Test 6

**Expected Console Logs:**
- "Creating session with user ID: [your-id]"
- "Join code: [6-CHAR CODE]"
- "Database insert completed"
- "Session created successfully"

---

### ⏳ Test 3: Player Management (PENDING)
**Status:** Not started

**Steps to Test:**
1. In Session Lobby, add a player:
   - Type player name in input field
   - Click "Add" button
   - Verify success toast: "Player added"
   - Verify player appears in list
2. Add 3 more players (total 4):
   - Add "Player 2"
   - Add "Player 3"
   - Add "Player 4"
3. Verify warning message disappears when 4+ players added
4. Verify "View Dashboard" button becomes "Continue to Dashboard"
5. Test duplicate name validation:
   - Try adding a player with existing name
   - Should show error: "Player name already exists"

**What to Check:**
- Players display in list with their names
- Player count updates: "Players (4/10)"
- Warning message visibility changes at 4 players
- Button text changes from "View Dashboard" to "Continue to Dashboard"

---

### ⏳ Test 4: Co-Logger Assignment (PENDING)
**Status:** Not started

**Prerequisites:** Must have at least 1 player added

**Steps to Test:**
1. Click "Make Co-Logger" button next to a player
2. Verify success toast: "Co-logger updated"
3. Verify "Co-Logger" badge appears next to player name
4. Click "Remove Co-Logger" button
5. Verify badge disappears

**What to Check:**
- Badge appearance/disappearance
- Only one co-logger allowed at a time
- Success toast notifications

---

### ⏳ Test 5: Remove Players (PENDING)
**Status:** Not started

**Prerequisites:** Must have at least 1 player added

**Steps to Test:**
1. Click "Remove" button next to a player
2. Confirm in dialog: "Remove this player?"
3. Verify success toast: "Player removed"
4. Verify player disappears from list
5. Verify player count decrements

**What to Check:**
- Confirmation dialog appears
- Player removed from UI
- Player count updates correctly
- If count drops below 4, warning reappears

---

### ⏳ Test 6: Join as Guest (PENDING)
**Status:** Not started

**Prerequisites:** Need the join code from Test 2

**Steps to Test:**
1. Open **new incognito/private browser window**
2. Go to http://localhost:5173/
3. Click "Join as Guest" button
4. Enter the join code from Test 2
5. Click "Join Session" button
6. Verify navigation to Session Lobby
7. Verify you see:
   - Same join code
   - List of players (if any were added)
   - Message: "ℹ️ You're viewing as a guest. The initiator will add players."
   - "Leave Session" button (NOT "End Session")
   - No "Add Player" form visible

**What to Check:**
- Guest can view session without authentication
- Guest cannot add/remove players
- Guest sees "Leave Session" instead of "End Session"
- Join code validation works

---

### ⏳ Test 7: Leave Session (PENDING)
**Status:** Not started

**Prerequisites:** Must be in guest mode (from Test 6) OR sign out and rejoin

**Steps to Test:**
1. As a guest or non-initiator, click "Leave Session" button
2. Confirm in dialog: "Leave this session?"
3. Verify success toast: "Left session"
4. Verify navigation back to auth screen
5. **Refresh the page**
6. Verify you're back at landing page (not stuck on "Loading...")

**What to Check:**
- Confirmation dialog appears
- Navigation to auth screen
- localStorage cleared (check DevTools)
- No infinite loading on refresh

---

### ⏳ Test 8: End Session (PENDING)
**Status:** Not started

**Prerequisites:** Must be the session initiator

**Steps to Test:**
1. As initiator, click "End Session" button
2. Confirm in dialog: "End this session? This cannot be undone."
3. Verify success toast: "Session ended"
4. Verify navigation to "What would you like to do?" screen
5. **Refresh the page**
6. Verify you see the "What would you like to do?" screen (not stuck loading)
7. Try to join the session again as guest with the old join code
8. Should fail: "Session not found or expired"

**What to Check:**
- Confirmation dialog appears
- Session ends in database (status = 'ended')
- Navigation works correctly
- No infinite loading on refresh
- Session no longer joinable

---

### ⏳ Test 9: Sign Out with Active Session (PENDING)
**Status:** Not started

**Prerequisites:** Must have an active session

**Steps to Test:**
1. While in Session Lobby (with active session), click "Sign Out"
2. Verify success toast: "Signed out successfully"
3. Verify navigation to landing page (Create/Join cards)
4. **Refresh the page**
5. Verify you're still at landing page (not stuck loading)
6. Verify localStorage is cleared:
   - Open DevTools → Application → Local Storage
   - Check that both `2v2-kickoff-auth` and `2v2-kickoff-session` are cleared

**What to Check:**
- Sign out clears BOTH auth and session
- Navigation to landing page
- No infinite loading on refresh
- localStorage properly cleaned up

---

### ⏳ Test 10: Page Refresh with Active Session (PENDING)
**Status:** Not started

**Prerequisites:** Must have an active session with players

**Steps to Test:**
1. Create session and add some players
2. Note the join code and player names
3. **Hard refresh the page** (Ctrl+Shift+R or Cmd+Shift+R)
4. Verify session lobby loads correctly:
   - Same join code displayed
   - Same players in list
   - All buttons and UI elements present
5. Verify session loading completes in < 5 seconds
6. Check console for successful session load logs

**What to Check:**
- Session persists across page refresh
- All data intact (join code, players)
- Loading state resolves quickly
- No errors in console

---

## Testing Notes

### Prerequisites for Testing
- App running at http://localhost:5173/
- Valid email address for magic link auth
- Access to email inbox
- Browser DevTools open (for console logs)
- Incognito/private window for guest testing

### Console Logs to Monitor
- Auth loading/completion logs
- Session creation logs
- Database operation logs
- Any timeout warnings (should not appear in normal operation)

### Common Issues to Watch For
- ❌ Infinite loading states (should timeout after 5 seconds)
- ❌ Stale session IDs in localStorage
- ❌ Sign out not clearing session
- ❌ Guest users blocked from join form

---

## When You Resume Testing

**Current State:**
- ✅ Signed in successfully
- 🔄 Ready to test session creation (Test 2)
- Need to note join code for later guest testing

**Next Steps:**
1. Continue with Test 2: Session Creation
2. Complete Tests 3-5: Player Management
3. Open incognito window for Test 6: Guest Join
4. Complete Tests 7-10: Exit flows and edge cases

**Estimated Time:** ~15-20 minutes for all remaining tests

---

## Questions or Issues?

If you encounter any problems:
1. Check the console for error logs
2. Verify localStorage state in DevTools
3. Check TROUBLESHOOTING.md for common issues
4. Check BUGFIXES.md for known fixes

Good luck with testing! 🚀
