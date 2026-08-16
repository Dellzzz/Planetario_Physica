// =============================================================================
// objects/outros.js
// OBJETOS ILUSTRATIVOS fora do Sistema Solar + o cometa Halley.
//
// ATENCAO DIDATICA: estes objetos NAO estao em escala nem na distancia real.
// Proxima Centauri, na escala deste planetario (Terra a 95 unidades do Sol),
// deveria ficar a ~26 MILHOES de unidades -- 30 mil vezes mais longe que
// Netuno. Uma galaxia entao nem caberia. Eles sao MAQUETES colocadas logo
// depois do Cinturao de Kuiper para que o aluno possa visita-las; a ficha de
// cada um no catalogo deixa isso explicito e traz os numeros verdadeiros.
//
// O Halley e a excecao: ele orbita de verdade, com orbita bem alongada, e
// obedece a 2a lei de Kepler (acelera perto do Sol) como os demais corpos.
// =============================================================================

import * as THREE from 'three';
import { CelestialBody, createOrbitLine } from '../js/celestialBody.js';
import { createBlackHole } from './blackhole.js'; // lente gravitacional REAL (shader de tela cheia)

// Posicoes das maquetes (o controle de camera limita a 1400 do alvo)
const POS = {
  sgra:      new THREE.Vector3(-780, 150, -1050),
  andromeda: new THREE.Vector3(420, 220, -1250),
  orion:     new THREE.Vector3(-1180, -90, 420),
  proxima:   new THREE.Vector3(1150, 40, 260),
};

// -------------------------------------------------- utilidades de textura ----
function otRand(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// disco radial suave -> usado como "brilho" (sprite) de estrelas, coma e nuvens
function otGlowTexture(size, cor, dureza) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, cor);
  g.addColorStop(dureza || 0.25, cor.replace('rgb', 'rgba').replace(')', ',0.55)'));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// faixa de cores do disco de acrecao: quente por dentro, frio por fora
function otDiscoTexture(size) {
  const cv = document.createElement('canvas'); cv.width = size; cv.height = 64;
  const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, size, 0);
  g.addColorStop(0.00, 'rgba(255,255,255,0)');
  g.addColorStop(0.06, 'rgba(255,246,214,0.95)');
  g.addColorStop(0.22, 'rgba(255,196,88,1)');
  g.addColorStop(0.48, 'rgba(255,126,40,0.92)');
  g.addColorStop(0.75, 'rgba(214,60,30,0.55)');
  g.addColorStop(1.00, 'rgba(80,16,10,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, 64);
  // turbulencia: riscos claros e escuros ao longo do disco
  const rand = otRand(7);
  for (let i = 0; i < 220; i++) {
    const x = rand() * size, w = 2 + rand() * 14;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.14)';
    ctx.fillRect(x, 0, w, 64);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

// esfera invisivel usada so como area de clique (a maquete em si e feita de pontos)
function otAlvoClique(raio) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(raio, 16, 12),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.001, depthWrite: false })
  );
}

