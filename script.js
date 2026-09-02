(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("year").textContent = new Date().getFullYear();

  // Mobile menu
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  const closeMenu = () => {
    nav.classList.remove("open");
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded","false");
    toggle.setAttribute("aria-label","Open menu");
  };
  toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("open");
    nav.classList.toggle("open",open);
    document.body.classList.toggle("menu-open",open);
    toggle.setAttribute("aria-expanded",String(open));
    toggle.setAttribute("aria-label",open ? "Close menu" : "Open menu");
  });
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click",closeMenu));

  // Scroll progress
  const progress = document.getElementById("progress");
  const updateProgress = () => {
    const max = Math.max(1,document.documentElement.scrollHeight - innerHeight);
    progress.style.width = `${Math.max(0,Math.min(1,scrollY/max))*100}%`;
  };
  updateProgress();
  addEventListener("scroll",updateProgress,{passive:true});
  addEventListener("resize",updateProgress,{passive:true});

  // Reveal choreography
  const reveal = [...document.querySelectorAll(".scroll-reveal")];
  if ("IntersectionObserver" in window && !reduceMotion) {
    const ro = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("in-view");
          ro.unobserve(e.target);
        }
      });
    },{threshold:.12,rootMargin:"0px 0px -7% 0px"});
    reveal.forEach(el => ro.observe(el));
  } else {
    reveal.forEach(el => el.classList.add("in-view"));
  }

  // Active navigation
  const sections = [...document.querySelectorAll("[data-nav-section]")];
  const links = [...document.querySelectorAll(".main-nav a[href^='#']")];
  if ("IntersectionObserver" in window) {
    const so = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
      if (!visible[0]) return;
      const id = visible[0].target.id;
      links.forEach(link => link.classList.toggle("active",link.getAttribute("href") === `#${id}`));
    },{rootMargin:"-20% 0px -60% 0px",threshold:[0,.05,.15,.3,.5]});
    sections.forEach(s => so.observe(s));
  }

  // Internal route transitions
  const transition = document.querySelector(".page-transition");
  document.querySelectorAll(".route-link").forEach(link => {
    link.addEventListener("click",e => {
      if (reduceMotion || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      transition.classList.add("active");
      setTimeout(()=>location.href=link.href,360);
    });
  });

  // Mouse reactive central emblem
  const core = document.getElementById("core-logo");
  if (!reduceMotion && window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
    addEventListener("pointermove",e => {
      const x=(e.clientX/innerWidth-.5)*2;
      const y=(e.clientY/innerHeight-.5)*2;
      core.style.transform=`rotateY(${x*4.5}deg) rotateX(${y*-3.2}deg) translate3d(${x*4}px,${y*3}px,0)`;
    });
    document.addEventListener("mouseleave",()=>core.style.transform="");
  }

  // Ambient cyber grid
  const canvas=document.getElementById("world-grid");
  const ctx=canvas.getContext("2d");
  let w=0,h=0,dpr=1,raf=null,t=0;

  const resize=()=>{
    dpr=Math.min(devicePixelRatio||1,2);
    w=innerWidth;h=innerHeight;
    canvas.width=Math.floor(w*dpr);
    canvas.height=Math.floor(h*dpr);
    canvas.style.width=`${w}px`;
    canvas.style.height=`${h}px`;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  };

  const draw=()=>{
    ctx.clearRect(0,0,w,h);
    const horizon=h*.60;
    const vanishX=w*.68;

    for(let i=-11;i<=11;i++){
      const bottom=vanishX+i*Math.max(75,w*.072);
      const g=ctx.createLinearGradient(vanishX,horizon,bottom,h);
      g.addColorStop(0,"rgba(0,239,255,0)");
      g.addColorStop(.45,i%2===0?"rgba(0,239,255,.052)":"rgba(255,43,214,.035)");
      g.addColorStop(1,"rgba(70,102,160,.06)");
      ctx.strokeStyle=g;
      ctx.beginPath();ctx.moveTo(vanishX,horizon);ctx.lineTo(bottom,h);ctx.stroke();
    }

    for(let i=0;i<15;i++){
      const p=i/15;
      const y=horizon+p*p*(h-horizon);
      ctx.strokeStyle=`rgba(68,142,210,${.018+p*.04})`;
      ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();
    }

    for(let i=0;i<28;i++){
      const px=((i*173+t*(i%3+1)*.02)%(w+180))-90;
      const py=(i*101)%Math.max(1,h);
      ctx.fillStyle=i%3===0?"rgba(255,43,214,.20)":"rgba(0,239,255,.17)";
      ctx.beginPath();ctx.arc(px,py,i%5===0?1.4:.7,0,Math.PI*2);ctx.fill();
    }
  };

  const tick=()=>{t++;draw();raf=requestAnimationFrame(tick);};
  resize();draw();
  if(!reduceMotion) tick();
  addEventListener("resize",resize,{passive:true});
  document.addEventListener("visibilitychange",()=>{
    if(reduceMotion)return;
    if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=null;}
    else if(!raf)tick();
  });
})();