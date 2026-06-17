// =============================================================================
// main.js
// Orquestra a aplicacao: inicializa cena, camera, luz, controles, corpos e HUD.
// Mantem UM UNICO loop de animacao (evita o acumulo de requestAnimationFrame,
// que causa velocidade dobrada/triplicada).
// =============================================================================

import * as THREE from 'three';
import { SCALE, REAL_TEXTURES } from './config.js';
import { createScene, createBackground } from './scene.js';
import { createCamera, CameraFocus } from './camera.js';
import { createLighting } from './lighting.js';
import { createControls, createSelection, createSelectionIndicator } from './controls.js';
import { createUI } from './ui.js';
import { selectables } from './celestialBody.js';
import { createSunTexture, createGlowTexture, createMercuryTextures, createVenusSurfaceTexture, createVenusCloudTexture, createEarthTextures, createEarthCloudTexture, createMoonTextures, createMarsTextures, createAsteroidTextures } from './procedural.js';
import { createSun } from '../objects/sun.js';
import { createMercury } from '../objects/mercury.js';
import { createVenus } from '../objects/venus.js';
import { createEarth } from '../objects/earth.js';
import { createMoon } from '../objects/moon.js';
import { createMars } from '../objects/mars.js';
import { createJupiter } from '../objects/jupiter.js';
import { createSaturn } from '../objects/saturn.js';
import { createUranus } from '../objects/uranus.js';
import { createNeptune } from '../objects/neptune.js';
import { createDecorations } from '../objects/decorations.js';

const state = { paused: false, orbitsVisible: true, hidden: false };

let scene, renderer, camera, controls, cameraFocus, ui;
let bodies = [], sun = null, sunLight = null, bg = null, indicator = null, decorations = null;
const clock = new THREE.Clock();

// Gera todas as texturas procedurais (etapa "pesada" do carregamento).
function buildTextures() {
  return {
    sun: createSunTexture(512),
    glow: createGlowTexture(256),
    mercury: createMercuryTextures(384),
    venusSurface: createVenusSurfaceTexture(384),
    venusClouds: createVenusCloudTexture(384),
    earth: createEarthTextures(512),
    earthClouds: createEarthCloudTexture(512),
    moon: createMoonTextures(384),
    mars: createMarsTextures(448),
    phobos: createAsteroidTextures(256, 4),
    deimos: createAsteroidTextures(256, 13),
  };
}

// Carrega texturas REAIS por convencao de nome e troca a procedural quando existir.
// Cada corpo declara em `body.realTextures` os arquivos que aceita.
// Se o arquivo nao existir (404), mantem-se a textura procedural (fallback).
function applyRealTextures(list) {
  const loader = new THREE.TextureLoader();
  for (const b of list) {
    if (!b.realTextures) continue;
    for (const slot of b.realTextures) {
      tryLoadTexture(loader, REAL_TEXTURES.basePath + slot.file, REAL_TEXTURES.extensions, 0, slot);
    }
  }
}

// Tenta cada extensao em ordem; aplica a primeira que carregar.
function tryLoadTexture(loader, base, exts, i, slot) {
  if (i >= exts.length) return; // nenhum formato encontrado -> mantem a procedural
  loader.load(
    base + '.' + exts[i],
    (tex) => {
      // mapa de cor usa sRGB; normal map usa espaco linear (NoColorSpace)
      tex.colorSpace = slot.srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = 4;
      slot.material[slot.slot] = tex;
      slot.material.needsUpdate = true; // recompila o shader (ex.: ativa o normal map)
    },
    undefined,
    () => tryLoadTexture(loader, base, exts, i + 1, slot) // erro/404 -> tenta a proxima extensao
  );
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
  const earth = createEarth(scene, textures);
  const moon = createMoon(textures, earth); // a Lua orbita a Terra
  const marsSystem = createMars(scene, textures); // [Marte, Fobos, Deimos] (luas orbitam Marte)
  const jupiterSystem = createJupiter(scene); // [Jupiter, Io, Europa, Ganimedes, Calisto]
  const saturnSystem = createSaturn(scene); // [Saturno, Dione, Reia, Tita, Japeto]
  const uranusSystem = createUranus(scene); // [Urano, Miranda, Ariel, Umbriel, Titania, Oberon]
  const neptuneSystem = createNeptune(scene); // [Netuno, Proteu, Tritao, Nereida]
  bodies = [sun, mercury, venus, earth, moon, ...marsSystem, ...jupiterSystem, ...saturnSystem, ...uranusSystem, ...neptuneSystem];
  decorations = createDecorations(scene); // cinturao de asteroides, meteoroides e cometas (so enfeite)

  // tenta substituir as texturas procedurais por arquivos reais em textures/
  applyRealTextures(bodies);

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
    if (decorations) decorations.update(delta);
  }

  cameraFocus.update(delta);
  indicator.update(delta, elapsed);
  controls.update();
  renderer.render(scene, camera);
}

init();
