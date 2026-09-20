import * as THREE from "/assets/vendor/v7/three.module.min.js";

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

const canvas = document.getElementById("v7-canvas");
const fallback = document.querySelector(".v7-fallback");
const engineBadge = document.getElementById("v7-engine");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarsePointer = matchMedia("(pointer: coarse)").matches;
const mobile = innerWidth < 700;

const debug = window.__V7_DEBUG__ = {
  version: "7.1.1",
  ready: false,
  frames: 0,
  webgl: false,
  error: null,
  objects: 0,
  machines: 0,
  reducedMotion: reduced,
  fallback: false,
  canvasZ: null,
  worldZ: null,
  storyZ: null,
  activeScene: "boot"
};

const C = {
  cyan: 0x00e7ff,
  blue: 0x4aa8ff,
  violet: 0x8b5cff,
  magenta: 0xff2bd6,
  orange: 0xff7a18,
  green: 0x54ffac
};

let renderer, scene, camera, clock, worldRig;
let coreGroup, coreCrystal, innerCore, crystalWire, shardGroup, tunnelGroup, ikoSprite;
let humanRig, humanSourceSprite, operatorSprite;
let archiveGroup, processGroup, forgeGroup, portalGroup;
let particlePoints, grid;
const rings = [];
const tunnelRings = [];
const archiveCores = [];
const projectMachines = [];
const processNodes = [];
const portalRings = [];
const cameraTarget = { x: 0, y: 0, z: 0 };
const pointerTarget = { x: 0, y: 0 };
const pointer = { x: 0, y: 0 };

function rememberOpacity(material, opacity) {
  material.transparent = true;
  material.opacity = opacity;
  material.userData.baseOpacity = opacity;
  return material;
}

const additive = (color, opacity = 0.75) => rememberOpacity(new THREE.MeshBasicMaterial({
  color,
  depthWrite: false,
  blending: THREE.AdditiveBlending
}), opacity);

const lineMaterial = (color, opacity = 0.55) => rememberOpacity(new THREE.LineBasicMaterial({
  color,
  depthWrite: false,
  blending: THREE.AdditiveBlending
}), opacity);

const standard = (color, emissive, opacity = 0.72, emissiveIntensity = 0.8) => rememberOpacity(
  new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity,
    metalness: 0.68,
    roughness: 0.23,
    depthWrite: false
  }),
  opacity
);

const loadTexture = url => new THREE.TextureLoader().loadAsync(url);

function setEngine(state, label) {
  if (!engineBadge) return;
  engineBadge.dataset.state = state;
  engineBadge.textContent = label;
}

function fail(error) {
  const message = error instanceof Error ? error.message : String(error);
  debug.error = message;
  debug.ready = false;
  debug.webgl = false;
  debug.fallback = true;
  document.documentElement.dataset.v7Render = "fallback";
  canvas.hidden = true;
  setEngine("error", "3D ENGINE // FALLBACK");
  if (fallback) fallback.hidden = false;
  console.error("V7 WebGL initialization failed:", error);
}

function syncDebugLayers() {
  const world = document.querySelector(".v7-world");
  const story = document.querySelector(".v7-story");
  debug.worldZ = Number.parseInt(getComputedStyle(world).zIndex, 10);
  debug.canvasZ = Number.parseInt(getComputedStyle(canvas).zIndex, 10);
  debug.storyZ = Number.parseInt(getComputedStyle(story).zIndex, 10);
}

function eachMaterial(group, callback) {
  const seen = new Set();
  group.traverse(object => {
    const list = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
    list.forEach(material => {
      if (seen.has(material)) return;
      seen.add(material);
      callback(material, object);
    });
  });
}

function setGroupFactor(group, factor) {
  eachMaterial(group, material => {
    const base = material.userData.baseOpacity ?? 1;
    material.opacity = base * factor;
  });
}

function fadeGroup(timeline, group, factor, at, duration = 0.55) {
  eachMaterial(group, material => {
    const base = material.userData.baseOpacity ?? 1;
    timeline.to(material, { opacity: base * factor, duration }, at);
  });
}

function makeWireBox(width, height, depth, color, opacity = 0.5) {
  return new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth)),
    lineMaterial(color, opacity)
  );
}

