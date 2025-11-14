# Phase 1C Implementation Summary: User Cards Table Merge

**Date:** 2025-01-14  
**Status:** ✅ Complete

## Overview

Successfully merged `user_owned_cards` and `user_cards` tables into a single canonical `user_cards` table to eliminate duplication and simplify the data model.

## Changes Made

### 1. Database Schema Updates

**Migration:** `[timestamp]_merge_user_cards_tables.sql`

- Added columns to `user_cards` table:
  - `issuer` (TEXT) - Card issuer name
  - `network` (TEXT) - Payment network (Visa, Mastercard, etc.)
  - `product` (TEXT) - Product name
  - `opened_year` (INTEGER) - Year card was opened
  - `credit_limit_estimate` (INTEGER) - Estimated credit limit
  - `is_primary` (BOOLEAN) - Whether this is the user's primary card

- Created migration function:
  - `migrate_user_owned_cards_to_user_cards()` - Backfills data from legacy table
  - Handles date format conversion (integer month → YYYY-MM string)
  - Skips duplicates automatically
  - Returns migration statistics

- Deprecated `user_owned_cards` table:
  - Added deprecation comment with sunset date (2025-12-14)
  - Table remains in database for 30 days before planned removal

### 2. Code Updates

**Updated Files:**
- `src/types/dashboard.ts`
  - Extended `UserCard` interface with new fields from merged table

- `src/hooks/useEligibilityScore.ts`
  - Changed query from `user_owned_cards` to `user_cards`
  
- `src/hooks/useUserCards.ts`
  - Updated TypeScript interface to include new optional fields
  
- `src/lib/exportUserData.ts`
  - Uses consolidated `user_cards` table for exports

## Canonical Table: `user_cards`

**Why `user_cards` was chosen:**
- Already actively used in dashboard and user-facing features
- Better naming convention (user-centric)
- Had existing hooks and UI components

## Data Migration

To migrate existing data from `user_owned_cards`:

```sql
SELECT * FROM migrate_user_owned_cards_to_user_cards();
```

This function:
1. Reads all active cards from `user_owned_cards`
2. Checks for duplicates in `user_cards`
3. Converts date formats (integer → YYYY-MM string)
4. Inserts non-duplicate cards into `user_cards`
5. Returns: `(migrated_count, skipped_count, status)`

## Breaking Changes

❌ **Code referencing `user_owned_cards` will break**

If you have custom code querying `user_owned_cards`, update to use `user_cards`:

```typescript
// ❌ OLD - Don't use
const { data } = await supabase.from("user_owned_cards").select("*");

// ✅ NEW - Use this
const { data } = await supabase.from("user_cards").select("*");
```

## Backward Compatibility

None. The `user_owned_cards` table is marked deprecated and all code has been updated to use the canonical `user_cards` table.

## Files Modified

- `supabase/migrations/[timestamp]_merge_user_cards_tables.sql` (created)
- `src/types/dashboard.ts` (updated)
- `src/hooks/useEligibilityScore.ts` (updated)
- `src/hooks/useUserCards.ts` (updated)
- `src/lib/exportUserData.ts` (updated)

## Testing Checklist

- ✅ Migration runs without errors
- ✅ New columns appear in `user_cards`
- ✅ `useEligibilityScore` works with new table
- ✅ No code references to `user_owned_cards` (except deprecation)
- ✅ User cards display correctly in dashboard
- ✅ Data export includes user cards

## Next Steps

1. Monitor for 30 days to ensure no issues
2. After 2025-12-14, drop `user_owned_cards` table
3. Remove migration function after cleanup

## Notes

- Both tables were empty at time of migration
- No data loss occurred
- All RLS policies remain in effect
- Existing hooks continue to function
