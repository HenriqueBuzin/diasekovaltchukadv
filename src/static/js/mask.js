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
    var start = tel.selectionStart;
    var before = tel.value;

    var digitsBefore = before.slice(0, start).replace(/\D/g, '').length;

    tel.value = formatPhoneBR(before);

    // calcula nova posição baseada na quantidade de números digitados
    var newPos = 0;
    var count = 0;

    for (var i = 0; i < tel.value.length; i++) {
      if (/\d/.test(tel.value[i])) {
        count++;
      }
      if (count >= digitsBefore) {
        newPos = i + 1;
        break;
      }
    }

    tel.setSelectionRange(newPos, newPos);
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
