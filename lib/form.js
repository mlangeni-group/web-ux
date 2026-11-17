import $ from 'jquery';

const defaultRules = {
  required: (value, enabled = true) => {
    if (enabled === false || enabled === null || enabled === undefined) return true;

    const normalized = Array.isArray(value) ? value.filter(Boolean) : value;
    const stringValue = normalized == null ? '' : String(normalized).trim();

    return stringValue.length > 0 ? true : 'This field is required.';
  },
  minlength: (value, len) => {
    if (len === false || len === null || len === undefined) return true;
    const length = Array.isArray(value) ? value.length : String(value ?? '').length;
    return length >= Number(len) ? true : `Minimum ${len} characters required.`;
  },
  maxlength: (value, len) => {
    if (len === false || len === null || len === undefined) return true;
    const length = Array.isArray(value) ? value.length : String(value ?? '').length;
    return length <= Number(len) ? true : `Maximum ${len} characters allowed.`;
  },
  email: (value) => {
    if (value === null || value === undefined || String(value).trim() === '') return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim()) ? true : 'Invalid email address.';
  },
  url: (value) => {
    if (value === null || value === undefined || String(value).trim() === '') return true;
    try {
      new URL(String(value));
      return true;
    } catch {
      return 'Invalid URL.';
    }
  },
  pattern: (value, regex) => {
    if (!regex) return true;
    const pattern = typeof regex === 'string' ? new RegExp(regex) : regex;
    if (pattern.global || pattern.sticky) pattern.lastIndex = 0;
    return pattern.test(String(value ?? '')) ? true : 'Invalid format.';
  },
  match: (value, target, form) => {
    if (!target) return true;
    const targetValue = resolveTargetValue(target, form);
    return String(value ?? '') === String(targetValue ?? '') ? true : 'Values do not match.';
  },
};

const customRules = {};

function normalizeFieldValue(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.filter(item => item !== null && item !== undefined && item !== '');
  return String(value);
}

function resolveField($form, fieldName) {
  if (!fieldName) return $();
  const selector = `[name="${fieldName}"]`;
  const $field = $form.find(selector).first();
  return $field.length ? $field : $();
}

function resolveTargetValue(target, form = document) {
  if (!target) return '';

  if (target instanceof HTMLElement || target instanceof SVGElement) {
    return $(target).val();
  }

  if (target instanceof $) {
    return target.first().val();
  }

  if (typeof target === 'function') {
    return target();
  }

  if (typeof target === 'string') {
    const $target = $(form).find(`[name="${target}"]`).first();
    if ($target.length) return $target.val();
    const $selectorTarget = $(target).first();
    if ($selectorTarget.length) return $selectorTarget.val();
    return target;
  }

  return target;
}

function getInputValue($input) {
  if (!$input || !$input.length) return '';

  if ($input.is(':checkbox, :radio')) {
    const checkedValues = $input.filter(':checked').map(function () {
      return $(this).val();
    }).get();
    return checkedValues;
  }

  if ($input.is('select[multiple]')) {
    return $input.val() ?? [];
  }

  const value = $input.val();
  return value === undefined || value === null ? '' : value;
}

function removeValidationState($input, errorClass, validClass) {
  $input.removeClass(errorClass).removeClass(validClass);
  $input.removeAttr('aria-invalid');
  $input.siblings('.invalid-feedback').slideUp(150, function () {
    $(this).remove();
  });
}

function showValidationError($input, message, options = {}) {
  const { errorClass = 'is-invalid', smooth = true } = options;
  $input.addClass(errorClass).attr('aria-invalid', 'true');

  const $existing = $input.siblings('.invalid-feedback');
  if ($existing.length) $existing.remove();

  const $feedback = $('<div class="invalid-feedback">').text(message);
  $feedback.insertAfter($input);

  if (smooth) {
    $feedback.hide().slideDown(200);
  } else {
    $feedback.show();
  }
}

export function addRule(name, ruleFn) {
  if (!name || typeof ruleFn !== 'function') {
    throw new Error('A rule name and a validation function are required.');
  }

  customRules[name] = ruleFn;
}

