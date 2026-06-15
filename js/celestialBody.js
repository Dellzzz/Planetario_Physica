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
    Object.assign(this, { orbitRadius: 0, orbitSpeed: 0, rotationSpeed: 0, eccentricity: 0, argPerihelion: 0, info: [], fact: '' }, cfg);
    this.angle = Math.random() * Math.PI * 2; // anomalia verdadeira inicial (aleatoria)

    const meshes = cfg.selectableMeshes || (cfg.mesh ? [cfg.mesh] : []);
    for (const m of meshes) {
      m.userData.body = this;      // referencia de volta ao corpo (usada na selecao)
      selectables.push(m);
    }
  }

  // Atualiza posicao orbital (2a lei de Kepler) e rotacao propria (cada frame).
  update(delta) {
    if (this.orbitRadius > 0) {
      const a = this.orbitRadius;            // semi-eixo maior
      const e = this.eccentricity;           // excentricidade (0 = circulo)
      const p = a * (1 - e * e);             // semi-latus rectum
      const r = p / (1 + e * Math.cos(this.angle)); // distancia ate o foco (o Sol)
      // LEI DAS AREAS (2a de Kepler): r^2 * dθ/dt = h (constante).
      // h e calibrado para manter o periodo medio igual a 2*PI/orbitSpeed.
      const h = this.orbitSpeed * a * a * Math.sqrt(1 - e * e);
      this.angle += (h / (r * r)) * delta;   // mais rapido perto do Sol, mais lento longe
      const w = this.argPerihelion;          // orientacao da elipse (argumento do perielio)
      this.group.position.x = r * Math.cos(this.angle + w);
      this.group.position.z = r * Math.sin(this.angle + w);
    }
    if (this.mesh) this.mesh.rotation.y += this.rotationSpeed * delta;
  }

  getWorldPosition(target) { return this.group.getWorldPosition(target); }
}

// Cria a linha orbital no plano XZ. Aceita elipse (Sol no foco); e=0 -> circulo.
export function createOrbitLine(a, color = 0x6a4a9c, opacity = 0.35, eccentricity = 0, argPerihelion = 0, segments = 220) {
  const p = a * (1 - eccentricity * eccentricity);
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const th = (i / segments) * Math.PI * 2;
    const r = p / (1 + eccentricity * Math.cos(th));
    pts.push(new THREE.Vector3(r * Math.cos(th + argPerihelion), 0, r * Math.sin(th + argPerihelion)));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  const line = new THREE.LineLoop(geo, mat);
  line.userData.isOrbit = true;
  return line;
}
