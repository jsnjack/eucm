Extremely Useful Cookie Migrator - eucm
========

### What is it?
`eucm` transfer cookies from a website to Surfly session (even better -
_future_ Surfly session!) on the fly.

### How does it work?
It watches for all successful browser navigations via [webNavigation API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation)
and when it is detected, it reads all cookies via [cookies API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/cookies)
and migrates them to Surfly, applying Surfly proxification rules.
As a result - you will never need to log in again!
