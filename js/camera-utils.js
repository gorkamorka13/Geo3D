// SECTION 8 : CONTRÃ”LE CAMÉRA ET FONCTIONS UTILITAIRES
// =====================================================================================
let areAllObjectsVisible = true; // État global

function toggleGlobalVisibility() {
  areAllObjectsVisible = !areAllObjectsVisible;

  // 1. Mise à jour visuelle du bouton global
  const btnIcon = document.querySelector("#globalVisBtn i");
  if (btnIcon) {
    btnIcon.className = areAllObjectsVisible
      ? "fas fa-eye"
      : "fas fa-eye-slash";
    btnIcon.style.color = areAllObjectsVisible ? "var(--text-color)" : "#888"; // Grisé si masqué
  }

  // 2. Application aux POINTS
  geometryManager.points.forEach((p) => {
    if (typeof p.setVisibility === "function") {
      p.setVisibility(areAllObjectsVisible);
    }
  });

  // 3. Application aux VECTEURS
  geometryManager.vectors.forEach((v) => {
    if (typeof v.setVisibility === "function") {
      v.setVisibility(areAllObjectsVisible);
    }
  });

  // 4. Application aux DROITES
  geometryManager.lines.forEach((l) => {
    if (typeof l.setVisibility === "function") {
      l.setVisibility(areAllObjectsVisible);
    }
  });

  // 5. Application aux PLANS
  geometryManager.planes.forEach((p) => {
    if (typeof p.setVisibility === "function") {
      p.setVisibility(areAllObjectsVisible);
    }
  });

  // 6. Rafraîchir toute l'interface (pour mettre à jour les icônes des listes)
  updateAllUI();

  showSplashScreen(
    areAllObjectsVisible ? "👁️  Tout afficher" : "🙈 Tout masquer",
  );
}

function expandSectionAndScrollToItem(itemId, listId) {
  const listElement = document.getElementById(listId);
  if (!listElement) return;

  // 1. Trouver la section parente et la déplier si elle est fermée
  const section = listElement.closest(".section.collapsible");
  if (section && section.classList.contains("collapsed")) {
    section.classList.remove("collapsed");
  }

  // 2. On ne fait PLUS défiler la page.
  // La ligne suivante est supprimée :
  // itemElement.scrollIntoView({ behavior: "smooth", block: "center" });
}

function togglePanel() {
  const p = document.getElementById("panel");
  const o = document.getElementById("openBtn");

  // 1. NETTOYAGE CRITIQUE :
  // On s'assure d'enlever la classe qui bloque l'animation (utilisée par le swipe)
  p.classList.remove("no-transition");

  // On supprime toute position "en dur" laissée par un éventuel swipe inachevé
  p.style.transform = "";

  // 2. BASCULE LOGIQUE
  panelOpen = !panelOpen;

  // 3. APPLICATION DES CLASSES
  // Le CSS 'transition: transform 0.3s' fera le reste
  p.classList.toggle("hidden", !panelOpen);
  o.classList.toggle("show", !panelOpen);
}

function ensurePanelVisible() {
  // La variable globale 'panelOpen' nous indique l'état actuel du panneau.
  if (!panelOpen) {
    // Si le panneau n'est pas ouvert, on appelle la fonction existante pour l'ouvrir.
    togglePanel();
  }
}

function updateCameraPosition() {
  camera.position.x =
    cameraTarget.x +
    cameraDistance * Math.sin(cameraRotation.y) * Math.cos(cameraRotation.x);
  camera.position.y =
    cameraTarget.y + cameraDistance * Math.sin(cameraRotation.x);
  camera.position.z =
    cameraTarget.z +
    cameraDistance * Math.cos(cameraRotation.y) * Math.cos(cameraRotation.x);
  camera.lookAt(cameraTarget);
}

function onMouseDown(e) {
  if (isGizmoDragging) return; // <--- AJOUT IMPORTANT
  wasDragged = false;
  if (e.target.closest("#cameraControls")) return;
  if (e.button === 0) isDragging = true;
  else if (e.button === 2) isPanning = true;
  previousMousePosition = { x: e.clientX, y: e.clientY };
}

function onMouseMove(e) {
  if (isGizmoDragging) return;
  lastTooltipX = e.clientX;
  lastTooltipY = e.clientY;
  const dX = e.clientX - previousMousePosition.x,
    dY = e.clientY - previousMousePosition.y;
  if (isDragging || isPanning)
    if (Math.abs(dX) > 3 || Math.abs(dY) > 3) wasDragged = true;
  if (isDragging) {
    cameraRotation.y += dX * 0.005;
    cameraRotation.x += dY * 0.005;
    cameraRotation.x = Math.max(
      -Math.PI / 2 + 0.1,
      Math.min(Math.PI / 2 - 0.1, cameraRotation.x),
    );
    updateCameraPosition();
  } else if (isPanning) panCamera(dX, dY);
  previousMousePosition = { x: e.clientX, y: e.clientY };
  if (!isDragging && !isPanning) {
    handleHover(e.clientX, e.clientY);
  }
}

function onMouseUp() {
  isDragging = false;
  isPanning = false;
}

function onWheel(e) {
  e.preventDefault();
  zoomCamera(e.deltaY * 0.01);
}

function panCamera(dX, dY) {
  // Vitesse dynamique : plus on est loin, plus Ã§a bouge vite
  // 0.002 est un facteur de sensibilité (ajustable)
  const speed = cameraDistance * 0.002;

  const r = new THREE.Vector3();
  camera.getWorldDirection(r);

  const u = camera.up.clone();

  // Produit vectoriel pour avoir la droite/gauche par rapport à la vue
  r.cross(u).normalize();

  // Déplacement du point cible (Target)
  // Note : On inverse dX pour que le mouvement suive le doigt
  cameraTarget.addScaledVector(r, -dX * speed);
  cameraTarget.addScaledVector(u, dY * speed);

  updateCameraPosition();
}

function zoomCamera(d) {
  cameraDistance = Math.max(3, Math.min(50, cameraDistance + d));
  updateCameraPosition();
}

function resetCamera(btn) {
  setCameraView("isometric", btn);
}

function setCameraView(v, btn) {
  cameraTarget.set(0, 0, 0);
  cameraDistance = 15;
  switch (v) {
    case "top": // Vue de dessus (regarde le plan XY de l'utilisateur, donc XZ interne)
      cameraRotation.x = Math.PI / 2 - 0.001;
      cameraRotation.y = 0;
      break;
    case "front": // Vue de face (regarde le plan XZ de l'utilisateur, donc XY interne)
      cameraRotation.x = 0;
      cameraRotation.y = Math.PI / 2; // On tourne la caméra pour voir le plan XY interne
      break;
    case "side": // Vue de côté (regarde le plan YZ de l'utilisateur, donc YZ interne)
      cameraRotation.x = 0;
      cameraRotation.y = 0;
      break;
    default: // Vue isométrique
      cameraRotation.x = 0.5;
      cameraRotation.y = 0.5;
  }
  updateCameraPosition();
  toggleButtonState(btn);
}

function toggleButtonState(btn) {
  document
    .querySelectorAll("#cameraControls .camera-btn")
    .forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".section-header").forEach((header) => {
    header.addEventListener("click", () =>
      header.closest(".section").classList.toggle("collapsed"),
    );
  });
  init();
  const resetBtn = document.getElementById("btnReset");
  resetCamera(resetBtn);
});

