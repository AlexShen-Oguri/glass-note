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
  guided:   { yaw: -0.32, eye: 1.05, distance: 6.65, turn: -0.48, lean: -0.024, lift: 0.06, tint: '#ba7429' },
  results:  { yaw: 0.24,  eye: 0.43, distance: 6.45, turn: 0.40,  lean: 0.028,  lift: 0.035, tint: '#d49439' },
  recipe:   { yaw: -0.16, eye: 1.42, distance: 6.35, turn: -0.78, lean: -0.014, lift: 0.035, tint: '#b96818' },
  discover: { yaw: 0.44,  eye: 0.75, distance: 7.05, turn: 0.88,  lean: 0.035,  lift: 0.025, tint: '#b65326' },
};

const NUMERIC_KEYS = ['yaw', 'eye', 'distance', 'turn', 'lean', 'lift'];
const TAU = Math.PI * 2;
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;

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

function makeCitrusTwist() {
  const count = 92;
  const positions = [], uv = [], indices = [];
  const centers = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const a = -1.25 + t * Math.PI * 2.25;
    const radius = .31 + .08 * Math.sin(t * Math.PI);
    const center = new THREE.Vector3(Math.cos(a) * radius, 2.60 + t * .54, Math.sin(a) * radius);
    centers.push(center);
    const ribbonWidth = .10 + .04 * Math.sin(t * Math.PI);
    const side = new THREE.Vector3(Math.cos(a) * .75, .38 * Math.cos(t * TAU), Math.sin(a) * .75).normalize().multiplyScalar(ribbonWidth);
    const left = center.clone().sub(side), right = center.clone().add(side);
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    uv.push(0, t, 1, t);
    if (i < count) {
      const j = i * 2;
      indices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const outer = new THREE.MeshPhysicalMaterial({
    color: '#e88b0b', roughness: .42, metalness: 0, clearcoat: .42, clearcoatRoughness: .32,
    side: THREE.DoubleSide, envMapIntensity: .45,
  });
  const group = new THREE.Group();
  group.add(new THREE.Mesh(geometry, outer));
  const edgeMaterial = new THREE.MeshStandardMaterial({ color: '#f4d39b', roughness: .44, metalness: 0 });
  for (const offset of [-1, 1]) {
    const edgePoints = centers.map((p, i) => {
      const t = i / count, a = -1.25 + t * Math.PI * 2.25;
      const width = .10 + .04 * Math.sin(t * Math.PI);
      return p.clone().add(new THREE.Vector3(Math.cos(a) * .75, .38 * Math.cos(t * TAU), Math.sin(a) * .75).normalize().multiplyScalar(width * offset));
    });
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edgePoints), 80, .006, 4, false), edgeMaterial));
  }
  group.position.set(.30, -.04, .05);
  group.rotation.set(-.10, -.5, -.23);
  return group;
}

