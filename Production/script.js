let scene, camera, renderer;
let isDragging = false;
let isPanning = false;
let wasDragged = false; // Pour différencier un clic d'un glisser
let previousMousePosition = { x: 0, y: 0 };
let cameraRotation = { x: 0.5, y: 0.5 };
let cameraDistance = 15;
let cameraTarget = new THREE.Vector3(0, 0, 0);

let points = [];
let pointMeshes = [];
let pointLabels = [];
let axisLabels = [];

let straightLinesData = [];
let nextStraightLineId = 0;

let panelOpen = true;

let initialTouchDistance = -1;
let initialPanMidpoint = null;

let planes = [];
let nextPlaneId = 0;

let vectors = [];
let nextVectorId = 0;

let auxiliaryObjects = [];

// --- NOUVELLES VARIABLES POUR LE RAYCASTING ---
let raycaster;
let mouse;
let selectedObject = null;
const HIGHLIGHT_COLOR = new THREE.Color(0xffff00); // Jaune pour la surbrillance
// --- FIN NOUVELLES VARIABLES ---

// --- NOUVELLES FONCTIONS UTILITAIRES ---
function gcd(a, b) {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function findIntegerNormal(normal) {
  const EPSILON = 0.001;
  // Essayer de trouver un multiplicateur simple pour obtenir des entiers
  for (let m = 1; m < 1000; m++) {
    const sx = normal.x * m;
    const sy = normal.y * m;
    const sz = normal.z * m;

    if (
      Math.abs(sx - Math.round(sx)) < EPSILON &&
      Math.abs(sy - Math.round(sy)) < EPSILON &&
      Math.abs(sz - Math.round(sz)) < EPSILON
    ) {
      const ix = Math.round(sx);
      const iy = Math.round(sy);
      const iz = Math.round(sz);

      const commonDivisor = gcd(gcd(ix, iy), iz);
      if (commonDivisor > 0) {
        return new THREE.Vector3(
          ix / commonDivisor,
          iy / commonDivisor,
          iz / commonDivisor,
        );
      }
    }
  }
  // Si aucune version entière simple n'est trouvée, retourner le vecteur normal original
  return normal;
}

function togglePanel() {
  const panel = document.getElementById("panel");
  const openBtn = document.getElementById("openBtn");
  panelOpen = !panelOpen;

  if (panelOpen) {
    panel.classList.remove("hidden");
    openBtn.classList.remove("show");
  } else {
    panel.classList.add("hidden");
    openBtn.classList.add("show");
  }
}
// --- NOUVELLES FONCTIONS POUR LES OPTIONS DE TEST ---

// Fonction utilitaire pour ajouter les points A, B, C
function addFixedTestPoints() {
  // Définitions des points de test
  const testPoints = [
    { name: "A", x: 2, y: 0, z: 0 },
    { name: "B", x: 0, y: 3, z: 0 },
    { name: "C", x: 0, y: 0, z: 4 },
  ];

  testPoints.forEach((p) => {
    // Vérifier si un point avec le même nom existe déjà pour éviter les doublons lors des rechargements multiples
    if (!points.some((existingPoint) => existingPoint.name === p.name)) {
      // Simuler l'entrée des valeurs dans les champs pour appeler _createPoint()
      _createPoint(p.name, p.x, p.y, p.z);
    } else {
      console.log(`Le point "${p.name}" existe déjà, non ajouté.`);
    }
  });

  // Nettoyer les champs après l'ajout
  document.getElementById("pointName").value = "";
  document.getElementById("coordX").value = "";
  document.getElementById("coordY").value = "";
  document.getElementById("coordZ").value = "";
}

// Fonction appelée quand la case à cocher "Charger A, B, C au démarrage" est changée
function toggleAutoLoadTestPoints() {
  const checkbox = document.getElementById("autoLoadTestPointsCheckbox");
  if (checkbox.checked) {
    localStorage.setItem("autoLoadTestPoints", "true");
    console.log('Option "Charger A, B, C au démarrage" activée.');
  } else {
    localStorage.removeItem("autoLoadTestPoints");
    console.log('Option "Charger A, B, C au démarrage" désactivée.');
  }
}

// Fonction appelée par le bouton "Charger points A, B, C maintenant"
function loadTestPointsOnce() {
  addFixedTestPoints();
}

// --- FIN NOUVELLES FONCTIONS POUR LES OPTIONS DE TEST ---

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  updateCameraPosition();
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("container").appendChild(renderer.domElement);
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);
  createAxes(); // Appel de la fonction pour créer les axes
  const gridHelper = new THREE.GridHelper(20, 20, 0xcccccc, 0xe0e0e0);
  scene.add(gridHelper);

  renderer.domElement.addEventListener("mousedown", onMouseDown);
  renderer.domElement.addEventListener("mousemove", onMouseMove);
  renderer.domElement.addEventListener("mouseup", onMouseUp);
  renderer.domElement.addEventListener("wheel", onWheel);
  renderer.domElement.addEventListener("contextmenu", (e) =>
    e.preventDefault(),
  );

  renderer.domElement.addEventListener("touchstart", onTouchStart);
  renderer.domElement.addEventListener("touchmove", onTouchMove);
  renderer.domElement.addEventListener("touchend", onTouchEnd);
  renderer.domElement.addEventListener("touchcancel", onTouchEnd);

  window.addEventListener("resize", onWindowResize);

  // --- AJOUTS POUR LE RAYCASTING ---
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  renderer.domElement.addEventListener("click", onObjectClick);
  // --- FIN AJOUTS ---

  // --- NOUVELLE LOGIQUE D'INITIALISATION POUR LES POINTS DE TEST ---
  const autoLoadCheckbox = document.getElementById(
    "autoLoadTestPointsCheckbox",
  );
  if (localStorage.getItem("autoLoadTestPoints") === "true") {
    autoLoadCheckbox.checked = true;
    addFixedTestPoints();
  } else {
    autoLoadCheckbox.checked = false;
  }

  // --- PRÉ-REMPLIR LES ÉQUATIONS ---
  document.getElementById("lineEquationInput").value =
    "x = 1 + 2t\ny = -3 + 3t\nz = 4 - 5t";
  document.getElementById("planeEquationInput").value = "2x - y + 3z - 4 = 0";

  animate();
  updateSelects(); // Pour remplir les listes de points, plans, droites...
}

function createAxes() {
  const axisLength = 10;
  const axisRadius = 0.04;
  const arrowLength = 0.8;
  const arrowHeadWidth = 0.3;
  const arrowHeadLength = 0.3;

  const createAxisWithArrow = (color, direction, name) => {
    const cylinderGeometry = new THREE.CylinderGeometry(
      axisRadius,
      axisRadius,
      axisLength,
      12,
    );
    const cylinderMaterial = new THREE.MeshPhongMaterial({ color: color });
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);

    if (name === "X") {
      cylinder.rotation.z = Math.PI / 2;
      cylinder.position.x = axisLength / 2;
    } else if (name === "Y") {
      cylinder.position.y = axisLength / 2;
    } else if (name === "Z") {
      cylinder.rotation.x = Math.PI / 2;
      cylinder.position.z = axisLength / 2;
    }
    scene.add(cylinder);

    const origin = new THREE.Vector3(0, 0, 0);
    const arrowHelper = new THREE.ArrowHelper(
      direction,
      origin,
      arrowLength,
      color,
      arrowHeadLength,
      arrowHeadWidth,
    );

    if (name === "X") {
      arrowHelper.position.x = axisLength;
    } else if (name === "Y") {
      arrowHelper.position.y = axisLength;
    } else if (name === "Z") {
      arrowHelper.position.z = axisLength;
    }
    scene.add(arrowHelper);

    const label = createTextLabel(name);
    if (name === "X") {
      label.position.set(axisLength + 0.5, 0, 0);
    } else if (name === "Y") {
      label.position.set(0, axisLength + 0.5, 0);
    } else if (name === "Z") {
      label.position.set(0, 0, axisLength + 0.5);
    }
    scene.add(label);
    axisLabels.push(label);
  };

  createAxisWithArrow(0xff0000, new THREE.Vector3(1, 0, 0), "X");
  createAxisWithArrow(0x00ff00, new THREE.Vector3(0, 1, 0), "Y");
  createAxisWithArrow(0x0000ff, new THREE.Vector3(0, 0, 1), "Z");
}
function addPoint() {
  const name = document.getElementById("pointName").value.trim();
  const x = parseFloat(document.getElementById("coordX").value);
  const y = parseFloat(document.getElementById("coordY").value);
  const z = parseFloat(document.getElementById("coordZ").value);
  if (!name) {
    alert("Veuillez entrer un nom pour le point");
    return;
  }
  if (isNaN(x) || isNaN(y) || isNaN(z)) {
    alert("Veuillez entrer des coordonnées valides");
    return;
  }

  _createPoint(name, x, y, z); // Appel de la fonction interne _createPoint

  // Nettoyer les champs après l'ajout
  document.getElementById("pointName").value = "";
  document.getElementById("coordX").value = "";
  document.getElementById("coordY").value = "";
  document.getElementById("coordZ").value = "";
}
function createTextLabel(text) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 512;
  canvas.height = 256;

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
  texture.generateMipmaps = false;

  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(2, 1, 1);
  sprite.center.set(0.5, 0);
  return sprite;
}

function updatePointList() {
  const list = document.getElementById("pointList");
  list.innerHTML = "";
  points.forEach((p, i) => {
    const item = document.createElement("div");
    item.className = "point-item";
    item.innerHTML = `
                    <div>
                        <div class="point-name">${p.name}</div>
                        <div class="point-coords">(${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)})</div>
                    </div>
                    <div class="geometry-actions">
                        <button class="btn-secondary" onclick="editPoint(${i})">✏️ Modifier</button>
                        <button class="btn-danger" onclick="removePoint(${i})">🗑️ Supprimer</button>
                    </div>
                `;
    list.appendChild(item);
  });
}