function applyTranslation() {
  if (!selectedObjectInstance) {
    showSplashScreen("Aucun objet n'est sélectionné.");
    return;
  }

  // 1. Récupération des valeurs de l'interface
  const dx = parseFloat(document.getElementById("transX").value) || 0;
  const dy_ui = parseFloat(document.getElementById("transY").value) || 0; // L'utilisateur pense "Y" (Profondeur)
  const dz_ui = parseFloat(document.getElementById("transZ").value) || 0; // L'utilisateur pense "Z" (Hauteur)

  // 2. CORRECTION DE L'AXE : Conversion vers le repère Three.js
  // Three.js X = UI X
  // Three.js Y (Vertical) = UI Z (Hauteur)
  // Three.js Z (Profondeur) = UI Y (Profondeur)
  const translationVector = new THREE.Vector3(dx, dz_ui, dy_ui);

  const inst = selectedObjectInstance;

  // 3. Application de la translation selon le type d'objet
  if (inst instanceof Point) {
    const newPos = inst.position.clone().add(translationVector);
    // Note : update() attend (nom, x, z, y) car elle refait la conversion en interne,
    // mais ici on manipule directement des positions Three.js, donc on passe x, y, z du vecteur position
    // C'est une petite subtilité : on met à jour la position brute.
    inst.position.copy(newPos);
    inst.mesh.position.copy(inst.position);
    inst.updateLabelPosition();
  } else if (inst instanceof Vector) {
    const newOrigin = inst.origin.clone().add(translationVector);
    // Pour le vecteur, on met à jour l'origine, les composantes ne changent pas
    inst.update(inst.name, newOrigin, inst.components);
  } else if (inst instanceof Plane) {
    inst.pointOnPlane.add(translationVector);
    inst.mesh.position.copy(inst.pointOnPlane);
  } else if (inst instanceof Line3D) {
    // Déplacer le point de départ
    inst.startPoint.add(translationVector);

    // Recalculer la géométrie visuelle
    const lineLength = 100;
    const dir = inst.directorVector.clone().normalize();
    const start = new THREE.Vector3().addVectors(
      inst.startPoint,
      dir.clone().multiplyScalar(-lineLength),
    );
    const end = new THREE.Vector3().addVectors(
      inst.startPoint,
      dir.clone().multiplyScalar(lineLength),
    );

    // Mise à jour propre de la géométrie
    inst.mesh.geometry.dispose(); // Nettoyage mémoire
    inst.mesh.geometry = new THREE.BufferGeometry().setFromPoints([start, end]);

    // Réinitialiser la couleur si nécessaire (garde la sélection active visuellement)
    if (inst === selectedObjectInstance) {
      inst.mesh.material.color.set(HIGHLIGHT_COLOR);
    }
  }

  // 4. Mise à jour de l'interface (notamment les coordonnées dans la liste)
  updateAllUI();
  saveState();
}

function applyRotation() {
  if (!selectedObjectInstance) {
    showSplashScreen("Aucun objet n'est sélectionné.");
    return;
  }

  // 1. Récupération de l'angle
  const angleDeg =
    parseFloat(document.getElementById("rotationAngle").value) || 0;
  const angleRad = (angleDeg * Math.PI) / 180;

  // 2. Récupération et correction de l'Axe
  const axisSelect = document.getElementById("rotationAxisSelect");
  const axisValue = axisSelect.value.toLowerCase().trim(); // Sécurité contre les majuscules/espaces

  let rotationAxis;

  // --- C'EST ICI QUE SE JOUE LA CORRECTION ---
  if (axisValue === "x") {
    // Axe X (Rouge) : Ne change pas
    rotationAxis = new THREE.Vector3(1, 0, 0);
  } else if (axisValue === "y") {
    // L'utilisateur choisit "Axe Y" (Profondeur dans votre interface)
    // Cela correspond à l'axe Z de Three.js (L'axe BLEU)
    rotationAxis = new THREE.Vector3(0, 0, 1);
  } else {
    // L'utilisateur choisit "Axe Z" (Hauteur/Verticale)
    // Cela correspond à l'axe Y de Three.js (L'axe VERT)
    rotationAxis = new THREE.Vector3(0, 1, 0);
  }

  // 3. Récupération du centre de rotation
  const centerValue = document.getElementById("rotationCenterSelect").value;
  const centerOfRotation =
    centerValue === "origin"
      ? new THREE.Vector3(0, 0, 0)
      : geometryManager.points[parseInt(centerValue)].position.clone();

  const inst = selectedObjectInstance;

  // Helper : Appliquer la rotation mathématique à un point
  const rotatePoint = (p, c) => {
    p.sub(c); // Ramener au centre relatif
    p.applyAxisAngle(rotationAxis, angleRad); // Tourner
    p.add(c); // Remettre à la position absolue
  };

  // 4. Application de la rotation selon le type d'objet
  if (inst instanceof Point) {
    const newPos = inst.position.clone();
    rotatePoint(newPos, centerOfRotation);

    // Mise à jour directe des positions Three.js
    inst.position.copy(newPos);
    inst.mesh.position.copy(inst.position);
    inst.updateLabelPosition();
  } else if (inst instanceof Vector) {
    const newOrigin = inst.origin.clone();
    rotatePoint(newOrigin, centerOfRotation);

    // Le vecteur lui-mÃªme (ses composantes) tourne aussi
    const newComponents = inst.components
      .clone()
      .applyAxisAngle(rotationAxis, angleRad);

    inst.update(inst.name, newOrigin, newComponents);
  } else if (inst instanceof Plane) {
    rotatePoint(inst.pointOnPlane, centerOfRotation);

    // La normale du plan tourne aussi
    inst.normal.applyAxisAngle(rotationAxis, angleRad);
    inst.displayNormal.applyAxisAngle(rotationAxis, angleRad);

    inst.mesh.position.copy(inst.pointOnPlane);
    inst.mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      inst.normal.clone().normalize(),
    );
  } else if (inst instanceof Line3D) {
    rotatePoint(inst.startPoint, centerOfRotation);
    inst.directorVector.applyAxisAngle(rotationAxis, angleRad);

    // Recalcul géométrie (identique au fix de translation)
    const lineLength = 100;
    const dir = inst.directorVector.clone().normalize();
    const start = new THREE.Vector3().addVectors(
      inst.startPoint,
      dir.clone().multiplyScalar(-lineLength),
    );
    const end = new THREE.Vector3().addVectors(
      inst.startPoint,
      dir.clone().multiplyScalar(lineLength),
    );

    inst.mesh.geometry.dispose();
    inst.mesh.geometry = new THREE.BufferGeometry().setFromPoints([start, end]);

    // Conserver la couleur de sélection
    if (inst === selectedObjectInstance) {
      inst.mesh.material.color.set(HIGHLIGHT_COLOR);
    }
  }

  updateAllUI();
  saveState();
}

