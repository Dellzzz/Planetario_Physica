// =============================================================================
// objects/blackhole.js  -  BURACO NEGRO (lente gravitacional REAL)
// -----------------------------------------------------------------------------
// Pos-processamento de tela cheia. A cena principal e renderizada num alvo
// (cor + profundidade) e um shader integra a geodesica de luz de Schwarzschild
// distorcendo a CENA REAL (planetas, estrelas, galaxia) ao redor da sombra.
// Tem sombra, disco de acrecao girando (rotacao diferencial), anel de fotons,
// Doppler/redshift, e OCLUSAO por profundidade (objetos na frente passam por cima).
//
// Tonemap: a cena vai para o alvo SEM tonemap; o ACES exato (exposicao 1.15) +
// sRGB sao aplicados aqui, identicos ao pipeline do renderer (scene.js), entao
// as cores da cena ficam iguais.
//
// Uso (main.js):
//   blackHole = createBlackHole({ position, rs, diskInner, diskOuter, diskBright, steps, noApproach });
//   blackHole.setSize(innerWidth, innerHeight, dpr);
//   renderer.toneMapping = THREE.NoToneMapping;     // a lente faz o tonemap agora
//   // no loop:  blackHole.update(dt); blackHole.renderLens(renderer, scene, camera);
//   // no resize: blackHole.setSize(innerWidth, innerHeight, dpr);
// =============================================================================
import * as THREE from 'three';

