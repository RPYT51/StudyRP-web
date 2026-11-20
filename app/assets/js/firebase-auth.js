import { iniciarDev } from "./firebase-dev.js?v=f87589f95b23";
import { iniciarSocial } from "./firebase-social.js?v=f87589f95b23";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-check.js";
import {
  getAuth, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  OAuthProvider, EmailAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendEmailVerification, reload, getIdToken, getIdTokenResult, updatePassword,
  getRedirectResult,
  onAuthStateChanged,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  deleteUser,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, doc, getDocFromServer, getDocsFromServer, limit, query, runTransaction, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC7wOlIQb3PWBib60US2jSi7CVV26He780",
  authDomain: "studyrpyt51.firebaseapp.com",
  projectId: "studyrpyt51",
  storageBucket: "studyrpyt51.firebasestorage.app",
  messagingSenderId: "688043900822",
  appId: "1:688043900822:web:88fd9967d7484b538e67b7"
};

const app = initializeApp(firebaseConfig);
const appCheckSiteKey = document.querySelector('meta[name="firebase-app-check-site-key"]')?.content?.trim();
if (appCheckSiteKey && !window.StudyRPAndroid) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true
    });
  } catch (error) {
    console.error("StudyRP App Check:", error);
  }
}
const clienteInstalado = Boolean(window.StudyRPAndroid) || location.protocol === "studyrp:";
const auth = clienteInstalado
  ? initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] })
  : getAuth(app);
iniciarSocial(app, auth);
iniciarDev(app, auth);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

auth.languageCode = "pt-BR";
let solicitacaoNativa = null;
let criandoConta = false;

function mensagemAuth(erro) {
  const mensagens = {
    "auth/invalid-email": "Confira o endereço de e-mail.",
    "auth/email-already-in-use": "Esse e-mail já tem uma conta. Entre com o método usado no cadastro.",
    "auth/invalid-credential": "Confira seu e-mail e sua senha.",
    "auth/user-not-found": "Confira seu e-mail e sua senha.",
    "auth/wrong-password": "A senha informada está incorreta.",
    "auth/weak-password": "Escolha uma senha com pelo menos seis caracteres.",
    "auth/too-many-requests": "Aguarde alguns minutos antes de tentar novamente.",
    "auth/missing-or-invalid-nonce": "O Google não conseguiu confirmar esta tentativa. Abra o seletor de contas e tente novamente.",
    "auth/network-request-failed": "Verifique sua conexão e tente novamente.",
    "auth/user-disabled": "O acesso desta conta foi desativado.",
    "auth/operation-not-allowed": "Este método de login está desativado no Firebase do StudyRP.",
    "auth/popup-blocked": "Permita a janela do Google neste site e toque novamente em Continuar com o Google.",
    "auth/popup-closed-by-user": "Login cancelado. Você pode tentar novamente.",
    "auth/cancelled-popup-request": "Login cancelado.",
    "auth/unauthorized-domain": "Abra a prévia oficial do StudyRP para entrar com o Google.",
    "auth/account-exists-with-different-credential": "Esse e-mail já tem uma conta. Entre com o método usado no cadastro.",
    "auth/user-mismatch": "Confirme a mesma conta que está aberta no StudyRP.",
    "auth/requires-recent-login": "Entre novamente para confirmar sua identidade."
  };
  return mensagens[erro?.code] || (erro?.code ? "O serviço de login não conseguiu concluir. Tente novamente." : erro?.message) || "Tente novamente.";
}

function mostrarErro(message) {
  document.getElementById("auErro").textContent = message;
}

function pedirCredencialAndroid() {
  if (solicitacaoNativa) return Promise.reject(new Error("O seletor de contas já está aberto."));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => concluir(new Error("O seletor de contas demorou para responder. Tente novamente.")), 120000);
    function concluir(erro, credencial) {
      clearTimeout(timer);
      solicitacaoNativa = null;
      if (erro) reject(erro); else resolve(credencial);
    }
    solicitacaoNativa = concluir;
    try { window.StudyRPAndroid.signInGoogle(); }
    catch { concluir(new Error("Não foi possível abrir o seletor de contas do Android.")); }
  });
}

