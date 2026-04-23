/* Demo pages only — not for Canvas theme. Re-typeset MathJax when tabs or
   expand panels reveal content that was display:none when MathJax first ran. */
(function () {
  'use strict';

  function mjTypeset(nodes) {
    if (!window.MathJax || !MathJax.typesetPromise) return Promise.resolve();
    return MathJax.typesetPromise(nodes || undefined).catch(function () {});
  }

  window.addEventListener('load', function () {
    mjTypeset().then(function () {
      document.querySelectorAll('.cfa-tabs__tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
          var id = tab.getAttribute('aria-controls');
          var panel = id && document.getElementById(id);
          if (panel) {
            requestAnimationFrame(function () {
              mjTypeset([panel]);
            });
          }
        });
      });

      document.querySelectorAll('.cfa-expand__trigger').forEach(function (tr) {
        tr.addEventListener('click', function () {
          requestAnimationFrame(function () {
            var box = tr.closest('.cfa-expand');
            if (box && box.hasAttribute('data-open')) {
              var body = box.querySelector('.cfa-expand__body');
              if (body) mjTypeset([body]);
            }
          });
        });
      });
    });
  });
})();
