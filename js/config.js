// =============================================================================
// config.js
// Constantes globais de escala, cores e ajustes de desempenho.
// Centraliza valores reutilizados por toda a aplicacao, facilitando o ajuste
// fino e a futura expansao (basta seguir a mesma escala ao adicionar corpos).
// =============================================================================

export const SETTINGS = {
  maxPixelRatio: 2,      // limita a densidade de pixels em telas retina (economia de GPU/bateria)
  starCountNear: 2600,   // estrelas da camada proxima
  starCountFar: 1500,    // estrelas da camada distante (gera profundidade)
  antialias: true,
};

// Escala EDUCATIVA (nao astronomica): Sol dominante, distancias confortaveis.
export const SCALE = {
  SUN_RADIUS: 36.0,        // Sol visualmente dominante
  MERCURY_RADIUS: 0.50,   // Mercurio pequeno
  VENUS_RADIUS: 1.23,     // Venus maior que Mercurio
  MERCURY_ORBIT: 50,      // raio orbital
  VENUS_ORBIT: 72,
  EARTH_RADIUS: 1.30,     // Terra um pouco maior que Venus
  EARTH_ORBIT: 95,
  EARTH_TILT_DEG: 23.5,   // inclinacao do eixo (causa as estacoes)
  MOON_RADIUS: 0.36,      // Lua pequena
  MOON_ORBIT: 3.6,        // orbita da Lua RELATIVA a Terra
  MARS_RADIUS: 0.69,      // Marte menor que a Terra
  MARS_ORBIT: 125,
  MARS_TILT_DEG: 25,      // inclinacao parecida com a da Terra
  // Luas de Marte: tamanhos EXAGERADOS para ficarem visiveis (valores reais na HUD).
  PHOBOS_RADIUS: 0.20,
  PHOBOS_ORBIT: 1.65,      // orbita RELATIVA a Marte
  DEIMOS_RADIUS: 0.155,
  DEIMOS_ORBIT: 2.7,
};

export const COLORS = {
  background: 0x04050d,
  sunLight: 0xfff2e6,
  neonPurple: '#c44dff',
  neonCyan: '#2ee6ff',
  neonMagenta: '#ff3df0',
};

// Texturas reais OPCIONAIS por convencao de nome.
// Se existir, em `basePath`, um arquivo com o nome do astro (ex.: mercurio.jpg)
// ou com o sufixo _normal (ex.: mercurio_normal.jpg), ele e carregado e aplicado
// automaticamente; caso contrario, mantem-se a textura procedural.
export const REAL_TEXTURES = {
  basePath: 'textures/',
  extensions: ['jpg', 'png', 'webp'], // adicione 'webp' aqui se usar esse formato
};
