# Occurrence Count Optimization Plan

## Overview

Optimize API calls by using **Supabase RPC functions** (PostgreSQL stored functions) to include occurrence counts directly in queries with a single API call.

**Affected Components:**

1. `gainers-view-date` - Currently 2 API calls per date change → **Target: 1 API call**
2. `gainers-view-threshold` - Currently 1 API call (using view) → **Target: 1 API call (using RPC)**

---

## Approach: RPC Functions (No Views)

### Why RPC Instead of Views?

| Aspect                 | Views                    | RPC Functions         |
| ---------------------- | ------------------------ | --------------------- |
| Supabase FK limitation | ❌ Can't join without FK | ✅ No limitation      |
| Parameters             | ❌ No parameters         | ✅ Accept parameters  |
| Complex logic          | ❌ Limited               | ✅ Full SQL power     |
| Single API call        | ❌ May need multiple     | ✅ Always single call |
| Flexibility            | ❌ Fixed schema          | ✅ Dynamic filtering  |

---

## Database Schema Reference

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐     │
│  │   categories    │      │    companies    │      │   exchanges     │     │
│  ├─────────────────┤      ├─────────────────┤      ├─────────────────┤     │
│  │ id (int8) PK    │◄────┐│ id (uuid) PK    │┌────►│ id (int8) PK    │     │
│  │ name (text)     │     ││ ticker_symbol   ││     │ code (text)     │     │
│  └─────────────────┘     ││ name (text)     ││     │ name (text)     │     │
│                          ││ comments (text) ││     └─────────────────┘     │
│                          │├─────────────────┤│                              │
│                          ││ exchange_id ────┘│                              │
│                          ││ category_id ─────┘                              │
│                          ││ created_at       │                              │
│                          ││ updated_at       │                              │
│                          ││ updated_by (uuid)│                              │
│                          │└────────┬────────┘                              │
│                          │         │                                        │
│                          │         │ company_id (uuid)                      │
│                          │         ▼                                        │
│                          │  ┌─────────────────┐                            │
│                          │  │   market_data   │                            │
│                          │  ├─────────────────┤                            │
│                          │  │ id (int8) PK    │                            │
│                          │  │ company_id (uuid)│                           │
│                          │  │ record_date     │                            │
│                          │  │ current_price   │                            │
│                          │  │ previous_close  │                            │
│                          │  │ percentage_change│                           │
│                          │  │ updated_at      │                            │
│                          │  │ updated_by (uuid)│                           │
│                          │  └─────────────────┘                            │
│                          │                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Create RPC Function for Gainers View - Date

**Location:** Supabase Dashboard → SQL Editor

**SQL to Execute:**

```sql
-- RPC Function: Get market data by date with occurrence counts
-- Returns all data needed in a SINGLE API call
--
-- DEFAULT SORTING (matches gainers-view-date component):
--   Primary: occurrence_count DESC (highest occurrences first)
--   Tiebreaker: percentage_change DESC (when occurrence counts are equal)
--
-- SECURITY: Uses SECURITY INVOKER so RLS policies on base tables are respected
--
CREATE OR REPLACE FUNCTION get_market_data_by_date(target_date DATE)
RETURNS TABLE (
  -- Market data fields
  market_data_id BIGINT,
  company_id UUID,
  record_date DATE,
  current_price NUMERIC,
  previous_close NUMERIC,
  percentage_change NUMERIC,
  -- Company fields
  ticker_symbol TEXT,
  company_name TEXT,
  comments TEXT,
  exchange_id BIGINT,
  category_id BIGINT,
  -- Related fields
  exchange_code TEXT,
  exchange_name TEXT,
  category_name TEXT,
  -- Calculated field
  occurrence_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER  -- Runs as calling user, RLS policies apply automatically
AS $$
  SELECT
    md.id as market_data_id,
    md.company_id,
    md.record_date,
    md.current_price,
    md.previous_close,
    md.percentage_change,
    c.ticker_symbol,
    c.name as company_name,
    c.comments,
    c.exchange_id,
    c.category_id,
    e.code as exchange_code,
    e.name as exchange_name,
    cat.name as category_name,
    (SELECT COUNT(*) FROM market_data md2 WHERE md2.company_id = c.id) as occurrence_count
  FROM market_data md
  JOIN companies c ON md.company_id = c.id
  LEFT JOIN exchanges e ON c.exchange_id = e.id
  LEFT JOIN categories cat ON c.category_id = cat.id
  WHERE md.record_date = target_date
  ORDER BY
    (SELECT COUNT(*) FROM market_data md2 WHERE md2.company_id = c.id) DESC,  -- Primary: occurrence_count DESC
    md.percentage_change DESC NULLS LAST;  -- Tiebreaker: percentage_change DESC
$$;

-- Grant execute permission to authenticated users (RLS will still apply)
GRANT EXECUTE ON FUNCTION get_market_data_by_date(DATE) TO authenticated;
-- Optionally grant to anon if you want unauthenticated access (RLS will restrict data)
-- GRANT EXECUTE ON FUNCTION get_market_data_by_date(DATE) TO anon;
```

