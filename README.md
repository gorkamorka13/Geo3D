# Éditeur de Géométrie 3D Interactif

![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)![Three.js](https://img.shields.io/badge/Three.js-r128-blue)![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)

Une application web interactive conçue pour visualiser, créer et analyser des objets géométriques en trois dimensions. C'est un outil pédagogique parfait pour les étudiants et les enseignants en mathématiques, en particulier pour la géométrie dans l'espace.

L'application est entièrement contenue dans un seul fichier `index.html`, ne nécessitant aucune installation de serveur ou de dépendances complexes.

**(Il est fortement recommandé d'ajouter une capture d'écran ou un GIF de l'application ici pour une meilleure présentation)**
`![Aperçu de l'éditeur 3D](URL_DE_VOTRE_SCREENSHOT.png)`

---

## ✨ Fonctionnalités

Cet éditeur offre une large gamme d'outils pour la géométrie 3D :

### 1. Création d'Objets Géométriques
-   **Points** :
    -   Ajouter des points en spécifiant leur nom et leurs coordonnées (X, Y, Z).
    -   Modifier et supprimer des points existants.
    -   Charger un ensemble de points de test (A, B, C) pour un démarrage rapide.
-   **Droites** :
    -   Tracer une droite en sélectionnant deux points existants.
    -   Définir une droite à partir de son équation paramétrique.
-   **Plans** :
    -   Créer un plan en sélectionnant trois points non-colinéaires.
    -   Définir un plan à partir de son équation cartésienne (`ax + by + cz + d = 0`).
-   **Vecteurs** :
    -   Tracer un vecteur entre un point de départ et un point d'arrivée.
    -   Définir un vecteur par ses composantes (Vx, Vy, Vz) et un point d'origine.
    -   Modifier les vecteurs créés par coordonnées.

### 2. Calculs et Analyses
-   **Opérations sur les Vecteurs** :
    -   Calculer et visualiser la **somme** de deux vecteurs.
    -   Calculer le **produit scalaire** de deux vecteurs.
    -   Calculer et visualiser le **produit vectoriel** de deux vecteurs.
-   **Mesures de Distances** :
    -   Distance entre deux points.
    -   Distance d'un point à une droite.
    -   Distance d'un point à un plan (avec visualisation du projeté orthogonal).
-   **Mesures d'Angles** :
    -   Angle entre deux droites.
    -   Angle entre deux plans.
    -   Angle entre une droite et un plan.
-   **Calculs d'Intersections** :
    -   Trouver le point d'intersection entre une droite et un plan.
    -   Déterminer la droite d'intersection entre deux plans.
    -   Analyser la position relative de deux droites (sécantes, parallèles, non-coplanaires) et trouver leur point d'intersection si elles sont sécantes.

### 3. Interface et Visualisation
-   **Scène 3D Interactive** :
    -   Rotation de la caméra en cliquant-glissant (bouton gauche).
    -   Déplacement (pan) de la caméra en cliquant-glissant (bouton droit ou deux doigts sur mobile).
    -   Zoom avec la molette de la souris ou le pincement sur mobile.
-   **Vues Prédéfinies** :
    -   Basculez rapidement entre les vues de **dessus (XY)**, de **face (XZ)**, de **côté (YZ)** et une vue **isométrique** par défaut.
-   **Panneau de Contrôle Intuitif** :
    -   Un panneau latéral rétractable regroupe toutes les fonctionnalités.
    -   Les sections sont pliables pour une meilleure organisation.
    -   Les listes déroulantes se mettent à jour dynamiquement à mesure que vous ajoutez des objets.
-   **Feedback Visuel** :
    -   Affichage des équations cartésiennes des plans et des équations paramétriques des droites.
    -   Les résultats des calculs sont affichés directement dans l'interface.
    -   Possibilité de masquer/afficher les objets (plans, vecteurs) et les vecteurs normaux des plans.
    -   Design responsive pour une utilisation sur ordinateur et appareils mobiles.

---

## 🚀 Comment l'utiliser

Aucune installation n'est requise !

1.  Clonez ce dépôt ou téléchargez simplement le fichier `index.html`.
2.  Ouvrez le fichier `index.html` dans un navigateur web moderne (Chrome, Firefox, Edge, Safari).

Et c'est tout ! Vous pouvez commencer à explorer la géométrie en 3D.

---

## 🛠️ Technologies utilisées

-   **[Three.js (r128)](https://threejs.org/)** : Bibliothèque principale pour le rendu 3D WebGL.
-   **JavaScript (ES6)** : Pour toute la logique de l'application, les calculs géométriques et la manipulation du DOM.
-   **HTML5** : Pour la structure de la page et des contrôles.
-   **CSS3** : Pour la mise en forme du panneau de contrôle et le design responsive.

---

## ✒️ Auteur

-   **Michel ESPARSA** - *Développement et conception*

---

## 📄 Licence

Ce projet n'a pas de licence spécifiée. Vous pouvez en ajouter une si vous le souhaitez. Une licence [MIT](https://opensource.org/licenses/MIT) est un bon choix pour ce type de projet.
