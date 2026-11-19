(() => {
 const detected=document.querySelector('#device-detected');
 const year=document.querySelector('#year');
 if(year) year.textContent=new Date().getFullYear();
 const ua=navigator.userAgent||'';
 const isAppleMobile=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const device=/iPad|Tablet/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)?'tablet':/Android|iPhone|iPod|Mobile/i.test(ua)?'mobile':'desktop';
 const labels={desktop:'Computador detectado',mobile:'Celular detectado',tablet:'Tablet detectado'};
 if(detected) detected.textContent=labels[device];
 document.querySelectorAll('.device-card').forEach(card=>{if(card.dataset.device===device)card.classList.add('recommended-card')});
 if ("serviceWorker" in navigator) {
   window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
 }
})();
