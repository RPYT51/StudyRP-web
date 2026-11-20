

  const dias = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];
  const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  const mesesAbr = ["jan.","fev.","mar.","abr.","mai.","jun.","jul.","ago.","set.","out.","nov.","dez."];
  const hoje = new Date();
  document.getElementById("dia").textContent = dias[hoje.getDay()];
  document.getElementById("data").textContent = hoje.getDate() + " de " + meses[hoje.getMonth()] + " de " + hoje.getFullYear();

  const $ = (id) => document.getElementById(id);
  const picker = $("picker"), app = $("app"), perfil = $("perfil");
  const CHAVE = "studyrp-estilo", CHAVE_CONTAS = "studyrp-contas", CHAVE_SESSAO = "studyrp-sessao";

  function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function gravar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function contas() { try { return JSON.parse(ler(CHAVE_CONTAS) || "{}"); } catch (e) { return {}; } }
  const SESSAO = (function () { const u = ler(CHAVE_SESSAO); return u && contas()[u] ? u : ""; })();
  const CHAVE_PERFIL = "studyrp-perfil" + (SESSAO ? "-" + SESSAO : "");

  let dados = { nome: "RPYT", status: "", bio: "", desde: "", foto: "", presenca: "online", statusAte: 0, duracao: "24h", devAte: 0, cargos: null, usuario: "", zoom: 100, textoMenor: false };
  let pendente = "";
  try { Object.assign(dados, JSON.parse(ler(CHAVE_PERFIL) || "{}")); } catch (e) {}
  if (!dados.nome) dados.nome = "RPYT";
  if (!dados.desde) { dados.desde = hoje.toISOString(); gravar(CHAVE_PERFIL, JSON.stringify(dados)); }

  const PRES = {
    online: { nome: "Disponível", cor: "#2fb86a" },
    ausente: { nome: "Ausente", cor: "#f0b232" },
    nao_perturbar: { nome: "Não perturbar", cor: "#e5484d" },
    invisivel: { nome: "Invisível", cor: "#80848e" }
  };
  const PRES_ICO = {
    online: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#2fb86a"/></svg>',
    ausente: '<svg viewBox="0 0 24 24"><path d="M21 14.2A9 9 0 1 1 9.8 3a7.2 7.2 0 0 0 11.2 11.2z" fill="#f0b232"/></svg>',
    nao_perturbar: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#e5484d"/><rect x="6" y="10.2" width="12" height="3.6" rx="1.8" fill="#232428"/></svg>',
    invisivel: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#80848e"/><circle cx="12" cy="12" r="4.2" fill="#232428"/></svg>'
  };
  const DURS = [
    { id: "24h", label: "24 horas", ms: 24 * 36e5 },
    { id: "4h", label: "4 horas", ms: 4 * 36e5 },
    { id: "1h", label: "1 hora", ms: 36e5 },
    { id: "30m", label: "30 minutos", ms: 30 * 6e4 },
    { id: "nunca", label: "Não limpar", ms: 0 }
  ];
  const hhmm = (d) => String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  function quando(id) {
    const d = DURS.find(x => x.id === id) || DURS[0];
    if (!d.ms) return "Nunca";
    const f = new Date(Date.now() + d.ms);
    return (f.getDate() === new Date().getDate() ? "Hoje" : "Amanhã") + " às " + hhmm(f);
  }
  function rotuloDur(d) {
    if (!d.ms) return d.label;
    const f = new Date(Date.now() + d.ms);
    return d.label + " (" + (d.id === "24h" ? "amanhã às " : "") + hhmm(f) + ")";
  }
  function verificarExpira() {
    if (dados.devAte && Date.now() >= dados.devAte) {
      dados.devAte = 0; gravar(CHAVE_PERFIL, JSON.stringify(dados)); pintar();
      if (telaAtual === "cargos") tela("app");
      if (typeof renderConfig === "function" && telaAtual === "config") renderConfig();
    }
    if (dados.statusAte && Date.now() >= dados.statusAte) {
      dados.status = ""; dados.statusAte = 0; gravar(CHAVE_PERFIL, JSON.stringify(dados)); pintar();
    }
  }

  function toast(msg) {
    if (typeof log === "function") log(msg);
    const t = $("toast"); t.textContent = msg; t.classList.add("on");
    clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("on"), 1800);
  }

  function aplicarFoto(src) {
    document.querySelectorAll("img.av").forEach(i => {
      if (src) { i.src = src; i.style.display = "block"; } else { i.removeAttribute("src"); i.style.display = "none"; }
    });
    document.querySelectorAll("[data-inicial]").forEach(e => { e.style.display = src ? "none" : ""; });
    $("rmFoto").style.display = src && $("edit").style.display !== "none" ? "block" : "none";
  }

  function pintar() {
    aplicarFoto(dados.foto);
    document.querySelectorAll("[data-nome]").forEach(e => e.textContent = dados.nome);
    document.querySelectorAll("[data-inicial]").forEach(e => e.textContent = dados.nome.charAt(0).toUpperCase());
    document.querySelectorAll("[data-dev]").forEach(e => { e.style.display = devAtivo() ? "" : "none"; });
    document.querySelectorAll("[data-cargos]").forEach(e => {
      e.innerHTML = cargosDe().map(id => '<span class="chip" style="color:' + (id === "Membro" ? "var(--muted)" : CARGOS.find(c => c.id === id).cor) + '">' + id + '</span>').join("");
    });
    document.querySelectorAll("[data-cargo]").forEach(e => e.textContent = cargo());
    const user = dados.usuario || dados.nome.toLowerCase().replace(/\s+/g, "");
    $("usuario").textContent = user;
    document.querySelectorAll("[data-usuario]").forEach(e => e.textContent = user);
    $("subStatus").textContent = dados.status || (PRES[dados.presenca] || PRES.online).nome;
    document.documentElement.style.setProperty("--pres", (PRES[dados.presenca] || PRES.online).cor);
    const b = $("bioVer");
    b.textContent = dados.bio || "Você ainda não escreveu uma bio.";
    b.className = dados.bio ? "" : "vazio";
    $("statusVer").textContent = dados.status || "Adicionar status";
    $("bolhaVer").classList.toggle("set", !!dados.status);
    const d = new Date(dados.desde);
    $("desde").textContent = d.getDate() + " de " + mesesAbr[d.getMonth()] + " de " + d.getFullYear();
  }

  let telaAtual = "app", origemStatus = "app", stDraft = { duracao: "24h" };
  function tela(qual) {
    telaAtual = qual;
    $("stscreen").classList.toggle("hidden", qual !== "status");
    $("cfg").classList.toggle("hidden", qual !== "config");
    $("pess").classList.toggle("hidden", qual !== "pessoas");
    $("crg").classList.toggle("hidden", qual !== "cargos");
    $("sub").classList.toggle("hidden", qual !== "sub");
    $("qr").classList.toggle("hidden", qual !== "qr");
    picker.classList.toggle("hidden", qual !== "picker");
    $("auth").classList.toggle("hidden", qual !== "auth");
    app.classList.toggle("hidden", qual !== "app");
    perfil.classList.toggle("hidden", qual !== "perfil");
    window.scrollTo(0, 0);
  }
  function modoPerfil(editando) {
    $("ver").style.display = editando ? "none" : "flex";
    $("edit").style.display = editando ? "flex" : "none";
    $("ptitulo").textContent = editando ? "Editar perfil" : "Perfil";
    window.scrollTo(0, 0);
  }
  function abrirApp(n) { app.dataset.estilo = n; tela("app"); }

  document.querySelectorAll(".opt").forEach(function (b) {
    b.addEventListener("click", function () { gravar(CHAVE, b.dataset.estilo); abrirApp(b.dataset.estilo); });
  });

  let lpTimer = null, lpFeito = false, sheetAbertoEm = 0;
  const pinfo = $("abrirPerfil");
  pinfo.addEventListener("pointerdown", () => {
    lpFeito = false; clearTimeout(lpTimer);
    lpTimer = setTimeout(() => { lpFeito = true; if (navigator.vibrate) navigator.vibrate(15); abrirSheetPres(); }, 500);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach(ev => pinfo.addEventListener(ev, () => clearTimeout(lpTimer)));
  pinfo.addEventListener("contextmenu", (e) => e.preventDefault());
  pinfo.addEventListener("click", () => {
    if (lpFeito) { lpFeito = false; return; }
    pintar(); modoPerfil(false); tela("perfil");
  });

  function abrirSheet(id) { $("sheetBg").classList.remove("hidden"); $(id).classList.remove("hidden"); sheetAbertoEm = Date.now(); }
  function fecharSheets() { ["sheetPres", "sheetDur", "sheetInfo", "sheetDev", "sheetCargo", "sheetLista", "sheetEdit"].forEach(i => $(i).classList.add("hidden")); $("sheetBg").classList.add("hidden"); }
  $("sheetBg").addEventListener("click", () => { if (Date.now() - sheetAbertoEm < 450) return; fecharSheets(); });

  function abrirSheetPres() {
    $("listaPres").innerHTML = Object.keys(PRES).map(k =>
      '<button data-k="' + k + '"><span class="pi">' + PRES_ICO[k] + '</span>' + PRES[k].nome +
      '<span class="radio' + (dados.presenca === k ? " on" : "") + '"></span></button>').join("");
    $("listaPres").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      dados.presenca = b.dataset.k; gravar(CHAVE_PERFIL, JSON.stringify(dados)); pintar(); fecharSheets();
    }));
    abrirSheet("sheetPres");
  }
  $("irStatus").addEventListener("click", () => { fecharSheets(); abrirStatus(); });

  function abrirStatus() {
    origemStatus = telaAtual === "status" ? origemStatus : telaAtual;
    stDraft = { duracao: dados.duracao || "24h" };
    $("stInput").value = dados.status;
    pintar(); atualizarStatusTela(); tela("status");
  }
  function atualizarStatusTela() {
    const t = $("stInput").value;
    $("stBolhaTxt").textContent = t || "O que você tem assistido?";
    $("stBolha").classList.toggle("set", !!t);
    $("stQuando").textContent = quando(stDraft.duracao);
  }
  function fecharStatus() { pintar(); tela(origemStatus || "app"); }
  $("stInput").addEventListener("input", atualizarStatusTela);
  $("stFechar").addEventListener("click", fecharStatus);
  $("stSalvar").addEventListener("click", () => {
    const t = $("stInput").value.trim();
    const d = DURS.find(x => x.id === stDraft.duracao) || DURS[0];
    dados.status = t; dados.duracao = d.id; dados.statusAte = t && d.ms ? Date.now() + d.ms : 0;
    gravar(CHAVE_PERFIL, JSON.stringify(dados));
    fecharStatus(); toast(t ? "Status salvo" : "Status removido");
  });
  $("stLimpar").addEventListener("click", () => {
    $("listaDur").innerHTML = DURS.map(d =>
      '<button data-id="' + d.id + '">' + rotuloDur(d) + '<span class="radio' + (stDraft.duracao === d.id ? " on" : "") + '"></span></button>').join("");
    $("listaDur").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      stDraft.duracao = b.dataset.id;
      $("listaDur").querySelectorAll(".radio").forEach(r => r.classList.remove("on"));
      b.querySelector(".radio").classList.add("on");
    }));
    abrirSheet("sheetDur");
  });
  $("durOk").addEventListener("click", () => { fecharSheets(); atualizarStatusTela(); });
  // ===== CONFIGURAÇÕES / DEV =====
  const VERSAO = window.STUDYRP_VERSION || "0.1";
  const logs = [];
  function log(msg) { logs.unshift(hhmm(new Date()) + "  " + msg); if (logs.length > 60) logs.pop(); }
  // Cargos e DEV ainda não têm autorização confiável no servidor. Nunca confiar em localStorage.
  function devAtivo() { return false; }
  const CARGOS = [
    { id: "Dono", emoji: "👑", cor: "var(--gold)", desc: "Administração geral" },
    { id: "Presidente", emoji: "⭐", cor: "#b98cff", desc: "Responsável pela própria sala" },
    { id: "Ajudantes", emoji: "🛡️", cor: "#4cd48b", desc: "Auxílio na moderação" },
    { id: "Membro", emoji: "", cor: "var(--text)", desc: "Usuário comum" }
  ];
  function cargosDe() {
    // Não carregar cargos privilegiados de armazenamento controlado pelo usuário.
    return ["Membro"];
  }
  function cargo() { return "Membro"; }

  const IC = {
    conta: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18c1.2-2.2 3.2-3.2 5.5-3.2s4.3 1 5.5 3.2"/>',
    social: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c2.2.7 3.5 2.6 3.5 5.7"/>',
    priv: '<path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6z"/><rect x="9.5" y="10.5" width="5" height="4.5" rx="1"/><path d="M10.5 10.5V9a1.5 1.5 0 0 1 3 0v1.5"/>',
    disp: '<rect x="2.5" y="5" width="13" height="9" rx="1.5"/><path d="M1.5 18h15"/><rect x="15.5" y="9" width="6" height="10" rx="1.5"/>',
    apps: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM19 19h2M14 20v1M20 14v2"/>',
    aparencia: '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.6-1.4-1.8-1.4-3 0-1 .8-1.6 1.8-1.6H17a4 4 0 0 0 4-4c0-4-4-7.4-9-7.4z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>',
    acess: '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="7.5" r="1.2"/><path d="M7 10.5l5 1 5-1M12 11.5V15M9.5 19l2.5-4 2.5 4"/>',
    idioma: '<path d="M3 5h10M8 3v2M5 5c.6 3 2.4 5.5 5 7M11 5c-.6 3-2.6 5.7-6 8"/><path d="m12 20 4.5-10L21 20M13.5 17h6"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L3 20l1-5.2A8 8 0 1 1 21 12z"/>',
    sino: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    info: '<circle cx="12" cy="12" r="9.5"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r=".6"/>',
    sair: '<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M14 8l4 4-4 4M18 12H9"/>',
    ver: '<path d="M2 5.5C4.5 4 8 4 12 6c4-2 7.5-2 10-.5V19c-2.5-1.5-6-1.5-10 .5-4-2-7.5-2-10-.5z"/><path d="M12 6v13.5"/>',
    phone: '<rect x="6" y="2.5" width="11" height="19" rx="2.5"/><path d="M11 18.5h1"/>',
    clip: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 17h4"/>',
    log: '<path d="M3 5h14M3 10h8M3 15h6"/><circle cx="16" cy="15" r="3.5"/><path d="m21 20-2.5-2.5"/>',
    cargos: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>',
    cache: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"/><path d="M14 3v5h5l-5-5z"/><path d="M18 14l4 7h-8z"/><path d="M18 17v2"/>',
    busca: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    minus: '<path d="M6 12h12"/>', plus: '<path d="M12 6v12M6 12h12"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    push: '<rect x="3" y="3" width="14" height="14" rx="3"/><circle cx="18" cy="18" r="3"/>',
    cachesave: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M12 17v-6m-3 3 3-3 3 3"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    voltar: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    code: '<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>'
  };
  function svg(n, cls) {
    return '<svg ' + (cls ? 'class="' + cls + '" ' : '') + 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + IC[n] + '</svg>';
  }

  function abrirInfo(titulo, corpo, botoes) {
    $("infoT").textContent = titulo;
    const p = $("infoP"); p.textContent = corpo || ""; p.style.display = corpo ? "block" : "none";
    const box = $("infoBtns"); box.innerHTML = "";
    (botoes || [{ txt: "Beleza" }]).forEach(b => {
      const el = document.createElement("button");
      el.className = "primary" + (b.cls ? " " + b.cls : ""); el.textContent = b.txt;
      el.addEventListener("click", () => { if (b.fn && b.fn.call(el) === false) return; fecharSheets(); });
      box.appendChild(el);
    });
    abrirSheet("sheetInfo");
  }

  function secoes() {
    const A = {
      "Conta": () => abrirConta(), "Dispositivos": abrirDispositivos, "Apps conectados": abrirApps, "Escanear o código QR": abrirQR, "Aparência": abrirAparencia,
      "Acessibilidade": () => abrirAparencia(true), "Idioma": abrirIdioma,
      "Notificações": abrirNotificacoes, "Novidades": abrirNovidades,
      "Informações do dispositivo": abrirDispositivo, "Informações do cliente": abrirCliente, "Registros": abrirRegistros, "Ações de cache": abrirCache,
      "Cargos": () => abrirCargos(), "Versão do App": () => toast("StudyRP " + VERSAO), "Sair": sair
    };
    const s = [
      { t: "Configurações de conta", itens: [
        { i: "conta", l: "Conta" }, { i: "disp", l: "Dispositivos" }, { i: "apps", l: "Apps conectados" }, { i: "qr", l: "Escanear o código QR" } ] },
      { t: "Config. do aplicativo", itens: [
        { i: "aparencia", l: "Aparência", v: "Estilo " + app.dataset.estilo },
        { i: "acess", l: "Acessibilidade" }, { i: "idioma", l: "Idioma", v: "Português, Brasil" },
        { i: "sino", l: "Notificações" } ] },
      { t: "Novidades", itens: [ { i: "info", l: "Novidades" } ] },
      { t: "", itens: [ { i: "sair", l: "Sair", red: true } ] }
    ];
    if (devAtivo()) s.push({ t: "Configurações do desenvolvedor", itens: [
      { i: "cargos", l: "Cargos" },
      { i: "ver", l: "Versão do App", v: "StudyRP " + VERSAO, semSeta: true },
      { i: "phone", l: "Informações do dispositivo", v: (navigator.platform || "-") + " " + window.innerWidth + "x" + window.innerHeight, semSeta: true },
      { i: "clip", l: "Informações do cliente" }, { i: "log", l: "Registros" }, { i: "cache", l: "Ações de cache" } ] });
    s.forEach(sec => sec.itens.forEach(it => { it.a = A[it.l]; }));
    return s;
  }

  let acoesCfg = [];
  function renderConfig() {
    acoesCfg = [];
    $("cfgCorpo").innerHTML = secoes().map(sec =>
      '<div class="sec-cfg">' + (sec.t ? '<div class="glabel">' + sec.t + '</div>' : '') + '<div class="grp">' +
      sec.itens.map(it => {
        acoesCfg.push(it.a);
        return '<button class="row' + (it.red ? " red" : "") + '" data-n="' + (acoesCfg.length - 1) + '" data-txt="' + it.l.toLowerCase() + '">' +
          '<span class="ri">' + svg(it.i) + '</span><span class="rl">' + it.l + '</span>' +
          (it.v ? '<span class="rv">' + it.v + '</span>' : '') + (it.semSeta ? '' : svg("chevD", "rc")) + '</button>';
      }).join("") + '</div></div>').join("");
    $("cfgCorpo").querySelectorAll(".row").forEach(b => b.addEventListener("click", () => acoesCfg[+b.dataset.n]()));
    filtrarConfig();
  }
  IC.chevD = '<path d="m9 6 6 6-6 6"/>';
  function filtrarConfig() {
    const q = $("cfgBusca").value.trim().toLowerCase();
    $("cfgCorpo").querySelectorAll(".sec-cfg").forEach(sec => {
      let alguma = false;
      sec.querySelectorAll(".row").forEach(r => { const ok = !q || r.dataset.txt.includes(q); r.style.display = ok ? "" : "none"; if (ok) alguma = true; });
      sec.style.display = alguma ? "" : "none";
    });
  }
  let origemCfg = "perfil";
  function abrirConfig() { origemCfg = telaAtual === "config" ? origemCfg : telaAtual; $("cfgBusca").value = ""; renderConfig(); tela("config"); }
  $("cfgBusca").addEventListener("input", filtrarConfig);
  $("cfgFechar").addEventListener("click", () => tela(origemCfg || "perfil"));
  $("optConfig").addEventListener("click", abrirConfig);

  // DEV por KEY
  function abrirDev() {
    $("devErro").textContent = ""; $("inKey").value = "";
    if (devAtivo()) {
      const falta = dados.devAte - Date.now(), h = Math.floor(falta / 36e5), m = Math.floor(falta % 36e5 / 6e4);
      $("devMsg").textContent = "DEV ativo até " + hhmm(new Date(dados.devAte)) + " (restam " + h + " h " + m + " min).";
      $("devCampo").style.display = "none"; $("devCargos").style.display = ""; $("devOk").textContent = "Desativar DEV"; $("devOk").classList.add("danger");
    } else {
      $("devMsg").textContent = "Digite a KEY para ativar o cargo DEV por 6 horas.";
      $("devCampo").style.display = "block"; $("devCargos").style.display = "none"; $("devOk").textContent = "Ativar"; $("devOk").classList.remove("danger");
    }
    abrirSheet("sheetDev");
  }
  function confirmarDev() {
    log("Tentativa de ativação DEV bloqueada: falta autorização no servidor");
    $("devErro").textContent = "Ativação DEV temporariamente indisponível. A autorização precisa ser validada no servidor.";
  }
  $("optDev").addEventListener("click", abrirDev);
  $("devOk").addEventListener("click", confirmarDev);
  $("inKey").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarDev(); });

  const esc = (t) => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function social() {
    if (contas()[SESSAO]?.provider !== "google" || !window.StudyRPSocial) {
      throw new Error("Entre com uma conta Google cadastrada na nuvem para usar este recurso.");
    }
    return window.StudyRPSocial;
  }

  function painelSocial(titulo, voltar = () => tela("app")) {
    $("painelSocialTitulo").textContent = titulo;
    $("pessFechar").onclick = voltar;
    $("adicionarAmigo").classList.toggle("hidden", titulo !== "Amigos");
    $("pessCorpo").replaceChildren();
    tela("pessoas");
    return $("pessCorpo");
  }

  const socialTexto = (texto) => {
    const p = document.createElement("p");
    p.className = "social-text";
    p.textContent = texto;
    return p;
  };

  function botaoSocial(titulo, acao) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "primary";
    botao.textContent = titulo;
    botao.onclick = acao;
    return botao;
  }

  function formularioSocial(label, acao, max, enviar) {
    const form = document.createElement("form");
    form.className = "box";
    const rotulo = document.createElement("label");
    const input = document.createElement("input");
    input.required = true;
    input.maxLength = max;
    input.autocomplete = "off";
    input.autocapitalize = "off";
    rotulo.append(label, input);
    const botao = document.createElement("button");
    botao.className = "primary";
    botao.textContent = acao;
    const aviso = socialTexto("");
    aviso.setAttribute("role", "status");
    form.append(rotulo, botao, aviso);
    form.onsubmit = async (event) => {
      event.preventDefault();
      if (botao.disabled || !input.value.trim()) return;
      botao.disabled = true;
      aviso.textContent = "";
      try {
        await enviar(input.value.trim(), form);
      } catch (error) {
        aviso.textContent = mensagemSocial(error);
      } finally {
        botao.disabled = false;
      }
    };
    return form;
  }

  function mensagemSocial(error) {
    if (error.code === "permission-denied") return "Acesso indisponível. Confira se a conta em nuvem e as regras da turma estão ativas.";
    return error.message || "Não foi possível concluir. Tente novamente.";
  }

  async function carregarSocial(corpo, tarefa, render, falha) {
    const aviso = socialTexto("Carregando…");
    corpo.append(aviso);
    try {
      const dados = await tarefa();
      if (aviso.isConnected) {
        aviso.remove();
        render(dados);
      }
    } catch (error) {
      aviso.textContent = mensagemSocial(error);
      if (aviso.isConnected) falha?.();
    }
  }

  function abrirAmigos() {
    const corpo = painelSocial("Amigos");
    void carregarSocial(corpo, () => social().listarAmigos(), (amigos) => {
      if (!amigos.length) corpo.append(socialTexto("Nenhum amigo adicionado."));
      for (const amigo of amigos) corpo.append(socialTexto("@" + amigo.username));
    });
  }

  $("btnPessoas").onclick = abrirAmigos;
  $("amigos").onclick = abrirAmigos;
  $("adicionarAmigo").onclick = () => {
    const corpo = painelSocial("Adicionar amigo", abrirAmigos);
    corpo.append(formularioSocial("Nome de usuário", "Adicionar amigo", 21, async (valor, form) => {
      const nome = valor.replace(/^@/, "").toLowerCase();
      if (!/^[a-z0-9._]{2,20}$/.test(nome)) throw new Error("Digite um nome de usuário válido.");
      await social().adicionarAmigo(nome);
      if (form.isConnected) abrirAmigos();
    }));
  };

  function atualizarRotuloTurma(turma) {
    $("rotuloTurma").textContent = turma ? "Turma" : "Entrar em uma turma";
  }

  function abrirTurma() {
    const corpo = painelSocial("Turma");
    const mostrarEntrada = () => {
      $("painelSocialTitulo").textContent = "Entrar em uma turma";
      corpo.append(formularioSocial("Código do convite", "Entrar", 32, async (valor, form) => {
        const code = valor.toLowerCase();
        if (!/^[a-f0-9]{32}$/.test(code)) throw new Error("Código de convite inválido.");
        await social().entrarTurma(code);
        if (form.isConnected) abrirTurma();
      }));
    };
    void carregarSocial(corpo, () => social().obterTurma(), (turma) => {
      atualizarRotuloTurma(turma);
      if (!turma) { mostrarEntrada(); return; }
      corpo.append(socialTexto(turma.name), botaoSocial("Atividades", abrirAtividades),
        botaoSocial("Bate-papo", abrirChats), botaoSocial("Informações", () => abrirInformacoesTurma(turma)));
    }, mostrarEntrada);
  }

  function abrirInformacoesTurma(turma) {
    const corpo = painelSocial("Informações da turma", abrirTurma);
    corpo.append(socialTexto(turma.name), socialTexto(turma.description || "Sem descrição."));
    if (turma.podeConvidar) {
      const codigo = socialTexto("");
      codigo.setAttribute("role", "status");
      const botao = botaoSocial("Gerar convite", async () => {
        botao.disabled = true;
        try {
          codigo.textContent = await social().criarConvite();
        } catch (error) {
          codigo.textContent = mensagemSocial(error);
        } finally {
          botao.disabled = false;
        }
      });
      corpo.append(botao, codigo);
    }
  }

  function abrirAtividades() {
    const corpo = painelSocial("Atividades", abrirTurma);
    void carregarSocial(corpo, () => social().listarAtividades(), (atividades) => {
      if (!atividades.length) corpo.append(socialTexto("Nenhuma atividade publicada."));
      for (const atividade of atividades) {
        corpo.append(botaoSocial(atividade.title, () => abrirResolver(atividade, abrirAtividades)));
      }
    });
  }

  function abrirChats() {
    const corpo = painelSocial("Bate-papo", abrirTurma);
    corpo.append(botaoSocial("Criar chat", () => {
      const painel = painelSocial("Criar chat", abrirChats);
      painel.append(formularioSocial("Nome do chat", "Criar", 60, async (nome, form) => {
        await social().criarChat(nome);
        if (form.isConnected) abrirChats();
      }));
    }));
    void carregarSocial(corpo, () => social().listarChats(), (chats) => {
      if (!chats.length) corpo.append(socialTexto("Nenhum chat criado."));
      for (const chat of chats) corpo.append(botaoSocial(chat.title, () => abrirChat(chat)));
    });
  }

  function abrirChat(chat) {
    const corpo = painelSocial(chat.title, abrirChats);
    corpo.append(botaoSocial("Atualizar mensagens", () => abrirChat(chat)));
    const feed = document.createElement("section");
    corpo.append(feed);
    corpo.append(formularioSocial("Mensagem", "Enviar", 1000, async (mensagem, form) => {
      await social().enviarMensagem(chat.id, mensagem);
      if (form.isConnected) abrirChat(chat);
    }));
    void carregarSocial(feed, () => social().listarMensagens(chat.id), (mensagens) => {
      if (!mensagens.length) feed.append(socialTexto("Nenhuma mensagem."));
      for (const mensagem of mensagens) feed.append(socialTexto("@" + mensagem.username + " — " + mensagem.text));
    });
  }

  function abrirResolver(atividade, voltar) {
    const corpo = painelSocial("Resolver", voltar);
    const chave = "studyrp-rascunho/" + SESSAO + "/" + (atividade?.id || "livre");
    let salvo = {};
    try { salvo = JSON.parse(ler(chave)) || {}; } catch {}
    const form = document.createElement("form");
    form.className = "box";
    const label = document.createElement("label");
    const enunciado = document.createElement("textarea");
    enunciado.value = atividade?.prompt || salvo.enunciado || "";
    enunciado.readOnly = Boolean(atividade);
    enunciado.maxLength = 5000;
    label.append("Enunciado", enunciado);
    const respostaLabel = document.createElement("label");
    const resposta = document.createElement("textarea");
    resposta.value = salvo.resposta || "";
    resposta.maxLength = 5000;
    respostaLabel.append("Sua resolução", resposta);
    const estado = socialTexto("");
    estado.setAttribute("role", "status");
    form.append(label, respostaLabel, botaoSocial("Salvar rascunho", () => {
      try {
        localStorage.setItem(chave, JSON.stringify({ enunciado: enunciado.value, resposta: resposta.value }));
        estado.textContent = "Rascunho salvo neste dispositivo.";
      } catch {
        estado.textContent = "Não foi possível salvar o rascunho neste dispositivo.";
      }
    }), estado);
    corpo.append(form);
  }

  $("btnTurma").onclick = abrirTurma;
  $("btnResolver").onclick = () => abrirResolver();
  const atualizarTurmaInicial = () => {
    if (contas()[SESSAO]?.provider === "google" && window.StudyRPSocial) {
      void social().obterTurma().then(atualizarRotuloTurma).catch(() => {});
    }
  };
  window.addEventListener("studyrp:google-user", atualizarTurmaInicial);

  function copiarAlt(txt) {
    const t = document.createElement("textarea"); t.value = txt; t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select(); let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    t.remove(); toast(ok ? "Copiado" : "Não foi possível copiar");
  }
  function copiar(txt) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(() => toast("Copiado"), () => copiarAlt(txt)); return; }
    } catch (e) {}
    copiarAlt(txt);
  }

  function abrirLista(titulo, itens, extra) {
    $("listaT").textContent = titulo;
    const box = $("listaItens"); box.innerHTML = "";
    itens.forEach(it => {
      const el = document.createElement(it.a ? "button" : "div");
      el.className = (it.a ? "" : "it2") + (it.red ? " red" : "");
      el.innerHTML = (it.ic ? '<span class="pi">' + svg(it.ic) + '</span>' : '') + '<span class="itx"><span class="itl">' + esc(it.l) + '</span>' +
        (it.v !== undefined ? '<span class="itv">' + esc(it.v) + '</span>' : '') + '</span>';
      if (it.a) el.addEventListener("click", () => it.a(el));
      box.appendChild(el);
    });
    const ex = $("listaExtra"); ex.innerHTML = "";
    if (extra) {
      const b = document.createElement("button"); b.className = "rowbtn";
      b.innerHTML = '<span class="pi">' + svg(extra.ic) + '</span>' + esc(extra.l);
      b.addEventListener("click", extra.a); ex.appendChild(b);
    }
    abrirSheet("sheetLista");
  }

  let tempoInicio = 0;
  function itensCliente() {
    return [
      { l: "Versão do App", v: VERSAO },
      { l: "Navegador", v: navigator.userAgent },
      { l: "Idioma", v: navigator.language || "-" },
      { l: "Tela", v: window.innerWidth + "x" + window.innerHeight + " @" + (window.devicePixelRatio || 1) + "x" },
      { l: "Estilo da tela inicial", v: "Estilo " + app.dataset.estilo },
      { l: "Cargos", v: cargosDe().join(", ") },
      { l: "DEV", v: devAtivo() ? "ativo até " + hhmm(new Date(dados.devAte)) : "inativo" }
    ];
  }
  function itensDispositivo() {
    return [
      { l: "Plataforma", v: navigator.platform || "-" },
      { l: "Fuso horário", v: (Intl.DateTimeFormat().resolvedOptions().timeZone) || "-" },
      { l: "Núcleos do processador", v: String(navigator.hardwareConcurrency || "-") },
      { l: "Memória (aprox.)", v: navigator.deviceMemory ? navigator.deviceMemory + " GB" : "-" },
      { l: "Tela", v: screen.width + "x" + screen.height },
      { l: "Conexão", v: navigator.onLine ? "online" : "offline" }
    ];
  }
  const comoTexto = (l) => l.map(i => i.l + ": " + i.v).join("\n");
  function abrirCliente() { abrirLista("Informações do cliente", itensCliente(), { ic: "copy", l: "Copiar informações do cliente", a: () => copiar(comoTexto(itensCliente())) }); }
  function abrirDispositivo() { abrirLista("Informações do dispositivo", itensDispositivo(), { ic: "copy", l: "Copiar informações do dispositivo", a: () => copiar(comoTexto(itensDispositivo())) }); }
  function abrirRegistros() {
    abrirLista("Registros", [
      { ic: "wrench", l: "Registros de depuração", a: () => { fecharSheets(); abrirInfo("Registros de depuração", logs.length ? logs.join("\n") : "Nenhum registro ainda."); } },
      { ic: "clock", l: "Tempo de Inicialização", a: () => { fecharSheets(); abrirInfo("Tempo de Inicialização", tempoInicio + " ms"); } },
      { ic: "push", l: "Registros de notificação push", a: () => { fecharSheets(); abrirInfo("Registros de notificação push", "Nenhum registro ainda."); } }
    ]);
  }
  let cacheConf = false;
  function abrirCache() {
    cacheConf = false;
    abrirLista("Ações de cache", [
      { ic: "cachesave", l: "Gravar cache", a: () => { try { localStorage.setItem("studyrp-cache", JSON.stringify({ t: Date.now(), conta: SESSAO, dados })); } catch (e) {} log("Cache gravado"); toast("Cache gravado"); } },
      { ic: "file", l: "Calcular tamanho", a: () => {
        let n = 0; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); n += k.length + (localStorage.getItem(k) || "").length; } } catch (e) {}
        toast("Tamanho: " + (n * 2 / 1024).toFixed(1) + " KB");
      } },
      { ic: "cache", l: "Limpar cache", red: true, a: (el) => {
        if (!cacheConf) { cacheConf = true; el.querySelector(".itl").textContent = "Toque de novo para confirmar"; return; }
        try { ["studyrp-cache", CHAVE, CHAVE_PERFIL].forEach(k => localStorage.removeItem(k)); } catch (e) {}
        location.reload();
      } }
    ]);
  }

  // campo editável (nome de usuário / nome exibido)
  let editAplicar = null;
  function editarCampo(titulo, valor, max, aplicar, tipo = "text") {
    $("editIn").type = tipo;
    $("editT").textContent = titulo; $("editIn").value = valor; $("editIn").maxLength = max; $("editErro").textContent = ""; editAplicar = aplicar;
    abrirSheet("sheetEdit"); setTimeout(() => $("editIn").focus(), 60);
  }
  function confirmarEdit() {
    const erro = editAplicar && editAplicar($("editIn").value.trim());
    if (erro) { $("editErro").textContent = erro; return; }
    gravar(CHAVE_PERFIL, JSON.stringify(dados)); pintar(); fecharSheets();
    if (telaAtual === "sub") abrirConta(true);
  }
  $("editOk").addEventListener("click", confirmarEdit);
  $("editIn").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarEdit(); });

  // ----- subtelas -----
  function usuarioAtual() { return dados.usuario || dados.nome.toLowerCase().replace(/\s+/g, ""); }
  function linhaSimples(id, l, v, red) {
    return '<button class="row plain' + (red ? " red" : "") + '" data-id="' + id + '"><span class="rl">' + l + '</span>' +
      (v ? '<span class="rv">' + esc(v) + '</span>' : '') + (red ? '' : svg("chevD", "rc")) + '</button>';
  }
  function ligarLinhas(mapa) {
    $("subCorpo").querySelectorAll("[data-id]").forEach(b => b.addEventListener("click", () => mapa[b.dataset.id] && mapa[b.dataset.id]()));
  }
  function abrirSub(titulo) { $("subT").textContent = titulo; tela("sub"); }
  $("subVoltar").addEventListener("click", () => { renderConfig(); tela("config"); });

  let excluindoConta = false;
  function confirmarExclusaoConta() {
    const conta = contas()[SESSAO];
    if (!SESSAO || !conta || excluindoConta) return;
    const google = conta.provider === "google";
    const mensagem = google
      ? "Sua conta StudyRP e os dados deste perfil no aparelho serão apagados. Você vai confirmar sua identidade pelo Google."
      : "Sua conta StudyRP e os dados deste perfil serão apagados deste aparelho.";
    abrirInfo("Excluir conta?", mensagem + " Essa ação não pode ser desfeita.", [
      { txt: "Cancelar" },
      { txt: "Excluir minha conta", cls: "danger", fn() {
        if (excluindoConta) return false;
        const botao = this;
        excluindoConta = true;
        botao.disabled = true;
        void (async () => {
          try {
            if (ler(CHAVE_SESSAO) !== SESSAO) throw new Error("Entre novamente para excluir a sua conta.");
            if (google) {
              if (!window.StudyRPGoogle || window.StudyRPCloud) {
                throw new Error("A exclusão desta conta Google está indisponível nesta versão.");
              }
              await window.StudyRPGoogle.excluirConta(conta.uid);
            }
            const todas = contas();
            delete todas[SESSAO];
            localStorage.removeItem(CHAVE_PERFIL);
            const rascunho = "studyrp-rascunho/" + SESSAO + "/";
            for (const chave of Object.keys(localStorage)) {
              if (chave.startsWith(rascunho)) localStorage.removeItem(chave);
            }
            const cache = ler("studyrp-cache");
            if (cache) {
              let contaDoCache;
              try { contaDoCache = JSON.parse(cache)?.conta; } catch {}
              if (!contaDoCache || contaDoCache === SESSAO) localStorage.removeItem("studyrp-cache");
            }
            localStorage.setItem(CHAVE_CONTAS, JSON.stringify(todas));
            if (ler(CHAVE_SESSAO) === SESSAO) localStorage.removeItem(CHAVE_SESSAO);
            location.reload();
          } catch (error) {
            excluindoConta = false;
            abrirInfo("Não foi possível excluir a conta", error.message || "Tente novamente.");
          }
        })();
        return false;
      } }
    ]);
  }

  function abrirConta(semTrocarTela) {
    $("subCorpo").innerHTML =
      '<div class="glabel">Informações de conta</div><div class="grp plain">' +
        linhaSimples("user", "Nome de usuário", usuarioAtual()) + linhaSimples("nome", "Nome exibido", dados.nome) +
        linhaSimples("telefone", "Telefone", dados.telefone || "Não informado") + '</div>' +
      '<div class="glabel">Segurança</div><div class="grp plain">' + linhaSimples("senha", "Senha") + '</div>' +
      '<div class="glabel">Gerenciamento da conta</div><div class="grp plain">' +
        linhaSimples("excluir", "Excluir conta", "", true) + '</div>';
    ligarLinhas({
      user: () => editarCampo("Nome de usuário", usuarioAtual(), 20, (v) => {
        v = v.toLowerCase(); if (!/^[a-z0-9._]{2,20}$/.test(v)) return "Use 2 a 20 letras minúsculas, números, ponto ou _.";
        dados.usuario = v; return null;
      }),
      nome: () => editarCampo("Nome exibido", dados.nome, 24, (v) => { if (!v) return "O nome não pode ficar vazio."; dados.nome = v; return null; }),
      telefone: () => editarCampo("Telefone (opcional)", dados.telefone || "", 20, (v) => { dados.telefone = v; }, "tel"),
      senha: abrirAlteracaoSenha, excluir: confirmarExclusaoConta
    });
    if (!semTrocarTela) abrirSub("Conta"); else $("subT").textContent = "Conta";
  }

  function abrirDispositivos() {
    $("subCorpo").innerHTML = '<div class="glabel">Sessão atual</div><div class="grp plain">' +
      linhaSimples("sair", "Sair deste dispositivo") + '</div>' +
      '<p class="subdesc" id="sessaoDispositivo"></p>';
    $("sessaoDispositivo").textContent = (navigator.userAgentData?.platform || navigator.platform || "Este dispositivo") +
      " · A lista de sessões de outros dispositivos ainda não está disponível.";
    ligarLinhas({ sair });
    abrirSub("Dispositivos");
  }

  function abrirApps() {
    const google = contas()[SESSAO]?.provider === "google";
    $("subCorpo").innerHTML = '<div class="glabel">Provedor de login</div><p class="subdesc"></p>';
    $("subCorpo").lastElementChild.textContent = google
      ? "Google está vinculado ao login desta conta."
      : "Você entra com usuário e senha. Nenhum provedor externo está vinculado.";
    abrirSub("Apps conectados");
  }

  function abrirIdioma() {
    $("subCorpo").innerHTML = '<div class="glabel">Idioma do aplicativo</div>' +
      '<p class="subdesc" lang="pt-BR">Português (Brasil) é o idioma disponível.</p>';
    abrirSub("Idioma");
  }

  function abrirNotificacoes() {
    $("subCorpo").innerHTML = '<p class="mvazio">Nenhuma notificação nova.</p>' +
      '<p class="subdesc">Esta versão ainda não recebe notificações push.</p>';
    abrirSub("Notificações");
  }

  async function abrirNovidades() {
    $("subCorpo").innerHTML = '<div class="glabel">Versão instalada</div><p id="versaoInstalada" class="subdesc"></p>' +
      '<div class="glabel">Última versão publicada</div><p id="resumoRelease" class="subdesc" role="status">Consultando…</p>';
    $("versaoInstalada").textContent = "StudyRP " + VERSAO;
    const resumo = $("resumoRelease");
    abrirSub("Novidades");
    try {
      const resposta = await fetch("https://api.github.com/repos/RPYT51/StudyRP-web/releases/latest", { cache: "no-store" });
      if (!resposta.ok) throw new Error();
      const release = await resposta.json();
      resumo.textContent = [release.tag_name, release.body?.trim()].filter(Boolean).join("\n\n");
      resumo.style.whiteSpace = "pre-wrap";
    } catch {
      resumo.textContent = "Não foi possível consultar a última versão. Tente novamente quando estiver conectado.";
    }
  }

  function abrirAlteracaoSenha() {
    const conta = contas()[SESSAO];
    if (conta?.provider === "google") {
      abrirInfo("Senha", "A senha usada neste login é gerenciada pela sua Conta Google.");
      return;
    }
    $("subCorpo").innerHTML = `<form id="alterarSenha" class="box">
      <div class="field"><label for="senhaAtual">Senha atual</label><div class="inp"><input id="senhaAtual" type="password" autocomplete="current-password" required></div></div>
      <div class="field"><label for="senhaNova">Nova senha</label><div class="inp"><input id="senhaNova" type="password" autocomplete="new-password" minlength="6" required></div></div>
      <div class="field"><label for="senhaConfirmada">Confirmar nova senha</label><div class="inp"><input id="senhaConfirmada" type="password" autocomplete="new-password" minlength="6" required></div></div>
      <p class="erro" role="status"></p><button class="primary" type="submit">Salvar nova senha</button>
    </form>`;
    $("alterarSenha").addEventListener("submit", async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const botao = form.querySelector("button");
      const erro = form.querySelector(".erro");
      const atual = $("senhaAtual").value;
      const nova = $("senhaNova").value;
      erro.textContent = "";
      if (nova.length < 6 || nova !== $("senhaConfirmada").value) {
        erro.textContent = "Digite a mesma nova senha nos dois campos, com pelo menos 6 caracteres.";
        return;
      }
      botao.disabled = true;
      try {
        if (!conta || await hashSenha(conta.sal, atual) !== conta.hash) throw new Error("Senha atual incorreta.");
        const sal = Array.from(crypto.getRandomValues(new Uint8Array(16)), v => v.toString(16).padStart(2, "0")).join("");
        const hash = await hashSenha(sal, nova);
        const todas = contas();
        if (ler(CHAVE_SESSAO) !== SESSAO || todas[SESSAO]?.hash !== conta.hash) {
          throw new Error("A sessão ou a senha mudou. Abra a tela Conta novamente.");
        }
        todas[SESSAO] = { ...todas[SESSAO], sal, hash };
        localStorage.setItem(CHAVE_CONTAS, JSON.stringify(todas));
        if (form.isConnected) { abrirConta(); toast("Senha alterada neste dispositivo."); }
      } catch (error) {
        erro.textContent = error.message || "Não foi possível alterar a senha.";
      } finally {
        botao.disabled = false;
      }
    });
    abrirSub("Alterar senha");
  }

  function aplicarZoom() {
    const z = Math.min(130, Math.max(80, +dados.zoom || 100));
    document.documentElement.style.fontSize = (16 * z / 100 * (dados.textoMenor ? 0.92 : 1)) + "px";
  }
  function abrirAparencia(apenasAcessibilidade = false) {
    apenasAcessibilidade = apenasAcessibilidade === true;
    $("subCorpo").innerHTML =
      (apenasAcessibilidade ? "" : '<div class="glabel">Tema</div><div class="grp plain">' + linhaSimples("estilo", "Estilo da tela inicial", "Estilo " + app.dataset.estilo) + '</div>') +
      '<div class="glabel">Nível de zoom</div><div class="zoomcard">' +
        '<div class="zrow"><b>Nível de zoom</b><span id="zVal"></span></div>' +
        '<div class="zctl"><button class="zbtn" id="zMenos" aria-label="Diminuir">' + svg("minus") + '</button>' +
        '<input type="range" id="zRange" min="80" max="130" step="5"><button class="zbtn" id="zMais" aria-label="Aumentar">' + svg("plus") + '</button></div>' +
        '<button class="zreset" id="zReset">Redefinir para padrão</button>' +
        '<div class="swrow"><div><div class="swt">Tamanho clássico do texto</div><div class="swd">Quando ativado usa uma fonte de tamanho um pouco menor.</div></div>' +
        '<button class="sw" id="swTexto" role="switch"></button></div></div>';
    const mostrar = () => { $("zVal").textContent = dados.zoom + "%"; $("zRange").value = dados.zoom; $("swTexto").classList.toggle("on", !!dados.textoMenor); $("swTexto").setAttribute("aria-checked", !!dados.textoMenor); };
    const mudar = (z) => { dados.zoom = Math.min(130, Math.max(80, z)); gravar(CHAVE_PERFIL, JSON.stringify(dados)); aplicarZoom(); mostrar(); };
    $("zMenos").addEventListener("click", () => mudar(dados.zoom - 5));
    $("zMais").addEventListener("click", () => mudar(dados.zoom + 5));
    $("zRange").addEventListener("input", (e) => mudar(+e.target.value));
    $("zReset").addEventListener("click", () => { dados.textoMenor = false; mudar(100); });
    $("swTexto").addEventListener("click", () => { dados.textoMenor = !dados.textoMenor; gravar(CHAVE_PERFIL, JSON.stringify(dados)); aplicarZoom(); mostrar(); });
    ligarLinhas({ estilo: () => tela("picker") });
    mostrar(); abrirSub(apenasAcessibilidade ? "Acessibilidade" : "Aparência");
  }

  // ----- QR -----
  let qrStream = null, qrTimer = null;
  function abrirQR() {
    tela("qr"); $("qrMsg").textContent = "Aponte a câmera para um código QR.";
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw 0;
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(st => {
        qrStream = st; $("qrVideo").srcObject = st; const p = $("qrVideo").play && $("qrVideo").play(); if (p && p.catch) p.catch(() => {});
        if ("BarcodeDetector" in window) {
          const det = new BarcodeDetector({ formats: ["qr_code"] });
          qrTimer = setInterval(() => det.detect($("qrVideo")).then(r => { if (r.length) { toast("QR: " + r[0].rawValue); log("QR lido"); fecharQR(); } }).catch(() => {}), 600);
        }
      }).catch(() => { $("qrMsg").textContent = "Câmera indisponível ou sem permissão."; });
    } catch (e) { $("qrMsg").textContent = "Câmera indisponível neste aparelho."; }
  }
  function fecharQR() {
    clearInterval(qrTimer); qrTimer = null;
    if (qrStream) { qrStream.getTracks().forEach(t => t.stop()); qrStream = null; }
    $("qrVideo").srcObject = null; renderConfig(); tela("config");
  }
  $("qrFechar").addEventListener("click", fecharQR);
  aplicarZoom();

  // ===== CARGOS (só com DEV ativo) =====
  let origemCargos = "config";
  function membrosLista() { return [{ id: "eu", nome: dados.nome, foto: dados.foto, cargos: cargosDe() }]; }
  function abrirCargos() {
    if (!devAtivo()) { toast("Ative o DEV para gerenciar cargos"); return; }
    origemCargos = telaAtual === "cargos" ? origemCargos : telaAtual;
    $("crgInput").value = ""; renderCargos(); tela("cargos");
  }
  function renderCargos() {
    $("crgInfo").innerHTML = '<div class="mlabel">Cargos</div><div class="mgrp">' + CARGOS.map(c =>
      '<div class="mem info"><span class="emo">' + (c.emoji || "👤") + '</span><span class="mtxt"><div class="mn" style="color:' + c.cor + '">' + c.id +
      '</div><div class="ms">' + c.desc + '</div></span></div>').join("") + '</div>';
    const q = $("crgInput").value.trim().toLowerCase();
    const lista = membrosLista().filter(m => !q || m.nome.toLowerCase().includes(q) || m.cargos.some(c => c.toLowerCase().includes(q)));
    $("crgPessoas").innerHTML = lista.length ? '<div class="mgrp">' + lista.map(m => {
      const av = m.foto ? '<img src="' + esc(m.foto) + '" alt="">' : esc(m.nome.charAt(0).toUpperCase());
      return '<button class="mem" data-id="' + m.id + '"><span class="mav">' + av + '</span><span class="mtxt"><div class="mn">' + esc(m.nome) +
        '</div></span><span class="mcar">' + m.cargos.join(", ") + '</span></button>';
    }).join("") + '</div>' : '<p class="mvazio">Nenhum membro encontrado.</p>';
    $("crgPessoas").querySelectorAll("button.mem").forEach(b => b.addEventListener("click", () => escolherCargo(b.dataset.id)));
  }
  let editandoId = null;
  function escolherCargo(id) {
    const m = membrosLista().find(x => x.id === id); if (!m) return;
    editandoId = id; $("cargoT").textContent = "Dar cargos a " + m.nome;
    desenharListaCargo(); abrirSheet("sheetCargo");
  }
  function rawCargos() { return Array.isArray(dados.cargos) ? dados.cargos.slice() : (dados.cargo ? [dados.cargo] : []); }
  function desenharListaCargo() {
    const raw = rawCargos(), outros = raw.filter(x => x !== "Membro");
    $("listaCargo").innerHTML = CARGOS.map(c => {
      const on = c.id === "Membro" ? (raw.includes("Membro") || outros.length === 0) : raw.includes(c.id);
      return '<button data-c="' + c.id + '"><span class="pi" style="font-size:1.3rem">' + (c.emoji || "👤") + '</span>' + c.id +
        '<span class="radio sq' + (on ? " on" : "") + '"></span></button>';
    }).join("");
    $("listaCargo").querySelectorAll("button").forEach(b => b.addEventListener("click", () => alternarCargo(b.dataset.c)));
  }
  function alternarCargo(c) {
    let raw = rawCargos();
    const outros = raw.filter(x => x !== "Membro");
    if (c === "Membro") {
      if (outros.length === 0) return;
      raw = raw.includes("Membro") ? raw.filter(x => x !== "Membro") : raw.concat("Membro");
    } else if (raw.includes(c)) {
      raw = raw.filter(x => x !== c);
    } else {
      raw = raw.filter(x => x !== "Membro").concat(c);
    }
    if (editandoId === "eu") { dados.cargos = raw; gravar(CHAVE_PERFIL, JSON.stringify(dados)); }
    log("Cargos de " + dados.nome + ": " + cargosDe().join(", "));
    pintar(); desenharListaCargo(); renderCargos();
  }
  $("cargoOk").addEventListener("click", () => { fecharSheets(); toast("Cargos: " + cargosDe().join(", ")); });
  $("crgInput").addEventListener("input", renderCargos);
  $("crgFechar").addEventListener("click", () => tela(origemCargos || "config"));
  $("devCargos").addEventListener("click", () => { fecharSheets(); abrirCargos(); });

  // ===== LOGIN / REGISTRO (contas salvas só neste aparelho) =====
  let modoAuth = "entrar";
  function setModoAuth(m) {
    modoAuth = m;
    $("tabEntrar").classList.toggle("on", m === "entrar");
    $("tabCriar").classList.toggle("on", m === "criar");
    document.querySelectorAll(".so-reg").forEach(e => e.classList.toggle("hidden", m !== "criar"));
    $("auOk").textContent = m === "criar" ? "Criar conta" : "Entrar";
    $("auSenha").autocomplete = m === "criar" ? "new-password" : "current-password";
    $("auErro").textContent = "";
  }
  async function hashSenha(sal, senha) {
    const txt = sal + ":" + senha;
    try {
      if (window.crypto && crypto.subtle) {
        const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt));
        return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, "0")).join("");
      }
    } catch (e) {}
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < txt.length; i++) { const c = txt.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return "f" + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }
  async function enviarAuth() {
    const erro = (t) => { $("auErro").textContent = t; };
    const user = $("auUser").value.trim().toLowerCase(), senha = $("auSenha").value;
    erro("");
    if (!user || !senha) return erro("Preencha usuário e senha.");
    const todas = contas();
    if (modoAuth === "entrar") {
      const c = todas[user];
      if (!c || (await hashSenha(c.sal, senha)) !== c.hash) return erro("Usuário ou senha incorretos.");
    } else {
      const nome = $("auNome").value.trim() || user;
      const telefone = $("auTelefone").value.trim();
      if (!/^[a-z0-9._]{2,20}$/.test(user)) return erro("Usuário: 2 a 20 letras minúsculas, números, ponto ou _.");
      if (senha.length < 6) return erro("A senha precisa ter pelo menos 6 caracteres.");
      if (senha !== $("auSenha2").value) return erro("As senhas não são iguais.");
      if (todas[user]) return erro("Esse usuário já existe.");
      const sal = Math.random().toString(36).slice(2) + Date.now().toString(36);
      todas[user] = { sal: sal, hash: await hashSenha(sal, senha) };
      gravar(CHAVE_CONTAS, JSON.stringify(todas));
      gravar("studyrp-perfil-" + user, JSON.stringify({ nome, usuario: user, telefone, desde: new Date().toISOString() }));
    }
    gravar(CHAVE_SESSAO, user);
    location.reload();
  }
  function sair() {
    abrirInfo("Sair da conta", "Você vai voltar para a tela de login.", [
      { txt: "Sair", cls: "danger", fn: () => {
        if (contas()[SESSAO]?.provider !== "google") {
          localStorage.removeItem(CHAVE_SESSAO);
          location.reload();
        } else {
          window.dispatchEvent(new Event("studyrp:signout-request"));
        }
      } },
      { txt: "Cancelar" }
    ]);
  }
  $("tabEntrar").addEventListener("click", () => setModoAuth("entrar"));
  $("tabCriar").addEventListener("click", () => setModoAuth("criar"));
  $("auOk").addEventListener("click", enviarAuth);
  ["auUser", "auNome", "auTelefone", "auSenha", "auSenha2"].forEach(id => $(id).addEventListener("keydown", (e) => { if (e.key === "Enter") enviarAuth(); }));
  window.addEventListener("studyrp:google-user", (event) => {
    const user = event.detail;
    if (!user || !user.uid) return;
    const userKey = "google_" + user.uid;
    if (ler(CHAVE_SESSAO) === userKey) return;
    const todas = contas();
    todas[userKey] = { provider: "google", email: user.email || "", uid: user.uid };
    gravar(CHAVE_CONTAS, JSON.stringify(todas));
    if (!ler("studyrp-perfil-" + userKey)) {
      gravar("studyrp-perfil-" + userKey, JSON.stringify({
        nome: user.displayName || (user.email ? user.email.split("@")[0] : "Estudante"),
        usuario: userKey,
        foto: user.photoURL || "",
        desde: new Date().toISOString()
      }));
    }
    gravar(CHAVE_SESSAO, userKey);
    location.reload();
  });
  window.addEventListener("studyrp:signout-complete", () => {
    try { localStorage.removeItem(CHAVE_SESSAO); } catch (e) {}
    location.reload();
  });

  // botão "voltar" do Android (usado pelo app em APK)
  window.androidBack = function () {
    if (!$("sheetBg").classList.contains("hidden")) { fecharSheets(); return true; }
    switch (telaAtual) {
      case "perfil": if ($("edit").style.display !== "none") modoPerfil(false); else tela("app"); return true;
      case "pessoas": $("pessFechar").click(); return true;
      case "config": tela(origemCfg || "perfil"); return true;
      case "sub": renderConfig(); tela("config"); return true;
      case "qr": fecharQR(); return true;
      case "status": fecharStatus(); return true;
      case "cargos": tela(origemCargos || "config"); return true;
      case "picker": if (ler(CHAVE)) { tela("app"); return true; } return false;
      default: return false;
    }
  };

  // Verifica se existe uma versão mais recente publicada no repositório público.
  const botaoAtualizar = $("updateApp");
  const BUILD_ATUAL = Number(window.STUDYRP_BUILD || 0);
  const URL_APK_ATUAL = "https://github.com/RPYT51/StudyRP-web/releases/latest/download/StudyRP.apk";
  async function verificarAtualizacao() {
    if (!botaoAtualizar || !BUILD_ATUAL) return;
    try {
      const resposta = await fetch("https://api.github.com/repos/RPYT51/StudyRP-web/releases/latest", { cache: "no-store" });
      if (!resposta.ok) return;
      const release = await resposta.json();
      const match = String(release.tag_name || "").match(/^apk-(\d+)$/i);
      const temApk = (release.assets || []).some(a => a.name === "StudyRP.apk");
      if (match && temApk && Number(match[1]) > BUILD_ATUAL) {
        botaoAtualizar.classList.remove("hidden");
        botaoAtualizar.onclick = () => { window.location.href = URL_APK_ATUAL; };
      } else {
        botaoAtualizar.classList.add("hidden");
      }
    } catch (e) {
      // Sem conexão ou limite da API: não exibe um botão que talvez não funcione.
    }
  }
  verificarAtualizacao();
  document.addEventListener("visibilitychange", () => { if (!document.hidden) verificarAtualizacao(); });

  setInterval(verificarExpira, 30000);
  $("sino").addEventListener("click", () => abrirInfo("Notificações", "Nenhuma notificação nova."));
  $("fecharPerfil").addEventListener("click", () => { modoPerfil(false); tela("app"); });
  $("optEstilo").addEventListener("click", () => tela("picker"));

  function atualizarEdicao() {
    $("contBio").textContent = 190 - $("inBio").value.length;
    $("nomePrev").textContent = $("inNome").value || "RPYT";
  }
  function abrirEdicao() {
    pendente = dados.foto;
    $("inNome").value = dados.nome; $("inBio").value = dados.bio;
    pintar(); atualizarEdicao(); modoPerfil(true); aplicarFoto(pendente);
  }
  $("editar").addEventListener("click", abrirEdicao);
  $("bolhaVer").addEventListener("click", () => abrirStatus());
  ["inNome", "inBio"].forEach(id => $(id).addEventListener("input", atualizarEdicao));
  $("limparNome").addEventListener("click", () => { $("inNome").value = ""; atualizarEdicao(); $("inNome").focus(); });
  $("cancelar").addEventListener("click", () => { modoPerfil(false); pintar(); });
  $("salvar").addEventListener("click", () => {
    dados.nome = $("inNome").value.trim() || "RPYT";
    dados.bio = $("inBio").value.trim();
    dados.foto = pendente;
    gravar(CHAVE_PERFIL, JSON.stringify(dados));
    pintar(); modoPerfil(false); toast("Perfil salvo");
  });

  $("rmFoto").addEventListener("click", () => { pendente = ""; aplicarFoto(""); });
  $("arquivoFoto").addEventListener("change", (ev) => {
    const f = ev.target.files[0]; ev.target.value = "";
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      const img = new Image();
      img.onload = () => {
        const T = 256, c = document.createElement("canvas"); c.width = c.height = T;
        const m = Math.min(img.width, img.height);
        c.getContext("2d").drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, T, T);
        pendente = c.toDataURL("image/jpeg", 0.85);
        aplicarFoto(pendente);
      };
      img.onerror = () => toast("Não foi possível abrir essa imagem");
      img.src = rd.result;
    };
    rd.readAsDataURL(f);
  });

  verificarExpira();
  pintar();
  tempoInicio = Math.round(performance.now());
  const salvo = ler(CHAVE);
  if (!SESSAO) tela("auth");
  else if (salvo === "1" || salvo === "2") abrirApp(salvo); else tela("picker");
