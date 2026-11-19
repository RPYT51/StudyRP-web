(() => {
 const owner = 'RPYT51';
 const repo = 'StudyRP-download';
 const version = document.querySelector('#release-version');
 const detected = document.querySelector('#device-detected');
 const year = document.querySelector('#year');
 if (year) year.textContent = new Date().getFullYear();
 const ua = navigator.userAgent || '';
 const device = /iPad|Tablet/i.test(ua) ? 'tablet' : /Android|iPhone|iPod|Mobile/i.test(ua) ? 'mobile' : 'desktop';
 const labels = {desktop:'Computador detectado',mobile:'Celular detectado',tablet:'Tablet detectado'};
 if (detected) detected.textContent = labels[device];
 document.querySelectorAll('.device-card').forEach(card => {
   if (card.dataset.device === device) card.classList.add('recommended-card');
 });
 async function loadLatestRelease() {
   try {
     const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {headers:{Accept:'application/vnd.github+json'}});
     if (!response.ok) throw new Error('Release ainda não publicado');
     const release = await response.json();
     if (version) version.textContent = release.tag_name ? `Versão ${release.tag_name}` : 'Última versão disponível';
     const apk = (release.assets || []).find(asset => asset.name === 'StudyRP.apk');
     if (apk) document.querySelectorAll('[data-download="android"]').forEach(link => { link.href = apk.browser_download_url; });
   } catch (_) {
     if (version) version.textContent = 'Versão mais recente';
   }
 }
 loadLatestRelease();
 if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
   window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
 }
})();