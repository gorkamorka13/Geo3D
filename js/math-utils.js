// SECTION : CALCULS GÉOMÉTRIQUES AVANCÉS
// =====================================================================================

/**
 * Calcule le segment le plus court entre deux droites (distance et points d'ancrage).
 * Gère les droites non coplanaires et parallèles.
 * @param {Line3D} line1
 * @param {Line3D} line2
 * @returns {Object} { distance: Number, p1: THREE.Vector3, p2: THREE.Vector3, type: "skew"|"parallel" }
 */
function getShortestSegmentBetweenLines(line1, line2) {
  const P1 = line1.startPoint;
  const u = line1.directorVector.clone().normalize();
  const P2 = line2.startPoint;
  const v = line2.directorVector.clone().normalize();

  const w0 = new THREE.Vector3().subVectors(P1, P2);
  const a = u.dot(u); // Toujours 1 si normalisé
  const b = u.dot(v);
  const c = v.dot(v); // Toujours 1 si normalisé
  const d = u.dot(w0);
  const e = v.dot(w0);

  const det = a * c - b * b;
  let sc, tc;

  // Si le déterminant est proche de 0, les droites sont parallèles
  if (Math.abs(det) < 1e-8) {
    // Droites parallèles
    sc = 0;
    tc = b > c ? d / b : e / c; // On projette P1 sur la droite 2

    // Point sur la droite 1 (fixe)
    const p1_res = P1.clone();
    // Point projeté sur la droite 2
    const p2_res = new THREE.Vector3().addVectors(P2, v.multiplyScalar(tc));

    return {
      distance: p1_res.distanceTo(p2_res),
      p1: p1_res,
      p2: p2_res,
      type: "parallel",
    };
  } else {
    // Droites non coplanaires (gauches)
    sc = (b * e - c * d) / det;
    tc = (a * e - b * d) / det;

    const p1_res = new THREE.Vector3().addVectors(P1, u.multiplyScalar(sc));
    const p2_res = new THREE.Vector3().addVectors(P2, v.multiplyScalar(tc));

    return {
      distance: p1_res.distanceTo(p2_res),
      p1: p1_res,
      p2: p2_res,
      type: "skew",
    };
  }
}

/**
 * Calcule l'angle entre un vecteur et un plan.
 * @param {Vector} vectorInstance Votre instance de classe Vector
 * @param {Plane} planeInstance Votre instance de classe Plane
 * @returns {Number} Angle en degrés
 */
function getVectorPlaneAngle(vectorInstance, planeInstance) {
  // Mathématiquement : arcsin( |u . n| / (||u|| * ||n||) )
  // Ou 90Â° - angle(vecteur, normale)

  const u = vectorInstance.components.clone().normalize();
  const n = planeInstance.normal.clone().normalize();

  // Produit scalaire
  const dot = u.dot(n);

  // On prend la valeur absolue car l'angle géométrique est entre la droite portée par le vecteur et le plan
  // Math.asin renvoie des radians
  const angleRad = Math.asin(Math.abs(dot));
  const angleDeg = THREE.MathUtils.radToDeg(angleRad);

  return angleDeg;
}

/**
 * Projette un point sur une droite.
 * @param {Point} pointInstance
 * @param {Line3D} lineInstance
 * @returns {Object} { projectedPoint: THREE.Vector3, distance: Number }
 */
function projectPointOnLine(pointInstance, lineInstance) {
  const P = pointInstance.position;
  const A = lineInstance.startPoint;
  const u = lineInstance.directorVector.clone().normalize();

  // Vecteur AP
  const AP = new THREE.Vector3().subVectors(P, A);

  // Projection scalaire t = AP . u
  const t = AP.dot(u);

  // Point H = A + t*u
  const H = new THREE.Vector3().copy(A).add(u.multiplyScalar(t));

  return {
    projectedPoint: H,
    distance: P.distanceTo(H),
  };
}

/**
 * Calcule le barycentre de N points avec pondération.
 * @param {Array<Point>} pointsArray Tableau d'instances de Point
 * @param {Array<Number>} weightsArray Tableau de poids (optionnel, défaut 1)
 * @returns {THREE.Vector3} Position du barycentre
 */
function computeBarycenter(pointsArray, weightsArray = null) {
  if (!pointsArray || pointsArray.length === 0)
    return new THREE.Vector3(0, 0, 0);

  let sumX = 0,
    sumY = 0,
    sumZ = 0;
  let totalWeight = 0;

  for (let i = 0; i < pointsArray.length; i++) {
    const p = pointsArray[i].position;
    // Si pas de poids fourni, on utilise 1 (isobarycentre)
    const w =
      weightsArray && weightsArray[i] !== undefined
        ? parseFloat(weightsArray[i])
        : 1;

    sumX += p.x * w;
    sumY += p.y * w;
    sumZ += p.z * w;
    totalWeight += w;
  }

  if (totalWeight === 0) {
    console.warn("Somme des poids nulle, calcul impossible.");
    return new THREE.Vector3(0, 0, 0);
  }

  return new THREE.Vector3(
    sumX / totalWeight,
    sumY / totalWeight,
    sumZ / totalWeight,
  );
}

function calculateCommonPerpendicular() {
  const l1Id = parseInt(document.getElementById("perpLine1").value);
  const l2Id = parseInt(document.getElementById("perpLine2").value);
  const r = document.getElementById("perpResult");

  const line1 = geometryManager.findLineById(l1Id);
  const line2 = geometryManager.findLineById(l2Id);

  if (!line1 || !line2) {
    r.textContent = "Sélectionnez deux droites.";
    return;
  }

  // Appel de la fonction mathématique
  const result = getShortestSegmentBetweenLines(line1, line2);

  if (result.type === "parallel") {
    r.innerHTML = `Droites parallèles.<br>Distance = <strong>${formatNumber(result.distance)}</strong>`;
  } else {
    // Création visuelle du segment (Vecteur)
    const baseName = `Perp(${line1.name},${line2.name})`;
    const uniqueName = geometryManager.generateUniqueName(baseName, "vector");

    // Création du vecteur représentant le segment le plus court
    const segmentVector = new THREE.Vector3().subVectors(result.p2, result.p1);
    const newVector = new Vector(
      uniqueName,
      result.p1,
      segmentVector,
      0xff00ff,
    ); // Magenta
    geometryManager.addVector(newVector);

    // Création des points d'intersection H1 et H2
    geometryManager.addPoint(
      new Point(uniqueName + "_H1", result.p1.x, result.p1.y, result.p1.z),
    ); // Attention inversion Y/Z selon votre logique UI
    geometryManager.addPoint(
      new Point(uniqueName + "_H2", result.p2.x, result.p2.y, result.p2.z),
    );

    r.innerHTML = `Distance min = <strong>${formatNumber(result.distance)}</strong><br>Segment tracé.`;

    updateAllUI();
    saveState();
  }
}

function addLineFromPointVector() {
  // 1. Récupération des valeurs
  const nameInput = document.getElementById("lineNameGlobal");
  const pSelect = document.getElementById("linePointPVSelect");
  const vSelect = document.getElementById("lineVectorPVSelect");

  const pId = pSelect.value;
  const vId = vSelect.value;

  // 2. Validation
  if (pId === "" || vId === "") {
    showSplashScreen("Veuillez sélectionner un Point ET un Vecteur.");
    return;
  }

  // 3. Récupération des objets géométriques
  const pointObj = geometryManager.points[parseInt(pId)];
  const vectorObj = geometryManager.findVectorById(parseInt(vId));

  if (!pointObj || !vectorObj) return;

  // 4. Gestion du nom (automatique si vide)
  let lineName = nameInput.value.trim();
  if (!lineName) {
    lineName = `D(${pointObj.name}, u_${vectorObj.name})`;
  }

  // 5. Création de la droite
  // On clone les vecteurs pour éviter que modifier le point plus tard ne casse la droite
  const uniqueName = geometryManager.generateUniqueName(lineName, "line");
  const newLine = new Line3D(
    uniqueName,
    pointObj.position, // Point de passage
    vectorObj.components, // Vecteur directeur
  );

  // 6. Ajout et Sauvegarde
  geometryManager.addLine(newLine);

  updateAllUI();
  saveState();

  // 7. Nettoyage des champs
  nameInput.value = "";
  pSelect.value = "";
  vSelect.value = "";

  showSplashScreen(`✅ Droite "${uniqueName}" créée !`);
}

