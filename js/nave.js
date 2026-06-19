// =============================================================================
// js/nave.js
// Modulo de Nave Espacial (modo de exploracao em primeira pessoa) para o
// Planetario Virtual. Modulo ES: importa THREE e exporta buildShip + createNaveMode.
//
// CONTROLES:
//   LADO ESQUERDO  -> direcao do nariz da nave: X gira (yaw), Y sobe/desce (pitch).
//                     A camera fica TRAVADA atras da nave e segue o nariz.
//   LADO DIREITO   -> acelerador: cima = frente, baixo = re/freio.
//
// AUTO-MONTAVEL: injeta sozinho o CSS, a HUD de voo e o botao PILOTAR.
//
// De cada item de "bodies" ele LE: b.mesh, b.radius, b.name, (b.id), b.influence?.
// Se "influence" nao existir, vira b.radius * influenceFactor; a maior estrela
// (o Sol) recebe uma zona minima para nao dominar o sistema interno.
//
// Convencoes: operadores SO ASCII (sem U+2212); acentos via \u nas strings de
// codigo e como entidades HTML na HUD (ASCII no fonte).
// =============================================================================

import * as THREE from 'three';

// Versao da HUD/estilos. Se mudar a estrutura, suba este numero: o modulo
// remove uma HUD antiga (de versoes anteriores coladas no index.html) e injeta
// a atual, evitando IDs faltando.
const NV_VERSION = '4';

