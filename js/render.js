// Maison du Cuivre — Moteur de rendu
// Fusionne les données par défaut (js/site-data.js) avec la surcouche
// enregistrée par l'admin dans le navigateur (localStorage), puis peuple
// le HTML des pages publiques à partir de cette fusion.
(function () {
  "use strict";

  var STORAGE_KEY = "mdc_site_data";

  function isPlainObject(v) {
    return v && typeof v === "object" && !Array.isArray(v);
  }

  function deepMerge(base, override) {
    if (!isPlainObject(base) || !isPlainObject(override)) {
      return override !== undefined ? override : base;
    }
    var out = {};
    Object.keys(base).forEach(function (k) { out[k] = base[k]; });
    Object.keys(override).forEach(function (k) {
      if (isPlainObject(base[k]) && isPlainObject(override[k])) {
        out[k] = deepMerge(base[k], override[k]);
      } else if (override[k] !== undefined) {
        out[k] = override[k];
      }
    });
    return out;
  }

  function getOverride() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function getData() {
    var defaults = window.MDC_DEFAULT_DATA || {};
    return deepMerge(defaults, getOverride());
  }

  function resolvePath(obj, path) {
    return path.split(".").reduce(function (o, k) {
      return o == null ? o : o[k];
    }, obj);
  }

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function applyBindings(data) {
    document.querySelectorAll("[data-field]").forEach(function (el) {
      var val = resolvePath(data, el.getAttribute("data-field"));
      if (val === undefined || val === null || val === "") return;
      if (el.hasAttribute("data-field-html")) el.innerHTML = val;
      else el.textContent = val;
    });

    document.querySelectorAll("[data-image]").forEach(function (el) {
      var val = resolvePath(data, el.getAttribute("data-image"));
      if (val) el.setAttribute("src", val);
    });

    document.querySelectorAll("[data-href]").forEach(function (el) {
      var val = resolvePath(data, el.getAttribute("data-href"));
      if (val) el.setAttribute("href", (el.getAttribute("data-href-prefix") || "") + val);
    });

    document.querySelectorAll("[data-bg]").forEach(function (el) {
      var val = resolvePath(data, el.getAttribute("data-bg"));
      if (val) {
        el.style.backgroundImage = 'url("' + val + '")';
        el.style.backgroundSize = "cover";
        el.style.backgroundPosition = "center";
      }
    });
  }

  function setLogo(data) {
    document.querySelectorAll(".brand-mark").forEach(function (el) {
      if (data.site.logoImage) {
        el.innerHTML = '<img src="' + esc(data.site.logoImage) + '" alt="' + esc(data.site.name) + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
      } else {
        el.textContent = data.site.logoText || "MC";
      }
    });
  }

  function setMap(data) {
    var el = document.getElementById("map-iframe");
    if (!el) return;
    var lat = Number(data.site.lat), lng = Number(data.site.lng);
    if (isNaN(lat) || isNaN(lng)) return;
    var d = 0.01;
    var bbox = [lng - d, lat - d, lng + d, lat + d].join(",");
    el.src = "https://www.openstreetmap.org/export/embed.html?bbox=" + encodeURIComponent(bbox) + "&layer=mapnik&marker=" + lat + "," + lng;
  }

  function productCard(p, opts) {
    opts = opts || {};
    var desc = opts.descKey === "homeDescription" && p.homeDescription ? p.homeDescription : p.description;
    var ctaText = opts.ctaText || "Voir";
    var ctaHref = opts.ctaHref || "galerie.html";
    return (
      '<div class="card" data-category="' + esc(p.category) + '">' +
        '<div class="card-media">' +
          (p.tag ? '<span class="tag">' + esc(p.tag) + "</span>" : "") +
          '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '">' +
        "</div>" +
        '<div class="card-body">' +
          "<h3>" + esc(p.name) + "</h3>" +
          "<p>" + esc(desc) + "</p>" +
          '<div class="card-foot"><span class="price-tag">' + esc(p.price || "Sur devis") + '</span><a href="' + esc(ctaHref) + '">' + esc(ctaText) + "&nbsp;→</a></div>" +
        "</div>" +
      "</div>"
    );
  }

  function renderProducts(data) {
    var products = data.products || [];

    var homeGrid = document.getElementById("home-products-grid");
    if (homeGrid) {
      var featured = products.filter(function (p) { return p.featuredHome; }).slice(0, 4);
      if (!featured.length) featured = products.slice(0, 4);
      homeGrid.innerHTML = featured.map(function (p) {
        return productCard(p, { descKey: "homeDescription", ctaText: "Voir", ctaHref: "galerie.html" });
      }).join("");
    }

    var galleryGrid = document.getElementById("gallery-products-grid");
    if (galleryGrid) {
      galleryGrid.innerHTML = products.map(function (p) {
        return productCard(p, { descKey: "description", ctaText: "Personnaliser", ctaHref: "sur-mesure.html" });
      }).join("");
    }
  }

  function renderTestimonials(data) {
    var grid = document.getElementById("home-testimonials-grid");
    if (!grid) return;
    grid.innerHTML = (data.testimonials || []).map(function (t) {
      var stars = "★★★★★".slice(0, Math.max(0, Math.min(5, Number(t.rating) || 5)));
      var initial = (t.name || "?").trim().charAt(0).toUpperCase();
      return (
        '<div class="testimonial-card">' +
          '<div class="stars">' + stars + "</div>" +
          '<p class="quote">« ' + esc(t.quote) + " »</p>" +
          '<div class="testimonial-author">' +
            '<span class="avatar">' + esc(initial) + "</span>" +
            "<div><strong>" + esc(t.name) + "</strong><span>" + esc(t.location) + "</span></div>" +
          "</div>" +
        "</div>"
      );
    }).join("");
  }

  function renderValues(data) {
    var grid = document.getElementById("about-values-grid");
    if (!grid) return;
    grid.innerHTML = (data.about.values || []).map(function (v) {
      return '<div class="value-item"><h3>' + esc(v.title) + "</h3><p>" + esc(v.text) + "</p></div>";
    }).join("");
  }

  function renderTimeline(data) {
    var el = document.getElementById("about-timeline");
    if (!el) return;
    el.innerHTML = (data.about.timeline || []).map(function (t) {
      return (
        '<div class="timeline-item">' +
          '<span class="year">' + esc(t.year) + "</span>" +
          "<h3>" + esc(t.title) + "</h3>" +
          "<p>" + esc(t.text) + "</p>" +
        "</div>"
      );
    }).join("");
  }

  function renderSteps(data) {
    var el = document.getElementById("custom-steps");
    if (!el) return;
    el.innerHTML = (data.custom.steps || []).map(function (s, i) {
      return (
        '<div class="step">' +
          '<div class="step-num">' + (i + 1) + "</div>" +
          '<div class="step-body"><h3>' + esc(s.title) + "</h3><p>" + esc(s.text) + "</p></div>" +
        "</div>"
      );
    }).join("");
  }

  function render() {
    var data = getData();
    applyBindings(data);
    setLogo(data);
    setMap(data);
    renderProducts(data);
    renderTestimonials(data);
    renderValues(data);
    renderTimeline(data);
    renderSteps(data);
  }

  window.MDC = {
    STORAGE_KEY: STORAGE_KEY,
    deepMerge: deepMerge,
    getOverride: getOverride,
    getData: getData,
    resolvePath: resolvePath,
    render: render
  };

  document.addEventListener("DOMContentLoaded", render);
})();
