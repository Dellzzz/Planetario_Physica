/* ============================================================================
   style.css
   Identidade visual neon escura (consistente com a Plataforma da Fisica).
   Fontes: Orbitron (titulos) + Poppins (texto). Responsivo para celular.
   ============================================================================ */

:root {
  --bg: #04050d;
  --panel-bg: rgba(10, 12, 28, 0.82);
  --neon: #c44dff;
  --cyan: #2ee6ff;
  --magenta: #ff3df0;
  --text: #eaf0ff;
  --text-dim: #9aa3c7;
  --accent: #c44dff; /* sobrescrito por JS conforme o astro selecionado */
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  width: 100%; height: 100%; overflow: hidden;
  background: var(--bg); color: var(--text);
  font-family: 'Poppins', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

#scene {
  position: fixed; inset: 0; width: 100%; height: 100%; display: block;
  touch-action: none; /* evita que o navegador "roube" gestos de toque */
}

#hud-root {
  position: fixed; inset: 0; z-index: 10; pointer-events: none;
  -webkit-user-select: none; user-select: none;
  -webkit-tap-highlight-color: transparent;
}
#hud-root button { pointer-events: auto; }

/* ---------- Barra superior ---------- */
.topbar {
  position: absolute; top: 0; left: 0; right: 0;
  display: flex; align-items: center; justify-content: space-between; padding: 14px 18px;
  background: linear-gradient(180deg, rgba(4,5,13,0.85), rgba(4,5,13,0));
}
.brand { display: flex; align-items: baseline; gap: 10px; }
.brand-dot {
  width: 12px; height: 12px; border-radius: 50%; align-self: center;
  background: radial-gradient(circle at 35% 35%, #ffd9a0, #ff8a2a 60%, #b34d00);
  box-shadow: 0 0 14px rgba(255,150,40,0.9);
}
.brand-title {
  font-family: 'Orbitron', sans-serif; font-weight: 900;
  font-size: clamp(15px, 4.5vw, 22px); letter-spacing: 2px;
  color: #fff; text-shadow: 0 0 16px rgba(196,77,255,0.6);
}
.brand-sub { color: var(--text-dim); font-size: 12px; letter-spacing: 1px; }

.controls { display: flex; gap: 8px; }
.ctrl-btn {
  width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center;
  border: 1px solid rgba(196,77,255,0.4); background: rgba(20,22,44,0.6); color: var(--text);
  font-size: 18px; cursor: pointer; backdrop-filter: blur(8px); transition: all .2s ease;
}
.ctrl-btn:hover { border-color: var(--neon); box-shadow: 0 0 14px rgba(196,77,255,0.5); }
.ctrl-btn.active { background: rgba(196,77,255,0.25); border-color: var(--neon); }
.ctrl-btn:focus-visible { outline: 2px solid var(--cyan); outline-offset: 2px; }

/* ---------- Barra de selecao rapida ---------- */
.quickbar {
  position: absolute; left: 50%; transform: translateX(-50%); top: 64px;
  display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; max-width: 92vw;
  pointer-events: auto;
}
.qbtn {
  --accent: var(--neon);
  padding: 8px 16px; min-height: 40px; border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--accent) 55%, transparent);
  background: rgba(14,16,34,0.6); color: var(--text);
  font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 600;
  cursor: pointer; backdrop-filter: blur(8px); transition: all .2s ease;
}
.qbtn:hover { box-shadow: 0 0 14px color-mix(in srgb, var(--accent) 60%, transparent); }
.qbtn:focus-visible { outline: 2px solid var(--cyan); outline-offset: 2px; }
.qbtn.active {
  background: color-mix(in srgb, var(--accent) 28%, transparent); border-color: var(--accent);
  box-shadow: 0 0 18px color-mix(in srgb, var(--accent) 55%, transparent);
}

/* ---------- Painel de informacoes ---------- */
.panel {
  position: absolute; top: 50%; right: 18px; transform: translate(120%, -50%);
  width: min(360px, 84vw); max-height: 78vh; overflow-y: auto; padding: 18px;
  pointer-events: auto;
  background: var(--panel-bg); backdrop-filter: blur(16px);
  border: 1px solid var(--accent); border-radius: 18px;
  box-shadow: 0 0 30px color-mix(in srgb, var(--accent) 35%, transparent), inset 0 0 30px rgba(0,0,0,0.4);
  opacity: 0; transition: transform .5s cubic-bezier(.2,.8,.2,1), opacity .4s ease;
}
.panel.open { transform: translate(0, -50%); opacity: 1; }