// ---- CSS da HUD (injetado uma vez) -----------------------------------------
const NV_CSS = `
:root{
  --nv-cyan:#46e6ff; --nv-cyan-dim:#1d6e7e; --nv-amber:#ffb84d;
  --nv-danger:#ff5a6e; --nv-ok:#7CFFB2;
  --nv-glass:rgba(8,16,26,0.55); --nv-glass-2:rgba(8,16,26,0.78);
  --nv-line:rgba(70,230,255,0.35); --nv-line-soft:rgba(70,230,255,0.16);
}
#flight-hud{position:fixed; inset:0; z-index:40; display:none;
  padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  font-family:"Orbitron",system-ui,sans-serif; color:#dff6ff;
  -webkit-tap-highlight-color:transparent; user-select:none; -webkit-user-select:none;}
#flight-hud.active{display:block;}
#flight-hud .layer{position:absolute; inset:0; pointer-events:none;}
#zone-steer{position:absolute; top:0; left:0; width:50%; height:100%; pointer-events:auto; touch-action:none; z-index:41;}
#zone-throttle{position:absolute; top:0; right:0; width:50%; height:100%; pointer-events:auto; touch-action:none; z-index:41;}
#telemetry{position:absolute; top:calc(10px + env(safe-area-inset-top)); left:50%; transform:translateX(-50%);
  z-index:44; pointer-events:none; text-align:center; min-width:min(86vw,560px);}
#tel-name{font-weight:900; font-size:clamp(15px,4.6vw,22px); letter-spacing:0.16em; color:#eafcff; text-shadow:0 0 14px rgba(70,230,255,0.55);}
#tel-state{font-size:10px; letter-spacing:0.34em; color:var(--nv-cyan); opacity:0.85; margin-top:2px;}
#tel-bars{display:flex; gap:10px; justify-content:center; margin-top:8px; font-family:"Share Tech Mono",monospace;}
.tel-cell{background:var(--nv-glass); border:1px solid var(--nv-line-soft); border-radius:8px; padding:5px 11px;
  backdrop-filter:blur(7px); -webkit-backdrop-filter:blur(7px); box-shadow:0 0 0 1px rgba(0,0,0,0.25) inset;}
.tel-cell b{display:block; font-size:8px; letter-spacing:0.22em; color:var(--nv-cyan-dim); font-family:"Orbitron"; font-weight:700;}
.tel-cell span{font-size:clamp(13px,3.6vw,16px); color:#cdeefb;}
.tel-cell span small{font-size:0.62em; color:#6da6b8; margin-left:2px;}
#btn-back{position:absolute; top:calc(10px + env(safe-area-inset-top)); left:calc(12px + env(safe-area-inset-left));
  z-index:46; pointer-events:auto; border:1px solid var(--nv-line); background:var(--nv-glass-2); color:#bfeaff;
  font-family:"Orbitron"; font-weight:700; font-size:11px; letter-spacing:0.12em; padding:9px 12px; border-radius:10px;
  display:flex; align-items:center; gap:7px; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); cursor:pointer;}
#btn-back:active{transform:scale(0.96); border-color:var(--nv-cyan);}
#btn-back .ar{font-size:14px; line-height:1;}
.nv-stick{position:absolute; width:132px; height:132px; left:0; top:0; margin-left:-66px; margin-top:-66px;
  z-index:43; pointer-events:none; opacity:0; transition:opacity .18s ease;}
.nv-stick.show{opacity:1;}
.nv-ring{position:absolute; inset:0; border-radius:50%; border:1.5px solid var(--nv-line);
  background:radial-gradient(circle at 50% 42%, rgba(70,230,255,0.10), rgba(6,14,22,0.55));
  box-shadow:0 0 22px rgba(70,230,255,0.18), 0 0 0 1px rgba(0,0,0,0.4) inset;}
.nv-ring::before{content:""; position:absolute; inset:50% 12% auto 12%; height:1px; background:var(--nv-line-soft);}
.nv-ring::after{content:""; position:absolute; inset:12% 50% 12% auto; width:1px; background:var(--nv-line-soft);}
.nv-knob{position:absolute; width:58px; height:58px; left:50%; top:50%; margin-left:-29px; margin-top:-29px; border-radius:50%;
  background:radial-gradient(circle at 42% 36%, #7ff0ff, #1aa6c2 60%, #0c5366);
  box-shadow:0 0 18px rgba(70,230,255,0.6), 0 4px 12px rgba(0,0,0,0.5); border:1px solid rgba(190,250,255,0.7);}
.nv-knob::after{content:""; position:absolute; inset:34% 0 auto 0; height:8%; background:rgba(4,10,16,0.5); border-radius:50%; filter:blur(0.5px);}
.nv-stick.thr .nv-ring{border-color:rgba(255,184,77,0.4); background:radial-gradient(circle at 50% 42%, rgba(255,184,77,0.10), rgba(20,14,6,0.55));}
.nv-stick.thr .nv-ring::after{background:rgba(255,184,77,0.22);}
.nv-stick.thr .nv-knob{background:radial-gradient(circle at 42% 36%, #ffe6bf, #f0a64d 60%, #9a5e1e);}
.nv-hint{position:absolute; z-index:42; pointer-events:none; bottom:calc(96px + env(safe-area-inset-bottom));
  width:128px; font-size:9px; letter-spacing:0.16em; line-height:1.6; opacity:.65;}
#steer-hint{left:calc(20px + env(safe-area-inset-left)); color:var(--nv-cyan-dim);}
#thr-hint{right:calc(20px + env(safe-area-inset-right)); color:#9a6a2e; text-align:right;}
#pad{position:absolute; right:calc(14px + env(safe-area-inset-right)); bottom:calc(18px + env(safe-area-inset-bottom));
  z-index:45; pointer-events:none; display:flex; flex-direction:column; gap:11px; align-items:flex-end;}
.pbtn{pointer-events:auto; min-width:120px; height:48px; padding:0 14px; border-radius:13px; display:flex; align-items:center;
  justify-content:center; gap:8px; font-family:"Orbitron"; font-weight:700; font-size:12px; letter-spacing:0.08em; color:#d7f3ff;
  background:var(--nv-glass-2); border:1px solid var(--nv-line); backdrop-filter:blur(9px); -webkit-backdrop-filter:blur(9px);
  box-shadow:0 6px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.25) inset; cursor:pointer;
  transition:transform .08s ease, border-color .15s ease, background .15s ease, opacity .15s ease;}
.pbtn .ic{font-size:16px; line-height:1;}
.pbtn:active{transform:scale(0.95);}
.pbtn[disabled]{opacity:0.32; filter:saturate(0.4); pointer-events:none;}
.pbtn.small{min-width:48px; width:48px; padding:0;}
.pbtn.warp.on{border-color:var(--nv-amber); color:#ffe6bf; background:rgba(60,38,8,0.7); box-shadow:0 0 22px rgba(255,184,77,0.4), 0 6px 16px rgba(0,0,0,0.4);}
.pbtn.brake.on{border-color:var(--nv-danger); color:#ffd2d8; background:rgba(60,12,18,0.7);}
.pbtn.orbit.go{border-color:var(--nv-ok); color:#dcffe9; background:rgba(14,52,32,0.7); box-shadow:0 0 22px rgba(124,255,178,0.35), 0 6px 16px rgba(0,0,0,0.4);}
.pbtn.orbit.exit{border-color:var(--nv-amber);}
#pad-row{display:flex; gap:11px;}
#warp-fx{position:fixed; inset:0; z-index:39; pointer-events:none; opacity:0; transition:opacity .25s ease; mix-blend-mode:screen;
  background:
    radial-gradient(60% 60% at 50% 50%, transparent 30%, rgba(120,200,255,0.10) 70%, transparent 72%),
    repeating-conic-gradient(from 0deg at 50% 50%, rgba(150,220,255,0.0) 0deg 3deg, rgba(150,220,255,0.10) 3.4deg 4deg);
  animation:nv-warpspin 1.2s linear infinite;}
#warp-fx.on{opacity:0.9;}
@keyframes nv-warpspin{to{transform:rotate(360deg);}}
#btn-fly{position:fixed; left:50%; bottom:calc(26px + env(safe-area-inset-bottom)); transform:translateX(-50%);
  z-index:38; pointer-events:auto; font-family:"Orbitron",system-ui,sans-serif; font-weight:900; letter-spacing:0.14em; font-size:14px;
  color:#04121a; padding:15px 28px; border-radius:16px; border:none; cursor:pointer;
  background:linear-gradient(135deg,#7ff0ff,#46e6ff 55%,#1ea7c4); box-shadow:0 0 30px rgba(70,230,255,0.5), 0 8px 20px rgba(0,0,0,0.45);
  display:flex; align-items:center; gap:10px;}
#btn-fly:active{transform:translateX(-50%) scale(0.96);}
#btn-fly.nv-hidden{display:none;}
`;

