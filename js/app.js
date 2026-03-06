// SECTION 3 : VARIABLES GLOBALES ET INITIALISATION
// =====================================================================================

var scene, camera, renderer, geometryManager;
var isDragging = false,
  isPanning = false,
  wasDragged = false;
var previousMousePosition = { x: 0, y: 0 };
var cameraRotation = { x: 0.5, y: 0.5 };
var cameraDistance = 15;
var cameraTarget = new THREE.Vector3(0, 0, 0);
var initialPinchDistance = 0;
var panelOpen = false;
/* global THREE */

var nextStraightLineId = 0;
var nextPlaneId = 0;
var nextVectorId = 0;
var raycaster,
  mouse,
  selectedObjectInstance = null;
// let wasPanningOrZooming = false; // Pour distinguer un geste caméra d'un tap
var currentConstructionObjects = [];
var splashTimer = null;
var blockNextClick = false; // Variable pour bloquer le "clic fantôme" sur mobile
const HIGHLIGHT_COLOR = 0xffcc00; // Jaune vif pour la surbrillance
var touchStartPosition = { x: 0, y: 0 };
var transformControl;
var isGizmoDragging = false;
var lastTooltipX = 0;
var lastTooltipY = 0;

const swipeState = {
  isSwiping: false,
  lock: null,
  startX: 0,
  startY: 0,
  currentX: 0, // NOUVEAU : stocke la position actuelle
  startTime: 0, // NOUVEAU : pour calculer la vitesse
  panelWidth: 0, // NOUVEAU : pour éviter de recalculer
};

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  return b === 0 ? a : gcd(b, a % b);
}

function gcdOfThree(a, b, c) {
  return gcd(gcd(a, b), c);
}

function init() {
  // 1. Initialisation de base (Scène, Caméra, Rendu)
  scene = new THREE.Scene();
  geometryManager = new GeometryManager(scene);
  scene.background = new THREE.Color(0xf0f0f0);
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("container").appendChild(renderer.domElement);

  // 2. Lumières
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(10, 15, 10);
  scene.add(directionalLight);

  // 3. Aides visuelles (Axes et Grille)
  // createAxes();
  // const gridHelper = new THREE.GridHelper(20, 20, 0xcccccc, 0xe0e0e0);
  // On place le quadrillage en arrière-plan
  // gridHelper.renderOrder = -1;
  // gridHelper.material.depthTest = false;
  // scene.add(gridHelper);
  initTheme(); // Cela va créer la grille, les axes et définir la couleur de fond
  // ============================================================
  // 4. CORRECTION GIZMO (TransformControls)
  // ============================================================
  transformControl = new THREE.TransformControls(camera, renderer.domElement);

  // A. Écouteur : Quand on commence ou finit de bouger le Gizmo
  transformControl.addEventListener("dragging-changed", function (event) {
    isGizmoDragging = event.value;

    if (isGizmoDragging) {
      // DÉBUT du déplacement
      isDragging = false;
      isPanning = false;
    } else {
      // FIN du déplacement (relâchement de la souris)

      // --- AJOUT STEP 3 : On valide mathématiquement le mouvement ---
      finalizeGizmoMovement();
      // -------------------------------------------------------------

      // NOTE : finalizeGizmoMovement appelle déjà updateAllUI() et saveState()
      // donc pas besoin de le refaire ici.

      blockNextClick = true;
      setTimeout(() => {
        blockNextClick = false;
      }, 100);
    }
  });

  // B. Écouteur : Pendant que l'objet bouge (Mise à jour temps réel)
  transformControl.addEventListener("change", function () {
    // On ne fait rien si aucun objet n'est sélectionné
    if (!selectedObjectInstance) return;

    // Cette fonction met à jour les coordonnées JS et les inputs du formulaire
    syncDataFromGizmo();
    //Met à jour l'info-bulle en temps réel
    updateTooltipFromGizmo();
  });

  scene.add(transformControl);
  // ============================================================

  // 5. Reste de l'initialisation
  setupEventListeners();

  // Keyboard shortcuts
  window.addEventListener("keydown", function (e) {
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.tagName === "SELECT"
    )
      return;

    if (e.key.toLowerCase() === "p") {
      const ptInput = document.getElementById("pointName");
      if (ptInput) ptInput.focus();
      e.preventDefault();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      if (selectedObjectInstance) {
        if (selectedObjectInstance instanceof Point) {
          const idx = geometryManager.points.indexOf(selectedObjectInstance);
          if (idx !== -1) removePoint(idx);
        } else if (selectedObjectInstance instanceof Vector) {
          removeVectorById(selectedObjectInstance.id);
        } else if (selectedObjectInstance instanceof Line3D) {
          removeStraightLineById(selectedObjectInstance.id);
        } else if (selectedObjectInstance instanceof Plane) {
          removePlaneById(selectedObjectInstance.id);
        }
      }
    }
  });

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Valeurs par défaut pour les équations
  document.getElementById("lineEquationInput").value =
    "x = 1 + 2t\ny = -3 + 3t\nz = 4 - 5t";
  document.getElementById("planeEquationInput").value = "2x - y + 3z - 4 = 0";

  document
    .getElementById("vectorOriginPoint")
    .addEventListener("change", function () {
      const selectedValue = this.value;

      // 1. Si on choisit l'Origine (0,0,0)
      if (selectedValue === "origin") {
        document.getElementById("vectorOriginX").value = "0";
        document.getElementById("vectorOriginY").value = "0";
        document.getElementById("vectorOriginZ").value = "0";
      }
      // 2. Si on choisit un Point existant (A, B, C...)
      else if (selectedValue !== "") {
        const pointIndex = parseInt(selectedValue);
        const p = geometryManager.points[pointIndex];

        if (p) {
          // Remplissage automatique des champs (Attention à l'inversion Y/Z pour l'UI)
          document.getElementById("vectorOriginX").value = formatNumber(
            p.position.x,
          );
          document.getElementById("vectorOriginY").value = formatNumber(
            p.position.z,
          ); // Profondeur (UI Y)
          document.getElementById("vectorOriginZ").value = formatNumber(
            p.position.y,
          ); // Hauteur (UI Z)
        }
      }
    });
  // Lancement
  updateCameraPosition();
  animate();
  updateAllUI();
  saveState();
  document.getElementById("lineEqPointX").value = "";
  document.getElementById("lineEqPointY").value = "";
  document.getElementById("lineEqPointZ").value = "";
  document.getElementById("lineEquationPointSelect").value = "";
}

