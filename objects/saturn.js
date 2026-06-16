// =============================================================================
// objects/saturn.js
// SATURNO (gigante gasoso) com SISTEMA DE ANEIS e 4 luas: Tita, Reia, Japeto, Dione.
//
// Autossuficiente (utilitarios com prefixo "st" para nao colidir com os de
// procedural.js nem com os "jp" de jupiter.js). Os aneis e as luas ficam no
// plano EQUATORIAL inclinado (~26,7 graus), entao as luas orbitam rasante ao
// plano dos aneis -- como na realidade.
// =============================================================================

import * as THREE from 'three';
import { CelestialBody, createOrbitLine } from '../js/celestialBody.js';

// --- escala (educativa) ------------------------------------------------------
const S_RADIUS = 2.6;    // um pouco menor que Jupiter (3.0)
const S_ORBIT = 138;     // alem de Jupiter (96)
const S_TILT = 26.7;     // inclinacao do eixo (define a inclinacao dos aneis)
const S_ECC = 0.056;     // excentricidade
const S_ARG = 2.0;       // orientacao da elipse
const RING_INNER = 3.2, RING_OUTER = 5.8;

// ====================== utilitarios proceduralis (prefixo st) ================
function stRand(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function stNoise2D(seed) {
  const grid = 256, rand = stRand(seed), vals = new Float32Array(grid * grid);
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
function stFbm(n, x, y, oct = 4) {
  let amp = 0.5, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) { sum += amp * n(x * freq, y * freq); norm += amp; amp *= 0.5; freq *= 2; }
  return sum / norm;
}
function stLerp(c1, c2, t) { return [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t]; }
function stRamp(stops, t) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (t >= a[0] && t <= b[0]) return stLerp(a[1], b[1], (t - a[0]) / ((b[0] - a[0]) || 1));
  }
  return stops[stops.length - 1][1];
}
function stCanvas(w, h, rf) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h; c._ctx = c.getContext('2d', { willReadFrequently: !!rf });
  return c;
}
function stFinalize(canvas, srgb, repeat) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.needsUpdate = true;
  return t;
}
function stCraterHeight(size, count, seed) {
  const c = stCanvas(size, size, true), ctx = c._ctx, img = ctx.createImageData(size, size), n = stNoise2D(seed);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const h = 110 + stFbm(n, x / size * 6, y / size * 6, 4) * 70, idx = (y * size + x) * 4;
    img.data[idx] = img.data[idx + 1] = img.data[idx + 2] = h; img.data[idx + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const rand = stRand(seed * 17 + 1);
  for (let i = 0; i < count; i++) {
    const cx = rand() * size, cy = rand() * size, r = 3 + rand() * (size * 0.05);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0.0, 'rgba(45,45,45,0.9)'); g.addColorStop(0.7, 'rgba(75,75,75,0.5)');
    g.addColorStop(0.82, 'rgba(205,205,205,0.55)'); g.addColorStop(1.0, 'rgba(128,128,128,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }
  return c;
}
function stNormalMap(heightCanvas, strength) {
  const size = heightCanvas.width, src = heightCanvas._ctx.getImageData(0, 0, size, size).data;
  const out = stCanvas(size, size), octx = out._ctx, dst = octx.createImageData(size, size);
  const H = (x, y) => { const xx = ((x % size) + size) % size, yy = ((y % size) + size) % size; return src[(yy * size + xx) * 4] / 255; };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (H(x - 1, y) - H(x + 1, y)) * strength, dy = (H(x, y - 1) - H(x, y + 1)) * strength;
    const len = Math.sqrt(dx * dx + dy * dy + 1), idx = (y * size + x) * 4;
    dst.data[idx] = (dx / len * 0.5 + 0.5) * 255; dst.data[idx + 1] = (dy / len * 0.5 + 0.5) * 255;
    dst.data[idx + 2] = (1 / len * 0.5 + 0.5) * 255; dst.data[idx + 3] = 255;
  }
  octx.putImageData(dst, 0, 0);
  return stFinalize(out, false, true);
}

// ====================== texturas =============================================
// Saturno: bandas palidas, dourado-creme, baixo contraste (sem mancha vermelha)
function stBandedTexture(size) {
  const c = stCanvas(size, size), ctx = c._ctx, img = ctx.createImageData(size, size);
  const turb = stNoise2D(7), warp = stNoise2D(13);
  const cream = [245, 235, 205], paleGold = [228, 210, 160], tan = [208, 186, 138], lightTan = [236, 222, 182];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const lat = y / size;
    const w = (stFbm(warp, x / size * 2.2, lat * 4, 4) - 0.5) * 0.04;
    const band = 0.5 + 0.5 * Math.sin((lat + w) * Math.PI * 13);
    let col = band > 0.5 ? stLerp(paleGold, cream, (band - 0.5) / 0.5) : stLerp(tan, paleGold, band / 0.5);
    const fine = stFbm(turb, x / size * 5 + w * 6, lat * 12, 4);
    col = stLerp(col, lightTan, Math.max(0, fine - 0.65) * 0.5);
    const idx = (y * size + x) * 4;
    img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return stFinalize(c, true, true);
}
// Tita: bruma laranja densa, lisa (a atmosfera esconde a superficie)
function stTitanTexture(size) {
  const c = stCanvas(size, size), ctx = c._ctx, img = ctx.createImageData(size, size);
  const n = stNoise2D(91);
  const pal = [[0.0, [196, 138, 70]], [0.5, [216, 162, 92]], [1.0, [232, 188, 122]]];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const col = stRamp(pal, stFbm(n, x / size * 3, y / size * 3, 4));
    const idx = (y * size + x) * 4;
    img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return stFinalize(c, true, true);
}
// Lua gelada craterizada (Reia, Dione)
function stCrateredMoon(size, palette, craterCount, seed) {
  const height = stCraterHeight(size, craterCount, seed);
  const hdata = height._ctx.getImageData(0, 0, size, size).data;
  const c = stCanvas(size, size), img = c._ctx.createImageData(size, size);
  const tint = stNoise2D(seed * 3 + 7);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const idx = (y * size + x) * 4;
    let f = Math.max(0, Math.min(1, hdata[idx] / 255 + (stFbm(tint, x / size * 11, y / size * 11, 3) - 0.5) * 0.12));
    const col = stRamp(palette, f);
    img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
  }
  c._ctx.putImageData(img, 0, 0);
  return { map: stFinalize(c, true, true), normalMap: stNormalMap(height, 2.0) };
}
// Japeto: "lua yin-yang" -- um hemisferio escuro, outro claro (+ crateras)
function stIapetusTexture(size) {
  const height = stCraterHeight(size, 80, 71);
  const hdata = height._ctx.getImageData(0, 0, size, size).data;
  const c = stCanvas(size, size), img = c._ctx.createImageData(size, size);
  const bright = [[0, [150, 150, 156]], [1, [234, 234, 240]]], dark = [44, 38, 32];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const idx = (y * size + x) * 4, h = hdata[idx] / 255;
    let col = stRamp(bright, h * 0.7 + 0.3);
    const t = 0.5 + 0.5 * Math.cos((x / size) * Math.PI * 2); // 1 nas bordas, 0 no centro
    const darkAmt = Math.pow(1 - t, 1.5); // hemisferio escuro centrado em x=size/2
    col = stLerp(col, dark, darkAmt * 0.85);
    img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
  }
  c._ctx.putImageData(img, 0, 0);
  return { map: stFinalize(c, true, true), normalMap: stNormalMap(height, 2.0) };
}
// Aneis: bandas radiais (C, B, Divisao de Cassini, A) + estriacoes finas
function stRingTexture(width) {
  const h = 8, c = stCanvas(width, h), ctx = c._ctx, img = ctx.createImageData(width, h), n = stNoise2D(303);
  for (let x = 0; x < width; x++) {
    const f = x / width;
    let a, cr;
    if (f < 0.06) { a = f / 0.06 * 0.4; cr = [200, 195, 185]; }
    else if (f < 0.30) { a = 0.34; cr = [196, 190, 178]; }   // anel C
    else if (f < 0.60) { a = 0.90; cr = [238, 226, 196]; }   // anel B (brilhante)
    else if (f < 0.66) { a = 0.08; cr = [160, 150, 135]; }   // Divisao de Cassini
    else if (f < 0.88) { a = 0.62; cr = [222, 206, 172]; }   // anel A
    else if (f < 0.90) { a = 0.18; cr = [180, 168, 150]; }   // lacuna de Encke
    else if (f < 0.97) { a = 0.55; cr = [216, 200, 166]; }   // anel A externo
    else { a = (1 - f) / 0.03 * 0.5; cr = [210, 196, 164]; } // borda externa
    a *= 0.82 + 0.18 * stFbm(n, f * 120, 0, 3);              // estriacoes finas
    const shade = 0.85 + 0.3 * stFbm(n, f * 40 + 10, 5, 3);
    for (let y = 0; y < h; y++) {
      const idx = (y * width + x) * 4;
      img.data[idx] = Math.min(255, cr[0] * shade);
      img.data[idx + 1] = Math.min(255, cr[1] * shade);
      img.data[idx + 2] = Math.min(255, cr[2] * shade);
      img.data[idx + 3] = Math.max(0, Math.min(255, a * 255));
    }
  }
  ctx.putImageData(img, 0, 0);
  return stFinalize(c, true, false);
}

