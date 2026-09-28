---
title: Access control is still the easy win
date: 2026-08-22
summary: Broken access control keeps topping the OWASP list for a reason. A short field guide to the checks that find it fastest on a real web app.
tags: [web, access-control, methodology]
sample: true
draft: true
---

Every time I test a web application, the first thing I go looking for is broken access control. It sits at the top of the OWASP Top 10, and in my experience that ranking is earned. It is also, very often, the fastest critical to find.

> Sample post. Swap in your own writeups and run `npm run blog:index` to update the index.

## Two questions that find most of it

When I look at any authenticated feature I ask two things:

1. **Can I reach it without logging in at all?**
2. **Can I reach *someone else's* version of it while logged in as me?**

The first is missing authentication. The second is missing authorization. They fail independently, and plenty of apps get one right and the other wrong.

## Missing authentication: try the URL cold

Log the requests an admin makes, then replay them with no session. On the client-facing app I tested this year, the admin and customer booking pages both rendered fine with the cookie stripped entirely:

```http
GET /admin/bookings HTTP/1.1
Host: app.example.com
```

`200 OK`, full page, no redirect to login. The navigation link was hidden from ordinary users, but the route itself never checked. Hiding a link is not access control.

## Missing authorization: change one number

Log in as a low-privilege user and walk the object IDs you own, then try the neighbours:

```bash
# I own booking 1042. Do I own 1041 and 1043?
for id in 1041 1042 1043; do
  curl -s -b "session=$MY_SESSION" \
    "https://app.example.com/booking/$id" | head -c 80
  echo
done
```

If 1041 and 1043 come back with someone else's details, that is an insecure direct object reference, and it is a reportable critical on its own.

## The logout that does not log out

A subtle cousin: the session that stays valid after logout. Log out, then replay a request with the *old* cookie:

```http
GET /account HTTP/1.1
Host: app.example.com
Cookie: session=<cookie captured before logout>
```

If it still works, the server never invalidated the session; it only asked the browser to forget the cookie. On a shared machine that is an account takeover waiting to happen.

## Why it stays common

Access control is spread across every route, so a single missed check is easy to ship and invisible in a demo. It rarely shows up unless someone tries the thing the UI does not offer. That someone should be you, before it is an attacker.

The tooling is almost beside the point. Burp to capture and replay, a short loop to enumerate, and the discipline to try every door rather than the ones the app points you at.
