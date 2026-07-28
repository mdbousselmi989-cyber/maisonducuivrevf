// Maison du Cuivre — synchronise TOUT menu déroulant "Catégorie" trouvé sur
// la page (formulaires, popups de personnalisation, filtres...) avec les
// catégories personnalisées définies dans l'admin, sans dépendre de render.js.
//
// À inclure sur CHAQUE page publique, APRÈS js/site-data.js, js/render.js
// et js/main.js (donc en tout dernier dans la liste des <script>).
(function () {
  "use strict";

  function getData() {
    if (window.MDC && typeof window.MDC.getData === "function") {
      return window.MDC.getData();
    }
    return window.MDC_DEFAULT_DATA || {};
  }

  function getCategories() {
    var data = getData();
    if (data.categories && data.categories.length) return data.categories;
    return [
      { value: "plateaux", label: "Plateaux" },
      { value: "table", label: "Art de la table" },
      { value: "luminaires", label: "Luminaires" },
      { value: "decoration", label: "Décoration" }
    ];
  }

  function normalize(str) {
    return String(str || "")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  // Un <select> est considéré "catégorie" si son name/id le suggère,
  // ou si un texte proche (label, ou parent) contient le mot "categorie".
  function looksLikeCategorySelect(select) {
    var attrs = (select.name || "") + " " + (select.id || "");
    if (normalize(attrs).indexOf("categ") !== -1) return true;

    if (select.id) {
      var label = document.querySelector('label[for="' + select.id + '"]');
      if (label && normalize(label.textContent).indexOf("categ") !== -1) return true;
    }

    var parent = select.closest(".field, .form-group, div, label");
    if (parent && normalize(parent.textContent).indexOf("categ") !== -1) return true;

    return false;
  }

  function syncSelect(select, categories) {
    var previousValue = select.value;

    var hasAll = Array.prototype.some.call(select.options, function (o) {
      return o.value === "all" || o.value === "";
    });

    select.innerHTML = "";

    if (hasAll) {
      var allOpt = document.createElement("option");
      allOpt.value = "all";
      allOpt.textContent = "Toutes les catégories";
      select.appendChild(allOpt);
    }

    categories.forEach(function (cat) {
      var opt = document.createElement("option");
      opt.value = cat.value;
      opt.textContent = cat.label;
      select.appendChild(opt);
    });

    var stillExists = Array.prototype.some.call(select.options, function (o) {
      return o.value === previousValue;
    });
    if (stillExists) select.value = previousValue;
  }

  function syncAllCategoryDropdowns() {
    var categories = getCategories();
    document.querySelectorAll("select").forEach(function (select) {
      if (looksLikeCategorySelect(select)) {
        syncSelect(select, categories);
      }
    });
  }

  function run() {
    syncAllCategoryDropdowns();
    // Certains menus (popups de personnalisation) ne sont ajoutés au DOM
    // qu'à l'ouverture, après un clic. On observe donc la page en continu.
    var observer = new MutationObserver(function () {
      syncAllCategoryDropdowns();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