function buildCoupe() {
  const group = new THREE.Group();
  group.scale.set(.80, 1, .80);
  // A transparent page has no renderable background for physical transmission.
  // Use a clear thin shell with view-dependent Fresnel alpha instead: the page
  // remains visible through the center, while real PMREM reflections define edges.
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#d5dfcd', metalness: .05, roughness: .022, transmission: 0,
    ior: 1.46, clearcoat: 1, clearcoatRoughness: .025,
    envMapIntensity: .75, side: THREE.DoubleSide,
    transparent: true, opacity: .14, depthWrite: false, forceSinglePass: true,
  });
  glass.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      float glassFresnel = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 3.0);
      diffuseColor.a = 0.025 + 0.64 * glassFresnel;
      #include <opaque_fragment>
    `);
  };
  glass.customProgramCacheKey = () => 'glassnote-clear-shell-v2';
  const stemGlass = glass.clone();
  stemGlass.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      float stemFresnel = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.7);
      diffuseColor.a = 0.07 + 0.76 * stemFresnel;
      #include <opaque_fragment>
    `);
  };
  stemGlass.customProgramCacheKey = () => 'glassnote-bright-stem-v3';
  stemGlass.roughness = .025;
  stemGlass.envMapIntensity = 1.55;
  stemGlass.emissive.set('#c5d4bb');
  stemGlass.emissiveIntensity = .17;

  // A closed, curved profile makes the bowl a real glass shell.
  const outer = profile([
    [.075, 1.92], [.12, 1.96], [.32, 2.00], [.64, 2.11],
    [1.02, 2.30], [1.34, 2.54], [1.49, 2.73], [1.505, 2.785],
  ], 56);
  const rim = profile([[1.505, 2.785], [1.502, 2.807], [1.481, 2.816], [1.461, 2.798]], 8);
  const inner = profile([
    [1.461, 2.798], [1.452, 2.739], [1.301, 2.553], [1.00, 2.33],
    [.62, 2.147], [.30, 2.036], [.095, 1.995], [.075, 1.92],
  ], 56);
  const bowl = new THREE.Mesh(new THREE.LatheGeometry([...outer, ...rim.slice(1), ...inner.slice(1)], 160), glass);
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
    color: '#f6efd8', roughness: .04, metalness: .22,
    envMapIntensity: 1.25, transparent: true, opacity: .46, depthWrite: false,
    emissive: '#c2d1b9', emissiveIntensity: .16, clearcoat: 1,
  });
  const lip = new THREE.Mesh(new THREE.TorusGeometry(1.484, .011, 10, 160), lipMaterial);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 2.803;
  lip.renderOrder = 21;
  group.add(lip);

  const liquidMaterial = new THREE.MeshPhysicalMaterial({
    color: '#bb671a', metalness: 0, roughness: .10, transmission: 0,
    ior: 1.335, clearcoat: 1, clearcoatRoughness: .045,
    envMapIntensity: .38, side: THREE.FrontSide,
    transparent: true, opacity: .90, depthWrite: false,
    emissive: '#d28b28', emissiveIntensity: .72,
  });
  liquidMaterial.onBeforeCompile = shader => {
    shader.vertexShader = 'varying float vLiquidHeight;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvLiquidHeight = position.y;');
    shader.fragmentShader = 'varying float vLiquidHeight;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
      #include <emissivemap_fragment>
      totalEmissiveRadiance *= mix(0.50, 1.12, smoothstep(2.04, 2.62, vLiquidHeight));
    `);
  };
  liquidMaterial.customProgramCacheKey = () => 'glassnote-amber-volume-v3';
  const liquid = lathe([
    [.001, 2.032], [.22, 2.052], [.53, 2.143], [.83, 2.278],
    [1.10, 2.445], [1.30, 2.596], [1.313, 2.611],
    [1.255, 2.611], [.88, 2.611], [.39, 2.611], [.001, 2.611],
  ], liquidMaterial, 144);
  liquid.renderOrder = 8;
  group.add(liquid);

  // A separate level surface keeps a readable amber meniscus and crisp highlights.
  const surfaceMaterial = new THREE.MeshPhysicalMaterial({
    color: '#cd8828', metalness: 0, roughness: .045,
    clearcoat: 1, clearcoatRoughness: .04, envMapIntensity: .46,
    transparent: true, opacity: .96, depthWrite: false, side: THREE.DoubleSide,
    emissive: '#e6a037', emissiveIntensity: .90,
  });
  surfaceMaterial.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec2 vLiquidSurface;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvLiquidSurface = position.xy;');
    shader.fragmentShader = 'varying vec2 vLiquidSurface;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
      #include <emissivemap_fragment>
      float amberRadius = clamp(length(vLiquidSurface) / 1.295, 0.0, 1.0);
      totalEmissiveRadiance *= mix(1.12, 0.54, smoothstep(0.18, 1.0, amberRadius));
    `);
  };
  surfaceMaterial.customProgramCacheKey = () => 'glassnote-amber-surface-v3';
  const surface = new THREE.Mesh(new THREE.CircleGeometry(1.295, 144), surfaceMaterial);
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = 2.613;
  surface.renderOrder = 9;
  group.add(surface);

  const meniscusMaterial = new THREE.MeshPhysicalMaterial({
    color: '#e6bd75', roughness: .12, metalness: .12, transmission: 0,
    envMapIntensity: .75, transparent: true, opacity: .62, depthWrite: false,
    emissive: '#ebb264', emissiveIntensity: .18,
  });
  const meniscus = new THREE.Mesh(new THREE.TorusGeometry(1.30, .009, 8, 144), meniscusMaterial);
  meniscus.rotation.x = Math.PI / 2;
  meniscus.position.y = 2.608;
  meniscus.renderOrder = 10;
  group.add(meniscus);

  // A small orange twist gives the rotationally symmetric glass a readable orientation.
  const twist = makeCitrusTwist();
  group.add(twist);
  group.position.y = -1.55;
  return { group, liquidMaterial, surfaceMaterial };
}

