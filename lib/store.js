export function create(initialState = {}) {
  if (initialState === null || typeof initialState !== 'object' || Array.isArray(initialState)) {
    throw new TypeError('Initial state must be an object.');
  }

  const state = Object.assign(Object.create(null), initialState);
  const listeners = new Map();

  function normalizeKey(key) {
    return typeof key === 'symbol' ? key : String(key);
  }

  function get(key) {
    return arguments.length === 0 ? { ...state } : state[normalizeKey(key)];
  }

  function set(key, value) {
    const normalizedKey = normalizeKey(key);
    const hadKey = Object.prototype.hasOwnProperty.call(state, normalizedKey);
    const old = state[normalizedKey];
    state[normalizedKey] = value;

    if (!hadKey || !Object.is(old, value)) {
      const subscribers = listeners.get(normalizedKey);
      if (subscribers) {
        for (const fn of [...subscribers]) {
          fn(value, old);
        }
      }
    }
  }

  function subscribe(key, fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('Subscriber must be a function.');
    }

    const normalizedKey = normalizeKey(key);
    let subscribers = listeners.get(normalizedKey);
    if (!subscribers) {
      subscribers = new Set();
      listeners.set(normalizedKey, subscribers);
    }
    subscribers.add(fn);

    let subscribed = true;
    return () => {
      if (!subscribed) return;
      subscribed = false;
      subscribers.delete(fn);
      if (subscribers.size === 0) {
        listeners.delete(normalizedKey);
      }
    };
  }

  return { get, set, subscribe };
}