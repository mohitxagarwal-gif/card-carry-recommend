# Card & Carry - Beta Analytics & Runbook

## Analytics Event Taxonomy

### Core Metrics (Pre-Defined)

| Event Type | Description | Payload Fields | Fired From |
|------------|-------------|----------------|------------|
| `auth_success` | User successfully authenticated | `provider` (email/google) | `Auth.tsx` |
| `onboarding_completed` | User completed profile setup | `has_spending_hints` (bool) | `OnboardingQuickProfile.tsx` |
| `consent_given` | User granted data processing consent | `terms_version`, `privacy_version` | `ConsentModal.tsx` |
| `statement_uploaded` | Statement file uploaded to storage | `file_size`, `file_type` | `Upload.tsx` |
| `analysis_completed` | Transaction extraction completed | `transaction_count`, `analysis_id` | `Upload.tsx` |
| `recs_viewed` | User viewed recommendations | `snapshot_id`, `card_count` | `Results.tsx` |
| `card_shortlisted` | User added card to shortlist | `card_id`, `source` (recs/cards/dashboard) | Various |
| `recs_apply_click` | User clicked "Apply" on recommended card | `card_id`, `rank`, `match_score` | `CardActionBar.tsx` |
| `data_export` | User exported their data | (none) | `Profile.tsx` |
| `parse_failed` | Statement parsing failed | `error_type`, `file_name` | `Upload.tsx` |
| `edge_function_error` | Edge function invocation failed | `function_name`, `error_message` | Edge functions |

### Additional Instrumentation Needed

**Add these events to existing flows**:
- `dash_view` → Already present ✓
- `card_detail_view` → Log in `CardDetailsModal.tsx` when opened
- `transaction_edit` → Log in `Results.tsx` when category changed
- `application_status_update` → Log in `useApplications.ts` mutation
- `card_added_to_wallet` → Log in `AddCardDialog.tsx` on save
- `reminder_dismissed` → Log in `RemindersModule.tsx` on dismiss
- `goal_set` → Log in `FeeWaiverGoalsModule.tsx` on create

---

## SQL Queries for Beta Monitoring

### 1. Daily Active Users (DAU)

```sql
-- DAU: Users with any event or analysis in the last 24 hours
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as dau
FROM (
  SELECT user_id, created_at FROM analytics_events WHERE created_at >= now() - interval '30 days'
  UNION ALL
  SELECT user_id, created_at FROM spending_analyses WHERE created_at >= now() - interval '30 days'
) combined
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 2. Funnel Metrics (Daily)

```sql
-- Acquisition & Activation Funnel
WITH daily_signups AS (
  SELECT DATE(created_at) as date, COUNT(DISTINCT id) as signups
  FROM profiles
  WHERE created_at >= now() - interval '30 days'
  GROUP BY DATE(created_at)
),
daily_onboarding AS (
  SELECT DATE(onboarding_completed_at) as date, COUNT(*) as completed_onboarding
  FROM profiles
  WHERE onboarding_completed_at >= now() - interval '30 days' AND onboarding_completed = true
  GROUP BY DATE(onboarding_completed_at)
),
daily_consent AS (
  SELECT DATE(data_processing_consent_at) as date, COUNT(*) as gave_consent
  FROM profiles
  WHERE data_processing_consent_at >= now() - interval '30 days' AND data_processing_consent = true
  GROUP BY DATE(data_processing_consent_at)
),
daily_uploads AS (
  SELECT DATE(ae.created_at) as date, COUNT(DISTINCT ae.user_id) as uploaded_statement
  FROM analytics_events ae
  WHERE ae.event_type = 'statement_uploaded' AND ae.created_at >= now() - interval '30 days'
  GROUP BY DATE(ae.created_at)
),
daily_analyses AS (
  SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as completed_analysis
  FROM spending_analyses
  WHERE created_at >= now() - interval '30 days'
  GROUP BY DATE(created_at)
),
daily_recs AS (
  SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as viewed_recs
  FROM recommendation_snapshots
  WHERE created_at >= now() - interval '30 days'
  GROUP BY DATE(created_at)
),
daily_applies AS (
  SELECT DATE(clicked_at) as date, COUNT(DISTINCT user_id) as clicked_apply
  FROM affiliate_clicks
  WHERE clicked_at >= now() - interval '30 days'
  GROUP BY DATE(clicked_at)
)

