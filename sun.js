// =============================================================================
// objects/mars.js
// MARTE (planeta vermelho) + suas duas luas IRREGULARES: Fobos e Deimos.
// As luas usam geometria deformada (formato de batata) e orbitam Marte (nao o Sol),
// anexando seus grupos ao grupo de Marte -- mesmo padrao da Lua/Terra.
// =============================================================================

import * as THREE from 'three';
import { SCALE } from '../js/config.js';
import { CelestialBody, createOrbitLine } from '../js/celestialBody.js';
import { createIrregularGeometry } from '../js/procedural.js';

// Cria uma lua de formato irregular anexada a um corpo (planeta).
function createIrregularMoon(parent, cfg) {
  const group = new THREE.Group();
  const geo = createIrregularGeometry(cfg.radius, 3, cfg.seed, cfg.amp);
  // textura rochosa procedural + relevo (normal map); superficie suave para a textura aparecer bem
  const mat = new THREE.MeshStandardMaterial({
    map: cfg.textures.map, normalMap: cfg.textures.normalMap,
    normalScale: new THREE.Vector2(0.9, 0.9), roughness: 1.0, metalness: 0.0,
  });
  const mesh = new THREE.Mesh(geo, mat);
  if (cfg.stretch) mesh.scale.set(cfg.stretch[0], cfg.stretch[1], cfg.stretch[2]); // alonga (formato de batata)
  group.add(mesh);

  parent.group.add(group); // orbita RELATIVA ao planeta
  const orbit = createOrbitLine(cfg.orbitRadius, 0x7d756a, 0.26);
  parent.group.add(orbit);

  const maxStretch = cfg.stretch ? Math.max(cfg.stretch[0], cfg.stretch[1], cfg.stretch[2]) : 1;
  const body = new CelestialBody({
    id: cfg.id, name: cfg.name, type: 'Satelite Natural (irregular)', color: cfg.color,
    group, mesh, radius: cfg.radius * maxStretch, orbitLine: orbit,
    orbitRadius: cfg.orbitRadius, orbitSpeed: cfg.orbitSpeed, rotationSpeed: cfg.rotationSpeed,
    info: cfg.info, fact: cfg.fact,
  });
  // suporte a textura real por convencao: ex. textures/fobos.jpg + textures/fobos_normal.jpg
  body.realTextures = [
    { file: cfg.id, material: mat, slot: 'map', srgb: true },
    { file: cfg.id + '_normal', material: mat, slot: 'normalMap', srgb: false },
  ];
  return body;
}

export function createMars(scene, textures) {
  const group = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.rotation.z = THREE.MathUtils.degToRad(SCALE.MARS_TILT_DEG);
  group.add(tilt);

  const mat = new THREE.MeshStandardMaterial({
    map: textures.mars.map, normalMap: textures.mars.normalMap,
    normalScale: new THREE.Vector2(1.0, 1.0), roughness: 1.0, metalness: 0.0,
  });
  const surface = new THREE.Mesh(new THREE.SphereGeometry(SCALE.MARS_RADIUS, 56, 56), mat);
  tilt.add(surface);
  scene.add(group);

  const orbit = createOrbitLine(SCALE.MARS_ORBIT, 0xb05a3c, 0.30, 0.093, 3.4);
  scene.add(orbit);

  const mars = new CelestialBody({
    id: 'marte', name: 'Marte', type: 'Planeta Rochoso', color: '#e2703a',
    group, mesh: surface, radius: SCALE.MARS_RADIUS, orbitLine: orbit,
    orbitRadius: SCALE.MARS_ORBIT, orbitSpeed: 0.13, rotationSpeed: 0.26,
    eccentricity: 0.093, argPerihelion: 3.4,
    info: [
      ['Diametro', '6.779 km'],
      ['Ano (translacao)', '687 dias'],
      ['Dia (rotacao)', '24h37min'],
      ['Gravidade', '3,71 m/s\u00B2'],
      ['Luas', '2 (Fobos e Deimos)'],
      ['Distancia do Sol', '\u2248 227,9 milhoes de km'],
    ],
    fact: 'O "planeta vermelho" deve a cor ao oxido de ferro (ferrugem). Abriga o Monte Olimpo, o maior vulcao do Sistema Solar (~22 km de altura).',
  });
  mars.realTextures = [
    { file: 'marte', material: mat, slot: 'map', srgb: true },
    { file: 'marte_normal', material: mat, slot: 'normalMap', srgb: false },
  ];

  const phobos = createIrregularMoon(mars, {
    textures: textures.phobos,
    id: 'fobos', name: 'Fobos', color: '#9c9087', seed: 4, amp: 0.34, stretch: [1.35, 0.92, 0.78],
    radius: SCALE.PHOBOS_RADIUS, orbitRadius: SCALE.PHOBOS_ORBIT, orbitSpeed: 1.6, rotationSpeed: 1.6,
    info: [
      ['Tipo', 'Lua irregular'],
      ['Dimensoes', '~27 x 22 x 18 km'],
      ['Translacao', '~7,6 horas'],
      ['Orbita', 'ao redor de Marte'],
    ],
    fact: 'A maior e mais proxima lua de Marte. Tem formato irregular (batata) e orbita tao perto que da mais de 3 voltas em Marte por dia.',
  });

  const deimos = createIrregularMoon(mars, {
    textures: textures.deimos,
    id: 'deimos', name: 'Deimos', color: '#a89c8c', seed: 13, amp: 0.30, stretch: [1.22, 0.95, 0.85],
    radius: SCALE.DEIMOS_RADIUS, orbitRadius: SCALE.DEIMOS_ORBIT, orbitSpeed: 0.9, rotationSpeed: 0.9,
    info: [
      ['Tipo', 'Lua irregular'],
      ['Dimensoes', '~15 x 12 x 11 km'],
      ['Translacao', '~30,3 horas'],
      ['Orbita', 'ao redor de Marte'],
    ],
    fact: 'A menor e mais distante lua de Marte, tambem com formato irregular. Provavelmente e um asteroide capturado pela gravidade do planeta.',
  });

  return [mars, phobos, deimos];
}
