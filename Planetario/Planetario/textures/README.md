# Pasta textures/

Atualmente o projeto gera TODAS as texturas de forma **procedural** (em `js/procedural.js`),
sem depender de nenhum arquivo de imagem. Isso mantem o projeto leve e evita
problemas de CORS ao abrir localmente.

## Como usar texturas reais (ex.: NASA) no futuro

1. Coloque os arquivos aqui, por exemplo: `textures/mercurio.jpg`, `textures/mercurio_normal.jpg`.
2. No modulo do astro (ex.: `objects/mercury.js`), troque a textura procedural:

```js
import * as THREE from 'three';
const loader = new THREE.TextureLoader();
const map = loader.load('textures/mercurio.jpg');
map.colorSpace = THREE.SRGBColorSpace;        // mapa de cor usa sRGB
const normalMap = loader.load('textures/mercurio_normal.jpg'); // normal NAO usa sRGB
```

3. Boas fontes gratuitas: NASA 3D Resources, Solar System Scope (texturas CC),
   e USGS Astrogeology.
