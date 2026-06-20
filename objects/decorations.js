// =============================================================================
// objects/decorations.js
// Corpos DECORATIVOS (nao selecionaveis): cinturao de asteroides entre Marte e
// Jupiter, alguns meteoroides dispersos e cometas com coma e cauda apontando
// para longe do Sol. Sao apenas ambientacao -- nao entram em "bodies".
//
// Performance: o cinturao e os meteoroides usam InstancedMesh (uma unica
// chamada de desenho para centenas de rochas). A geometria irregular base e
// reaproveitada de procedural.js.
// =============================================================================

import * as THREE from 'three';
import { createIrregularGeometry, createStarTexture } from '../js/procedural.js';

export function createDecorations(scene) {
  const updaters = [];

  // forma base das rochas (reutilizada em todas as instancias, escalada por instancia)
  const rockGeo = createIrregularGeometry(1, 1, 7, 0.4);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x9a8f80, roughness: 1.0, metalness: 0.0, flatShading: true });

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), scl = new THREE.Vector3(), eul = new THREE.Euler(), col = new THREE.Color();

  // funcao auxiliar: cria um campo de rochas instanciadas em uma faixa
  function makeRockField(count, rMin, rMax, yspread, sMin, sMax) {
    const inst = new THREE.InstancedMesh(rockGeo, rockMat, count);
    inst.frustumCulled = false;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = rMin + Math.random() * (rMax - rMin);
      const y = (Math.random() - 0.5) * yspread;
      pos.set(Math.cos(a) * r, y, Math.sin(a) * r);
      eul.set(Math.random() * 6.283, Math.random() * 6.283, Math.random() * 6.283);
      q.setFromEuler(eul);
      const s = sMin + Math.random() * (sMax - sMin);
      scl.set(s, s, s);
      m.compose(pos, q, scl);
      inst.setMatrixAt(i, m);
      // leve variacao de tom (cinza-amarronzado)
      col.setHSL(0.07 + Math.random() * 0.05, 0.22, 0.30 + Math.random() * 0.18);
      inst.setColorAt(i, col);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    return inst;
  }

  // ---- Cinturao principal de asteroides (entre Marte ~40 e Jupiter ~96) ------
  const beltGroup = new THREE.Group();
  beltGroup.add(makeRockField(900, 145, 220, 14, 0.16, 0.52));
  scene.add(beltGroup);
  updaters.push((dt) => { beltGroup.rotation.y += dt * 0.02; }); // revolucao lenta

  // ---- Meteoroides dispersos (fora do plano do cinturao) ---------------------
  const strayGroup = new THREE.Group();
  strayGroup.add(makeRockField(140, 47, 235, 88, 0.10, 0.29));
  scene.add(strayGroup);
  updaters.push((dt) => { strayGroup.rotation.y += dt * 0.008; });

  // ---- Cometas (coma + cauda apontando para longe do Sol) --------------------
  const starTex = createStarTexture(64);

  function makeComet(cfg) {
    const pivot = new THREE.Group(); // posicionado no cometa a cada quadro

    const nucleus = new THREE.Mesh(
      new THREE.SphereGeometry(cfg.size, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0xcfd6e0, roughness: 1.0, metalness: 0.0 })
    );
    pivot.add(nucleus);

    const coma = new THREE.Sprite(new THREE.SpriteMaterial({
      map: starTex, color: 0xbfe0ff, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    coma.scale.set(cfg.size * 9, cfg.size * 9, 1);
    pivot.add(coma);

    // cauda: cone aditivo, base no nucleo e apice apontando para longe do Sol
    const tailLen = cfg.size * 45;
    const tailGeo = new THREE.ConeGeometry(cfg.size * 3.2, tailLen, 14, 1, true);
    tailGeo.translate(0, tailLen / 2, 0); // base na origem, apice em +Y local
    const tail = new THREE.Mesh(tailGeo, new THREE.MeshBasicMaterial({
      color: 0x9fd8ff, transparent: true, opacity: 0.12,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    }));
    pivot.add(tail);

    scene.add(pivot);
    return { a: cfg.a, e: cfg.e, w: cfg.w, speed: cfg.speed, inc: cfg.inc, angle: Math.random() * 6.283, pivot, tail, prev: null };
  }

  const comets = [
    makeComet({ size: 0.29, a: 190, e: 0.62, w: 0.7, speed: 0.05, inc: 0.35 }),
    makeComet({ size: 0.21, a: 235, e: 0.70, w: 2.4, speed: 0.035, inc: -0.5 }),
  ];

  const up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3(), tq = new THREE.Quaternion();
  updaters.push((dt) => {
    for (const c of comets) {
      // mesma matematica de orbita elliptica (lei das areas)
      const p = c.a * (1 - c.e * c.e);
      const r = p / (1 + c.e * Math.cos(c.angle));
      const h = c.speed * c.a * c.a * Math.sqrt(1 - c.e * c.e);
      c.angle += (h / (r * r)) * dt;
      const xp = r * Math.cos(c.angle + c.w);
      const zp = r * Math.sin(c.angle + c.w);
      c.pivot.position.set(xp, zp * Math.sin(c.inc), zp * Math.cos(c.inc)); // plano inclinado
      // a cauda fica ATRAS do movimento (aponta no sentido oposto a velocidade),
      // entao o cometa parece "voar de frente" em vez de andar de lado
      if (c.prev) {
        dir.copy(c.prev).sub(c.pivot.position); // prev - atual = sentido contrario ao movimento
        if (dir.lengthSq() > 1e-8) {
          dir.normalize();
          tq.setFromUnitVectors(up, dir);
          c.tail.quaternion.copy(tq);
        }
        c.prev.copy(c.pivot.position);
      } else {
        c.prev = c.pivot.position.clone();
      }
    }
  });

  return { update: (dt) => { for (const u of updaters) u(dt); } };
}