function removePoint(index) {
  if (!points[index].derivedFrom) {
    if (
      !confirm(
        `Voulez-vous vraiment supprimer le point "${points[index].name}" et tous les objets qui en dépendent ?`,
      )
    )
      return;
  }

  removeDependents("point", index);

  scene.remove(pointMeshes[index]);
  pointMeshes.splice(index, 1);
  scene.remove(pointLabels[index]);
  pointLabels.splice(index, 1);
  points.splice(index, 1);

  updatePointList();
  updateSelects();
}

function updateSelects() {
  // Un tableau de toutes les listes déroulantes connues de l'application.
  const allSelectIds = [
    "lineStart",
    "lineEnd",
    "planeSelectP1",
    "planeSelectP2",
    "planeSelectP3",
    "vectorStartPoint",
    "vectorEndPoint",
    "calcPointSelect",
    "distPointSelect1",
    "distPointSelect2",
    "distPointSelect3",
    "vectorOriginPoint",
    "sumVectorOrigin",
    "crossVectorOrigin",
    "equationPlaneSelect",
    "calcPlaneSelect1",
    "calcPlaneSelect2",
    "calcPlaneSelect3",
    "calcPlaneSelect4",
    "anglePlaneSelect1",
    "anglePlaneSelect2",
    "anglePlaneSelect3",
    "equationLineSelect",
    "calcLineSelect",
    "calcLineSelect1",
    "calcLineSelect2",
    "distLineSelect1",
    "angleLineSelect1",
    "angleLineSelect2",
    "angleLineSelect3",
    "sumVectorSelect1",
    "sumVectorSelect2",
    "dotVectorSelect1",
    "dotVectorSelect2",
    "crossVectorSelect1",
    "crossVectorSelect2",
  ];

  allSelectIds.forEach((id) => {
    const select = document.getElementById(id);
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = ""; // Vider la liste

    // Déterminer le type de contenu à ajouter
    if (
      ["vectorOriginPoint", "sumVectorOrigin", "crossVectorOrigin"].includes(id)
    ) {
      // CAS SPÉCIAL : Listes d'origine de vecteur
      select.add(new Option("Origine (0,0,0)", "origin"));
      points.forEach((p, i) =>
        select.add(new Option(`Point ${p.name}`, `p_${i}`)),
      );
    } else if (id.includes("Vector")) {
      // CAS : Listes de vecteurs
      select.add(new Option("-- Vecteur --", ""));
      vectors.forEach((v) => select.add(new Option(v.name, v.id)));
    } else if (id.includes("Line")) {
      // CAS : Listes de droites
      select.add(new Option("-- Droite --", ""));
      straightLinesData.forEach((l) => select.add(new Option(l.name, l.id)));
    } else if (id.includes("Plane")) {
      // CAS : Listes de plans
      select.add(new Option("-- Plan --", ""));
      planes.forEach((p) => select.add(new Option(p.name, p.id)));
    } else {
      // CAS PAR DÉFAUT : Listes de points
      select.add(new Option("-- Point --", ""));
      points.forEach((p, i) => select.add(new Option(p.name, i)));
    }

    // Tenter de restaurer la valeur précédente
    select.value = currentValue;
  });

  displayPlaneEquation();
  displayLineEquation();
}

function addVectorFromCoords() {
  const name = document.getElementById("vectorNameCoords").value.trim();
  const vx = parseFloat(document.getElementById("vectorCoordX").value);
  const vy = parseFloat(document.getElementById("vectorCoordY").value);
  const vz = parseFloat(document.getElementById("vectorCoordZ").value);
  const originSelection = document.getElementById("vectorOriginPoint").value;

  if (!name || isNaN(vx) || isNaN(vy) || isNaN(vz) || !originSelection) {
    alert("Veuillez remplir tous les champs du vecteur.");
    return;
  }

  let startPoint;
  let originDesc = "";
  if (originSelection === "origin") {
    startPoint = new THREE.Vector3(0, 0, 0);
    originDesc = "Origine (0,0,0)";
  } else {
    // La valeur est 'p_i'
    const pointIndex = parseInt(originSelection.substring(2));
    const p = points[pointIndex];
    if (!p) {
      alert("Erreur : Point d'origine introuvable.");
      return;
    }
    startPoint = new THREE.Vector3(p.x, p.y, p.z);
    originDesc = `Point ${p.name}`;
  }

  const originalVector = new THREE.Vector3(vx, vy, vz);
  _createVector(
    name,
    startPoint,
    originalVector,
    `Coordonnées, origine: ${originDesc}`,
  );

  // Nettoyage des champs
  document.getElementById("vectorNameCoords").value = "";
  document.getElementById("vectorCoordX").value = "";
  document.getElementById("vectorCoordY").value = "";
  document.getElementById("vectorCoordZ").value = "";
  document.getElementById("vectorOriginPoint").value = "origin";
}

function editVector(vectorId) {
  const vectorToEdit = vectors.find((v) => v.id === vectorId);
  if (!vectorToEdit) return;

  document.getElementById("vectorNameCoords").value = vectorToEdit.name;
  document.getElementById("vectorCoordX").value = vectorToEdit.originalVector.x;
  document.getElementById("vectorCoordY").value = vectorToEdit.originalVector.y;
  document.getElementById("vectorCoordZ").value = vectorToEdit.originalVector.z;
  document.getElementById("editVectorId").value = vectorId;

  const originSelect = document.getElementById("vectorOriginPoint");
  const origin = vectorToEdit.origin;
  let originValueToSet = "origin"; // Par défaut, on suppose que c'est l'origine

  // On cherche si l'origine correspond à un point existant
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (
      Math.abs(p.x - origin.x) < 1e-6 &&
      Math.abs(p.y - origin.y) < 1e-6 &&
      Math.abs(p.z - origin.z) < 1e-6
    ) {
      originValueToSet = `p_${i}`; // On a trouvé le point !
      break;
    }
  }
  originSelect.value = originValueToSet;

  // Gestion de l'interface
  document.getElementById("addVectorFromPointsBtn").style.display = "none";
  document.getElementById("addVectorFromCoordsBtn").style.display = "none";
  document.getElementById("updateVectorBtn").style.display = "block";
  document.getElementById("cancelVectorEditBtn").style.display = "block";

  const vectorSection = document
    .getElementById("vectorList")
    .closest(".section.collapsible");
  if (vectorSection.classList.contains("collapsed")) {
    vectorSection.classList.remove("collapsed");
  }
  document
    .getElementById("vectorNameCoords")
    .scrollIntoView({ behavior: "smooth", block: "center" });
}

function calculatePointPointDistance() {
  const pointIdx1 = document.getElementById("distPointSelect1").value;
  const pointIdx2 = document.getElementById("distPointSelect2").value;
  const displayDiv = document.getElementById("distResult1");

  if (pointIdx1 === "" || pointIdx2 === "") {
    displayDiv.textContent = "Veuillez sélectionner deux points.";
    return;
  }

  const p1 = points[pointIdx1];
  const p2 = points[pointIdx2];

  const v1 = new THREE.Vector3(p1.x, p1.y, p1.z);
  const v2 = new THREE.Vector3(p2.x, p2.y, p2.z);

  const distance = v1.distanceTo(v2);
  displayDiv.textContent = `Distance(${p1.name}, ${p2.name}) = ${distance.toFixed(3)}`;
}

function calculatePointLineDistance() {
  const pointIdx = document.getElementById("distPointSelect3").value;
  const lineId = document.getElementById("distLineSelect1").value;
  const displayDiv = document.getElementById("distResult2");

  if (pointIdx === "" || lineId === "") {
    displayDiv.textContent = "Veuillez sélectionner un point et une droite.";
    return;
  }

  const point = points[pointIdx];
  const line = straightLinesData.find((l) => l.id == lineId);

  const P = new THREE.Vector3(point.x, point.y, point.z);
  const A = line.startPoint.clone();
  const u = line.directorVector.clone();

  const AP = new THREE.Vector3().subVectors(P, A);
  const crossProduct = new THREE.Vector3().crossVectors(AP, u);

  const distance = crossProduct.length() / u.length();
  displayDiv.textContent = `Distance(${point.name}, ${line.name}) = ${distance.toFixed(3)}`;
}

function calculateLineLineAngle() {
  const lineId1 = document.getElementById("angleLineSelect1").value;
  const lineId2 = document.getElementById("angleLineSelect2").value;
  const displayDiv = document.getElementById("angleResult1");

  if (lineId1 === "" || lineId2 === "") {
    displayDiv.textContent = "Veuillez sélectionner deux droites.";
    return;
  }

  const line1 = straightLinesData.find((l) => l.id == lineId1);
  const line2 = straightLinesData.find((l) => l.id == lineId2);

  const u1 = line1.directorVector.clone().normalize();
  const u2 = line2.directorVector.clone().normalize();

  const cosTheta = Math.abs(u1.dot(u2));
  const angleRad = Math.acos(Math.min(1.0, cosTheta)); // Clamp pour éviter les erreurs de calcul flottant
  const angleDeg = angleRad * (180 / Math.PI);

  displayDiv.textContent = `Angle = ${angleDeg.toFixed(2)}°`;
}

