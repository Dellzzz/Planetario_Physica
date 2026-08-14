// =============================================================================
// objects/anoes.js
// PLANETAS ANOES: Ceres (no cinturao de asteroides), Plutao + Caronte, Haumea,
// Makemake e Eris. Inclui tambem o CINTURAO DE KUIPER (decorativo) alem de
// Netuno, de onde vem a maioria desses corpos.
//
// Modulo AUTOSSUFICIENTE, no mesmo padrao de jupiter.js/saturn.js: traz as
// proprias escalas e a propria geracao de textura (prefixo "dw" para nao
// colidir com procedural.js). Para usar, basta em js/main.js:
//   import { createAnoes } from '../objects/anoes.js';
//   const anoes = createAnoes(scene);   // retorna a lista de corpos
//
// As fichas tecnicas ficam em js/dados.js (aplicadas depois, por aplicarDados).
// =============================================================================

import * as THREE from 'three';
import { CelestialBody, createOrbitLine } from '../js/celestialBody.js';

// --- escala educativa --------------------------------------------------------
// Referencia do projeto: Terra r=1.30 / orbita 95 ... Netuno orbita 620.
// Os anoes sao pequenos demais para a escala real; ficam levemente exagerados
// para continuarem clicaveis (os valores REAIS aparecem na ficha tecnica).
const ANOES = [
  { id: 'ceres',    name: 'Ceres',    r: 0.17, orb: 186, spd: 0.115, ecc: 0.076, arg: 0.9, rot: 0.30,
    cor: '#9d9284', semente: 1201, tipo: 'rochoso', linha: 0x6b6357 },
  { id: 'plutao',   name: 'Plut\u00e3o', r: 0.30, orb: 700, spd: 0.034, ecc: 0.249, arg: 0.8, rot: 0.16,
    cor: '#c9b49a', semente: 1930, tipo: 'gelo', linha: 0x7a6a58 },
  { id: 'haumea',   name: 'Haumea',   r: 0.22, orb: 762, spd: 0.030, ecc: 0.191, arg: 2.3, rot: 1.60,
    cor: '#dcd8d0', semente: 2004, tipo: 'gelo', linha: 0x6f6c66, achatado: true },
  { id: 'makemake', name: 'Makemake', r: 0.20, orb: 806, spd: 0.028, ecc: 0.161, arg: 4.1, rot: 0.22,
    cor: '#b98a6d', semente: 2005, tipo: 'gelo', linha: 0x6e5647 },
  { id: 'eris',     name: '\u00c9ris',  r: 0.29, orb: 900, spd: 0.022, ecc: 0.436, arg: 5.2, rot: 0.14,
    cor: '#e6e3da', semente: 2003, tipo: 'gelo', linha: 0x74726c },
];

// Caronte orbita Plutao (mesmo padrao da Lua com a Terra)
const CARONTE = { id: 'caronte', name: 'Caronte', r: 0.15, orb: 1.05, spd: 1.05, rot: 1.05,
  cor: '#a9a196', semente: 1978, linha: 0x6a655c };

