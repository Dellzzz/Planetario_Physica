// =============================================================================
// procedural.js
// Geracao PROCEDURAL de texturas (sem nenhum arquivo de imagem externo).
// Todas as texturas (Sol, planetas, atmosfera, estrelas, nebulosas) sao
// desenhadas em <canvas> no carregamento e convertidas em THREE.Texture.
// Vantagens: roda sem baixar imagens, evita problemas de CORS e e leve.
//
// Para usar texturas REAIS (ex.: NASA) no futuro, basta trocar o "map" do
// material por: new THREE.TextureLoader().load('textures/arquivo.jpg').
// =============================================================================

import * as THREE from 'three';

// --- Gerador pseudoaleatorio deterministico (mulberry32) ---------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Ruido de valor 2D suave (value noise), tile de 256 ----------------------
function makeNoise2D(seed) {
  const grid = 256;
  const rand = mulberry32(seed);
  const vals = new Float32Array(grid * grid);
  for (let i = 0; i < vals.length; i++) vals[i] = rand();
  const smooth = (t) => t * t * (3 - 2 * t);
  return function (x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const x0 = ((xi % grid) + grid) % grid;
    const y0 = ((yi % grid) + grid) % grid;
    const x1 = (x0 + 1) % grid, y1 = (y0 + 1) % grid;
    const v00 = vals[y0 * grid + x0], v10 = vals[y0 * grid + x1];
    const v01 = vals[y1 * grid + x0], v11 = vals[y1 * grid + x1];
    const u = smooth(xf), v = smooth(yf);
    const a = v00 + (v10 - v00) * u;
    const b = v01 + (v11 - v01) * u;
    return a + (b - a) * v;
  };
}

// Soma fractal de oitavas (fractal Brownian motion)
function fbm(noise, x, y, octaves = 5, lacunarity = 2, gain = 0.5) {
  let amp = 0.5, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * freq, y * freq);
    norm += amp; amp *= gain; freq *= lacunarity;
  }
  return sum / norm;
}

// Interpolacao linear entre cores [r,g,b] e mapeamento por rampa
function lerpColor(c1, c2, t) {
  return [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t];
}
function ramp(stops, t) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (t >= a[0] && t <= b[0]) {
      const k = (t - a[0]) / ((b[0] - a[0]) || 1);
      return lerpColor(a[1], b[1], k);
    }
  }
  return stops[stops.length - 1][1];
}

function newCanvas(w, h, readFrequently = false) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c._ctx = c.getContext('2d', { willReadFrequently: readFrequently });
  return c;
}

function finalizeTexture(canvas, { srgb = true, repeat = true } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; }
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------------------
// SOL: superficie incandescente
export function createSunTexture(size = 512) {
  const canvas = newCanvas(size, size);
  const ctx = canvas._ctx;
  const img = ctx.createImageData(size, size);
  const n1 = makeNoise2D(7), n2 = makeNoise2D(91);
  const fire = [
    [0.00, [60, 12, 0]], [0.35, [180, 45, 0]], [0.55, [240, 90, 10]],
    [0.75, [255, 170, 40]], [0.92, [255, 225, 130]], [1.00, [255, 248, 220]],
  ];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * 7, v = (y / size) * 7;
      let t = fbm(n1, u, v, 5);
      t += (fbm(n2, u * 3.1, v * 3.1, 3) - 0.5) * 0.45; // granulacao fina
      t = Math.max(0, Math.min(1, t * 1.15));
      const col = ramp(fire, t);
      const idx = (y * size + x) * 4;
      img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalizeTexture(canvas, { srgb: true, repeat: true });
}

// Halo/brilho radial (para sprites com blending aditivo)
export function createGlowTexture(size = 256) {
  const canvas = newCanvas(size, size);
  const ctx = canvas._ctx;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.0, 'rgba(255,240,210,1)');
  g.addColorStop(0.3, 'rgba(255,150,40,0.55)');
  g.addColorStop(1.0, 'rgba(255,120,20,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  return finalizeTexture(canvas, { srgb: true, repeat: false });
}

// ---------------------------------------------------------------------------
// Mapa de altura com crateras (base para Mercurio)
function createCraterHeight(size = 256, craterCount = 90, seed = 3) {
  const canvas = newCanvas(size, size, true);
  const ctx = canvas._ctx;
  const img = ctx.createImageData(size, size);
  const n = makeNoise2D(seed);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const h = 110 + fbm(n, x / size * 6, y / size * 6, 4) * 70; // relevo suave de base
      const idx = (y * size + x) * 4;
      img.data[idx] = img.data[idx + 1] = img.data[idx + 2] = h;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // estampar crateras: depressao no centro + borda elevada
  const rand = mulberry32(seed * 17 + 1);
  for (let i = 0; i < craterCount; i++) {
    const cx = rand() * size, cy = rand() * size;
    const r = 4 + rand() * (size * 0.06);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0.0, 'rgba(40,40,40,0.9)');
    g.addColorStop(0.7, 'rgba(70,70,70,0.5)');
    g.addColorStop(0.82, 'rgba(210,210,210,0.55)');
    g.addColorStop(1.0, 'rgba(128,128,128,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }
  return canvas;
}

// Converte um mapa de altura (cinza) em NORMAL MAP via Sobel
export function createNormalMap(heightCanvas, strength = 2.4) {
  const size = heightCanvas.width;
  const src = heightCanvas._ctx.getImageData(0, 0, size, size).data;
  const out = newCanvas(size, size);
  const octx = out._ctx;
  const dst = octx.createImageData(size, size);
  const H = (x, y) => {
    const xx = ((x % size) + size) % size, yy = ((y % size) + size) % size;
    return src[(yy * size + xx) * 4] / 255;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (H(x - 1, y) - H(x + 1, y)) * strength;
      const dy = (H(x, y - 1) - H(x, y + 1)) * strength;
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      const idx = (y * size + x) * 4;
      dst.data[idx] = (dx / len * 0.5 + 0.5) * 255;
      dst.data[idx + 1] = (dy / len * 0.5 + 0.5) * 255;
      dst.data[idx + 2] = (1 / len * 0.5 + 0.5) * 255;
      dst.data[idx + 3] = 255;
    }
  }
  octx.putImageData(dst, 0, 0);
  return finalizeTexture(out, { srgb: false, repeat: true }); // normal map NAO usa sRGB
}

