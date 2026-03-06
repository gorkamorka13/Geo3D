// SECTION 4 : MISE Ã€ JOUR DE L'INTERFACE UTILISATEUR (UI)
// =====================================================================================

function updateAllUI() {
  updatePointList();
  updateStraightLineList();
  updatePlaneList();
  updateVectorList();
  updateSelects();
  updateSpreadsheet();
}

function updatePointList() {
  const list = document.getElementById("pointList");
  list.innerHTML = "";
  geometryManager.points.forEach((p, i) => {
    const item = document.createElement("div");
    item.className = "point-item";
    const coordsText = `(${formatNumber(p.position.x, 1)}, ${formatNumber(p.position.z, 1)}, ${formatNumber(
      p.position.y,
      1,
    )})`;

    item.innerHTML = `
      <div class="geometry-item-main">
          <div class="geometry-info">
              <span class="point-name">${p.name}</span>
              <span class="geometry-coords">${coordsText}</span>
          </div>
          <div class="geometry-actions">
              <button class="btn-secondary" onclick="editPoint(${i})" title="Modifier">✏️</button>
              <button class="btn-secondary" onclick="togglePointVisibility(${i})" title="${p.isVisible ? "Masquer" : "Afficher"}">${p.isVisible ? "👁️ " : "🙈"}</button>
              <button class="btn-danger" onclick="removePoint(${i})" title="Supprimer">🗑️</button>
          </div>
      </div>`;
    list.appendChild(item);
  });
}

function updateStraightLineList() {
  const list = document.getElementById("lineList");
  list.innerHTML =
    geometryManager.lines.length === 0
      ? '<div class="point-item">Aucune droite tracée.</div>'
      : "";

  geometryManager.lines.forEach((line) => {
    const item = document.createElement("div");
    item.className = "geometry-item";
    item.id = `line-item-${line.id}`;

    // 1. Préparation des textes (Formatage)
    const v = line.directorVector;
    const vText = `u(${formatNumber(v.x, 1)}, ${formatNumber(v.z, 1)}, ${formatNumber(v.y, 1)})`; // UI Y=Z, Z=Y

    const p = line.startPoint;
    const pText = `(${formatNumber(p.x, 1)}, ${formatNumber(p.z, 1)}, ${formatNumber(p.y, 1)})`;

    // 2. Construction du HTML
    item.innerHTML = `
    <div class="geometry-item-main">
        <!-- AJOUT : onclick="editLine(...)" sur la zone de texte pour accès rapide -->
        <div class="geometry-info" onclick="editLine(${
          line.id
        })" style="cursor: pointer;" title="Cliquer pour modifier">
            <span class="geometry-name">${line.name}</span>
            <span class="geometry-details" id="line-vector-${line.id}">Vect: ${vText}</span>
        </div>

        <div class="geometry-actions">
            <!-- AJOUT : Bouton Crayon pour éditer -->
            <button class="btn-secondary" onclick="editLine(${line.id})" title="Modifier">✏️</button>

            <!-- Boutons existants -->

            <button class="btn-secondary" onclick="toggleStraightLineVisibility(${line.id})" title="${
              line.isVisible ? "Masquer" : "Afficher"
            }">${line.isVisible ? "👁️ " : "🙈"}</button>
            <button class="btn-danger" onclick="removeStraightLineById(${line.id})" title="Supprimer">🗑️</button>
        </div>
    </div>

    <div class="geometry-details-secondary">
        <span id="line-point-${line.id}" style="color: #666;">
            Passe par : <strong>${pText}</strong>
        </span>
    </div>`;

    list.appendChild(item);
  });
}

