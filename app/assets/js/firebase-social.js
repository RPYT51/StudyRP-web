import {
  getFirestore, doc, getDoc, collection, getDocs, setDoc, addDoc,
  query, orderBy, limit, serverTimestamp, Timestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

export function iniciarSocial(app, auth) {
  const db = getFirestore(app);

  async function usuario() {
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user || localStorage.getItem("studyrp-sessao") !== "google_" + user.uid) throw new Error("Entre com Google para usar os recursos compartilhados.");
    const profile = await getDoc(doc(db, "profiles", user.uid));
    if (!profile.exists()) throw new Error("Complete seu cadastro na nuvem primeiro.");
    return { uid: user.uid, username: profile.data().usuario };
  }

  async function turma(uid) {
    const membership = await getDoc(doc(db, "classMemberships", uid));
    return membership.exists() ? membership.data().classId : null;
  }

  async function turmaAtual() {
    const user = await usuario();
    const classId = await turma(user.uid);
    if (!classId) throw new Error("Entre em uma turma primeiro.");
    return { ...user, classId };
  }

  async function listar(ref, campo, ordem = "asc") {
    const snap = await getDocs(query(ref, orderBy(campo, ordem), limit(50)));
    return snap.docs.map(item => ({ ...item.data(), id: item.id }));
  }

  async function podeConvidar(uid, classId) {
    const [global, local] = await Promise.all([
      getDoc(doc(db, "systemRoles", uid)), getDoc(doc(db, "classes", classId, "roles", uid))
    ]);
    const role = global.data();
    return local.data()?.role === "presidente" || role?.role === "dono" ||
      (role?.role === "dev" && role.expiresAt?.toMillis() > Date.now());
  }

  window.StudyRPSocial = {
    async listarAmigos() {
      const { uid } = await usuario();
      return listar(collection(db, "social", uid, "friends"), "username");
    },
    async adicionarAmigo(nome) {
      const { uid } = await usuario();
      const found = await getDoc(doc(db, "usernames", nome));
      if (!found.exists()) throw new Error("Nome de usuário não encontrado.");
      const friendUid = found.data().uid;
      if (friendUid === uid) throw new Error("Selecione outra conta.");
      await setDoc(doc(db, "social", uid, "friends", friendUid), { username: nome });
    },
    async obterTurma() {
      const { uid } = await usuario();
      const classId = await turma(uid);
      if (!classId) return null;
      const info = await getDoc(doc(db, "classes", classId));
      if (!info.exists()) throw new Error("A turma não está disponível.");
      return { ...info.data(), id: classId, podeConvidar: await podeConvidar(uid, classId) };
    },
    async entrarTurma(code) {
      const { uid } = await usuario();
      const invite = await getDoc(doc(db, "classInvites", code));
      if (!invite.exists() || invite.data().expiresAt.toMillis() <= Date.now()) throw new Error("Convite inválido ou expirado.");
      await setDoc(doc(db, "classMemberships", uid), { classId: invite.data().classId, inviteCode: code });
    },
    async criarConvite() {
      const { uid, classId } = await turmaAtual();
      if (!await podeConvidar(uid, classId)) throw new Error("Sua conta não pode gerar convites nesta turma.");
      const code = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, "0")).join("");
      await setDoc(doc(db, "classInvites", code), {
        classId, createdBy: uid, expiresAt: Timestamp.fromMillis(Date.now() + 23 * 60 * 60 * 1000)
      });
      return code;
    },
    async listarAtividades() {
      const { classId } = await turmaAtual();
      return listar(collection(db, "classes", classId, "activities"), "title");
    },
    async listarChats() {
      const { classId } = await turmaAtual();
      return listar(collection(db, "classes", classId, "chats"), "title");
    },
    async criarChat(title) {
      const { classId, uid } = await turmaAtual();
      await addDoc(collection(db, "classes", classId, "chats"), { title, createdBy: uid });
    },
    async listarMensagens(chatId) {
      const { classId } = await turmaAtual();
      const rows = await listar(collection(db, "classes", classId, "chats", chatId, "messages"), "createdAt", "desc");
      return rows.reverse();
    },
    async enviarMensagem(chatId, text) {
      const { classId, uid, username } = await turmaAtual();
      const message = doc(collection(db, "classes", classId, "chats", chatId, "messages"));
      const batch = writeBatch(db);
      batch.set(doc(db, "classes", classId, "messageLimits", uid), {
        chatId, messageId: message.id, lastSentAt: serverTimestamp()
      });
      batch.set(message, { text, uid, username, createdAt: serverTimestamp() });
      await batch.commit();
    }
  };
}
