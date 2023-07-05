const surflyDomain = 'surfly.online';

function encode_cookie_key(key, path) {
    let encoded_key = "_" + encodeURIComponent(key).replace(/_/g, "%5f") + "_";
    if (path) {
        encoded_key = encoded_key + encodeURIComponent(path).replace(/_/g, "%5f");
    }
    return encoded_key;
}

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

function toDomainPath(url) {
    const { hostname } = new URL(url);
    let parts = hostname.split('.');
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

function toSurflyDomain(url) {
    const tld = getTLD(url);
    return tld ? encodeDomain(tld) + "-p." + surflyDomain : null;
}

function isProxified(url) {
    const { hostname } = new URL(url);
    if (hostname.endsWith('-p.' + surflyDomain)) {
        return true;
    }
    return false;
}

function navigationHandler(details) {
    if (isProxified(details.url)) {
        return;
    }

    let gettingAllCookies = chrome.cookies.getAll({ url: details.url });
    gettingAllCookies.then((cookies) => {
        if (cookies.length > 0) {
            for (let cookie of cookies) {
                const newCookie = {
                    url: "https://" + toSurflyDomain(details.url) + toDomainPath(details.url),
                    domain: toSurflyDomain(details.url),
                    expirationDate: cookie.expirationDate,
                    httpOnly: cookie.httpOnly,
                    name: encode_cookie_key(cookie.name, cookie.path),
                    path: toDomainPath(details.url),
                    secure: cookie.secure,
                    value: encode_cookie_value(cookie.value, cookie.secure),
                };
                chrome.cookies.set(newCookie)
            }
        }
    });
}

chrome.webNavigation.onCompleted.addListener(navigationHandler);