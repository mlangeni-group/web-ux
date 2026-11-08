/**
 * Client‑side environment variable helper.
 * Supports multiple ways to load env variables:
 * 1. Automatically reads window.__ENV (if already set by a server script).
 * 2. loadFromUrl() – fetches a JSON endpoint (returns a Promise).
 * 3. loadFromBackend() – reads a <script type="application/json" id="__env-data"> block.
 * 4. setEnv() – explicit runtime override.
 */

let _env = typeof window !== 'undefined' && window.__ENV ? { ...window.__ENV } : {};

/**
 * Set / replace the entire environment object.
 * @param {Object} obj
 */
export function setEnv(obj) {
  _env = { ...obj };
}

/**
 * Merge new key‑value pairs into the current environment.
 * @param {Object} obj
 */
export function mergeEnv(obj) {
  _env = { ..._env, ...obj };
}

/**
 * Get an environment variable, optionally with a default value.
 * @param {string} key
 * @param {*} defaultValue
 * @returns {*}
 */
export function env(key, defaultValue = null) {
  return _env.hasOwnProperty(key) ? _env[key] : defaultValue;
}

/**
 * Load environment variables from a JSON URL and merge them.
 * @param {string} url
 * @returns {Promise<Object>} – the merged env object
 */
export async function loadFromUrl(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load env from ${url}: ${res.status}`);
    const data = await res.json();
    mergeEnv(data);
    return _env;
  } catch (err) {
    console.error('web-ux env.loadFromUrl failed:', err);
    throw err;
  }
}

/**
 * Load environment variables from a <script> tag with id="__env-data" and type="application/json".
 * Your server can render this tag before the bundle.
 *
 * Example server output:
 * <script id="__env-data" type="application/json">
 *   {"API_URL":"https://api.example.com","DEBUG":false}
 * </script>
 *
 * @returns {Object} – the merged env object
 */
export function loadFromBackend() {
  const script = document.getElementById('__env-data');
  if (!script) {
    console.warn('env.loadFromBackend: no script #__env-data found');
    return _env;
  }
  try {
    const data = JSON.parse(script.textContent.trim());
    mergeEnv(data);
    return _env;
  } catch (err) {
    console.error('Failed to parse env JSON from #__env-data:', err);
    return _env;
  }
}