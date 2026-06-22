// =============================================================================
// tour.js  -  MODO TOUR (passeio guiado)
// -----------------------------------------------------------------------------
// Esconde toda a HUD, congela as orbitas e faz a camera viajar por cada astro,
// orbitando ao seu redor por >= 20s. O nome surge com as letras embaralhando e
// se fixando (aleatoriamente), e um cartao de vidro fosco (<= 20% da tela) mostra
// posicao no sistema, tempo de translacao e origem do nome.
//
// Uso (main.js):
//   tour = createTour({ camera, controls, planets, hudRoot, onEnd });
//   // botao "Tour guiado" -> tour.enter()
//   // no loop, quando tour.active: NAO atualiza corpos; chama tour.update(delta)
//   //   no lugar de cameraFocus/controls.
// =============================================================================
import * as THREE from 'three';

// dados curados por id (origem do nome, translacao, posicao)
const TOUR_DATA = {
  sol:      { pos: 'Centro do Sistema Solar',           orb: 'A Via-L\u00e1ctea em ~225 milh\u00f5es de anos', org: "De 'Sol', do latim \u2014 a estrela central" },
  mercurio: { pos: '1\u00ba planeta a partir do Sol',   orb: 'Transla\u00e7\u00e3o: 88 dias',                  org: 'Mensageiro veloz dos deuses romanos' },
  venus:    { pos: '2\u00ba planeta a partir do Sol',   orb: 'Transla\u00e7\u00e3o: 225 dias',                 org: 'Deusa romana do amor e da beleza' },
  terra:    { pos: '3\u00ba planeta \u2014 zona habit\u00e1vel', orb: 'Transla\u00e7\u00e3o: 365,25 dias',       org: "Do germ\u00e2nico antigo \u2014 'solo, ch\u00e3o'" },
  marte:    { pos: '4\u00ba planeta a partir do Sol',   orb: 'Transla\u00e7\u00e3o: 687 dias',                 org: 'Deus romano da guerra (cor avermelhada)' },
  jupiter:  { pos: '5\u00ba planeta \u2014 o maior',     orb: 'Transla\u00e7\u00e3o: ~12 anos',                 org: 'Rei dos deuses romanos (J\u00fapiter / Jove)' },
  saturn:   { pos: '6\u00ba planeta \u2014 dos an\u00e9is', orb: 'Transla\u00e7\u00e3o: ~29 anos',              org: 'Deus romano da agricultura, pai de J\u00fapiter' },
  uranus:   { pos: '7\u00ba planeta a partir do Sol',   orb: 'Transla\u00e7\u00e3o: ~84 anos',                 org: 'Deus grego do c\u00e9u (Ouranos)' },
  urano:    { pos: '7\u00ba planeta a partir do Sol',   orb: 'Transla\u00e7\u00e3o: ~84 anos',                 org: 'Deus grego do c\u00e9u (Ouranos)' },
  neptune:  { pos: '8\u00ba planeta a partir do Sol',   orb: 'Transla\u00e7\u00e3o: ~165 anos',                org: 'Deus romano dos mares' },
};
const FALLBACK = { pos: '\u2014', orb: '\u2014', org: '\u2014' };

