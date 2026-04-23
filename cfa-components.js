/* ================================================================
   CFA Canvas Component Library  —  cfa-components.js  v2.2
   ─────────────────────────────────────────────────────────────
   Canvas deployment : Admin > Themes > Custom JavaScript (paste all)
   Local dev         : <script src="cfa-components.js"></script>
   ─────────────────────────────────────────────────────────────
   Handles:
     - .cfa-expand         toggle open/closed; wires aria-controls + panel id
     - .cfa-accordion      open-all / close-all controls
     - .cfa-tabs           activate panels, keyboard navigation

   No JS needed for:
     .cfa-equation, .cfa-list, .cfa-callout,
     .cfa-box, .cfa-compare, .cfa-quote
   ================================================================ */
   (function () {
    'use strict';

    var cfaExpandPanelSeq = 0;
  
    /* ================================================================
       init()
       Binds all component behaviours. Safe to call multiple times —
       uses data-cfa-bound guards to avoid double-binding.
       Called on DOMContentLoaded and on Canvas Turbo navigation events.
       ================================================================ */
    function init() {
  
      /* ----------------------------------------------------------------
         EXPANDABLE BOXES   .cfa-expand
         Toggles data-open attribute + aria-expanded on the trigger.
         If the trigger has no aria-controls, assigns panel id + aria-controls.
         Works standalone and when nested inside .cfa-accordion or
         .cfa-exploration panels.
         ---------------------------------------------------------------- */
      document.querySelectorAll('.cfa-expand__trigger').forEach(function (trigger) {
        if (trigger.dataset.cfaBound) return;
        trigger.dataset.cfaBound = '1';

        var box = trigger.closest('.cfa-expand');
        if (box && !trigger.hasAttribute('aria-controls')) {
          var panel = box.querySelector('.cfa-expand__body');
          if (panel) {
            if (!panel.id) {
              cfaExpandPanelSeq += 1;
              panel.id = 'cfa-expand-panel-' + cfaExpandPanelSeq;
            }
            trigger.setAttribute('aria-controls', panel.id);
          }
        }

        trigger.addEventListener('click', function () {
          var box    = this.closest('.cfa-expand');
          var isOpen = box.hasAttribute('data-open');
  
          if (isOpen) {
            box.removeAttribute('data-open');
            this.setAttribute('aria-expanded', 'false');
          } else {
            box.setAttribute('data-open', '');
            this.setAttribute('aria-expanded', 'true');
          }
        });
      });
  
  
      /* ----------------------------------------------------------------
         ACCORDION CONTROLS   data-cfa-open-all / data-cfa-close-all
         Scoped to the nearest sibling .cfa-accordion element.
         If no sibling accordion is found, falls back to the whole page
         (allows a single page-level open-all pattern if needed).
         ---------------------------------------------------------------- */
      document.querySelectorAll('[data-cfa-open-all]').forEach(function (btn) {
        if (btn.dataset.cfaBound) return;
        btn.dataset.cfaBound = '1';
  
        btn.addEventListener('click', function () {
          var scope = getSiblingAccordion(this);
          scope.querySelectorAll('.cfa-expand').forEach(function (box) {
            box.setAttribute('data-open', '');
            var t = box.querySelector('.cfa-expand__trigger');
            if (t) t.setAttribute('aria-expanded', 'true');
          });
        });
      });
  
      document.querySelectorAll('[data-cfa-close-all]').forEach(function (btn) {
        if (btn.dataset.cfaBound) return;
        btn.dataset.cfaBound = '1';
  
        btn.addEventListener('click', function () {
          var scope = getSiblingAccordion(this);
          scope.querySelectorAll('.cfa-expand').forEach(function (box) {
            box.removeAttribute('data-open');
            var t = box.querySelector('.cfa-expand__trigger');
            if (t) t.setAttribute('aria-expanded', 'false');
          });
        });
      });
  
  
      /* ----------------------------------------------------------------
         TABS   .cfa-tabs
         Manages aria-selected, tabIndex, and data-active panel.
         Keyboard: ArrowLeft / ArrowRight / Home / End (ARIA spec).
         Also closes any open .cfa-expand inside panels being hidden,
         so users always arrive at a fresh question state.
         ---------------------------------------------------------------- */
      document.querySelectorAll('.cfa-tabs').forEach(function (tabGroup) {
        if (tabGroup.dataset.cfaBound) return;
        tabGroup.dataset.cfaBound = '1';
  
        var tabs   = Array.from(tabGroup.querySelectorAll('.cfa-tabs__tab'));
        var panels = Array.from(tabGroup.querySelectorAll('.cfa-tabs__panel'));
  
        function activate(idx) {
          /* Update tabs */
          tabs.forEach(function (t, i) {
            var selected = i === idx;
            t.setAttribute('aria-selected', selected ? 'true' : 'false');
            t.tabIndex = selected ? 0 : -1;
          });
  
          /* Update panels */
          panels.forEach(function (p, i) {
            if (i === idx) {
              p.setAttribute('data-active', '');
            } else {
              p.removeAttribute('data-active');
              /* Close any open expanders in hidden panels */
              p.querySelectorAll('.cfa-expand[data-open]').forEach(function (box) {
                box.removeAttribute('data-open');
                var t = box.querySelector('.cfa-expand__trigger');
                if (t) t.setAttribute('aria-expanded', 'false');
              });
            }
          });
        }
  
        /* Initialise: honour any tab that already has aria-selected="true",
           otherwise default to the first tab */
        var preSelected = tabs.findIndex(function (t) {
          return t.getAttribute('aria-selected') === 'true';
        });
        activate(preSelected >= 0 ? preSelected : 0);
  
        /* Event listeners */
        tabs.forEach(function (tab, i) {
          tab.addEventListener('click', function () {
            activate(i);
          });
  
          tab.addEventListener('keydown', function (e) {
            var len = tabs.length;
            var target = -1;
  
            if (e.key === 'ArrowRight') { target = (i + 1) % len; }
            if (e.key === 'ArrowLeft')  { target = (i - 1 + len) % len; }
            if (e.key === 'Home')       { target = 0; }
            if (e.key === 'End')        { target = len - 1; }
  
            if (target >= 0) {
              e.preventDefault();
              tabs[target].focus();
              activate(target);
            }
          });
        });
      });
  
    } /* end init() */
  
  
    /* ================================================================
       Helpers
       ================================================================ */
  
    /* getSiblingAccordion(button)
       Walks up to .cfa-accordion__controls, then looks at the next
       sibling element. If that sibling is a .cfa-accordion, returns it.
       Otherwise returns document as a page-wide fallback. */
    function getSiblingAccordion(btn) {
      var ctrl    = btn.closest('.cfa-accordion__controls');
      var sibling = ctrl ? ctrl.nextElementSibling : null;
      return (sibling && sibling.classList.contains('cfa-accordion'))
        ? sibling
        : document;
    }
  
  
    /* ================================================================
       Boot
       Run immediately if DOM is ready, otherwise wait for load.
       Re-runs on Canvas Turbo / Turbolinks SPA navigation events
       so components on dynamically-loaded pages still initialise.
       ================================================================ */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  
    document.addEventListener('turbolinks:load', init);  /* Canvas older */
    document.addEventListener('turbo:load',      init);  /* Canvas newer */
  
  })();