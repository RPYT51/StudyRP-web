# StudyRP-web — Site público

Site público do StudyRP, publicado pelo GitHub Pages.

## Estrutura
- `index.html`: página de downloads e acesso pelo navegador.
- `assets/css/style.css`: identidade visual, responsividade e tutorial iOS.
- `assets/js/app.js`: detecção de dispositivo, modal iOS e consulta da última release.
- `assets/img/icon.svg`: ícone do site.
- `manifest.json` e `sw.js`: PWA e cache básico da página.
- `app/`: destino da aplicação Web, publicado pelo workflow do repositório privado.

## Publicação
Configure **Settings → Pages → Deploy from a branch → main → /(root)**.

URL esperada: https://rpyt51.github.io/StudyRP-web/

A versão Web em `app/` é enviada automaticamente pelo workflow do repositório privado quando o segredo `WEB_DEPLOY_TOKEN` estiver configurado. O APK continua vindo da release mais recente do repositório público e usa o asset `StudyRP.apk`.

O tutorial de iPhone contém ilustrações demonstrativas; substitua por capturas reais do Safari quando disponíveis.