window.StudyRPAndroidGoogleResult = (idToken, rawNonce) => {
  if (!solicitacaoNativa) return;
  try {
    if (typeof idToken !== "string" || !idToken) throw new Error("O Google não confirmou a conta selecionada.");
    const credencial = rawNonce
      ? new OAuthProvider("google.com").credential({ idToken, rawNonce })
      : GoogleAuthProvider.credential(idToken);
    solicitacaoNativa(null, credencial);
  } catch (erro) { solicitacaoNativa(erro); }
};

window.StudyRPAndroidGoogleError = codigo => {
  const mensagens = {
    cancelled: "Seleção de conta cancelada.",
    no_account: "Adicione uma conta Google ao Android e tente novamente.",
    provider: "Atualize o Google Play Services neste aparelho e tente novamente.",
    configuration: "O Google não reconheceu a assinatura deste APK. Você também pode entrar com e-mail e senha."
  };
  solicitacaoNativa?.(new Error(mensagens[codigo] || "Não foi possível confirmar sua conta pelo Android. Tente novamente."));
};

function usuarioAtual(uid) {
  const user = auth.currentUser;
  if (!user || user.uid !== uid) throw new Error("Entre novamente para continuar.");
  return user;
}

function validarPerfilEntrada(uid, perfil) {
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    throw new Error("Sessão inválida. Entre novamente.");
  }
  if (!perfil || typeof perfil !== "object") throw new Error("Dados de perfil inválidos.");
  const usuario = String(perfil.usuario || "").trim().toLowerCase();
  const nome = String(perfil.nomeExibido || "").trim();
  const telefone = String(perfil.telefone || "").trim();
  const email = auth.currentUser.email || "";
  const foto = String(perfil.foto || "").trim();
  if (!/^[a-z0-9._]{2,20}$/.test(usuario)) throw new Error("Nome de usuário inválido.");
  if (nome.length > 24 || telefone.length > 20 || email.length > 254 || foto.length > 2048) {
    throw new Error("Um dos campos ultrapassou o limite permitido.");
  }
  if (foto && !/^https:\/\//i.test(foto)) throw new Error("Endereço de foto inválido.");
  return { usuario, nome: nome || usuario, telefone, email, foto };
}

async function obterPerfil(uid) {
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    throw new Error("Você só pode acessar o seu próprio perfil.");
  }
  const snap = await getDocFromServer(doc(db, "profiles", uid));
  return snap.exists() ? snap.data() : null;
}

async function salvarPerfil(uid, perfil) {
  const seguro = validarPerfilEntrada(uid, perfil);
  const { usuario } = seguro;
  const profileRef = doc(db, "profiles", uid);
  const usernameRef = doc(db, "usernames", usuario);
  await runTransaction(db, async (tx) => {
    const [profileSnap, usernameSnap] = await Promise.all([
      tx.get(profileRef),
      tx.get(usernameRef)
    ]);
    let antigoRef = null;
    if (profileSnap.exists()) {
      const antigo = profileSnap.data().usuario;
      if (antigo && antigo !== usuario) {
        antigoRef = doc(db, "usernames", antigo);
        const antigoSnap = await tx.get(antigoRef);
        if (!antigoSnap.exists() || antigoSnap.data().uid !== uid) {
          antigoRef = null;
        }
      }
    }
    if (usernameSnap.exists() && usernameSnap.data().uid !== uid) {
      throw new Error("Esse nome de usuário já está em uso.");
    }
    if (!usernameSnap.exists()) tx.set(usernameRef, { uid, criadoEm: serverTimestamp() });
    tx.set(profileRef, {
      uid,
      usuario,
      nome: seguro.nome,
      telefone: seguro.telefone,
      email: seguro.email,
      foto: seguro.foto,
      atualizadoEm: serverTimestamp()
    });
    if (antigoRef) tx.delete(antigoRef);
  });
  return { uid, ...seguro };
}

async function criarConta(email, senha, guardarPerfil) {
  criandoConta = true;
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, senha);
    guardarPerfil(user.uid);
    // O cadastro já existe mesmo se o primeiro e-mail não puder ser enviado.
    try { await sendEmailVerification(user); }
    catch (erro) { return { aviso: mensagemAuth(erro) }; }
    return {};
  } finally {
    criandoConta = false;
    if (auth.currentUser) await enviarUsuario(auth.currentUser);
  }
}

