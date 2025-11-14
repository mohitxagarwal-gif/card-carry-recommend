# Card & Carry - Application Map (Beta)

## Public Routes

### `/` - Landing Page
**Purpose**: Market the product, explain features, direct users to signup/login  
**User Entry**: Direct link, marketing campaigns  
**Dependencies**: 
- `site_content` table for editable homepage sections
- Auth redirect logic (if logged in → redirects to dashboard/upload)
**Key Flows**: CTA buttons → `/auth`

### `/about` - About Page  
**Purpose**: Company information, mission statement  
**User Entry**: Footer link, navbar  
**Dependencies**: `site_content` table  

### `/auth` - Authentication Page
**Purpose**: Sign up with email/password or Google OAuth, login, password reset  
**User Entry**: Landing page CTA, direct navigation when logged out  
**Dependencies**:
- Supabase Auth (email, Google OAuth)
- `profiles` table (trigger creates row on signup)
- `user_roles` table (admin assignment)
- `audit_log` (auth success/failure events)
- Environment: `VITE_SUPABASE_URL`, OAuth redirect URLs
**Key Flows**: 
- New user → profile creation → `/onboarding/profile`
- Returning user → afterAuthRedirect logic → `/dashboard` or `/upload`
- Password reset via email link

---

## Onboarding Routes (Protected, `requireOnboarding: false`)

### `/onboarding/profile` - Quick Profile Setup
**Purpose**: Collect minimal user data (age, income, city, first-card flag, optional spending hints)  
**User Entry**: After successful auth for new users  
**Dependencies**:
- `profiles` table: `age_range`, `income_band_inr`, `city`, `onboarding_completed`
- `user_preferences` table: initialized with defaults
- `user_features` table: derived features if spending hints provided
- Edge function: `derive-user-features` (if hints provided)
**Key Flows**: 
- Complete onboarding → sets `onboarding_completed = true` → redirects to `/upload`
- Skip hints → go straight to upload

---

## Main App Routes (Protected, require onboarding)

### `/upload` - Statement Upload
**Purpose**: Upload credit card / bank statements (PDF), check encryption, extract & parse transactions  
**User Entry**: From onboarding completion, dashboard "New Analysis" button, nav menu  
**Dependencies**:
- Storage bucket: `statements`
- Edge functions: `extract-transactions`, `categorize-merchant`
- `spending_analyses` table: created with extracted data
- `analysis_transactions` table: normalized transactions
- `analysis_runs` table: tracks batch processing
- `processed_transactions` table: deduplication tracking
- `merchant_intelligence` table: lookup for categorization
- Consent check: `profiles.data_processing_consent` must be true
**Key Flows**:
- User uploads PDF → encryption check → password prompt (if encrypted) → parse → store in DB
- After successful parse → redirect to `/results?analysisId=<id>`
- Consent gate: if no consent → show ConsentModal before allowing parse

### `/results` - Transaction Review & Recommendations
**Purpose**: Review extracted transactions, edit categories/merchants, generate personalized card recommendations  
**User Entry**: After upload completes, or resume from dashboard  
**Dependencies**:
- `spending_analyses` table: fetch analysis data
- `analysis_transactions` table: CRUD on transactions
- `recommendation_snapshots` table: save recommendation results
- `recommendation_cards` table: normalized card recommendations
- `user_preferences` table: used in scoring
- `profiles` table: income, age for eligibility checks
- `credit_cards` table: card catalog
- Edge function: `generate-recommendations`
**Key Flows**:
- View transactions → edit category/merchant → recalculate spending split
- Click "Get Recommendations" → calls edge function → creates `recommendation_snapshot` + `recommendation_cards` rows
- View recommended cards → shortlist, apply link → redirect to `/dashboard`