export function validateField(form, fieldName, fieldRules, options = {}) {
  const $form = $(form);
  const $input = resolveField($form, fieldName);

  if (!$input.length || !fieldRules || typeof fieldRules !== 'object') {
    return true;
  }

  const {
    errorClass = 'is-invalid',
    validClass = 'is-valid',
    smooth = true,
  } = options;

  const value = getInputValue($input);
  removeValidationState($input, errorClass, validClass);

  for (const [ruleName, param] of Object.entries(fieldRules)) {
    if (param === false || param === null || param === undefined) continue;

    const ruleFn = customRules[ruleName] || defaultRules[ruleName];
    if (!ruleFn) continue;

    const result = ruleFn(value, param, $form, $input);
    if (result !== true) {
      showValidationError($input, typeof result === 'string' ? result : `Invalid ${ruleName}.`, { errorClass, smooth });
      return false;
    }
  }

  $input.addClass(validClass).removeAttr('aria-invalid');
  return true;
}

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
  let timers = {};

  const validateAll = () => {
    let isValid = true;
    Object.entries(rules).forEach(([field, fieldRules]) => {
      if (!validateField($form, field, fieldRules, { errorClass, validClass, smooth })) {
        isValid = false;
      }
    });
    return isValid;
  };

  const submitHandler = function (event) {
    submitted = true;
    if (preventDefault) event.preventDefault();

    if (!validateAll()) {
      const firstInvalid = Object.keys(rules).find(field => {
        const $field = resolveField($form, field);
        return $field.hasClass(errorClass);
      });

      if (firstInvalid) {
        const $field = resolveField($form, firstInvalid);
        if ($field.length) $field.focus();
      }
      return;
    }

    if (onSubmit) {
      const data = serializeForm($form);
      onSubmit(data, event);
    }
  };

  if (liveValidate) {
    Object.keys(rules).forEach(field => {
      const $input = resolveField($form, field);
      if (!$input.length) return;

      const handler = function () {
        if (!submitted) return;
        clearTimeout(timers[field]);
        timers[field] = setTimeout(() => {
          validateField($form, field, rules[field], { errorClass, validClass, smooth });
        }, liveDebounce);
      };

      $input.on('input change blur', handler);
    });
  }

  $form.on('submit', submitHandler);

  return {
    destroy: () => {
      Object.keys(timers).forEach(key => clearTimeout(timers[key]));
      $form.off('submit', submitHandler);
      if (liveValidate) {
        Object.keys(rules).forEach(field => {
          const $input = resolveField($form, field);
          if ($input.length) $input.off('input change blur');
        });
      }
    },
  };
}

export function setValues(formSelector, data) {
  const $form = $(formSelector);
  Object.entries(data).forEach(([key, value]) => {
    const $field = resolveField($form, key);
    if (!$field.length) return;

    if ($field.is(':checkbox') || $field.is(':radio')) {
      const values = Array.isArray(value) ? value : [value];
      $field.prop('checked', values.includes($field.val()));
      return;
    }

    if ($field.is('select[multiple]')) {
      $field.val(Array.isArray(value) ? value : [value]);
      return;
    }

    $field.val(value);
  });
}

export function clear(formSelector) {
  const $form = $(formSelector);
  if (!$form.length) return;

  $form.find('input, textarea, select').each(function () {
    const $el = $(this);

    if ($el.is(':checkbox, :radio')) {
      $el.prop('checked', false);
    } else if ($el.is('input[type="file"]')) {
      this.value = '';
    } else {
      $el.val('');
    }

    $el.removeClass('is-valid is-invalid');
    $el.removeAttr('aria-invalid');
    $el.siblings('.invalid-feedback').remove();
  });
}

export function mask(selector, pattern) {
  if (!pattern || typeof pattern !== 'string') return;

  $(selector).on('input', function () {
    let value = $(this).val() || '';
    value = value.replace(/\D/g, '');

    const digits = pattern.replace(/\D/g, '').length;
    if (value.length > digits) value = value.slice(0, digits);

    let formatted = '';
    let valueIndex = 0;

    for (let index = 0; index < pattern.length; index++) {
      if (pattern[index] === '0') {
        formatted += value[valueIndex] || '';
        valueIndex += 1;
      } else {
        formatted += pattern[index];
      }
    }

    $(this).val(formatted);
  });
}

export function serializeForm(form, asJson = false) {
  const $form = $(form);
  const arr = $form.serializeArray();
  const obj = {};

  arr.forEach(({ name, value }) => {
    if (obj[name] !== undefined) {
      if (!Array.isArray(obj[name])) obj[name] = [obj[name]];
      obj[name].push(value);
    } else {
      obj[name] = value;
    }
  });

  return asJson ? JSON.stringify(obj) : obj;
}

export function autoSave(formSelector, saveFn, interval = 2000) {
  const $form = $(formSelector);
  if (!$form.length) return { destroy: () => {} };

  let timer;
  const handler = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (typeof saveFn !== 'function') return;
      const payload = serializeForm($form);
      saveFn(payload);
    }, interval);
  };

  $form.on('input change', handler);

  return {
    destroy: () => {
      clearTimeout(timer);
      $form.off('input change', handler);
    },
  };
}

export function filePreview(inputSelector, previewSelector) {
  $(inputSelector).on('change', function () {
    const file = this.files && this.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      $(previewSelector).attr('src', event.target.result).show();
    };
    reader.readAsDataURL(file);
  });
}

export function charCounter(inputSelector, targetSelector, max) {
  const $input = $(inputSelector);
  const $target = $(targetSelector);

  if (!$input.length || !$target.length) return;

  const updateCounter = () => {
    const value = $input.val() ?? '';
    const length = String(value).length;
    $target.text(`${length}/${max}`);
    $input.toggleClass('is-invalid', typeof max === 'number' && length > max);
  };

  $input.on('input', updateCounter);
  updateCounter();
}

export function confirmReset(formSelector, message = 'Unsaved changes will be lost. Continue?') {
  const $form = $(formSelector);
  if (!$form.length) return;

  $form.on('reset', (event) => {
    if (window.confirm && !window.confirm(message)) {
      event.preventDefault();
    }
  });
}