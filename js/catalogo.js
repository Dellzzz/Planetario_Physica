// =============================================================================
// js/catalogo.js
// CATALOGO DE ASTROS: uma tela cheia, navegavel, com todos os corpos do
// Sistema Solar separados por categoria, busca por nome e ficha tecnica
// completa de cada astro.
//
// Modulo AUTOSSUFICIENTE: injeta o proprio CSS, o proprio botao na barra
// superior e a propria tela. Nao mexe em ui.js nem em style.css.
//
// Uso (em js/main.js, DEPOIS de createUI):
//   import { createCatalogo } from './catalogo.js';
//   catalogo = createCatalogo({ bodies, onFocus: onSelect });
// =============================================================================

import { DADOS, CAMPOS, pesoRelativo } from './dados.js';
import { CEU, SECOES_CEU } from './ceu-profundo.js';

const SECOES_SOLAR = [
  { id: 'estrela', rotulo: 'Estrela' },
  { id: 'rochoso', rotulo: 'Rochosos' },
  { id: 'gigante', rotulo: 'Gigantes' },
  { id: 'gelo',    rotulo: 'Gigantes de gelo' },
  { id: 'anao',    rotulo: 'Anões' },
  { id: 'lua',     rotulo: 'Luas' },
];
const SECOES = [{ id: 'todos', rotulo: 'Todos' }, ...SECOES_SOLAR, ...SECOES_CEU];

// Corpos do Sistema Solar que dao para ver A OLHO NU (o resto precisa de
// instrumento). Alimenta o filtro "a olho nu", util para o roteiro de observacao.
const OLHO_NU_SOLAR = new Set(['sol', 'lua', 'mercurio', 'venus', 'marte', 'jupiter', 'saturn']);