const CSS = `
#tour-overlay{position:fixed; inset:0; z-index:60; pointer-events:none; display:none;
  font-family:'Rajdhani','Share Tech Mono',sans-serif;}
#tour-overlay.on{display:block;}
#tour-name{position:absolute; left:0; right:0; bottom:31%; text-align:center;
  font-family:'Orbitron',sans-serif; font-weight:800; font-size:clamp(28px,6.5vw,62px);
  letter-spacing:4px; color:#eaf4ff; text-shadow:0 0 30px rgba(120,180,255,0.55);
  padding:0 16px; line-height:1.1;}
#tour-name .tn-ch{display:inline-block; opacity:0.22; color:#6f9ccb;
  transition:opacity .25s ease, color .25s ease; min-width:.16em;}
#tour-name .tn-ch.locked{opacity:1; color:#eaf4ff;}
#tour-card{position:absolute; left:50%; transform:translateX(-50%); bottom:13%;
  width:min(420px,80vw); max-height:20vh; overflow:hidden; padding:13px 18px;
  background:rgba(12,18,30,0.42); border:1px solid rgba(140,190,255,0.25); border-radius:14px;
  backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
  box-shadow:0 10px 44px rgba(0,0,0,0.5); opacity:0; transition:opacity .6s ease;}
#tour-card.show{opacity:1;}
.tc-row{display:flex; justify-content:space-between; gap:16px; padding:5px 0; font-size:13.5px;
  border-bottom:1px solid rgba(140,190,255,0.10);}
.tc-row:last-child{border-bottom:none;}
.tc-k{color:#6f9ccb; letter-spacing:1px; text-transform:uppercase; font-size:10.5px; white-space:nowrap; align-self:center;}
.tc-v{color:#dcebff; text-align:right;}
#tour-exit{position:fixed; top:calc(14px + env(safe-area-inset-top)); right:16px; z-index:61;
  pointer-events:auto; font-family:'Share Tech Mono',monospace; font-size:12px; letter-spacing:1px;
  color:#9fc0e6; background:rgba(12,18,30,0.5); border:1px solid rgba(140,190,255,0.3);
  border-radius:999px; padding:8px 14px; cursor:pointer; opacity:0.5; transition:opacity .2s;}
#tour-exit:hover{opacity:1;}
#tour-count{position:fixed; bottom:calc(16px + env(safe-area-inset-bottom)); left:50%;
  transform:translateX(-50%); z-index:61; font-family:'Share Tech Mono',monospace;
  font-size:11px; letter-spacing:3px; color:#5f7da3; pointer-events:none;}
`;

const HTML = `
<div id="tour-name"></div>
<div id="tour-card">
  <div class="tc-row"><span class="tc-k">Posi\u00e7\u00e3o</span><span class="tc-v" id="tc-pos"></span></div>
  <div class="tc-row"><span class="tc-k">Transla\u00e7\u00e3o</span><span class="tc-v" id="tc-orb"></span></div>
  <div class="tc-row"><span class="tc-k">Origem do nome</span><span class="tc-v" id="tc-org"></span></div>
</div>
<button id="tour-exit">\u2715 sair do tour</button>
<div id="tour-count"></div>
`;

const ORBIT_TIME = 21.0;   // segundos orbitando cada astro (>= 20)
const TRANS_TIME = 2.6;    // transicao entre astros
const ANG_SPEED  = 0.26;   // rad/s (giro lento ao redor do astro)
const ELEV       = 0.34;   // elevacao da camera (rad)
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@*+=<>';
const easeInOut = (t) => t * t * (3 - 2 * t);

