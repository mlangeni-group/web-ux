import $ from 'jquery';

// ----- Default & Custom Rules -----
const defaultRules = {
  required: val => (val === null || val === undefined || val === '') ? 'This field is required.' : true,
  minlength: (val, len) => val.length < len ? `Minimum ${len} characters required.` : true,
  maxlength: (val, len) => val.length > len ? `Maximum ${len} characters allowed.` : true,
  email: val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? true : 'Invalid email address.',
  url: val => { try { new URL(val); return true; } catch { return 'Invalid URL.'; } },
  pattern: (val, regex) => {
    if (typeof regex === 'string') regex = new RegExp(regex);
    return regex.test(val) ? true : 'Invalid format.';
  },
  match: (val, targetId) => {
    const other = $(`#${targetId}`).val();
    return val === other ? true : 'Values do not match.';
  },
};
const customRules = {};
export function addRule(name, ruleFn) { customRules[name] = ruleFn; }

// ----- Field Validation -----
export function validateField(form, fieldName, fieldRules, options = {}) {
  const $form = $(form);
  const $input = $form.find(`[name="${fieldName}"]`);
  if (!$input.length) return true;

  const { errorClass = 'is-invalid', validClass = 'is-valid', smooth = true } = options;
  const val = $input.val();

  $input.removeClass(errorClass).removeClass(validClass);
  $input.siblings('.invalid-feedback').slideUp(150, function () { $(this).remove(); });

  for (const [ruleName, param] of Object.entries(fieldRules)) {
    const ruleFn = customRules[ruleName] || defaultRules[ruleName];
    if (!ruleFn) continue;
    const result = ruleFn(val, param);
    if (result !== true) {
      $input.addClass(errorClass);
      const msg = typeof result === 'string' ? result : `Invalid ${ruleName}.`;
      $(`<div class="invalid-feedback">${msg}</div>`)
        .insertAfter($input)
        .hide()
        .slideDown(200);
      return false;
    }
  }
  $input.addClass(validClass);
  return true;
}

// ----- Full Form Validation -----
export function validate(formSelector, rules = {}, options = {}) {
  const $form = $(formSelector);
  if (!$form.length) {
    console.warn(`Form not found: ${formSelector}`);
    return { destroy: () => {} };
  }

  const {
    errorClass = 'is-invalid',
    validClass = 'is-valid',
    onSubmit,
    preventDefault = true,
    liveValidate = false,
    liveDebounce = 300,
    smooth = true,
  } = options;

  let submitted = false;

  const validateAll = () => {
    let isValid = true;
    Object.entries(rules).forEach(([field, fieldRules]) => {
      if (!validateField($form, field, fieldRules, { errorClass, validClass, smooth })) {
        isValid = false;
      }
    });
    return isValid;
  };

  const submitHandler = function (e) {
    submitted = true;
    if (preventDefault) e.preventDefault();
    if (!validateAll()) {
      const firstInvalid = Object.keys(rules).find(f => $form.find(`[name="${f}"]`).hasClass(errorClass));
      if (firstInvalid) $form.find(`[name="${firstInvalid}"]`).focus();
      return;
    }
    if (onSubmit) {
      const data = serializeForm($form);
      onSubmit(data, e);
    }
  };

  if (liveValidate) {
    let timers = {};
    Object.keys(rules).forEach(field => {
      const $input = $form.find(`[name="${field}"]`);
      if (!$input.length) return;
      $input.on('input change', function () {
        if (!submitted) return;
        clearTimeout(timers[field]);
        timers[field] = setTimeout(() => {
          validateField($form, field, rules[field], { errorClass, validClass, smooth });
        }, liveDebounce);
      });
    });
  }

  $form.on('submit', submitHandler);
  return { destroy: () => $form.off('submit', submitHandler) };
}

// ----- Helpers -----
export function setValues(formSelector, data) {
  const $form = $(formSelector);
  Object.entries(data).forEach(([key, value]) => {
    const $field = $form.find(`[name="${key}"]`);
    if ($field.length) {
      if ($field.is(':checkbox') || $field.is(':radio')) {
        $field.prop('checked', value === $field.val());
      } else {
        $field.val(value);
      }
    }
  });
}

export function clear(formSelector) {
  const $form = $(formSelector);
  $form.find('input,textarea,select').each(function () {
    const $el = $(this);
    if ($el.is(':checkbox, :radio')) $el.prop('checked', false);
    else $el.val('');
    $el.removeClass('is-valid is-invalid');
    $el.siblings('.invalid-feedback').remove();
  });
}

export function mask(selector, pattern) {
  $(selector).on('input', function () {
    let val = $(this).val().replace(/\D/g, '');
    const digits = pattern.replace(/\D/g, '').length;
    if (val.length > digits) val = val.substr(0, digits);
    let formatted = '';
    let valIdx = 0;
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === '0') {
        formatted += val[valIdx] || '';
        valIdx++;
      } else {
        formatted += pattern[i];
      }
    }
    $(this).val(formatted);
  });
}

export function serializeForm(form, asJson = false) {
  const arr = $(form).serializeArray();
  const obj = {};
  arr.forEach(({ name, value }) => {
    if (obj[name] !== undefined) {
      if (!Array.isArray(obj[name])) obj[name] = [obj[name]];
      obj[name].push(value);
    } else obj[name] = value;
  });
  return asJson ? JSON.stringify(obj) : obj;
}

// ----- NEW: Auto‑save, file preview, char counter -----
export function autoSave(formSelector, saveFn, interval = 2000) {
  const $form = $(formSelector);
  let timer;
  $form.on('input change', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const data = serializeForm($form);
      saveFn(data);
    }, interval);
  });
}

export function filePreview(inputSelector, previewSelector) {
  $(inputSelector).on('change', function () {
    const file = this.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => $(previewSelector).attr('src', e.target.result).show();
      reader.readAsDataURL(file);
    }
  });
}

export function charCounter(inputSelector, targetSelector, max) {
  const $input = $(inputSelector);
  const $target = $(targetSelector);
  $input.on('input', () => {
    const len = $input.val().length;
    $target.text(`${len}/${max}`);
    $input.toggleClass('is-invalid', len > max);
  });
}

export function confirmReset(formSelector, message = 'Unsaved changes will be lost. Continue?') {
  const $form = $(formSelector);
  $form.on('reset', e => {
    if (!confirm(message)) e.preventDefault();
  });
}