function calculatePlanePlaneAngle() {
  const planeId1 = document.getElementById("anglePlaneSelect1").value;
  const planeId2 = document.getElementById("anglePlaneSelect2").value;
  const displayDiv = document.getElementById("angleResult2");

  if (planeId1 === "" || planeId2 === "") {
    displayDiv.textContent = "Veuillez sélectionner deux plans.";
    return;
  }
  if (planeId1 === planeId2) {
    displayDiv.textContent = "Les plans sont identiques (Angle = 0°).";
    return;
  }

  const plane1 = planes.find((p) => p.id == planeId1);
  const plane2 = planes.find((p) => p.id == planeId2);

  const n1 = plane1.normal.clone();
  const n2 = plane2.normal.clone();

  const cosTheta = Math.abs(n1.dot(n2)) / (n1.length() * n2.length());
  const angleRad = Math.acos(Math.min(1.0, cosTheta));
  const angleDeg = angleRad * (180 / Math.PI);

  displayDiv.textContent = `Angle = ${angleDeg.toFixed(2)}°`;
}

function calculateLinePlaneAngle() {
  const lineId = document.getElementById("angleLineSelect3").value;
  const planeId = document.getElementById("anglePlaneSelect3").value;
  const displayDiv = document.getElementById("angleResult3");

  if (lineId === "" || planeId === "") {
    displayDiv.textContent = "Veuillez sélectionner une droite et un plan.";
    return;
  }

  const line = straightLinesData.find((l) => l.id == lineId);
  const plane = planes.find((p) => p.id == planeId);

  const u = line.directorVector.clone();
  const n = plane.normal.clone();

  if (u.lengthSq() === 0) {
    displayDiv.textContent = "Le vecteur directeur de la droite est nul.";
    return;
  }

  const sinAlpha = Math.abs(u.dot(n)) / (u.length() * n.length());
  const angleRad = Math.asin(Math.min(1.0, sinAlpha));
  const angleDeg = angleRad * (180 / Math.PI);

  displayDiv.textContent = `Angle = ${angleDeg.toFixed(2)}°`;
}

function addStraightLine() {
  const idx1 = document.getElementById("lineStart").value;
  const idx2 = document.getElementById("lineEnd").value;

  if (idx1 === "" || idx2 === "") {
    alert("Veuillez sélectionner deux points.");
    return;
  }
  if (idx1 === idx2) {
    alert("Veuillez sélectionner deux points différents.");
    return;
  }

  const p1 = points[idx1];
  const p2 = points[idx2];
  const v1 = new THREE.Vector3(p1.x, p1.y, p1.z);
  const v2 = new THREE.Vector3(p2.x, p2.y, p2.z);

  const directorVector = new THREE.Vector3().subVectors(v2, v1);
  _createStraightLine(`Droite (${p1.name}, ${p2.name})`, v1, directorVector, [
    p1,
    p2,
  ]);

  document.getElementById("lineStart").value = "";
  document.getElementById("lineEnd").value = "";
}

function clearStraightLines() {
  straightLinesData.forEach((line) => scene.remove(line.mesh));
  straightLinesData = [];
  nextStraightLineId = 0;
  updateStraightLineList();
}

function removeStraightLine(lineId) {
  const index = straightLinesData.findIndex((l) => l.id === lineId);
  if (index === -1) return;

  if (!straightLinesData[index].derivedFrom) {
    if (
      !confirm(
        "Voulez-vous vraiment supprimer cette droite et tous les objets qui en dépendent ?",
      )
    )
      return;
  }

  removeDependents("line", lineId);

  const line = straightLinesData[index];
  scene.remove(line.mesh);
  straightLinesData.splice(index, 1);

  updateStraightLineList();
  updateSelects();
}
function updateStraightLineList() {
  const list = document.getElementById("lineList");
  list.innerHTML = "";
  if (straightLinesData.length === 0) {
    list.innerHTML = '<div class="point-item">Aucune droite tracée.</div>';
    return;
  }
  straightLinesData.forEach((line) => {
    const item = document.createElement("div");
    item.className = "geometry-item";

    const vec = line.directorVector;
    const vectorText = `(${parseFloat(vec.x.toFixed(2))}, ${parseFloat(vec.y.toFixed(2))}, ${parseFloat(vec.z.toFixed(2))})`;

    let detailsText = "";
    if (line.points.length > 0) {
      detailsText = `Passe par: ${line.points[0].name}, ${line.points[1].name}`;
    } else {
      const p0 = line.startPoint;
      const pointText = `(${parseFloat(p0.x.toFixed(2))}, ${parseFloat(p0.y.toFixed(2))}, ${parseFloat(p0.z.toFixed(2))})`;
      detailsText = `Point de base: ${pointText}`;
    }

    item.innerHTML = `
                    <div class="geometry-name">${line.name}</div>
                    <div class="geometry-details">
                        ${detailsText} <br>
                        Vecteur directeur: ${vectorText}
                    </div>
                    <div class="geometry-actions">
                        <button class="btn-danger" onclick="removeStraightLine(${line.id})">🗑️ Supprimer</button>
                    </div>
                `;
    list.appendChild(item);
  });
}

function addPlane() {
  const name = document.getElementById("planeName").value.trim();
  const idx1 = document.getElementById("planeSelectP1").value;
  const idx2 = document.getElementById("planeSelectP2").value;
  const idx3 = document.getElementById("planeSelectP3").value;

  if (!name) {
    alert("Veuillez entrer un nom pour le plan.");
    return;
  }
  if (idx1 === "" || idx2 === "" || idx3 === "") {
    alert("Veuillez sélectionner trois points pour le plan.");
    return;
  }
  if (idx1 === idx2 || idx1 === idx3 || idx2 === idx3) {
    alert("Veuillez sélectionner trois points différents.");
    return;
  }

  const p1 = points[idx1];
  const p2 = points[idx2];
  const p3 = points[idx3];

  const v1 = new THREE.Vector3(p1.x, p1.y, p1.z);
  const v2 = new THREE.Vector3(p2.x, p2.y, p2.z);
  const v3 = new THREE.Vector3(p3.x, p3.y, p3.z);

  const vec12 = new THREE.Vector3().subVectors(v2, v1);
  const vec13 = new THREE.Vector3().subVectors(v3, v1);
  const normal = new THREE.Vector3().crossVectors(vec12, vec13).normalize();

  if (normal.lengthSq() < 1e-6) {
    alert(
      "Les points sélectionnés sont colinéaires. Impossible de former un plan.",
    );
    return;
  }

  createAndAddPlaneMesh(name, [v1, v2, v3], normal, [p1, p2, p3]);

  document.getElementById("planeName").value = "";
  document.getElementById("planeSelectP1").value = "";
  document.getElementById("planeSelectP2").value = "";
  document.getElementById("planeSelectP3").value = "";
}

function addPlaneFromEquation() {
  const input = document.getElementById("planeEquationInput");
  let equationStr = input.value.trim();
  if (!equationStr) {
    alert("Veuillez entrer une équation de plan.");
    return;
  }

  equationStr = equationStr
    .replace(/([=+-])\s*x/g, "$1 1x")
    .replace(/^x/, "1x");
  equationStr = equationStr
    .replace(/([=+-])\s*y/g, "$1 1y")
    .replace(/^y/, "1y");
  equationStr = equationStr
    .replace(/([=+-])\s*z/g, "$1 1z")
    .replace(/^z/, "1z");

  const getCoeff = (term) => {
    const regex = new RegExp(`([+-]?\\s*\\d*\\.?\\d*)\\s*\\*?\\s*${term}`, "i");
    const match = equationStr.match(regex);
    return match ? parseFloat(match[1].replace(/\s/g, "")) || 0 : 0;
  };

  const A = getCoeff("x");
  const B = getCoeff("y");
  const C = getCoeff("z");

  const dStr = equationStr
    .replace(/([+-]?\s*\d*\.?\\d*)\\s*\*?\s*[xyz]/gi, "")
    .split("=")[0]
    .trim();
  const D = parseFloat(dStr) || 0;

  if (A === 0 && B === 0 && C === 0) {
    alert("Équation de plan invalide. Le vecteur normal ne peut pas être nul.");
    return;
  }

  const normal = new THREE.Vector3(A, B, C).normalize();

  let pointOnPlane = new THREE.Vector3();
  if (Math.abs(C) > 1e-6) {
    pointOnPlane.set(0, 0, -D / C);
  } else if (Math.abs(B) > 1e-6) {
    pointOnPlane.set(0, -D / B, 0);
  } else {
    pointOnPlane.set(-D / A, 0, 0);
  }

  const name = `Plan (${A.toFixed(1)}x + ${B.toFixed(1)}y + ${C.toFixed(1)}z + ${D.toFixed(1)} = 0)`;
  createAndAddPlaneMesh(name, [pointOnPlane], normal);
  input.value = "";
}

function createAndAddPlaneMesh(name, pointCoords, normal, pointsData = null) {
  const center = new THREE.Vector3();
  if (pointCoords.length === 1) {
    center.copy(pointCoords[0]);
  } else {
    center
      .addVectors(pointCoords[0], pointCoords[1])
      .add(pointCoords[2])
      .divideScalar(3);
  }

  const integerNormal = findIntegerNormal(normal);

  const planeGeometry = new THREE.PlaneGeometry(15, 15);
  const planeMaterial = new THREE.MeshPhongMaterial({
    color: 0xffeb3b,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  });
  const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);

  const defaultNormal = new THREE.Vector3(0, 0, 1);
  planeMesh.quaternion.setFromUnitVectors(defaultNormal, normal);
  planeMesh.position.copy(center);

  const newPlane = {
    id: nextPlaneId++,
    name: name,
    points: pointsData || [],
    pointCoords: pointCoords,
    mesh: planeMesh,
    normal: normal,
    integerNormal: integerNormal,
    normalArrowHelper: null,
    isVisible: true,
  };
  planes.push(newPlane);

  // --- AJOUT POUR RAYCASTING ---
  planeMesh.userData = {
    type: "plane",
    data: newPlane,
    originalColor: planeMesh.material.color.clone(),
  };
  // --- FIN AJOUT ---

  scene.add(planeMesh);
  updatePlaneList();
  updateSelects();
}
function togglePlaneVisibility(planeId) {
  const plane = planes.find((p) => p.id === planeId);
  if (plane) {
    if (plane.isVisible) {
      scene.remove(plane.mesh);
      if (plane.normalArrowHelper) scene.remove(plane.normalArrowHelper);
    } else {
      scene.add(plane.mesh);
      if (plane.normalArrowHelper) scene.add(plane.normalArrowHelper);
    }
    plane.isVisible = !plane.isVisible;
    updatePlaneList();
  }
}

