// =============================================================================
// camera.js
// Camera em perspectiva + sistema de foco/aproximacao suave ao selecionar.
// =============================================================================

import * as THREE from 'three';

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 6000);
  camera.position.set(0, 18, 52);
  return camera;
}

// Controla a aproximacao suave ao selecionar um corpo e o acompanhamento do
// corpo em orbita. O alvo fica TRAVADO no corpo (centralizado, sem atraso),
// e apenas a DISTANCIA e animada na aproximacao. Convive com o OrbitControls.
export class CameraFocus {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.body = null;
    this.approaching = false;
    this.resetting = false;
    this.desiredDist = 0;
    this._p = new THREE.Vector3();
    this._dir = new THREE.Vector3();
    this.home = { pos: new THREE.Vector3(0, 18, 52), target: new THREE.Vector3(0, 0, 0) };
  }

  follow(body) {
    this.body = body;
    this.resetting = false;
    this.approaching = true;
    const r = body.radius || 1;
    this.desiredDist = r * 4 + 2; // enquadramento confortavel (constante menor p/ luas pequenas)
  }

  reset() {
    this.body = null;
    this.approaching = false;
    this.resetting = true;
  }

  update(delta) {
    const k = Math.min(1, delta * 3.5); // suavizacao independente de FPS
    if (this.body) {
      const bp = this.body.getWorldPosition(this._p);
      // ACOMPANHAMENTO RIGIDO: o corpo fica sempre no centro (sem atraso, mesmo
      // para planetas/luas rapidos). A camera se desloca o mesmo tanto que o alvo,
      // preservando o offset -> o usuario continua livre para girar/aproximar.
      const dx = bp.x - this.controls.target.x;
      const dy = bp.y - this.controls.target.y;
      const dz = bp.z - this.controls.target.z;
      this.controls.target.set(bp.x, bp.y, bp.z);
      this.camera.position.x += dx;
      this.camera.position.y += dy;
      this.camera.position.z += dz;

      if (this.approaching) {
        // anima suavemente apenas a distancia (zoom de aproximacao)
        this._dir.copy(this.camera.position).sub(this.controls.target);
        const dist = this._dir.length() || 0.0001;
        this._dir.divideScalar(dist);
        const newDist = THREE.MathUtils.lerp(dist, this.desiredDist, k);
        this.camera.position.copy(this.controls.target).addScaledVector(this._dir, newDist);
        if (Math.abs(newDist - this.desiredDist) < 0.3) this.approaching = false;
      }
    } else if (this.resetting) {
      this.controls.target.lerp(this.home.target, k);
      this.camera.position.lerp(this.home.pos, k);
      if (this.camera.position.distanceTo(this.home.pos) < 0.4) this.resetting = false;
    }
  }
}