// ================================================== 1) BURACO NEGRO (Sgr A*) ==
// Aqui NAO desenhamos malhas: quem desenha o buraco negro e o blackhole.js, um
// pos-processamento de tela cheia que integra a geodesica de luz de Schwarzschild.
// Ou seja, a LENTE GRAVITACIONAL e de verdade: ele distorce a cena real (planetas,
// estrelas, a galaxia) ao redor da sombra, com disco de acrecao em rotacao
// diferencial, anel de fotons, efeito Doppler e oclusao por profundidade.
// Este grupo existe so para dar uma area clicavel e uma posicao ao corpo.
function criarBuracoNegro(scene) {
  const group = new THREE.Group();
  group.position.copy(POS.sgra);
  const alvo = otAlvoClique(150);
  group.add(alvo);
  scene.add(group);

  // ---- versao SIMPLES (malhas), usada no MODO NAVE -------------------------
  // A lente e um efeito de tela cheia que depende do buffer de profundidade.
  // Pilotando, o near da camera fica minusculo (~0.00016) e essa profundidade
  // perde precisao: o buraco negro aparecia rasgado e em varios lugares. Aqui
  // desenhamos um buraco negro comum, que nao depende de nada disso.
  const simples = new THREE.Group();
  simples.visible = false;
  const horizonte = new THREE.Mesh(new THREE.SphereGeometry(14, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0x000000 }));
  simples.add(horizonte);
  const anelFoton = new THREE.Mesh(new THREE.TorusGeometry(15.6, 0.5, 12, 120),
    new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false }));
  simples.add(anelFoton);
  const disco = new THREE.Mesh(new THREE.RingGeometry(19, 66, 200, 1),
    new THREE.MeshBasicMaterial({ map: otDiscoTexture(1024), transparent: true,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.95 }));
  const pa = disco.geometry.attributes.position, ua = disco.geometry.attributes.uv, vv = new THREE.Vector3();
  for (let i = 0; i < pa.count; i++) {
    vv.fromBufferAttribute(pa, i);
    ua.setXY(i, (vv.length() - 19) / (66 - 19), Math.atan2(vv.y, vv.x) / (Math.PI * 2) + 0.5);
  }
  ua.needsUpdate = true;
  disco.rotation.x = -Math.PI / 2; disco.rotation.z = 0.34;
  simples.add(disco);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: otGlowTexture(256, 'rgb(255,170,90)', 0.18), transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 }));
  halo.scale.setScalar(190);
  simples.add(halo);
  group.add(simples);

  const lente = createBlackHole({
    position: POS.sgra,
    rs: 14,            // raio de Schwarzschild (o "tamanho" da sombra)
    diskInner: 2.3,    // inicio do disco, em raios de Schwarzschild
    diskOuter: 9.0,    // fim do disco
    diskBright: 1.0,
    steps: 160,        // passos da integracao da luz (menos = mais leve no celular)
  });

  const body = new CelestialBody({
    id: 'sgra', name: 'Sagit\u00e1rio A*', type: 'Buraco Negro Supermassivo', color: '#ffb45e',
    group, mesh: null, selectableMeshes: [alvo], radius: 45, // raio so p/ enquadrar a camera
    orbitRadius: 0, rotationSpeed: 0, info: [], fact: '',
  });
  return { body, lente, simples, disco, anelFoton };
}

// ==================================================== 2) GALAXIA (Andromeda) ==
function criarGalaxia(scene) {
  const group = new THREE.Group();
  group.position.copy(POS.andromeda);
  group.rotation.set(-0.9, 0.4, 0.25);      // vista bem inclinada, como vemos Andromeda

  const N = 9000, R = 150, BRACOS = 2;
  const pos = new Float32Array(N * 3), cor = new Float32Array(N * 3);
  const rand = otRand(31), c = new THREE.Color();

  for (let i = 0; i < N; i++) {
    const t = Math.pow(rand(), 0.62);        // mais denso no centro
    const raio = 6 + t * R;
    const braco = Math.floor(rand() * BRACOS) * (Math.PI * 2 / BRACOS);
    const espiral = t * 3.4;                 // quanto mais longe, mais o braco se enrola
    const ruido = (rand() - 0.5) * (0.55 - t * 0.28);
    const ang = braco + espiral + ruido;
    const alt = (rand() - 0.5) * (26 * (1 - t * 0.82)); // bojo espesso, disco fino
    pos[i * 3]     = Math.cos(ang) * raio + (rand() - 0.5) * 9;
    pos[i * 3 + 1] = alt;
    pos[i * 3 + 2] = Math.sin(ang) * raio + (rand() - 0.5) * 9;
    // nucleo amarelado (estrelas velhas) -> bracos azulados (estrelas jovens)
    c.setHSL(0.10 + t * 0.50, 0.85, 0.62 - t * 0.20); // nucleo dourado -> bracos azulados
    cor[i * 3] = c.r; cor[i * 3 + 1] = c.g; cor[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(cor, 3));
  const pontos = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 3.2, vertexColors: true, transparent: true, opacity: 0.75,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  group.add(pontos);

  // bojo central brilhante
  const bojo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: otGlowTexture(256, 'rgb(255,236,190)', 0.16), transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.85,
  }));
  bojo.scale.setScalar(110);
  group.add(bojo);

  const alvo = otAlvoClique(120); group.add(alvo);
  scene.add(group);

  const body = new CelestialBody({
    id: 'andromeda', name: 'Gal\u00e1xia de Andr\u00f4meda', type: 'Gal\u00e1xia Espiral', color: '#b6cfff',
    group, mesh: null, selectableMeshes: [alvo], radius: 88, // so define o enquadramento da camera
    orbitRadius: 0, rotationSpeed: 0, info: [], fact: '',
  });
  return { body, pontos };
}