SELECT
  COALESCE(ds.date, do.date, dc.date, du.date, da.date, dr.date, dap.date) as date,
  COALESCE(ds.signups, 0) as signups,
  COALESCE(do.completed_onboarding, 0) as completed_onboarding,
  COALESCE(dc.gave_consent, 0) as gave_consent,
  COALESCE(du.uploaded_statement, 0) as uploaded_statement,
  COALESCE(da.completed_analysis, 0) as completed_analysis,
  COALESCE(dr.viewed_recs, 0) as viewed_recs,
  COALESCE(dap.clicked_apply, 0) as clicked_apply
FROM daily_signups ds
FULL OUTER JOIN daily_onboarding do ON ds.date = do.date
FULL OUTER JOIN daily_consent dc ON ds.date = dc.date
FULL OUTER JOIN daily_uploads du ON ds.date = du.date
FULL OUTER JOIN daily_analyses da ON ds.date = da.date
FULL OUTER JOIN daily_recs dr ON ds.date = dr.date
FULL OUTER JOIN daily_applies dap ON ds.date = dap.date
ORDER BY date DESC;
```

### 3. Parse Success Rate (Reliability)

```sql
-- Statement parsing success rate over time
WITH parse_events AS (
  SELECT
    DATE(created_at) as date,
    event_type,
    COUNT(*) as count
  FROM analytics_events
  WHERE event_type IN ('statement_uploaded', 'analysis_completed', 'parse_failed')
    AND created_at >= now() - interval '30 days'
  GROUP BY DATE(created_at), event_type
)

SELECT
  date,
  MAX(CASE WHEN event_type = 'analysis_completed' THEN count ELSE 0 END) as successes,
  MAX(CASE WHEN event_type = 'parse_failed' THEN count ELSE 0 END) as failures,
  ROUND(
    100.0 * MAX(CASE WHEN event_type = 'analysis_completed' THEN count ELSE 0 END) /
    NULLIF(
      MAX(CASE WHEN event_type = 'analysis_completed' THEN count ELSE 0 END) +
      MAX(CASE WHEN event_type = 'parse_failed' THEN count ELSE 0 END),
      0
    ),
    2
  ) as success_rate_pct
FROM parse_events
GROUP BY date
ORDER BY date DESC;
```

### 4. User Depth Metrics

```sql
-- Average statements per user, avg shortlisted cards
SELECT
  COUNT(DISTINCT p.id) as total_users,
  ROUND(AVG(sa_count.cnt), 2) as avg_statements_per_user,
  ROUND(AVG(sl_count.cnt), 2) as avg_shortlisted_cards_per_user
FROM profiles p
LEFT JOIN LATERAL (
  SELECT COUNT(*) as cnt FROM spending_analyses WHERE user_id = p.id
) sa_count ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) as cnt FROM user_shortlist WHERE user_id = p.id
) sl_count ON true
WHERE p.onboarding_completed = true;
```

### 5. Top Recommended Cards (Beta Feedback)

```sql
-- Most frequently recommended cards
SELECT
  cc.name,
  cc.issuer,
  cc.network,
  COUNT(*) as times_recommended,
  ROUND(AVG(rc.match_score), 2) as avg_match_score,
  ROUND(AVG(rc.estimated_annual_value_inr), 0) as avg_estimated_value
FROM recommendation_cards rc
JOIN credit_cards cc ON cc.card_id = rc.card_id
WHERE rc.created_at >= now() - interval '30 days'
GROUP BY cc.card_id, cc.name, cc.issuer, cc.network
ORDER BY times_recommended DESC
LIMIT 10;
```

### 6. Error Log (Recent Failures)

```sql
-- Recent errors from audit_log and analytics_events
SELECT
  'audit_log' as source,
  created_at,
  event_type,
  severity,
  metadata->>'error_message' as error,
  user_id
FROM audit_log
WHERE severity IN ('error', 'critical')
  AND created_at >= now() - interval '7 days'

UNION ALL

SELECT
  'analytics_events' as source,
  created_at,
  event_type,
  'error' as severity,
  event_data->>'error_message' as error,
  user_id
FROM analytics_events
WHERE event_type LIKE '%error%' OR event_type LIKE '%failed%'
  AND created_at >= now() - interval '7 days'

