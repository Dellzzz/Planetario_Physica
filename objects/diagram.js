// =============================================================================
// objects/diagram.js
// MODO DIAGRAMA: alinha o Sol + planetas em uma fileira (estilo poster),
// congelando as orbitas. Ao selecionar um astro, todos voltam suavemente as
// suas posicoes/orbitas e a camera foca o escolhido.
//
// Estados: 'off' -> 'enter' (animando para a fileira) -> 'on' (parado) ->
//          'exit' (voltando as orbitas) -> 'off'.
// Enquanto ativo, o main NAO chama body.update (as orbitas ficam congeladas);
// quem posiciona os astros e este controlador.
// =============================================================================

import * as THREE from 'three';

export function createDiagram({ planets, getCamera, cameraFocus, sunLight, setAuxVisible, onFocusBody, onReset }) {
  const DUR = 1.5; // duracao das transicoes (s)
  const items = planets.map((b) => ({
    body: b,
    radius: b.radius || 1,
    lineupPos: new THREE.Vector3(),
    orbitPos: new THREE.Vector3(),
    startPos: new THREE.Vector3(),
  }));
  let mode = 'off', t = 0, pendingFocus = null;
  const _view = { target: new THREE.Vector3(), pos: new THREE.Vector3() };
  const ease = (x) => x * x * (3 - 2 * x);

  // Calcula a fileira e a posicao da camera que a enquadra (horizontal no desktop,
  // vertical no retrato/celular, para os astros nao ficarem minusculos).
  function computeLineup(camera) {
    const gap = 48, n = items.length, totalW = (n - 1) * gap, half = totalW / 2;
    const portrait = camera.aspect < 1;
    let maxR = 0;
    for (let i = 0; i < n; i++) {
      if (portrait) items[i].lineupPos.set(0, half - i * gap, 0); // Sol no topo
      else items[i].lineupPos.set(-half + i * gap, 0, 0);          // Sol a esquerda
      maxR = Math.max(maxR, items[i].radius);
    }
    const vFov = camera.fov * Math.PI / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    const sunR = items[0].radius;
    if (portrait) {
      const distV = (half + sunR + 4) / Math.tan(vFov / 2);
      const distH = (maxR + 4) / Math.tan(hFov / 2);
      const dist = Math.max(distV, distH) * 1.08;
      _view.pos.set(0, 0, dist);
    } else {
      const distH = (half + sunR + 4) / Math.tan(hFov / 2);
      const distV = (maxR + 4) / Math.tan(vFov / 2);
      const dist = Math.max(distH, distV) * 1.08;
      _view.pos.set(0, dist * 0.16, dist);
    }
    _view.target.set(0, 0, 0);
  }

  function enter() {
    if (mode === 'enter' || mode === 'on') return;
    computeLineup(getCamera());
    for (const it of items) { it.orbitPos.copy(it.body.group.position); it.startPos.copy(it.body.group.position); }
    setAuxVisible(false);              // esconde luas, orbitas, decoracoes e o brilho do Sol
    sunLight.position.copy(_view.pos); // ilumina a fileira pela frente
    mode = 'enter'; t = 0; pendingFocus = null;
    cameraFocus.flyToStatic(_view.target, _view.pos);
  }

  function exit(focusBody) {
    if (mode === 'off' || mode === 'exit') return;
    for (const it of items) it.startPos.copy(it.body.group.position);
    setAuxVisible(true);               // volta luas/orbitas/decoracoes/brilho do Sol
    sunLight.position.set(0, 0, 0);    // luz volta ao Sol (origem) para a viagem de volta
    pendingFocus = focusBody || null;
    mode = 'exit'; t = 0;
  }

  function spin(it, delta) { it.body.mesh.rotation.y += (it.body.rotationSpeed || 0) * delta; }

  function update(delta) {
    if (mode === 'off') return;
    if (mode === 'enter') {
      t += delta / DUR; const k = ease(Math.min(1, t));
      for (const it of items) { it.body.group.position.copy(it.startPos).lerp(it.lineupPos, k); spin(it, delta); }
      if (t >= 1) mode = 'on';
    } else if (mode === 'on') {
      for (const it of items) { it.body.group.position.copy(it.lineupPos); spin(it, delta); }
    } else if (mode === 'exit') {
      t += delta / DUR; const k = ease(Math.min(1, t));
      for (const it of items) { it.body.group.position.copy(it.startPos).lerp(it.orbitPos, k); spin(it, delta); }
      if (t >= 1) {
        mode = 'off';
        if (pendingFocus) onFocusBody(pendingFocus); else onReset();
        pendingFocus = null;
      }
    }
  }

  return { enter, exit, update, active: () => mode !== 'off', isOn: () => mode === 'on' };
}
