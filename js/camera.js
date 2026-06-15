// =============================================================================
// camera.js
// Camera em perspectiva + sistema de foco/aproximacao suave ao selecionar.
// =============================================================================

import * as THREE from 'three';

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const MOBILE_MAX_W = 760; // abaixo disso o painel e um "bottom sheet"; subimos o astro

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 6000);
  camera.position.set(0, 18, 52);
  return camera;
}

// Controla o "voo" suave da camera ao selecionar um corpo e o acompanhamento
// do corpo em orbita, SEM brigar com o OrbitControls (preserva o offset relativo).
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
    this._desired = new THREE.Vector3();
    this._view = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._screenUp = new THREE.Vector3();
    this.panelOpen = false; // afeta o enquadramento no mobile
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
      // alvo desejado = posicao do astro. No mobile (painel aberto), deslocamos o alvo
      // "para baixo na tela" para que o astro suba e nao fique escondido atras do painel.
      this._desired.copy(bp);
      const frac = (this.panelOpen && window.innerWidth <= MOBILE_MAX_W) ? 0.22 : 0;
      if (frac > 0) {
        const D = this.camera.position.distanceTo(this.controls.target) || 0.0001;
        this._view.copy(this.controls.target).sub(this.camera.position).normalize(); // visada camera->alvo
        this._right.crossVectors(this._view, WORLD_UP);
        if (this._right.lengthSq() > 1e-6) {
          this._right.normalize();
          this._screenUp.crossVectors(this._right, this._view).normalize(); // "para cima" da tela, em mundo
          const shift = frac * 2 * D * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2);
          this._desired.addScaledVector(this._screenUp, -shift); // empurra o alvo p/ baixo -> astro sobe
        }
      }
      // move o alvo em direcao ao desejado e desloca a camera igualmente (mantem o offset)
      const nx = THREE.MathUtils.lerp(this.controls.target.x, this._desired.x, k);
      const ny = THREE.MathUtils.lerp(this.controls.target.y, this._desired.y, k);
      const nz = THREE.MathUtils.lerp(this.controls.target.z, this._desired.z, k);
      const dx = nx - this.controls.target.x, dy = ny - this.controls.target.y, dz = nz - this.controls.target.z;
      this.controls.target.set(nx, ny, nz);
      this.camera.position.x += dx; this.camera.position.y += dy; this.camera.position.z += dz;

      if (this.approaching) {
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