// Texturas de Mercurio (cor derivada do mapa de altura + normal map)
export function createMercuryTextures(size = 384) {
  const height = createCraterHeight(256, 90, 3);
  const hdata = height._ctx.getImageData(0, 0, 256, 256).data;
  const canvas = newCanvas(size, size);
  const ctx = canvas._ctx;
  const img = ctx.createImageData(size, size);
  const tint = makeNoise2D(55);
  const palette = [[0.0, [60, 55, 50]], [0.5, [120, 110, 100]], [0.8, [165, 150, 135]], [1.0, [200, 188, 172]]];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const hx = Math.floor(x / size * 256), hy = Math.floor(y / size * 256);
      const h = hdata[(hy * 256 + hx) * 4] / 255;
      const tn = fbm(tint, x / size * 10, y / size * 10, 3) * 0.15;
      const col = ramp(palette, Math.max(0, Math.min(1, h + tn - 0.05)));
      const idx = (y * size + x) * 4;
      img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { map: finalizeTexture(canvas, { srgb: true, repeat: true }), normalMap: createNormalMap(height, 2.4) };
}

// ---------------------------------------------------------------------------
// VENUS: superficie (domain warping para redemoinhos)
export function createVenusSurfaceTexture(size = 384) {
  const canvas = newCanvas(size, size);
  const ctx = canvas._ctx;
  const img = ctx.createImageData(size, size);
  const base = makeNoise2D(21), warp = makeNoise2D(34);
  const pal = [[0.0, [120, 80, 30]], [0.4, [180, 130, 60]], [0.7, [220, 180, 110]], [1.0, [245, 225, 175]]];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size * 5, v = y / size * 5;
      const wx = u + fbm(warp, u, v, 3) * 2.2;
      const wy = v + fbm(warp, u + 5.2, v + 1.3, 3) * 2.2;
      const col = ramp(pal, fbm(base, wx, wy, 5));
      const idx = (y * size + x) * 4;
      img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalizeTexture(canvas, { srgb: true, repeat: true });
}

// VENUS: nuvens/atmosfera translucida (canvas RGBA com transparencia)
export function createVenusCloudTexture(size = 384) {
  const canvas = newCanvas(size, size);
  const ctx = canvas._ctx;
  const img = ctx.createImageData(size, size);
  const base = makeNoise2D(77), warp = makeNoise2D(88);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size * 4, v = y / size * 4;
      const band = 0.5 + 0.5 * Math.sin(v * 3.0 + fbm(warp, u, v, 3) * 3.0); // bandas densas
      const t = fbm(base, u + band, v, 4) * 0.6 + band * 0.4;
      const alpha = Math.max(0, Math.min(1, (t - 0.35) * 1.8));
      const shade = 200 + t * 55;
      const idx = (y * size + x) * 4;
      img.data[idx] = shade; img.data[idx + 1] = shade * 0.92; img.data[idx + 2] = shade * 0.7;
      img.data[idx + 3] = alpha * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalizeTexture(canvas, { srgb: true, repeat: true });
}

// ---------------------------------------------------------------------------
// Estrela pontual (sprite redondo para o campo de estrelas)
export function createStarTexture(size = 64) {
  const canvas = newCanvas(size, size);
  const ctx = canvas._ctx;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.85)');
  g.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  return finalizeTexture(canvas, { srgb: true, repeat: false });
}

// Nebulosa suave (sprite colorido, baixa opacidade)
export function createNebulaTexture(size = 256, rgb = [120, 60, 200]) {
  const canvas = newCanvas(size, size);
  const ctx = canvas._ctx;
  const img = ctx.createImageData(size, size);
  const n = makeNoise2D(Math.floor(rgb[0] + rgb[1] * 3 + rgb[2] * 7));
  const cx = size / 2, cy = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - cx) / (size / 2), dy = (y - cy) / (size / 2);
      const falloff = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
      const a = Math.max(0, falloff * falloff * fbm(n, x / size * 3, y / size * 3, 4));
      const idx = (y * size + x) * 4;
      img.data[idx] = rgb[0]; img.data[idx + 1] = rgb[1]; img.data[idx + 2] = rgb[2];
      img.data[idx + 3] = a * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalizeTexture(canvas, { srgb: true, repeat: false });
}

// Anel de selecao (sprite com blending aditivo)
export function createRingTexture(size = 256) {
  const canvas = newCanvas(size, size);
  const ctx = canvas._ctx;
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(46,230,255,0.95)';
  ctx.lineWidth = size * 0.03;
  ctx.shadowColor = 'rgba(46,230,255,0.9)';
  ctx.shadowBlur = size * 0.08;
  ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2 - size * 0.08, 0, Math.PI * 2); ctx.stroke();
  return finalizeTexture(canvas, { srgb: true, repeat: false });
}
