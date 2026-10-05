/**
 * Glassnote — a locally rendered, original coupe sculpture.
 * Three.js 0.180.0, MIT. RoomEnvironment is the official Three.js addon.
 * No externally authored models, textures, or website assets are used.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const COMPOSITIONS = {
  home:     { yaw: -0.12, eye: 0.30, distance: 6.75, turn: -0.18, lean: -0.018, lift: 0.00, tint: '#bb671a' },
  mode:     { yaw: 0.36,  eye: 0.62, distance: 6.70, turn: 0.60,  lean: 0.045,  lift: 0.025, tint: '#d48a35' },
  guided:   { yaw: -0.24, eye: 2.45, distance: 6.85, turn: -0.48, lean: -0.024, lift: 0.06, tint: '#ba7429' },
  results:  { yaw: 0.24,  eye: 0.43, distance: 6.45, turn: 0.40,  lean: 0.028,  lift: 0.035, tint: '#d49439' },
  recipe:   { yaw: -0.16, eye: 1.42, distance: 6.35, turn: -0.78, lean: -0.014, lift: 0.035, tint: '#b96818' },
  discover: { yaw: 0.44,  eye: 0.75, distance: 7.05, turn: 0.88,  lean: 0.035,  lift: 0.025, tint: '#b65326' },
};

const NUMERIC_KEYS = ['yaw', 'eye', 'distance', 'turn', 'lean', 'lift'];
const TAU = Math.PI * 2;
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
const AROMAS = ['citrus', 'fruit', 'floral', 'herbal', 'spice', 'coffee'];
const AROMA_COLORS = ['#cf962d', '#ac3c5e', '#8f7bb6', '#668c6c', '#b96b32', '#70402d'].map(value => new THREE.Color(value));
const AROMA_POSITIONS = [[-.68,.14],[.62,.35],[-.18,-.65],[.55,-.48],[-.73,-.38],[.04,.68]];
const NEUTRAL = new THREE.Color('#b78749');
const CREAM = new THREE.Color('#d4b69a');
const SWEET = new THREE.Color('#d39472');
const SOUR = new THREE.Color('#c8bc60');
const DARK = new THREE.Color('#62422e');
const LIGHT = new THREE.Color('#d8c393');
const IVORY = new THREE.Color('#f2efde');
const TASTES = ['sour','sweet','bitter','dry','creamy','refreshing'];
const BODY = {none:.08,low:.30,medium:.60,strong:1};
const MAX_WAVE = .075;
// Strength changes amplitude, not phase: varying frequency × accumulated time
// makes a late selection jump through many cycles during the blend.
// Shared with the shader and the floating garnish. The selected state remains
// readable after the entrance; pause retains its phase and reduced motion flattens it.
export function sampleSensoryWave(x,z,time,tastes,style,motion=1) {
  const r=Math.hypot(x,z),a=Math.atan2(z,x);
  let wave=tastes[0]*.029*Math.sin(r*13-time*3.2)
    +tastes[1]*.031*Math.sin(a*2+r*4-time*1.05)*Math.min(1,r/.3)
    +tastes[2]*.016*Math.sin(z*5-time*.6)
    +tastes[3]*.002*Math.sin(x*2-time*.4)
    +tastes[4]*.020*Math.sin(x*2.2+z*1.2-time*.65)
    +tastes[5]*.014*Math.sin(r*17-time*4.2)
    +style[0]*.026*Math.sin(x*3-time*.85)
    +style[1]*.040*Math.sin(x*1.6+z*.8-time*.85)
    +style[2]*.030*(Math.sin(x*3-time*1.25)+Math.sin(z*3+time*1.25))*.65
    +style[3]*.055*Math.sin(x*5+z*3-time*1.9);
  const total=tastes.reduce((sum,value)=>sum+value,0);
  return wave/Math.max(1,total*.85+(style[1]+style[2]+style[3])*.65+style[0]*.45)*motion;
}

// One bounded height field shared by the body, radial surface and meniscus.
// ponytail: damped waves rather than a fluid solver; a solver is warranted only
// if the application needs spilling or fluid collisions.
const WAVE_GLSL = `
  uniform vec2 uLiquidTilt;
  uniform float uLiquidRipple;
  uniform float uLiquidTime;
  uniform vec4 uSelectionPulse;
  uniform vec3 uSelectionShape;
  uniform vec2 uSelectionOrigin;
  uniform vec3 uTasteA;
  uniform vec3 uTasteB;
  uniform vec4 uSensoryStyle;
  uniform float uSignalMotion;
  float sensoryWave(vec2 p) {
    float r=length(p),a=atan(p.y,p.x),t=uLiquidTime;
    float wave=uTasteA.x*.029*sin(r*13.0-t*3.2)
      +uTasteA.y*.031*sin(a*2.0+r*4.0-t*1.05)*min(1.0,r/.3)
      +uTasteA.z*.016*sin(p.y*5.0-t*.6)
      +uTasteB.x*.002*sin(p.x*2.0-t*.4)
      +uTasteB.y*.020*sin(p.x*2.2+p.y*1.2-t*.65)
      +uTasteB.z*.014*sin(r*17.0-t*4.2)
      +uSensoryStyle.x*.026*sin(p.x*3.0-t*.85)
      +uSensoryStyle.y*.040*sin(p.x*1.6+p.y*.8-t*.85)
      +uSensoryStyle.z*.030*(sin(p.x*3.0-t*1.25)+sin(p.y*3.0+t*1.25))*.65
      +uSensoryStyle.w*.055*sin(p.x*5.0+p.y*3.0-t*1.9);
    float total=dot(uTasteA,vec3(1.0))+dot(uTasteB,vec3(1.0));
    return wave/max(1.0,total*.85+dot(uSensoryStyle.yzw,vec3(.65))+uSensoryStyle.x*.45)*uSignalMotion;
  }
  float liquidWave(vec2 point) {
    float radial = length(point);
    float selection = 0.0;
    float age = uSelectionPulse.x;
    if (age >= 0.0 && age < uSelectionPulse.y) {
      float progress = age / uSelectionPulse.y;
      float envelope = sin(progress * 3.14159265) * (1.0 - progress * 0.3);
      float radius = length(point - uSelectionOrigin);
      float crest = (radius - 0.10 - age * uSelectionShape.x) / uSelectionPulse.w;
      float ring = exp(-crest * crest);
      if (uSelectionShape.z > 1.5) {
        float second = (radius - 0.10 - age * uSelectionShape.x + 0.30) / uSelectionPulse.w;
        ring += exp(-second * second) * 0.82;
      }
      if (uSelectionShape.y > 2.5)
        ring = 0.6 * sin(atan(point.y,point.x) * 2.0 - age * 2.3) * min(1.0,radial / 1.28) + ring * 0.4;
      else if (uSelectionShape.y > 1.5)
        ring = 0.65 * sin(point.x * 6.0 + point.y * 3.2 - age * 4.0) + ring * 0.35;
      else if (uSelectionShape.y > 0.5)
        ring = (sin(point.x * 4.0 - age * 3.0) + sin(point.y * 4.0 - age * 3.0)) * 0.35 + ring * 0.30;
      selection = ring * envelope * uSelectionPulse.z;
    }
    return clamp(dot(point, uLiquidTilt) + selection + sensoryWave(point)
      + uLiquidRipple * sin(radial * 5.5 - uLiquidTime * 6.0)
        * (0.25 + 0.75 * smoothstep(0.0, 1.28, radial)), -0.075, 0.075);
  }
`;

function surfaceGeometry() {
  const segments = 128, rings = 28, positions = [], indices = [];
  for (let ring = 0; ring <= rings; ring++) for (let sector = 0; sector <= segments; sector++) {
    const radius = 1.248 * ring / rings, angle = sector / segments * TAU;
    positions.push(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    if (ring && sector) {
      const a = ring * (segments + 1) + sector, b = a - segments - 1;
      indices.push(a - 1, a, b - 1, b - 1, a, b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Thin curved surfaces keep garnish silhouettes organic rather than using
// flattened spheres. All of this geometry is built and warmed before selection.
function leafGeometry(length,width,cup=.12) {
  const vertices=[],uvs=[],indices=[],rows=18,cols=8;
  for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){
    const t=i/rows,v=j/cols*2-1,edge=Math.sin(Math.PI*t)**.72;
    vertices.push(v*width*edge,t*length,cup*Math.sin(Math.PI*t)*(1-v*v)-.035*v*v*Math.sin(Math.PI*t));
    uvs.push(j/cols,t);
    if(i&&j){const a=i*(cols+1)+j,b=a-cols-1;indices.push(a-1,b-1,a,a,b-1,b);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
function makeAroma(name) {
  const group=new THREE.Group();
  const material=(color,extra={})=>new THREE.MeshPhysicalMaterial({color,roughness:.40,metalness:0,clearcoat:.3,clearcoatRoughness:.22,envMapIntensity:.65,transparent:true,opacity:1,side:THREE.DoubleSide,...extra});
  const add=(geometry,surface,x=0,y=0,z=0)=>{const mesh=new THREE.Mesh(geometry,surface);mesh.position.set(x,y,z);group.add(mesh);return mesh;};
  const curve=(points,surface,r=.003)=>add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),20,r,5,false),surface);
  if(name==='citrus'){
    const positions=[],indices=[],uv=[],edgeA=[],edgeB=[];
    for(let i=0;i<=84;i++){
      const t=i/84,a=t*TAU*1.03,center=.135+.024*Math.sin(t*6),width=.065*Math.sin(Math.PI*t)**.45+.014;
      for(const sign of [-1,1]){const r=center+sign*width;positions.push(Math.cos(a)*r,t*.36+.024*Math.sin(a),Math.sin(a)*r);uv.push((sign+1)/2,t);}
      edgeA.push(new THREE.Vector3(...positions.slice(-6,-3)));edgeB.push(new THREE.Vector3(...positions.slice(-3)));
      if(i<84){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
    const rind=material('#efac26',{roughness:.56,clearcoat:.13});
    rind.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n float peelGrain=sin(vUv.x*143.0+sin(vUv.y*127.0))*sin(vUv.y*191.0);diffuseColor.rgb*=.94+.06*peelGrain;');};
    rind.defines={USE_UV:''};add(geometry,rind);const pith=material('#f1d491',{roughness:.65});curve(edgeA,pith,.0045);curve(edgeB,pith,.0045);group.rotation.set(.18,.2,-.35);
  }else if(name==='fruit'){
    const skin=material('#8b294b',{roughness:.28,clearcoat:.9,clearcoatRoughness:.12}),crown=material('#4c6241');
    for(let i=0;i<2;i++){
      const x=i? .10:-.075,z=i?-.025:.025,r=i?.113:.138,geometry=new THREE.SphereGeometry(r,32,24),positions=geometry.attributes.position;
      for(let j=0;j<positions.count;j++){const px=positions.getX(j),py=positions.getY(j),pz=positions.getZ(j),f=1+.018*Math.sin(px*100)*Math.sin(pz*110);positions.setXYZ(j,px*f,py*.89,pz*f);}
      geometry.computeVertexNormals();add(geometry,skin,x,.11,z);
      for(let j=0;j<5;j++){const a=j/5*TAU,p=add(leafGeometry(.058,.016,.012),crown,x,.205,z);p.rotation.set(Math.PI/2,0,a);}
    }
    curve([new THREE.Vector3(.10,.20,-.025),new THREE.Vector3(.12,.27,-.02),new THREE.Vector3(.16,.31,.015)],material('#778150'),.006);
  }else if(name==='floral'){
    const petal=material('#e4b2d2',{roughness:.34,clearcoat:.15}),pollen=material('#dfb554',{roughness:.6});
    for(let i=0;i<5;i++){const a=i/5*TAU,p=add(leafGeometry(.24,.084,.046),petal);p.rotation.set(-Math.PI/2+.13,0,a);}
    add(new THREE.SphereGeometry(.037,20,14),pollen,0,.034,0).scale.y=.6;
    for(let i=0;i<7;i++){const a=i/7*TAU;add(new THREE.SphereGeometry(.008,8,6),pollen,Math.cos(a)*.023,.064,Math.sin(a)*.023);}
    group.rotation.z=.10;
  }else if(name==='herbal'){
    const green=material('#6d914f',{roughness:.53,clearcoat:.06}),vein=material('#a2b67a',{roughness:.62});
    curve([new THREE.Vector3(0,0,0),new THREE.Vector3(.022,.12,0),new THREE.Vector3(-.005,.25,0)],green,.006);
    for(let i=0;i<3;i++){
      const leaf=new THREE.Group(),blade=new THREE.Mesh(leafGeometry(.235,.079,.035),green);leaf.add(blade);
      const addVein=points=>leaf.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),12,.0022,4,false),vein));
      addVein([new THREE.Vector3(0,0,.002),new THREE.Vector3(0,.12,.036),new THREE.Vector3(0,.23,.005)]);
      for(let j=1;j<=3;j++)for(const sign of [-1,1]){const t=j/4;addVein([new THREE.Vector3(0,t*.235,.035*Math.sin(Math.PI*t)+.002),new THREE.Vector3(sign*.049,(t+.08)*.235,.025),new THREE.Vector3(sign*.062,(t+.16)*.235,.005)]);}
      leaf.position.set(.014,.03+i*.075,0);leaf.rotation.set(-Math.PI/2+.35,.05,(i%2?-1:1)*(.6+i*.18));group.add(leaf);
    }
    group.rotation.y=.30;
  }else if(name==='spice'){
    const pod=material('#865034',{roughness:.68,clearcoat:.03}),rim=material('#bc8350',{roughness:.62}),seed=material('#3a2420',{roughness:.32,clearcoat:.65});
    for(let i=0;i<8;i++){
      const a=i/8*TAU,petal=add(leafGeometry(.235,.039,-.036),pod);petal.rotation.set(-Math.PI/2,0,a);
      const seedMesh=add(new THREE.SphereGeometry(.026,16,12),seed,Math.sin(a)*.125,.021,Math.cos(a)*.125);seedMesh.scale.set(.62,.45,1.12);seedMesh.rotation.y=a;
      curve([new THREE.Vector3(Math.sin(a)*.04,.018,Math.cos(a)*.04),new THREE.Vector3(Math.sin(a)*.13+.015*Math.cos(a),.035,Math.cos(a)*.13-.015*Math.sin(a)),new THREE.Vector3(Math.sin(a)*.23,.008,Math.cos(a)*.23)],rim,.0032);
    }
  }else{
    const roast=material('#613b25',{roughness:.40,clearcoat:.38}),groove=material('#2e211b',{roughness:.73});
    for(let i=0;i<3;i++){
      const beanGroup=new THREE.Group(),geometry=new THREE.SphereGeometry(.086,28,20),p=geometry.attributes.position;
      for(let j=0;j<p.count;j++){const x=p.getX(j),y=p.getY(j),z=p.getZ(j),dent=y>0?.014*Math.exp(-((x/.014)**2))*Math.sin(Math.acos(Math.max(-1,Math.min(1,z/.086)))):0;p.setXYZ(j,x*.75,y*.52-dent,z*1.15);}
      geometry.computeVertexNormals();beanGroup.add(new THREE.Mesh(geometry,roast));
      const seam=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-.003,.025,-.075),new THREE.Vector3(.006,.030,-.025),new THREE.Vector3(-.006,.030,.025),new THREE.Vector3(.003,.024,.075)]),20,.003,5,false),groove);beanGroup.add(seam);
      beanGroup.position.set((i-1)*.115,.037,(i%2)*.13-.065);beanGroup.rotation.y=i*.85;group.add(beanGroup);
    }
  }
  group.traverse(object=>{if(object.isMesh)object.renderOrder=12;});return group;
}

function profile(controls, segments = 48) {
  const curve = new THREE.CatmullRomCurve3(controls.map(([r, y]) => new THREE.Vector3(r, y, 0)), false, 'centripetal');
  return curve.getPoints(segments).map(p => new THREE.Vector2(Math.max(0.001, p.x), p.y));
}

function lathe(controls, material, segments = 128) {
  const geometry = new THREE.LatheGeometry(profile(controls), segments);
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

function shadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 3, 64, 64, 61);
  gradient.addColorStop(0, 'rgba(6, 20, 14, .32)');
  gradient.addColorStop(.23, 'rgba(6, 20, 14, .18)');
  gradient.addColorStop(.6, 'rgba(6, 20, 14, .06)');
  gradient.addColorStop(1, 'rgba(6, 20, 14, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function buildCoupe() {
  const group = new THREE.Group();
  group.scale.set(.80, 1, .80);
  const liquidUniforms = {uLiquidTilt:{value:new THREE.Vector2()},uLiquidRipple:{value:0},uLiquidTime:{value:0},
    uSelectionPulse:{value:new THREE.Vector4(-100,1,0,.2)},uSelectionShape:{value:new THREE.Vector3(1,0,1)},uSelectionOrigin:{value:new THREE.Vector2()},uTasteA:{value:new THREE.Vector3()},uTasteB:{value:new THREE.Vector3()},uSensoryStyle:{value:new THREE.Vector4()},uSignalMotion:{value:1},uLiquidHighlight:{value:new THREE.Color('#f2efde')}};
  const solidityUniform = {value:0};
  // A transparent page has no renderable background for physical transmission.
  // Use a clear thin shell with view-dependent Fresnel alpha instead: the page
  // remains visible through the center, while real PMREM reflections define edges.
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#deebe7', metalness: .015, roughness: .016, transmission: 0,
    ior: 1.46, clearcoat: 1, clearcoatRoughness: .025,
    envMapIntensity: .75, side: THREE.DoubleSide,
    transparent: true, opacity: .14, depthWrite: false, forceSinglePass: false,
  });
  glass.onBeforeCompile = shader => {
    shader.uniforms.uGlassSolidity = solidityUniform;
    shader.fragmentShader = 'uniform float uGlassSolidity;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      float glassFresnel = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), mix(3.0,2.15,uGlassSolidity));
      diffuseColor.a = mix(0.012,0.045,uGlassSolidity) + mix(0.58,0.82,uGlassSolidity) * glassFresnel;
      #include <opaque_fragment>
    `);
  };
  glass.customProgramCacheKey = () => 'aroma-preview-clear-shell';
  const stemGlass = glass.clone();
  stemGlass.onBeforeCompile = shader => {
    shader.uniforms.uGlassSolidity = solidityUniform;
    shader.fragmentShader = 'uniform float uGlassSolidity;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      float stemFresnel = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), mix(2.7,2.0,uGlassSolidity));
      diffuseColor.a = mix(0.07,0.10,uGlassSolidity) + mix(0.76,0.90,uGlassSolidity) * stemFresnel;
      #include <opaque_fragment>
    `);
  };
  stemGlass.customProgramCacheKey = () => 'aroma-preview-bright-stem';
  stemGlass.roughness = .025;
  stemGlass.envMapIntensity = 1.55;
  stemGlass.emissive.set('#c5d4bb');
  stemGlass.emissiveIntensity = .17;

  // One optically thin wall, with a rounded lip for visible thickness.
  // Duplicating nested transparent walls creates draw-order seams while rotating.
  const outer = profile([
    [.075, 1.92], [.12, 1.96], [.32, 2.00], [.64, 2.11],
    [1.02, 2.30], [1.34, 2.54], [1.49, 2.73], [1.505, 2.785],
  ], 56);
  const rim = profile([[1.505, 2.785], [1.502, 2.807], [1.481, 2.816], [1.461, 2.798]], 8);
  const bowl = new THREE.Mesh(new THREE.LatheGeometry([...outer, ...rim.slice(1)], 224), glass);
  bowl.renderOrder = 20;
  group.add(bowl);

  // Slender stem with a soft taper into the bowl and foot.
  const stem = lathe([
    [.115, .14], [.088, .23], [.058, .42], [.047, .79],
    [.049, 1.39], [.061, 1.81], [.091, 1.94], [.075, 1.97],
  ], stemGlass, 96);
  stem.renderOrder = 20;
  group.add(stem);
  const foot = lathe([
    [.001, .07], [.32, .067], [.67, .074], [.88, .087],
    [.928, .113], [.911, .139], [.71, .162], [.30, .169],
    [.14, .188], [.095, .20], [.001, .18],
  ], glass, 144);
  foot.renderOrder = 20;
  group.add(foot);

  const lipMaterial = new THREE.MeshPhysicalMaterial({
    color: '#f6efd8', roughness: .04, metalness: .06,
    envMapIntensity: 1.25, transparent: true, opacity: .46, depthWrite: false,
    emissive: '#c2d1b9', emissiveIntensity: .16, clearcoat: 1,
  });
  const lip = new THREE.Mesh(new THREE.TorusGeometry(1.484, .009, 12, 192), lipMaterial);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 2.803;
  lip.renderOrder = 21;
  group.add(lip);
  const footEdge=new THREE.Mesh(new THREE.TorusGeometry(.896,.006,8,160),lipMaterial);
  footEdge.rotation.x=Math.PI/2;footEdge.position.y=.133;footEdge.renderOrder=21;group.add(footEdge);

  const liquidMaterial = new THREE.MeshPhysicalMaterial({
    color: '#bb671a', metalness: 0, roughness: .10, transmission: 0,
    ior: 1.335, clearcoat: 1, clearcoatRoughness: .045,
    envMapIntensity: .62, side: THREE.FrontSide,
    transparent: true, opacity: .90, depthWrite: false,
    emissive: '#d28b28', emissiveIntensity: .32,
  });
  liquidMaterial.onBeforeCompile = shader => {
    Object.assign(shader.uniforms,liquidUniforms);
    shader.vertexShader = WAVE_GLSL + 'varying float vLiquidHeight;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      transformed.y += liquidWave(position.xz) * smoothstep(2.43,2.605,position.y);
      vLiquidHeight = transformed.y;`);
    shader.fragmentShader = 'varying float vLiquidHeight;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
      #include <emissivemap_fragment>
      totalEmissiveRadiance *= mix(0.35, 1.05, smoothstep(2.04, 2.62, vLiquidHeight));
    `);
  };
  liquidMaterial.customProgramCacheKey = () => 'aroma-preview-liquid-volume';
  const liquid = lathe([
    [.001, 2.032], [.22, 2.052], [.53, 2.143], [.83, 2.278],
    [1.10, 2.445], [1.246, 2.596], [1.252, 2.611],
    [1.248, 2.611], [.88, 2.611], [.39, 2.611], [.001, 2.611],
  ], liquidMaterial, 144);
  liquid.renderOrder = 8;
  group.add(liquid);

  // A separate level surface keeps a readable amber meniscus and crisp highlights.
  const surfaceMaterial = new THREE.MeshPhysicalMaterial({
    color: '#cd8828', metalness: 0, roughness: .045,
    clearcoat: 1, clearcoatRoughness: .04, envMapIntensity: .86,
    transparent: true, opacity: .96, depthWrite: false, side: THREE.DoubleSide,
    emissive: '#e6a037', emissiveIntensity: .22,
  });
  surfaceMaterial.onBeforeCompile = shader => {
    Object.assign(shader.uniforms,liquidUniforms);
    shader.vertexShader = WAVE_GLSL + 'varying vec2 vLiquidSurface;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
      float dx = (liquidWave(vec2(position.x + 0.008,-position.y)) - liquidWave(vec2(position.x - 0.008,-position.y))) / 0.016;
      float dz = (liquidWave(vec2(position.x,-position.y + 0.008)) - liquidWave(vec2(position.x,-position.y - 0.008))) / 0.016;
      objectNormal = normalize(vec3(-dx,dz,1.0));`);
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      transformed.z += liquidWave(vec2(position.x,-position.y));
      vLiquidSurface = position.xy;`);
    shader.fragmentShader = 'varying vec2 vLiquidSurface;\nuniform vec3 uTasteA;uniform vec3 uTasteB;uniform vec4 uSensoryStyle;uniform float uLiquidTime;uniform vec3 uLiquidHighlight;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
      #include <emissivemap_fragment>
      float amberRadius = clamp(length(vLiquidSurface) / 1.295, 0.0, 1.0);
      totalEmissiveRadiance *= mix(1.08, 0.60, smoothstep(0.18, 1.0, amberRadius));
      vec2 tastePoint=vec2(vLiquidSurface.x,-vLiquidSurface.y);
      float radius=length(tastePoint),angle=atan(tastePoint.y,tastePoint.x),t=uLiquidTime;
      float sourCrest=pow(max(0.0,sin(radius*13.0-t*3.2)),10.0);
      float sweetCrest=pow(max(0.0,sin(angle*2.0+radius*4.0-t*1.05)),7.0);
      float drySheen=pow(max(0.0,cos(tastePoint.x*2.2+tastePoint.y*1.3-t*.4)),18.0);
      float silk=.5+.5*sin(tastePoint.x*3.0+sin(tastePoint.y*3.0)+t*.65);
      float firstSip=pow(max(0.0,sin(tastePoint.x*3.0-t*1.25)),8.0)*uSensoryStyle.y
        +pow(max(0.0,sin(tastePoint.x*4.0+tastePoint.y*4.0+t*1.25)),8.0)*uSensoryStyle.z
        +pow(max(0.0,sin(tastePoint.x*5.0+tastePoint.y*3.0-t*1.9)),8.0)*uSensoryStyle.w;
      float glint=sourCrest*uTasteA.x*.40+sweetCrest*uTasteA.y*.34+drySheen*uTasteB.x*.30+silk*uTasteB.y*.30+firstSip*.26;
      totalEmissiveRadiance=mix(totalEmissiveRadiance,uLiquidHighlight,clamp(glint,0.0,.55));
      totalEmissiveRadiance*=1.0-uTasteA.z*.24*smoothstep(.70,1.24,radius);
    `);
  };
  surfaceMaterial.customProgramCacheKey = () => 'aroma-preview-liquid-surface';
  const surface = new THREE.Mesh(surfaceGeometry(), surfaceMaterial);
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = 2.613;
  surface.renderOrder = 9;
  group.add(surface);

  const meniscusMaterial = new THREE.MeshPhysicalMaterial({
    color: '#e6bd75', roughness: .12, metalness: .12, transmission: 0,
    envMapIntensity: .75, transparent: true, opacity: .62, depthWrite: false,
    emissive: '#ebb264', emissiveIntensity: .18,
  });
  meniscusMaterial.onBeforeCompile = shader => {
    Object.assign(shader.uniforms,liquidUniforms);
    shader.vertexShader = WAVE_GLSL + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      transformed.z -= liquidWave(position.xy);`);
  };
  meniscusMaterial.customProgramCacheKey = () => 'aroma-preview-liquid-meniscus';
  const meniscus = new THREE.Mesh(new THREE.TorusGeometry(1.252, .010, 10, 192), meniscusMaterial);
  meniscus.rotation.x = Math.PI / 2;
  meniscus.position.y = 2.608;
  meniscus.renderOrder = 10;
  group.add(meniscus);

  const aromas = AROMAS.map((name,index)=>{
    const object=makeAroma(name),materials=[];
    object.traverse(node=>{if(node.material&&!materials.includes(node.material))materials.push(node.material);});
    group.add(object);
    return {name,object,materials,x:AROMA_POSITIONS[index][0],z:AROMA_POSITIONS[index][1],amount:0,from:0,target:0,start:0};
  });
  const bubbleMaterial=new THREE.MeshPhysicalMaterial({color:'#f1e5cc',roughness:.035,metalness:.08,clearcoat:1,transparent:true,opacity:.70,depthWrite:false,depthTest:false,envMapIntensity:1.3,emissive:'#d4b88b',emissiveIntensity:.10});
  const foamMaterial=new THREE.MeshPhysicalMaterial({color:'#eee0cc',roughness:.40,transparent:true,opacity:.80,depthWrite:false,envMapIntensity:.7});
  const bubbles=new THREE.InstancedMesh(new THREE.SphereGeometry(.023,14,10),bubbleMaterial,36);
  const foam=new THREE.InstancedMesh(new THREE.SphereGeometry(.030,12,8),foamMaterial,28);
  bubbles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);foam.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  bubbles.frustumCulled=false;foam.frustumCulled=false;bubbles.renderOrder=11;foam.renderOrder=11;
  group.add(bubbles,foam);
  group.position.y = -1.55;
  return {group,glass,stemGlass,lipMaterial,liquidMaterial,surfaceMaterial,meniscusMaterial,liquidUniforms,solidityUniform,aromas,bubbles,foam};
}

/**
 * Persistent sensory coupe. setPresentation accepts additive radians: it never
 * wraps the turn, so an exact 0 → 2π timeline makes a complete visible turn.
 */
