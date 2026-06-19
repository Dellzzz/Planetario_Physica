/* =============================================================================
   PLATAFORMA DA FISICA  --  Modulo de Nave Espacial (modo de exploracao)
   Repositorio: dellzzz/Plataforma-da-Fisica            Three.js r0.160

   API publica:
     buildShip(earthRadius)   -> cria o modelo 3D da nave (1% do diametro da Terra)
     createNaveMode(ctx)      -> controlador: joystick, fisica, colisao, orbita, HUD

   CONVENCOES DO PROJETO (OBRIGATORIO):
     - Operadores SOMENTE ASCII. NUNCA usar U+2212 (minus tipografico); apenas '-'.
     - Acentos dentro de strings via \u (ex.: '\u00F3rbita'). Comentarios sem acentos.
     - Escrito para ser concatenado no bundle: THREE ja esta no escopo, igual aos
       outros modulos de objects/. Se carregar este arquivo isolado como ES module,
       descomente a linha de import logo abaixo.

   O modulo NAO altera seus corpos. Ele apenas LE de cada item de "bodies":
       b.mesh      (Object3D)  -> posicao no mundo via b.mesh.getWorldPosition()
       b.radius    (number)    -> raio de colisao / escala
       b.name      (string)    -> rotulo da HUD
       b.influence (number)    -> OPCIONAL. Se ausente, vira b.radius * influenceFactor
   ============================================================================= */
// import * as THREE from 'three';   // <- somente se carregar este arquivo isolado

/* ----------------------------------------------------------------------------
   Modelo 3D da nave. earthRadius define a escala: nave = 1% do diametro da Terra.
   Passe o raio que voce usou para a Terra (ex.: buildShip(terra.radius)).
   Retorna { group, radius, glow, trail, cockpit }. Adicione group ao scene root.
   ---------------------------------------------------------------------------- */
function buildShip(earthRadius){
  const ER = (earthRadius && earthRadius > 0) ? earthRadius : 1.0;
  const g = new THREE.Group();
  const s = ER * 0.01;            // raio fisico da nave (~1% do diametro da Terra)
  const k = s / 0.01;             // fator de escala do modelo visual

  // casco (nariz no +Z local)
  const hull = new THREE.Mesh(
    new THREE.ConeGeometry(0.006 * k, 0.022 * k, 16),
    new THREE.MeshStandardMaterial({ color:0xcfe9ff, roughness:0.4, metalness:0.6, emissive:0x0a1622, emissiveIntensity:0.5 })
  );
  hull.rotation.x = Math.PI / 2;
  g.add(hull);

  // asas
  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(0.018 * k, 0.0012 * k, 0.006 * k),
    new THREE.MeshStandardMaterial({ color:0x6fb3ff, roughness:0.5, metalness:0.4, emissive:0x112233, emissiveIntensity:0.4 })
  );
  wing.position.z = -0.002 * k;
  g.add(wing);

  // cockpit
  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(0.0034 * k, 12, 10),
    new THREE.MeshStandardMaterial({ color:0x9fe9ff, emissive:0x2ad4ff, emissiveIntensity:1.1, roughness:0.2, metalness:0.1 })
  );
  cockpit.position.z = 0.004 * k;
  g.add(cockpit);

  // brilho do motor (atras, -Z)
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.005 * k, 12, 10),
    new THREE.MeshBasicMaterial({ color:0x6fd2ff, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending })
  );
  glow.position.z = -0.012 * k;
  g.add(glow);

  // rastro do motor (cone esticado que cresce com a velocidade)
  const trail = new THREE.Mesh(
    new THREE.ConeGeometry(0.004 * k, 1, 10, 1, true),
    new THREE.MeshBasicMaterial({ color:0x46e6ff, transparent:true, opacity:0.0, blending:THREE.AdditiveBlending, side:THREE.DoubleSide })
  );
  trail.rotation.x = -Math.PI / 2;
  g.add(trail);

  g.visible = false;
  return { group:g, radius:s, glow, trail, cockpit };
}

