# URL Extraction Validation Strategy

**Feature:** Job Posting URL Extraction (FR-1.2, Story 1.1)
**Date:** 2025-11-10
**Status:** Pre-Architecture Planning Document

---

## Overview

This document defines the validation strategy for the job posting URL extraction feature, which automatically extracts job details (title, company, description, requirements) from job board URLs to accelerate application capture.

**Innovation Point:** While competitors require manual entry, ditto's URL extraction reduces application capture time from ~2 minutes to under 30 seconds.

**Risk:** Web scraping is fragile - sites change HTML structure, add anti-scraping measures, or block automated access.

**Mitigation:** Comprehensive validation strategy with monitoring, fallback handling, and maintenance planning.

---

## Technical Approach

### Recommended Implementation

**Library-Based Scraping (Go)**

**Libraries:**
- **`goquery`** - jQuery-like HTML parsing for Go
- **`colly`** - Web scraping framework with rate limiting and caching
- Alternative: **`chromedp`** for JavaScript-heavy sites (if needed)

**Rationale:**
- ✅ Full control over scraping logic
- ✅ No external dependencies or API costs
- ✅ Easy to update selectors when sites change
- ✅ Fast and lightweight (Go performance)
- ✅ Built-in rate limiting and caching with colly

**Rejected Alternatives:**
- ❌ Third-party APIs (ScraperAPI, Apify): Cost, external dependency
- ❌ Official job board APIs: Don't exist or enterprise-only
- ❌ Selenium/Puppeteer: Too heavy for simple HTML parsing

---

## Supported Job Boards (MVP)

### Tier 1: Initial MVP Support

1. **LinkedIn Jobs**
   - Priority: HIGH (most used)
   - Complexity: MEDIUM (requires authentication awareness)
   - Pattern: `linkedin.com/jobs/view/*`

2. **Indeed**
   - Priority: HIGH (most common)
   - Complexity: LOW (simple HTML structure)
   - Pattern: `indeed.com/viewjob*` or `indeed.com/rc/clk*`

3. **Glassdoor**
   - Priority: MEDIUM
   - Complexity: MEDIUM
   - Pattern: `glassdoor.com/job-listing/*`

### Tier 2: Post-MVP Expansion

4. **AngelList (Wellfound)**
5. **Remote.co**
6. **We Work Remotely**
7. **Generic fallback** (meta tags, structured data)

---

## Extraction Strategy

### 1. URL Pattern Recognition

```go
type JobBoardExtractor interface {
    CanHandle(url string) bool
    Extract(url string) (*JobDetails, error)
}

// Extractors registered for each board
extractors := []JobBoardExtractor{
    LinkedInExtractor{},
    IndeedExtractor{},
    GlassdoorExtractor{},
    GenericExtractor{}, // Fallback using Open Graph / meta tags
}
```

### 2. HTML Parsing Approach

**CSS Selectors (stored in config for easy updates):**

```yaml
extractors:
  linkedin:
    selectors:
      job_title: ".top-card-layout__title"
      company: ".topcard__org-name-link"
      description: ".description__text"
      requirements: ".description__text"
    fallback_meta_tags: true

  indeed:
    selectors:
      job_title: ".jobsearch-JobInfoHeader-title"
      company: "[data-company-name]"
      description: "#jobDescriptionText"
    fallback_meta_tags: true
```

**Benefits:**
- Selectors in config file (easy to update without code changes)
- Fallback to Open Graph meta tags when selectors fail
- Version-controlled selector updates

### 3. Timeout and Error Handling

```go
const (
    MAX_EXTRACTION_TIME = 10 * time.Second
    MAX_RETRIES = 1
    RATE_LIMIT_PER_USER = 30 // URLs per day
)

// Graceful degradation
func ExtractJobFromURL(url string) (*JobDetails, error) {
    ctx, cancel := context.WithTimeout(context.Background(), MAX_EXTRACTION_TIME)
    defer cancel()

    // Try extraction
    details, err := scrapeWithContext(ctx, url)
    if err != nil {
        // Log failure for monitoring
        logExtractionFailure(url, err)
        return nil, ErrExtractionFailed
    }

    // Cache successful extraction
    cacheExtraction(url, details, 24*time.Hour)
    return details, nil
}
```

---

## Validation Plan

### Phase 1: Pre-Launch Testing

**Objective:** Verify extraction works for target job boards before MVP launch

**Test Dataset:**
- Collect 50 real job URLs (10 per board × 5 boards)
- Mix of: entry-level, mid-level, senior roles
- Mix of: tech, non-tech positions
- Variety of: company sizes, job types

