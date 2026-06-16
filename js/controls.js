// =============================================================================
// controls.js
// OrbitControls (zoom/rotacao/pan com suporte a toque), selecao por Raycaster
// (toque/clique) e indicador visual do corpo selecionado.
// =============================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createRingTexture } from './procedural.js';

export function createControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.9;
  controls.panSpeed = 0.6;
  controls.minDistance = 1.0;
  controls.maxDistance = 300;
  controls.enablePan = true;
  // Gestos de toque: 1 dedo gira, 2 dedos aproximam/deslocam.
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  controls.target.set(0, 0, 0);
  return controls;
}

// Detecta toques/cliques que NAO sao arrasto (para nao selecionar ao girar a
// camera) e dispara onSelect(corpo) via Raycaster.
export function createSelection({ camera, domElement, targets, onSelect, onMiss }) {
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down = null;

  function pos(e) {
    const r = domElement.getBoundingClientRect();
    const p = (e.changedTouches && e.changedTouches[0]) || e;
    return { x: p.clientX - r.left, y: p.clientY - r.top, w: r.width, h: r.height };
  }

  domElement.addEventListener('pointerdown', (e) => {
    const p = pos(e);
    down = { x: p.x, y: p.y, t: performance.now(), moved: false };
  });
  domElement.addEventListener('pointermove', (e) => {
    if (!down) return;
    const p = pos(e);
    if (Math.hypot(p.x - down.x, p.y - down.y) > 8) down.moved = true;
  });
  domElement.addEventListener('pointerup', (e) => {
    if (!down) return;
    const wasTap = !down.moved && (performance.now() - down.t) < 400;
    down = null;
    if (!wasTap) return;
    const p = pos(e);
    ndc.x = (p.x / p.w) * 2 - 1;
    ndc.y = -(p.y / p.h) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(targets, false);
    if (hits.length && hits[0].object.userData.body) onSelect(hits[0].object.userData.body);
    else if (onMiss) onMiss();
  });
}

// Anel luminoso que marca o corpo selecionado (billboard sempre de frente).
export function createSelectionIndicator(scene) {
  const mat = new THREE.SpriteMaterial({
    map: createRingTexture(256), transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, opacity: 0,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.visible = false;
  scene.add(sprite);

  let body = null;
  const tmp = new THREE.Vector3();

  return {
    select(b) { body = b; sprite.visible = true; },
    clear() { body = null; sprite.visible = false; mat.opacity = 0; },
    update(delta, elapsed) {
      if (!body) return;
      body.getWorldPosition(tmp);
      sprite.position.copy(tmp);
      const base = (body.radius || 1) * 2.6 * (1 + Math.sin(elapsed * 3) * 0.05);
      sprite.scale.set(base, base, 1);
      mat.opacity = Math.min(0.9, mat.opacity + delta * 3);
    },
  };
}
