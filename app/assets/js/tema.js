(() => {
  const chave = "studyrp-tema";
  const valores = ["sistema", "claro", "escuro"];
  const preferencia = matchMedia("(prefers-color-scheme: dark)");
  function lerTema() {
    try {
      const valor = localStorage.getItem(chave);
      if (valores.includes(valor)) return valor;
    } catch {}
    return "sistema";
  }
  let escolha = lerTema();
  function aplicar() {
    const atual = escolha === "sistema" ? (preferencia.matches ? "escuro" : "claro") : escolha;
    document.documentElement.dataset.tema = atual;
    document.querySelector('meta[name="theme-color"]').content = atual === "escuro" ? "#2b2d31" : "#f5f3eb";
    for (const select of document.querySelectorAll("[data-seletor-tema]")) select.value = escolha;
  }
  document.addEventListener("change", event => {
    if (!event.target.matches("[data-seletor-tema]") || !valores.includes(event.target.value)) return;
    escolha = event.target.value;
    try { localStorage.setItem(chave, escolha); } catch {}
    aplicar();
  });
  window.addEventListener("storage", event => {
    if (event.key === chave || event.key === null) { escolha = lerTema(); aplicar(); }
  });
  preferencia.addEventListener("change", aplicar);
  document.addEventListener("DOMContentLoaded", aplicar);
  window.StudyRPTema = { sincronizar: aplicar };
  aplicar();
})();
