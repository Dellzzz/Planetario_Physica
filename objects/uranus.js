// =============================================================================
// objects/uranus.js
// URANO (gigante de gelo) com aneis finos e 5 luas: Titania, Oberon, Ariel,
// Umbriel e Miranda.
//
// Autossuficiente (utilitarios com prefixo "ur" para nao colidir com procedural
// nem com "jp"/"st"). Caracteristica marcante: o eixo esta inclinado ~98 graus,
// entao Urano gira "deitado" -- os aneis e as luas ficam num plano quase
// vertical em relacao a orbita.
// =============================================================================

import * as THREE from 'three';
import { CelestialBody, createOrbitLine } from '../js/celestialBody.js';

// --- escala (educativa) ------------------------------------------------------
const U_RADIUS = 2.3;    // gigante de gelo: menor que os gasosos
const U_ORBIT = 184;     // alem de Saturno (138)
const U_TILT = 97.8;     // gira "deitado" (eixo quase no plano da orbita)
const U_ECC = 0.046;
const U_ARG = 2.6;
const U_RING_INNER = 3.0, U_RING_OUTER = 3.9; // aneis finos

// ====================== utilitarios proceduralis (prefixo ur) ================
function urRand(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function urNoise2D(seed) {
  const grid = 256, rand = urRand(seed), vals = new Float32Array(grid * grid);
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
function urFbm(n, x, y, oct = 4) {
  let amp = 0.5, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) { sum += amp * n(x * freq, y * freq); norm += amp; amp *= 0.5; freq *= 2; }
  return sum / norm;
}
function urLerp(c1, c2, t) { return [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t]; }
function urRamp(stops, t) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (t >= a[0] && t <= b[0]) return urLerp(a[1], b[1], (t - a[0]) / ((b[0] - a[0]) || 1));
  }
  return stops[stops.length - 1][1];
}
function urCanvas(w, h, rf) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h; c._ctx = c.getContext('2d', { willReadFrequently: !!rf });
  return c;
}
function urFinalize(canvas, srgb, repeat) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.needsUpdate = true;
  return t;
}
function urCraterHeight(size, count, seed) {
  const c = urCanvas(size, size, true), ctx = c._ctx, img = ctx.createImageData(size, size), n = urNoise2D(seed);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const h = 110 + urFbm(n, x / size * 6, y / size * 6, 4) * 70, idx = (y * size + x) * 4;
    img.data[idx] = img.data[idx + 1] = img.data[idx + 2] = h; img.data[idx + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const rand = urRand(seed * 17 + 1);
  for (let i = 0; i < count; i++) {
    const cx = rand() * size, cy = rand() * size, r = 3 + rand() * (size * 0.05);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0.0, 'rgba(45,45,45,0.9)'); g.addColorStop(0.7, 'rgba(75,75,75,0.5)');
    g.addColorStop(0.82, 'rgba(205,205,205,0.55)'); g.addColorStop(1.0, 'rgba(128,128,128,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }
  return c;
}
function urNormalMap(heightCanvas, strength) {
  const size = heightCanvas.width, src = heightCanvas._ctx.getImageData(0, 0, size, size).data;
  const out = urCanvas(size, size), octx = out._ctx, dst = octx.createImageData(size, size);
  const H = (x, y) => { const xx = ((x % size) + size) % size, yy = ((y % size) + size) % size; return src[(yy * size + xx) * 4] / 255; };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (H(x - 1, y) - H(x + 1, y)) * strength, dy = (H(x, y - 1) - H(x, y + 1)) * strength;
    const len = Math.sqrt(dx * dx + dy * dy + 1), idx = (y * size + x) * 4;
    dst.data[idx] = (dx / len * 0.5 + 0.5) * 255; dst.data[idx + 1] = (dy / len * 0.5 + 0.5) * 255;
    dst.data[idx + 2] = (1 / len * 0.5 + 0.5) * 255; dst.data[idx + 3] = 255;
  }
  octx.putImageData(dst, 0, 0);
  return urFinalize(out, false, true);
}
// canions/fendas tectonicas (Titania, Ariel, Miranda)
function urGrooves(ctx, size, seed, color) {
  const rand = urRand(seed);
  ctx.lineCap = 'round';
  const n = 7 + (rand() * 4 | 0);
  for (let i = 0; i < n; i++) {
    let x = rand() * size, y = rand() * size, a = rand() * Math.PI * 2;
    const len = size * (0.3 + rand() * 0.4), steps = 5;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let s = 0; s < steps; s++) { a += (rand() - 0.5) * 0.6; x += Math.cos(a) * len / steps; y += Math.sin(a) * len / steps; ctx.lineTo(x, y); }
    ctx.strokeStyle = color; ctx.lineWidth = 0.6 + rand() * 1.4; ctx.stroke();
  }
}
// cratera clara (a "Wunda" de Umbriel)
function urBrightSpot(ctx, size, seed) {
  const rand = urRand(seed);
  const cx = rand() * size, cy = (0.25 + rand() * 0.5) * size, r = size * (0.05 + rand() * 0.04);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, 'rgba(236,238,240,0.9)'); g.addColorStop(0.6, 'rgba(208,212,216,0.4)'); g.addColorStop(1, 'rgba(200,205,210,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
}