function removePlane(planeId) {
  const index = planes.findIndex((p) => p.id === planeId);
  if (index === -1) return;

  if (
    !confirm(
      "Voulez-vous vraiment supprimer ce plan et tous les objets qui en dépendent ?",
    )
  )
    return;

  removeDependents("plane", planeId);

  const plane = planes[index];
  scene.remove(plane.mesh);
  if (plane.normalArrowHelper) scene.remove(plane.normalArrowHelper);
  planes.splice(index, 1);

  updatePlaneList();
  updateSelects();
}
function clearAllPlanes() {
  if (!confirm("Voulez-vous vraiment effacer tous les plans ?")) return;
  planes.forEach((plane) => {
    scene.remove(plane.mesh);
    if (plane.normalArrowHelper) scene.remove(plane.normalArrowHelper);
  });
  planes = [];
  nextPlaneId = 0;
  updatePlaneList();
  updateSelects();
  displayPlaneEquation();
}
function updatePlaneList() {
  const list = document.getElementById("planeList");
  list.innerHTML = "";
  if (planes.length === 0) {
    list.innerHTML = '<div class="point-item">Aucun plan créé.</div>';
    return;
  }
  planes.forEach((plane) => {
    const item = document.createElement("div");
    item.className = "geometry-item";
    const details =
      plane.points.length > 0
        ? `Points: ${plane.points.map((p) => p.name).join(", ")}`
        : "Défini par équation";

    const displayNormal = plane.integerNormal || plane.normal;

    const dn = displayNormal;
    const normalText = `(${parseFloat(dn.x.toFixed(2))}, ${parseFloat(dn.y.toFixed(2))}, ${parseFloat(dn.z.toFixed(2))})`;

    item.innerHTML = `
                    <div class="geometry-name">${plane.name}</div>
                    <div class="geometry-details">${details}</div>
                    <div class="geometry-details" style="margin-top: 4px;">
                        Vecteur normal: ${normalText}
                    </div>
                    <div class="geometry-actions">
                        <button class="btn-secondary" onclick="togglePlaneVisibility(${plane.id})">
                            ${plane.isVisible ? "👁️ Masquer" : "🙈 Afficher"}
                        </button>
                        <button class="btn-secondary" onclick="togglePlaneNormal(${plane.id})">
                            ${plane.normalArrowHelper && plane.normalArrowHelper.parent ? "➡️ Masquer normale" : "➡️ Afficher normale"}
                        </button>
                        <button class="btn-danger" onclick="removePlane(${plane.id})">🗑️ Supprimer</button>
                    </div>
                `;
    list.appendChild(item);
  });
}

function togglePlaneNormal(planeId) {
  const plane = planes.find((p) => p.id === planeId);
  if (plane) {
    if (plane.normalArrowHelper && plane.normalArrowHelper.parent) {
      scene.remove(plane.normalArrowHelper);
    } else {
      if (!plane.normalArrowHelper) {
        const normal = plane.normal;
        const center = plane.mesh.position;
        const arrowHelper = new THREE.ArrowHelper(
          normal,
          center,
          2,
          0x00ffff,
          0.4,
          0.2,
        );
        plane.normalArrowHelper = arrowHelper;
      }
      if (plane.isVisible) {
        scene.add(plane.normalArrowHelper);
      }
    }
    updatePlaneList();
  }
}

function addVectorFromPoints() {
  const startIdx = document.getElementById("vectorStartPoint").value;
  const endIdx = document.getElementById("vectorEndPoint").value;
  if (startIdx === "" || endIdx === "") {
    alert("Veuillez sélectionner les deux points.");
    return;
  }
  if (startIdx === endIdx) {
    alert("Les points de départ et d'arrivée doivent être différents.");
    return;
  }

  const pStart = points[startIdx];
  const pEnd = points[endIdx];

  const startVec = new THREE.Vector3(pStart.x, pStart.y, pStart.z);
  const endVec = new THREE.Vector3(pEnd.x, pEnd.y, pEnd.z);

  const name = `Vecteur(${pStart.name}${pEnd.name})`;
  const originalVector = new THREE.Vector3().subVectors(endVec, startVec);

  _createVector(
    name,
    startVec,
    originalVector,
    `De ${pStart.name} à ${pEnd.name}`,
  );

  document.getElementById("vectorStartPoint").value = "";
  document.getElementById("vectorEndPoint").value = "";
}

function toggleVectorVisibility(vectorId) {
  const vector = vectors.find((v) => v.id === vectorId);
  if (vector) {
    vector.isVisible = !vector.isVisible;
    vector.arrowHelper.visible = vector.isVisible;
    updateVectorList();
  }
}

function removeVector(vectorId) {
  const index = vectors.findIndex((v) => v.id === vectorId);
  if (index !== -1) {
    if (!confirm("Voulez-vous vraiment supprimer ce vecteur ?")) return;
    const vector = vectors[index];
    scene.remove(vector.arrowHelper);
    vectors.splice(index, 1);
    updateVectorList();
    updateSelects();
  }
}

function clearAllVectors() {
  if (!confirm("Voulez-vous vraiment effacer tous les vecteurs ?")) return;
  vectors.forEach((vector) => scene.remove(vector.arrowHelper));
  vectors = [];
  nextVectorId = 0;
  updateVectorList();
  updateSelects();
}

function updateVectorList() {
  const list = document.getElementById("vectorList");
  list.innerHTML = "";
  if (vectors.length === 0) {
    list.innerHTML = '<div class="point-item">Aucun vecteur tracé.</div>';
    return;
  }
  vectors.forEach((vector) => {
    const item = document.createElement("div");
    item.className = "geometry-item";
    const v = vector.originalVector;
    const coordsText = `(${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})`;

    item.innerHTML = `
                    <div class="geometry-name">${vector.name}</div>
                    <div class="geometry-details">
                        ${vector.description} <br>
                        Composantes: ${coordsText}
                    </div>
                    <div class="geometry-actions">
                        <!-- BOUTON MODIFIER AJOUTÉ ICI -->
                        <button class="btn-secondary" onclick="editVector(${vector.id})">✏️ Modifier</button>
                        <button class="btn-secondary" onclick="toggleVectorVisibility(${vector.id})">
                            ${vector.isVisible ? "👁️ Masquer" : "🙈 Afficher"}
                        </button>
                        <button class="btn-danger" onclick="removeVector(${vector.id})">🗑️ Supprimer</button>
                    </div>
                `;
    list.appendChild(item);
  });
}
// --- AJOUTER CE BLOC DE NOUVELLES FONCTIONS ---

// Fonction utilitaire pour créer l'objet vecteur et sa représentation 3D
function _createVector(name, origin, vector, description, color = 0xffa500) {
  const length = vector.length();
  if (length < 1e-6) {
    // alert('Le vecteur a une longueur nulle et ne peut pas être tracé.');
    return null;
  }

  const arrowHelper = new THREE.ArrowHelper(
    vector.clone().normalize(),
    origin,
    length,
    color,
    0.4,
    0.2,
  );

  const newVector = {
    id: nextVectorId++,
    name: name,
    origin: origin,
    originalVector: vector,
    description: description,
    arrowHelper: arrowHelper,
    isVisible: true,
  };
  vectors.push(newVector);

  // --- AJOUT POUR RAYCASTING ---
  // Un ArrowHelper est un Object3D qui contient line et cone comme enfants.
  // On attache les données aux enfants pour que le raycaster les trouve.
  arrowHelper.line.userData = {
    type: "vector",
    data: newVector,
    originalColor: arrowHelper.line.material.color.clone(),
  };
  arrowHelper.cone.userData = {
    type: "vector",
    data: newVector,
    originalColor: arrowHelper.cone.material.color.clone(),
  };
  // --- FIN AJOUT ---

  scene.add(arrowHelper);
  updateVectorList();
  updateSelects();
  return newVector;
}

// Fonctions pour les opérations sur les vecteurs
function calculateVectorSum() {
  const vectorId1 = document.getElementById("sumVectorSelect1").value;
  const vectorId2 = document.getElementById("sumVectorSelect2").value;
  const originSelection = document.getElementById("sumVectorOrigin").value;
  const displayDiv = document.getElementById("vectorSumResult");

  if (vectorId1 === "" || vectorId2 === "") {
    displayDiv.textContent = "Veuillez sélectionner deux vecteurs.";
    return;
  }

  const v1 = vectors.find((v) => v.id == vectorId1);
  const v2 = vectors.find((v) => v.id == vectorId2);
  const sumVector = new THREE.Vector3().addVectors(
    v1.originalVector,
    v2.originalVector,
  );

  let originPoint;
  if (originSelection === "origin") {
    originPoint = new THREE.Vector3(0, 0, 0);
  } else {
    const pointIndex = parseInt(originSelection.substring(2));
    const p = points[pointIndex];
    originPoint = new THREE.Vector3(p.x, p.y, p.z);
  }

  const name = `Somme(${v1.name}, ${v2.name})`;
  const createdVector = _createVector(
    name,
    originPoint,
    sumVector,
    `Somme de ${v1.name} et ${v2.name}`,
    0x4caf50,
  );

  if (createdVector) {
    const v = createdVector.originalVector;
    displayDiv.textContent = `Vecteur somme créé (${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})`;
  } else {
    displayDiv.textContent = `La somme des vecteurs est un vecteur nul.`;
  }
}