**Verification:**

```sql
-- Test the function
SELECT * FROM get_market_data_by_date('2025-12-01') LIMIT 5;
```

---

### Step 2: Create RPC Function for Gainers View - Threshold

**SQL to Execute:**

```sql
-- RPC Function: Get company market summary for threshold filtering
-- Returns aggregated data in a SINGLE API call
--
-- DEFAULT SORTING (matches gainers-view-threshold component):
--   Primary: occurrence_count DESC (highest occurrences first)
--   Tiebreaker: average_change DESC (when occurrence counts are equal)
--
-- SECURITY: Uses SECURITY INVOKER so RLS policies on base tables are respected
--
CREATE OR REPLACE FUNCTION get_company_market_summary(
  threshold_count INTEGER DEFAULT 1,
  filter_exchange_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
  -- Company fields
  company_id UUID,
  ticker_symbol TEXT,
  company_name TEXT,
  comments TEXT,
  exchange_id BIGINT,
  category_id BIGINT,
  -- Related fields
  exchange_code TEXT,
  exchange_name TEXT,
  category_name TEXT,
  -- Aggregated fields
  occurrence_count BIGINT,
  average_change NUMERIC,
  latest_price NUMERIC,
  latest_date DATE
)
LANGUAGE sql
STABLE
SECURITY INVOKER  -- Runs as calling user, RLS policies apply automatically
AS $$
  SELECT
    c.id as company_id,
    c.ticker_symbol,
    c.name as company_name,
    c.comments,
    c.exchange_id,
    c.category_id,
    e.code as exchange_code,
    e.name as exchange_name,
    cat.name as category_name,
    COUNT(md.id) as occurrence_count,
    ROUND(AVG(md.percentage_change), 2) as average_change,
    (
      SELECT md2.current_price
      FROM market_data md2
      WHERE md2.company_id = c.id
      ORDER BY md2.record_date DESC
      LIMIT 1
    ) as latest_price,
    (
      SELECT md2.record_date
      FROM market_data md2
      WHERE md2.company_id = c.id
      ORDER BY md2.record_date DESC
      LIMIT 1
    ) as latest_date
  FROM companies c
  LEFT JOIN market_data md ON c.id = md.company_id
  LEFT JOIN exchanges e ON c.exchange_id = e.id
  LEFT JOIN categories cat ON c.category_id = cat.id
  WHERE (filter_exchange_id IS NULL OR c.exchange_id = filter_exchange_id)
  GROUP BY c.id, c.ticker_symbol, c.name, c.comments, c.exchange_id, c.category_id,
           e.code, e.name, cat.name
  HAVING COUNT(md.id) > threshold_count
  ORDER BY
    COUNT(md.id) DESC,  -- Primary: occurrence_count DESC
    ROUND(AVG(md.percentage_change), 2) DESC NULLS LAST;  -- Tiebreaker: average_change DESC
$$;

-- Grant execute permission to authenticated users (RLS will still apply)
GRANT EXECUTE ON FUNCTION get_company_market_summary(INTEGER, BIGINT) TO authenticated;
-- Optionally grant to anon if you want unauthenticated access (RLS will restrict data)
-- GRANT EXECUTE ON FUNCTION get_company_market_summary(INTEGER, BIGINT) TO anon;
```

