import * as THREE from "/assets/vendor/v7/three.module.min.js";

const canvas = document.getElementById("v7-page-canvas");
if (!canvas) throw new Error("V7 Studio canvas missing");

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobile = innerWidth < 760;
const coarse = matchMedia("(pointer: coarse)").matches;

const debug = window.__V7_PAGE_DEBUG__ = {
  version: "7.5.0",
  scene: "studio-forge",
  ready: false,
  webgl: false,
  fallback: false,
  reducedMotion: reduced,
  frames: 0,
  objects: 0
};

let renderer, scene, camera, forge, particles, grid, clock;
let scrollTarget = 0;
let scrollValue = 0;
const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
const C = { cyan:0x00e7ff, violet:0x8b5cff, magenta:0xff2bd6, green:0x54ffac };

function mat(color, emissive, opacity=.72) {
  return new THREE.MeshStandardMaterial({
    color, emissive, emissiveIntensity:.7, metalness:.74, roughness:.28,
    transparent:true, opacity
  });
}
function glow(color, opacity=.5) {
  return new THREE.MeshBasicMaterial({color,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false});
}
function line(color, opacity=.45) {
  return new THREE.LineBasicMaterial({color,transparent:true,opacity,blending:THREE.AdditiveBlending});
}

function panel(w,h,color,index) {
  const g = new THREE.Group();
  const frame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(w,h,.08)),
    line(color,.48)
  );
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(w*.92,h*.88), new THREE.MeshBasicMaterial({
    color:0x04101b,transparent:true,opacity:.24,side:THREE.DoubleSide
  }));
  plate.position.z=-.025;
  g.add(frame,plate);
  const rows = 3 + (index % 3);
  for(let i=0;i<rows;i++){
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w*(.28+.11*((i+index)%4)),.018,.012),glow(i%2?C.violet:C.cyan,.26));
    bar.position.set(-w*.2, h*.26-i*.16, .05);
    g.add(bar);
  }
  return g;
}

function buildForge() {
  forge = new THREE.Group();
  forge.position.set(mobile ? 1.15 : 2.0,.05,-1.1);
  scene.add(forge);

  const core = new THREE.Mesh(new THREE.OctahedronGeometry(.66,1),mat(0x071b2d,C.cyan,.74));
  core.name="forge-core";
  forge.add(core);

  const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(.28,1),mat(0x32164d,C.magenta,.9));
  forge.add(inner);

  [1.15,1.48,1.82].forEach((r,i)=>{
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r,.014+i*.004,6,128),glow([C.cyan,C.violet,C.magenta][i],.34-i*.05));
    ring.rotation.set(i*.23,i*.15,i*.4);
    ring.userData.speed=(i%2?-1:1)*(.0007+i*.00025);
    forge.add(ring);
  });

  for(let i=0;i<10;i++){
    const a=i/10*Math.PI*2;
    const node=new THREE.Mesh(new THREE.SphereGeometry(.045+(i%3)*.012,8,8),glow(i%2?C.cyan:C.magenta,.62));
    node.position.set(Math.cos(a)*2.15,Math.sin(a)*1.45,-.2-(i%2)*.3);
    forge.add(node);
  }

  const configs = mobile
    ? [[0,-1.75,-1.45,1.55,.78,C.cyan],[1,1.35,-1.7,1.35,.68,C.violet]]
    : [[0,-2.35,1.25,1.7,.82,C.cyan],[1,2.2,1.15,1.55,.75,C.violet],[2,-2.0,-1.55,1.5,.72,C.magenta],[3,2.15,-1.5,1.65,.8,C.cyan]];
  configs.forEach(([idx,x,y,w,h,color])=>{
    const p=panel(w,h,color,idx);
    p.position.set(x,y,-.6-Math.abs(x)*.08);
    p.rotation.y=x>0?-.18:.18;
    p.userData.baseY=y;
    p.userData.float=idx*.8;
    forge.add(p);
  });

  const pathPoints=[
    new THREE.Vector3(-3,-2,-1.2),new THREE.Vector3(-1.4,-1,-.9),
    new THREE.Vector3(0,0,-.5),new THREE.Vector3(1.5,.8,-.85),new THREE.Vector3(3,1.6,-1.25)
  ];
  const pathGeo=new THREE.BufferGeometry().setFromPoints(pathPoints);
  forge.add(new THREE.Line(pathGeo,line(C.cyan,.28)));

  for(let i=0;i<5;i++){
    const n=new THREE.Mesh(new THREE.TorusGeometry(.13,.018,6,28),glow(i===4?C.green:C.cyan,.54));
    n.position.copy(pathPoints[i]);
    n.rotation.x=Math.PI/2;
    forge.add(n);
  }
}