export function createGlassStage(container, {reduced=false,paused=false}={}) {
  if (!(container instanceof HTMLElement)) throw new TypeError('Glass stage needs an HTML container.');
  let renderer;
  try {
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:false});
  } catch(error) {
    container.dataset.glassError='webgl-unavailable';
    console.warn('Glassnote 3D stage is unavailable.',error);
    return {ready:Promise.resolve(false),setScene(){},setFlavourState(){},setPresentation(){},setPaused(){},setReduced(){},dispose(){},getDebugState(){return {motion:'unavailable',aromas:[],turn:0,wave:{x:0,z:0,ripple:0},solidity:0};}};
  }
  const canvas=renderer.domElement;
  canvas.className='glass-stage-canvas';canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='display:block;width:100%;height:100%;pointer-events:none;opacity:0;';
  container.appendChild(canvas);
  renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.93;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(31,1,.1,60);
  const environment=new RoomEnvironment();
  environment.traverse(object=>{
    const material=object.material;
    if(material?.emissiveIntensity>10){material.emissive.set('#fff2dc');material.emissiveIntensity*=.70;}
    else if(material?.isMeshStandardMaterial)material.color.set('#11291d');
  });
  const pmrem=new THREE.PMREMGenerator(renderer),environmentTarget=pmrem.fromScene(environment,.035);
  scene.environment=environmentTarget.texture;scene.environmentIntensity=.65;
  environment.dispose();pmrem.dispose();
  const warmKey=new THREE.DirectionalLight('#fff4dc',1.8);warmKey.position.set(-3.5,5.5,4);scene.add(warmKey);
  const rimLight=new THREE.DirectionalLight('#dbe8da',1.4);rimLight.position.set(4,2.5,-2);scene.add(rimLight);
  scene.add(new THREE.HemisphereLight('#fff5e3','#143b27',.65));
  const {group,glass,stemGlass,lipMaterial,liquidMaterial,surfaceMaterial,meniscusMaterial,liquidUniforms,solidityUniform,aromas,bubbles,foam}=buildCoupe();
  scene.add(group);
  for(let i=0;i<aromas.length;i++){
    const item=aromas[i];item.baseX=item.object.rotation.x;item.baseY=item.object.rotation.y;item.baseZ=item.object.rotation.z;
  }
  const shadowMap=shadowTexture();
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(3.8,2.75),new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false,opacity:.6,toneMapped:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.set(0,-1.491,0);scene.add(shadow);
  let dead=false,contextLost=false,warmed=false,frameId=0,lastTime=0,elapsed=0,driftElapsed=0,tween=null,flavourTween=null;
  let isReduced=!!reduced,isPaused=!!paused,frameDistance=0;
  let quality=Math.min(window.devicePixelRatio||1,1.6),sampledFrames=0,slowFrames=0;
  const state={...COMPOSITIONS.home};
  let destination={...COMPOSITIONS.home};
  const presentation={turn:0,solidity:0,impulseX:0};
  const flavour={aromas:[],tastes:[],strength:null,approach:null};
  const colour=new THREE.Color(NEUTRAL),colourTarget=new THREE.Color(NEUTRAL);
  const highlight=new THREE.Color('#e7c482');
  const lookAt=new THREE.Vector3(0,-.02,0);
  let waveX=0,waveZ=0,velocityX=0,velocityZ=0,ripple=0;
  let lastTurn=0,lastAngularVelocity=0,angularVelocity=0,angularAcceleration=0;
  let refreshAmount=0,creamAmount=0,refreshTarget=0,creamTarget=0;
  let liquidOpacity=.90,opacityTarget=.90,surfaceRoughness=.045,roughnessTarget=.045;
  let damping=6,driftGain=1;
  const tasteWeights=new Float32Array(6),tasteTargets=new Float32Array(6),sensoryStyle=new Float32Array(4),styleTargets=new Float32Array(4);
  const instancePose=new THREE.Object3D();

  const pulse={start:-100,duration:1,amplitude:0,width:.2,speed:1,shape:0,count:1,x:0,z:0,type:'none'};
  let dryFlattenUntil=0;

  function settleScene(){for(let i=0;i<NUMERIC_KEYS.length;i++){const key=NUMERIC_KEYS[i];state[key]=destination[key];}tween=null;}
  function waveAt(x,z){
    const radius=Math.hypot(x,z),t=Math.min(1,radius/1.28),edge=t*t*(3-2*t);
    const age=elapsed-pulse.start;
    let selection=0;
    if(age>=0&&age<pulse.duration){
      const progress=age/pulse.duration,envelope=Math.sin(progress*Math.PI)*(1-progress*.3);
      const crest=(Math.hypot(x-pulse.x,z-pulse.z)-.10-age*pulse.speed)/pulse.width;
      let ring=Math.exp(-crest*crest);
      if(pulse.count===2){const second=crest+.30/pulse.width;ring+=Math.exp(-second*second)*.82;}
      if(pulse.shape===3)ring=.6*Math.sin(Math.atan2(z,x)*2-age*2.3)*Math.min(1,radius/1.28)+ring*.4;
      else if(pulse.shape===2)ring=.65*Math.sin(x*6+z*3.2-age*4)+ring*.35;
      else if(pulse.shape===1)ring=(Math.sin(x*4-age*3)+Math.sin(z*4-age*3))*.35+ring*.30;
      selection=ring*envelope*pulse.amplitude;
    }
    return THREE.MathUtils.clamp(x*waveX+z*waveZ+selection+sampleSensoryWave(x,z,elapsed,tasteWeights,sensoryStyle,isReduced?0:1)+ripple*Math.sin(radius*5.5-elapsed*6)*(.25+.75*edge),-MAX_WAVE,MAX_WAVE);
  }
  function selectPulse(type,{amplitude=.012,width=.23,speed=1.2,duration=1.1,shape=0,count=1,x=0,z=0,delay=0}={}){
    Object.assign(pulse,{type,amplitude,width,speed,duration,shape,count,x,z,start:elapsed+delay});
    if(isReduced||isPaused){pulse.amplitude=0;pulse.type='none';}
  }
  function updateObjects(){
    for(let i=0;i<aromas.length;i++){
      const item=aromas[i],amount=item.amount;
      item.object.visible=amount>.001;
      item.object.position.set(item.x,2.622+waveAt(item.x,item.z)+.34*(1-amount),item.z);
      item.object.scale.setScalar((.66+.34*amount)*1.18);
      item.object.rotation.set(item.baseX-.18*(1-amount),item.baseY+.24*(1-amount),item.baseZ+.15*(1-amount));
      for(let j=0;j<item.materials.length;j++)item.materials[j].opacity=amount;
    }
    bubbles.visible=refreshAmount>.002;foam.visible=creamAmount>.002;
    bubbles.material.opacity=.74*refreshAmount;foam.material.opacity=.78*creamAmount;
    for(let i=0;bubbles.visible&&i<bubbles.count;i++){
      const cycle=(elapsed*(.15+(i%4)*.016)+i*.173)%1,a=i*2.39996,r=(.16+cycle*.83)*(.5+(i%5)*.105);
      const x=Math.cos(a)*r,z=Math.sin(a)*r,y=2.16+cycle*.454;
      instancePose.position.set(x,y+waveAt(x,z)*Math.min(1,cycle*2),z);
      instancePose.scale.setScalar((.70+(i%3)*.28)*Math.sin(Math.PI*cycle)**.35);instancePose.updateMatrix();bubbles.setMatrixAt(i,instancePose.matrix);
    }
    for(let i=0;foam.visible&&i<foam.count;i++){
      const a=i*2.39996+elapsed*.05,r=.25+Math.sqrt(i/foam.count)*.92,x=Math.cos(a)*r,z=Math.sin(a)*r;
      instancePose.position.set(x,2.618+waveAt(x,z),z);instancePose.scale.set(1,.30,1);instancePose.updateMatrix();foam.setMatrixAt(i,instancePose.matrix);
    }
    if(bubbles.visible)bubbles.instanceMatrix.needsUpdate=true;if(foam.visible)foam.instanceMatrix.needsUpdate=true;
  }
  function draw(){
    if(dead||contextLost||!warmed)return;
    // elapsed is retained when paused: no reset-to-zero drift or pose jump.
    const drift=driftElapsed,breathe=Math.sin(drift*TAU/12);
    group.position.set(.025*Math.sin(drift*TAU/16),-1.55+state.lift+breathe*.025,0);
    group.rotation.set(.010*Math.sin(drift*TAU/18),state.turn+presentation.turn+.065*Math.sin(drift*TAU/18),state.lean+.007*breathe+.07*presentation.solidity);
    liquidMaterial.color.copy(colour);liquidMaterial.emissive.copy(colour).lerp(highlight,.26);
    liquidMaterial.opacity=liquidOpacity;
    surfaceMaterial.color.copy(colour).lerp(highlight,.10);surfaceMaterial.emissive.copy(colour).lerp(highlight,.38);
    surfaceMaterial.roughness=surfaceRoughness;
    meniscusMaterial.color.copy(colour).lerp(highlight,.55);
    solidityUniform.value=presentation.solidity;
    glass.envMapIntensity=1.02+presentation.solidity*.35;
    stemGlass.envMapIntensity=1.55+presentation.solidity*.45;
    lipMaterial.opacity=.46+presentation.solidity*.27;
    liquidUniforms.uTasteA.value.set(tasteWeights[0],tasteWeights[1],tasteWeights[2]);
    liquidUniforms.uTasteB.value.set(tasteWeights[3],tasteWeights[4],tasteWeights[5]);
    liquidUniforms.uSensoryStyle.value.set(sensoryStyle[0],sensoryStyle[1],sensoryStyle[2],sensoryStyle[3]);liquidUniforms.uSignalMotion.value=isReduced?0:1;
    liquidUniforms.uLiquidHighlight.value.copy(highlight);
    surfaceMaterial.opacity=THREE.MathUtils.mapLinear(liquidOpacity,.54,.98,.62,.98);
    liquidUniforms.uLiquidTilt.value.set(waveX,waveZ);
    liquidUniforms.uLiquidRipple.value=ripple;liquidUniforms.uLiquidTime.value=elapsed;
    liquidUniforms.uSelectionPulse.value.set(elapsed-pulse.start,pulse.duration,pulse.amplitude,pulse.width);
    liquidUniforms.uSelectionShape.value.set(pulse.speed,pulse.shape,pulse.count);
    liquidUniforms.uSelectionOrigin.value.set(pulse.x,pulse.z);
    updateObjects();
    const distance=state.distance+frameDistance;
    camera.position.set(Math.sin(state.yaw)*distance,state.eye,Math.cos(state.yaw)*distance);camera.lookAt(lookAt);
    shadow.material.opacity=.58-state.lift*1.6;
    renderer.render(scene,camera);
  }
  function update(delta){
    if(tween){
      const fraction=Math.min(1,(elapsed-tween.start)/tween.duration),ease=easeInOutCubic(fraction);
      for(let i=0;i<NUMERIC_KEYS.length;i++){const key=NUMERIC_KEYS[i];state[key]=THREE.MathUtils.lerp(tween.from[key],tween.to[key],ease);}
      if(fraction===1)tween=null;
    }
    if(flavourTween){
      const fraction=Math.min(1,(elapsed-flavourTween.start)/.65),ease=1-(1-fraction)**3;
      colour.copy(flavourTween.from).lerp(colourTarget,ease);
      refreshAmount=THREE.MathUtils.lerp(flavourTween.refresh,refreshTarget,ease);
      creamAmount=THREE.MathUtils.lerp(flavourTween.cream,creamTarget,ease);
      liquidOpacity=THREE.MathUtils.lerp(flavourTween.opacity,opacityTarget,ease);
      surfaceRoughness=THREE.MathUtils.lerp(flavourTween.roughness,roughnessTarget,ease);
      for(let i=0;i<6;i++)tasteWeights[i]=THREE.MathUtils.lerp(flavourTween.tastes[i],tasteTargets[i],ease);
      for(let i=0;i<4;i++)sensoryStyle[i]=THREE.MathUtils.lerp(flavourTween.style[i],styleTargets[i],ease);
      if(fraction===1)flavourTween=null;
    }
    for(let i=0;i<aromas.length;i++){
      const item=aromas[i],fraction=Math.min(1,(elapsed-item.start)/.65),ease=1-(1-fraction)**3;
      item.amount=THREE.MathUtils.lerp(item.from,item.target,ease);
    }
    if(delta<=0)return;
    angularVelocity=THREE.MathUtils.clamp((presentation.turn-lastTurn)/delta,-14,14);
    angularAcceleration=THREE.MathUtils.clamp((angularVelocity-lastAngularVelocity)/delta,-42,42);
    lastTurn=presentation.turn;lastAngularVelocity=angularVelocity;
    // A short force followed by spring recovery models lateral/angular inertia.
    const forceX=presentation.impulseX*4+angularAcceleration*.026;
    const forceZ=angularAcceleration*.10;
    const spring=creamTarget?36:80,activeDamping=elapsed<dryFlattenUntil?20:damping;
    velocityX+=(forceX-waveX*spring-velocityX*activeDamping)*delta;
    velocityZ+=(forceZ-waveZ*spring-velocityZ*activeDamping)*delta;
    waveX=THREE.MathUtils.clamp(waveX+velocityX*delta,-.037,.037);
    waveZ=THREE.MathUtils.clamp(waveZ+velocityZ*delta,-.037,.037);
    const rippleTarget=Math.min(.011,Math.abs(angularVelocity)*.0018+Math.abs(presentation.impulseX)*.006);
    ripple+=(rippleTarget-ripple)*Math.min(1,delta*3.2);
  }
  function tick(time){
    if(dead||contextLost||isPaused||isReduced){frameId=0;return;}
    frameId=requestAnimationFrame(tick);
    const delta=lastTime?Math.min((time-lastTime)/1000,.05):0;lastTime=time;elapsed+=delta;driftElapsed+=delta*driftGain;
    if(delta>0){sampledFrames++;if(delta>.025)slowFrames++;}
    if(sampledFrames===60){
      if(slowFrames>18&&quality>1){quality=Math.max(1,quality-.2);renderer.setPixelRatio(quality);container.dataset.glassPixelRatio=quality.toFixed(2);}
      sampledFrames=0;slowFrames=0;
    }
    update(delta);draw();
  }
  function restart(){
    cancelAnimationFrame(frameId);frameId=0;lastTime=0;
    const running=!dead&&!contextLost&&warmed&&!isPaused&&!isReduced;
    container.dataset.glassMotion=running?'running':'paused';
    if(running)frameId=requestAnimationFrame(tick);else draw();
  }
  function resize(){
    if(dead)return;
    const width=container.clientWidth,height=container.clientHeight;if(width<2||height<2)return;
    camera.aspect=width/height;camera.updateProjectionMatrix();
    const minimumDistance=2.82/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect);
    frameDistance=Math.max(0,minimumDistance-6.35);
    renderer.setSize(width,height,false);draw();
  }
  const lost=event=>{event.preventDefault();contextLost=true;container.dataset.glassError='context-lost';restart();};
  const restored=()=>{contextLost=false;delete container.dataset.glassError;resize();restart();};
  canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored);
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);resize();
  const initialDistance=state.distance+frameDistance;
  camera.position.set(Math.sin(state.yaw)*initialDistance,state.eye,Math.cos(state.yaw)*initialDistance);camera.lookAt(lookAt);
  container.dataset.glassPixelRatio=quality.toFixed(2);
  // All six objects and optional taste accents are visible only in the hidden
  // warm-up render, so first selection allocates neither geometry nor shaders.
  const ready=renderer.compileAsync(scene,camera).catch(()=>{}).then(()=>{
    if(dead)return false;
    renderer.render(scene,camera);warmed=true;draw();canvas.style.opacity='1';restart();return true;
  });
  return {
    ready,
    setScene(name,{duration=1.5}={}){
      if(dead)return;
      destination={...(COMPOSITIONS[name]||COMPOSITIONS.home)};
      container.dataset.glassScene=name in COMPOSITIONS?name:'home';
      duration=Number.isFinite(duration)?Math.max(0,duration):1.5;
      if(isReduced||isPaused||duration===0){settleScene();draw();return;}
      tween={from:{...state},to:{...destination},start:elapsed,duration};
    },
    setFlavourState({aromas:selected=[],tastes=[],strength=null,approach=null}={}){
      if(dead)return;
      const nextAromas=AROMAS.filter(name=>selected.includes(name));
      const nextTastes=['sour','sweet','bitter','dry','creamy','refreshing'].filter(name=>tastes.includes(name));
      const nextStrength=['none','low','medium','strong'].includes(strength)?strength:null;
      const nextApproach=['gentle','balanced','bold'].includes(approach)?approach:null;
      const aromaChanged=nextAromas.join()!==flavour.aromas.join(),tasteChanged=nextTastes.join()!==flavour.tastes.join();
      const strengthChanged=nextStrength!==flavour.strength,approachChanged=nextApproach!==flavour.approach;
      if(!aromaChanged&&!tasteChanged&&!strengthChanged&&!approachChanged)return;
      const addedTaste=nextTastes.find(name=>!flavour.tastes.includes(name));
      flavour.aromas=nextAromas;flavour.tastes=nextTastes;flavour.strength=nextStrength;flavour.approach=nextApproach;
      colourTarget.copy(NEUTRAL);
      if(flavour.aromas.length){
        colourTarget.setRGB(0,0,0);
        for(let i=0;i<AROMAS.length;i++)if(flavour.aromas.includes(AROMAS[i]))colourTarget.add(AROMA_COLORS[i]);
        colourTarget.multiplyScalar(1/flavour.aromas.length);
      }
      if(flavour.tastes.includes('sour'))colourTarget.lerp(SOUR,.12);
      if(flavour.tastes.includes('sweet'))colourTarget.lerp(SWEET,.16);
      if(flavour.tastes.includes('bitter'))colourTarget.lerp(DARK,.22);
      if(flavour.tastes.includes('creamy'))colourTarget.lerp(CREAM,.48);
      if(flavour.tastes.includes('dry'))colourTarget.lerp(LIGHT,.07);
      if(strength==='none')colourTarget.lerp(LIGHT,.62);
      if(strength==='low')colourTarget.lerp(LIGHT,.24);
      if(strength==='strong')colourTarget.lerp(DARK,.38);
      highlight.copy(colourTarget).lerp(IVORY,.65);
      for(let i=0;i<6;i++)tasteTargets[i]=flavour.tastes.includes(TASTES[i])?1:0;
      styleTargets.set([nextStrength?BODY[nextStrength]:0,nextApproach==='gentle'?1:0,nextApproach==='balanced'?1:0,nextApproach==='bold'?1:0]);
      refreshTarget=flavour.tastes.includes('refreshing')?1:0;
      creamTarget=flavour.tastes.includes('creamy')?1:0;
      opacityTarget=creamTarget?.98:strength==='none'?.54:strength==='low'?.73:strength==='strong'?.98:.90;
      roughnessTarget=creamTarget?.13:flavour.tastes.includes('dry')?.018:.040;
      damping=creamTarget?7:approach==='gentle'?8:approach==='bold'?4.8:6;
      driftGain=approach==='gentle'?.68:approach==='bold'?1.2:1;
      for(let i=0;i<aromas.length;i++){
        const item=aromas[i],target=flavour.aromas.includes(item.name)?1:0;
        if(target!==item.target){
          item.from=item.amount;item.target=target;item.start=elapsed;
          selectPulse('aroma',{amplitude:.010,width:.18,speed:1.5,duration:.90,x:item.x,z:item.z,delay:target?.22:0});
        }
        if(isReduced||isPaused){item.amount=item.target;item.from=item.target;item.start=elapsed-.65;}
      }
      if(approachChanged){
        if(approach==='gentle')selectPulse('gentle',{amplitude:.039,width:.38,speed:.85,duration:3.8});
        else if(approach==='balanced')selectPulse('balanced',{amplitude:.044,width:.23,speed:1.1,duration:3.4,shape:1});
        else if(approach==='bold')selectPulse('bold',{amplitude:.060,width:.15,speed:1.4,duration:3.2,shape:2});
        else selectPulse('release',{amplitude:.009});
      }else if(strengthChanged){
        selectPulse('strength-'+(strength||'release'),{amplitude:strength==='none'?.007:strength==='low'?.011:strength==='strong'?.026:.017,width:.24,speed:1.2,duration:3.2});
      }else if(tasteChanged){
        if(addedTaste==='sour')selectPulse('sour-double',{amplitude:.042,width:.13,speed:1.10,duration:3.4,count:2});
        else if(addedTaste==='sweet')selectPulse('sweet-swirl',{amplitude:.044,width:.32,speed:.80,duration:3.8,shape:3});
        else if(addedTaste==='dry'){
          waveX*=.25;waveZ*=.25;velocityX*=.15;velocityZ*=.15;ripple*=.20;dryFlattenUntil=elapsed+.45;
          selectPulse('dry-flatten',{amplitude:.007,width:.25,speed:2.5,duration:.55});
        }else if(addedTaste==='creamy'){
          if(!isReduced&&!isPaused){velocityX+=.055;velocityZ-=.018;}
          selectPulse('creamy-sway',{amplitude:.032,width:.34,speed:.80,duration:3.8});
        }else if(addedTaste==='bitter')selectPulse('bitter',{amplitude:.031,width:.20,speed:1,duration:3.0});
        else if(addedTaste==='refreshing')selectPulse('refreshing',{amplitude:.036,width:.14,speed:1.65,duration:3.0});
        else selectPulse('release',{amplitude:.009});
      }
      if(isReduced||isPaused){colour.copy(colourTarget);refreshAmount=refreshTarget;creamAmount=creamTarget;liquidOpacity=opacityTarget;surfaceRoughness=roughnessTarget;flavourTween=null;tasteWeights.set(tasteTargets);sensoryStyle.set(styleTargets);draw();}
      else flavourTween={from:colour.clone(),refresh:refreshAmount,cream:creamAmount,opacity:liquidOpacity,roughness:surfaceRoughness,tastes:[...tasteWeights],style:[...sensoryStyle],start:elapsed};
    },
    setPresentation({turn=presentation.turn,solidity=presentation.solidity,impulseX=presentation.impulseX}={}){
      if(dead)return;
      if(Number.isFinite(turn))presentation.turn=turn;
      if(Number.isFinite(solidity))presentation.solidity=THREE.MathUtils.clamp(solidity,0,1);
      if(Number.isFinite(impulseX))presentation.impulseX=THREE.MathUtils.clamp(impulseX,-1,1);
      solidityUniform.value=presentation.solidity;
      group.rotation.y=state.turn+presentation.turn+.065*Math.sin(driftElapsed*TAU/18);
      if(!frameId)draw();
    },
    setPaused(value){if(dead)return;isPaused=!!value;lastTurn=presentation.turn;lastAngularVelocity=0;restart();},
    setReduced(value){
      if(dead)return;isReduced=!!value;lastTurn=presentation.turn;lastAngularVelocity=0;
      if(isReduced){
        pulse.amplitude=0;pulse.type='none';waveX=waveZ=velocityX=velocityZ=ripple=0;
        settleScene();colour.copy(colourTarget);refreshAmount=refreshTarget;creamAmount=creamTarget;
        liquidOpacity=opacityTarget;surfaceRoughness=roughnessTarget;flavourTween=null;tasteWeights.set(tasteTargets);sensoryStyle.set(styleTargets);
        for(const item of aromas){item.amount=item.target;item.from=item.target;item.start=elapsed-.65;}
      }
      restart();
    },
    getDebugState(){return {ready:warmed,scene:container.dataset.glassScene||'home',aromas:[...flavour.aromas],tastes:[...flavour.tastes],strength:flavour.strength,approach:flavour.approach,
      visibleAromas:aromas.filter(item=>item.object.visible).map(item=>({name:item.name,amount:item.amount,height:item.object.position.y})),
      colour:'#'+colour.getHexString(),targetColour:'#'+colourTarget.getHexString(),turn:presentation.turn,baseTurn:state.turn,actualTurn:group.rotation.y,
      wave:{x:waveX,z:waveZ,ripple,maxHeight:MAX_WAVE,persistent:sampleSensoryWave(.57,.38,elapsed,tasteWeights,sensoryStyle,isReduced?0:1),weights:[...tasteWeights],style:[...sensoryStyle],angularVelocity,angularAcceleration,
        selection:{type:pulse.type,active:pulse.amplitude>0&&elapsed>=pulse.start&&elapsed<pulse.start+pulse.duration,age:elapsed-pulse.start,duration:pulse.duration,amplitude:pulse.amplitude,count:pulse.count,shape:pulse.shape}},solidity:solidityUniform.value,
      motion:dead?'disposed':contextLost?'context-lost':!warmed?'warming':isReduced?'reduced':isPaused?'paused':'running',elapsed,pixelRatio:quality};},
    dispose(){
      if(dead)return;dead=true;container.dataset.glassMotion='paused';cancelAnimationFrame(frameId);frameId=0;
      resizeObserver.disconnect();canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);
      const geometries=new Set(),materials=new Set();
      scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)(Array.isArray(object.material)?object.material:[object.material]).forEach(material=>materials.add(material));});
      geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());shadowMap.dispose();environmentTarget.dispose();renderer.dispose();canvas.remove();
    },
  };
}