**Verification:**

```sql
-- Test without exchange filter (all exchanges)
SELECT * FROM get_company_market_summary(1, NULL) LIMIT 5;

-- Test with exchange filter (e.g., exchange_id = 1 for NSE)
SELECT * FROM get_company_market_summary(1, 1) LIMIT 5;
```

---

### Step 3: Drop Existing Views (Cleanup)

**SQL to Execute (after RPC functions are working):**

```sql
-- Drop the views we created earlier (no longer needed)
DROP VIEW IF EXISTS company_occurrence_counts;
DROP VIEW IF EXISTS company_market_summary;
```

---

### Step 4: Update TypeScript Interfaces

**File:** `src/app/interfaces/stock-data.interface.ts`

The `occurrence_count` field already exists. Add RPC response interfaces:

```typescript
// Response from get_market_data_by_date RPC function
export interface MarketDataByDateRpcResponse {
  market_data_id: number;
  company_id: string;
  record_date: string;
  current_price?: number;
  previous_close?: number;
  percentage_change?: number;
  ticker_symbol: string;
  company_name: string;
  comments?: string;
  exchange_id?: number;
  category_id?: number;
  exchange_code?: string;
  exchange_name?: string;
  category_name?: string;
  occurrence_count: number;
}

// Response from get_company_market_summary RPC function
export interface CompanyMarketSummaryRpcResponse {
  company_id: string;
  ticker_symbol: string;
  company_name: string;
  comments?: string;
  exchange_id?: number;
  category_id?: number;
  exchange_code?: string;
  exchange_name?: string;
  category_name?: string;
  occurrence_count: number;
  average_change: number;
  latest_price: number;
  latest_date?: string;
}
```

---

### Step 5: Update DatabaseService

**File:** `src/app/services/database.service.ts`

**Replace `getMarketDataByDate()` to use RPC:**

```typescript
async getMarketDataByDate(date: string): Promise<MarketDataResponse> {
  try {
    // Single RPC call - no views, no joins needed!
    const { data, error } = await this.authService.supabase
      .rpc('get_market_data_by_date', { target_date: date });

    if (error) throw error;

    // Map RPC response to existing interface format
    const companies: CompanyWithMarketData[] = (data || []).map((item: MarketDataByDateRpcResponse) => ({
      id: item.company_id,
      ticker_symbol: item.ticker_symbol,
      name: item.company_name,
      comments: item.comments,
      exchange_id: item.exchange_id,
      category_id: item.category_id,
      exchange: item.exchange_code ? {
        id: item.exchange_id!,
        code: item.exchange_code,
        name: item.exchange_name,
      } : undefined,
      category: item.category_name ? {
        id: item.category_id!,
        name: item.category_name,
      } : undefined,
      market_data: {
        id: item.market_data_id,
        company_id: item.company_id,
        record_date: item.record_date,
        current_price: item.current_price,
        previous_close: item.previous_close,
        percentage_change: item.percentage_change,
      },
      occurrence_count: item.occurrence_count,
    }));

    return { date, companies };
  } catch (error) {
    console.error('Error fetching market data:', error);
    return { date, companies: [] };
  }
}
```

**Replace `getCompanyMarketSummary()` to use RPC:**

```typescript
async getCompanyMarketSummary(
  thresholdCount: number,
  exchangeId?: number
): Promise<GroupedCompanyOccurrence[]> {
  try {
    // Single RPC call with parameters!
    const { data, error } = await this.authService.supabase
      .rpc('get_company_market_summary', {
        threshold_count: thresholdCount,
        filter_exchange_id: exchangeId || null
      });

    if (error) throw error;

    // Map RPC response to existing interface format
    return (data || []).map((item: CompanyMarketSummaryRpcResponse) => ({
      id: item.company_id,
      ticker_symbol: item.ticker_symbol,
      name: item.company_name,
      comments: item.comments,
      exchange_id: item.exchange_id,
      category_id: item.category_id,
      exchange: item.exchange_code ? {
        id: item.exchange_id!,
        code: item.exchange_code,
        name: item.exchange_name,
      } : undefined,
      category: item.category_name ? {
        id: item.category_id!,
        name: item.category_name,
      } : undefined,
      occurrenceCount: item.occurrence_count,
      averageChange: item.average_change,
      latestPrice: item.latest_price,
      latestDate: item.latest_date,
      occurrences: [], // Empty - we don't need individual records
    }));
  } catch (error) {
    console.error('Error fetching company market summary:', error);
    return [];
  }
}
```

