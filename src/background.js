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

function setCookie(cookie, url, domain) {
    const newCookie = {
        url: "https://" + toSurflyDomain(url, domain) + toDomainPath(url),
        expirationDate: cookie.expirationDate,
        httpOnly: cookie.httpOnly,
        name: encode_cookie_key(cookie.name, cookie.path),
        path: toDomainPath(cookie.domain),
        secure: true,
        value: encode_cookie_value(cookie.value, cookie.secure),
    };
    chrome.cookies.set(newCookie).then((transferedCookie) => {
        // console.debug(`transfered ${cookie.name} to ${domain}:`, transferedCookie);
    });
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
                    setCookie(cookie, details.url,domain);
                })
            }
        }
    });
}

chrome.webNavigation.onCompleted.addListener(navigationHandler);
