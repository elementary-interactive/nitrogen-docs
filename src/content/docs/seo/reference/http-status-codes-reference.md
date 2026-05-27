---
title: HTTP Status Codes Reference
description: Complete list of HTTP status codes for SEO
sidebar:
  order: 2
---

# HTTP Status Codes Reference

Quick reference for all HTTP status codes with SEO implications. For
implementation details see [HTTP Status Codes](/seo/backend/http-status-codes/)
and [Redirects](/seo/backend/redirects-301-302/).

## 1xx — Informational (rarely seen)

| Code | Name | Notes |
|---|---|---|
| 100 | Continue | Sent before final response. Crawlers don't care. |
| 101 | Switching Protocols | Used for HTTP/2 upgrade, WebSocket. Crawlers don't care. |

## 2xx — Success

| Code | Name | SEO meaning |
|---|---|---|
| 200 | OK | Normal indexable response. |
| 201 | Created | After POST form submission. Not for content URLs. |
| 202 | Accepted | Async processing started. Not for content URLs. |
| 204 | No Content | API responses. Not for content URLs. |
| 206 | Partial Content | Range requests (resuming downloads). Crawlers handle automatically. |

## 3xx — Redirection

| Code | Name | SEO meaning |
|---|---|---|
| 300 | Multiple Choices | Rarely used. Server presents options. |
| 301 | Moved Permanently | **Link equity transfers.** Preferred for permanent moves. |
| 302 | Found | **Temporary.** Link equity stays at OLD URL. Use sparingly. |
| 303 | See Other | After POST, redirect to GET. Used in form submission flows. |
| 304 | Not Modified | Conditional GET. Crawler used `If-Modified-Since` and content hasn't changed. Saves bandwidth. |
| 307 | Temporary Redirect | Like 302 but HTTP method preserved (POST stays POST). |
| 308 | Permanent Redirect | Like 301 but HTTP method preserved. |

## 4xx — Client Error

| Code | Name | SEO meaning |
|---|---|---|
| 400 | Bad Request | Malformed request. Crawlers may retry. |
| 401 | Unauthorized | Authentication required. Crawlers treat as inaccessible. |
| 403 | Forbidden | Access denied. Crawlers don't index. |
| 404 | Not Found | URL doesn't exist. Eventually de-indexed. |
| 405 | Method Not Allowed | Wrong HTTP method (e.g., POST to GET-only endpoint). |
| 406 | Not Acceptable | Content negotiation failed (Accept-Language mismatch, etc.). |
| 408 | Request Timeout | Client took too long. Crawlers will retry. |
| 409 | Conflict | Resource state conflict (rare in HTTP responses to crawlers). |
| 410 | Gone | **Intentional deletion.** Faster de-indexing than 404. |
| 411 | Length Required | Missing Content-Length header. Server-config issue. |
| 412 | Precondition Failed | If-Match header didn't match. Rare for crawlers. |
| 413 | Payload Too Large | Request body too big. Not for crawlers normally. |
| 414 | URI Too Long | URL exceeds server limit. Probably an attack or bug. |
| 415 | Unsupported Media Type | Wrong Content-Type. Rare for crawlers. |
| 416 | Range Not Satisfiable | Bad range request. |
| 422 | Unprocessable Content | Validation failed. API responses. |
| 425 | Too Early | Server refuses to process replayed request. Rare. |
| 426 | Upgrade Required | Server requires protocol upgrade. |
| 428 | Precondition Required | Server requires `If-Match` header. |
| 429 | Too Many Requests | **Rate limited.** Crawlers retry after `Retry-After` header value. |
| 431 | Request Header Fields Too Large | Headers too big. Rare. |
| 451 | Unavailable for Legal Reasons | **GDPR-compliant geo-blocking.** Crawlers respect this. |

## 5xx — Server Error

| Code | Name | SEO meaning |
|---|---|---|
| 500 | Internal Server Error | Application bug. **Investigate immediately.** Sustained 5xx hurts rankings. |
| 501 | Not Implemented | Server doesn't support the request. |
| 502 | Bad Gateway | Upstream server error. |
| 503 | Service Unavailable | **Temporary.** Use during maintenance with `Retry-After` header. |
| 504 | Gateway Timeout | Upstream timeout. |
| 505 | HTTP Version Not Supported | Wrong HTTP version. Rare. |
| 506 | Variant Also Negotiates | Configuration error. Rare. |
| 507 | Insufficient Storage | Out of disk space (WebDAV). |
| 508 | Loop Detected | Infinite recursion in content negotiation. |
| 510 | Not Extended | Further extensions required. Rare. |
| 511 | Network Authentication Required | Captive portal. |

## Practical recommendations

- **Use 301** for permanent content moves (95% of redirect cases)
- **Use 410** for intentionally deleted content (faster than 404 for de-indexing)
- **Use 503 with `Retry-After`** during planned maintenance
- **Avoid 302** unless truly temporary (campaigns, A/B tests, auth redirects)
- **Monitor 5xx rate** in Search Console — sustained errors reduce crawl rate and rankings

## Common pitfalls

- **Returning 200 for "page not found"** → soft 404 anti-pattern
- **Returning 301 to 301 to 301** → redirect chain wastes link equity
- **Returning 302 for permanent moves** → link equity stays at old URL
- **No Retry-After on 429 or 503** → crawler retries aggressively

## Cross-references

- [HTTP Status Codes](/seo/backend/http-status-codes/) — implementation guide
- [Redirects (301/302)](/seo/backend/redirects-301-302/) — managing redirects
- [Crawl Budget](/seo/backend/crawl-budget/) — status code impact on crawl
