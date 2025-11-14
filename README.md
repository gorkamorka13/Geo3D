# Visualiseur de Géométrie 3D
## ✨ Fonctionnalités Actuelles

Ce visualiseur est construit comme une application *single-page* et ne nécessite aucune installation. Il offre les fonctionnalités suivantes :

*   **Gestion de Points**
    *   Créez des points en spécifiant leur nom et leurs coordonnées (X, Y, Z).
    *   Visualisez la liste de tous les points existants.
    *   Masquez, affichez ou supprimez n'importe quel point individuellement.

*   **Création d'Objets Géométriques**
    *   **Segments** : Tracez un segment de droite entre deux points existants.
    *   **Plans** : Générez un plan infini à partir de trois points non colinéaires.
    *   **Droites** : Créez des droites infinies via plusieurs méthodes :
        *   À partir de deux points.
        *   À partir d'un point de passage et d'un vecteur directeur.
        *   À partir de leur équation paramétrique.

*   **Analyse Géométrique**
    *   **Équation de Plan** : Sélectionnez un plan pour afficher son équation cartésienne (`ax + by + cz + d = 0`).
    *   **Équation de Droite** : Sélectionnez une droite pour afficher sa représentation paramétrique.

*   **Scène 3D Interactive**
    *   **Contrôles Orbitaux** : Tournez, zoomez et déplacez-vous librement dans la scène avec la souris.
    *   **Aides Visuelles** : Des axes (X, Y, Z) et une grille au sol sont présents pour faciliter le repérage dans l'espace.

---

## 🚀 Démarrage Rapide

Ce projet est conçu pour être extrêmement simple à lancer.

1.  **Téléchargement** :
    *   Téléchargez le fichier `index.html`.
    *   (Ou clonez ce dépôt : `git clone https://votre-url-de-depot.git`)

2.  **Lancement** :
    *   Ouvrez le fichier `index.html` directement dans un navigateur web moderne (Chrome, Firefox, Edge, Safari).

Et c'est tout ! Aucune installation de serveur ou de dépendances n'est requise.

---

## 🛠️ Comment l'utiliser

L'interface est divisée en deux parties : le **panneau de contrôle** à gauche et la **scène 3D** à droite.

1.  **Créez des Points** : Commencez par utiliser la section "📍 Points" pour ajouter quelques points de base à votre scène.
2.  **Construisez des Objets** : Utilisez les points que vous venez de créer dans les sections "📏 Segments", "📐 Plans" ou "➡️ Droites" pour construire des objets plus complexes.
3.  **Explorez** : Naviguez dans la scène 3D en utilisant votre souris :
    *   **Clic gauche + Glisser** : Rotation de la caméra.
    *   **Clic droit + Glisser** : Déplacement de la caméra (pan).
    *   **Molette** : Zoom avant / arrière.
4.  **Analysez** : Rendez-vous dans la section "🧮 Équations géométriques" pour inspecter les équations des droites et des plans que vous avez créés.

---

## ⚙️ Technologies Utilisées

Ce projet repose entièrement sur des technologies web front-end standards.

*   **HTML5** : Pour la structure de la page.
*   **CSS3** : Pour le style et la mise en page du panneau de contrôle (intégré dans la balise `<style>`).
*   **JavaScript (ES6+)** : Pour toute la logique de l'application, les calculs géométriques et la manipulation de la scène.
*   **Three.js (r128)** : La bibliothèque WebGL qui sert de moteur pour tout le rendu 3D.

---

## 🔮 Évolutions Futures

Ce projet est en cours de développement. De nombreuses améliorations sont prévues pour en faire un outil encore plus puissant. Parmi elles :

*   **Interactivité 3D** : Sélection et modification des objets directement dans la scène.
*   **Calculs d'intersections** (droite-plan, plan-plan, etc.).
*   **Outils de mesure** (distances, angles).
*   **Refactoring du code** vers une structure Orientée Objet pour une meilleure maintenabilité.

Pour une liste complète et détaillée des améliorations prévues, consultez le fichier [AMENDEMENTS.md](AMENDEMENTS.md).

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Si vous souhaitez améliorer cet outil, n'hésitez pas à :
1.  Forker le projet.
2.  Créer une nouvelle branche (`git checkout -b feature/NouvelleFonctionnalite`).
3.  Faire vos modifications.
4.  Soumettre une *Pull Request*.

Vous pouvez également ouvrir une *issue* pour signaler un bug ou suggérer une nouvelle fonctionnalité.

---

## 📝 Licence

Ce projet est distribué sous la licence MIT. Voir le fichier `LICENSE` pour plus de détails.
