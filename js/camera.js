// =============================================================================
// camera.js
// Camera em perspectiva + foco com VIAGEM SUAVE (a camera percorre o caminho
// ate o corpo, sem teleportar) e, ao chegar, acompanha o corpo em orbita.
// =============================================================================

import * as THREE from 'three';

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 6000);
  camera.position.set(0, 22, 64);
  return camera;
}

const easeInOut = (t) => t * t * (3 - 2 * t); // suavizacao (smoothstep)

export class CameraFocus {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.body = null;
    this.flying = false;    // viagem suave em andamento
    this.resetting = false;
    this.desiredDist = 0;
    this.flyT = 0;
    this.flyDur = 1;
    this._p = new THREE.Vector3();
    this._startPos = new THREE.Vector3();
    this._startTarget = new THREE.Vector3();
    this._approachDir = new THREE.Vector3();
    this._endPos = new THREE.Vector3();
    this._tmpPos = new THREE.Vector3();
    this._tmpTarget = new THREE.Vector3();
    this.home = { pos: new THREE.Vector3(0, 22, 64), target: new THREE.Vector3(0, 0, 0) };
  }

  // duracao da viagem proporcional a distancia (perto = rapido, longe = um pouco mais)
  _travelDur(from, to) { return THREE.MathUtils.clamp(0.6 + from.distanceTo(to) * 0.006, 0.8, 2.0); }

  follow(body) {
    this.body = body;
    this.resetting = false;
    const r = body.radius || 1;
    this.desiredDist = r * 4 + 2; // enquadramento confortavel
    // inicia a VIAGEM suave ate o corpo (sem teleporte instantaneo)
    this.flying = true;
    this.flyT = 0;
    this._startPos.copy(this.camera.position);
    this._startTarget.copy(this.controls.target);
    const bp = body.getWorldPosition(this._p);
    this._approachDir.copy(this._startPos).sub(bp); // mantem a direcao atual de visao na chegada
    if (this._approachDir.lengthSq() < 1e-6) this._approachDir.set(0, 0.35, 1);
    this._approachDir.normalize();
    this.flyDur = this._travelDur(this._startPos, bp);
  }

  reset() {
    this.body = null;
    this.flying = false;
    this.resetting = true;
    this.flyT = 0;
    this._startPos.copy(this.camera.position);
    this._startTarget.copy(this.controls.target);
    this.flyDur = this._travelDur(this._startPos, this.home.pos);
  }

  update(delta) {
    if (this.body) {
      const bp = this.body.getWorldPosition(this._p);
      if (this.flying) {
        this.flyT += delta / this.flyDur;
        const k = easeInOut(Math.min(1, this.flyT));
        // o alvo viaja do ponto inicial ate o corpo (que pode estar se movendo)
        this._tmpTarget.copy(this._startTarget).lerp(bp, k);
        // ponto de chegada: a desiredDist do corpo, na direcao original de visao
        this._endPos.copy(bp).addScaledVector(this._approachDir, this.desiredDist);
        this._tmpPos.copy(this._startPos).lerp(this._endPos, k);
        this.controls.target.copy(this._tmpTarget);
        this.camera.position.copy(this._tmpPos);
        if (this.flyT >= 1) this.flying = false;
      } else {
        // ACOMPANHAMENTO RIGIDO: o corpo fica centralizado enquanto orbita.
        // A camera se desloca o mesmo que o alvo, preservando o angulo/zoom do usuario.
        const dx = bp.x - this.controls.target.x, dy = bp.y - this.controls.target.y, dz = bp.z - this.controls.target.z;
        this.controls.target.set(bp.x, bp.y, bp.z);
        this.camera.position.x += dx; this.camera.position.y += dy; this.camera.position.z += dz;
      }
    } else if (this.resetting) {
      // viagem suave de volta para a visao inicial
      this.flyT += delta / this.flyDur;
      const k = easeInOut(Math.min(1, this.flyT));
      this.controls.target.copy(this._startTarget).lerp(this.home.target, k);
      this.camera.position.copy(this._startPos).lerp(this.home.pos, k);
      if (this.flyT >= 1) this.resetting = false;
    }
  }
}