function formatNumber(value, decimalPlaces = 2) {
  if (typeof value !== "number" || isNaN(value)) {
    return value; // Retourne la valeur telle quelle si ce n'est pas un nombre
  }
  // Vérifie si la valeur est "proche" d'un entier
  if (Math.abs(value - Math.round(value)) < 1e-6) {
    return Math.round(value).toString();
  }
  return value.toFixed(decimalPlaces);
}

function createGenericTextLabel(text) {
  // 1. Création et mesure (identique à l'étape précédente)
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  const fontSize = 96;
  const font = "Bold " + fontSize + "px Arial";
  tempCtx.font = font;

  const metrics = tempCtx.measureText(text);
  const textWidth = metrics.width;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  // Largeur dynamique
  canvas.width = Math.ceil(Math.max(512, textWidth + 40));
  canvas.height = 256;

  // 2. Dessin
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = font;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineWidth = 12;

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  if (isDarkMode) {
    context.strokeStyle = "black";
    context.strokeText(text, centerX, centerY);
    context.fillStyle = "white";
    context.fillText(text, centerX, centerY);
  } else {
    context.strokeStyle = "white";
    context.strokeText(text, centerX, centerY);
    context.fillStyle = "black";
    context.fillText(text, centerX, centerY);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });

  const sprite = new THREE.Sprite(spriteMaterial);

  const aspectRatio = canvas.width / canvas.height;
  sprite.userData.aspectRatio = aspectRatio;

  // --- CORRECTION ICI ---

  // 1. Taille initiale plus petite (0.2 au lieu de 2) pour éviter le "flash" géant
  sprite.scale.set(0.2 * aspectRatio, 0.2, 1);
  sprite.center.set(0.5, 0);

  // 2. CRUCIAL : On invalide le hash de la caméra.
  // Cela force la boucle animate() à recalculer la taille correcte dès la prochaine image,
  // mÃªme si la caméra n'a pas bougé.
  lastCameraHash = "";

  return sprite;
}
function setupEventListeners() {
  const canvas = renderer.domElement;
  const panel = document.getElementById("panel");

  canvas.addEventListener("contextmenu", onRightClick);
  canvas.addEventListener("click", onObjectClick);
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mouseup", onMouseUp);
  canvas.addEventListener("wheel", onWheel);

  document.addEventListener("touchstart", handleTouchStart, { passive: false });
  document.addEventListener("touchmove", handleTouchMove, { passive: false });
  document.addEventListener("touchend", handleTouchEnd);

  window.addEventListener("resize", onWindowResize);

  window.addEventListener("keydown", (event) => {
    // 1. Raccourcis existants (T, R, Echap, Ctrl+Z)
    if (event.key.toLowerCase() === "t") transformControl.setMode("translate");
    if (event.key.toLowerCase() === "r") transformControl.setMode("rotate");

    if (event.key === "Escape") {
      hideContextMenu();
      if (panelOpen) togglePanel();
      if (selectedObjectInstance) {
        deselectCurrentObject();
        cancelEdit();
        cancelVectorEdit();
      }
    }

    if ((event.ctrlKey || event.metaKey) && event.key === "z") {
      event.preventDefault();
      undo();
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "y") {
      event.preventDefault();
      redo();
    }

    // 2. NOUVEAU : Gestion de la touche SUPPR (Delete)
    // --- DANS setupEventListeners, partie window.addEventListener("keydown"...) ---

    // Remplacez le bloc "if (event.key === "Delete" || event.key === "Del")" par ceci :

    if (event.key === "Delete" || event.key === "Del") {
      // AJOUT DE LA SÉCURITÉ ICI :
      const tag = document.activeElement.tagName.toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return; // On ne fait rien si l'utilisateur écrit
      }

      // Le reste reste identique :
      if (selectedObjectInstance) {
        const inst = selectedObjectInstance;
        if (inst instanceof Point) {
          const index = geometryManager.points.indexOf(inst);
          if (index > -1) removePoint(index);
        } else if (inst instanceof Vector) {
          removeVectorById(inst.id);
        } else if (inst instanceof Line3D) {
          removeStraightLineById(inst.id);
        } else if (inst instanceof Plane) {
          removePlaneById(inst.id);
        }
      }
    }
  });

  document.addEventListener("mousedown", (e) => {
    const menu = document.getElementById("contextMenu");
    if (menu.style.display === "block" && !menu.contains(e.target)) {
      hideContextMenu();
    }
  });

  document
    .getElementById("contextMenu")
    .addEventListener("mousedown", (e) => e.stopPropagation());

  const stopPropagation = (e) => e.stopPropagation();
  panel.addEventListener("mousedown", stopPropagation);
  panel.addEventListener("wheel", stopPropagation);
  panel.addEventListener("contextmenu", stopPropagation);

  const snapCtrl = document.getElementById("snapControl");
  if (snapCtrl) {
    snapCtrl.addEventListener("mousedown", stopPropagation);
    snapCtrl.addEventListener("touchstart", stopPropagation); // Important pour le tactile
    snapCtrl.addEventListener("contextmenu", stopPropagation); // Bloque le menu contextuel
    snapCtrl.addEventListener("wheel", stopPropagation);
  }
}

