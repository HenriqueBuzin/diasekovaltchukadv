/* src/static/js/scroll.js */

// navegação suave pelos anchors do menu
$(function () {
  $('.nav-item a[href^="#"]').on('click', function (e) {
    e.preventDefault();
    var id = $(this).attr('href');
    var $target = $(id);
    if ($target.length) {
      $('html, body').animate({ scrollTop: $target.offset().top - 100 }, 500);
    }
  });
});
