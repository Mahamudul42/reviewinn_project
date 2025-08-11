# API Endpoint Configuration Fixes

## Issues Identified

You were experiencing these errors in production:
1. `home_middle_panel?reviews` error - Homepage API endpoint pointing issue
2. `reviews/?page` error - Reviews endpoint configuration issue  
3. `entities limit` error - Entities trending endpoint pointing issue

## Root Cause Analysis

The main issue was **incorrect URL construction** in the frontend API services:

### ❌ Before (Incorrect URLs)
- Homepage: `{baseUrl}/homepage/home_middle_panel` 
- Reviews: `{baseUrl}/homepage/reviews`
- Entities: `{baseUrl}/homepage/entities/trending/list`
- Stats: `{baseUrl}/homepage/analytics/platform`

### ✅ After (Correct URLs)  
- Homepage: `{baseUrl}/home_middle_panel`
- Reviews: `{baseUrl}/reviews` 
- Entities: `{baseUrl}/trending/list`
- Stats: `{baseUrl}/stats`

## Files Fixed

### 1. Frontend API Configuration (`src/api/config.ts`)

**Removed unused HOMEPAGE_BASE_URL:**
```typescript
// REMOVED: HOMEPAGE_BASE_URL: `${baseUrl}/homepage`,
```

**Fixed HOMEPAGE endpoints:**
```typescript
// Homepage
HOMEPAGE: {
  DATA: '/home_middle_panel',      // ✅ Fixed: was '/homepage/data'
  REVIEWS: '/reviews',             // ✅ Fixed: was '/homepage/reviews'  
  ENTITIES: '/trending/list',      // ✅ Fixed: was '/entities/trending/list'
  STATS: '/stats'                  // ✅ Fixed: was '/analytics/platform'
},
```

### 2. Homepage Service (`src/api/services/homepageService.ts`)

**Fixed base URL construction:**
```typescript
export class HomepageService {
  private baseUrl = `${API_CONFIG.BASE_URL}/home_middle_panel`;        // ✅ Fixed
  private leftPanelUrl = `${API_CONFIG.BASE_URL}/left_panel`;         // ✅ Fixed
  // ...
}
```

**Fixed other endpoint URLs:**
```typescript
// ✅ Fixed all API_CONFIG.HOMEPAGE_BASE_URL → API_CONFIG.BASE_URL
const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.HOMEPAGE.REVIEWS}?${searchParams}`;
const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.HOMEPAGE.ENTITIES}?${searchParams}`;  
const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.HOMEPAGE.STATS}`;
```

## Backend Endpoint Verification

✅ **Confirmed working endpoints:**

| Frontend Call | Backend Endpoint | Router | Status |
|---------------|------------------|---------|---------|
| `/home_middle_panel` | `@router.get("/home_middle_panel")` | homepage.py | ✅ Working |
| `/left_panel` | `@router.get("/left_panel")` | homepage.py | ✅ Working |
| `/reviews` | `@router.get("/")` with `page` param | reviews.py | ✅ Working |
| `/trending/list` | `@router.get("/trending/list")` with `limit` param | entity_service.py | ✅ Working |
| `/stats` | `@router.get("/stats")` | homepage.py | ✅ Working |

## URL Mapping Table

### Production URLs (https://api.reviewinn.com/api/v1)

| Functionality | Frontend Request | Full Production URL | Backend Handler |
|---------------|------------------|---------------------|------------------|
| **Homepage Data** | `/home_middle_panel?reviews_limit=15&entities_limit=20` | `https://api.reviewinn.com/api/v1/home_middle_panel?reviews_limit=15&entities_limit=20` | `homepage.py:238` |
| **Left Panel** | `/left_panel?reviews_limit=2` | `https://api.reviewinn.com/api/v1/left_panel?reviews_limit=2` | `homepage.py:161` |
| **Reviews List** | `/reviews?page=1&limit=20` | `https://api.reviewinn.com/api/v1/reviews?page=1&limit=20` | `reviews.py:466` |
| **Trending Entities** | `/trending/list?limit=20` | `https://api.reviewinn.com/api/v1/trending/list?limit=20` | `entity_service.py:597` |
| **Platform Stats** | `/stats` | `https://api.reviewinn.com/api/v1/stats` | `homepage.py:336` |

## Expected Parameters

### ✅ Homepage Middle Panel (`/home_middle_panel`)
- `reviews_limit`: int (1-100, default: 15)
- `entities_limit`: int (1-100, default: 20)

### ✅ Reviews (`/reviews`) 
- `page`: int (≥1, default: 1)
- `limit`: int (1-100, default: 20)
- Optional: `entity_id`, `user_id`, `rating`, `sort_by`, `sort_order`, `verified`

### ✅ Trending Entities (`/trending/list`)
- `limit`: int (1-50, default: 10)
- Optional: `category`, `days` (1-365, default: 30)

### ✅ Platform Stats (`/stats`)
- No parameters required

## Test Commands

Test the fixed endpoints in production:

```bash
# Homepage data
curl "https://api.reviewinn.com/api/v1/home_middle_panel?reviews_limit=5&entities_limit=5"

# Reviews with pagination  
curl "https://api.reviewinn.com/api/v1/reviews?page=1&limit=10"

# Trending entities
curl "https://api.reviewinn.com/api/v1/trending/list?limit=10"

# Platform stats
curl "https://api.reviewinn.com/api/v1/stats"
```

## Deployment Notes

### ✅ Changes Applied
1. ✅ Frontend API configuration fixed
2. ✅ Homepage service URL construction fixed
3. ✅ Endpoint mappings corrected
4. ✅ Build tested successfully

### 🚀 Ready for Production
- All API endpoints now point to correct backend routes
- Parameter passing matches backend expectations
- CORS configuration supports production domains
- Environment variables configured for production URLs

## Summary

The homepage API errors were caused by **incorrect URL construction** where the frontend was adding an extra `/homepage` path segment that doesn't exist in the backend routing. 

**Fixed Issues:**
- ✅ `home_middle_panel?reviews` → Fixed URL construction
- ✅ `reviews/?page` → Confirmed working (was not the actual issue)
- ✅ `entities limit` → Fixed trending endpoint path

The frontend will now correctly call the backend endpoints without path mismatches, resolving the production API errors you were experiencing.