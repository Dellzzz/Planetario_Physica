// =============================================================================
// objects/mercury.js
// MERCURIO: textura rochosa + normal map (relevo visivel) + rotacao e orbita.
// =============================================================================

import * as THREE from 'three';
import { SCALE } from '../js/config.js';
import { CelestialBody, createOrbitLine } from '../js/celestialBody.js';

export function createMercury(scene, textures) {
  const group = new THREE.Group();

  const geo = new THREE.SphereGeometry(SCALE.MERCURY_RADIUS, 48, 48);
  const mat = new THREE.MeshStandardMaterial({
    map: textures.mercury.map,
    normalMap: textures.mercury.normalMap,
    normalScale: new THREE.Vector2(1.3, 1.3), // relevo visivel das crateras
    roughness: 1.0, metalness: 0.0,
  });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);
  scene.add(group);

  const orbit = createOrbitLine(SCALE.MERCURY_ORBIT, 0x7a6aa8, 0.35, 0.206, 0.5);
  scene.add(orbit);

  const body = new CelestialBody({
    id: 'mercurio', name: 'Mercurio', type: 'Planeta Rochoso', color: '#b8a48c',
    group, mesh, radius: SCALE.MERCURY_RADIUS, orbitLine: orbit,
    orbitRadius: SCALE.MERCURY_ORBIT, orbitSpeed: 0.30, rotationSpeed: 0.05,
    eccentricity: 0.206, argPerihelion: 0.5,
    info: [
      ['Diametro', '4.879 km'],
      ['Ano (translacao)', '88 dias'],
      ['Gravidade', '3,7 m/s\u00B2'],
      ['Luas', '0'],
      ['Distancia do Sol', '\u2248 57,9 milhoes de km'],
    ],
    fact: 'E o menor planeta do Sistema Solar e o mais proximo do Sol. A temperatura varia de cerca de 430 \u00B0C de dia a -180 \u00B0C a noite.',
  });

  // texturas reais opcionais: textures/mercurio.(jpg|png) + textures/mercurio_normal.(jpg|png)
  body.realTextures = [
    { file: 'mercurio', material: mat, slot: 'map', srgb: true },
    { file: 'mercurio_normal', material: mat, slot: 'normalMap', srgb: false },
  ];
  return body;
}