function updateSymmetryUI() {
  const type = document.getElementById("symmetryTypeSelect").value;
  const container = document.getElementById("symmetryOptionsContainer");
  const applyBtn = document.getElementById("applySymmetryBtn");
  container.innerHTML = ""; // Vider les anciennes options

  if (!type) {
    applyBtn.style.display = "none";
    return;
  }

  // Liste des types qui nécessitent une sélection d'objet dans la scène
  const needsSelection = ["point", "line", "plane"];

  if (!needsSelection.includes(type)) {
    // CAS 1 : Symétrie "Fixe" (Origine, Axes, Plans principaux)
    // Pas de menu secondaire, on affiche juste le bouton
    container.innerHTML = `<p style="font-size:11px; color:#666; margin:5px 0;">Symétrie standard sélectionnée.</p>`;
    applyBtn.style.display = "block";
    return;
  }

  // CAS 2 : Symétrie par rapport à un objet existant (Code existant)
  let selectHTML = `<label>Référence :</label><select id="symmetryRefSelect" style="width: 100%;">`;
  let hasOptions = false;

  if (type === "point") {
    if (geometryManager.points.length > 0) {
      geometryManager.points.forEach((p, i) => {
        selectHTML += `<option value="${i}">${p.name}</option>`;
      });
      hasOptions = true;
    } else {
      selectHTML += `<option value="">Aucun point disponible</option>`;
    }
  } else if (type === "line") {
    if (geometryManager.lines.length > 0) {
      geometryManager.lines.forEach((l) => {
        selectHTML += `<option value="${l.id}">${l.name}</option>`;
      });
      hasOptions = true;
    } else {
      selectHTML += `<option value="">Aucune droite disponible</option>`;
    }
  } else if (type === "plane") {
    if (geometryManager.planes.length > 0) {
      geometryManager.planes.forEach((p) => {
        selectHTML += `<option value="${p.id}">${p.name}</option>`;
      });
      hasOptions = true;
    } else {
      selectHTML += `<option value="">Aucun plan disponible</option>`;
    }
  }

  selectHTML += `</select>`;
  container.innerHTML = selectHTML;
  applyBtn.style.display = hasOptions ? "block" : "none";
}

function applySymmetry() {
  if (!selectedObjectInstance) {
    showSplashScreen("Aucun objet n'est sélectionné.");
    return;
  }

  const type = document.getElementById("symmetryTypeSelect").value;
  let refObject = null;

  // Gestion des types nécessitant une référence
  if (["point", "line", "plane"].includes(type)) {
    const refId = document.getElementById("symmetryRefSelect").value;
    if (!refId) return;
    if (type === "point") refObject = geometryManager.points[parseInt(refId)];
    else if (type === "line")
      refObject = geometryManager.findLineById(parseInt(refId));
    else if (type === "plane")
      refObject = geometryManager.findPlaneById(parseInt(refId));
  }

  // --- FONCTION DE TRANSFORMATION UNIFIÉE ---
  // Cette fonction prend un Vector3 (position) et renvoie le nouveau Vector3 transformé
  const transformVector = (v) => {
    const p = v.clone();

    switch (type) {
      // --- CAS STANDARD (Fixes) ---
      case "origin":
        return p.negate(); // (-x, -y, -z)

      case "axis_x": // Symétrie axe X : on garde X, on inverse le reste
        return new THREE.Vector3(p.x, -p.y, -p.z);

      case "axis_y": // UI Axe Y (Profondeur) -> ThreeJS Axe Z. On garde Z, on inverse X et Y(hauteur)
        return new THREE.Vector3(-p.x, -p.y, p.z);

      case "axis_z": // UI Axe Z (Hauteur) -> ThreeJS Axe Y. On garde Y, on inverse X et Z
        return new THREE.Vector3(-p.x, p.y, -p.z);

      case "plane_xy": // UI Plan XY (Sol) -> On inverse la Hauteur (ThreeJS Y)
        return new THREE.Vector3(p.x, -p.y, p.z);

      case "plane_xz": // UI Plan XZ (Face) -> On inverse la Profondeur (ThreeJS Z)
        return new THREE.Vector3(p.x, p.y, -p.z);

      case "plane_yz": // UI Plan YZ (Côté) -> On inverse X
        return new THREE.Vector3(-p.x, p.y, p.z);

      // --- CAS AVANCÉS (Objets de référence) ---
      case "point":
        // p' = center - (p - center) = 2*center - p
        return refObject.position.clone().multiplyScalar(2).sub(p);

      case "line":
        const lineStart = refObject.startPoint;
        const lineDir = refObject.directorVector.clone().normalize();
        const vStartToP = new THREE.Vector3().subVectors(p, lineStart);
        const projection = lineDir.multiplyScalar(vStartToP.dot(lineDir));
        const projectedPoint = new THREE.Vector3().addVectors(
          lineStart,
          projection,
        );
        // p' = proj - (p - proj) = 2*proj - p
        return projectedPoint.multiplyScalar(2).sub(p);

      case "plane":
        const vP0P = new THREE.Vector3().subVectors(p, refObject.pointOnPlane);
        const dist = vP0P.dot(refObject.normal); // Distance signée
        // p' = p - 2 * dist * normal
        return p.clone().addScaledVector(refObject.normal, -2 * dist);

      default:
        return p;
    }
  };

  // --- APPLICATION DE LA TRANSFORMATION Ã€ L'OBJET SÉLECTIONNÉ ---
  const inst = selectedObjectInstance;

  if (inst instanceof Point) {
    const newPos = transformVector(inst.position);
    inst.update(inst.name, newPos.x, newPos.y, newPos.z); // Note: update gère l'inversion Y/Z interne si on passe des coords brutes, ici on passe x,y,z du vecteur ThreeJS, donc attention.
    // CORRECTION POUR POINT : update() prend (x, y_ui, z_ui).
    // Si on a un vecteur ThreeJS (x, y_3js, z_3js), y_ui = z_3js et z_ui = y_3js.
    // MAIS votre classe Point stocke directement new THREE.Vector3(x, y, z).
    // La méthode update() fait : this.position.set(x, y, z).
    // Donc on peut simplement faire :
    inst.position.copy(newPos);
    inst.mesh.position.copy(inst.position);
    inst.updateLabelPosition();
  } else if (inst instanceof Vector) {
    const newOrigin = transformVector(inst.origin);
    const endPoint = new THREE.Vector3().addVectors(
      inst.origin,
      inst.components,
    );
    const newEndPoint = transformVector(endPoint);
    const newComponents = new THREE.Vector3().subVectors(
      newEndPoint,
      newOrigin,
    );

    inst.update(inst.name, newOrigin, newComponents);
  } else if (inst instanceof Line3D) {
    const newStart = transformVector(inst.startPoint);
    // Pour le vecteur directeur, on transforme le point "start + dir" et on soustrait le nouveau start
    const endPoint = new THREE.Vector3().addVectors(
      inst.startPoint,
      inst.directorVector,
    );
    const newEnd = transformVector(endPoint);
    const newDir = new THREE.Vector3().subVectors(newEnd, newStart);

    // Mise à jour manuelle (similaire à translation/rotation)
    inst.startPoint.copy(newStart);
    inst.directorVector.copy(newDir);

    const lineLength = 100;
    const dir = inst.directorVector.clone().normalize();
    const start = new THREE.Vector3().addVectors(
      inst.startPoint,
      dir.clone().multiplyScalar(-lineLength),
    );
    const end = new THREE.Vector3().addVectors(
      inst.startPoint,
      dir.clone().multiplyScalar(lineLength),
    );

    inst.mesh.geometry.dispose();
    inst.mesh.geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    if (inst === selectedObjectInstance)
      inst.mesh.material.color.set(HIGHLIGHT_COLOR);
  } else if (inst instanceof Plane) {
    // Transformation du point d'ancrage
    const newPointOnPlane = transformVector(inst.pointOnPlane);

    // Transformation de la normale : on transforme (point + normal) et on soustrait le nouveau point
    const pointPlusNormal = new THREE.Vector3().addVectors(
      inst.pointOnPlane,
      inst.normal,
    );
    const newPointPlusNormal = transformVector(pointPlusNormal);
    const newNormal = new THREE.Vector3()
      .subVectors(newPointPlusNormal, newPointOnPlane)
      .normalize();

    inst.pointOnPlane.copy(newPointOnPlane);
    inst.normal.copy(newNormal);
    inst.displayNormal.copy(newNormal);

    inst.mesh.position.copy(inst.pointOnPlane);
    inst.mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      inst.normal,
    );
  }

  updateAllUI();
  saveState();
}

