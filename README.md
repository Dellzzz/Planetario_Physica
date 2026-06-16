// =============================================================================
// objects/moon.js
// LUA: satelite natural que orbita a TERRA (nao o Sol).
//
// Truque de arquitetura: o grupo da Lua e anexado ao GRUPO DA TERRA. Assim, a
// mesma logica de orbita (cos/sin) da classe base passa a ser RELATIVA a Terra,
// sem precisar mudar nada no CelestialBody. Este e o padrao para luas, aneis etc.
// =============================================================================

import * as THREE from 'three';
import { SCALE } from '../js/config.js';
import { CelestialBody, createOrbitLine } from '../js/celestialBody.js';

export function createMoon(textures, earthBody) {
  const group = new THREE.Group(); // orbita RELATIVA a Terra

  const mat = new THREE.MeshStandardMaterial({
    map: textures.moon.map, normalMap: textures.moon.normalMap,
    normalScale: new THREE.Vector2(1.1, 1.1), roughness: 1.0, metalness: 0.0,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(SCALE.MOON_RADIUS, 48, 48), mat);
  group.add(mesh);

  // anexa a Lua e sua orbita ao grupo da Terra -> acompanham a Terra pelo espaco
  earthBody.group.add(group);
  const orbit = createOrbitLine(SCALE.MOON_ORBIT, 0x8893a8, 0.30);
  earthBody.group.add(orbit);

  const body = new CelestialBody({
    id: 'lua', name: 'Lua', type: 'Satelite Natural', color: '#cfd6e6',
    group, mesh, radius: SCALE.MOON_RADIUS, orbitLine: orbit,
    orbitRadius: SCALE.MOON_ORBIT, orbitSpeed: 0.8,
    rotationSpeed: 0.8, // rotacao SINCRONA: mesma face sempre voltada para a Terra
    info: [
      ['Diametro', '3.474 km'],
      ['Distancia da Terra', '\u2248 384.400 km'],
      ['Mes (translacao)', '27,3 dias'],
      ['Gravidade', '1,62 m/s\u00B2'],
      ['Orbita', 'ao redor da Terra'],
    ],
    fact: 'Tem rotacao sincrona: mostra sempre a mesma face para a Terra. E a principal responsavel pelas mares e e o 5o maior satelite do Sistema Solar.',
  });

  body.realTextures = [
    { file: 'lua', material: mat, slot: 'map', srgb: true },
    { file: 'lua_normal', material: mat, slot: 'normalMap', srgb: false },
  ];
  return body;
}
