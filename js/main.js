// Maison du Cuivre — scripts principaux
document.addEventListener('DOMContentLoaded', () => {

  // Menu mobile
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.querySelector('.main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => mainNav.classList.remove('open'));
    });
  }

  // Filtre de galerie
  const filterButtons = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('[data-category]');
  if (filterButtons.length && galleryItems.length) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const category = btn.dataset.filter;
        galleryItems.forEach(item => {
          const show = category === 'all' || item.dataset.category === category;
          item.style.display = show ? '' : 'none';
        });
      });
    });
  }

  // Formulaires (démo front-end : aucun backend connecté)
  document.querySelectorAll('form[data-demo-form]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const successBox = form.querySelector('.form-success');
      if (successBox) {
        successBox.classList.add('visible');
        successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      form.reset();
    });
  });

  // Révélation au scroll (progressive : le contenu reste visible si JS échoue)
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -5% 0px' });
    revealEls.forEach(el => {
      el.classList.add('reveal-ready');
      observer.observe(el);
    });
    // Filet de sécurité : si un élément n'a jamais été détecté (ex. saut direct
    // en bas de page), on le révèle quand même après un court délai.
    setTimeout(() => {
      revealEls.forEach(el => el.classList.add('in-view'));
      observer.disconnect();
    }, 2500);
  }

  // Année dynamique dans le footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