function updateLine() {
  console.log("updateLine lancée..."); // DEBUG

  // 1. Récupération de l'objet
  const idVal = document.getElementById("editLineId").value;
  if (!idVal) {
    console.error("Pas d'ID");
    return;
  }

  const id = parseInt(idVal);
  const line = geometryManager.findLineById(id);
  if (!line) {
    console.error("Ligne introuvable");
    return;
  }

  const name = document.getElementById("lineNameFromEquation").value.trim();
  const equationsText = document.getElementById("lineEquationInput").value;

  // 2. Analyse de l'équation (Parsing)
  const lines = equationsText.split("\n").filter((l) => l.trim() !== "");

  // Valeurs par défaut
  let vector = { x: 0, y: 0, z: 0 }; // Composantes t
  let pointText = { x: 0, y: 0, z: 0 }; // Constantes

  lines.forEach((l) => {
    const axis = l.trim().charAt(0).toLowerCase();
    if (!["x", "y", "z"].includes(axis)) return;

    const content = l.substring(l.indexOf("=") + 1).replace(/\s/g, "");

    // Trouver t (ex: "-5t")
    const tMatch = content.match(/[+-]?[\d\.]*t/);
    if (tMatch) {
      let tStr = tMatch[0].replace("t", "");
      if (tStr === "" || tStr === "+") vector[axis] = 1;
      else if (tStr === "-") vector[axis] = -1;
      else vector[axis] = parseFloat(tStr);
    }

    // Trouver constante (ex: "2") - on enlève la partie t pour lire le reste
    const constStr = tMatch ? content.replace(tMatch[0], "") : content;
    const val = parseFloat(constStr);
    if (!isNaN(val)) pointText[axis] = val;
  });

  // 3. Récupération Point de Passage (Priorité aux inputs manuels)
  const px = document.getElementById("lineEqPointX").value;
  const py = document.getElementById("lineEqPointY").value;
  const pz = document.getElementById("lineEqPointZ").value;
  const selectVal = document.getElementById("lineEquationPointSelect").value;

  let newStart = new THREE.Vector3();

  // Logique de priorité : Inputs > Select > Texte Equation
  if (px !== "" || py !== "" || pz !== "") {
    newStart.set(parseFloat(px) || 0, parseFloat(pz) || 0, parseFloat(py) || 0); // Note: Z UI -> Y 3D
  } else if (selectVal !== "" && selectVal !== "origin") {
    const pObj = geometryManager.points[parseInt(selectVal)];
    if (pObj) newStart.copy(pObj.position);
  } else if (selectVal === "origin") {
    newStart.set(0, 0, 0);
  } else {
    newStart.set(pointText.x, pointText.z, pointText.y); // Note: Z UI -> Y 3D
  }

  // 4. Vecteur Directeur
  const newDir = new THREE.Vector3(vector.x, vector.z, vector.y); // Note: Z UI -> Y 3D
  if (newDir.lengthSq() < 1e-8) {
    showSplashScreen("Erreur : Vecteur directeur nul.");
    return;
  }

  // =========================================================
  // 5. MISE Ã€ JOUR DES DONNÉES ET DE LA SCÃˆNE (CRITIQUE)
  // =========================================================

  // A. Mise à jour de l'objet JS
  line.name = name || line.name;
  line.startPoint.copy(newStart);
  line.directorVector.copy(newDir);

  // B. Mise à jour du Mesh (Visuel)
  // IMPORTANT : On remet le conteneur à 0 pour que la géométrie absolue fonctionne
  line.mesh.position.set(0, 0, 0);
  line.mesh.rotation.set(0, 0, 0);
  line.mesh.scale.set(1, 1, 1);
  line.mesh.updateMatrix();

  // C. Recalculer les points de la ligne
  const len = 1000; // Longueur visuelle
  const dirNorm = newDir.clone().normalize();
  const pA = newStart.clone().addScaledVector(dirNorm, -len);
  const pB = newStart.clone().addScaledVector(dirNorm, len);

  // D. Remplacer la géométrie
  line.mesh.geometry.dispose(); // Nettoyer mémoire
  line.mesh.geometry = new THREE.BufferGeometry().setFromPoints([pA, pB]);

  // E. Si le Gizmo tenait la ligne, il faut le rafraîchir
  if (
    selectedObjectInstance === line &&
    typeof transformControl !== "undefined"
  ) {
    transformControl.detach();
    transformControl.attach(line.mesh);
  }

  // 6. Mise à jour de l'interface (Liste à gauche)
  updateAllUI(); // Ceci met à jour la liste "Droites existantes"
  saveState(); // Historique

  // 7. Sortir du mode édition
  cancelLineEdit();
  showSplashScreen(`✅ Droite mise à jour !`);
}

function cancelLineEdit() {
  // Vider
  document.getElementById("editLineId").value = "";
  document.getElementById("lineNameFromEquation").value = "";
  document.getElementById("lineEquationInput").value = "x = 2t\ny = t\nz = -5t";
  document.getElementById("lineEqPointX").value = "";
  document.getElementById("lineEqPointY").value = "";
  document.getElementById("lineEqPointZ").value = "";
  document.getElementById("lineEquationPointSelect").value = "";

  // Basculer boutons
  document.getElementById("addLineFromEquationBtn").style.display = "block";
  document.getElementById("lineEquationActions").style.display = "none";

  // Désélectionner
  deselectCurrentObject();
}

function deleteEditingLine() {
  const id = parseInt(document.getElementById("editLineId").value);
  if (!isNaN(id)) {
    removeStraightLineById(id);
    cancelLineEdit();
  }
}

function cancelLineEdit() {
  // Vider les champs
  document.getElementById("lineNameFromEquation").value = "";
  document.getElementById("lineEquationInput").value = "x = 2t\ny = t\nz = -5t"; // Valeur par défaut
  document.getElementById("editLineId").value = "";
  document.getElementById("lineEqPointX").value = "";
  document.getElementById("lineEqPointY").value = "";
  document.getElementById("lineEqPointZ").value = "";
  document.getElementById("lineEquationPointSelect").value = "";

  // Basculer l'affichage des boutons
  document.getElementById("addLineFromEquationBtn").style.display = "block";
  document.getElementById("lineEquationActions").style.display = "none";

  // Désélectionner
  deselectCurrentObject();
}

function deleteEditingLine() {
  const id = parseInt(document.getElementById("editLineId").value);
  if (!isNaN(id)) {
    removeStraightLineById(id); // Fonction existante
    cancelLineEdit();
  }
}

