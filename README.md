# Éditeur de Géométrie 3D (3D Geometry Editor)

![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-yellow?style=for-the-badge&logo=javascript)![Three.js](https://img.shields.io/badge/Three.js-r128-black?style=for-the-badge&logo=three.js)![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

Un outil web interactif et complet pour visualiser et manipuler des objets géométriques dans un environnement 3D. Conçu pour l'éducation et l'exploration, cet éditeur permet de tracer des points, des vecteurs, des droites et des plans, et d'effectuer une large gamme de calculs et de transformations géométriques directement dans le navigateur.

Le projet est contenu dans un **unique fichier HTML autonome**, sans dépendances externes à installer.

## ✨ Fonctionnalités principales

Cet éditeur offre une suite complète d'outils pour la géométrie dans l'espace :

### 📐 Création d'Objets
- **Points** : Placez et nommez des points en spécifiant leurs coordonnées (X, Y, Z).
- **Vecteurs** :
  - Définissez un vecteur à partir de deux points (origine et extrémité).
  - Créez un vecteur libre en spécifiant ses composantes et son point d'origine.
- **Droites** :
  - Tracez une droite passant par deux points existants.
  - Créez une droite à partir de son **équation paramétrique**.
- **Plans** :
  - Définissez un plan à l'aide de trois points non-alignés.
  - Créez un plan à partir de son **équation cartésienne** (ex: `2x - y + 3z - 6 = 0`).

### ⚙️ Interaction et Visualisation
- **Scène 3D Interactive** : Rotation, déplacement (pan) et zoom dans la scène à la souris ou au tactile.
- **Vues Prédéfinies** : Basculez instantanément entre les vues de dessus (XY), de face (XZ), de côté (YZ) et une vue isométrique par défaut.
- **Sélection d'Objets** : Cliquez sur un objet pour le sélectionner, le mettre en surbrillance et accéder aux options de transformation.
- **Menu Contextuel** : Un clic droit (ou un appui long sur mobile) sur un objet ouvre un menu pour le modifier, le supprimer ou changer sa visibilité.
- **Gestionnaire d'Objets** : Des listes claires et organisées pour chaque type d'objet, avec des options d'édition rapide.

### 🧮 Calculs et Mesures
- **Opérations sur les Vecteurs** :
  - **Somme vectorielle** (`u + v`), avec une option pour visualiser la construction selon la **relation de Chasles**.
  - **Produit Scalaire** (`u · v`).
  - **Produit Vectoriel** (`u ∧ v`), avec création du vecteur résultant dans la scène.
- **Mesures de Distances** :
  - Entre deux points.
  - D'un point à une droite.
  - D'un point à un plan.
- **Mesures d'Angles** :
  - Entre deux droites.
  - Entre deux plans.
  - Entre une droite et un plan.
- **Calcul d'Intersections** :
  - Entre une droite et un plan (avec création du point d'intersection).
  - Entre deux plans (avec création de la droite d'intersection).
  - Analyse de la position relative de deux droites (sécantes, parallèles, non-coplanaires).

### 🔄 Transformations Géométriques
- Appliquez des transformations à n'importe quel objet sélectionné (point, vecteur, droite ou plan).
- **Translation** : Déplacez un objet selon un vecteur de translation.
- **Rotation** : Faites pivoter un objet autour d'un axe (X, Y, ou Z) et d'un centre de rotation (origine ou un point existant).
- **Symétrie** : Calculez le symétrique d'un objet par rapport à un point, une droite ou un plan.

### 💾 Gestion de Scènes
- **Sauvegarde Locale** : Enregistrez l'intégralité de votre scène (tous les objets et leurs positions) dans le `localStorage` de votre navigateur.
- **Chargement et Suppression** : Rechargez une scène précédemment sauvegardée ou supprimez-la de votre stockage local.

## 🛠️ Technologies utilisées

- **Three.js (r128)** : Le cœur du projet, ce moteur 3D gère le rendu de la scène, les objets, la caméra et les lumières.
- **JavaScript (ES6+)** : Toute la logique de l'application, des classes d'objets (Point, Vecteur, etc.) aux calculs mathématiques et à la manipulation du DOM, est écrite en JavaScript moderne.
- **HTML5** : Structure la page et tous les éléments de l'interface utilisateur.
- **CSS3** : Met en forme le panneau de contrôle et assure une interface responsive qui s'adapte aux ordinateurs et aux appareils mobiles.

## 🚀 Comment l'utiliser ?

C'est incroyablement simple :

1.  Téléchargez le fichier `index.html`.
2.  Ouvrez ce fichier dans n'importe quel navigateur web moderne (Chrome, Firefox, Edge, Safari).

Et c'est tout ! L'application est prête à être utilisée. Il n'y a aucune installation ni configuration requise.

## Auteur

Ce projet a été créé et développé par **Michel ESPARSA**.