function onRightClick(event) {
  event.preventDefault();
  console.log("👉 1. Clic droit détecté à :", event.clientX, event.clientY);
  findObjectAndShowMenu(event.clientX, event.clientY);
}

function onObjectClick(event) {
  if (blockNextClick) {
    blockNextClick = false;
    return;
  }
  if (wasDragged) return;
  performRaycastSelection(event.clientX, event.clientY);
}

function handleTouchStart(e) {
  wasDragged = false;
  const touch = e.touches[0];

  // 1. PROTECTION UI
  if (
    e.target.closest("#openBtn") ||
    e.target.closest("#cameraControls") ||
    e.target.closest("#spreadsheetContainer") ||
    e.target.closest("#openSpreadsheetBtn")
  ) {
    return;
  }

  // 2. INITIALISATION SWIPE
  // On détecte si on touche le bord gauche (si fermé) ou le panneau (si ouvert)
  // Zone de détection élargie à 40px
  const canStartOpening = !panelOpen && touch.clientX < 40;
  const canStartClosing = panelOpen && e.target.closest("#panel");

  if (canStartOpening || canStartClosing) {
    swipeState.isSwiping = true;
    swipeState.lock = null;
    swipeState.startX = touch.clientX;
    swipeState.startY = touch.clientY;

    const panel = document.getElementById("panel");

    // CORRECTION MAJEURE : On calcule la largeur totale réelle (Largeur + Marge CSS 20px)
    const totalWidth = panel.offsetWidth + 20;

    // Si caché, on part de -totalWidth. Si ouvert, on part de 0.
    swipeState.panelStartTranslateX = panel.classList.contains("hidden")
      ? -totalWidth
      : 0;

    // On coupe l'animation tout de suite pour éviter la latence
    panel.classList.add("no-transition");
    return;
  }

  swipeState.isSwiping = false;

  // 3. Protection Gizmo
  if (
    typeof transformControl !== "undefined" &&
    transformControl &&
    selectedObjectInstance
  ) {
    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const gizmoIntersects = raycaster.intersectObjects(
      transformControl.children,
      true,
    );
    if (gizmoIntersects.length > 0) return;
  }

  // 4. Init Caméra
  if (e.touches.length === 1) {
    isDragging = true;
    isPanning = false;
    previousMousePosition = { x: touch.clientX, y: touch.clientY };
    touchStartPosition = { x: touch.clientX, y: touch.clientY };
  } else if (e.touches.length >= 2) {
    isPanning = true;
    isDragging = false;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
    previousMousePosition = {
      x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
      y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
    };
  }
}

