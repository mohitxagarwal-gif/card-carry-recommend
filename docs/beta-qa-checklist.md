# Card & Carry - Beta QA Checklist

## Pre-Flight Checks

- [ ] **Database migrations applied**: Verify all migrations are run, especially consent columns and normalized tables
- [ ] **Types regenerated**: Confirm `src/integrations/supabase/types.ts` includes `audit_log`, `analysis_transactions`, `recommendation_cards`, `data_retention_config`
- [ ] **No TypeScript errors**: Run `npm run build` or check preview console
- [ ] **Environment variables set**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` present
- [ ] **Auth redirect URLs configured**: Preview URL + deployed URL added to Supabase Auth settings
- [ ] **Auto-confirm email enabled**: In Supabase Auth settings (for faster testing)

---

## Flow 1: New User Signup & Onboarding

### Test Scenario: Brand New User (Email/Password)

**Steps**:
1. [ ] Go to `/auth`, click "Sign Up"
2. [ ] Enter email, password, full name (valid inputs)
3. [ ] Submit → Should see success toast "Signed up successfully!"
4. [ ] **Auto-redirected to `/onboarding/profile`** (not stuck on auth page)
5. [ ] Select age range, income band, answer "first card" question
6. [ ] Optionally: Set monthly spend slider, select categories, add brands
7. [ ] Click "Complete Profile"
8. [ ] Should set `profiles.onboarding_completed = true`
9. [ ] **Redirected to `/upload`** page

**SQL Verification**:
```sql
SELECT id, email, onboarding_completed, data_processing_consent, age_range, income_band_inr
FROM profiles
WHERE email = 'testuser@example.com';
-- Should show: onboarding_completed = true, age_range and income_band_inr populated
```

**Expected**:
- No console errors
- No infinite redirect loops
- Profile row created in DB
- `analytics_events` row with `event_type = 'onboarding_completed'`

### Test Scenario: Google OAuth Signup

**Steps**:
1. [ ] Go to `/auth`, click "Sign in with Google"
2. [ ] Complete Google auth flow
3. [ ] **Redirected back to app**, should land on `/onboarding/profile`
4. [ ] Complete profile as above
5. [ ] Verify profile created, auth provider = 'google'

**SQL Verification**:
```sql
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE email = 'googleuser@example.com';
-- Check raw_user_meta_data contains Google provider info
```

---

## Flow 2: Returning User Login

### Test Scenario: User with Prior Recommendations

**Steps**:
1. [ ] Go to `/auth`, click "Sign In"
2. [ ] Enter email, password of existing user with recommendations
3. [ ] Submit → **Auto-redirected to `/dashboard`**
4. [ ] Dashboard loads without errors
5. [ ] See recommended cards, shortlist, applications modules

**SQL Verification**:
```sql
SELECT id, created_at FROM recommendation_snapshots
WHERE user_id = '<user_id>'
ORDER BY created_at DESC LIMIT 1;
-- Should return recent snapshot
```

### Test Scenario: User with Incomplete Analysis

**Steps**:
1. [ ] User has analysis created < 7 days ago but no recommendations
2. [ ] Login → **Redirected to `/results?analysisId=<id>`**
3. [ ] Can review transactions, generate recommendations

**SQL Verification**:
```sql
SELECT sa.id, sa.created_at, rs.id as snapshot_id
FROM spending_analyses sa
LEFT JOIN recommendation_snapshots rs ON rs.analysis_id = sa.id
WHERE sa.user_id = '<user_id>'
ORDER BY sa.created_at DESC LIMIT 1;
-- If snapshot_id is NULL and created_at is recent → should go to /results
```

---

## Flow 3: Statement Upload → Parse → Analyze

### Test Scenario: Valid Unencrypted PDF

**Steps**:
1. [ ] Login, navigate to `/upload`
2. [ ] **Consent check**: If first upload, should see ConsentModal → accept it
3. [ ] Select "Credit Card Statement" or "Bank Statement" mode
4. [ ] Upload a valid, unencrypted PDF (test with sample CC statement)
5. [ ] File status shows: `checking` → `processing` → `success`
6. [ ] Progress bar reaches 100%
7. [ ] **Redirected to `/results?analysisId=<new_id>`**

**SQL Verification**:
```sql
-- Check spending_analyses created
SELECT id, user_id, created_at, analysis_data
FROM spending_analyses
WHERE user_id = '<user_id>'
ORDER BY created_at DESC LIMIT 1;