function updatePlaneList() {
  const list = document.getElementById("planeList");
  list.innerHTML =
    geometryManager.planes.length === 0
      ? '<div class="point-item">Aucun plan créé.</div>'
      : "";

  geometryManager.planes.forEach((plane) => {
    const item = document.createElement("div");
    item.className = "geometry-item";
    item.id = `plane-item-${plane.id}`;

    // 1. Formatage données
    const n = plane.displayNormal;
    const normalText = `Vn : n(${formatNumber(n.x, 1)}, ${formatNumber(n.z, 1)}, ${formatNumber(n.y, 1)})`; // UI Y=Z, Z=Y

    const p = plane.pointOnPlane;
    const pointText = `(${formatNumber(p.x, 1)}, ${formatNumber(p.z, 1)}, ${formatNumber(p.y, 1)})`;

    // 2. Gestion bouton Vn
    const existingNormalVector = geometryManager.vectors.find(
      (v) => v.parentPlaneId === plane.id && v.isNormalVector,
    );
    const normalBtnHtml = existingNormalVector
      ? `<button class="btn-violet-light" onclick="toggleNormalVector(${plane.id})" title="Masquer Vn">Vn ➖</button>`
      : `<button class="btn-violet" onclick="toggleNormalVector(${plane.id})" title="Afficher Vn">Vn ➕</button>`;

    // 3. Calcul de l'équation cartésienne : Ax + By + Cz + D = 0
    // Mapping UI -> ThreeJS : A=n.x, B=n.z, C=n.y
    const A = n.x;
    const B = n.z;
    const C = n.y;
    const D = -(A * p.x + B * p.z + C * p.y);

    const formatTerm = (coef, varName, isFirst) => {
      if (Math.abs(coef) < 1e-5) return "";
      let res = "";
      if (!isFirst) res += coef > 0 ? " + " : " - ";
      else if (coef < 0) res += "-";

      const absCoef = Math.abs(coef);
      // Si le coeff est ~1 et qu'il y a une variable, on affiche juste la variable (ex: "x" pas "1x")
      if (Math.abs(absCoef - 1) < 1e-5 && varName) res += varName;
      else res += formatNumber(absCoef, 1) + varName;
      return res;
    };

    let eq = formatTerm(A, "x", true);
    eq += formatTerm(B, "y", eq === "");
    eq += formatTerm(C, "z", eq === "");

    // Constante D
    if (Math.abs(D) > 1e-5) {
      eq += formatTerm(D, "", eq === "");
    }

    if (eq === "") eq = "0";
    eq += " = 0";

    // 4. HTML (Avec onclick sur le texte et bouton Crayon)
    item.innerHTML = `
  <div class="geometry-item-main">
      <div class="geometry-info" onclick="editPlane(${
        plane.id
      })" style="cursor: pointer;" title="Cliquer pour modifier">
          <span class="geometry-name">${plane.name}</span>
          <span class="geometry-details" id="plane-normal-${plane.id}">${normalText}</span>
      </div>
      <div class="geometry-actions">
          <!-- AJOUT : Bouton Crayon -->
          <button class="btn-secondary" onclick="editPlane(${plane.id})" title="Modifier">✏️</button>

          ${normalBtnHtml}

          <button class="btn-secondary" onclick="togglePlaneVisibility(${plane.id})" title="${
            plane.isVisible ? "Masquer" : "Afficher"
          }">${plane.isVisible ? "👁️ " : "🙈"}</button>
          <button class="btn-danger" onclick="removePlaneById(${plane.id})" title="Supprimer">🗑️</button>
      </div>
  </div>
  <div class="geometry-details-secondary">
      <span id="plane-point-${plane.id}" style="color: #666; display:block;">
          Passe par : <strong>${pointText}</strong>
      </span>
      <span style="color: #666; display:block; margin-top:2px;">
          Eq : <strong>${eq}</strong>
      </span>
  </div>`;

    list.appendChild(item);
  });
}