// ===== Export/Import de scènes via fichiers JSON =====

function exportSceneToJSON() {
  // Sérialiser la géométrie actuelle
  const sceneData = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    geometry: {
      points: geometryManager.points.map((p) => ({
        name: p.name,
        position: { x: p.position.x, y: p.position.y, z: p.position.z },
      })),
      vectors: geometryManager.vectors.map((v) => ({
        id: v.id,
        name: v.name,
        origin: { x: v.origin.x, y: v.origin.y, z: v.origin.z },
        components: { x: v.components.x, y: v.components.y, z: v.components.z },
        isLabelVisible: v.isLabelVisible,
      })),
      lines: geometryManager.lines.map((l) => ({
        id: l.id,
        name: l.name,
        startPoint: { x: l.startPoint.x, y: l.startPoint.y, z: l.startPoint.z },
        directorVector: {
          x: l.directorVector.x,
          y: l.directorVector.y,
          z: l.directorVector.z,
        },
      })),
      planes: geometryManager.planes.map((p) => ({
        id: p.id,
        name: p.name,
        pointOnPlane: {
          x: p.pointOnPlane.x,
          y: p.pointOnPlane.y,
          z: p.pointOnPlane.z,
        },
        displayNormal: {
          x: p.displayNormal.x,
          y: p.displayNormal.y,
          z: p.displayNormal.z,
        },
      })),
    },
  };

  // Créer un blob et télécharger le fichier
  const jsonString = JSON.stringify(sceneData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  // Créer un nom de fichier avec timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const filename = `scene_${timestamp}.json`;

  // Télécharger le fichier
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showSplashScreen(`✅ Scène exportée : ${filename}`);
}

function importSceneFromJSON(inputElement) {
  const file = inputElement.files[0];
  if (!file) {
    showSplashScreen("❌ Aucun fichier sélectionné.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const sceneData = JSON.parse(e.target.result);

      // Vérifier la structure du fichier
      if (!sceneData.geometry) {
        showSplashScreen("❌ Fichier JSON invalide : structure incorrecte.");
        return;
      }

      // 1. Nettoyer la scène actuelle
      geometryManager.clearAll();

      // 2. Désérialiser et reconstruire la géométrie
      if (sceneData.geometry.points) {
        sceneData.geometry.points.forEach((p) => {
          geometryManager.addPoint(
            new Point(p.name, p.position.x, p.position.y, p.position.z),
          );
        });
      }

      if (sceneData.geometry.vectors) {
        sceneData.geometry.vectors.forEach((v) => {
          const origin = new THREE.Vector3(v.origin.x, v.origin.y, v.origin.z);
          const components = new THREE.Vector3(
            v.components.x,
            v.components.y,
            v.components.z,
          );
          const newVector = new Vector(v.name, origin, components);
          newVector.id = v.id;
          nextVectorId = Math.max(nextVectorId, v.id + 1);
          if (v.isLabelVisible === false) {
            newVector.setLabelVisibility(false);
          }
          geometryManager.addVector(newVector);
        });
      }

      if (sceneData.geometry.lines) {
        sceneData.geometry.lines.forEach((l) => {
          const startPoint = new THREE.Vector3(
            l.startPoint.x,
            l.startPoint.y,
            l.startPoint.z,
          );
          const directorVector = new THREE.Vector3(
            l.directorVector.x,
            l.directorVector.y,
            l.directorVector.z,
          );
          const newLine = new Line3D(l.name, startPoint, directorVector);
          newLine.id = l.id;
          nextStraightLineId = Math.max(nextStraightLineId, l.id + 1);
          geometryManager.addLine(newLine);
        });
      }

      if (sceneData.geometry.planes) {
        sceneData.geometry.planes.forEach((p) => {
          const pointOnPlane = new THREE.Vector3(
            p.pointOnPlane.x,
            p.pointOnPlane.y,
            p.pointOnPlane.z,
          );
          const normal = new THREE.Vector3(
            p.displayNormal.x,
            p.displayNormal.y,
            p.displayNormal.z,
          );
          const newPlane = new Plane(p.name, pointOnPlane, normal);
          newPlane.id = p.id;
          nextPlaneId = Math.max(nextPlaneId, p.id + 1);
          geometryManager.addPlane(newPlane);
        });
      }

      showSplashScreen(`✅ Scène importée : ${file.name}`);
      updateAllUI();
    } catch (error) {
      console.error("Erreur lors de l'import:", error);
      showSplashScreen("❌ Erreur lors de l'import du fichier JSON.");
    }
  };

  reader.onerror = function () {
    showSplashScreen("❌ Erreur lors de la lecture du fichier.");
  };

  reader.readAsText(file);

  // Réinitialiser l'input pour permettre de réimporter le mÃªme fichier
  inputElement.value = "";
}

function showSplashScreen(message, duration = 2000) {
  const splashElement = document.getElementById("splashScreen");
  const messageElement = document.getElementById("splashMessage");

  // Annule un timer précédent si une notification était déjà en cours de disparition
  if (splashTimer) {
    clearTimeout(splashTimer);
  }

  // 1. Mettre à jour le message et afficher l'élément
  messageElement.textContent = message;
  splashElement.classList.remove("splash-hidden");

  // 2. Programmer la disparition de l'élément après la durée spécifiée
  splashTimer = setTimeout(() => {
    splashElement.classList.add("splash-hidden");
    splashTimer = null; // Réinitialiser le timer
  }, duration);
}

function hideContextMenu() {
  console.log("hideContextMenu");
  const menu = document.getElementById("contextMenu");
  if (menu) {
    menu.style.display = "none";
  }
}
// --- GESTIONNAIRE D'HISTORIQUE ---
const historyStack = []; // Stocke les états (snapshots)
let historyIndex = -1; // Position actuelle dans l'historique
const MAX_HISTORY = 20; // Limite pour ne pas saturer la mémoire
// --- Fonction saveState corrigée (anti-doublons) ---

function saveState() {
  // 1. Si on est au milieu de l'historique (après des Undos), on coupe le futur
  if (historyIndex < historyStack.length - 1) {
    historyStack.splice(historyIndex + 1);
  }

  // 2. Création de la "photo" de la scène actuelle
  const currentState = serializeSceneData();

  // ============================================================
  // 3. CORRECTION : VÉRIFICATION ANTI-DOUBLON
  // ============================================================
  // On vérifie si l'état qu'on veut sauvegarder est identique au dernier état connu.
  // Cela empÃªche d'avoir [A, B, B] dans l'historique.
  if (historyIndex >= 0 && historyStack[historyIndex] === currentState) {
    // Si c'est exactement pareil, on ne sauvegarde pas une 2ème fois.
    // console.log("État identique ignoré");
    return;
  }

  // 4. Ajout à la pile si c'est un nouvel état
  historyStack.push(currentState);
  historyIndex++;

  // 5. Limite de mémoire (on garde les 20 derniers états)
  if (historyStack.length > MAX_HISTORY) {
    historyStack.shift(); // On supprime le plus vieux
    historyIndex--;
  }

  updateHistoryButtons();
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    const previousState = historyStack[historyIndex];
    restoreSceneData(previousState);
    showSplashScreen("Action annulée ↩️");
  } else {
    showSplashScreen("Rien à annuler.");
  }
  updateHistoryButtons();
}

