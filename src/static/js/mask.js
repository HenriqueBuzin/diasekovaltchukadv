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

  // remove DDI (55) se existir
  if (digits.startsWith('55')) {
    digits = digits.slice(2);
  }

  // limita
  digits = digits.slice(0, 11);

  // evita quebrar número incompleto
  if (digits.length < 10) return number;

  let formatted = formatPhoneBR(digits);

  return withDDI ? `+55 ${formatted}` : formatted;
}


// ==============================
// 📞 MÁSCARA + VALIDAÇÃO DO FORM
// ==============================

document.addEventListener('DOMContentLoaded', function () {
  var tel = document.getElementById('tel');
  if (!tel) return;

  let lastDigits = '';

  function onInput(e) {
    let input = tel;
    let raw = input.value.replace(/\D/g, '');
    let cursor = input.selectionStart;

    let isDelete = e.inputType && e.inputType.includes('delete');

    // 🔥 impede inserir se já está cheio
    if (!isDelete && lastDigits.length === 11) {
      input.value = formatPhoneBR(lastDigits);
      input.setSelectionRange(cursor - 1, cursor - 1);
      return;
    }

    // limita a 11 dígitos
    let digits = raw.slice(0, 11);

    // calcula posição lógica do cursor
    let digitsBeforeCursor = input.value
      .slice(0, cursor)
      .replace(/\D/g, '').length;

    // aplica máscara
    let formatted = formatPhoneBR(digits);
    input.value = formatted;

    // reposiciona cursor corretamente
    let pos = 0, count = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) count++;
      if (count >= digitsBeforeCursor) {
        pos = i + 1;
        break;
      }
    }

    input.setSelectionRange(pos, pos);

    // salva estado
    lastDigits = digits;
  }

  tel.addEventListener('input', onInput);

  // ==============================
  // ✅ VALIDAÇÃO NO SUBMIT
  // ==============================

  document.querySelectorAll('form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      var digits = tel.value.replace(/\D/g, '');

      if (digits.length !== 10 && digits.length !== 11) {
        alert('Telefone inválido. Use 10 ou 11 dígitos.');
        e.preventDefault();
      }
    });
  });

});

document.addEventListener('DOMContentLoaded', function () {
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

      gtag('event','conversion', {
        'send_to': 'AW-17913181584/LZUECPCB-pocEJDr1d1C',
        'value': 1.0,
        'currency': 'BRL',
        'event_callback': openOnce
      });

      setTimeout(openOnce, 800);
    });
  });
});
