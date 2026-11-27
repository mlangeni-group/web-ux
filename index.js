/**
 * Browser-first frontend utilities for jQuery and Bootstrap 5.
 */
import * as ajax from './lib/ajax.js';
import * as bootstrap from './lib/bootstrap.js';
import * as encryption from './lib/encryption.js';
import * as utils from './lib/utils.js';
import * as env from './lib/env.js';
import * as loader from './lib/loader.js';
import * as dom from './lib/dom.js';
import * as cookie from './lib/cookie.js';
import * as form from './lib/form.js';
import * as i18n from './lib/i18n.js';
import * as store from './lib/store.js';
import * as log from './lib/log.js';
import * as perf from './lib/perf.js';

export { ajax, bootstrap, encryption, utils, env, loader, dom, cookie, form, i18n, store, log, perf };
export default { ajax, bootstrap, encryption, utils, env, loader, dom, cookie, form, i18n, store, log, perf };