function makeTradeCoreMachine() {
  const rig = new THREE.Group();
  const shell = makeWireBox(1.65, 1.65, 1.2, C.cyan, 0.48);
  rig.add(shell);

  const reactor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.48, 1.1, 12, 1, true),
    standard(0x06374a, C.cyan, 0.62, 1.05)
  );
  reactor.rotation.z = Math.PI / 2;
  rig.add(reactor);

  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.62 + i * 0.2, 0.022, 6, 84),
      additive(i === 1 ? C.violet : C.cyan, 0.42 - i * 0.06)
    );
    ring.rotation.y = Math.PI / 2;
    ring.rotation.x = i * 0.28;
    rig.add(ring);
  }

  for (let i = 0; i < 8; i++) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.055, 0.45 + (i % 3) * 0.12),
      additive(i % 2 ? C.cyan : C.green, 0.38)
    );
    const angle = i / 8 * Math.PI * 2;
    bar.position.set(Math.cos(angle) * 0.92, Math.sin(angle) * 0.92, 0);
    bar.rotation.z = angle;
    rig.add(bar);
  }

  rig.userData.kind = "trade-core";
  return rig;
}

function makeMorseMachine() {
  const rig = new THREE.Group();
  const frame = makeWireBox(2.1, 1.35, 0.85, C.violet, 0.42);
  rig.add(frame);

  const points = [];
  for (let i = 0; i < 24; i++) {
    const x = -0.92 + i * 0.08;
    const y = Math.sin(i * 0.9) * 0.28 * (0.7 + (i % 4) * 0.08);
    points.push(new THREE.Vector3(x, y, 0.18));
  }
  const waveform = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    lineMaterial(C.magenta, 0.72)
  );
  rig.add(waveform);

  for (let i = 0; i < 9; i++) {
    const height = i % 3 === 0 ? 0.72 : i % 2 ? 0.32 : 0.18;
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(i % 3 === 0 ? 0.16 : 0.08, height, 0.06),
      additive(i % 3 === 0 ? C.magenta : C.violet, 0.52)
    );
    bar.position.set(-0.82 + i * 0.205, -0.38, -0.08);
    rig.add(bar);
  }

  const pulse = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.018, 6, 72), additive(C.cyan, 0.32));
  pulse.rotation.y = Math.PI / 2;
  pulse.position.z = -0.18;
  rig.add(pulse);

  rig.userData.kind = "morsebound";
  return rig;
}

function makeEtteMachine() {
  const rig = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.42, 1),
    standard(0x1a1748, C.violet, 0.68, 0.95)
  );
  rig.add(core);

  for (let i = 0; i < 3; i++) {
    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(0.72 + i * 0.27, 0.016, 6, 84),
      additive([C.cyan, C.violet, C.magenta][i], 0.34)
    );
    orbit.rotation.x = Math.PI / 2 + (i - 1) * 0.38;
    orbit.rotation.y = (i - 1) * 0.32;
    rig.add(orbit);

    const satellite = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.13 + i * 0.025, 0),
      standard(0x161a38, [C.cyan, C.violet, C.magenta][i], 0.72, 1.1)
    );
    const angle = 0.8 + i * 2.05;
    satellite.position.set(Math.cos(angle) * (0.72 + i * 0.27), Math.sin(angle) * (0.72 + i * 0.27), i * 0.08);
    satellite.userData.orbitIndex = i;
    rig.add(satellite);
  }

  const axis = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.2, 0, 0),
      new THREE.Vector3(1.2, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 1.2, 0),
      new THREE.Vector3(0, -1.2, 0)
    ]),
    lineMaterial(C.cyan, 0.18)
  );
  rig.add(axis);

  rig.userData.kind = "ette";
  return rig;
}

function makeProcessRig() {
  const rig = new THREE.Group();
  const positions = [
    [-2.1, 0.7, 0],
    [-0.9, 1.35, -0.25],
    [0.25, 0.35, 0.1],
    [1.25, 1.05, -0.15],
    [2.1, -0.15, 0.15],
    [0.75, -1.05, -0.1],
    [-0.85, -0.7, 0.2],
    [-2.0, -1.15, -0.15]
  ];

  positions.forEach((position, index) => {
    const node = new THREE.Mesh(
      new THREE.OctahedronGeometry(index % 3 === 0 ? 0.18 : 0.11, 0),
      standard(0x0b2435, index % 3 === 0 ? C.magenta : C.cyan, 0.68, 1.15)
    );
    node.position.set(...position);
    rig.add(node);
    processNodes.push(node);
  });

  const links = [
    [0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6], [6, 7], [7, 0], [6, 2]
  ];
  links.forEach(([a, b], index) => {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...positions[a]),
        new THREE.Vector3(...positions[b])
      ]),
      lineMaterial(index % 3 === 0 ? C.magenta : C.cyan, 0.3)
    );
    rig.add(line);
  });

  for (let i = 0; i < 4; i++) {
    const plate = makeWireBox(0.75, 0.42, 0.12, i % 2 ? C.violet : C.cyan, 0.2);
    plate.position.set(-1.65 + i * 1.12, -1.75 + (i % 2) * 0.25, -0.55);
    rig.add(plate);
  }

  return rig;
}

