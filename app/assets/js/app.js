

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
  const KEY_DEV = "rpyt-dev"; // KEY para ativar o cargo DEV (troque aqui; fica visível no código)
  const DEV_MS = 6 * 36e5;    // DEV dura 6 horas
  const VERSAO = "0.1";
  const logs = [];
  function log(msg) { logs.unshift(hhmm(new Date()) + "  " + msg); if (logs.length > 60) logs.pop(); }
  function devAtivo() { return dados.devAte && dados.devAte > Date.now(); }
  const CARGOS = [
    { id: "Dono", emoji: "👑", cor: "var(--gold)", desc: "Administração geral" },
    { id: "Presidente", emoji: "⭐", cor: "#b98cff", desc: "Responsável pela própria sala" },
    { id: "Ajudantes", emoji: "🛡️", cor: "#4cd48b", desc: "Auxílio na moderação" },
    { id: "Membro", emoji: "", cor: "var(--text)", desc: "Usuário comum" }
  ];
  function cargosDe() {
    let raw = Array.isArray(dados.cargos) ? dados.cargos : (dados.cargo ? [dados.cargo] : ["Membro"]);
    const l = CARGOS.map(c => c.id).filter(id => raw.includes(id));
    return l.length ? l : ["Membro"];
  }
  function cargo() { return cargosDe()[0]; } // cargo mais alto

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
    const em = () => toast("Em breve");
    const A = {
      "Conta": () => abrirConta(), "Apps conectados": abrirApps, "Escanear o código QR": abrirQR, "Aparência": abrirAparencia,
      "Informações do dispositivo": abrirDispositivo, "Informações do cliente": abrirCliente, "Registros": abrirRegistros, "Ações de cache": abrirCache,
      "Cargos": () => abrirCargos(), "Versão do App": () => toast("StudyRP " + VERSAO), "Sair": sair
    };
    const s = [
      { t: "Configurações de conta", itens: [
        { i: "conta", l: "Conta" }, { i: "disp", l: "Dispositivos" }, { i: "apps", l: "Apps conectados" }, { i: "qr", l: "Escanear o código QR" } ] },
      { t: "Config. do aplicativo", itens: [
        { i: "aparencia", l: "Aparência", v: "Estilo " + app.dataset.estilo },
        { i: "acess", l: "Acessibilidade" }, { i: "idioma", l: "Idioma", v: "Português, Brasil" },
        { i: "chat", l: "Bate-papo" }, { i: "sino", l: "Notificações" } ] },
      { t: "Novidades", itens: [ { i: "info", l: "Novidades" } ] },
      { t: "", itens: [ { i: "sair", l: "Sair", red: true } ] }
    ];
    if (devAtivo()) s.push({ t: "Configurações do desenvolvedor", itens: [
      { i: "cargos", l: "Cargos" },
      { i: "ver", l: "Versão do App", v: "StudyRP " + VERSAO, semSeta: true },
      { i: "phone", l: "Informações do dispositivo", v: (navigator.platform || "-") + " " + window.innerWidth + "x" + window.innerHeight, semSeta: true },
      { i: "clip", l: "Informações do cliente" }, { i: "log", l: "Registros" }, { i: "cache", l: "Ações de cache" } ] });
    s.forEach(sec => sec.itens.forEach(it => { it.a = A[it.l] || em; }));
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
    if (devAtivo()) {
      dados.devAte = 0; gravar(CHAVE_PERFIL, JSON.stringify(dados)); log("DEV desativado");
      fecharSheets(); pintar(); if (telaAtual === "cargos") tela("perfil"); if (telaAtual === "config") renderConfig(); toast("DEV desativado"); return;
    }
    if ($("inKey").value.trim().toLowerCase() === KEY_DEV.toLowerCase()) {
      dados.devAte = Date.now() + DEV_MS; gravar(CHAVE_PERFIL, JSON.stringify(dados)); log("DEV ativado por 6 horas");
      fecharSheets(); pintar(); if (telaAtual === "config") renderConfig(); toast("DEV ativado por 6 horas");
    } else {
      log("KEY inválida"); $("devErro").textContent = "KEY inválida.";
    }
  }
  $("optDev").addEventListener("click", abrirDev);
  $("devOk").addEventListener("click", confirmarDev);
  $("inKey").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarDev(); });

  // ===== PESSOAS =====
  const ORDEM = CARGOS.map(c => c.id);
  const EMOJI = Object.fromEntries(CARGOS.map(c => [c.id, c.emoji]));
  const COR_CARGO = Object.fromEntries(CARGOS.map(c => [c.id, c.cor]));
  const esc = (t) => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function linhaMembro(m, off) {
    const av = m.foto ? '<img src="' + m.foto + '" alt="">' : esc(m.nome.charAt(0).toUpperCase());
    const dot = off ? "" : '<i style="--cor:' + (PRES[m.pres] || PRES.online).cor + '"></i>';
    return '<button class="mem' + (off ? " off" : "") + '" data-self="' + (m.self ? 1 : 0) + '">' +
      '<span class="mav">' + av + dot + '</span>' +
      '<span class="mtxt"><div class="mn" style="' + (off ? "" : "color:" + COR_CARGO[m.cargo]) + '">' + esc(m.nome) + '</div>' +
      (m.status && !off ? '<div class="ms">' + esc(m.status) + '</div>' : '') + '</span></button>';
  }

  function renderPessoas() {
    const q = $("pessInput").value.trim().toLowerCase();
    const todos = [{ nome: dados.nome, cargo: cargo(), cargos: cargosDe(), pres: dados.presenca, status: dados.status, foto: dados.foto, self: true }];
    const membros = todos.filter(m => !q || m.nome.toLowerCase().includes(q) || m.cargos.some(c => c.toLowerCase().includes(q)));
    const on = membros.filter(m => m.pres !== "invisivel"), off = membros.filter(m => m.pres === "invisivel");
    let h = "";
    ORDEM.forEach(c => {
      const g = on.filter(m => m.cargo === c);
      if (g.length) h += '<div class="mlabel">' + (EMOJI[c] ? EMOJI[c] + " " : "") + c + " — " + g.length + '</div><div class="mgrp">' + g.map(m => linhaMembro(m, false)).join("") + '</div>';
    });
    if (off.length) h += '<div class="mlabel">Offline — ' + off.length + '</div><div class="mgrp">' + off.map(m => linhaMembro(m, true)).join("") + '</div>';
    if (!membros.length) h += '<p class="mvazio">Nenhum membro encontrado.</p>';
    else if (todos.length === 1 && !q) h += '<p class="mvazio">Mais pessoas vão aparecer aqui quando entrarem.</p>';
    $("pessCorpo").innerHTML = h;
    $("pessCorpo").querySelectorAll(".mem").forEach(b => b.addEventListener("click", () => {
      if (b.dataset.self === "1") { pintar(); modoPerfil(false); tela("perfil"); }
    }));
  }
  $("btnPessoas").addEventListener("click", () => { renderPessoas(); tela("pessoas"); });
  $("pessFechar").addEventListener("click", () => { $("pessInput").value = ""; $("pessBuscaBox").classList.add("hidden"); tela("app"); });
  $("pessBusca").addEventListener("click", () => {
    const box = $("pessBuscaBox"), abrir = box.classList.contains("hidden");
    box.classList.toggle("hidden", !abrir);
    if (abrir) $("pessInput").focus(); else { $("pessInput").value = ""; renderPessoas(); }
  });
  $("pessInput").addEventListener("input", renderPessoas);

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
      { ic: "cachesave", l: "Gravar cache", a: () => { try { localStorage.setItem("studyrp-cache", JSON.stringify({ t: Date.now(), dados })); } catch (e) {} log("Cache gravado"); toast("Cache gravado"); } },
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
  function editarCampo(titulo, valor, max, aplicar) {
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

  function abrirConta(semTrocarTela) {
    $("subCorpo").innerHTML =
      '<div class="glabel">Informações de conta</div><div class="grp plain">' +
        linhaSimples("user", "Nome de usuário", usuarioAtual()) + linhaSimples("nome", "Nome exibido", dados.nome) + '</div>' +
      '<div class="glabel">Segurança</div><div class="grp plain">' + linhaSimples("senha", "Senha") + '</div>' +
      '<div class="glabel">Gerenciamento da conta</div><div class="grp plain">' +
        linhaSimples("desativar", "Desativar conta") + linhaSimples("excluir", "Excluir conta", "", true) + '</div>';
    const em = () => toast("Em breve");
    ligarLinhas({
      user: () => editarCampo("Nome de usuário", usuarioAtual(), 20, (v) => {
        v = v.toLowerCase(); if (!/^[a-z0-9._]{2,20}$/.test(v)) return "Use 2 a 20 letras minúsculas, números, ponto ou _.";
        dados.usuario = v; return null;
      }),
      nome: () => editarCampo("Nome exibido", dados.nome, 24, (v) => { if (!v) return "O nome não pode ficar vazio."; dados.nome = v; return null; }),
      senha: em, desativar: em, excluir: em
    });
    if (!semTrocarTela) abrirSub("Conta"); else $("subT").textContent = "Conta";
  }

  function abrirApps() {
    $("subCorpo").innerHTML =
      '<div class="subhead"><b>Conexões</b><button class="linkbtn" id="addCon">Adicionar</button></div>' +
      '<p class="subdesc">Estas são contas de outras plataformas. Conectá-las aqui pode liberar novos recursos no StudyRP.</p>' +
      '<p class="mvazio">Nenhuma conexão ainda.</p>';
    $("addCon").addEventListener("click", () => toast("Em breve"));
    abrirSub("Apps conectados");
  }

  function aplicarZoom() {
    const z = Math.min(130, Math.max(80, +dados.zoom || 100));
    document.documentElement.style.fontSize = (16 * z / 100 * (dados.textoMenor ? 0.92 : 1)) + "px";
  }
  function abrirAparencia() {
    $("subCorpo").innerHTML =
      '<div class="glabel">Tema</div><div class="grp plain">' + linhaSimples("estilo", "Estilo da tela inicial", "Estilo " + app.dataset.estilo) + '</div>' +
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
    mostrar(); abrirSub("Aparência");
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
      const av = m.foto ? '<img src="' + m.foto + '" alt="">' : esc(m.nome.charAt(0).toUpperCase());
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
      const nome = $("auNome").value.trim();
      if (!nome) return erro("Digite um nome exibido.");
      if (!/^[a-z0-9._]{2,20}$/.test(user)) return erro("Usuário: 2 a 20 letras minúsculas, números, ponto ou _.");
      if (senha.length < 6) return erro("A senha precisa ter pelo menos 6 caracteres.");
      if (senha !== $("auSenha2").value) return erro("As senhas não são iguais.");
      if (todas[user]) return erro("Esse usuário já existe.");
      const sal = Math.random().toString(36).slice(2) + Date.now().toString(36);
      todas[user] = { sal: sal, hash: await hashSenha(sal, senha) };
      gravar(CHAVE_CONTAS, JSON.stringify(todas));
      gravar("studyrp-perfil-" + user, JSON.stringify({ nome: nome, usuario: user, desde: new Date().toISOString() }));
    }
    gravar(CHAVE_SESSAO, user);
    location.reload();
  }
  function sair() {
    abrirInfo("Sair da conta", "Você vai voltar para a tela de login.", [
      { txt: "Sair", cls: "danger", fn: () => { window.dispatchEvent(new Event("studyrp:signout-request")); } },
      { txt: "Cancelar" }
    ]);
  }
  $("tabEntrar").addEventListener("click", () => setModoAuth("entrar"));
  $("tabCriar").addEventListener("click", () => setModoAuth("criar"));
  $("auOk").addEventListener("click", enviarAuth);
  ["auNome", "auUser", "auSenha", "auSenha2"].forEach(id => $(id).addEventListener("keydown", (e) => { if (e.key === "Enter") enviarAuth(); }));
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
  const URL_APK_ATUAL = "https://github.com/RPYT51/StudyRP-download/releases/latest/download/StudyRP.apk";
  async function verificarAtualizacao() {
    if (!botaoAtualizar) return;
    try {
      const resposta = await fetch("https://api.github.com/repos/RPYT51/StudyRP-download/releases/latest", { cache: "no-store" });
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
  $("sino").addEventListener("click", () => toast("Nenhuma notificação nova"));
  $("fecharPerfil").addEventListener("click", () => { modoPerfil(false); tela("app"); });
  $("optEstilo").addEventListener("click", () => tela("picker"));
  $("amigos").addEventListener("click", () => toast("Amigos em breve"));

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