// ====================== texturas =============================================
// Urano: azul-esverdeado palido e quase liso (metano); bandas muito sutis
function urBandedTexture(size) {
  const c = urCanvas(size, size), ctx = c._ctx, img = ctx.createImageData(size, size);
  const turb = urNoise2D(9), warp = urNoise2D(17);
  const base = [166, 222, 224], lighter = [196, 236, 234], deeper = [138, 202, 208], hint = [180, 228, 220];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const lat = y / size;
    const w = (urFbm(warp, x / size * 1.8, lat * 3, 4) - 0.5) * 0.03;
    const band = 0.5 + 0.5 * Math.sin((lat + w) * Math.PI * 9);
    let col = urLerp(deeper, base, band * 0.6 + 0.2); // contraste baixo
    const fine = urFbm(turb, x / size * 4 + w * 5, lat * 9, 4);
    col = urLerp(col, fine > 0.6 ? lighter : hint, Math.abs(fine - 0.5) * 0.3);
    const idx = (y * size + x) * 4;
    img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return urFinalize(c, true, true);
}
// Lua gelada craterizada, com opcoes (canions, cratera clara)
function urMoonTex(size, palette, craterCount, seed, opts) {
  opts = opts || {};
  const height = urCraterHeight(size, craterCount, seed);
  const hdata = height._ctx.getImageData(0, 0, size, size).data;
  const c = urCanvas(size, size), ctx = c._ctx, img = ctx.createImageData(size, size);
  const tint = urNoise2D(seed * 3 + 7);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const idx = (y * size + x) * 4;
    const f = Math.max(0, Math.min(1, hdata[idx] / 255 + (urFbm(tint, x / size * 11, y / size * 11, 3) - 0.5) * 0.12));
    const col = urRamp(palette, f);
    img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  if (opts.grooves) urGrooves(ctx, size, seed * 5 + 3, opts.grooveColor || 'rgba(46,46,52,0.5)');
  if (opts.brightSpot) urBrightSpot(ctx, size, seed * 7 + 2);
  return { map: urFinalize(c, true, true), normalMap: urNormalMap(height, 2.0) };
}
// Aneis finos e escuros (mostra so umas faixas estreitas; o anel epsilon e o externo)
function urRingTexture(width) {
  const h = 8, c = urCanvas(width, h), ctx = c._ctx, img = ctx.createImageData(width, h), n = urNoise2D(404);
  const rings = [{ f: 0.20, w: 0.02, a: 0.30 }, { f: 0.42, w: 0.015, a: 0.34 }, { f: 0.60, w: 0.02, a: 0.40 }, { f: 0.78, w: 0.02, a: 0.44 }, { f: 0.96, w: 0.05, a: 0.62 }];
  for (let x = 0; x < width; x++) {
    const f = x / width;
    let a = 0;
    for (const rg of rings) { const d = Math.abs(f - rg.f); if (d < rg.w) a = Math.max(a, rg.a * (1 - d / rg.w)); }
    a *= 0.8 + 0.2 * urFbm(n, f * 150, 0, 3);
    const sh = 0.6 + 0.2 * urFbm(n, f * 30, 3, 3), g = 40 + 150 * sh;
    for (let y = 0; y < h; y++) {
      const idx = (y * width + x) * 4;
      img.data[idx] = g; img.data[idx + 1] = g; img.data[idx + 2] = g + 6;
      img.data[idx + 3] = Math.max(0, Math.min(255, a * 255));
    }
  }
  ctx.putImageData(img, 0, 0);
  return urFinalize(c, true, false);
}