function makeForgeRig() {
  const rig = new THREE.Group();
  portalGroup = new THREE.Group();

  for (let i = 0; i < 7; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.4 + i * 0.31, 0.021, 8, 180),
      additive(i % 2 ? C.magenta : C.cyan, 0.38 - i * 0.022)
    );
    ring.position.z = -i * 0.2;
    ring.rotation.z = i * 0.13;
    portalGroup.add(ring);
    portalRings.push(ring);
  }
  rig.add(portalGroup);

  const framePieces = [
    [-2.35, 1.55, 1.2, 0.055],
    [2.35, 1.55, 1.2, 0.055],
    [-2.35, -1.55, 1.2, 0.055],
    [2.35, -1.55, 1.2, 0.055],
    [0, 2.05, 4.1, 0.045],
    [0, -2.05, 4.1, 0.045]
  ];
  framePieces.forEach(([x, y, width, height], index) => {
    const piece = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, 0.06),
      additive(index % 2 ? C.magenta : C.cyan, 0.34)
    );
    piece.position.set(x, y, -0.3);
    if (Math.abs(x) > 2) piece.rotation.z = Math.PI / 2;
    piece.userData.framePiece = true;
    rig.add(piece);
  });

  for (let i = 0; i < 12; i++) {
    const pin = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.18 + (i % 3) * 0.07, 0.025),
      additive(i % 3 === 0 ? C.magenta : C.cyan, 0.38)
    );
    const angle = i / 12 * Math.PI * 2;
    pin.position.set(Math.cos(angle) * 2.7, Math.sin(angle) * 2.7, -0.45);
    pin.rotation.z = angle;
    rig.add(pin);
  }

  return rig;
}

