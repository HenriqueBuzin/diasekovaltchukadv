/* src/static/js/mask.js */

// máscara e validação do telefone (BR)
document.addEventListener('DOMContentLoaded', function () {
  var tel = document.getElementById('tel');
  if (!tel) return;

  function formatPhoneBR(value) {
    var d = value.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d.replace(/^(\d{0,2})/, '($1');
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length === 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  function onInput(e) {
    var input = tel;
    var oldValue = input.value;
    var oldCursor = input.selectionStart;

    // pega dígitos antes do cursor
    var digitsBeforeCursor = oldValue.slice(0, oldCursor).replace(/\D/g, '').length;

    // pega todos os dígitos
    var digits = oldValue.replace(/\D/g, '').slice(0, 11);

    // formata
    var newValue = formatPhoneBR(digits);

    input.value = newValue;

    // reposiciona cursor corretamente
    var cursor = 0;
    var digitsCount = 0;

    for (var i = 0; i < newValue.length; i++) {
      if (/\d/.test(newValue[i])) {
        digitsCount++;
      }
      if (digitsCount >= digitsBeforeCursor) {
        cursor = i + 1;
        break;
      }
    }

    input.setSelectionRange(cursor, cursor);
  }

  tel.addEventListener('input', onInput);
  tel.addEventListener('blur', onInput);

  // valida no submit (10 ou 11 dígitos)
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