// ====================== construcao ===========================================
// Lua de Urano (esfera) orbitando no plano equatorial inclinado (tiltGroup).
function urMoon(tiltGroup, cfg) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ map: cfg.textures.map, normalMap: cfg.textures.normalMap, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 1.0, metalness: 0.0 });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius, 48, 48), mat);
  group.add(mesh);
  tiltGroup.add(group);
  const orbit = createOrbitLine(cfg.orbitRadius, cfg.orbitColor, 0.22);
  tiltGroup.add(orbit);
  const body = new CelestialBody({
    id: cfg.id, name: cfg.name, type: 'Satelite de Urano', color: cfg.color,
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

export function createUranus(scene) {
  const banded = urBandedTexture(512);
  const titaniaTex = urMoonTex(384, [[0, [110, 106, 100]], [0.5, [160, 155, 148]], [0.8, [192, 187, 180]], [1, [214, 209, 202]]], 70, 121, { grooves: true });
  const oberonTex = urMoonTex(384, [[0, [104, 94, 86]], [0.5, [150, 136, 124]], [0.8, [182, 166, 152]], [1, [202, 186, 170]]], 115, 131);
  const arielTex = urMoonTex(384, [[0, [140, 142, 140]], [0.5, [186, 188, 186]], [0.8, [214, 216, 214]], [1, [234, 236, 234]]], 45, 141, { grooves: true });
  const umbrielTex = urMoonTex(384, [[0, [70, 68, 64]], [0.5, [104, 101, 96]], [0.8, [134, 130, 124]], [1, [158, 154, 148]]], 120, 151, { brightSpot: true });
  const mirandaTex = urMoonTex(384, [[0, [120, 118, 112]], [0.5, [166, 163, 156]], [0.8, [196, 192, 185]], [1, [216, 212, 205]]], 60, 161, { grooves: true, grooveColor: 'rgba(54,52,58,0.6)' });

  const group = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.rotation.z = THREE.MathUtils.degToRad(U_TILT); // gira deitado
  group.add(tilt);

  const mat = new THREE.MeshStandardMaterial({ map: banded, roughness: 1.0, metalness: 0.0 });
  const surface = new THREE.Mesh(new THREE.SphereGeometry(U_RADIUS, 64, 48), mat);
  tilt.add(surface);

  // halo ciano sutil
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(U_RADIUS * 1.03, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0x9fe0e6, transparent: true, opacity: 0.10, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  group.add(glow);

  // aneis (no plano equatorial do quadro inclinado -> quase verticais)
  const ringGeo = new THREE.RingGeometry(U_RING_INNER, U_RING_OUTER, 160, 1);
  const pa = ringGeo.attributes.position, ua = ringGeo.attributes.uv, vtmp = new THREE.Vector3();
  for (let i = 0; i < pa.count; i++) {
    vtmp.fromBufferAttribute(pa, i);
    ua.setXY(i, (vtmp.length() - U_RING_INNER) / (U_RING_OUTER - U_RING_INNER), 0.5);
  }
  ua.needsUpdate = true;
  const rings = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
    map: urRingTexture(1024), transparent: true, side: THREE.DoubleSide, depthWrite: false,
  }));
  rings.rotation.x = -Math.PI / 2;
  tilt.add(rings);

  scene.add(group);

  const orbit = createOrbitLine(U_ORBIT, 0x7fc6cc, 0.30, U_ECC, U_ARG);
  scene.add(orbit);

  const uranus = new CelestialBody({
    id: 'uranus', name: 'Urano', type: 'Gigante de Gelo', color: '#a6e0e0',
    group, mesh: surface, radius: U_RADIUS, orbitLine: orbit,
    orbitRadius: U_ORBIT, orbitSpeed: 0.022, rotationSpeed: -0.5, // rotacao retrograda
    eccentricity: U_ECC, argPerihelion: U_ARG,
    info: [
      ['Diametro', '50.724 km'],
      ['Ano (translacao)', '84 anos'],
      ['Dia (rotacao)', '17h14min'],
      ['Gravidade', '8,69 m/s\u00B2'],
      ['Luas', '28 (5 principais)'],
      ['Distancia do Sol', '\u2248 2,87 bilhoes de km'],
    ],
    fact: 'Gira "deitado": o eixo esta inclinado quase 98 graus, praticamente no plano da orbita. Por isso seus polos chegam a apontar direto para o Sol. A cor azul-esverdeada vem do metano na atmosfera.',
  });
  uranus.realTextures = [{ file: 'uranus', material: mat, slot: 'map', srgb: true }];

  const miranda = urMoon(tilt, {
    id: 'miranda', name: 'Miranda', color: '#bcb8b0', textures: mirandaTex, orbitColor: 0x5f6a72,
    radius: 0.10, orbitRadius: 4.2, orbitSpeed: 1.0,
    info: [['Diametro', '471 km'], ['Translacao', '1,4 dias'], ['Gravidade', '0,08 m/s\u00B2'], ['Destaque', 'terreno caotico + penhasco gigante']],
    fact: 'A menor e mais bizarra das cinco: um mundo "remendado" com Verona Rupes, o maior penhasco do Sistema Solar (cerca de 20 km de queda).',
  });
  const ariel = urMoon(tilt, {
    id: 'ariel', name: 'Ariel', color: '#cfd0cc', textures: arielTex, orbitColor: 0x6a7278,
    radius: 0.15, orbitRadius: 5.4, orbitSpeed: 0.78,
    info: [['Diametro', '1.158 km'], ['Translacao', '2,5 dias'], ['Gravidade', '0,27 m/s\u00B2'], ['Destaque', 'a mais brilhante; vales tectonicos']],
    fact: 'A lua mais brilhante de Urano e a de superficie mais jovem, riscada por vales e fendas tectonicas.',
  });
  const umbriel = urMoon(tilt, {
    id: 'umbriel', name: 'Umbriel', color: '#7d7870', textures: umbrielTex, orbitColor: 0x55504a,
    radius: 0.15, orbitRadius: 6.6, orbitSpeed: 0.62,
    info: [['Diametro', '1.169 km'], ['Translacao', '4,1 dias'], ['Gravidade', '0,20 m/s\u00B2'], ['Destaque', 'a mais escura; cratera clara "Wunda"']],
    fact: 'A mais escura das luas de Urano: superficie antiga e craterizada, com uma misteriosa mancha clara em forma de anel (a cratera Wunda).',
  });
  const titania = urMoon(tilt, {
    id: 'titania', name: 'Tit\u00e2nia', color: '#b8b0a8', textures: titaniaTex, orbitColor: 0x66625a,
    radius: 0.18, orbitRadius: 7.9, orbitSpeed: 0.46,
    info: [['Diametro', '1.578 km'], ['Translacao', '8,7 dias'], ['Gravidade', '0,38 m/s\u00B2'], ['Destaque', 'maior lua de Urano; grandes canions']],
    fact: 'A maior lua de Urano. Mundo de gelo e rocha cortado por grandes canions (vales de falha) de centenas de km.',
  });
  const oberon = urMoon(tilt, {
    id: 'oberon', name: 'Oberon', color: '#b0a298', textures: oberonTex, orbitColor: 0x645c54,
    radius: 0.17, orbitRadius: 9.2, orbitSpeed: 0.36,
    info: [['Diametro', '1.523 km'], ['Translacao', '13,5 dias'], ['Gravidade', '0,35 m/s\u00B2'], ['Destaque', 'antiga e muito craterizada']],
    fact: 'A segunda maior lua de Urano e a mais distante das cinco: superficie muito antiga e craterizada, com fundos de cratera escuros.',
  });

  return [uranus, miranda, ariel, umbriel, titania, oberon];
}
