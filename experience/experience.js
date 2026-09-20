import * as THREE from "/assets/vendor/v7/three.module.min.js";

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

const canvas = document.getElementById("v7-canvas");
const fallback = document.querySelector(".v7-fallback");
const engineBadge = document.getElementById("v7-engine");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

const debug = window.__V7_DEBUG__ = {
  version: "7.0.1",
  ready: false,
  frames: 0,
  webgl: false,
  error: null,
  objects: 0,
  canvasZ: null,
  worldZ: null,
  storyZ: null,
  activeScene: "boot"
};

let renderer, scene, camera, clock;
let coreGroup, coreCrystal, innerCore, shardGroup, tunnelGroup;
let ikoSprite, humanSourceSprite, operatorSprite;
let archiveGroup, portalGroup, particlePoints, grid;
const rings = [];
const tunnelRings = [];
const archiveCores = [];
const portalRings = [];

const C = {
  cyan: 0x00e7ff,
  blue: 0x4aa8ff,
  violet: 0x8b5cff,
  magenta: 0xff2bd6,
  orange: 0xff7a18
};

const additive = (color, opacity = 0.75) => new THREE.MeshBasicMaterial({
  color,
  transparent: true,
  opacity,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});

const lineMaterial = (color, opacity = 0.55) => new THREE.LineBasicMaterial({
  color,
  transparent: true,
  opacity,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});

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

