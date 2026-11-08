// Performance measurement helpers.
const marks = {};

export function start(label) {
  marks[label] = performance.now();
}

export function end(label) {
  if (!marks[label]) return 0;
  const duration = performance.now() - marks[label];
  delete marks[label];
  console.debug(`[Perf] ${label}: ${duration.toFixed(2)} ms`);
  return duration;
}

export function measure(label, fn) {
  const t0 = performance.now();
  fn();
  const t1 = performance.now();
  console.debug(`[Perf] ${label}: ${(t1 - t0).toFixed(2)} ms`);
  return t1 - t0;
}