/**
 * @param {HTMLElement} container A positioned element whose CSS sets stage size.
 * @param {{reduced?:boolean,paused?:boolean}} options
 * @returns {{setScene:Function,setPaused:Function,setReduced:Function,dispose:Function}}
 * setScene('home'|'mode'|'guided'|'results'|'recipe'|'discover', {duration:1.5})
 * Duration is in seconds. Paused/reduced states display the destination pose.
 */
export function createGlassStage(container, { reduced = false, paused = false } = {}) {
  if (!(container instanceof HTMLElement)) throw new TypeError('Glass stage needs an HTML container.');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  } catch (error) {
    container.dataset.glassError = 'webgl-unavailable';
    console.warn('Glassnote 3D stage is unavailable.', error);
    return { setScene() {}, setPaused() {}, setReduced() {}, dispose() {} };
  }
  const canvas = renderer.domElement;
  canvas.className = 'glass-stage-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
  container.appendChild(canvas);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .93;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.transmissionResolutionScale = .85;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, .1, 60);
  const environment = new RoomEnvironment();
  // Warm luminous panels produce broad editorial highlights rather than point sparkles.
  environment.traverse(object => {
    const material = object.material;
    if (material?.emissiveIntensity > 10) {
      material.emissive.set('#fff2dc');
      material.emissiveIntensity *= .70;
    } else if (material?.isMeshStandardMaterial) material.color.set('#11291d');
  });
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentTarget = pmrem.fromScene(environment, .035);
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = .65;
  environment.dispose();
  pmrem.dispose();

  const warmKey = new THREE.DirectionalLight('#fff4dc', 1.8);
  warmKey.position.set(-3.5, 5.5, 4);
  scene.add(warmKey);
  const rimLight = new THREE.DirectionalLight('#dbe8da', 1.4);
  rimLight.position.set(4, 2.5, -2);
  scene.add(rimLight);
  scene.add(new THREE.HemisphereLight('#fff5e3', '#143b27', .65));
  const { group, liquidMaterial, surfaceMaterial } = buildCoupe();
  scene.add(group);

  const shadowMap = shadowTexture();
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 2.75),
    new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false, opacity: .60, toneMapped: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -1.491, 0);
  scene.add(shadow);

  let dead = false, contextLost = false, ready = false, frameId = 0, lastTime = 0, elapsed = 0, tween = null;
  let quality = Math.min(window.devicePixelRatio || 1, 1.6), slowFrames = 0, sampledFrames = 0;
  let isReduced = !!reduced, isPaused = !!paused;
  let stageAspect = 1, frameDistance = 0;
  const state = { ...COMPOSITIONS.home, color: new THREE.Color(COMPOSITIONS.home.tint) };
  const amberLift = new THREE.Color('#e7a43b');
  let destination = { ...COMPOSITIONS.home };
  const lookAt = new THREE.Vector3(0, -.02, 0);

  function settle() {
    NUMERIC_KEYS.forEach(key => { state[key] = destination[key]; });
    state.color.set(destination.tint);
    tween = null;
  }

  function draw() {
    if (dead || contextLost || !ready) return;
    const moving = !isReduced && !isPaused;
    const drift = moving ? elapsed : 0;
    const breathe = moving ? Math.sin(drift * TAU / 12) : 0;
    group.position.set(.025 * Math.sin(drift * TAU / 16), -1.55 + state.lift + breathe * .025, 0);
    group.rotation.set(.010 * Math.sin(drift * TAU / 18), state.turn + .065 * Math.sin(drift * TAU / 18), state.lean + .007 * breathe);
    liquidMaterial.color.copy(state.color);
    liquidMaterial.emissive.copy(state.color).lerp(amberLift, .36);
    surfaceMaterial.color.copy(state.color).lerp(amberLift, .18);
    surfaceMaterial.emissive.copy(state.color).lerp(amberLift, .58);
    const distance = state.distance + frameDistance;
    camera.position.set(Math.sin(state.yaw) * distance, state.eye, Math.cos(state.yaw) * distance);
    camera.lookAt(lookAt);
    shadow.material.opacity = .58 - state.lift * 1.6;
    renderer.render(scene, camera);
  }

  function tick(time) {
    if (dead || contextLost || isPaused || isReduced) { frameId = 0; return; }
    frameId = requestAnimationFrame(tick);
    // Cap very dense mobile displays while keeping the slow movement continuous.
    const delta = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0;
    lastTime = time;
    elapsed += delta;
    // Keep the approved geometry/materials. On sustained dropped frames, lower
    // only the pixel workload rather than stepping the visible motion at 30Hz.
    if (delta > 0) {sampledFrames++; if (delta > .025) slowFrames++;}
    if (sampledFrames === 60) {
      if (slowFrames > 18 && quality > 1) {
        quality = Math.max(1, quality - .2);
        renderer.setPixelRatio(quality);
        container.dataset.glassPixelRatio = quality.toFixed(2);
      }
      sampledFrames = 0; slowFrames = 0;
    }
    if (tween) {
      const fraction = Math.min(1, (elapsed - tween.start) / tween.duration);
      const ease = easeInOutCubic(fraction);
      NUMERIC_KEYS.forEach(key => { state[key] = THREE.MathUtils.lerp(tween.from[key], tween.to[key], ease); });
      state.color.copy(tween.from.color).lerp(tween.to.color, ease);
      if (fraction === 1) tween = null;
    }
    draw();
  }

  function restart() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    lastTime = 0;
    const running = !dead && !contextLost && ready && !isPaused && !isReduced;
    container.dataset.glassMotion = running ? 'running' : 'paused';
    if (running) frameId = requestAnimationFrame(tick);
    else draw();
  }

  function resize() {
    if (dead) return;
    // CSS scale is an animation pose, not the render-buffer size. Measuring
    // client dimensions avoids resize/draw churn and double-scaled sampling.
    const width = container.clientWidth, height = container.clientHeight;
    if (width < 2 || height < 2) return;
    stageAspect = width / height;
    camera.aspect = stageAspect;
    camera.updateProjectionMatrix();
    // At normal desktop aspect, the entire sculpture occupies roughly 80% of height.
    // On portrait stages, retreat only enough to retain both sides of the wide coupe.
    const minimumDistance = 2.82 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * stageAspect);
    frameDistance = Math.max(0, minimumDistance - 6.35);
    renderer.setSize(width, height, false);
    draw();
  }
  const lost = event => {
    event.preventDefault();
    contextLost = true;
    container.dataset.glassError = 'context-lost';
    restart();
  };
  const restored = () => {
    contextLost = false;
    delete container.dataset.glassError;
    resize();
    restart();
  };
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();
  container.dataset.glassPixelRatio = quality.toFixed(2);
  // Warm shaders with KHR_parallel_shader_compile before foreground entrances
  // compete for the main thread. The orbital backdrop is already visible.
  void renderer.compileAsync(scene, camera).then(() => {
    if (dead) return;
    ready = true;
    restart();
  }).catch(() => {if (!dead) {ready = true; restart();}});

  return {
    setScene(name, { duration = 1.5 } = {}) {
      if (dead) return;
      destination = { ...(COMPOSITIONS[name] || COMPOSITIONS.home) };
      container.dataset.glassScene = name in COMPOSITIONS ? name : 'home';
      duration = Number.isFinite(duration) ? Math.max(0, duration) : 1.5;
      if (isReduced || isPaused || duration === 0) { settle(); draw(); return; }
      tween = {
        from: { ...state, color: state.color.clone() },
        to: { ...destination, color: new THREE.Color(destination.tint) },
        start: elapsed,
        duration,
      };
    },
    setPaused(value) {
      isPaused = !!value;
      if (isPaused) settle();
      restart();
    },
    setReduced(value) {
      isReduced = !!value;
      if (isReduced) settle();
      restart();
    },
    dispose() {
      if (dead) return;
      dead = true;
      container.dataset.glassMotion = 'paused';
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      const geometries = new Set(), materials = new Set();
      scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      shadowMap.dispose();
      environmentTarget.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
