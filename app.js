(function () {
  "use strict";

  /* ---------------------------------------------
     Navegacion tipo hotbar
  --------------------------------------------- */
  const navButtons = document.querySelectorAll("nav.hotbar button");
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      navButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const target = document.getElementById(btn.dataset.target);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* ---------------------------------------------
     Toast de feedback
  --------------------------------------------- */
  let toastTimer;
  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  document.querySelectorAll("button.buy").forEach((btn) => {
    btn.addEventListener("click", () => toast(btn.dataset.msg || "Anadido al carrito (demo)"));
  });

  /* ---------------------------------------------
     Visor de skin 3D (skinview3d)
  --------------------------------------------- */
  const DEFAULT_SKIN = "https://mc-heads.net/skin/MHF_Steve";

  const canvas = document.getElementById("skin-canvas");
  const frame = canvas.parentElement;
  const loadingEl = document.getElementById("skin-loading");
  const input = document.getElementById("skinInput");
  const goBtn = document.getElementById("skinBtn");
  const rotateToggle = document.getElementById("rotateToggle");

  let viewer = null;
  let autoRotating = true;

  function sizeCanvasToFrame() {
    const rect = frame.getBoundingClientRect();
    if (viewer) {
      viewer.width = rect.width;
      viewer.height = rect.height;
    }
  }

  function initViewer() {
    if (typeof skinview3d === "undefined") {
      loadingEl.textContent = "VISOR NO DISPONIBLE";
      return;
    }

    const rect = frame.getBoundingClientRect();
    viewer = new skinview3d.SkinViewer({
      canvas: canvas,
      width: rect.width,
      height: rect.height,
      skin: DEFAULT_SKIN,
    });

    viewer.autoRotate = true;
    viewer.autoRotateSpeed = 1.1;
    viewer.controls.enableZoom = true;
    viewer.controls.minDistance = 20;
    viewer.controls.maxDistance = 70;
    viewer.zoom = 0.9;
    viewer.animation = new skinview3d.IdleAnimation();

    viewer.globalLight.intensity = 3;
    viewer.cameraLight.intensity = 2.2;

    loadingEl.classList.add("hidden");

    window.addEventListener("resize", sizeCanvasToFrame);
  }

  function setSkin(url) {
    if (!viewer) return;
    loadingEl.classList.remove("hidden");
    loadingEl.textContent = "CARGANDO...";

    viewer
      .loadSkin(url)
      .then(() => {
        loadingEl.classList.add("hidden");
      })
      .catch(() => {
        loadingEl.textContent = "NICK NO ENCONTRADO";
        viewer
          .loadSkin(DEFAULT_SKIN)
          .then(() => {
            setTimeout(() => loadingEl.classList.add("hidden"), 900);
          })
          .catch(() => {
            loadingEl.textContent = "ERROR AL CARGAR";
          });
      });
  }

  function handleSkinRequest() {
    const nick = input.value.trim();
    if (!nick) {
      toast("Escribe un nick primero");
      return;
    }
    setSkin(`https://mc-heads.net/skin/${encodeURIComponent(nick)}`);
  }

  goBtn.addEventListener("click", handleSkinRequest);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSkinRequest();
  });

  rotateToggle.addEventListener("click", () => {
    autoRotating = !autoRotating;
    if (viewer) viewer.autoRotate = autoRotating;
    rotateToggle.classList.toggle("active", autoRotating);
    rotateToggle.textContent = autoRotating ? "GIRO AUTO" : "GIRO MANUAL";
  });

  // Pausar el auto-giro mientras el usuario arrastra, y reanudar al soltar
  let dragging = false;
  canvas.addEventListener("pointerdown", () => {
    dragging = true;
    if (viewer) viewer.autoRotate = false;
  });
  window.addEventListener("pointerup", () => {
    if (dragging && autoRotating && viewer) viewer.autoRotate = true;
    dragging = false;
  });

  // El script esta al final del body, asi que el DOM ya existe aqui.
  initViewer();
})();