function handleTouchMove(e) {
  // 1. Sécurité Gizmo
  if (typeof isGizmoDragging !== "undefined" && isGizmoDragging) return;

  // 2. Gestion Swipe Panneau
  if (swipeState.isSwiping) {
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    const deltaY = touch.clientY - swipeState.startY;

    if (!swipeState.lock) {
      swipeState.lock =
        Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
    }

    if (swipeState.lock === "horizontal") {
      e.preventDefault();
      const panel = document.getElementById("panel");

      // Calcul de la nouvelle position
      let newX = swipeState.panelStartTranslateX + deltaX;

      // CORRECTION MAJEURE : Bornes correctes (-LargeurTotale à 0)
      const totalWidth = panel.offsetWidth + 20;
      newX = Math.max(-totalWidth, Math.min(0, newX));

      panel.style.transform = `translateX(${newX}px)`;
    }
    return;
  }

  // Suite logique caméra (inchangée)
  const touch = e.touches[0];
  const moveX = Math.abs(touch.clientX - touchStartPosition.x);
  const moveY = Math.abs(touch.clientY - touchStartPosition.y);

  if (moveX > 5 || moveY > 5) {
    wasDragged = true;
  }

  if (isDragging && e.touches.length === 1) {
    e.preventDefault();
    if (wasDragged) {
      const dX = touch.clientX - previousMousePosition.x;
      const dY = touch.clientY - previousMousePosition.y;
      cameraRotation.y += dX * 0.005;
      cameraRotation.x += dY * 0.005;
      cameraRotation.x = Math.max(
        -Math.PI / 2 + 0.1,
        Math.min(Math.PI / 2 - 0.1, cameraRotation.x),
      );
      updateCameraPosition();
      previousMousePosition = { x: touch.clientX, y: touch.clientY };
    }
  } else if (isPanning && e.touches.length >= 2) {
    e.preventDefault();
    wasDragged = true;
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const currentMidX = (touch1.clientX + touch2.clientX) / 2;
    const currentMidY = (touch1.clientY + touch2.clientY) / 2;
    const panDX = currentMidX - previousMousePosition.x;
    const panDY = currentMidY - previousMousePosition.y;
    if (Math.abs(panDX) > 0.5 || Math.abs(panDY) > 0.5) {
      panCamera(panDX, panDY);
    }
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    const currentPinchDistance = Math.sqrt(dx * dx + dy * dy);
    const diff = initialPinchDistance - currentPinchDistance;
    if (Math.abs(diff) > 1) {
      zoomCamera(diff * 0.05);
      initialPinchDistance = currentPinchDistance;
    }
    previousMousePosition = { x: currentMidX, y: currentMidY };
  }
}

