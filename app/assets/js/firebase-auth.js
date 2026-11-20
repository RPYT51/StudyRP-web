import { iniciarSocial } from "./firebase-social.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  reauthenticateWithPopup,
  deleteUser,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC7wOlIQb3PWBib60US2jSi7CVV26He780",
  authDomain: "studyrpyt51.firebaseapp.com",
  projectId: "studyrpyt51",
  storageBucket: "studyrpyt51.firebasestorage.app",
  messagingSenderId: "688043900822",
  appId: "1:688043900822:web:88fd9967d7484b538e67b7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
iniciarSocial(app, auth);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

window.StudyRPGoogle = {
  async excluirConta(uid) {
    const user = auth.currentUser;
    if (!user || user.uid !== uid) throw new Error("Entre novamente com sua conta Google para excluí-la.");
    try {
      await reauthenticateWithPopup(user, provider);
      await deleteUser(user);
    } catch (error) {
      if (error.code === "auth/user-mismatch") throw new Error("Selecione a mesma conta Google usada no StudyRP.");
      throw new Error("Não foi possível confirmar a exclusão pelo Google. Tente novamente.");
    }
  }
};

function mostrarErro(message) {
  const erro = document.getElementById("auErro");
  if (erro) erro.textContent = message;
}

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

document.getElementById("auGoogle")?.addEventListener("click", async () => {
  const button = document.getElementById("auGoogle");
  button.disabled = true;
  mostrarErro("");
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
      try {
        await signInWithRedirect(auth, provider);
        return;
      } catch (redirectError) {
        mostrarErro("Não foi possível abrir o Google. Tente novamente.");
      }
    } else if (error.code === "auth/unauthorized-domain") {
      mostrarErro("Domínio não autorizado no Firebase. Adicione rpyt51.github.io em Authentication > Settings > Authorized domains.");
    } else if (error.code === "auth/operation-not-allowed") {
      mostrarErro("Ative o provedor Google em Firebase Authentication > Sign-in method.");
    } else {
      mostrarErro("Erro ao entrar com Google. Verifique sua conexão e tente novamente.");
      console.error("StudyRP Google Auth:", error);
    }
  } finally {
    button.disabled = false;
  }
});

window.addEventListener("studyrp:signout-request", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("StudyRP sign out:", error);
  }
  window.dispatchEvent(new Event("studyrp:signout-complete"));
});

getRedirectResult(auth).then((result) => {
  if (result?.user) enviarUsuario(result.user);
}).catch((error) => {
  console.error("StudyRP Google redirect:", error);
  mostrarErro("Não foi possível concluir o login com Google. Tente novamente.");
});

onAuthStateChanged(auth, (user) => {
  if (user) enviarUsuario(user);
});
