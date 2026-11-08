// Configurable console logger with levels.
const levels = { debug: 0, info: 1, warn: 2, error: 3 };
let currentLevel = 'info';

export function setLevel(level) {
  if (levels[level] !== undefined) currentLevel = level;
}

function log(level, ...args) {
  if (levels[level] >= levels[currentLevel]) {
    console[level]('[web-ux]', ...args);
  }
}

export const debug = (...args) => log('debug', ...args);
export const info = (...args) => log('info', ...args);
export const warn = (...args) => log('warn', ...args);
export const error = (...args) => log('error', ...args);