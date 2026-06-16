// =============================================================================
// scene.js
// Cena Three.js, renderizador WebGL e fundo espacial (estrelas + nebulosas).
// =============================================================================

import * as THREE from 'three';
import { SETTINGS, COLORS } from './config.js';
import { createStarTexture, createNebulaTexture } from './procedural.js';

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

  const nearStars = starLayer(SETTINGS.starCountNear, 350, 700, 3.0);
  const farStars = starLayer(SETTINGS.starCountFar, 900, 1800, 5.0);

  // Nebulosas: sprites grandes, coloridos e muito sutis (identidade neon roxo/ciano/magenta).
  const nebulaGroup = new THREE.Group();
  const nebulaDefs = [
    { rgb: [120, 60, 200], pos: [-600, 200, -700], scale: 700, opacity: 0.16 },
    { rgb: [40, 160, 200], pos: [700, -150, -500], scale: 600, opacity: 0.12 },
    { rgb: [200, 50, 180], pos: [-200, -300, 750], scale: 520, opacity: 0.10 },
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

  const near = new THREE.Group();
  near.add(nearStars); near.add(nebulaGroup);
  const far = new THREE.Group();
  far.add(farStars);

  scene.add(near); scene.add(far);
  return { near, far };
}
