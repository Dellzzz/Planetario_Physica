// =============================================================================
// js/dados.js
// FICHA TECNICA de todos os astros, em um so lugar.
//
// Por que um arquivo central? Cada astro ja nasce no seu proprio modulo em
// objects/, mas as informacoes ficavam espalhadas e com campos diferentes.
// Aqui elas sao PADRONIZADAS: todo astro tem inclinacao axial, distancia media,
// diametro, gravidade, atmosfera e uma lista de curiosidades.
//
// aplicarDados() reescreve body.info e body.fact a partir daqui, entao o painel
// lateral, o catalogo e o tour mostram sempre a mesma coisa.
// =============================================================================

// grupo: usado pelo catalogo para separar em secoes
export const DADOS = {
  // ---------------------------------------------------------------- ESTRELA
  sol: {
    grupo: 'estrela', ordem: 0,
    inclinacao: '7,25°', distancia: '—  (é o centro)', diametro: '1.392.700 km',
    gravidade: '274 m/s²', atmosfera: 'Coroa solar (hidrogênio e hélio ionizados)',
    translacao: '—', temperatura: '5.500 °C na superfície · 15 milhões °C no núcleo',
    curiosidades: [
      'Sozinho, o Sol tem 99,8% de toda a massa do Sistema Solar.',
      'Caberiam cerca de 1,3 milhão de Terras dentro dele.',
      'A luz que sai dele leva 8 minutos e 20 segundos para chegar até nós.',
      'Ele não está queimando: no núcleo, núcleos de hidrogênio se fundem em hélio.',
    ],
  },

  // -------------------------------------------------------- PLANETAS ROCHOSOS
  mercurio: {
    grupo: 'rochoso', ordem: 1,
    inclinacao: '0,03°  (praticamente sem inclinação)', distancia: '57,9 milhões de km', diametro: '4.879 km',
    gravidade: '3,7 m/s²', atmosfera: 'Praticamente nenhuma (traços de oxigênio e sódio)',
    translacao: '88 dias', temperatura: '430 °C de dia · −180 °C à noite',
    curiosidades: [
      'É o menor planeta e o mais próximo do Sol.',
      'Sem atmosfera para segurar o calor, tem a maior diferença de temperatura entre dia e noite.',
      'Um dia em Mercúrio dura 59 dias terrestres — mais da metade do seu ano.',
      'Apesar do calor, há gelo de água no fundo de crateras nos polos, onde o Sol nunca bate.',
    ],
  },
  venus: {
    grupo: 'rochoso', ordem: 2,
    inclinacao: '177,4°  (gira ao contrário)', distancia: '108,2 milhões de km', diametro: '12.104 km',
    gravidade: '8,9 m/s²', atmosfera: 'Densíssima: 96% gás carbônico, nuvens de ácido sulfúrico',
    translacao: '225 dias', temperatura: '460 °C  (constante, dia e noite)',
    curiosidades: [
      'É o planeta mais quente do Sistema Solar — mais que Mercúrio, que fica bem mais perto do Sol.',
      'A culpa é do efeito estufa descontrolado: o gás carbônico segura o calor e não deixa escapar.',
      'Em Vênus, o dia dura mais que o ano: ele gira em 243 dias e orbita o Sol em 225.',
      'Gira ao contrário de quase todos os outros: lá o Sol nasce no oeste.',
      'A pressão na superfície é 90 vezes a da Terra — como estar a 900 m de profundidade no mar.',
    ],
  },
  terra: {
    grupo: 'rochoso', ordem: 3,
    inclinacao: '23,5°  (é ela que cria as estações)', distancia: '149,6 milhões de km', diametro: '12.742 km',
    gravidade: '9,8 m/s²', atmosfera: '78% nitrogênio, 21% oxigênio, 1% outros gases',
    translacao: '365 dias e 6 horas', temperatura: '−89 °C a 57 °C  (média de 15 °C)',
    curiosidades: [
      'É o único lugar conhecido com água líquida na superfície — e com vida.',
      'Aquelas 6 horas que sobram a cada ano viram um dia a mais em fevereiro: o ano bissexto.',
      'A inclinação de 23,5° do eixo é a causa das estações do ano — não a distância até o Sol.',
      'Gira a mais de 1.600 km/h na linha do equador, e não sentimos nada porque tudo se move junto.',
      'O campo magnético do planeta nos protege do vento solar.',
    ],
  },
  marte: {
    grupo: 'rochoso', ordem: 4,
    inclinacao: '25,2°  (parecida com a da Terra)', distancia: '227,9 milhões de km', diametro: '6.779 km',
    gravidade: '3,7 m/s²', atmosfera: 'Rarefeita: 95% gás carbônico (1% da pressão da Terra)',
    translacao: '687 dias', temperatura: '−140 °C a 20 °C',
    curiosidades: [
      'A cor vermelha vem do óxido de ferro — literalmente ferrugem no solo.',
      'Abriga o Monte Olimpo, o maior vulcão do Sistema Solar: 22 km de altura, quase 3 Everestes.',
      'Como a inclinação é parecida com a nossa, Marte também tem estações do ano.',
      'Um dia marciano dura 24h37min — quase igual ao nosso.',
      'Há muito tempo tinha rios e lagos; hoje resta água congelada nos polos e no subsolo.',
    ],
  },

  // ---------------------------------------------------------- GIGANTES GASOSOS
  jupiter: {
    grupo: 'gigante', ordem: 5,
    inclinacao: '3,1°  (quase sem estações)', distancia: '778,5 milhões de km', diametro: '139.820 km',
    gravidade: '24,8 m/s²', atmosfera: 'Hidrogênio e hélio — sem superfície sólida onde pisar',
    translacao: '11,9 anos', temperatura: '−110 °C no topo das nuvens',
    curiosidades: [
      'É o maior planeta: caberiam mais de 1.300 Terras dentro dele.',
      'A Grande Mancha Vermelha é uma tempestade maior que a Terra, girando há mais de 300 anos.',
      'Apesar do tamanho, tem o dia mais curto: gira sobre si mesmo em apenas 10 horas.',
      'Tem mais de 90 luas conhecidas — um verdadeiro sistema solar em miniatura.',
      'Sua gravidade enorme desvia cometas e protege a Terra de muitos impactos.',
    ],
  },
  saturn: {
    grupo: 'gigante', ordem: 6,
    inclinacao: '26,7°  (define a inclinação dos anéis)', distancia: '1,43 bilhão de km', diametro: '116.460 km',
    gravidade: '10,4 m/s²', atmosfera: 'Hidrogênio e hélio, com nuvens de amônia',
    translacao: '29,5 anos', temperatura: '−140 °C no topo das nuvens',
    curiosidades: [
      'Os anéis são feitos de bilhões de pedaços de gelo e rocha, do tamanho de grãos a casas.',
      'Apesar de terem 280.000 km de ponta a ponta, os anéis têm só cerca de 10 metros de espessura.',
      'É tão pouco denso que flutuaria numa banheira gigante de água.',
      'A cada 15 anos os anéis ficam de perfil e quase somem quando vistos da Terra.',
      'No polo norte existe uma tempestade em formato de hexágono perfeito.',
    ],
  },

  // ---------------------------------------------------------- GIGANTES DE GELO
  uranus: {
    grupo: 'gelo', ordem: 7,
    inclinacao: '97,8°  (gira deitado de lado)', distancia: '2,87 bilhões de km', diametro: '50.724 km',
    gravidade: '8,7 m/s²', atmosfera: 'Hidrogênio, hélio e metano (o metano dá a cor azulada)',
    translacao: '84 anos', temperatura: '−195 °C',
    curiosidades: [
      'Gira deitado: o eixo está quase no plano da órbita, provavelmente após uma colisão gigante.',
      'Por causa disso, cada polo passa 42 anos no sol e 42 anos no escuro.',
      'Foi o primeiro planeta descoberto com telescópio, por William Herschel em 1781.',
      'A cor azul-esverdeada vem do metano, que absorve a luz vermelha.',
      'Também tem anéis, mas finos e escuros — bem diferentes dos de Saturno.',
    ],
  },
  neptune: {
    grupo: 'gelo', ordem: 8,
    inclinacao: '28,3°', distancia: '4,50 bilhões de km', diametro: '49.244 km',
    gravidade: '11,2 m/s²', atmosfera: 'Hidrogênio, hélio e metano',
    translacao: '165 anos', temperatura: '−200 °C',
    curiosidades: [
      'Tem os ventos mais fortes conhecidos: chegam a 2.000 km/h.',
      'Foi descoberto "na ponta do lápis": calcularam onde ele deveria estar antes de vê-lo.',
      'Desde que foi descoberto, em 1846, ainda não completou uma volta ao redor do Sol.',
      'É tão distante que a luz do Sol leva mais de 4 horas para chegar lá.',
    ],
  },

  // ----------------------------------------------------------- PLANETAS ANOES
  plutao: {
    grupo: 'anao', ordem: 9,
    inclinacao: '122,5°  (também gira deitado)', distancia: '5,91 bilhões de km', diametro: '2.377 km',
    gravidade: '0,62 m/s²', atmosfera: 'Tênue, de nitrogênio — congela e desaparece quando se afasta do Sol',
    translacao: '248 anos', temperatura: '−230 °C',
    curiosidades: [
      'Foi considerado o 9º planeta de 1930 até 2006, quando virou planeta anão.',
      'Não foi rebaixado por ser pequeno: é porque não "limpou" sua órbita, que divide com milhares de corpos gelados.',
      'Tem uma planície gelada em formato de coração, a Tombaugh Regio.',
      'Sua órbita é tão alongada que, por 20 anos de cada volta, ele fica mais perto do Sol que Netuno.',
      'É menor que a nossa Lua.',
    ],
  },
  caronte: {
    grupo: 'anao', ordem: 10,
    inclinacao: '0°  (rotação sincronizada)', distancia: '19.640 km de Plutão', diametro: '1.212 km',
    gravidade: '0,29 m/s²', atmosfera: 'Nenhuma',
    translacao: '6,4 dias', temperatura: '−220 °C',
    curiosidades: [
      'É tão grande em relação a Plutão que os dois giram em torno de um ponto no espaço, entre eles.',
      'Por isso muitos chamam a dupla de "planeta anão duplo".',
      'Plutão e Caronte mostram sempre a mesma face um para o outro, como dois dançarinos de mãos dadas.',
    ],
  },
  ceres: {
    grupo: 'anao', ordem: 11,
    inclinacao: '4°', distancia: '413 milhões de km', diametro: '939 km',
    gravidade: '0,27 m/s²', atmosfera: 'Quase nenhuma (vapor de água ocasional)',
    translacao: '4,6 anos', temperatura: '−105 °C',
    curiosidades: [
      'É o maior objeto do cinturão de asteroides e o único planeta anão dentro da órbita de Netuno.',
      'Quando foi descoberto, em 1801, chegou a ser considerado um planeta.',
      'Tem manchas brancas brilhantes de sal na cratera Occator, que intrigaram os cientistas.',
      'Pode ter água congelada em quantidade maior que toda a água doce da Terra.',
    ],
  },
  haumea: {
    grupo: 'anao', ordem: 12,
    inclinacao: '—', distancia: '6,45 bilhões de km', diametro: '1.632 km no eixo maior',
    gravidade: '0,4 m/s²', atmosfera: 'Nenhuma',
    translacao: '284 anos', temperatura: '−240 °C',
    curiosidades: [
      'Tem formato de bola de rúgbi: gira tão rápido que ficou achatado.',
      'Um dia lá dura menos de 4 horas — a rotação mais rápida entre os corpos grandes do Sistema Solar.',
      'É o único planeta anão conhecido com anéis.',
      'O nome vem da deusa havaiana da fertilidade.',
    ],
  },
  makemake: {
    grupo: 'anao', ordem: 13,
    inclinacao: '—', distancia: '6,85 bilhões de km', diametro: '1.430 km',
    gravidade: '0,5 m/s²', atmosfera: 'Nenhuma detectada',
    translacao: '306 anos', temperatura: '−240 °C',
    curiosidades: [
      'Sua superfície é coberta de metano e etano congelados.',
      'O nome vem do deus criador do povo Rapa Nui, da Ilha de Páscoa.',
      'Foi descoberto pouco depois da Páscoa de 2005 — daí a homenagem.',
    ],
  },
  eris: {
    grupo: 'anao', ordem: 14,
    inclinacao: '—', distancia: '10,1 bilhões de km', diametro: '2.326 km',
    gravidade: '0,82 m/s²', atmosfera: 'Congelada na superfície (volta a ser gás quando se aproxima do Sol)',
    translacao: '558 anos', temperatura: '−240 °C',
    curiosidades: [
      'Foi a descoberta de Éris, em 2005, que provocou o rebaixamento de Plutão.',
      'Tem quase o mesmo tamanho de Plutão, mas é mais massivo que ele.',
      'Ou Éris virava o 10º planeta, ou era preciso criar uma categoria nova — nasceram os planetas anões.',
      'O nome vem da deusa grega da discórdia. Não poderia ser mais apropriado.',
    ],
  },

  // ------------------------------------------------------------------- LUAS
  lua: {
    grupo: 'lua', ordem: 20, planeta: 'Terra',
    inclinacao: '6,7°  (rotação sincronizada)', distancia: '384.400 km da Terra', diametro: '3.474 km',
    gravidade: '1,62 m/s²', atmosfera: 'Nenhuma',
    translacao: '27,3 dias', temperatura: '−170 °C a 120 °C',
    curiosidades: [
      'Mostra sempre a mesma face para nós: gira sobre si mesma no mesmo tempo em que dá a volta na Terra.',
      'O outro lado não é escuro — também recebe sol. É o lado oculto.',
      'É ela que provoca as marés dos oceanos.',
      'Ajuda a estabilizar a inclinação do eixo da Terra, mantendo nosso clima previsível.',
      'É grande demais para o tamanho da Terra: nenhum outro planeta rochoso tem lua tão grande.',
    ],
  },
  fobos: {
    grupo: 'lua', ordem: 21, planeta: 'Marte',
    inclinacao: '0°  (rotação sincronizada)', distancia: '9.376 km de Marte', diametro: '22,5 km',
    gravidade: '0,0057 m/s²', atmosfera: 'Nenhuma',
    translacao: '7,6 horas', temperatura: '−40 °C',
    curiosidades: [
      'Orbita tão rápido que, visto de Marte, nasce no oeste e se põe no leste — três vezes por dia.',
      'Está caindo lentamente sobre Marte: em uns 50 milhões de anos vai se despedaçar.',
      'A gravidade é tão fraca que um pulo forte te colocaria em órbita.',
    ],
  },
  deimos: {
    grupo: 'lua', ordem: 22, planeta: 'Marte',
    inclinacao: '0°  (rotação sincronizada)', distancia: '23.463 km de Marte', diametro: '12,4 km',
    gravidade: '0,003 m/s²', atmosfera: 'Nenhuma',
    translacao: '30,3 horas', temperatura: '−40 °C',
    curiosidades: [
      'É a menor lua conhecida de um planeta do Sistema Solar.',
      'Visto de Marte, parece apenas uma estrela um pouco mais brilhante.',
      'O nome significa "terror" em grego; Fobos significa "medo" — os filhos do deus da guerra.',
    ],
  },
  io: {
    grupo: 'lua', ordem: 23, planeta: 'Júpiter',
    inclinacao: '0°  (rotação sincronizada)', distancia: '421.700 km de Júpiter', diametro: '3.643 km',
    gravidade: '1,80 m/s²', atmosfera: 'Tênue, de dióxido de enxofre',
    translacao: '1,8 dia', temperatura: '−130 °C  (mas até 1.600 °C nos vulcões)',
    curiosidades: [
      'É o corpo mais vulcânico do Sistema Solar: tem mais de 400 vulcões ativos.',
      'A gravidade de Júpiter amassa e estica Io, e esse atrito derrete o interior.',
      'Erupções lançam material a mais de 300 km de altura.',
      'A cor amarelada vem do enxofre espalhado pelas erupções.',
    ],
  },
  europa: {
    grupo: 'lua', ordem: 24, planeta: 'Júpiter',
    inclinacao: '0,1°  (rotação sincronizada)', distancia: '671.000 km de Júpiter', diametro: '3.122 km',
    gravidade: '1,31 m/s²', atmosfera: 'Muito tênue, de oxigênio',
    translacao: '3,5 dias', temperatura: '−160 °C',
    curiosidades: [
      'Sob uma casca de gelo existe um oceano de água líquida com mais água que todos os oceanos da Terra.',
      'É um dos melhores lugares para procurar vida fora da Terra.',
      'A superfície é a mais lisa do Sistema Solar, riscada por rachaduras avermelhadas.',
      'O calor que mantém o oceano líquido vem do atrito causado pela gravidade de Júpiter.',
    ],
  },
  ganimedes: {
    grupo: 'lua', ordem: 25, planeta: 'Júpiter',
    inclinacao: '0,2°  (rotação sincronizada)', distancia: '1,07 milhão de km de Júpiter', diametro: '5.268 km',
    gravidade: '1,43 m/s²', atmosfera: 'Muito tênue, de oxigênio',
    translacao: '7,2 dias', temperatura: '−160 °C',
    curiosidades: [
      'É a maior lua do Sistema Solar — maior até que o planeta Mercúrio.',
      'É a única lua conhecida com campo magnético próprio.',
      'Também esconde um oceano salgado sob a superfície gelada.',
    ],
  },
  calisto: {
    grupo: 'lua', ordem: 26, planeta: 'Júpiter',
    inclinacao: '0°  (rotação sincronizada)', distancia: '1,88 milhão de km de Júpiter', diametro: '4.821 km',
    gravidade: '1,24 m/s²', atmosfera: 'Extremamente tênue, de gás carbônico',
    translacao: '16,7 dias', temperatura: '−140 °C',
    curiosidades: [
      'É o corpo mais craterizado do Sistema Solar: a superfície é antiquíssima.',
      'Fica longe o bastante de Júpiter para receber pouca radiação — por isso é candidata a base humana.',
      'Provavelmente também tem um oceano subterrâneo.',
    ],
  },
  dione: {
    grupo: 'lua', ordem: 27, planeta: 'Saturno',
    inclinacao: '0°  (rotação sincronizada)', distancia: '377.400 km de Saturno', diametro: '1.123 km',
    gravidade: '0,23 m/s²', atmosfera: 'Traços de oxigênio',
    translacao: '2,7 dias', temperatura: '−186 °C',
    curiosidades: [
      'É riscada por falésias de gelo brilhantes, fraturas que cortam a superfície.',
      'Pode ter um oceano líquido no interior.',
    ],
  },
  reia: {
    grupo: 'lua', ordem: 28, planeta: 'Saturno',
    inclinacao: '0°  (rotação sincronizada)', distancia: '527.000 km de Saturno', diametro: '1.527 km',
    gravidade: '0,26 m/s²', atmosfera: 'Traços de oxigênio e gás carbônico',
    translacao: '4,5 dias', temperatura: '−174 °C',
    curiosidades: [
      'É a segunda maior lua de Saturno.',
      'É feita de cerca de três quartos de gelo e um quarto de rocha.',
    ],
  },
  encelado: {
    grupo: 'lua', ordem: 29, planeta: 'Saturno',
    inclinacao: '0°  (rotação sincronizada)', distancia: '238.000 km de Saturno', diametro: '504 km',
    gravidade: '0,11 m/s²', atmosfera: 'Tênue, formada pelos próprios gêiseres (vapor de água)',
    translacao: '1,4 dia', temperatura: '−200 °C',
    curiosidades: [
      'Dispara gêiseres de água pelo polo sul, que sobem centenas de quilômetros no espaço.',
      'Essa água vem de um oceano líquido escondido sob o gelo — e alimenta um dos anéis de Saturno.',
      'A sonda Cassini voou dentro dos jatos e encontrou sal e moléculas orgânicas.',
      'É um dos lugares mais promissores para procurar vida no Sistema Solar.',
      'É a superfície mais branca e reflexiva de todo o Sistema Solar: reflete quase toda a luz que recebe.',
    ],
  },
  mimas: {
    grupo: 'lua', ordem: 30, planeta: 'Saturno',
    inclinacao: '0°  (rotação sincronizada)', distancia: '185.500 km de Saturno', diametro: '396 km',
    gravidade: '0,06 m/s²', atmosfera: 'Nenhuma',
    translacao: '22,6 horas', temperatura: '−200 °C',
    curiosidades: [
      'Ficou famosa por parecer a Estrela da Morte de Star Wars.',
      'A responsável é a cratera Herschel, com 130 km — um terço do diâmetro da lua.',
      'O impacto que a criou quase partiu Mimas ao meio.',
    ],
  },
  titan: {
    grupo: 'lua', ordem: 31, planeta: 'Saturno',
    inclinacao: '0,3°  (rotação sincronizada)', distancia: '1,22 milhão de km de Saturno', diametro: '5.150 km',
    gravidade: '1,35 m/s²', atmosfera: 'Densa: 95% nitrogênio (mais densa que a da Terra)',
    translacao: '15,9 dias', temperatura: '−179 °C',
    curiosidades: [
      'É a única lua do Sistema Solar com atmosfera densa de verdade.',
      'Tem rios, lagos e mares — mas de metano e etano líquidos, não de água.',
      'Chove metano lá, e a chuva escava vales como na Terra.',
      'A gravidade é tão baixa e o ar tão denso que uma pessoa poderia voar batendo asas presas nos braços.',
      'É a segunda maior lua do Sistema Solar, maior que Mercúrio.',
    ],
  },
  japeto: {
    grupo: 'lua', ordem: 32, planeta: 'Saturno',
    inclinacao: '0°  (rotação sincronizada)', distancia: '3,56 milhões de km de Saturno', diametro: '1.469 km',
    gravidade: '0,22 m/s²', atmosfera: 'Nenhuma',
    translacao: '79,3 dias', temperatura: '−143 °C',
    curiosidades: [
      'É a "lua yin-yang": um lado é escuro como carvão e o outro branco de gelo.',
      'Tem uma estranha cordilheira de montanhas bem em cima do equador, como uma costura.',
      'Por causa disso, seu formato lembra uma noz.',
    ],
  },
  miranda: {
    grupo: 'lua', ordem: 33, planeta: 'Urano',
    inclinacao: '0°  (rotação sincronizada)', distancia: '129.900 km de Urano', diametro: '471 km',
    gravidade: '0,08 m/s²', atmosfera: 'Nenhuma',
    translacao: '1,4 dia', temperatura: '−187 °C',
    curiosidades: [
      'Tem a maior falésia conhecida do Sistema Solar: Verona Rupes, com até 20 km de altura.',
      'Uma queda dessa falésia levaria uns 12 minutos até o chão.',
      'A superfície é uma colcha de retalhos, como se a lua tivesse sido quebrada e remontada.',
    ],
  },
  ariel: {
    grupo: 'lua', ordem: 34, planeta: 'Urano',
    inclinacao: '0°  (rotação sincronizada)', distancia: '190.900 km de Urano', diametro: '1.158 km',
    gravidade: '0,27 m/s²', atmosfera: 'Nenhuma',
    translacao: '2,5 dias', temperatura: '−213 °C',
    curiosidades: [
      'É a lua mais brilhante de Urano.',
      'Tem vales enormes que parecem ter sido esculpidos por gelo em movimento.',
    ],
  },
  umbriel: {
    grupo: 'lua', ordem: 35, planeta: 'Urano',
    inclinacao: '0°  (rotação sincronizada)', distancia: '266.000 km de Urano', diametro: '1.169 km',
    gravidade: '0,23 m/s²', atmosfera: 'Nenhuma',
    translacao: '4,1 dias', temperatura: '−213 °C',
    curiosidades: [
      'É a mais escura das grandes luas de Urano.',
      'Tem um anel brilhante misterioso no fundo de uma cratera, apelidado de "a rosquinha".',
    ],
  },
  titania: {
    grupo: 'lua', ordem: 36, planeta: 'Urano',
    inclinacao: '0°  (rotação sincronizada)', distancia: '436.300 km de Urano', diametro: '1.578 km',
    gravidade: '0,38 m/s²', atmosfera: 'Possivelmente traços de gás carbônico',
    translacao: '8,7 dias', temperatura: '−203 °C',
    curiosidades: [
      'É a maior lua de Urano.',
      'Tem cânions gigantescos, sinal de que a superfície se esticou ao congelar.',
      'O nome vem da rainha das fadas de Shakespeare — todas as luas de Urano têm nomes literários.',
    ],
  },
  oberon: {
    grupo: 'lua', ordem: 37, planeta: 'Urano',
    inclinacao: '0°  (rotação sincronizada)', distancia: '583.500 km de Urano', diametro: '1.523 km',
    gravidade: '0,35 m/s²', atmosfera: 'Nenhuma',
    translacao: '13,5 dias', temperatura: '−203 °C',
    curiosidades: [
      'É a lua mais distante de Urano entre as grandes.',
      'Tem uma montanha de 11 km de altura espiando na borda do disco.',
      'O nome vem do rei das fadas, marido de Titânia.',
    ],
  },
  proteu: {
    grupo: 'lua', ordem: 38, planeta: 'Netuno',
    inclinacao: '0°  (rotação sincronizada)', distancia: '117.600 km de Netuno', diametro: '420 km',
    gravidade: '0,07 m/s²', atmosfera: 'Nenhuma',
    translacao: '1,1 dia', temperatura: '−220 °C',
    curiosidades: [
      'É quase o maior corpo que um objeto pode ter sem virar uma esfera pela própria gravidade.',
      'Tem formato de batata, bem irregular.',
      'É tão escuro que só foi descoberto quando a Voyager 2 passou por lá, em 1989.',
    ],
  },
  tritao: {
    grupo: 'lua', ordem: 39, planeta: 'Netuno',
    inclinacao: '0°  (rotação sincronizada)', distancia: '354.800 km de Netuno', diametro: '2.707 km',
    gravidade: '0,78 m/s²', atmosfera: 'Tênue, de nitrogênio',
    translacao: '5,9 dias  (no sentido contrário!)', temperatura: '−235 °C',
    curiosidades: [
      'Orbita ao contrário do giro de Netuno — sinal de que foi capturado, não nasceu ali.',
      'Provavelmente era um planeta anão do Cinturão de Kuiper, como Plutão.',
      'Tem gêiseres que lançam nitrogênio a 8 km de altura.',
      'É um dos lugares mais frios do Sistema Solar: −235 °C.',
      'Está espiralando na direção de Netuno e um dia será despedaçado, formando anéis.',
    ],
  },
  nereida: {
    grupo: 'lua', ordem: 40, planeta: 'Netuno',
    inclinacao: '—', distancia: '5,5 milhões de km de Netuno', diametro: '340 km',
    gravidade: '0,07 m/s²', atmosfera: 'Nenhuma',
    translacao: '360 dias', temperatura: '−220 °C',
    curiosidades: [
      'Tem a órbita mais alongada de todas as luas conhecidas.',
      'A distância até Netuno varia de 1,4 milhão a 9,6 milhões de km.',
      'Provavelmente também é um corpo capturado.',
    ],
  },
};

