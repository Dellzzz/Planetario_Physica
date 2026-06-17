// =============================================================================
// objects/neptune.js
// NETUNO (gigante de gelo) com 3 luas, cada uma com sua peculiaridade:
//   - Tritao: orbita RETROGRADA (anda ao contrario do planeta) + geiseres
//   - Nereida: orbita muito ELIPTICA (excentrica)
//   - Proteu: formato IRREGULAR (corpo nao esferico)
//
// Utilitarios com prefixo "np" (sem colisao com procedural / jp / st / ur).
// A geometria irregular do Proteu reaproveita createIrregularGeometry.
// =============================================================================

import * as THREE from 'three';
import { CelestialBody, createOrbitLine } from '../js/celestialBody.js';
import { createIrregularGeometry } from '../js/procedural.js';

// --- escala (educativa) ------------------------------------------------------
const N_RADIUS = 2.25;
const N_ORBIT = 242;     // o planeta mais distante
const N_TILT = 28.3;
const N_ECC = 0.009;     // orbita quase circular ao redor do Sol
const N_ARG = 0.5;
const N_RING_INNER = 2.9, N_RING_OUTER = 3.7; // aneis muito tenues

// ====================== utilitarios proceduralis (prefixo np) ================
function npRand(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function npNoise2D(seed) {
  const grid = 256, rand = npRand(seed), vals = new Float32Array(grid * grid);
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
function npFbm(n, x, y, oct = 4) {
  let amp = 0.5, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) { sum += amp * n(x * freq, y * freq); norm += amp; amp *= 0.5; freq *= 2; }
  return sum / norm;
}
function npLerp(c1, c2, t) { return [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t]; }
function npRamp(stops, t) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (t >= a[0] && t <= b[0]) return npLerp(a[1], b[1], (t - a[0]) / ((b[0] - a[0]) || 1));
  }
  return stops[stops.length - 1][1];
}
function npCanvas(w, h, rf) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h; c._ctx = c.getContext('2d', { willReadFrequently: !!rf });
  return c;
}
function npFinalize(canvas, srgb, repeat) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.needsUpdate = true;
  return t;
}
function npCraterHeight(size, count, seed) {
  const c = npCanvas(size, size, true), ctx = c._ctx, img = ctx.createImageData(size, size), n = npNoise2D(seed);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const h = 110 + npFbm(n, x / size * 6, y / size * 6, 4) * 70, idx = (y * size + x) * 4;
    img.data[idx] = img.data[idx + 1] = img.data[idx + 2] = h; img.data[idx + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const rand = npRand(seed * 17 + 1);
  for (let i = 0; i < count; i++) {
    const cx = rand() * size, cy = rand() * size, r = 3 + rand() * (size * 0.05);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0.0, 'rgba(45,45,45,0.9)'); g.addColorStop(0.7, 'rgba(75,75,75,0.5)');
    g.addColorStop(0.82, 'rgba(205,205,205,0.55)'); g.addColorStop(1.0, 'rgba(128,128,128,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }
  return c;
}
function npNormalMap(heightCanvas, strength) {
  const size = heightCanvas.width, src = heightCanvas._ctx.getImageData(0, 0, size, size).data;
  const out = npCanvas(size, size), octx = out._ctx, dst = octx.createImageData(size, size);
  const H = (x, y) => { const xx = ((x % size) + size) % size, yy = ((y % size) + size) % size; return src[(yy * size + xx) * 4] / 255; };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (H(x - 1, y) - H(x + 1, y)) * strength, dy = (H(x, y - 1) - H(x, y + 1)) * strength;
    const len = Math.sqrt(dx * dx + dy * dy + 1), idx = (y * size + x) * 4;
    dst.data[idx] = (dx / len * 0.5 + 0.5) * 255; dst.data[idx + 1] = (dy / len * 0.5 + 0.5) * 255;
    dst.data[idx + 2] = (1 / len * 0.5 + 0.5) * 255; dst.data[idx + 3] = 255;
  }
  octx.putImageData(dst, 0, 0);
  return npFinalize(out, false, true);
}

// ====================== texturas =============================================
// Netuno: azul intenso com bandas, a Grande Mancha Escura e nuvens brancas
function npDarkSpot(ctx, size) {
  const cx = size * 0.66, cy = size * 0.40, rw = size * 0.11;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.6);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rw);
  g.addColorStop(0.0, 'rgba(20,32,70,0.92)'); g.addColorStop(0.6, 'rgba(28,46,98,0.7)'); g.addColorStop(1.0, 'rgba(40,70,150,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rw, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function npWhiteStreaks(ctx, size, seed) {
  const rand = npRand(seed); ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    let x = rand() * size, y = rand() * size;
    const len = size * (0.08 + rand() * 0.14), ang = (rand() - 0.5) * 0.5;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(ang) * len * 0.5, y + Math.sin(ang) * len * 0.5 - size * 0.01, x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.strokeStyle = 'rgba(228,238,250,' + (0.25 + rand() * 0.35).toFixed(2) + ')';
    ctx.lineWidth = 0.6 + rand() * 1.6; ctx.stroke();
  }
}
function npBandedTexture(size) {
  const c = npCanvas(size, size), ctx = c._ctx, img = ctx.createImageData(size, size);
  const turb = npNoise2D(8), warp = npNoise2D(19);
  const base = [44, 84, 184], lighter = [78, 128, 214], deep = [26, 54, 138], royal = [58, 104, 200];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const lat = y / size;
    const w = (npFbm(warp, x / size * 2.2, lat * 4, 4) - 0.5) * 0.05;
    const band = 0.5 + 0.5 * Math.sin((lat + w) * Math.PI * 12);
    let col = band > 0.5 ? npLerp(royal, lighter, (band - 0.5) / 0.5) : npLerp(deep, base, band / 0.5);
    const fine = npFbm(turb, x / size * 5 + w * 6, lat * 11, 4);
    col = npLerp(col, lighter, Math.max(0, fine - 0.64) * 0.5);
    const idx = (y * size + x) * 4;
    img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  npDarkSpot(ctx, size);
  npWhiteStreaks(ctx, size, 27);
  return npFinalize(c, true, true);
}
// Tritao: gelo rosa-palido, terreno "casca de melao" e estrias escuras de geiseres
function npGeyserStreaks(ctx, size, seed) {
  const rand = npRand(seed); ctx.lineCap = 'round';
  for (let i = 0; i < 10; i++) {
    const x = rand() * size, y = (0.55 + rand() * 0.4) * size; // mais no hemisferio sul
    const len = size * (0.05 + rand() * 0.10);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rand() - 0.5) * size * 0.04, y - len);
    ctx.strokeStyle = 'rgba(70,55,55,' + (0.3 + rand() * 0.3).toFixed(2) + ')';
    ctx.lineWidth = 0.6 + rand() * 1.0; ctx.stroke();
  }
}
function npTritonTexture(size) {
  const c = npCanvas(size, size), ctx = c._ctx, img = ctx.createImageData(size, size);
  const n = npNoise2D(95), dimple = npNoise2D(96);
  const pal = [[0.0, [196, 176, 170]], [0.5, [220, 202, 196]], [1.0, [240, 228, 222]]];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let col = npRamp(pal, npFbm(n, x / size * 4, y / size * 4, 4));
    // "casca de melao": covinhas regulares
    const d = npFbm(dimple, x / size * 14, y / size * 14, 2);
    col = npLerp(col, [186, 168, 166], Math.max(0, 0.45 - d) * 0.5);
    // leve tom rosado no polo sul
    const polar = Math.max(0, (y / size - 0.7) / 0.3);
    col = npLerp(col, [236, 206, 206], polar * 0.35);
    const idx = (y * size + x) * 4;
    img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  npGeyserStreaks(ctx, size, 61);
  return npFinalize(c, true, true);
}
// Lua gelada/rochosa craterizada (Nereida e Proteu, com paletas diferentes)
function npCrateredMoon(size, palette, craterCount, seed) {
  const height = npCraterHeight(size, craterCount, seed);
  const hdata = height._ctx.getImageData(0, 0, size, size).data;
  const c = npCanvas(size, size), img = c._ctx.createImageData(size, size);
  const tint = npNoise2D(seed * 3 + 7);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const idx = (y * size + x) * 4;
    const f = Math.max(0, Math.min(1, hdata[idx] / 255 + (npFbm(tint, x / size * 11, y / size * 11, 3) - 0.5) * 0.12));
    const col = npRamp(palette, f);
    img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
  }
  c._ctx.putImageData(img, 0, 0);
  return { map: npFinalize(c, true, true), normalMap: npNormalMap(height, 2.0) };
}
function npRingTexture(width) {
  const h = 8, c = npCanvas(width, h), ctx = c._ctx, img = ctx.createImageData(width, h), n = npNoise2D(505);
  const rings = [{ f: 0.35, w: 0.02, a: 0.22 }, { f: 0.7, w: 0.02, a: 0.26 }, { f: 0.95, w: 0.04, a: 0.40 }];
  for (let x = 0; x < width; x++) {
    const f = x / width;
    let a = 0;
    for (const rg of rings) { const d = Math.abs(f - rg.f); if (d < rg.w) a = Math.max(a, rg.a * (1 - d / rg.w)); }
    a *= 0.8 + 0.2 * npFbm(n, f * 150, 0, 3);
    const g = 70 + 110 * (0.6 + 0.2 * npFbm(n, f * 30, 3, 3));
    for (let y = 0; y < h; y++) {
      const idx = (y * width + x) * 4;
      img.data[idx] = g; img.data[idx + 1] = g; img.data[idx + 2] = g + 14;
      img.data[idx + 3] = Math.max(0, Math.min(255, a * 255));
    }
  }
  ctx.putImageData(img, 0, 0);
  return npFinalize(c, true, false);
}

