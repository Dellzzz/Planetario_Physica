// =============================================================================
// scene.js
// Cena Three.js, renderizador WebGL e fundo espacial (estrelas + nebulosas).
// =============================================================================

import * as THREE from 'three';
import { SETTINGS, COLORS } from './config.js';
import { createStarTexture, createNebulaTexture } from './procedural.js';

// Textura do nucleo galactico (centro da Via-Lactea): bojo brilhante alongado,
// nuvens de estrelas concentradas e faixas de poeira escuras (rifts) atravessando.
function makeGalaxyCoreTexture(size) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2, cy = size / 2;
  // bojo central brilhante, achatado (disco visto quase de perfil)
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const rad = size * (0.5 - i * 0.12);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, 'rgba(255,238,205,' + (0.5 - i * 0.1).toFixed(2) + ')');
    g.addColorStop(0.4, 'rgba(240,200,150,' + (0.22 - i * 0.05).toFixed(2) + ')');
    g.addColorStop(1, 'rgba(120,90,70,0)');
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.42); ctx.translate(-cx, -cy);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  // nuvens de estrelas: pontinhos quentes concentrados no centro (gaussiana achatada)
  for (let i = 0; i < 2200; i++) {
    const gx = (Math.random() + Math.random() + Math.random() - 1.5);
    const gy = (Math.random() + Math.random() + Math.random() - 1.5);
    const x = cx + gx * size * 0.32, y = cy + gy * size * 0.14;
    const b = (0.3 + Math.random() * 0.7).toFixed(2), warm = Math.random();
    ctx.fillStyle = 'rgba(255,' + (236 - warm * 40 | 0) + ',' + (205 - warm * 70 | 0) + ',' + b + ')';
    const s = Math.random() < 0.92 ? 0.8 : 1.7;
    ctx.fillRect(x, y, s, s);
  }
  // faixas de poeira: apaga partes (em blending aditivo, regiao apagada fica escura)
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 2; i++) {
    const yy = cy + (i === 0 ? -size * 0.02 : size * 0.05);
    ctx.save(); ctx.translate(cx, yy); ctx.scale(1, 0.16); ctx.translate(-cx, -yy);
    const g = ctx.createRadialGradient(cx, yy, 0, cx, yy, size * 0.5);
    g.addColorStop(0, 'rgba(0,0,0,0.85)'); g.addColorStop(0.7, 'rgba(0,0,0,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, yy, size * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
  return tex;
}

// Cria a cena e o renderizador WebGL (tone mapping cinematografico, sRGB).
export function createScene(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.background);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: SETTINGS.antialias, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, SETTINGS.maxPixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  return { scene, renderer };
}

// Fundo espacial em camadas (paralaxe) + nebulosas sutis.
// Retorna grupos para animacao lenta no loop principal (sensacao de imersao).
export function createBackground(scene) {
  const starTex = createStarTexture(64);

  function starLayer(count, rMin, rMax, size) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      // distribuicao uniforme em casca esferica
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = rMin + Math.random() * (rMax - rMin);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      c.setHSL(0.6 - Math.random() * 0.15, 0.25, 0.75 + Math.random() * 0.2);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size, map: starTex, vertexColors: true, transparent: true, depthWrite: false,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, alphaTest: 0.01, fog: false,
    });
    return new THREE.Points(geo, mat);
  }

  const nearStars = starLayer(SETTINGS.starCountNear, 1700, 3200, 3.0);
  const farStars = starLayer(SETTINGS.starCountFar, 4000, 7500, 5.0);

  // Nebulosas: sprites grandes, coloridos e muito sutis (identidade neon roxo/ciano/magenta).
  const nebulaGroup = new THREE.Group();
  const nebulaDefs = [
    { rgb: [120, 60, 200], pos: [-2700, 900, -3150], scale: 3150, opacity: 0.16 },
    { rgb: [40, 160, 200], pos: [3150, -675, -2250], scale: 2700, opacity: 0.12 },
    { rgb: [200, 50, 180], pos: [-900, -1350, 3375], scale: 2340, opacity: 0.10 },
  ];
  for (const d of nebulaDefs) {
    const mat = new THREE.SpriteMaterial({
      map: createNebulaTexture(256, d.rgb), transparent: true, opacity: d.opacity,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const sp = new THREE.Sprite(mat);
    sp.position.set(d.pos[0], d.pos[1], d.pos[2]);
    sp.scale.set(d.scale, d.scale, 1);
    nebulaGroup.add(sp);
  }

  // Centro da Via-Lactea, bem ao fundo (acompanha a paralaxe lenta do ceu distante)
  const galaxy = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGalaxyCoreTexture(512), transparent: true, opacity: 0.65,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  galaxy.position.set(4275, -540, -5625);
  galaxy.scale.set(5850, 5850, 1);

  const near = new THREE.Group();
  near.add(nearStars); near.add(nebulaGroup);
  const far = new THREE.Group();
  far.add(farStars); far.add(galaxy);

  scene.add(near); scene.add(far);
  return { near, far };
}
