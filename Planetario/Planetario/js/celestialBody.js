// =============================================================================
// celestialBody.js
// Classe BASE para qualquer corpo celeste. Padroniza orbita e rotacao propria,
// permitindo expandir o sistema apenas criando novos corpos com a mesma
// interface (planetas, luas, asteroides, cometas...).
// =============================================================================

import * as THREE from 'three';

// Lista compartilhada de objetos clicaveis pelo Raycaster.
// Cada corpo registra aqui a(s) malha(s) que podem ser selecionadas.
export const selectables = [];

export class CelestialBody {
  constructor(cfg) {
    Object.assign(this, { orbitRadius: 0, orbitSpeed: 0, rotationSpeed: 0, info: [], fact: '' }, cfg);
    this.angle = Math.random() * Math.PI * 2; // posicao inicial aleatoria na orbita

    const meshes = cfg.selectableMeshes || (cfg.mesh ? [cfg.mesh] : []);
    for (const m of meshes) {
      m.userData.body = this;      // referencia de volta ao corpo (usada na selecao)
      selectables.push(m);
    }
  }

  // Atualiza posicao orbital e rotacao propria (chamado a cada frame).
  update(delta) {
    if (this.orbitRadius > 0) {
      this.angle += this.orbitSpeed * delta;
      this.group.position.x = Math.cos(this.angle) * this.orbitRadius;
      this.group.position.z = Math.sin(this.angle) * this.orbitRadius;
    }
    if (this.mesh) this.mesh.rotation.y += this.rotationSpeed * delta;
  }

  getWorldPosition(target) { return this.group.getWorldPosition(target); }
}

// Cria uma linha orbital circular visivel no plano XZ.
export function createOrbitLine(radius, color = 0x6a4a9c, opacity = 0.35, segments = 160) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  const line = new THREE.LineLoop(geo, mat);
  line.userData.isOrbit = true;
  return line;
}
