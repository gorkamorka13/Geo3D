// =====================================================================================
// SECTION 1 : CLASSES DES OBJETS GÉOMÉTRIQUES
// =====================================================================================

/**
 * Classe représentant un point 3D.
 */
class Point {
  constructor(name, x, y, z, color = 0xff6b35, derivedFrom = null) {
    this.name = name;
    this.position = new THREE.Vector3(x, y, z);
    this.color = new THREE.Color(color);
    this.derivedFrom = derivedFrom;
    this.isVisible = true; // Propriété de visibilité pour cohérence avec les autres objets
    const sphereGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
    });
    this.mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.mesh.position.copy(this.position);
    this.mesh.userData = { type: "point", instance: this };
    this.label = createGenericTextLabel(name);
    this.updateLabelPosition();
  }
  // Dans la classe Point
  createTextLabel(text) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 512;
    canvas.height = 256;

    // Vider le canvas pour un fond transparent
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.font = "Bold 96px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.strokeStyle = "white";
    context.lineWidth = 12;
    context.strokeText(text, canvas.width / 2, canvas.height / 2);
    context.fillStyle = "black";
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    // La correction est ici
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false, // Garantit que le label est toujours visible
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 1, 1);
    sprite.center.set(0.5, 0);
    return sprite;
  }

  updateLabelPosition() {
    this.label.position.set(
      this.position.x,
      this.position.y + 0.35,
      this.position.z,
    );
  }
  setVisibility(visible) {
    this.isVisible = visible;
    this.mesh.visible = visible;
    this.label.visible = visible;
  }
  update(name, x, y, z) {
    this.name = name;
    this.position.set(x, y, z);
    this.mesh.position.copy(this.position);
    scene.remove(this.label);
    this.label = createGenericTextLabel(name);
    this.updateLabelPosition();
    scene.add(this.label);
  }
  addToScene(scene) {
    // On s'assure que les points ont un renderOrder plus élevé que les axes
    this.mesh.renderOrder = 10;
    this.label.renderOrder = 11; // Les labels doivent Ãªtre au-dessus des points

    scene.add(this.mesh);
    scene.add(this.label);
  }
  removeFromScene(scene) {
    scene.remove(this.mesh);
    scene.remove(this.label);
    if (this.mesh.geometry) this.mesh.geometry.dispose();
    if (this.mesh.material) this.mesh.material.dispose();
    if (this.label.material) {
      if (this.label.material.map) this.label.material.map.dispose(); // Texture du texte
      this.label.material.dispose();
    }
  }
}

/**
 * Classe représentant une droite 3D.
 */
class Line3D {
  constructor(
    name,
    startPoint,
    directorVector,
    color = 0x00ced1,
    derivedFrom = null,
  ) {
    this.id = nextStraightLineId++;
    this.name = name;
    this.startPoint = startPoint.clone();
    this.directorVector = directorVector.clone();
    this.color = new THREE.Color(color);
    this.derivedFrom = derivedFrom;
    this.isVisible = true;
    const lineLength = 100;
    const dir = this.directorVector.clone().normalize();
    const visualStart = new THREE.Vector3().addVectors(
      this.startPoint,
      dir.clone().multiplyScalar(-lineLength),
    );
    const visualEnd = new THREE.Vector3().addVectors(
      this.startPoint,
      dir.clone().multiplyScalar(lineLength),
    );
    const geometry = new THREE.BufferGeometry().setFromPoints([
      visualStart,
      visualEnd,
    ]);
    const material = new THREE.LineBasicMaterial({ color: this.color });
    this.mesh = new THREE.Line(geometry, material);
    this.mesh.userData = { type: "line", instance: this };
  }

  // --- NOUVELLE MÉTHODE Ã€ AJOUTER ---
  setVisibility(visible) {
    this.isVisible = visible;
    this.mesh.visible = visible;
  }
  // --- FIN DE L'AJOUT ---

  addToScene(scene) {
    scene.add(this.mesh);
  }
  removeFromScene(scene) {
    scene.remove(this.mesh);
    if (this.mesh.geometry) this.mesh.geometry.dispose();
    if (this.mesh.material) this.mesh.material.dispose();
  }
}
/**
 * Classe représentant un plan 3D.
 */
