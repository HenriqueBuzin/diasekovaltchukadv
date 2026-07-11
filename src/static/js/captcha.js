/* src/static/js/captcha.js */

(function () {
  function setSubmitEnabled(enabled) {
    const button = document.getElementById('submitBtn');
    if (button) button.disabled = !enabled;
  }

  window.onTurnstileOk = function () {
    setSubmitEnabled(true);
  };

  window.onTurnstileExpired = function () {
    setSubmitEnabled(false);
  };

  window.onTurnstileError = function () {
    setSubmitEnabled(false);
  };
})();
