/* src/static/js/script.js */

$('.nav-item a[href^="#"]').on('click', function (e) {
    e.preventDefault();
    var id = $(this).attr('href'),
        targetOffset = $(id).offset().top;
    $('html, body').animate({ scrollTop: targetOffset - 100 }, 500);
});

document.addEventListener('DOMContentLoaded', function () {
    var tel = document.getElementById('tel');
    if (!tel) return;

    function formatPhoneBR(value) {
        var d = value.replace(/\D/g, '').slice(0, 11);
        if (d.length <= 2) return d.replace(/^(\d{0,2})/, '($1');
        if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
        if (d.length === 10) {
            return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6, 10);
        }
        // 11 dígitos
        return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7, 11);
    }

    function onInput() {
        var start = tel.selectionStart;
        var before = tel.value;
        tel.value = formatPhoneBR(before);

        tel.selectionStart = tel.selectionEnd = tel.value.length;
    }

    tel.addEventListener('input', onInput);
    tel.addEventListener('blur', onInput);

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
