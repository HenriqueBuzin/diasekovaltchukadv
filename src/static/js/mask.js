/* src/static/js/mask.js */

(function () {
  function formatPhoneBR(digits) {
    if (!digits) return '';
    if (digits.length <= 2) return digits.replace(/^(\d{0,2})/, '($1');
    if (digits.length <= 6) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2);
    if (digits.length === 10) {
      return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 6) + '-' + digits.slice(6);
    }
    return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 7) + '-' + digits.slice(7);
  }

  function formatPhoneDisplay(number) {
    let digits = String(number).replace(/\D/g, '');

    if (digits.startsWith('55')) {
      digits = digits.slice(2);
    }

    digits = digits.slice(0, 11);
    return digits.length < 10 ? number : formatPhoneBR(digits);
  }

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

  function initContactPage() {
    const tel = document.getElementById('tel');
    let lastDigits = '';

    if (tel) {
      tel.addEventListener('input', function (event) {
        const raw = tel.value.replace(/\D/g, '');
        const cursor = tel.selectionStart;
        const isDelete = event.inputType && event.inputType.includes('delete');

        if (!isDelete && lastDigits.length === 11) {
          tel.value = formatPhoneBR(lastDigits);
          tel.setSelectionRange(cursor - 1, cursor - 1);
          return;
        }

        const digits = raw.slice(0, 11);
        const digitsBeforeCursor = tel.value.slice(0, cursor).replace(/\D/g, '').length;
        const formatted = formatPhoneBR(digits);
        tel.value = formatted;

        let position = 0;
        let count = 0;
        for (let index = 0; index < formatted.length; index += 1) {
          if (/\d/.test(formatted[index])) count += 1;
          if (count >= digitsBeforeCursor) {
            position = index + 1;
            break;
          }
        }

        tel.setSelectionRange(position, position);
        lastDigits = digits;
      });
    }

    document.querySelectorAll('[data-phone]').forEach(function (element) {
      element.textContent = formatPhoneDisplay(element.dataset.phone);
    });

    document.querySelectorAll('.wa-track').forEach(function (element) {
      element.addEventListener('click', function (event) {
        event.preventDefault();

        const url = element.href;
        let opened = false;

        function openOnce() {
          if (opened) return;
          opened = true;
          window.open(url, '_blank', 'noopener,noreferrer');
        }

        if (typeof window.gtag === 'function') {
          window.gtag('event', 'conversion', {
            send_to: 'AW-17913181584/LZUECPCB-pocEJDr1d1C',
            value: 1.0,
            currency: 'BRL',
            event_callback: openOnce
          });
        } else {
          openOnce();
        }

        setTimeout(openOnce, 800);
      });
    });

    document.querySelectorAll('form').forEach(function (form) {
      const fields = form.querySelectorAll('#name, #email, #tel, #subject, #message');

      fields.forEach(function (field) {
        field.addEventListener('blur', function () {
          validateField(field);
        });

        field.addEventListener('input', function () {
          if (field.classList.contains('is-invalid')) {
            validateField(field);
          }
        });
      });

      form.addEventListener('submit', function (event) {
        const isValid = Array.from(fields).map(validateField).every(Boolean);

        if (!isValid) {
          event.preventDefault();
          const firstInvalid = form.querySelector('.is-invalid');
          if (firstInvalid) firstInvalid.focus();
        }
      });
    });
  }

  window.DKContact = {
    formatPhoneBR,
    formatPhoneDisplay,
    initContactPage,
    validateField
  };

  document.addEventListener('DOMContentLoaded', initContactPage, { once: true });
})();
