(() => {
  const key = "studyrp-dev-preview";
  const digest = "14b5f60b34bcdebaa43fce51a6e30f28d8c0130151fd8948a67e8f04fdb16fee";

  function allowed() {
    try {
      return sessionStorage.getItem(key) === digest;
    } catch {
      return false;
    }
  }

  async function unlock(code) {
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code.trim()));
    const hash = Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
    if (hash !== digest) return false;
    sessionStorage.setItem(key, digest);
    return true;
  }

  window.StudyRPPreview = { allowed, unlock, lock: () => sessionStorage.removeItem(key) };
  if (document.currentScript.hasAttribute("data-app-gate")) {
    if (allowed()) document.documentElement.removeAttribute("data-preview-locked");
    else location.replace(new URL("../dev/", location.href));
    window.addEventListener("pageshow", () => {
      if (!allowed()) {
        document.documentElement.setAttribute("data-preview-locked", "");
        location.replace(new URL("../dev/", location.href));
      }
    });
  }
})();
