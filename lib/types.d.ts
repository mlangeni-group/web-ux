export interface RequestOptions extends Omit<RequestInit, 'body'> {
  url?: string;
  data?: unknown;
  body?: BodyInit | null;
  raw?: boolean;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  useExponentialBackoff?: boolean;
  retryUnsafeMethods?: boolean;
  requestId?: string;
  cache?: boolean;
  cacheTTL?: number;
  staleIfError?: boolean;
  maxCacheEntries?: number;
  showLoader?: boolean;
  dataType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'response';
  contentType?: string;
  baseUrl?: string;
}

export interface AjaxConfig extends Partial<RequestOptions> {
  tokenGetter?: (() => string | null | undefined) | null;
  showToasts?: boolean;
  loaderType?: 'spinner' | 'page-overlay';
  loaderTarget?: string;
  interceptors?: {
    beforeRequest?: Array<(request: RequestOptions) => void>;
    afterResponse?: Array<(data: unknown, response: Response) => void>;
    onError?: Array<(error: HttpError) => void>;
  };
}

export class HttpError extends Error {
  status: number;
  response: unknown;
  headers: Headers | null;
}

export const ajax: {
  HttpError: typeof HttpError;
  configure(options: AjaxConfig): void;
  request<T = unknown>(options: RequestOptions): Promise<T>;
  get<T = unknown>(url: string, data?: Record<string, unknown>, options?: RequestOptions): Promise<T>;
  post<T = unknown>(url: string, data?: unknown, options?: RequestOptions): Promise<T>;
  put<T = unknown>(url: string, data?: unknown, options?: RequestOptions): Promise<T>;
  patch<T = unknown>(url: string, data?: unknown, options?: RequestOptions): Promise<T>;
  del<T = unknown>(url: string, options?: RequestOptions): Promise<T>;
  upload<T = unknown>(
    url: string,
    files: File | FileList | Record<string, Blob>,
    extraData?: Record<string, string | Blob>,
    options?: RequestOptions & { onProgress?: (percent: number) => void; progressTarget?: string }
  ): Promise<T>;
  download(
    url: string,
    filename?: string,
    options?: RequestOptions & { onProgress?: (percent: number) => void; progressTarget?: string }
  ): Promise<{ success: true }>;
  abort(requestId: string): void;
  abortAll(): void;
  clearCache(): void;
  removeCacheEntry(url: string, method?: string, data?: unknown): void;
  requestAll<T = unknown>(requests: RequestOptions[], options?: { showLoader?: boolean }): Promise<T[]>;
  sse(
    url: string,
    options?: {
      onMessage?: (event: MessageEvent) => void;
      onOpen?: (event: Event) => void;
      onError?: (event: Event) => void;
      reconnect?: boolean;
      maxReconnect?: number;
      retryDelay?: number;
    }
  ): { close(): void; readonly source: EventSource | undefined };
  isPending(): boolean;
};

export interface ToastOptions {
  title?: string;
  message?: string;
  variant?: 'success' | 'danger' | 'warning' | 'info';
  delay?: number;
  container?: string;
  fade?: boolean;
  assertive?: boolean;
}

export const bootstrap: {
  setCozyOptions(options: Record<string, boolean>): void;
  initTooltipsAndPopovers(scope?: string): void;
  modal(options?: {
    title?: string;
    body?: string | Node;
    html?: boolean;
    buttons?: Array<{ text: string; class?: string; dismiss?: boolean; handler?: (event: Event, instance: unknown) => void }>;
    static?: boolean;
    fade?: boolean;
    blurBackdrop?: boolean;
    customClass?: string;
  }): unknown;
  offcanvas(options?: { title?: string; body?: string | Node; html?: boolean; placement?: 'start' | 'end' | 'top' | 'bottom'; fade?: boolean }): unknown;
  toast(options: ToastOptions): unknown;
  toastSuccess(message: string, title?: string): unknown;
  toastError(message: string, title?: string): unknown;
  toastWarning(message: string, title?: string): unknown;
  toastQueue(options: ToastOptions): void;
  alert(message: string, variant?: string, target?: string, dismissible?: boolean, fade?: boolean): object;
  carousel(selector: string, options?: object): unknown;
  collapse(selector: string, options?: object): unknown;
  tab(selector: string): void;
  popover(element: Element, options?: object): unknown;
  tooltip(element: Element, options?: object): unknown;
  dropdown(element: Element): unknown;
  notify(options: ToastOptions): number;
  getNotifications(): Array<{ id: number; title: string; message: string; variant: string; read: boolean; timestamp: Date }>;
  markNotificationRead(id: number): void;
  clearNotifications(): void;
};