// ==================================================== 3) NEBULOSA (de Orion) ==
function criarNebulosa(scene) {
  const group = new THREE.Group();
  group.position.copy(POS.orion);

  const rand = otRand(42);
  const nuvemTex = otGlowTexture(256, 'rgb(255,150,200)', 0.30);
  const cores = [0xff8fbf, 0xc07de8, 0xff6f8f, 0x8fa8ff, 0xffb0a0];

  // nuvem: varios sprites grandes e translucidos, sobrepostos
  for (let i = 0; i < 90; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: nuvemTex, color: cores[Math.floor(rand() * cores.length)],
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      opacity: 0.05 + rand() * 0.10,
    }));
    const r = Math.pow(rand(), 0.6) * 105;
    const th = rand() * Math.PI * 2, ph = Math.acos(2 * rand() - 1);
    s.position.set(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.55, r * Math.sin(ph) * Math.sin(th));
    s.scale.setScalar(45 + rand() * 90);
    group.add(s);
  }

  // estrelas jovens nascendo dentro dela (o "bercario")
  const estrelaTex = otGlowTexture(128, 'rgb(220,235,255)', 0.12);
  for (let i = 0; i < 26; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: estrelaTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      opacity: 0.7 + rand() * 0.3,
    }));
    const r = Math.pow(rand(), 0.5) * 70;
    const th = rand() * Math.PI * 2;
    s.position.set(Math.cos(th) * r, (rand() - 0.5) * 40, Math.sin(th) * r);
    s.scale.setScalar(7 + rand() * 12);
    group.add(s);
  }

  const alvo = otAlvoClique(95); group.add(alvo);
  scene.add(group);

  const body = new CelestialBody({
    id: 'orion', name: 'Nebulosa de \u00d3rion', type: 'Nebulosa de Emiss\u00e3o', color: '#ff9ec7',
    group, mesh: null, selectableMeshes: [alvo], radius: 105,
    orbitRadius: 0, rotationSpeed: 0, info: [], fact: '',
  });
  return { body };
}

// ================================================= 4) ESTRELA (Proxima Cen.) ==
function criarProxima(scene) {
  const group = new THREE.Group();
  group.position.copy(POS.proxima);

  const estrela = new THREE.Mesh(
    new THREE.SphereGeometry(5, 40, 40),
    new THREE.MeshBasicMaterial({ color: 0xff7a52 })
  );
  group.add(estrela);

  const brilho = new THREE.Sprite(new THREE.SpriteMaterial({
    map: otGlowTexture(256, 'rgb(255,120,80)', 0.20), transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.85,
  }));
  brilho.scale.setScalar(34);
  group.add(brilho);

  // Proxima b: o exoplaneta na zona habitavel (tambem ilustrativo)
  const orbPlaneta = new THREE.Group();
  const planeta = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0x9fd8a0, roughness: 1 })
  );
  planeta.position.x = 13;
  orbPlaneta.add(planeta);
  group.add(orbPlaneta);
  group.add(createOrbitLine(13, 0x7a9c86, 0.30));

  const alvo = otAlvoClique(18); group.add(alvo);
  scene.add(group);

  const body = new CelestialBody({
    id: 'proxima', name: 'Proxima Centauri', type: 'An\u00e3 Vermelha', color: '#ff7a52',
    group, mesh: estrela, selectableMeshes: [estrela, alvo], radius: 5,
    orbitRadius: 0, rotationSpeed: 0.05, info: [], fact: '',
  });
  return { body, orbPlaneta };
}