// ====================== construcao ===========================================
// Lua de Netuno. Aceita geometria propria (Proteu), excentricidade (Nereida) e
// orbita/rotacao retrogradas (Tritao, via orbitSpeed negativo).
function npMoon(tilt, cfg) {
  const group = new THREE.Group();
  const matOpts = { map: cfg.textures.map, roughness: 1.0, metalness: 0.0 };
  if (cfg.textures.normalMap) { matOpts.normalMap = cfg.textures.normalMap; matOpts.normalScale = new THREE.Vector2(0.8, 0.8); }
  const mat = new THREE.MeshStandardMaterial(matOpts);
  const geo = cfg.geometry || new THREE.SphereGeometry(cfg.radius, 48, 48);
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);
  if (cfg.glow) { // atmosfera tenue (Tritao)
    const g = new THREE.Mesh(
      new THREE.SphereGeometry(cfg.radius * 1.16, 32, 32),
      new THREE.MeshBasicMaterial({ color: cfg.glow, transparent: true, opacity: 0.16, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    group.add(g);
  }
  tilt.add(group);
  const ecc = cfg.eccentricity || 0, arg = cfg.argPerihelion || 0;
  const orbit = createOrbitLine(cfg.orbitRadius, cfg.orbitColor, 0.22, ecc, arg);
  tilt.add(orbit);
  const body = new CelestialBody({
    id: cfg.id, name: cfg.name, type: 'Satelite de Netuno', color: cfg.color,
    group, mesh, radius: cfg.radius, orbitLine: orbit,
    orbitRadius: cfg.orbitRadius, orbitSpeed: cfg.orbitSpeed,
    rotationSpeed: cfg.rotationSpeed !== undefined ? cfg.rotationSpeed : cfg.orbitSpeed,
    eccentricity: ecc, argPerihelion: arg,
    info: cfg.info, fact: cfg.fact,
  });
  body.realTextures = [{ file: cfg.id, material: mat, slot: 'map', srgb: true }];
  if (cfg.textures.normalMap) body.realTextures.push({ file: cfg.id + '_normal', material: mat, slot: 'normalMap', srgb: false });
  return body;
}

export function createNeptune(scene) {
  const banded = npBandedTexture(512);
  const tritonTex = { map: npTritonTexture(384) };
  const nereidTex = npCrateredMoon(320, [[0, [118, 122, 128]], [0.5, [160, 164, 170]], [0.8, [192, 196, 202]], [1, [214, 218, 223]]], 60, 171);
  const proteusTex = npCrateredMoon(384, [[0, [54, 52, 50]], [0.5, [86, 83, 80]], [0.8, [112, 108, 104]], [1, [134, 130, 125]]], 90, 181); // escuro como fuligem

  const group = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.rotation.z = THREE.MathUtils.degToRad(N_TILT);
  group.add(tilt);

  const mat = new THREE.MeshStandardMaterial({ map: banded, roughness: 1.0, metalness: 0.0 });
  const surface = new THREE.Mesh(new THREE.SphereGeometry(N_RADIUS, 64, 48), mat);
  tilt.add(surface);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(N_RADIUS * 1.03, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0x5a86e0, transparent: true, opacity: 0.12, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  group.add(glow);

  // aneis muito tenues
  const ringGeo = new THREE.RingGeometry(N_RING_INNER, N_RING_OUTER, 160, 1);
  const pa = ringGeo.attributes.position, ua = ringGeo.attributes.uv, vtmp = new THREE.Vector3();
  for (let i = 0; i < pa.count; i++) { vtmp.fromBufferAttribute(pa, i); ua.setXY(i, (vtmp.length() - N_RING_INNER) / (N_RING_OUTER - N_RING_INNER), 0.5); }
  ua.needsUpdate = true;
  const rings = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ map: npRingTexture(1024), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  rings.rotation.x = -Math.PI / 2;
  tilt.add(rings);

  scene.add(group);

  const orbit = createOrbitLine(N_ORBIT, 0x4f7fd6, 0.30, N_ECC, N_ARG);
  scene.add(orbit);

  const neptune = new CelestialBody({
    id: 'neptune', name: 'Netuno', type: 'Gigante de Gelo', color: '#3f6fd0',
    group, mesh: surface, radius: N_RADIUS, orbitLine: orbit,
    orbitRadius: N_ORBIT, orbitSpeed: 0.018, rotationSpeed: 0.5,
    eccentricity: N_ECC, argPerihelion: N_ARG,
    info: [
      ['Diametro', '49.244 km'],
      ['Ano (translacao)', '165 anos'],
      ['Dia (rotacao)', '16h06min'],
      ['Gravidade', '11,15 m/s\u00B2'],
      ['Luas', '16 (Tritao e a maior)'],
      ['Distancia do Sol', '\u2248 4,5 bilhoes de km'],
    ],
    fact: 'O planeta mais distante do Sol. Tem os ventos mais velozes do Sistema Solar (mais de 2.000 km/h) e tempestades escuras como a Grande Mancha Escura. Foi o primeiro planeta descoberto por calculos matematicos, antes de ser observado.',
  });
  neptune.realTextures = [{ file: 'neptune', material: mat, slot: 'map', srgb: true }];

  // Proteu -- FORMATO IRREGULAR (geometria nao esferica) e escuro
  const proteu = npMoon(tilt, {
    id: 'proteu', name: 'Proteu', color: '#6e6c68', textures: { map: proteusTex.map }, orbitColor: 0x4a4844,
    radius: 0.13, geometry: createIrregularGeometry(0.13, 3, 201, 0.34),
    orbitRadius: 4.0, orbitSpeed: 0.85,
    info: [['Diametro', '420 km'], ['Translacao', '1,1 dias'], ['Gravidade', '0,07 m/s\u00B2'], ['Destaque', 'formato irregular (nao esferico)']],
    fact: 'Um dos maiores corpos IRREGULARES do Sistema Solar: esta quase no limite de tamanho em que a gravidade ainda nao o arredondou. Escuro como fuligem, com a enorme cratera Faros.',
  });
  // Tritao -- orbita e rotacao RETROGRADAS (orbitSpeed negativo) + atmosfera
  const tritao = npMoon(tilt, {
    id: 'tritao', name: 'Trit\u00e3o', color: '#dcc6be', textures: tritonTex, orbitColor: 0x6a5a58, glow: 0xb9c6e0,
    radius: 0.20, orbitRadius: 5.5, orbitSpeed: -0.6, // NEGATIVO = retrogrado
    info: [['Diametro', '2.707 km'], ['Translacao', '5,9 dias (retrograda)'], ['Gravidade', '0,78 m/s\u00B2'], ['Destaque', 'orbita RETROGRADA + geiseres']],
    fact: 'A maior lua de Netuno e a unica lua grande com orbita RETROGRADA (gira ao contrario do planeta) -- sinal de que foi capturada do Cinturao de Kuiper. Tem geiseres de nitrogenio e um terreno enrugado tipo "casca de melao".',
  });
  // Nereida -- orbita muito ELIPTICA (alta excentricidade)
  const nereida = npMoon(tilt, {
    id: 'nereida', name: 'Nereida', color: '#aab0b6', textures: nereidTex, orbitColor: 0x5e656b,
    radius: 0.09, orbitRadius: 16.0, orbitSpeed: 0.16, eccentricity: 0.62, argPerihelion: 1.5, rotationSpeed: 0.4,
    info: [['Diametro', '340 km'], ['Translacao', '360 dias'], ['Excentricidade', '\u2248 0,75'], ['Destaque', 'orbita extremamente eliptica']],
    fact: 'Tem uma das orbitas mais alongadas (excentricas) de todo o Sistema Solar: a distancia ate Netuno varia enormemente ao longo de cada volta -- observe-a acelerar perto do planeta e desacelerar la longe.',
  });

  return [neptune, proteu, tritao, nereida];
}
