function normalizeOptions(daysOrOptions, path, domain, secure) {
  if (daysOrOptions && typeof daysOrOptions === 'object') {
    return { sameSite: 'Lax', ...daysOrOptions };
  }
  const options = { path, domain, secure, sameSite: 'Lax' };
  if (daysOrOptions) options.expires = new Date(Date.now() + daysOrOptions * 864e5);
  return options;
}

function serializeAttributes(options) {
  const { path = '/', domain = '', secure, sameSite = 'Lax', maxAge, expires } = options;
  if (typeof path !== 'string' || /[;\r\n]/.test(path)) {
    throw new TypeError('Cookie path must be a string without semicolons or line breaks.');
  }
  if (typeof domain !== 'string' || /[;\r\n]/.test(domain)) {
    throw new TypeError('Cookie domain must be a string without semicolons or line breaks.');
  }
  if (!['Strict', 'Lax', 'None'].includes(sameSite)) {
    throw new TypeError('Cookie SameSite must be Strict, Lax, or None.');
  }
  const isSecure = secure ?? globalThis.location?.protocol === 'https:';
  if (sameSite === 'None' && !isSecure) {
    throw new TypeError('SameSite=None cookies must be Secure.');
  }
  const attributes = [`path=${path}`, `SameSite=${sameSite}`];
  if (domain) attributes.push(`domain=${domain}`);
  if (maxAge !== undefined) {
    if (!Number.isInteger(maxAge)) throw new TypeError('Cookie maxAge must be an integer.');
    attributes.push(`Max-Age=${maxAge}`);
  }
  if (expires) {
    const date = expires instanceof Date ? expires : new Date(expires);
    if (Number.isNaN(date.getTime())) throw new TypeError('Cookie expiry must be a valid date.');
    attributes.push(`Expires=${date.toUTCString()}`);
  }
  if (isSecure) attributes.push('Secure');
  return attributes.join('; ');
}

function validateName(name) {
  if (typeof name !== 'string' || !name || /[=;\s]/.test(name)) {
    throw new TypeError('Cookie name must be a non-empty token without whitespace, equals, or semicolons.');
  }
}

/**
 * JavaScript cannot create HttpOnly cookies. Set authentication cookies on the server.
 */
export function setCookie(name, value, daysOrOptions = 0, path = '/', domain = '', secure = false) {
  validateName(name);
  if (typeof value !== 'string') throw new TypeError('Cookie value must be a string.');
  const options = normalizeOptions(daysOrOptions, path, domain, secure);
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${serializeAttributes(options)}`;
}

export function getCookie(name) {
  validateName(name);
  const encodedName = encodeURIComponent(name);
  const entry = document.cookie.split(';').map(part => part.trim())
    .find(part => part.startsWith(`${encodedName}=`));
  if (!entry) return null;
  return decodeURIComponent(entry.slice(encodedName.length + 1));
}

export function deleteCookie(name, optionsOrPath = '/', domain = '') {
  validateName(name);
  const options = optionsOrPath && typeof optionsOrPath === 'object'
    ? optionsOrPath
    : { path: optionsOrPath, domain, sameSite: 'Lax' };
  document.cookie = `${encodeURIComponent(name)}=; ${serializeAttributes({
    ...options,
    maxAge: 0,
    expires: new Date(0),
  })}`;
}
