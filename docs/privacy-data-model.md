# Privacy & Data Model Documentation

**Last Updated:** November 2025  
**Version:** 1.0

## Overview

Card & Carry is a credit card recommendation platform that helps users find the best credit cards based on their spending patterns. This document outlines our data practices, security measures, and privacy commitments.

## What We Store and Why

### Identity & Profile Data

**Tables:** `profiles`, `user_roles`

We store basic user identity information to:
- Authenticate users securely
- Personalize recommendations
- Provide user-specific features

**Data collected:**
- Email address (required for authentication)
- Full name (optional, for personalization)
- Age range (for eligibility matching)
- Income band (for card eligibility)
- City/location (for location-specific offers)
- Phone number (optional, for OTP verification)
- Employment type (optional, for card eligibility)

**What we DON'T store:**
- Social security numbers
- Government-issued ID numbers
- Biometric data

### Financial & Transaction Data

**Tables:** `spending_analyses`, `analysis_transactions`, `processed_transactions`, `user_features`, `merchant_intelligence`

We analyze transaction data to:
- Calculate personalized card recommendations
- Estimate potential rewards and savings
- Understand spending patterns

**Data collected:**
- Transaction dates and amounts
- Merchant names (anonymized for sensitive categories)
- Spending categories
- Aggregate spending patterns

**What we DON'T store:**
- Full credit card numbers (PAN)
- CVV codes
- Banking passwords or credentials
- Account numbers
- Routing numbers
- Card PINs

### Card & Application Tracking

**Tables:** `user_cards`, `card_applications`, `user_shortlist`, `fee_waiver_goals`, `recommendation_snapshots`, `recommendation_cards`

We track user card ownership and application status to:
- Avoid recommending cards users already have
- Track application outcomes
- Provide reminders for fee waivers and benefits

**Data collected:**
- Cards users own (product name, issuer)
- Application status tracking
- User preferences for cards
- Estimated rewards and savings

### Usage & Behavior Data

**Tables:** `analytics_events`, `card_views`, `audit_log`

We track user interactions to:
- Improve our recommendation algorithm
- Debug issues and improve user experience
- Understand which features are most valuable

**Data collected:**
- Page views and clicks
- Feature usage patterns
- Search queries within the app
- Errors and system events

**What we DON'T track:**
- Browsing history outside our app
- Keystrokes or detailed mouse movements
- Data from other websites or apps

## Data Retention Policy

### Active Data (Immediate Access)

- **User profiles:** Retained as long as account is active
- **Current analysis & recommendations:** 18 months
- **Card applications & tracking:** As long as account is active
- **User preferences:** As long as account is active

### Historical Data (Automated Cleanup)

We automatically clean up old, granular data:

| Data Type | Retention Period |
|-----------|------------------|
| Transaction-level details | 18 months |
| Analytics events | 24 months |
| Card view events | 12 months |
| Audit logs | 24 months |
| Old recommendation snapshots | 18 months |

**Cleanup Schedule:** Automated cleanup runs weekly via scheduled job.

**Exception:** We retain high-level aggregate statistics (anonymized) indefinitely for product improvement.

## Consent Model

### When Consent is Required

Users must provide explicit consent before we:
- Process credit card statement data
- Analyze transaction history
- Generate personalized recommendations

### How Consent is Captured

1. **Timing:** Before first statement upload or onboarding completion
2. **Method:** Clear modal dialog with:
   - Plain language explanation of what we collect
   - Explicit list of what we don't collect
   - Active opt-in (checkbox + button)
3. **Storage:** Consent flag and timestamp stored in `profiles` table
4. **Versioning:** Terms and privacy versions tracked

### User Rights

Users can:
- **Withdraw consent:** Stop processing at any time (profile settings)
- **Export data:** Download all personal data (JSON format)
- **Delete data:** Request complete account and data deletion
- **View audit trail:** See history of what was processed (personal audit log)

## Merchant Anonymization

### Sensitive Categories

For certain transaction categories, we anonymize merchant names in:
- User-facing displays
- Data exports (CSV, PDF)
- External analytics

**Sensitive categories include:**
- Healthcare / Medical services
- Mental health services
- Adult entertainment
- Religious organizations
- Political organizations

### Implementation

- **Internal/Admin views:** Real merchant names (for debugging)
- **User-facing views:** "Healthcare Provider", "Personal Services", etc.
- **Data exports:** Anonymized labels only

## Analytics & Event Safety

### Safe Event Tracking

We use a `safeTrackEvent()` helper that:
- Whitelists allowed event properties
- Removes sensitive fields automatically
- Prevents accidental logging of:
  - Card numbers
  - CVV codes
  - OTPs
  - Passwords
  - Full statement text
  - API keys or tokens

### Event Types Tracked

**User actions:**
- Page navigation
- Feature usage (e.g., "viewed card details")
- Search queries
- Filter/preference changes

**System events:**
- Analysis completion
- Recommendation generation
- Errors and failures

**Admin actions:**
- User timeline/debug views
- Data export requests

## Security Measures

### Authentication & Access Control

- **Row-Level Security (RLS):** All database tables enforce user-level access
- **Service role access:** Edge functions use service role only when necessary
- **Admin roles:** Separate `user_roles` table, never stored in client
- **Password hashing:** Bcrypt for OTPs, Supabase Auth for passwords

### Data Encryption

- **At rest:** Supabase encryption for all database tables
- **In transit:** TLS for all connections
- **Statements:** Stored in private, non-public Supabase storage bucket

### Audit Trail

Every significant action is logged in `audit_log`:
- User authentication events
- Statement uploads and analysis
- Recommendation generation
- Data rights requests (export/delete)
- Admin access to user data

## Compliance & Third Parties

### Data Sharing

We **do not sell** user data to third parties.

**Limited sharing scenarios:**
- **No affiliate relationships:** We do not participate in affiliate programs or earn commissions. 
  All "apply" links go directly to bank websites. We don't track referrals or receive compensation 
  when users apply for cards.
- **Service providers:** Cloud infrastructure (Supabase/AWS)
  - Governed by Data Processing Agreements (DPAs)
  - No data access without explicit purpose

### Regulatory Compliance

- **Data minimization:** We collect only what's needed
- **Purpose limitation:** Data used only for stated purposes
- **User rights:** Full export, deletion, and consent withdrawal
- **Breach notification:** Immediate notification in case of security incident

## Changes to This Policy

We will notify users of material changes to this privacy policy via:
- Email notification
- In-app banner (30 days advance notice)
- Updated version number and timestamp

## Contact & Data Rights Requests

For data rights requests or privacy questions:
- **In-app:** Profile → Privacy & Data
- **Email:** privacy@cardandcarry.app

**Response time:** Within 30 days of request

---

**Document Version:** 1.0  
**Effective Date:** November 2025  
**Last Review:** November 2025  
**Next Review:** May 2026