function calculateScalarProduct() {
  const vectorId1 = document.getElementById("dotVectorSelect1").value;
  const vectorId2 = document.getElementById("dotVectorSelect2").value;
  const displayDiv = document.getElementById("scalarProductResult");

  if (vectorId1 === "" || vectorId2 === "") {
    displayDiv.textContent = "Veuillez sélectionner deux vecteurs.";
    return;
  }

  const v1 = vectors.find((v) => v.id == vectorId1);
  const v2 = vectors.find((v) => v.id == vectorId2);
  const dotProduct = v1.originalVector.dot(v2.originalVector);
  displayDiv.textContent = `${v1.name} · ${v2.name} = ${dotProduct.toFixed(3)}`;
}

function calculateVectorProduct() {
  const vectorId1 = document.getElementById("crossVectorSelect1").value;
  const vectorId2 = document.getElementById("crossVectorSelect2").value;
  const originSelection = document.getElementById("crossVectorOrigin").value;
  const displayDiv = document.getElementById("vectorProductResult");

  if (vectorId1 === "" || vectorId2 === "") {
    displayDiv.textContent = "Veuillez sélectionner deux vecteurs.";
    return;
  }

  const v1 = vectors.find((v) => v.id == vectorId1);
  const v2 = vectors.find((v) => v.id == vectorId2);
  const crossVector = new THREE.Vector3().crossVectors(
    v1.originalVector,
    v2.originalVector,
  );

  let originPoint;
  if (originSelection === "origin") {
    originPoint = new THREE.Vector3(0, 0, 0);
  } else {
    const pointIndex = parseInt(originSelection.substring(2));
    const p = points[pointIndex];
    originPoint = new THREE.Vector3(p.x, p.y, p.z);
  }

  const name = `ProdVect(${v1.name}, ${v2.name})`;
  const createdVector = _createVector(
    name,
    originPoint,
    crossVector,
    `Produit vectoriel de ${v1.name} et ${v2.name}`,
    0x2196f3,
  );

  if (createdVector) {
    const v = createdVector.originalVector;
    displayDiv.textContent = `Vecteur produit créé (${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})`;
  } else {
    displayDiv.textContent = `Le produit vectoriel est nul (vecteurs colinéaires).`;
  }
}

function addLineFromEquation() {
  const nameInput = document.getElementById("lineNameFromEquation");
  const name = nameInput.value.trim();
  if (!name) {
    alert("Veuillez donner un nom à votre droite.");
    return;
  }

  const input = document.getElementById("lineEquationInput");
  const lines = input.value.split("\n").filter((l) => l.trim() !== "");
  if (lines.length !== 3) {
    alert("Veuillez fournir 3 équations (une pour x, y, et z).");
    return;
  }

  let startPoint = new THREE.Vector3();
  let directorVector = new THREE.Vector3();

  try {
    lines.forEach((line) => {
      const parts = line.split("=");
      if (parts.length !== 2)
        throw new Error(
          "Format d'équation invalide. Assurez-vous d'avoir un signe '='.",
        );

      const coord = parts[0].trim().toLowerCase();
      let expr = parts[1].trim();

      expr = expr.replace(/(^|\+|-)\s*t/g, (match, sign) => `${sign || ""} 1t`);

      const tMatch = expr.match(/([+-]?\s*\d*\.?\d*)\s*\*?\s*t/);
      const tCoeff = tMatch ? parseFloat(tMatch[1].replace(/\s/g, "")) : 0;

      const constStr = tMatch ? expr.replace(tMatch[0], "").trim() : expr;
      const constant = constStr ? parseFloat(constStr) : 0;

      if (isNaN(constant) || isNaN(tCoeff)) {
        throw new Error(
          `Erreur de lecture des nombres sur la ligne : "${line}"`,
        );
      }

      if (coord === "x") {
        startPoint.x = constant;
        directorVector.x = tCoeff;
      } else if (coord === "y") {
        startPoint.y = constant;
        directorVector.y = tCoeff;
      } else if (coord === "z") {
        startPoint.z = constant;
        directorVector.z = tCoeff;
      }
    });
  } catch (e) {
    alert(
      `Erreur de parsing des équations. Vérifiez le format (ex: x = 2 - 3t).\nErreur: ${e.message}`,
    );
    return;
  }

  if (directorVector.lengthSq() === 0) {
    alert(
      "Le vecteur directeur de la droite est nul. Impossible de créer la droite.",
    );
    return;
  }

  _createStraightLine(name, startPoint, directorVector);

  nameInput.value = "";
}

function displayPlaneEquation() {
  const select = document.getElementById("equationPlaneSelect");
  const displayDiv = document.getElementById("planeEquationDisplay");
  if (!select || !displayDiv) return;
  const planeId = select.value;
  displayDiv.textContent = "";

  if (planeId === "") {
    displayDiv.textContent = "Sélectionnez un plan.";
    return;
  }
  const plane = planes.find((p) => p.id == planeId);
  if (!plane) {
    displayDiv.textContent = "Plan introuvable.";
    return;
  }

  const normal = plane.integerNormal || plane.normal;
  const A = normal.x;
  const B = normal.y;
  const C = normal.z;
  const p0 = plane.pointCoords[0];
  const D = -(A * p0.x + B * p0.y + C * p0.z);

  let equation = "";
  const formatTerm = (coeff, term) => {
    if (Math.abs(coeff) < 1e-6) return "";
    let sign = coeff > 0 ? " + " : " - ";
    let val = parseFloat(Math.abs(coeff).toFixed(2));
    if (val === 1) val = "";
    return `${sign}${val}${term}`;
  };

  let termX = formatTerm(A, "x").substring(3);
  if (termX.startsWith(" - ")) termX = "-" + termX.substring(3);
  equation += termX;

  equation += formatTerm(B, "y");
  equation += formatTerm(C, "z");

  if (Math.abs(D) > 1e-6) {
    const dVal = parseFloat(Math.abs(D).toFixed(2));
    equation += D > 0 ? ` + ${dVal}` : ` - ${dVal}`;
  }

  equation = equation.replace(/^\s*\+\s*/, "");
  displayDiv.textContent = equation.trim() + " = 0";
}

function displayLineEquation() {
  const select = document.getElementById("equationLineSelect");
  const displayDiv = document.getElementById("lineEquationDisplay");
  if (!select || !displayDiv) return;

  const lineId = select.value;

  if (lineId === "") {
    displayDiv.innerHTML = "Sélectionnez une droite.";
    return;
  }

  const line = straightLinesData.find((l) => l.id == lineId);
  if (!line) {
    displayDiv.innerHTML = "Droite introuvable.";
    return;
  }

  const P0 = line.startPoint || line.points[0];
  const V = line.directorVector;

  const formatCoord = (val) => parseFloat(val.toFixed(2));
  const formatT = (val) => {
    if (Math.abs(val) < 1e-6) return "";
    const sign = val > 0 ? "+" : "-";
    const absVal = parseFloat(Math.abs(val).toFixed(2));
    return ` ${sign} ${absVal === 1 ? "" : absVal}t`;
  };

  const equationX = `x = ${formatCoord(P0.x)}${formatT(V.x)}`;
  const equationY = `y = ${formatCoord(P0.y)}${formatT(V.y)}`;
  const equationZ = `z = ${formatCoord(P0.z)}${formatT(V.z)}`;

  displayDiv.innerHTML = `${equationX}<br>${equationY}<br>${equationZ}`;
}
function clearAllPoints() {
  if (
    !confirm(
      "Voulez-vous vraiment effacer tous les points ? Cela effacera aussi les lignes, plans et vecteurs associés.",
    )
  )
    return;

  pointMeshes.forEach((mesh) => scene.remove(mesh));
  pointMeshes = [];

  pointLabels.forEach((sprite) => scene.remove(sprite));
  pointLabels = [];

  points = [];

  clearStraightLines();
  clearAllPlanes();
  clearAllVectors();

  auxiliaryObjects.forEach((aux) => scene.remove(aux.mesh));
  auxiliaryObjects = [];

  updatePointList();
  updateSelects();
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

function onMouseDown(event) {
  wasDragged = false; // Réinitialise le flag à chaque clic
  if (event.button === 0) isDragging = true;
  else if (event.button === 2) isPanning = true;
  previousMousePosition = { x: event.clientX, y: event.clientY };
}

function onMouseMove(event) {
  const deltaX = event.clientX - previousMousePosition.x;
  const deltaY = event.clientY - previousMousePosition.y;

  if (isDragging || isPanning) {
    // Si le mouvement dépasse un petit seuil, on considère que c'est un glisser
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      wasDragged = true;
    }
  }

  if (isDragging) {
    cameraRotation.y += deltaX * 0.005;
    cameraRotation.x += deltaY * 0.005;
    cameraRotation.x = Math.max(
      -Math.PI / 2 + 0.1,
      Math.min(Math.PI / 2 - 0.1, cameraRotation.x),
    );
    updateCameraPosition();
  } else if (isPanning) {
    panCamera(deltaX, deltaY);
  }
  previousMousePosition = { x: event.clientX, y: event.clientY };
}

