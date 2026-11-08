const listeners = {};

export function create(initialState = {}) {
  const state = { ...initialState };
  function get(key) {
    return key ? state[key] : { ...state };
  }
  function set(key, value) {
    const old = state[key];
    state[key] = value;
    if (old !== value && listeners[key]) {
      listeners[key].forEach(fn => fn(value, old));
    }
  }
  function subscribe(key, fn) {
    if (!listeners[key]) listeners[key] = [];
    listeners[key].push(fn);
    return () => {
      listeners[key] = listeners[key].filter(f => f !== fn);
    };
  }
  return { get, set, subscribe };
}