// ---- HUD (injetada uma vez; acentos como entidades HTML, ASCII no fonte) ----
const NV_HUD_HTML = `
<div id="warp-fx"></div>
<div id="flight-hud">
  <div id="zone-steer"></div>
  <div id="zone-throttle"></div>
  <button id="btn-back"><span class="ar">&#9666;</span> SISTEMA</button>
  <div id="telemetry">
    <div id="tel-name">&mdash;</div>
    <div id="tel-state">LIVRE</div>
    <div id="tel-bars">
      <div class="tel-cell"><b>DIST&Acirc;NCIA</b><span id="tel-dist">0<small>u</small></span></div>
      <div class="tel-cell"><b>VELOCIDADE</b><span id="tel-spd">0<small>u/s</small></span></div>
      <div class="tel-cell" id="tel-cell-alt" style="display:none"><b>ALTITUDE</b><span id="tel-alt">0<small>r</small></span></div>
    </div>
  </div>
  <div id="steer-hint" class="nv-hint">&#9664;&#9654; girar<br>&#9650;&#9660; subir / descer<br>(nariz da nave)</div>
  <div id="thr-hint" class="nv-hint">&#9650; acelerar<br>&#9660; r&eacute; / freio</div>
  <div id="joy-steer" class="nv-stick"><div class="nv-ring"></div><div class="nv-knob"></div></div>
  <div id="joy-thr" class="nv-stick thr"><div class="nv-ring"></div><div class="nv-knob"></div></div>
  <div id="pad">
    <button class="pbtn orbit" id="btn-orbit"><span class="ic">&#128752;</span><span id="orbit-label">Entrar em &oacute;rbita</span></button>
    <div id="pad-row">
      <button class="pbtn warp" id="btn-warp"><span class="ic">&#9889;</span>Hiper</button>
      <button class="pbtn brake small" id="btn-brake" title="Freio"><span class="ic">&#9995;</span></button>
    </div>
  </div>
</div>
`;

function nv_injectStyles(){
  const cur = document.getElementById('nv-styles');
  if (cur && cur.dataset.v === NV_VERSION) return;
  if (cur) cur.remove();   // estilos de versao antiga -> troca
  const s = document.createElement('style');
  s.id = 'nv-styles';
  s.dataset.v = NV_VERSION;
  s.textContent = NV_CSS;
  document.head.appendChild(s);
}
function nv_ensureHud(){
  const cur = document.getElementById('flight-hud');
  // ja existe a HUD desta versao (e com os elementos novos)? nada a fazer.
  if (cur && cur.dataset.v === NV_VERSION && document.getElementById('joy-steer')) return;
  // remove qualquer HUD antiga/incompleta para nao herdar IDs ultrapassados
  if (cur) cur.remove();
  const oldWarp = document.getElementById('warp-fx');
  if (oldWarp) oldWarp.remove();
  const wrap = document.createElement('div');
  wrap.innerHTML = NV_HUD_HTML;
  while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
  const hud = document.getElementById('flight-hud');
  if (hud) hud.dataset.v = NV_VERSION;
}
function nv_ensureFlyButton(onFly){
  let b = document.getElementById('btn-fly');
  if (b && b.dataset.v !== NV_VERSION){ b.remove(); b = null; } // botao antigo -> recria limpo
  if (!b){
    b = document.createElement('button');
    b.id = 'btn-fly';
    b.dataset.v = NV_VERSION;
    b.innerHTML = '&#128640; PILOTAR NAVE';
    document.body.appendChild(b);
  }
  b.addEventListener('pointerdown', (e)=>{ e.preventDefault(); onFly(); }, { passive:false });
  return b;
}
function nv_defaultDom(){
  const g = (id)=> document.getElementById(id);
  return {
    flightHud: g('flight-hud'), sys: g('sys'), warpFx: g('warp-fx'),
    zoneSteer: g('zone-steer'), zoneThrottle: g('zone-throttle'),
    steerBase: g('joy-steer'), thrBase: g('joy-thr'),
    btnBrake: g('btn-brake'), btnWarp: g('btn-warp'),
    btnOrbit: g('btn-orbit'), btnBack: g('btn-back'), orbitLabel: g('orbit-label'),
    telName: g('tel-name'), telState: g('tel-state'), telDist: g('tel-dist'),
    telSpd: g('tel-spd'), telAlt: g('tel-alt'), telCellAlt: g('tel-cell-alt')
  };
}