// ====================== construcao ===========================================
// Lua de Saturno (esfera) orbitando no plano inclinado dos aneis (tiltGroup).
function stMoon(tiltGroup, cfg) {
  const group = new THREE.Group();
  const matOpts = { map: cfg.textures.map, roughness: 1.0, metalness: 0.0 };
  if (cfg.textures.normalMap) { matOpts.normalMap = cfg.textures.normalMap; matOpts.normalScale = new THREE.Vector2(0.8, 0.8); }
  const mat = new THREE.MeshStandardMaterial(matOpts);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius, 48, 48), mat);
  group.add(mesh);
  if (cfg.glow) { // bruma (Tita)
    const g = new THREE.Mesh(
      new THREE.SphereGeometry(cfg.radius * 1.14, 32, 32),
      new THREE.MeshBasicMaterial({ color: cfg.glow, transparent: true, opacity: 0.20, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    group.add(g);
  }
  tiltGroup.add(group);                  // orbita RELATIVA a Saturno, no plano dos aneis
  const orbit = createOrbitLine(cfg.orbitRadius, cfg.orbitColor, 0.22);
  tiltGroup.add(orbit);
  const body = new CelestialBody({
    id: cfg.id, name: cfg.name, type: 'Satelite de Saturno', color: cfg.color,
    group, mesh, radius: cfg.radius, orbitLine: orbit,
    orbitRadius: cfg.orbitRadius, orbitSpeed: cfg.orbitSpeed, rotationSpeed: cfg.orbitSpeed, // sincrona
    info: cfg.info, fact: cfg.fact,
  });
  body.realTextures = [
    { file: cfg.id, material: mat, slot: 'map', srgb: true },
    { file: cfg.id + '_normal', material: mat, slot: 'normalMap', srgb: false },
  ];
  return body;
}

export function createSaturn(scene) {
  const banded = stBandedTexture(512);
  const dioneTex = stCrateredMoon(384, [[0, [120, 122, 128]], [0.5, [175, 178, 185]], [0.8, [206, 209, 215]], [1, [230, 232, 237]]], 70, 51);
  const reiaTex = stCrateredMoon(384, [[0, [112, 114, 120]], [0.5, [166, 169, 176]], [0.8, [202, 205, 212]], [1, [227, 229, 234]]], 115, 61);
  const titanTex = { map: stTitanTexture(384) };
  const japetoTex = stIapetusTexture(384);

  const group = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.rotation.z = THREE.MathUtils.degToRad(S_TILT); // eixo inclinado -> aneis inclinados
  group.add(tilt);

  const mat = new THREE.MeshStandardMaterial({ map: banded, roughness: 1.0, metalness: 0.0 });
  const surface = new THREE.Mesh(new THREE.SphereGeometry(S_RADIUS, 64, 48), mat);
  tilt.add(surface);

  // halo palido sutil
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(S_RADIUS * 1.025, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0xeaddb0, transparent: true, opacity: 0.07, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  group.add(glow);

  // aneis (no plano equatorial do quadro inclinado)
  const ringGeo = new THREE.RingGeometry(RING_INNER, RING_OUTER, 160, 1);
  const pa = ringGeo.attributes.position, ua = ringGeo.attributes.uv, vtmp = new THREE.Vector3();
  for (let i = 0; i < pa.count; i++) { // remapeia UV: u = fracao radial (interno -> externo)
    vtmp.fromBufferAttribute(pa, i);
    ua.setXY(i, (vtmp.length() - RING_INNER) / (RING_OUTER - RING_INNER), 0.5);
  }
  ua.needsUpdate = true;
  const rings = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
    map: stRingTexture(1024), transparent: true, side: THREE.DoubleSide, depthWrite: false,
  }));
  rings.rotation.x = -Math.PI / 2; // deita os aneis no plano XZ (equatorial) do quadro inclinado
  tilt.add(rings);

  scene.add(group);

  const orbit = createOrbitLine(S_ORBIT, 0xcbb98a, 0.30, S_ECC, S_ARG);
  scene.add(orbit);

  const saturn = new CelestialBody({
    id: 'saturn', name: 'Saturno', type: 'Gigante Gasoso', color: '#e8d6a0',
    group, mesh: surface, radius: S_RADIUS, orbitLine: orbit,
    orbitRadius: S_ORBIT, orbitSpeed: 0.03, rotationSpeed: 0.58, // gira rapido
    eccentricity: S_ECC, argPerihelion: S_ARG,
    info: [
      ['Diametro', '116.460 km'],
      ['Ano (translacao)', '29,4 anos'],
      ['Dia (rotacao)', '10h33min'],
      ['Gravidade', '10,44 m/s\u00B2'],
      ['Luas', '140+ (e os aneis)'],
      ['Distancia do Sol', '\u2248 1,43 bilhao de km'],
    ],
    fact: 'Famoso pelos aneis de gelo e rocha, que se estendem por milhares de km com poucos metros de espessura. Sua densidade media e menor que a da agua: ele flutuaria!',
  });
  saturn.realTextures = [{ file: 'saturn', material: mat, slot: 'map', srgb: true }];

  const dione = stMoon(tilt, {
    id: 'dione', name: 'Dione', color: '#cdd2d8', textures: dioneTex, orbitColor: 0x66707a,
    radius: 0.14, orbitRadius: 7.0, orbitSpeed: 0.9,
    info: [['Diametro', '1.123 km'], ['Translacao', '2,7 dias'], ['Gravidade', '0,23 m/s\u00B2'], ['Destaque', 'falesias de gelo brilhantes']],
    fact: 'Lua gelada marcada por falesias de gelo brilhantes -- fraturas tectonicas que riscam a superficie.',
  });
  const reia = stMoon(tilt, {
    id: 'reia', name: 'Reia', color: '#cdd2d8', textures: reiaTex, orbitColor: 0x66707a,
    radius: 0.16, orbitRadius: 8.2, orbitSpeed: 0.7,
    info: [['Diametro', '1.527 km'], ['Translacao', '4,5 dias'], ['Gravidade', '0,26 m/s\u00B2'], ['Destaque', '2a maior lua de Saturno']],
    fact: 'Um mundo de gelo e rocha fortemente craterizado: a segunda maior lua de Saturno.',
  });
  const titan = stMoon(tilt, {
    id: 'titan', name: 'Tit\u00e3', color: '#d98a3c', textures: titanTex, orbitColor: 0x7a5a30, glow: 0xd98a3c,
    radius: 0.26, orbitRadius: 9.6, orbitSpeed: 0.5,
    info: [['Diametro', '5.150 km'], ['Translacao', '15,9 dias'], ['Gravidade', '1,35 m/s\u00B2'], ['Destaque', 'atmosfera densa + lagos de metano']],
    fact: 'A maior lua de Saturno e a unica do Sistema Solar com atmosfera densa. Tem rios e lagos -- mas de metano e etano liquidos, nao de agua.',
  });
  const japeto = stMoon(tilt, {
    id: 'japeto', name: 'J\u00e1peto', color: '#b9b2a4', textures: japetoTex, orbitColor: 0x6a655c,
    radius: 0.15, orbitRadius: 11.5, orbitSpeed: 0.35,
    info: [['Diametro', '1.469 km'], ['Translacao', '79,3 dias'], ['Gravidade', '0,22 m/s\u00B2'], ['Destaque', 'um lado escuro, outro claro']],
    fact: 'A "lua yin-yang": um hemisferio e escuro como carvao e o outro e branco de gelo. Tem ainda uma estranha crista de montanhas no equador.',
  });

  return [saturn, dione, reia, titan, japeto];
}