const VERT = `
in vec3 position;
in vec2 uv;
out vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
precision highp sampler2D;
out vec4 fragColor;
in vec2 vUv;

uniform sampler2D tScene;
uniform highp sampler2D tDepth;
uniform vec2  uResolution;
uniform vec3  uCamPos;
uniform mat4  uInvProjView;
uniform mat4  uProjView;
uniform vec3  uCenter;
uniform float uRs;
uniform float uDiskInner;
uniform float uDiskOuter;
uniform float uDiskBright;
uniform float uSteps;
uniform float uEffectR;
uniform float uTime;

const int MAX_STEPS = 320;
const float R_ESCAPE = 28.0;

// ---- hash / ruido / fbm ----
float hash13(vec3 p3){ p3 = fract(p3*0.1031); p3 += dot(p3, p3.zyx+31.32); return fract((p3.x+p3.y)*p3.z); }
vec3 hash33(vec3 p3){ p3 = fract(p3*vec3(0.1031,0.1030,0.0973)); p3 += dot(p3, p3.yxz+33.33); return fract((p3.xxy+p3.yxx)*p3.zyx); }
float vnoise(vec3 x){
  vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
  float n000=hash13(i+vec3(0,0,0)), n100=hash13(i+vec3(1,0,0));
  float n010=hash13(i+vec3(0,1,0)), n110=hash13(i+vec3(1,1,0));
  float n001=hash13(i+vec3(0,0,1)), n101=hash13(i+vec3(1,0,1));
  float n011=hash13(i+vec3(0,1,1)), n111=hash13(i+vec3(1,1,1));
  float nx00=mix(n000,n100,f.x), nx10=mix(n010,n110,f.x);
  float nx01=mix(n001,n101,f.x), nx11=mix(n011,n111,f.x);
  return mix(mix(nx00,nx10,f.y), mix(nx01,nx11,f.y), f.z);
}
float fbm(vec3 p){ float s=0.0,a=0.5; for(int i=0;i<5;i++){ s+=a*vnoise(p); p*=2.03; a*=0.5; } return s; }

// ceu procedural barato: so para raios que dobram para fora da tela (Einstein ring)
vec3 fallbackSky(vec3 dir){
  vec3 d=normalize(dir);
  vec3 c=vec3(0.012,0.013,0.022);
  vec3 g=d*210.0; vec3 id=floor(g); vec3 f=fract(g)-0.5; vec3 rnd=hash33(id);
  if(rnd.z>0.84){ float dd=length(f-(rnd-0.5)*0.6); float s=smoothstep(0.05,0.0,dd);
    vec3 tint=mix(vec3(0.8,0.86,1.0),vec3(1.0,0.9,0.75),rnd.y); c+=s*tint; }
  c += vec3(0.018,0.020,0.045)*smoothstep(0.45,0.95, fbm(d*3.0+5.0));
  return c;
}

// aceleracao da geodesica de luz (Schwarzschild), h2 conservado
vec3 accel(vec3 p, float h2){ float r2=max(dot(p,p),0.05); return -1.5*h2*p/pow(r2,2.5); }

// disco de acrecao + Doppler + redshift, girando (rotacao diferencial visivel)
vec3 diskEmission(vec3 hp, vec3 vAtHit, out float aOut){
  float rD=length(hp.xz);
  if(rD<uDiskInner || rD>uDiskOuter){ aOut=0.0; return vec3(0.0); }
  float t=clamp((rD-uDiskInner)/max(uDiskOuter-uDiskInner,0.001),0.0,1.0);
  vec3 hot=vec3(1.0,0.96,0.88), warm=vec3(1.0,0.62,0.26), cool=vec3(0.75,0.22,0.10);
  vec3 base=mix(hot, mix(warm,cool,smoothstep(0.25,1.0,t)), smoothstep(0.0,0.55,t));
  float ang=atan(hp.z,hp.x);
  float spin=uTime*(1.35/pow(rD,1.5));            // rotacao diferencial: interno bem mais rapido
  vec2 ring=vec2(cos(ang+spin), sin(ang+spin));
  float s1=fbm(vec3(ring*3.2, rD*0.6));
  float s2=fbm(vec3(ring*7.5, rD*1.6 + uTime*0.15));
  float bands=mix(s1, s2, 0.5);
  bands=pow(clamp(bands*1.35, 0.0, 1.6), 1.6);    // contraste -> estrias visiveis girando
  float bright=mix(1.9,0.15,t)*(0.30+1.10*bands)*uDiskBright;
  vec3 normal=vec3(0.0,1.0,0.0);
  vec3 radial=normalize(vec3(hp.x,0.0,hp.z));
  vec3 vdir=normalize(cross(normal,radial));
  float beta=clamp(sqrt(0.5/max(rD-1.0,0.35)),0.0,0.92);
  vec3 vvec=beta*vdir;
  float gamma=1.0/sqrt(1.0-beta*beta);
  vec3 nhat=normalize(-vAtHit);
  float doppler=1.0/(gamma*(1.0-dot(vvec,nhat)));
  float grav=sqrt(max(1.0-1.0/rD,0.001));
  float shift=doppler*grav;
  bright*=pow(clamp(shift,0.05,3.5),3.2);
  vec3 col=base;
  col=mix(base*vec3(1.5,0.5,0.22), base, smoothstep(0.55,1.0,shift));
  col=mix(col, base*vec3(0.55,0.85,1.7), smoothstep(1.0,1.7,shift));
  float edge=smoothstep(uDiskInner,uDiskInner+0.35,rD)*(1.0-smoothstep(uDiskOuter-1.6,uDiskOuter,rD));
  aOut=clamp(edge*0.92,0.0,1.0);
  return col*bright;
}

// ---- tonemap ACES exato (igual ao renderer) + sRGB ----
vec3 RRTAndODTFit(vec3 v){
  vec3 a = v*(v+0.0245786)-0.000090537;
  vec3 b = v*(0.983729*v+0.4329510)+0.238081;
  return a/b;
}
vec3 acesExact(vec3 color){
  const mat3 ACESInputMat = mat3(
    0.59719, 0.07600, 0.02840,
    0.35458, 0.90834, 0.13383,
    0.04823, 0.01566, 0.83777
  );
  const mat3 ACESOutputMat = mat3(
     1.60475, -0.10208, -0.00327,
    -0.53108,  1.10813, -0.07276,
    -0.07367, -0.00605,  1.07602
  );
  color *= (1.15/0.6);                 // toneMappingExposure = 1.15 (scene.js)
  color = ACESInputMat * color;
  color = RRTAndODTFit(color);
  color = ACESOutputMat * color;
  return clamp(color, 0.0, 1.0);
}
vec3 sRGBOETF(vec3 v){
  return mix(pow(v, vec3(0.41666))*1.055 - vec3(0.055), v*12.92, vec3(lessThanEqual(v, vec3(0.0031308))));
}
vec3 outc(vec3 c){ return sRGBOETF(acesExact(c)); }

// projeta uma direcao do mundo para UV da textura da cena
bool projUV(vec3 worldDir, out vec2 uvOut){
  vec4 clip = uProjView * vec4(uCamPos + worldDir*1.0e6, 1.0);
  if(clip.w <= 0.0) return false;
  vec2 ndc = clip.xy/clip.w;
  uvOut = ndc*0.5+0.5;
  return all(greaterThanEqual(uvOut, vec2(0.0))) && all(lessThanEqual(uvOut, vec2(1.0)));
}

void main(){
  vec2 uv = vUv;
  vec3 sceneCol = texture(tScene, uv).rgb;

  // raio da camera por este pixel
  vec2 ndc = uv*2.0 - 1.0;
  vec4 nP = uInvProjView * vec4(ndc, -1.0, 1.0); nP /= nP.w;
  vec4 fP = uInvProjView * vec4(ndc,  1.0, 1.0); fP /= fP.w;
  vec3 ro = uCamPos;
  vec3 rd = normalize(fP.xyz - nP.xyz);

  vec3 toC = uCenter - ro;
  float bhDist = length(toC);
  float along = dot(toC, rd);
  float b = length(cross(toC, rd));   // parametro de impacto (reta) em unidades do mundo

  // EARLY-OUT: B.N. atras da camera, ou raio passa longe -> sem lente (barato)
  if(along < 0.0 || b > uEffectR){ fragColor = vec4(outc(sceneCol), 1.0); return; }

  // OCLUSAO: objeto real claramente na frente do B.N. -> mostra o objeto
  float d = texture(tDepth, uv).r;
  float sceneDist = 1.0e9;
  if(d < 1.0){ vec4 wc = uInvProjView * vec4(ndc, d*2.0-1.0, 1.0); wc /= wc.w; sceneDist = length(wc.xyz - ro); }
  float bhFront = bhDist - uRs*uDiskOuter*1.15;
  if(sceneDist < bhFront){ fragColor = vec4(outc(sceneCol), 1.0); return; }

  // ---- raymarch da geodesica ----
  vec3 p = (ro - uCenter)/uRs;
  vec3 v = rd;
  float h2 = dot(cross(p,v), cross(p,v));
  vec3 col=vec3(0.0); float alpha=0.0; bool captured=false; float minR=1e9;
  for(int i=0;i<MAX_STEPS;i++){
    if(float(i)>=uSteps) break;
    float r=length(p); minR=min(minR,r);
    if(r<1.0){ captured=true; break; }
    float dt=clamp(0.16*(r-0.9),0.012,2.0);
    vec3 a1=accel(p,h2);
    vec3 pNew=p+v*dt+0.5*a1*dt*dt;
    vec3 a2=accel(pNew,h2);
    vec3 vNew=v+0.5*(a1+a2)*dt;
    if(p.y*pNew.y < 0.0){
      float f=p.y/(p.y-pNew.y);
      vec3 hp=mix(p,pNew,f); vec3 hv=normalize(mix(v,vNew,f));
      float da; vec3 de=diskEmission(hp,hv,da);
      if(da>0.0){ col += (1.0-alpha)*de*da; alpha += (1.0-alpha)*da; }
    }
    p=pNew; v=vNew;
    if(r>R_ESCAPE && dot(p,v)>0.0) break;
    if(alpha>0.99) break;
  }

  // fundo = CENA REAL lenteada (amostra na direcao defletida); fora da tela -> fallback
  if(!captured){
    vec2 luv;
    vec3 bg = projUV(normalize(v), luv) ? texture(tScene, luv).rgb : fallbackSky(normalize(v));
    col += (1.0-alpha)*bg;
  }
  // anel de fotons (borda brilhante)
  float ring = smoothstep(0.10,0.0,abs(minR-1.5))*(captured?0.0:1.0);
  col += vec3(1.0,0.88,0.66)*ring*0.95;

  fragColor = vec4(outc(col), 1.0);
}
`;