// ===================== textura procedural (prefixo dw) =======================
function dwRand(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function dwNoise2D(seed) {
  const grid = 128, rand = dwRand(seed), vals = new Float32Array(grid * grid);
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
function dwFbm(n, x, y, oct = 4) {
  let amp = 0.5, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) { sum += amp * n(x * freq, y * freq); norm += amp; amp *= 0.5; freq *= 2; }
  return sum / norm;
}
function dwHexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// Superficie gelada/rochosa: manchas claras e escuras + crateras suaves.
function dwSurface(corBase, semente, tipo) {
  const W = 512, H = 256;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(W, H);
  const n1 = dwNoise2D(semente), n2 = dwNoise2D(semente + 77);
  const base = dwHexToRgb(corBase);
  const gelo = tipo === 'gelo';

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x / W * 8, v = y / H * 4;
      const m = dwFbm(n1, u, v, 5);
      const manchas = dwFbm(n2, u * 0.6, v * 0.6, 3);
      // regioes claras (gelo fresco) e escuras (material organico/rocha)
      let t = m * 0.65 + manchas * 0.35;
      let brilho = gelo ? (0.72 + t * 0.55) : (0.6 + t * 0.5);
      if (gelo && manchas > 0.62) brilho *= 1.18;      // placas de gelo brilhante
      if (manchas < 0.34) brilho *= 0.72;               // manchas escuras
      const i = (y * W + x) * 4;
      img.data[i]     = Math.min(255, base[0] * brilho);
      img.data[i + 1] = Math.min(255, base[1] * brilho);
      img.data[i + 2] = Math.min(255, base[2] * brilho);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // crateras (circulos suaves com borda clara)
  const rand = dwRand(semente + 999);
  const qtd = gelo ? 26 : 60;
  for (let i = 0; i < qtd; i++) {
    const cx = rand() * W, cy = 20 + rand() * (H - 40), r = 2 + rand() * (gelo ? 7 : 11);
    const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
    g.addColorStop(0, 'rgba(0,0,0,0.30)');
    g.addColorStop(0.75, 'rgba(0,0,0,0.10)');
    g.addColorStop(1, 'rgba(255,255,255,0.16)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

// ============================== construcao ===================================
export function createAnoes(scene) {
  const corpos = [];

  for (const cfg of ANOES) {
    const group = new THREE.Group();
    const geo = new THREE.SphereGeometry(cfg.r, 40, 40);
    const mat = new THREE.MeshStandardMaterial({
      map: dwSurface(cfg.cor, cfg.semente, cfg.tipo),
      roughness: cfg.tipo === 'gelo' ? 0.82 : 1.0,
      metalness: 0.0,
    });
    const mesh = new THREE.Mesh(geo, mat);
    // Haumea gira tao rapido que ficou achatado como uma bola de rugbi
    if (cfg.achatado) mesh.scale.set(1.9, 0.78, 0.95);
    group.add(mesh);
    scene.add(group);

    const orbit = createOrbitLine(cfg.orb, cfg.linha, 0.26, cfg.ecc, cfg.arg);
    scene.add(orbit);

    const body = new CelestialBody({
      id: cfg.id, name: cfg.name, type: 'Planeta An\u00e3o', color: cfg.cor,
      group, mesh, radius: cfg.r, orbitLine: orbit,
      orbitRadius: cfg.orb, orbitSpeed: cfg.spd, rotationSpeed: cfg.rot,
      eccentricity: cfg.ecc, argPerihelion: cfg.arg,
      info: [], fact: '',
    });
    corpos.push(body);

    // Permite trocar a textura procedural por arquivos reais, se existirem:
    //   textures/<id>.jpg|png         -> cor da superficie
    //   textures/<id>_normal.jpg|png  -> relevo (opcional)
    // Sem os arquivos, continua valendo a textura gerada em codigo.
    body.realTextures = [
      { file: cfg.id, material: mat, slot: 'map', srgb: true },
      { file: cfg.id + '_normal', material: mat, slot: 'normalMap', srgb: false },
    ];

    // ---- Caronte: orbita Plutao (anexado ao grupo dele) ----
    if (cfg.id === 'plutao') {
      const cg = new THREE.Group();
      const cmat = new THREE.MeshStandardMaterial({
        map: dwSurface(CARONTE.cor, CARONTE.semente, 'rochoso'), roughness: 1.0, metalness: 0.0,
      });
      const cmesh = new THREE.Mesh(new THREE.SphereGeometry(CARONTE.r, 32, 32), cmat);
      cg.add(cmesh);
      group.add(cg);
      const corbit = createOrbitLine(CARONTE.orb, CARONTE.linha, 0.24);
      group.add(corbit);

      const cbody = new CelestialBody({
        id: CARONTE.id, name: CARONTE.name, type: 'Sat\u00e9lite Natural', color: CARONTE.cor,
        group: cg, mesh: cmesh, radius: CARONTE.r, orbitLine: corbit,
        orbitRadius: CARONTE.orb, orbitSpeed: CARONTE.spd, rotationSpeed: CARONTE.rot,
        info: [], fact: '',
      });
      cbody.realTextures = [
        { file: CARONTE.id, material: cmat, slot: 'map', srgb: true },
        { file: CARONTE.id + '_normal', material: cmat, slot: 'normalMap', srgb: false },
      ];
      corpos.push(cbody);
    }
  }

  return corpos;
}

// ---- Cinturao de Kuiper (decorativo, nao clicavel) --------------------------
// Anel largo de corpos gelados alem de Netuno, de onde vem Plutao e companhia.
export function createKuiper(scene) {
  const N = 1400;
  const geo = new THREE.IcosahedronGeometry(1, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x9aa6b8, roughness: 1.0, metalness: 0.0 });
  const inst = new THREE.InstancedMesh(geo, mat, N);
  const rand = dwRand(4242);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < N; i++) {
    const r = 660 + rand() * 250;                 // logo depois de Netuno (620)
    const th = rand() * Math.PI * 2;
    const y = (rand() - 0.5) * 46;                // um pouco espalhado na vertical
    const s = 0.30 + rand() * 0.85;
    dummy.position.set(r * Math.cos(th), y, r * Math.sin(th));
    dummy.rotation.set(rand() * 6.28, rand() * 6.28, rand() * 6.28);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
  const grupo = new THREE.Group();
  grupo.add(inst);
  scene.add(grupo);

  return {
    group: grupo,
    setVisible(v) { grupo.visible = v; },
    update(dt) { grupo.rotation.y += dt * 0.004; },  // giro lento
  };
}
