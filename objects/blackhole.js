// =============================================================================
// blackhole.js
// Buraco negro com RAYMARCHING RELATIVISTICO (metrica de Schwarzschild).
// Renderiza num billboard (sempre de frente para a camera) com geodesicas de luz
// integradas passo a passo (h2 conservado). Tem sombra, anel de fotons, disco
// dobrado, Doppler relativistico, redshift e lente gravitacional sobre um fundo
// galactico BRILHANTE embutido (para a distorcao ser sempre visivel). As bordas
// somem (alpha) para compor com a cena real.
//
//   createBlackHole({ position, rs, diskInner, diskOuter, effectRadius, glowDir,
//                     noApproach })
//   -> { group, position, rs, noApproach, update(camera, dt) }
// =============================================================================

import * as THREE from 'three';

const VERT = `
in vec3 position;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
out vec3 vWorldPos;
void main(){
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = `
precision highp float;
uniform vec3 cameraPosition;     // fornecido pelo three.js
uniform float uTime;
uniform vec3 uCenter;            // centro do buraco negro (mundo)
uniform float uRs;               // raio de Schwarzschild (mundo)
uniform float uDiskInner;
uniform float uDiskOuter;
uniform float uDiskBright;
uniform vec3 uGlowDir;           // direcao do nucleo galactico (luz de fundo)
uniform float uSteps;
in vec3 vWorldPos;
out vec4 fragColor;

const int MAX_STEPS = 320;
const float R_ESCAPE = 34.0;

// ---------------- hash / ruido ----------------
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

// ---------------- fundo: estrelas + nebulosa + NUCLEO GALACTICO brilhante ----------------
vec3 starLayer(vec3 dir, float sc, float thr){
  vec3 g=dir*sc; vec3 id=floor(g); vec3 f=fract(g)-0.5; vec3 rnd=hash33(id);
  if(rnd.z<thr) return vec3(0.0);
  vec3 off=(rnd-0.5)*0.7; float d=length(f-off);
  float core=smoothstep(0.055,0.0,d); float halo=smoothstep(0.30,0.0,d)*0.14;
  float tw=0.7+0.3*sin(uTime*2.0+rnd.x*40.0);
  vec3 tint=mix(vec3(0.75,0.84,1.0), vec3(1.0,0.88,0.7), rnd.y);
  return (core+halo)*tw*tint;
}
vec3 background(vec3 dir){
  vec3 c=vec3(0.0);
  c += starLayer(dir, 120.0, 0.55);
  c += starLayer(dir, 250.0, 0.74)*0.7;
  c += starLayer(dir, 470.0, 0.85)*0.5;
  // nebulosa (mais forte, para a lente ter o que distorcer)
  float n=fbm(dir*2.2+8.0); float n2=fbm(dir*4.5-3.0);
  vec3 neb=mix(vec3(0.02,0.016,0.05), vec3(0.13,0.05,0.24), smoothstep(0.35,0.8,n));
  neb += vec3(0.04,0.09,0.17)*smoothstep(0.5,0.95,n2);
  c += neb*0.9;
  // NUCLEO GALACTICO: forte fonte de luz atras do buraco negro (lente visivel)
  float gd = max(dot(normalize(dir), normalize(uGlowDir)), 0.0);
  float band = pow(gd, 3.0);
  float core = pow(gd, 22.0);
  c += vec3(1.0, 0.86, 0.62) * core * 2.6;            // nucleo quente intenso
  c += vec3(0.85, 0.72, 0.95) * band * 0.5;           // halo/bracos
  c += vec3(0.35, 0.5, 1.0) * pow(gd, 1.4) * 0.10;    // brilho azulado difuso
  return c;
}