**Success Criteria:**
- ✅ 80%+ successful extractions (40/50 URLs)
- ✅ Extracted data quality: title, company, description populated
- ✅ All extractions complete within 10-second timeout
- ✅ Zero crashes or unhandled errors

**Test Procedure:**
1. Manual collection of 50 job URLs
2. Run extraction script on all URLs
3. Compare extracted data to actual page content
4. Document failures (URL, board, error reason)
5. Fix critical selector issues
6. Re-test failed URLs

### Phase 2: MVP Launch Monitoring

**Objective:** Monitor real-world extraction success and failure patterns

**Metrics to Track:**

```sql
-- Extraction success rate
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_attempts,
    SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successes,
    (SUM(CASE WHEN success = true THEN 1 ELSE 0 END)::float / COUNT(*)) as success_rate
FROM url_extraction_log
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Failure reasons by job board
SELECT
    job_board,
    failure_reason,
    COUNT(*) as count
FROM url_extraction_log
WHERE success = false
GROUP BY job_board, failure_reason
ORDER BY count DESC;
```

**Logging Schema:**

```go
type URLExtractionLog struct {
    ID             uint      `gorm:"primaryKey"`
    UserID         uint
    URL            string
    JobBoard       string    // linkedin, indeed, glassdoor, other
    Success        bool
    FailureReason  string    // timeout, parse_error, invalid_url, etc.
    ExtractionTime int       // milliseconds
    CreatedAt      time.Time
}
```

**Alerting Thresholds:**
- 🚨 Critical: Success rate drops below 60% (daily)
- ⚠️ Warning: Success rate drops below 70% (daily)
- ⚠️ Warning: Specific board success rate drops below 50%

### Phase 3: Ongoing Maintenance

**Objective:** Maintain extraction quality as job boards evolve

**Maintenance Activities:**

1. **Weekly Health Check**
   - Review extraction success rate
   - Check for new failure patterns
   - Test extraction on 5 random URLs per board

2. **Monthly Selector Review**
   - Test each extractor with 10 fresh URLs
   - Update selectors if success rate < 80%
   - Document selector changes in version control

3. **Quarterly Feature Review**
   - Evaluate adding new job boards (based on user requests)
   - Review and retire low-traffic boards
   - Assess need for more sophisticated extraction (e.g., headless browser)

**Selector Update Process:**
1. Monitor failure logs for specific board
2. Investigate current HTML structure on failing URLs
3. Update selector config file
4. Test with 10 URLs from that board
5. Deploy updated config (no code changes needed)
6. Monitor success rate improvement

---

## Failure Handling Strategy

### User-Facing Behavior

**Scenario 1: Extraction Succeeds**
```
[URL input field]
→ User pastes: https://linkedin.com/jobs/view/123456
→ Click "Extract"
→ Loading spinner (2-5 seconds)
→ Success toast: "Job details extracted!"
→ Form fields auto-filled (editable)
→ User reviews and clicks "Save Application"
```

**Scenario 2: Extraction Fails**
```
[URL input field]
→ User pastes: https://linkedin.com/jobs/view/123456
→ Click "Extract"
→ Loading spinner (timeout after 10s)
→ Error toast: "Couldn't extract job details. Please enter manually."
→ Form remains empty, ready for manual entry
→ URL is stored for future retry (optional)
```

**Scenario 3: Unsupported Board**
```
[URL input field]
→ User pastes: https://monster.com/job/xyz
→ Click "Extract"
→ Info toast: "This job board isn't supported yet. Enter details manually."
→ Form remains empty, ready for manual entry
→ Log unsupported board for future prioritization
```

### Fallback Strategy

**Layered Approach:**
1. **Primary:** CSS selectors (board-specific)
2. **Secondary:** Open Graph meta tags (generic)
3. **Tertiary:** Structured data (JSON-LD)
4. **Ultimate Fallback:** Manual entry (always available)

**Open Graph Fallback Example:**
```html
<meta property="og:title" content="Software Engineer - Google">
<meta property="og:description" content="Join Google's engineering team...">
```

Even if CSS selectors fail, extract:
- Title from `og:title`
- Description from `og:description`
- Company from title parsing or domain

---

## Rate Limiting & Caching

### Rate Limiting (Prevent Abuse)

**User Limits:**
- 30 URL extractions per day per user
- 5 extractions per minute (burst protection)

**Implementation:**
```go
type RateLimiter struct {
    redis *redis.Client
}

func (r *RateLimiter) AllowExtraction(userID uint) (bool, error) {
    key := fmt.Sprintf("url_extract:user:%d:daily", userID)
    count, err := r.redis.Incr(key).Result()
    if err != nil {
        return false, err
    }

    // Set 24h expiry on first request
    if count == 1 {
        r.redis.Expire(key, 24*time.Hour)
    }

    return count <= 30, nil
}
```

