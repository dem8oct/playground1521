# Phase 3 & 4 Testing Guide

## Server Status
✅ Dev server running at http://localhost:5173/

## Manual Testing Checklist

### Phase 3: API Functions

#### Groups CRUD
- [ ] Create a group
  - Navigate to "My Groups"
  - Click "Create Group"
  - Fill in name and description
  - Submit and verify success

- [ ] View groups list
  - Should see created group
  - Should show admin badge for groups you created
  - Should show member badge for groups you joined

- [ ] Update group
  - Click on a group you admin
  - Go to Settings tab
  - Click "Edit Group"
  - Modify name/description
  - Save changes

- [ ] Delete group
  - In Settings tab
  - Click "Delete Group"
  - Confirm deletion
  - Verify redirect to groups list

#### Group Members
- [ ] View members
  - Open a group
  - Go to Members tab
  - Should see all members listed

- [ ] Promote member to admin (if you're admin)
  - Click "Promote" button on a member
  - Confirm action
  - Verify member role changes to admin

- [ ] Remove member (if you're admin)
  - Click "Remove" button on a member
  - Confirm action
  - Verify member is removed

- [ ] Leave group (if you're not admin)
  - Click "Leave Group" button
  - Confirm action
  - Verify redirect to groups list

#### Group Invites
- [ ] Search users by username
  - In Members tab (as admin)
  - Type in search box
  - Should see matching users appear

- [ ] Send invite
  - Select a user from search results
  - Click "Invite"
  - Verify invite appears in pending invites

- [ ] View pending invites (as admin)
  - Should see list of sent invites
  - Should show invitee username

- [ ] Cancel invite (as admin)
  - Click "Cancel" on a pending invite
  - Confirm action
  - Verify invite is removed

- [ ] View user invites
  - Navigate to "Group Invites"
  - Should see invites sent to you

- [ ] Accept invite
  - Click "Accept" on an invite
  - Verify success message
  - Verify you're now a member (check My Groups)

- [ ] Decline invite
  - Click "Decline" on an invite
  - Verify invite is removed
  - Verify you're not a member

#### Group Leaderboards
- [ ] View player leaderboard
  - Open a group
  - Go to Leaderboards tab
  - Click "Player Leaderboard"
  - Should see stats (MP, W, D, L, GF, GA, GD, Pts)

- [ ] View pair leaderboard
  - Click "Pair Leaderboard" tab
  - Should see pair stats
  - Pairs should be labeled "Name1 & Name2"

### Phase 4: UI Components

#### CreateGroupForm
- [ ] Form validation
  - Try submitting with empty name (should fail)
  - Try name < 3 chars (should fail)
  - Try name > 50 chars (should fail)
  - Try valid name (should succeed)

- [ ] Optional description
  - Leave description empty (should work)
  - Add description (should work)

- [ ] Loading states
  - Submit form
  - Button should show "Creating..." while loading

- [ ] Error handling
  - Create group with duplicate name (should show error)

#### GroupsList
- [ ] Empty state
  - If no groups, should show "Create Your First Group"

- [ ] Groups display
  - Should show group cards in grid
  - Should show admin/member badge
  - Should show description if present
  - Should show join date

- [ ] Create group toggle
  - Click "Create Group" (form appears)
  - Click "Cancel" (form disappears)

- [ ] Navigation
  - Click on group card
  - Should navigate to group dashboard

#### GroupDashboard
- [ ] Tab navigation
  - All 4 tabs should be clickable
  - Active tab should be highlighted
  - Tab content should change

- [ ] Admin-only features
  - Settings tab should only show for admins
  - Invite users should only show for admins in Members tab

- [ ] Responsive design
  - Resize browser window
  - Tabs should scroll horizontally on mobile
  - Layout should adapt

#### GroupMembers
- [ ] Member display
  - Should show avatar (first letter of name)
  - Should show display name and username
  - Should show role badge
  - Should highlight current user with "You" badge

- [ ] Admin actions
  - Promote button should only show for members (not admins)
  - Remove button should only show for other members
  - Buttons should be disabled during loading

- [ ] Member actions
  - Leave Group button should show for non-admin members
  - Should show confirmation dialog

#### InviteUser
- [ ] Search functionality
  - Type in search box
  - Should debounce (wait 300ms)
  - Should show "Searching..." while loading
  - Should show results below search box

- [ ] Search results
  - Should show user avatar, name, username
  - Should have "Invite" button
  - Button should disable during invite

- [ ] Pending invites list
  - Should show all pending invites
  - Should show invitee info
  - Should show invite date
  - Should have "Cancel" button

#### UserInvites
- [ ] Empty state
  - If no invites, should show "You have no pending group invites"

- [ ] Invite cards
  - Should show group name and description
  - Should show inviter name and username
  - Should show invite date
  - Should have Accept/Decline buttons

- [ ] Actions
  - Accept should show success alert
  - Decline should remove invite
  - Buttons should disable during action

#### GroupLeaderboards
- [ ] Tab switching
  - Player and Pair tabs should switch content
  - Active tab should be highlighted

- [ ] Table display
  - Should show all stats columns
  - Should show rank numbers
  - Should color-code stats (wins=green, draws=yellow, losses=red)
  - Should be scrollable on mobile

- [ ] Empty state
  - If no matches, should show appropriate message

## Known Issues
- TypeScript errors related to database types (expected, database migration already done)
- These don't affect runtime functionality

## Testing Notes
- Test with at least 2 user accounts to test invite flow
- Test admin vs member permissions
- Test on both desktop and mobile screen sizes
- Verify all console.log statements appear in browser console
- Check Network tab for API calls