function onMouseUp() {
  isDragging = false;
  isPanning = false;
}

function onWheel(event) {
  event.preventDefault();
  zoomCamera(event.deltaY * 0.01);
}

function onTouchStart(event) {
  event.preventDefault();
  if (event.touches.length === 1) {
    isDragging = true;
    previousMousePosition = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  } else if (event.touches.length === 2) {
    isPanning = true;
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    initialTouchDistance = Math.hypot(
      touch1.clientX - touch2.clientX,
      touch1.clientY - touch2.clientY,
    );
    initialPanMidpoint = {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }
}

function onTouchMove(event) {
  event.preventDefault();
  if (event.touches.length === 1 && isDragging) {
    const deltaX = event.touches[0].clientX - previousMousePosition.x;
    const deltaY = event.touches[0].clientY - previousMousePosition.y;
    cameraRotation.y += deltaX * 0.005;
    cameraRotation.x += deltaY * 0.005;
    cameraRotation.x = Math.max(
      -Math.PI / 2 + 0.1,
      Math.min(Math.PI / 2 - 0.1, cameraRotation.x),
    );
    updateCameraPosition();
    previousMousePosition = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  } else if (event.touches.length === 2 && isPanning) {
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    const currentTouchDistance = Math.hypot(
      touch1.clientX - touch2.clientX,
      touch1.clientY - touch2.clientY,
    );
    const zoomFactor = initialTouchDistance / currentTouchDistance;
    zoomCamera((zoomFactor - 1) * 0.9);
    initialTouchDistance = currentTouchDistance;
    const currentMidpoint = {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
    const deltaX = currentMidpoint.x - initialPanMidpoint.x;
    const deltaY = currentMidpoint.y - initialPanMidpoint.y;
    panCamera(deltaX, deltaY);
    initialPanMidpoint = currentMidpoint;
  }
}

function onTouchEnd() {
  isDragging = false;
  isPanning = false;
  initialTouchDistance = -1;
  initialPanMidpoint = null;
}

function calculatePointPlaneDistance() {
  const pointIdx = document.getElementById("calcPointSelect").value;
  const planeId = document.getElementById("calcPlaneSelect1").value;
  const displayDiv = document.getElementById("calcResultDisplay1");

  if (pointIdx === "" || planeId === "") {
    displayDiv.textContent = "Veuillez sélectionner un point et un plan.";
    return;
  }

  const point = points[pointIdx];
  const plane = planes.find((p) => p.id == planeId);

  const pVector = new THREE.Vector3(point.x, point.y, point.z);

  const normal = plane.normal;
  const p0_plane = plane.mesh.position;
  const D = -normal.dot(p0_plane);

  const distance = Math.abs(normal.dot(pVector) + D) / normal.length();

  const signedDist = (normal.dot(pVector) + D) / normal.length();
  const projectedPoint = pVector
    .clone()
    .sub(normal.clone().multiplyScalar(signedDist / normal.length()));

  const H = projectedPoint;
  const H_text = `(${H.x.toFixed(2)}, ${H.y.toFixed(2)}, ${H.z.toFixed(2)})`;

  displayDiv.innerHTML = `Distance = ${distance.toFixed(3)}<br>Projeté H = ${H_text}`;

  const derivationInfo = {
    type: "projection",
    pointIndex: parseInt(pointIdx),
    planeId: parseInt(planeId),
  };
  const pointName = `H_proj_${point.name}_sur_${plane.name}`;
  _createPoint(pointName, H.x, H.y, H.z, 0x00ced1, derivationInfo);

  const segmentGeometry = new THREE.BufferGeometry().setFromPoints([
    pVector,
    H,
  ]);
  const segmentMaterial = new THREE.LineDashedMaterial({
    color: 0xaaaaaa,
    dashSize: 0.3,
    gapSize: 0.2,
  });
  const projectionSegment = new THREE.Line(segmentGeometry, segmentMaterial);
  projectionSegment.computeLineDistances();
  scene.add(projectionSegment);

  auxiliaryObjects.push({
    mesh: projectionSegment,
    derivedFrom: derivationInfo,
  });
}

function calculateLinePlaneIntersection() {
  const lineId = document.getElementById("calcLineSelect").value;
  const planeId = document.getElementById("calcPlaneSelect2").value;
  const displayDiv = document.getElementById("calcResultDisplay2");

  if (lineId === "" || planeId === "") {
    displayDiv.textContent = "Veuillez sélectionner une droite et un plan.";
    return;
  }

  const line = straightLinesData.find((l) => l.id == lineId);
  const plane = planes.find((p) => p.id == planeId);

  const P0 = line.startPoint;
  const V = line.directorVector;
  const N = plane.normal;
  const planeP0 = plane.mesh.position;

  const dotNV = N.dot(V);

  if (Math.abs(dotNV) < 1e-6) {
    const dist = N.dot(new THREE.Vector3().subVectors(P0, planeP0));
    if (Math.abs(dist) < 1e-6) {
      displayDiv.textContent = "La droite est contenue dans le plan.";
    } else {
      displayDiv.textContent =
        "La droite est parallèle au plan (pas d'intersection).";
    }
    return;
  }

  const t = N.dot(new THREE.Vector3().subVectors(planeP0, P0)) / dotNV;

  const intersectionPoint = P0.clone().add(V.clone().multiplyScalar(t));
  const I = intersectionPoint;
  displayDiv.textContent = `Point d'intersection : (${I.x.toFixed(2)}, ${I.y.toFixed(2)}, ${I.z.toFixed(2)})`;

  const pointName = `I_${line.name}_${plane.name}`;
  _createPoint(pointName, I.x, I.y, I.z, 0xf44336);
}

function calculatePlanePlaneIntersection() {
  const planeId1 = document.getElementById("calcPlaneSelect3").value;
  const planeId2 = document.getElementById("calcPlaneSelect4").value;
  const displayDiv = document.getElementById("calcResultDisplay3");

  if (planeId1 === "" || planeId2 === "") {
    displayDiv.textContent = "Veuillez sélectionner deux plans.";
    return;
  }
  if (planeId1 === planeId2) {
    displayDiv.textContent = "Veuillez sélectionner deux plans différents.";
    return;
  }

  const p1 = planes.find((p) => p.id == planeId1);
  const p2 = planes.find((p) => p.id == planeId2);

  const n1 = p1.normal;
  const n2 = p2.normal;

  const V = new THREE.Vector3().crossVectors(n1, n2);

  if (V.lengthSq() < 1e-8) {
    const pointOnP1 = p1.mesh.position;
    const vecToPoint = new THREE.Vector3().subVectors(
      pointOnP1,
      p2.mesh.position,
    );
    const distance = Math.abs(vecToPoint.dot(n2));

    if (distance < 1e-6) {
      displayDiv.textContent = "Les plans sont confondus.";
    } else {
      displayDiv.textContent = "Les plans sont strictement parallèles.";
    }
    return;
  }

  const d1 = -n1.dot(p1.mesh.position);
  const d2 = -n2.dot(p2.mesh.position);

  let P0;

  const detXY = n1.x * n2.y - n1.y * n2.x;
  if (Math.abs(detXY) > 1e-6) {
    const x = (-d1 * n2.y + d2 * n1.y) / detXY;
    const y = (-d2 * n1.x + d1 * n2.x) / detXY;
    P0 = new THREE.Vector3(x, y, 0);
  } else {
    const detXZ = n1.x * n2.z - n1.z * n2.x;
    if (Math.abs(detXZ) > 1e-6) {
      const x = (-d1 * n2.z + d2 * n1.z) / detXZ;
      const z = (-d2 * n1.x + d1 * n2.x) / detXZ;
      P0 = new THREE.Vector3(x, 0, z);
    } else {
      const detYZ = n1.y * n2.z - n1.z * n2.y;
      const y = (-d1 * n2.z + d2 * n1.z) / detYZ;
      const z = (-d2 * n1.y + d1 * n2.y) / detYZ;
      P0 = new THREE.Vector3(0, y, z);
    }
  }

  const derivationInfo = {
    type: "planePlaneIntersection",
    planeId1: parseInt(planeId1),
    planeId2: parseInt(planeId2),
  };
  const lineName = `D_inter_${p1.name}_${p2.name}`;
  _createStraightLine(lineName, P0, V.clone(), [], 0xff9800, derivationInfo);

  const formatCoord = (val) => parseFloat(val.toFixed(2));
  const formatT = (val) => {
    if (Math.abs(val) < 1e-6) return "";
    const sign = val > 0 ? "+" : "-";
    const absVal = parseFloat(Math.abs(val).toFixed(2));
    const coeffStr = absVal === 1 ? "" : absVal;
    return ` ${sign} ${coeffStr}t`;
  };

  const eqX = `x = ${formatCoord(P0.x)}${formatT(V.x)}`;
  const eqY = `y = ${formatCoord(P0.y)}${formatT(V.y)}`;
  const eqZ = `z = ${formatCoord(P0.z)}${formatT(V.z)}`;

  displayDiv.innerHTML = `${eqX}<br>${eqY}<br>${eqZ}`;
}

function calculateLineLineIntersection() {
  const lineId1 = document.getElementById("calcLineSelect1").value;
  const lineId2 = document.getElementById("calcLineSelect2").value;
  const displayDiv = document.getElementById("calcResultDisplay4");

  if (lineId1 === "" || lineId2 === "") {
    displayDiv.textContent = "Veuillez sélectionner deux droites.";
    return;
  }
  if (lineId1 === lineId2) {
    displayDiv.textContent = "Veuillez sélectionner deux droites différentes.";
    return;
  }

  const line1 = straightLinesData.find((l) => l.id == lineId1);
  const line2 = straightLinesData.find((l) => l.id == lineId2);

  const p1 = line1.startPoint;
  const v1 = line1.directorVector;
  const p2 = line2.startPoint;
  const v2 = line2.directorVector;

  const v1_x_v2 = new THREE.Vector3().crossVectors(v1, v2);
  const p1p2 = new THREE.Vector3().subVectors(p2, p1);

  // Cas 1 : Droites parallèles ou confondues
  if (v1_x_v2.lengthSq() < 1e-8) {
    const p1p2_x_v1 = new THREE.Vector3().crossVectors(p1p2, v1);
    if (p1p2_x_v1.lengthSq() < 1e-8) {
      displayDiv.textContent = "Les droites sont confondues.";
    } else {
      displayDiv.textContent = "Les droites sont parallèles et distinctes.";
    }
    return;
  }

  // Cas 2 : Droites non coplanaires (gauches)
  const tripleProduct = p1p2.dot(v1_x_v2);
  if (Math.abs(tripleProduct) > 1e-6) {
    displayDiv.textContent = "Les droites sont non coplanaires (gauches).";
    return;
  }

  // Cas 3 : Droites sécantes (coplanaires et non parallèles)
  // On résout p1 + t*v1 = p2 + s*v2 => t*v1 - s*v2 = p2 - p1
  const p2p1 = new THREE.Vector3().subVectors(p1, p2);
  const t =
    new THREE.Vector3().crossVectors(p2p1, v2).length() / v1_x_v2.length();

  // On doit vérifier le signe de t
  const testVec = new THREE.Vector3().crossVectors(v2, v1_x_v2);
  if (p2p1.dot(testVec) < 0) {
    // t est négatif
    var intersectionPoint = p1.clone().add(v1.clone().multiplyScalar(-t));
  } else {
    // t est positif
    var intersectionPoint = p1.clone().add(v1.clone().multiplyScalar(t));
  }

  const I = intersectionPoint;
  displayDiv.textContent = `Sécantes au point I: (${I.x.toFixed(2)}, ${I.y.toFixed(2)}, ${I.z.toFixed(2)})`;
  const pointName = `I_${line1.name}_${line2.name}`;
  _createPoint(pointName, I.x, I.y, I.z, 0xf44336);
}

function removeDependents(parentType, parentId) {
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    if (p.derivedFrom) {
      const d = p.derivedFrom;
      const isDependent =
        (d.pointIndex === parentId && parentType === "point") ||
        (d.lineId === parentId && parentType === "line") ||
        (d.planeId === parentId && parentType === "plane") ||
        (d.planeId1 === parentId && parentType === "plane") ||
        (d.planeId2 === parentId && parentType === "plane");

      if (isDependent) {
        removePoint(i);
      }
    }
  }

  for (let i = straightLinesData.length - 1; i >= 0; i--) {
    const line = straightLinesData[i];
    if (line.derivedFrom) {
      const d = line.derivedFrom;
      const isDependent =
        (d.planeId1 === parentId && parentType === "plane") ||
        (d.planeId2 === parentId && parentType === "plane");

      if (isDependent) {
        removeStraightLine(line.id);
      }
    }
  }

  for (let i = auxiliaryObjects.length - 1; i >= 0; i--) {
    const aux = auxiliaryObjects[i];
    if (aux.derivedFrom) {
      const d = aux.derivedFrom;
      const isDependent =
        (d.pointIndex === parentId && parentType === "point") ||
        (d.planeId === parentId && parentType === "plane");

      if (isDependent) {
        scene.remove(aux.mesh);
        auxiliaryObjects.splice(i, 1);
      }
    }
  }
}

function panCamera(deltaX, deltaY) {
  const panSpeed = 0.02;
  const right = new THREE.Vector3();
  camera.getWorldDirection(right);
  const up = camera.up.clone();
  right.cross(up).normalize();
  cameraTarget.addScaledVector(right, -deltaX * panSpeed);
  cameraTarget.addScaledVector(up, deltaY * panSpeed);
  updateCameraPosition();
}

function zoomCamera(delta) {
  cameraDistance += delta;
  cameraDistance = Math.max(3, Math.min(50, cameraDistance));
  updateCameraPosition();
}

/**
 * Réinitialise la caméra à sa position par défaut et met à jour l'état des boutons.
 * @param {HTMLElement} [buttonElement=null] - L'élément bouton qui a déclenché l'action (optionnel).
 */
function resetCamera(buttonElement = null) {
  // Appelle simplement setCameraView avec la vue 'isometric'.
  setCameraView("isometric", buttonElement);
}

/**
 * Définit la vue de la caméra sur une perspective prédéfinie et met à jour l'état des boutons.
 * @param {string} view - Le type de vue ('top', 'front', 'side', 'isometric').
 * @param {HTMLElement} [buttonElement=null] - L'élément bouton qui a déclenché l'action (optionnel).
 */
function setCameraView(view, buttonElement = null) {
  cameraTarget.set(0, 0, 0);
  cameraDistance = 15;

  switch (view) {
    case "top":
      cameraRotation.x = Math.PI / 2 - 0.001; // Presque PI/2 pour éviter le blocage du gimbal
      cameraRotation.y = 0;
      break;
    case "front":
      cameraRotation.x = 0;
      cameraRotation.y = 0;
      break;
    case "side":
      cameraRotation.x = 0;
      cameraRotation.y = Math.PI / 2;
      break;
    case "isometric": // La logique de réinitialisation est maintenant centralisée ici
      cameraRotation.x = 0.5;
      cameraRotation.y = 0.5;
      break;
    default:
      // Si la vue n'est pas reconnue, on applique la vue isométrique par défaut.
      console.warn(`Vue "${view}" non reconnue, retour à la vue isométrique.`);
      cameraRotation.x = 0.5;
      cameraRotation.y = 0.5;
      break;
  }
  updateCameraPosition();
  toggleButtonState(buttonElement, view);
}
/**
 * Gère l'état actif/inactif des boutons de vue de caméra.
 * Désactive tous les boutons de vue (top, front, side, reset/isometric) et active le bouton passé en argument.
 * @param {HTMLElement} [activeButton=null] - Le bouton à marquer comme "actif".
 * @param {string} [viewType=null] - Le type de vue correspondant au bouton actif (ex: 'top', 'isometric').
 */
function toggleButtonState(activeButton = null, viewType = null) {
  // Sélectionne tous les boutons de caméra, y compris le bouton de réinitialisation.
  const viewButtons = document.querySelectorAll("#cameraControls .camera-btn");
  viewButtons.forEach((btn) => {
    btn.classList.remove("active"); // Retire la classe 'active' de TOUS les boutons
  });

  // Si un bouton est spécifié, lui ajouter la classe 'active'
  if (activeButton) {
    activeButton.classList.add("active");
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const spritesToScale = [...axisLabels, ...pointLabels];

  if (spritesToScale.length > 0) {
    const scaleFactor = 0.12;
    spritesToScale.forEach((sprite) => {
      const distance = camera.position.distanceTo(sprite.position);
      const desiredScale = distance * scaleFactor;
      sprite.scale.set(desiredScale, desiredScale * 0.5, 1);
    });
  }
  renderer.render(scene, camera);
}

function _createPoint(name, x, y, z, color = 0xff6b35, derivedFrom = null) {
  const point = { name, x, y, z, derivedFrom };
  points.push(point);

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 16, 16),
    new THREE.MeshPhongMaterial({ color: color }),
  );
  sphere.position.set(x, y, z);
  scene.add(sphere);
  pointMeshes.push(sphere);

  // --- AJOUT POUR RAYCASTING ---
  sphere.userData = {
    type: "point",
    data: point,
    originalColor: sphere.material.color.clone(),
  };
  // --- FIN AJOUT ---

  const pointLabel = createTextLabel(name);
  pointLabel.position.set(x, y + 0.35, z);
  scene.add(pointLabel);
  pointLabels.push(pointLabel);
  point.labelSprite = pointLabel;

  updatePointList();
  updateSelects();

  return point;
}

