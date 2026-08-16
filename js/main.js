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
import { createAnoes, createKuiper } from '../objects/anoes.js'; // <-- ANOES: Ceres, Plutao, Eris...
import { createOutros } from '../objects/outros.js';  // <-- buraco negro, galaxia, nebulosa, Proxima e Halley
import { aplicarDados } from './dados.js';    // <-- FICHA TECNICA padronizada de todos os astros
import { aplicarDadosCeu } from './ceu-profundo.js'; // <-- ficha dos astros de ceu profundo
import { createCatalogo } from './catalogo.js'; // <-- CATALOGO de astros
import { buildShip, createNaveMode } from './nave.js?v=12'; // <-- NAVE: modo de exploracao
import { createTour } from './tour.js?v=1'; // <-- TOUR: passeio guiado

const state = { paused: false, orbitsVisible: true, hidden: false };

let scene, renderer, camera, controls, cameraFocus, ui;
let bodies = [], sun = null, sunLight = null, bg = null, indicator = null, decorations = null, diagram = null, nave = null, tour = null;
let kuiper = null, catalogo = null, outros = null;
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
  const anoes = createAnoes(scene); // [Ceres, Plutao, Caronte, Haumea, Makemake, Eris]
  const acha = (id) => anoes.find((b) => b.id === id);
  bodies = [sun, mercury, venus, earth, moon, ...marsSystem, ...jupiterSystem, ...saturnSystem, ...uranusSystem, ...neptuneSystem, ...anoes];
  decorations = createDecorations(scene); // cinturao de asteroides, meteoroides e cometas (so enfeite)
  kuiper = createKuiper(scene);           // cinturao de Kuiper, alem de Netuno (so enfeite)
  // Maquetes ILUSTRATIVAS (fora de escala) + o cometa Halley, que orbita de verdade
  outros = createOutros(scene);
  bodies = bodies.concat(outros.corpos);

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
    { planet: acha('ceres'), moons: [] },
    { planet: acha('plutao'), moons: [acha('caronte')] },
    { planet: acha('haumea'), moons: [] },
    { planet: acha('makemake'), moons: [] },
    { planet: acha('eris'), moons: [] },
  ];
  // Tour e modo diagrama continuam so com o Sol + os 8 planetas (os anoes
  // deixariam a fileira larga demais e o passeio longo demais).
  const groupsPrincipais = groups.slice(0, 9);

  // ---- MODO TOUR (passeio guiado) ----
  tour = createTour({
    camera, controls,
    planets: groupsPrincipais.map((g) => g.planet),
    hudRoot: document.getElementById('hud-root'),
    onEnd: () => { cameraFocus.reset(); indicator.clear(); },
  });

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
    if (kuiper) kuiper.setVisible(v);                                     // cinturao de Kuiper
    if (outros) outros.setVisible(v);                                     // maquetes e o Halley
  }
  diagram = createDiagram({
    planets: groupsPrincipais.map((g) => g.planet),
    getCamera: () => camera,
    cameraFocus,
    sunLight,
    setAuxVisible,
    onFocusBody: (b) => { cameraFocus.follow(b); indicator.select(b); }, // ao terminar a volta, foca o astro
    onReset: () => { cameraFocus.reset(); indicator.clear(); },
  });

  // ficha tecnica padronizada (inclinacao axial, distancia, diametro, gravidade,
  // atmosfera e curiosidades) -- alimenta o painel lateral e o catalogo
  aplicarDados(bodies);
  aplicarDadosCeu(bodies);   // Sagitario A*, Halley, Andromeda, Orion, Proxima

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
    onTour: () => { if (tour) { indicator.clear(); tour.enter(); } },  // TOUR: passeio guiado
  });

  // ---- CATALOGO DE ASTROS (injeta o proprio botao na barra superior) --------
  catalogo = createCatalogo({ bodies, onFocus: onSelect });

  // A lente do buraco negro faz o tonemap por conta propria (ACES identico ao do
  // scene.js). Por isso o renderer entrega a cena "crua" para ela.
  if (outros && outros.blackHole) {
    renderer.toneMapping = THREE.NoToneMapping;
    outros.blackHole.setSize(window.innerWidth, window.innerHeight, Math.min(window.devicePixelRatio, 2));
  }

  createSelection({ camera, domElement: renderer.domElement, targets: selectables, onSelect, onMiss: null });

  // ---- MODO NAVE (exploracao em primeira pessoa) -----------------------------
  // A nave escala pelo raio da Terra do projeto e nasce junto da Terra.
  // O nave.js injeta sozinho a HUD de voo, o CSS e o botao PILOTAR.
  const ship = buildShip(earth.radius);
  scene.add(ship.group);                                  // a nave fica no scene RAIZ
  nave = createNaveMode({
    camera, controls, bodies, ship,
    spawnBody: earth,
    overviewUI: document.getElementById('hud-root'),      // some durante o voo
    flyButton: false,                                     // o botao PILOTAR agora vem do ui.js (barra superior)
    hazards: [],
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
  // o alvo de renderizacao da lente precisa acompanhar o tamanho da tela
  if (outros && outros.blackHole) {
    outros.blackHole.setSize(window.innerWidth, window.innerHeight, Math.min(window.devicePixelRatio, 2));
  }
}

// ---- UNICO loop de animacao -------------------------------------------------
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05); // limita saltos (aba inativa etc.)
  const elapsed = clock.elapsedTime;
  if (state.hidden) return; // economiza bateria quando a aba nao esta visivel

  const naveActive = nave && nave.active;  // modo nave assume camera e controle
  const tourActive = tour && tour.active;  // tour assume camera e congela as orbitas
  const tScale = naveActive ? 0.1 : 1;     // pilotando: planetas 10x mais lentos

  if (!state.paused) {
    if (tourActive) {
      // tour: astros congelados (a camera os orbita)
    } else if (diagram && diagram.active()) {
      diagram.update(delta); // no modo diagrama, este controlador posiciona os astros (orbitas congeladas)
    } else {
      for (const b of bodies) {
        b.update(delta * tScale);
        if (b.atmosphere) b.atmosphere.rotation.y += (b.atmosphereSpeed || 0) * delta * tScale;
      }
      if (decorations) decorations.update(delta * tScale);
      if (kuiper) kuiper.update(delta * tScale);
      if (outros) outros.update(delta * tScale);
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
  } else if (tourActive) {
    tour.update(delta);            // o tour controla a camera (orbita cada astro)
  } else {
    cameraFocus.update(delta);
    indicator.update(delta, elapsed);
    controls.update();
  }
  // A lente gravitacional substitui o render normal: ela desenha a cena num alvo
  // e depois curva a luz em volta do buraco negro.
  if (outros && outros.blackHole) outros.blackHole.renderLens(renderer, scene, camera);
  else renderer.render(scene, camera);
}

try {
  init();
} catch (e) {
  console.error('Erro ao iniciar o Planetario:', e);
  if (window.__showLoaderError) window.__showLoaderError('Erro ao iniciar: ' + (e && e.message ? e.message : e));
}