function handleTouchEnd(e) {
  // 1. PROTECTION UI
  if (
    e.target.closest("#openBtn") ||
    e.target.closest("#cameraControls") ||
    e.target.closest("#spreadsheetContainer") ||
    e.target.closest("#openSpreadsheetBtn") ||
    e.target.closest("#contextMenu")
  ) {
    isDragging = false;
    isPanning = false;
    swipeState.isSwiping = false;
    swipeState.lock = null;
    return;
  }

  // 2. GESTION SWIPE DU PANNEAU (Corrigée)
  if (swipeState.isSwiping) {
    if (swipeState.lock === "horizontal") {
      const panel = document.getElementById("panel");
      const openBtn = document.getElementById("openBtn");

      // Réactiver la transition
      panel.classList.remove("no-transition");

      // CORRECTION MAJEURE : Lire la position AVANT de nettoyer le style
      // On récupère la valeur X actuelle directement depuis le style transform
      const currentTransform = panel.style.transform;
      let currentX = swipeState.panelStartTranslateX; // Valeur par défaut

      if (currentTransform && currentTransform.includes("translateX")) {
        const match = currentTransform.match(/translateX\(([-\d.]+)px\)/);
        if (match) currentX = parseFloat(match[1]);
      }

      // On nettoie le style inline pour laisser les classes CSS gérer la suite
      panel.style.transform = "";

      // Seuil de bascule (moitié de la largeur)
      const totalWidth = panel.offsetWidth + 20;
      const threshold = -totalWidth / 2;

      if (currentX > threshold) {
        // OUVRIR
        panelOpen = true;
        panel.classList.remove("hidden");
        openBtn.classList.remove("show"); // Cache le bouton burger
      } else {
        // FERMER
        panelOpen = false;
        panel.classList.add("hidden");
        openBtn.classList.add("show"); // Affiche le bouton burger
      }
    }

    // Reset complet
    swipeState.isSwiping = false;
    swipeState.lock = null;
    return; // On arrÃªte là pour ne pas déclencher de clic 3D
  }

  // 3. Clic 3D normal
  if (!wasDragged) {
    e.preventDefault();
    performRaycastSelection(touchStartPosition.x, touchStartPosition.y);
  }

  isDragging = false;
  isPanning = false;
}

const raycastCandidates = [];

function getIntersectionResult(x, y) {
  // 1. Transformation des coordonnées (inchangé)
  mouse.x = (x / window.innerWidth) * 2 - 1;
  mouse.y = -(y / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // 2. Optimisation : Remplissage du tableau sans créer de sous-tableaux intermédiaires
  raycastCandidates.length = 0; // Vider le tableau sans le détruire

  // A. Points
  const points = geometryManager.points;
  for (let i = 0; i < points.length; i++) {
    if (points[i].isVisible) raycastCandidates.push(points[i].mesh);
  }

  // B. Droites
  const lines = geometryManager.lines;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].isVisible) raycastCandidates.push(lines[i].mesh);
  }

  // C. Plans
  const planes = geometryManager.planes;
  for (let i = 0; i < planes.length; i++) {
    if (planes[i].isVisible) raycastCandidates.push(planes[i].mesh);
  }

  // D. Vecteurs (Ligne et Cône)
  const vectors = geometryManager.vectors;
  for (let i = 0; i < vectors.length; i++) {
    const v = vectors[i];
    if (v.isVisible && v.arrowHelper) {
      raycastCandidates.push(v.arrowHelper.line);
      raycastCandidates.push(v.arrowHelper.cone);
    }
  }

  // 3. Lancement du rayon sur la liste consolidée
  const intersects = raycaster.intersectObjects(raycastCandidates);

  return intersects.length > 0 ? intersects[0] : null;
}

function findObjectAndShowMenu(x, y) {
  // On vérifie que la fonction existe bien avant de l'appeler
  if (typeof hideContextMenu === "function") {
    hideContextMenu();
  } else {
    console.error("âŒ Erreur : hideContextMenu n'est pas définie !");
    return;
  }

  const intersection = getIntersectionResult(x, y);

  if (intersection) {
    console.log("âœ… 2. Objet touché !", intersection.object);

    if (intersection.object.userData && intersection.object.userData.instance) {
      console.log("âœ… 3. Instance trouvée, lancement du menu...");
      populateAndShowContextMenu(x, y, intersection.object.userData.instance);
    } else {
      console.warn(
        "âš ï¸ Objet touché mais pas de données 'instance' (userData vide ?)",
      );
    }
  } else {
    console.log("❌ 2. Aucun objet trouvé sous la souris.");
  }
}

