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
import { createDiagram } from '../objects/diagram.js';
import { buildShip, createNaveMode } from './nave.js?v=12'; // <-- NAVE: modo de exploracao
import { createBlackHole } from '../objects/blackhole.js?v=6'; // <-- BURACO NEGRO

const state = { paused: false, orbitsVisible: true, hidden: false };

let scene, renderer, camera, controls, cameraFocus, ui;
let bodies = [], sun = null, sunLight = null, bg = null, indicator = null, decorations = null, diagram = null, nave = null, blackHole = null;
const moonParent = {}; // id da lua -> corpo do planeta-mae (para o modo diagrama)
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
  if (diagram && diagram.active()) {
    // no diagrama so existem planetas visiveis; uma lua (oculta) vira o planeta-mae
    const target = moonParent[body.id] || body;
    ui.showInfo(target);       // mostra o painel imediatamente
    ui.setDiagramActive(false);
    diagram.exit(target);      // astros voltam as orbitas; ao terminar, a camera foca o alvo
    return;
  }
  cameraFocus.follow(body);
  indicator.select(body);
  ui.showInfo(body);
}

function resetView() {
  if (diagram && diagram.active()) { diagram.exit(null); ui.setDiagramActive(false); return; }
  cameraFocus.reset();
  indicator.clear();
}

function init() {
  window.__planetarioReady = true; // sinaliza que o modulo carregou e o init comecou
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

  // hierarquia para os menus: Sol + planetas no topo, cada um com suas luas no submenu
  const groups = [
    { planet: sun, moons: [] },
    { planet: mercury, moons: [] },
    { planet: venus, moons: [] },
    { planet: earth, moons: [moon] },
    { planet: marsSystem[0], moons: marsSystem.slice(1) },
    { planet: jupiterSystem[0], moons: jupiterSystem.slice(1) },
    { planet: saturnSystem[0], moons: saturnSystem.slice(1) },
    { planet: uranusSystem[0], moons: uranusSystem.slice(1) },
    { planet: neptuneSystem[0], moons: neptuneSystem.slice(1) },
  ];

  // ---- modo diagrama (alinha Sol + planetas; volta as orbitas ao selecionar) ----
  for (const g of groups) for (const mn of g.moons) moonParent[mn.id] = g.planet;
  function setAuxVisible(v) {
    for (const g of groups) {
      for (const mn of g.moons) {
        if (mn.group) mn.group.visible = v;                          // esconde/mostra as luas
        if (mn.orbitLine) mn.orbitLine.visible = v && state.orbitsVisible;
      }
      if (g.planet.orbitLine) g.planet.orbitLine.visible = v && state.orbitsVisible; // orbitas heliocentricas
    }
    if (sun.glow) sun.glow.visible = v;   // o brilho enorme do Sol ofuscaria a fileira
    if (sun.halo) sun.halo.visible = v;
    if (decorations && decorations.setVisible) decorations.setVisible(v); // cinturao/cometas
  }
  diagram = createDiagram({
    planets: groups.map((g) => g.planet),
    getCamera: () => camera,
    cameraFocus,
    sunLight,
    setAuxVisible,
    onFocusBody: (b) => { cameraFocus.follow(b); indicator.select(b); }, // ao terminar a volta, foca o astro
    onReset: () => { cameraFocus.reset(); indicator.clear(); },
  });

  // tenta substituir as texturas procedurais por arquivos reais em textures/
  applyRealTextures(bodies);

  ui = createUI({
    root: document.getElementById('hud-root'),
    bodies,
    groups,
    onFocus: onSelect,
    onReset: resetView,
    onTogglePause: (p) => { state.paused = p; },
    onToggleOrbits: (v) => {
      state.orbitsVisible = v;
      for (const b of bodies) if (b.orbitLine) b.orbitLine.visible = v;
    },
    onToggleDiagram: () => {
      if (diagram.active()) {
        diagram.exit(null); // volta as orbitas e reseta a visao
        ui.setDiagramActive(false);
      } else {
        ui.hide(); indicator.clear();   // limpa painel/submenu/selecao
        ui.setDiagramActive(true);
        diagram.enter();
      }
    },
    onFly: () => { if (nave) nave.enter(); },   // NAVE: botao PILOTAR fica na barra superior (ui.js)
  });

  createSelection({ camera, domElement: renderer.domElement, targets: selectables, onSelect, onMiss: null });

  // ---- MODO NAVE (exploracao em primeira pessoa) -----------------------------
  // A nave escala pelo raio da Terra do projeto e nasce junto da Terra.
  // O nave.js injeta sozinho a HUD de voo, o CSS e o botao PILOTAR.
  // --- BURACO NEGRO: na frente do nucleo da Via-Lactea (luz atras -> lente visivel) ---
  const GALAXY = new THREE.Vector3(4275, -540, -5625);            // nucleo galactico (scene.js)
  const bhPos = GALAXY.clone().normalize().multiplyScalar(1600);  // na frente da galaxia
  blackHole = createBlackHole({
    position: bhPos, rs: 42, diskInner: 2.3, diskOuter: 9.0,      // sombra ~3x o Sol (raio ~108)
    diskBright: 1.4, steps: 180, noApproach: 450,
  });
  // a lente faz o tonemap ACES agora (cena vai para o alvo sem tonemap)
  renderer.toneMapping = THREE.NoToneMapping;
  blackHole.setSize(window.innerWidth, window.innerHeight, Math.min(window.devicePixelRatio, 2));

  const ship = buildShip(earth.radius);
  scene.add(ship.group);                                  // a nave fica no scene RAIZ
  nave = createNaveMode({
    camera, controls, bodies, ship,
    spawnBody: earth,
    overviewUI: document.getElementById('hud-root'),      // some durante o voo
    flyButton: false,                                     // o botao PILOTAR agora vem do ui.js (barra superior)
    hazards: [{ position: blackHole.position, radius: blackHole.noApproach,
                message: 'Imposs\u00EDvel se aproximar mais \u2014 muito pr\u00F3ximo ao horizonte de eventos' }],
    onExit: () => { cameraFocus.reset(); indicator.clear(); },
  });

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
  if (blackHole) blackHole.setSize(window.innerWidth, window.innerHeight, Math.min(window.devicePixelRatio, 2));
}

