***

# 📐 Éditeur de Géométrie Vectorielle 3D

![Statut du projet](https://img.shields.io/badge/statut-fonctionnel-success)
![Version](https://img.shields.io/badge/version-1.5-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/plateforme-Web-orange)

Une application web interactive et pédagogique permettant de visualiser, manipuler et résoudre des problèmes de géométrie dans l'espace (R³) en temps réel. Conçue pour les étudiants, les enseignants et les passionnés de mathématiques.

![Aperçu de l'application](<img width="1031" height="820" alt="Image" src="https://github.com/user-attachments/assets/9ba0c342-cf5f-4cd3-a192-7e7e3eb81edf" />)
*(Insérez ici une capture d'écran de votre interface)*

## 📋 Table des Matières

- [Fonctionnalités](#-fonctionnalités)
- [Technologies](#-technologies)
- [Installation et Démarrage](#-installation-et-démarrage)
- [Guide d'Utilisation](#-guide-dutilisation)
  - [Contrôles de la Caméra](#contrôles-de-la-caméra)
  - [Raccourcis Clavier](#raccourcis-clavier)
  - [Système de Coordonnées](#système-de-coordonnées)
- [Architecture du Code](#-architecture-du-code)
- [Feuille de Route (Roadmap)](#-feuille-de-route-roadmap)
- [Auteur](#-auteur)

## ✨ Fonctionnalités

### 1. Construction Géométrique
*   **Points** : Ajout par coordonnées (x, y, z) ou clic direct. Déplacement interactif via un **Gizmo**.
*   **Vecteurs** : Création par composantes ou définis par deux points. Visualisation de la norme.
*   **Droites** : Définition par deux points, par Point+Vecteur, ou par **équations paramétriques** ($x=x_0+at...$).
*   **Plans** : Définition par 3 points, ou par **équation cartésienne** ($ax + by + cz + d = 0$). Affichage de la normale.

### 2. Calculs Mathématiques Avancés
L'application effectue les calculs en temps réel et affiche les résultats :
*   **Intersections** :
    *   Droite ∩ Plan (coordonnées du point).
    *   Plan ∩ Plan (droite d'intersection).
    *   Droite ∩ Droite (point d'intersection ou distance minimale).
*   **Mesures & Projections** :
    *   Distances : Point-Point, Point-Droite, Point-Plan.
    *   Angles : Droite/Droite, Plan/Plan, Droite/Plan.
    *   **Perpendiculaire commune** entre deux droites.
    *   **Projection orthogonale** d'un point sur un plan.
*   **Algèbre Vectorielle** :
    *   Somme ($\vec{u} + \vec{v}$) : Calcul libre ou construction de **Chasles**.
    *   Produit Scalaire ($\vec{u} \cdot \vec{v}$) et calcul d'angle.
    *   Produit Vectoriel ($\vec{u} \wedge \vec{v}$).

### 3. Outils & Ergonomie
*   **Tableur de Données (Nouveau)** : Un panneau rétractable en bas d'écran permettant de voir et modifier les coordonnées de tous les objets (Points, Vecteurs, etc.) comme dans un tableur Excel.
*   **Transformations** : Translation, Rotation et **Symétries** (Centrale, Axiale, Plane) appliquées aux objets sélectionnés.
*   **Historique (Undo/Redo)** : Annulation et rétablissement des actions (`Ctrl+Z`, `Ctrl+Y`).
*   **Magnétisme (Snapping)** : Mode "Aimant" pour déplacer les objets par incréments fixes (unités/degrés).
*   **Gestion de Fichiers** :
    *   Sauvegarde locale (LocalStorage).
    *   **Export/Import JSON** : Partagez vos scènes via des fichiers `.json`.
*   **Interface Adaptative** :
    *   **Thème Sombre / Clair** (Dark Mode).
    *   Support tactile complet (Mobile/Tablette) avec gestes (pincement pour zoomer).
    *   Menu contextuel au clic-droit sur les objets 3D.

## 🛠 Technologies

Ce projet est une "Single Page Application" (SPA) autonome.

*   **Langage** : JavaScript (ES6+) Orienté Objet.
*   **Moteur 3D** : [Three.js (r128)](https://threejs.org/).
*   **Contrôles** : `TransformControls` (Gizmo de déplacement/rotation).
*   **Mathématiques** : [MathJax](https://www.mathjax.org/) pour le rendu LaTeX des formules.
*   **Iconographie** : FontAwesome.
*   **Stockage** : LocalStorage & API FileReader/Blob pour l'import/export.

## 🚀 Installation et Démarrage

L'application est statique (pas de serveur backend requis).

### Lancement Local
1.  Clonez le dépôt ou téléchargez les fichiers.
    ```bash
    git clone https://github.com/votre-user/geo-3d-editor.git
    ```
2.  Ouvrez le fichier `index.html` dans votre navigateur.
    *   *Note* : Pour le fonctionnement optimal des textures de texte, il est recommandé d'utiliser un serveur local simple (ex: extension "Live Server" sur VS Code ou `python -m http.server`).

## 🎮 Guide d'Utilisation

### Contrôles de la Caméra
*   **Souris** :
    *   *Clic Gauche + Glisser* : Rotation (Orbite).
    *   *Clic Droit + Glisser* : Panoramique (Déplacement latéral).
    *   *Molette* : Zoom avant/arrière.
*   **Tactile** :
    *   *Un doigt* : Rotation.
    *   *Deux doigts* : Zoom (pincement) et Panoramique.
*   **Vues Prédéfinies** : Boutons en haut à droite (Cube) pour vues de Face, Dessus, Côté.

### Raccourcis Clavier
| Touche | Action |
| :--- | :--- |
| **Suppr / Del** | Supprimer l'objet sélectionné |
| **Ctrl + Z** | Annuler (Undo) |
| **Ctrl + Y** | Rétablir (Redo) |
| **T** | Mode Translation (Gizmo) |
| **R** | Mode Rotation (Gizmo) |
| **Echap** | Désélectionner / Fermer les menus |

### Système de Coordonnées
⚠️ **Convention Mathématique vs 3D**
L'application convertit automatiquement les axes pour correspondre aux cours de mathématiques usuels :
*   **Interface (Saisie)** :
    *   **X** : Largeur (Rouge)
    *   **Y** : Profondeur (Bleu) - *Notez l'inversion standard*
    *   **Z** : Hauteur (Vert)
*   **Moteur 3D (Three.js)** :
    *   Les axes Y et Z sont intervertis en interne pour que l'axe vertical visuel corresponde au Z mathématique.

## 🏗 Architecture du Code

Le code est contenu dans un fichier unique pour la portabilité, structuré autour de classes ES6 :

*   `GeometryManager` : Singleton qui gère les listes d'objets (`points`, `lines`, `planes`, `vectors`) et les interactions globales.
*   `Point`, `Vector`, `Line3D`, `Plane` : Classes représentant les entités. Elles gèrent leur propre maillage (Mesh) et leur affichage (Labels).
*   `TransformControls` : Gère le Gizmo interactif.
*   `historyStack` : Gère la pile d'états pour l'Undo/Redo.

## 🗺 Feuille de Route (Roadmap)

Fonctionnalités envisagées pour les futures versions :

- [ ] **Animations Paramétriques** : Curseur pour faire varier un paramètre $t$ et voir un point bouger sur une droite.
- [ ] **Lieux Géométriques** : Tracer la trace laissée par un point en mouvement.
- [ ] **Refactoring Modulaire** : Découper le fichier `index.html` géant en modules JS (`import/export`) pour une meilleure maintenabilité.
- [ ] **Export Image** : Capture d'écran HD de la zone de travail.

## 🤝 Contribuer

Les contributions sont bienvenues ! N'hésitez pas à ouvrir une "Issue" pour signaler un bug ou proposer une amélioration.

## 📝 Auteur

**Michel ESPARSA**
*Développé le 15/11/2025.*

---
*Licence MIT - Vous êtes libre d'utiliser, modifier et distribuer ce logiciel.*