// Optionnel : Redo
function redo() {
  if (historyIndex < historyStack.length - 1) {
    historyIndex++;
    const nextState = historyStack[historyIndex];
    restoreSceneData(nextState);
    showSplashScreen("Action rétablie ↪️");
  }
  updateHistoryButtons();
}

function serializeSceneData() {
  return JSON.stringify({
    points: geometryManager.points.map((p) => ({
      name: p.name,
      position: { x: p.position.x, y: p.position.y, z: p.position.z },
      // Les points n'ont pas de bouton masquer/afficher dans l'interface actuelle,
      // mais on pourrait l'ajouter ici si besoin.
    })),
    vectors: geometryManager.vectors.map((v) => ({
      id: v.id,
      name: v.name,
      origin: { x: v.origin.x, y: v.origin.y, z: v.origin.z },
      components: { x: v.components.x, y: v.components.y, z: v.components.z },
      // Sauvegarde des états de visibilité
      isVisible: v.isVisible,
      isLabelVisible: v.isLabelVisible,
      // Props spécifiques
      isNormalVector: v.isNormalVector || false,
      parentPlaneId: v.parentPlaneId || null,
    })),
    lines: geometryManager.lines.map((l) => ({
      id: l.id,
      name: l.name,
      startPoint: { x: l.startPoint.x, y: l.startPoint.y, z: l.startPoint.z },
      directorVector: {
        x: l.directorVector.x,
        y: l.directorVector.y,
        z: l.directorVector.z,
      },
      // Sauvegarde de la visibilité
      isVisible: l.isVisible,
    })),
    planes: geometryManager.planes.map((p) => ({
      id: p.id,
      name: p.name,
      pointOnPlane: {
        x: p.pointOnPlane.x,
        y: p.pointOnPlane.y,
        z: p.pointOnPlane.z,
      },
      displayNormal: {
        x: p.displayNormal.x,
        y: p.displayNormal.y,
        z: p.displayNormal.z,
      },
      // Sauvegarde de la visibilité
      isVisible: p.isVisible,
    })),
  });
}

function restoreSceneData(jsonString) {
  deselectCurrentObject();
  let data;
  try {
    data = JSON.parse(jsonString);
  } catch (e) {
    console.error("Erreur de parsing JSON", e);
    return;
  }

  // 1. Nettoyage complet
  geometryManager.clearAll();

  // 2. Reconstruction

  // --- POINTS ---
  if (data.points) {
    data.points.forEach((p) =>
      geometryManager.addPoint(
        new Point(p.name, p.position.x, p.position.y, p.position.z),
      ),
    );
  }

  // --- VECTEURS ---
  if (data.vectors) {
    data.vectors.forEach((v) => {
      const vec = new Vector(
        v.name,
        new THREE.Vector3(v.origin.x, v.origin.y, v.origin.z),
        new THREE.Vector3(v.components.x, v.components.y, v.components.z),
      );
      vec.id = v.id;
      vec.isNormalVector = v.isNormalVector;
      vec.parentPlaneId = v.parentPlaneId;
      nextVectorId = Math.max(nextVectorId, v.id + 1);

      // RESTAURATION VISIBILITÉ VECTEUR
      // 1. On charge la propriété (par défaut true si non définie)
      vec.isVisible = v.isVisible !== undefined ? v.isVisible : true;
      vec.isLabelVisible =
        v.isLabelVisible !== undefined ? v.isLabelVisible : true;

      // 2. IMPORTANT : On ajoute au manager
      geometryManager.addVector(vec);

      // 3. TRES IMPORTANT : On force l'application visuelle sur le mesh 3D
      // car addVector() rend l'objet visible par défaut.
      vec.setVisibility(vec.isVisible);
      vec.setLabelVisibility(vec.isLabelVisible);
    });
  }

  // --- DROITES ---
  if (data.lines) {
    data.lines.forEach((l) => {
      const line = new Line3D(
        l.name,
        new THREE.Vector3(l.startPoint.x, l.startPoint.y, l.startPoint.z),
        new THREE.Vector3(
          l.directorVector.x,
          l.directorVector.y,
          l.directorVector.z,
        ),
      );
      line.id = l.id;
      nextStraightLineId = Math.max(nextStraightLineId, l.id + 1);

      // RESTAURATION VISIBILITÉ DROITE
      line.isVisible = l.isVisible !== undefined ? l.isVisible : true;

      geometryManager.addLine(line);

      // Force l'application visuelle
      line.setVisibility(line.isVisible);
    });
  }

  // --- PLANS ---
  if (data.planes) {
    data.planes.forEach((p) => {
      const plane = new Plane(
        p.name,
        new THREE.Vector3(p.pointOnPlane.x, p.pointOnPlane.y, p.pointOnPlane.z),
        new THREE.Vector3(
          p.displayNormal.x,
          p.displayNormal.y,
          p.displayNormal.z,
        ),
      );
      plane.id = p.id;
      nextPlaneId = Math.max(nextPlaneId, p.id + 1);

      // RESTAURATION VISIBILITÉ PLAN
      plane.isVisible = p.isVisible !== undefined ? p.isVisible : true;

      geometryManager.addPlane(plane);

      // Force l'application visuelle
      plane.setVisibility(plane.isVisible);
    });
  }

  updateAllUI();
}

function updateHistoryButtons() {
  const btnUndo = document.getElementById("btnUndo");
  const btnRedo = document.getElementById("btnRedo");

  // 1. Gestion du bouton UNDO (Annuler)
  if (btnUndo) {
    if (historyIndex > 0) {
      btnUndo.style.opacity = "1";
      btnUndo.style.pointerEvents = "auto";
      btnUndo.style.cursor = "pointer";
    } else {
      btnUndo.style.opacity = "0.5";
      btnUndo.style.pointerEvents = "none";
      btnUndo.style.cursor = "default";
    }
  }

  // 2. Gestion du bouton REDO (Rétablir)
  if (btnRedo) {
    // On peut rétablir s'il y a des états après l'index actuel dans la pile
    if (historyIndex < historyStack.length - 1) {
      btnRedo.style.opacity = "1";
      btnRedo.style.pointerEvents = "auto";
      btnRedo.style.cursor = "pointer";
    } else {
      btnRedo.style.opacity = "0.5";
      btnRedo.style.pointerEvents = "none";
      btnRedo.style.cursor = "default";
    }
  }
}

