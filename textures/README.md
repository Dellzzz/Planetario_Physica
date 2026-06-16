# Pasta textures/

O projeto gera todas as texturas de forma **procedural** (em `js/procedural.js`).
Mas agora ele tambem carrega **texturas reais automaticamente** se voce colocar
os arquivos aqui com o nome certo. Se o arquivo nao existir, a textura procedural
continua sendo usada (fallback).

## Convencao de nomes (basta salvar e recarregar a pagina)

| Astro    | Mapa de cor          | Normal map                  |
|----------|----------------------|-----------------------------|
| Sol      | `sol.jpg`            | (nao usa)                   |
| Mercurio | `mercurio.jpg`       | `mercurio_normal.jpg`       |
| Venus    | `venus.jpg`          | `venus_normal.jpg`          |
| Terra    | `terra.jpg`          | `terra_normal.jpg`          |
| Lua      | `lua.jpg`            | `lua_normal.jpg`            |
| Marte    | `marte.jpg`          | `marte_normal.jpg`          |
| Fobos    | `fobos.jpg`          | `fobos_normal.jpg`          |
| Deimos   | `deimos.jpg`         | `deimos_normal.jpg`         |

> A Terra ainda aceita uma camada de nuvens separada: `terra_clouds.png` (com transparencia).

- Extensoes aceitas: `.jpg` e `.png` (para `.webp`, adicione em `REAL_TEXTURES.extensions` no `js/config.js`).
- Pode enviar so o mapa de cor, so o normal, ou os dois.
- Um arquivo ausente apenas gera um `404` no console (cosmetico) e mantem o procedural.

## Recomendacoes

- Use **mapas equiretangulares** (proporcao 2:1, projecao lat/long) para envolver a esfera sem distorcao.
- Tamanho ideal para celular: 1K ou 2K (4K+ pesa).
- O mapa de cor entra em **sRGB** e o normal map em **espaco linear** (o codigo ja faz isso).
- Se o relevo aparecer invertido, e a convencao DirectX x OpenGL do normal map:
  ajuste `normalScale` no modulo do astro (ex.: `objects/mercury.js`), invertendo o Y.

## Como adicionar para um planeta novo

No modulo do astro, declare quais arquivos ele aceita:

```js
body.realTextures = [
  { file: 'terra',        material: mat, slot: 'map',       srgb: true  },
  { file: 'terra_normal', material: mat, slot: 'normalMap', srgb: false },
];
```

Boas fontes gratuitas: NASA 3D Resources, Solar System Scope (texturas CC) e USGS Astrogeology.
