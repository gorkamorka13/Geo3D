Voici une analyse complète de votre code, le fichier `README.md` pour GitHub, ainsi que des suggestions d'amélioration.

### 1. Fichier README.md

Voici un modèle prêt à l'emploi pour votre dépôt GitHub. Copiez ce contenu dans un fichier nommé `README.md`.

```markdown
# 📐 Éditeur de Géométrie 3D (Three.js)

Une application web interactive pour visualiser, manipuler et calculer des objets géométriques dans un espace 3D. Conçu pour l'enseignement et l'exploration des mathématiques vectorielles.

![Version](https://img.shields.io/badge/version-1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Tech](https://img.shields.io/badge/tech-Three.js-white)

## 🌟 Fonctionnalités

### 🛠 Création d'Objets
- **Points** : Ajout par coordonnées (X, Y, Z).
- **Vecteurs** : Création par composantes ou entre deux points.
- **Droites** : Définition par deux points ou équations paramétriques.
- **Plans** : Définition par 3 points ou équation cartésienne.

### 🧮 Calculs & Analyses
- **Intersections** : Droite/Plan, Plan/Plan, Droite/Droite.
- **Mesures** : Distances (Point-Point, Point-Droite, Point-Plan) et Angles.
- **Opérations Vectorielles** : Somme, Produit Scalaire, Produit Vectoriel.
- **Affichage d'équations** : Visualisation dynamique des équations de plans et droites.

### 🔄 Transformations & Outils
- **Manipulations** : Translation, Rotation, Symétrie (Point, Droite, Plan).
- **Gestion de Caméra** : Vues prédéfinies (Dessus, Face, Côté, Isométrique), Zoom et Panoramique tactiles.
- **Sauvegarde** : Système de persistance locale (LocalStorage) pour sauvegarder et charger des scènes.
- **Interface Responsive** : Panneau latéral rétractable et support mobile (Touch).

## 🚀 Installation et Utilisation

Ce projet est une application web statique ("Client-side only"). Il ne nécessite pas de serveur backend (Node.js, PHP, etc.).

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/votre-nom-utilisateur/editeur-geometrie-3d.git
   ```

2. **Lancer l'application :**
   - Ouvrez simplement le fichier `index.html` dans votre navigateur web préféré (Chrome, Firefox, Edge).
   - **Note :** Pour éviter les problèmes de sécurité CORS avec certaines textures ou imports modules (si évolution future), il est recommandé d'utiliser une extension comme "Live Server" sur VS Code.

## 🛠 Technologies Utilisées

