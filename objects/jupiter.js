// =============================================================================
// objects/jupiter.js
// JUPITER (gigante gasoso) + as 4 luas galileanas: Io, Europa, Ganimedes, Calisto.
//
// Modulo AUTOSSUFICIENTE: traz as proprias constantes de escala e a propria
// geracao de textura (utilitarios com prefixo "jp" para nao colidir com os de
// procedural.js). Assim, para adicionar Jupiter ao projeto basta:
//   1) colocar este arquivo em objects/
//   2) em js/main.js: importar createJupiter e incluir ...createJupiter(scene) em bodies
// As luas orbitam Jupiter (anexadas ao grupo dele), mesmo padrao da Lua/Marte.
// =============================================================================

import * as THREE from 'three';
import { CelestialBody, createOrbitLine } from '../js/celestialBody.js';

// --- escala (educativa) ------------------------------------------------------
const J_RADIUS = 3.0;   // muito maior que os rochosos, menor que o Sol
const J_ORBIT = 96;     // alem de Marte
const J_TILT = 3.1;     // inclinacao pequena
const J_ECC = 0.049;    // excentricidade (lei das areas)
const J_ARG = 1.0;      // orientacao da elipse

// ====================== utilitarios proceduralis (prefixo jp) ================
function jpRand(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function jpNoise2D(seed) {
  const grid = 256, rand = jpRand(seed), vals = new Float32Array(grid * grid);
  for (let i = 0; i < vals.length; i++) vals[i] = rand();
  const smooth = (t) => t * t * (3 - 2 * t);
  return function (x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const x0 = ((xi % grid) + grid) % grid, y0 = ((yi % grid) + grid) % grid;
    const x1 = (x0 + 1) % grid, y1 = (y0 + 1) % grid;
    const v00 = vals[y0 * grid + x0], v10 = vals[y0 * grid + x1];
    const v01 = vals[y1 * grid + x0], v11 = vals[y1 * grid + x1];
    const u = smooth(xf), v = smooth(yf);
    const a = v00 + (v10 - v00) * u, b = v01 + (v11 - v01) * u;
    return a + (b - a) * v;
  };
}
function jpFbm(n, x, y, oct = 4) {
  let amp = 0.5, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) { sum += amp * n(x * freq, y * freq); norm += amp; amp *= 0.5; freq *= 2; }
  return sum / norm;
}
function jpLerp(c1, c2, t) { return [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t]; }
function jpRamp(stops, t) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (t >= a[0] && t <= b[0]) return jpLerp(a[1], b[1], (t - a[0]) / ((b[0] - a[0]) || 1));
  }
  return stops[stops.length - 1][1];
}
function jpCanvas(w, h, rf) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h; c._ctx = c.getContext('2d', { willReadFrequently: !!rf });
  return c;
}
function jpFinalize(canvas, srgb, repeat) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.needsUpdate = true;
  return t;
}
function jpCraterHeight(size, count, seed) {
  const c = jpCanvas(size, size, true), ctx = c._ctx, img = ctx.createImageData(size, size), n = jpNoise2D(seed);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const h = 110 + jpFbm(n, x / size * 6, y / size * 6, 4) * 70, idx = (y * size + x) * 4;
    img.data[idx] = img.data[idx + 1] = img.data[idx + 2] = h; img.data[idx + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const rand = jpRand(seed * 17 + 1);
  for (let i = 0; i < count; i++) {
    const cx = rand() * size, cy = rand() * size, r = 3 + rand() * (size * 0.05);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0.0, 'rgba(45,45,45,0.9)'); g.addColorStop(0.7, 'rgba(75,75,75,0.5)');
    g.addColorStop(0.82, 'rgba(205,205,205,0.55)'); g.addColorStop(1.0, 'rgba(128,128,128,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }
  return c;
}
function jpNormalMap(heightCanvas, strength) {
  const size = heightCanvas.width, src = heightCanvas._ctx.getImageData(0, 0, size, size).data;
  const out = jpCanvas(size, size), octx = out._ctx, dst = octx.createImageData(size, size);
  const H = (x, y) => { const xx = ((x % size) + size) % size, yy = ((y % size) + size) % size; return src[(yy * size + xx) * 4] / 255; };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (H(x - 1, y) - H(x + 1, y)) * strength, dy = (H(x, y - 1) - H(x, y + 1)) * strength;
    const len = Math.sqrt(dx * dx + dy * dy + 1), idx = (y * size + x) * 4;
    dst.data[idx] = (dx / len * 0.5 + 0.5) * 255; dst.data[idx + 1] = (dy / len * 0.5 + 0.5) * 255;
    dst.data[idx + 2] = (1 / len * 0.5 + 0.5) * 255; dst.data[idx + 3] = 255;
  }
  octx.putImageData(dst, 0, 0);
  return jpFinalize(out, false, true);
}

// ====================== texturas especificas =================================
// Jupiter: bandas (zonas/cinturoes) + Grande Mancha Vermelha
function jpDrawRedSpot(ctx, size) {
  const cx = size * 0.70, cy = size * 0.62, rw = size * 0.12;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.55);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rw);
  g.addColorStop(0.0, 'rgba(214,112,72,0.95)'); g.addColorStop(0.6, 'rgba(182,84,56,0.85)'); g.addColorStop(1.0, 'rgba(150,90,70,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rw, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function jpBandedTexture(size) {
  const c = jpCanvas(size, size), ctx = c._ctx, img = ctx.createImageData(size, size);
  const turb = jpNoise2D(5), warp = jpNoise2D(11);
  const cream = [240, 226, 196], tan = [216, 186, 146], lightBrown = [196, 150, 108], brown = [156, 112, 78], rust = [184, 120, 84];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const lat = y / size;
    const w = (jpFbm(warp, x / size * 2.5, lat * 5, 4) - 0.5) * 0.05; // ondulacao das bandas
    const band = 0.5 + 0.5 * Math.sin((lat + w) * Math.PI * 16);
    let col = band > 0.55 ? jpLerp(tan, cream, (band - 0.55) / 0.45) : jpLerp(brown, lightBrown, band / 0.55);
    const fine = jpFbm(turb, x / size * 6 + w * 8, lat * 14, 4);
    col = jpLerp(col, rust, Math.max(0, fine - 0.62) * 0.8);
    const idx = (y * size + x) * 4;
    img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  jpDrawRedSpot(ctx, size);
  return jpFinalize(c, true, true);
}
// Io: enxofre vulcanico (amarelo/laranja mosqueado)
function jpIoTexture(size) {
  const c = jpCanvas(size, size), ctx = c._ctx, img = ctx.createImageData(size, size);
  const n = jpNoise2D(33), spot = jpNoise2D(41);
  const pal = [[0.0, [180, 110, 40]], [0.35, [225, 185, 80]], [0.65, [245, 220, 120]], [0.85, [250, 238, 170]], [1.0, [255, 248, 210]]];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let col = jpRamp(pal, jpFbm(n, x / size * 5, y / size * 5, 4));
    const s = jpFbm(spot, x / size * 7, y / size * 7, 3);
    if (s < 0.32) col = jpLerp(col, [110, 55, 40], (0.32 - s) / 0.32 * 0.7);
    else if (s > 0.8) col = jpLerp(col, [255, 255, 235], (s - 0.8) / 0.2 * 0.5);
    const idx = (y * size + x) * 4;
    img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return jpFinalize(c, true, true);
}
// Europa: gelo liso + lineae (rachaduras avermelhadas)
function jpDrawLineae(ctx, size, seed) {
  const rand = jpRand(seed); ctx.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    let x = 0, y = rand() * size;
    ctx.beginPath(); ctx.moveTo(x, y);
    const segs = 6;
    for (let s = 0; s < segs; s++) { x += size / segs; y += (rand() - 0.5) * size * 0.12; ctx.lineTo(x, y); }
    const r = (140 + rand() * 40) | 0, g = (80 + rand() * 20) | 0, b = (60 + rand() * 20) | 0;
    ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.22 + rand() * 0.32).toFixed(2) + ')';
    ctx.lineWidth = 0.5 + rand() * 1.4; ctx.stroke();
  }
}
function jpEuropaTexture(size) {
  const c = jpCanvas(size, size), ctx = c._ctx, img = ctx.createImageData(size, size);
  const n = jpNoise2D(77);
  const pal = [[0.0, [196, 202, 212]], [0.5, [220, 224, 232]], [1.0, [242, 244, 248]]];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const col = jpRamp(pal, jpFbm(n, x / size * 6, y / size * 6, 4));
    const idx = (y * size + x) * 4;
    img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  jpDrawLineae(ctx, size, 88);
  return jpFinalize(c, true, true);
}
// Ganimedes/Calisto: cinza craterizado (+ relevo). twoTone p/ Ganimedes (terrenos claros/escuros)
function jpCrateredMoon(size, palette, craterCount, seed, twoTone) {
  const height = jpCraterHeight(size, craterCount, seed);
  const hdata = height._ctx.getImageData(0, 0, size, size).data;
  const c = jpCanvas(size, size), img = c._ctx.createImageData(size, size);
  const region = jpNoise2D(seed * 2 + 5), tint = jpNoise2D(seed * 3 + 7);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const idx = (y * size + x) * 4; let f = hdata[idx] / 255;
    if (twoTone) f *= (jpFbm(region, x / size * 2.2, y / size * 2.2, 3) < 0.45 ? 0.72 : 1.05);
    f = Math.max(0, Math.min(1, f + (jpFbm(tint, x / size * 11, y / size * 11, 3) - 0.5) * 0.12));
    const col = jpRamp(palette, f);
    img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
  }
  c._ctx.putImageData(img, 0, 0);
  return { map: jpFinalize(c, true, true), normalMap: jpNormalMap(height, 2.0) };
}

