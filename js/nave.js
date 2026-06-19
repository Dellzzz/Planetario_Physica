// =============================================================================
// js/nave.js
// Modulo de Nave Espacial (modo de exploracao em primeira pessoa) para o
// Planetario Virtual. Modulo ES: importa THREE e exporta buildShip + createNaveMode.
//
// AUTO-MONTAVEL: injeta sozinho o CSS, a HUD de voo e o botao PILOTAR. Voce so
// precisa, no main.js: criar a nave e trocar 3 linhas no loop (ver INTEGRACAO).
//
// Nao altera seus corpos. De cada item de "bodies" ele LE:
//   b.mesh (Object3D)   -> posicao no mundo via getWorldPosition
//   b.radius (number)   -> colisao / escala
//   b.name (string)     -> rotulo da HUD
//   b.influence (number)-> OPCIONAL; se ausente, vira b.radius * influenceFactor
//
// Convencoes do projeto: operadores SO ASCII (sem U+2212); acentos via \u nas
// strings de codigo. (Na HUD injetada os acentos vao como entidades HTML, que
// tambem sao ASCII no fonte.)
// =============================================================================

import * as THREE from 'three';

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
#zone-look{position:absolute; top:0; right:0; width:55%; height:100%; pointer-events:auto; touch-action:none; z-index:41;}
#zone-joy{position:absolute; top:0; left:0; width:45%; height:100%; pointer-events:auto; touch-action:none; z-index:41;}
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
#joy-base{position:absolute; width:132px; height:132px; left:0; top:0; margin-left:-66px; margin-top:-66px;
  z-index:43; pointer-events:none; opacity:0; transition:opacity .18s ease;}
#joy-base.show{opacity:1;}
#joy-ring{position:absolute; inset:0; border-radius:50%; border:1.5px solid var(--nv-line);
  background:radial-gradient(circle at 50% 42%, rgba(70,230,255,0.10), rgba(6,14,22,0.55));
  box-shadow:0 0 22px rgba(70,230,255,0.18), 0 0 0 1px rgba(0,0,0,0.4) inset;}
#joy-ring::before{content:""; position:absolute; inset:50% 12% auto 12%; height:1px; background:var(--nv-line-soft);}
#joy-ring::after{content:""; position:absolute; inset:12% 50% 12% auto; width:1px; background:var(--nv-line-soft);}
#joy-knob{position:absolute; width:58px; height:58px; left:50%; top:50%; margin-left:-29px; margin-top:-29px; border-radius:50%;
  background:radial-gradient(circle at 42% 36%, #7ff0ff, #1aa6c2 60%, #0c5366);
  box-shadow:0 0 18px rgba(70,230,255,0.6), 0 4px 12px rgba(0,0,0,0.5); border:1px solid rgba(190,250,255,0.7);}
#joy-knob::after{content:""; position:absolute; inset:34% 0 auto 0; height:8%; background:rgba(4,10,16,0.5); border-radius:50%; filter:blur(0.5px);}
#joy-hint{position:absolute; z-index:43; pointer-events:none; left:calc(86px + env(safe-area-inset-left));
  bottom:calc(96px + env(safe-area-inset-bottom)); width:120px; color:var(--nv-cyan-dim); font-size:9px; letter-spacing:0.18em; opacity:.7; line-height:1.5;}
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
  <div id="zone-look"></div>
  <div id="zone-joy"></div>
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
  <div id="joy-hint" class="layer">&#9650; acelerar<br>&#9660; frear/r&eacute;<br>&#9664;&#9654; girar</div>
  <div id="joy-base"><div id="joy-ring"></div><div id="joy-knob"></div></div>
  <div id="pad">
    <button class="pbtn orbit" id="btn-orbit"><span class="ic">&#128752;</span><span id="orbit-label">Entrar em &oacute;rbita</span></button>
    <div id="pad-row">
      <button class="pbtn small recenter" id="btn-recenter" title="Centralizar c&acirc;mera"><span class="ic">&#127919;</span></button>
      <button class="pbtn warp" id="btn-warp"><span class="ic">&#9889;</span>Hiper</button>
      <button class="pbtn brake small" id="btn-brake" title="Freio"><span class="ic">&#9995;</span></button>
    </div>
  </div>
