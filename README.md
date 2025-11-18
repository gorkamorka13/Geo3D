***

# 📐 Éditeur de Géométrie Vectorielle 3D

![Statut du projet](https://img.shields.io/badge/statut-fonctionnel-success)
![Version](https://img.shields.io/badge/version-1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/plateforme-Web-orange)

Une application web interactive et pédagogique permettant de visualiser, manipuler et résoudre des problèmes de géométrie dans l'espace (R³) en temps réel. Conçue pour les étudiants, les enseignants et les passionnés de mathématiques.

![Aperçu de l'application](https://via.placeholder.com/800x400?text=Capture+d%27%C3%A9cran+de+l%27application)
*(Remplacez ce lien par une vraie capture d'écran de votre application)*

## 📋 Table des Matières

- [Fonctionnalités](#-fonctionnalités)
- [Technologies](#-technologies)
- [Installation et Démarrage](#-installation-et-démarrage)
- [Guide d'Utilisation](#-guide-dutilisation)
  - [Contrôles de la Caméra](#contrôles-de-la-caméra)
  - [Système de Coordonnées](#système-de-coordonnées)
- [Architecture du Code](#-architecture-du-code)
- [Feuille de Route (Roadmap)](#-feuille-de-route-roadmap)
- [Contribuer](#-contribuer)
- [Auteur](#-auteur)

## ✨ Fonctionnalités

### 1. Construction Géométrique
*   **Points** : Ajout par coordonnées cartésiennes (x, y, z).
*   **Vecteurs** : Création par composantes ou définis par deux points. Visualisation de la norme.
*   **Droites** : Définition par deux points ou par **équations paramétriques**.
*   **Plans** : Définition par 3 points non alignés ou par **équation cartésienne** ($ax + by + cz + d = 0$).

### 2. Calculs Mathématiques Avancés
L'application effectue les calculs en arrière-plan et affiche les résultats formatés (LaTeX) :
*   **Intersections** :
    *   Droite ∩ Plan (coordonnées du point ou parallélisme).
    *   Plan ∩ Plan (équation de la droite d'intersection).
    *   Droite ∩ Droite (point d'intersection ou distance minimale si non-coplanaires).
*   **Mesures** :
    *   Distance Point ↔ Point.
    *   Distance Point ↔ Droite (projection orthogonale).
    *   Distance Point ↔ Plan.
    *   Angles (Droite/Droite, Plan/Plan, Droite/Plan).
*   **Algèbre Vectorielle** :
    *   Somme de vecteurs ($\vec{u} + \vec{v}$) avec construction visuelle de Chasles.
    *   Produit Scalaire ($\vec{u} \cdot \vec{v}$).
    *   Produit Vectoriel ($\vec{u} \wedge \vec{v}$) avec visualisation du vecteur résultant.

### 3. Outils & Ergonomie
*   **Manipulation 3D** : Translation, Rotation et Symétrie (centrale, axiale, plane) des objets.
*   **Gestion de Scène** : Sauvegarde et chargement des figures via le `LocalStorage` du navigateur.
*   **Interface Dynamique** :
    *   Menu contextuel (clic-droit) sur les objets 3D.
    *   Affichage/Masquage sélectif des objets.
    *   Support tactile (Mobile/Tablette) complet.

## 🛠 Technologies

Ce projet est une "Single Page Application" (SPA) ne nécessitant aucun backend.

*   **Langage** : JavaScript (ES6+) Orienté Objet.
*   **Moteur 3D** : [Three.js (r128)](https://threejs.org/).
*   **Mathématiques** : [MathJax](https://www.mathjax.org/) pour le rendu des formules.
*   **Iconographie** : FontAwesome.
*   **Architecture** : Vanilla JS (pas de framework type React/Vue), gestionnaire de géométrie centralisé.

## 🚀 Installation et Démarrage

Puisque l'application est statique, elle est très simple à déployer ou à lancer localement.

### Pré-requis
Un navigateur web moderne (Chrome, Firefox, Edge, Safari).

### Lancement Local
1.  Clonez le dépôt :
    ```bash
    git clone https://github.com/votre-user/geo-3d-editor.git
    cd geo-3d-editor
    ```
2.  Ouvrez le fichier `index.html`.
    *   *Recommandé* : Utilisez une extension comme **Live Server** (VS Code) ou lancez un serveur local python (`python -m http.server`) pour éviter les restrictions de sécurité CORS liées aux chargements de textures ou de modules JS.

## 🎮 Guide d'Utilisation

### Contrôles de la Caméra
*   **Souris** :
    *   *Clic Gauche + Glisser* : Rotation (Orbite).
    *   *Clic Droit + Glisser* : Panoramique (Déplacement latéral).
    *   *Molette* : Zoom avant/arrière.
*   **Tactile** :
    *   *Un doigt* : Rotation.
    *   *Deux doigts* : Zoom (pincement) et Panoramique.
*   **Boutons Rapides** : Utilisez les icônes en haut à droite pour passer en vue de Dessus (XY), Face (XZ) ou Côté (YZ).

### Système de Coordonnées
⚠️ **Important** : Three.js utilise un repère où **Y est la hauteur**.
Dans les cours de mathématiques standards, **Z est souvent la hauteur**.
> L'application gère cette conversion automatiquement :
> *   Dans l'interface (champs de saisie) : **Z = Hauteur**, **Y = Profondeur**.
> *   Dans le moteur 3D : Les axes sont intervertis pour correspondre à la visualisation attendue.

## 🏗 Architecture du Code

Le code est structuré autour de la Programmation Orientée Objet (POO) :

*   `GeometryManager` : Le chef d'orchestre. Il stocke les listes d'objets, gère les IDs uniques et les interactions globales.
*   `Point`, `Vector`, `Line3D`, `Plane` : Classes représentant les entités géométriques. Chacune gère son propre maillage (Mesh) Three.js et ses méthodes de mise à jour.
*   `raycaster` : Gère la sélection des objets via la souris ou le tactile.

## 🗺 Feuille de Route (Roadmap)

Voici les futures évolutions envisagées pour le projet :

- [ ] **Export/Import de fichiers** : Permettre de télécharger la scène en `.json` ou `.obj` plutôt que le LocalStorage.
- [ ] **Mode Magnétisme (Snap)** : Attirer le curseur vers les points existants ou la grille lors de la création.
- [ ] **Historique** : Implémenter Undo/Redo (Ctrl+Z).
- [ ] **Animations** : Animer le paramètre $t$ pour voir le déplacement sur une droite.
- [ ] **Refactoring** : Séparer le fichier unique en modules JS distincts (`import/export`).

## 🤝 Contribuer

Les contributions sont grandement appréciées !

1.  Forkez le projet.
2.  Créez votre branche de fonctionnalité (`git checkout -b feature/NouvelleFonction`).
3.  Commitez vos changements (`git commit -m 'Ajout de la fonction X'`).
4.  Poussez vers la branche (`git push origin feature/NouvelleFonction`).
5.  Ouvrez une Pull Request.

## 📝 Auteur

**Michel ESPARSA**
*Développé avec passion pour la pédagogie mathématique.*

---
*Licence MIT - Vous êtes libre d'utiliser, modifier et distribuer ce logiciel.*