// ====================== construcao dos corpos ================================
// Cria uma lua galileana (esfera) que orbita Jupiter (rotacao sincrona).
function createGalileanMoon(parent, cfg) {
  const group = new THREE.Group();
  const matOpts = { map: cfg.textures.map, roughness: 1.0, metalness: 0.0 };
  if (cfg.textures.normalMap) { matOpts.normalMap = cfg.textures.normalMap; matOpts.normalScale = new THREE.Vector2(0.8, 0.8); }
  const mat = new THREE.MeshStandardMaterial(matOpts);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius, 48, 48), mat);
  group.add(mesh);

  parent.group.add(group); // orbita RELATIVA a Jupiter
  const orbit = createOrbitLine(cfg.orbitRadius, cfg.orbitColor, 0.24);
  parent.group.add(orbit);

  const body = new CelestialBody({
    id: cfg.id, name: cfg.name, type: 'Satelite Galileano', color: cfg.color,
    group, mesh, radius: cfg.radius, orbitLine: orbit,
    orbitRadius: cfg.orbitRadius, orbitSpeed: cfg.orbitSpeed, rotationSpeed: cfg.orbitSpeed, // sincrona
    info: cfg.info, fact: cfg.fact,
  });
  // suporte a textura real por convencao (ex.: textures/europa.jpg + textures/europa_normal.jpg)
  body.realTextures = [
    { file: cfg.id, material: mat, slot: 'map', srgb: true },
    { file: cfg.id + '_normal', material: mat, slot: 'normalMap', srgb: false },
  ];
  return body;
}

