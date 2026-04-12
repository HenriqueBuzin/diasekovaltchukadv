/* src/static/js/mask.js */

// máscara e validação do telefone (BR)
document.addEventListener('DOMContentLoaded', function () {
  var tel = document.getElementById('tel');
  if (!tel) return;

  let lastDigits = '';

  function formatPhoneBR(d) {
    if (d.length <= 2) return d.replace(/^(\d{0,2})/, '($1');
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length === 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  function onInput(e) {
    let input = tel;
    let raw = input.value.replace(/\D/g, '');
    let cursor = input.selectionStart;

    let isDelete = e.inputType && e.inputType.includes('delete');

    // 🔥 se já está cheio e NÃO é delete → ignora input
    if (!isDelete && lastDigits.length === 11) {
      input.value = formatPhoneBR(lastDigits);
      input.setSelectionRange(cursor - 1, cursor - 1);
      return;
    }

    // limita
    let digits = raw.slice(0, 11);

    // calcula posição lógica
    let digitsBeforeCursor = input.value.slice(0, cursor).replace(/\D/g, '').length;

    // formata
    let formatted = formatPhoneBR(digits);
    input.value = formatted;

    // reposiciona cursor
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