function updateVectorList() {
  const list = document.getElementById("vectorList");
  list.innerHTML =
    geometryManager.vectors.length === 0
      ? '<div class="point-item">Aucun vecteur tracé.</div>'
      : "";

  geometryManager.vectors.forEach((vector) => {
    const item = document.createElement("div");
    item.className = "geometry-item";

    // Récupération des valeurs
    const v = vector.components;
    const o = vector.origin;

    // Formatage Composantes (Vx, Vy, Vz)
    const coordsText = `(${formatNumber(v.x, 1)}, ${formatNumber(v.z, 1)}, ${formatNumber(v.y, 1)})`;

    // Formatage Origine (Ox, Oy, Oz) - Attention inversion Y/Z pour l'UI
    const originText = `(${formatNumber(o.x, 1)}, ${formatNumber(o.z, 1)}, ${formatNumber(o.y, 1)})`;

    const normText = formatNumber(vector.components.length(), 2);

    item.innerHTML = `
    <div class="geometry-item-main">
        <div class="geometry-info">
            <span class="geometry-name">${vector.name}</span>
            <!-- On donne des ID uniques aux spans pour pouvoir les mettre à jour en temps réel -->
            <span class="geometry-coords" id="vector-comps-list-${vector.id}">Coord: ${coordsText}</span>
        </div>
        <div class="geometry-actions">
            <button class="btn-secondary" onclick="editVector(${vector.id})" title="Modifier">✏️</button>
            <button class="btn-violet-light" onclick="toggleVectorLabelVisibility(${vector.id})" title="${
              vector.isLabelVisible ? "Masquer le nom" : "Afficher le nom"
            }">${vector.isLabelVisible ? "👁️ " : "🙈"}</button>
            <button class="btn-secondary" onclick="toggleVectorVisibility(${vector.id})" title="${
              vector.isVisible ? "Masquer" : "Afficher"
            }">${vector.isVisible ? "👁️ " : "🙈"}</button>
            <button class="btn-danger" onclick="removeVectorById(${vector.id})" title="Supprimer">🗑️</button>
        </div>
    </div>
    <div class="geometry-details-secondary">
        <!-- C'est ici qu'on ajoute le champ Origine avec un ID unique -->
        <span id="vector-origin-list-${vector.id}" style="display:block; margin-bottom:2px; color:#555;">
            Origine: <strong>${originText}</strong>
        </span>
        Norme: <strong>${normText}</strong>
    </div>`;

    list.appendChild(item);
  });
}

function toggleVectorLabelVisibility(id) {
  const vector = geometryManager.findVectorById(id);
  if (vector) {
    // Appelle la nouvelle méthode de la classe Vector
    vector.setLabelVisibility(!vector.isLabelVisible);
    // Met à jour la liste pour que le texte du bouton change
    updateVectorList();
  }
}

function togglePointVisibility(index) {
  const point = geometryManager.points[index];
  if (point) {
    point.setVisibility(!point.isVisible);
    updatePointList();
    saveState();
  }
}

function toggleNormalVector(planeId) {
  const plane = geometryManager.findPlaneById(planeId);
  if (!plane) return;

  // Chercher si un vecteur normal existe déjà pour ce plan
  const existingVector = geometryManager.vectors.find(
    (v) => v.parentPlaneId === planeId && v.isNormalVector,
  );

  if (existingVector) {
    // Le vecteur existe, on le supprime
    geometryManager.removeVector(existingVector);
  } else {
    // Le vecteur n'existe pas, on le crée
    const normalVectorName = `Vn(${plane.name})`;
    const normalVectorLength = 2.5;
    const normalVectorComponents = plane.normal
      .clone()
      .normalize()
      .multiplyScalar(normalVectorLength);

    const normalVector = new Vector(
      normalVectorName,
      plane.mesh.position, // Origine du vecteur
      normalVectorComponents,
      0x800080, // Couleur violette
    );

    // On stocke des informations pour le retrouver
    normalVector.isNormalVector = true;
    normalVector.parentPlaneId = plane.id;
    geometryManager.addVector(normalVector);
  }

  // Mettre à jour l'UI pour refléter le changement de bouton et la liste des vecteurs
  updateAllUI();
  saveState();
}

