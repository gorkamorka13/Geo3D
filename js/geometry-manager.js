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
    [...this.points, ...this.lines, ...this.planes, ...this.vectors].forEach(
      (obj) => obj.removeFromScene(this.scene),
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

// Expose classes to window for browser global access
