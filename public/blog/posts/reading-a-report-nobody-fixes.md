---
title: A finding nobody understands is a finding nobody fixes
date: 2026-09-06
summary: How I write pentest reports so a product owner, not just another tester, can act on them. The report matters as much as the hack.
tags: [reporting, methodology, writeup]
sample: true
draft: true
---

Most of my hands-on work is offensive security, but the part that actually gets a bug fixed is the write-up. A finding nobody understands is a finding nobody fixes. So this is how I structure a report when the reader is a product owner or a business owner, not another tester.

> This is a sample post shipped with the site so you can see the formatting. Replace it, or delete the file, and run `npm run blog:index`.

## Start with impact, not the payload

The first line of a finding should say what an attacker gets, in the reader's language. Not "IDOR on the booking endpoint" but "any logged-in customer can read and cancel another customer's bookings." Save the mechanism for the reproduction steps.

A quick severity table at the top of the report gives a non-technical reader a map before any detail:

| Finding | Impact | Severity | Fix effort |
| --- | --- | --- | --- |
| Booking pages reachable without auth | Full data exposure | Critical | Low |
| Session valid after logout | Account takeover window | High | Low |
| Verbose error messages | Information leak | Low | Low |

## Make it reproducible

Every finding needs steps someone can follow without me sitting next to them. I keep the request minimal and annotate the one line that matters.

```http
GET /admin/bookings?all=true HTTP/1.1
Host: app.example.com
Cookie: session=<any authenticated customer session>
```

The response returns every customer's booking. No admin role required. That single missing check is the whole finding.

When the repro needs a script, I keep it short and readable rather than clever:

```bash
# enumerate booking IDs that should not be reachable
for id in $(seq 1000 1050); do
  code=$(curl -s -o /dev/null -w '%{http_code}' \
    -b "session=$SESSION" \
    "https://app.example.com/booking/$id")
  echo "$id -> $code"
done
```

## Map it to something they already track

If a team lives in a framework, meet them there. I map findings to MITRE ATT&CK where a SOC will read them, and to the OWASP Top 10 where a dev team will. For the wellness app I tested under FIT3047 I also mapped data-handling issues to the Australian Privacy Principles, because that was the language the client's obligations were written in.

## Write the remediation as a diff, not a lecture

The fix section should be the easiest part to act on:

- **Enforce authorization server-side** on every booking route, checking that the session's user owns the record.
- **Invalidate the session on logout** rather than only clearing the client cookie.
- **Return generic error messages** to the client and keep the detail in server logs.

## The checklist I run before sending

1. Could a non-technical owner explain the impact after reading only the summary?
2. Can someone reproduce each finding from the steps alone?
3. Is every finding tied to a concrete fix?
4. Have I removed anything that reads as showing off rather than helping?

If all four are yes, the report is done. The hack was the fun part. The report is the part that changes anything.
