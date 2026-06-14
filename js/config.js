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
  SUN_RADIUS: 8.0,        // Sol visualmente dominante
  MERCURY_RADIUS: 0.55,   // Mercurio pequeno
  VENUS_RADIUS: 1.05,     // Venus maior que Mercurio
  MERCURY_ORBIT: 16,      // raio orbital
  VENUS_ORBIT: 24,
  EARTH_RADIUS: 1.10,     // Terra um pouco maior que Venus
  EARTH_ORBIT: 33,
  EARTH_TILT_DEG: 23.5,   // inclinacao do eixo (causa as estacoes)
  MOON_RADIUS: 0.30,      // Lua pequena
  MOON_ORBIT: 3.0,        // orbita da Lua RELATIVA a Terra
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
  extensions: ['jpg', 'png'], // adicione 'webp' aqui se usar esse formato
};
