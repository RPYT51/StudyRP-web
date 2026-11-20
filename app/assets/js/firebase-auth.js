import { iniciarDev } from "./firebase-dev.js?v=22077066629d";
import { iniciarSocial } from "./firebase-social.js?v=22077066629d";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-check.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signInWithRedirect,
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
const auth = getAuth(app);
iniciarSocial(app, auth);
iniciarDev(app, auth);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

let confirmarGoogleNativo = null;
window.StudyRPAndroidGoogleResult = async (idToken) => {
  try {
    if (!idToken || typeof idToken !== "string") throw new Error("Token Google inválido.");
    const credential = GoogleAuthProvider.credential(idToken);
    if (confirmarGoogleNativo) {
      confirmarGoogleNativo.resolve(credential);
      confirmarGoogleNativo = null;
      return;
    }
    const resultado = await signInWithCredential(auth, credential);
    enviarUsuario(resultado.user);
  } catch (error) {
    console.error("StudyRP Android Google Auth:", error);
    mostrarErro("Não foi possível entrar com Google no APK. Tente novamente.");
    const button = document.getElementById("auGoogle");
    if (button) button.disabled = false;
  }
};

window.StudyRPAndroidGoogleError = (message) => {
  if (confirmarGoogleNativo) {
    confirmarGoogleNativo.reject(new Error("A confirmação da conta foi cancelada."));
    confirmarGoogleNativo = null;
    return;
  }
  mostrarErro(message === "cancelled" ? "Login cancelado." : "Não foi possível abrir o login Google no APK.");
  const button = document.getElementById("auGoogle");
  if (button) button.disabled = false;
};

function mostrarErro(message) {
  const erro = document.getElementById("auErro");
  if (erro) erro.textContent = message;
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

window.StudyRPCloud = {
  getProfile: obterPerfil,
  saveProfile: salvarPerfil,
  entrarComGoogle,
  sair: () => signOut(auth)
};

window.StudyRPGoogle = {
  async excluirConta(uid) {
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user || user.uid !== uid) throw new Error("Entre novamente com a sua conta Google.");
    try {
      if (window.StudyRPAndroid?.signInGoogle) {
        const credential = await new Promise((resolve, reject) => {
          confirmarGoogleNativo = { resolve, reject };
          window.StudyRPAndroid.signInGoogle();
        });
        await reauthenticateWithCredential(user, credential);
      } else {
        await reauthenticateWithPopup(user, provider);
      }
    } catch (erro) {
      confirmarGoogleNativo = null;
      throw new Error(erro.code === "auth/user-mismatch" ? "Selecione a mesma conta Google usada no StudyRP." : "Não foi possível confirmar sua identidade com o Google.");
    }
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
};

function enviarUsuario(user) {
  if (!user) return;
  window.dispatchEvent(new CustomEvent("studyrp:google-user", {
    detail: {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    }
  }));
}

async function entrarComGoogle() {
  const button = document.getElementById("auGoogle");
  button.disabled = true;
  mostrarErro("");
  if (window.StudyRPAndroid && typeof window.StudyRPAndroid.signInGoogle === "function") {
    try {
      window.StudyRPAndroid.signInGoogle();
    } catch (error) {
      mostrarErro("Não foi possível iniciar o Google no APK. Tente novamente.");
      button.disabled = false;
    }
    return;
  }
  try {
    const resultado = await signInWithPopup(auth, provider);
    enviarUsuario(resultado.user);
  } catch (error) {
    if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
      mostrarErro("Login cancelado.");
    } else if (error.code === "auth/popup-blocked") {
      try {
        await signInWithRedirect(auth, provider);
        return;
      } catch (redirectError) {
        mostrarErro("Não foi possível abrir o Google. Tente novamente.");
      }
    } else if (error.code === "auth/unauthorized-domain") {
      mostrarErro("O login com o Google está disponível na prévia oficial do StudyRP.");
    } else if (error.code === "auth/operation-not-allowed") {
      mostrarErro("O login com o Google está desativado neste projeto.");
    } else {
      mostrarErro("Erro ao entrar com Google. Verifique sua conexão e tente novamente.");
      console.error("StudyRP Google Auth:", error);
    }
  } finally {
    button.disabled = false;
  }
}

document.getElementById("auGoogle")?.addEventListener("click", entrarComGoogle);

window.addEventListener("studyrp:signout-request", async () => {
  try {
    await signOut(auth);
    window.dispatchEvent(new Event("studyrp:signout-complete"));
  } catch (error) {
    console.error("StudyRP sign out:", error);
    window.dispatchEvent(new Event("studyrp:signout-error"));
  }
});

getRedirectResult(auth).catch((error) => {
  console.error("StudyRP Google redirect:", error);
  mostrarErro("Não foi possível concluir o login com Google. Tente novamente.");
});

onAuthStateChanged(auth, (user) => {
  if (user) enviarUsuario(user);
  else window.dispatchEvent(new Event("studyrp:google-signed-out"));
});
