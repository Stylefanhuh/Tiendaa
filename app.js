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

  /* ---------------------------------------------
     Carrito (persistido en localStorage)
  --------------------------------------------- */
  const CART_KEY = "papus_cart_v1";
  let cart = [];

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      cart = raw ? JSON.parse(raw) : [];
    } catch (e) {
      cart = [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
      /* almacenamiento no disponible, seguimos solo en memoria */
    }
  }

  const cartCountEl = document.getElementById("cartCount");
  const cartItemsEl = document.getElementById("cartItems");
  const cartTotalEl = document.getElementById("cartTotal");
  const cartDrawer = document.getElementById("cartDrawer");
  const cartOverlay = document.getElementById("cartOverlay");

  function renderCart() {
    cartCountEl.textContent = String(cart.length);
    cartCountEl.classList.add("bump");
    setTimeout(() => cartCountEl.classList.remove("bump"), 200);

    if (cart.length === 0) {
      cartItemsEl.innerHTML = '<p class="cart-empty">El carrito esta vacio.</p>';
      cartTotalEl.textContent = "0 PPC";
      return;
    }

    let total = 0;
    cartItemsEl.innerHTML = cart
      .map((line, idx) => {
        total += line.price;
        return `
          <div class="cart-line">
            <span class="cart-line-name">${line.name}</span>
            <span class="cart-line-price">${line.price.toLocaleString("es-CO")} PPC</span>
            <button data-idx="${idx}" class="cart-remove" title="Quitar">X</button>
          </div>`;
      })
      .join("");
    cartTotalEl.textContent = `${total.toLocaleString("es-CO")} PPC`;

    cartItemsEl.querySelectorAll(".cart-remove").forEach((b) => {
      b.addEventListener("click", () => {
        cart.splice(Number(b.dataset.idx), 1);
        saveCart();
        renderCart();
      });
    });
  }

  function addToCart(name, price) {
    cart.push({ name, price });
    saveCart();
    renderCart();
  }

  function openCart() {
    cartDrawer.classList.add("show");
    cartOverlay.classList.add("show");
  }
  function closeCart() {
    cartDrawer.classList.remove("show");
    cartOverlay.classList.remove("show");
  }

  document.getElementById("cartBtn").addEventListener("click", openCart);
  document.getElementById("cartClose").addEventListener("click", closeCart);
  cartOverlay.addEventListener("click", closeCart);
  document.getElementById("cartCheckout").addEventListener("click", () => {
    if (cart.length === 0) {
      toast("Tu carrito esta vacio");
      return;
    }
    toast("Sistema de pago no conectado todavia (demo)");
  });

  loadCart();
  renderCart();

  document.querySelectorAll("button.buy").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const name = btn.dataset.name || btn.closest(".item, .offer-card")?.querySelector(".name")?.textContent || "Item";
      const price = Number(btn.dataset.price) || 0;
      addToCart(name, price);
      spawnBurst(e.clientX, e.clientY);
      toast(btn.dataset.msg || `${name} anadido al carrito`);
    });
  });

  /* ---------------------------------------------
     Burst de particulas al comprar
  --------------------------------------------- */
  function spawnBurst(x, y) {
    const colors = ["#ffcf40", "#5fe0d6", "#c860ff", "#e8e0d0"];
    for (let i = 0; i < 10; i++) {
      const p = document.createElement("div");
      const angle = (Math.PI * 2 * i) / 10;
      const dist = 40 + Math.random() * 30;
      p.style.cssText = `
        position:fixed; left:${x}px; top:${y}px; width:6px; height:6px;
        background:${colors[i % colors.length]}; z-index:200; pointer-events:none;
        transition:transform .5s ease-out, opacity .5s ease-out;
        transform:translate(0,0); opacity:1;`;
      document.body.appendChild(p);
      requestAnimationFrame(() => {
        p.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
        p.style.opacity = "0";
      });
      setTimeout(() => p.remove(), 520);
    }
  }

  /* ---------------------------------------------
     Filtros de rareza por seccion
  --------------------------------------------- */
  document.querySelectorAll(".filter-bar").forEach((bar) => {
    const scope = bar.dataset.scope;
    const grid = document.querySelector(`.grid[data-grid="${scope}"]`);
    if (!grid) return;
    const items = grid.querySelectorAll(".item");

    bar.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        bar.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const rarity = btn.dataset.rarity;
        items.forEach((item) => {
          const show = rarity === "all" || item.classList.contains(rarity);
          item.classList.toggle("filtered-out", !show);
        });
      });
    });
  });

  /* ---------------------------------------------
     Countdown de ofertas
  --------------------------------------------- */
  document.querySelectorAll(".countdown").forEach((el) => {
    const hours = Number(el.dataset.hours) || 6;
    const periodMs = hours * 60 * 60 * 1000;
    function tick() {
      const remaining = periodMs - (Date.now() % periodMs);
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      el.textContent = [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
    }
    tick();
    setInterval(tick, 1000);
  });

  /* ---------------------------------------------
     Modal de apertura de caja (roulette)
  --------------------------------------------- */
  const CRATE_POOLS = {
    common: { "r-common": 70, "r-rare": 25, "r-epic": 5, "r-legendary": 0 },
    rare: { "r-common": 50, "r-rare": 35, "r-epic": 13, "r-legendary": 2 },
    epic: { "r-common": 25, "r-rare": 35, "r-epic": 30, "r-legendary": 10 },
    legendary: { "r-common": 10, "r-rare": 25, "r-epic": 35, "r-legendary": 30 },
  };
  const REWARD_NAMES = {
    "r-common": ["Bloque decorativo", "Herramienta basica", "Comida"],
    "r-rare": ["Arma encantada", "Pocion util", "Cosmetico raro"],
    "r-epic": ["Gema especial", "Trail exclusivo", "Kit epico"],
    "r-legendary": ["Rango temporal", "Skin exclusiva", "Aura legendaria"],
  };

  function weightedRarity(pool) {
    const entries = Object.entries(pool);
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * total;
    for (const [rarity, w] of entries) {
      if (r < w) return rarity;
      r -= w;
    }
    return entries[0][0];
  }

  const crateOverlay = document.getElementById("crateOverlay");
  const crateTitle = document.getElementById("crateTitle");
  const rouletteStrip = document.getElementById("rouletteStrip");
  const crateSpin = document.getElementById("crateSpin");
  let currentCrate = null;
  let spinning = false;

  const ITEM_WIDTH = 84; // ancho + gap aproximado de cada .roulette-item
  const STRIP_LENGTH = 44;
  const REVEAL_INDEX = 38;

  function buildStrip(poolKey) {
    rouletteStrip.innerHTML = "";
    const pool = CRATE_POOLS[poolKey];
    const finalRarity = weightedRarity(pool);
    let finalName = REWARD_NAMES[finalRarity][Math.floor(Math.random() * REWARD_NAMES[finalRarity].length)];

    for (let i = 0; i < STRIP_LENGTH; i++) {
      const rarity = i === REVEAL_INDEX ? finalRarity : weightedRarity(pool);
      const div = document.createElement("div");
      div.className = "roulette-item";
      const icon = document.createElement("div");
      icon.className = `icon icon-${rarity.replace("r-", "")}`;
      div.appendChild(icon);
      rouletteStrip.appendChild(div);
    }
    rouletteStrip.style.transition = "none";
    rouletteStrip.style.transform = "translateX(0px)";
    return { finalRarity, finalName };
  }

  function openCrateModal(crateKey) {
    currentCrate = crateKey;
    crateTitle.textContent = `CAJA ${crateKey.toUpperCase()}`;
    crateSpin.disabled = false;
    crateSpin.textContent = "Abrir";
    buildStrip(crateKey);
    crateOverlay.classList.add("show");
  }

  function closeCrateModal() {
    crateOverlay.classList.remove("show");
  }

  document.querySelectorAll(".preview-btn").forEach((btn) => {
    btn.addEventListener("click", () => openCrateModal(btn.dataset.crate));
  });
  document.getElementById("crateClose").addEventListener("click", closeCrateModal);
  crateOverlay.addEventListener("click", (e) => {
    if (e.target === crateOverlay) closeCrateModal();
  });

  crateSpin.addEventListener("click", () => {
    if (spinning || !currentCrate) return;
    spinning = true;
    crateSpin.disabled = true;
    crateSpin.textContent = "Abriendo...";

    const { finalRarity, finalName } = buildStrip(currentCrate);
    const viewportWidth = rouletteStrip.parentElement.clientWidth;
    const jitter = (Math.random() - 0.5) * ITEM_WIDTH * 0.4;
    const target = REVEAL_INDEX * ITEM_WIDTH + ITEM_WIDTH / 2 - viewportWidth / 2 + jitter;

    requestAnimationFrame(() => {
      rouletteStrip.style.transition = "transform 4.2s cubic-bezier(0.12, 0.85, 0.15, 1)";
      rouletteStrip.style.transform = `translateX(-${target}px)`;
    });

    setTimeout(() => {
      spinning = false;
      crateSpin.disabled = false;
      crateSpin.textContent = "Abrir de nuevo";
      const label = finalRarity.replace("r-", "").toUpperCase();
      toast(`Obtuviste: ${finalName} (${label})`);
    }, 4300);
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

  /* ---------------------------------------------
     Fondo ambiental: bloques pixel flotando
  --------------------------------------------- */
  (function ambientBackground() {
    const canvas = document.getElementById("ambient-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const colors = ["#5c9c3f2e", "#5fe0d626", "#ffcf4022", "#c860ff1f"];
    let particles = [];
    let w, h;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function spawn(count) {
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: 4 + Math.random() * 10,
          speed: 0.15 + Math.random() * 0.35,
          drift: (Math.random() - 0.5) * 0.3,
          color: colors[i % colors.length],
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y < -p.size) {
          p.y = h + p.size;
          p.x = Math.random() * w;
        }
        if (p.x < -p.size) p.x = w + p.size;
        if (p.x > w + p.size) p.x = -p.size;
      });
      requestAnimationFrame(frame);
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resize();
    window.addEventListener("resize", resize);
    if (!reduceMotion) {
      spawn(36);
      requestAnimationFrame(frame);
    }
  })();
})();
