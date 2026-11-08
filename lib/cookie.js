/**
 * Set a cookie.
 * @param {string} name
 * @param {string} value
 * @param {number} days - Expiry in days (default: session)
 * @param {string} path
 * @param {string} domain
 * @param {boolean} secure
 */
export function setCookie(name, value, days = 0, path = '/', domain = '', secure = false) {
  let expires = '';
  if (days) {
    const date = new Date(Date.now() + days * 864e5);
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=${path}` +
    (domain ? `; domain=${domain}` : '') +
    (secure ? '; Secure' : '');
}

export function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function deleteCookie(name, path = '/', domain = '') {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}` +
    (domain ? `; domain=${domain}` : '');
}