// ---------------- disco de acrecao + Doppler + redshift ----------------
vec3 diskEmission(vec3 hp, vec3 vAtHit, out float aOut){
  float rD=length(hp.xz);
  if(rD<uDiskInner || rD>uDiskOuter){ aOut=0.0; return vec3(0.0); }
  float t=clamp((rD-uDiskInner)/max(uDiskOuter-uDiskInner,0.001),0.0,1.0);
  vec3 hot=vec3(1.0,0.96,0.88), warm=vec3(1.0,0.62,0.26), cool=vec3(0.75,0.22,0.10);
  vec3 base=mix(hot, mix(warm,cool,smoothstep(0.25,1.0,t)), smoothstep(0.0,0.55,t));
  float ang=atan(hp.z,hp.x); float spin=uTime*0.55/pow(rD,1.5);
  float bands=fbm(vec3(cos(ang+spin),sin(ang+spin),0.4)*rD*0.7 + vec3(0.0,0.0,uTime*0.05));
  float bright=mix(1.7,0.16,t)*(0.55+0.85*bands)*uDiskBright;
  // relativistico
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

// aceleracao da geodesica de luz (Schwarzschild), h2 conservado
vec3 accel(vec3 p, float h2){ float r2=max(dot(p,p),0.05); return -1.5*h2*p/pow(r2,2.5); }

void main(){
  vec3 ro = cameraPosition;
  vec3 dir = normalize(vWorldPos - cameraPosition);
  vec3 dir0 = dir;
  vec3 p = (ro - uCenter) / uRs;     // unidades de Rs
  vec3 v = dir;
  float h2 = dot(cross(p,v), cross(p,v));

  vec3 col=vec3(0.0); float alpha=0.0; bool captured=false; float minR=1e9;

  for(int i=0;i<MAX_STEPS;i++){
    if(float(i)>=uSteps) break;
    float r=length(p); minR=min(minR,r);
    if(r<1.0){ captured=true; break; }
    float dt=clamp(0.16*(r-0.9),0.012,1.3);
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

  float defl = 1.0 - dot(dir0, normalize(v));   // o quanto o raio entortou (forca da lente)
  if(!captured){
    vec3 bg = background(normalize(v));
    col += (1.0-alpha)*bg;
  }
  // anel de fotons
  float ring = smoothstep(0.085,0.0,abs(minR-1.5))*(captured?0.0:1.0);
  col += vec3(1.0,0.86,0.62)*ring*0.8;

  // tonemap (RawShaderMaterial: o three NAO aplica conversao de cor aqui)
  col = col/(col+vec3(0.85));
  col = pow(col, vec3(0.86));

  // alpha para compor com a cena: opaco no buraco/disco/lente forte, some longe
  float aLens = smoothstep(0.0006, 0.03, defl);
  float outA = captured ? 1.0 : max(alpha, aLens);
  fragColor = vec4(col, clamp(outA, 0.0, 1.0));
}
`;

export function createBlackHole(opts) {
  opts = opts || {};
  const rs = opts.rs || 40;
  const diskInner = opts.diskInner || 2.3;
  const diskOuter = opts.diskOuter || 9.0;
  const effectRadius = opts.effectRadius || rs * 14;
  const pos = opts.position ? opts.position.clone() : new THREE.Vector3();
  const glowDir = (opts.glowDir ? opts.glowDir.clone() : new THREE.Vector3(0, 0, -1)).normalize();

  const uniforms = {
    uTime: { value: 0 },
    uCenter: { value: pos.clone() },
    uRs: { value: rs },
    uDiskInner: { value: diskInner },
    uDiskOuter: { value: diskOuter },
    uDiskBright: { value: opts.diskBright || 1.0 },
    uGlowDir: { value: glowDir.clone() },
    uSteps: { value: opts.steps || 200 },
  };

  const mat = new THREE.RawShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, uniforms, glslVersion: THREE.GLSL3,
    transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide,
  });

  const size = effectRadius * 2.0;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  mesh.position.copy(pos);
  mesh.frustumCulled = false;
  mesh.renderOrder = 6;   // depois do fundo, antes/sobre conforme profundidade

  return {
    group: mesh,
    position: pos,
    rs,
    noApproach: opts.noApproach || diskOuter * rs * 1.18,
    update(camera, dt) {
      uniforms.uTime.value += (dt || 0);
      mesh.quaternion.copy(camera.quaternion);   // billboard: sempre de frente
    },
  };
}
