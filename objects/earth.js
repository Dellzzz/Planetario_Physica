// =============================================================================
// objects/earth.js
// TERRA: superficie (continentes/oceanos) + nuvens + halo atmosferico azul,
// com inclinacao do eixo (~23,5 graus) e orbita ao redor do Sol.
// =============================================================================

import * as THREE from 'three';
import { SCALE } from '../js/config.js';
import { CelestialBody, createOrbitLine } from '../js/celestialBody.js';

export function createEarth(scene, textures) {
  const group = new THREE.Group(); // orbita ao redor do Sol

  // Grupo de inclinacao: tudo que gira fica dentro dele, entao o eixo de rotacao
  // (Y) sai inclinado ~23,5 graus -> e isso que, na vida real, gera as estacoes.
  const tilt = new THREE.Group();
  tilt.rotation.z = THREE.MathUtils.degToRad(SCALE.EARTH_TILT_DEG);
  group.add(tilt);

  // Superficie: oceanos lisos (roughnessMap baixo) e continentes asperos -> brilho do Sol no mar.
  const surfMat = new THREE.MeshStandardMaterial({
    map: textures.earth.map, roughnessMap: textures.earth.roughnessMap,
    roughness: 1.0, metalness: 0.0,
  });
  const surface = new THREE.Mesh(new THREE.SphereGeometry(SCALE.EARTH_RADIUS, 64, 64), surfMat);
  tilt.add(surface);

  // Nuvens: camada translucida, levemente maior, que gira lentamente.
  const cloudMat = new THREE.MeshStandardMaterial({
    map: textures.earthClouds, transparent: true, depthWrite: false, roughness: 1.0, metalness: 0.0,
  });
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(SCALE.EARTH_RADIUS * 1.012, 48, 48), cloudMat);
  tilt.add(clouds);

  // Atmosfera: halo azul de borda (casca BackSide com blending aditivo).
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(SCALE.EARTH_RADIUS * 1.03, 48, 48),
    new THREE.MeshBasicMaterial({
      color: 0x5fa8ff, transparent: true, opacity: 0.16, side: THREE.BackSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  group.add(glow);

  scene.add(group);

  const orbit = createOrbitLine(SCALE.EARTH_ORBIT, 0x4a7fc4, 0.32, 0.017, 2.0);
  scene.add(orbit);

  const body = new CelestialBody({
    id: 'terra', name: 'Terra', type: 'Planeta Rochoso', color: '#5fa8ff',
    group, mesh: surface, radius: SCALE.EARTH_RADIUS, orbitLine: orbit,
    orbitRadius: SCALE.EARTH_ORBIT, orbitSpeed: 0.17, rotationSpeed: 0.30,
    eccentricity: 0.017, argPerihelion: 2.0,
    info: [
      ['Diametro', '12.742 km'],
      ['Ano (translacao)', '365,25 dias'],
      ['Dia (rotacao)', '24 horas'],
      ['Gravidade', '9,81 m/s\u00B2'],
      ['Luas', '1'],
      ['Distancia do Sol', '\u2248 149,6 milhoes de km (1 UA)'],
    ],
    fact: 'Unico planeta com vida confirmada. Cerca de 71% da superficie e coberta por agua, e a inclinacao do eixo de ~23,5 graus e o que gera as estacoes do ano.',
  });

  body.atmosphere = clouds;     // o loop principal gira as nuvens lentamente
  body.atmosphereSpeed = 0.05;
  body.realTextures = [
    { file: 'terra', material: surfMat, slot: 'map', srgb: true },
    { file: 'terra_normal', material: surfMat, slot: 'normalMap', srgb: false },
    { file: 'terra_clouds', material: cloudMat, slot: 'map', srgb: true },
  ];
  return body;
}