// Rotulos e ordem dos campos da ficha tecnica (o mesmo em toda a aplicacao)
export const CAMPOS = [
  ['diametro', 'Diâmetro'],
  ['distancia', 'Distância média'],
  ['inclinacao', 'Inclinação axial'],
  ['gravidade', 'Gravidade na superfície'],
  ['translacao', 'Translação'],
  ['temperatura', 'Temperatura'],
  ['atmosfera', 'Atmosfera'],
];

// "Quanto voce pesaria la": converte a gravidade em uma comparacao concreta.
// Le o numero de gravidade (ex.: "3,7 m/s2") e compara com os 9,8 da Terra.
export function pesoRelativo(dado, massaKg = 60) {
  if (!dado || !dado.gravidade) return null;
  const m = String(dado.gravidade).replace(',', '.').match(/[\d.]+/);
  if (!m) return null;
  const g = parseFloat(m[0]);
  if (!isFinite(g) || g <= 0) return null;
  const peso = massaKg * (g / 9.8);
  const casas = peso < 1 ? 2 : (peso < 10 ? 1 : 0);
  return { g, peso, texto: peso.toFixed(casas).replace('.', ',') + ' kg' };
}

// Reescreve body.info e body.fact a partir da ficha padronizada.
// Astros ainda sem ficha mantem o que ja tinham (nada quebra).
export function aplicarDados(bodies) {
  for (const b of bodies) {
    const d = DADOS[b.id];
    if (!d) continue;
    b.dados = d;
    b.info = CAMPOS
      .filter(([k]) => d[k] && d[k] !== '—')
      .map(([k, rotulo]) => [rotulo, d[k]]);
    if (d.curiosidades && d.curiosidades.length) {
      b.fact = d.curiosidades[0];
      b.curiosidades = d.curiosidades;
    }
  }
}
