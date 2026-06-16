// =============================================================================
// lighting.js
// Iluminacao da cena. O Sol e a fonte PRINCIPAL de luz.
// =============================================================================

import * as THREE from 'three';
import { COLORS } from './config.js';

export function createLighting(scene) {
  // Luz pontual no centro (posicao do Sol), iluminando todos os planetas.
  // decay = 0 mantem a intensidade constante na escala educativa (nao realista).
  const sunLight = new THREE.PointLight(COLORS.sunLight, 2.6, 0, 0);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  // Luz ambiente fraca para o lado escuro dos planetas nao ficar 100% preto.
  const ambient = new THREE.AmbientLight(0x223349, 0.22);
  scene.add(ambient);

  return { sunLight, ambient };
}
