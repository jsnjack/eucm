Extremely Useful Cookie Migrator - eucm
========

### What is it?
`eucm` transfer cookies from a website to Surfly session (even better -
_future_ Surfly session!) on the fly.

### How does it work?
It watches for all successful browser navigations via [webNavigation API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation)
and when it is detected, it reads all cookies via [cookies API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/cookies)
and migrates them to Surfly's cookie jar, applying Surfly proxification rules.
As a result - you will never need to log in again!

### Insights and troubleshooting

#### I've noticed that I'm often logged out of surfly website. How can I fix it?
The browsers store all cookies in the cookie store. Each top level domain has its
own cookie store with the limited space. [This space is different for each browser](https://testsite.surfly.com/cookietest.html).
Firefox and Chrome set it to 180 cookies.

When the extension replicates cookies from a website to Surfly (for example,
to `surfly.online` domain), it puts it in `surfly.online` cookies store. This store
contains all Surfly dashboard cookies + all other cookies for proxied websites.
Example: cookies for `google.com` website are stored in `google-com-p.surfly.online`
domain, however `google-com-p.surfly.online` domain still uses `surfly.online` storage.

When the number of cookies exceeds the limit, browsers start to evict cookies (first
the expired cookies, next the oldest accessed cookies). If you have a very productive
Surfly session, Surfly log in cookie might be evicted from `surfly.online` cookie
store. This causes your Surfly session to be logged out.

The extension is trying to solve this problem by introducing the list of `favouriteCookies`.
If a cookie from this list is evicted, the extension will put it to storage again.

The problem can also be addressed by changing the default browser configuration:
 - for Firefox, open `about:config` and search for `network.cookie.`. Adjust the following
   configuration options:
   - `network.cookie.maxNumber` set it to 10000
   - `network.cookie.maxPerHost` set it to 2000
   - `network.cookie.quotaPerHost` set it to 1950
   - `network.cookie.chips.partitionLimitEnabled` set it to `false`
 - for Chrome users: install Firefox
