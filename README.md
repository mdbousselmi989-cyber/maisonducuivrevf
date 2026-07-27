# Maison du Cuivre — Site web

Site vitrine (HTML / CSS / JS, sans backend) pour l'entreprise artisanale **Maison du Cuivre**, avec une **page d'administration** permettant de modifier tout le contenu du site sans toucher au code.

## Structure du site

- `index.html` — Accueil
- `apropos.html` — À propos
- `galerie.html` — Galerie & Produits (avec filtres par catégorie)
- `sur-mesure.html` — Sur mesure (processus + formulaire de devis)
- `contact.html` — Contact & Localisation (formulaire, coordonnées, carte Rue de Gammarth)
- `admin.html` — **Page d'administration** (voir ci-dessous)
- `css/style.css` — Feuille de style unique
- `js/site-data.js` — **Toutes les données du site** (textes, images, coordonnées) — la source de vérité
- `js/render.js` — Moteur qui peuple les pages à partir de `site-data.js`
- `js/admin.js` — Logique de la page d'administration
- `js/main.js` — Menu mobile, filtres galerie, formulaires, animations au scroll
- `images/products/*.svg` — Illustrations produits par défaut (remplaçables depuis l'admin)

Aucune dépendance externe (pas de CDN, pas de police Google Fonts) : le site fonctionne hors-ligne et se déploie tel quel sur n'importe quel hébergement statique.

## 🛠️ La page d'administration (`admin.html`)

Ouvrez `admin.html` dans votre navigateur pour modifier **tout le contenu du site** depuis une interface graphique, sans toucher au code :

- **Identité & logo** : nom, slogan, logo (image ou initiales)
- **Coordonnées & carte** : adresse, téléphone, e-mail, Facebook, horaires, position sur la carte
- **Images de couverture** : photo de fond pour le bandeau de chaque page
- **Textes de chaque page** : Accueil, À propos, Galerie, Sur mesure, Contact
- **Produits** : ajout / suppression / modification (nom, catégorie, description, prix, photo, mise en avant)
- **Avis clients** : ajout / suppression / modification des témoignages

### Comment ça marche (important à comprendre)

1. À la première ouverture, `admin.html` vous demande de **créer un mot de passe local**. Il est stocké dans votre navigateur uniquement.
   ⚠️ **Ce n'est pas une vraie sécurité** : n'importe qui sachant lire le code source de la page peut le contourner. C'est une simple protection contre les visiteurs distraits qui tomberaient sur la page par hasard. Si vous voulez une vraie protection, mettez en place une protection par mot de passe côté hébergeur (Netlify propose cette option nativement, par exemple) et ne partagez pas le lien `/admin.html`.
2. Chaque clic sur **Enregistrer** sauvegarde vos modifications dans le stockage local de **ce navigateur, sur cet appareil**. Elles sont immédiatement visibles si vous rouvrez le site dans le même navigateur, mais **pas encore visibles pour vos visiteurs**.
3. Pour rendre les modifications visibles à **tous vos visiteurs**, il faut les rendre permanentes :
   - Cliquez sur **« Télécharger site-data.js »**
   - Remplacez le fichier `js/site-data.js` du projet par celui que vous venez de télécharger
   - Redéployez le site (voir « Déploiement » ci-dessous)
4. **Importer** permet de recharger un fichier `site-data.js` (ou JSON) précédemment exporté, pour continuer à l'éditer.
5. **Réinitialiser** efface les modifications enregistrées dans ce navigateur et revient au contenu de `site-data.js`.

Les images que vous uploadez (logo, couvertures, photos produits) sont automatiquement compressées et intégrées directement dans `site-data.js` — aucun dossier d'images séparé à gérer.

## ⚠️ À faire avant la mise en ligne

### 1. Remplacer les visuels par vos vraies photos

Je n'ai pas pu accéder à votre page Facebook depuis cet environnement (accès réseau restreint), donc les visuels produits par défaut sont des **icônes SVG illustratives**, et les avis sont des **exemples**.

Le plus simple : ouvrez **`admin.html`** et remplacez-les directement (logo, couvertures, photos produits, avis clients) — voir la section ci-dessus.

### 2. Compléter les coordonnées

Depuis `admin.html` → « Coordonnées & carte », mettez à jour :
- Téléphone (actuellement `+216 XX XXX XXX`)
- E-mail (actuellement `contact@maisonducuivre.tn`)
- Latitude / longitude si vous voulez un point plus précis que « Rue de Gammarth » sur la carte

### 3. Connecter les formulaires

Les formulaires (page Sur mesure et Contact) sont des **démonstrations front-end** : ils affichent un message de confirmation mais n'envoient rien nulle part. Pour recevoir réellement les demandes par e-mail, deux options simples sans backend :
- [Formspree](https://formspree.io/) — ajoutez `action="https://formspree.io/f/VOTRE_ID"` et `method="POST"` sur la balise `<form>`
- [EmailJS](https://www.emailjs.com/) — envoi via JavaScript directement depuis le formulaire

## Déploiement

Ce site est 100% statique, il peut être déployé gratuitement sur :
- **Netlify** ou **Vercel** (glisser-déposer le dossier, ou lier le dépôt Git)
- **GitHub Pages**
- Tout hébergement mutuel classique (envoi par FTP)

Après chaque export depuis `admin.html`, pensez à remplacer `js/site-data.js` puis à redéployer (un nouveau push Git suffit si le site est branché sur Netlify/Vercel/GitHub Pages).

## Aperçu local

Ouvrez simplement `index.html` (ou `admin.html`) dans un navigateur, ou lancez un petit serveur local :

```bash
python3 -m http.server 8000
```

puis rendez-vous sur `http://localhost:8000`.
