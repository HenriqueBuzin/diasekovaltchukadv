/* src/static/js/captcha.js */

// habilita/desabilita o botão de envio conforme o Turnstile
(function () {
  function setBtnEnabled(enabled) {
    var btn = document.getElementById('submitBtn');
    if (!btn) return;
    if (enabled) btn.removeAttribute('disabled');
    else btn.setAttribute('disabled', 'disabled');
  }

  // callbacks globais chamados pelo Turnstile (definidos no data-* do widget)
  window.onTurnstileOk = function () {
    setBtnEnabled(true);
  };

  window.onTurnstileExpired = function () {
    setBtnEnabled(false);
  };

  window.onTurnstileError = function () {
    setBtnEnabled(false);
  };

  // garantia: se o captcha estiver desabilitado no servidor, o botão não deve começar disabled
  document.addEventListener('DOMContentLoaded', function () {
    // nada a fazer aqui quando CAPTCHA_ENABLED=true,
    // pois o botão já inicia disabled no HTML e será habilitado pelo callback
  });
})();