function updateSelects() {
  const allSelects = document.querySelectorAll("select");

  // Ces menus doivent proposer l'option "Origine (0,0,0)" en plus des points
  const menusWithOrigin = [
    "vectorOriginPoint",
    "sumVectorOrigin",
    "crossVectorOrigin",
    "rotationCenterSelect",
    "planeEquationPointSelect",
    "lineEquationPointSelect",
  ];

  // CORRECTION : Liste des menus qui contiennent le mot "Vector" dans leur ID
  // mais qui doivent afficher des POINTS (et non des vecteurs)
  const pointInputIds = [
    "sumVectorOrigin", // Point de départ (Somme)
    "crossVectorOrigin", // Origine (Produit vectoriel)
    "vectorOriginPoint", // Origine (Tracer vecteur)
    "vectorStartPoint", // Point de départ (Tracer vecteur par 2 points)
    "vectorEndPoint", // Point d'arrivée (Tracer vecteur par 2 points)
    "projPointOnPlaneSelect",
    "projPointOnLineSelect",
  ];

  allSelects.forEach((select) => {
    const id = select.id;
    const currentValue = select.value;

    // On ignore les menus spéciaux gérés ailleurs
    if (
      [
        "rotationAxisSelect",
        "symmetryTypeSelect",
        "savedScenesSelect",
        "symmetryRefSelect",
        "snapSizeSelect",
      ].includes(id)
    ) {
      return;
    }

    // On vide le menu pour le reconstruire
    select.innerHTML = "";

    // --- CAS SPÉCIAUX (Plans / Droites par équation) ---
    if (id === "planeEquationPointSelect" || id === "lineEquationPointSelect") {
      select.add(
        new Option(
          id === "planeEquationPointSelect"
            ? "-- Par défaut (selon constante d) --"
            : "-- Point de passage (défaut: équation) --",
          "",
        ),
      );
      select.add(new Option("Origine (0,0,0)", "origin"));
      geometryManager.points.forEach((p, i) =>
        select.add(new Option(p.name, i)),
      );
      select.value = currentValue;
      return;
    }

    // --- LOGIQUE GÉNÉRALE CORRIGÉE ---

    // 1. Est-ce un menu qui doit afficher des POINTS ?
    // (Soit il est dans la liste d'exceptions, soit il ne contient ni Vector/Line/Plane dans son nom)
    const isPointMenu =
      pointInputIds.includes(id) ||
      (!id.includes("Vector") && !id.includes("Line") && !id.includes("Plane"));

    if (isPointMenu) {
      select.add(new Option("-- Point --", ""));
      geometryManager.points.forEach((p, i) =>
        select.add(new Option(p.name, i)),
      );
    }
    // 2. Les Vecteurs (excluant les exceptions ci-dessus)
    else if (id.includes("Vector")) {
      select.add(new Option("-- Vecteur --", ""));
      geometryManager.vectors.forEach((v) =>
        select.add(new Option(v.name, v.id)),
      );
    }
    // 3. Les Droites
    else if (id.includes("Line")) {
      select.add(new Option("-- Droite --", ""));
      geometryManager.lines.forEach((l) =>
        select.add(new Option(l.name, l.id)),
      );
    }
    // 4. Les Plans
    else if (id.includes("Plane")) {
      select.add(new Option("-- Plan --", ""));
      geometryManager.planes.forEach((p) =>
        select.add(new Option(p.name, p.id)),
      );
    }

    // --- OPTIONS SUPPLÉMENTAIRES (Origine) ---
    if (menusWithOrigin.includes(id)) {
      const originOpt = new Option("Origine (0,0,0)", "origin");
      // On insère après le titre ("-- Point --")
      if (select.options.length > 0) {
        select.add(originOpt, select.options[1]);
      } else {
        select.add(originOpt);
      }
    }

    // Restauration de la valeur sélectionnée
    select.value = currentValue;
  });

  // Mise à jour des affichages d'équations et symétrie
  displayPlaneEquation();
  displayLineEquation();
  if (document.getElementById("symmetryTypeSelect")) {
    updateSymmetryUI();
  }
}
// =====================================================================================