### `/dashboard` - User Home
**Purpose**: Central hub showing:
- Recommended cards
- Shortlisted cards
- My existing cards
- Fee waiver goals progress
- Reminders (renewal, lounge resets)
- Content feed carousel
- Next steps / eligibility center
**User Entry**: Default landing for returning users with complete analysis  
**Dependencies**:
- `recommendation_snapshots`, `recommendation_cards` tables
- `user_shortlist` table
- `card_applications` table
- `user_cards` table
- `fee_waiver_goals` table
- `user_reminders` table
- `content_feed` table
- `credit_cards` table (join for card details)
**Key Flows**:
- View recommendations → click "Apply" → outlink modal → logs `affiliate_clicks`
- Add card to shortlist → stored in `user_shortlist`
- Manage owned cards → CRUD on `user_cards`
- Dismiss reminders → update `user_reminders.dismissed`

### `/profile` - User Profile & Settings
**Purpose**: Edit profile fields, manage preferences (fee sensitivity, lounge importance, excluded issuers), export data, delete account  
**User Entry**: Nav menu, dashboard settings icon  
**Dependencies**:
- `profiles` table: update user info
- `user_preferences` table: update preferences
- `audit_log` table: log sensitive actions (data export, account deletion)
- Edge function: `delete-user-data` (for account deletion)
**Key Flows**:
- Update profile → save to `profiles`
- Export data → calls `exportUserData()` → downloads JSON with anonymized merchants
- Delete account → calls edge function → deletes/anonymizes user data → logout

### `/applications` - Card Application Tracker
**Purpose**: Track status of credit card applications (considering, applied, approved, rejected)  
**User Entry**: Nav menu, dashboard "Applications" module  
**Dependencies**:
- `card_applications` table: CRUD application records
- `credit_cards` table: join for card details
- Offline queue support for status updates
**Key Flows**:
- Change status dropdown → updates DB
- Add notes → updates `card_applications.notes`

### `/cards` - Browse All Cards
**Purpose**: Explore full card catalog with filters (issuer, network, category badges)  
**User Entry**: Nav menu  
**Dependencies**:
- `credit_cards` table: active cards only
- `user_shortlist` table: check if card is shortlisted
- `card_views` table: log card detail views for analytics
**Key Flows**:
- Filter/search cards → view details modal → shortlist or apply

### `/recommendations` - Recommendations Page (Alternative View)
**Purpose**: Alternative view of recommendations with more customization controls  
**User Entry**: Dashboard link (if exists), nav menu  
**Dependencies**: Same as `/results` recommendations section

---

## Admin Routes (Protected, require admin role)

### `/admin` - Admin Dashboard  
**Purpose**: Overview of system health, user stats, recent activity  
**User Entry**: Nav menu (admin only)  
**Dependencies**:
- `user_roles` table: `has_role(auth.uid(), 'admin')` check
- Various tables for stats queries
**Key Flows**: Links to other admin modules

### `/admin/cards` - Manage Card Catalog
**Purpose**: CRUD operations on credit cards  
**User Entry**: Admin nav  
**Dependencies**:
- `credit_cards` table: insert/update/delete
- `audit_log`: log card changes
**Key Flows**: Add/edit/deactivate cards

### `/admin/card/:id/details` - Card Details Manager
**Purpose**: Edit detailed card info (Nerd Out fields)  
**User Entry**: From `/admin/cards`  
**Dependencies**: `credit_cards` table

### `/admin/cards/bulk` - Bulk Card Upload
**Purpose**: Upload CSV to bulk create/update cards  
**User Entry**: Admin nav  
**Dependencies**: `credit_cards` table, CSV parser

### `/admin/benefits` - Card Benefits Manager
**Purpose**: Manage detailed benefit rules (earn rates, caps, partner brands, validity periods)  
**User Entry**: Admin nav  
**Dependencies**: `card_benefits` table

### `/admin/content` - Content Feed Manager
**Purpose**: Manage dashboard content feed items  
**User Entry**: Admin nav  
**Dependencies**: `content_feed` table

### `/admin/site-content` - Site Content Manager
**Purpose**: Edit homepage, FAQ, How It Works sections  
**User Entry**: Admin nav  
**Dependencies**: `site_content` table

### `/admin/analytics` - Analytics Dashboard
**Purpose**: View funnel metrics, user demographics, card performance, system activity  
**User Entry**: Admin nav  
**Dependencies**:
- `analytics_events` table
- `profiles`, `spending_analyses`, `recommendation_snapshots`, `card_applications`, `affiliate_clicks` tables
- Custom SQL aggregations

