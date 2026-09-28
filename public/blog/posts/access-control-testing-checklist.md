---
title: Access control is where I look first
date: 2026-08-30
summary: A repeatable way to find broken access control in a web app before touching anything fancier, using the booking-system test from my industry project as the worked example.
tags: [web, access-control, methodology]
sample: true
draft: true
---

> Sample post. It shows what a writeup looks like on this site: headings, code, a table, a callout. Replace it with your own.

Most of the critical findings I have made so far were not clever. They were pages that should have asked "who are you?" and did not. So access control is the first thing I test on any web application, before injection, before anything that needs a payload.

## Why first

Injection bugs need a vulnerable sink. Access control bugs only need a developer to forget one check, and a typical app has hundreds of places to forget it. On the wellness coaching platform I tested for FIT3047, the two most severe issues were both access control: an admin booking page and a customer booking page reachable without logging in, plus a session that kept working after logout.

## The checklist

I run the same loop on every role the app knows about.

1. Map every URL and endpoint as the highest-privilege user I have.
2. Replay each one as a lower-privilege user, then as nobody at all.
3. Swap identifiers (`/bookings/1042` to `/bookings/1043`) and watch for another user's data.
4. Log out, then replay the last authenticated request with the old cookie.
5. Change the HTTP method. `GET` may be protected while `POST` or `PUT` is not.

### Enumerate first

Directory discovery gives me pages the navigation never links to. Nothing exotic:

```bash
nmap -sV -p 80,443 target.example
dirb https://target.example /usr/share/wordlists/dirb/common.txt -X .php,.html
```

Anything that comes back `200` or `302` goes into a spreadsheet with the role I found it under.

### Replay as nobody

The fastest way is a second browser profile with no session, pasting URLs from the map. For APIs I strip the cookie in Burp Repeater and resend:

```http
GET /api/bookings?customerId=1043 HTTP/1.1
Host: target.example
Accept: application/json
```

If the response is the same with and without the session, that is the finding. Screenshot both, note the request, move on.

### Check logout actually logs out

```bash
# capture the session cookie, log out in the browser, then:
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Cookie: PHPSESSID=<old value>" https://target.example/account
```

A `200` here means the server never invalidated the session. That was the case on the booking app: logout only cleared the cookie client-side.

## Reporting it so it gets fixed

The report matters as much as the hack. For each access control issue I write three lines a product owner can act on:

| Field | Example |
| --- | --- |
| What an attacker can do | See and change any customer's bookings without an account |
| Where | `/admin/bookings`, `/customer/bookings` |
| Fix | Require an authenticated session and check the booking belongs to that user, server-side, on every request |

The privacy angle helped here too. Unauthenticated access to booking data is not just a security bug, it is an Australian Privacy Principles problem (APP 11 in particular), and framing it that way got it prioritised.

## What I would add next time

- Test every state transition (create, cancel, reschedule), not just read.
- Check the password reset and email change flows for the same class of bug.
- Automate the replay step with a small script so the second iteration is faster than the first.
