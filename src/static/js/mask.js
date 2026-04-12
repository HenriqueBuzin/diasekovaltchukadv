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

    // pega só números
    var digits = input.value.replace(/\D/g, '').slice(0, 11);

    // formata
    var formatted = formatPhoneBR(digits);

    input.value = formatted;

    // 🔥 força cursor sempre no final
    input.setSelectionRange(formatted.length, formatted.length);
  }

  tel.addEventListener('input', onInput);
  tel.addEventListener('blur', onInput);

  // 🔒 trava cursor sempre no final (teclado)
  tel.addEventListener('keydown', function (e) {
    var allowed = ['Backspace', 'Delete', 'Tab'];

    // permite Ctrl/Cmd (copiar, colar, etc)
    if (e.ctrlKey || e.metaKey) return;

    if (!allowed.includes(e.key)) {
      var len = tel.value.length;
      tel.setSelectionRange(len, len);
    }
  });

  // 🔒 trava clique no meio (mouse)
  tel.addEventListener('click', function () {
    var len = tel.value.length;
    tel.setSelectionRange(len, len);
  });

  // 🔒 evita seleção de texto
  tel.addEventListener('select', function () {
    var len = tel.value.length;
    tel.setSelectionRange(len, len);
  });

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
