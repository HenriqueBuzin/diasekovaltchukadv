/* src/static/js/mask.js */

function formatPhoneBR(d) {
  if (d.length <= 2) return d.replace(/^(\d{0,2})/, '($1');
  if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
  if (d.length === 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
  return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
}

function formatPhoneDisplay(number, withDDI = false) {
  let digits = String(number).replace(/\D/g, '');

  if (digits.startsWith('55')) {
    digits = digits.slice(2);
  }

  digits = digits.slice(0, 11);

  if (digits.length < 10) return number;

  const formatted = formatPhoneBR(digits);

  return withDDI ? `+55 ${formatted}` : formatted;
}

document.addEventListener('DOMContentLoaded', function () {
  const tel = document.getElementById('tel');
  let lastDigits = '';

  const validators = {
    name: function (value) {
      if (!value.trim()) return 'Informe seu nome.';
      if (value.trim().length < 3) return 'Informe pelo menos 3 caracteres.';
      return '';
    },
    email: function (value) {
      const email = value.trim();
      if (!email) return 'Informe seu e-mail.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return 'Informe um e-mail válido.';
      return '';
    },
    tel: function (value) {
      const digits = value.replace(/\D/g, '');
      if (!digits) return 'Informe seu telefone.';
      if (digits.length !== 10 && digits.length !== 11) return 'Use DDD + telefone com 10 ou 11 dígitos.';
      return '';
    },
    subject: function (value) {
      if (!value.trim()) return 'Informe o assunto.';
      if (value.trim().length < 3) return 'Descreva melhor o assunto.';
      return '';
    },
    message: function (value) {
      if (!value.trim()) return 'Escreva um resumo do caso.';
      if (value.trim().length < 10) return 'Escreva pelo menos 10 caracteres.';
      return '';
    }
  };

  function setFieldError(field, message) {
    const error = document.querySelector(`[data-error-for="${field.id}"]`);
    field.classList.toggle('is-invalid', Boolean(message));
    field.setAttribute('aria-invalid', message ? 'true' : 'false');

    if (error) {
      error.textContent = message;
    }
  }

  function validateField(field) {
    const validator = validators[field.id];
    if (!validator) return true;

    const message = validator(field.value);
    setFieldError(field, message);
    return !message;
  }

  if (tel) {
    function onInput(e) {
      let raw = tel.value.replace(/\D/g, '');
      let cursor = tel.selectionStart;

      let isDelete = e.inputType && e.inputType.includes('delete');

      if (!isDelete && lastDigits.length === 11) {
        tel.value = formatPhoneBR(lastDigits);
        tel.setSelectionRange(cursor - 1, cursor - 1);
        return;
      }

      let digits = raw.slice(0, 11);

      let digitsBeforeCursor = tel.value
        .slice(0, cursor)
        .replace(/\D/g, '').length;

      let formatted = formatPhoneBR(digits);
      tel.value = formatted;

      let pos = 0, count = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) count++;
        if (count >= digitsBeforeCursor) {
          pos = i + 1;
          break;
        }
      }

      tel.setSelectionRange(pos, pos);
      lastDigits = digits;
    }

    tel.addEventListener('input', onInput);
  }

  document.querySelectorAll('[data-phone]').forEach(el => {
    el.textContent = formatPhoneDisplay(el.dataset.phone, false);
  });

  document.querySelectorAll('.wa-track').forEach(el => {
    el.addEventListener('click', function (e) {
      e.preventDefault();

      const url = el.href;
      let opened = false;

      function openOnce() {
        if (opened) return;
        opened = true;
        window.open(url, '_blank', 'noopener,noreferrer');
      }

      if (typeof gtag === 'function') {
        gtag('event', 'conversion', {
          'send_to': 'AW-17913181584/LZUECPCB-pocEJDr1d1C',
          'value': 1.0,
          'currency': 'BRL',
          'event_callback': openOnce
        });
      } else {
        openOnce();
      }

      setTimeout(openOnce, 800);
    });
  });

  document.querySelectorAll('form').forEach(function (form) {
    form.querySelectorAll('#name, #email, #tel, #subject, #message').forEach(function (field) {
      field.addEventListener('blur', function () {
        validateField(field);
      });

      field.addEventListener('input', function () {
        if (field.classList.contains('is-invalid')) {
          validateField(field);
        }
      });
    });

    form.addEventListener('submit', function (e) {
      const fields = Array.from(form.querySelectorAll('#name, #email, #tel, #subject, #message'));
      const isValid = fields.map(validateField).every(Boolean);

      if (!isValid) {
        e.preventDefault();
        const firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) {
          firstInvalid.focus();
        }
      }
    });
  });
});
