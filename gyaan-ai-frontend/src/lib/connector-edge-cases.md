# Connector Edge Cases Testing Guide

This document outlines edge cases, testing strategies, and expected behaviors for all connector functions in the Gyaan AI backend.

## Table of Contents
- [Edge Cases Overview](#edge-cases-overview)
- [Test Scenarios by Connector](#test-scenarios-by-connector)
- [Error Handling Verification](#error-handling-verification)
- [Performance & Rate Limiting](#performance--rate-limiting)
- [Testing Checklist](#testing-checklist)

---

## Edge Cases Overview

### 1. **No Results Scenarios**
Situations where the API returns zero results.

**Test Cases:**
- Extremely obscure search queries (e.g., "xyzqwertasdfg123")
- Language-specific queries with no matches
- Overly specific combinations that don't exist
- Queries with special characters only
- Empty string queries

**Expected Behavior:**
- Returns empty array `[]`
- No errors thrown
- Logs informative message
- Gracefully continues execution

---

### 2. **Restricted/Blocked Content**
Content that violates API policies or is geo-restricted.

**Test Cases:**
- DMCA takedown content
- Age-restricted videos (YouTube)
- Copyright-protected material
- Geo-blocked content
- Removed/deleted content

**Expected Behavior:**
- Filters out restricted items
- Returns available results only
- No application crashes
- Appropriate logging

---

### 3. **API Quota/Rate Limits**
When API usage exceeds allowed limits.

**Test Cases:**
- Rapid successive requests
- Daily quota exhaustion
- Requests exceeding rate limit
- Invalid or expired API keys
- Suspended API accounts

**Expected Behavior:**
- Returns empty array gracefully
- Logs quota/rate limit errors
- Does not crash application
- Falls back to cached/fallback data if available

---

### 4. **Network Failures**
Connection issues and timeouts.

**Test Cases:**
- Network timeout (>10s)
- DNS resolution failures
- Connection refused
- SSL/TLS errors
- Intermittent connectivity

**Expected Behavior:**
- Timeout protection (10s default)
- Returns empty array
- Logs network error
- Retry logic for critical connectors (Wikipedia)

---

### 5. **Malformed API Responses**
Unexpected or invalid response formats.

**Test Cases:**
- Missing required fields
- Null/undefined values
- Incorrect data types
- Truncated JSON
- HTML error pages instead of JSON

**Expected Behavior:**
- Validation filters invalid items
- Returns only valid items
- Logs validation errors
- Never crashes

---

## Test Scenarios by Connector

### **YouTube (fetchFromYouTube)**

#### Edge Case 1: No Results
```typescript
// Test Query
const query = "asdfghjklqwertyuiop12345";
const results = await fetchFromYouTube(query);
// Expected: results.length === 0
```

#### Edge Case 2: Age-Restricted Content
```typescript
// Test Query
const query = "age restricted video";
const results = await fetchFromYouTube(query);
// Expected: Filters out age-restricted, returns available videos
```

#### Edge Case 3: API Quota Exceeded
```typescript
// Simulate: Remove/invalidate YOUTUBE_API_KEY
process.env.YOUTUBE_API_KEY = "invalid_key";
const results = await fetchFromYouTube("test");
// Expected: results.length === 0, logs "API key not configured"
```

#### Edge Case 4: Network Timeout
```typescript
// Expected: Timeout after 10 seconds
// Returns: Empty array []
// Logs: "[YouTube] Timeout after 10000ms"
```

---

### **Unsplash (fetchFromUnsplash)**

#### Edge Case 1: No Matching Images
```typescript
const query = "nonexistentimagetype9999";
const results = await fetchFromUnsplash(query);
// Expected: results.length === 0
```

#### Edge Case 2: DMCA Takedown
```typescript
// Scenario: Search for copyrighted content
// Expected: Returns available images, filters removed ones
```

#### Edge Case 3: Rate Limit (50 requests/hour)
```typescript
// After 50+ requests
const results = await fetchFromUnsplash("test");
// Expected: Returns empty array, logs rate limit warning
```

---

### **Google Search (fetchFromGoogleSearch)**

#### Edge Case 1: Zero Results
```typescript
const query = "site:nonexistent123456789.com";
const results = await fetchFromGoogleSearch(query);
// Expected: results.length === 0
```

#### Edge Case 2: API Key/CX Missing
```typescript
delete process.env.GOOGLE_SEARCH_API_KEY;
const results = await fetchFromGoogleSearch("test");
// Expected: Returns empty array, logs "API credentials not configured"
```

#### Edge Case 3: Daily Quota (100 queries/day)
```typescript
// After 100 queries in 24 hours
const results = await fetchFromGoogleSearch("test");
// Expected: Returns empty array, logs quota error
```

---

### **Wikipedia (fetchFromWikipedia)**

#### Edge Case 1: Article Not Found
```typescript
const query = "Article That Does Not Exist 999";
const results = await fetchFromWikipedia(query);
// Expected: results.length === 0 after 3 retries
```

#### Edge Case 2: API Temporarily Unavailable
```typescript
// Wikipedia has retry logic (3 attempts with exponential backoff)
// Expected: Retries 3 times (2s, 4s, 8s delays)
// If all fail: Returns empty array
// Logs: "[Wikipedia] All retry attempts failed"
```

#### Edge Case 3: Malformed Response
```typescript
// Scenario: API returns invalid JSON
// Expected: Filters invalid items, returns valid ones
```

---

### **NewsAPI (fetchFromNewsAPI)**

#### Edge Case 1: No Articles Found
```typescript
const query = "extremelyobscurenewstopic123";
const results = await fetchFromNewsAPI(query);
// Expected: results.length === 0
```

#### Edge Case 2: API Key Invalid/Expired
```typescript
process.env.NEWSAPI_KEY = "invalid_key";
const results = await fetchFromNewsAPI("test");
// Expected: Returns empty array, logs "API key not configured"
```

#### Edge Case 3: Rate Limit (Developer: 100 req/day)
```typescript
// After 100 requests
const results = await fetchFromNewsAPI("test");
// Expected: Returns empty array, logs rate limit
```

#### Edge Case 4: Paywall Content
```typescript
// Expected: Returns article with snippet, full content may be restricted
// Application should handle gracefully
```

---

### **GDELT (fetchFromGDELT via adapter)**

#### Edge Case 1: No Events Found
```typescript
const results = await fetchFromGDELT("veryobscureevent999");
// Expected: results.length === 0
```

#### Edge Case 2: Longer Timeout (30s)
```typescript
// GDELT uses 30-second timeout
// Expected: Returns empty array if timeout exceeded
```

#### Edge Case 3: Invalid Date Format
```typescript
// Scenario: GDELT returns non-ISO date
// Expected: Adapter converts Date to ISO string correctly
```

---

## Error Handling Verification

### **All Connectors Must:**

✅ **Never throw unhandled exceptions**
- All errors caught in try/catch blocks
- Returns empty array `[]` on failure

✅ **Provide informative logging**
- Service name in log prefix `[ServiceName]`
- Error type clearly indicated
- Request duration logged

✅ **Timeout Protection**
- Default: 10 seconds
- GDELT: 30 seconds
- AbortSignal.timeout() used

✅ **Graceful Degradation**
- No cascading failures
- Partial results accepted
- Fallback data when enabled

✅ **Data Validation**
- Required fields checked (title, url)
- Invalid items filtered out
- Type safety maintained

---

## Performance & Rate Limiting

### **API Limits Summary**

| Connector | Free Tier Limit | Rate Limit | Timeout |
|-----------|----------------|------------|----------|
| YouTube | 10,000 units/day | ~100 search/day | 10s |
| Unsplash | 50 requests/hour | 50/hour | 10s |
| Google Search | 100 queries/day | 100/day | 10s |
| Wikipedia | Unlimited | None (be respectful) | 10s |
| NewsAPI | 100 requests/day | 100/day | 10s |
| GDELT | Unlimited | None (be respectful) | 30s |

### **Handling Quota Exhaustion**

1. **Detection**
   - HTTP 429 (Too Many Requests)
   - HTTP 403 with quota error
   - API-specific error codes

2. **Response**
   - Log quota exhaustion
   - Return empty array
   - Enable fallback mode if needed

3. **Prevention**
   - Caching results when possible
   - Request throttling
   - Fallback data for development

---

## Testing Checklist

### **Manual Testing**

- [ ] Test each connector with valid query
- [ ] Test with empty string query
- [ ] Test with special characters (@#$%^&*)
- [ ] Test with very long query (>500 chars)
- [ ] Test with non-English characters
- [ ] Test without API keys (should use fallback)
- [ ] Test with invalid API keys
- [ ] Test rapid successive requests
- [ ] Verify timeout behavior (mock slow network)
- [ ] Verify logging output

### **Automated Testing (Future)**

```typescript
// Example test structure
describe('Connector Edge Cases', () => {
  describe('fetchFromYouTube', () => {
    it('should return empty array for no results', async () => {
      const results = await fetchFromYouTube('asdfqwerzxcv123');
      expect(results).toEqual([]);
    });
    
    it('should handle missing API key gracefully', async () => {
      delete process.env.YOUTUBE_API_KEY;
      const results = await fetchFromYouTube('test');
      expect(results).toEqual([]);
    });
    
    it('should timeout after 10 seconds', async () => {
      // Mock slow network
      const results = await fetchFromYouTube('test');
      // Verify timeout behavior
    });
  });
});
```

### **Production Monitoring**

- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Monitor API quota usage
- [ ] Track connector success rates
- [ ] Alert on repeated failures
- [ ] Dashboard for connector health

---

## Common Issues & Solutions

### **Issue 1: Empty Results in Production**
**Cause:** API keys not configured in environment
**Solution:** Verify all env vars in Vercel dashboard

### **Issue 2: Timeout Errors**
**Cause:** Slow network or API downtime
**Solution:** Verify 10s timeout is appropriate, check API status

### **Issue 3: Rate Limit Errors**
**Cause:** Exceeded free tier limits
**Solution:** Implement caching, upgrade API plan, or use fallback mode

### **Issue 4: Validation Errors**
**Cause:** API response format changed
**Solution:** Update validation schemas, add defensive checks

---

## Fallback Mode Testing

### **Enable Fallback Mode**
```bash
# .env.local
NEXT_PUBLIC_USE_FALLBACKS=true
```

### **Verify Fallback Behavior**
```typescript
// Should use fallback data instead of API calls
const results = await fetchFromYouTube('test');
// Expected: Returns sample data from getFallbackData('youtube')
// Logs: "[YouTube] Using fallback data"
```

---

## Summary

All connectors are designed to:
1. **Never crash** - Always return valid data structure
2. **Log appropriately** - Help debugging without noise
3. **Timeout quickly** - Don't block user experience
4. **Validate data** - Filter out malformed responses
5. **Degrade gracefully** - Fallback to sample data when needed

This ensures a robust, production-ready connector system that handles edge cases elegantly.
