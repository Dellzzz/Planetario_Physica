// =============================================================================
// objects/venus.js
// VENUS: superficie + atmosfera translucida com brilho e movimento lento,
// rotacao retrograda e orbita independente.
// =============================================================================

import * as THREE from 'three';
import { SCALE } from '../js/config.js';
import { CelestialBody, createOrbitLine } from '../js/celestialBody.js';

export function createVenus(scene, textures) {
  const group = new THREE.Group();

  // Camada interna: superficie rochosa.
  const surface = new THREE.Mesh(
    new THREE.SphereGeometry(SCALE.VENUS_RADIUS, 48, 48),
    new THREE.MeshStandardMaterial({ map: textures.venusSurface, roughness: 1.0, metalness: 0.0 })
  );
  group.add(surface);

  // Camada externa: atmosfera translucida (nuvens), levemente maior, com brilho.
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(SCALE.VENUS_RADIUS * 1.04, 48, 48),
    new THREE.MeshStandardMaterial({
      map: textures.venusClouds, transparent: true, opacity: 0.62, depthWrite: false,
      roughness: 1.0, metalness: 0.0, emissive: 0x4a3410, emissiveIntensity: 0.25,
    })
  );
  group.add(atmosphere);

  // Brilho de borda externo, sutil (efeito de halo atmosferico).
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(SCALE.VENUS_RADIUS * 1.12, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffe7a8, transparent: true, opacity: 0.10, side: THREE.BackSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  group.add(glow);

  scene.add(group);

  const orbit = createOrbitLine(SCALE.VENUS_ORBIT, 0x9c7a4a, 0.32, 0.007, 1.3);
  scene.add(orbit);

  const body = new CelestialBody({
    id: 'venus', name: 'Venus', type: 'Planeta Rochoso', color: '#f0c067',
    group, mesh: surface, radius: SCALE.VENUS_RADIUS, orbitLine: orbit,
    orbitRadius: SCALE.VENUS_ORBIT, orbitSpeed: 0.22, eccentricity: 0.007, argPerihelion: 1.3,
    rotationSpeed: -0.02, // rotacao RETROGRADA, lentissima (Venus)
    selectableMeshes: [surface, atmosphere], // tocar na atmosfera tambem seleciona
    info: [
      ['Diametro', '12.104 km'],
      ['Temperatura', '462 \u00B0C'],
      ['Gravidade', '8,87 m/s\u00B2'],
      ['Luas', '0'],
      ['Distancia do Sol', '\u2248 108,2 milhoes de km'],
    ],
    fact: 'E o planeta mais quente, devido a um intenso efeito estufa. Sua rotacao e retrograda: em Venus, o Sol nasce a oeste.',
  });

  // a atmosfera gira mais lentamente que a superficie (movimento lento)
  body.atmosphere = atmosphere;
  body.atmosphereSpeed = -0.02;

  // texturas reais opcionais: textures/venus.(jpg|png) + textures/venus_normal.(jpg|png)
  // (a atmosfera continua procedural; e so a superficie que recebe a textura real)
  body.realTextures = [
    { file: 'venus', material: surface.material, slot: 'map', srgb: true },
    { file: 'venus_normal', material: surface.material, slot: 'normalMap', srgb: false },
  ];
  return body;
}