function _createStraightLine(
  name,
  startPoint,
  directorVector,
  basePoints = [],
  color = 0x00ced1,
  derivedFrom = null,
) {
  const normalizedDirection = directorVector.clone().normalize();
  const lineLength = 100;
  const visualStart = new THREE.Vector3().addVectors(
    startPoint,
    normalizedDirection.clone().multiplyScalar(-lineLength),
  );
  const visualEnd = new THREE.Vector3().addVectors(
    startPoint,
    normalizedDirection.clone().multiplyScalar(lineLength),
  );

  const geometry = new THREE.BufferGeometry().setFromPoints([
    visualStart,
    visualEnd,
  ]);
  const material = new THREE.LineBasicMaterial({ color: color });
  const lineMesh = new THREE.Line(geometry, material);

  const newStraightLine = {
    id: nextStraightLineId++,
    name: name,
    points: basePoints,
    mesh: lineMesh,
    isVisible: true,
    directorVector: directorVector,
    startPoint: startPoint,
    derivedFrom: derivedFrom,
  };
  straightLinesData.push(newStraightLine);

  // --- AJOUT POUR RAYCASTING ---
  lineMesh.userData = {
    type: "line",
    data: newStraightLine,
    originalColor: lineMesh.material.color.clone(),
  };
  // --- FIN AJOUT ---

  scene.add(lineMesh);
  updateStraightLineList();
  updateSelects();

  return newStraightLine;
}

// --- NOUVELLES FONCTIONS POUR LE RAYCASTING ET LA SÉLECTION 3D ---