async function init() {
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    debug.webgl = Boolean(renderer.getContext());
    document.documentElement.dataset.v7Render = "webgl";
  } catch (error) {
    fail(error);
    return;
  }

  canvas.addEventListener("webglcontextlost", event => {
    event.preventDefault();
    debug.webgl = false;
    fail(new Error("WebGL context lost"));
  });

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.15 : 1.55));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(
    document.documentElement.dataset.uiTheme === "light" ? 0xeef7fd : 0x02070d,
    0.04
  );

  camera = new THREE.PerspectiveCamera(44, innerWidth / innerHeight, 0.1, 120);
  camera.position.set(0, 0.2, 8.5);
  clock = new THREE.Clock();

  worldRig = new THREE.Group();
  scene.add(worldRig);

  scene.add(new THREE.HemisphereLight(0x8feeff, 0x120516, 1.45));
  const cyanLight = new THREE.PointLight(C.cyan, 17, 22, 2);
  cyanLight.position.set(3.5, 2.8, 4.5);
  const magentaLight = new THREE.PointLight(C.magenta, 11, 20, 2);
  magentaLight.position.set(-4.5, -1.4, 2.6);
  scene.add(cyanLight, magentaLight);

  coreGroup = new THREE.Group();
  coreGroup.position.set(1.55, 0.02, -0.45);
  worldRig.add(coreGroup);

  coreCrystal = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.5, 2),
    standard(0x04131f, C.cyan, 0.16, 0.46)
  );
  coreCrystal.position.z = -0.85;
  coreGroup.add(coreCrystal);

  crystalWire = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.72, 1)),
    lineMaterial(C.cyan, 0.5)
  );
  crystalWire.position.z = -0.72;
  coreGroup.add(crystalWire);

  innerCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.56, 0),
    standard(0x24113b, C.magenta, 0.4, 0.9)
  );
  innerCore.position.z = -0.62;
  coreGroup.add(innerCore);

  [
    [2.18, 0.023, C.cyan, 0.62],
    [2.52, 0.017, C.violet, 0.46],
    [2.86, 0.013, C.magenta, 0.34]
  ].forEach(([radius, tube, color, opacity], index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, tube, 8, 192),
      additive(color, opacity)
    );
    ring.rotation.x = (index - 1) * 0.18;
    ring.rotation.y = (index - 1) * 0.12;
    ring.position.z = -0.12 - index * 0.1;
    coreGroup.add(ring);
    rings.push(ring);
  });

  for (let i = 0; i < 12; i++) {
    const tick = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, i % 3 === 0 ? 0.66 : 0.34, 0.03),
      additive(i % 2 === 0 ? C.cyan : C.magenta, 0.56)
    );
    const angle = i * Math.PI / 6;
    tick.position.set(Math.cos(angle) * 2.98, Math.sin(angle) * 2.98, -0.18);
    tick.rotation.z = angle - Math.PI / 2;
    coreGroup.add(tick);
  }

  shardGroup = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const shard = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.1 + (i % 4) * 0.022, 0),
      standard(i % 2 ? 0x063040 : 0x23153f, i % 3 ? C.cyan : C.magenta, 0.58, 0.78)
    );
    const angle = i / 14 * Math.PI * 2;
    const radius = 3.25 + (i % 3) * 0.2;
    shard.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius * 0.78,
      -0.9 - (i % 5) * 0.2
    );
    shard.rotation.set(angle * 0.7, angle * 1.2, angle * 0.45);
    shardGroup.add(shard);
  }
  coreGroup.add(shardGroup);

  const ikoTexture = await loadTexture("/assets/iko-prime/identity/iko-prime-logo-locked.png");
  const ikoMaterial = rememberOpacity(new THREE.SpriteMaterial({
    map: ikoTexture,
    depthWrite: false
  }), 0.98);
  ikoSprite = new THREE.Sprite(ikoMaterial);
  ikoSprite.scale.set(4.75, 4.75, 1);
  ikoSprite.position.set(0.12, -0.05, 0.42);
  coreGroup.add(ikoSprite);

  tunnelGroup = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const color = i % 3 === 0 ? C.magenta : i % 2 === 0 ? C.violet : C.cyan;
    const tunnelRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.45 + i * 0.08, 0.012 + (i % 2) * 0.004, 6, 144),
      additive(color, 0.08 + (11 - i) * 0.012)
    );
    tunnelRing.position.z = -1.5 - i * 1.12;
    tunnelRing.rotation.z = i * 0.12;
    tunnelGroup.add(tunnelRing);
    tunnelRings.push(tunnelRing);
  }
  worldRig.add(tunnelGroup);

  const profileTexture = await loadTexture("/assets/v7/charles-profile-source.webp");
  const operatorTexture = await loadTexture("/assets/v7/charles-operator-v7.webp");

  humanRig = new THREE.Group();
  humanRig.position.set(-1.55, -0.1, -0.15);

  const operatorMaterial = rememberOpacity(new THREE.SpriteMaterial({
    map: operatorTexture,
    depthWrite: false
  }), 0.92);
  operatorSprite = new THREE.Sprite(operatorMaterial);
  operatorSprite.scale.set(3.9, 4.9, 1);
  operatorSprite.position.set(0, -0.25, 0.25);
  humanRig.add(operatorSprite);

  const sourceMaterial = rememberOpacity(new THREE.SpriteMaterial({
    map: profileTexture,
    depthWrite: false
  }), 0.26);
  humanSourceSprite = new THREE.Sprite(sourceMaterial);
  humanSourceSprite.scale.set(1.35, 1.35, 1);
  humanSourceSprite.position.set(-1.65, -1.5, 0.45);
  humanRig.add(humanSourceSprite);

  const humanFrame = makeWireBox(3.2, 4.3, 0.9, C.cyan, 0.38);
  humanFrame.position.set(0, -0.2, -0.45);
  humanRig.add(humanFrame);

  for (let i = 0; i < 8; i++) {
    const scan = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 0.012, 0.02),
      additive(i % 2 ? C.cyan : C.violet, 0.14)
    );
    scan.position.set(0, -1.8 + i * 0.52, -0.22);
    humanRig.add(scan);
  }

  const humanHalo = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.018, 6, 96), additive(C.magenta, 0.2));
  humanHalo.position.set(0, -0.15, -0.6);
  humanHalo.rotation.y = 0.2;
  humanRig.add(humanHalo);

  setGroupFactor(humanRig, 0);
  worldRig.add(humanRig);

  const particleCount = mobile ? 360 : 1120;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 18;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 11;
    positions[i * 3 + 2] = -1.5 - Math.random() * 16;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particlePoints = new THREE.Points(
    particleGeometry,
    rememberOpacity(new THREE.PointsMaterial({
      color: C.cyan,
      size: mobile ? 0.023 : 0.03,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }), 0.44)
  );
  scene.add(particlePoints);

  grid = new THREE.GridHelper(24, 48, C.cyan, 0x17384d);
  grid.material.transparent = true;
  grid.material.opacity = 0.17;
  grid.position.set(0, -3.15, -3.2);
  scene.add(grid);

  archiveGroup = new THREE.Group();
  archiveGroup.position.set(0.75, 0.05, -1.25);

  const tradeMachine = makeTradeCoreMachine();
  tradeMachine.position.set(-1.45, 0.62, 0.05);
  tradeMachine.scale.setScalar(0.92);

  const morseMachine = makeMorseMachine();
  morseMachine.position.set(1.45, 0.72, -0.35);
  morseMachine.scale.setScalar(0.84);

  const etteMachine = makeEtteMachine();
  etteMachine.position.set(0.55, -1.42, -0.15);
  etteMachine.scale.setScalar(0.86);

  archiveGroup.add(tradeMachine, morseMachine, etteMachine);
  projectMachines.push(tradeMachine, morseMachine, etteMachine);
  debug.machines = projectMachines.length;
  setGroupFactor(archiveGroup, 0);
  worldRig.add(archiveGroup);

  processGroup = makeProcessRig();
  processGroup.position.set(-1.35, 0.25, -1.3);
  processGroup.scale.setScalar(0.92);
  setGroupFactor(processGroup, 0);
  worldRig.add(processGroup);

  forgeGroup = makeForgeRig();
  forgeGroup.position.set(1.7, 0, -1.15);
  forgeGroup.scale.setScalar(0.9);
  setGroupFactor(forgeGroup, 0);
  worldRig.add(forgeGroup);

  document.documentElement.dataset.v7Motion = reduced ? "reduced" : "full";
  setupTimeline();
  setupSceneStateTracking();
  setupPointer();
  resize();
  syncDebugLayers();
  scene.traverse(() => { debug.objects += 1; });
  debug.ready = true;
  if (reduced) {
    setEngine("online", "3D ENGINE // STATIC");
    renderOnce();
  } else {
    setEngine("online", "3D ENGINE // ONLINE");
    animate();
  }
}