**User Feedback:**
- Show remaining extractions: "23 of 30 URL extractions remaining today"
- Clear error when limit reached: "Daily limit reached (30 URLs). Resets at midnight UTC."

### Caching (Reduce Redundant Scraping)

**Strategy:**
- Cache successful extractions for 24 hours
- If 2 users paste same URL within 24h, serve cached data
- Reduces load on job boards, improves response time

**Implementation:**
```go
cacheKey := fmt.Sprintf("job_extract:%s", hashURL(url))
cached, err := redis.Get(cacheKey).Result()
if err == nil {
    // Cache hit - return cached data
    return parseJobDetails(cached), nil
}

// Cache miss - scrape and cache
details, err := scrapeURL(url)
if err == nil {
    redis.Set(cacheKey, marshalJobDetails(details), 24*time.Hour)
}
```

---

## Success Metrics

### MVP Success Criteria

**Quantitative:**
- ✅ 80%+ extraction success rate across all boards
- ✅ 90%+ response time under 10 seconds
- ✅ 95%+ of users successfully extract at least 1 URL
- ✅ Zero crashes or 500 errors from extraction endpoint

**Qualitative:**
- ✅ User feedback: "URL extraction saves me time"
- ✅ Feature usage: 50%+ of applications use URL extraction vs manual entry
- ✅ Low support tickets related to extraction failures

### Post-MVP Iteration Triggers

**When to Invest More:**
- Success rate consistently < 70% for a board → Improve extractor
- High user demand for unsupported board → Add new extractor
- Extraction is #1 requested feature improvement → Prioritize enhancements

**When to Simplify:**
- Feature usage < 20% of applications → Deprioritize, make optional
- High maintenance burden (weekly selector updates) → Consider third-party API
- Boards start blocking our scraping → Pivot strategy

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Job board changes HTML structure | HIGH | MEDIUM | Selector monitoring, config-based selectors, fallback to meta tags |
| Job board blocks scraping | MEDIUM | HIGH | User-agent rotation, rate limiting, respectful scraping, caching |
| Extraction takes >10 seconds | LOW | MEDIUM | Timeout handling, async extraction option (future) |
| User pastes invalid URL | MEDIUM | LOW | URL validation, clear error messages, fallback to manual entry |
| Legal issues (scraping ToS) | LOW | HIGH | Public data only, respect robots.txt, rate limiting, no circumvention |

---

## Architecture Integration Points

**Backend Endpoints:**
- `POST /api/jobs/extract-url` (Story 1.1)
  - Request: `{url: string}`
  - Response: `{title, company, description, requirements, source_url}` or `{error: string}`

**Frontend Integration:**
- Application form component (Story 1.3)
- URL input field with "Extract" button
- Loading state, success/error feedback
- Auto-fill extracted data (editable)

**Database:**
- Optional: `url_extraction_log` table for monitoring
- Cached extractions: Redis or PostgreSQL with TTL

---

## Future Enhancements (Post-MVP)

1. **Async Extraction** - Email user when extraction completes (for slow sites)
2. **Browser-Based Extraction** - Use Chromedp for JavaScript-heavy sites
3. **ML-Based Extraction** - Train model to extract from any job board
4. **Salary Extraction** - Parse salary ranges when available
5. **Skills Extraction** - Extract required skills as tags
6. **Similar Jobs** - Suggest similar postings based on extracted data

---

## Validation Checklist

**Pre-Launch:**
- [ ] Test 50 URLs across 5 job boards
- [ ] Achieve 80%+ success rate
- [ ] All extractions complete within 10s timeout
- [ ] Error handling tested (timeout, invalid URL, unsupported board)
- [ ] Rate limiting tested (30/day limit)
- [ ] Caching tested (same URL within 24h)
- [ ] Frontend integration tested (success and failure paths)

**Post-Launch (First Week):**
- [ ] Monitor daily success rate
- [ ] Review failure logs for patterns
- [ ] Collect user feedback
- [ ] Test failed URLs manually
- [ ] Update selectors if needed

**Ongoing (Monthly):**
- [ ] Review success rate trends
- [ ] Test random URLs from each board
- [ ] Update documentation
- [ ] Evaluate new board requests

---

**Document Status:** ✅ Ready for Architecture Phase
**Next Step:** Architecture workflow to finalize technical implementation
**Owner:** Backend/Full-Stack Developer implementing Story 1.1
