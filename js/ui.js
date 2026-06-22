// =============================================================================
// ui.js
// Interface educacional (HUD). Barra superior com titulo (menor), botao PILOTAR
// e um menu suspenso (hamburguer) com: Modo diagrama, Trajetoria, Pausar e
// Resetar. Abaixo do titulo, um menu "Astros" que lista Sol + planetas; ao
// escolher um planeta a camera VIAJA ate ele e abre um SUBMENU com as luas.
// O painel lateral mostra as informacoes do astro selecionado.
// =============================================================================

export function createUI({ root, bodies, groups, onFocus, onReset, onTogglePause, onToggleOrbits, onToggleDiagram, onFly, onTour }) {
  // lista de astros: Sol + planetas (apenas o nome; sem simbolos)
  const quick = groups.map((g) =>
    '<button class="qbtn" data-id="' + g.planet.id + '" style="--accent:' + g.planet.color + '">' +
    g.planet.name +
    '</button>'
  ).join('');

  root.innerHTML = [
    '<div class="topbar">',
    '  <div class="brand">',
    '    <span class="brand-dot"></span>',
    '    <span class="brand-title">PLANETARIO VIRTUAL</span>',
    '    <span class="brand-sub">Sistema Solar</span>',
    '  </div>',
    '  <div class="topbar-actions">',
    '    <button class="fly-btn" id="go-fly">PILOTAR</button>',
    '    <div class="menu" id="menu">',
    '      <button class="menu-btn" id="btn-menu" aria-label="Menu" aria-expanded="false"><span class="menu-ic" aria-hidden="true"></span></button>',
    '      <div class="menu-list" id="menu-list" role="menu">',
    '        <button class="menu-item" id="btn-tour" role="menuitem">Tour guiado</button>',
    '        <button class="menu-item" id="btn-diagram" role="menuitem">Modo diagrama</button>',
    '        <button class="menu-item" id="btn-orbits" role="menuitem">Desativar trajet&oacute;ria</button>',
    '        <button class="menu-item" id="btn-pause" role="menuitem">Pausar</button>',
    '        <button class="menu-item" id="btn-reset" role="menuitem">Resetar vis&atilde;o</button>',
    '      </div>',
    '    </div>',
    '  </div>',
    '</div>',
    '<div class="astros" id="astros">',
    '  <button class="astros-btn" id="btn-astros" aria-expanded="false">Astros</button>',
    '  <div class="astros-panel" id="astros-panel">',
    '    <div class="quickbar">' + quick + '</div>',
    '    <div class="submenu" id="submenu" aria-label="Luas do planeta selecionado"></div>',
    '  </div>',
    '</div>',
    '<aside class="panel collapsed" id="panel">',
    '  <div class="panel-head" id="panel-head" role="button" tabindex="0" aria-expanded="false" aria-label="Expandir ou recolher informacoes do astro">',
    '    <div class="panel-titles">',
    '      <div class="panel-title" id="p-name">&mdash;</div>',
    '      <div class="panel-type" id="p-type">&mdash;</div>',
    '    </div>',
    '    <span class="chevron" aria-hidden="true">&#9662;</span>',
    '  </div>',
    '  <div class="panel-body">',
    '    <div class="info-grid" id="p-info"></div>',
    '    <div class="facts">',
    '      <div class="facts-title">Curiosidade</div>',
    '      <div id="p-fact"></div>',
    '    </div>',
    '  </div>',
    '</aside>',
    '<div class="hint" id="hint">Toque em "Astros" para escolher um astro &nbsp;&bull;&nbsp; arraste para girar &nbsp;&bull;&nbsp; pince para aproximar</div>',
  ].join('');

  const $ = (s) => root.querySelector(s);
  const panel = $('#panel');
  const head = $('#panel-head');
  const submenu = $('#submenu');
  const menu = $('#menu');
  const menuList = $('#menu-list');
  const btnMenu = $('#btn-menu');
  const astrosPanel = $('#astros-panel');
  const btnAstros = $('#btn-astros');
  const byId = Object.fromEntries(bodies.map((b) => [b.id, b]));
  const groupByPlanetId = Object.fromEntries(groups.map((g) => [g.planet.id, g]));
  const parentOfMoon = {};
  for (const g of groups) for (const mn of g.moons) parentOfMoon[mn.id] = g;
  let paused = false, orbitsVisible = true, hintShown = true, expandedPlanet = null;

  const isMobile = () => window.innerWidth <= 760;

  function hideHint() { if (hintShown) { hintShown = false; $('#hint').classList.add('gone'); } }
  function setActiveButton(id) {
    root.querySelectorAll('.qbtn').forEach((btn) => btn.classList.toggle('active', btn.dataset.id === id));
  }
  function setCollapsed(c) {
    panel.classList.toggle('collapsed', c);
    head.setAttribute('aria-expanded', String(!c));
  }
  function toggleCollapsed() { setCollapsed(!panel.classList.contains('collapsed')); }

  // ---- menu suspenso (hamburguer) ----
  function setMenuOpen(o) {
    menuList.classList.toggle('open', o);
    btnMenu.setAttribute('aria-expanded', String(o));
  }
  function toggleMenu() { setMenuOpen(!menuList.classList.contains('open')); }

  // ---- menu "Astros" ----
  function setAstrosOpen(o) {
    astrosPanel.classList.toggle('open', o);
    btnAstros.setAttribute('aria-expanded', String(o));
    btnAstros.classList.toggle('active', o);
  }
  function toggleAstros() { setAstrosOpen(!astrosPanel.classList.contains('open')); }

  // ---- submenu de luas ----
  function openSubmenu(g) {
    submenu.innerHTML = '<span class="submenu-label">Luas de ' + g.planet.name + '</span>' +
      g.moons.map((mn) =>
        '<button class="qbtn moon" data-id="' + mn.id + '" style="--accent:' + mn.color + '">' + mn.name + '</button>'
      ).join('');
    submenu.querySelectorAll('.qbtn.moon').forEach((b) =>
      b.addEventListener('click', () => onFocus(byId[b.dataset.id])));
    submenu.classList.add('open');
    expandedPlanet = g.planet.id;
  }
  function closeSubmenu() {
    submenu.classList.remove('open');
    submenu.innerHTML = '';
    expandedPlanet = null;
  }
  function ensureSubmenu(g) { if (expandedPlanet !== g.planet.id) openSubmenu(g); }

  function showInfo(body) {
    panel.style.setProperty('--accent', body.color);
    $('#p-name').textContent = body.name;
    $('#p-type').textContent = body.type;
    $('#p-info').innerHTML = body.info.map(([label, value]) =>
      '<div class="info-row"><span class="info-label">' + label + '</span><span class="info-value">' + value + '</span></div>'
    ).join('');
    $('#p-fact').textContent = body.fact;
    panel.classList.add('open');
    // no celular abre RECOLHIDO (so o nome) para o astro ficar visivel; no desktop, expandido
    setCollapsed(isMobile());
    // garante que a lista de astros esteja aberta para mostrar o submenu de luas
    const g = groupByPlanetId[body.id];
    if (g) { if (g.moons.length) { setAstrosOpen(true); ensureSubmenu(g); } else closeSubmenu(); }
    else { const pg = parentOfMoon[body.id]; if (pg) { setAstrosOpen(true); ensureSubmenu(pg); } }
    setActiveButton(body.id);
    hideHint();
  }

  function hide() {
    panel.classList.remove('open');
    setCollapsed(true);
    setActiveButton(null);
    closeSubmenu();
  }

  // ---- eventos ----
  root.querySelectorAll('.quickbar .qbtn').forEach((btn) =>
    btn.addEventListener('click', () => onFocus(byId[btn.dataset.id])));

  head.addEventListener('click', toggleCollapsed);
  head.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCollapsed(); }
  });

  // PILOTAR -> entra no modo nave (callback do main.js)
  if (typeof onFly === 'function') {
    $('#go-fly').addEventListener('click', () => onFly());
  }

  // menu hamburguer abre/fecha
  btnMenu.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
  document.addEventListener('pointerdown', (e) => {
    if (menuList.classList.contains('open') && !menu.contains(e.target)) setMenuOpen(false);
  });

  // menu "Astros" abre/fecha
  btnAstros.addEventListener('click', () => toggleAstros());

  // itens do menu (em texto, sem simbolos)
  $('#btn-reset').addEventListener('click', () => { setMenuOpen(false); hide(); onReset(); });

  $('#btn-pause').addEventListener('click', () => {
    paused = !paused;
    $('#btn-pause').innerHTML = paused ? 'Continuar' : 'Pausar';
    $('#btn-pause').classList.toggle('active', paused);
    onTogglePause(paused);
    setMenuOpen(false);
  });
  $('#btn-orbits').addEventListener('click', () => {
    orbitsVisible = !orbitsVisible;
    $('#btn-orbits').innerHTML = orbitsVisible ? 'Desativar trajet&oacute;ria' : 'Ativar trajet&oacute;ria';
    $('#btn-orbits').classList.toggle('active', !orbitsVisible);
    onToggleOrbits(orbitsVisible);
    setMenuOpen(false);
  });
  $('#btn-diagram').addEventListener('click', () => { setMenuOpen(false); onToggleDiagram(); });

  // TOUR guiado (esconde a HUD e a camera passeia pelos astros)
  $('#btn-tour').addEventListener('click', () => { setMenuOpen(false); if (typeof onTour === 'function') onTour(); });

  function setDiagramActive(v) {
    const b = $('#btn-diagram');
    b.classList.toggle('active', v);
    b.innerHTML = v ? 'Sair do diagrama' : 'Modo diagrama';
  }

  return { showInfo, hide, hideHint, setDiagramActive };
}