function populateAndShowContextMenu(x, y, instance) {
  console.log("🛠️  Construction du menu pour :", instance.constructor.name);

  const menu = document.getElementById("contextMenu");
  const menuItemsContainer = document.getElementById("contextMenuItems");

  // 1. Vider le menu précédent
  menuItemsContainer.innerHTML = "";

  // Helper pour créer les lignes (li)
  const createAction = (action, text) =>
    `<li onclick="${action}; hideContextMenu();">${text}</li>`;

  let htmlContent = "";

  // 2. Générer le contenu selon le type
  if (instance instanceof Point) {
    const index = geometryManager.points.indexOf(instance);
    htmlContent += createAction(`editPoint(${index})`, "✏️ Modifier le point");
    // --- AJOUT ---
    htmlContent += createAction(
      `openTransformationPanel('point', ${index})`,
      "🔄 Transformations",
    );
    // -------------
    htmlContent += createAction(
      `togglePointVisibility(${index})`,
      instance.isVisible ? "🙈 Cacher" : "👁️  Afficher",
    );
    htmlContent += createAction(`removePoint(${index})`, "🗑️  Supprimer");
  } else if (instance instanceof Vector) {
    htmlContent += createAction(
      `editVector(${instance.id})`,
      "✏️ Modifier le vecteur",
    );
    // --- AJOUT ---
    htmlContent += createAction(
      `openTransformationPanel('vector', ${instance.id})`,
      "🔄 Transformations",
    );
    // -------------
    htmlContent += createAction(
      `toggleVectorVisibility(${instance.id})`,
      instance.isVisible ? "🙈 Cacher" : "👁️  Afficher",
    );
    htmlContent += createAction(
      `removeVectorById(${instance.id})`,
      "🗑️  Supprimer",
    );
  } else if (instance instanceof Line3D) {
    htmlContent += createAction(
      `editLine(${instance.id})`,
      "✏️ Modifier la droite",
    );
    // --- AJOUT ---
    htmlContent += createAction(
      `openTransformationPanel('line', ${instance.id})`,
      "🔄 Transformations",
    );
    // -------------
    htmlContent += createAction(
      `toggleStraightLineVisibility(${instance.id})`,
      instance.isVisible ? "🙈 Cacher" : "👁️  Afficher",
    );
    htmlContent += createAction(
      `removeStraightLineById(${instance.id})`,
      "🗑️  Supprimer",
    );
  } else if (instance instanceof Plane) {
    htmlContent += createAction(
      `editPlane(${instance.id})`,
      "âœï¸ Modifier le plan",
    );
    // --- AJOUT ---
    htmlContent += createAction(
      `openTransformationPanel('line', ${instance.id})`,
      "🔄 Transformations",
    );
    // -------------
    htmlContent += createAction(
      `togglePlaneVisibility(${instance.id})`,
      instance.isVisible ? "🙈 Cacher" : "👁️  Afficher",
    );
    htmlContent += createAction(
      `toggleNormalVector(${instance.id})`,
      "📏 Vecteur Normal (Vn)",
    );
    htmlContent += createAction(
      `removeStraightLineById(${instance.id})`,
      "🗑️  Supprimer",
    );
  }

  // 3. Vérifier si du contenu a été généré
  if (htmlContent === "") {
    console.warn("âš ï¸ Menu vide : type d'objet non reconnu", instance);
    return;
  }

  menuItemsContainer.innerHTML = htmlContent;

  // 4. Affichage et Positionnement
  menu.style.display = "block";

  const menuWidth = menu.offsetWidth || 160;
  const menuHeight = menu.offsetHeight || 100;

  let finalX = x;
  let finalY = y;

  if (x + menuWidth > window.innerWidth) {
    finalX = window.innerWidth - menuWidth - 10;
  }
  if (y + menuHeight > window.innerHeight) {
    finalY = window.innerHeight - menuHeight - 10;
  }

  menu.style.left = finalX + "px";
  menu.style.top = finalY + "px";
}