**Remove deprecated methods:**

- `getOccurrenceCountsBatch()` - No longer needed
- `getCompanyOccurrenceCount()` - No longer needed
- `getCompanyIdByTicker()` - No longer needed (was only used by above)

---

### Step 6: Component Updates (Minimal)

**GainersViewDateComponent** - No changes needed! It already uses:

- `getOccurrenceCount(company)` which returns `company.occurrence_count || 0`
- The RPC function returns `occurrence_count` which gets mapped to `occurrence_count`

**GainersViewThresholdComponent** - No changes needed! It already uses:

- `getCompanyMarketSummary()` which will now use RPC internally

---

## Files to Modify

| File                                         | Action                               |
| -------------------------------------------- | ------------------------------------ |
| Supabase Dashboard                           | Create 2 RPC functions               |
| Supabase Dashboard                           | Drop 2 views (cleanup)               |
| `src/app/interfaces/stock-data.interface.ts` | Add RPC response interfaces          |
| `src/app/services/database.service.ts`       | Update methods to use `.rpc()` calls |

**No component changes needed!** The service handles the mapping.

---

## Testing Checklist

### Gainers View - Date

- [ ] RPC function created successfully
- [ ] RPC returns correct data (verify with SQL)
- [ ] `getMarketDataByDate()` returns data with occurrence counts
- [ ] Occurrence counts display correctly in UI
- [ ] Sorting by occurrence count works
- [ ] Only **1 API call** per date change (verify in Network tab)
- [ ] Exchange filter works correctly
- [ ] Edit modal still shows occurrence counts
- [ ] Export CSV includes occurrence counts

### Gainers View - Threshold

- [ ] RPC function created successfully
- [ ] RPC returns correct data (verify with SQL)
- [ ] `getCompanyMarketSummary()` returns correct data
- [ ] Threshold filtering works (via RPC parameter)
- [ ] Exchange filtering works (via RPC parameter)
- [ ] Only **1 API call** total (verify in Network tab)
- [ ] Sorting works correctly
- [ ] Edit modal and comments work

---

## Rollback Plan

If issues occur:

1. Restore view-based queries in DatabaseService
2. Re-create views if dropped
3. RPC functions can remain in database (no harm)

---

## Expected Results

### Gainers View - Date

| Metric                    | Before (Views) | After (RPC)    |
| ------------------------- | -------------- | -------------- |
| API calls per date change | 2              | **1**          |
| Client-side processing    | Minimal        | **Minimal**    |
| Supabase FK workaround    | Required       | **Not needed** |

### Gainers View - Threshold

| Metric            | Before (Views)          | After (RPC)             |
| ----------------- | ----------------------- | ----------------------- |
| API calls         | 1                       | **1**                   |
| Parameter support | No (filter client-side) | **Yes (database-side)** |
| Flexibility       | Limited                 | **High**                |

---

## Next Steps

1. ✅ Review this updated plan
2. ⬜ Create RPC function 1: `get_market_data_by_date` in Supabase
3. ⬜ Create RPC function 2: `get_company_market_summary` in Supabase
4. ⬜ Test RPC functions with SQL queries
5. ⬜ Update TypeScript interfaces
6. ⬜ Update DatabaseService to use `.rpc()` calls
7. ⬜ Test thoroughly
8. ⬜ Verify single API call in Network tab
9. ⬜ Drop old views (cleanup)

---

**Status:** Ready for implementation

**Author:** GitHub Copilot

**Date:** December 2, 2025

---

## Appendix: Quick Reference SQL

