(() => {
  "use strict";
  const money = n => `₱${Number(n).toLocaleString("en-PH")}`;

  // Trade Core demo
  const cart = new Map();
  const cartBox = document.getElementById("trade-cart-items");
  const totalEl = document.getElementById("trade-total");
  const result = document.getElementById("trade-result");
  function renderCart(){
    if(!cartBox) return;
    cartBox.innerHTML = "";
    let total = 0;
    if(!cart.size){
      cartBox.innerHTML = '<div class="empty-cart">Add a product to begin.</div>';
    } else {
      cart.forEach((item,name)=>{
        total += item.price * item.qty;
        const row = document.createElement("div");
        row.className = "cart-line";
        row.innerHTML = `<span>${item.qty} × ${name}</span><b>${money(item.price*item.qty)}</b>`;
        cartBox.append(row);
      });
    }
    totalEl.textContent = money(total);
  }
  document.querySelectorAll(".product-button").forEach(btn => btn.addEventListener("click", () => {
    const name = btn.dataset.name, price = Number(btn.dataset.price);
    const item = cart.get(name) || {price,qty:0}; item.qty++; cart.set(name,item);
    result.textContent = `${name} added.`;
    renderCart();
  }));
  document.getElementById("trade-checkout")?.addEventListener("click", () => {
    if(!cart.size){ result.textContent = "Add at least one product first."; return; }
    const total = [...cart.values()].reduce((s,x)=>s+x.price*x.qty,0);
    result.textContent = `DEMO SALE COMPLETE // ${money(total)} // inventory movement recorded`;
    cart.clear(); renderCart();
  });

  // Compadres stock demo
  const stockInitial = {cement:42,paint:18,nails:76};
  const stock = {...stockInitial};
  const labels = {cement:"PORTLAND CEMENT",paint:"LATEX PAINT 4L",nails:"ROOFING NAILS"};
  const movement = document.getElementById("movement-list");
  function renderStock(){
    Object.entries(stock).forEach(([k,v])=>{ const el=document.getElementById(`stock-${k}`); if(el) el.textContent=v; });
  }
  document.querySelectorAll("[data-receive]").forEach(btn=>btn.addEventListener("click",()=>{
    const k=btn.dataset.receive; stock[k]+=5; renderStock();
    const row=document.createElement("span"); row.innerHTML=`<b>+5 RECEIVED</b> ${labels[k]} · new on-hand ${stock[k]}`;
    movement.prepend(row);
  }));

  // Morsebound audio demo
  const wave = document.getElementById("morse-wave");
  const code = document.getElementById("morse-code");
  let playing = false;
  const pattern = [".",".",".","-","-","-",".",".","."];
  async function playMorse(){
    if(playing) return; playing = true; wave.classList.add("playing");
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if(!AudioCtx){ code.classList.add("revealed"); playing=false; return; }
    const ctx = new AudioCtx();
    let t = ctx.currentTime + .05;
    const unit=.11;
    for(const mark of pattern){
      const dur=mark==="."?unit:unit*3;
      const osc=ctx.createOscillator(), gain=ctx.createGain();
      osc.frequency.value=620; gain.gain.setValueAtTime(.0001,t); gain.gain.exponentialRampToValueAtTime(.18,t+.012);
      gain.gain.setValueAtTime(.18,t+Math.max(.012,dur-.015)); gain.gain.exponentialRampToValueAtTime(.0001,t+dur);
      osc.connect(gain).connect(ctx.destination); osc.start(t); osc.stop(t+dur+.02);
      t += dur + unit;
    }
    setTimeout(()=>{wave.classList.remove("playing");playing=false;ctx.close().catch(()=>{});}, Math.max(100, (t-ctx.currentTime)*1000+120));
  }
  document.getElementById("morse-play")?.addEventListener("click", playMorse);
  document.getElementById("morse-reveal")?.addEventListener("click",()=>code.classList.toggle("revealed"));

  // ETTE demo
  const tasks = [...document.querySelectorAll(".ette-task")];
  function updateEtte(){
    const done=tasks.filter(x=>x.checked).length, pct=Math.round(done/tasks.length*100);
    document.getElementById("ette-percent").textContent=`${pct}%`;
    document.getElementById("ette-orb").style.setProperty("--pct",`${pct*3.6}deg`);
  }
  tasks.forEach(t=>t.addEventListener("change",updateEtte));

  // Reset controls
  document.querySelectorAll("[data-reset]").forEach(btn=>btn.addEventListener("click",()=>{
    switch(btn.dataset.reset){
      case "trade": cart.clear(); result.textContent=""; renderCart(); break;
      case "compadres":
        Object.assign(stock,stockInitial); renderStock();
        movement.innerHTML='<span><b>READY</b> Choose an item above to receive sample stock.</span>'; break;
      case "morse": code.classList.remove("revealed"); wave.classList.remove("playing"); break;
      case "ette": tasks.forEach(t=>t.checked=false); updateEtte(); break;
    }
  }));

  renderCart(); renderStock(); updateEtte();
})();