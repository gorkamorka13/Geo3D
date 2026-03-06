// SECTION 5 : CRÉATION / MODIFICATION / SUPPRESSION D'OBJETS
// =====================================================================================
function editPoint(index, forceOpen = true) {
  // 1. UI
  if (forceOpen) {
    ensurePanelVisible();
    const input = document.getElementById("pointName");
    if (input) {
      const section = input.closest(".section.collapsible");
      if (section && section.classList.contains("collapsed"))
        section.classList.remove("collapsed");
    }
  }

  const p = geometryManager.points[index];
  if (!p) return;

  // 2. Remplissage
  document.getElementById("pointName").value = p.name;
  document.getElementById("pointX").value = formatNumber(p.position.x);
  document.getElementById("pointY").value = formatNumber(p.position.z); // Z 3D -> Y UI
  document.getElementById("pointZ").value = formatNumber(p.position.y); // Y 3D -> Z UI
  document.getElementById("editPointIndex").value = index;

  // 3. Boutons
  const btnAdd = document.getElementById("addPointBtn");
  if (btnAdd) btnAdd.style.display = "none";
  const actions = document.getElementById("pointEditActions");
  if (actions) actions.style.display = "grid";

  // 4. ACTIVATION GIZMO SÉCURISÉE
  // Si l'objet n'est pas encore sélectionné (ex: clic bouton crayon), on le sélectionne.
  if (selectedObjectInstance !== p && p.mesh) {
    handleSelection(p.mesh);
  }
}

function editVector(id, forceOpen = true) {
  // 1. UI
  if (forceOpen) {
    ensurePanelVisible();
    const input = document.getElementById("vectorNameCoords");
    if (input) {
      const section = input.closest(".section.collapsible");
      if (section && section.classList.contains("collapsed"))
        section.classList.remove("collapsed");
    }
  }

  const v = geometryManager.findVectorById(id);
  if (!v) return;

  // 2. Remplissage
  document.getElementById("vectorNameCoords").value = v.name;
  document.getElementById("vectorCoordX").value = formatNumber(v.components.x);
  document.getElementById("vectorCoordY").value = formatNumber(v.components.z);
  document.getElementById("vectorCoordZ").value = formatNumber(v.components.y);

  const ox = v.origin.x,
    oy = v.origin.z,
    oz = v.origin.y;
  document.getElementById("vectorOriginX").value = formatNumber(ox);
  document.getElementById("vectorOriginY").value = formatNumber(oy);
  document.getElementById("vectorOriginZ").value = formatNumber(oz);
  document.getElementById("editVectorId").value = id;

  // 3. Boutons
  const btnAdd = document.getElementById("addVectorFromCoordsBtn");
  if (btnAdd) btnAdd.style.display = "none";
  const actions = document.getElementById("vectorEditActions");
  if (actions) actions.style.display = "grid";

  // 4. ACTIVATION GIZMO SÉCURISÉE
  if (selectedObjectInstance !== v && v.arrowHelper) {
    // Pour un vecteur, on passe le helper à handleSelection
    // (Attention: handleSelection attend un objet avec userData.instance, ce que arrowHelper.line possède)
    handleSelection(v.arrowHelper.line);
  }
}

