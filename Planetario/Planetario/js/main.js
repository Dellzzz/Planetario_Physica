// =============================================================================
// main.js
// Orquestra a aplicacao: inicializa cena, camera, luz, controles, corpos e HUD.
// Mantem UM UNICO loop de animacao (evita o acumulo de requestAnimationFrame,
// que causa velocidade dobrada/triplicada).
// =============================================================================

import * as THREE from 'three';
import { SCALE } from './config.js';
import { createScene, createBackground } from './scene.js';
import { createCamera, CameraFocus } from './camera.js';
import { createLighting } from './lighting.js';
import { createControls, createSelection, createSelectionIndicator } from './controls.js';
import { createUI } from './ui.js';
import { selectables } from './celestialBody.js';
import { createSunTexture, createGlowTexture, createMercuryTextures, createVenusSurfaceTexture, createVenusCloudTexture } from './procedural.js';
import { createSun } from '../objects/sun.js';
import { createMercury } from '../objects/mercury.js';
import { createVenus } from '../objects/venus.js';

const state = { paused: false, orbitsVisible: true, hidden: false };

let scene, renderer, camera, controls, cameraFocus, ui;
let bodies = [], sun = null, sunLight = null, bg = null, indicator = null;
const clock = new THREE.Clock();

// Gera todas as texturas procedurais (etapa "pesada" do carregamento).
function buildTextures() {
  return {
    sun: createSunTexture(512),
    glow: createGlowTexture(256),
    mercury: createMercuryTextures(384),
    venusSurface: createVenusSurfaceTexture(384),
    venusClouds: createVenusCloudTexture(384),
  };
}

function onSelect(body) {
  cameraFocus.follow(body);
  indicator.select(body);
  ui.showInfo(body);
}

function resetView() {
  cameraFocus.reset();
  indicator.clear();
}

function init() {
  const canvas = document.getElementById('scene');
  const created = createScene(canvas);
  scene = created.scene; renderer = created.renderer;

  camera = createCamera();
  bg = createBackground(scene);
  sunLight = createLighting(scene).sunLight;
  controls = createControls(camera, renderer.domElement);
  cameraFocus = new CameraFocus(camera, controls);
  indicator = createSelectionIndicator(scene);

  // corpos celestes (cada um no seu proprio modulo)
  const textures = buildTextures();
  sun = createSun(scene, textures);
  const mercury = createMercury(scene, textures);
  const venus = createVenus(scene, textures);
  bodies = [sun, mercury, venus];

  ui = createUI({
    root: document.getElementById('hud-root'),
    bodies,
    onFocus: onSelect,
    onReset: resetView,
    onTogglePause: (p) => { state.paused = p; },
    onToggleOrbits: (v) => {
      state.orbitsVisible = v;
      for (const b of bodies) if (b.orbitLine) b.orbitLine.visible = v;
    },
  });

  createSelection({ camera, domElement: renderer.domElement, targets: selectables, onSelect, onMiss: null });

  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', () => {
    state.hidden = document.hidden;
    clock.getDelta(); // descarta o delta acumulado ao voltar para a aba
  });

  // esconde a tela de carregamento
  const loader = document.getElementById('loader');
  if (loader) { loader.classList.add('hidden'); setTimeout(() => loader.remove(), 600); }

  animate();
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// ---- UNICO loop de animacao -------------------------------------------------
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05); // limita saltos (aba inativa etc.)
  const elapsed = clock.elapsedTime;
  if (state.hidden) return; // economiza bateria quando a aba nao esta visivel

  if (!state.paused) {
    for (const b of bodies) {
      b.update(delta);
      if (b.atmosphere) b.atmosphere.rotation.y += (b.atmosphereSpeed || 0) * delta;
    }
    // pulsacao do Sol (intensidade luminosa variavel + brilho)
    sunLight.intensity = 2.6 + Math.sin(elapsed * 0.8) * 0.35;
    if (sun.glow) {
      const s = SCALE.SUN_RADIUS * 5 * (1 + Math.sin(elapsed * 1.1) * 0.04);
      sun.glow.scale.set(s, s, 1);
    }
    // movimento lento do fundo (paralaxe)
    if (bg) { bg.near.rotation.y += delta * 0.006; bg.far.rotation.y += delta * 0.0035; }
  }

  cameraFocus.update(delta);
  indicator.update(delta, elapsed);
  controls.update();
  renderer.render(scene, camera);
}

init();