</div>
`;

function nv_injectStyles(){
  if (document.getElementById('nv-styles')) return;
  const s = document.createElement('style');
  s.id = 'nv-styles';
  s.textContent = NV_CSS;
  document.head.appendChild(s);
}
function nv_ensureHud(){
  if (document.getElementById('flight-hud')) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = NV_HUD_HTML;
  while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
}
function nv_ensureFlyButton(onFly){
  let b = document.getElementById('btn-fly');
  if (!b){
    b = document.createElement('button');
    b.id = 'btn-fly';
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
    zoneJoy: g('zone-joy'), zoneLook: g('zone-look'),
    joyBase: g('joy-base'), joyKnob: g('joy-knob'),
    btnBrake: g('btn-brake'), btnWarp: g('btn-warp'), btnRecenter: g('btn-recenter'),
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
  const s = ER * 0.01;            // raio fisico da nave
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
//   spawnBody  : corpo onde a nave nasce (padrao: o que tiver id 'terra')
//   overviewUI : elemento da sua UI de overview a esconder no voo (ex.: #hud-root)
//   onExit     : callback ao voltar ao sistema (ex.: cameraFocus.reset())
//   flyButton  : false desativa o botao PILOTAR automatico (voce liga nave.enter)
//   options    : { influenceFactor }
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
  const opt = Object.assign({ influenceFactor: 8, speedScale: 1 }, ctx.options || {});

  const clamp = THREE.MathUtils.clamp;
  const lerp  = THREE.MathUtils.lerp;
  const UP = new THREE.Vector3(0, 1, 0);
  const U  = ship.radius / 0.01;   // unidade de mundo = raio da Terra do seu projeto
  const S  = opt.speedScale;       // multiplicador global de velocidade (ajuste rapido)

  function approach(a, b, step){ if (a < b){ a += step; if (a > b) a = b; } else { a -= step; if (a < b) a = b; } return a; }
  function fmt(n, d){ return n.toFixed(d === undefined ? 1 : d); }

  // ---- parametros (distancias/velocidades escalam por U; angulos nao) ----
  const P = {
    maxSpeed: 9 * U * S,
    reverse: 0.4,
    accel: 7 * U * S,
    idleDecel: 2.6 * U * S,
    brakeDecel: 22 * U * S,
    yawRate: 1.7,
    yawSign: -1,          // INVERTER para 1 se o giro ficar trocado
    steerLerp: 3.2,
    warpMult: 7,
    warpAccel: 22 * U * S,
    skin: 0.04 * U,
    gravMinFactor: 0.18,
    camDist: 0.05 * U,
    camLerp: 6,
    camLook: 0.012 * U,
    pitchDefault: 0.20,
    fov: 60, fovWarp: 90,
    altRate: 6 * U * S,
    omegaRate: 0.9,
    omegaMax: 1.6,
    nearFlight: 0.02 * U
  };

  // ---- estado ----
  let active = false;
  let mode = 'free';
  let warp = false;
  let braking = false;
  let yaw = 0;
  let speed = 0;
  const pos = new THREE.Vector3();
  const velDir = new THREE.Vector3(0, 0, 1);
  const fwd = new THREE.Vector3(0, 0, 1);

  let target = null;
  let domBody = null;
  let proximity = 0;

  let orbBody = null, orbRadius = 0, orbAngle = 0, orbOmega = 0.5;
  const orbR0 = new THREE.Vector3(), orbT0 = new THREE.Vector3(), orbN = new THREE.Vector3();

  let camYaw = 0, camPitch = P.pitchDefault, recenter = false;
  let savedNear = 0.1, savedFov = 60;
  const savedCamPos = new THREE.Vector3(), savedTarget = new THREE.Vector3();

  const joy = { x:0, y:0, active:false };
  const look = { dx:0, dy:0 };

  let samples = [];
  function buildSamples(){
    samples = bodies.map(function(b){
      return {
        body: b, mesh: b.mesh, wp: new THREE.Vector3(),
        radius: b.radius, name: b.name,
        influence: (b.influence != null ? b.influence : b.radius * opt.influenceFactor)
      };
    });
  }
  function refreshSamples(){
    for (const sm of samples){ if (sm.mesh) sm.mesh.getWorldPosition(sm.wp); }
  }

  const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
  const _v4 = new THREE.Vector3(), _v5 = new THREE.Vector3();
  const _m = new THREE.Matrix4();

  function warpFx(on){ if (dom.warpFx) dom.warpFx.classList.toggle('on', on); }

  // ---------- entrada de toque ----------
  function bindInput(){
    const zJoy = dom.zoneJoy, zLook = dom.zoneLook;
    let joyId = null, lookId = null, lookX = 0, lookY = 0;

    function joyStart(e){
      const t = e.changedTouches ? e.changedTouches[0] : e;
      if (joyId !== null) return;
      joyId = t.pointerId !== undefined ? t.pointerId : 'm';
      joy.active = true;
      placeJoy(t.clientX, t.clientY, true);
      moveJoy(t.clientX, t.clientY);
    }
    function placeJoy(x, y, reset){
      const m = 80;
      const cx = clamp(x, m, window.innerWidth - m);
      const cy = clamp(y, m, window.innerHeight - m);
      dom.joyBase.style.left = cx + 'px';
      dom.joyBase.style.top = cy + 'px';
      dom.joyBase.dataset.cx = cx; dom.joyBase.dataset.cy = cy;
      dom.joyBase.classList.add('show');
      if (reset){ dom.joyKnob.style.transform = 'translate(0px,0px)'; }
    }
    function moveJoy(x, y){
      const cx = +dom.joyBase.dataset.cx, cy = +dom.joyBase.dataset.cy;
      let dx = x - cx, dy = y - cy;
      const R = 58, mag = Math.hypot(dx, dy);
      if (mag > R){ dx = dx / mag * R; dy = dy / mag * R; }
      dom.joyKnob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      joy.x = clamp(dx / R, -1, 1);
      joy.y = clamp(-dy / R, -1, 1);
    }
    function joyEnd(){ joyId = null; joy.active = false; joy.x = 0; joy.y = 0;
      dom.joyKnob.style.transform = 'translate(0px,0px)'; dom.joyBase.classList.remove('show'); }

    function lookStart(e){
      const t = e.changedTouches ? e.changedTouches[0] : e;
      if (lookId !== null) return;
      lookId = t.pointerId !== undefined ? t.pointerId : 'm';
      lookX = t.clientX; lookY = t.clientY;
    }
    function lookMove(x, y){ look.dx += (x - lookX); look.dy += (y - lookY); lookX = x; lookY = y; }
    function lookEnd(){ lookId = null; }

    zJoy.addEventListener('pointerdown', (e)=>{ e.preventDefault(); joyStart(e); }, { passive:false });
    zLook.addEventListener('pointerdown', (e)=>{ e.preventDefault(); lookStart(e); }, { passive:false });
    window.addEventListener('pointermove', (e)=>{
      const id = e.pointerId;
      if (id === joyId) moveJoy(e.clientX, e.clientY);
      if (id === lookId) lookMove(e.clientX, e.clientY);
    }, { passive:false });
    window.addEventListener('pointerup', (e)=>{ if (e.pointerId === joyId) joyEnd(); if (e.pointerId === lookId) lookEnd(); });
    window.addEventListener('pointercancel', (e)=>{ if (e.pointerId === joyId) joyEnd(); if (e.pointerId === lookId) lookEnd(); });
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
    tap(dom.btnRecenter, ()=>{ recenter = true; });
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

  function resolveCollisions(A, B){
    for (const sm of samples){
      const C = sm.wp;
      const R = sm.radius + ship.radius + P.skin;
      _v4.copy(B).sub(A);
      const ab2 = _v4.lengthSq();
      let t = ab2 > 1e-9 ? _v1.copy(C).sub(A).dot(_v4) / ab2 : 0;
      t = clamp(t, 0, 1);
      _v5.copy(A).addScaledVector(_v4, t);
      const dC = _v5.distanceTo(C);
      if (dC < R){
        _v1.copy(B).sub(C);
        let len = _v1.length();
        if (len < 1e-6){ _v1.set(0,1,0); len = 1; }
        _v1.divideScalar(len);
        B.copy(C).addScaledVector(_v1, R);
        _v2.copy(velDir).multiplyScalar(speed);
        const into = _v2.dot(_v1);
        if (into < 0){
          _v2.addScaledVector(_v1, -into);
          speed = _v2.length() * 0.5;
          if (speed > 1e-5) velDir.copy(_v2).divideScalar(_v2.length());
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
    updateButtons();
  }

  function updateOrbit(dt){
    const C = orbBody.wp;
    orbRadius = clamp(orbRadius + joy.y * P.altRate * dt, orbBody.radius * 1.8, orbBody.influence * 0.95);
    orbOmega = clamp(orbOmega + joy.x * P.omegaRate * dt, -P.omegaMax, P.omegaMax);
    orbAngle += orbOmega * dt;

    const c = Math.cos(orbAngle), s = Math.sin(orbAngle);
    pos.copy(C).addScaledVector(orbR0, c * orbRadius).addScaledVector(orbT0, s * orbRadius);

    _v1.copy(orbR0).multiplyScalar(-s).addScaledVector(orbT0, c);
    _v1.multiplyScalar(orbOmega >= 0 ? 1 : -1).normalize();
    velDir.copy(_v1);
    speed = Math.abs(orbOmega) * orbRadius;

    orientShip(_v1, orbN, 0);
    ship.group.position.copy(pos);
  }

  function updateFree(dt, speedFactor){
    yaw += P.yawSign * joy.x * P.yawRate * dt;
    fwd.set(Math.sin(yaw), 0, Math.cos(yaw));

    const maxV = P.maxSpeed * (warp ? P.warpMult : 1) * speedFactor;
    const aMax = warp ? P.warpAccel : P.accel;

    let targetSpeed;
    if (braking) targetSpeed = 0;
    else if (joy.y >= 0) targetSpeed = joy.y * maxV;
    else targetSpeed = joy.y * P.maxSpeed * P.reverse;

    let rate;
    if (braking) rate = P.brakeDecel;
    else if (Math.abs(targetSpeed) > Math.abs(speed)) rate = aMax;
    else rate = P.idleDecel;
    speed = approach(speed, targetSpeed, rate * dt);
    speed = clamp(speed, -P.maxSpeed * P.reverse, maxV);

    velDir.lerp(fwd, clamp(P.steerLerp * dt, 0, 1));
    if (velDir.lengthSq() < 1e-9) velDir.copy(fwd);
    velDir.normalize();

    _v1.copy(pos);
    pos.addScaledVector(velDir, speed * dt);
    resolveCollisions(_v1, pos);

    const bank = -joy.x * 0.45;
    orientShip(fwd, UP, bank);
    ship.group.position.copy(pos);
  }

  function updateCamera(dt){
    const f = velDir;
    if (recenter){
      camYaw = approach(camYaw, 0, 3.5 * dt);
      camPitch = approach(camPitch, P.pitchDefault, 2.2 * dt);
      if (Math.abs(camYaw) < 0.01 && Math.abs(camPitch - P.pitchDefault) < 0.01) recenter = false;
    }
    if (look.dx || look.dy){
      camYaw -= look.dx * 0.005;
      camPitch = clamp(camPitch + look.dy * 0.005, -1.15, 1.3);
      look.dx = 0; look.dy = 0;
    }

    _v1.copy(f).multiplyScalar(-1);
    _v1.applyAxisAngle(UP, camYaw);
    _v2.crossVectors(UP, _v1);
    if (_v2.lengthSq() < 1e-8) _v2.set(1,0,0);
    _v2.normalize();
    _v1.applyAxisAngle(_v2, camPitch);

    const dist = P.camDist * (warp ? 1.5 : 1);
    _v3.copy(pos).addScaledVector(_v1, dist);
    camera.position.lerp(_v3, clamp(P.camLerp * dt, 0, 1));

    _v4.copy(pos).addScaledVector(f, P.camLook);
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
    mode = 'free'; warp = false; braking = false; speed = 0;
    camYaw = 0; camPitch = P.pitchDefault; recenter = false;
    look.dx = look.dy = 0; joy.x = joy.y = 0;

    buildSamples();
    refreshSamples();

    let sp = null;
    for (const sm of samples){ if (sm.body === spawnBody){ sp = sm; break; } }
    if (!sp) sp = samples[0];

    const C = _v1.copy(sp.wp);
    _v2.copy(C);
    if (_v2.lengthSq() < 1e-6) _v2.set(0, 0, 1);
    _v2.y = 0; _v2.normalize();
    const d = sp.influence * 1.15;
    pos.copy(C).addScaledVector(_v2, d);
    pos.y = 0;

    _v3.copy(C).sub(pos); _v3.y = 0; _v3.normalize();
    yaw = Math.atan2(_v3.x, _v3.z);
    fwd.set(Math.sin(yaw), 0, Math.cos(yaw));
    velDir.copy(fwd);

    ship.group.position.copy(pos);
    ship.group.visible = true;

    savedNear = camera.near; savedFov = camera.fov;
    savedCamPos.copy(camera.position);
    savedTarget.copy(controls.target);

    controls.enabled = false;
    camera.near = Math.min(savedNear, P.nearFlight); camera.fov = P.fov; camera.updateProjectionMatrix();
    camera.position.copy(pos).addScaledVector(_v3, -P.camDist).addScaledVector(UP, 0.02 * U);
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
