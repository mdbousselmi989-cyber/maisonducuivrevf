// Maison du Cuivre — logique de la page d'administration
(function () {
  "use strict";

  var PASSCODE_KEY = "mdc_admin_passcode";
  var SESSION_KEY = "mdc_admin_session";

  // E-mail de récupération — fixé pour l'administration de ce site.
  var ADMIN_RECOVERY_EMAIL = "mdbousselmi989@gmail.com";

  // ------------------------------------------------------------------
  // Configuration EmailJS — à remplir avec vos identifiants EmailJS
  // (créez un compte gratuit sur https://www.emailjs.com, ajoutez un
  // service e-mail (ex : Gmail) et un template avec les variables
  // {{to_email}} et {{password}}). Voir README.md pour le détail.
  // ------------------------------------------------------------------
  var EMAILJS_PUBLIC_KEY = "82rRQZyvm5Vka6k9_";
  var EMAILJS_SERVICE_ID = "service_xuu93ng";
  var EMAILJS_TEMPLATE_ID = "template_unht8gp";
  var EMAILJS_READY = EMAILJS_PUBLIC_KEY.indexOf("VOTRE_") !== 0;

  // ------------------------------------------------------------------
  // Verrou local (protection légère, non sécurisée)
  // ------------------------------------------------------------------
  function gate() {
    var gateEl = document.getElementById("admin-gate");
    var appEl = document.getElementById("admin-app");

    var loginView = document.getElementById("gate-login");
    var forgotView = document.getElementById("gate-forgot");

    var passwordInput = document.getElementById("gate-password");
    var msg = document.getElementById("gate-message");
    var submit = document.getElementById("gate-submit");

    var forgotLink = document.getElementById("gate-forgot-link");
    var backLink = document.getElementById("gate-back-link");
    var forgotSubmit = document.getElementById("gate-forgot-submit");
    var forgotMsg = document.getElementById("gate-forgot-message");

    if (window.emailjs && EMAILJS_READY) {
      try { emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY }); } catch (e) { /* ignore */ }
    }

    function unlock() {
      gateEl.style.display = "none";
      appEl.style.display = "flex";
      initAdmin();
    }

    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      unlock();
      return;
    }

    var storedPass = localStorage.getItem(PASSCODE_KEY);
    var isFirstVisit = !storedPass;

    if (isFirstVisit) {
      msg.textContent = "Première visite : choisissez un mot de passe. En cas d'oubli, il pourra être renvoyé à " + ADMIN_RECOVERY_EMAIL + ".";
      submit.textContent = "Créer le mot de passe";
    }

    submit.addEventListener("click", function () {
      var val = passwordInput.value.trim();
      if (!val) return;

      if (isFirstVisit) {
        localStorage.setItem(PASSCODE_KEY, val);
        sessionStorage.setItem(SESSION_KEY, "1");
        unlock();
        return;
      }

      if (val === storedPass) {
        sessionStorage.setItem(SESSION_KEY, "1");
        unlock();
      } else {
        msg.textContent = "Mot de passe incorrect.";
        passwordInput.value = "";
        passwordInput.focus();
      }
    });

    passwordInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") submit.click();
    });

    // ------------------------------------------------------------------
    // Mot de passe oublié
    // ------------------------------------------------------------------
    forgotLink.addEventListener("click", function (e) {
      e.preventDefault();
      loginView.style.display = "none";
      forgotView.style.display = "block";
      forgotMsg.textContent = "";
    });

    backLink.addEventListener("click", function (e) {
      e.preventDefault();
      forgotView.style.display = "none";
      loginView.style.display = "block";
    });

    forgotSubmit.addEventListener("click", function () {
      var currentPass = localStorage.getItem(PASSCODE_KEY);

      if (!currentPass) {
        forgotMsg.textContent = "Aucun mot de passe n'a encore été créé sur ce navigateur.";
        return;
      }
      if (!window.emailjs || !EMAILJS_READY) {
        forgotMsg.textContent = "Envoi d'e-mail non configuré — voir README.md (configuration EmailJS requise dans js/admin.js).";
        return;
      }

      forgotSubmit.disabled = true;
      forgotMsg.textContent = "Envoi en cours...";

      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: ADMIN_RECOVERY_EMAIL,
        password: currentPass
      }).then(function () {
        forgotMsg.textContent = "E-mail envoyé à " + ADMIN_RECOVERY_EMAIL + " ! Vérifiez votre boîte de réception (et les spams).";
        forgotSubmit.disabled = false;
      }, function (err) {
        var detail = (err && (err.text || err.message)) ? (err.text || err.message) : JSON.stringify(err);
        forgotMsg.textContent = "Échec de l'envoi : " + detail;
        forgotSubmit.disabled = false;
        console.error("EmailJS error:", err);
      });
    });
  }

  // ------------------------------------------------------------------
  // Données
  // ------------------------------------------------------------------
  var data;

  function setPath(obj, path, value) {
    var parts = path.split(".");
    var cur = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }

  function getPath(obj, path) {
    return window.MDC.resolvePath(obj, path);
  }

  function toast(text) {
    var el = document.getElementById("admin-toast");
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  // ------------------------------------------------------------------
  // Champs simples liés par data-path
  // ------------------------------------------------------------------
  function bindSimpleFields() {
    document.querySelectorAll("[data-path]").forEach(function (el) {
      var path = el.getAttribute("data-path");
      var val = getPath(data, path);
      el.value = val === undefined || val === null ? "" : val;
      el.addEventListener("input", function () {
        var v = el.type === "number" ? parseFloat(el.value) : el.value;
        setPath(data, path, v);
        if (path === "site.lat" || path === "site.lng") updateMapPreview();
        if (path === "site.logoText") refreshImagePreview("site.logoImage");
      });
    });
  }

  // ------------------------------------------------------------------
  // Upload d'images (avec compression via canvas)
  // ------------------------------------------------------------------
  function refreshImagePreview(path) {
    var box = document.getElementById("preview-" + path);
    if (!box) return;
    var val = getPath(data, path);
    if (val) {
      box.innerHTML = '<img src="' + val + '" alt="">';
    } else {
      box.textContent = "Aucune";
    }
  }

  function readImageCompressed(file, maxDim, format, cb) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
          else { w = Math.round((w * maxDim) / h); h = maxDim; }
        }
        var canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        cb(canvas.toDataURL(format === "png" ? "image/png" : "image/jpeg", 0.85));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function bindImageUploads() {
    document.querySelectorAll("[data-image-path]").forEach(function (input) {
      var path = input.getAttribute("data-image-path");
      var maxDim = parseInt(input.getAttribute("data-image-maxdim") || "1200", 10);
      var format = input.getAttribute("data-image-format") || "jpeg";
      refreshImagePreview(path);
      input.addEventListener("change", function () {
        var file = input.files && input.files[0];
        if (!file) return;
        readImageCompressed(file, maxDim, format, function (dataUrl) {
          setPath(data, path, dataUrl);
          refreshImagePreview(path);
          toast("Image chargée — pensez à Enregistrer");
        });
        input.value = "";
      });
    });

    document.querySelectorAll("[data-clear-image]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var path = btn.getAttribute("data-clear-image");
        setPath(data, path, "");
        refreshImagePreview(path);
      });
    });
  }

  // ------------------------------------------------------------------
  // Carte (aperçu)
  // ------------------------------------------------------------------
  function updateMapPreview() {
    var el = document.getElementById("admin-map-preview");
    if (!el) return;
    var lat = Number(data.site.lat), lng = Number(data.site.lng);
    if (isNaN(lat) || isNaN(lng)) return;
    var d = 0.01;
    var bbox = [lng - d, lat - d, lng + d, lat + d].join(",");
    el.src = "https://www.openstreetmap.org/export/embed.html?bbox=" + encodeURIComponent(bbox) + "&layer=mapnik&marker=" + lat + "," + lng;
  }

  // ------------------------------------------------------------------
  // Répéteurs génériques (valeurs, timeline, produits, avis, étapes)
  // ------------------------------------------------------------------
  function esc(str) {
    return String(str == null ? "" : str).replace(/"/g, "&quot;");
  }

  function makeField(labelText, value, onInput, type) {
    var wrap = document.createElement("div");
    wrap.className = "field";
    var label = document.createElement("label");
    label.textContent = labelText;
    wrap.appendChild(label);
    var input = document.createElement(type === "textarea" ? "textarea" : "input");
    if (type !== "textarea") input.type = type || "text";
    input.value = value == null ? "" : value;
    input.addEventListener("input", function () { onInput(input.value); });
    wrap.appendChild(input);
    return wrap;
  }

  function repeaterShell(containerId, items, renderItem, emptyLabel) {
    var container = document.getElementById(containerId);
    container.innerHTML = "";
    if (!items.length) {
      var empty = document.createElement("div");
      empty.className = "repeater-empty";
      empty.textContent = emptyLabel;
      container.appendChild(empty);
      return;
    }
    items.forEach(function (item, i) {
      var row = document.createElement("div");
      row.className = "repeater-item";
      renderItem(row, item, i);
      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "repeater-remove";
      removeBtn.textContent = "✕";
      removeBtn.title = "Supprimer";
      removeBtn.addEventListener("click", function () {
        items.splice(i, 1);
        renderAllRepeaters();
      });
      row.appendChild(removeBtn);
      container.appendChild(row);
    });
  }

  function renderValues() {
    repeaterShell("rep-values", data.about.values, function (row, item) {
      row.appendChild(makeField("Titre", item.title, function (v) { item.title = v; }));
      row.appendChild(makeField("Texte", item.text, function (v) { item.text = v; }, "textarea"));
    }, "Aucune valeur — ajoutez-en une.");
  }

  function renderTimeline() {
    repeaterShell("rep-timeline", data.about.timeline, function (row, item) {
      row.appendChild(makeField("Période (ex: Les débuts)", item.year, function (v) { item.year = v; }));
      row.appendChild(makeField("Titre", item.title, function (v) { item.title = v; }));
      row.appendChild(makeField("Texte", item.text, function (v) { item.text = v; }, "textarea"));
    }, "Aucune étape — ajoutez-en une.");
  }

  function renderSteps() {
    repeaterShell("rep-steps", data.custom.steps, function (row, item) {
      row.appendChild(makeField("Titre", item.title, function (v) { item.title = v; }));
      row.appendChild(makeField("Texte", item.text, function (v) { item.text = v; }, "textarea"));
    }, "Aucune étape — ajoutez-en une.");
  }

  function renderTestimonials() {
    repeaterShell("rep-testimonials", data.testimonials, function (row, item) {
      var grid = document.createElement("div");
      grid.className = "admin-grid-2";
      grid.appendChild(makeField("Nom du client", item.name, function (v) { item.name = v; }));
      grid.appendChild(makeField("Ville / lieu", item.location, function (v) { item.location = v; }));
      row.appendChild(grid);
      row.appendChild(makeField("Avis", item.quote, function (v) { item.quote = v; }, "textarea"));
      var ratingWrap = document.createElement("div");
      ratingWrap.className = "field";
      var label = document.createElement("label");
      label.textContent = "Note (1 à 5)";
      ratingWrap.appendChild(label);
      var select = document.createElement("select");
      [5, 4, 3, 2, 1].forEach(function (n) {
        var opt = document.createElement("option");
        opt.value = n; opt.textContent = n + " étoile" + (n > 1 ? "s" : "");
        if (Number(item.rating) === n) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener("input", function () { item.rating = Number(select.value); });
      ratingWrap.appendChild(select);
      row.appendChild(ratingWrap);
    }, "Aucun avis — ajoutez-en un.");
  }

  function renderProducts() {
    var categories = [
      { value: "plateaux", label: "Plateaux" },
      { value: "table", label: "Art de la table" },
      { value: "luminaires", label: "Luminaires" },
      { value: "decoration", label: "Décoration" }
    ];
    repeaterShell("rep-products", data.products, function (row, item, i) {
      var grid = document.createElement("div");
      grid.className = "admin-grid-2";
      grid.appendChild(makeField("Nom du produit", item.name, function (v) { item.name = v; }));

      var catWrap = document.createElement("div");
      catWrap.className = "field";
      var catLabel = document.createElement("label");
      catLabel.textContent = "Catégorie";
      catWrap.appendChild(catLabel);
      var select = document.createElement("select");
      categories.forEach(function (c) {
        var opt = document.createElement("option");
        opt.value = c.value; opt.textContent = c.label;
        if (item.category === c.value) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener("input", function () { item.category = select.value; });
      catWrap.appendChild(select);
      grid.appendChild(catWrap);
      row.appendChild(grid);

      row.appendChild(makeField("Description (page Galerie)", item.description, function (v) { item.description = v; }, "textarea"));
      row.appendChild(makeField("Description courte (page Accueil)", item.homeDescription, function (v) { item.homeDescription = v; }, "textarea"));

      var grid2 = document.createElement("div");
      grid2.className = "admin-grid-2";
      grid2.appendChild(makeField("Prix affiché", item.price, function (v) { item.price = v; }));
      grid2.appendChild(makeField("Étiquette (ex: Best-seller, laisser vide sinon)", item.tag, function (v) { item.tag = v; }));
      row.appendChild(grid2);

      var featWrap = document.createElement("label");
      featWrap.className = "admin-checkbox";
      var featInput = document.createElement("input");
      featInput.type = "checkbox";
      featInput.checked = !!item.featuredHome;
      featInput.addEventListener("change", function () { item.featuredHome = featInput.checked; });
      featWrap.appendChild(featInput);
      featWrap.appendChild(document.createTextNode("Mettre en avant sur la page d'accueil"));
      row.appendChild(featWrap);

      var imgPath = "products." + i + ".image";
      var imgField = document.createElement("div");
      imgField.className = "field";
      var imgLabel = document.createElement("label");
      imgLabel.textContent = "Image du produit";
      imgField.appendChild(imgLabel);
      var upload = document.createElement("div");
      upload.className = "image-upload";
      var preview = document.createElement("div");
      preview.className = "preview";
      preview.id = "preview-" + imgPath;
      preview.innerHTML = item.image ? '<img src="' + esc(item.image) + '" alt="">' : "Aucune";
      upload.appendChild(preview);
      var actions = document.createElement("div");
      actions.className = "upload-actions";
      var fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.addEventListener("change", function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        readImageCompressed(file, 1000, "jpeg", function (dataUrl) {
          item.image = dataUrl;
          preview.innerHTML = '<img src="' + dataUrl + '" alt="">';
          toast("Image chargée — pensez à Enregistrer");
        });
        fileInput.value = "";
      });
      actions.appendChild(fileInput);
      var clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.className = "btn btn-outline dark";
      clearBtn.style.cssText = "padding:8px 14px;font-size:.68rem;";
      clearBtn.textContent = "Retirer";
      clearBtn.addEventListener("click", function () {
        item.image = "";
        preview.textContent = "Aucune";
      });
      actions.appendChild(clearBtn);
      upload.appendChild(actions);
      imgField.appendChild(upload);
      row.appendChild(imgField);
    }, "Aucun produit — ajoutez-en un.");
  }

  function renderAllRepeaters() {
    renderValues();
    renderTimeline();
    renderSteps();
    renderTestimonials();
    renderProducts();
  }

  // ------------------------------------------------------------------
  // Boutons globaux
  // ------------------------------------------------------------------
  function bindToolbar() {
    document.getElementById("btn-save").addEventListener("click", function () {
      localStorage.setItem(window.MDC.STORAGE_KEY, JSON.stringify(data));
      toast("Enregistré ✓ (dans ce navigateur)");
    });

    document.getElementById("btn-export").addEventListener("click", function () {
      localStorage.setItem(window.MDC.STORAGE_KEY, JSON.stringify(data));
      var content = "// Maison du Cuivre — Données du site (généré depuis l'administration)\n" +
        "window.MDC_DEFAULT_DATA = " + JSON.stringify(data, null, 2) + ";\n";
      var blob = new Blob([content], { type: "text/javascript" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = "site-data.js";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast("Téléchargé — remplacez js/site-data.js dans votre site");
    });

    document.getElementById("btn-import").addEventListener("click", function () {
      document.getElementById("import-file").click();
    });

    document.getElementById("import-file").addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        var text = ev.target.result;
        var parsed = null;
        try { parsed = JSON.parse(text); }
        catch (err) {
          var m = text.match(/=\s*(\{[\s\S]*\})\s*;?\s*$/);
          if (m) { try { parsed = JSON.parse(m[1]); } catch (err2) { parsed = null; } }
        }
        if (!parsed) { toast("Fichier invalide"); return; }
        data = window.MDC.deepMerge(window.MDC_DEFAULT_DATA, parsed);
        refreshAllFields();
        toast("Données importées — pensez à Enregistrer");
      };
      reader.readAsText(file);
      e.target.value = "";
    });

    document.getElementById("btn-reset").addEventListener("click", function () {
      if (!confirm("Réinitialiser toutes les modifications enregistrées dans ce navigateur ? Cette action est irréversible.")) return;
      localStorage.removeItem(window.MDC.STORAGE_KEY);
      data = JSON.parse(JSON.stringify(window.MDC_DEFAULT_DATA));
      refreshAllFields();
      toast("Réinitialisé");
    });
  }

  function refreshAllFields() {
    document.querySelectorAll("[data-path]").forEach(function (el) {
      var val = getPath(data, el.getAttribute("data-path"));
      el.value = val === undefined || val === null ? "" : val;
    });
    document.querySelectorAll("[data-image-path]").forEach(function (el) {
      refreshImagePreview(el.getAttribute("data-image-path"));
    });
    updateMapPreview();
    renderAllRepeaters();
  }

  // ------------------------------------------------------------------
  // Init
  // ------------------------------------------------------------------
  function initAdmin() {
    data = JSON.parse(JSON.stringify(window.MDC.getData()));
    bindSimpleFields();
    bindImageUploads();
    updateMapPreview();
    renderAllRepeaters();
    bindToolbar();

    document.getElementById("add-value").addEventListener("click", function () {
      data.about.values.push({ title: "Nouvelle valeur", text: "" });
      renderValues();
    });
    document.getElementById("add-timeline").addEventListener("click", function () {
      data.about.timeline.push({ year: "", title: "Nouvelle étape", text: "" });
      renderTimeline();
    });
    document.getElementById("add-step").addEventListener("click", function () {
      data.custom.steps.push({ title: "Nouvelle étape", text: "" });
      renderSteps();
    });
    document.getElementById("add-testimonial").addEventListener("click", function () {
      data.testimonials.push({ name: "Nouveau client", location: "", quote: "", rating: 5 });
      renderTestimonials();
    });
    document.getElementById("add-product").addEventListener("click", function () {
      data.products.push({ id: "produit-" + Date.now(), name: "Nouveau produit", category: "decoration", description: "", homeDescription: "", image: "", price: "Sur devis", tag: "", featuredHome: false });
      renderProducts();
    });

    // ------------------------------------------------------------------
    // Changement de mot de passe (depuis l'admin, une fois connecté)
    // ------------------------------------------------------------------
    var pwdCurrent = document.getElementById("pwd-current");
    var pwdNew = document.getElementById("pwd-new");
    var pwdConfirm = document.getElementById("pwd-confirm");
    var pwdMsg = document.getElementById("pwd-message");
    var pwdBtn = document.getElementById("btn-change-password");

    pwdBtn.addEventListener("click", function () {
      var current = localStorage.getItem(PASSCODE_KEY);
      var typedCurrent = pwdCurrent.value;
      var newVal = pwdNew.value.trim();
      var confirmVal = pwdConfirm.value.trim();

      if (!typedCurrent || typedCurrent !== current) {
        pwdMsg.textContent = "Mot de passe actuel incorrect.";
        return;
      }
      if (!newVal || newVal.length < 4) {
        pwdMsg.textContent = "Le nouveau mot de passe doit contenir au moins 4 caractères.";
        return;
      }
      if (newVal !== confirmVal) {
        pwdMsg.textContent = "Les deux nouveaux mots de passe ne correspondent pas.";
        return;
      }

      localStorage.setItem(PASSCODE_KEY, newVal);
      pwdCurrent.value = "";
      pwdNew.value = "";
      pwdConfirm.value = "";

      if (window.emailjs && EMAILJS_READY) {
        pwdMsg.textContent = "Mot de passe changé ✓ Envoi de la confirmation par e-mail...";
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          to_email: ADMIN_RECOVERY_EMAIL,
          password: newVal
        }).then(function () {
          pwdMsg.textContent = "Mot de passe changé ✓ Confirmation envoyée à " + ADMIN_RECOVERY_EMAIL + ".";
        }, function (err) {
          var detail = (err && (err.text || err.message)) ? (err.text || err.message) : JSON.stringify(err);
          pwdMsg.textContent = "Mot de passe changé ✓ (échec de l'envoi de confirmation : " + detail + ")";
          console.error("EmailJS error:", err);
        });
      } else {
        pwdMsg.textContent = "Mot de passe changé ✓ (envoi d'e-mail non configuré — voir README.md).";
      }
      toast("Mot de passe changé ✓");
    });

    // Navigation latérale : mise en surbrillance de la section visible
    var links = document.querySelectorAll(".admin-nav-link");
    var sections = document.querySelectorAll(".admin-section");
    window.addEventListener("scroll", function () {
      var pos = window.scrollY + 120;
      var current = sections[0] && sections[0].id;
      sections.forEach(function (s) { if (s.offsetTop <= pos) current = s.id; });
      links.forEach(function (l) {
        l.classList.toggle("active", l.getAttribute("href") === "#" + current);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", gate);
})();
