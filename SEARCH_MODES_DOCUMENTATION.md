# Gyaan AI Search Modes Documentation

Last Updated: October 30, 2025

## Overview

Gyaan AI supports **5 search modes** that query different data sources. This document defines which modes are currently active, their implementation status, and configuration requirements.

---

## ✅ Active Search Modes

These modes are fully implemented and available in the backend API (`/api/search/route.ts`):

### 1. **Web Search** (`'web'`)
- **Primary Source**: Google Custom Search API
- **Fallback**: DuckDuckGo Search API, NewsAPI
- **Use Case**: General web search across indexed pages
- **Configuration Required**:
  - `GOOGLE_API_KEY`
  - `GOOGLE_SEARCH_ENGINE_ID`
  - `DUCKDUCKGO_API_KEY` (fallback)
  - `NEWS_API_KEY` (fallback)

### 2. **News Search** (`'news'`)
- **Source**: NewsAPI (Everything endpoint)
- **Use Case**: Recent news articles and publications
- **Configuration Required**:
  - `NEWS_API_KEY`
- **Note**: Searches news articles with keyword matching

### 3. **Trending News** (`'trending'`)
- **Source**: NewsAPI (Top Headlines endpoint)
- **Use Case**: Current trending news and top headlines
- **Configuration Required**:
  - `NEWS_API_KEY`
- **Note**: Returns trending/popular news regardless of search query

### 4. **Image Search** (`'images'`)
- **Source**: Unsplash API
- **Use Case**: High-quality stock images and photos
- **Configuration Required**:
  - `UNSPLASH_ACCESS_KEY`
- **Status**: ⚠️ **Returns 500 error if API key is not configured**
- **Fix Required**: Add `UNSPLASH_ACCESS_KEY` to `.env` file or disable this mode in frontend

### 5. **Video Search** (`'videos'`)
- **Source**: YouTube Data API v3
- **Use Case**: YouTube videos matching search query
- **Configuration Required**:
  - `YOUTUBE_API_KEY`
- **Note**: Returns video metadata including title, description, thumbnail, channel info

---

## ❌ Unsupported Modes (Frontend Only)

These modes were present in the frontend but **NOT implemented in the backend**, causing **400 Bad Request errors**:

### 1. **All Search** (`'all'`) - REMOVED
- **Status**: Not implemented in backend
- **Error**: 400 - "Invalid mode. Use 'news', 'trending', 'web', 'images', or 'videos'"
- **Action Taken**: Removed from frontend `page.tsx` modes array
- **Future Implementation**: Could aggregate results from multiple sources

### 2. **Academic Search** (`'academic'`) - REMOVED  
- **Status**: Not implemented in backend
- **Error**: 400 - "Invalid mode. Use 'news', 'trending', 'web', 'images', or 'videos'"
- **Action Taken**: Removed from frontend `page.tsx` modes array
- **Future Implementation**: Could integrate with Google Scholar, Semantic Scholar, arXiv, etc.

---

## Backend API Specification

### Endpoint
```
GET /api/search?q={query}&mode={mode}
POST /api/search
```

### Valid Mode Values
```typescript
"web" | "news" | "trending" | "images" | "videos"
```

### GET Request Example
```bash
curl "http://localhost:3000/api/search?q=artificial%20intelligence&mode=web"
```

### POST Request Example
```bash
curl -X POST "http://localhost:3000/api/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "artificial intelligence", "mode": "web"}'
```

### Error Responses

#### 400 - Invalid Mode
```json
{
  "error": "Invalid mode. Use 'news', 'trending', 'web', 'images', or 'videos'",
  "status": 400
}
```

#### 500 - Missing API Key (Images mode)
```json
{
  "error": "Unsplash API key is not configured",
  "status": 500
}
```

#### 500 - API Failure
```json
{
  "error": "Failed to fetch [source] results",
  "status": 500
}
```

---

## Frontend Integration

### Updated Type Definition (`page.tsx`)
```typescript
type SearchMode = 'web' | 'news' | 'trending' | 'images' | 'videos';
```

### Updated Modes Array
```typescript
const modes: SearchMode[] = ['web', 'news', 'trending', 'images', 'videos'];
```

### Default Mode
```typescript
const [mode, setMode] = useState<SearchMode>('web');
```

---

## Environment Configuration

Required environment variables in `.env`:

```env
# Google Custom Search (for 'web' mode)
GOOGLE_API_KEY=your_google_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id

# NewsAPI (for 'news' and 'trending' modes)
NEWS_API_KEY=your_newsapi_key

# Unsplash (for 'images' mode) - REQUIRED TO FIX 500 ERROR
UNSPLASH_ACCESS_KEY=your_unsplash_access_key

# YouTube (for 'videos' mode)
YOUTEBE_API_KEY=your_youtube_api_key

# Fallback APIs (optional)
DUCKDUCKGO_API_KEY=your_duckduckgo_key
```

---

## Troubleshooting

### Issue: "API Error 400" for All/Academic modes
**Cause**: Frontend was sending unsupported mode values  
**Solution**: ✅ Removed from frontend modes array (see [Issue #1](https://github.com/wwwmadeinindiaai-ui/gyaan-ai-frontend/issues/1))

### Issue: "Error 500" for Image mode
**Cause**: `UNSPLASH_ACCESS_KEY` environment variable not configured  
**Solution**: Add Unsplash API key to `.env` file or temporarily remove `'images'` from modes array

### Issue: All searches return 400
**Cause**: Mode value mismatch between frontend and backend  
**Solution**: Ensure frontend uses exact mode strings: `'web'`, `'news'`, `'trending'`, `'images'`, `'videos'`

---

## Implementation Status Summary

| Mode | Backend | Frontend | API Key Required | Status |
|------|---------|----------|------------------|--------|
| **web** | ✅ Implemented | ✅ Active | Google | ✅ Working |
| **news** | ✅ Implemented | ✅ Active | NewsAPI | ✅ Working |
| **trending** | ✅ Implemented | ✅ Active | NewsAPI | ✅ Working |
| **images** | ✅ Implemented | ✅ Active | Unsplash | ⚠️ Needs API key |
| **videos** | ✅ Implemented | ✅ Active | YouTube | ✅ Working |
| **all** | ❌ Not implemented | ❌ Removed | N/A | ❌ Disabled |
| **academic** | ❌ Not implemented | ❌ Removed | N/A | ❌ Disabled |

---

## Future Enhancements

### Potential Mode Additions

1. **All Mode** - Aggregate search across multiple sources
   - Combine web, news, and video results
   - Deduplicate and rank by relevance

2. **Academic Mode** - Scholarly article search
   - Integrate Google Scholar API
   - Add Semantic Scholar support
   - Include arXiv, PubMed, CORE

3. **Shopping Mode** - Product search
   - Integration with e-commerce APIs

4. **Social Mode** - Social media search
   - Twitter/X API integration
   - Reddit API integration

---

## Related Files

- Backend: `/gyaan-ai-frontend/src/app/api/search/route.ts`
- Frontend: `/gyaan-ai-frontend/src/app/dashboard/page.tsx`
- Issue Tracker: [Issue #1 - Fix Dashboard Search Mode Errors](https://github.com/wwwmadeinindiaai-ui/gyaan-ai-frontend/issues/1)

---

## Contact & Support

For issues or feature requests, please create a new issue in the [GitHub Issues](https://github.com/wwwmadeinindiaai-ui/gyaan-ai-frontend/issues) tracker.
