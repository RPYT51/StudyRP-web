import {
  collection, deleteDoc, doc, getDocFromServer, getDocsFromServer, getFirestore,
  limit, query, runTransaction, serverTimestamp, setDoc, startAfter, where, writeBatch
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { prepararConvite, sessaoPertenceA } from "./firebase-social.js?v=f87589f95b23";

export function iniciarDev(app, auth) {
  const db = getFirestore(app);
  const hora = 3_600_000;

  async function usuarioDaSessao() {
    await auth.authStateReady();
    const uid = auth.currentUser?.uid;
    if (!sessaoPertenceA(uid)) {
      throw new Error("Entre novamente para acessar o painel.");
    }
    return uid;
  }

  async function obterEstado() {
    const uid = await usuarioDaSessao();
    const sessao = await getDocFromServer(doc(db, "devSessions", uid));
    const inicio = sessao.data()?.startedAt?.toMillis();
    const ate = inicio ? inicio + 6 * hora : 0;
    return { ativo: ate > Date.now(), ate };
  }

  async function ativar(chave) {
    const uid = await usuarioDaSessao();
    const texto = chave.trim().toLowerCase();
    if (!/^[a-f0-9]{48}$/.test(texto)) throw new Error("Chave inválida. Cole a chave de 48 caracteres recebida do administrador.");
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
    const keyId = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
    const batch = writeBatch(db);
    batch.set(doc(db, "devSessions", uid), { keyId, startedAt: serverTimestamp() });
    batch.delete(doc(db, "devKeys", keyId));
    await batch.commit();
    return obterEstado();
  }

  async function desativar() {
    const uid = await usuarioDaSessao();
    await deleteDoc(doc(db, "devSessions", uid));
    return { ativo: false, ate: 0 };
  }

  async function listarTurmas() {
    const uid = await usuarioDaSessao();
    const criadas = query(collection(db, "classes"), where("createdBy", "==", uid), limit(50));
    let pagina = await getDocsFromServer(criadas);
    const turmas = [];
    while (pagina.size > 0) {
      for (const item of pagina.docs) turmas.push({ ...item.data(), id: item.id });
      if (pagina.size < 50) break;
      pagina = await getDocsFromServer(query(criadas, startAfter(pagina.docs.at(-1))));
    }
    return turmas.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }

  async function criarTurma(nome, descricao = "") {
    const uid = await usuarioDaSessao();
    const name = nome.trim(), description = descricao.trim();
    if (!name || name.length > 60 || description.length > 240) throw new Error("Confira o nome e a descrição da turma.");
    const turma = doc(collection(db, "classes"));
    const membership = doc(db, "classMemberships", uid);
    const convite = prepararConvite(db, turma.id, uid);
    const entrou = await runTransaction(db, async tx => {
      const atual = await tx.get(membership);
      tx.set(turma, { name, description, createdBy: uid, createdAt: serverTimestamp() });
      tx.set(doc(turma, "roles", uid), { role: "presidente" });
      tx.set(convite.ref, convite.dados);
      if (!atual.exists()) tx.set(membership, { classId: turma.id, inviteCode: convite.ref.id });
      return !atual.exists();
    });
    return { id: turma.id, name, description, entrou, convite: convite.ref.id };
  }

  async function criarConvite(classId) {
    const uid = await usuarioDaSessao();
    const convite = prepararConvite(db, classId, uid);
    await setDoc(convite.ref, convite.dados);
    return convite.ref.id;
  }

  window.StudyRPDev = { obterEstado, ativar, desativar, listarTurmas, criarTurma, criarConvite };
}