const CSS = `
#cat-btn{font-family:'Orbitron',sans-serif;font-size:11px;letter-spacing:.6px;font-weight:700;
  color:#e9e2ff;background:rgba(196,77,255,.14);border:1px solid rgba(196,77,255,.5);
  border-radius:10px;padding:8px 12px;cursor:pointer;transition:.18s;white-space:nowrap}
#cat-btn:hover{background:rgba(196,77,255,.3);box-shadow:0 0 16px rgba(196,77,255,.4)}
#catalogo{position:fixed;inset:0;z-index:120;display:none;background:rgba(4,5,13,.96);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);overflow-y:auto;-webkit-overflow-scrolling:touch}
#catalogo.open{display:block}
.cat-wrap{max-width:1080px;margin:0 auto;padding:18px 16px 60px}
.cat-top{display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap}
.cat-title{font-family:'Orbitron',sans-serif;font-size:16px;font-weight:900;letter-spacing:1px;
  background:linear-gradient(120deg,#c44dff,#2ee6ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.cat-sub{font-family:'Poppins',sans-serif;font-size:11px;color:#8f88b5;letter-spacing:.4px}
.cat-x{margin-left:auto;width:38px;height:38px;border-radius:11px;background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.14);color:#e9e2ff;font-size:20px;cursor:pointer;line-height:1;transition:.18s}
.cat-x:hover{background:rgba(255,77,120,.25);border-color:rgba(255,77,120,.5)}
#cat-busca{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);
  border-radius:11px;padding:12px 14px;color:#efeaff;font-family:'Poppins',sans-serif;font-size:14px;margin-bottom:12px}
#cat-busca:focus{outline:none;border-color:#c44dff;box-shadow:0 0 14px rgba(196,77,255,.25)}
#cat-busca::placeholder{color:#6f6a92}
.cat-filtros{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:18px}
.cat-filtros button{font-family:'Orbitron',sans-serif;font-size:10px;letter-spacing:.5px;color:#9d97c0;
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:8px 11px;cursor:pointer;transition:.18s}
.cat-filtros button:hover{color:#efeaff;border-color:rgba(196,77,255,.5)}
.cat-filtros button.on{color:#0a0714;background:linear-gradient(120deg,#c44dff,#2ee6ff);border-color:transparent;font-weight:700}
.cat-grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:11px}
.cat-card{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.1);border-radius:14px;
  padding:15px 12px;text-align:center;cursor:pointer;transition:.2s}
.cat-card:hover{transform:translateY(-3px);border-color:var(--c);box-shadow:0 8px 26px rgba(0,0,0,.45)}
.cat-bola{width:52px;height:52px;border-radius:50%;margin:0 auto 10px;
  background:radial-gradient(circle at 34% 30%, #fff6, transparent 52%), var(--c);
  box-shadow:0 0 18px -4px var(--c), inset -7px -5px 14px rgba(0,0,0,.55)}
.cat-nome{font-family:'Orbitron',sans-serif;font-size:12.5px;font-weight:700;color:#f2eeff;margin-bottom:4px}
.cat-tipo{font-family:'Poppins',sans-serif;font-size:10px;color:#8f88b5;line-height:1.35}
.cat-vazio{text-align:center;color:#8f88b5;font-family:'Poppins',sans-serif;font-size:14px;padding:36px 0}
.cat-secao-tit{font-family:'Orbitron',sans-serif;font-size:11px;letter-spacing:1.4px;color:#c44dff;
  text-transform:uppercase;margin:22px 0 10px;padding-bottom:6px;border-bottom:1px solid rgba(196,77,255,.22)}
.cat-secao-tit:first-child{margin-top:0}
/* --- ficha do astro --- */
.cat-ficha{display:none}
.cat-ficha.open{display:block}
.cat-voltar{font-family:'Orbitron',sans-serif;font-size:10.5px;letter-spacing:.5px;color:#9d97c0;
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:9px;
  padding:9px 13px;cursor:pointer;margin-bottom:16px;transition:.18s}
.cat-voltar:hover{color:#efeaff;border-color:#c44dff}
.cat-cab{display:flex;align-items:center;gap:16px;margin-bottom:18px;flex-wrap:wrap}
.cat-cab .bola{width:74px;height:74px;border-radius:50%;flex-shrink:0;
  background:radial-gradient(circle at 34% 30%, #fff7, transparent 52%), var(--c);
  box-shadow:0 0 30px -6px var(--c), inset -9px -7px 18px rgba(0,0,0,.55)}
.cat-cab h2{font-family:'Orbitron',sans-serif;font-size:23px;font-weight:900;color:#f6f3ff;line-height:1.1}
.cat-cab .tp{font-family:'Poppins',sans-serif;font-size:12px;color:var(--c);margin-top:3px}
.cat-cab .pai{font-family:'Poppins',sans-serif;font-size:11px;color:#8f88b5;margin-top:2px}
.cat-tab{width:100%;border-collapse:collapse;margin-bottom:18px;
  border:1px solid rgba(255,255,255,.1);border-radius:12px;overflow:hidden}
.cat-tab tr{border-bottom:1px solid rgba(255,255,255,.07)}
.cat-tab tr:last-child{border-bottom:none}
.cat-tab td{padding:11px 13px;font-family:'Poppins',sans-serif;font-size:13px;vertical-align:top}
.cat-tab td.k{color:#8f88b5;font-size:11px;letter-spacing:.3px;width:42%;background:rgba(255,255,255,.02)}
.cat-tab td.v{color:#efeaff;font-weight:500}
.cat-peso{background:rgba(46,230,255,.07);border:1px solid rgba(46,230,255,.25);border-radius:12px;
  padding:14px;margin-bottom:18px;font-family:'Poppins',sans-serif;font-size:13px;color:#cfe9f5;line-height:1.6}
.cat-peso b{color:#2ee6ff;font-family:'Orbitron',sans-serif;font-size:15px}
.cat-cur-tit{font-family:'Orbitron',sans-serif;font-size:11px;letter-spacing:1.2px;color:#ffd76a;
  text-transform:uppercase;margin-bottom:9px}
.cat-cur{list-style:none;margin-bottom:20px}
.cat-cur li{position:relative;padding:8px 0 8px 24px;font-family:'Poppins',sans-serif;font-size:13.5px;
  color:#ddd8f0;line-height:1.6;border-bottom:1px solid rgba(255,255,255,.06)}
.cat-cur li:last-child{border-bottom:none}
.cat-cur li::before{content:'\\2726';position:absolute;left:0;top:9px;color:#ffd76a;font-size:12px}
.cat-ir{width:100%;font-family:'Orbitron',sans-serif;font-size:12.5px;font-weight:700;letter-spacing:.6px;
  color:#0a0714;background:linear-gradient(120deg,#c44dff,#2ee6ff);border:none;border-radius:12px;
  padding:15px;cursor:pointer;transition:.2s}
.cat-ir:hover{filter:brightness(1.1);box-shadow:0 0 26px rgba(196,77,255,.45)}
.cat-olho{position:absolute;top:8px;right:8px;font-size:12px;opacity:.85}
.cat-card{position:relative}
.cat-chip-olho{margin-left:auto}
.cat-nota{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:12px;
  padding:13px 15px;font-family:'Poppins',sans-serif;font-size:12.5px;color:#9d97c0;line-height:1.6}
.cat-nota b{color:#cfc8ea}
@media(max-width:640px){
  .cat-grade{grid-template-columns:repeat(auto-fill,minmax(126px,1fr));gap:9px}
  .cat-cab h2{font-size:19px}
  .cat-tab td{font-size:12.5px;padding:10px}
}
`;

