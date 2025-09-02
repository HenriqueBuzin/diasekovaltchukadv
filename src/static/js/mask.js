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

  function onInput() {
    var before = tel.value;
    tel.value = formatPhoneBR(before);
    // coloca o cursor no fim (simples e seguro)
    tel.selectionStart = tel.selectionEnd = tel.value.length;
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
