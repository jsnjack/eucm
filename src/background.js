const surflyDomains = [
    "surfly.online",
    "surfly.com",
];


function encode_cookie_key(key, path) {
    let encoded_key = "_" + encodeURIComponent(key).replace(/_/g, "%5f") + "_";
    if (path) {
        encoded_key = encoded_key + encodeURIComponent(path).replace(/_/g, "%5f");
    }
    return encoded_key;
}

// List of cookies which will be restored, if evicted
const favouriteCookies = [
    // Surfly cookies
    "surfly_dashboard_sessionid", // Surfly dashboard cookie
    encode_cookie_key("surfly_dashboard_sessionid", "/"),

    "sessionid", // console session cookie
    encode_cookie_key("sessionid", "/"),

    "cobro_session", // Contains session information
    "space_token", // User's token to join console spaces

    // Google cookies (marked by google with high priority)
    "APISID",
    "HSID",
    "SAPISID",
    "SID",
    "SIDCC",
    "SSID",
    "__Secure-1PAPISID",
    "__Secure-1PSID",
    "__Secure-1PSIDCC",
    "__Secure-1PSIDTS",
    "__Secure-3PAPISID",
    "__Secure-3PSID",
    "__Secure-3PSIDCC",
    "__Secure-3PSIDTS",
    encode_cookie_key("APISID", "/"),
    encode_cookie_key("HSID", "/"),
    encode_cookie_key("SAPISID", "/"),
    encode_cookie_key("SID", "/"),
    encode_cookie_key("SIDCC", "/"),
    encode_cookie_key("SSID", "/"),
    encode_cookie_key("__Secure-1PAPISID", "/"),
    encode_cookie_key("__Secure-1PSID", "/"),
    encode_cookie_key("__Secure-1PSIDCC", "/"),
    encode_cookie_key("__Secure-1PSIDTS", "/"),
    encode_cookie_key("__Secure-3PAPISID", "/"),
    encode_cookie_key("__Secure-3PSID", "/"),
    encode_cookie_key("__Secure-3PSIDCC", "/"),
    encode_cookie_key("__Secure-3PSIDTS", "/"),

    // Github cookies
    "_gh_sess",
    encode_cookie_key("_gh_sess", "/"),
];

function encode_cookie_value(value, is_secure) {
    if (is_secure) {
        value += "_S";
    } else {
        value += "_H";
    }
    return value;
}

function encodeDomain(domain) {
    while (domain[0] === '.') {
        // according to RFC, '.example.com' and 'example.com' is the same thing
        domain = domain.slice(1);
    }
    return domain.replace(/0/g, '00').replace(/-/g, '-0-').replace(/\./g, '-');
}

function toDomainPath(data) {
    if (data.includes('://')) {
        data = new URL(data).hostname;
    } else {
        while (data[0] === '.') {
            // according to RFC, '.example.com' and 'example.com' is the same thing
            data = data.slice(1);
        }
    }
    let parts = data.split('.');
    return '/' + parts.reverse().join('/');
}

function getTLD(url) {
    const { hostname } = new URL(url);
    const parts = hostname.split('.');
    if (parts.length >= 2) {
        const tld = parts[parts.length - 2] + '.' + parts[parts.length - 1];
        return tld;
    }
    return null;
}

function toSurflyDomain(url, domain) {
    const tld = getTLD(url);
    return tld ? encodeDomain(tld) + "-p." + domain : null;
}

function isProxified(url) {
    const { hostname } = new URL(url);
    surflyDomains.forEach((domain) => {
        if (hostname.endsWith('-p.' + domain)) {
            return true;
        }
    });
    return false;
}


function _setCookie(cookie) {
    chrome.cookies.set(cookie).then((transferedCookie) => {
        console.debug(`transfered ${transferedCookie.name} to ${transferedCookie.domain}:`, transferedCookie);
    });
}

function setCookie(cookie, url, domain) {
    const newCookie = {
        url: "https://" + toSurflyDomain(url, domain) + toDomainPath(url),
        expirationDate: cookie.expirationDate,
        httpOnly: cookie.httpOnly,
        name: encode_cookie_key(cookie.name, cookie.path),
        path: toDomainPath(cookie.domain),
        secure: true,
        value: encode_cookie_value(cookie.value, cookie.secure),
        partitionKey: { topLevelSite: `https://${domain}` }
    };
    _setCookie(newCookie);
}

function navigationHandler(details) {
    if (isProxified(details.url)) {
        return;
    }

    let gettingAllCookies = chrome.cookies.getAll({ url: details.url });
    gettingAllCookies.then((cookies) => {
        if (cookies.length > 0) {
            for (let cookie of cookies) {
                surflyDomains.forEach((domain) => {
                    setCookie(cookie, details.url, domain);
                })
            }
        }
    });
}

function cookieChangedHandler(details) {
    // Catch surfly login cookie and do not allow it to be evicted (to prevent
    // logging out from surfly due to big number of cookies)
    let wasEvicted = false;
    let wasReset = false;
    if (details.cause === "evicted") {
        wasEvicted = true;
        if (favouriteCookies.includes(details.cookie.name)) {
            wasReset = true;
            const newCookie = {
                url: `https://${details.cookie.domain}${details.cookie.path}`,
                expirationDate: details.cookie.expirationDate,
                httpOnly: details.cookie.httpOnly,
                name: details.cookie.name,
                path: details.cookie.path,
                secure: details.cookie.secure,
                value: details.cookie.value,
                partitionKey: cookie.partitionKey
            };
            _setCookie(newCookie);
        }
    }
    if (wasEvicted && !wasReset) {
        // console.debug("Cookie evicted:", details.cookie.name, details.cookie.domain);
    }
}

chrome.webNavigation.onCompleted.addListener(navigationHandler);
chrome.cookies.onChanged.addListener(cookieChangedHandler);
