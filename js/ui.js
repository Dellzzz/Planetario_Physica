// =============================================================================
// ui.js
// Interface educacional (HUD). A barra de selecao mostra apenas Sol + planetas;
// ao escolher um planeta, a camera VIAJA ate ele e abre um SUBMENU com as suas
// luas. Escolher uma lua faz a camera viajar ate ela.
// O painel funciona como menu suspenso (cabecalho com seta expande/recolhe).
// =============================================================================

export function createUI({ root, bodies, groups, onFocus, onReset, onTogglePause, onToggleOrbits }) {
  // barra superior de selecao: apenas Sol + planetas (planetas com luas ganham uma seta)
  const quick = groups.map((g) =>
    '<button class="qbtn" data-id="' + g.planet.id + '" style="--accent:' + g.planet.color + '">' +
    g.planet.name + (g.moons.length ? ' <span class="qbtn-caret" aria-hidden="true">&#9662;</span>' : '') +
    '</button>'
  ).join('');

  root.innerHTML = [
    '<div class="topbar">',
    '  <div class="brand">',
    '    <span class="brand-dot"></span>',
    '    <span class="brand-title">PLANETARIO VIRTUAL</span>',
    '    <span class="brand-sub">Sistema Solar</span>',
    '  </div>',
    '  <div class="controls">',
    '    <button class="ctrl-btn" id="btn-orbits" title="Mostrar/ocultar orbitas" aria-label="Orbitas">&#9678;</button>',
    '    <button class="ctrl-btn" id="btn-pause" title="Pausar/continuar" aria-label="Pausar">&#10073;&#10073;</button>',
    '    <button class="ctrl-btn" id="btn-reset" title="Voltar (resetar visao)" aria-label="Resetar">&#8635;</button>',
    '  </div>',
    '</div>',
    '<div class="quickbar">' + quick + '</div>',
    '<div class="submenu" id="submenu" aria-label="Luas do planeta selecionado"></div>',
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
    '<div class="hint" id="hint">Toque em um planeta para viajar ate ele &nbsp;&bull;&nbsp; arraste para girar &nbsp;&bull;&nbsp; pince para aproximar</div>',
  ].join('');

  const $ = (s) => root.querySelector(s);
  const panel = $('#panel');
  const head = $('#panel-head');
  const submenu = $('#submenu');
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
    // submenu primeiro (para os botoes ja existirem), depois marca o botao ativo
    const g = groupByPlanetId[body.id];
    if (g) { if (g.moons.length) ensureSubmenu(g); else closeSubmenu(); }
    else { const pg = parentOfMoon[body.id]; if (pg) ensureSubmenu(pg); }
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

  $('#btn-reset').addEventListener('click', () => { hide(); onReset(); });

  $('#btn-pause').addEventListener('click', () => {
    paused = !paused;
    $('#btn-pause').innerHTML = paused ? '&#9654;' : '&#10073;&#10073;';
    $('#btn-pause').classList.toggle('active', paused);
    onTogglePause(paused);
  });
  $('#btn-orbits').addEventListener('click', () => {
    orbitsVisible = !orbitsVisible;
    $('#btn-orbits').classList.toggle('active', !orbitsVisible);
    onToggleOrbits(orbitsVisible);
  });

  return { showInfo, hide, hideHint };
}