export interface EncryptedData {
  data: string;
  iv: string;
  tag: string;
  v: string;
}

export const encryption: {
  encryptAES(plaintext: string, password: string): Promise<string>;
  decryptAES(ciphertextBase64: string, password: string): Promise<string>;
  importRawKey(key: string): Promise<CryptoKey>;
  encryptWithKey(plaintext: string, key: CryptoKey | string): Promise<EncryptedData>;
  decryptWithKey(dataBase64: string, ivBase64: string, tagBase64: string, key: CryptoKey | string): Promise<string>;
  encryptToJson(plaintext: string, key: CryptoKey | string): Promise<string>;
  decryptFromJson(jsonString: string, key: CryptoKey | string): Promise<string>;
  sha256(message: string): Promise<string>;
  base64: { encode(value: string): string; decode(value: string): string };
  jwt: { decode(token: string): Record<string, unknown> | string | null };
};

export const utils: {
  debounce<T extends (...args: any[]) => any>(fn: T, delay: number, options?: { leading?: boolean; trailing?: boolean }): T & { cancel(): void; flush(): ReturnType<T> | undefined };
  throttle<T extends (...args: any[]) => any>(fn: T, limit: number, options?: { leading?: boolean; trailing?: boolean }): T & { cancel(): void; flush(): ReturnType<T> | undefined };
  once<T extends (...args: any[]) => any>(fn: T): T;
  sleep(delay: number, options?: { signal?: AbortSignal }): Promise<void>;
  clamp(value: number, min: number, max: number): number;
  isPlainObject(value: unknown): boolean;
  deepClone<T>(value: T): T;
  deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T;
  uuid(): string;
  randomId(length?: number): string;
  queryString: { stringify(value: Record<string, unknown>): string; parse(value: string): Record<string, string | string[]> };
  date: { format(value: string | number | Date, format?: string): string; relativeTime(value: string | number | Date): string };
  number: {
    format(value: number, locales?: string | string[], options?: Intl.NumberFormatOptions): string;
    currency(value: number, currency?: string, locales?: string | string[], options?: Intl.NumberFormatOptions): string;
  };
  isEmail(value: string): boolean;
  isUrl(value: string, protocols?: string[]): boolean;
  isNumeric(value: string | number): boolean;
  debounceLeading<T extends (...args: any[]) => any>(fn: T, delay: number): T & { cancel(): void; flush(): ReturnType<T> | undefined };
  storage: {
    set(key: string, value: unknown, ttlSeconds?: number | null): void;
    get<T = unknown>(key: string): T | null;
    remove(key: string): void;
    clear(): void;
  };
  copyToClipboard(text: string): Promise<void>;
  formatBytes(bytes: number, decimals?: number): string;
  events: {
    on(event: string | symbol, fn: (...args: any[]) => void): () => void;
    once(event: string | symbol, fn: (...args: any[]) => void): () => void;
    off(event: string | symbol, fn?: (...args: any[]) => void): void;
    emit(event: string | symbol, ...args: any[]): void;
    clear(event?: string | symbol): void;
    listenerCount(event: string | symbol): number;
  };
  cozyTheme(options?: object): void;
  lazyLoadImages(selector?: string, rootMargin?: string): () => void;
  loadScript(url: string, attrs?: Record<string, string | number | boolean>): Promise<HTMLScriptElement>;
  waitForElement(selector: string, options?: { root?: ParentNode; timeout?: number; signal?: AbortSignal }): Promise<Element>;
  onBreakpoint(callback: (breakpoint: string) => void): () => void;
  initColorScheme(options?: { storageKey?: string; attribute?: string; target?: HTMLElement }): {
    toggle(): void;
    set(scheme: 'dark' | 'light' | 'system'): void;
    destroy(): void;
  };
  scrollTo(target: string | Element, offset?: number): boolean;
  triggerTransition(element: Element, className: string, duration?: number): void;
};

export const env: {
  setEnv(value: Record<string, unknown>): Record<string, unknown>;
  mergeEnv(value: Record<string, unknown>): Record<string, unknown>;
  getEnv(): Record<string, unknown>;
  hasEnv(key: string): boolean;
  resetEnv(value?: Record<string, unknown>): Record<string, unknown>;
  env<T = unknown>(key: string, defaultValue?: T): unknown | T;
  loadFromUrl(url: string, options?: { headers?: Record<string, string>; timeout?: number; credentials?: RequestCredentials }): Promise<Record<string, unknown>>;
  loadFromBackend(scriptId?: string): Record<string, unknown>;
  envStore: unknown;
};

