// =============================================================================
// objects/sun.js
// O SOL: esfera emissiva + brilho/halo luminoso + animacao de superficie.
// =============================================================================

import * as THREE from 'three';
import { SCALE } from '../js/config.js';
import { CelestialBody } from '../js/celestialBody.js';

export function createSun(scene, textures) {
  const group = new THREE.Group();

  // Nucleo: MeshBasicMaterial NAO e afetado por luz -> sempre brilhante (emissivo).
  const geo = new THREE.SphereGeometry(SCALE.SUN_RADIUS, 64, 64);
  const core = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: textures.sun }));
  group.add(core);

  // Brilho proximo e halo externo (sprites aditivos sempre de frente para a camera).
  const glowMat = new THREE.SpriteMaterial({
    map: textures.glow, color: 0xffd9a0, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(SCALE.SUN_RADIUS * 5, SCALE.SUN_RADIUS * 5, 1);
  group.add(glow);

  const haloMat = glowMat.clone();
  haloMat.opacity = 0.5;
  const halo = new THREE.Sprite(haloMat);
  halo.scale.set(SCALE.SUN_RADIUS * 9, SCALE.SUN_RADIUS * 9, 1);
  group.add(halo);

  scene.add(group);

  const body = new CelestialBody({
    id: 'sol', name: 'Sol', type: 'Estrela \u2022 Classe G2V', color: '#ff9d2e',
    group, mesh: core, radius: SCALE.SUN_RADIUS,
    orbitRadius: 0, orbitSpeed: 0, rotationSpeed: 0.035,
    info: [
      ['Tipo', 'Estrela ana amarela (G2V)'],
      ['Temperatura', '5.500 \u00B0C (superficie)'],
      ['Idade', '4,6 bilhoes de anos'],
      ['Massa', '1,989 \u00D7 10<sup>30</sup> kg'],
      ['Diametro', '\u2248 1.392.000 km'],
    ],
    fact: 'Concentra cerca de 99,86% de toda a massa do Sistema Solar. Caberiam mais de um milhao de Terras em seu interior.',
  });

  body.glow = glow; // referencias para a pulsacao no loop principal
  body.halo = halo;
  return body;
}