function editLine(id, forceOpen = true) {
  // 1. UI
  if (forceOpen) {
    ensurePanelVisible();
    const input = document.getElementById("lineEquationInput");
    if (input) {
      const section = input.closest(".section.collapsible");
      if (section && section.classList.contains("collapsed"))
        section.classList.remove("collapsed");
      input.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }

  const line = geometryManager.findLineById(id);
  if (!line) return;

  // 2. Remplissage
  const idField = document.getElementById("editLineId");
  if (idField) idField.value = id;

  const nameField = document.getElementById("lineNameFromEquation");
  if (nameField) nameField.value = line.name;

  // --- FIX: DO NOT PRE-FILL MANUAL INPUTS ---
  // If we fill these, updateLine() will use them instead of the equation text you edit.
  // We clear them so the Equation Parser (Priority 3) takes precedence.
  document.getElementById("lineEqPointX").value = "";
  document.getElementById("lineEqPointY").value = "";
  document.getElementById("lineEqPointZ").value = "";
  document.getElementById("lineEquationPointSelect").value = "";

  // Génération équation (This effectively shows the current coordinates to the user)
  const p = line.startPoint;
  const v = line.directorVector;
  const fmt = (start, dir) => {
    let s = "";
    if (Math.abs(start) > 1e-4) s += formatNumber(start);
    if (Math.abs(dir) > 1e-4) {
      const sign = dir > 0 ? (s ? " + " : "") : " - ";
      const val =
        Math.abs(Math.abs(dir) - 1) < 1e-4
          ? "t"
          : formatNumber(Math.abs(dir)) + "t";
      s += sign + val;
    }
    return s || "0";
  };

  // Note: ThreeJS Y is Height (Z UI), ThreeJS Z is Depth (Y UI)
  const txtX = `x = ${fmt(p.x, v.x)}`;
  const txtY = `y = ${fmt(p.z, v.z)}`; // UI Y (Depth) uses Three Z
  const txtZ = `z = ${fmt(p.y, v.y)}`; // UI Z (Height) uses Three Y

  document.getElementById("lineEquationInput").value =
    `${txtX}\n${txtY}\n${txtZ}`;

  // 3. Boutons
  const btnAdd = document.getElementById("addLineFromEquationBtn");
  if (btnAdd) btnAdd.style.display = "none";
  const actions = document.getElementById("lineEquationActions");
  if (actions) actions.style.display = "grid";

  // 4. ACTIVATION GIZMO SÉCURISÉE
  if (selectedObjectInstance !== line && line.mesh) {
    handleSelection(line.mesh);
  }
}

function editPlane(id, forceOpen = true) {
  // 1. UI
  if (forceOpen) {
    ensurePanelVisible();
    const input = document.getElementById("planeEquationInput");
    if (input) {
      const section = input.closest(".section.collapsible");
      if (section && section.classList.contains("collapsed"))
        section.classList.remove("collapsed");
      input.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  const plane = geometryManager.findPlaneById(id);
  if (!plane) return;

  // 2. Remplissage
  const idField = document.getElementById("editPlaneId");
  if (idField) idField.value = id;

  document.getElementById("planeEqPointX").value = formatNumber(
    plane.pointOnPlane.x,
  );
  document.getElementById("planeEqPointY").value = formatNumber(
    plane.pointOnPlane.z,
  );
  document.getElementById("planeEqPointZ").value = formatNumber(
    plane.pointOnPlane.y,
  );
  document.getElementById("planeEquationPointSelect").value = "";

  // Génération équation
  const n = plane.displayNormal;
  const p = plane.pointOnPlane;
  const a = n.x,
    b = n.z,
    c = n.y;
  const d = -(a * p.x + b * p.z + c * p.y);

  const fmtCoef = (val, axisName) => {
    if (Math.abs(val) < 1e-4) return "";
    const sign = val > 0 ? "+" : "-";
    const absVal = Math.abs(val);
    const valStr = Math.abs(absVal - 1) < 1e-4 ? "" : formatNumber(absVal);
    return `${sign} ${valStr}${axisName} `;
  };

  let eqStr = "";
  if (Math.abs(a) > 1e-4) eqStr += `${formatNumber(a)}x `;
  eqStr += fmtCoef(b, "y");
  eqStr += fmtCoef(c, "z");
  if (Math.abs(d) > 1e-4)
    eqStr += d > 0 ? `+ ${formatNumber(d)}` : `- ${formatNumber(Math.abs(d))}`;
  eqStr = eqStr.trim().replace(/^\+\s/, "") + " = 0";

  document.getElementById("planeEquationInput").value = eqStr;

  // 3. Boutons
  const btnAdd = document.getElementById("addPlaneFromEquationBtn");
  if (btnAdd) btnAdd.style.display = "none";
  const actions = document.getElementById("planeEquationActions");
  if (actions) actions.style.display = "grid";

  // 4. ACTIVATION GIZMO SÉCURISÉE
  if (selectedObjectInstance !== plane && plane.mesh) {
    handleSelection(plane.mesh);
  }
}

function openTransformationPanel(type, id) {
  ensurePanelVisible(); // Ouvre le panneau latéral s'il est fermé

  // 1. Retrouver l'instance de l'objet
  let instance = null;
  if (type === "point") {
    instance = geometryManager.points[id];
  } else if (type === "line") {
    instance = geometryManager.findLineById(id);
  } else if (type === "plane") {
    instance = geometryManager.findPlaneById(id);
  } else if (type === "vector") {
    instance = geometryManager.findVectorById(id);
  }

  if (instance) {
    // 2. Forcer la sélection de cet objet (indispensable pour que les boutons fonctionnent)
    // On désélectionne l'ancien d'abord pour nettoyer
    if (selectedObjectInstance && selectedObjectInstance !== instance) {
      deselectCurrentObject();
    }
    selectedObjectInstance = instance;

    // 3. Mettre l'objet en surbrillance (jaune)
    const HIGHLIGHT_COLOR = 0xffff00;
    if (instance instanceof Vector) {
      if (instance.arrowHelper) instance.arrowHelper.setColor(HIGHLIGHT_COLOR);
    } else if (instance.mesh) {
      instance.mesh.material.color.set(HIGHLIGHT_COLOR);
      if (instance instanceof Plane) instance.mesh.material.opacity = 0.75;
    }

    // 4. Afficher l'interface de transformation
    document.getElementById("transformations-hint").style.display = "none";
    document.getElementById("transformations-container").style.display =
      "block";

    // 5. Déplier la section "Transformations"
    const transContainer = document.getElementById("transformations-container");
    const section = transContainer.closest(".section");
    if (section && section.classList.contains("collapsed")) {
      section.classList.remove("collapsed");
    }

    // 6. Faire défiler jusqu'aux options
    setTimeout(() => {
      transContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100); // Petit délai pour laisser le temps au dépliage
  }
}

function addPoint() {
  const n = document.getElementById("pointName").value.trim();
  const x = parseFloat(document.getElementById("pointX").value);
  const y_from_ui = parseFloat(document.getElementById("pointY").value); // Profondeur
  const z_from_ui = parseFloat(document.getElementById("pointZ").value); // Hauteur
  if (!n || isNaN(x) || isNaN(y_from_ui) || isNaN(z_from_ui)) {
    showSplashScreen("Données invalides.");
    return;
  }
  // Le constructeur Point attend un nom et un Vector3, pas des coordonnées séparées
  geometryManager.addPoint(new Point(n, x, z_from_ui, y_from_ui));

  cancelEdit();

  updateAllUI();
  saveState();
}

function updatePoint() {
  const i = document.getElementById("editPointIndex").value;
  const p = geometryManager.points[i];
  if (!p) return;

  const n = document.getElementById("pointName").value.trim();

  // --- DÉBUT DE LA CORRECTION ---
  // On utilise les bons IDs pour lire les coordonnées depuis le formulaire
  const x = parseFloat(document.getElementById("pointX").value);
  const y_from_ui = parseFloat(document.getElementById("pointY").value); // Profondeur
  const z_from_ui = parseFloat(document.getElementById("pointZ").value); // Hauteur
  // --- FIN DE LA CORRECTION ---

  if (!n || isNaN(x) || isNaN(y_from_ui) || isNaN(z_from_ui)) {
    showSplashScreen("Données invalides.");
    return;
  }

  // --- AJOUT DE LA VÉRIFICATION ---
  // On vérifie si le nouveau nom est déjà pris par un AUTRE objet
  const existingObject = geometryManager.findObjectByName(n);
  if (existingObject && existingObject.id !== p.id) {
    showSplashScreen(
      `Le nom "${n}" est déjà utilisé. Veuillez en choisir un autre.`,
    );
    return;
  }
  // --- FIN DE L'AJOUT ---

  // On garde votre logique de mise à jour, elle est parfaite
  p.update(n, x, z_from_ui, y_from_ui);

  updateAllUI();
  cancelEdit();
  saveState();
}

function cancelEdit() {
  // Vider les champs
  document.getElementById("pointName").value = "";
  document.getElementById("pointX").value = "";
  document.getElementById("pointY").value = "";
  document.getElementById("pointZ").value = "";
  document.getElementById("editPointIndex").value = "";

  // --- PARTIE CORRIGÉE ---
  // Afficher le bouton "Ajouter"
  document.getElementById("addPointBtn").style.display = "block";
  // Cacher le CONTENEUR des boutons d'édition
  document.getElementById("pointEditActions").style.display = "none";
}

function deleteEditingPoint() {
  // Récupère l'index du point depuis le champ caché
  const index = parseInt(document.getElementById("editPointIndex").value);
  if (isNaN(index)) return; // Sécurité

  // Appelle la fonction de suppression existante qui gère déjà la confirmation
  removePoint(index);

  // Réinitialise le formulaire pour quitter le mode édition
  cancelEdit();
}

function removePoint(index) {
  const p = geometryManager.points[index];
  if (p && confirm(`Supprimer "${p.name}" ?`)) {
    if (selectedObjectInstance === p) {
      deselectCurrentObject();
    }
    geometryManager.removePoint(p);
    updateAllUI();
    saveState();
  }
}

function clearAllPoints() {
  // 1. Modifier le message de confirmation pour qu'il soit précis.
  if (
    confirm(
      "ÃŠtes-vous sÃ»r de vouloir effacer tous les points ? (Les droites, plans et vecteurs existants seront conservés)",
    )
  ) {
    deselectCurrentObject();
    // 2. Parcourir chaque point pour le retirer de la scène 3D.
    geometryManager.points.forEach((point) => {
      point.removeFromScene(scene);
    });

    // 3. Vider le tableau des points dans le gestionnaire.
    geometryManager.points = [];

    // 4. Mettre à jour l'interface utilisateur pour refléter la suppression.
    updateAllUI();
    saveState();
  }
}

// --- Droites ---

// Dans la SECTION 5
function addStraightLine() {
  const [i1, i2] = [
    document.getElementById("lineStart").value,
    document.getElementById("lineEnd").value,
  ];
  if (i1 === "" || i2 === "" || i1 === i2) {
    showSplashScreen("Sélectionnez deux points différents.");
    return;
  }
  const p1 = geometryManager.points[i1],
    p2 = geometryManager.points[i2];
  const d = new THREE.Vector3().subVectors(p2.position, p1.position);

  const customName = document.getElementById("lineNameGlobal").value.trim();
  const baseName = customName || `Droite(${p1.name},${p2.name})`;
  const uniqueName = geometryManager.generateUniqueName(baseName, "line"); // On passe 'line'
  geometryManager.addLine(new Line3D(uniqueName, p1.position, d));
  updateAllUI();
  saveState();
}

function removeStraightLineById(id) {
  const l = geometryManager.findLineById(id);
  if (l && confirm(`Supprimer "${l.name}" ?`)) {
    if (selectedObjectInstance === l) {
      deselectCurrentObject();
    }
    geometryManager.removeLine(l);
    updateAllUI();
    saveState();
  }
}

function onLineEquationPointChange() {
  const val = document.getElementById("lineEquationPointSelect").value;

  // On récupère les éléments DOM directement
  const xInput = document.getElementById("lineEqPointX");
  const yInput = document.getElementById("lineEqPointY");
  const zInput = document.getElementById("lineEqPointZ");

  if (val === "origin") {
    xInput.value = 0;
    yInput.value = 0;
    zInput.value = 0;
  } else if (val !== "") {
    const p = geometryManager.points[parseInt(val)];
    if (p) {
      xInput.value = formatNumber(p.position.x);
      // Inversion UI Y/Z pour l'affichage
      yInput.value = formatNumber(p.position.z);
      zInput.value = formatNumber(p.position.y);
    }
  } else {
    // CAS CRUCIAL : Si on revient sur "Défaut", on VIDE les champs
    // C'est ce qui permet ensuite à la fonction de création de savoir
    // qu'elle doit utiliser les constantes de l'équation.
    xInput.value = "";
    yInput.value = "";
    zInput.value = "";
  }
}

function addLineFromEquation() {
  const name =
    document.getElementById("lineNameGlobal").value.trim() || "Droite (Eq)";
  const equationsText = document.getElementById("lineEquationInput").value;
  const lines = equationsText.split("\n").filter((line) => line.trim() !== "");

  if (lines.length < 3) {
    showSplashScreen(
      "Veuillez entrer les 3 équations paramétriques (x, y, et z).",
    );
    return;
  }

  // --- 1. Analyse du texte (Vecteur ET Point du texte) ---
  let textPoint = { x: 0, y: 0, z: 0 };
  let vector = { x: 0, y: 0, z: 0 };
  const axesFound = { x: false, y: false, z: false };

  for (const line of lines) {
    const axisChar = line.trim().charAt(0).toLowerCase();
    if (!["x", "y", "z"].includes(axisChar)) continue;

    const cleanLine = line.substring(line.indexOf("=") + 1);

    // Extraction vecteur (t)
    let tMatch = cleanLine.match(/[+-]?\s*[\d.]*t/);
    let vectorComp = 0;
    let lineWithoutT = cleanLine;

    if (tMatch) {
      let tPart = tMatch[0].replace(/\s/g, "").replace("t", "");
      if (tPart === "+" || tPart === "") vectorComp = 1;
      else if (tPart === "-") vectorComp = -1;
      else vectorComp = parseFloat(tPart);
      lineWithoutT = cleanLine.replace(tMatch[0], "");
    }

    // Extraction point (constante)
    let pointCoord = parseFloat(lineWithoutT.trim() || "0"); // Par défaut 0 si pas de constante

    if (isNaN(pointCoord) || isNaN(vectorComp)) {
      showSplashScreen(`Erreur de syntaxe axe '${axisChar}'.`);
      return;
    }

    textPoint[axisChar] = pointCoord;
    vector[axisChar] = vectorComp;
    axesFound[axisChar] = true;
  }

  if (!axesFound.x || !axesFound.y || !axesFound.z) {
    showSplashScreen("Equations incomplètes (besoin de x, y, z).");
    return;
  }

  // --- 2. DÉCISION DU POINT DE DÉPART (HIÉRARCHIE STRICTE) ---

  // Récupération des valeurs BRUTES (chaines de caractères)
  const xStr = document.getElementById("lineEqPointX").value.trim();
  const yStr = document.getElementById("lineEqPointY").value.trim();
  const zStr = document.getElementById("lineEqPointZ").value.trim();
  const selectVal = document.getElementById("lineEquationPointSelect").value;

  let finalStartPoint;

  // PRIORITÉ 1 : Les champs manuels (seulement si au moins un est rempli par l'utilisateur)
  if (xStr !== "" || yStr !== "" || zStr !== "") {
    // Si l'utilisateur a tapé quelque chose, on prend ses valeurs.
    // Si un champ est vide mais qu'un autre est rempli, on considère le vide comme 0.
    finalStartPoint = new THREE.Vector3(
      parseFloat(xStr) || 0,
      parseFloat(zStr) || 0, // UI Z (Haut) -> 3JS Y
      parseFloat(yStr) || 0, // UI Y (Prof) -> 3JS Z
    );
  }
  // PRIORITÉ 2 : Le menu déroulant (si une option est choisie)
  else if (selectVal !== "") {
    if (selectVal === "origin") {
      finalStartPoint = new THREE.Vector3(0, 0, 0);
    } else {
      const p = geometryManager.points[parseInt(selectVal)];
      if (p) finalStartPoint = p.position.clone();
      else finalStartPoint = new THREE.Vector3(0, 0, 0); // Sécurité
    }
  }
  // PRIORITÉ 3 : Le texte de l'équation (fallback par défaut)
  else {
    // C'est ici qu'on utilise les constantes extraites (ex: 1, 0, 4 pour x=1+2t...)
    finalStartPoint = new THREE.Vector3(textPoint.x, textPoint.y, textPoint.z);
  }

  // --- 3. Création ---
  const directorVector = new THREE.Vector3(vector.x, vector.y, vector.z);

  if (directorVector.lengthSq() < 1e-8) {
    showSplashScreen("Vecteur directeur nul.");
    return;
  }

  const uniqueName = geometryManager.generateUniqueName(name, "line");
  geometryManager.addLine(
    new Line3D(uniqueName, finalStartPoint, directorVector),
  );

  updateAllUI();
  saveState();

  // --- CORRECTION : NETTOYAGE COMPLET ---
  // 1. On vide le nom pour la prochaine
  document.getElementById("lineNameFromEquation").value = "";

  // 2. IMPORTANT : On remet le selecteur sur "Défaut"
  const select = document.getElementById("lineEquationPointSelect");
  if (select) select.value = "";

  // 3. CRUCIAL : On vide les champs manuels pour que la prochaine équation soit prioritaire
  document.getElementById("lineEqPointX").value = "";
  document.getElementById("lineEqPointY").value = "";
  document.getElementById("lineEqPointZ").value = "";
}

function toggleStraightLineVisibility(lineId) {
  const line = geometryManager.findLineById(lineId);
  if (line) {
    line.setVisibility(!line.isVisible);
    // Met à jour la liste pour changer le texte du bouton
    updateStraightLineList();
  }
}

function clearStraightLines() {
  if (confirm("Effacer toutes les droites ?")) {
    deselectCurrentObject();
    geometryManager.lines.forEach((line) => line.removeFromScene(scene));
    geometryManager.lines = [];
    updateAllUI();
    saveState();
  }
}

// --- Plans ---
function addPlane() {
  const n = document.getElementById("planeName").value.trim() || "Plan";

  // --- Vérification du nom unique ---
  if (geometryManager.planes.some((p) => p.name === n)) {
    showSplashScreen(
      `Le nom de plan "${n}" est déjà utilisé. Veuillez en choisir un autre.`,
    );
    return;
  }
  // --- Fin de la vérification ---

  const [i1, i2, i3] = ["planeSelectP1", "planeSelectP2", "planeSelectP3"].map(
    (id) => document.getElementById(id).value,
  );
  if (
    i1 === "" ||
    i2 === "" ||
    i3 === "" ||
    i1 === i2 ||
    i1 === i3 ||
    i2 === i3
  ) {
    showSplashScreen("Sélectionnez trois points distincts.");
    return;
  }
  const [p1, p2, p3] = [i1, i2, i3].map(
    (i) => geometryManager.points[i].position,
  );
  const norm = new THREE.Vector3().crossVectors(
    new THREE.Vector3().subVectors(p2, p1),
    new THREE.Vector3().subVectors(p3, p1),
  );
  if (norm.lengthSq() < 1e-6) {
    showSplashScreen("Points colinéaires.");
    return;
  }

  const areIntegers =
    Number.isInteger(norm.x) &&
    Number.isInteger(norm.y) &&
    Number.isInteger(norm.z);

  if (areIntegers) {
    const commonDivisor = gcdOfThree(norm.x, norm.y, norm.z);
    if (commonDivisor > 1) {
      norm.divideScalar(commonDivisor);
    }
  }

  const newPlane = new Plane(n, p1, norm);
  geometryManager.addPlane(newPlane);
  saveState();
  updateAllUI();
  document.getElementById("planeName").value = "";
}

function onPlaneEquationPointChange() {
  const val = document.getElementById("planeEquationPointSelect").value;
  const xInput = document.getElementById("planeEqPointX");
  const yInput = document.getElementById("planeEqPointY");
  const zInput = document.getElementById("planeEqPointZ");

  if (val === "origin") {
    xInput.value = 0;
    yInput.value = 0;
    zInput.value = 0;
  } else if (val !== "") {
    const p = geometryManager.points[parseInt(val)];
    if (p) {
      xInput.value = formatNumber(p.position.x);
      // Attention : Inversion UI Y/Z standard dans votre code
      yInput.value = formatNumber(p.position.z); // Profondeur (UI Y) -> ThreeJS Z
      zInput.value = formatNumber(p.position.y); // Hauteur (UI Z) -> ThreeJS Y
    }
  } else {
    // Si on revient sur "Défaut", on vide pour laisser la priorité à la constante 'd' de l'équation
    xInput.value = "";
    yInput.value = "";
    zInput.value = "";
  }
}

function addPlaneFromEquation() {
  let equationStr = document.getElementById("planeEquationInput").value.trim();

  // ========================================
  // 1. VALIDATION DE L'ENTRÉE
  // ========================================
  if (!equationStr) {
    showSplashScreen(
      "âš ï¸ Veuillez entrer une équation (ex: 2x + y + z = 6).",
    );
    return;
  }

  // ========================================
  // 2. NORMALISATION DE L'ÉQUATION
  // ========================================
  // Convertir "2x - y + 3z = 6" en "2x - y + 3z - 6"
  if (equationStr.includes("=")) {
    const parts = equationStr.split("=");
    equationStr = `${parts[0]} - (${parts[1]})`;
  }

  // ========================================
  // 3. EXTRACTION DES COEFFICIENTS (a, b, c)
  // ========================================
  const getCoefficient = (variable) => {
    const regex = new RegExp(`([+-]?[\\d\\.]*)\\s*\\*?\\s*${variable}`, "gi");
    let totalCoeff = 0;
    let match;

    while ((match = regex.exec(equationStr)) !== null) {
      let coeffStr = match[1].replace(/\s/g, "");
      if (coeffStr === "" || coeffStr === "+") totalCoeff += 1;
      else if (coeffStr === "-") totalCoeff += -1;
      else totalCoeff += parseFloat(coeffStr);
    }
    return totalCoeff;
  };

  const a = getCoefficient("x");
  const b = getCoefficient("y"); // UI Y (Profondeur) â†’ ThreeJS Z
  const c = getCoefficient("z"); // UI Z (Hauteur) â†’ ThreeJS Y

  // Construction du vecteur normal Three.js
  // RAPPEL : a â†’ x, c â†’ y (hauteur), b â†’ z (profondeur)
  const normal = new THREE.Vector3(a, c, b);

  if (normal.lengthSq() < 1e-8) {
    showSplashScreen("âŒ Vecteur normal nul ou invalide. Vérifiez l'équation.");
    return;
  }

  // ========================================
  // 4. DÉTERMINATION DU POINT DE PASSAGE
  // ========================================
  const pxStr = document.getElementById("planeEqPointX").value.trim();
  const pyStr = document.getElementById("planeEqPointY").value.trim();
  const pzStr = document.getElementById("planeEqPointZ").value.trim();

  let pointOnPlane = null;
  let calculationMode = "auto"; // "auto" (constante d) ou "point" (point imposé)

  // CAS A : L'utilisateur a rempli les coordonnées (ou sélectionné un point)
  if (pxStr !== "" || pyStr !== "" || pzStr !== "") {
    calculationMode = "point";
    const px = parseFloat(pxStr) || 0;
    const py_ui = parseFloat(pyStr) || 0; // Profondeur
    const pz_ui = parseFloat(pzStr) || 0; // Hauteur

    // Création du point ThreeJS (X, Hauteur, Profondeur)
    pointOnPlane = new THREE.Vector3(px, pz_ui, py_ui);
  }
  // CAS B : Calcul automatique via la constante 'd' de l'équation
  else {
    // Extraction de la constante 'd'
    let constantStr = equationStr
      .replace(/[+-]?[\d\\.]*\s*\*?\s*[xyz]/gi, "") // Enlever tous les termes en x, y, z
      .replace(/--/g, "+") // Nettoyer les doubles signes
      .trim();

    let d = 0;
    try {
      if (constantStr) {
        // Évaluer l'expression mathématique restante (ex: "- 6" â†’ -6)
        d = new Function("return " + constantStr)();
      }
    } catch (e) {
      console.error("Erreur lors du calcul de la constante d:", e);
    }

    // Trouver un point arbitraire qui satisfait ax + by + cz + d = 0
    // On choisit le plus simple (mettre 2 coordonnées à 0)
    if (Math.abs(normal.x) > 1e-6) {
      pointOnPlane = new THREE.Vector3(-d / normal.x, 0, 0);
    } else if (Math.abs(normal.z) > 1e-6) {
      pointOnPlane = new THREE.Vector3(0, 0, -d / normal.z);
    } else if (Math.abs(normal.y) > 1e-6) {
      pointOnPlane = new THREE.Vector3(0, -d / normal.y, 0);
    } else {
      pointOnPlane = new THREE.Vector3(0, 0, 0);
    }
  }

  // ========================================
  // 5. GÉNÉRATION DU NOM ET CRÉATION
  // ========================================
  let baseName;
  if (calculationMode === "point") {
    // Nom basé sur la normale (plus explicite)
    baseName = `Plan(n[${a},${b},${c}])`;
  } else {
    // Nom basé sur l'équation (tronquée pour la lisibilité)
    baseName = `Plan(${formatNumber(a)}x+${formatNumber(b)}y+${formatNumber(c)}z...)`;
  }

  const uniqueName = geometryManager.generateUniqueName(baseName, "plane");
  const newPlane = new Plane(uniqueName, pointOnPlane, normal, 0xffeb3b);

  geometryManager.addPlane(newPlane);
  updateAllUI();
  saveState();

  // ========================================
  // 6. NETTOYAGE DES CHAMPS
  // ========================================
  document.getElementById("planeEquationInput").value = "";

  // Remettre le select sur "défaut"
  const select = document.getElementById("planeEquationPointSelect");
  if (select) select.value = "";

  // Vider les champs manuels
  document.getElementById("planeEqPointX").value = "";
  document.getElementById("planeEqPointY").value = "";
  document.getElementById("planeEqPointZ").value = "";

  // Message de confirmation
  showSplashScreen(`âœ… Plan "${uniqueName}" créé !`);
}
function removePlaneById(id) {
  const p = geometryManager.findPlaneById(id);
  if (p && confirm(`Supprimer le plan "${p.name}" ?`)) {
    if (selectedObjectInstance === p) {
      deselectCurrentObject();
    }
    // Chercher et supprimer le vecteur normal associé s'il existe
    const normalVector = geometryManager.vectors.find(
      (v) => v.parentPlaneId === p.id && v.isNormalVector,
    );
    if (normalVector) {
      geometryManager.removeVector(normalVector);
    }

    // Supprimer le plan lui-mÃªme
    geometryManager.removePlane(p);
    updateAllUI();
    saveState();
  }
}

function clearAllPlanes() {
  if (confirm("Effacer tous les plans et leurs normales associées ?")) {
    // D'abord, trouver et supprimer tous les vecteurs normaux
    deselectCurrentObject();
    const normalVectors = geometryManager.vectors.filter(
      (v) => v.isNormalVector,
    );
    normalVectors.forEach((v) => geometryManager.removeVector(v));

    // Ensuite, supprimer tous les plans
    geometryManager.planes.forEach((plane) => plane.removeFromScene(scene));
    geometryManager.planes = [];
    updateAllUI();
    saveState();
  }
}

function togglePlaneVisibility(id) {
  const p = geometryManager.findPlaneById(id);
  if (p) {
    p.setVisibility(!p.isVisible);
    updatePlaneList();
  }
}

// --- Vecteurs ---
function addVectorFromPoints() {
  const [sIdx, eIdx] = ["vectorStartPoint", "vectorEndPoint"].map(
    (id) => document.getElementById(id).value,
  );
  if (sIdx === "" || eIdx === "" || sIdx === eIdx) {
    showSplashScreen("Sélectionnez deux points différents.");
    return;
  }
  const pS = geometryManager.points[sIdx],
    pE = geometryManager.points[eIdx];
  const c = new THREE.Vector3().subVectors(pE.position, pS.position);

  const baseName = `Vecteur(${pS.name}${pE.name})`;
  const uniqueName = geometryManager.generateUniqueName(baseName, "vector");
  geometryManager.addVector(new Vector(uniqueName, pS.position, c));
  updateAllUI();
  saveState();
}

function addVectorFromCoords() {
  const n =
    document.getElementById("vectorNameCoords").value.trim() || "Vecteur";

  // Vérification doublon de nom
  if (geometryManager.vectors.some((vector) => vector.name === n)) {
    showSplashScreen(
      `Le nom de vecteur "${n}" est déjà utilisé. Veuillez en choisir un autre.`,
    );
    return;
  }

  // 1. Lecture des COMPOSANTES du vecteur (Vx, Vy, Vz)
  const vx = parseFloat(document.getElementById("vectorCoordX").value);
  const vy_vec = parseFloat(document.getElementById("vectorCoordY").value); // Profondeur (UI)
  const vz_vec = parseFloat(document.getElementById("vectorCoordZ").value); // Hauteur (UI)

  // 2. Lecture de l'ORIGINE du vecteur (Ox, Oy, Oz) - C'est ici qu'était le problème
  // On lit maintenant ce que vous tapez, ou ce qui a été rempli automatiquement
  const ox = parseFloat(document.getElementById("vectorOriginX").value);
  const oy_org = parseFloat(document.getElementById("vectorOriginY").value); // Profondeur (UI)
  const oz_org = parseFloat(document.getElementById("vectorOriginZ").value); // Hauteur (UI)

  // 3. Validation
  // On vérifie que TOUT est numérique. Si une case origine est vide, on considère que c'est invalide (ou on pourrait mettre 0 par défaut).
  if ([vx, vy_vec, vz_vec, ox, oy_org, oz_org].some(isNaN)) {
    showSplashScreen(
      "Veuillez remplir toutes les coordonnées (Composantes ET Origine).",
    );
    return;
  }

  // 4. Création des objets Three.js
  // Attention à l'inversion Y/Z spécifique à votre application :
  // UI (X, Profondeur, Hauteur) -> ThreeJS (x, z, y)
  const comps = new THREE.Vector3(vx, vz_vec, vy_vec);
  const origin = new THREE.Vector3(ox, oz_org, oy_org);

  // 5. Ajout
  geometryManager.addVector(new Vector(n, origin, comps));

  cancelVectorEdit(); // Vide les champs proprement
  updateAllUI();
  saveState();
}

function updateVector() {
  const id = parseInt(document.getElementById("editVectorId").value);
  const v = geometryManager.findVectorById(id);
  if (!v) return;

  const n = document.getElementById("vectorNameCoords").value.trim();

  // Vérif doublon de nom
  if (geometryManager.vectors.some((vec) => vec.name === n && vec.id !== id)) {
    showSplashScreen(`Le nom "${n}" est déjà utilisé.`);
    return;
  }

  // 1. Lecture des COMPOSANTES (Vx, Vy, Vz)
  const vx = parseFloat(document.getElementById("vectorCoordX").value);
  const vy_ui = parseFloat(document.getElementById("vectorCoordY").value);
  const vz_ui = parseFloat(document.getElementById("vectorCoordZ").value);

  // 2. Lecture de l'ORIGINE (Ox, Oy, Oz) - AJOUT CRUCIAL
  // On lit maintenant les valeurs que vous avez saisies manuellement
  const ox = parseFloat(document.getElementById("vectorOriginX").value);
  const oy_ui = parseFloat(document.getElementById("vectorOriginY").value);
  const oz_ui = parseFloat(document.getElementById("vectorOriginZ").value);

  // Vérification de validité
  if ([vx, vy_ui, vz_ui, ox, oy_ui, oz_ui].some((val) => isNaN(val))) {
    showSplashScreen(
      "Toutes les coordonnées (Composantes et Origine) doivent Ãªtre valides.",
    );
    return;
  }

  // 3. Création des vecteurs ThreeJS (Attention à l'inversion Y/Z)
  const components = new THREE.Vector3(vx, vz_ui, vy_ui);
  const origin = new THREE.Vector3(ox, oz_ui, oy_ui);

  // 4. Application de la mise à jour
  // On ignore désormais le menu déroulant, on fait confiance aux champs de saisie
  v.update(n, origin, components);

  // 5. Finalisation
  updateAllUI();
  cancelVectorEdit();
  saveState();
  showSplashScreen("Vecteur mis à jour !");
}

function deleteEditingVector() {
  const id = parseInt(document.getElementById("editVectorId").value);
  if (isNaN(id)) return; // Sécurité pour éviter les erreurs

  const vector = geometryManager.findVectorById(id);
  if (vector) {
    // On utilise la fonction de suppression existante, qui gère la confirmation
    removeVectorById(id);
    // On réinitialise le formulaire
    cancelVectorEdit();
  }
}

function cancelVectorEdit() {
  // 1. Vider les champs
  document.getElementById("vectorNameCoords").value = "";
  document.getElementById("vectorCoordX").value = "";
  document.getElementById("vectorCoordY").value = "";
  document.getElementById("vectorCoordZ").value = "";
  document.getElementById("vectorOriginX").value = "";
  document.getElementById("vectorOriginY").value = "";
  document.getElementById("vectorOriginZ").value = "";
  document.getElementById("editVectorId").value = "";
  document.getElementById("vectorOriginPoint").value = "";

  // 2. Rétablir les boutons
  const addBtn = document.getElementById("addVectorFromCoordsBtn");
  if (addBtn) addBtn.style.display = "block"; // On réaffiche "Ajouter"

  const editActions = document.getElementById("vectorEditActions");
  if (editActions) editActions.style.display = "none"; // On cache "Mettre à jour"

  // 3. Désélectionner l'objet 3D (optionnel mais recommandé)
  deselectCurrentObject();
}

function removeVectorById(id) {
  const v = geometryManager.findVectorById(id);
  if (v && confirm(`Supprimer "${v.name}" ?`)) {
    if (selectedObjectInstance === v) {
      deselectCurrentObject();
    }
    geometryManager.removeVector(v);
    updateAllUI();
    saveState();
  }
}

function clearAllVectors() {
  if (confirm("Effacer tous les vecteurs ?")) {
    geometryManager.vectors.forEach((vector) => vector.removeFromScene(scene));
    geometryManager.vectors = [];
    updateAllUI();
  }
}

function toggleVectorVisibility(id) {
  const v = geometryManager.findVectorById(id);
  if (v) {
    v.setVisibility(!v.isVisible);
    updateVectorList();
  }
}

function performRaycastSelection(screenX, screenY) {
  mouse.x = (screenX / window.innerWidth) * 2 - 1;
  mouse.y = -(screenY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Only include visible objects in raycasting
  const meshes = [
    ...geometryManager.points.filter((p) => p.isVisible).map((p) => p.mesh),
    ...geometryManager.lines.filter((l) => l.isVisible).map((l) => l.mesh),
    ...geometryManager.planes.filter((p) => p.isVisible).map((p) => p.mesh),
    ...geometryManager.vectors
      .filter((v) => v.isVisible)
      .map((v) => v.arrowHelper)
      .filter(Boolean)
      .flatMap((a) => [a.line, a.cone]),
  ];

  const intersects = raycaster.intersectObjects(meshes);

  if (intersects.length > 0) {
    // Un objet est touché, on le sélectionne
    handleSelection(intersects[0].object);
  } else {
    // Aucun objet n'est touché, on désélectionne tout
    deselectCurrentObject();
    cancelEdit();
    cancelVectorEdit();
  }
}

function handleSelection(mesh) {
  const inst = mesh.userData.instance;
  if (!inst) return;

  // 1. Gestion du Toggle (Désélection si déjà sélectionné)
  if (inst === selectedObjectInstance) {
    deselectCurrentObject();
    // On annule les modes d'édition spécifiques
    if (typeof cancelEdit === "function") cancelEdit();
    if (typeof cancelVectorEdit === "function") cancelVectorEdit();
    if (typeof cancelLineEdit === "function") cancelLineEdit();
    if (typeof cancelPlaneEdit === "function") cancelPlaneEdit();
    return;
  }

  // 2. Nouvelle sélection
  deselectCurrentObject(); // Nettoie la sélection précédente
  selectedObjectInstance = inst;

  // 3. Attachement du Gizmo (Flèches de déplacement)
  if (transformControl) {
    if (inst instanceof Vector && inst.arrowHelper) {
      transformControl.attach(inst.arrowHelper);
      inst.arrowHelper.setColor(0xffff00); // Jaune
    } else {
      transformControl.attach(mesh);
      // Surbrillance
      if (mesh.material && mesh.material.color) {
        mesh.material.color.set(0xffff00);
        if (inst instanceof Plane) mesh.material.opacity = 0.75;
      }
    }
    transformControl.setMode("translate");
  }

  // =========================================================
  // 4. MISE Ã€ JOUR DU MENU TRANSFORMATION (La nouveauté est ici)
  // =========================================================

  // A. On cache le texte "Veuillez sélectionner..."
  const hint = document.getElementById("transformations-hint");
  if (hint) hint.style.display = "none";

  // B. On affiche le conteneur des inputs
  const container = document.getElementById("transformations-container");
  if (container) container.style.display = "block";

  // C. On réinitialise les valeurs par défaut (pour éviter de garder les anciennes)
  document.getElementById("transX").value = "0";
  document.getElementById("transY").value = "0";
  document.getElementById("transZ").value = "0";
  document.getElementById("rotationAngle").value = "90";

  // D. On met à jour les listes déroulantes (Centre de rotation, Réf symétrie)
  // pour qu'elles contiennent l'objet sélectionné si besoin
  updateSelects();
  updateSymmetryUI();

  // =========================================================

  // 5. Mise à jour du panneau d'édition classique (Nom, Coordonnées)
  // Note : On passe 'false' ou on modifie la logique pour ne pas forcer l'ouverture du panneau
  // si vous Ãªtes sur mobile.
  const isMobile = window.innerWidth <= 768;
  updatePanelForSelection(inst, !isMobile);
}

function deselectCurrentObject() {
  if (transformControl) {
    transformControl.detach();
  }

  // Gestion de l'UI Transformation : Retour à l'état "Pas de sélection"
  const hint = document.getElementById("transformations-hint");
  const container = document.getElementById("transformations-container");
  if (hint) hint.style.display = "block"; // Affiche "Faites un clic droit..." ou "Sélectionnez..."
  if (container) container.style.display = "none"; // Cache les inputs

  if (!selectedObjectInstance) return;

  const inst = selectedObjectInstance;

  // Restaurer la couleur
  if (inst instanceof Vector) {
    inst.arrowHelper.setColor(inst.color);
  } else if (inst.mesh) {
    inst.mesh.material.color.copy(inst.color);
    if (inst instanceof Plane) inst.mesh.material.opacity = 0.5; // ou 0.4 selon votre config
  }

  selectedObjectInstance = null;
}

function updatePanelForSelection(inst) {
  // DÉTECTION : Si largeur écran <= 768px, on considère que c'est du mobile/tactile
  const isMobile = window.innerWidth <= 768;

  // Si on est sur mobile, shouldOpen sera FALSE.
  // Le panneau restera donc fermé grâce aux modifications ci-dessus.
  const shouldOpen = !isMobile;

  if (inst instanceof Point) {
    // On passe l'index et le booléen
    editPoint(geometryManager.points.indexOf(inst), shouldOpen);
  } else if (inst instanceof Vector) {
    editVector(inst.id, shouldOpen);
  } else if (inst instanceof Line3D) {
    editLine(inst.id, shouldOpen);
  } else if (inst instanceof Plane) {
    editPlane(inst.id, shouldOpen);
  }
}

function constructChaslesSum() {
  // 1. Nettoyer toute construction précédente pour repartir de zéro
  clearChaslesConstruction();

  // 2. Récupérer les objets sélectionnés dans l'interface
  const u = geometryManager.findVectorById(
    parseInt(document.getElementById("sumVectorSelect1").value),
  );
  const v = geometryManager.findVectorById(
    parseInt(document.getElementById("sumVectorSelect2").value),
  );
  const originId = document.getElementById("sumVectorOrigin").value;
  const resultDiv = document.getElementById("vectorSumResult");

  if (!u || !v || originId === "") {
    showSplashScreen(
      "Veuillez sélectionner deux vecteurs et un point de départ pour la construction.",
    );
    resultDiv.textContent = "Sélection invalide.";
    return;
  }

  const pointA =
    originId === "origin"
      ? new THREE.Vector3(0, 0, 0)
      : geometryManager.points[parseInt(originId)].position.clone();

  // 3. Calculer les points clés de la construction
  const pointB = new THREE.Vector3().addVectors(pointA, u.components);

  // 4. Créer les objets visuels et les ajouter au suivi
  // Représentant de u (bleu)
  const u_rep = new Vector(
    geometryManager.generateUniqueName(`Rep(${u.name})`, "vector"),
    pointA,
    u.components,
    0x2196f3,
  );
  geometryManager.addVector(u_rep);
  currentConstructionObjects.push(u_rep);

  // Représentant de v (rouge)
  const v_rep = new Vector(
    geometryManager.generateUniqueName(`Rep(${v.name})`, "vector"),
    pointB,
    v.components,
    0xf44336,
  );
  geometryManager.addVector(v_rep);
  currentConstructionObjects.push(v_rep);

  // Vecteur somme (violet)
  const sumComponents = new THREE.Vector3().addVectors(
    u.components,
    v.components,
  );
  const sum_vec = new Vector(
    geometryManager.generateUniqueName(`Somme(${u.name},${v.name})`, "vector"),
    pointA,
    sumComponents,
    0x8a2be2,
  );
  geometryManager.addVector(sum_vec);
  currentConstructionObjects.push(sum_vec);

  // 5. Afficher le résultat dans l'UI
  resultDiv.innerHTML = `Construction de Chasles effectuée.<br>
                               <strong>${u_rep.name} + ${v_rep.name} = ${sum_vec.name}</strong><br>
                               Composantes somme: <strong>(${formatNumber(sumComponents.x)}, ${formatNumber(
                                 sumComponents.y,
                               )}, ${formatNumber(sumComponents.z)})</strong>`;

  // 6. Mettre à jour la scène et afficher le bouton de nettoyage
  updateAllUI();
  saveState();
  document.getElementById("clearChaslesBtn").style.display = "block";
}

function clearChaslesConstruction() {
  if (currentConstructionObjects.length === 0) {
    return; // Rien à faire
  }

  // Parcourir la liste des objets suivis et les supprimer
  currentConstructionObjects.forEach((obj) => {
    if (obj instanceof Vector) {
      geometryManager.removeVector(obj);
    }
  });

  // Vider la liste de suivi
  currentConstructionObjects = [];

  // Réinitialiser l'interface
  document.getElementById("clearChaslesBtn").style.display = "none";
  document.getElementById("vectorSumResult").innerHTML = "";

  updateAllUI();
}

function displayPlaneEquation() {
  const s = document.getElementById("equationPlaneSelect"),
    r = document.getElementById("planeEquationDisplay");
  if (!s || !r) return;

  const pId = parseInt(s.value),
    p = geometryManager.findPlaneById(pId);
  if (!p) {
    r.innerHTML = "Aucun plan sélectionné.";
    return;
  }

  const n = p.displayNormal;
  const p0 = p.pointOnPlane;
  // La constante 'd' de l'équation ax+by+cz+d=0
  const d = -n.dot(p0);

  const terms = [];

  // Terme en X
  if (Math.abs(n.x) > 1e-6) {
    if (Math.abs(n.x - 1) < 1e-6) terms.push("x");
    else if (Math.abs(n.x + 1) < 1e-6) terms.push("-x");
    else terms.push(`${formatNumber(n.x, 2)}x`);
  }

  // Terme en Y (profondeur) -> utilise n.z
  if (Math.abs(n.z) > 1e-6) {
    const sign = n.z > 0 ? " + " : " - ";
    const absValue = Math.abs(n.z);
    if (absValue === 1) terms.push(`${sign}y`);
    else terms.push(`${sign}${formatNumber(absValue, 2)}y`);
  }

  // Terme en Z (hauteur) -> utilise n.y
  if (Math.abs(n.y) > 1e-6) {
    const sign = n.y > 0 ? " + " : " - ";
    const absValue = Math.abs(n.y);
    if (absValue === 1) terms.push(`${sign}z`);
    else terms.push(`${sign}${formatNumber(absValue, 2)}z`);
  }

  // Terme constant D
  if (Math.abs(d) > 1e-6) {
    const sign = d > 0 ? " + " : " - ";
    terms.push(`${sign}${formatNumber(Math.abs(d), 2)}`);
  }

  // Si tous les coefficients sont nuls
  if (terms.length === 0) {
    r.innerHTML = "<strong>0 = 0</strong>";
    return;
  }

  // On assemble l'équation en joignant les termes
  let equation = terms.join(" ").trim();

  // On nettoie le début de la chaîne pour un affichage parfait
  if (equation.startsWith("+ ")) {
    // Enlève le " + " initial si le premier terme est positif
    equation = equation.substring(2);
  } else if (equation.startsWith("- ")) {
    // Enlève l'espace après le "-" initial si le premier terme est négatif
    equation = "-" + equation.substring(2);
  }

  r.innerHTML = `<strong>${equation} = 0</strong>`;
}

function displayLineEquation(tempLineInstance = null) {
  const s = document.getElementById("equationLineSelect"),
    r = document.getElementById("lineEquationDisplay");
  if (!s || !r) return;

  let l;

  // Si une instance temporaire est fournie (pendant le drag), on l'utilise
  if (tempLineInstance) {
    l = tempLineInstance;
  } else {
    // Sinon, on cherche la droite sélectionnée dans le gestionnaire
    const lId = parseInt(s.value);
    l = geometryManager.findLineById(lId);
  }

  if (!l) {
    r.innerHTML = "Aucune droite sélectionnée.";
    return;
  }

  const p0 = l.startPoint;
  const v = l.directorVector;

  const formatTTerm = (coefficient) => {
    if (Math.abs(coefficient) < 1e-6) return "";
    const sign = coefficient > 0 ? " + " : " - ";
    const absValue = Math.abs(coefficient);
    if (Math.abs(absValue - 1) < 1e-6) return `${sign}t`;
    else return `${sign}${formatNumber(absValue, 2)}t`;
  };

  const eX = `x = ${formatNumber(p0.x, 2)}${formatTTerm(v.x)}`;

  // La ligne 'y' (profondeur) doit afficher les composantes Z de Three.js
  const eY = `y = ${formatNumber(p0.z, 2)}${formatTTerm(v.z)}`;
  // La ligne 'z' (hauteur) doit afficher les composantes Y de Three.js
  const eZ = `z = ${formatNumber(p0.y, 2)}${formatTTerm(v.y)}`;

  r.innerHTML = `<strong>${eX}<br>${eY}<br>${eZ}</strong>`;
}

function calculateVectorSumFree() {
  // Nettoyer toute construction visuelle de Chasles qui pourrait Ãªtre active
  clearChaslesConstruction();

  const v1 = geometryManager.findVectorById(
    parseInt(document.getElementById("sumVectorSelect1").value),
  );
  const v2 = geometryManager.findVectorById(
    parseInt(document.getElementById("sumVectorSelect2").value),
  );
  const r = document.getElementById("vectorSumResult");

  if (!v1 || !v2) {
    showSplashScreen("Veuillez sélectionner deux vecteurs.");
    r.textContent = "Veuillez sélectionner deux vecteurs.";
    return;
  }

  const sumComponents = new THREE.Vector3().addVectors(
    v1.components,
    v2.components,
  );

  let sumOrigin;
  const originSelection = document.getElementById("sumVectorOrigin").value;
  let originPointName = "l'origine du repère";

  if (originSelection !== "origin" && originSelection !== "") {
    const originPoint = geometryManager.points[parseInt(originSelection)];
    sumOrigin = originPoint.position.clone();
    originPointName = `point ${originPoint.name}`;
  } else {
    sumOrigin = new THREE.Vector3(0, 0, 0); // Origine par défaut
  }

  const baseName = `Somme(${v1.name},${v2.name})`;
  const uniqueName = geometryManager.generateUniqueName(baseName, "vector");

  const newVector = new Vector(uniqueName, sumOrigin, sumComponents, 0x9932cc);
  geometryManager.addVector(newVector);

  const componentsText = `(${formatNumber(sumComponents.x)}, ${formatNumber(sumComponents.y)}, ${formatNumber(
    sumComponents.z,
  )})`;
  const normText = formatNumber(sumComponents.length(), 3);

  r.innerHTML = `Vecteur somme "${uniqueName}" créé depuis ${originPointName}.<br>
                     Composantes: <strong>${componentsText}</strong><br>
                     Norme â‰ˆ <strong>${normText}</strong>`;

  updateAllUI();
  saveState();
}

function calculateScalarProduct() {
  const [v1, v2] = [
    geometryManager.findVectorById(
      parseInt(document.getElementById("dotVectorSelect1").value),
    ),
    geometryManager.findVectorById(
      parseInt(document.getElementById("dotVectorSelect2").value),
    ),
  ];
  const r = document.getElementById("scalarProductResult");

  if (!v1 || !v2) {
    r.textContent = "Sélectionnez deux vecteurs.";
    return;
  }

  // 1. Calcul du produit scalaire
  const dP = v1.components.dot(v2.components);

  // 2. Calcul des normes
  const len1 = v1.components.length();
  const len2 = v2.components.length();
  const productLen = len1 * len2;

  let angleInfo = "";

  // 3. Calcul de l'angle et du cosinus (si les vecteurs ne sont pas nuls)
  if (productLen > 1e-9) {
    // Calcul du cosinus
    let cosTheta = dP / productLen;

    // Correction des erreurs d'arrondi flottant (ex: 1.000000002 qui ferait planter acos)
    cosTheta = Math.max(-1, Math.min(1, cosTheta));

    // Calcul de l'angle en radians puis degrés
    const angleRad = Math.acos(cosTheta);
    const angleDeg = angleRad * (180 / Math.PI);

    angleInfo = `<br>
                 <span style="font-size:0.9em; color:#555;">
                    cos(Î¸) = <strong>${cosTheta.toFixed(4)}</strong><br>
                    Angle Î¸ â‰ˆ <strong>${angleDeg.toFixed(2)}Â°</strong>
                 </span>`;
  } else {
    angleInfo = `<br><span style="font-size:0.9em; color:#a00;">Angle indéfini (vecteur nul)</span>`;
  }

  // 4. Affichage du résultat complet
  r.innerHTML = `<strong>${v1.name} â‹… ${v2.name} = ${parseFloat(dP.toFixed(4))}</strong>${angleInfo}`;
}

function calculateVectorProduct() {
  const [v1, v2] = [
    geometryManager.findVectorById(
      parseInt(document.getElementById("crossVectorSelect1").value),
    ),
    geometryManager.findVectorById(
      parseInt(document.getElementById("crossVectorSelect2").value),
    ),
  ];
  const r = document.getElementById("vectorProductResult");

  if (!v1 || !v2) {
    showSplashScreen("Sélectionnez deux vecteurs.");
    r.textContent = "Veuillez sélectionner deux vecteurs.";
    return;
  }

  let o = new THREE.Vector3(0, 0, 0);
  const oS = document.getElementById("crossVectorOrigin").value;
  if (oS !== "origin" && oS !== "") {
    o = geometryManager.points[parseInt(oS)].position;
  }
  const rC = new THREE.Vector3().crossVectors(v1.components, v2.components);

  const baseName = `ProduitVect(${v1.name},${v2.name})`;
  const uniqueName = geometryManager.generateUniqueName(baseName, "vector");

  const newVector = new Vector(uniqueName, o, rC, 0x4682b4);
  geometryManager.addVector(newVector);

  // --- NOUVELLE MISE EN FORME HTML (SIMPLE ET ALIGNÉE Ã€ GAUCHE) ---
  const componentsText = `(${formatNumber(rC.x)}, ${formatNumber(rC.y)}, ${formatNumber(rC.z)})`;
  const normText = formatNumber(rC.length(), 3);

  r.innerHTML = `Vecteur "${uniqueName}" créé<br>
                     Composantes: <strong>${componentsText}</strong><br>
                     Norme â‰ˆ <strong>${normText}</strong>`;
  // --- FIN DE LA MODIFICATION ---

  updateAllUI();
  saveState();
}

function calculatePointPointDistance() {
  const [i1, i2] = [
    document.getElementById("distPointSelect1").value,
    document.getElementById("distPointSelect2").value,
  ];
  if (i1 === "" || i2 === "") return;
  const p1 = geometryManager.points[i1],
    p2 = geometryManager.points[i2];
  const d = p1.position.distanceTo(p2.position);
  document.getElementById("distResult1").innerHTML =
    `Dist(${p1.name},${p2.name}) = <strong>${d.toFixed(3)}</strong>`;
}

function calculatePointLineDistance() {
  const pI = document.getElementById("distPointSelect3").value,
    lI = document.getElementById("distLineSelect1").value;
  if (pI === "" || lI === "") return;
  const p = geometryManager.points[pI],
    l = geometryManager.findLineById(parseInt(lI));

  // --- CORRECTION APPLIQUÉE ---
  const lineMath = new THREE.Line3(
    l.startPoint
      .clone()
      .add(l.directorVector.clone().normalize().multiplyScalar(-1000)),
    l.startPoint
      .clone()
      .add(l.directorVector.clone().normalize().multiplyScalar(1000)),
  );
  const closestPoint = new THREE.Vector3();
  lineMath.closestPointToPoint(p.position, true, closestPoint);
  const d = p.position.distanceTo(closestPoint);
  // --- FIN DE LA CORRECTION ---

  document.getElementById("distResult2").innerHTML =
    `Dist(${p.name}, ${l.name}) = <strong>${d.toFixed(3)}</strong>`;
}

function calculatePointPlaneDistance() {
  const pI = document.getElementById("calcPointSelect").value,
    plId = parseInt(document.getElementById("calcPlaneSelect1").value);
  const r = document.getElementById("calcResultDisplay1"); // CORRECTED ID
  if (pI === "" || isNaN(plId)) {
    r.textContent = "Sélectionnez un point et un plan.";
    return;
  }
  const pt = geometryManager.points[pI],
    pl = geometryManager.findPlaneById(plId);
  const vP0P = new THREE.Vector3().subVectors(pt.position, pl.pointOnPlane);
  const d = Math.abs(vP0P.dot(pl.normal));
  r.innerHTML = `Distance = <strong>${d.toFixed(3)}</strong>`;
}

function calculateLineLineAngle() {
  const [l1, l2] = [
    geometryManager.findLineById(
      parseInt(document.getElementById("angleLineSelect1").value),
    ),
    geometryManager.findLineById(
      parseInt(document.getElementById("angleLineSelect2").value),
    ),
  ];
  const r = document.getElementById("angleResult1");
  if (!l1 || !l2) {
    r.textContent = "Sélectionnez deux droites.";
    return;
  }
  let a = (l1.directorVector.angleTo(l2.directorVector) * 180) / Math.PI;
  if (a > 90) a = 180 - a;
  r.innerHTML = `Angle â‰ˆ <strong>${a.toFixed(2)}Â°</strong>`;
}

function calculatePlanePlaneAngle() {
  const [p1, p2] = [
    geometryManager.findPlaneById(
      parseInt(document.getElementById("anglePlaneSelect1").value),
    ),
    geometryManager.findPlaneById(
      parseInt(document.getElementById("anglePlaneSelect2").value),
    ),
  ];
  const r = document.getElementById("angleResult2");
  if (!p1 || !p2) {
    r.textContent = "Sélectionnez deux plans.";
    return;
  }
  let a = (p1.normal.angleTo(p2.normal) * 180) / Math.PI;
  if (a > 90) a = 180 - a;
  r.innerHTML = `Angle â‰ˆ <strong>${a.toFixed(2)}Â°</strong>`;
}

function calculateLinePlaneAngle() {
  const l = geometryManager.findLineById(
      parseInt(document.getElementById("angleLineSelect3").value),
    ),
    p = geometryManager.findPlaneById(
      parseInt(document.getElementById("anglePlaneSelect3").value),
    );

  const r = document.getElementById("angleResult3");
  if (!l || !p) {
    r.textContent = "Sélectionnez une droite et un plan.";
    return;
  }
  const dot = Math.abs(l.directorVector.clone().normalize().dot(p.normal));
  const a = (Math.asin(dot) * 180) / Math.PI;
  r.innerHTML = `Angle â‰ˆ <strong>${a.toFixed(2)}Â°</strong>`;
}

function calculateLinePlaneIntersection() {
  console.log("calculateLinePlaneIntersection1");
  // 1. Récupération des éléments UI (inchangé)
  const lineSelect = document.getElementById("calcLineSelect");
  const planeSelect = document.getElementById("calcPlaneSelect2");
  const resultDisplay = document.getElementById("calcResultDisplay2");

  if (!lineSelect || !planeSelect || !resultDisplay) {
    console.error(
      "IDs de sélection pour le calcul d'intersection non trouvés.",
    );
    return;
  }

  // 2. Récupération des objets géométriques (inchangé)
  const line = geometryManager.findLineById(parseInt(lineSelect.value));
  const plane = geometryManager.findPlaneById(parseInt(planeSelect.value));

  if (!line || !plane) {
    resultDisplay.innerHTML =
      "Veuillez sélectionner une droite et un plan valides.";
    return;
  }

  // 3. Calcul de l'intersection (inchangé)
  const p0 = line.startPoint;
  const v = line.directorVector;
  const planePoint = plane.pointOnPlane;
  const n = plane.displayNormal;
  const dotNV = n.dot(v);

  if (Math.abs(dotNV) < 1e-6) {
    const pointIsOnPlane =
      Math.abs(n.dot(new THREE.Vector3().subVectors(p0, planePoint))) < 1e-6;
    if (pointIsOnPlane) {
      resultDisplay.innerHTML =
        "La droite est contenue dans le plan (infinité d'intersections).";
    } else {
      resultDisplay.innerHTML =
        "La droite est parallèle au plan (aucune intersection).";
    }
    return;
  }

  const t = n.dot(new THREE.Vector3().subVectors(planePoint, p0)) / dotNV;
  const intersectionPoint = new THREE.Vector3().copy(p0).addScaledVector(v, t);

  // --- DÉBUT DE LA MODIFICATION ---
  // On applique VOTRE fonction formatNumber aux résultats du calcul

  // 4. Formatage des coordonnées pour l'affichage et la saisie
  const formattedX = formatNumber(intersectionPoint.x);
  const formattedY_UI = formatNumber(intersectionPoint.z); // Le Z de Three.js est le Y de l'UI (profondeur)
  const formattedZ_UI = formatNumber(intersectionPoint.y); // Le Y de Three.js est le Z de l'UI (hauteur)

  // 5. Remplissage des champs de saisie avec les valeurs formatées
  const pointNameInput = document.getElementById("pointName");
  const pointXInput = document.getElementById("pointX");
  const pointYInput = document.getElementById("pointY");
  const pointZInput = document.getElementById("pointZ");

  const baseName = `Intersect(${line.name},${plane.name})`;
  const uniqueName = geometryManager.generateUniqueName(baseName, "point");

  pointNameInput.value = uniqueName;
  pointXInput.value = formattedX;
  pointYInput.value = formattedY_UI;
  pointZInput.value = formattedZ_UI;

  // 6. Affichage du résultat formaté dans la boîte de dialogue
  const displayCoords = `(${formattedX}, ${formattedY_UI}, ${formattedZ_UI})`;

  resultDisplay.innerHTML = `Coordonnées insérées dans la section 'Ajouter un point'.<br>
                               Nom suggéré : <strong>${uniqueName}</strong><br>
                               Coordonnées calculées : <strong>${displayCoords}</strong>`;

  // --- FIN DE LA MODIFICATION ---
}

function calculatePlanePlaneIntersection() {
  console.log("calculatePlanePlaneIntersection");
  const plane1Id = parseInt(document.getElementById("calcPlaneSelect3").value); // CORRECTED ID
  const plane2Id = parseInt(document.getElementById("calcPlaneSelect4").value); // CORRECTED ID
  const r = document.getElementById("calcResultDisplay3");

  const p1 = geometryManager.findPlaneById(plane1Id);
  const p2 = geometryManager.findPlaneById(plane2Id);

  if (!p1 || !p2) {
    r.textContent = "Veuillez sélectionner deux plans distincts.";
    return;
  }

  const n1 = p1.normal;
  const n2 = p2.normal;
  const lineDirection = new THREE.Vector3().crossVectors(n1, n2);

  if (lineDirection.lengthSq() < 1e-8) {
    const vec_p1_p2 = new THREE.Vector3().subVectors(
      p1.pointOnPlane,
      p2.pointOnPlane,
    );
    if (Math.abs(vec_p1_p2.dot(n2)) < 1e-6) {
      r.textContent = "Les plans sont confondus.";
    } else {
      r.textContent = "Les plans sont parallèles et distincts.";
    }
    return;
  }

  let linePoint;
  const d1 = n1.dot(p1.pointOnPlane);
  const d2 = n2.dot(p2.pointOnPlane);
  const absDir = new THREE.Vector3(
    Math.abs(lineDirection.x),
    Math.abs(lineDirection.y),
    Math.abs(lineDirection.z),
  );

  try {
    if (absDir.z > absDir.x && absDir.z > absDir.y) {
      const det = n1.x * n2.y - n2.x * n1.y;
      const x = (n2.y * d1 - n1.y * d2) / det;
      const y = (n1.x * d2 - n2.x * d1) / det;
      linePoint = new THREE.Vector3(x, y, 0);
    } else if (absDir.y > absDir.x) {
      const det = n1.x * n2.z - n2.x * n1.z;
      const x = (n2.z * d1 - n1.z * d2) / det;
      const z = (n1.x * d2 - n2.x * d1) / det;
      linePoint = new THREE.Vector3(x, 0, z);
    } else {
      const det = n1.y * n2.z - n1.z * n2.y; // CORRECTION
      const y = (n2.z * d1 - n1.z * d2) / det;
      const z = (n1.y * d2 - n2.y * d1) / det;
      linePoint = new THREE.Vector3(0, y, z);
    }
  } catch (error) {
    r.textContent = "Erreur numérique. Plans quasi parallèles ?";
    return;
  }

  if (isNaN(linePoint.x)) {
    r.textContent = "Calcul impossible (division par zéro).";
    return;
  }

  const baseName = `Intersect(${p1.name}, ${p2.name})`;
  const lineName = geometryManager.generateUniqueName(baseName, "line");
  const newLine = new Line3D(lineName, linePoint, lineDirection, 0xff1493);
  geometryManager.addLine(newLine);
  r.textContent = `Droite d'intersection "${lineName}" créée.`;
  updateAllUI();
  saveState();
}

function calculateLineLineIntersection() {
  const line1Id = parseInt(document.getElementById("calcLineSelect1").value); // CORRECTED ID
  const line2Id = parseInt(document.getElementById("calcLineSelect2").value); // CORRECTED ID
  const r = document.getElementById("calcResultDisplay4");

  const d1 = geometryManager.findLineById(line1Id);
  const d2 = geometryManager.findLineById(line2Id);

  if (!d1 || !d2) {
    r.textContent = "Veuillez sélectionner deux droites distinctes.";
    return;
  }

  const p1 = d1.startPoint,
    v1 = d1.directorVector.clone().normalize();
  const p2 = d2.startPoint,
    v2 = d2.directorVector.clone().normalize();

  const v1_cross_v2 = new THREE.Vector3().crossVectors(v1, v2);
  const p1_minus_p2 = new THREE.Vector3().subVectors(p1, p2);

  if (v1_cross_v2.lengthSq() < 1e-8) {
    if (p1_minus_p2.clone().cross(v1).lengthSq() < 1e-8) {
      r.textContent = "Droites colinéaires (confondues).";
    } else {
      r.textContent = "Droites parallèles et distinctes.";
    }
    return;
  }

  const mixedProduct = p1_minus_p2.dot(v1_cross_v2);

  if (Math.abs(mixedProduct) < 1e-6) {
    // --- CORRECTION DU CALCUL D'INTERSECTION ---

    // 1. Calculer le vecteur P2 - P1
    const p2_minus_p1 = new THREE.Vector3().subVectors(p2, p1);

    // 2. Formule : t = ((P2 - P1) x V2) . (V1 x V2) / ||V1 x V2||Â²
    // On calcule le numérateur du produit vectoriel
    const numeratorVec = new THREE.Vector3().crossVectors(p2_minus_p1, v2);

    // 3. Calcul du paramètre t
    const t = numeratorVec.dot(v1_cross_v2) / v1_cross_v2.lengthSq();

    // 4. Calcul du point : P1 + t * V1
    const intersectionPoint = p1.clone().add(v1.clone().multiplyScalar(t));

    // --- FIN DE LA CORRECTION ---

    const baseName = `Intersect(${d1.name}, ${d2.name})`;
    const pointName = geometryManager.generateUniqueName(baseName, "point");

    // Création du point (Constructeur Point : Nom, x, y, z)
    const newPoint = new Point(
      pointName,
      intersectionPoint.x,
      intersectionPoint.y,
      intersectionPoint.z,
      0x00ff00,
    );
    geometryManager.addPoint(newPoint);

    // Mise à jour de l'affichage
    const coordStr = `(${formatNumber(intersectionPoint.x)}, ${formatNumber(intersectionPoint.z)}, ${formatNumber(
      intersectionPoint.y,
    )})`;

    r.innerHTML = `Droites sécantes.<br>Point "<strong>${pointName}</strong>" créé.<br>Coord : ${coordStr}`;
    updateAllUI();
    saveState();
  } else {
    // ... (laisser le bloc 'else' pour les droites non-coplanaires tel quel)
    const distance = Math.abs(mixedProduct) / v1_cross_v2.length();
    r.innerHTML = `Droites non-coplanaires.<br>Distance min â‰ˆ <strong>${distance.toFixed(3)}</strong>.`;
  }
}

// =====================================================================================