export const loader: {
  setLoaderTransitionSpeed(ms: number): void;
  showSpinner(target?: string): void;
  hideSpinner(target?: string): void;
  showProgress(percent?: number, options?: object): void;
  hideProgress(target?: string): void;
  showPageLoader(options?: object): void;
  hidePageLoader(options?: object): void;
  loadingButton(selector: string, loading?: boolean | object): void;
  showSkeleton(container: string | Element, options?: { rows?: number; animation?: string }): void;
  hideSkeleton(container: string | Element): void;
};

export const dom: {
  scrollTo(target: string | Element, options?: object): void;
  scrollToTop(): void;
  isInViewport(element: Element): boolean;
  serializeForm(form: HTMLFormElement, asJson?: boolean): object | string;
  getFormData(form: HTMLFormElement): FormData;
  infiniteScroll(container: string | Element, callback: () => Promise<void>, threshold?: number): { off(): void };
  lazyLoad(selector?: string): void;
};

export interface CookieOptions {
  expires?: Date | string | number;
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export const cookie: {
  setCookie(name: string, value: string, daysOrOptions?: number | CookieOptions, path?: string, domain?: string, secure?: boolean): void;
  getCookie(name: string): string | null;
  deleteCookie(name: string, optionsOrPath?: CookieOptions | string, domain?: string): void;
};

export interface ValidationOptions {
  errorClass?: string;
  validClass?: string;
  onSubmit?: (data: Record<string, unknown>, event: SubmitEvent) => unknown;
  onError?: (error: unknown) => void;
  liveValidate?: boolean;
  liveDebounce?: number;
  smooth?: boolean;
  errorSummary?: boolean | string;
}

export const form: {
  addRule(name: string, rule: (value: unknown, param: unknown, form: object, field: object) => true | string | Promise<true | string>): void;
  validateField(form: string | HTMLFormElement | object, fieldName: string, rules: Record<string, unknown>, options?: ValidationOptions): boolean;
  validate(formSelector: string | HTMLFormElement, rules: Record<string, Record<string, unknown>>, options?: ValidationOptions & { preventDefault?: boolean }): { destroy(): void };
  validateAsync(formSelector: string | HTMLFormElement, rules: Record<string, Record<string, unknown>>, options?: ValidationOptions & { allowNativeSubmit?: boolean }): { destroy(): void };
  setValues(formSelector: string | HTMLFormElement, data: Record<string, unknown>): void;
  clear(formSelector: string | HTMLFormElement): void;
  mask(selector: string, pattern: string): void;
  serializeForm(form: HTMLFormElement | object, asJson?: boolean): Record<string, unknown> | string;
  autoSave(formSelector: string | HTMLFormElement, saveFn: (data: Record<string, unknown>) => unknown, interval?: number): { destroy(): void };
  filePreview(inputSelector: string, previewSelector: string): void;
  charCounter(inputSelector: string, targetSelector: string, max: number): void;
  confirmReset(formSelector: string, message?: string): void;
};

export const i18n: {
  load(translations: Record<string, unknown>, locale?: string): void;
  t(key: string, params?: Record<string, unknown>): string;
  tp(key: string, count: number, params?: Record<string, unknown>): string;
  formatNumber(value: number, options?: Intl.NumberFormatOptions, locale?: string): string;
  formatCurrency(value: number, currency: string, options?: Intl.NumberFormatOptions, locale?: string): string;
  formatDate(value: string | number | Date, options?: Intl.DateTimeFormatOptions, locale?: string): string;
  formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, options?: Intl.RelativeTimeFormatOptions, locale?: string): string;
  setLocale(locale: string): void;
  getLocale(): string;
};

export const store: {
  create<T extends Record<string, unknown>>(initialState?: T): {
    get(): T;
    get<K extends keyof T>(key: K): T[K];
    set<K extends string | symbol>(key: K, value: unknown): void;
    subscribe<K extends keyof T>(key: K, callback: (value: T[K], previous: T[K] | undefined) => void): () => void;
  };
};

export const log: {
  setLevel(level: 'debug' | 'info' | 'warn' | 'error' | 'none'): void;
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
};

export const perf: {
  start(label: string): void;
  end(label: string): number;
  measure<T>(label: string, fn: () => T): T;
};

declare const webUx: {
  ajax: typeof ajax;
  bootstrap: typeof bootstrap;
  encryption: typeof encryption;
  utils: typeof utils;
  env: typeof env;
  loader: typeof loader;
  dom: typeof dom;
  cookie: typeof cookie;
  form: typeof form;
  i18n: typeof i18n;
  store: typeof store;
  log: typeof log;
  perf: typeof perf;
};

export default webUx;