.panel-head {
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
  cursor: pointer; -webkit-user-select: none; user-select: none; padding: 2px 0;
}
.panel-head:focus-visible { outline: 2px solid var(--cyan); outline-offset: 4px; border-radius: 8px; }
.panel-titles { min-width: 0; }
.chevron {
  flex: 0 0 auto; width: 36px; height: 36px; display: grid; place-items: center;
  font-size: 16px; color: var(--accent); border-radius: 10px;
  background: color-mix(in srgb, var(--accent) 14%, rgba(255,255,255,0.04));
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  transition: transform .3s ease;
}
.panel.collapsed .chevron { transform: rotate(180deg); }

/* corpo recolhivel (menu suspenso) */
.panel-body {
  overflow: hidden; max-height: 72vh; opacity: 1;
  transition: max-height .38s cubic-bezier(.2,.8,.2,1), opacity .25s ease;
}
.panel.collapsed .panel-body { max-height: 0; opacity: 0; }
.panel-title {
  font-family: 'Orbitron', sans-serif; font-weight: 700; font-size: 26px; color: #fff;
  text-shadow: 0 0 16px color-mix(in srgb, var(--accent) 80%, transparent);
}
.panel-type {
  color: var(--accent); font-size: 13px; letter-spacing: 1px; margin-top: 2px; text-transform: uppercase;
}
.close-btn {
  width: 34px; height: 34px; border-radius: 10px; flex: 0 0 auto; line-height: 1;
  border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.05);
  color: var(--text); font-size: 22px; cursor: pointer;
}
.close-btn:hover { border-color: var(--magenta); color: var(--magenta); }

.info-grid { margin-top: 16px; display: flex; flex-direction: column; gap: 2px; }
.info-row {
  display: flex; justify-content: space-between; gap: 14px; padding: 10px 4px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.info-label { color: var(--text-dim); font-size: 13px; }
.info-value { color: var(--text); font-size: 14px; font-weight: 600; text-align: right; }

.facts {
  margin-top: 16px; padding: 14px; border-radius: 12px;
  background: color-mix(in srgb, var(--accent) 10%, rgba(255,255,255,0.02));
  border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
}
.facts-title {
  font-family: 'Orbitron', sans-serif; font-size: 12px; letter-spacing: 1.5px;
  color: var(--accent); margin-bottom: 6px; text-transform: uppercase;
}
.facts div:last-child { font-size: 13.5px; line-height: 1.55; color: #d7ddf5; }

/* ---------- Dica inicial ---------- */
.hint {
  position: absolute; bottom: 22px; left: 50%; transform: translateX(-50%);
  color: var(--text-dim); font-size: 13px; text-align: center; max-width: 90vw;
  background: rgba(8,9,20,0.5); padding: 8px 16px; border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(6px); transition: opacity .6s ease;
}
.hint.gone { opacity: 0; }

/* ---------- Tela de carregamento ---------- */
#loader {
  position: fixed; inset: 0; z-index: 50; gap: 18px;
  background: radial-gradient(circle at 50% 40%, #0b1030, #04050d 70%);
  display: grid; place-content: center; justify-items: center; transition: opacity .5s ease;
}
#loader.hidden { opacity: 0; pointer-events: none; }
.loader-ring {
  width: 60px; height: 60px; border-radius: 50%;
  border: 3px solid rgba(196,77,255,0.2); border-top-color: var(--neon);
  animation: spin 0.9s linear infinite; box-shadow: 0 0 22px rgba(196,77,255,0.5);
}
.loader-text { font-family: 'Orbitron', sans-serif; letter-spacing: 2px; color: var(--text-dim); font-size: 14px; }
@keyframes spin { to { transform: rotate(360deg); } }

.panel::-webkit-scrollbar { width: 6px; }
.panel::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--accent) 50%, transparent); border-radius: 3px; }

/* ---------- Responsivo: celular ---------- */
@media (max-width: 760px) {
  .topbar { padding: 12px 14px; }
  .brand-sub { display: none; }
  .brand-title { font-size: 17px; letter-spacing: 1px; }

  /* selecao rapida no TOPO, em linha rolavel -> sempre visivel (nao fica atras do painel) */
  .quickbar {
    top: 70px; bottom: auto; left: 0; right: 0; transform: none;
    max-width: none; justify-content: flex-start; flex-wrap: nowrap;
    overflow-x: auto; gap: 8px; padding: 2px 14px 6px;
    -webkit-overflow-scrolling: touch; scrollbar-width: none;
  }
  .quickbar::-webkit-scrollbar { display: none; }
  .qbtn { flex: 0 0 auto; }

  .hint { bottom: 24px; font-size: 12px; }

  /* painel inferior mais baixo, deixando espaco para o astro acima dele */
  .panel {
    top: auto; bottom: 0; right: 0; left: 0; width: 100%; max-height: 54vh;
    transform: translateY(110%); border-radius: 20px 20px 0 0;
  }
  .panel.open { transform: translateY(0); }
  .panel-title { font-size: 22px; }
}

@media (prefers-reduced-motion: reduce) {
  .panel, .hint, #loader { transition: none; }
  .loader-ring { animation: none; }
}