// ---------------------------------------------------------------------------
// Modelo 3D da nave. earthRadius define a escala (nave = 1% do diametro da Terra).
// ---------------------------------------------------------------------------
export function buildShip(earthRadius){
  const ER = (earthRadius && earthRadius > 0) ? earthRadius : 1.0;
  const g = new THREE.Group();
  const s = ER * 0.002;           // raio fisico da nave (0.2% do raio da Terra)
  const k = s / 0.01;             // escala do modelo visual

  const hull = new THREE.Mesh(
    new THREE.ConeGeometry(0.006 * k, 0.022 * k, 16),
    new THREE.MeshStandardMaterial({ color:0xcfe9ff, roughness:0.4, metalness:0.6, emissive:0x0a1622, emissiveIntensity:0.5 })
  );
  hull.rotation.x = Math.PI / 2;
  g.add(hull);

  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(0.018 * k, 0.0012 * k, 0.006 * k),
    new THREE.MeshStandardMaterial({ color:0x6fb3ff, roughness:0.5, metalness:0.4, emissive:0x112233, emissiveIntensity:0.4 })
  );
  wing.position.z = -0.002 * k;
  g.add(wing);

  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(0.0034 * k, 12, 10),
    new THREE.MeshStandardMaterial({ color:0x9fe9ff, emissive:0x2ad4ff, emissiveIntensity:1.1, roughness:0.2, metalness:0.1 })
  );
  cockpit.position.z = 0.004 * k;
  g.add(cockpit);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.005 * k, 12, 10),
    new THREE.MeshBasicMaterial({ color:0x6fd2ff, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending })
  );
  glow.position.z = -0.012 * k;
  g.add(glow);

  const trail = new THREE.Mesh(
    new THREE.ConeGeometry(0.004 * k, 1, 10, 1, true),
    new THREE.MeshBasicMaterial({ color:0x46e6ff, transparent:true, opacity:0.0, blending:THREE.AdditiveBlending, side:THREE.DoubleSide })
  );
  trail.rotation.x = -Math.PI / 2;
  g.add(trail);

  g.visible = false;
  return { group:g, radius:s, glow, trail, cockpit };
}