async function confirmarEmail(uid) {
  const user = usuarioAtual(uid);
  await reload(user);
  if (!user.emailVerified) throw new Error("A confirmação ainda não chegou. Abra o link enviado ao seu e-mail e tente novamente.");
  await getIdToken(user, true);
  await enviarUsuario(user);
}

async function confirmarSenha(uid, senha) {
  const user = usuarioAtual(uid);
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, senha));
  return user;
}

async function excluirConta(uid, senha) {
  await auth.authStateReady();
  const user = usuarioAtual(uid);
  try {
    if (typeof senha === "string") await confirmarSenha(uid, senha);
    else if (window.StudyRPAndroid?.signInGoogle) await reauthenticateWithCredential(user, await pedirCredencialAndroid());
    else await reauthenticateWithPopup(user, provider);
  } catch (erro) { throw new Error(mensagemAuth(erro)); }
  const perfil = doc(db, "profiles", uid);
  if ((await getDocFromServer(perfil)).exists()) {
    const amigos = query(collection(db, "social", uid, "friends"), limit(50));
    let pagina = await getDocsFromServer(amigos);
    while (!pagina.empty) {
      const batch = writeBatch(db);
      for (const amigo of pagina.docs) batch.delete(amigo.ref);
      await batch.commit();
      pagina = await getDocsFromServer(amigos);
    }
  }
  await runTransaction(db, async tx => {
    const registro = await tx.get(perfil);
    if (registro.exists()) {
      tx.delete(doc(db, "usernames", registro.data().usuario));
      tx.delete(perfil);
    }
    tx.delete(doc(db, "classMemberships", uid));
    tx.delete(doc(db, "devSessions", uid));
  });
  await deleteUser(user);
}

window.StudyRPCloud = {
  getProfile: obterPerfil,
  saveProfile: salvarPerfil,
  criarConta,
  entrarComSenha: (email, senha) => signInWithEmailAndPassword(auth, email, senha),
  confirmarEmail,
  reenviarEmail: uid => sendEmailVerification(usuarioAtual(uid)),
  alterarSenha: async (uid, atual, nova) => updatePassword(await confirmarSenha(uid, atual), nova),
  excluirConta,
  entrarComGoogle,
  mensagemAuth,
  sair: () => signOut(auth)
};

async function enviarUsuario(user) {
  if (!user || criandoConta) return;
  let provedor = user.providerData[0]?.providerId;
  try { provedor = (await getIdTokenResult(user)).signInProvider || provedor; } catch {}
  if (auth.currentUser?.uid !== user.uid || criandoConta) return;
  window.dispatchEvent(new CustomEvent("studyrp:usuario", {
    detail: {
      uid: user.uid, email: user.email, emailVerified: user.emailVerified,
      provider: provedor === "password" ? "password" : "google",
      displayName: user.displayName, photoURL: user.photoURL
    }
  }));
}

async function entrarComGoogle() {
  const button = document.getElementById("auGoogle");
  if (!button || button.disabled) return;
  button.disabled = true;
  mostrarErro("");
  try {
    if (window.StudyRPAndroid?.signInGoogle) await signInWithCredential(auth, await pedirCredencialAndroid());
    else await signInWithPopup(auth, provider);
  } catch (erro) {
    mostrarErro(erro.code === "auth/invalid-credential" ? "O Google recusou a credencial. Escolha novamente a sua conta." : mensagemAuth(erro));
  }
  finally { button.disabled = false; }
}

document.getElementById("auGoogle")?.addEventListener("click", entrarComGoogle);
window.addEventListener("studyrp:signout-request", async () => {
  try {
    await signOut(auth);
    window.dispatchEvent(new Event("studyrp:signout-complete"));
  } catch { window.dispatchEvent(new Event("studyrp:signout-error")); }
});

// Ainda consome um retorno iniciado por uma versão anterior da prévia Web.
if (!clienteInstalado) {
  getRedirectResult(auth).catch(erro => mostrarErro(mensagemAuth(erro)));
}
onAuthStateChanged(auth, user => {
  if (user) enviarUsuario(user);
  else window.dispatchEvent(new Event("studyrp:sem-usuario"));
});