### `/admin/user-timeline` - User Activity Timeline
**Purpose**: Debug user issues by viewing chronological event history  
**User Entry**: Admin nav  
**Dependencies**:
- `audit_log` table: security events
- `analytics_events` table: user actions
- `spending_analyses`, `recommendation_snapshots` tables: workflow milestones
- RLS policies: admin can view all events

---

## Storage Buckets

### `statements`
- **Purpose**: Store uploaded PDF statements
- **Public**: No
- **RLS**: Users can read/write their own files only
- **File path pattern**: `{user_id}/{statement_id}.pdf`

### `card-images`
- **Purpose**: Store credit card images for catalog
- **Public**: Yes
- **RLS**: Admins can write, anyone can read

---

## Edge Functions

### `extract-transactions`
**Purpose**: Parse PDF statement, extract transactions, return structured JSON  
**Invoked by**: `/upload` page  
**Dependencies**: `pdfjs-dist` library, `statements` bucket  
**Returns**: Array of transactions with dates, amounts, merchants

### `categorize-merchant`
**Purpose**: Classify merchant into spending category using AI/rules + merchant intelligence table  
**Invoked by**: `extract-transactions` function, transaction edit  
**Dependencies**: `merchant_intelligence` table, Lovable AI API  
**Returns**: Category, subcategory, confidence score

### `derive-user-features`
**Purpose**: Calculate spending split percentages, monthly estimate, risk scores from transaction data or self-reported hints  
**Invoked by**: `/onboarding/profile`, after analysis creation  
**Dependencies**: `analysis_transactions` or request body  
**Writes to**: `user_features` table

### `generate-recommendations`
**Purpose**: Score all active credit cards against user's spending profile, return top N recommendations with reasoning  
**Invoked by**: `/results` "Get Recommendations" button  
**Dependencies**: `user_features`, `user_preferences`, `profiles`, `credit_cards`, `card_benefits` tables  
**Returns**: Array of card recommendations with match scores, estimated value, warnings

### `delete-user-data`
**Purpose**: GDPR-compliant data deletion / anonymization when user deletes account  
**Invoked by**: `/profile` account deletion  
**Dependencies**: Multiple user tables  
**Actions**: Deletes or anonymizes PII, preserves aggregated analytics

### `send-phone-otp` / `verify-phone-otp`
**Purpose**: SMS OTP verification (currently unused in streamlined onboarding)  
**Dependencies**: Twilio integration, `phone_verifications` table

### `create-analysis-run`
**Purpose**: Create batch analysis run record (if async processing needed)  
**Dependencies**: `analysis_runs` table

### `update-merchant-category`
**Purpose**: Update merchant intelligence table when admin manually corrects a category  
**Dependencies**: `merchant_intelligence` table

### `email-summary`
**Purpose**: Send periodic email summaries (if email reminders enabled)  
**Dependencies**: User preferences, email service

---

## Critical Environment Variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- OAuth redirect URLs (configured in Supabase Auth settings)
- Twilio credentials (if phone verification used)

---

## Key Decision Points

1. **Auth redirect logic** (`afterAuthRedirect` in `authUtils.ts`):
   - No profile → error
   - Onboarding incomplete → `/onboarding/profile`
   - Has recommendations → `/dashboard`
   - Has recent analysis (< 7 days) → `/results?analysisId=<id>`
   - No analysis or stale → `/upload`

2. **Consent gate** (`ConsentModal`):
   - Triggered on first upload attempt if `data_processing_consent = false`
   - Blocks parsing until user consents
   - Logs `CONSENT_GRANTED` or `CONSENT_DECLINED` to `audit_log`

3. **Recommendation generation**:
   - Requires completed `spending_analyses` with transactions
   - Creates `recommendation_snapshots` + `recommendation_cards` rows
   - Used throughout dashboard and results pages

4. **Offline queue**:
   - Queues actions (status updates, shortlist adds) when offline
   - Processes on reconnection
   - Uses localStorage `offline_queue` key
