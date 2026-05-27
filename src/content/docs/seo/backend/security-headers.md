---
title: Security Headers
description: HTTP security headers and their relationship with SEO
sidebar:
  order: 12
---

# Security Headers

Security headers don't directly improve SEO ranking, but Google's "page
experience" signals include security. Strong security headers improve user
trust, eliminate Lighthouse audit warnings, and provide some indirect SEO
benefit through better UX scores.

## Required headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=()
```

## HSTS (HTTP Strict Transport Security)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

Tells browsers: "always use HTTPS for this domain, never HTTP, for the
next year." Prevents:

- HTTPS downgrade attacks
- Mixed content issues if someone tries `http://` link
- Cookie theft over insecure connections

### Directives

- **`max-age=N`** — duration in seconds (1 year = 31536000)
- **`includeSubDomains`** — applies to all subdomains (don't add unless ALL subdomains are HTTPS)
- **`preload`** — eligible for inclusion in browser's HSTS preload list

### HSTS preload list

Submitting to [hstspreload.org](https://hstspreload.org/) gets your domain
into Chromium's hardcoded HSTS list — browsers know to use HTTPS even on
first visit (no chance of HTTP at all).

Requirements:

- Serve valid HTTPS certificate
- Redirect HTTP to HTTPS
- All subdomains support HTTPS (because of `includeSubDomains`)
- HSTS header includes `max-age` ≥ 1 year and `preload` directive

**Caveat:** removing from preload list is slow (months). Only submit when
fully committed to HTTPS forever.

## X-Frame-Options

```
X-Frame-Options: SAMEORIGIN
```

Or:

```
X-Frame-Options: DENY
```

Prevents your site from being embedded in `<iframe>` on other domains —
clickjacking protection.

Use `SAMEORIGIN` for most sites (allows your own iframes), `DENY` for very
sensitive admin areas.

**Modern alternative:** CSP `frame-ancestors` directive (more flexible):

```
Content-Security-Policy: frame-ancestors 'self' https://trusted.example.com;
```

If you use CSP `frame-ancestors`, X-Frame-Options can be omitted (CSP takes
precedence in modern browsers).

## X-Content-Type-Options

```
X-Content-Type-Options: nosniff
```

Prevents browsers from "sniffing" MIME types (guessing the file type based
on content). Without this header, a malicious actor could upload a PHP file
with a `.jpg` extension and execute it as a script.

Just include it on every response.

## Referrer-Policy

```
Referrer-Policy: strict-origin-when-cross-origin
```

Controls how much referrer information is sent when users click links to
other sites.

### Common values

- `no-referrer` — never send referrer
- `no-referrer-when-downgrade` — don't send to less-secure (HTTPS → HTTP)
- `same-origin` — only send within your domain
- `strict-origin` — send only the origin (no path)
- `strict-origin-when-cross-origin` — full URL for same-origin, origin-only for cross-origin (recommended default)
- `unsafe-url` — always send full URL (privacy concern, avoid)

`strict-origin-when-cross-origin` is the modern default — balances analytics
referrer data with privacy.

## Permissions-Policy

```
Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()
```

Controls which browser features are allowed for the page (and embedded
iframes). Pass `()` (empty allowlist) to disable.

### Common restrictions

- `geolocation=()` — disable geolocation API
- `camera=()` — disable camera
- `microphone=()` — disable microphone
- `payment=()` — disable Payment Request API
- `usb=()` — disable WebUSB
- `interest-cohort=()` — disable FLoC (legacy, was Google's ad tracking)

### Allowing for specific origins

```
Permissions-Policy: camera=(self "https://embed.example.com")
```

Allow camera on own domain plus the embed domain. Rare use case.

## CSP (Content Security Policy)

Separate complex topic — see [CSP allow-list](/skills/csp-allow-list/) skill
cookbook for the complete guide. Summary:

CSP doesn't directly impact SEO ranking, but:

- Misconfigured CSP can block analytics scripts (skewing data Google uses)
- Misconfigured CSP can block schema.org JSON-LD if dynamically injected
- Lighthouse audit fails without basic CSP

Minimum CSP for a Nitrogen site:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com; frame-src https://www.googletagmanager.com;
```

(Adjust per your tracking/analytics setup. See the CSP skill cookbook for
detailed allow-list patterns.)

## Implementation in Laravel

```php
// app/Http/Middleware/SecurityHeaders.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        $response->headers->set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        );
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set(
            'Referrer-Policy',
            'strict-origin-when-cross-origin'
        );
        $response->headers->set(
            'Permissions-Policy',
            'geolocation=(), camera=(), microphone=(), payment=()'
        );

        return $response;
    }
}
```

Register globally:

```php
// app/Http/Kernel.php
protected $middleware = [
    // ...
    \App\Http\Middleware\SecurityHeaders::class,
];
```

## Implementation in SvelteKit

```javascript
// src/hooks.server.js
export const handle = async ({ event, resolve }) => {
    const response = await resolve(event);

    response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
    );
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set(
        'Referrer-Policy',
        'strict-origin-when-cross-origin'
    );
    response.headers.set(
        'Permissions-Policy',
        'geolocation=(), camera=(), microphone=()'
    );

    return response;
};
```

## Implementation in Nginx

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), camera=(), microphone=()" always;
```