export function createTour({ camera, controls, planets, hudRoot, onEnd }) {
  // injeta CSS uma vez
  if (!document.getElementById('tour-style')) {
    const st = document.createElement('style');
    st.id = 'tour-style'; st.textContent = CSS; document.head.appendChild(st);
  }
  // injeta overlay
  let overlay = document.getElementById('tour-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'tour-overlay'; overlay.innerHTML = HTML;
    document.body.appendChild(overlay);
  }
  const nameEl  = overlay.querySelector('#tour-name');
  const cardEl  = overlay.querySelector('#tour-card');
  const posEl   = overlay.querySelector('#tc-pos');
  const orbEl   = overlay.querySelector('#tc-orb');
  const orgEl   = overlay.querySelector('#tc-org');
  const countEl = overlay.querySelector('#tour-count');

  // monta a lista de astros (corpo + dados + enquadramento)
  const stops = planets.map((p) => ({
    body: p,
    data: TOUR_DATA[p.id] || FALLBACK,
    R: (p.radius || 1) * 4.0 + 6.0,
    a0: Math.random() * Math.PI * 2,
  }));

  let active = false;
  let phase = 'orbit';     // 'orbit' | 'transition'
  let idx = 0;
  let t = 0;
  let angle = 0;
  let nameTimer = 0;
  const _c = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  const transStartPos = new THREE.Vector3();
  const transStartLook = new THREE.Vector3();
  const transEndPos = new THREE.Vector3();
  const transEndLook = new THREE.Vector3();

  function center(i) { return stops[i].body.getWorldPosition(_c); }
  function orbitPos(i, ang, out) {
    const s = stops[i]; const c = center(i);
    const ce = Math.cos(ELEV), se = Math.sin(ELEV);
    return out.set(
      c.x + Math.cos(ang) * s.R * ce,
      c.y + s.R * se,
      c.z + Math.sin(ang) * s.R * ce
    );
  }

  function randGlyph() { return GLYPHS[(Math.random() * GLYPHS.length) | 0]; }

  function animateName(text) {
    clearInterval(nameTimer);
    nameEl.innerHTML = '';
    const chars = Array.from(text);
    const items = chars.map((ch) => {
      const sp = document.createElement('span');
      sp.className = 'tn-ch';
      const isSpace = ch === ' ';
      sp.textContent = isSpace ? '\u00A0' : randGlyph();
      nameEl.appendChild(sp);
      return { sp, ch, isSpace, locked: isSpace, lockAt: 280 + Math.random() * 1000 };
    });
    const start = performance.now();
    nameTimer = setInterval(() => {
      const el = performance.now() - start;
      let all = true;
      for (const it of items) {
        if (it.locked) continue;
        if (el >= it.lockAt) { it.sp.textContent = it.ch; it.sp.classList.add('locked'); it.locked = true; }
        else { it.sp.textContent = randGlyph(); all = false; }
      }
      if (all) clearInterval(nameTimer);
    }, 55);
  }

  function showAstro(i) {
    const s = stops[i];
    animateName(s.body.name);
    posEl.textContent = s.data.pos;
    orbEl.textContent = s.data.orb;
    orgEl.textContent = s.data.org;
    cardEl.classList.remove('show');
    // o cartao surge depois do nome comecar a se formar
    setTimeout(() => { if (active && idx === i) cardEl.classList.add('show'); }, 850);
    countEl.textContent = (i + 1) + ' / ' + stops.length;
  }

  function beginTransition(i) {
    phase = 'transition'; t = 0;
    transStartPos.copy(camera.position);
    transStartLook.copy(lookTarget);
    orbitPos(i, stops[i].a0, transEndPos);
    transEndLook.copy(center(i));
    cardEl.classList.remove('show');
  }

  function finish() { exit(); }

  function enter() {
    if (active || !stops.length) return;
    active = true;
    idx = 0;
    if (hudRoot) hudRoot.style.display = 'none';
    controls.enabled = false;
    overlay.classList.add('on');
    lookTarget.copy(controls.target);
    beginTransition(0);   // voo suave da visao atual ate o 1o astro
  }

  function exit() {
    if (!active) return;
    active = false;
    clearInterval(nameTimer);
    overlay.classList.remove('on');
    cardEl.classList.remove('show');
    if (hudRoot) hudRoot.style.display = '';
    // sincroniza o alvo dos controles com o que estava sendo observado (sem salto)
    controls.target.copy(lookTarget);
    controls.enabled = true;
    if (typeof onEnd === 'function') onEnd();
  }

  function update(delta) {
    if (!active) return;
    t += delta;
    if (phase === 'transition') {
      const k = easeInOut(Math.min(1, t / TRANS_TIME));
      camera.position.copy(transStartPos).lerp(transEndPos, k);
      lookTarget.copy(transStartLook).lerp(transEndLook, k);
      camera.lookAt(lookTarget);
      if (t >= TRANS_TIME) { phase = 'orbit'; t = 0; angle = stops[idx].a0; showAstro(idx); }
      return;
    }
    // orbit
    angle += ANG_SPEED * delta;
    orbitPos(idx, angle, camera.position);
    lookTarget.copy(center(idx));
    camera.lookAt(lookTarget);
    if (t >= ORBIT_TIME) {
      if (idx < stops.length - 1) { idx++; beginTransition(idx); }
      else finish();
    }
  }

  overlay.querySelector('#tour-exit').addEventListener('click', exit);

  return { enter, exit, update, get active() { return active; } };
}