function updatePlane() {
  const idVal = document.getElementById("editPlaneId").value;
  if (!idVal) return;

  const id = parseInt(idVal);
  const plane = geometryManager.findPlaneById(id);
  if (!plane) return;

  let equationStr = document.getElementById("planeEquationInput").value.trim();
  if (!equationStr) {
    showSplashScreen("L'équation est vide.");
    return;
  }

  // --- 1. Parsing de l'équation (Identique à addPlaneFromEquation) ---
  if (equationStr.includes("=")) {
    const parts = equationStr.split("=");
    equationStr = `${parts[0]} - (${parts[1]})`;
  }

  const getCoefficient = (variable) => {
    const regex = new RegExp(`([+-]?[\\d\\.]*)\\s*\\*?\\s*${variable}`, "gi");
    let total = 0;
    let match;
    while ((match = regex.exec(equationStr)) !== null) {
      let s = match[1].replace(/\s/g, "");
      if (s === "" || s === "+") total += 1;
      else if (s === "-") total += -1;
      else total += parseFloat(s);
    }
    return total;
  };

  const a = getCoefficient("x");
  const b = getCoefficient("y"); // UI Y (Prof) -> 3D Z
  const c = getCoefficient("z"); // UI Z (Haut) -> 3D Y

  // Normale ThreeJS (x, y, z) -> (a, c, b)
  const newNormalUnnormalized = new THREE.Vector3(a, c, b);

  if (newNormalUnnormalized.lengthSq() < 1e-8) {
    showSplashScreen("Vecteur normal invalide.");
    return;
  }

  const newNormal = newNormalUnnormalized.clone().normalize();

  // --- 2. Point de passage ---
  const pxStr = document.getElementById("planeEqPointX").value;
  const pyStr = document.getElementById("planeEqPointY").value;
  const pzStr = document.getElementById("planeEqPointZ").value;
  const selectVal = document.getElementById("planeEquationPointSelect").value;

  let newPoint = new THREE.Vector3();

  // Priorité 1 : Manuel
  if (pxStr !== "" || pyStr !== "" || pzStr !== "") {
    newPoint.set(
      parseFloat(pxStr) || 0,
      parseFloat(pzStr) || 0,
      parseFloat(pyStr) || 0,
    );
  }
  // Priorité 2 : Select
  else if (selectVal !== "" && selectVal !== "origin") {
    const pObj = geometryManager.points[parseInt(selectVal)];
    if (pObj) newPoint.copy(pObj.position);
  } else if (selectVal === "origin") {
    newPoint.set(0, 0, 0);
  }
  // Priorité 3 : Calcul via 'd' (Auto)
  else {
    let constantStr = equationStr
      .replace(/[+-]?[\d\\.]*\s*\*?\s*[xyz]/gi, "")
      .replace(/--/g, "+")
      .trim();
    let d = 0;
    try {
      if (constantStr) d = new Function("return " + constantStr)();
    } catch (e) {}

    // Trouver un point valide
    if (Math.abs(newNormalUnnormalized.x) > 1e-6)
      newPoint.set(-d / newNormalUnnormalized.x, 0, 0);
    else if (Math.abs(newNormalUnnormalized.z) > 1e-6)
      newPoint.set(0, 0, -d / newNormalUnnormalized.z); // Z 3D = Y UI (b)
    else if (Math.abs(newNormalUnnormalized.y) > 1e-6)
      newPoint.set(0, -d / newNormalUnnormalized.y, 0); // Y 3D = Z UI (c)
  }

  // --- 3. MISE Ã€ JOUR OBJET ET SCÃˆNE ---

  // A. Mise à jour données
  plane.normal.copy(newNormal);
  plane.displayNormal.copy(newNormalUnnormalized); // On garde (a,c,b) pour l'affichage
  plane.pointOnPlane.copy(newPoint);

  // B. Mise à jour Mesh
  // Position
  plane.mesh.position.copy(plane.pointOnPlane);
  // Rotation (Quaternion pour aligner Z local avec la normale)
  plane.mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    plane.normal,
  );
  plane.mesh.updateMatrix();

  // C. Gestion Gizmo
  if (
    selectedObjectInstance === plane &&
    typeof transformControl !== "undefined"
  ) {
    transformControl.detach();
    transformControl.attach(plane.mesh);
  }

  // D. Gestion Vecteur Normal affiché (Vn)
  // Si le bouton "Vn" est actif, on doit mettre à jour le vecteur visuel aussi
  const existingVn = geometryManager.vectors.find(
    (v) => v.parentPlaneId === plane.id && v.isNormalVector,
  );
  if (existingVn) {
    // Vn part du point du plan et suit la normale
    const vnLength = 2.5;
    const vnComps = plane.normal.clone().multiplyScalar(vnLength);
    existingVn.update(existingVn.name, plane.pointOnPlane, vnComps);
  }

  // --- 4. Finalisation ---
  updateAllUI();
  saveState();
  cancelPlaneEdit();
  showSplashScreen(`✅ Plan mis à jour !`);
}

function cancelPlaneEdit() {
  // Reset champs
  document.getElementById("editPlaneId").value = "";
  document.getElementById("planeEquationInput").value = "";
  document.getElementById("planeEqPointX").value = "";
  document.getElementById("planeEqPointY").value = "";
  document.getElementById("planeEqPointZ").value = "";
  document.getElementById("planeEquationPointSelect").value = "";

  // Reset boutons
  document.getElementById("addPlaneFromEquationBtn").style.display = "block";
  document.getElementById("planeEquationActions").style.display = "none";

  deselectCurrentObject();
}

function deleteEditingPlane() {
  const id = parseInt(document.getElementById("editPlaneId").value);
  if (!isNaN(id)) {
    removePlaneById(id); // Utilise la fonction existante
    cancelPlaneEdit();
  }
}
/**
 * Exporte la scène actuelle dans un fichier JSON téléchargeable.
 * Utilise le format interne serializeSceneData() pour garantir une compatibilité totale à l'import.
 */
/**
 * Exporte la scène actuelle dans un fichier JSON avec métadonnées.
 */
function exportSceneToJSON() {
  try {
    // 1. On récupère les données de géométrie brutes (celles utilisées par l'historique)
    const rawData = JSON.parse(serializeSceneData());

    // 2. On construit l'objet final en ajoutant le bloc "meta" demandé
    const exportData = {
      meta: {
        appName: "Éditeur Points 3D",
        date: new Date().toLocaleString(),
        timestamp: Date.now(),
        // On calcule le total en vérifiant que les tableaux existent
        totalObjects:
          (rawData.points ? rawData.points.length : 0) +
          (rawData.vectors ? rawData.vectors.length : 0) +
          (rawData.lines ? rawData.lines.length : 0) +
          (rawData.planes ? rawData.planes.length : 0),
      },
      // 3. On fusionne les données géométriques (points, vectors, etc.) à la racine de l'objet
      ...rawData,
    };

    // 4. Conversion en texte (avec indentation pour que ce soit lisible par un humain)
    const jsonString = JSON.stringify(exportData, null, 2);

    // 5. Création et téléchargement du fichier
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    // Format du nom de fichier : scene_YYYY-MM-DD_HH-MM.json
    const dateStr = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    a.download = `scene_3d_${dateStr}.json`;
    a.href = url;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSplashScreen("âœ… Scène exportée avec métadonnées !");
  } catch (e) {
    console.error(e);
    showSplashScreen("âŒ Erreur lors de l'export.");
  }
}
/**
 * Importe une scène depuis un fichier JSON sélectionné par l'utilisateur.
 * @param {HTMLInputElement} inputElement - L'élément input type="file"
 */
function importSceneFromJSON(inputElement) {
  const file = inputElement.files[0];

  if (!file) return;

  // Sécurité : Demander confirmation car cela va écraser la scène actuelle
  if (
    !confirm(
      "Attention : L'importation va remplacer la scène actuelle. Voulez-vous continuer ?",
    )
  ) {
    inputElement.value = ""; // Reset de l'input
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const jsonContent = e.target.result;

      // On utilise la fonction existante restoreSceneData qui gère déjà tout le nettoyage et la reconstruction
      restoreSceneData(jsonContent);

      // On sauvegarde cet état dans l'historique pour pouvoir faire "Annuler" si l'import n'est pas voulu
      saveState();

      showSplashScreen(`âœ… Scène "${file.name}" importée !`);
    } catch (err) {
      console.error(err);
      showSplashScreen("âŒ Erreur : Fichier invalide ou corrompu.");
    }

    // Reset de l'input pour permettre de réimporter le mÃªme fichier si besoin
    inputElement.value = "";
  };

  reader.readAsText(file);
}