The `always` parameter ensures headers are added even on error responses
(404, 500). Without it, headers are only added to 200 responses.

### Important: don't duplicate headers

If your application also sets these headers, Nginx and the app would each
add them, resulting in duplicates. Either:

- Set headers only in the application (Nginx passes through), or
- Set headers only in Nginx (application doesn't set them)

Don't do both unless intentional (e.g., Nginx sets baseline, app overrides
in specific responses).

## Testing security headers

### Online tools

- **[securityheaders.com](https://securityheaders.com/)** — comprehensive scan with letter grade
  - Goal: **A+** rating
- **[Mozilla Observatory](https://observatory.mozilla.org/)** — alternative audit
  - Goal: **A** or **A+**
- **Lighthouse → Best Practices** — Chrome DevTools built-in, flags missing headers

### Command line

```bash
curl -I https://example.com/ | grep -i "strict-transport\|x-frame\|x-content\|referrer\|permissions\|content-security"
```

## Common pitfalls

### HSTS preload regret

Submitting to HSTS preload list locks you into HTTPS forever. If you later
need to serve HTTP for any reason (legacy clients, testing), you can't —
preload removal takes months.

Only submit when committed.

### includeSubDomains breaks subdomain HTTP

`includeSubDomains` applies HSTS to all subdomains. If you have a subdomain
that still uses HTTP (e.g., a legacy support system), it'll be inaccessible.

Either:

- Ensure all subdomains support HTTPS, or
- Omit `includeSubDomains` (HSTS only on root domain)

### Strict CSP breaks analytics

A `default-src 'self'` CSP blocks Google Tag Manager. You need to explicitly
allowlist `www.googletagmanager.com` in `script-src` and other directives.

See the [CSP allow-list](/skills/csp-allow-list/) skill cookbook for the
exact directives needed for GA4, LinkedIn Insight, Microsoft Clarity, etc.

### X-Frame-Options conflicts with CSP

If you set both X-Frame-Options AND CSP `frame-ancestors`, browsers may
behave inconsistently. Modern browsers prefer CSP. Choose one approach:

- Use CSP `frame-ancestors` exclusively (modern best practice)
- OR use X-Frame-Options only (simpler, slightly less flexible)

## Cross-references

- [CSP allow-list](/skills/csp-allow-list/) — detailed CSP guidance
- [Caching Strategies](/seo/backend/caching-strategies/) — Cache-Control header
- [Server-Side Rendering](/seo/backend/server-side-rendering/) — where to add headers