export function createCatalogo({ bodies, onFocus }) {
  // ---- CSS proprio -----------------------------------------------------
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  // ---- botao na barra superior ----------------------------------------
  const btn = document.createElement('button');
  btn.id = 'cat-btn';
  btn.type = 'button';
  btn.textContent = 'CATÁLOGO';
  const acoes = document.querySelector('.topbar-actions');
  const flyBtn = document.getElementById('go-fly');
  if (acoes) acoes.insertBefore(btn, flyBtn || acoes.firstChild);
  else document.body.appendChild(btn);

  // ---- tela do catalogo ------------------------------------------------
  const tela = document.createElement('div');
  tela.id = 'catalogo';
  tela.innerHTML = `
    <div class="cat-wrap">
      <div class="cat-top">
        <div>
          <div class="cat-title">CATÁLOGO DE ASTROS</div>
          <div class="cat-sub" id="cat-contagem"></div>
        </div>
        <button class="cat-x" id="cat-fechar" aria-label="Fechar catálogo">&times;</button>
      </div>
      <div id="cat-lista">
        <input type="search" id="cat-busca" placeholder="Buscar astro pelo nome..." autocomplete="off">
        <div class="cat-filtros" id="cat-filtros"></div>
        <div id="cat-conteudo"></div>
      </div>
      <div class="cat-ficha" id="cat-ficha"></div>
    </div>`;
  document.body.appendChild(tela);

  const $ = (s) => tela.querySelector(s);
  const elLista = $('#cat-lista'), elFicha = $('#cat-ficha');
  const elConteudo = $('#cat-conteudo'), elBusca = $('#cat-busca'), elFiltros = $('#cat-filtros');

  // ---- lista unificada: Sistema Solar (com corpo 3D) + Ceu Profundo (verbetes)
  const lista = [];
  for (const b of bodies) {
    const d = DADOS[b.id];
    if (!d) continue;
    lista.push({
      id: b.id, nome: b.name, cor: b.color, grupo: d.grupo, ordem: d.ordem || 99,
      subtitulo: d.planeta ? ('lua de ' + d.planeta) : (b.type || ''),
      body: b, dados: d, ceu: false,
      olhoNu: OLHO_NU_SOLAR.has(b.id),
    });
  }
  for (const id of Object.keys(CEU)) {
    const c = CEU[id];
    const linhaOlho = (c.ficha || []).find((f) => f[0].indexOf('olho nu') !== -1);
    lista.push({
      id, nome: c.nome, cor: c.cor, grupo: c.grupo, ordem: c.ordem || 99,
      subtitulo: c.tipo, ficha: c.ficha, curiosidades: c.curiosidades, ceu: true,
      olhoNu: !!(linhaOlho && /^sim/i.test(linhaOlho[1])),
    });
  }
  lista.sort((a, b) => a.ordem - b.ordem);

  const qtdSolar = lista.filter((x) => !x.ceu).length;
  $('#cat-contagem').textContent =
    lista.length + ' verbetes · ' + qtdSolar + ' no Sistema Solar e ' + (lista.length - qtdSolar) + ' no céu profundo';

  let filtro = 'todos';
  let soOlhoNu = false;
  elFiltros.innerHTML = SECOES.map((s2) =>
    `<button data-f="${s2.id}"${s2.id === filtro ? ' class="on"' : ''}>${s2.rotulo}</button>`
  ).join('') + '<button id="cat-olho-btn" class="cat-chip-olho">&#128065; A olho nu</button>';

  elFiltros.querySelectorAll('button[data-f]').forEach((b) => {
    b.addEventListener('click', () => {
      filtro = b.dataset.f;
      elFiltros.querySelectorAll('button[data-f]').forEach((x) => x.classList.toggle('on', x === b));
      desenharLista();
    });
  });
  const btnOlho = elFiltros.querySelector('#cat-olho-btn');
  btnOlho.addEventListener('click', () => {
    soOlhoNu = !soOlhoNu;
    btnOlho.classList.toggle('on', soOlhoNu);
    desenharLista();
  });
  elBusca.addEventListener('input', desenharLista);

  function semAcento(s2) {
    return String(s2).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function desenharLista() {
    const termo = semAcento(elBusca.value.trim());
    const vis = lista.filter((it) => {
      if (filtro !== 'todos' && it.grupo !== filtro) return false;
      if (soOlhoNu && !it.olhoNu) return false;
      if (termo && !semAcento(it.nome).includes(termo)) return false;
      return true;
    });

    if (!vis.length) {
      elConteudo.innerHTML = '<div class="cat-vazio">Nenhum astro encontrado.</div>';
      return;
    }

    let html = '';
    if (filtro === 'todos' && !termo) {
      for (const sec of SECOES) {
        if (sec.id === 'todos') continue;
        const doGrupo = vis.filter((it) => it.grupo === sec.id);
        if (!doGrupo.length) continue;
        html += `<div class="cat-secao-tit">${sec.rotulo}</div><div class="cat-grade">`;
        html += doGrupo.map(cardHTML).join('');
        html += '</div>';
      }
    } else {
      html = '<div class="cat-grade">' + vis.map(cardHTML).join('') + '</div>';
    }
    elConteudo.innerHTML = html;
    elConteudo.querySelectorAll('.cat-card').forEach((c) => {
      c.addEventListener('click', () => abrirFicha(c.dataset.id));
    });
  }

  function cardHTML(it) {
    return `<div class="cat-card" data-id="${it.id}" style="--c:${it.cor}">
      ${it.olhoNu ? '<span class="cat-olho" title="Visível a olho nu">&#128065;</span>' : ''}
      <div class="cat-bola"></div>
      <div class="cat-nome">${it.nome}</div>
      <div class="cat-tipo">${it.subtitulo}</div>
    </div>`;
  }

  function abrirFicha(id) {
    const it = lista.find((x) => x.id === id);
    if (!it) return;

    // linhas da ficha: o Sistema Solar usa os campos padronizados de dados.js;
    // o ceu profundo traz a propria lista (cada tipo pede campos diferentes)
    const pares = it.ceu
      ? it.ficha
      : CAMPOS.filter(([k]) => it.dados[k] && it.dados[k] !== '—').map(([k, rot]) => [rot, it.dados[k]]);
    const linhas = pares.map(([k, v]) => `<tr><td class="k">${k}</td><td class="v">${v}</td></tr>`).join('');

    let blocoPeso = '';
    if (!it.ceu) {
      const pe = pesoRelativo(it.dados, 60);
      if (pe) blocoPeso = `<div class="cat-peso">
        Uma pessoa de <b>60 kg</b> aqui na Terra pesaria <b>${pe.texto}</b> em ${it.nome}.
        ${pe.g > 12 ? ' Você mal conseguiria ficar de pé.' : (pe.g < 1 ? ' Um pulinho já te lançaria longe.' : '')}
      </div>`;
    }

    const curs = (it.curiosidades || it.dados && it.dados.curiosidades || [])
      .map((c) => `<li>${c}</li>`).join('');

    const rodape = it.ceu
      ? `<div class="cat-nota">Este objeto <b>não aparece na cena 3D</b> — e isso é de propósito.
           A escala não comporta: a estrela mais próxima ficaria a milhares de vezes a distância de Netuno,
           e uma galáxia não caberia em tela nenhuma. Colocá-lo ao lado dos planetas passaria uma ideia
           errada de tamanho e distância.</div>`
      : `<button class="cat-ir" id="cat-ir">&#128640; VIAJAR ATÉ ${it.nome.toUpperCase()}</button>`;

    const paiTxt = (!it.ceu && it.dados.planeta && !semAcento(it.body.type || '').includes(semAcento(it.dados.planeta)))
      ? `<div class="pai">Satélite natural de ${it.dados.planeta}</div>` : '';

    elFicha.innerHTML = `
      <button class="cat-voltar" id="cat-voltar">&#9666; Voltar ao catálogo</button>
      <div class="cat-cab" style="--c:${it.cor}">
        <div class="bola"></div>
        <div>
          <h2>${it.nome}</h2>
          <div class="tp">${it.ceu ? it.subtitulo : (it.body.type || '')}</div>
          ${paiTxt}
        </div>
      </div>
      <table class="cat-tab">${linhas}</table>
      ${blocoPeso}
      ${curs ? `<div class="cat-cur-tit">Curiosidades</div><ul class="cat-cur">${curs}</ul>` : ''}
      ${rodape}`;

    elLista.style.display = 'none';
    elFicha.classList.add('open');
    tela.scrollTop = 0;

    elFicha.querySelector('#cat-voltar').addEventListener('click', voltarLista);
    const btnIr = elFicha.querySelector('#cat-ir');
    if (btnIr) btnIr.addEventListener('click', () => { fechar(); if (onFocus) onFocus(it.body); });
  }

  function voltarLista() {
    elFicha.classList.remove('open');
    elFicha.innerHTML = '';
    elLista.style.display = '';
    tela.scrollTop = 0;
  }

  function abrir() { desenharLista(); voltarLista(); tela.classList.add('open'); }
  function fechar() { tela.classList.remove('open'); }

  btn.addEventListener('click', abrir);
  $('#cat-fechar').addEventListener('click', fechar);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tela.classList.contains('open')) {
      if (elFicha.classList.contains('open')) voltarLista(); else fechar();
    }
  });

  desenharLista();
  return { abrir, fechar, setButtonVisible(v) { btn.style.display = v ? '' : 'none'; } };
}