function setMaterialOpacity(object, opacity) {
  if (object.material) object.material.opacity = opacity;
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
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.25 : 1.6));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(
    document.documentElement.dataset.uiTheme === "light" ? 0xeef7fd : 0x02070d,
    0.044
  );

  camera = new THREE.PerspectiveCamera(44, innerWidth / innerHeight, 0.1, 120);
  camera.position.set(0, 0.25, 8.4);
  camera.lookAt(0, 0, 0);
  clock = new THREE.Clock();

  scene.add(new THREE.HemisphereLight(0x8feeff, 0x120516, 1.55));
  const cyanLight = new THREE.PointLight(C.cyan, 18, 22, 2);
  cyanLight.position.set(3.5, 2.8, 4.5);
  const magentaLight = new THREE.PointLight(C.magenta, 12, 20, 2);
  magentaLight.position.set(-4.5, -1.4, 2.6);
  scene.add(cyanLight, magentaLight);

  coreGroup = new THREE.Group();
  scene.add(coreGroup);

  coreCrystal = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.68, 2),
    new THREE.MeshStandardMaterial({
      color: 0x07243a,
      emissive: C.cyan,
      emissiveIntensity: 0.72,
      metalness: 0.72,
      roughness: 0.24,
      transparent: true,
      opacity: 0.58
    })
  );
  coreCrystal.position.z = -0.62;
  coreGroup.add(coreCrystal);

  const crystalWire = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.74, 1)),
    lineMaterial(C.cyan, 0.62)
  );
  crystalWire.position.z = -0.58;
  coreGroup.add(crystalWire);

  innerCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.82, 0),
    new THREE.MeshStandardMaterial({
      color: C.violet,
      emissive: C.magenta,
      emissiveIntensity: 1.15,
      metalness: 0.58,
      roughness: 0.2,
      transparent: true,
      opacity: 0.72
    })
  );
  innerCore.position.z = -0.2;
  coreGroup.add(innerCore);

  [
    [2.28, 0.024, C.cyan, 0.72],
    [2.58, 0.018, C.violet, 0.52],
    [2.88, 0.014, C.magenta, 0.4]
  ].forEach(([radius, tube, color, opacity], i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, tube, 8, 192),
      additive(color, opacity)
    );
    ring.rotation.x = (i - 1) * 0.18;
    ring.rotation.y = (i - 1) * 0.12;
    ring.position.z = -0.05 - i * 0.08;
    coreGroup.add(ring);
    rings.push(ring);
  });

  for (let i = 0; i < 12; i++) {
    const tick = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, i % 3 === 0 ? 0.72 : 0.38, 0.03),
      additive(i % 2 === 0 ? C.cyan : C.magenta, 0.64)
    );
    const angle = i * Math.PI / 6;
    tick.position.set(Math.cos(angle) * 3.03, Math.sin(angle) * 3.03, 0);
    tick.rotation.z = angle - Math.PI / 2;
    coreGroup.add(tick);
  }

  shardGroup = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const shard = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.12 + (i % 4) * 0.025, 0),
      new THREE.MeshStandardMaterial({
        color: i % 2 ? C.cyan : C.violet,
        emissive: i % 3 ? C.cyan : C.magenta,
        emissiveIntensity: 0.8,
        metalness: 0.7,
        roughness: 0.24,
        transparent: true,
        opacity: 0.82
      })
    );
    const angle = i / 14 * Math.PI * 2;
    const radius = 3.38 + (i % 3) * 0.22;
    shard.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius * 0.78,
      -0.7 - (i % 5) * 0.22
    );
    shard.rotation.set(angle * 0.7, angle * 1.2, angle * 0.45);
    shardGroup.add(shard);
  }
  coreGroup.add(shardGroup);

  const ikoTexture = await loadTexture("/assets/iko-prime/identity/iko-prime-logo-locked.png");
  ikoSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: ikoTexture,
    transparent: true,
    opacity: 1,
    depthWrite: false
  }));
  ikoSprite.scale.set(5.05, 5.05, 1);
  ikoSprite.position.set(0.25, -0.05, 0.48);
  coreGroup.add(ikoSprite);

  tunnelGroup = new THREE.Group();
  for (let i = 0; i < 11; i++) {
    const color = i % 3 === 0 ? C.magenta : i % 2 === 0 ? C.violet : C.cyan;
    const tunnelRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.55 + i * 0.08, 0.014 + (i % 2) * 0.004, 6, 144),
      additive(color, 0.11 + (10 - i) * 0.014)
    );
    tunnelRing.position.z = -1.4 - i * 1.18;
    tunnelRing.rotation.z = i * 0.12;
    tunnelGroup.add(tunnelRing);
    tunnelRings.push(tunnelRing);
  }
  scene.add(tunnelGroup);

  const profileTexture = await loadTexture("/assets/v7/charles-profile-source.webp");
  const operatorTexture = await loadTexture("/assets/v7/charles-operator-v7.webp");
  humanSourceSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: profileTexture,
    transparent: true,
    opacity: 0,
    depthWrite: false
  }));
  operatorSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: operatorTexture,
    transparent: true,
    opacity: 0,
    depthWrite: false
  }));
  humanSourceSprite.scale.set(3, 3, 1);
  operatorSprite.scale.set(4, 5, 1);
  humanSourceSprite.position.set(-1.65, 0, 0.1);
  operatorSprite.position.set(-1.05, -0.3, 0.18);
  scene.add(humanSourceSprite, operatorSprite);

  const particleCount = innerWidth < 700 ? 420 : 1250;
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
    new THREE.PointsMaterial({
      color: C.cyan,
      size: innerWidth < 700 ? 0.024 : 0.032,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  scene.add(particlePoints);

  grid = new THREE.GridHelper(24, 48, C.cyan, 0x17384d);
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  grid.position.set(0, -3.15, -3.2);
  scene.add(grid);

  archiveGroup = new THREE.Group();
  [-3.25, 0, 3.25].forEach((x, i) => {
    const color = [C.cyan, C.violet, C.magenta][i];
    const shell = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.8, 1.36, 1.5)),
      lineMaterial(color, 0.78)
    );
    shell.position.set(x, -0.3, -0.8 - i * 0.22);
    archiveGroup.add(shell);

    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.48, 0),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.9,
        metalness: 0.62,
        roughness: 0.22,
        transparent: true,
        opacity: 0.7
      })
    );
    core.position.copy(shell.position);
    archiveGroup.add(core);
    archiveCores.push(core);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.08, 0.022, 6, 96),
      additive(color, 0.38)
    );
    halo.position.copy(shell.position);
    halo.rotation.y = Math.PI / 2;
    archiveGroup.add(halo);
  });
  archiveGroup.traverse(object => setMaterialOpacity(object, 0));
  scene.add(archiveGroup);

  portalGroup = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.45 + i * 0.36, 0.022, 8, 180),
      additive(i % 2 ? C.magenta : C.cyan, 0.34)
    );
    ring.position.z = -i * 0.24;
    ring.rotation.z = i * 0.13;
    portalGroup.add(ring);
    portalRings.push(ring);
  }
  portalGroup.position.set(0, 0, -1.1);
  portalGroup.traverse(object => setMaterialOpacity(object, 0));
  scene.add(portalGroup);

  setupTimeline();
  resize();
  syncDebugLayers();
  scene.traverse(() => { debug.objects += 1; });
  debug.ready = true;
  setEngine("online", "3D ENGINE // ONLINE");
  animate();
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
    .to(camera.position, { z: 6.35, y: 0.05, duration: 1 }, 0)
    .to(coreGroup.rotation, { z: 0.45, y: 0.18, duration: 1 }, 0)
    .to(tunnelGroup.position, { z: 2.2, duration: 1 }, 0)
    .to(rings[0].rotation, { z: 1.2, duration: 1 }, 0)
    .to(rings[1].rotation, { z: -0.9, duration: 1 }, 0)
    .to(coreGroup.position, { x: 2.45, y: 0.05, z: -1.1, duration: 1.1 }, 1)
    .to(coreGroup.scale, { x: 0.68, y: 0.68, z: 0.68, duration: 1.1 }, 1)
    .to(ikoSprite.material, { opacity: 0.22, duration: 0.8 }, 1.15)
    .to(humanSourceSprite.material, { opacity: 0.72, duration: 0.6 }, 1.16)
    .to(operatorSprite.material, { opacity: 1, duration: 0.9 }, 1.55)
    .to(humanSourceSprite.material, { opacity: 0.1, duration: 0.55 }, 1.95)
    .to(operatorSprite.material, { opacity: 0.08, duration: 0.65 }, 2.2)
    .to(coreGroup.position, { x: 0, y: 1.6, z: -2.2, duration: 0.9 }, 2.1)
    .to(coreGroup.scale, { x: 0.36, y: 0.36, z: 0.36, duration: 0.9 }, 2.1)
    .to(ikoSprite.material, { opacity: 0.78, duration: 0.8 }, 2.1)
    .to(camera.position, { z: 8.6, y: 0.5, duration: 0.9 }, 2.1);

  archiveGroup.traverse(object => {
    if (object.material) {
      timeline.to(object.material, {
        opacity: object.isLineSegments ? 0.78 : object.isMesh ? 0.62 : 0.32,
        duration: 0.55
      }, 2.45);
    }
  });

  timeline
    .to(archiveGroup.rotation, { y: Math.PI * 0.58, duration: 1 }, 3)
    .to(camera.position, { x: 2.1, z: 7.4, duration: 1 }, 3)
    .to(coreGroup.rotation, { z: 1.15, y: 1, duration: 1 }, 3);

  archiveGroup.traverse(object => {
    if (object.material) timeline.to(object.material, { opacity: 0.05, duration: 0.45 }, 3.75);
  });

  portalGroup.traverse(object => {
    if (object.material) timeline.to(object.material, { opacity: 0.52, duration: 0.7 }, 4);
  });

  timeline
    .to(camera.position, { x: 0, y: 0, z: 5.3, duration: 1.05 }, 4)
    .to(portalGroup.rotation, { z: 1, y: 0.18, duration: 1.05 }, 4)
    .to(coreGroup.position, { x: -2.4, y: 1.7, z: -2.4, duration: 0.8 }, 4)
    .to(coreGroup.scale, { x: 0.22, y: 0.22, z: 0.22, duration: 0.8 }, 4)
    .to(portalGroup.position, { z: -6, duration: 0.85 }, 5)
    .to(portalGroup.scale, { x: 2.5, y: 2.5, z: 2.5, duration: 0.85 }, 5)
    .to(coreGroup.position, { x: 0, y: 0, z: 0, duration: 0.85 }, 5)
    .to(coreGroup.scale, { x: 0.72, y: 0.72, z: 0.72, duration: 0.85 }, 5)
    .to(ikoSprite.material, { opacity: 1, duration: 0.6 }, 5.1)
    .to(camera.position, { x: 0, y: 0, z: 7.1, duration: 0.85 }, 5);

  document.querySelectorAll(".v7-scene").forEach((section, index) => {
    ScrollTrigger.create({
      trigger: section,
      start: "top 55%",
      end: "bottom 45%",
      onToggle: self => {
        if (!self.isActive) return;
        debug.activeScene = section.dataset.scene || String(index + 1);
        document.querySelectorAll(".v7-rail-left span").forEach((element, railIndex) => {
          element.classList.toggle("is-active", index === railIndex);
        });
      }
    });
  });
}