// =====================================================================================
// END: GESTION DES ÉVÉNEMENTS
// =====================================================================================
function createAxes() {
  // 1. Nettoyage si les axes existent déjà
  if (axesGroup) {
    scene.remove(axesGroup);
    // Nettoyage mémoire basique
    axesGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
    });
    axesGroup = null;
  }

  axesGroup = new THREE.Group(); // Créer un conteneur global

  const axisLength = 10;
  const axisRadius = 0.04;
  const headLength = 0.4;
  const headRadius = 0.12;

  // --- Helper pour créer le texte (Label) ---
  const createAxisLabel = (text, colorHex) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 256;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = "bold 60px Arial"; // Un peu plus gras
    context.textAlign = "center";
    context.textBaseline = "middle";

    // LOGIQUE DE COULEUR DES AXES
    // En dark mode, on veut que le texte soit blanc ou de la couleur de l'axe mais plus clair
    // Ici on garde la couleur de l'axe, mais on ajoute un contour (stroke) pour la lisibilité

    context.lineWidth = 8;
    context.strokeStyle = isDarkMode ? "black" : "white"; // Contour selon le thème
    context.strokeText(text, canvas.width / 2, canvas.height / 2);

    context.fillStyle = "#" + new THREE.Color(colorHex).getHexString();
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      transparent: true,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2.5, 2.5, 1);
    return sprite;
  };

  const createAxisArrow = (color, direction, labelText) => {
    // ... (garder le code existant de création de flèche) ...
    // SAUF : au lieu de 'group.add(shaft)', faire 'localGroup.add(shaft)'
    // et retourner localGroup

    // POUR SIMPLIFIER : Copiez-collez votre logique existante mais ajoutez tout à axesGroup

    const material = new THREE.MeshBasicMaterial({
      color: color,
      depthTest: false,
    });
    // ... géométrie cylindre + cone ...

    // Je réécris la version courte compatible avec votre code existant :
    const localGroup = new THREE.Group();

    const shaftGeometry = new THREE.CylinderGeometry(
      axisRadius,
      axisRadius,
      axisLength,
      12,
    );
    const shaft = new THREE.Mesh(shaftGeometry, material);
    shaft.position.copy(direction).multiplyScalar(axisLength / 2);
    shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    localGroup.add(shaft);

    const headGeometry = new THREE.ConeGeometry(headRadius, headLength, 12);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.copy(direction).multiplyScalar(axisLength);
    head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    localGroup.add(head);

    const label = createAxisLabel(labelText, color);
    const labelPos = direction.clone().multiplyScalar(axisLength + 1.5);
    label.position.copy(labelPos);
    localGroup.add(label);

    return localGroup;
  };

  // Création
  const xAxis = createAxisArrow(0xff0000, new THREE.Vector3(1, 0, 0), "X");
  const yAxis = createAxisArrow(0x00ff00, new THREE.Vector3(0, 1, 0), "Z");
  const zAxis = createAxisArrow(0x0000ff, new THREE.Vector3(0, 0, 1), "Y");

  axesGroup.add(xAxis);
  axesGroup.add(yAxis);
  axesGroup.add(zAxis);

  // Configuration rendu
  axesGroup.traverse((child) => {
    if (child.material) {
      child.material.depthTest = true;
      child.material.transparent = true;
      child.material.opacity = 1.0;
      child.renderOrder = 1;
    }
  });

  scene.add(axesGroup);
}

let lastCameraHash = ""; // Pour suivre les changements de caméra
function animate() {
  requestAnimationFrame(animate);

  const currentCameraHash = `${camera.position.x.toFixed(3)},${camera.position.y.toFixed(
    3,
  )},${camera.position.z.toFixed(3)},${camera.rotation.x.toFixed(3)},${camera.rotation.y.toFixed(3)}`;

  // Mise à jour des labels (taille constante à l'écran)
  if (currentCameraHash !== lastCameraHash || isGizmoDragging) {
    // Facteur de taille de base (hauteur du texte)
    const baseScaleFactor = 0.06; // Ajustez cette valeur si le texte est trop gros/petit globalement

    // Helper pour mettre à jour un sprite
    const updateLabelScale = (sprite) => {
      if (sprite) {
        const dist = camera.position.distanceTo(sprite.position);
        // La hauteur dépend de la distance
        const scaleY = dist * baseScaleFactor;
        // La largeur dépend de la hauteur ET du ratio d'aspect du texte
        // Si pas de ratio stocké, on utilise 2 par défaut
        const ratio = sprite.userData.aspectRatio || 2;
        sprite.scale.set(scaleY * ratio, scaleY, 1);
      }
    };

    // 1. Labels des Points
    for (let i = 0, l = geometryManager.points.length; i < l; i++) {
      updateLabelScale(geometryManager.points[i].label);
    }

    // 2. Labels des Vecteurs
    for (let i = 0, l = geometryManager.vectors.length; i < l; i++) {
      const v = geometryManager.vectors[i];
      if (v.label && v.label.visible) {
        updateLabelScale(v.label);
      }
    }

    lastCameraHash = currentCameraHash;
  }

  renderer.render(scene, camera);
}

// =====================================================================================