- **HTML5 / CSS3** : Structure et mise en page responsive.
- **JavaScript (ES6+)** : Logique de l'application (POO).
- **[Three.js](https://threejs.org/)** : Moteur de rendu 3D.
- **MathJax** : Rendu des formules mathématiques (LaTeX).
- **FontAwesome** : Icônes de l'interface.

## 🤝 Contribuer

Les contributions sont les bienvenues !
1. Forkez le projet.
2. Créez votre branche (`git checkout -b feature/AmazingFeature`).
3. Commitez vos changements (`git commit -m 'Add some AmazingFeature'`).
4. Pushez vers la branche (`git push origin feature/AmazingFeature`).
5. Ouvrez une Pull Request.

## 📝 Auteur

**Michel ESPARSA**
*Date de création : 15/11/2025*

---
*Ce projet a été réalisé dans un but pédagogique pour visualiser les concepts de géométrie dans l'espace.*
```

---

### 2. Audit du Code (Variables inutilisées et Cohérence)

Le code est fonctionnel et ambitieux, mais il contient des traces de développement (copier-coller multiples, variables vestigiales).

#### A. Variables Inutilisées ou Redondantes
1.  **`rightClickedObjectInstance`** :
    *   Déclarée au début (`let rightClickedObjectInstance = null;`).
    *   Elle semble avoir été remplacée par l'utilisation directe de l'instance passée en paramètre dans `findObjectAndShowMenu` et `populateAndShowContextMenu`. Vous pouvez probablement la supprimer.
2.  **Redéfinitions de fonctions (Gros problème de cohérence)** :
    *   Dans le fichier fourni, plusieurs fonctions sont définies **plusieurs fois** (ex: `calculateLinePlaneIntersection`, `addPlane`, `applyTranslation`, `expandSectionAndScrollToItem`).
    *   *Conséquence :* JavaScript "écrase" les premières définitions par la dernière trouvée dans le fichier. Cela rend le code difficile à lire et sujet aux erreurs si vous modifiez la "mauvaise" version plus haut dans le fichier.
    *   *Action :* Il faut absolument nettoyer le fichier pour ne garder qu'une seule version (la dernière/meilleure) de chaque fonction.
3.  **`swipeState`** :
    *   Utilisé pour la logique mobile. Le code semble correct, mais vérifiez que la constante `SWIPE_EDGE_ZONE` est bien utilisée uniquement là où c'est nécessaire.

#### B. Cohérence et Architecture
1.  **Mélange HTML/JS/CSS** : Tout est dans un seul fichier de ~2000 lignes. C'est pratique pour le partage rapide, mais terrible pour la maintenance.
2.  **Gestion des IDs** : Vous utilisez des compteurs globaux (`nextVectorId`, etc.). C'est correct, mais lors du chargement d'une scène (`loadScene`), assurez-vous bien que ces compteurs sont mis à jour pour être supérieurs au plus grand ID chargé (votre code le fait via `Math.max`, c'est **très bien**).
3.  **Gestion des événements** : Vous avez un mélange d'événements souris (`mousedown`) et tactiles (`touchstart`) gérés manuellement pour la caméra. C'est complexe. Three.js fournit souvent `OrbitControls` qui gère cela nativement et très bien. Votre implémentation "maison" permet cependant de bloquer certains axes, ce qui semble être un choix délibéré pour cette appli de géométrie.

---

### 3. Propositions d'Amélioration et Évolutions

Voici des pistes pour faire passer ce projet au niveau supérieur :

#### A. Qualité du Code (Refactoring)
1.  **Modularisation (Urgent)** :
    *   Séparez le code en fichiers : `style.css`, `index.html`, et un dossier `js/` avec des modules ES6.
    *   Exemple : `js/classes/Point.js`, `js/classes/Vector.js`, `js/managers/GeometryManager.js`, `js/main.js`.
2.  **Nettoyage** : Supprimez les commentaires du type `// Remplacez votre fonction par celle-ci` et les doublons de fonctions.

#### B. Fonctionnalités (Features)
1.  **Exportation 3D** :
    *   Ajoutez un bouton pour exporter la scène au format `.OBJ` ou `.GLTF` pour pouvoir ouvrir les figures dans d'autres logiciels 3D (Blender) ou les imprimer en 3D.
2.  **Magnétisme (Snapping)** :
    *   Ajoutez une option "Aimant" : quand on crée un vecteur ou une droite, la souris "colle" automatiquement aux points existants ou aux intersections de la grille (entiers).
3.  **Historique (Undo/Redo)** :
    *   Implémentez un pattern "Command" pour stocker les actions (ajout, suppression, transformation) et permettre de faire `Ctrl+Z`.
4.  **Formes complexes** :
    *   Ajouter des sphères, des cubes ou des tétraèdres définis par des points.
5.  **Vue "Cahier" (2D)** :
    *   Une option pour projeter la vue 3D sur un plan 2D (ex: projection sur le plan XY) et l'exporter en image PNG pour l'intégrer dans un devoir ou un cours.

#### C. Interface Utilisateur (UX)
1.  **Mode Sombre / Clair** :
    *   Le fond est actuellement gris clair (`0xf0f0f0`). Un mode sombre avec un fond bleu nuit/noir et des axes fluo serait très esthétique.
2.  **Étiquettes dynamiques (HTML Overlay)** :
    *   Actuellement, vous utilisez des `Sprite` (Canvas texture) pour le texte. C'est performant. Une alternative est d'utiliser des `CSS2DObject` de Three.js pour avoir des étiquettes qui sont de vrais éléments HTML (sélectionnables, style CSS plus facile), bien que cela puisse être plus lourd si vous avez 1000 points.
3.  **Feedback visuel au survol** :
    *   Quand la souris passe sur un nom dans la liste à gauche, l'objet correspondant dans la scène 3D devrait s'illuminer (et inversement). Vous avez commencé à le faire, généralisez-le.

#### D. Correction immédiate recommandée

Dans votre fonction `calculateLinePlaneIntersection`, vous avez laissé des commentaires de versionnage. Voici la version propre et consolidée à garder :

```javascript
function calculateLinePlaneIntersection() {
    const lineSelect = document.getElementById("calcLineSelect");
    const planeSelect = document.getElementById("calcPlaneSelect2");
    const resultDisplay = document.getElementById("calcResultDisplay2");

    if (!lineSelect || !planeSelect || !resultDisplay) return;

    const line = geometryManager.findLineById(parseInt(lineSelect.value));
    const plane = geometryManager.findPlaneById(parseInt(planeSelect.value));

    if (!line || !plane) {
        resultDisplay.innerHTML = "Veuillez sélectionner une droite et un plan valides.";
        return;
    }

    const p0 = line.startPoint;
    const v = line.directorVector;
    const planePoint = plane.pointOnPlane;
    const n = plane.displayNormal;
    const dotNV = n.dot(v);

    if (Math.abs(dotNV) < 1e-6) {
        const pointIsOnPlane = Math.abs(n.dot(new THREE.Vector3().subVectors(p0, planePoint))) < 1e-6;
        resultDisplay.innerHTML = pointIsOnPlane ? 
            "La droite est contenue dans le plan." : 
            "La droite est parallèle au plan (aucune intersection).";
        return;
    }

    const t = n.dot(new THREE.Vector3().subVectors(planePoint, p0)) / dotNV;
    const intersectionPoint = new THREE.Vector3().copy(p0).addScaledVector(v, t);

    // Mise à jour UI
    const uniqueName = geometryManager.generateUniqueName(`Intersect(${line.name},${plane.name})`, "point");
    document.getElementById("pointName").value = uniqueName;
    document.getElementById("pointX").value = formatNumber(intersectionPoint.x);
    document.getElementById("pointY").value = formatNumber(intersectionPoint.z); // Z ThreeJS -> Y UI
    document.getElementById("pointZ").value = formatNumber(intersectionPoint.y); // Y ThreeJS -> Z UI

    resultDisplay.innerHTML = `Point calculé : <strong>(${formatNumber(intersectionPoint.x)}, ${formatNumber(intersectionPoint.z)}, ${formatNumber(intersectionPoint.y)})</strong><br>Pré-rempli dans "Ajouter un point".`;
}
```