export function createJupiter(scene) {
  // texturas (geradas aqui dentro -> nao precisa mexer no buildTextures)
  const jTex = jpBandedTexture(512);
  const ioTex = { map: jpIoTexture(384) };
  const euTex = { map: jpEuropaTexture(384) };
  const ganTex = jpCrateredMoon(384, [[0, [80, 72, 64]], [0.5, [130, 118, 102]], [0.8, [165, 150, 130]], [1, [195, 182, 160]]], 60, 21, true);
  const calTex = jpCrateredMoon(384, [[0, [55, 48, 42]], [0.5, [95, 82, 70]], [0.8, [125, 108, 92]], [1, [150, 132, 112]]], 160, 31, false);

  const group = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.rotation.z = THREE.MathUtils.degToRad(J_TILT);
  group.add(tilt);

  const mat = new THREE.MeshStandardMaterial({ map: jTex, roughness: 1.0, metalness: 0.0 });
  const surface = new THREE.Mesh(new THREE.SphereGeometry(J_RADIUS, 64, 48), mat);
  tilt.add(surface);

  // halo atmosferico sutil
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(J_RADIUS * 1.025, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0xe6c89a, transparent: true, opacity: 0.08, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  group.add(glow);
  scene.add(group);

  const orbit = createOrbitLine(J_ORBIT, 0xc9a06a, 0.30, J_ECC, J_ARG);
  scene.add(orbit);

  const jupiter = new CelestialBody({
    id: 'jupiter', name: 'J\u00fapiter', type: 'Gigante Gasoso', color: '#e0b07a',
    group, mesh: surface, radius: J_RADIUS, orbitLine: orbit,
    orbitRadius: J_ORBIT, orbitSpeed: 0.045, rotationSpeed: 0.62, // gira rapido (dia curto)
    eccentricity: J_ECC, argPerihelion: J_ARG,
    info: [
      ['Diametro', '139.820 km'],
      ['Ano (translacao)', '11,9 anos'],
      ['Dia (rotacao)', '9h56min'],
      ['Gravidade', '24,79 m/s\u00B2'],
      ['Luas', '95+ (4 galileanas)'],
      ['Distancia do Sol', '\u2248 778 milhoes de km'],
    ],
    fact: 'O maior planeta do Sistema Solar: caberiam mais de 1.300 Terras em seu interior. A Grande Mancha Vermelha e uma tempestade gigante, maior que a Terra e ativa ha seculos.',
  });
  jupiter.realTextures = [{ file: 'jupiter', material: mat, slot: 'map', srgb: true }];

  const io = createGalileanMoon(jupiter, {
    id: 'io', name: 'Io', color: '#e8d44a', textures: ioTex, orbitColor: 0x8a7a4a,
    radius: 0.18, orbitRadius: 4.2, orbitSpeed: 1.3,
    info: [['Diametro', '3.643 km'], ['Translacao', '1,77 dias'], ['Gravidade', '1,80 m/s\u00B2'], ['Destaque', 'corpo mais vulcanico do S.S.']],
    fact: 'O corpo com mais vulcoes ativos do Sistema Solar. Seu calor interno vem do aquecimento de mare provocado pela gravidade de Jupiter.',
  });
  const europa = createGalileanMoon(jupiter, {
    id: 'europa', name: 'Europa', color: '#cfd8e0', textures: euTex, orbitColor: 0x6a7a8a,
    radius: 0.16, orbitRadius: 5.8, orbitSpeed: 0.95,
    info: [['Diametro', '3.122 km'], ['Translacao', '3,55 dias'], ['Gravidade', '1,31 m/s\u00B2'], ['Destaque', 'oceano liquido sob o gelo']],
    fact: 'Sua superficie de gelo e a mais lisa do Sistema Solar e esconde um oceano de agua liquida salgada -- um dos principais candidatos a abrigar vida.',
  });
  const ganimedes = createGalileanMoon(jupiter, {
    id: 'ganimedes', name: 'Ganimedes', color: '#9a8c78', textures: ganTex, orbitColor: 0x6a6258,
    radius: 0.26, orbitRadius: 7.8, orbitSpeed: 0.65,
    info: [['Diametro', '5.268 km'], ['Translacao', '7,15 dias'], ['Gravidade', '1,43 m/s\u00B2'], ['Destaque', 'maior lua do Sistema Solar']],
    fact: 'A maior lua do Sistema Solar -- maior ate que o planeta Mercurio. E a unica lua conhecida com campo magnetico proprio.',
  });
  const calisto = createGalileanMoon(jupiter, {
    id: 'calisto', name: 'Calisto', color: '#6e6358', textures: calTex, orbitColor: 0x55504a,
    radius: 0.24, orbitRadius: 10.0, orbitSpeed: 0.45,
    info: [['Diametro', '4.821 km'], ['Translacao', '16,7 dias'], ['Gravidade', '1,24 m/s\u00B2'], ['Destaque', 'a mais craterizada do S.S.']],
    fact: 'Uma das superficies mais antigas e craterizadas do Sistema Solar, praticamente saturada de crateras de impacto.',
  });

  return [jupiter, io, europa, ganimedes, calisto];
}