// ---------------------------------------------------------------------------
// Controlador da nave.
// ctx = { camera, controls, bodies, ship,
//         spawnBody?, overviewUI?, onExit?, flyButton?, dom?, options? }
//   options : { influenceFactor (planetas, padrao 7),
//               starInfluenceFactor (estrela/Sol, padrao 0 = sem gravidade),
//               speedScale (padrao 1) }
// Metodos: enter(spawnBody?), exit(), update(dt), get active(), get target()
// ---------------------------------------------------------------------------
export function createNaveMode(ctx){
  nv_injectStyles();
  nv_ensureHud();

  const camera   = ctx.camera;
  const controls = ctx.controls;
  const bodies   = ctx.bodies;
  const ship     = ctx.ship;
  const onExit   = ctx.onExit || null;
  const dom      = ctx.dom || nv_defaultDom();
  if (ctx.overviewUI) dom.sys = ctx.overviewUI;
  const opt = Object.assign({ influenceFactor: 7, starInfluenceFactor: 0, speedScale: 1 }, ctx.options || {});

  const clamp = THREE.MathUtils.clamp;
  const lerp  = THREE.MathUtils.lerp;
  const UP = new THREE.Vector3(0, 1, 0);
  const U  = ship.radius / 0.01;   // unidade de escala da nave (raio Terra * fator da nave)
  const S  = opt.speedScale;       // multiplicador global de velocidade

  function approach(a, b, step){ if (a < b){ a += step; if (a > b) a = b; } else { a -= step; if (a < b) a = b; } return a; }
  function fmt(n, d){ return n.toFixed(d === undefined ? 1 : d); }

  // ---- parametros (distancias/velocidades escalam por U; angulos nao) ----
  const P = {
    maxSpeed: 9 * U * S,
    reverse: 0.4,
    accel: 7 * U * S,
    idleDecel: 2.6 * U * S,
    brakeDecel: 22 * U * S,
    warpAccel: 110 * U * S,  // compensado (5x) p/ o hyper manter a velocidade de antes
    warpMult: 35,            // 7 * 5: nave 5x menor, mas hyper continua no ritmo original
    yawRate: 1.6,         // rad/s ao girar (lado esquerdo, X)
    yawSign: -1,          // INVERTER para 1 se o giro ficar trocado
    pitchRate: 1.3,       // rad/s ao subir/descer (lado esquerdo, Y)
    pitchSign: 1,         // INVERTER para -1 se subir/descer ficar trocado
    pitchMax: 1.45,       // limite de inclinacao (~83 graus)
    steerLerp: 3.4,       // suavidade com que a velocidade segue o nariz
    skin: 0.04 * U,
    gravMinFactor: 0.18,
    camDist: 0.055 * U,   // distancia da camera atras da nave
    camHeight: 0.014 * U, // elevacao da camera acima da nave
    camLook: 0.014 * U,   // ponto de mira a frente da nave
    camLerp: 6,
    fov: 60, fovWarp: 90,
    altRate: 6 * U * S,
    omegaRate: 0.9,
    omegaMax: 1.6
  };

  // ---- estado ----
  let active = false;
  let mode = 'free';
  let warp = false;
  let braking = false;
  let yaw = 0, pitch = 0;
  let speed = 0;
  const pos = new THREE.Vector3();
  const velDir = new THREE.Vector3(0, 0, 1);
  const fwd = new THREE.Vector3(0, 0, 1);
  const shipUp = new THREE.Vector3(0, 1, 0);

  let target = null;
  let domBody = null;
  let proximity = 0;

  let orbBody = null, orbRadius = 0, orbAngle = 0, orbOmega = 0.5;
  const orbR0 = new THREE.Vector3(), orbT0 = new THREE.Vector3(), orbN = new THREE.Vector3();

  let savedNear = 0.1, savedFov = 60;
  const savedCamPos = new THREE.Vector3(), savedTarget = new THREE.Vector3();

  // lado esquerdo (direcao) e lado direito (acelerador)
  const steer = { x:0, y:0, active:false };
  const throttle = { x:0, y:0, active:false };

  let samples = [];
  function buildSamples(){
    let maxR = 0;
    for (const b of bodies){ if (b.radius > maxR) maxR = b.radius; }
    samples = bodies.map(function(b){
      // A zona de gravidade e SEMPRE calculada pelo raio aqui (ignora qualquer
      // "influence" que o CelestialBody possa ter), para o Sol nunca dominar.
      const isStar = (maxR > 0 && b.radius >= maxR * 0.9) || /sol|sun|star|estrela/i.test(b.id || b.name || '');
      const factor = isStar ? opt.starInfluenceFactor : opt.influenceFactor;
      const inf = b.radius * factor; // estrela: factor 0 (padrao) -> sem poco gravitacional, so colisao
      return {
        body: b,
        group: (b.group || null),   // grupo de orbita (posicionado): leitura preferida
        mesh: (b.mesh || null),     // reserva, caso o grupo nao esteja posicionado
        wp: new THREE.Vector3(),
        radius: b.radius, name: b.name, influence: inf,
        orbitRadius: (typeof b.orbitRadius === 'number' ? b.orbitRadius : 0)
      };
    });
  }
  function refreshSamples(){
    for (const sm of samples){
      let got = false;
      if (sm.group && sm.group.getWorldPosition){
        sm.group.getWorldPosition(sm.wp);
        // aceita a leitura do grupo se nao for a origem (ou se nao houver mesh alternativo)
        if (sm.wp.lengthSq() > 1e-8 || !sm.mesh) got = true;
      }
      if (!got && sm.mesh && sm.mesh.getWorldPosition){
        sm.mesh.getWorldPosition(sm.wp);
      }
    }
  }

  const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
  const _v4 = new THREE.Vector3(), _v5 = new THREE.Vector3();
  const _right = new THREE.Vector3();
  const _m = new THREE.Matrix4();

  function warpFx(on){ if (dom.warpFx) dom.warpFx.classList.toggle('on', on); }

  // ---------- entrada de toque: dois analogicos flutuantes ----------
  function bindInput(){
    function makeStick(zoneEl, baseEl, out){
      const noop = { has: ()=> false, move: ()=>{}, end: ()=>{} };
      if (!zoneEl || !baseEl) return noop;
      const knob = baseEl.querySelector('.nv-knob');
      if (!knob) return noop;
      let id = null;
      function place(x, y, reset){
        const m = 80;
        const cx = clamp(x, m, window.innerWidth - m);
        const cy = clamp(y, m, window.innerHeight - m);
        baseEl.style.left = cx + 'px'; baseEl.style.top = cy + 'px';
        baseEl.dataset.cx = cx; baseEl.dataset.cy = cy;
        baseEl.classList.add('show');
        if (reset) knob.style.transform = 'translate(0px,0px)';
      }
      function move(x, y){
        const cx = +baseEl.dataset.cx, cy = +baseEl.dataset.cy;
        let dx = x - cx, dy = y - cy;
        const R = 58, mag = Math.hypot(dx, dy);
        if (mag > R){ dx = dx / mag * R; dy = dy / mag * R; }
        knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        out.x = clamp(dx / R, -1, 1);
        out.y = clamp(-dy / R, -1, 1);
      }
      function end(){ id = null; out.active = false; out.x = 0; out.y = 0;
        knob.style.transform = 'translate(0px,0px)'; baseEl.classList.remove('show'); }
      zoneEl.addEventListener('pointerdown', (e)=>{
        e.preventDefault();
        if (id !== null) return;
        id = e.pointerId; out.active = true;
        place(e.clientX, e.clientY, true); move(e.clientX, e.clientY);
      }, { passive:false });
      return { has:(pid)=> pid === id, move, end };
    }

    const sSteer = makeStick(dom.zoneSteer, dom.steerBase, steer);
    const sThr   = makeStick(dom.zoneThrottle, dom.thrBase, throttle);
    window.addEventListener('pointermove', (e)=>{
      if (sSteer.has(e.pointerId)) sSteer.move(e.clientX, e.clientY);
      if (sThr.has(e.pointerId))   sThr.move(e.clientX, e.clientY);
    }, { passive:false });
    window.addEventListener('pointerup', (e)=>{ if (sSteer.has(e.pointerId)) sSteer.end(); if (sThr.has(e.pointerId)) sThr.end(); });
    window.addEventListener('pointercancel', (e)=>{ if (sSteer.has(e.pointerId)) sSteer.end(); if (sThr.has(e.pointerId)) sThr.end(); });
  }

  // ---------- botoes ----------
  function bindButtons(){
    const hold = (el, on, off)=>{
      el.addEventListener('pointerdown', (e)=>{ e.preventDefault(); e.stopPropagation(); on(); }, { passive:false });
      el.addEventListener('pointerup',   (e)=>{ e.stopPropagation(); off(); });
      el.addEventListener('pointerleave',(e)=>{ off(); });
      el.addEventListener('pointercancel',()=> off());
    };
    const tap = (el, fn)=> el.addEventListener('pointerdown', (e)=>{ e.preventDefault(); e.stopPropagation(); fn(); }, { passive:false });

    hold(dom.btnBrake, ()=>{ braking = true; dom.btnBrake.classList.add('on'); },
                       ()=>{ braking = false; dom.btnBrake.classList.remove('on'); });
    tap(dom.btnWarp, ()=> toggleWarp());
    tap(dom.btnOrbit, ()=>{ mode === 'orbit' ? exitOrbit() : enterOrbit(); });
    tap(dom.btnBack, ()=> exit());
  }

  function toggleWarp(){
    if (mode === 'orbit') return;
    if (proximity > 0.02){ warp = false; return; }
    warp = !warp;
    dom.btnWarp.classList.toggle('on', warp);
    warpFx(warp);
  }

  // monta a orientacao 3D a partir de yaw + pitch (sem gimbal: o "direita"
  // horizontal depende so do yaw). Atualiza fwd, shipUp e _right.
  function buildOrientation(bank){
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    fwd.set(sy * cp, sp, cy * cp).normalize();
    _right.set(cy, 0, -sy).normalize();            // direita horizontal (depende so do yaw)
    shipUp.crossVectors(fwd, _right).normalize();   // cima da nave (ordem correta -> rotacao pura)
    _m.makeBasis(_right, shipUp, fwd);              // x=direita, y=cima, z=frente
    ship.group.quaternion.setFromRotationMatrix(_m);
    if (bank) ship.group.rotateZ(bank);
  }

  function orientShip(f, up, bank){
    const z = _v1.copy(f).normalize();
    const x = _v2.crossVectors(up, z);
    if (x.lengthSq() < 1e-8) x.crossVectors(new THREE.Vector3(1,0,0), z);
    x.normalize();
    const y = _v3.crossVectors(z, x).normalize();
    _m.makeBasis(x, y, z);
    ship.group.quaternion.setFromRotationMatrix(_m);
    if (bank) ship.group.rotateZ(bank);
  }

  function scanGravity(){
    domBody = null; proximity = 0; target = null;
    let bestPen = Infinity, nearest = null, nearDist = Infinity, domDist = 0;
    for (const sm of samples){
      const d = pos.distanceTo(sm.wp);
      if (d < nearDist){ nearDist = d; nearest = sm; }
      if (sm.influence > 0 && d < sm.influence){
        const pen = d / sm.influence;
        if (pen < bestPen){ bestPen = pen; domBody = sm; domDist = d; }
      }
    }
    if (domBody){
      const capture = domBody.radius * 1.6;
      proximity = clamp((domBody.influence - domDist) / Math.max(0.0001, (domBody.influence - capture)), 0, 1);
      if (proximity > 0.02 && warp){ warp = false; dom.btnWarp.classList.remove('on'); warpFx(false); }
    }
    target = domBody || nearest;
    return domBody ? lerp(1, P.gravMinFactor, proximity) : 1;
  }

  // Colisao por ponto: so empurra a nave para FORA quando a NOVA posicao esta
  // DENTRO da esfera do corpo. Nunca puxa um ponto distante (evita teleporte).
  function resolveCollisions(B){
    for (const sm of samples){
      const C = sm.wp;
      const R = sm.radius + ship.radius + P.skin;
      _v4.copy(B).sub(C);
      const d = _v4.length();
      if (d < R){
        if (d > 1e-6) _v4.divideScalar(d); else _v4.copy(UP);
        B.copy(C).addScaledVector(_v4, R);   // sobe ate a superficie
        _v5.copy(velDir).multiplyScalar(speed);
        const into = _v5.dot(_v4);
        if (into < 0){                        // cancela a componente que entra no corpo
          _v5.addScaledVector(_v4, -into);
          const m = _v5.length();
          speed = m * 0.5;
          if (m > 1e-5) velDir.copy(_v5).divideScalar(m);
        }
      }
    }
  }

  function enterOrbit(){
    if (mode === 'orbit' || !domBody) return;
    orbBody = domBody;
    const C = orbBody.wp;
    orbRadius = clamp(pos.distanceTo(C), orbBody.radius * 1.8, orbBody.influence * 0.92);
    orbR0.copy(pos).sub(C).normalize();
    _v1.copy(velDir);
    orbN.crossVectors(orbR0, _v1);
    if (orbN.lengthSq() < 1e-5) orbN.crossVectors(orbR0, UP);
    if (orbN.lengthSq() < 1e-5) orbN.crossVectors(orbR0, new THREE.Vector3(1,0,0));
    orbN.normalize();
    orbT0.crossVectors(orbN, orbR0).normalize();
    orbAngle = 0;
    const tang = _v2.copy(velDir).multiplyScalar(speed).dot(orbT0);
    orbOmega = clamp(tang / Math.max(0.5 * U, orbRadius), -1.2, 1.2);
    if (Math.abs(orbOmega) < 0.18) orbOmega = 0.45;
    mode = 'orbit'; warp = false;
    dom.btnWarp.classList.remove('on'); warpFx(false);
    updateButtons();
  }
  function exitOrbit(){
    if (mode !== 'orbit') return;
    mode = 'free';
    orbBody = null;
    // retoma o voo livre alinhado com a tangente atual
    yaw = Math.atan2(velDir.x, velDir.z);
    pitch = clamp(Math.asin(clamp(velDir.y, -1, 1)), -P.pitchMax, P.pitchMax);
    updateButtons();
  }

  function updateOrbit(dt){
    const C = orbBody.wp;
    // lado esquerdo: Y = altitude, X = velocidade/sentido orbital
    orbRadius = clamp(orbRadius + steer.y * P.altRate * dt, orbBody.radius * 1.8, orbBody.influence * 0.95);
    orbOmega = clamp(orbOmega + steer.x * P.omegaRate * dt, -P.omegaMax, P.omegaMax);
    orbAngle += orbOmega * dt;

    const c = Math.cos(orbAngle), s = Math.sin(orbAngle);
    pos.copy(C).addScaledVector(orbR0, c * orbRadius).addScaledVector(orbT0, s * orbRadius);

    _v1.copy(orbR0).multiplyScalar(-s).addScaledVector(orbT0, c);
    _v1.multiplyScalar(orbOmega >= 0 ? 1 : -1).normalize();
    velDir.copy(_v1);
    speed = Math.abs(orbOmega) * orbRadius;

    fwd.copy(_v1);
    shipUp.copy(orbN);
    orientShip(_v1, orbN, 0);
    ship.group.position.copy(pos);
  }

  function updateFree(dt, speedFactor){
    // lado esquerdo: X gira (yaw), Y sobe/desce (pitch)
    yaw   += P.yawSign   * steer.x * P.yawRate   * dt;
    pitch += P.pitchSign * steer.y * P.pitchRate * dt;
    pitch = clamp(pitch, -P.pitchMax, P.pitchMax);

    const bank = -steer.x * 0.4;
    buildOrientation(bank);   // atualiza fwd, shipUp, _right e orienta a nave

    // lado direito: Y = acelerador (cima=frente, baixo=re)
    const thr = throttle.y;
    const maxV = P.maxSpeed * (warp ? P.warpMult : 1) * speedFactor;
    const aMax = warp ? P.warpAccel : P.accel;

    let targetSpeed;
    if (braking) targetSpeed = 0;
    else if (thr >= 0) targetSpeed = thr * maxV;
    else targetSpeed = thr * P.maxSpeed * P.reverse;

    let rate;
    if (braking) rate = P.brakeDecel;
    else if (Math.abs(targetSpeed) > Math.abs(speed)) rate = aMax;
    else rate = P.idleDecel;
    speed = approach(speed, targetSpeed, rate * dt);
    speed = clamp(speed, -P.maxSpeed * P.reverse, maxV);

    velDir.lerp(fwd, clamp(P.steerLerp * dt, 0, 1));
    if (velDir.lengthSq() < 1e-9) velDir.copy(fwd);
    velDir.normalize();

    pos.addScaledVector(velDir, speed * dt);
    resolveCollisions(pos);

    buildOrientation(bank);   // reorienta apos colisao (fwd/shipUp continuam validos)
    ship.group.position.copy(pos);
  }

  // camera TRAVADA atras da nave, seguindo o nariz (sem controle solto)
  function updateCamera(dt){
    const dist = P.camDist * (warp ? 1.5 : 1);
    _v1.copy(fwd).multiplyScalar(-1);                          // direcao "atras"
    _v3.copy(pos).addScaledVector(_v1, dist).addScaledVector(shipUp, P.camHeight);
    camera.position.lerp(_v3, clamp(P.camLerp * dt, 0, 1));

    _v4.copy(pos).addScaledVector(fwd, P.camLook);
    camera.lookAt(_v4);

    const targetFov = warp ? P.fovWarp : P.fov;
    if (Math.abs(camera.fov - targetFov) > 0.1){
      camera.fov = approach(camera.fov, targetFov, 60 * dt);
      camera.updateProjectionMatrix();
    }
  }

  function updateShipFx(){
    const sp = Math.abs(speed);
    const f = clamp(sp / P.maxSpeed, 0, 1.4);
    const len = (0.02 + f * (warp ? 0.5 : 0.16)) * U;
    ship.trail.scale.set(1, len, 1);
    ship.trail.position.z = -0.012 * U - len * 0.5;
    ship.trail.material.opacity = clamp(f * 0.8, 0, 0.85);
    ship.glow.material.opacity = 0.5 + clamp(f, 0, 1) * 0.5;
    ship.glow.material.color.setHex(warp ? 0xffd28a : 0x6fd2ff);
    ship.trail.material.color.setHex(warp ? 0xffb14d : 0x46e6ff);
  }

  function updateButtons(){
    const orbitable = (mode === 'free' && domBody);
    dom.btnOrbit.disabled = !(orbitable || mode === 'orbit');
    dom.btnOrbit.classList.toggle('go', !!orbitable);
    dom.btnOrbit.classList.toggle('exit', mode === 'orbit');
    if (dom.orbitLabel) dom.orbitLabel.textContent = (mode === 'orbit') ? 'Sair de \u00F3rbita' : 'Entrar em \u00F3rbita';
    dom.btnWarp.disabled = (mode === 'orbit') || (proximity > 0.02);
    dom.btnBrake.style.display = (mode === 'orbit') ? 'none' : '';
    if (dom.telCellAlt) dom.telCellAlt.style.display = (mode === 'orbit') ? '' : 'none';
  }

  function updateHud(){
    if (!target) return;
    dom.telName.textContent = target.name;
    const dist = pos.distanceTo(target.wp);
    dom.telDist.innerHTML = fmt(dist, 1) + '<small>u</small>';
    dom.telSpd.innerHTML = fmt(Math.abs(speed), 1) + '<small>u/s</small>';

    let state = 'LIVRE';
    if (mode === 'orbit') state = 'EM \u00D3RBITA';
    else if (proximity > 0.4) state = 'APROXIMANDO';
    else if (warp) state = 'HIPERVELOCIDADE';
    dom.telState.textContent = state;

    if (mode === 'orbit' && orbBody){
      const alt = (orbRadius / orbBody.radius);
      dom.telAlt.innerHTML = fmt(alt, 2) + '<small>r</small>';
    }
  }

  function resolveSpawn(){
    return ctx.spawnBody
        || bodies.find(b => b && b.id === 'terra')
        || bodies.find(b => b && /terra/i.test(b.name || ''))
        || bodies[0];
  }

  // ---------- ciclo de vida ----------
  function enter(spawnBody){
    spawnBody = spawnBody || resolveSpawn();
    active = true;
    mode = 'free'; warp = false; braking = false; speed = 0; pitch = 0;
    steer.x = steer.y = 0; throttle.x = throttle.y = 0;

    buildSamples();
    refreshSamples();

    let sp = null;
    for (const sm of samples){ if (sm.body === spawnBody){ sp = sm; break; } }
    if (!sp) sp = samples[0];

    const C = _v1.copy(sp.wp);
    // Fallback: se a leitura de posicao vier proxima da origem (onde fica a
    // estrela) mas o corpo tem raio de orbita, usa o raio de orbita para a nave
    // NAO nascer dentro do Sol.
    if (sp.orbitRadius > 0 && C.length() < sp.orbitRadius * 0.5){
      C.set(sp.orbitRadius, 0, 0);
    }
    _v2.copy(C);
    if (_v2.lengthSq() < 1e-6) _v2.set(0, 0, 1);
    _v2.y = 0;
    if (_v2.lengthSq() < 1e-9) _v2.set(0, 0, 1);
    _v2.normalize();
    const spawnInf = (sp.influence > 0) ? sp.influence : sp.radius * opt.influenceFactor;
    const d = spawnInf * 1.15;
    pos.copy(C).addScaledVector(_v2, d);
    pos.y = 0;

    // Seguranca: nunca nascer DENTRO de um corpo (empurra para fora se preciso).
    for (const sm of samples){
      const dd = pos.distanceTo(sm.wp);
      const minD = sm.radius + ship.radius + P.skin * 6;
      if (dd < minD){
        _v4.copy(pos).sub(sm.wp);
        if (_v4.lengthSq() < 1e-9) _v4.copy(_v2);
        _v4.normalize();
        pos.copy(sm.wp).addScaledVector(_v4, minD * 1.25);
        pos.y = 0;
      }
    }

    _v3.copy(C).sub(pos); _v3.y = 0;
    if (_v3.lengthSq() < 1e-9) _v3.set(0, 0, 1);
    _v3.normalize();
    yaw = Math.atan2(_v3.x, _v3.z);
    buildOrientation(0);          // define fwd, shipUp e orienta a nave
    velDir.copy(fwd);

    ship.group.position.copy(pos);
    ship.group.visible = true;

    savedNear = camera.near; savedFov = camera.fov;
    savedCamPos.copy(camera.position);
    savedTarget.copy(controls.target);

    controls.enabled = false;
    camera.near = Math.min(savedNear, 0.02 * U); camera.fov = P.fov; camera.updateProjectionMatrix();
    camera.position.copy(pos).addScaledVector(fwd, -P.camDist).addScaledVector(shipUp, P.camHeight);
    camera.lookAt(pos);

    dom.flightHud.classList.add('active');
    if (dom.sys) dom.sys.style.display = 'none';
    if (flyBtn) flyBtn.classList.add('nv-hidden');
    updateButtons();
  }

  function exit(){
    active = false;
    warp = false; warpFx(false);
    ship.group.visible = false;

    controls.enabled = true;
    camera.near = savedNear; camera.fov = savedFov; camera.updateProjectionMatrix();
    controls.target.copy(savedTarget);
    camera.position.copy(savedCamPos);
    if (controls.update) controls.update();

    dom.flightHud.classList.remove('active');
    if (dom.sys) dom.sys.style.display = '';
    if (flyBtn) flyBtn.classList.remove('nv-hidden');
    if (onExit) onExit();
  }

  function update(dt){
    if (!active) return;
    refreshSamples();
    const speedFactor = scanGravity();
    if (mode === 'orbit') updateOrbit(dt);
    else updateFree(dt, speedFactor);
    updateCamera(dt);
    updateShipFx();
    updateButtons();
    updateHud();
  }

  bindInput();
  bindButtons();
  const flyBtn = (ctx.flyButton === false) ? null : nv_ensureFlyButton(()=> enter());

  return {
    enter, exit, update,
    get active(){ return active; },
    get target(){ return target ? target.body : null; }
  };
}