ORDER BY created_at DESC
LIMIT 50;
```

### 7. Conversion Rate: Signup → Recommendations

```sql
-- % of signups that reached recommendations within 7 days
WITH cohort AS (
  SELECT
    id as user_id,
    DATE(created_at) as signup_date
  FROM profiles
  WHERE created_at >= now() - interval '30 days'
)

SELECT
  c.signup_date,
  COUNT(DISTINCT c.user_id) as signups,
  COUNT(DISTINCT rs.user_id) as reached_recs,
  ROUND(100.0 * COUNT(DISTINCT rs.user_id) / COUNT(DISTINCT c.user_id), 2) as conversion_rate_pct
FROM cohort c
LEFT JOIN recommendation_snapshots rs ON rs.user_id = c.user_id
  AND rs.created_at <= c.signup_date + interval '7 days'
GROUP BY c.signup_date
ORDER BY c.signup_date DESC;
```

---

## Supabase Views (Optional - Create for Quick Access)

### View: `v_daily_funnel`

```sql
CREATE OR REPLACE VIEW public.v_daily_funnel AS
-- (Paste funnel query from #2 above)
;

-- Usage:
SELECT * FROM v_daily_funnel WHERE date >= current_date - 7 ORDER BY date DESC;
```

### View: `v_user_activity_summary`

```sql
CREATE OR REPLACE VIEW public.v_user_activity_summary AS
SELECT
  p.id as user_id,
  p.email,
  p.created_at as signup_date,
  p.onboarding_completed,
  p.data_processing_consent,
  (SELECT COUNT(*) FROM spending_analyses WHERE user_id = p.id) as analyses_count,
  (SELECT COUNT(*) FROM recommendation_snapshots WHERE user_id = p.id) as recs_count,
  (SELECT COUNT(*) FROM user_shortlist WHERE user_id = p.id) as shortlist_count,
  (SELECT COUNT(*) FROM card_applications WHERE user_id = p.id) as applications_count,
  (SELECT MAX(created_at) FROM analytics_events WHERE user_id = p.id) as last_active_at
FROM profiles p
WHERE p.onboarding_completed = true;

-- Usage:
SELECT * FROM v_user_activity_summary ORDER BY last_active_at DESC LIMIT 20;
```

---

## Beta Launch Runbook

### Pre-Launch (T-1 Day)

1. **Database Health Check**:
   ```sql
   -- Verify all tables exist
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   -- Should include: audit_log, analysis_transactions, recommendation_cards, data_retention_config, etc.
   ```

2. **RLS Policy Check**:
   ```sql
   -- List tables without RLS enabled (should be admin-only tables or empty)
   SELECT tablename FROM pg_tables
   WHERE schemaname = 'public'
     AND rowsecurity = false
   ORDER BY tablename;
   ```

3. **Edge Functions Deployed**:
   - Confirm all functions listed in app map are deployed and callable
   - Test key functions with sample payloads (e.g., `generate-recommendations`, `extract-transactions`)

4. **Environment Variables**:
   - Confirm `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` set in preview & deployed builds
   - Confirm OAuth redirect URLs include preview + deployed domains

5. **Content Seed**:
   - Ensure `credit_cards` table has 20-30 active cards for recommendations
   - Ensure `content_feed` table has 3-5 items for dashboard carousel
   - Ensure `site_content` table populated for homepage

6. **Admin Account**:
   - Create admin user, assign `admin` role in `user_roles` table
   - Test admin can access `/admin/*` routes

### Launch Day (T+0)

1. **Monitor Errors**:
   ```sql
   -- Run this query every hour
   SELECT * FROM (
     SELECT 'audit_log' as source, created_at, event_type, severity, metadata->>'error_message' as error
     FROM audit_log WHERE severity IN ('error', 'critical') AND created_at >= now() - interval '1 hour'
     UNION ALL
     SELECT 'analytics' as source, created_at, event_type, 'error', event_data->>'error_message'
     FROM analytics_events WHERE event_type LIKE '%error%' AND created_at >= now() - interval '1 hour'
   ) errors ORDER BY created_at DESC;
   ```

2. **Watch Signups**:
   ```sql
   -- Real-time signup count
   SELECT DATE(created_at) as date, COUNT(*) as signups
   FROM profiles
   WHERE created_at >= current_date
   GROUP BY DATE(created_at);
   ```

3. **Parse Success Rate**:
   ```sql
   -- Check hourly parse success
   SELECT
     DATE_TRUNC('hour', created_at) as hour,
     SUM(CASE WHEN event_type = 'analysis_completed' THEN 1 ELSE 0 END) as successes,
     SUM(CASE WHEN event_type = 'parse_failed' THEN 1 ELSE 0 END) as failures
   FROM analytics_events
   WHERE event_type IN ('analysis_completed', 'parse_failed')
     AND created_at >= now() - interval '6 hours'
   GROUP BY DATE_TRUNC('hour', created_at)
   ORDER BY hour DESC;
   ```

4. **User Support**:
   - Monitor Discord/email for beta tester questions
   - Use `/admin/user-timeline` to debug reported issues
   - Document common issues in a shared doc

### Post-Launch (T+1 to T+7)

1. **Daily Metrics Review**:
   - Run funnel query (#2 above) each morning
   - Track DAU growth
   - Note any drop-offs (e.g., many signups but few uploads)

2. **Weekly Retrospective**:
   - Pull conversion rates: signup → onboarding → upload → recs → apply
   - Identify bottlenecks (e.g., low consent rate, high parse failures)
   - Review top recommended cards, ensure diverse recommendations

3. **Feedback Loop**:
   - Survey beta testers: "Was the recommendation relevant?"
   - Track `recs_apply_click` events as proxy for relevance
   - Iterate on recommendation algorithm if needed

---

## Troubleshooting Playbook

### Issue: User Stuck on Auth Page After Login

**Symptoms**: User logs in, page refreshes, but stays on `/auth`

**Debug**:
1. Check browser console for errors (profile polling failure?)
2. Check SQL:
   ```sql
   SELECT id, onboarding_completed, age_range, income_band_inr
   FROM profiles WHERE email = '<user_email>';
   ```
3. If no profile → database trigger issue, manually insert row
4. If profile exists but `onboarding_completed = false` and fields empty → redirect logic issue, check `authUtils.ts`

**Fix**:
- If profile missing: Manually create profile row for that user
- If redirect logic broken: Check `afterAuthRedirect()` function, ensure no early returns

### Issue: Statement Upload Fails (Parse Error)

**Symptoms**: Upload shows "Failed to extract transactions"

**Debug**:
1. Check edge function logs:
   ```
   supabase functions logs extract-transactions --filter error
   ```
2. Check `analytics_events`:
   ```sql
   SELECT event_data FROM analytics_events
   WHERE event_type = 'parse_failed' AND user_id = '<user_id>'
   ORDER BY created_at DESC LIMIT 1;
   ```
3. Download the uploaded PDF from `statements` bucket, try parsing locally

**Fix**:
- If PDF is encrypted and user didn't enter password → prompt again
- If PDF format unsupported → improve extraction logic or manual entry
- If edge function timeout → increase timeout or optimize parser

### Issue: Recommendations Not Generated

**Symptoms**: User clicks "Get Recommendations", loading spinner forever, no results

**Debug**:
1. Check edge function logs:
   ```
   supabase functions logs generate-recommendations --filter error
   ```
2. Check `recommendation_snapshots` table:
   ```sql
   SELECT * FROM recommendation_snapshots WHERE user_id = '<user_id>' ORDER BY created_at DESC LIMIT 1;
   ```
3. Check `user_features`:
   ```sql
   SELECT * FROM user_features WHERE user_id = '<user_id>';
   ```

**Fix**:
- If no `user_features` row → run `derive-user-features` manually
- If edge function error → check scoring logic, ensure `credit_cards` table not empty
- If snapshot created but no cards → check eligibility filters, may be too restrictive

### Issue: Dashboard Loads Slowly (>5s)

**Symptoms**: Spinning loader on dashboard for extended time

**Debug**:
1. Check which query is slow (browser network tab)
2. Run EXPLAIN ANALYZE on slow queries:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM recommendation_cards WHERE user_id = '<user_id>';
   ```
3. Check missing indexes:
   ```sql
   SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';
   ```

**Fix**:
- Add indexes on frequently queried columns (e.g., `user_id`, `snapshot_id`, `card_id`)
- Consider denormalizing if joins are slow
- Increase Supabase instance size if needed (Settings → Cloud → Advanced)

### Issue: RLS Prevents User from Seeing Their Own Data

**Symptoms**: User logged in, but sees empty states everywhere, console shows 401/403 errors

**Debug**:
1. Check RLS policies on affected table:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'spending_analyses';
   ```
2. Test RLS with specific user:
   ```sql
   SET LOCAL "request.jwt.claims" = '{"sub": "<user_id>"}';
   SELECT * FROM spending_analyses WHERE user_id = '<user_id>';
   ```

**Fix**:
- Ensure RLS policy allows `SELECT` for `auth.uid() = user_id`
- Check if user ID matches between `auth.users` and table `user_id` column
- Temporarily disable RLS to test (NOT for production):
   ```sql
   ALTER TABLE spending_analyses DISABLE ROW LEVEL SECURITY;
   ```

### Issue: Audit Log Not Recording Events

**Symptoms**: `audit_log` table empty or missing events

**Debug**:
1. Check `logAuditEvent()` is called in code (search for `logAuditEvent`)
2. Check RLS on `audit_log`:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'audit_log';
   ```
3. Test insert manually:
   ```sql
   INSERT INTO audit_log (user_id, actor, event_type, event_category, metadata)
   VALUES ('<user_id>', 'user', 'TEST_EVENT', 'test', '{}');
   ```

**Fix**:
- Ensure `audit_log` has INSERT policy allowing authenticated users
- Check `logAuditEvent()` doesn't swallow errors silently
- Verify Supabase client is initialized correctly

---

## Rollback Plan (If Needed)

### Scenario: Critical Bug Prevents Core Flow

1. **Identify Scope**:
   - Is it auth? → Block signups, fix ASAP
   - Is it parsing? → Show maintenance message on `/upload`, allow manual entry
   - Is it recommendations? → Disable "Get Recommendations" button, show static content

2. **Rollback Code**:
   - Use Lovable History view to restore previous working version
   - Deploy rollback immediately

3. **Database Rollback** (If Migration Caused Issue):
   - **DO NOT** drop tables or columns with user data
   - Instead, comment out problematic triggers/functions:
     ```sql
     -- Example: Disable a buggy trigger
     ALTER TABLE spending_analyses DISABLE TRIGGER some_buggy_trigger;
     ```
   - Fall back to JSONB fields (e.g., `analysis_data->'transactions'`) if normalized tables broken

4. **Communicate**:
   - Notify beta testers via email/Discord
   - ETA for fix
   - Workaround if available

---

## Data Retention & Cleanup

### Automated Cleanup (Already Implemented)

- **Stale Analyses**: `cleanupStaleAnalyses()` in `sessionManager.ts` deletes analyses >30 days old with no recommendations
- **Expired OTPs**: `cleanup_expired_phone_verifications()` function deletes old OTP records
- **Data Retention Config**: `data_retention_config` table + `cleanup_old_data()` function (run via cron)

### Manual Cleanup (If Needed During Beta)

```sql
-- Delete orphaned analysis_transactions (no parent analysis)
DELETE FROM analysis_transactions
WHERE analysis_id NOT IN (SELECT id FROM spending_analyses);

-- Delete orphaned recommendation_cards (no parent snapshot)
DELETE FROM recommendation_cards
WHERE snapshot_id NOT IN (SELECT id FROM recommendation_snapshots);

-- Clear test user data (BE CAREFUL!)
DELETE FROM profiles WHERE email LIKE '%test%';
-- This cascades to most other tables via foreign keys
```

---

## Monitoring Dashboard (Future Enhancement)

Consider building a simple admin dashboard (e.g., `/admin/metrics`) that visualizes:
- Daily signups, DAU chart
- Funnel drop-off visualization
- Parse success rate over time
- Top cards recommended
- Error count by type

Use Recharts library (already installed) to render these charts from SQL query results.

---

## Contacts & Escalation

- **Database Issues**: Check Supabase Cloud logs, escalate to Supabase support if platform issue
- **Edge Function Errors**: Review logs via `supabase functions logs`, check Lovable AI API limits
- **Critical Security Issue**: Immediately disable affected feature, notify users, patch within 24h
- **Beta Tester Support**: Response SLA: <4 hours during business hours

---

## Success Criteria for Beta

**Week 1 Goals**:
- 50+ signups
- 70% onboarding completion rate
- 50% upload-to-recommendations conversion
- <5% parse failure rate
- 0 critical security issues

**Week 4 Goals**:
- 200+ total users
- 30+ DAU
- 10+ affiliate click events
- Positive feedback from 80% of surveyed testers
- <3 P1 bugs in backlog