function setActiveScene(section, index) {
  if (!section) return;
  debug.activeScene = section.dataset.scene || String(index + 1);
  document.querySelectorAll(".v7-rail-left span").forEach((element, railIndex) => {
    element.classList.toggle("is-active", index === railIndex);
  });
}

function setupSceneStateTracking() {
  const sections = [...document.querySelectorAll(".v7-scene")];
  if (!sections.length) return;

  if (gsap && ScrollTrigger && !reduced) {
    sections.forEach((section, index) => {
      ScrollTrigger.create({
        trigger: section,
        start: "top 55%",
        end: "bottom 45%",
        onToggle: self => {
          if (self.isActive) setActiveScene(section, index);
        }
      });
    });
    return;
  }

  let scheduled = false;
  const update = () => {
    scheduled = false;
    const viewportCenter = scrollY + innerHeight * 0.5;
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    sections.forEach((section, index) => {
      const top = section.offsetTop;
      const center = top + section.offsetHeight * 0.5;
      const distance = Math.abs(center - viewportCenter);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    setActiveScene(sections[bestIndex], bestIndex);
  };

  const queue = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  };

  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue, { passive: true });
  update();
}

function renderOnce() {
  if (!renderer || !scene || !camera) return;
  camera.lookAt(cameraTarget.x, cameraTarget.y, cameraTarget.z);
  renderer.render(scene, camera);
  debug.frames += 1;
}