// ---- UNICO loop de animacao -------------------------------------------------
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05); // limita saltos (aba inativa etc.)
  const elapsed = clock.elapsedTime;
  if (state.hidden) return; // economiza bateria quando a aba nao esta visivel

  const naveActive = nave && nave.active;  // modo nave assume camera e controle
  const tScale = naveActive ? 0.1 : 1;     // pilotando: planetas 10x mais lentos

  if (!state.paused) {
    if (diagram && diagram.active()) {
      diagram.update(delta); // no modo diagrama, este controlador posiciona os astros (orbitas congeladas)
    } else {
      for (const b of bodies) {
        b.update(delta * tScale);
        if (b.atmosphere) b.atmosphere.rotation.y += (b.atmosphereSpeed || 0) * delta * tScale;
      }
      if (decorations) decorations.update(delta * tScale);
    }
    // pulsacao do Sol (intensidade luminosa variavel + brilho) -- sempre ativa
    sunLight.intensity = 2.6 + Math.sin(elapsed * 0.8) * 0.35;
    if (sun.glow) {
      const s = SCALE.SUN_RADIUS * 5 * (1 + Math.sin(elapsed * 1.1) * 0.04);
      sun.glow.scale.set(s, s, 1);
    }
    // movimento lento do fundo (paralaxe)
    if (bg) { bg.near.rotation.y += delta * 0.006; bg.far.rotation.y += delta * 0.0035; }
  }

  if (naveActive) {
    nave.update(delta);            // a nave controla a camera enquanto pilota
  } else {
    cameraFocus.update(delta);
    indicator.update(delta, elapsed);
    controls.update();
  }
  if (blackHole) {
    blackHole.update(delta);
    blackHole.renderLens(renderer, scene, camera);   // cena -> alvo, depois lente -> tela
  } else {
    renderer.render(scene, camera);
  }
}

try {
  init();
} catch (e) {
  console.error('Erro ao iniciar o Planetario:', e);
  if (window.__showLoaderError) window.__showLoaderError('Erro ao iniciar: ' + (e && e.message ? e.message : e));
}