function buildEnvironment(){
  const count=mobile?180:520;
  const positions=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    positions[i*3]=(Math.random()-.5)*18;
    positions[i*3+1]=(Math.random()-.5)*10;
    positions[i*3+2]=-2-Math.random()*14;
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.BufferAttribute(positions,3));
  particles=new THREE.Points(geo,new THREE.PointsMaterial({
    color:C.cyan,size:mobile?.018:.026,transparent:true,opacity:.34,
    depthWrite:false,blending:THREE.AdditiveBlending
  }));
  scene.add(particles);

  grid=new THREE.GridHelper(22,44,C.cyan,0x18364c);
  grid.material.transparent=true;
  grid.material.opacity=.12;
  grid.position.set(0,-3,-3);
  scene.add(grid);
}

function updateScroll(){
  const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
  scrollTarget=Math.min(1,Math.max(0,scrollY/max));
}
function render(){
  if(!renderer) return;
  camera.lookAt(pointer.x*.12,-pointer.y*.08,-1.1);
  renderer.render(scene,camera);
  debug.frames++;
}
function animate(){
  requestAnimationFrame(animate);
  const t=clock.getElapsedTime();
  scrollValue+=(scrollTarget-scrollValue)*.035;
  pointer.x+=(pointer.tx-pointer.x)*.04;
  pointer.y+=(pointer.ty-pointer.y)*.04;

  forge.rotation.y=.08+scrollValue*.48+pointer.x*.025;
  forge.rotation.x=-.03+scrollValue*.08-pointer.y*.015;
  forge.position.y=.05-scrollValue*.45;
  forge.children.forEach((child,i)=>{
    if(child.userData.speed) child.rotation.z+=child.userData.speed;
    if(child.userData.baseY!==undefined) child.position.y=child.userData.baseY+Math.sin(t*.55+child.userData.float)*.045;
  });
  particles.rotation.y=t*.006;
  grid.position.z=-3+(scrollValue*1.2);
  camera.position.z=7.4-scrollValue*.7;
  render();
}

async function init(){
  try{
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!mobile,powerPreference:"high-performance"});
  }catch(error){
    debug.error=String(error);
    debug.fallback=true;
    document.documentElement.dataset.v7PageRender="fallback";
    return;
  }
  debug.webgl=true;
  document.documentElement.dataset.v7PageRender="webgl";
  renderer.setClearColor(0x000000,0);
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.1:1.45));
  renderer.setSize(innerWidth,innerHeight,false);

  scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(document.documentElement.dataset.uiTheme==="light"?0xeaf5fb:0x02070d,.042);
  camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.1,80);
  camera.position.set(0,.1,7.4);
  clock=new THREE.Clock();

  scene.add(new THREE.HemisphereLight(0x9ceeff,0x17051d,1.35));
  const key=new THREE.PointLight(C.cyan,15,20,2);key.position.set(3,3,4);
  const fill=new THREE.PointLight(C.magenta,9,18,2);fill.position.set(-4,-1,2);
  scene.add(key,fill);

  buildForge();
  buildEnvironment();
  scene.traverse(()=>debug.objects++);
  debug.ready=true;
  updateScroll();

  if(!reduced){
    addEventListener("scroll",updateScroll,{passive:true});
    if(!coarse){
      addEventListener("pointermove",e=>{
        pointer.tx=(e.clientX/innerWidth-.5)*2;
        pointer.ty=(e.clientY/innerHeight-.5)*2;
      },{passive:true});
    }
    animate();
  }else{
    forge.rotation.y=.2;
    forge.scale.setScalar(mobile?.78:.9);
    render();
  }
}

addEventListener("resize",()=>{
  if(!renderer||!camera)return;
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<760?1.1:1.45));
  renderer.setSize(innerWidth,innerHeight,false);
  if(reduced&&debug.ready)render();
},{passive:true});

new MutationObserver(()=>{
  if(scene?.fog){
    scene.fog.color.set(document.documentElement.dataset.uiTheme==="light"?0xeaf5fb:0x02070d);
    if(reduced)render();
  }
}).observe(document.documentElement,{attributes:true,attributeFilter:["data-ui-theme"]});

init().catch(error=>{
  debug.error=String(error?.stack||error);
  debug.fallback=true;
  debug.ready=false;
  document.documentElement.dataset.v7PageRender="fallback";
});
