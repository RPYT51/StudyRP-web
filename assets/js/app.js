(() => {
 const owner='RPYT51', repo='StudyRP-web';
 const version=document.querySelector('#release-version');
 const detected=document.querySelector('#device-detected');
 const year=document.querySelector('#year');
 if(year) year.textContent=new Date().getFullYear();
 const ua=navigator.userAgent||'';
 const isAppleMobile=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const device=/iPad|Tablet/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)?'tablet':/Android|iPhone|iPod|Mobile/i.test(ua)?'mobile':'desktop';
 const labels={desktop:'Computador detectado',mobile:'Celular detectado',tablet:'Tablet detectado'};
 if(detected) detected.textContent=labels[device];
 document.querySelectorAll('.device-card').forEach(card=>{if(card.dataset.device===device)card.classList.add('recommended-card')});
 const modal=document.querySelector('#iosGuide');
 const openGuide=()=>{if(!modal)return;modal.hidden=false;document.body.style.overflow='hidden';document.querySelector('#closeIosGuide')?.focus()};
 const closeGuide=()=>{if(!modal)return;modal.hidden=true;document.body.style.overflow=''};
 document.querySelectorAll('[data-ios-guide]').forEach(button=>button.addEventListener('click',openGuide));
 document.querySelector('#closeIosGuide')?.addEventListener('click',closeGuide);
 modal?.addEventListener('click',event=>{if(event.target===modal)closeGuide()});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&modal&&!modal.hidden)closeGuide()});
 const browserContinue=document.querySelector('#browserContinue');
 browserContinue?.addEventListener('click',event=>{if(isAppleMobile){event.preventDefault();openGuide()}});
 async function loadLatestRelease(){
   try{
     const response=await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`,{headers:{Accept:'application/vnd.github+json'}});
     if(!response.ok)throw new Error('Release ainda não publicado');
     const release=await response.json();
     if(version)version.textContent=release.tag_name?`Versão ${release.tag_name}`:'Última versão disponível';
     const filenames = {
       android: 'StudyRP.apk',
       windows: 'StudyRP-x64.exe',
       debian: 'StudyRP-amd64.deb',
       flatpak: 'StudyRP-x86_64.flatpak'
     };
     for (const [platform, filename] of Object.entries(filenames)) {
       const asset = (release.assets || []).find(candidate => candidate.name === filename);
       if (!asset) continue;
       document.querySelectorAll(`[data-download="${platform}"]`).forEach(link => {
         link.href = asset.browser_download_url;
         link.hidden = false;
       });
       document.querySelectorAll(`[data-unavailable="${platform}"]`).forEach(label => {
         label.hidden = true;
       });
     }
   }catch(_){if(version)version.textContent='Versão indisponível'}
 }
 loadLatestRelease();
 if('serviceWorker'in navigator&&location.protocol.startsWith('http')){
   window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
 }
})();