const themeButton = document.getElementById("v7-theme");
function syncTheme() {
  const theme = document.documentElement.dataset.uiTheme === "light" ? "light" : "dark";
  if (themeButton) themeButton.textContent = theme.toUpperCase();
  if (scene) scene.fog.color.set(theme === "light" ? 0xeef7fd : 0x02070d);
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
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.25 : 1.6));
  renderer.setSize(innerWidth, innerHeight, false);
  syncDebugLayers();
}
addEventListener("resize", resize, { passive: true });

function animate() {
  requestAnimationFrame(animate);
  if (!renderer || !scene || !camera || !clock) return;

  const time = clock.getElapsedTime();
  if (!reduced) {
    coreGroup.rotation.z += 0.0007;
    coreCrystal.rotation.x = time * 0.08;
    coreCrystal.rotation.y = time * 0.12;
    innerCore.rotation.x = -time * 0.34;
    innerCore.rotation.y = time * 0.42;
    shardGroup.rotation.z = -time * 0.055;
    shardGroup.children.forEach((shard, index) => {
      shard.rotation.x += 0.0015 + index * 0.00003;
      shard.rotation.y -= 0.0012 + index * 0.00002;
    });
    rings.forEach((ring, index) => {
      ring.rotation.z += (index % 2 ? -0.0007 : 0.0005) * (index + 1);
    });
    tunnelRings.forEach((ring, index) => {
      ring.rotation.z += (index % 2 ? -1 : 1) * 0.00018 * (index + 1);
    });
    archiveCores.forEach((core, index) => {
      core.rotation.x = time * (0.3 + index * 0.08);
      core.rotation.y = -time * (0.22 + index * 0.06);
    });
    portalRings.forEach((ring, index) => {
      ring.rotation.z += (index % 2 ? -1 : 1) * 0.00045 * (index + 1);
    });
    particlePoints.rotation.y = time * 0.008;
  }

  renderer.render(scene, camera);
  debug.frames += 1;
}

setEngine("boot", "3D ENGINE // BOOTING");
init().catch(fail);
