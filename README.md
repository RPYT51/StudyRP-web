# StudyRP — Central de downloads

Site público do StudyRP, publicado pelo GitHub Pages.

## Estrutura
- `index.html`: conteúdo e estrutura da página.
- `assets/css/style.css`: identidade visual e layout responsivo.
- `assets/js/app.js`: detecção do dispositivo e consulta da última release pela API pública do GitHub.
- `assets/img/icon.svg`: ícone vetorial.
- `manifest.json` e `sw.js`: instalação como PWA e cache básico da página.

## Publicação
No repositório, configure **Settings → Pages → Deploy from a branch → main → /(root)**.

URL esperada: https://rpyt51.github.io/StudyRP-download/

O botão Android usa a release mais recente e procura o asset `StudyRP.apk`. Windows, Linux e iOS permanecem indicados como em breve até existirem instaladores publicados.