-- Check normalized transactions created
SELECT COUNT(*) as transaction_count
FROM analysis_transactions
WHERE analysis_id = '<analysis_id>';
-- Should match transaction count in analysis_data JSON
```

**Expected**:
- `spending_analyses` row created with populated `analysis_data` JSONB
- `analysis_transactions` rows created (normalized)
- `analytics_events` row: `event_type = 'statement_uploaded'`, `'analysis_completed'`
- No sensitive data (PAN, CVV, OTP) stored in DB
- File uploaded to `statements` bucket at `<user_id>/<analysis_id>.pdf`

### Test Scenario: Encrypted PDF

**Steps**:
1. [ ] Upload an encrypted/password-protected PDF
2. [ ] File status: `checking` → `encrypted`
3. [ ] **Password modal appears**
4. [ ] Enter correct password → `decrypting` → `processing` → `success`
5. [ ] Verify decryption worked, transactions extracted

### Test Scenario: Invalid/Broken PDF

**Steps**:
1. [ ] Upload a corrupted or text-only PDF
2. [ ] File status: `checking` → `processing` → `error`
3. [ ] Error message displayed: "Failed to extract transactions from..."
4. [ ] **No crash, user can try again**

**SQL Verification**:
```sql
-- Check for parse failure event
SELECT event_type, event_data
FROM analytics_events
WHERE user_id = '<user_id>' AND event_type LIKE '%parse%failed%'
ORDER BY created_at DESC LIMIT 1;
```

### Test Scenario: Consent Gate

**Steps**:
1. [ ] Create new user, complete onboarding BUT skip consent
2. [ ] Go to `/upload`, try to upload file
3. [ ] **Blocked**: ConsentModal appears before parsing
4. [ ] If user declines → show message, no parsing allowed
5. [ ] If user accepts → `profiles.data_processing_consent = true`, parsing proceeds

**SQL Verification**:
```sql
SELECT data_processing_consent, data_processing_consent_at, terms_version, privacy_version
FROM profiles
WHERE id = '<user_id>';
-- Should show consent = true, timestamp populated
```

---

## Flow 4: Transaction Review & Category Edit

### Test Scenario: Edit Transaction Category

**Steps**:
1. [ ] On `/results`, view transaction list
2. [ ] Click dropdown on a transaction, change category (e.g., "Dining" → "Groceries")
3. [ ] Save → **Transaction category updates**
4. [ ] **Spending summary recalculates** (check category totals)

**SQL Verification**:
```sql
-- Check transaction category updated
SELECT transaction_id, merchant_raw, category, updated_at
FROM analysis_transactions
WHERE analysis_id = '<analysis_id>' AND merchant_raw ILIKE '%merchant_name%';
-- Category should be updated

-- Also check processed_transactions for consistency
SELECT transaction_hash, category
FROM processed_transactions
WHERE user_id = '<user_id>' AND transaction_hash = '<hash>';
```

**Expected**:
- No duplicate transactions created
- `analysis_data` JSONB in `spending_analyses` may or may not update (legacy), but normalized tables must update
- UI reflects new category breakdown

---

## Flow 5: Generate Recommendations

### Test Scenario: Generate Recommendations from Valid Analysis

**Steps**:
1. [ ] On `/results`, after reviewing transactions, click "Get Recommendations"
2. [ ] Loading screen appears with progress messages
3. [ ] **Edge function `generate-recommendations` called**
4. [ ] Success → **Redirected to recommendations view** (same page, or `/dashboard`)
5. [ ] See 3-5 recommended cards with match scores, estimated value, reasoning

**SQL Verification**:
```sql
-- Check recommendation_snapshots created
SELECT id, user_id, analysis_id, savings_min, savings_max, confidence, created_at
FROM recommendation_snapshots
WHERE user_id = '<user_id>'
ORDER BY created_at DESC LIMIT 1;

