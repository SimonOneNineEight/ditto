# URL Extractor Service

The URL Extractor Service automatically extracts job posting information from supported job platforms.

## Supported Platforms

- ✅ **LinkedIn** - Extracts from LinkedIn job postings using guest API
- ✅ **Indeed** - Extracts from Indeed job postings with automatic URL normalization

### Disabled Platforms

The following platforms are currently disabled due to anti-scraping protections but code is preserved for future use:

- ❌ **Glassdoor** - Blocked by aggressive anti-scraping measures (403)
- ❌ **Wellfound/AngelList** - Blocked by Cloudflare protection (403)

## API Endpoint

### POST `/api/extract-job-url`

Extracts job information from a given URL.

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "url": "string (required)"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "title": "Software Engineer",
    "company": "Tech Company Inc",
    "location": "San Francisco, CA",
    "description": "Job description text...",
    "platform": "linkedin"
  }
}
```

**Success Response with Warnings** (200 OK):
```json
{
  "success": true,
  "data": {
    "title": "Software Engineer",
    "company": "Tech Company Inc",
    "location": "",
    "description": "Job description text...",
    "platform": "indeed"
  },
  "warnings": [
    "Could not extract location"
  ]
}
```

**Error Responses**:

- **400 Bad Request** - Invalid URL format or missing required fields
  ```json
  {
    "success": false,
    "error": {
      "error": "URL is required",
      "code": "VALIDATION_FAILED"
    }
  }
  ```

- **400 Bad Request** - Unsupported platform
  ```json
  {
    "success": false,
    "error": {
      "error": "Platform 'example.com' is not supported. Supported platforms: LinkedIn, Indeed",
      "code": "UNSUPPORTED_PLATFORM"
    }
  }
  ```

- **401 Unauthorized** - Missing or invalid authentication token
  ```json
  {
    "success": false,
    "error": {
      "error": "authorization header required",
      "code": "UNAUTHORIZED"
    }
  }
  ```

- **404 Not Found** - Job posting not found
  ```json
  {
    "success": false,
    "error": {
      "error": "Job posting not found",
      "code": "NOT_FOUND"
    }
  }
  ```

- **500 Internal Server Error** - Network failure or parsing error
  ```json
  {
    "success": false,
    "error": {
      "error": "Failed to fetch job posting",
      "code": "NETWORK_FAILURE"
    }
  }
  ```

## Usage Examples

### cURL

```bash
# Login to get token
TOKEN=$(curl -s -X POST http://localhost:8081/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}' \
  | jq -r '.data.access_token')

# Extract LinkedIn job
curl -X POST http://localhost:8081/api/extract-job-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"url": "https://www.linkedin.com/jobs/view/4095728488"}' \
  | jq .

# Extract Indeed job (with search URL)
curl -X POST http://localhost:8081/api/extract-job-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"url": "https://www.indeed.com/jobs?q=software&vjk=abc123"}' \
  | jq .
```

### JavaScript/Fetch

```javascript
const token = 'your-jwt-token';

const response = await fetch('http://localhost:8081/api/extract-job-url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    url: 'https://www.linkedin.com/jobs/view/4095728488'
  })
});

const data = await response.json();
console.log(data);
```

## Platform-Specific Features

### LinkedIn
- Uses LinkedIn's guest API endpoint
- Extracts: title, company, location, description
- No login required (guest access)

### Indeed
- **Automatic URL normalization** - Accepts both search URLs and direct job URLs
- Supports both `vjk=` (search) and `jk=` (direct) parameters
- Falls back to HTML parsing if JSON-LD fails
- Extracts: title, company, location, description

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_FAILED` | Invalid request format or missing required fields |
| `UNSUPPORTED_PLATFORM` | Job platform not supported |
| `UNAUTHORIZED` | Missing or invalid authentication |
| `NOT_FOUND` | Job posting not found (404) |
| `NETWORK_FAILURE` | Network error or HTTP error (403, 500, etc.) |
| `PARSING_FAILED` | Failed to extract job data from response |
| `INTERNAL_SERVER` | Unexpected server error |

## Testing

Run tests with:

```bash
cd backend
go test ./internal/services/urlextractor/... -v
go test ./internal/handlers/extract_test.go -v
```

## Architecture

```
Handler (extract.go)
    ↓
Extractor Service (extractor.go)
    ↓
Platform Detection (detectPlatform)
    ↓
Parser Selection (LinkedInParser, IndeedParser)
    ↓
HTTP Fetch + Parse
    ↓
ExtractedJobData
```

## Future Enhancements

Potential improvements for disabled platforms:

1. **Glassdoor**: Investigate official API partnership or third-party scraping service
2. **Wellfound**: Reverse engineer GraphQL endpoint with proper authentication
3. **Additional platforms**: ZipRecruiter, Monster, Dice

## Troubleshooting

### "Platform not supported" error
- Ensure the URL is from LinkedIn or Indeed
- Glassdoor and Wellfound are currently disabled

### "Job posting not found" error
- The job may have expired or been removed
- Verify the URL is correct and accessible in a browser

### "Failed to extract" error
- The job site may have changed its HTML structure
- Check if the platform updated its layout
- Tests may need updating to reflect new selectors
