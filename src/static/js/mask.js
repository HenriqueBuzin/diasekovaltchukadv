/* src/static/js/mask.js */

// ==============================
// 🔥 FUNÇÕES GLOBAIS (REUTILIZÁVEIS)
// ==============================

function formatPhoneBR(d) {
  if (d.length <= 2) return d.replace(/^(\d{0,2})/, '($1');
  if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
  if (d.length === 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
  return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
}

function formatPhoneDisplay(number, withDDI = false) {
  let digits = String(number).replace(/\D/g, '');

  // remove DDI (55)
  if (digits.startsWith('55')) {
    digits = digits.slice(2);
  }

  digits = digits.slice(0, 11);

  if (digits.length < 10) return number;

  const formatted = formatPhoneBR(digits);

  return withDDI ? `+55 ${formatted}` : formatted;
}


// ==============================
// 🚀 INICIALIZAÇÃO GERAL
// ==============================

document.addEventListener('DOMContentLoaded', function () {

  // ==============================
  // 📞 MÁSCARA DO TELEFONE
  // ==============================

  const tel = document.getElementById('tel');
  let lastDigits = '';

  if (tel) {
    function onInput(e) {
      let raw = tel.value.replace(/\D/g, '');
      let cursor = tel.selectionStart;

      let isDelete = e.inputType && e.inputType.includes('delete');

      // impede inserir se já estiver cheio
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

  // ==============================
  // 📞 FORMATA TELEFONES NA PÁGINA
  // ==============================

  document.querySelectorAll('[data-phone]').forEach(el => {
    el.textContent = formatPhoneDisplay(el.dataset.phone, false);
  });

  // ==============================
  // 💬 TRACKING WHATSAPP
  // ==============================

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

      gtag('event', 'conversion', {
        'send_to': 'AW-17913181584/LZUECPCB-pocEJDr1d1C',
        'value': 1.0,
        'currency': 'BRL',
        'event_callback': openOnce
      });

      // fallback
      setTimeout(openOnce, 800);
    });
  });

  // ==============================
  // ✅ VALIDAÇÃO DO FORMULÁRIO
  // ==============================

  document.querySelectorAll('form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!tel) return;

      const digits = tel.value.replace(/\D/g, '');

      if (digits.length !== 10 && digits.length !== 11) {
        alert('Telefone inválido. Use 10 ou 11 dígitos.');
        e.preventDefault();
      }
    });
  });

});