-- Check recommendation_cards created
SELECT rc.card_id, rc.rank, rc.match_score, rc.estimated_annual_value_inr, cc.name
FROM recommendation_cards rc
JOIN credit_cards cc ON cc.card_id = rc.card_id
WHERE rc.snapshot_id = '<snapshot_id>'
ORDER BY rc.rank ASC;
-- Should return 3-5 cards
```

**Expected**:
- `recommendation_snapshots` row created
- `recommendation_cards` rows created (one per recommended card)
- `analytics_events` row: `event_type = 'recs_generated'` or similar
- No errors in console, edge function logs clean

### Test Scenario: Recommendations with No Eligible Cards

**Steps**:
1. [ ] User with very low income or unusual spend profile
2. [ ] Generate recommendations → **Should handle gracefully**
3. [ ] Show message: "No suitable cards found" or recommend basic cards
4. [ ] No crash

---

## Flow 6: Dashboard & Card Actions

### Test Scenario: View Dashboard

**Steps**:
1. [ ] User with existing recommendations, login → dashboard loads
2. [ ] **Modules visible**:
   - [ ] Recommended cards (top 3-5)
   - [ ] Shortlisted cards (if any)
   - [ ] My Cards (if any)
   - [ ] Fee waiver goals (if set)
   - [ ] Reminders (if any)
   - [ ] Content feed carousel
3. [ ] No console errors
4. [ ] All data loads within 3 seconds

**SQL Verification**:
```sql
-- Check user has data for modules
SELECT
  (SELECT COUNT(*) FROM recommendation_cards WHERE user_id = '<user_id>') as rec_cards,
  (SELECT COUNT(*) FROM user_shortlist WHERE user_id = '<user_id>') as shortlist_count,
  (SELECT COUNT(*) FROM user_cards WHERE user_id = '<user_id>') as owned_cards,
  (SELECT COUNT(*) FROM fee_waiver_goals WHERE user_id = '<user_id>') as goals,
  (SELECT COUNT(*) FROM user_reminders WHERE user_id = '<user_id>' AND NOT dismissed) as reminders;
```

### Test Scenario: Shortlist a Card

**Steps**:
1. [ ] On dashboard or `/cards`, click "Shortlist" on a card
2. [ ] Heart icon fills, toast: "Added to shortlist"
3. [ ] Card appears in "Shortlisted Cards" module
4. [ ] Click again to remove → "Removed from shortlist"

**SQL Verification**:
```sql
SELECT card_id, added_at FROM user_shortlist WHERE user_id = '<user_id>';
-- Should add/remove rows accordingly
```

### Test Scenario: Apply Link (Outlink Modal)

**Steps**:
1. [ ] Click "Apply" on a recommended card
2. [ ] **Outlink modal appears** with warning about leaving site
3. [ ] Click "Continue to Issuer"
4. [ ] **New tab opens** with issuer application URL
5. [ ] Modal closes, user stays on app

**SQL Verification**:
```sql
-- Check affiliate click logged
SELECT user_id, card_id, clicked_at, utm_source, utm_medium
FROM affiliate_clicks
WHERE user_id = '<user_id>' AND card_id = '<card_id>'
ORDER BY clicked_at DESC LIMIT 1;
```

### Test Scenario: Track Card Application Status

**Steps**:
1. [ ] After applying, click status dropdown on card
2. [ ] Change from "Considering" → "Applied" → set applied date
3. [ ] Later, update to "Approved"
4. [ ] Check `/applications` page shows updated status

**SQL Verification**:
```sql
SELECT card_id, status, applied_date, status_updated_at, notes
FROM card_applications
WHERE user_id = '<user_id>' AND card_id = '<card_id>';
```

### Test Scenario: Add Owned Card (My Cards)

**Steps**:
1. [ ] On dashboard, click "Add Card" in My Cards module
2. [ ] Fill form: issuer, card name, opened date, renewal month, limit
3. [ ] Save → **Card added to `user_cards`**
4. [ ] Appears in My Cards list

**SQL Verification**:
```sql
SELECT card_id, issuer, product, opened_month, renewal_month, credit_limit_estimate, is_active
FROM user_cards
WHERE user_id = '<user_id>'
ORDER BY created_at DESC LIMIT 1;
```

---

## Flow 7: Account & Privacy Actions

### Test Scenario: Logout

**Steps**:
1. [ ] Click "Logout" from nav/profile menu
2. [ ] **Centralized logout function called** (`handleLogout()`)
3. [ ] Auth tokens cleared
4. [ ] `localStorage` cleared except preserved keys (theme, tour completion)
5. [ ] `sessionStorage` cleared
6. [ ] **Redirected to `/auth` or `/`**
7. [ ] No residual user data accessible

**SQL Verification**:
```sql
-- Check logout event logged
SELECT event_type, created_at FROM audit_log
WHERE user_id = '<user_id>' AND event_type = 'USER_LOGOUT'
ORDER BY created_at DESC LIMIT 1;
```

### Test Scenario: Data Export

**Steps**:
1. [ ] Go to `/profile`, click "Export My Data"
2. [ ] **JSON file downloads** with filename `card-carry-data-<user_id>-<date>.json`
3. [ ] Open file, verify structure:
   - [ ] `profile`, `recommendations`, `shortlist`, `applications`, `my_cards`, `transactions`, `goals`, `reminders`, `preferences`
   - [ ] **Merchants anonymized** in transactions (removed or hashed)
   - [ ] No PAN, CVV, OTP, password fields

**SQL Verification**:
```sql
-- Check export event logged
SELECT event_type, metadata FROM audit_log
WHERE user_id = '<user_id>' AND event_type LIKE '%EXPORT%'
ORDER BY created_at DESC LIMIT 1;
```

### Test Scenario: Account Deletion

**Steps**:
1. [ ] Go to `/profile`, click "Delete Account"
2. [ ] **Confirmation dialog** appears
3. [ ] Confirm → **Edge function `delete-user-data` called**
4. [ ] User data deleted or anonymized
5. [ ] **Logged out, redirected to landing page**
6. [ ] Try to login again → **Should fail** (account no longer exists)

**SQL Verification**:
```sql
-- User should be removed from auth.users or marked deleted
SELECT id, email, deleted_at FROM auth.users WHERE id = '<user_id>';
-- May return NULL or deleted_at populated