function handleHover(clientX, clientY) {
  const tooltip = document.getElementById("tooltip");

  // ============================================================
  // 1. PROTECTION UI : On vérifie ce qu'il y a sous la souris
  // ============================================================
  const elementUnderMouse = document.elementFromPoint(clientX, clientY);

  // Si on survole le panneau, le bouton burger ou les contrôles caméra...
  if (
    elementUnderMouse &&
    (elementUnderMouse.closest("#panel") ||
      elementUnderMouse.closest("#openBtn") ||
      elementUnderMouse.closest("#cameraControls"))
  ) {
    // ... On cache l'info-bulle et on arrÃªte tout.
    tooltip.style.opacity = "0";
    tooltip.style.display = "none";
    document.body.style.cursor = "default";
    return;
  }

  // ============================================================
  // 2. PROTECTION MOUVEMENT CAMÉRA
  // ============================================================
  // Si on bouge la caméra, on cache tout pour ne pas gÃªner la vue
  if (isDragging || isPanning) {
    tooltip.style.display = "none";
    document.body.style.cursor = "default";
    return;
  }

  // ============================================================
  // 3. LOGIQUE D'AFFICHAGE NORMALE
  // ============================================================
  const intersection = getIntersectionResult(clientX, clientY);

  if (intersection && intersection.object.userData.instance) {
    const instance = intersection.object.userData.instance;
    let content = "";

    // Style CSS inline pour les détails
    const detailStyle =
      'style="color: #ddd; font-size: 0.9em; display: block; margin-top: 2px;"';

    // --- 1. POINT ---
    if (instance instanceof Point) {
      const x = formatNumber(instance.position.x);
      const y_ui = formatNumber(instance.position.z);
      const z_ui = formatNumber(instance.position.y);
      content = `📍 <strong>${instance.name}</strong><span ${detailStyle}>Coord : (${x}, ${y_ui}, ${z_ui})</span>`;

      // --- 2. VECTEUR ---
    } else if (instance instanceof Vector) {
      const v = instance.components;
      const x = formatNumber(v.x);
      const y_ui = formatNumber(v.z);
      const z_ui = formatNumber(v.y);
      const norm = formatNumber(v.length());
      content = `📍 <strong>${instance.name}</strong><span ${detailStyle}>Coord : (${x}, ${y_ui}, ${z_ui})</span><span ${detailStyle}>Norme : ${norm}</span>`;

      // --- 3. DROITE ---
    } else if (instance instanceof Line3D) {
      const u = instance.directorVector;
      const x = formatNumber(u.x);
      const y_ui = formatNumber(u.z);
      const z_ui = formatNumber(u.y);
      content = `📏 <strong>${instance.name}</strong><span ${detailStyle}>Vect. dir. : (${x}, ${y_ui}, ${z_ui})</span>`;

      // --- 4. PLAN ---
    } else if (instance instanceof Plane) {
      const n = instance.displayNormal;
      const x = formatNumber(n.x);
      const y_ui = formatNumber(n.z);
      const z_ui = formatNumber(n.y);
      content = `🔷 <strong>${instance.name}</strong><span ${detailStyle}>Normale : (${x}, ${y_ui}, ${z_ui})</span>`;

      // --- AUTRES ---
    } else {
      content = instance.name;
    }

    tooltip.innerHTML = content;

    // Positionnement
    positionTooltipSmartly(clientX, clientY);

    document.body.style.cursor = "pointer";
  } else {
    tooltip.style.display = "none";
    document.body.style.cursor = "default";
  }
}

function syncDataFromGizmo() {
  const inst = selectedObjectInstance;
  if (!inst) return;

  // 1. POINT (Inchangé)
  if (inst instanceof Point) {
    inst.position.copy(inst.mesh.position);
    inst.updateLabelPosition();
    const editIndexInput = document.getElementById("editPointIndex");
    if (
      editIndexInput &&
      editIndexInput.value != "" &&
      parseInt(editIndexInput.value) === geometryManager.points.indexOf(inst)
    ) {
      document.getElementById("pointX").value = formatNumber(inst.position.x);
      document.getElementById("pointY").value = formatNumber(inst.position.z);
      document.getElementById("pointZ").value = formatNumber(inst.position.y);
    }

    // AJOUT POUR LE TABLEUR (Mise à jour temps réel des inputs)
    if (isSpreadsheetOpen && currentSpreadsheetTab === "points") {
      const idx = geometryManager.points.indexOf(inst);
      const inputX = document.getElementById(`sheet-p-${idx}-x`);
      const inputY = document.getElementById(`sheet-p-${idx}-y`);
      const inputZ = document.getElementById(`sheet-p-${idx}-z`);
      if (inputX) {
        inputX.value = formatNumber(inst.position.x);
        inputY.value = formatNumber(inst.position.z); // UI Y
        inputZ.value = formatNumber(inst.position.y); // UI Z
      }
    }
  }

  // 2. VECTEUR (Inchangé)
  else if (inst instanceof Vector) {
    const currentOrigin = inst.origin.clone().add(inst.arrowHelper.position);
    inst.updateLabelPosition();

    const originListSpan = document.getElementById(
      `vector-origin-list-${inst.id}`,
    );
    if (originListSpan) {
      const ox = formatNumber(currentOrigin.x, 1);
      const oy = formatNumber(currentOrigin.z, 1);
      const oz = formatNumber(currentOrigin.y, 1);
      originListSpan.innerHTML = `Origine: <strong>(${ox}, ${oy}, ${oz})</strong>`;
    }

    if (document.getElementById("editVectorId").value == inst.id) {
      document.getElementById("vectorOriginX").value = formatNumber(
        currentOrigin.x,
      );
      document.getElementById("vectorOriginY").value = formatNumber(
        currentOrigin.z,
      );
      document.getElementById("vectorOriginZ").value = formatNumber(
        currentOrigin.y,
      );
      // On force le select sur vide/custom pour que les inputs soient pris en compte
      const vSelect = document.getElementById("vectorOriginPoint");
      if (vSelect) vSelect.value = "";
    }

    // ... code existant ...
    if (isSpreadsheetOpen && currentSpreadsheetTab === "vectors") {
      const o = inst.origin.clone().add(inst.arrowHelper.position);
      const oxInput = document.getElementById(`sheet-v-${inst.id}-ox`);
      if (oxInput) {
        oxInput.value = formatNumber(o.x);
        document.getElementById(`sheet-v-${inst.id}-oy`).value = formatNumber(
          o.z,
        );
        document.getElementById(`sheet-v-${inst.id}-oz`).value = formatNumber(
          o.y,
        );
      }
    }
  }

  // 3. DROITE (CORRIGÉ)
  else if (inst instanceof Line3D) {
    // Calcul de la position actuelle
    const currentP = inst.startPoint.clone().add(inst.mesh.position);

    // A. Mise à jour de la liste
    const pointSpan = document.getElementById(`line-point-${inst.id}`);
    if (pointSpan) {
      const px = formatNumber(currentP.x, 1);
      const py = formatNumber(currentP.z, 1);
      const pz = formatNumber(currentP.y, 1);
      pointSpan.innerHTML = `Passe par : <strong>(${px}, ${py}, ${pz})</strong>`;
    }

    // B. Mise à jour de l'affichage équation
    const eqSelect = document.getElementById("equationLineSelect");
    if (eqSelect && parseInt(eqSelect.value) === inst.id) {
      const tempLine = {
        startPoint: currentP,
        directorVector: inst.directorVector,
      };
      displayLineEquation(tempLine);
    }

    // C. --- CORRECTION CRITIQUE : MISE Ã€ JOUR DU FORMULAIRE D'ÉDITION ---
    // Si on est en train d'éditer CETTE droite précise
    if (document.getElementById("editLineId").value == inst.id) {
      document.getElementById("lineEqPointX").value = formatNumber(currentP.x);
      document.getElementById("lineEqPointY").value = formatNumber(currentP.z); // Profondeur (UI Y = 3D Z)
      document.getElementById("lineEqPointZ").value = formatNumber(currentP.y); // Hauteur (UI Z = 3D Y)

      // IMPORTANT : On remet le selecteur sur "vide" pour forcer l'usage des coordonnées manuelles
      // sinon la fonction updateLine() pourrait reprendre le point nommé précédent.
      document.getElementById("lineEquationPointSelect").value = "";
    }
  }

  // 4. PLAN (CORRIGÉ)
  else if (inst instanceof Plane) {
    inst.pointOnPlane.copy(inst.mesh.position);

    if (transformControl.mode === "rotate") {
      const rotationMatrix = new THREE.Matrix4().extractRotation(
        inst.mesh.matrix,
      );
      const initialNormal = new THREE.Vector3(0, 0, 1);
      inst.normal.copy(initialNormal).applyMatrix4(rotationMatrix).normalize();
      inst.displayNormal.copy(inst.normal);
      // Note : Pour la rotation, mettre à jour l'équation texte (ax+by...) est complexe
      // et pourrait écraser le formatage utilisateur, on se concentre sur la position ici.
    }

    // A. Mise à jour liste
    const pointSpan = document.getElementById(`plane-point-${inst.id}`);
    if (pointSpan) {
      const px = formatNumber(inst.pointOnPlane.x, 1);
      const py_ui = formatNumber(inst.pointOnPlane.z, 1);
      const pz_ui = formatNumber(inst.pointOnPlane.y, 1);
      pointSpan.innerHTML = `Passe par : <strong>(${px}, ${py_ui}, ${pz_ui})</strong>`;
    }

    // B. Equation display
    const planeSelect = document.getElementById("equationPlaneSelect");
    if (planeSelect && parseInt(planeSelect.value) === inst.id) {
      displayPlaneEquation();
    }

    // C. --- CORRECTION CRITIQUE : MISE Ã€ JOUR DU FORMULAIRE D'ÉDITION ---
    if (document.getElementById("editPlaneId").value == inst.id) {
      document.getElementById("planeEqPointX").value = formatNumber(
        inst.pointOnPlane.x,
      );
      document.getElementById("planeEqPointY").value = formatNumber(
        inst.pointOnPlane.z,
      ); // Profondeur
      document.getElementById("planeEqPointZ").value = formatNumber(
        inst.pointOnPlane.y,
      ); // Hauteur

      // Force l'usage des coordonnées manuelles
      document.getElementById("planeEquationPointSelect").value = "";
    }
  }
}

