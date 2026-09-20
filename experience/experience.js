import * as THREE from "/assets/vendor/v7/three.module.min.js";
const gsap=window.gsap,ScrollTrigger=window.ScrollTrigger;if(gsap&&ScrollTrigger)gsap.registerPlugin(ScrollTrigger);
const canvas=document.getElementById("v7-canvas"),fallback=document.querySelector(".v7-fallback"),reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
let renderer,scene,camera,clock,coreGroup,ikoSprite,humanSourceSprite,operatorSprite,archiveGroup,portalGroup,particlePoints;let rings=[];
const C={cyan:0x00e7ff,blue:0x4aa8ff,violet:0x8b5cff,magenta:0xff2bd6,orange:0xff7a18};
const mat=(c,o=.75)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,depthWrite:false,blending:THREE.AdditiveBlending});
const lmat=(c,o=.55)=>new THREE.LineBasicMaterial({color:c,transparent:true,opacity:o,depthWrite:false,blending:THREE.AdditiveBlending});
const texture=u=>new THREE.TextureLoader().loadAsync(u);
async function init(){
try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"high-performance"})}catch(e){fallback.hidden=false;return}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight,false);renderer.outputColorSpace=THREE.SRGBColorSpace;
scene=new THREE.Scene();scene.fog=new THREE.FogExp2(document.documentElement.dataset.uiTheme==="light"?0xeef7fd:0x02070d,.055);
camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,100);camera.position.set(0,.2,8.4);clock=new THREE.Clock();
coreGroup=new THREE.Group();scene.add(coreGroup);
[[2.28,.018,C.cyan,.56],[2.58,.013,C.violet,.34],[2.87,.01,C.magenta,.24]].forEach(([r,t,c,o],i)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(r,t,8,180),mat(c,o));m.rotation.x=Math.PI/2+(i-1)*.12;m.rotation.y=(i-1)*.18;coreGroup.add(m);rings.push(m)});
for(let i=0;i<8;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.014,i%2===0?.55:.32,.012),mat(i%2===0?C.cyan:C.magenta,.45));const a=i*Math.PI/4;m.position.set(Math.cos(a)*2.78,Math.sin(a)*2.78,0);m.rotation.z=a-Math.PI/2;coreGroup.add(m)}
const ikoTex=await texture("/assets/iko-prime/identity/iko-prime-logo-locked.png");ikoSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:ikoTex,transparent:true,opacity:1,depthWrite:false}));ikoSprite.scale.set(5.05,5.05,1);ikoSprite.position.set(.25,-.05,.12);coreGroup.add(ikoSprite);
const profileTex=await texture("/assets/v7/charles-profile-source.webp"),operatorTex=await texture("/assets/v7/charles-operator-v7.webp");
humanSourceSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:profileTex,transparent:true,opacity:0,depthWrite:false}));operatorSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:operatorTex,transparent:true,opacity:0,depthWrite:false}));
humanSourceSprite.scale.set(3,3,1);operatorSprite.scale.set(4,5,1);humanSourceSprite.position.set(-1.65,0,.05);operatorSprite.position.set(-1.05,-.3,.08);scene.add(humanSourceSprite,operatorSprite);
const count=innerWidth<700?650:1400,pos=new Float32Array(count*3);for(let i=0;i<count;i++){pos[i*3]=(Math.random()-.5)*18;pos[i*3+1]=(Math.random()-.5)*11;pos[i*3+2]=-2-Math.random()*12}
const pg=new THREE.BufferGeometry();pg.setAttribute("position",new THREE.BufferAttribute(pos,3));particlePoints=new THREE.Points(pg,new THREE.PointsMaterial({color:C.cyan,size:.018,transparent:true,opacity:.34,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(particlePoints);
const grid=new THREE.GridHelper(22,42,C.cyan,0x123246);grid.material.transparent=true;grid.material.opacity=.12;grid.position.y=-3.35;grid.position.z=-2;scene.add(grid);
archiveGroup=new THREE.Group();[-3.1,0,3.1].forEach((x,i)=>{const e=new THREE.EdgesGeometry(new THREE.BoxGeometry(1.55,1.15,.9));const w=new THREE.LineSegments(e,lmat([C.cyan,C.violet,C.magenta][i],.62));w.position.set(x,-.3,-1);archiveGroup.add(w);const h=new THREE.Mesh(new THREE.TorusGeometry(.92,.015,6,90),mat([C.cyan,C.violet,C.magenta][i],.28));h.position.set(x,-.3,-1.05);h.rotation.x=Math.PI/2;archiveGroup.add(h)});archiveGroup.traverse(o=>{if(o.material)o.material.opacity=0});scene.add(archiveGroup);
portalGroup=new THREE.Group();for(let i=0;i<5;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(1.5+i*.36,.018,8,160),mat(i%2?C.magenta:C.cyan,.28));r.rotation.x=Math.PI/2+(i-2)*.04;portalGroup.add(r)}portalGroup.position.set(0,0,-1);portalGroup.traverse(o=>{if(o.material)o.material.opacity=0});scene.add(portalGroup);
setupTimeline();resize();animate();}
function setupTimeline(){if(!gsap||!ScrollTrigger||reduced)return;const tl=gsap.timeline({defaults:{ease:"none"},scrollTrigger:{trigger:".v7-story",start:"top top",end:"bottom bottom",scrub:1.05,invalidateOnRefresh:true}});
tl.to(camera.position,{z:6.5,y:.05,duration:1},0).to(coreGroup.rotation,{z:.45,y:.18,duration:1},0).to(rings[0].rotation,{z:1.2,duration:1},0).to(rings[1].rotation,{z:-.9,duration:1},0)
.to(coreGroup.position,{x:2.45,y:.05,z:-1.1,duration:1.1},1).to(coreGroup.scale,{x:.68,y:.68,z:.68,duration:1.1},1).to(ikoSprite.material,{opacity:.22,duration:.8},1.15)
.to(humanSourceSprite.material,{opacity:.72,duration:.6},1.16).to(operatorSprite.material,{opacity:1,duration:.9},1.55).to(humanSourceSprite.material,{opacity:.1,duration:.55},1.95)
.to(operatorSprite.material,{opacity:.08,duration:.65},2.2).to(coreGroup.position,{x:0,y:1.6,z:-2.2,duration:.9},2.1).to(coreGroup.scale,{x:.36,y:.36,z:.36,duration:.9},2.1).to(ikoSprite.material,{opacity:.78,duration:.8},2.1).to(camera.position,{z:8.6,y:.5,duration:.9},2.1);
archiveGroup.traverse(o=>{if(o.material)tl.to(o.material,{opacity:o.isLineSegments?.62:.24,duration:.55},2.45)});
tl.to(archiveGroup.rotation,{y:Math.PI*.58,duration:1},3).to(camera.position,{x:2.1,z:7.4,duration:1},3).to(coreGroup.rotation,{z:1.15,y:1,duration:1},3);
archiveGroup.traverse(o=>{if(o.material)tl.to(o.material,{opacity:.05,duration:.45},3.75)});
portalGroup.traverse(o=>{if(o.material)tl.to(o.material,{opacity:.42,duration:.7},4)});
tl.to(camera.position,{x:0,y:0,z:5.3,duration:1.05},4).to(portalGroup.rotation,{z:1,y:.4,duration:1.05},4).to(coreGroup.position,{x:-2.4,y:1.7,z:-2.4,duration:.8},4).to(coreGroup.scale,{x:.22,y:.22,z:.22,duration:.8},4)
.to(portalGroup.position,{z:-6,duration:.85},5).to(portalGroup.scale,{x:2.5,y:2.5,z:2.5,duration:.85},5).to(coreGroup.position,{x:0,y:0,z:0,duration:.85},5).to(coreGroup.scale,{x:.72,y:.72,z:.72,duration:.85},5).to(ikoSprite.material,{opacity:1,duration:.6},5.1).to(camera.position,{x:0,y:0,z:7.1,duration:.85},5);
document.querySelectorAll(".v7-scene").forEach((s,i)=>ScrollTrigger.create({trigger:s,start:"top 55%",end:"bottom 45%",onToggle:self=>{if(self.isActive)document.querySelectorAll(".v7-rail-left span").forEach((e,j)=>e.classList.toggle("is-active",i===j))}}))}
const themeBtn=document.getElementById("v7-theme");function syncTheme(){const t=document.documentElement.dataset.uiTheme==="light"?"light":"dark";themeBtn.textContent=t.toUpperCase();if(scene)scene.fog.color.set(t==="light"?0xeef7fd:0x02070d)}themeBtn.addEventListener("click",()=>{const n=document.documentElement.dataset.uiTheme==="light"?"dark":"light";document.documentElement.dataset.uiTheme=n;document.documentElement.style.colorScheme=n;try{localStorage.setItem("icharles-ui-theme",n)}catch{}syncTheme()});syncTheme();
function resize(){if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.25:1.6));renderer.setSize(innerWidth,innerHeight,false)}addEventListener("resize",resize,{passive:true});
function animate(){requestAnimationFrame(animate);const t=clock.getElapsedTime();if(!reduced){coreGroup.rotation.z+=.0007;rings.forEach((r,i)=>r.rotation.z+=(i%2?-.0007:.0005)*(i+1));particlePoints.rotation.y=t*.006;portalGroup.rotation.z+=.0005}renderer.render(scene,camera)}init().catch(e=>{console.error(e);fallback.hidden=false});