-- Check deletion event
SELECT event_type, severity, created_at FROM audit_log
WHERE user_id = '<user_id>' AND event_type LIKE '%DELETE%'
ORDER BY created_at DESC LIMIT 1;
```

**IMPORTANT**: Test with a dedicated test account, not a real user!

---

## Flow 8: Admin Tools

### Test Scenario: Admin Access Control

**Steps**:
1. [ ] Login as **non-admin user**
2. [ ] Try to access `/admin` → **Redirected or blocked** (401/403)
3. [ ] Verify cannot see admin nav links
4. [ ] Login as **admin user**
5. [ ] Can access `/admin`, see admin nav

**SQL Verification**:
```sql
-- Check admin role
SELECT ur.user_id, ur.role FROM user_roles ur
WHERE ur.user_id = '<admin_user_id>' AND ur.role = 'admin';
-- Should return row for admin

-- Verify has_role function works
SELECT has_role('<admin_user_id>'::uuid, 'admin'::app_role);
-- Should return true
```

### Test Scenario: Admin User Timeline

**Steps**:
1. [ ] As admin, go to `/admin/user-timeline`
2. [ ] Search for user by email
3. [ ] **Timeline loads** showing chronological events from:
   - [ ] `audit_log` (auth, consent, admin actions)
   - [ ] `analytics_events` (user actions, feature usage)
   - [ ] `spending_analyses`, `recommendation_snapshots` (workflow milestones)
4. [ ] Apply filters: date range, category, search term
5. [ ] Events update accordingly

**SQL Verification**:
```sql
-- Check admin view logged
SELECT event_type, metadata FROM audit_log
WHERE user_id = '<admin_user_id>' AND event_type = 'ADMIN_VIEW_USER_TIMELINE'
ORDER BY created_at DESC LIMIT 1;
-- Should show viewed_user_id in metadata
```

---

## Data Consistency & Safety Checks

### Check 1: Transaction Count Consistency

**SQL**:
```sql
-- For each recent analysis, compare transaction counts
SELECT
  sa.id as analysis_id,
  sa.user_id,
  jsonb_array_length(sa.analysis_data->'transactions') as json_count,
  (SELECT COUNT(*) FROM analysis_transactions at WHERE at.analysis_id = sa.id) as normalized_count