function setupTimeline() {
  if (!gsap || !ScrollTrigger || reduced) return;

  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: ".v7-story",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.05,
      invalidateOnRefresh: true
    }
  });

  timeline
    .to(camera.position, { z: 6.9, y: 0.08, duration: 1 }, 0)
    .to(cameraTarget, { x: 0.9, y: 0.02, z: -0.4, duration: 1 }, 0)
    .to(coreGroup.rotation, { z: 0.42, y: 0.16, duration: 1 }, 0)
    .to(tunnelGroup.position, { z: 1.6, duration: 1 }, 0)
    .to(rings[0].rotation, { z: 1.1, duration: 1 }, 0)
    .to(rings[1].rotation, { z: -0.82, duration: 1 }, 0);

  timeline
    .to(coreGroup.position, { x: 4.05, y: 1.05, z: -2.35, duration: 0.95 }, 0.92)
    .to(coreGroup.scale, { x: 0.34, y: 0.34, z: 0.34, duration: 0.95 }, 0.92)
    .to(ikoSprite.material, { opacity: 0.13, duration: 0.62 }, 1.04)
    .to(coreCrystal.material, { opacity: 0.04, duration: 0.62 }, 1.04)
    .to(camera.position, { x: -0.45, y: 0.05, z: 7.15, duration: 0.95 }, 0.92)
    .to(cameraTarget, { x: -1.15, y: -0.05, z: -0.25, duration: 0.95 }, 0.92);

  fadeGroup(timeline, humanRig, 1, 1.05, 0.62);
  timeline
    .fromTo(humanRig.position, { x: -2.0 }, { x: -1.55, duration: 0.7 }, 1.05)
    .to(humanRig.rotation, { y: 0.08, z: -0.025, duration: 0.7 }, 1.05);

  fadeGroup(timeline, humanRig, 0, 1.86, 0.34);
  timeline
    .to(humanRig.position, { x: -2.65, z: -2.4, duration: 0.46 }, 1.86)
    .to(coreGroup.position, { x: 3.55, y: 2.15, z: -3.15, duration: 0.62 }, 2.0)
    .to(coreGroup.scale, { x: 0.24, y: 0.24, z: 0.24, duration: 0.62 }, 2.0)
    .to(ikoSprite.material, { opacity: 0.62, duration: 0.5 }, 2.0)
    .to(camera.position, { x: 0.55, y: 0.25, z: 7.8, duration: 0.82 }, 2.0)
    .to(cameraTarget, { x: 0.65, y: 0, z: -1.0, duration: 0.82 }, 2.0);

  fadeGroup(timeline, archiveGroup, 1, 1.98, 0.58);
  timeline
    .fromTo(archiveGroup.scale, { x: 0.76, y: 0.76, z: 0.76 }, { x: 1, y: 1, z: 1, duration: 0.7 }, 1.98)
    .to(archiveGroup.rotation, { y: -0.18, x: 0.035, duration: 0.85 }, 2.02);

  fadeGroup(timeline, archiveGroup, 0.04, 3.03, 0.45);
  fadeGroup(timeline, processGroup, 1, 3.08, 0.58);
  timeline
    .to(archiveGroup.position, { x: 1.7, z: -3.0, duration: 0.52 }, 3.03)
    .fromTo(processGroup.rotation, { y: -0.28 }, { y: 0.08, duration: 0.62 }, 3.08)
    .to(camera.position, { x: -0.4, y: 0.18, z: 7.2, duration: 0.78 }, 3.02)
    .to(cameraTarget, { x: -1.1, y: -0.1, z: -1.1, duration: 0.78 }, 3.02);

  fadeGroup(timeline, processGroup, 0.05, 4.0, 0.44);
  fadeGroup(timeline, forgeGroup, 1, 4.06, 0.58);
  timeline
    .to(processGroup.position, { x: -2.2, z: -3.1, duration: 0.48 }, 4.0)
    .fromTo(forgeGroup.scale, { x: 0.66, y: 0.66, z: 0.66 }, { x: 0.9, y: 0.9, z: 0.9, duration: 0.7 }, 4.06)
    .to(camera.position, { x: 0.35, y: 0.05, z: 6.3, duration: 0.82 }, 4.02)
    .to(cameraTarget, { x: 1.55, y: 0, z: -1.2, duration: 0.82 }, 4.02);

  fadeGroup(timeline, forgeGroup, 0.12, 5.0, 0.5);
  timeline
    .to(forgeGroup.position, { x: 0, y: 0, z: -6.5, duration: 0.7 }, 5.0)
    .to(forgeGroup.scale, { x: 1.55, y: 1.55, z: 1.55, duration: 0.7 }, 5.0)
    .to(coreGroup.position, { x: 0, y: 0, z: -1.0, duration: 0.72 }, 5.0)
    .to(coreGroup.scale, { x: 0.72, y: 0.72, z: 0.72, duration: 0.72 }, 5.0)
    .to(ikoSprite.material, { opacity: 0.48, duration: 0.58 }, 5.08)
    .to(coreCrystal.material, { opacity: 0.07, duration: 0.58 }, 5.08)
    .to(camera.position, { x: 0, y: 0, z: 7.6, duration: 0.72 }, 5.0)
    .to(cameraTarget, { x: 0, y: 0, z: -0.8, duration: 0.72 }, 5.0);

}