// =====================================================================================
// SECTION TABLEUR (SPREADSHEET) LOGIC
// =====================================================================================

let isSpreadsheetOpen = false;
let currentSpreadsheetTab = "points";

function toggleSpreadsheet() {
  const panel = document.getElementById("spreadsheetContainer");
  const btn = document.getElementById("openSpreadsheetBtn");

  isSpreadsheetOpen = !isSpreadsheetOpen;

  if (isSpreadsheetOpen) {
    panel.classList.remove("spreadsheet-hidden");
    btn.style.display = "none"; // Cache le bouton d'ouverture
    updateSpreadsheet(); // Rafraîchir les données
  } else {
    panel.classList.add("spreadsheet-hidden");
    setTimeout(() => {
      btn.style.display = "block"; // Réaffiche le bouton après l'anim
    }, 300);
  }
}

function switchSpreadsheetTab(tabName) {
  currentSpreadsheetTab = tabName;

  // Mise à jour visuelle des onglets
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.textContent.toLowerCase().includes(tabName.substring(0, 4))) {
      // détection simple
      btn.classList.add("active");
    }
  });

  // Mapping du bouton cliqué (plus robuste)
  const buttons = document.querySelectorAll(".tab-btn");
  if (tabName === "points") buttons[0].classList.add("active");
  if (tabName === "vectors") buttons[1].classList.add("active");
  if (tabName === "lines") buttons[2].classList.add("active");
  if (tabName === "planes") buttons[3].classList.add("active");

  updateSpreadsheet();
}

/**
 * Fonction principale qui reconstruit le tableau HTML
 */
function updateSpreadsheet() {
  if (!isSpreadsheetOpen) return;

  const thead = document.querySelector("#spreadsheetTable thead");
  const tbody = document.querySelector("#spreadsheetTable tbody");
  thead.innerHTML = "";
  tbody.innerHTML = "";

  if (currentSpreadsheetTab === "points") {
    renderPointsTable(thead, tbody);
  } else if (currentSpreadsheetTab === "vectors") {
    renderVectorsTable(thead, tbody);
  } else if (currentSpreadsheetTab === "lines") {
    renderLinesTable(thead, tbody);
  } else if (currentSpreadsheetTab === "planes") {
    renderPlanesTable(thead, tbody);
  }
}

