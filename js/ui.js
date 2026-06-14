// =============================================================================
// ui.js
// Interface educacional (HUD). Gera todo o DOM dentro de um elemento raiz,
// exibe as informacoes do astro selecionado e os controles (orbitas, pausar,
// resetar). Inspirada em observatorios espaciais; adaptada para celular.
// =============================================================================

export function createUI({ root, bodies, onFocus, onReset, onTogglePause, onToggleOrbits }) {
  // botoes de selecao rapida, gerados a partir da lista de corpos
  const quick = bodies.map((b) =>
    '<button class="qbtn" data-id="' + b.id + '" style="--accent:' + b.color + '">' + b.name + '</button>'
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
    '    <button class="ctrl-btn" id="btn-reset" title="Resetar visao" aria-label="Resetar">&#8635;</button>',
    '  </div>',
    '</div>',
    '<div class="quickbar">' + quick + '</div>',
    '<aside class="panel" id="panel" aria-live="polite">',
    '  <div class="panel-head">',
    '    <div>',
    '      <div class="panel-title" id="p-name">&mdash;</div>',
    '      <div class="panel-type" id="p-type">&mdash;</div>',
    '    </div>',
    '    <button class="close-btn" id="p-close" aria-label="Fechar">&times;</button>',
    '  </div>',
    '  <div class="panel-body">',
    '    <div class="info-grid" id="p-info"></div>',
    '    <div class="facts">',
    '      <div class="facts-title">Curiosidade</div>',
    '      <div id="p-fact"></div>',
    '    </div>',
    '  </div>',
    '</aside>',
    '<div class="hint" id="hint">Toque em um astro para explorar &nbsp;&bull;&nbsp; arraste para girar &nbsp;&bull;&nbsp; pince para aproximar</div>',
  ].join('');

  const $ = (s) => root.querySelector(s);
  const panel = $('#panel');
  const byId = Object.fromEntries(bodies.map((b) => [b.id, b]));
  let paused = false, orbitsVisible = true, hintShown = true;

  function hideHint() { if (hintShown) { hintShown = false; $('#hint').classList.add('gone'); } }
  function setActiveButton(id) {
    root.querySelectorAll('.qbtn').forEach((btn) => btn.classList.toggle('active', btn.dataset.id === id));
  }

  function showInfo(body) {
    panel.style.setProperty('--accent', body.color);
    $('#p-name').textContent = body.name;
    $('#p-type').textContent = body.type;
    $('#p-info').innerHTML = body.info.map(([label, value]) =>
      '<div class="info-row"><span class="info-label">' + label + '</span><span class="info-value">' + value + '</span></div>'
    ).join('');
    $('#p-fact').textContent = body.fact;
    panel.classList.add('open');
    setActiveButton(body.id);
    hideHint();
  }

  function hide() { panel.classList.remove('open'); setActiveButton(null); }

  // eventos
  root.querySelectorAll('.qbtn').forEach((btn) =>
    btn.addEventListener('click', () => onFocus(byId[btn.dataset.id])));
  $('#p-close').addEventListener('click', () => { hide(); onReset(); });
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