/**
 * Gère le clic sur la scène 3D pour la sélection d'objets.
 * @param {MouseEvent} event
 */
function onObjectClick(event) {
  // Si un glissement a eu lieu entre mousedown et mouseup, on ne sélectionne pas.
  if (wasDragged) return;

  event.preventDefault();

  // Calcule les coordonnées de la souris en format normalisé (-1 à +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Lance un rayon depuis la caméra
  raycaster.setFromCamera(mouse, camera);

  // Crée une liste d'objets intersectables
  const selectableObjects = [
    ...pointMeshes,
    ...straightLinesData.map((l) => l.mesh),
    ...planes.map((p) => p.mesh),
    ...vectors.map((v) => v.arrowHelper), // ArrowHelper est un groupe, l'intersection se fera sur ses enfants
  ];

  const intersects = raycaster.intersectObjects(selectableObjects, true); // Le 'true' est crucial pour les objets groupés

  if (intersects.length > 0) {
    // On a touché un objet
    const firstIntersected = intersects[0].object;
    handleSelection(firstIntersected);
  } else {
    // On a cliqué dans le vide
    deselectCurrentObject();
  }
}

/**
 * Gère la logique de sélection d'un maillage 3D.
 * @param {THREE.Mesh} mesh L'objet 3D qui a été cliqué.
 */
function handleSelection(mesh) {
  // Si on clique sur un objet qui n'a pas de userData (comme la grille), on l'ignore.
  if (!mesh.userData.type) return;

  // Si on clique sur une autre partie du même vecteur déjà sélectionné, on ne fait rien.
  if (
    selectedObject &&
    selectedObject.parent === mesh.parent &&
    mesh.userData.type === "vector"
  ) {
    return;
  }

  // Si on clique sur le même objet, on ne fait rien.
  if (selectedObject === mesh) return;

  // Sinon, on désélectionne l'ancien objet et on sélectionne le nouveau.
  deselectCurrentObject();

  selectedObject = mesh;

  // Logique de mise en surbrillance
  if (selectedObject.userData.type === "vector") {
    const arrow = selectedObject.parent; // C'est l'ArrowHelper
    if (arrow && arrow.isArrowHelper) {
      // .isArrowHelper est une propriété native de ArrowHelper
      arrow.setColor(HIGHLIGHT_COLOR);
    }
  } else if (selectedObject.userData.type === "plane") {
    selectedObject.material.color.set(HIGHLIGHT_COLOR);
    selectedObject.material.opacity = 0.75; // Rend le plan plus opaque
  } else {
    // Pour les points et les lignes
    selectedObject.material.color.set(HIGHLIGHT_COLOR);
  }
  // Mettre à jour le panneau de contrôle avec les infos de l'objet
  updatePanelForSelection(selectedObject.userData);
}

/**
 * Réinitialise l'apparence de l'objet actuellement sélectionné.
 */
function deselectCurrentObject() {
  if (!selectedObject) return;

  if (selectedObject.userData.type === "vector") {
    const arrow = selectedObject.parent;
    if (arrow && arrow.isArrowHelper) {
      // Utiliser la couleur originale stockée sur l'enfant cliqué (line ou cone)
      arrow.setColor(selectedObject.userData.originalColor);
    }
  } else if (selectedObject.userData.type === "plane") {
    selectedObject.material.color.copy(selectedObject.userData.originalColor);
    selectedObject.material.opacity = 0.5; // Opacité par défaut
  } else {
    // Pour les points et les lignes
    selectedObject.material.color.copy(selectedObject.userData.originalColor);
  }

  selectedObject = null;
}

/**
 * Met à jour le panneau de contrôle en fonction de l'objet sélectionné.
 * @param {object} userData - L'objet userData de l'élément 3D sélectionné.
 */
function updatePanelForSelection(userData) {
  const { type, data } = userData;

  switch (type) {
    case "point":
      const pointIndex = points.indexOf(data);
      if (pointIndex > -1) {
        editPoint(pointIndex);
      }
      break;

    case "line":
      document.getElementById("equationLineSelect").value = data.id;
      displayLineEquation();
      const lineSection = document
        .getElementById("equationLineSelect")
        .closest(".section.collapsible");
      if (lineSection.classList.contains("collapsed")) {
        lineSection.classList.remove("collapsed");
      }
      document
        .getElementById("equationLineSelect")
        .scrollIntoView({ behavior: "smooth", block: "center" });
      break;

    case "plane":
      document.getElementById("equationPlaneSelect").value = data.id;
      displayPlaneEquation();
      const planeSection = document
        .getElementById("equationPlaneSelect")
        .closest(".section.collapsible");
      if (planeSection.classList.contains("collapsed")) {
        planeSection.classList.remove("collapsed");
      }
      document
        .getElementById("equationPlaneSelect")
        .scrollIntoView({ behavior: "smooth", block: "center" });
      break;

    case "vector":
      editVector(data.id);
      break;
  }
}

// --- FIN NOUVELLES FONCTIONS DE RAYCASTING ---

// --- Fonctions de modification (complètes) ---

function editPoint(index) {
  const p = points[index];
  document.getElementById("pointName").value = p.name;
  document.getElementById("coordX").value = p.x;
  document.getElementById("coordY").value = p.y;
  document.getElementById("coordZ").value = p.z;
  document.getElementById("editPointIndex").value = index;

  document.getElementById("addPointBtn").style.display = "none";
  document.getElementById("updatePointBtn").style.display = "block";
  document.getElementById("cancelEditBtn").style.display = "block";

  const pointSection = document
    .getElementById("pointList")
    .closest(".section.collapsible");
  if (pointSection.classList.contains("collapsed")) {
    pointSection.classList.remove("collapsed");
  }
  document
    .getElementById("pointName")
    .scrollIntoView({ behavior: "smooth", block: "center" });
}

function updatePoint() {
  const index = document.getElementById("editPointIndex").value;
  if (index === "") return;

  const name = document.getElementById("pointName").value.trim();
  const x = parseFloat(document.getElementById("coordX").value);
  const y = parseFloat(document.getElementById("coordY").value);
  const z = parseFloat(document.getElementById("coordZ").value);
  if (!name || isNaN(x) || isNaN(y) || isNaN(z)) {
    alert("Données invalides.");
    return;
  }

  const point = points[index];
  point.name = name;
  point.x = x;
  point.y = y;
  point.z = z;

  pointMeshes[index].position.set(x, y, z);
  pointLabels[index].position.set(x, y + 0.35, z);

  updatePointList();
  updateSelects();
  cancelEdit();
}

function cancelEdit() {
  document.getElementById("pointName").value = "";
  document.getElementById("coordX").value = "";
  document.getElementById("coordY").value = "";
  document.getElementById("coordZ").value = "";
  document.getElementById("editPointIndex").value = "";

  document.getElementById("addPointBtn").style.display = "block";
  document.getElementById("updatePointBtn").style.display = "none";
  document.getElementById("cancelEditBtn").style.display = "none";
}

function updateVector() {
  const vectorId = document.getElementById("editVectorId").value;
  if (vectorId === "") return;

  const vectorToUpdate = vectors.find((v) => v.id == vectorId);
  if (!vectorToUpdate) return;

  const name = document.getElementById("vectorNameCoords").value.trim();
  const vx = parseFloat(document.getElementById("vectorCoordX").value);
  const vy = parseFloat(document.getElementById("vectorCoordY").value);
  const vz = parseFloat(document.getElementById("vectorCoordZ").value);
  const originSelection = document.getElementById("vectorOriginPoint").value;

  if (!name || isNaN(vx) || isNaN(vy) || isNaN(vz) || !originSelection) {
    alert("Veuillez remplir tous les champs du vecteur.");
    return;
  }

  let startPoint, originDesc;
  if (originSelection === "origin") {
    startPoint = new THREE.Vector3(0, 0, 0);
    originDesc = "Origine (0,0,0)";
  } else {
    const pointIndex = parseInt(originSelection.substring(2));
    const p = points[pointIndex];
    startPoint = new THREE.Vector3(p.x, p.y, p.z);
    originDesc = `Point ${p.name}`;
  }

  const newVector = new THREE.Vector3(vx, vy, vz);

  vectorToUpdate.name = name;
  vectorToUpdate.origin = startPoint;
  vectorToUpdate.originalVector = newVector;
  vectorToUpdate.description = `Coordonnées, origine: ${originDesc}`;

  const arrow = vectorToUpdate.arrowHelper;
  arrow.position.copy(startPoint);
  arrow.setDirection(newVector.clone().normalize());
  arrow.setLength(newVector.length(), 0.4, 0.2);

  updateVectorList();
  updateSelects();
  cancelVectorEdit();
}

function cancelVectorEdit() {
  document.getElementById("vectorNameCoords").value = "";
  document.getElementById("vectorCoordX").value = "";
  document.getElementById("vectorCoordY").value = "";
  document.getElementById("vectorCoordZ").value = "";
  document.getElementById("vectorOriginPoint").value = "origin";
  document.getElementById("editVectorId").value = "";

  document.getElementById("addVectorFromPointsBtn").style.display = "block";
  document.getElementById("addVectorFromCoordsBtn").style.display = "block";
  document.getElementById("updateVectorBtn").style.display = "none";
  document.getElementById("cancelVectorEditBtn").style.display = "none";
}

// Activer la fonctionnalité de sections pliables
document.addEventListener("DOMContentLoaded", () => {
  const headers = document.querySelectorAll(".section-header");
  headers.forEach((header) => {
    header.addEventListener("click", () => {
      const section = header.closest(".section");
      section.classList.toggle("collapsed");
    });
  });
  resetCamera();
});

init();