export function createBlackHole(opts) {
  opts = opts || {};
  const rs = opts.rs || 8;
  const diskInner = opts.diskInner || 2.3;
  const diskOuter = opts.diskOuter || 9.0;
  const pos = opts.position ? opts.position.clone() : new THREE.Vector3();

  const u = {
    tScene:       { value: null },
    tDepth:       { value: null },
    uResolution:  { value: new THREE.Vector2(1, 1) },
    uCamPos:      { value: new THREE.Vector3() },
    uInvProjView: { value: new THREE.Matrix4() },
    uProjView:    { value: new THREE.Matrix4() },
    uCenter:      { value: pos.clone() },
    uRs:          { value: rs },
    uDiskInner:   { value: diskInner },
    uDiskOuter:   { value: diskOuter },
    uDiskBright:  { value: opts.diskBright != null ? opts.diskBright : 1.0 },
    uSteps:       { value: opts.steps || 180 },
    uEffectR:     { value: rs * 15.0 },
    uTime:        { value: 0 },
  };

  const mat = new THREE.RawShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, uniforms: u, glslVersion: THREE.GLSL3,
    depthTest: false, depthWrite: false,
  });
  const fsScene = new THREE.Scene();
  const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  fsScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  let rt = null, rtW = 0, rtH = 0;
  const projView = new THREE.Matrix4(), invProjView = new THREE.Matrix4();

  function makeRT(w, h) {
    if (rt) { rt.dispose(); if (rt.depthTexture) rt.depthTexture.dispose(); }
    const depth = new THREE.DepthTexture(w, h);
    depth.format = THREE.DepthFormat; depth.type = THREE.UnsignedIntType;
    rt = new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat,
      type: THREE.HalfFloatType, depthBuffer: true, depthTexture: depth,
    });
    rtW = w; rtH = h;
  }

  return {
    position: pos,
    rs,
    noApproach: opts.noApproach || diskOuter * rs * 1.18,

    setSize(w, h, dpr) {
      const W = Math.max(2, Math.floor(w * (dpr || 1)));
      const H = Math.max(2, Math.floor(h * (dpr || 1)));
      makeRT(W, H);
      u.uResolution.value.set(W, H);
    },

    setDiskBright(x) { u.uDiskBright.value = x; },
    setRs(x) { u.uRs.value = x; u.uEffectR.value = x * 15.0; },

    update(dt) { u.uTime.value += (dt || 0); },

    // renderiza a cena no alvo e aplica a lente na tela (substitui renderer.render)
    renderLens(renderer, scene, camera) {
      if (!rt) {
        const sz = new THREE.Vector2(); renderer.getSize(sz);
        const dpr = renderer.getPixelRatio();
        makeRT(Math.max(2, Math.floor(sz.x * dpr)), Math.max(2, Math.floor(sz.y * dpr)));
        u.uResolution.value.set(rtW, rtH);
      }
      camera.updateMatrixWorld();
      projView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      invProjView.copy(projView).invert();
      u.uCamPos.value.copy(camera.position);
      u.uProjView.value.copy(projView);
      u.uInvProjView.value.copy(invProjView);
      u.tScene.value = rt.texture;
      u.tDepth.value = rt.depthTexture;
      u.uEffectR.value = u.uRs.value * 15.0;

      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(rt);
      renderer.render(scene, camera);     // 1) cena real -> alvo (cor + profundidade)
      renderer.setRenderTarget(null);
      renderer.render(fsScene, fsCam);    // 2) lente -> tela
      renderer.setRenderTarget(prev);
    },

    dispose() {
      if (rt) { rt.dispose(); if (rt.depthTexture) rt.depthTexture.dispose(); }
      mat.dispose();
    },
  };
}
