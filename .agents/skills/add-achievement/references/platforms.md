# What each platform exposes publicly

These are anonymous requests, as tested on 2026-11-11. `credential.mjs`
implements all of them. Use this file when a platform's markup changes or a
link isn't recognised.

| Platform | Link shape | Data source | Badge art | Certificate |
|---|---|---|---|---|
| Credly | `credly.com/badges/<uuid>[/public_url]` | Open Badges JSON: `api.credly.com/v1/obi/v2/badge_assertions/<uuid>` → badge class → issuer. The per-badge `.json` route returns 500. | `images.credly.com/...` (1600 px PNG) | Owner-only PDF |
| Credly profile | `credly.com/users/aaron-correya/badges.json` | Every public badge, with issuer, dates and image | | |
| Accredible (any branded host: `credentials.newrelic.com`, `credentials.databricks.com`, `credential.net`) | `<host>/<uuid or numeric id>` | `api.accredible.com/v1/credential-net/credentials/<id>` | The PNG inside `group.badge_design.svg`, served as `templates.images.credential.net/<file>.png` (`badge_image` is only a thumbnail) | Public PDF when `issuer.recipient_functions.download_pdf` is `public`: `api.accredible.com/v1/credential/generate_certificate_pdf?credential_id=<numeric id>&mode=pdf` |
| Microsoft Learn | `learn.microsoft.com/api/credentials/share/<locale>/<user>/<credentialId>?sharingId=...` | `learn.microsoft.com/api/credentials/<credentialId>?locale=en-gb` (title, skills, awardedOn, certificationNumber, status) | `learn.microsoft.com` + `iconUrl` (SVG) | None as a file: see below |
| Skilljar (Anthropic Academy and others) | `verify.skilljar.com/c/<code>` | Page HTML: `og:title`, "Completion Date", "Certificate Expires"; the header shows the academy name | None: ask the owner | `og:image` JPG and the "Download certificate PDF" link. Both are **signed and expire**, so download them, never hotlink. |
| Oracle CertView | `catalog-education.oracle.com/.../certview/sharebadge[_m]?id=...` | Page HTML: `<title>`, "Issued by", "Issued on", "Valid until", "Skills" | `og:image` (`brm-workforce.oracle.com/.../*.png`) | Owner-only eCertificate PDF |
| Parchment / Badgr / any Open Badges 2.0 host | `badges.parchment.com/public/assertions/<id>` | Same URL with `Accept: application/json` → badge class → issuer | The badge class `image` | None |
| Full Stack Open | `studies.cs.helsinki.fi/stats/api/certificate/...` | The link *is* the certificate PNG. It has no date, so `issued` is `null` ("Date pending") | Site header mark | The link itself |
| LinkedIn, Hacktoberfest `blob:` links | | Behind a login or local to the browser: unusable | | Owner supplies files |

## Microsoft certificate image

Microsoft serves no certificate file. The existing ones were captured from the
verify page in a headless browser at 2x, with a locator that reaches through
the page's shadow DOM to the certificate card. Playwright isn't a dependency of
this repo, so only do this if a Playwright install is available on the
machine. Otherwise set `certificate: null` and tell the owner.

## Dates

Platforms that return a timestamp (Microsoft, Credly) are converted to the
calendar date in the machine's time zone. That's the date the certificate
shows: DP-900 is stamped `2026-06-17T19:48:59Z`, which is 18 June in IST, the
date on the certificate. On a machine or CI runner set to UTC, run the script
with `TZ=Asia/Kolkata`. Text dates ("23 April 2025", "Nov. 27, 2026") are
parsed as written.