// ======================================================= 5) COMETA HALLEY =====
// Este SIM orbita: elipse bem alongada, obedecendo a lei das areas de Kepler.
function criarHalley(scene) {
  const group = new THREE.Group();

  const nucleo = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.4, 1),
    new THREE.MeshStandardMaterial({ color: 0x6b6a68, roughness: 1, flatShading: true })
  );
  group.add(nucleo);

  // coma: envelope de gas em volta do nucleo
  const coma = new THREE.Sprite(new THREE.SpriteMaterial({
    map: otGlowTexture(256, 'rgb(170,225,255)', 0.22), transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.75,
  }));
  coma.scale.setScalar(13);
  group.add(coma);

  // cauda: aponta SEMPRE para o lado contrario ao Sol (empurrada pelo vento solar)
  const caudaGroup = new THREE.Group();
  const caudaGeo = new THREE.ConeGeometry(5.5, 62, 20, 1, true);
  caudaGeo.translate(0, -31, 0);        // ponta (apice) no nucleo, corpo indo para -Y
  caudaGeo.rotateX(-Math.PI / 2);       // gira o eixo da cauda de -Y para +Z
  const cauda = new THREE.Mesh(caudaGeo, new THREE.MeshBasicMaterial({
    color: 0x9fd8ff, transparent: true, opacity: 0.16, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  caudaGroup.add(cauda);
  group.add(caudaGroup);

  const alvo = otAlvoClique(9); group.add(alvo);
  scene.add(group);

  // orbita alongada (comprimida para caber na cena; a real vai muito alem)
  const A = 430, E = 0.86, ARG = 2.5;
  const orbita = createOrbitLine(A, 0x7fc4e8, 0.28, E, ARG);
  scene.add(orbita);

  const body = new CelestialBody({
    id: 'halley', name: 'Cometa Halley', type: 'Cometa Peri\u00f3dico', color: '#8fe3ff',
    group, mesh: nucleo, selectableMeshes: [nucleo, alvo], radius: 15, // enquadramento (o nucleo mede 1.4)
    orbitLine: orbita, orbitRadius: A, orbitSpeed: 0.055,
    eccentricity: E, argPerihelion: ARG, rotationSpeed: 0.5,
    info: [], fact: '',
  });
  return { body, caudaGroup, coma };
}

// =============================================================================
export function createOutros(scene) {
  const bn = criarBuracoNegro(scene);
  const gal = criarGalaxia(scene);
  const neb = criarNebulosa(scene);
  const prox = criarProxima(scene);
  const hal = criarHalley(scene);

  const corpos = [bn.body, gal.body, neb.body, prox.body, hal.body];
  const _v = new THREE.Vector3();

  return {
    corpos,
    blackHole: bn.lente,   // o main.js usa isto no lugar do renderer.render
    // troca entre a lente (explorando) e o buraco negro simples (pilotando)
    setBuracoNegroSimples(v) { bn.simples.visible = v; },
    // objetos que continuam vivos mesmo parados (disco girando, cauda virando)
    update(dt) {
      bn.lente.update(dt);                      // gira o disco de acrecao da LENTE
      if (bn.simples.visible) {                 // e o da versao simples, no modo nave
        bn.disco.rotation.z += dt * 0.35;
        bn.anelFoton.rotation.z -= dt * 0.12;
      }
      gal.pontos.rotation.y += dt * 0.012;      // giro lento da galaxia
      prox.orbPlaneta.rotation.y += dt * 0.6;   // Proxima b dando a volta

      // a cauda do cometa aponta para o lado OPOSTO ao Sol (origem da cena)
      hal.body.group.getWorldPosition(_v);
      if (_v.lengthSq() > 0.0001) {
        // O lookAt de um objeto comum aponta o eixo +Z PARA o alvo. Entao miramos
        // num ponto radialmente alem do cometa: a cauda fica na direcao anti-solar,
        // empurrada pelo vento solar, como acontece de verdade.
        hal.caudaGroup.lookAt(_v.x * 2, _v.y * 2, _v.z * 2);
        // quanto mais perto do Sol, maior a coma e a cauda
        const d = _v.length();
        const f = THREE.MathUtils.clamp(1 - (d - 60) / 700, 0.18, 1);
        hal.coma.scale.setScalar(6 + 16 * f);
        hal.caudaGroup.scale.setScalar(0.35 + 1.15 * f);
      }
    },
    setVisible(v) { corpos.forEach((b) => { b.group.visible = v; }); },
  };
}