### RPC Function 1: `get_market_data_by_date`

**Default Sort:** `occurrence_count DESC`, then `percentage_change DESC` (tiebreaker)
**Security:** `SECURITY INVOKER` - RLS policies on base tables apply automatically

```sql
CREATE OR REPLACE FUNCTION get_market_data_by_date(target_date DATE)
RETURNS TABLE (
  market_data_id BIGINT,
  company_id UUID,
  record_date DATE,
  current_price NUMERIC,
  previous_close NUMERIC,
  percentage_change NUMERIC,
  ticker_symbol TEXT,
  company_name TEXT,
  comments TEXT,
  exchange_id BIGINT,
  category_id BIGINT,
  exchange_code TEXT,
  exchange_name TEXT,
  category_name TEXT,
  occurrence_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    md.id as market_data_id,
    md.company_id,
    md.record_date,
    md.current_price,
    md.previous_close,
    md.percentage_change,
    c.ticker_symbol,
    c.name as company_name,
    c.comments,
    c.exchange_id,
    c.category_id,
    e.code as exchange_code,
    e.name as exchange_name,
    cat.name as category_name,
    (SELECT COUNT(*) FROM market_data md2 WHERE md2.company_id = c.id) as occurrence_count
  FROM market_data md
  JOIN companies c ON md.company_id = c.id
  LEFT JOIN exchanges e ON c.exchange_id = e.id
  LEFT JOIN categories cat ON c.category_id = cat.id
  WHERE md.record_date = target_date
  ORDER BY
    (SELECT COUNT(*) FROM market_data md2 WHERE md2.company_id = c.id) DESC,
    md.percentage_change DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION get_market_data_by_date(DATE) TO authenticated;
```

### RPC Function 2: `get_company_market_summary`

**Default Sort:** `occurrence_count DESC`, then `average_change DESC` (tiebreaker)
**Security:** `SECURITY INVOKER` - RLS policies on base tables apply automatically

```sql
CREATE OR REPLACE FUNCTION get_company_market_summary(
  threshold_count INTEGER DEFAULT 1,
  filter_exchange_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
  company_id UUID,
  ticker_symbol TEXT,
  company_name TEXT,
  comments TEXT,
  exchange_id BIGINT,
  category_id BIGINT,
  exchange_code TEXT,
  exchange_name TEXT,
  category_name TEXT,
  occurrence_count BIGINT,
  average_change NUMERIC,
  latest_price NUMERIC,
  latest_date DATE
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    c.id as company_id,
    c.ticker_symbol,
    c.name as company_name,
    c.comments,
    c.exchange_id,
    c.category_id,
    e.code as exchange_code,
    e.name as exchange_name,
    cat.name as category_name,
    COUNT(md.id) as occurrence_count,
    ROUND(AVG(md.percentage_change), 2) as average_change,
    (
      SELECT md2.current_price
      FROM market_data md2
      WHERE md2.company_id = c.id
      ORDER BY md2.record_date DESC
      LIMIT 1
    ) as latest_price,
    (
      SELECT md2.record_date
      FROM market_data md2
      WHERE md2.company_id = c.id
      ORDER BY md2.record_date DESC
      LIMIT 1
    ) as latest_date
  FROM companies c
  LEFT JOIN market_data md ON c.id = md.company_id
  LEFT JOIN exchanges e ON c.exchange_id = e.id
  LEFT JOIN categories cat ON c.category_id = cat.id
  WHERE (filter_exchange_id IS NULL OR c.exchange_id = filter_exchange_id)
  GROUP BY c.id, c.ticker_symbol, c.name, c.comments, c.exchange_id, c.category_id,
           e.code, e.name, cat.name
  HAVING COUNT(md.id) > threshold_count
  ORDER BY
    COUNT(md.id) DESC,
    ROUND(AVG(md.percentage_change), 2) DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION get_company_market_summary(INTEGER, BIGINT) TO authenticated;
```

### Cleanup: Drop Old Views

```sql
DROP VIEW IF EXISTS company_occurrence_counts;
DROP VIEW IF EXISTS company_market_summary;
```
