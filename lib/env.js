/**
 * Client‑side environment variable helper.
 * Supports multiple ways to load env variables:
 * 1. Automatically reads window.__ENV (if already set by a server script).
 * 2. loadFromUrl() – fetches a JSON endpoint (returns a Promise).
 * 3. loadFromBackend() – reads a <script type="application/json" id="__env-data"> block.
 * 4. setEnv() – explicit runtime override.
 */

const ENV_SCRIPT_ID = '__env-data';

function hasWindow() {
  return typeof window !== 'undefined';
}

function getGlobalWindow() {
  return hasWindow() ? window : undefined;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
}

function normalizeEnvObject(value) {
  if (!isPlainObject(value)) {
    return {};
  }

  return Object.keys(value).reduce((acc, key) => {
    acc[key] = value[key];
    return acc;
  }, {});
}

function syncWindowEnvStore() {
  const globalWindow = getGlobalWindow();
  if (!globalWindow) {
    return;
  }

  globalWindow.__ENV = { ..._env };
}

let _env = (() => {
  const globalWindow = getGlobalWindow();
  const initialValue = globalWindow && isPlainObject(globalWindow.__ENV) ? globalWindow.__ENV : {};
  return normalizeEnvObject(initialValue);
})();

class EnvStore {
  constructor(initial = {}) {
    this._env = normalizeEnvObject(initial);
    _env = { ...this._env };
    syncWindowEnvStore();
  }

  getAll() {
    return { ...this._env };
  }

  setEnv(obj) {
    this._env = normalizeEnvObject(obj);
    _env = { ...this._env };
    syncWindowEnvStore();
    return this.getAll();
  }

  mergeEnv(obj) {
    this._env = { ...this._env, ...normalizeEnvObject(obj) };
    _env = { ...this._env };
    syncWindowEnvStore();
    return this.getAll();
  }

  reset(obj = {}) {
    this._env = normalizeEnvObject(obj);
    _env = { ...this._env };
    syncWindowEnvStore();
    return this.getAll();
  }

  has(key) {
    return Object.prototype.hasOwnProperty.call(this._env, key);
  }

  get(key, defaultValue = null) {
    return this.has(key) ? this._env[key] : defaultValue;
  }

  async loadFromUrl(url, options = {}) {
    if (!url || typeof url !== 'string') {
      throw new Error('env.loadFromUrl requires a valid URL string');
    }

    const { headers = {}, timeout = 0, credentials = 'same-origin' } = options;
    const controller = timeout > 0 ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeout) : null;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials,
        signal: controller ? controller.signal : undefined,
      });

      if (!response.ok) {
        throw new Error(`Failed to load env from ${url}: ${response.status}`);
      }

      const data = await response.json();
      this.mergeEnv(data);
      return this.getAll();
    } catch (error) {
      console.error('web-ux env.loadFromUrl failed:', error);
      throw error;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  loadFromBackend(scriptId = ENV_SCRIPT_ID) {
    if (!hasWindow()) {
      return this.getAll();
    }

    const script = document.getElementById(scriptId);
    if (!script) {
      console.warn(`env.loadFromBackend: no script #${scriptId} found`);
      return this.getAll();
    }

    try {
      const raw = typeof script.textContent === 'string' ? script.textContent.trim() : '';
      if (!raw) {
        console.warn(`env.loadFromBackend: script #${scriptId} is empty`);
        return this.getAll();
      }

      const data = JSON.parse(raw);
      this.mergeEnv(data);
      return this.getAll();
    } catch (error) {
      console.error(`Failed to parse env JSON from #${scriptId}:`, error);
      return this.getAll();
    }
  }
}

export const envStore = new EnvStore(_env);

/**
 * Set / replace the entire environment object.
 * @param {Object} obj
 */
export function setEnv(obj) {
  return envStore.setEnv(obj);
}

/**
 * Merge new key‑value pairs into the current environment.
 * @param {Object} obj
 */
export function mergeEnv(obj) {
  return envStore.mergeEnv(obj);
}

/**
 * Get an environment variable, optionally with a default value.
 * @param {string} key
 * @param {*} defaultValue
 * @returns {*}
 */
export function env(key, defaultValue = null) {
  return envStore.get(key, defaultValue);
}

/**
 * Return the full environment object.
 * @returns {Object}
 */
export function getEnv() {
  return envStore.getAll();
}

/**
 * Check whether a key exists in the current environment.
 * @param {string} key
 * @returns {boolean}
 */
export function hasEnv(key) {
  return envStore.has(key);
}

/**
 * Reset the environment to a new object.
 * @param {Object} obj
 */
export function resetEnv(obj = {}) {
  return envStore.reset(obj);
}

/**
 * Load environment variables from a JSON URL and merge them.
 * @param {string} url
 * @param {Object} [options]
 * @returns {Promise<Object>} – the merged env object
 */
export async function loadFromUrl(url, options = {}) {
  return envStore.loadFromUrl(url, options);
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
export function loadFromBackend(scriptId = ENV_SCRIPT_ID) {
  return envStore.loadFromBackend(scriptId);
}

export default envStore;