// --- RENDU DES POINTS ---
function renderPointsTable(thead, tbody) {
  thead.innerHTML = `
    <tr>
      <th style="width:50px">ID</th>
      <th>Nom</th>
      <th style="width:80px">X</th>
      <th style="width:80px">Y (Prof)</th>
      <th style="width:80px">Z (Haut)</th>
      <th style="width:60px">Actions</th>
    </tr>`;

  geometryManager.points.forEach((p, index) => {
    const tr = document.createElement("tr");
    tr.id = `sheet-row-point-${index}`;
    // Attention mapping : UI Y = Three Z, UI Z = Three Y
    tr.innerHTML = `
      <td>${index}</td>
      <td><input type="text" value="${p.name}" onchange="sheetUpdatePointName(${index}, this.value)"></td>
      <td class="col-x"><input type="number" step="0.1" id="sheet-p-${index}-x" value="${formatNumber(
        p.position.x,
      )}" onchange="sheetUpdatePointCoords(${index})"></td>
      <td class="col-y"><input type="number" step="0.1" id="sheet-p-${index}-y" value="${formatNumber(
        p.position.z,
      )}" onchange="sheetUpdatePointCoords(${index})"></td>
      <td class="col-z"><input type="number" step="0.1" id="sheet-p-${index}-z" value="${formatNumber(
        p.position.y,
      )}" onchange="sheetUpdatePointCoords(${index})"></td>
      <td>
        <button class="btn-secondary" style="padding:2px 5px; margin:0;" onclick="handleSelection(geometryManager.points[${index}].mesh)">🎯</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// --- LOGIQUE DE MISE Ã€ JOUR DEPUIS LE TABLEUR (POINTS) ---
function sheetUpdatePointName(index, newName) {
  const p = geometryManager.points[index];
  if (p) {
    p.update(newName, p.position.x, p.position.z, p.position.y); // update attend (nom, x, z_ui, y_ui)
    updateAllUI(); // Rafraîchir liste latérale
  }
}

function sheetUpdatePointCoords(index) {
  const p = geometryManager.points[index];
  if (!p) return;

  const x = parseFloat(document.getElementById(`sheet-p-${index}-x`).value);
  const y_ui = parseFloat(document.getElementById(`sheet-p-${index}-y`).value); // Profondeur (Z Three)
  const z_ui = parseFloat(document.getElementById(`sheet-p-${index}-z`).value); // Hauteur (Y Three)

  if (isNaN(x) || isNaN(y_ui) || isNaN(z_ui)) return;

  // On utilise copy pour éviter de recréer l'objet si possible, ou p.update
  p.position.set(x, z_ui, y_ui); // Attention ordre ThreeJS
  p.mesh.position.copy(p.position);
  p.updateLabelPosition();

  // Si Gizmo actif sur ce point
  if (selectedObjectInstance === p && transformControl) {
    transformControl.attach(p.mesh); // Recalage du gizmo
  }

  saveState();
  // On ne rappelle pas updateAllUI() complet ici pour éviter de perdre le focus de l'input
  // Mais on doit mettre à jour le panneau latéral si besoin
  // updatePointList(); // Optionnel
}

// --- RENDU DES VECTEURS ---
function renderVectorsTable(thead, tbody) {
  thead.innerHTML = `
    <tr>
      <th>Nom</th>
      <th>Origine X</th><th>Origine Y</th><th>Origine Z</th>
      <th>Vect X</th><th>Vect Y</th><th>Vect Z</th>
    </tr>`;

  geometryManager.vectors.forEach((v) => {
    const tr = document.createElement("tr");
    tr.id = `sheet-row-vector-${v.id}`;
    // Origine
    const ox = formatNumber(v.origin.x);
    const oy = formatNumber(v.origin.z); // UI Y
    const oz = formatNumber(v.origin.y); // UI Z
    // Composantes
    const vx = formatNumber(v.components.x);
    const vy = formatNumber(v.components.z); // UI Y
    const vz = formatNumber(v.components.y); // UI Z

    tr.innerHTML = `
      <td><input type="text" value="${v.name}" onchange="sheetUpdateVector(${v.id})"></td>
      <td class="col-x"><input type="number" id="sheet-v-${v.id}-ox" value="${ox}" onchange="sheetUpdateVector(${v.id})"></td>
      <td class="col-y"><input type="number" id="sheet-v-${v.id}-oy" value="${oy}" onchange="sheetUpdateVector(${v.id})"></td>
      <td class="col-z"><input type="number" id="sheet-v-${v.id}-oz" value="${oz}" onchange="sheetUpdateVector(${v.id})"></td>
      <td class="col-x" style="border-left:2px solid #ddd"><input type="number" id="sheet-v-${v.id}-vx" value="${vx}" onchange="sheetUpdateVector(${v.id})"></td>
      <td class="col-y"><input type="number" id="sheet-v-${v.id}-vy" value="${vy}" onchange="sheetUpdateVector(${v.id})"></td>
      <td class="col-z"><input type="number" id="sheet-v-${v.id}-vz" value="${vz}" onchange="sheetUpdateVector(${v.id})"></td>
    `;
    tbody.appendChild(tr);
  });
}

function sheetUpdateVector(id) {
  const v = geometryManager.findVectorById(id);
  if (!v) return;

  // Récupération ligne par ID pour Ãªtre sÃ»r (ou par element relatif si on passait 'this')
  // Ici on utilise les IDs générés
  const ox = parseFloat(document.getElementById(`sheet-v-${id}-ox`).value);
  const oy = parseFloat(document.getElementById(`sheet-v-${id}-oy`).value);
  const oz = parseFloat(document.getElementById(`sheet-v-${id}-oz`).value);

  const vx = parseFloat(document.getElementById(`sheet-v-${id}-vx`).value);
  const vy = parseFloat(document.getElementById(`sheet-v-${id}-vy`).value);
  const vz = parseFloat(document.getElementById(`sheet-v-${id}-vz`).value);

  // Reconstruction vecteurs ThreeJS (Attention inversion Y/Z)
  const newOrigin = new THREE.Vector3(ox, oz, oy);
  const newComps = new THREE.Vector3(vx, vz, vy);

  v.update(v.name, newOrigin, newComps);

  if (selectedObjectInstance === v && transformControl) {
    // Astuce pour le gizmo vecteur : il faut le réattacher au nouvel arrowHelper
    transformControl.detach();
    transformControl.attach(v.arrowHelper);
  }
  saveState();
}

// Pour Droites et Plans, on fait simple pour l'instant (Nom + Point principal)
function renderLinesTable(thead, tbody) {
  thead.innerHTML = `<tr><th>Nom</th><th>Point X</th><th>Point Y</th><th>Point Z</th><th>Dir X</th><th>Dir Y</th><th>Dir Z</th></tr>`;
  geometryManager.lines.forEach((l) => {
    const p = l.startPoint;
    const u = l.directorVector;
    tbody.innerHTML += `<tr>
            <td>${l.name}</td>
            <td class="col-x">${formatNumber(p.x)}</td><td class="col-y">${formatNumber(
              p.z,
            )}</td><td class="col-z">${formatNumber(p.y)}</td>
            <td class="col-x">${formatNumber(u.x)}</td><td class="col-y">${formatNumber(
              u.z,
            )}</td><td class="col-z">${formatNumber(u.y)}</td>
        </tr>`;
  });
}

function renderPlanesTable(thead, tbody) {
  thead.innerHTML = `<tr><th>Nom</th><th>Point X</th><th>Point Y</th><th>Point Z</th><th>Norm X</th><th>Norm Y</th><th>Norm Z</th></tr>`;
  geometryManager.planes.forEach((p) => {
    const pt = p.pointOnPlane;
    const n = p.displayNormal;
    tbody.innerHTML += `<tr>
            <td>${p.name}</td>
            <td class="col-x">${formatNumber(pt.x)}</td><td class="col-y">${formatNumber(
              pt.z,
            )}</td><td class="col-z">${formatNumber(pt.y)}</td>
            <td class="col-x">${formatNumber(n.x)}</td><td class="col-y">${formatNumber(
              n.z,
            )}</td><td class="col-z">${formatNumber(n.y)}</td>
        </tr>`;
  });
}

let snapEnabled = false;
let currentSnapSize = 1.0; // Variable modifiable au lieu de const
const SNAP_ROTATE = THREE.MathUtils.degToRad(15); // Rotation toujours fixée à 15Â°

function updateSnapSize() {
  const select = document.getElementById("snapSizeSelect");
  if (!select) return;

  // Mettre à jour la variable globale
  currentSnapSize = parseFloat(select.value);

  // Si l'aimant est déjà activé, on met à jour le contrôle immédiatement
  if (snapEnabled && transformControl) {
    transformControl.setTranslationSnap(currentSnapSize);
    showSplashScreen(`Taille de l'aimant : ${currentSnapSize}`);
  }
}

function toggleSnapping() {
  const checkbox = document.getElementById("snapToggle");
  const icon = document.getElementById("snapIcon");
  const select = document.getElementById("snapSizeSelect");

  snapEnabled = checkbox.checked;

  if (transformControl) {
    // On utilise la variable currentSnapSize ici
    transformControl.setTranslationSnap(snapEnabled ? currentSnapSize : null);
    transformControl.setRotationSnap(snapEnabled ? SNAP_ROTATE : null);

    // GESTION VISUELLE
    if (snapEnabled) {
      icon.classList.remove("icon-disabled");
      // On peut aussi changer la couleur du texte du select pour montrer qu'il est actif
      select.style.opacity = "1";
      showSplashScreen(`🧲 Aimantation ACTIVÉE (${currentSnapSize})`);
    } else {
      icon.classList.add("icon-disabled");
      // On grise légèrement le select quand désactivé
      select.style.opacity = "0.5";
      showSplashScreen("Aimantation DÉSACTIVÉE");
    }
  }
}
function projectPointOnPlane() {
  const pIndex = document.getElementById("projPointSelect").value;
  const plIndex = document.getElementById("projPlaneSelect").value;

  if (pIndex === "" || plIndex === "") return;

  const point = geometryManager.points[pIndex];
  const plane = geometryManager.findPlaneById(parseInt(plIndex));

  // Mathématiques de la projection
  // H = P - (distSignée * n)
  const vP0P = new THREE.Vector3().subVectors(
    point.position,
    plane.pointOnPlane,
  );
  const distSigned = vP0P.dot(plane.normal);
  const projectedPos = point.position
    .clone()
    .sub(plane.normal.clone().multiplyScalar(distSigned));

  // 1. Créer le point projeté H
  const hName = `Proj_${point.name}`;
  const hPoint = new Point(
    geometryManager.generateUniqueName(hName, "point"),
    projectedPos.x,
    projectedPos.y,
    projectedPos.z,
    0x555555,
  ); // Gris
  // Attention constructeur Point(name, x, y, z) -> ThreeJS Y/Z inversion dans votre code original ? Vérifiez l'ordre.
  // Si votre constructeur est Point(name, x, z_ui, y_ui), passez (projectedPos.x, projectedPos.z, projectedPos.y)

  geometryManager.addPoint(hPoint);

  // 2. Créer le segment en pointillé [PH]
  const dashMaterial = new THREE.LineDashedMaterial({
    color: 0x555555,
    dashSize: 0.5,
    gapSize: 0.2,
  });
  const geom = new THREE.BufferGeometry().setFromPoints([
    point.position,
    hPoint.position,
  ]);
  const dashLine = new THREE.Line(geom, dashMaterial);
  dashLine.computeLineDistances(); // Important pour les pointillés
  scene.add(dashLine);

  // On ne stocke pas la ligne pointillée dans le manager pour l'instant (c'est juste visuel temporaire)
  // Ou alors créez une classe "ConstructionLine"

  updateAllUI();
  saveState();
  showSplashScreen(`Point ${hPoint.name} créé.`);
}

// =========================================================
// GÉNÉRATEUR DE RAPPORT (VERSION SÉCURISÉE - CORRIGÉE)
// =========================================================

// =========================================================
// GÉNÉRATEUR DE RAPPORT COMPLET
// (Avec intersections, distances et PREUVES d'orthogonalité)
// =========================================================

// =========================================================
// GÉNÉRATEUR DE RAPPORT (AVEC DÉTECTION DES PROJECTIONS)
// =========================================================

function generateMathReport() {
  var sceneName =
    document.getElementById("sceneNameInput").value || "Sans titre";
  var reportDate = new Date().toLocaleString();

  var win = window.open("", "_blank");
  if (!win) {
    alert("Pop-ups bloqués. Veuillez autoriser les pop-ups pour ce site.");
    return;
  }

  var html = [];

  // --- HEADER ---
  html.push("<!DOCTYPE html>");
  html.push('<html lang="fr">');
  html.push("<head>");
  html.push('<meta charset="UTF-8">');
  html.push("<title>Rapport - " + escapeHtml(sceneName) + "</title>");
  html.push("<style>");
  html.push(
    'body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.5; }',
  );
  html.push(
    "h1 { color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 10px; }",
  );
  html.push(
    "h2 { color: #2980b9; margin-top: 30px; border-left: 5px solid #2980b9; padding-left: 10px; background: #f4f8fb; padding-top:5px; padding-bottom:5px; }",
  );
  html.push("h3 { color: #16a085; margin-top: 20px; font-size: 1.1em; }");
  html.push(
    "table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }",
  );
  html.push(
    "th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }",
  );
  html.push("th { background-color: #f2f2f2; font-weight: bold; }");
  html.push(
    '.math { font-family: "Courier New", monospace; background: #eee; padding: 2px 5px; border-radius: 3px; color: #d35400; font-weight: bold; }',
  );
  html.push(
    ".intro { background: #f9f9f9; padding: 15px; border: 1px solid #ddd; margin-bottom: 20px; border-radius: 4px; }",
  );
  html.push(
    ".tag { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 12px; color: white; font-weight: bold; vertical-align: middle; margin-right: 5px; }",
  );
  html.push(".tag-para { background-color: #3498db; }");
  html.push(".tag-perp { background-color: #9b59b6; }");
  html.push(".tag-dist { background-color: #e67e22; }");
  html.push(".tag-inter { background-color: #27ae60; }");
  html.push(
    ".tag-proj { background-color: #8e44ad; }",
  ); /* Nouveau tag violet */
  html.push("ul { list-style-type: none; padding: 0; }");
  html.push(
    "li.relation-item { margin-bottom: 8px; padding: 8px; border-bottom: 1px solid #eee; }",
  );
  html.push(
    ".proof { font-size: 0.9em; color: #555; margin-top: 4px; padding-left: 10px; border-left: 2px solid #9b59b6; }",
  );
  html.push("</style>");
  html.push("</head>");
  html.push("<body>");

  html.push("<h1>Rapport Géométrique 3D</h1>");

  // Generation of 2D snapshot
  renderer.render(scene, camera);
  try {
    const snapshotData = renderer.domElement.toDataURL("image/png");
    html.push(
      `<div style="text-align:center; margin-bottom: 20px;"><img src="${snapshotData}" alt="Capture 3D" style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 4px 8px rgba(0,0,0,0.1);"></div>`,
    );
  } catch (e) {
    console.warn("Could not capture 2D snapshot", e);
  }

  html.push('<div class="intro">');
  html.push("<strong>Scène :</strong> " + escapeHtml(sceneName) + "<br>");
  html.push("<strong>Date :</strong> " + reportDate + "<br>");
  html.push(
    "<strong>Convention :</strong> Repère (O, x, y, z) où <em>z</em> est la hauteur.",
  );
  html.push("</div>");

  // --- 1. POINTS ---
  if (geometryManager.points.length > 0) {
    html.push(
      "<h2>1. Points</h2><table><thead><tr><th>Nom</th><th>Coordonnées (x, y, z)</th></tr></thead><tbody>",
    );
    geometryManager.points.forEach(function (p) {
      html.push("<tr><td><strong>" + escapeHtml(p.name) + "</strong></td>");
      html.push(
        '<td class="math">(' +
          formatNumber(p.position.x) +
          "; " +
          formatNumber(p.position.z) +
          "; " +
          formatNumber(p.position.y) +
          ")</td></tr>",
      );
    });
    html.push("</tbody></table>");
  }

  // --- 2. VECTEURS ---
  if (geometryManager.vectors.length > 0) {
    html.push(
      "<h2>2. Vecteurs</h2><table><thead><tr><th>Nom</th><th>Composantes</th><th>Norme</th><th>Origine</th></tr></thead><tbody>",
    );
    geometryManager.vectors.forEach(function (v) {
      var n = formatNumber(v.components.length());
      var org =
        v.origin.lengthSq() > 0.0001
          ? "(" +
            formatNumber(v.origin.x) +
            "; " +
            formatNumber(v.origin.z) +
            "; " +
            formatNumber(v.origin.y) +
            ")"
          : "Origine";

      html.push("<tr><td><strong>" + escapeHtml(v.name) + "</strong></td>");
      html.push(
        '<td class="math">(' +
          formatNumber(v.components.x) +
          "; " +
          formatNumber(v.components.z) +
          "; " +
          formatNumber(v.components.y) +
          ")</td>",
      );
      html.push('<td class="math">' + n + "</td><td>" + org + "</td></tr>");
    });
    html.push("</tbody></table>");
  }

  // --- 3. DROITES ---
  if (geometryManager.lines.length > 0) {
    html.push("<h2>3. Droites (Équations)</h2>");
    geometryManager.lines.forEach(function (l) {
      html.push("<h3>🔹 " + escapeHtml(l.name) + "</h3><ul>");
      var p = l.startPoint;
      var u = l.directorVector;

      var eq =
        "x = " +
        formatEqLine(p.x, u.x) +
        "<br>y = " +
        formatEqLine(p.z, u.z) +
        "<br>z = " +
        formatEqLine(p.y, u.y);

      html.push(
        "<li><strong>Passant par:</strong> P(" +
          formatNumber(p.x) +
          "; " +
          formatNumber(p.z) +
          "; " +
          formatNumber(p.y) +
          ")</li>",
      );
      html.push(
        "<li><strong>Vecteur:</strong> u(" +
          formatNumber(u.x) +
          "; " +
          formatNumber(u.z) +
          "; " +
          formatNumber(u.y) +
          ")</li>",
      );
      html.push(
        '<li><strong>Paramétrique:</strong><br><div class="math" style="display:inline-block; border-left:3px solid #ccc; padding-left:10px;">' +
          eq +
          "</div></li>",
      );
      html.push("</ul>");
    });
  }

  // --- 4. PLANS ---
  if (geometryManager.planes.length > 0) {
    html.push("<h2>4. Plans (Équations)</h2>");
    geometryManager.planes.forEach(function (p) {
      html.push("<h3>🔸 " + escapeHtml(p.name) + "</h3><ul>");
      var n = p.normal;
      var pt = p.pointOnPlane;

      var a = n.x,
        b = n.z,
        c = n.y;
      var d = -(a * pt.x + b * pt.z + c * pt.y);
      var cart = buildCartesianEquation(a, b, c, d);

      html.push(
        "<li><strong>Normale:</strong> n(" +
          formatNumber(a) +
          "; " +
          formatNumber(b) +
          "; " +
          formatNumber(c) +
          ")</li>",
      );
      html.push(
        '<li><strong>Cartésienne:</strong> <span class="math">' +
          cart +
          "</span></li>",
      );
      html.push("</ul>");
    });
  }

  // =========================================================
  // SECTION 5 : ANALYSE (INTERSECTIONS & PROJECTIONS)
  // =========================================================

  html.push("<h2>5. Analyse et Relations</h2>");
  html.push("<ul>");

  var relationsFound = false;

  // --- DÉTECTION DES PROJECTIONS ORTHOGONALES ---
  // On boucle sur tous les couples de points (P, H)
  if (geometryManager.points.length >= 2) {
    geometryManager.points.forEach(function (P) {
      geometryManager.points.forEach(function (H) {
        if (P === H) return;

        var vecPH = new THREE.Vector3().subVectors(H.position, P.position);
        var distPH = vecPH.length();
        if (distPH < 0.001) return; // Points confondus

        // 1. Projection sur PLAN
        geometryManager.planes.forEach(function (pl) {
          // Si H appartient au plan (dist ~ 0)
          var distH_Plan = Math.abs(
            new THREE.Vector3()
              .subVectors(H.position, pl.pointOnPlane)
              .dot(pl.normal),
          );

          if (distH_Plan < 0.01) {
            // Et si PH est colinéaire à la normale (produit vectoriel nul)
            var cross = new THREE.Vector3().crossVectors(
              vecPH.clone().normalize(),
              pl.normal,
            );
            if (cross.length() < 0.01) {
              html.push(
                '<li class="relation-item"><span class="tag tag-proj">PROJECTION</span> <strong>' +
                  H.name +
                  "</strong> est le projeté orthogonal de <strong>" +
                  P.name +
                  "</strong> sur le plan <strong>" +
                  pl.name +
                  "</strong>.</li>",
              );
              html.push(
                '<li class="relation-item" style="padding-left:40px;">↳ Distance exacte = <span class="math">' +
                  formatNumber(distPH) +
                  "</span></li>",
              );
              relationsFound = true;
            }
          }
        });

        // 2. Projection sur DROITE
        geometryManager.lines.forEach(function (ln) {
          // Si H appartient à la droite
          var mathLine = new THREE.Line3(
            ln.startPoint
              .clone()
              .add(ln.directorVector.clone().multiplyScalar(-1000)),
            ln.startPoint
              .clone()
              .add(ln.directorVector.clone().multiplyScalar(1000)),
          );
          var closestPoint = new THREE.Vector3();
          mathLine.closestPointToPoint(H.position, true, closestPoint);

          if (H.position.distanceTo(closestPoint) < 0.01) {
            // Et si PH est orthogonal au vecteur directeur (produit scalaire nul)
            var dot = Math.abs(
              vecPH
                .clone()
                .normalize()
                .dot(ln.directorVector.clone().normalize()),
            );
            if (dot < 0.01) {
              html.push(
                '<li class="relation-item"><span class="tag tag-proj">PROJECTION</span> <strong>' +
                  H.name +
                  "</strong> est le projeté orthogonal de <strong>" +
                  P.name +
                  "</strong> sur la droite <strong>" +
                  ln.name +
                  "</strong>.</li>",
              );
              html.push(
                '<li class="relation-item" style="padding-left:40px;">↳ Distance exacte = <span class="math">' +
                  formatNumber(distPH) +
                  "</span></li>",
              );
              relationsFound = true;
            }
          }
        });
      });
    });
  }

  // --- ANALYSE DROITES / DROITES ---
  if (geometryManager.lines.length >= 2) {
    for (var i = 0; i < geometryManager.lines.length; i++) {
      for (var j = i + 1; j < geometryManager.lines.length; j++) {
        var l1 = geometryManager.lines[i];
        var l2 = geometryManager.lines[j];

        var u1 = l1.directorVector.clone().normalize();
        var u2 = l2.directorVector.clone().normalize();
        var p1 = l1.startPoint;
        var p2 = l2.startPoint;

        var dotDir = Math.abs(u1.dot(u2));
        var crossDir = new THREE.Vector3().crossVectors(u1, u2);

        if (dotDir > 0.9999) {
          html.push(
            '<li class="relation-item"><span class="tag tag-para">PARALLÈLES</span> Droites <strong>' +
              l1.name +
              "</strong> // <strong>" +
              l2.name +
              "</strong></li>",
          );
          var p1p2 = new THREE.Vector3().subVectors(p2, p1);
          var dist = p1p2.cross(u1).length();
          html.push(
            '<li class="relation-item" style="padding-left:40px;">↳ Distance = <span class="math">' +
              formatNumber(dist) +
              "</span></li>",
          );
          relationsFound = true;
        } else {
          var isOrtho = dotDir < 0.001;
          var typeAngle = "";
          var proofOrtho = "";

          if (isOrtho) {
            typeAngle = '<span class="tag tag-perp">ORTHOGONALES</span> ';
            proofOrtho =
              '<div class="proof">Preuve produit scalaire : <span class="math">u1 . u2 = 0</span></div>';
          }

          // Calcul distance min
          var p1p2 = new THREE.Vector3().subVectors(p2, p1);
          var distMin = Math.abs(p1p2.dot(crossDir)) / crossDir.length();

          if (distMin < 0.001) {
            // Intersection Point
            var crossU1U2 = new THREE.Vector3().crossVectors(u1, u2);
            var t1 =
              new THREE.Vector3().crossVectors(p1p2, u2).dot(crossU1U2) /
              crossU1U2.lengthSq();
            var intersectPt = p1.clone().add(u1.clone().multiplyScalar(t1));
            var ptStr =
              "(" +
              formatNumber(intersectPt.x) +
              "; " +
              formatNumber(intersectPt.z) +
              "; " +
              formatNumber(intersectPt.y) +
              ")";

            var etiquette = isOrtho
              ? '<span class="tag tag-perp">PERPENDICULAIRES</span>'
              : '<span class="tag tag-inter">SÉCANTES</span>';
            html.push(
              '<li class="relation-item">' +
                etiquette +
                " <strong>" +
                l1.name +
                "</strong> et <strong>" +
                l2.name +
                "</strong></li>",
            );
            html.push(
              '<li class="relation-item" style="padding-left:40px;">↳ Intersection : <span class="math">' +
                ptStr +
                "</span></li>",
            );
            if (isOrtho)
              html.push(
                '<li class="relation-item" style="padding-left:40px;">' +
                  proofOrtho +
                  "</li>",
              );
          } else {
            html.push(
              '<li class="relation-item">' +
                typeAngle +
                "Droites <strong>" +
                l1.name +
                "</strong> et <strong>" +
                l2.name +
                "</strong> non-coplanaires.</li>",
            );
            html.push(
              '<li class="relation-item" style="padding-left:40px;"><span class="tag tag-dist">DISTANCE</span> Min = <span class="math">' +
                formatNumber(distMin) +
                "</span></li>",
            );
            if (isOrtho)
              html.push(
                '<li class="relation-item" style="padding-left:40px;">' +
                  proofOrtho +
                  "</li>",
              );
          }
          relationsFound = true;
        }
      }
    }
  }

  // --- ANALYSE DROITE / PLAN ---
  if (geometryManager.lines.length > 0 && geometryManager.planes.length > 0) {
    geometryManager.lines.forEach(function (l) {
      geometryManager.planes.forEach(function (p) {
        var u = l.directorVector.clone().normalize();
        var n = p.normal;
        var dot = Math.abs(u.dot(n));

        if (dot < 0.001) {
          var vDist = new THREE.Vector3().subVectors(
            l.startPoint,
            p.pointOnPlane,
          );
          var dist = Math.abs(vDist.dot(n));
          if (dist < 0.001) {
            html.push(
              '<li class="relation-item"><span class="tag tag-inter">INCLUSE</span> <strong>' +
                l.name +
                "</strong> ⊂ <strong>" +
                p.name +
                "</strong></li>",
            );
          } else {
            html.push(
              '<li class="relation-item"><span class="tag tag-para">PARALLÈLE</span> <strong>' +
                l.name +
                "</strong> // <strong>" +
                p.name +
                "</strong> (Dist: " +
                formatNumber(dist) +
                ")</li>",
            );
          }
        } else {
          var num = new THREE.Vector3()
            .subVectors(p.pointOnPlane, l.startPoint)
            .dot(p.normal);
          var den = l.directorVector.clone().normalize().dot(p.normal);
          var interI = l.startPoint.clone().add(
            l.directorVector
              .clone()
              .normalize()
              .multiplyScalar(num / den),
          );
          var ptStr =
            "(" +
            formatNumber(interI.x) +
            "; " +
            formatNumber(interI.z) +
            "; " +
            formatNumber(interI.y) +
            ")";

          var perpTag =
            dot > 0.9999
              ? '<span class="tag tag-perp">PERPENDICULAIRE</span> '
              : '<span class="tag tag-inter">INTERSECTION</span> ';
          html.push(
            '<li class="relation-item">' +
              perpTag +
              "<strong>" +
              l.name +
              "</strong> / <strong>" +
              p.name +
              "</strong></li>",
          );
          html.push(
            '<li class="relation-item" style="padding-left:40px;">↳ Point I <span class="math">' +
              ptStr +
              "</span></li>",
          );
        }
        relationsFound = true;
      });
    });
  }

  if (!relationsFound) {
    html.push("<li>Aucune relation remarquable détectée.</li>");
  }
  html.push("</ul>");

  // --- FOOTER ---
  html.push(
    '<div style="margin-top:40px; text-align:center; border-top:1px solid #ddd; padding-top:20px; font-size:12px; color:#888;">',
  );
  html.push(
    '<button onclick="window.print()" style="padding:10px 20px; cursor:pointer; background:#2980b9; color:white; border:none; border-radius:4px; font-size:14px;">Imprimer / PDF</button>',
  );
  html.push("<br><br>Généré automatiquement par Éditeur 3D Web");
  html.push("</div>");
  html.push("</body></html>");

  // Écriture finale
  win.document.write(html.join(""));
  win.document.close();
}

function escapeHtml(text) {
  var div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function buildCartesianEquation(a, b, c, d) {
  var parts = [];

  if (Math.abs(a) > 0.001) {
    parts.push(formatNumber(a) + "x");
  }
  if (Math.abs(b) > 0.001) {
    var sign = b > 0 ? "+ " : "- ";
    parts.push(sign + formatNumber(Math.abs(b)) + "y");
  }
  if (Math.abs(c) > 0.001) {
    var sign = c > 0 ? "+ " : "- ";
    parts.push(sign + formatNumber(Math.abs(c)) + "z");
  }
  if (Math.abs(d) > 0.001) {
    var sign = d > 0 ? "+ " : "- ";
    parts.push(sign + formatNumber(Math.abs(d)));
  }

  var result = parts.join(" ") + " = 0";

  if (result.indexOf("+ ") === 0) {
    result = result.substring(2);
  }

  return result;
}

function formatEqLine(start, dir) {
  var sStart = Math.abs(start) < 0.001 ? "" : formatNumber(start);
  if (Math.abs(dir) < 0.001) return sStart || "0";

  var sDir =
    Math.abs(Math.abs(dir) - 1) < 0.001
      ? "t"
      : formatNumber(Math.abs(dir)) + "t";

  if (dir < 0) return sStart ? sStart + " - " + sDir : "-" + sDir;
  return sStart ? sStart + " + " + sDir : sDir;
}

// =========================================================
// CALCULS DE PROJECTIONS ORTHOGONALES
// =========================================================

function calculateProjectionPointPlane() {
  const pId = document.getElementById("projPointOnPlaneSelect").value;
  const plId = document.getElementById("projPlaneTargetSelect").value;
  const r = document.getElementById("projPlaneResult");

  if (pId === "" || plId === "") {
    r.textContent = "Sélectionnez un point et un plan.";
    return;
  }

  const P_obj = geometryManager.points[pId];
  const Plane_obj = geometryManager.findPlaneById(parseInt(plId));

  // 1. Mathématiques : H = P - (distSignée * n)
  const P = P_obj.position;
  const n = Plane_obj.normal; // Supposée normalisée
  const A = Plane_obj.pointOnPlane;

  const vAP = new THREE.Vector3().subVectors(P, A);
  const distSigned = vAP.dot(n);
  const distExact = Math.abs(distSigned);

  const H = P.clone().sub(n.clone().multiplyScalar(distSigned));

  // 2. Création du Point H dans la scène
  const hName = geometryManager.generateUniqueName(`H_${P_obj.name}`, "point");
  // Attention : Constructeur Point(name, x, y, z). Dans votre code UI, Y=Z et Z=Y.
  // Mais ici on passe des Vector3 ThreeJS, donc on passe (x, y, z) brut si le constructeur gère l'inversion,
  // OU on passe (x, z, y) si le constructeur inverse.
  // D'après votre code existant `addPoint`, il semble attendre (x, y_ui, z_ui) => (x, z, y).
  const newPoint = new Point(hName, H.x, H.y, H.z); // On utilise les coords brutes ThreeJS
  // Correction manuelle de la position car le constructeur Point fait parfois des inversions selon votre version
  newPoint.position.copy(H);
  newPoint.mesh.position.copy(H);
  newPoint.updateLabelPosition();

  geometryManager.addPoint(newPoint);

  // 3. Création du segment pointillé [PH] (Visualisation de la distance)
  if (distExact > 0.01) {
    const material = new THREE.LineDashedMaterial({
      color: 0xff00ff,
      dashSize: 0.5,
      gapSize: 0.2,
    });
    const points = [P, H];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    line.userData = { temporary: true }; // Marqueur pour nettoyage éventuel
    scene.add(line);
    // On l'ajoute temporairement à une liste si vous voulez pouvoir les effacer,
    // ou on le laisse comme "décoration".
  }

  // 4. Affichage du résultat
  const coordsStr = `(${formatNumber(H.x)}; ${formatNumber(H.z)}; ${formatNumber(H.y)})`; // Format UI (X, Prof, Haut)
  r.innerHTML = `
        <strong>Projeté H créé !</strong><br>
        Coord : ${coordsStr}<br>
        Distance PH = <strong>${formatNumber(distExact)}</strong>
    `;

  updateAllUI();
  saveState();
}

function calculateProjectionPointLine() {
  const pId = document.getElementById("projPointOnLineSelect").value;
  const lId = document.getElementById("projLineTargetSelect").value;
  const r = document.getElementById("projLineResult");

  if (pId === "" || lId === "") {
    r.textContent = "Sélectionnez un point et une droite.";
    return;
  }

  const P_obj = geometryManager.points[pId];
  const Line_obj = geometryManager.findLineById(parseInt(lId));

  // 1. Mathématiques : Projection sur une droite définie par A et u
  const P = P_obj.position;
  const A = Line_obj.startPoint;
  const u = Line_obj.directorVector.clone().normalize();

  const vAP = new THREE.Vector3().subVectors(P, A);
  const t = vAP.dot(u); // Produit scalaire

  const H = A.clone().add(u.multiplyScalar(t));
  const distExact = P.distanceTo(H);

  // 2. Création du Point H
  const hName = geometryManager.generateUniqueName(`H_${P_obj.name}`, "point");
  const newPoint = new Point(hName, H.x, H.y, H.z);
  newPoint.position.copy(H);
  newPoint.mesh.position.copy(H);
  newPoint.updateLabelPosition();

  geometryManager.addPoint(newPoint);

  // 3. Segment pointillé [PH]
  if (distExact > 0.01) {
    const material = new THREE.LineDashedMaterial({
      color: 0xff00ff,
      dashSize: 0.5,
      gapSize: 0.2,
    });
    const geometry = new THREE.BufferGeometry().setFromPoints([P, H]);
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    scene.add(line);
  }

  // 4. Affichage
  const coordsStr = `(${formatNumber(H.x)}; ${formatNumber(H.z)}; ${formatNumber(H.y)})`;
  r.innerHTML = `
        <strong>Projeté H créé !</strong><br>
        Coord : ${coordsStr}<br>
        Distance PH = <strong>${formatNumber(distExact)}</strong>
    `;

  updateAllUI();
  saveState();
}