function setupPointer() {
  if (reduced || coarsePointer) return;
  addEventListener("pointermove", event => {
    pointerTarget.x = (event.clientX / innerWidth - 0.5) * 2;
    pointerTarget.y = (event.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  addEventListener("pointerleave", () => {
    pointerTarget.x = 0;
    pointerTarget.y = 0;
  }, { passive: true });
}

const themeButton = document.getElementById("v7-theme");
function syncTheme() {
  const theme = document.documentElement.dataset.uiTheme === "light" ? "light" : "dark";
  if (themeButton) themeButton.textContent = theme.toUpperCase();
  if (scene) scene.fog.color.set(theme === "light" ? 0xeef7fd : 0x02070d);
  if (reduced && debug.ready) renderOnce();
}

themeButton?.addEventListener("click", () => {
  const next = document.documentElement.dataset.uiTheme === "light" ? "dark" : "light";
  document.documentElement.dataset.uiTheme = next;
  document.documentElement.style.colorScheme = next;
  try { localStorage.setItem("icharles-ui-theme", next); } catch {}
  syncTheme();
});
syncTheme();

function resize() {
  if (!renderer || !camera) return;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.15 : 1.55));
  renderer.setSize(innerWidth, innerHeight, false);
  syncDebugLayers();
  if (reduced && debug.ready) renderOnce();
}
addEventListener("resize", resize, { passive: true });

function animate() {
  requestAnimationFrame(animate);
  if (!renderer || !scene || !camera || !clock) return;

  const time = clock.getElapsedTime();

  if (!reduced) {
    pointer.x += (pointerTarget.x - pointer.x) * 0.035;
    pointer.y += (pointerTarget.y - pointer.y) * 0.035;
    worldRig.rotation.y = pointer.x * 0.025;
    worldRig.rotation.x = pointer.y * -0.015;

    coreGroup.rotation.z += 0.00055;
    coreCrystal.rotation.x = time * 0.07;
    coreCrystal.rotation.y = time * 0.1;
    innerCore.rotation.x = -time * 0.3;
    innerCore.rotation.y = time * 0.38;
    shardGroup.rotation.z = -time * 0.045;

    shardGroup.children.forEach((shard, index) => {
      shard.rotation.x += 0.0013 + index * 0.000025;
      shard.rotation.y -= 0.001 + index * 0.000018;
    });

    rings.forEach((ring, index) => {
      ring.rotation.z += (index % 2 ? -0.00055 : 0.00042) * (index + 1);
    });

    tunnelRings.forEach((ring, index) => {
      ring.rotation.z += (index % 2 ? -1 : 1) * 0.00015 * (index + 1);
    });

    projectMachines.forEach((machine, index) => {
      machine.rotation.y += (index % 2 ? -1 : 1) * (0.00065 + index * 0.0002);
      machine.rotation.x = Math.sin(time * 0.35 + index) * 0.035;
    });

    processNodes.forEach((node, index) => {
      const scale = 1 + Math.sin(time * 1.2 + index * 0.7) * 0.1;
      node.scale.setScalar(scale);
      node.rotation.y += 0.002 + index * 0.0001;
    });

    portalRings.forEach((ring, index) => {
      ring.rotation.z += (index % 2 ? -1 : 1) * 0.00038 * (index + 1);
    });

    particlePoints.rotation.y = time * 0.007;
  }

  const lookX = cameraTarget.x + pointer.x * 0.18;
  const lookY = cameraTarget.y - pointer.y * 0.12;
  camera.lookAt(lookX, lookY, cameraTarget.z);

  renderer.render(scene, camera);
  debug.frames += 1;
}

setEngine("boot", "3D ENGINE // BOOTING");
init().catch(fail);