FROM spending_analyses sa
WHERE sa.created_at > now() - interval '7 days'
ORDER BY sa.created_at DESC
LIMIT 10;
-- json_count and normalized_count should match (or close if transactions were edited)
```

### Check 2: Recommendation Card Count Consistency

**SQL**:
```sql
-- For each recent snapshot, compare card counts
SELECT
  rs.id as snapshot_id,
  rs.user_id,
  jsonb_array_length(rs.recommended_cards) as json_count,
  (SELECT COUNT(*) FROM recommendation_cards rc WHERE rc.snapshot_id = rs.id) as normalized_count
FROM recommendation_snapshots rs
WHERE rs.created_at > now() - interval '7 days'
ORDER BY rs.created_at DESC
LIMIT 10;
-- Counts should match
```

### Check 3: No Sensitive Data Leakage

**SQL**:
```sql
-- Sample analysis_transactions for PAN-like patterns
SELECT id, merchant_raw, merchant_normalized, category
FROM analysis_transactions
WHERE merchant_raw ~* '\d{13,19}' OR merchant_raw ~* '\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}'
LIMIT 5;
-- Should return 0 rows (or investigate if found)

-- Sample audit_log for sensitive fields
SELECT id, event_type, metadata
FROM audit_log
WHERE metadata::text ~* '(password|cvv|otp|pan|card_number)'
LIMIT 5;
-- Should return 0 rows (all should be [REDACTED])

-- Sample analytics_events for sensitive fields
SELECT id, event_type, event_data
FROM analytics_events
WHERE event_data::text ~* '(password|cvv|otp|pan|card_number)'
LIMIT 5;
-- Should return 0 rows
```

### Check 4: Orphaned Records

**SQL**:
```sql
-- Check for analysis_transactions without parent analysis
SELECT COUNT(*) FROM analysis_transactions at
WHERE NOT EXISTS (SELECT 1 FROM spending_analyses sa WHERE sa.id = at.analysis_id);
-- Should be 0

-- Check for recommendation_cards without parent snapshot
SELECT COUNT(*) FROM recommendation_cards rc
WHERE NOT EXISTS (SELECT 1 FROM recommendation_snapshots rs WHERE rs.id = rc.snapshot_id);
-- Should be 0
```

---

## Performance & Reliability

### Test Scenario: Large File Upload

**Steps**:
1. [ ] Upload a 10-20 page PDF statement (realistic size)
2. [ ] Parsing completes in < 30 seconds
3. [ ] No timeout errors

### Test Scenario: Concurrent Users

**Steps**:
1. [ ] Have 2-3 beta testers login/upload simultaneously
2. [ ] No database lock errors
3. [ ] Each user sees their own data only (RLS working)

### Test Scenario: Offline Mode

**Steps**:
1. [ ] On dashboard, disconnect internet (dev tools)
2. [ ] Try to update card application status → **Queued**
3. [ ] Reconnect → **Syncs automatically**, toast: "Synced X offline changes"

**SQL Verification**:
```sql
-- Check offline queue processed event
SELECT event_type, event_data FROM analytics_events
WHERE event_type = 'offline_queue_processed'
ORDER BY created_at DESC LIMIT 1;
```

---

## Final Sanity Checks

- [ ] **No console errors** on any page (fresh user, returning user, admin)
- [ ] **Mobile responsive**: Test on mobile viewport, all pages usable
- [ ] **Dark mode**: Toggle theme, all pages readable
- [ ] **Navigation**: All nav links work, no 404s
- [ ] **Error boundaries**: Try to trigger an error (e.g., bad DB query) → should show friendly error, not crash
- [ ] **Loading states**: All async data shows skeleton/spinner while loading
- [ ] **Empty states**: User with no data sees helpful CTAs (e.g., "Upload your first statement")
- [ ] **RLS working**: User A cannot see User B's data (test with 2 accounts)
- [ ] **Audit log populated**: Key events logged (auth, consent, admin views, deletions)

---

## Automated Test Suggestions (Optional for CI)

- **Unit tests** for:
  - `merchantAnonymization.ts`: sanitization logic
  - `transactionRules.ts`: spending calculations
  - `auditLog.ts`: sensitive field redaction
- **Integration tests** for:
  - Auth flow (signup, login, logout)
  - Upload → parse → create analysis
  - Generate recommendations
- **E2E tests** (Playwright) for:
  - Full user journey: signup → onboarding → upload → recs → dashboard
  - Admin timeline access
