# Mixpanel Event Tracking Guide

## Overview

This app uses **Mixpanel** for product analytics alongside our internal Supabase `analytics_events` system (dual tracking mode).

## Setup

1. **Get Mixpanel Token**: Create a project in Mixpanel dashboard
2. **Set Environment Variable**: Add `VITE_MIXPANEL_TOKEN` in Lovable Project Settings
3. **Deploy**: Events will start flowing automatically

## Core Modules

- **`src/lib/mixpanel.ts`**: Mixpanel wrapper with helper functions
- **`src/lib/analytics.ts`**: Unified bridge that sends to both Supabase and Mixpanel

## Usage

```typescript
import { trackEvent } from '@/lib/analytics';

trackEvent('button_clicked', {
  buttonName: 'submit',
  page: 'checkout',
});
```

## Event Naming Convention

Use **snake_case** with dot notation: `<category>.<action>_<object>`

Examples:
- `auth.signup_completed`
- `upload.extraction_started`
- `transactions.category_edited`

## Core Events Implemented

### Authentication
- `auth.signup_started` - User begins signup
- `auth.signup_completed` - Email verified
- `auth.login_success` - User logs in
- `auth.logout` - User logs out
- `auth.password_reset_completed` - Password reset successful

### Onboarding
- `onboarding.profile_step_viewed` - Profile page viewed
- `onboarding.profile_form_submitted` - Profile submitted
- `onboarding.spending_hints_provided` - Optional spending data provided
- `onboarding.completed` - Onboarding finished

### Upload & Transactions
- `upload.page_viewed` - Upload page visited
- `upload.files_selected` - Files selected
- `upload.password_modal_shown` - Encrypted PDF detected
- `upload.decryption_success` / `upload.decryption_failed` - Decryption result
- `upload.extraction_started` - Extraction begins
- `upload.extraction_completed` - Extraction successful
- `upload.extraction_failed` - Extraction failed
- `transactions.review_opened` - Review screen shown
- `transactions.category_edited` - User edits category
- `transactions.review_submitted` - User submits review

### Navigation
- `page_view` - Every route change

## User Properties

Set once per session (NO PII):
- `ageRange`, `incomeBand`, `cityTier`, `employmentType`
- `hasCompletedOnboarding`, `monthlySpendBucket`
- `feeSensitivity`, `travelFrequency`

## Privacy

✅ No email, phone, name, exact location
✅ EU data residency enabled
✅ Do Not Track respected
✅ Aggregated/bucketed values only

## Testing

1. Set `VITE_MIXPANEL_TOKEN` in `.env.local`
2. Run app and perform actions
3. Check Mixpanel Live View for events

## What's Left

Additional events to implement later:
- Analysis & recommendation generation events
- Dashboard interaction events
- Card shortlist/application events
- Admin events
