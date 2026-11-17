declare module 'web-ux' {
  export const ajax: {
    configure(opts: AjaxConfig): void;
    request(opts: RequestOptions): Promise<any>;
    get(url: string, data?: any, opts?: RequestOptions): Promise<any>;
    post(url: string, data?: any, opts?: RequestOptions): Promise<any>;
    put(url: string, data?: any, opts?: RequestOptions): Promise<any>;
    patch(url: string, data?: any, opts?: RequestOptions): Promise<any>;
    del(url: string, opts?: RequestOptions): Promise<any>;
    upload(url: string, files: any, extraData?: any, opts?: RequestOptions): Promise<any>;
    download(url: string, filename?: string, opts?: DownloadOptions): Promise<any>;
    abort(requestId: string): void;
    sse(url: string, opts?: SseOptions): { close(): void; source: EventSource };
    cache: Map<string, any>;
  };
  export const bootstrap: {
    initTooltipsAndPopovers(scope?: string): void;
    modal(options: ModalOptions): any;
    offcanvas(options: OffcanvasOptions): any;
    toast(options: ToastOptions): any;
    toastSuccess(message: string, title?: string): any;
    toastError(message: string, title?: string): any;
    toastWarning(message: string, title?: string): any;
    toastQueue(options: ToastOptions): void;
    alert(message: string, variant?: string, target?: string, dismissible?: boolean): any;
    carousel(selector: string, options?: any): any;
    collapse(selector: string, options?: any): any;
    tab(selector: string): any;
    popover(element: any, options?: any): any;
    tooltip(element: any, options?: any): any;
  };
  export const encryption: {
    encryptAES(plaintext: string, password: string): Promise<string>;
    decryptAES(cipherBase64: string, password: string): Promise<string>;
    importRawKey(base64Key: string): Promise<CryptoKey>;
    encryptWithKey(plaintext: string, key: CryptoKey | string): Promise<EncryptedData>;
    decryptWithKey(dataBase64: string, ivBase64: string, tagBase64: string, key: CryptoKey | string): Promise<string>;
    encryptToJson(plaintext: string, key: CryptoKey | string): Promise<string>;
    decryptFromJson(jsonString: string, key: CryptoKey | string): Promise<string>;
    sha256(message: string): Promise<string>;
    base64: { encode(s: string): string; decode(b64: string): string };
    jwt: { decode(token: string): any; verify(token: string, secret: string, options?: any): any };
  };
  export const utils: {
    debounce(
      fn: (...args: any[]) => any,
      delay: number,
      options?: { leading?: boolean; trailing?: boolean }
    ): ((...args: any[]) => any) & { cancel(): void; flush(): any };
    throttle(
      fn: (...args: any[]) => any,
      limit: number,
      options?: { leading?: boolean; trailing?: boolean }
    ): ((...args: any[]) => any) & { cancel(): void; flush(): any };
    once<T extends (...args: any[]) => any>(fn: T): T;
    sleep(delay: number, options?: { signal?: AbortSignal }): Promise<void>;
    clamp(value: number, min: number, max: number): number;
    isPlainObject(value: any): boolean;
    deepClone(obj: any): any;
    deepMerge(target: any, source: any): any;
    uuid(): string;
    queryString: { stringify(obj: any): string; parse(str: string): any };
    date: { format(date: any, format?: string): string; relativeTime(date: any): string };
    number: {
      format(num: number, locales?: string | string[], options?: Intl.NumberFormatOptions): string;
      currency(num: number, currency?: string, locales?: string | string[], options?: Intl.NumberFormatOptions): string;
    };
    isEmail(str: string): boolean;
    isUrl(str: string, protocols?: string[]): boolean;
    isNumeric(value: string | number): boolean;
    debounceLeading(
      fn: (...args: any[]) => any,
      delay: number
    ): ((...args: any[]) => any) & { cancel(): void; flush(): any };
    storage: {
      set(key: string, value: unknown, ttlSeconds?: number | null): void;
      get<T = unknown>(key: string): T | null;
      remove(key: string): void;
      clear(): void;
    };
    copyToClipboard(text: string): Promise<void>;
    formatBytes(bytes: number, decimals?: number): string;
    randomId(length?: number): string;
    events: {
      on(event: string | symbol, fn: Function): () => void;
      once(event: string | symbol, fn: Function): () => void;
      off(event: string | symbol, fn?: Function): void;
      emit(event: string | symbol, ...args: any[]): void;
      clear(event?: string | symbol): void;
      listenerCount(event: string | symbol): number;
    };
    cozyTheme(options?: object): void;
    lazyLoadImages(selector?: string, rootMargin?: string): () => void;
    loadScript(url: string, attrs?: Record<string, string | number | boolean>): Promise<HTMLScriptElement>;
    waitForElement(
      selector: string,
      options?: { root?: ParentNode; timeout?: number; signal?: AbortSignal }
    ): Promise<Element>;
    onBreakpoint(callback: (breakpoint: string) => void): () => void;
    initColorScheme(options?: {
      storageKey?: string;
      attribute?: string;
      target?: HTMLElement;
    }): {
      toggle(): void;
      set(scheme: 'dark' | 'light' | 'system'): void;
      destroy(): void;
    };
    scrollTo(target: string | Element, offset?: number): boolean;
    triggerTransition(element: any, className: string, duration?: number): void;
  };
  export const env: {
    setEnv(obj: Record<string, any>): Record<string, any>;
    mergeEnv(obj: Record<string, any>): Record<string, any>;
    getEnv(): Record<string, any>;
    hasEnv(key: string): boolean;
    resetEnv(obj?: Record<string, any>): Record<string, any>;
    env(key: string, defaultValue?: any): any;
    loadFromUrl(url: string, options?: { headers?: Record<string, string>; timeout?: number; credentials?: RequestCredentials }): Promise<Record<string, any>>;
    loadFromBackend(scriptId?: string): Record<string, any>;
  };
  export const loader: {
    showSpinner(target?: string): void;
    hideSpinner(target?: string): void;
    showProgress(percent?: number, options?: any): void;
    hideProgress(target?: string): void;
    showPageLoader(options?: {
      type?: 'spinner' | 'dots' | 'pulse' | 'bounce' | 'bars' | 'ring' | 'progress' | 'text';
      html?: string;
      style?: Record<string, string | number>;
      className?: string;
      container?: string;
      showImmediately?: boolean;
      fadeInDelay?: number;
    }): void;
    hidePageLoader(options?: { fadeOutDelay?: number }): void;
    loadingButton(selector: string, loading?: boolean): void;
  };
  export const dom: {
    scrollTo(target: any, options?: any): void;
    scrollToTop(): void;
    isInViewport(el: any): boolean;
    serializeForm(form: any, asJson?: boolean): any;
    getFormData(form: any): any;
    infiniteScroll(containerSelector: string, callback: () => Promise<void>, threshold?: number): { off(): void };
    lazyLoad(selector?: string): void;
  };
  export const cookie: {
    setCookie(name: string, value: string, days?: number, path?: string, domain?: string, secure?: boolean): void;
    getCookie(name: string): string | null;
    deleteCookie(name: string, path?: string, domain?: string): void;
  };
  export const form: {
    validate(formSelector: string, rules: object, options?: any): boolean;
    setValues(formSelector: string, data: object): void;
    clear(formSelector: string): void;
    mask(selector: string, pattern: string): void;
    serializeForm(form: any, asJson?: boolean): any;
  };
  export const i18n: {
    load(translations: object): void;
    t(key: string, params?: object): string;
    setLocale(locale: string): void;
    getLocale(): string;
  };
  export const store: {
    create(initialState?: object): any;
  };
  export const log: {
    setLevel(level: 'debug' | 'info' | 'warn' | 'error' | 'none'): void;
    debug(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
  };
  export const perf: {
    start(label: string): void;
    end(label: string): number;
  };
}