function updateTooltipFromGizmo() {
  const tooltip = document.getElementById("tooltip");
  const inst = selectedObjectInstance;

  if (!inst || (lastTooltipX === 0 && lastTooltipY === 0)) {
    tooltip.style.display = "none";
    return;
  }

  let content = "";
  const detailStyle =
    'style="color: #ddd; font-size: 0.9em; display: block; margin-top: 2px;"';

  try {
    if (inst instanceof Point) {
      const x = formatNumber(inst.position.x);
      const y_ui = formatNumber(inst.position.z);
      const z_ui = formatNumber(inst.position.y);
      content = `📍 <strong>${inst.name}</strong><span ${detailStyle}>Coord : (${x}, ${y_ui}, ${z_ui})</span>`;
    } else if (inst instanceof Vector) {
      // Pour le vecteur, on calcule la position visuelle absolue
      const o = inst.origin.clone().add(inst.arrowHelper.position);
      const v = inst.components;

      const ox = formatNumber(o.x);
      const oy_ui = formatNumber(o.z);
      const oz_ui = formatNumber(o.y);
      const norm = formatNumber(v.length());

      content = `↗️ <strong>${inst.name}</strong>
           <span ${detailStyle}>Origine : (${ox}, ${oy_ui}, ${oz_ui})</span>
           <span ${detailStyle}>Norme : ${norm}</span>`;
    }
    // --- MODIFICATION POUR LA DROITE ---
    else if (inst instanceof Line3D) {
      // Position réelle = Point de départ initial + Déplacement du Gizmo
      const currentP = inst.startPoint.clone().add(inst.mesh.position);

      const px = formatNumber(currentP.x);
      const py_ui = formatNumber(currentP.z);
      const pz_ui = formatNumber(currentP.y);

      const u = inst.directorVector;
      const ux = formatNumber(u.x, 1);
      const uz_ui = formatNumber(u.z, 1);
      const uy_ui = formatNumber(u.y, 1);

      content = `📏 <strong>${inst.name}</strong>
                 <span ${detailStyle}>Passe par : (${px}, ${py_ui}, ${pz_ui})</span>
                 <span ${detailStyle}>Vect. dir. : (${ux}, ${uz_ui}, ${uy_ui})</span>`;
    }
    // -----------------------------------
    else if (inst instanceof Plane) {
      // Calcul de la normale (avec rotation si nécessaire)
      let n = inst.normal;
      if (transformControl.mode === "rotate") {
        const rotationMatrix = new THREE.Matrix4().extractRotation(
          inst.mesh.matrix,
        );
        n = inst.normal.clone().applyMatrix4(rotationMatrix);
      }

      // Formatage pour l'affichage
      const nx = formatNumber(n.x, 1);
      const ny_ui = formatNumber(n.z, 1);
      const nz_ui = formatNumber(n.y, 1);

      // NOUVEAU : Formatage du point de passage
      // Note : inst.mesh.position est déjà absolu pour les plans dans notre logique actuelle
      const px = formatNumber(inst.pointOnPlane.x);
      const py_ui = formatNumber(inst.pointOnPlane.z);
      const pz_ui = formatNumber(inst.pointOnPlane.y);

      content = `🔷 <strong>${inst.name}</strong>
       <span ${detailStyle}>Passe par : (${px}, ${py_ui}, ${pz_ui})</span>
       <span ${detailStyle}>Normale : (${nx}, ${ny_ui}, ${nz_ui})</span>`;
    }

    tooltip.innerHTML = content;
    positionTooltipSmartly(lastTooltipX, lastTooltipY);
  } catch (err) {
    tooltip.style.display = "none";
  }
}

function finalizeGizmoMovement() {
  const inst = selectedObjectInstance;
  if (!inst) return;

  // --- CAS 1 : C'EST UN VECTEUR (Correction du bug de disparition) ---
  if (inst instanceof Vector) {
    // 1. IMPORTANT : On lâche l'objet AVANT de le modifier.
    // Sinon, Three.js essaie de mettre à jour un objet qui va Ãªtre détruit.
    transformControl.detach();

    // 2. On capture la nouvelle position absolue
    // Le Gizmo a déplacé l'ArrowHelper. Sa position est devenue la nouvelle origine.
    const newOrigin = inst.arrowHelper.position.clone();

    // 3. On utilise la méthode update() de la classe Vector
    // Elle s'occupe proprement de : supprimer l'ancien, créer le nouveau, l'ajouter à la scène.
    inst.update(inst.name, newOrigin, inst.components);

    // 4. On réattache le Gizmo sur le NOUVEAU vecteur
    // L'ancien inst.arrowHelper n'existe plus, update() en a créé un nouveau.
    transformControl.attach(inst.arrowHelper);

    // 5. On remet la couleur de sélection (Jaune)
    // Car update() a remis la couleur d'origine (orange/bleu/etc).
    if (inst.arrowHelper) {
      inst.arrowHelper.setColor(0xffff00);
    }
  }

  // --- CAS 2 : C'EST UNE DROITE ---
  else if (inst instanceof Line3D) {
    // 1. Appliquer le déplacement du mesh au point de départ mathématique
    inst.startPoint.add(inst.mesh.position);

    // 2. Remettre le mesh à zéro (pour éviter que Ã§a s'accumule)
    inst.mesh.position.set(0, 0, 0);

    // 3. Régénérer la géométrie visuelle à partir du nouveau point de départ
    const lineLength = 100;
    const dir = inst.directorVector.clone().normalize();
    const visualStart = new THREE.Vector3().addVectors(
      inst.startPoint,
      dir.clone().multiplyScalar(-lineLength),
    );
    const visualEnd = new THREE.Vector3().addVectors(
      inst.startPoint,
      dir.clone().multiplyScalar(lineLength),
    );

    inst.mesh.geometry.dispose();
    inst.mesh.geometry = new THREE.BufferGeometry().setFromPoints([
      visualStart,
      visualEnd,
    ]);

    // 4. Mise à jour de l'équation (si affichée)
    const eqSelect = document.getElementById("equationLineSelect");
    if (eqSelect && parseInt(eqSelect.value) === inst.id) {
      displayLineEquation();
    }
  }

  // --- CAS 3 : C'EST UN POINT OU UN PLAN ---
  else if (inst instanceof Point) {
    // Pour un point, la position du mesh est la vérité. On met à jour l'instance.
    inst.position.copy(inst.mesh.position);
    inst.updateLabelPosition();
  } else if (inst instanceof Plane) {
    // Pour un plan, on met à jour le point d'ancrage
    inst.pointOnPlane.copy(inst.mesh.position);
  }

  // --- FINALISATION COMMUNE ---
  // Mettre à jour les coordonnées dans le panneau HTML (listes)
  updateAllUI();
  // Sauvegarder dans l'historique (Undo/Redo)
  saveState();
}