/* Coleta os elementos da HUD pelos IDs padrao (ver nave-hud.html). */
function np_defaultDom(){
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

/* ----------------------------------------------------------------------------
   Controlador da nave.
   ctx = {
     camera,                 // THREE.PerspectiveCamera (obrigatorio)
     controls,               // OrbitControls (obrigatorio; sera desabilitado no voo)
     bodies,                 // array de corpos do seu sistema (obrigatorio)
     ship,                   // retorno de buildShip() (obrigatorio)
     dom,                    // OPCIONAL: mapa de elementos; padrao = np_defaultDom()
     onExit,                 // OPCIONAL: callback ao voltar ao sistema
     options                 // OPCIONAL: { influenceFactor }
   }
   Metodos: enter(spawnBody), exit(), update(dt), get active(), get target()
   ---------------------------------------------------------------------------- */
function createNaveMode(ctx){
  const camera   = ctx.camera;
  const controls = ctx.controls;
  const bodies   = ctx.bodies;
  const ship     = ctx.ship;
  const onExit   = ctx.onExit || null;
  const dom      = ctx.dom || np_defaultDom();
  const opt = Object.assign({
    influenceFactor: 8   // raio da zona de gravidade = body.radius * fator (se body.influence ausente)
  }, ctx.options || {});

  const clamp = THREE.MathUtils.clamp;
  const lerp  = THREE.MathUtils.lerp;
  const UP = new THREE.Vector3(0, 1, 0);
  const K  = ship.radius / 0.01;   // fator de escala do modelo (igual ao buildShip)

  function approach(a, b, step){ if (a < b){ a += step; if (a > b) a = b; } else { a -= step; if (a < b) a = b; } return a; }
  function fmt(n, d){ return n.toFixed(d === undefined ? 1 : d); }

  // ---- parametros (ajuste fino aqui) ----
  const P = {
    maxSpeed: 9,          // limite de velocidade (u/s)
    reverse: 0.4,         // fracao do max permitida em re
    accel: 7,             // aceleracao gradual (u/s^2)
    idleDecel: 2.6,       // desaceleracao automatica leve (ao soltar)
    brakeDecel: 22,       // freio forte
    yawRate: 1.7,         // velocidade de giro (rad/s)
    yawSign: -1,          // INVERTER para 1 se o giro ficar trocado
    steerLerp: 3.2,       // inercia reduzida (alinha o movimento ao nariz)
    warpMult: 7,          // multiplicador da hipervelocidade
    warpAccel: 22,
    skin: 0.04,           // folga da colisao
    gravMinFactor: 0.18,  // fracao do max no fundo do poco gravitacional
    camDist: 0.05,        // camera atras da nave (u)
    camLerp: 6,
    camLook: 0.012,       // mira a frente da nave
    pitchDefault: 0.20,   // inclinacao padrao da camera
    fov: 60, fovWarp: 90,
    altRate: 6,           // ajuste de altitude orbital (u/s)
    omegaRate: 0.9,       // ajuste da velocidade orbital (rad/s^2)
    omegaMax: 1.6,
    nearFlight: 0.02      // near plane durante o voo (nave e minuscula)
  };

  // ---- estado ----
  let active = false;
  let mode = 'free';        // 'free' | 'orbit'
  let warp = false;
  let braking = false;
  let yaw = 0;
  let speed = 0;
  const pos = new THREE.Vector3();
  const velDir = new THREE.Vector3(0, 0, 1);
  const fwd = new THREE.Vector3(0, 0, 1);

  let target = null;        // sample exibido na HUD
  let domBody = null;       // sample cuja influencia estamos
  let proximity = 0;        // 0..1 profundidade na zona de influencia

  // orbita assistida
  let orbBody = null, orbRadius = 0, orbAngle = 0, orbOmega = 0.5;
  const orbR0 = new THREE.Vector3(), orbT0 = new THREE.Vector3(), orbN = new THREE.Vector3();

  // camera
  let camYaw = 0, camPitch = P.pitchDefault, recenter = false;
  let savedNear = 0.1, savedFov = 60;
  const savedCamPos = new THREE.Vector3(), savedTarget = new THREE.Vector3();

  // entrada
  const joy = { x:0, y:0, active:false };
  const look = { dx:0, dy:0 };

  // amostras dos corpos (adaptador: posicao no mundo + influence derivada)
  let samples = [];
  function buildSamples(){
    samples = bodies.map(function(b){
      return {
        body: b,
        mesh: b.mesh,
        wp: new THREE.Vector3(),
        radius: b.radius,
        name: b.name,
        influence: (b.influence != null ? b.influence : b.radius * opt.influenceFactor)
      };
    });
  }
  function refreshSamples(){
    // getWorldPosition ja atualiza a matriz do mundo do objeto (independe do loop do host)
    for (const sm of samples){ if (sm.mesh) sm.mesh.getWorldPosition(sm.wp); }
  }

  // scratch (sem alocacao no loop)
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
      joy.y = clamp(-dy / R, -1, 1);   // tela: cima e negativo -> invertido
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

    // pointer events (cobrem mouse + toque)
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
    if (proximity > 0.02){ warp = false; return; }   // gravidade cancela warp
    warp = !warp;
    dom.btnWarp.classList.toggle('on', warp);
    warpFx(warp);
  }

  // ---------- orientacao do modelo ----------
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

  // ---------- gravidade / alvo / colisao ----------
  function scanGravity(){
    domBody = null; proximity = 0; target = null;
    let bestPen = Infinity, nearest = null, nearDist = Infinity, domDist = 0;
    for (const sm of samples){
      const d = pos.distanceTo(sm.wp);
      if (d < nearDist){ nearDist = d; nearest = sm; }
      if (sm.influence > 0 && d < sm.influence){
        const pen = d / sm.influence;   // menor = mais fundo
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
      // ponto mais proximo do segmento A->B a C (varredura anti-tunel)
      _v4.copy(B).sub(A);
      const ab2 = _v4.lengthSq();
      let t = ab2 > 1e-9 ? _v1.copy(C).sub(A).dot(_v4) / ab2 : 0;
      t = clamp(t, 0, 1);
      _v5.copy(A).addScaledVector(_v4, t);
      const dC = _v5.distanceTo(C);
      if (dC < R){
        // empurra para a superficie e remove a componente que entra
        _v1.copy(B).sub(C);
        let len = _v1.length();
        if (len < 1e-6){ _v1.set(0,1,0); len = 1; }
        _v1.divideScalar(len);                 // normal de saida
        B.copy(C).addScaledVector(_v1, R);
        _v2.copy(velDir).multiplyScalar(speed); // vetor velocidade
        const into = _v2.dot(_v1);
        if (into < 0){
          _v2.addScaledVector(_v1, -into);       // desliza tangente
          speed = _v2.length() * 0.5;            // dissipa energia
          if (speed > 1e-5) velDir.copy(_v2).divideScalar(_v2.length());
        }
      }
    }
  }

  // ---------- orbita assistida ----------
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
    orbOmega = clamp(tang / Math.max(0.5, orbRadius), -1.2, 1.2);
    if (Math.abs(orbOmega) < 0.18) orbOmega = 0.45;
    mode = 'orbit'; warp = false;
    dom.btnWarp.classList.remove('on'); warpFx(false);
    updateButtons();
  }
  function exitOrbit(){
    if (mode !== 'orbit') return;
    // preserva o momento tangencial ao soltar
    mode = 'free';
    orbBody = null;
    updateButtons();
  }

  function updateOrbit(dt){
    const C = orbBody.wp;
    // joystick: Y -> altitude, X -> velocidade orbital
    orbRadius = clamp(orbRadius + joy.y * P.altRate * dt, orbBody.radius * 1.8, orbBody.influence * 0.95);
    orbOmega = clamp(orbOmega + joy.x * P.omegaRate * dt, -P.omegaMax, P.omegaMax);
    orbAngle += orbOmega * dt;

    const c = Math.cos(orbAngle), s = Math.sin(orbAngle);
    pos.copy(C).addScaledVector(orbR0, c * orbRadius).addScaledVector(orbT0, s * orbRadius);

    // tangente (direcao do movimento)
    _v1.copy(orbR0).multiplyScalar(-s).addScaledVector(orbT0, c);
    _v1.multiplyScalar(orbOmega >= 0 ? 1 : -1).normalize();
    velDir.copy(_v1);
    speed = Math.abs(orbOmega) * orbRadius;

    orientShip(_v1, orbN, 0);
    ship.group.position.copy(pos);
  }

  // ---------- voo livre ----------
  function updateFree(dt, speedFactor){
    // giro
    yaw += P.yawSign * joy.x * P.yawRate * dt;
    fwd.set(Math.sin(yaw), 0, Math.cos(yaw));

    const maxV = P.maxSpeed * (warp ? P.warpMult : 1) * speedFactor;
    const aMax = warp ? P.warpAccel : P.accel;

    let targetSpeed;
    if (braking) targetSpeed = 0;
    else if (joy.y >= 0) targetSpeed = joy.y * maxV;
    else targetSpeed = joy.y * P.maxSpeed * P.reverse;   // re limitada, sem warp

    let rate;
    if (braking) rate = P.brakeDecel;
    else if (Math.abs(targetSpeed) > Math.abs(speed)) rate = aMax;
    else rate = P.idleDecel;                              // desaceleracao automatica leve
    speed = approach(speed, targetSpeed, rate * dt);
    speed = clamp(speed, -P.maxSpeed * P.reverse, maxV);

    // inercia reduzida: o movimento se alinha ao nariz
    velDir.lerp(fwd, clamp(P.steerLerp * dt, 0, 1));
    if (velDir.lengthSq() < 1e-9) velDir.copy(fwd);
    velDir.normalize();

    // move com colisao varrida
    _v1.copy(pos);                       // A
    pos.addScaledVector(velDir, speed * dt);
    resolveCollisions(_v1, pos);

    const bank = -joy.x * 0.45;
    orientShip(fwd, UP, bank);
    ship.group.position.copy(pos);
  }

  // ---------- camera de perseguicao ----------
  function updateCamera(dt){
    const f = velDir;                    // perseguicao segue o movimento
    // recentralizacao suave
    if (recenter){
      camYaw = approach(camYaw, 0, 3.5 * dt);
      camPitch = approach(camPitch, P.pitchDefault, 2.2 * dt);
      if (Math.abs(camYaw) < 0.01 && Math.abs(camPitch - P.pitchDefault) < 0.01) recenter = false;
    }
    // arraste da direita -> orbita a visao
    if (look.dx || look.dy){
      camYaw -= look.dx * 0.005;
      camPitch = clamp(camPitch + look.dy * 0.005, -1.15, 1.3);
      look.dx = 0; look.dy = 0;
    }

    // direcao da camera = atras da nave, com yaw/pitch do usuario
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

  // ---------- efeitos do modelo ----------
  function updateShipFx(){
    const sp = Math.abs(speed);
    const f = clamp(sp / P.maxSpeed, 0, 1.4);
    const len = (0.02 + f * (warp ? 0.5 : 0.16)) * K;
    ship.trail.scale.set(1, len, 1);
    ship.trail.position.z = -0.012 * K - len * 0.5;     // streak inteiro atras do motor
    ship.trail.material.opacity = clamp(f * 0.8, 0, 0.85);
    ship.glow.material.opacity = 0.5 + clamp(f, 0, 1) * 0.5;
    ship.glow.material.color.setHex(warp ? 0xffd28a : 0x6fd2ff);
    ship.trail.material.color.setHex(warp ? 0xffb14d : 0x46e6ff);
  }

  // ---------- HUD ----------
  function updateButtons(){
    const orbitable = (mode === 'free' && domBody);
    dom.btnOrbit.disabled = !(orbitable || mode === 'orbit');
    dom.btnOrbit.classList.toggle('go', !!orbitable);
    dom.btnOrbit.classList.toggle('exit', mode === 'orbit');
    if (dom.orbitLabel) dom.orbitLabel.textContent = (mode === 'orbit') ? 'Sair de \u00F3rbita' : 'Entrar em \u00F3rbita';
    dom.btnWarp.disabled = (mode === 'orbit') || (proximity > 0.02);
    // freio so faz sentido em voo livre
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
      const alt = (orbRadius / orbBody.radius);     // altitude em raios do corpo
      dom.telAlt.innerHTML = fmt(alt, 2) + '<small>r</small>';
    }
  }

  // ---------- ciclo de vida ----------
  function enter(spawnBody){
    active = true;
    mode = 'free'; warp = false; braking = false; speed = 0;
    camYaw = 0; camPitch = P.pitchDefault; recenter = false;
    look.dx = look.dy = 0; joy.x = joy.y = 0;

    // amostra os corpos e suas posicoes atuais no mundo
    buildSamples();
    refreshSamples();

    // localiza a amostra do corpo inicial
    let sp = null;
    for (const sm of samples){ if (sm.body === spawnBody){ sp = sm; break; } }
    if (!sp) sp = samples[0];

    // posiciona a nave logo fora da influencia do corpo, de frente para ele
    const C = _v1.copy(sp.wp);
    _v2.copy(C);                              // direcao radial a partir da origem (corpos no plano XZ)
    if (_v2.lengthSq() < 1e-6) _v2.set(0, 0, 1);
    _v2.y = 0; _v2.normalize();
    const d = sp.influence * 1.15;
    pos.copy(C).addScaledVector(_v2, d);
    pos.y = 0;

    // nariz apontando para o corpo
    _v3.copy(C).sub(pos); _v3.y = 0; _v3.normalize();
    yaw = Math.atan2(_v3.x, _v3.z);
    fwd.set(Math.sin(yaw), 0, Math.cos(yaw));
    velDir.copy(fwd);

    ship.group.position.copy(pos);
    ship.group.visible = true;

    // salva o estado da camera/controls para restaurar na saida
    savedNear = camera.near; savedFov = camera.fov;
    savedCamPos.copy(camera.position);
    savedTarget.copy(controls.target);

    // camera de voo
    controls.enabled = false;
    camera.near = Math.min(savedNear, P.nearFlight); camera.fov = P.fov; camera.updateProjectionMatrix();
    camera.position.copy(pos).addScaledVector(_v3, -P.camDist).addScaledVector(UP, 0.02);
    camera.lookAt(pos);

    dom.flightHud.classList.add('active');
    if (dom.sys) dom.sys.style.display = 'none';
    updateButtons();
  }

  function exit(){
    active = false;
    warp = false; warpFx(false);
    ship.group.visible = false;

    // restaura a visao geral exatamente onde estava
    controls.enabled = true;
    camera.near = savedNear; camera.fov = savedFov; camera.updateProjectionMatrix();
    controls.target.copy(savedTarget);
    camera.position.copy(savedCamPos);
    if (controls.update) controls.update();

    dom.flightHud.classList.remove('active');
    if (dom.sys) dom.sys.style.display = '';
    if (onExit) onExit();
  }

  function update(dt){
    if (!active) return;
    refreshSamples();                       // posicoes do mundo (independe do loop do host)
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

  return {
    enter, exit, update,
    get active(){ return active; },
    get target(){ return target ? target.body : null; }
  };
}
