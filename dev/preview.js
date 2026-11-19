(() => {
  const access = window.StudyRPPreview;
  const form = document.querySelector("#preview-form");
  const input = document.querySelector("#preview-code");
  const status = document.querySelector("#preview-status");
  const version = document.querySelector("#preview-version");

  async function openPreview() {
    form.hidden = true;
    document.querySelector("#preview-access").hidden = false;
    document.querySelector("#preview-downloads").hidden = false;
    document.querySelector("#open-web").href = "../app/";
    version.textContent = "Consultando a última versão…";

    try {
      const response = await fetch("https://api.github.com/repos/RPYT51/StudyRP-web/releases/latest", { cache: "no-store" });
      if (!response.ok) throw new Error("Versão indisponível");
      const release = await response.json();
      version.textContent = `Versão ${release.tag_name}`;
      const filenames = { win: "StudyRP-x64.exe", deb: "StudyRP-amd64.deb", flatpak: "StudyRP-x86_64.flatpak", android: "StudyRP.apk" };
      for (const [platform, filename] of Object.entries(filenames)) {
        const asset = release.assets.find(item => item.name === filename && item.state === "uploaded");
        if (!asset) continue;
        const link = document.querySelector(`[data-download="${platform}"]`);
        link.href = asset.browser_download_url;
        link.hidden = false;
        document.querySelector(`[data-unavailable="${platform}"]`).hidden = true;
      }
    } catch {
      version.textContent = "Não foi possível carregar os downloads. Recarregue a página para tentar de novo.";
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    try {
      if (await access.unlock(input.value)) {
        input.value = "";
        await openPreview();
      } else {
        status.textContent = "Código inválido.";
      }
    } catch {
      status.textContent = "Não foi possível liberar a prévia neste navegador.";
    }
  });
  document.querySelector("#lock-preview").addEventListener("click", () => {
    access.lock();
    location.reload();
  });
  if (access.allowed()) void openPreview();
})();