function positionTooltipSmartly(x, y) {
  const tooltip = document.getElementById("tooltip");
  const offset = 15; // Marge par rapport au curseur

  // 1. On l'affiche d'abord pour pouvoir mesurer sa taille réelle
  tooltip.style.display = "block";
  setTimeout(() => (tooltip.style.opacity = "1"), 10);
  const rect = tooltip.getBoundingClientRect();

  const winWidth = window.innerWidth;
  const winHeight = window.innerHeight;

  // 2. Gestion Horizontal (X)
  let finalX = x + offset;
  // Si le tooltip dépasse le bord droit de l'écran...
  if (finalX + rect.width > winWidth) {
    // ... on le place à gauche du curseur
    finalX = x - rect.width - offset;
  }
  // Sécurité : ne pas sortir à gauche non plus (si l'écran est très petit)
  if (finalX < 0) finalX = offset;

  // 3. Gestion Vertical (Y)
  let finalY = y + offset;
  // Si le tooltip dépasse le bord bas de l'écran...
  if (finalY + rect.height > winHeight) {
    // ... on le place au-dessus du curseur
    finalY = y - rect.height - offset;
  }
  // Sécurité : ne pas sortir en haut
  if (finalY < 0) finalY = offset;

  // 4. Application des coordonnées
  tooltip.style.left = finalX + "px";
  tooltip.style.top = finalY + "px";
}

function downloadDebugJSON() {
  // 1. Construction de l'objet de données
  const debugData = {
    meta: {
      appName: "Éditeur Points 3D",
      date: new Date().toLocaleString(),
      timestamp: Date.now(),
      totalObjects:
        geometryManager.points.length +
        geometryManager.vectors.length +
        geometryManager.lines.length +
        geometryManager.planes.length,
    },
    // Points : on exporte la position brute Three.js
    points: geometryManager.points.map((p, index) => ({
      index: index,
      name: p.name,
      position_raw: { x: p.position.x, y: p.position.y, z: p.position.z },
      // On ajoute la position "Vue UI" pour faciliter la lecture humaine
      position_ui: {
        x: p.position.x,
        profondeur: p.position.z,
        hauteur: p.position.y,
      },
      color: "#" + p.color.getHexString(),
    })),
    vectors: geometryManager.vectors.map((v) => ({
      id: v.id,
      name: v.name,
      origin: { x: v.origin.x, y: v.origin.y, z: v.origin.z },
      components: { x: v.components.x, y: v.components.y, z: v.components.z },
      norm: v.components.length(),
      isVisible: v.isVisible,
      isNormalVector: v.isNormalVector || false,
    })),
    lines: geometryManager.lines.map((l) => ({
      id: l.id,
      name: l.name,
      startPoint: { x: l.startPoint.x, y: l.startPoint.y, z: l.startPoint.z },
      directorVector: {
        x: l.directorVector.x,
        y: l.directorVector.y,
        z: l.directorVector.z,
      },
      isVisible: l.isVisible,
    })),
    planes: geometryManager.planes.map((p) => ({
      id: p.id,
      name: p.name,
      pointOnPlane: {
        x: p.pointOnPlane.x,
        y: p.pointOnPlane.y,
        z: p.pointOnPlane.z,
      },
      normal: { x: p.normal.x, y: p.normal.y, z: p.normal.z },
      equationConstant_D: -p.normal.dot(p.pointOnPlane), // d = -n.p
      isVisible: p.isVisible,
    })),
  };

  // 2. Conversion en chaîne JSON formatée (pretty print)
  const jsonStr = JSON.stringify(debugData, null, 2);

  // 3. Création du lien de téléchargement invisible
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  // Nom du fichier avec timestamp
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `debug_scene_3d_${dateStr}.json`;

  a.href = url;
  document.body.appendChild(a);
  a.click();

  // 4. Nettoyage
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showSplashScreen("📥 Données de débogage téléchargées !");
}
// --- GESTION DU THÃˆME ---
let isDarkMode = false;
let gridHelper = null; // Référence globale pour pouvoir la supprimer/recréer
let axesGroup = null; // Référence globale pour les axes

function initTheme() {
  // Vérifier si une préférence est sauvegardée
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    isDarkMode = true;
  }
  applyTheme();
}

function toggleTheme() {
  isDarkMode = !isDarkMode;
  localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  applyTheme();
}

function applyTheme() {
  // 1. Mise à jour HTML/CSS
  document.documentElement.setAttribute(
    "data-theme",
    isDarkMode ? "dark" : "light",
  );

  const btnIcon = document.querySelector("#themeToggleBtn i");
  if (btnIcon) {
    btnIcon.className = isDarkMode ? "fas fa-sun" : "fas fa-moon";
    btnIcon.style.color = isDarkMode ? "#ffeb3b" : "#333"; // Jaune pour soleil, Gris pour lune
  }

  // 2. Mise à jour de la Scène 3D
  if (scene) {
    // A. Couleur de fond
    scene.background = new THREE.Color(isDarkMode ? 0x1a1a1a : 0xf0f0f0);

    // B. Mise à jour de la Grille (GridHelper)
    if (gridHelper) scene.remove(gridHelper);

    // Couleurs : (couleur ligne centrale, couleur lignes grille)
    const colorCenter = isDarkMode ? 0x555555 : 0xcccccc;
    const colorGrid = isDarkMode ? 0x333333 : 0xe0e0e0;

    gridHelper = new THREE.GridHelper(20, 20, colorCenter, colorGrid);
    gridHelper.position.y = 0;
    gridHelper.renderOrder = -1;
    gridHelper.material.depthTest = false;
    scene.add(gridHelper);

    // C. Recréer les axes (pour changer la couleur du texte X, Y, Z)
    createAxes();

    // D. Recréer les labels de tous les points et vecteurs existants
    refreshAllLabels();
  }
}

function refreshAllLabels() {
  // Points
  geometryManager.points.forEach((p) => {
    scene.remove(p.label);
    p.label = createGenericTextLabel(p.name);
    p.updateLabelPosition();
    scene.add(p.label);
  });

  // Vecteurs
  geometryManager.vectors.forEach((v) => {
    if (v.label) scene.remove(v.label);
    v.label = createGenericTextLabel(v.name);
    v.updateLabelPosition();
    if (v.isVisible && v.isLabelVisible) scene.add(v.label);
  });
}

// =====================================================================================