class Plane {
  constructor(
    name,
    pointOnPlane,
    normal, // C'est le vecteur AVANT normalisation
    color = 0xffeb3b,
    derivedFrom = null,
  ) {
    this.id = nextPlaneId++;
    this.name = name;
    this.pointOnPlane = pointOnPlane.clone();

    // --- MODIFICATION ---
    // On stocke le vecteur original pour l'affichage des équations
    this.displayNormal = normal.clone();
    // On utilise le vecteur normalisé pour le rendu 3D
    this.normal = normal.clone().normalize();
    // --- FIN DE LA MODIFICATION ---

    this.color = new THREE.Color(color);
    this.derivedFrom = derivedFrom;
    this.isVisible = true;
    const planeGeometry = new THREE.PlaneGeometry(15, 15);
    const planeMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.4, // Opacité réduite pour une meilleure visibilité des axes
      side: THREE.DoubleSide,
      depthWrite: false, // Important pour la visibilité des axes
      polygonOffset: true, // Évite les problèmes de z-fighting
      polygonOffsetFactor: 1, // Ajuste la profondeur du plan
      polygonOffsetUnits: 1,
    });
    this.mesh = new THREE.Mesh(planeGeometry, planeMaterial);
    this.mesh.position.copy(this.pointOnPlane);
    // La normalisation est importante pour la ligne suivante
    this.mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      this.normal,
    );
    this.mesh.userData = { type: "plane", instance: this };
  }
  // ... le reste de la classe (setVisibility, addToScene, etc.) ne change pas
  setVisibility(visible) {
    this.isVisible = visible;
    this.mesh.visible = visible;
  }
  addToScene(scene) {
    scene.add(this.mesh);
  }
  removeFromScene(scene) {
    scene.remove(this.mesh);
    if (this.mesh.geometry) this.mesh.geometry.dispose();
    if (this.mesh.material) this.mesh.material.dispose();
  }
}
/**
 * Classe représentant un vecteur 3D.
 */

class Vector {
  constructor(name, origin, components, color = 0xffa500, derivedFrom = null) {
    this.id = nextVectorId++;
    this.name = name;
    this.origin = origin.clone();
    this.components = components.clone();
    this.color = new THREE.Color(color);
    this.derivedFrom = derivedFrom;
    this.isVisible = true;
    this.arrowHelper = null;

    // --- AJOUTS POUR L'ÉTIQUETTE ---
    this.isLabelVisible = true; // Par défaut, l'étiquette est visible
    this.label = createGenericTextLabel(name);
    this.updateLabelPosition();
    // --- FIN DES AJOUTS ---

    this.createArrowHelper();
  }

  // --- NOUVELLE MÉTHODE (copiée de la classe Point) ---
  createTextLabel(text) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 512;
    canvas.height = 256;

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.font = "Bold 96px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.strokeStyle = "white";
    context.lineWidth = 12;
    context.strokeText(text, canvas.width / 2, canvas.height / 2);
    context.fillStyle = "black";
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 1, 1);
    sprite.center.set(0.5, 0);
    return sprite;
  }

  // --- NOUVELLE MÉTHODE ---
  updateLabelPosition() {
    if (!this.label) return;
    // Positionne l'étiquette au milieu du vecteur
    const midPoint = new THREE.Vector3().addVectors(
      this.origin,
      this.components.clone().multiplyScalar(0.5),
    );
    this.label.position.copy(midPoint);
    // On peut ajouter un petit décalage pour éviter que ce soit directement sur la flèche
    this.label.position.y += 0.2;
  }

  // --- NOUVELLE MÉTHODE ---
  setLabelVisibility(visible) {
    this.isLabelVisible = visible;
    if (this.label) {
      this.label.visible = visible;
    }
  }

  createArrowHelper() {
    if (this.arrowHelper) this.removeFromScene(scene);
    const length = this.components.length();
    if (length > 1e-6) {
      this.arrowHelper = new THREE.ArrowHelper(
        this.components.clone().normalize(),
        this.origin,
        length,
        this.color,
        0.4,
        0.2,
      );
      this.arrowHelper.line.userData = { type: "vector", instance: this };
      this.arrowHelper.cone.userData = { type: "vector", instance: this };
    } else {
      this.arrowHelper = null;
    }
  }

  update(name, origin, components) {
    this.name = name;
    this.origin.copy(origin);
    this.components.copy(components);

    // --- MISE Ã€ JOUR DE L'ÉTIQUETTE ---
    if (this.label) scene.remove(this.label);
    this.label = createGenericTextLabel(name);
    this.updateLabelPosition();
    if (this.isVisible) scene.add(this.label);
    this.setLabelVisibility(this.isLabelVisible); // Applique la visibilité actuelle
    // --- FIN DE LA MISE Ã€ JOUR ---

    this.createArrowHelper();
    this.addToScene(scene);
    this.setVisibility(this.isVisible);
  }

  setVisibility(visible) {
    this.isVisible = visible;
    if (this.arrowHelper) this.arrowHelper.visible = visible;
    // --- AJOUT ---
    // La visibilité globale du vecteur affecte aussi son étiquette
    if (this.label) this.label.visible = visible && this.isLabelVisible;
  }

  addToScene(scene) {
    if (this.arrowHelper) scene.add(this.arrowHelper);
    // --- AJOUT ---
    if (this.label) {
      this.label.renderOrder = 11; // Pour Ãªtre au-dessus des autres objets
      scene.add(this.label);
    }
  }

  removeFromScene(scene) {
    if (this.arrowHelper) scene.remove(this.arrowHelper);
    // --- AJOUT ---
    if (this.label) scene.remove(this.label);
  }
}
// =====================================================================================

// Expose classes to window for browser global access
