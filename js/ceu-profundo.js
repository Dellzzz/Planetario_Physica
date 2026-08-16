// =============================================================================
// js/ceu-profundo.js
// CEU PROFUNDO: cometas, nebulosas, estrelas, galaxias e exoplanetas.
//
// Estes objetos NAO entram na cena 3D do Sistema Solar -- e proposital.
// A escala nao comporta: a estrela mais proxima ficaria a milhares de vezes a
// distancia de Netuno, e uma galaxia nao caberia em tela nenhuma. Coloca-los
// junto dos planetas passaria uma ideia ERRADA de tamanho e distancia.
//
// Entao eles vivem no CATALOGO, como verbetes com ficha propria. Cada um traz
// o campo "Visivel a olho nu" -- util para o roteiro de observacao em sala.
//
// Formato: ficha e uma lista [rotulo, valor] ja na ordem de exibicao, porque
// cada tipo de objeto pede campos diferentes (um cometa tem periodo; uma
// galaxia tem numero de estrelas; um exoplaneta tem a estrela que orbita).
// =============================================================================

export const CEU = {

  // ================================================================= COMETAS
  halley: {
    grupo: 'cometa', ordem: 1, nome: 'Cometa Halley', tipo: 'Cometa periódico', cor: '#8fe3ff',
    ficha: [
      ['Núcleo', '15 × 8 km  (uma "bola de neve suja")'],
      ['Período', '75 a 76 anos'],
      ['Última passagem', '1986'],
      ['Próxima passagem', '2061'],
      ['Composição', 'Gelo de água, gás carbônico, poeira e rocha'],
      ['Visível a olho nu', 'Sim, quando se aproxima do Sol'],
    ],
    curiosidades: [
      'Foi o primeiro cometa que se percebeu ser periódico: Edmond Halley notou, em 1705, que os cometas de 1531, 1607 e 1682 eram o mesmo objeto voltando.',
      'Ele previu o retorno para 1758 e acertou — mas morreu antes de ver, e o cometa ganhou seu nome.',
      'Aparece em registros históricos há mais de 2.000 anos; está bordado na Tapeçaria de Bayeux, de 1066.',
      'Quem tem hoje entre 39 e 40 anos pode ter visto a passagem de 1986 quando criança.',
      'A cauda aponta sempre para o lado contrário ao Sol, empurrada pelo vento solar — não fica "para trás" como a fumaça de um carro.',
    ],
  },
  halebopp: {
    grupo: 'cometa', ordem: 2, nome: 'Hale-Bopp', tipo: 'Cometa de período longo', cor: '#bfe9ff', foto: 'hale-bopp',
    ficha: [
      ['Núcleo', 'cerca de 60 km  (gigante para um cometa)'],
      ['Período', 'cerca de 2.500 anos'],
      ['Passagem', '1997'],
      ['Próxima passagem', 'por volta do ano 4380'],
      ['Visível a olho nu', 'Sim — ficou visível por 18 meses seguidos'],
    ],
    curiosidades: [
      'É considerado o cometa mais observado do século XX: ficou visível a olho nu por 18 meses.',
      'Foi descoberto em 1995 por dois astrônomos amadores, em noites separadas, sem que um soubesse do outro.',
      'Tinha duas caudas bem visíveis: uma azulada de gás e outra esbranquiçada de poeira.',
    ],
  },
  neowise: {
    grupo: 'cometa', ordem: 3, nome: 'NEOWISE', tipo: 'Cometa de período longo', cor: '#ffd9a0',
    ficha: [
      ['Núcleo', 'cerca de 5 km'],
      ['Período', 'cerca de 6.800 anos'],
      ['Passagem', 'julho de 2020'],
      ['Visível a olho nu', 'Sim, no hemisfério norte'],
    ],
    curiosidades: [
      'Foi o cometa mais brilhante das últimas duas décadas no hemisfério norte.',
      'Apareceu em plena pandemia e virou febre nas redes sociais.',
      'Foi descoberto por um telescópio espacial que procura asteroides perigosos, o NEOWISE.',
    ],
  },

  // =============================================================== NEBULOSAS
  orion: {
    grupo: 'nebulosa', ordem: 10, nome: 'Nebulosa de Órion', tipo: 'Nebulosa · berçário de estrelas', cor: '#ff9ec7',
    ficha: [
      ['Distância', '1.344 anos-luz'],
      ['Tamanho', '24 anos-luz de diâmetro'],
      ['Tipo', 'Nebulosa de emissão (gás brilhando)'],
      ['Constelação', 'Órion'],
      ['Visível a olho nu', 'Sim — a "estrela" borrada do meio da espada de Órion'],
    ],
    curiosidades: [
      'É um berçário: mais de mil estrelas estão nascendo ali dentro agora.',
      'Você já deve ter olhado para ela sem saber: fica logo abaixo das Três Marias.',
      'O gás brilha porque é excitado pela luz das estrelas jovens e quentes no centro.',
      'É a região de formação de estrelas mais próxima da Terra — nosso melhor laboratório do assunto.',
    ],
  },
  caranguejo: {
    grupo: 'nebulosa', ordem: 11, nome: 'Nebulosa do Caranguejo', tipo: 'Resto de supernova', cor: '#ffb37a', foto: 'carangueijo',
    ficha: [
      ['Distância', '6.500 anos-luz'],
      ['Tamanho', '11 anos-luz'],
      ['Origem', 'Explosão de supernova vista da Terra em 1054'],
      ['No centro', 'Um pulsar girando 30 vezes por segundo'],
      ['Visível a olho nu', 'Não (precisa de telescópio)'],
    ],
    curiosidades: [
      'A explosão que a criou foi registrada por astrônomos chineses em 1054: uma "estrela convidada" tão brilhante que era vista de dia por três semanas.',
      'O que sobrou da estrela virou uma estrela de nêutrons que gira 30 vezes por segundo.',
      'Uma colher de chá do material desse pulsar pesaria bilhões de toneladas.',
      'É a prova visível de que estrelas morrem espalhando o material de que somos feitos.',
    ],
  },
  carina: {
    grupo: 'nebulosa', ordem: 12, nome: 'Nebulosa de Carina', tipo: 'Nebulosa de emissão', cor: '#ff8fa8',
    ficha: [
      ['Distância', '7.500 anos-luz'],
      ['Tamanho', '300 anos-luz  (uma das maiores conhecidas)'],
      ['Constelação', 'Carina (Quilha)'],
      ['Visível a olho nu', 'Sim — e melhor do hemisfério SUL, como aqui no Brasil'],
    ],
    curiosidades: [
      'É bem maior e mais brilhante que a Nebulosa de Órion, mas menos famosa por só ser bem vista do hemisfério sul.',
      'Abriga Eta Carinae, uma estrela monstruosa que pode explodir como supernova a qualquer momento (em escala astronômica).',
      'Foi um dos primeiros alvos do telescópio James Webb, nas famosas "Falésias Cósmicas".',
      'Daqui do Nordeste ela aparece bem alta no céu — é uma vantagem nossa.',
    ],
  },
  helice: {
    grupo: 'nebulosa', ordem: 13, nome: 'Nebulosa da Hélice', tipo: 'Nebulosa planetária', cor: '#7fe3d0',
    ficha: [
      ['Distância', '655 anos-luz'],
      ['Tamanho', '2,9 anos-luz'],
      ['Origem', 'Uma estrela como o Sol soltando suas camadas ao morrer'],
      ['Visível a olho nu', 'Não (mas é fácil em binóculos)'],
    ],
    curiosidades: [
      'Apelidada de "Olho de Deus" pela aparência nas fotos.',
      'É o futuro do nosso Sol: daqui a uns 5 bilhões de anos ele vai soltar as camadas externas assim.',
      'O nome "planetária" confunde: não tem nada a ver com planetas. Foi dado porque, em telescópios antigos, pareciam discos como os de planetas.',
      'No centro sobra uma anã branca: o caroço quente da estrela que morreu.',
    ],
  },

  // ================================================================ ESTRELAS
  proxima: {
    grupo: 'estrela-ceu', ordem: 20, nome: 'Proxima Centauri', tipo: 'Anã vermelha · a estrela mais próxima', cor: '#ff7a52',
    ficha: [
      ['Distância', '4,24 anos-luz  (a mais próxima do Sol)'],
      ['Tamanho', '14% do raio do Sol'],
      ['Temperatura', 'cerca de 2.800 °C'],
      ['Constelação', 'Centauro'],
      ['Visível a olho nu', 'Não — apesar de ser a mais próxima, é fraca demais'],
    ],
    curiosidades: [
      'É a estrela mais próxima de nós, e mesmo assim a luz dela leva 4 anos e 3 meses para chegar aqui.',
      'Com a nave mais rápida já construída, a viagem levaria uns 6 mil anos.',
      'É tão econômica que vai viver trilhões de anos — nenhuma anã vermelha morreu ainda desde o Big Bang.',
      'Tem pelo menos um planeta na zona habitável: Proxima b.',
    ],
  },
  sirius: {
    grupo: 'estrela-ceu', ordem: 21, nome: 'Sirius', tipo: 'Estrela branco-azulada', cor: '#dbe9ff',
    ficha: [
      ['Distância', '8,6 anos-luz'],
      ['Tamanho', '1,7 vez o raio do Sol'],
      ['Temperatura', 'cerca de 9.700 °C'],
      ['Constelação', 'Cão Maior'],
      ['Visível a olho nu', 'Sim — é a estrela mais brilhante de todo o céu'],
    ],
    curiosidades: [
      'É a estrela mais brilhante do céu noturno, fácil de achar logo abaixo das Três Marias.',
      'Os egípcios previam a cheia do Nilo pelo dia em que Sirius reaparecia no céu da manhã.',
      'Na verdade são duas: Sirius A e uma anã branca companheira, Sirius B.',
      'Como fica baixa no horizonte em muitos lugares, costuma cintilar em várias cores — e é confundida com "disco voador".',
    ],
  },
  betelgeuse: {
    grupo: 'estrela-ceu', ordem: 22, nome: 'Betelgeuse', tipo: 'Supergigante vermelha', cor: '#ff6b3d',
    ficha: [
      ['Distância', 'cerca de 700 anos-luz'],
      ['Tamanho', 'cerca de 700 vezes o raio do Sol'],
      ['Temperatura', 'cerca de 3.100 °C'],
      ['Constelação', 'Órion (o ombro)'],
      ['Visível a olho nu', 'Sim — o ponto alaranjado no ombro de Órion'],
    ],
    curiosidades: [
      'Se estivesse no lugar do Sol, engoliria Mercúrio, Vênus, a Terra e Marte.',
      'Vai explodir como supernova — pode ser amanhã ou daqui a 100 mil anos.',
      'Quando explodir, ficará visível de dia e brilhará como a Lua por semanas. E não oferece perigo: está longe demais.',
      'Em 2019 escureceu tanto que se pensou em explosão iminente; era uma nuvem de poeira que ela mesma soltou.',
    ],
  },
  vycanis: {
    grupo: 'estrela-ceu', ordem: 23, nome: 'VY Canis Majoris', tipo: 'Hipergigante vermelha', cor: '#ff5a3c',
    ficha: [
      ['Distância', 'cerca de 3.900 anos-luz'],
      ['Tamanho', 'cerca de 1.400 vezes o raio do Sol'],
      ['Constelação', 'Cão Maior'],
      ['Visível a olho nu', 'Não'],
    ],
    curiosidades: [
      'É uma das maiores estrelas conhecidas: um avião a 900 km/h levaria mais de 1.100 anos para dar uma volta nela.',
      'Se estivesse no lugar do Sol, sua superfície passaria da órbita de Júpiter.',
      'Apesar do tamanho absurdo, é tão rarefeita que boa parte dela tem menos matéria que o ar que respiramos.',
    ],
  },
  polaris: {
    grupo: 'estrela-ceu', ordem: 24, nome: 'Polaris (Estrela do Norte)', tipo: 'Supergigante amarela', cor: '#fff0c4',
    ficha: [
      ['Distância', 'cerca de 433 anos-luz'],
      ['Tamanho', 'cerca de 46 vezes o raio do Sol'],
      ['Constelação', 'Ursa Menor'],
      ['Visível a olho nu', 'Não daqui do Brasil — fica abaixo do horizonte (só no hemisfério norte)'],
    ],
    curiosidades: [
      'Fica quase exatamente acima do polo norte da Terra, por isso parece parada enquanto o céu gira em volta dela.',
      'Guiou navegantes por séculos no hemisfério norte.',
      'Aqui em Potengi ela nunca aparece: estamos no hemisfério sul e ela fica abaixo do horizonte. Nosso guia é o Cruzeiro do Sul.',
      'Não é a estrela mais brilhante do céu — é apenas a mais bem posicionada.',
    ],
  },

  // ================================================================ GALAXIAS
  vialactea: {
    grupo: 'galaxia', ordem: 30, nome: 'Via Láctea', tipo: 'Galáxia espiral · a nossa', cor: '#cfe0ff',
    ficha: [
      ['Diâmetro', 'cerca de 100 mil anos-luz'],
      ['Estrelas', 'de 100 a 400 bilhões'],
      ['Nossa posição', 'num braço lateral, a 26 mil anos-luz do centro'],
      ['No centro', 'Sagittarius A*, um buraco negro de 4 milhões de sóis'],
      ['Visível a olho nu', 'Sim — a faixa esbranquiçada em noites escuras, sem lua'],
    ],
    curiosidades: [
      'O nome vem do grego: parecia leite derramado no céu.',
      'Galileu foi o primeiro a apontar a luneta para essa faixa e descobrir que ela é feita de milhões de estrelas.',
      'O Sol leva cerca de 230 milhões de anos para dar uma volta no centro da galáxia.',
      'Longe das luzes da cidade, como no sertão, ela ainda é bem visível — uma vantagem de morar no interior.',
      'Daqui a uns 4 bilhões de anos vai se fundir com a galáxia de Andrômeda.',
    ],
  },
  andromeda: {
    grupo: 'galaxia', ordem: 31, nome: 'Galáxia de Andrômeda', tipo: 'Galáxia espiral', cor: '#b6cfff',
    ficha: [
      ['Distância', '2,5 milhões de anos-luz'],
      ['Diâmetro', 'cerca de 220 mil anos-luz  (o dobro da Via Láctea)'],
      ['Estrelas', 'cerca de 1 trilhão'],
      ['Visível a olho nu', 'Sim, em céu escuro — mas fica baixa no horizonte aqui no Brasil'],
    ],
    curiosidades: [
      'É o objeto mais distante que o olho humano consegue ver sem ajuda: 2,5 milhões de anos-luz.',
      'A luz que chega hoje saiu de lá quando ainda existiam nossos ancestrais pré-humanos.',
      'Está vindo na nossa direção a 110 km/s e vai colidir com a Via Láctea daqui a uns 4 bilhões de anos.',
      'Na colisão, quase nenhuma estrela vai bater em outra: há espaço vazio demais entre elas.',
    ],
  },
  magalhaes: {
    grupo: 'galaxia', ordem: 32, nome: 'Grande Nuvem de Magalhães', tipo: 'Galáxia irregular · satélite da nossa', cor: '#dcd6ff',
    ficha: [
      ['Distância', '160 mil anos-luz'],
      ['Diâmetro', 'cerca de 14 mil anos-luz'],
      ['Estrelas', 'cerca de 30 bilhões'],
      ['Visível a olho nu', 'Sim — e SÓ do hemisfério sul'],
    ],
    curiosidades: [
      'Parece um pedaço solto da Via Láctea no céu, como uma nuvem que não sai do lugar.',
      'Só é visível do hemisfério sul: europeus e norte-americanos nunca a veem de casa.',
      'Ganhou esse nome depois que a tripulação de Fernão de Magalhães a registrou na viagem de circum-navegação.',
      'Em 1987 abrigou a supernova mais próxima observada em quase 400 anos.',
      'Povos indígenas e do sertão já conheciam essas "nuvens" muito antes dos europeus.',
    ],
  },
  sombrero: {
    grupo: 'galaxia', ordem: 33, nome: 'Galáxia do Sombrero', tipo: 'Galáxia espiral vista de perfil', cor: '#e8dcc0',
    ficha: [
      ['Distância', '31 milhões de anos-luz'],
      ['Diâmetro', 'cerca de 50 mil anos-luz'],
      ['Constelação', 'Virgem'],
      ['Visível a olho nu', 'Não (mas é fácil em telescópios pequenos)'],
    ],
    curiosidades: [
      'Ganhou o nome porque, vista de lado, parece um chapéu mexicano.',
      'A faixa escura no meio é poeira, exatamente igual à que forma as manchas escuras da Via Láctea.',
      'Vemos ela quase exatamente de perfil — é assim que a Via Láctea apareceria para alguém de fora.',
    ],
  },

  // ============================================================= EXOPLANETAS
  proximab: {
    grupo: 'exoplaneta', ordem: 40, nome: 'Proxima b', tipo: 'Exoplaneta rochoso · zona habitável', cor: '#9fd8a0',
    ficha: [
      ['Distância', '4,24 anos-luz  (o exoplaneta mais próximo)'],
      ['Estrela', 'Proxima Centauri (anã vermelha)'],
      ['Tamanho', 'cerca de 1,1 vez a Terra'],
      ['Ano', '11,2 dias'],
      ['Descoberta', '2016'],
    ],
    curiosidades: [
      'É o planeta mais próximo de nós fora do Sistema Solar — e fica na zona habitável, onde poderia existir água líquida.',
      'Como orbita muito perto de sua estrela, provavelmente mostra sempre a mesma face para ela: um lado eterno de dia, outro de noite.',
      'Anãs vermelhas soltam explosões violentas, o que pode ter arrancado a atmosfera do planeta.',
      'Mesmo sendo o "vizinho", uma sonda atual levaria dezenas de milhares de anos para chegar lá.',
    ],
  },
  trappist: {
    grupo: 'exoplaneta', ordem: 41, nome: 'TRAPPIST-1e', tipo: 'Exoplaneta rochoso · zona habitável', cor: '#8fc8e8', foto: 'TRAPPIST-1e',
    ficha: [
      ['Distância', '40 anos-luz'],
      ['Estrela', 'TRAPPIST-1 (anã ultrafria)'],
      ['Tamanho', 'cerca de 0,92 vez a Terra'],
      ['Ano', '6,1 dias'],
      ['Descoberta', '2017'],
    ],
    curiosidades: [
      'Faz parte de um sistema com SETE planetas do tamanho da Terra em volta da mesma estrela.',
      'Três deles estão na zona habitável — é o melhor conjunto conhecido para procurar vida.',
      'Do céu desse planeta, os planetas vizinhos apareceriam maiores que a nossa Lua.',
      'O sistema inteiro caberia dentro da órbita de Mercúrio.',
    ],
  },
  kepler452b: {
    grupo: 'exoplaneta', ordem: 42, nome: 'Kepler-452b', tipo: 'Exoplaneta · "primo da Terra"', cor: '#a8d5a0',
    ficha: [
      ['Distância', 'cerca de 1.400 anos-luz'],
      ['Estrela', 'Kepler-452 (parecida com o Sol)'],
      ['Tamanho', 'cerca de 1,6 vez a Terra'],
      ['Ano', '385 dias  (quase igual ao nosso)'],
      ['Descoberta', '2015'],
    ],
    curiosidades: [
      'Foi apelidado de "primo mais velho da Terra": orbita uma estrela parecida com o Sol, na zona habitável, com um ano de 385 dias.',
      'A estrela dele é 1,5 bilhão de anos mais velha que o Sol — é um vislumbre do futuro do nosso planeta.',
      'A gravidade lá seria quase o dobro da nossa: você se sentiria bem mais pesado.',
    ],
  },
  hd189733b: {
    grupo: 'exoplaneta', ordem: 43, nome: 'HD 189733 b', tipo: 'Júpiter quente', cor: '#5a8fe8',
    ficha: [
      ['Distância', '64,5 anos-luz'],
      ['Estrela', 'HD 189733'],
      ['Tamanho', 'um pouco maior que Júpiter'],
      ['Ano', '2,2 dias'],
      ['Temperatura', 'cerca de 930 °C'],
    ],
    curiosidades: [
      'De longe é de um azul lindo — mas a cor vem de partículas de silicato, ou seja, vidro.',
      'Os ventos passam de 8.000 km/h, então lá chove vidro derretido, de lado.',
      'Foi o primeiro exoplaneta a ter a cor medida diretamente.',
    ],
  },
  peg51b: {
    grupo: 'exoplaneta', ordem: 44, nome: '51 Pegasi b', tipo: 'Júpiter quente · o primeiro descoberto', cor: '#e8b87a',
    ficha: [
      ['Distância', '50 anos-luz'],
      ['Estrela', '51 Pegasi (parecida com o Sol)'],
      ['Tamanho', 'cerca de metade de Júpiter'],
      ['Ano', '4,2 dias'],
      ['Descoberta', '1995'],
    ],
    curiosidades: [
      'Foi o primeiro planeta encontrado em volta de uma estrela como o Sol — descoberta que rendeu o Nobel de Física de 2019.',
      'Bagunçou tudo o que se pensava: um gigante gasoso não deveria estar tão perto da estrela.',
      'Antes de 1995 não se conhecia NENHUM planeta fora do Sistema Solar. Hoje já passam de 5.000.',
    ],
  },

  // ========================================================== OUTROS ASTROS
  sgra: {
    grupo: 'outros', ordem: 50, nome: 'Sagitário A*', tipo: 'Buraco negro supermassivo', cor: '#ffb45e',
    ficha: [
      ['Onde fica', 'No centro da Via Láctea'],
      ['Distância', '26.000 anos-luz'],
      ['Massa', 'cerca de 4,3 milhões de vezes a do Sol'],
      ['Horizonte de eventos', 'cerca de 24 milhões de km de diâmetro'],
      ['Primeira imagem', '2022, pelo Event Horizon Telescope'],
      ['Visível a olho nu', 'Não — nem com telescópio comum'],
    ],
    curiosidades: [
      'Buraco negro não é um "buraco" nem um aspirador: é matéria tão comprimida que nem a luz consegue escapar.',
      'Se o Sol virasse um buraco negro (não vai virar), a Terra continuaria orbitando igual — só ficaria escuro e frio.',
      'O que brilha nas fotos não é o buraco negro, e sim o gás girando em volta, esmagado e aquecido a milhões de graus.',
      'A "sombra" central é o horizonte de eventos: dali para dentro, nada volta.',
      'Descobrir que ele existe rendeu o Nobel de Física de 2020, para Reinhard Genzel e Andrea Ghez.',
      'Apesar da massa gigantesca, ele é discreto: só percebemos sua presença pelas estrelas que giram em alta velocidade em volta dele.',
    ],
  },
  cinturao: {
    grupo: 'outros', ordem: 51, nome: 'Cinturão de Asteroides', tipo: 'Região do Sistema Solar', cor: '#a99b86',
    ficha: [
      ['Onde fica', 'Entre Marte e Júpiter'],
      ['Distância', 'de 330 a 480 milhões de km do Sol'],
      ['Objetos conhecidos', 'mais de 1 milhão com mais de 1 km'],
      ['Maior objeto', 'Ceres (planeta anão)'],
      ['Visível a olho nu', 'Não'],
    ],
    curiosidades: [
      'Ao contrário dos filmes, é quase vazio: as pedras estão em média a centenas de milhares de km umas das outras.',
      'Naves passam por ele sem risco nenhum de colidir.',
      'Se juntássemos todos os asteroides numa bola só, ela seria menor que a nossa Lua.',
      'Não é um planeta que explodiu: é matéria que nunca conseguiu virar planeta, por causa da gravidade de Júpiter.',
    ],
  },
  kuiperbelt: {
    grupo: 'outros', ordem: 52, nome: 'Cinturão de Kuiper', tipo: 'Região do Sistema Solar', cor: '#9aa6b8',
    ficha: [
      ['Onde fica', 'Além da órbita de Netuno'],
      ['Distância', 'de 4,5 a 7,5 bilhões de km do Sol'],
      ['Composição', 'Corpos gelados: rocha, gelo de água, metano e amônia'],
      ['Moradores famosos', 'Plutão, Haumea, Makemake, Éris'],
      ['Visível a olho nu', 'Não'],
    ],
    curiosidades: [
      'É de lá que vêm os planetas anões gelados — e boa parte dos cometas de período curto.',
      'Tritão, a maior lua de Netuno, provavelmente era um objeto do Kuiper que foi capturado.',
      'A sonda New Horizons passou por Plutão em 2015 e seguiu visitando outros corpos da região.',
    ],
  },
  oort: {
    grupo: 'outros', ordem: 53, nome: 'Nuvem de Oort', tipo: 'Região do Sistema Solar', cor: '#c3cede',
    ficha: [
      ['Onde fica', 'Envolvendo todo o Sistema Solar, como uma casca'],
      ['Distância', 'de 0,3 a 1,5 ano-luz do Sol'],
      ['Composição', 'Trilhões de corpos gelados'],
      ['Status', 'Nunca foi observada diretamente — é deduzida pelos cometas'],
      ['Visível a olho nu', 'Não'],
    ],
    curiosidades: [
      'É a fronteira real do Sistema Solar: vai quase até um terço do caminho para a estrela mais próxima.',
      'Nenhuma sonda humana chegou perto: a Voyager 1 levaria uns 300 anos só para começar a entrar nela.',
      'Os cometas de período longo, como o Hale-Bopp, vêm de lá.',
      'Ninguém nunca a viu: sabemos que existe porque é a única explicação para a origem desses cometas.',
    ],
  },
};

// Secoes do ceu profundo, na ordem em que aparecem no catalogo
export const SECOES_CEU = [
  { id: 'cometa',      rotulo: 'Cometas' },
  { id: 'nebulosa',    rotulo: 'Nebulosas' },
  { id: 'estrela-ceu', rotulo: 'Outras estrelas' },
  { id: 'galaxia',     rotulo: 'Galáxias' },
  { id: 'exoplaneta',  rotulo: 'Exoplanetas' },
  { id: 'outros',      rotulo: 'Outros astros' },
];

// Preenche o painel lateral dos astros que TEM maquete 3D (Sagitario A*, Halley,
// Andromeda, Orion, Proxima). Sem isto, o painel abre com o espaco vazio.
export function aplicarDadosCeu(bodies) {
  for (const b of bodies) {
    const c = CEU[b.id];
    if (!c) continue;
    b.dadosCeu = c;
    b.info = (c.ficha || []).slice();
    if (c.curiosidades && c.curiosidades.length) {
      b.fact = c.curiosidades[0];
      b.curiosidades = c.curiosidades;
    }
  }
}
