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
        this.label.position.set(this.position.x, this.position.y + 0.35, this.position.z);
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
      constructor(name, startPoint, directorVector, color = 0x00ced1, derivedFrom = null) {
        this.id = nextStraightLineId++;
        this.name = name;
        this.startPoint = startPoint.clone();
        this.directorVector = directorVector.clone();
        this.color = new THREE.Color(color);
        this.derivedFrom = derivedFrom;
        this.isVisible = true;
        const lineLength = 100;
        const dir = this.directorVector.clone().normalize();
        const visualStart = new THREE.Vector3().addVectors(this.startPoint, dir.clone().multiplyScalar(-lineLength));
        const visualEnd = new THREE.Vector3().addVectors(this.startPoint, dir.clone().multiplyScalar(lineLength));
        const geometry = new THREE.BufferGeometry().setFromPoints([visualStart, visualEnd]);
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
        derivedFrom = null
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
        this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.normal);
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
        const midPoint = new THREE.Vector3().addVectors(this.origin, this.components.clone().multiplyScalar(0.5));
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
            0.2
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
    // SECTION 2 : GESTIONNAIRE CENTRAL DE LA GÉOMÉTRIE
    // =====================================================================================

    class GeometryManager {
      constructor(scene) {
        this.scene = scene;
        this.points = [];
        this.lines = [];
        this.planes = [];
        this.vectors = [];
      }
      /**
       * Génère un nom unique pour un type d'objet donné en ajoutant un suffixe si nécessaire.
       * @param {string} baseName Le nom de base souhaité.
       * @param {string} objectType Le type d'objet : 'point', 'line', 'plane', ou 'vector'.
       * @returns {string} Un nom garanti unique.
       */
      generateUniqueName(baseName, objectType) {
        let nameList;
        // 1. Sélectionner la bonne liste d'objets en fonction du type
        switch (objectType) {
          case "point":
            nameList = this.points.map((p) => p.name);
            break;
          case "line":
            nameList = this.lines.map((l) => l.name);
            break;
          case "plane":
            nameList = this.planes.map((p) => p.name);
            break;
          case "vector":
            nameList = this.vectors.map((v) => v.name);
            break;
          default:
            // Si le type est inconnu, on ne peut pas vérifier, on retourne le nom de base
            return baseName;
        }

        // 2. Vérifier si le nom de base est déjà pris
        if (!nameList.includes(baseName)) {
          return baseName; // Le nom est déjà unique, on le retourne
        }

        // 3. Si le nom est pris, on cherche un suffixe
        let uniqueName = baseName;
        let counter = 1;
        do {
          uniqueName = `${baseName}_${counter}`;
          counter++;
        } while (nameList.includes(uniqueName));

        return uniqueName;
      }

      addPoint(point) {
        this.points.push(point);
        point.addToScene(this.scene);
      }
      addLine(line) {
        this.lines.push(line);
        line.addToScene(this.scene);
      }
      addPlane(plane) {
        this.planes.push(plane);
        plane.addToScene(this.scene);
      }
      addVector(vector) {
        this.vectors.push(vector);
        vector.addToScene(this.scene);
      }
      _removeInstance(array, instance) {
        const index = array.indexOf(instance);
        if (index > -1) {
          instance.removeFromScene(this.scene);
          array.splice(index, 1);
          return true;
        }
        return false;
      }
      removePoint(instance) {
        return this._removeInstance(this.points, instance);
      }
      removeLine(instance) {
        return this._removeInstance(this.lines, instance);
      }
      removePlane(instance) {
        return this._removeInstance(this.planes, instance);
      }
      removeVector(instance) {
        return this._removeInstance(this.vectors, instance);
      }
      findLineById(id) {
        return this.lines.find((l) => l.id === id);
      }
      findPlaneById(id) {
        return this.planes.find((p) => p.id === id);
      }
      findVectorById(id) {
        return this.vectors.find((v) => v.id === id);
      }

      findPointAt(position) {
        const tolerance = 0.01;
        for (const point of this.points) {
          if (point.position.distanceTo(position) < tolerance) {
            return point;
          }
        }
        return null;
      }
      findObjectByName(name) {
        const allObjects = [...this.points, ...this.lines, ...this.planes];
        return allObjects.find((obj) => obj.name === name);
      }

      clearAll() {
        [...this.points, ...this.lines, ...this.planes, ...this.vectors].forEach((obj) =>
          obj.removeFromScene(this.scene)
        );
        this.points = [];
        this.lines = [];
        this.planes = [];
        this.vectors = [];
        nextStraightLineId = 0;
        nextPlaneId = 0;
        nextVectorId = 0;
      }
    }

    // =====================================================================================
    // SECTION 3 : VARIABLES GLOBALES ET INITIALISATION
    // =====================================================================================

    let scene, camera, renderer, geometryManager;
    let isDragging = false,
      isPanning = false,
      wasDragged = false;
    let previousMousePosition = { x: 0, y: 0 };
    let cameraRotation = { x: 0.5, y: 0.5 };
    let cameraDistance = 15;
    let cameraTarget = new THREE.Vector3(0, 0, 0);
    let initialPinchDistance = 0;
    let panelOpen = false;
    let nextStraightLineId = 0;
    let nextPlaneId = 0;
    let nextVectorId = 0;
    let raycaster,
      mouse,
      selectedObjectInstance = null;
    // let wasPanningOrZooming = false; // Pour distinguer un geste caméra d'un tap
    let currentConstructionObjects = [];
    let splashTimer = null;
    let blockNextClick = false; // Variable pour bloquer le "clic fantôme" sur mobile
    const HIGHLIGHT_COLOR = 0xffcc00; // Jaune vif pour la surbrillance
    const LONG_PRESS_DURATION = 500;
    let touchStartPosition = { x: 0, y: 0 };
    let lastTap = 0;
    let transformControl;
    let isGizmoDragging = false;
    let lastTooltipX = 0;
    let lastTooltipY = 0;

    const swipeState = {
      isSwiping: false,
      lock: null,
      startX: 0,
      startY: 0,
      currentX: 0, // NOUVEAU : stocke la position actuelle
      startTime: 0, // NOUVEAU : pour calculer la vitesse
      panelWidth: 0, // NOUVEAU : pour éviter de recalculer
    };
    const SWIPE_EDGE_ZONE = 50; // Augmenté à 50px pour faciliter la prise en main
    const SWIPE_THRESHOLD_VELOCITY = 0.3; // Vitesse minimale pour un "flick"

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
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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
      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();

      // Valeurs par défaut pour les équations
      document.getElementById("lineEquationInput").value = "x = 1 + 2t\ny = -3 + 3t\nz = 4 - 5t";
      document.getElementById("planeEquationInput").value = "2x - y + 3z - 4 = 0";

      document.getElementById("vectorOriginPoint").addEventListener("change", function () {
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
            document.getElementById("vectorOriginX").value = formatNumber(p.position.x);
            document.getElementById("vectorOriginY").value = formatNumber(p.position.z); // Profondeur (UI Y)
            document.getElementById("vectorOriginZ").value = formatNumber(p.position.y); // Hauteur (UI Z)
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

      document.getElementById("contextMenu").addEventListener("mousedown", (e) => e.stopPropagation());

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
        swipeState.panelStartTranslateX = panel.classList.contains("hidden") ? -totalWidth : 0;

        // On coupe l'animation tout de suite pour éviter la latence
        panel.classList.add("no-transition");
        return;
      }

      swipeState.isSwiping = false;

      // 3. Protection Gizmo
      if (typeof transformControl !== "undefined" && transformControl && selectedObjectInstance) {
        mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const gizmoIntersects = raycaster.intersectObjects(transformControl.children, true);
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
          swipeState.lock = Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
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
          cameraRotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, cameraRotation.x));
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
        if (points[i].mesh.visible) raycastCandidates.push(points[i].mesh);
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
          console.warn("âš ï¸ Objet touché mais pas de données 'instance' (userData vide ?)");
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
      const createAction = (action, text) => `<li onclick="${action}; hideContextMenu();">${text}</li>`;

      let htmlContent = "";

      // 2. Générer le contenu selon le type
      if (instance instanceof Point) {
        const index = geometryManager.points.indexOf(instance);
        htmlContent += createAction(`editPoint(${index})`, "✏️ Modifier le point");
        // --- AJOUT ---
        htmlContent += createAction(`openTransformationPanel('point', ${index})`, "🔄 Transformations");
        // -------------
        htmlContent += createAction(`removePoint(${index})`, "🗑️  Supprimer");
      } else if (instance instanceof Vector) {
        htmlContent += createAction(`editVector(${instance.id})`, "✏️ Modifier le vecteur");
        // --- AJOUT ---
        htmlContent += createAction(`openTransformationPanel('vector', ${instance.id})`, "🔄 Transformations");
        // -------------
        htmlContent += createAction(
          `toggleVectorVisibility(${instance.id})`,
          instance.isVisible ? "🙈 Cacher" : "👁️  Afficher"
        );
        htmlContent += createAction(`removeVectorById(${instance.id})`, "🗑️  Supprimer");
      } else if (instance instanceof Line3D) {
        htmlContent += createAction(`editLine(${instance.id})`, "✏️ Modifier la droite");
        // --- AJOUT ---
        htmlContent += createAction(`openTransformationPanel('line', ${instance.id})`, "🔄 Transformations");
        // -------------
        htmlContent += createAction(
          `toggleStraightLineVisibility(${instance.id})`,
          instance.isVisible ? "🙈 Cacher" : "👁️  Afficher"
        );
        htmlContent += createAction(`removeStraightLineById(${instance.id})`, "🗑️  Supprimer");
      } else if (instance instanceof Plane) {
        htmlContent += createAction(`editPlane(${instance.id})`, "âœï¸ Modifier le plan");
        // --- AJOUT ---
        htmlContent += createAction(`openTransformationPanel('line', ${instance.id})`, "🔄 Transformations");
        // -------------
        htmlContent += createAction(
          `togglePlaneVisibility(${instance.id})`,
          instance.isVisible ? "🙈 Cacher" : "👁️  Afficher"
        );
        htmlContent += createAction(`toggleNormalVector(${instance.id})`, "📏 Vecteur Normal (Vn)");
        htmlContent += createAction(`removeStraightLineById(${instance.id})`, "🗑️  Supprimer");
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

        const material = new THREE.MeshBasicMaterial({ color: color, depthTest: false });
        // ... géométrie cylindre + cone ...

        // Je réécris la version courte compatible avec votre code existant :
        const localGroup = new THREE.Group();

        const shaftGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength, 12);
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
        3
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
          1
        )})`;

        item.innerHTML = `
      <div class="geometry-item-main">
          <div class="geometry-info">
              <span class="point-name">${p.name}</span>
              <span class="geometry-coords">${coordsText}</span>
          </div>
          <div class="geometry-actions">
              <button class="btn-secondary" onclick="editPoint(${i})" title="Modifier">✏️</button>
              <button class="btn-danger" onclick="removePoint(${i})" title="Supprimer">🗑️</button>
          </div>
      </div>`;
        list.appendChild(item);
      });
    }

    function updateStraightLineList() {
      const list = document.getElementById("lineList");
      list.innerHTML =
        geometryManager.lines.length === 0 ? '<div class="point-item">Aucune droite tracée.</div>' : "";

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
        <div class="geometry-info" onclick="editLine(${line.id
          })" style="cursor: pointer;" title="Cliquer pour modifier">
            <span class="geometry-name">${line.name}</span>
            <span class="geometry-details" id="line-vector-${line.id}">Vect: ${vText}</span>
        </div>

        <div class="geometry-actions">
            <!-- AJOUT : Bouton Crayon pour éditer -->
            <button class="btn-secondary" onclick="editLine(${line.id})" title="Modifier">✏️</button>

            <!-- Boutons existants -->

            <button class="btn-secondary" onclick="toggleStraightLineVisibility(${line.id})" title="${line.isVisible ? "Masquer" : "Afficher"
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
      list.innerHTML = geometryManager.planes.length === 0 ? '<div class="point-item">Aucun plan créé.</div>' : "";

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
          (v) => v.parentPlaneId === plane.id && v.isNormalVector
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
      <div class="geometry-info" onclick="editPlane(${plane.id
          })" style="cursor: pointer;" title="Cliquer pour modifier">
          <span class="geometry-name">${plane.name}</span>
          <span class="geometry-details" id="plane-normal-${plane.id}">${normalText}</span>
      </div>
      <div class="geometry-actions">
          <!-- AJOUT : Bouton Crayon -->
          <button class="btn-secondary" onclick="editPlane(${plane.id})" title="Modifier">✏️</button>

          ${normalBtnHtml}

          <button class="btn-secondary" onclick="togglePlaneVisibility(${plane.id})" title="${plane.isVisible ? "Masquer" : "Afficher"
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
        geometryManager.vectors.length === 0 ? '<div class="point-item">Aucun vecteur tracé.</div>' : "";

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
            <button class="btn-violet-light" onclick="toggleVectorLabelVisibility(${vector.id})" title="${vector.isLabelVisible ? "Masquer le nom" : "Afficher le nom"
          }">${vector.isLabelVisible ? "👁️ " : "🙈"}</button>
            <button class="btn-secondary" onclick="toggleVectorVisibility(${vector.id})" title="${vector.isVisible ? "Masquer" : "Afficher"
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

    function toggleNormalVector(planeId) {
      const plane = geometryManager.findPlaneById(planeId);
      if (!plane) return;

      // Chercher si un vecteur normal existe déjà pour ce plan
      const existingVector = geometryManager.vectors.find((v) => v.parentPlaneId === planeId && v.isNormalVector);

      if (existingVector) {
        // Le vecteur existe, on le supprime
        geometryManager.removeVector(existingVector);
      } else {
        // Le vecteur n'existe pas, on le crée
        const normalVectorName = `Vn(${plane.name})`;
        const normalVectorLength = 2.5;
        const normalVectorComponents = plane.normal.clone().normalize().multiplyScalar(normalVectorLength);

        const normalVector = new Vector(
          normalVectorName,
          plane.mesh.position, // Origine du vecteur
          normalVectorComponents,
          0x800080 // Couleur violette
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
              ""
            )
          );
          select.add(new Option("Origine (0,0,0)", "origin"));
          geometryManager.points.forEach((p, i) => select.add(new Option(p.name, i)));
          select.value = currentValue;
          return;
        }

        // --- LOGIQUE GÉNÉRALE CORRIGÉE ---

        // 1. Est-ce un menu qui doit afficher des POINTS ?
        // (Soit il est dans la liste d'exceptions, soit il ne contient ni Vector/Line/Plane dans son nom)
        const isPointMenu =
          pointInputIds.includes(id) || (!id.includes("Vector") && !id.includes("Line") && !id.includes("Plane"));

        if (isPointMenu) {
          select.add(new Option("-- Point --", ""));
          geometryManager.points.forEach((p, i) => select.add(new Option(p.name, i)));
        }
        // 2. Les Vecteurs (excluant les exceptions ci-dessus)
        else if (id.includes("Vector")) {
          select.add(new Option("-- Vecteur --", ""));
          geometryManager.vectors.forEach((v) => select.add(new Option(v.name, v.id)));
        }
        // 3. Les Droites
        else if (id.includes("Line")) {
          select.add(new Option("-- Droite --", ""));
          geometryManager.lines.forEach((l) => select.add(new Option(l.name, l.id)));
        }
        // 4. Les Plans
        else if (id.includes("Plane")) {
          select.add(new Option("-- Plan --", ""));
          geometryManager.planes.forEach((p) => select.add(new Option(p.name, p.id)));
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
    // SECTION 5 : CRÉATION / MODIFICATION / SUPPRESSION D'OBJETS
    // =====================================================================================
    function editPoint(index, forceOpen = true) {
      // 1. UI
      if (forceOpen) {
        ensurePanelVisible();
        const input = document.getElementById("pointName");
        if (input) {
          const section = input.closest(".section.collapsible");
          if (section && section.classList.contains("collapsed")) section.classList.remove("collapsed");
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
          if (section && section.classList.contains("collapsed")) section.classList.remove("collapsed");
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
          if (section && section.classList.contains("collapsed")) section.classList.remove("collapsed");
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
          const val = Math.abs(Math.abs(dir) - 1) < 1e-4 ? "t" : formatNumber(Math.abs(dir)) + "t";
          s += sign + val;
        }
        return s || "0";
      };

      // Note: ThreeJS Y is Height (Z UI), ThreeJS Z is Depth (Y UI)
      const txtX = `x = ${fmt(p.x, v.x)}`;
      const txtY = `y = ${fmt(p.z, v.z)}`; // UI Y (Depth) uses Three Z
      const txtZ = `z = ${fmt(p.y, v.y)}`; // UI Z (Height) uses Three Y

      document.getElementById("lineEquationInput").value = `${txtX}\n${txtY}\n${txtZ}`;

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
          if (section && section.classList.contains("collapsed")) section.classList.remove("collapsed");
          input.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }

      const plane = geometryManager.findPlaneById(id);
      if (!plane) return;

      // 2. Remplissage
      const idField = document.getElementById("editPlaneId");
      if (idField) idField.value = id;

      document.getElementById("planeEqPointX").value = formatNumber(plane.pointOnPlane.x);
      document.getElementById("planeEqPointY").value = formatNumber(plane.pointOnPlane.z);
      document.getElementById("planeEqPointZ").value = formatNumber(plane.pointOnPlane.y);
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
      if (Math.abs(d) > 1e-4) eqStr += d > 0 ? `+ ${formatNumber(d)}` : `- ${formatNumber(Math.abs(d))}`;
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
        document.getElementById("transformations-container").style.display = "block";

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
        showSplashScreen(`Le nom "${n}" est déjà utilisé. Veuillez en choisir un autre.`);
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
          "ÃŠtes-vous sÃ»r de vouloir effacer tous les points ? (Les droites, plans et vecteurs existants seront conservés)"
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
      const [i1, i2] = [document.getElementById("lineStart").value, document.getElementById("lineEnd").value];
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
      const name = document.getElementById("lineNameGlobal").value.trim() || "Droite (Eq)";
      const equationsText = document.getElementById("lineEquationInput").value;
      const lines = equationsText.split("\n").filter((line) => line.trim() !== "");

      if (lines.length < 3) {
        showSplashScreen("Veuillez entrer les 3 équations paramétriques (x, y, et z).");
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
          parseFloat(yStr) || 0 // UI Y (Prof) -> 3JS Z
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
      geometryManager.addLine(new Line3D(uniqueName, finalStartPoint, directorVector));

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
        showSplashScreen(`Le nom de plan "${n}" est déjà utilisé. Veuillez en choisir un autre.`);
        return;
      }
      // --- Fin de la vérification ---

      const [i1, i2, i3] = ["planeSelectP1", "planeSelectP2", "planeSelectP3"].map(
        (id) => document.getElementById(id).value
      );
      if (i1 === "" || i2 === "" || i3 === "" || i1 === i2 || i1 === i3 || i2 === i3) {
        showSplashScreen("Sélectionnez trois points distincts.");
        return;
      }
      const [p1, p2, p3] = [i1, i2, i3].map((i) => geometryManager.points[i].position);
      const norm = new THREE.Vector3().crossVectors(
        new THREE.Vector3().subVectors(p2, p1),
        new THREE.Vector3().subVectors(p3, p1)
      );
      if (norm.lengthSq() < 1e-6) {
        showSplashScreen("Points colinéaires.");
        return;
      }

      const areIntegers = Number.isInteger(norm.x) && Number.isInteger(norm.y) && Number.isInteger(norm.z);

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
        showSplashScreen("âš ï¸ Veuillez entrer une équation (ex: 2x + y + z = 6).");
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
        const normalVector = geometryManager.vectors.find((v) => v.parentPlaneId === p.id && v.isNormalVector);
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
        const normalVectors = geometryManager.vectors.filter((v) => v.isNormalVector);
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
      const [sIdx, eIdx] = ["vectorStartPoint", "vectorEndPoint"].map((id) => document.getElementById(id).value);
      if (sIdx === "" || eIdx === "" || sIdx === eIdx) {
        showSplashScreen("Sélectionnez deux points différents.");
        return;
      }
      const pS = geometryManager.points[sIdx],
        pE = geometryManager.points[eIdx];
      const c = new THREE.Vector3().subVectors(pE.position, pS.position);
      const n = `Vecteur(${pS.name}${pE.name})`;

      const baseName = `Vecteur(${pS.name}${pE.name})`;
      const uniqueName = geometryManager.generateUniqueName(baseName, "vector");
      geometryManager.addVector(new Vector(uniqueName, pS.position, c));
      updateAllUI();
      saveState();
    }

    function addVectorFromCoords() {
      const n = document.getElementById("vectorNameCoords").value.trim() || "Vecteur";

      // Vérification doublon de nom
      if (geometryManager.vectors.some((vector) => vector.name === n)) {
        showSplashScreen(`Le nom de vecteur "${n}" est déjà utilisé. Veuillez en choisir un autre.`);
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
        showSplashScreen("Veuillez remplir toutes les coordonnées (Composantes ET Origine).");
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
        showSplashScreen("Toutes les coordonnées (Composantes et Origine) doivent Ãªtre valides.");
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

      const meshes = [
        ...geometryManager.points.map((p) => p.mesh),
        ...geometryManager.lines.map((l) => l.mesh),
        ...geometryManager.planes.map((p) => p.mesh),
        ...geometryManager.vectors
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
      const u = geometryManager.findVectorById(parseInt(document.getElementById("sumVectorSelect1").value));
      const v = geometryManager.findVectorById(parseInt(document.getElementById("sumVectorSelect2").value));
      const originId = document.getElementById("sumVectorOrigin").value;
      const resultDiv = document.getElementById("vectorSumResult");

      if (!u || !v || originId === "") {
        showSplashScreen("Veuillez sélectionner deux vecteurs et un point de départ pour la construction.");
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
        0x2196f3
      );
      geometryManager.addVector(u_rep);
      currentConstructionObjects.push(u_rep);

      // Représentant de v (rouge)
      const v_rep = new Vector(
        geometryManager.generateUniqueName(`Rep(${v.name})`, "vector"),
        pointB,
        v.components,
        0xf44336
      );
      geometryManager.addVector(v_rep);
      currentConstructionObjects.push(v_rep);

      // Vecteur somme (violet)
      const sumComponents = new THREE.Vector3().addVectors(u.components, v.components);
      const sum_vec = new Vector(
        geometryManager.generateUniqueName(`Somme(${u.name},${v.name})`, "vector"),
        pointA,
        sumComponents,
        0x8a2be2
      );
      geometryManager.addVector(sum_vec);
      currentConstructionObjects.push(sum_vec);

      // 5. Afficher le résultat dans l'UI
      resultDiv.innerHTML = `Construction de Chasles effectuée.<br>
                               <strong>${u_rep.name} + ${v_rep.name} = ${sum_vec.name}</strong><br>
                               Composantes somme: <strong>(${formatNumber(sumComponents.x)}, ${formatNumber(
        sumComponents.y
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

      const v1 = geometryManager.findVectorById(parseInt(document.getElementById("sumVectorSelect1").value));
      const v2 = geometryManager.findVectorById(parseInt(document.getElementById("sumVectorSelect2").value));
      const r = document.getElementById("vectorSumResult");

      if (!v1 || !v2) {
        showSplashScreen("Veuillez sélectionner deux vecteurs.");
        r.textContent = "Veuillez sélectionner deux vecteurs.";
        return;
      }

      const sumComponents = new THREE.Vector3().addVectors(v1.components, v2.components);

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
        sumComponents.z
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
        geometryManager.findVectorById(parseInt(document.getElementById("dotVectorSelect1").value)),
        geometryManager.findVectorById(parseInt(document.getElementById("dotVectorSelect2").value)),
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
        geometryManager.findVectorById(parseInt(document.getElementById("crossVectorSelect1").value)),
        geometryManager.findVectorById(parseInt(document.getElementById("crossVectorSelect2").value)),
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
      document.getElementById("distResult1").innerHTML = `Dist(${p1.name},${p2.name}) = <strong>${d.toFixed(
        3
      )}</strong>`;
    }

    function calculatePointLineDistance() {
      const pI = document.getElementById("distPointSelect3").value,
        lI = document.getElementById("distLineSelect1").value;
      if (pI === "" || lI === "") return;
      const p = geometryManager.points[pI],
        l = geometryManager.findLineById(parseInt(lI));

      // --- CORRECTION APPLIQUÉE ---
      const lineMath = new THREE.Line3(
        l.startPoint.clone().add(l.directorVector.clone().normalize().multiplyScalar(-1000)),
        l.startPoint.clone().add(l.directorVector.clone().normalize().multiplyScalar(1000))
      );
      const closestPoint = new THREE.Vector3();
      lineMath.closestPointToPoint(p.position, true, closestPoint);
      const d = p.position.distanceTo(closestPoint);
      // --- FIN DE LA CORRECTION ---

      document.getElementById("distResult2").innerHTML = `Dist(${p.name}, ${l.name}) = <strong>${d.toFixed(
        3
      )}</strong>`;
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
        geometryManager.findLineById(parseInt(document.getElementById("angleLineSelect1").value)),
        geometryManager.findLineById(parseInt(document.getElementById("angleLineSelect2").value)),
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
        geometryManager.findPlaneById(parseInt(document.getElementById("anglePlaneSelect1").value)),
        geometryManager.findPlaneById(parseInt(document.getElementById("anglePlaneSelect2").value)),
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
      const l = geometryManager.findLineById(parseInt(document.getElementById("angleLineSelect3").value)),
        p = geometryManager.findPlaneById(parseInt(document.getElementById("anglePlaneSelect3").value));

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
        console.error("IDs de sélection pour le calcul d'intersection non trouvés.");
        return;
      }

      // 2. Récupération des objets géométriques (inchangé)
      const line = geometryManager.findLineById(parseInt(lineSelect.value));
      const plane = geometryManager.findPlaneById(parseInt(planeSelect.value));

      if (!line || !plane) {
        resultDisplay.innerHTML = "Veuillez sélectionner une droite et un plan valides.";
        return;
      }

      // 3. Calcul de l'intersection (inchangé)
      const p0 = line.startPoint;
      const v = line.directorVector;
      const planePoint = plane.pointOnPlane;
      const n = plane.displayNormal;
      const dotNV = n.dot(v);

      if (Math.abs(dotNV) < 1e-6) {
        const pointIsOnPlane = Math.abs(n.dot(new THREE.Vector3().subVectors(p0, planePoint))) < 1e-6;
        if (pointIsOnPlane) {
          resultDisplay.innerHTML = "La droite est contenue dans le plan (infinité d'intersections).";
        } else {
          resultDisplay.innerHTML = "La droite est parallèle au plan (aucune intersection).";
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
        const vec_p1_p2 = new THREE.Vector3().subVectors(p1.pointOnPlane, p2.pointOnPlane);
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
        Math.abs(lineDirection.z)
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
          0x00ff00
        );
        geometryManager.addPoint(newPoint);

        // Mise à jour de l'affichage
        const coordStr = `(${formatNumber(intersectionPoint.x)}, ${formatNumber(intersectionPoint.z)}, ${formatNumber(
          intersectionPoint.y
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
    // SECTION 8 : CONTRÃ”LE CAMÉRA ET FONCTIONS UTILITAIRES
    // =====================================================================================
    let areAllObjectsVisible = true; // État global

    function toggleGlobalVisibility() {
      areAllObjectsVisible = !areAllObjectsVisible;

      // 1. Mise à jour visuelle du bouton global
      const btnIcon = document.querySelector("#globalVisBtn i");
      if (btnIcon) {
        btnIcon.className = areAllObjectsVisible ? "fas fa-eye" : "fas fa-eye-slash";
        btnIcon.style.color = areAllObjectsVisible ? "var(--text-color)" : "#888"; // Grisé si masqué
      }

      // 2. Application aux POINTS
      geometryManager.points.forEach((p) => {
        // Les points n'ont pas de méthode setVisibility dans votre classe actuelle, on le fait manuellement
        p.mesh.visible = areAllObjectsVisible;
        if (p.label) p.label.visible = areAllObjectsVisible;
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

      showSplashScreen(areAllObjectsVisible ? "👁️  Tout afficher" : "🙈 Tout masquer");
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
      camera.position.x = cameraTarget.x + cameraDistance * Math.sin(cameraRotation.y) * Math.cos(cameraRotation.x);
      camera.position.y = cameraTarget.y + cameraDistance * Math.sin(cameraRotation.x);
      camera.position.z = cameraTarget.z + cameraDistance * Math.cos(cameraRotation.y) * Math.cos(cameraRotation.x);
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
      if (isDragging || isPanning) if (Math.abs(dX) > 3 || Math.abs(dY) > 3) wasDragged = true;
      if (isDragging) {
        cameraRotation.y += dX * 0.005;
        cameraRotation.x += dY * 0.005;
        cameraRotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, cameraRotation.x));
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
      document.querySelectorAll("#cameraControls .camera-btn").forEach((b) => b.classList.remove("active"));
      if (btn) btn.classList.add("active");
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll(".section-header").forEach((header) => {
        header.addEventListener("click", () => header.closest(".section").classList.toggle("collapsed"));
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
        const start = new THREE.Vector3().addVectors(inst.startPoint, dir.clone().multiplyScalar(-lineLength));
        const end = new THREE.Vector3().addVectors(inst.startPoint, dir.clone().multiplyScalar(lineLength));

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
      const angleDeg = parseFloat(document.getElementById("rotationAngle").value) || 0;
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
        const newComponents = inst.components.clone().applyAxisAngle(rotationAxis, angleRad);

        inst.update(inst.name, newOrigin, newComponents);
      } else if (inst instanceof Plane) {
        rotatePoint(inst.pointOnPlane, centerOfRotation);

        // La normale du plan tourne aussi
        inst.normal.applyAxisAngle(rotationAxis, angleRad);
        inst.displayNormal.applyAxisAngle(rotationAxis, angleRad);

        inst.mesh.position.copy(inst.pointOnPlane);
        inst.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), inst.normal.clone().normalize());
      } else if (inst instanceof Line3D) {
        rotatePoint(inst.startPoint, centerOfRotation);
        inst.directorVector.applyAxisAngle(rotationAxis, angleRad);

        // Recalcul géométrie (identique au fix de translation)
        const lineLength = 100;
        const dir = inst.directorVector.clone().normalize();
        const start = new THREE.Vector3().addVectors(inst.startPoint, dir.clone().multiplyScalar(-lineLength));
        const end = new THREE.Vector3().addVectors(inst.startPoint, dir.clone().multiplyScalar(lineLength));

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
        else if (type === "line") refObject = geometryManager.findLineById(parseInt(refId));
        else if (type === "plane") refObject = geometryManager.findPlaneById(parseInt(refId));
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
            const projectedPoint = new THREE.Vector3().addVectors(lineStart, projection);
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
        const endPoint = new THREE.Vector3().addVectors(inst.origin, inst.components);
        const newEndPoint = transformVector(endPoint);
        const newComponents = new THREE.Vector3().subVectors(newEndPoint, newOrigin);

        inst.update(inst.name, newOrigin, newComponents);
      } else if (inst instanceof Line3D) {
        const newStart = transformVector(inst.startPoint);
        // Pour le vecteur directeur, on transforme le point "start + dir" et on soustrait le nouveau start
        const endPoint = new THREE.Vector3().addVectors(inst.startPoint, inst.directorVector);
        const newEnd = transformVector(endPoint);
        const newDir = new THREE.Vector3().subVectors(newEnd, newStart);

        // Mise à jour manuelle (similaire à translation/rotation)
        inst.startPoint.copy(newStart);
        inst.directorVector.copy(newDir);

        const lineLength = 100;
        const dir = inst.directorVector.clone().normalize();
        const start = new THREE.Vector3().addVectors(inst.startPoint, dir.clone().multiplyScalar(-lineLength));
        const end = new THREE.Vector3().addVectors(inst.startPoint, dir.clone().multiplyScalar(lineLength));

        inst.mesh.geometry.dispose();
        inst.mesh.geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        if (inst === selectedObjectInstance) inst.mesh.material.color.set(HIGHLIGHT_COLOR);
      } else if (inst instanceof Plane) {
        // Transformation du point d'ancrage
        const newPointOnPlane = transformVector(inst.pointOnPlane);

        // Transformation de la normale : on transforme (point + normal) et on soustrait le nouveau point
        const pointPlusNormal = new THREE.Vector3().addVectors(inst.pointOnPlane, inst.normal);
        const newPointPlusNormal = transformVector(pointPlusNormal);
        const newNormal = new THREE.Vector3().subVectors(newPointPlusNormal, newPointOnPlane).normalize();

        inst.pointOnPlane.copy(newPointOnPlane);
        inst.normal.copy(newNormal);
        inst.displayNormal.copy(newNormal);

        inst.mesh.position.copy(inst.pointOnPlane);
        inst.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), inst.normal);
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
            directorVector: { x: l.directorVector.x, y: l.directorVector.y, z: l.directorVector.z },
          })),
          planes: geometryManager.planes.map((p) => ({
            id: p.id,
            name: p.name,
            pointOnPlane: { x: p.pointOnPlane.x, y: p.pointOnPlane.y, z: p.pointOnPlane.z },
            displayNormal: { x: p.displayNormal.x, y: p.displayNormal.y, z: p.displayNormal.z },
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

      showSplashScreen(`âœ… Scène exportée : ${filename}`);
    }

    function importSceneFromJSON(inputElement) {
      const file = inputElement.files[0];
      if (!file) {
        showSplashScreen("âŒ Aucun fichier sélectionné.");
        return;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const sceneData = JSON.parse(e.target.result);

          // Vérifier la structure du fichier
          if (!sceneData.geometry) {
            showSplashScreen("âŒ Fichier JSON invalide : structure incorrecte.");
            return;
          }

          // 1. Nettoyer la scène actuelle
          geometryManager.clearAll();

          // 2. Désérialiser et reconstruire la géométrie
          if (sceneData.geometry.points) {
            sceneData.geometry.points.forEach((p) => {
              geometryManager.addPoint(new Point(p.name, p.position.x, p.position.y, p.position.z));
            });
          }

          if (sceneData.geometry.vectors) {
            sceneData.geometry.vectors.forEach((v) => {
              const origin = new THREE.Vector3(v.origin.x, v.origin.y, v.origin.z);
              const components = new THREE.Vector3(v.components.x, v.components.y, v.components.z);
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
              const startPoint = new THREE.Vector3(l.startPoint.x, l.startPoint.y, l.startPoint.z);
              const directorVector = new THREE.Vector3(l.directorVector.x, l.directorVector.y, l.directorVector.z);
              const newLine = new Line3D(l.name, startPoint, directorVector);
              newLine.id = l.id;
              nextStraightLineId = Math.max(nextStraightLineId, l.id + 1);
              geometryManager.addLine(newLine);
            });
          }

          if (sceneData.geometry.planes) {
            sceneData.geometry.planes.forEach((p) => {
              const pointOnPlane = new THREE.Vector3(p.pointOnPlane.x, p.pointOnPlane.y, p.pointOnPlane.z);
              const normal = new THREE.Vector3(p.displayNormal.x, p.displayNormal.y, p.displayNormal.z);
              const newPlane = new Plane(p.name, pointOnPlane, normal);
              newPlane.id = p.id;
              nextPlaneId = Math.max(nextPlaneId, p.id + 1);
              geometryManager.addPlane(newPlane);
            });
          }

          showSplashScreen(`âœ… Scène importée : ${file.name}`);
          updateAllUI();

        } catch (error) {
          console.error("Erreur lors de l'import:", error);
          showSplashScreen("âŒ Erreur lors de l'import du fichier JSON.");
        }
      };

      reader.onerror = function () {
        showSplashScreen("âŒ Erreur lors de la lecture du fichier.");
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
        showSplashScreen("Action annulée â†©ï¸");
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
        showSplashScreen("Action rétablie â†ªï¸");
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
          directorVector: { x: l.directorVector.x, y: l.directorVector.y, z: l.directorVector.z },
          // Sauvegarde de la visibilité
          isVisible: l.isVisible,
        })),
        planes: geometryManager.planes.map((p) => ({
          id: p.id,
          name: p.name,
          pointOnPlane: { x: p.pointOnPlane.x, y: p.pointOnPlane.y, z: p.pointOnPlane.z },
          displayNormal: { x: p.displayNormal.x, y: p.displayNormal.y, z: p.displayNormal.z },
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
          geometryManager.addPoint(new Point(p.name, p.position.x, p.position.y, p.position.z))
        );
      }

      // --- VECTEURS ---
      if (data.vectors) {
        data.vectors.forEach((v) => {
          const vec = new Vector(
            v.name,
            new THREE.Vector3(v.origin.x, v.origin.y, v.origin.z),
            new THREE.Vector3(v.components.x, v.components.y, v.components.z)
          );
          vec.id = v.id;
          vec.isNormalVector = v.isNormalVector;
          vec.parentPlaneId = v.parentPlaneId;
          nextVectorId = Math.max(nextVectorId, v.id + 1);

          // RESTAURATION VISIBILITÉ VECTEUR
          // 1. On charge la propriété (par défaut true si non définie)
          vec.isVisible = v.isVisible !== undefined ? v.isVisible : true;
          vec.isLabelVisible = v.isLabelVisible !== undefined ? v.isLabelVisible : true;

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
            new THREE.Vector3(l.directorVector.x, l.directorVector.y, l.directorVector.z)
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
            new THREE.Vector3(p.displayNormal.x, p.displayNormal.y, p.displayNormal.z)
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
        const detailStyle = 'style="color: #ddd; font-size: 0.9em; display: block; margin-top: 2px;"';

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

        const originListSpan = document.getElementById(`vector-origin-list-${inst.id}`);
        if (originListSpan) {
          const ox = formatNumber(currentOrigin.x, 1);
          const oy = formatNumber(currentOrigin.z, 1);
          const oz = formatNumber(currentOrigin.y, 1);
          originListSpan.innerHTML = `Origine: <strong>(${ox}, ${oy}, ${oz})</strong>`;
        }

        if (document.getElementById("editVectorId").value == inst.id) {
          document.getElementById("vectorOriginX").value = formatNumber(currentOrigin.x);
          document.getElementById("vectorOriginY").value = formatNumber(currentOrigin.z);
          document.getElementById("vectorOriginZ").value = formatNumber(currentOrigin.y);
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
            document.getElementById(`sheet-v-${inst.id}-oy`).value = formatNumber(o.z);
            document.getElementById(`sheet-v-${inst.id}-oz`).value = formatNumber(o.y);
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
          const rotationMatrix = new THREE.Matrix4().extractRotation(inst.mesh.matrix);
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
          document.getElementById("planeEqPointX").value = formatNumber(inst.pointOnPlane.x);
          document.getElementById("planeEqPointY").value = formatNumber(inst.pointOnPlane.z); // Profondeur
          document.getElementById("planeEqPointZ").value = formatNumber(inst.pointOnPlane.y); // Hauteur

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
      const detailStyle = 'style="color: #ddd; font-size: 0.9em; display: block; margin-top: 2px;"';

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

          content = `â†—ï¸ <strong>${inst.name}</strong>
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

          content = `ðŸ“ <strong>${inst.name}</strong>
                 <span ${detailStyle}>Passe par : (${px}, ${py_ui}, ${pz_ui})</span>
                 <span ${detailStyle}>Vect. dir. : (${ux}, ${uz_ui}, ${uy_ui})</span>`;
        }
        // -----------------------------------
        else if (inst instanceof Plane) {
          const currentP = inst.pointOnPlane.clone().add(inst.mesh.position);

          // Calcul de la normale (avec rotation si nécessaire)
          let n = inst.normal;
          if (transformControl.mode === "rotate") {
            const rotationMatrix = new THREE.Matrix4().extractRotation(inst.mesh.matrix);
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
        const visualStart = new THREE.Vector3().addVectors(inst.startPoint, dir.clone().multiplyScalar(-lineLength));
        const visualEnd = new THREE.Vector3().addVectors(inst.startPoint, dir.clone().multiplyScalar(lineLength));

        inst.mesh.geometry.dispose();
        inst.mesh.geometry = new THREE.BufferGeometry().setFromPoints([visualStart, visualEnd]);

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
          position_ui: { x: p.position.x, profondeur: p.position.z, hauteur: p.position.y },
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
          directorVector: { x: l.directorVector.x, y: l.directorVector.y, z: l.directorVector.z },
          isVisible: l.isVisible,
        })),
        planes: geometryManager.planes.map((p) => ({
          id: p.id,
          name: p.name,
          pointOnPlane: { x: p.pointOnPlane.x, y: p.pointOnPlane.y, z: p.pointOnPlane.z },
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
      document.documentElement.setAttribute("data-theme", isDarkMode ? "dark" : "light");

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
      if (!pointsArray || pointsArray.length === 0) return new THREE.Vector3(0, 0, 0);

      let sumX = 0,
        sumY = 0,
        sumZ = 0;
      let totalWeight = 0;

      for (let i = 0; i < pointsArray.length; i++) {
        const p = pointsArray[i].position;
        // Si pas de poids fourni, on utilise 1 (isobarycentre)
        const w = weightsArray && weightsArray[i] !== undefined ? parseFloat(weightsArray[i]) : 1;

        sumX += p.x * w;
        sumY += p.y * w;
        sumZ += p.z * w;
        totalWeight += w;
      }

      if (totalWeight === 0) {
        console.warn("Somme des poids nulle, calcul impossible.");
        return new THREE.Vector3(0, 0, 0);
      }

      return new THREE.Vector3(sumX / totalWeight, sumY / totalWeight, sumZ / totalWeight);
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
        const newVector = new Vector(uniqueName, result.p1, segmentVector, 0xff00ff); // Magenta
        geometryManager.addVector(newVector);

        // Création des points d'intersection H1 et H2
        geometryManager.addPoint(new Point(uniqueName + "_H1", result.p1.x, result.p1.y, result.p1.z)); // Attention inversion Y/Z selon votre logique UI
        geometryManager.addPoint(new Point(uniqueName + "_H2", result.p2.x, result.p2.y, result.p2.z));

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
        vectorObj.components // Vecteur directeur
      );

      // 6. Ajout et Sauvegarde
      geometryManager.addLine(newLine);

      updateAllUI();
      saveState();

      // 7. Nettoyage des champs
      nameInput.value = "";
      pSelect.value = "";
      vSelect.value = "";

      showSplashScreen(`âœ… Droite "${uniqueName}" créée !`);
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
      if (selectedObjectInstance === line && typeof transformControl !== "undefined") {
        transformControl.detach();
        transformControl.attach(line.mesh);
      }

      // 6. Mise à jour de l'interface (Liste à gauche)
      updateAllUI(); // Ceci met à jour la liste "Droites existantes"
      saveState(); // Historique

      // 7. Sortir du mode édition
      cancelLineEdit();
      showSplashScreen(`âœ… Droite mise à jour !`);
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
        newPoint.set(parseFloat(pxStr) || 0, parseFloat(pzStr) || 0, parseFloat(pyStr) || 0);
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
        } catch (e) { }

        // Trouver un point valide
        if (Math.abs(newNormalUnnormalized.x) > 1e-6) newPoint.set(-d / newNormalUnnormalized.x, 0, 0);
        else if (Math.abs(newNormalUnnormalized.z) > 1e-6)
          newPoint.set(0, 0, -d / newNormalUnnormalized.z); // Z 3D = Y UI (b)
        else if (Math.abs(newNormalUnnormalized.y) > 1e-6) newPoint.set(0, -d / newNormalUnnormalized.y, 0); // Y 3D = Z UI (c)
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
      plane.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), plane.normal);
      plane.mesh.updateMatrix();

      // C. Gestion Gizmo
      if (selectedObjectInstance === plane && typeof transformControl !== "undefined") {
        transformControl.detach();
        transformControl.attach(plane.mesh);
      }

      // D. Gestion Vecteur Normal affiché (Vn)
      // Si le bouton "Vn" est actif, on doit mettre à jour le vecteur visuel aussi
      const existingVn = geometryManager.vectors.find((v) => v.parentPlaneId === plane.id && v.isNormalVector);
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
      showSplashScreen(`âœ… Plan mis à jour !`);
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
      if (!confirm("Attention : L'importation va remplacer la scène actuelle. Voulez-vous continuer ?")) {
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
          p.position.x
        )}" onchange="sheetUpdatePointCoords(${index})"></td>
      <td class="col-y"><input type="number" step="0.1" id="sheet-p-${index}-y" value="${formatNumber(
          p.position.z
        )}" onchange="sheetUpdatePointCoords(${index})"></td>
      <td class="col-z"><input type="number" step="0.1" id="sheet-p-${index}-z" value="${formatNumber(
          p.position.y
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
          p.z
        )}</td><td class="col-z">${formatNumber(p.y)}</td>
            <td class="col-x">${formatNumber(u.x)}</td><td class="col-y">${formatNumber(
          u.z
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
          pt.z
        )}</td><td class="col-z">${formatNumber(pt.y)}</td>
            <td class="col-x">${formatNumber(n.x)}</td><td class="col-y">${formatNumber(
          n.z
        )}</td><td class="col-z">${formatNumber(n.y)}</td>
        </tr>`;
      });
    }

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
      const vP0P = new THREE.Vector3().subVectors(point.position, plane.pointOnPlane);
      const distSigned = vP0P.dot(plane.normal);
      const projectedPos = point.position.clone().sub(plane.normal.clone().multiplyScalar(distSigned));

      // 1. Créer le point projeté H
      const hName = `Proj_${point.name}`;
      const hPoint = new Point(
        geometryManager.generateUniqueName(hName, "point"),
        projectedPos.x,
        projectedPos.y,
        projectedPos.z,
        0x555555
      ); // Gris
      // Attention constructeur Point(name, x, y, z) -> ThreeJS Y/Z inversion dans votre code original ? Vérifiez l'ordre.
      // Si votre constructeur est Point(name, x, z_ui, y_ui), passez (projectedPos.x, projectedPos.z, projectedPos.y)

      geometryManager.addPoint(hPoint);

      // 2. Créer le segment en pointillé [PH]
      const dashMaterial = new THREE.LineDashedMaterial({ color: 0x555555, dashSize: 0.5, gapSize: 0.2 });
      const geom = new THREE.BufferGeometry().setFromPoints([point.position, hPoint.position]);
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
      var sceneName = document.getElementById("sceneNameInput").value || "Sans titre";
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
        'body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.5; }'
      );
      html.push("h1 { color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 10px; }");
      html.push(
        "h2 { color: #2980b9; margin-top: 30px; border-left: 5px solid #2980b9; padding-left: 10px; background: #f4f8fb; padding-top:5px; padding-bottom:5px; }"
      );
      html.push("h3 { color: #16a085; margin-top: 20px; font-size: 1.1em; }");
      html.push("table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }");
      html.push("th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }");
      html.push("th { background-color: #f2f2f2; font-weight: bold; }");
      html.push(
        '.math { font-family: "Courier New", monospace; background: #eee; padding: 2px 5px; border-radius: 3px; color: #d35400; font-weight: bold; }'
      );
      html.push(
        ".intro { background: #f9f9f9; padding: 15px; border: 1px solid #ddd; margin-bottom: 20px; border-radius: 4px; }"
      );
      html.push(
        ".tag { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 12px; color: white; font-weight: bold; vertical-align: middle; margin-right: 5px; }"
      );
      html.push(".tag-para { background-color: #3498db; }");
      html.push(".tag-perp { background-color: #9b59b6; }");
      html.push(".tag-dist { background-color: #e67e22; }");
      html.push(".tag-inter { background-color: #27ae60; }");
      html.push(".tag-proj { background-color: #8e44ad; }"); /* Nouveau tag violet */
      html.push("ul { list-style-type: none; padding: 0; }");
      html.push("li.relation-item { margin-bottom: 8px; padding: 8px; border-bottom: 1px solid #eee; }");
      html.push(
        ".proof { font-size: 0.9em; color: #555; margin-top: 4px; padding-left: 10px; border-left: 2px solid #9b59b6; }"
      );
      html.push("</style>");
      html.push("</head>");
      html.push("<body>");

      html.push("<h1>Rapport Géométrique 3D</h1>");
      html.push('<div class="intro">');
      html.push("<strong>Scène :</strong> " + escapeHtml(sceneName) + "<br>");
      html.push("<strong>Date :</strong> " + reportDate + "<br>");
      html.push("<strong>Convention :</strong> Repère (O, x, y, z) où <em>z</em> est la hauteur.");
      html.push("</div>");

      // --- 1. POINTS ---
      if (geometryManager.points.length > 0) {
        html.push(
          "<h2>1. Points</h2><table><thead><tr><th>Nom</th><th>Coordonnées (x, y, z)</th></tr></thead><tbody>"
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
            ")</td></tr>"
          );
        });
        html.push("</tbody></table>");
      }

      // --- 2. VECTEURS ---
      if (geometryManager.vectors.length > 0) {
        html.push(
          "<h2>2. Vecteurs</h2><table><thead><tr><th>Nom</th><th>Composantes</th><th>Norme</th><th>Origine</th></tr></thead><tbody>"
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
            ")</td>"
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
            ")</li>"
          );
          html.push(
            "<li><strong>Vecteur:</strong> u(" +
            formatNumber(u.x) +
            "; " +
            formatNumber(u.z) +
            "; " +
            formatNumber(u.y) +
            ")</li>"
          );
          html.push(
            '<li><strong>Paramétrique:</strong><br><div class="math" style="display:inline-block; border-left:3px solid #ccc; padding-left:10px;">' +
            eq +
            "</div></li>"
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
            ")</li>"
          );
          html.push('<li><strong>Cartésienne:</strong> <span class="math">' + cart + "</span></li>");
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
              var distH_Plan = Math.abs(new THREE.Vector3().subVectors(H.position, pl.pointOnPlane).dot(pl.normal));

              if (distH_Plan < 0.01) {
                // Et si PH est colinéaire à la normale (produit vectoriel nul)
                var cross = new THREE.Vector3().crossVectors(vecPH.clone().normalize(), pl.normal);
                if (cross.length() < 0.01) {
                  html.push(
                    '<li class="relation-item"><span class="tag tag-proj">PROJECTION</span> <strong>' +
                    H.name +
                    "</strong> est le projeté orthogonal de <strong>" +
                    P.name +
                    "</strong> sur le plan <strong>" +
                    pl.name +
                    "</strong>.</li>"
                  );
                  html.push(
                    '<li class="relation-item" style="padding-left:40px;">â†³ Distance exacte = <span class="math">' +
                    formatNumber(distPH) +
                    "</span></li>"
                  );
                  relationsFound = true;
                }
              }
            });

            // 2. Projection sur DROITE
            geometryManager.lines.forEach(function (ln) {
              // Si H appartient à la droite
              var mathLine = new THREE.Line3(
                ln.startPoint.clone().add(ln.directorVector.clone().multiplyScalar(-1000)),
                ln.startPoint.clone().add(ln.directorVector.clone().multiplyScalar(1000))
              );
              var closestPoint = new THREE.Vector3();
              mathLine.closestPointToPoint(H.position, true, closestPoint);

              if (H.position.distanceTo(closestPoint) < 0.01) {
                // Et si PH est orthogonal au vecteur directeur (produit scalaire nul)
                var dot = Math.abs(vecPH.clone().normalize().dot(ln.directorVector.clone().normalize()));
                if (dot < 0.01) {
                  html.push(
                    '<li class="relation-item"><span class="tag tag-proj">PROJECTION</span> <strong>' +
                    H.name +
                    "</strong> est le projeté orthogonal de <strong>" +
                    P.name +
                    "</strong> sur la droite <strong>" +
                    ln.name +
                    "</strong>.</li>"
                  );
                  html.push(
                    '<li class="relation-item" style="padding-left:40px;">â†³ Distance exacte = <span class="math">' +
                    formatNumber(distPH) +
                    "</span></li>"
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
                '<li class="relation-item"><span class="tag tag-para">PARALLÃˆLES</span> Droites <strong>' +
                l1.name +
                "</strong> // <strong>" +
                l2.name +
                "</strong></li>"
              );
              var p1p2 = new THREE.Vector3().subVectors(p2, p1);
              var dist = p1p2.cross(u1).length();
              html.push(
                '<li class="relation-item" style="padding-left:40px;">â†³ Distance = <span class="math">' +
                formatNumber(dist) +
                "</span></li>"
              );
              relationsFound = true;
            } else {
              var isOrtho = dotDir < 0.001;
              var typeAngle = "";
              var proofOrtho = "";

              if (isOrtho) {
                typeAngle = '<span class="tag tag-perp">ORTHOGONALES</span> ';
                var x1 = formatNumber(u1.x),
                  y1 = formatNumber(u1.z),
                  z1 = formatNumber(u1.y);
                var x2 = formatNumber(u2.x),
                  y2 = formatNumber(u2.z),
                  z2 = formatNumber(u2.y);
                proofOrtho =
                  '<div class="proof">Preuve produit scalaire : <span class="math">u1 . u2 = 0</span></div>';
              }

              // Calcul distance min
              var p1p2 = new THREE.Vector3().subVectors(p2, p1);
              var distMin = Math.abs(p1p2.dot(crossDir)) / crossDir.length();

              if (distMin < 0.001) {
                // Intersection Point
                var crossU1U2 = new THREE.Vector3().crossVectors(u1, u2);
                var t1 = new THREE.Vector3().crossVectors(p1p2, u2).dot(crossU1U2) / crossU1U2.lengthSq();
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
                  "</strong></li>"
                );
                html.push(
                  '<li class="relation-item" style="padding-left:40px;">â†³ Intersection : <span class="math">' +
                  ptStr +
                  "</span></li>"
                );
                if (isOrtho)
                  html.push('<li class="relation-item" style="padding-left:40px;">' + proofOrtho + "</li>");
              } else {
                html.push(
                  '<li class="relation-item">' +
                  typeAngle +
                  "Droites <strong>" +
                  l1.name +
                  "</strong> et <strong>" +
                  l2.name +
                  "</strong> non-coplanaires.</li>"
                );
                html.push(
                  '<li class="relation-item" style="padding-left:40px;"><span class="tag tag-dist">DISTANCE</span> Min = <span class="math">' +
                  formatNumber(distMin) +
                  "</span></li>"
                );
                if (isOrtho)
                  html.push('<li class="relation-item" style="padding-left:40px;">' + proofOrtho + "</li>");
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
              var vDist = new THREE.Vector3().subVectors(l.startPoint, p.pointOnPlane);
              var dist = Math.abs(vDist.dot(n));
              if (dist < 0.001) {
                html.push(
                  '<li class="relation-item"><span class="tag tag-inter">INCLUSE</span> <strong>' +
                  l.name +
                  "</strong> âŠ‚ <strong>" +
                  p.name +
                  "</strong></li>"
                );
              } else {
                html.push(
                  '<li class="relation-item"><span class="tag tag-para">PARALLÃˆLE</span> <strong>' +
                  l.name +
                  "</strong> // <strong>" +
                  p.name +
                  "</strong> (Dist: " +
                  formatNumber(dist) +
                  ")</li>"
                );
              }
            } else {
              var num = new THREE.Vector3().subVectors(p.pointOnPlane, l.startPoint).dot(p.normal);
              var den = l.directorVector.clone().normalize().dot(p.normal);
              var interI = l.startPoint.clone().add(
                l.directorVector
                  .clone()
                  .normalize()
                  .multiplyScalar(num / den)
              );
              var ptStr =
                "(" + formatNumber(interI.x) + "; " + formatNumber(interI.z) + "; " + formatNumber(interI.y) + ")";

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
                "</strong></li>"
              );
              html.push(
                '<li class="relation-item" style="padding-left:40px;">â†³ Point I <span class="math">' +
                ptStr +
                "</span></li>"
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
        '<div style="margin-top:40px; text-align:center; border-top:1px solid #ddd; padding-top:20px; font-size:12px; color:#888;">'
      );
      html.push(
        '<button onclick="window.print()" style="padding:10px 20px; cursor:pointer; background:#2980b9; color:white; border:none; border-radius:4px; font-size:14px;">Imprimer / PDF</button>'
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

      var sDir = Math.abs(Math.abs(dir) - 1) < 0.001 ? "t" : formatNumber(Math.abs(dir)) + "t";

      if (dir < 0) return sStart ? sStart + " - " + sDir : "-" + sDir;
      return sStart ? sStart + " + " + sDir : sDir;
    }

    function formatSigned(val) {
      if (Math.abs(val) < 0.001) return "";
      var sign = val > 0 ? "+" : "-";
      var abs = Math.abs(Math.abs(val) - 1) < 0.001 ? "" : formatNumber(Math.abs(val));
      return sign + " " + abs;
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
        const material = new THREE.LineDashedMaterial({ color: 0xff00ff, dashSize: 0.5, gapSize: 0.2 });
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
        const material = new THREE.LineDashedMaterial({ color: 0xff00ff, dashSize: 0.5, gapSize: 0.2 });
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
