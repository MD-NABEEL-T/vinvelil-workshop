/**
 * விண்வெளில் ஒரு பயணம் — IARRD Astronomy Workshop
 * script.js — All pages
 *
 * ⚙️  CONFIGURE YOUR GOOGLE APPS SCRIPT URL HERE:
 */
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw_gIm_Y8EtbDY4idWsTgeEJKyNKNN75NAeAD2DR5Ch7HqOtRCl_Sju6rtTB5KoFX77/exec";
const ADMIN_PASSWORD = "iarrdadmin2026";

/* ═══════════════════════════════════════
   STARFIELD (all pages)
═══════════════════════════════════════ */
(function initStarfield() {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let stars = [];
  const STAR_COUNT = 280;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const size = Math.random();
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: size < .6 ? .5 : size < .85 ? 1 : 1.7,
        alpha: .25 + Math.random() * .75,
        speed: .0003 + Math.random() * .0006,
        offset: Math.random() * Math.PI * 2,
      });
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      const twinkle = .55 + .45 * Math.sin(t * s.speed * 1000 + s.offset);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,232,255,${s.alpha * twinkle})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  resize();
  createStars();
  window.addEventListener("resize", () => { resize(); createStars(); });
  requestAnimationFrame(draw);
})();

/* ═══════════════════════════════════════
   REALISTIC THREE.JS EARTH (landing page)
═══════════════════════════════════════ */
(function initEarth3D() {
  const container = document.getElementById("earth-3d");
  if (!container || typeof THREE === "undefined") return;

  // Size matches CSS .earth-wrap (responsive, capped at 560px)
  const size = Math.min(container.parentElement.offsetWidth || 560, 560);
  const W = size, H = size;

  // ── Renderer — transparent background so space shows through ──
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);

  // ── Resize handler ──
  window.addEventListener("resize", () => {
    const s = Math.min(container.parentElement.offsetWidth || 560, 560);
    renderer.setSize(s, s);
  });

  // ── Scene & Camera ──
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 2.55);

  // ── Textures — all from reliable three.js r128 CDN ──
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = "anonymous";
  const BASE = "https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/textures/planets/";

  // ── Earth sphere with day texture, bump, specular ──
  const earthGeo = new THREE.SphereGeometry(1, 72, 72);
  const earthMat = new THREE.MeshPhongMaterial({
    map: loader.load(BASE + "earth_atmos_2048.jpg"),
    bumpMap: loader.load(BASE + "earth_normal_2048.jpg"),
    bumpScale: 0.05,
    specularMap: loader.load(BASE + "earth_specular_2048.jpg"),
    specular: new THREE.Color(0x1a3050),
    shininess: 20,
  });
  const earth = new THREE.Mesh(earthGeo, earthMat);
  scene.add(earth);

  // ── Cloud layer — slightly larger sphere on top ──
  const cloudMat = new THREE.MeshPhongMaterial({
    map: loader.load(BASE + "earth_clouds_2048.png"),
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  });
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.009, 72, 72), cloudMat);
  scene.add(clouds);

  // ── City lights on night side (additive blend) ──
  // Using a reliable mirrored source
  const nightTex = loader.load(
    "https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/textures/planets/earth_atmos_2048.jpg",
    // fallback: same texture, night overlay logic handled via opacity
  );
  // Try a better night lights source
  const nightLoader = new THREE.TextureLoader();
  nightLoader.crossOrigin = "anonymous";
  const nightMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  nightLoader.load(
    "https://raw.githubusercontent.com/turban/webgl-earth/master/images/5_night_8k.jpg",
    (tex) => { nightMat.map = tex; nightMat.needsUpdate = true; },
    undefined,
    () => {
      // fallback: use a procedural warm tint for city lights
      nightMat.color = new THREE.Color(0xffcc44);
      nightMat.needsUpdate = true;
    }
  );
  const nightMesh = new THREE.Mesh(new THREE.SphereGeometry(1.002, 72, 72), nightMat);
  scene.add(nightMesh);

  // ── Atmosphere halo — thin blue rim (BackSide shell) ──
  const atmoMat = new THREE.MeshPhongMaterial({
    color: 0x1177ff,
    transparent: true,
    opacity: 0.13,
    depthWrite: false,
    side: THREE.BackSide,
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.055, 64, 64), atmoMat));

  // Outer soft glow
  const outerMat = new THREE.MeshPhongMaterial({
    color: 0x0044cc,
    transparent: true,
    opacity: 0.055,
    depthWrite: false,
    side: THREE.BackSide,
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.13, 64, 64), outerMat));

  // ── Lighting ──
  // Primary sun — upper right, warm white, strong (matches reference screenshot)
  const sun = new THREE.DirectionalLight(0xfff5e0, 2.8);
  sun.position.set(4.0, 2.2, 2.5);
  scene.add(sun);

  // Soft rim from sun — gives the bright edge crescent visible in reference
  const sunRim = new THREE.DirectionalLight(0xffeedd, 0.6);
  sunRim.position.set(4.5, 2.8, 1.5);
  scene.add(sunRim);

  // Deep space ambient — almost nothing, keeps night side barely visible
  scene.add(new THREE.AmbientLight(0x04080f, 1.5));

  // ── Axial tilt ~~
  const TILT = THREE.MathUtils.degToRad(23.5);
  [earth, clouds, nightMesh].forEach(m => m.rotation.z = TILT);

  // Start facing Middle East / India / Africa like reference image
  earth.rotation.y = THREE.MathUtils.degToRad(35);
  nightMesh.rotation.y = earth.rotation.y;
  clouds.rotation.y = earth.rotation.y + 0.08;

  // ── Animation ──
  const EARTH_RPM = 0.00075;
  const CLOUD_RPM = 0.00115;

  function animate() {
    requestAnimationFrame(animate);

    earth.rotation.y += EARTH_RPM;
    clouds.rotation.y += CLOUD_RPM;
    nightMesh.rotation.y = earth.rotation.y;

    // City lights opacity: appear when facing away from sun
    // Sun is at +X,+Y → night side faces -X,+Z
    const angle = earth.rotation.y;
    // sinusoidal: peaks when earth's night hemisphere faces camera
    const nightIntensity = Math.max(0, -Math.cos(angle + 0.6));
    nightMat.opacity = nightIntensity * 0.65;

    renderer.render(scene, camera);
  }
  animate();
})();

/* ═══════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════ */
if (document.querySelector(".page-landing")) {

  // Header scroll state
  const header = document.querySelector(".site-header");
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 40);
  });

  // Countdown to May 2, 2026 18:00 local time
  const TARGET = new Date("2026-05-02T18:00:00");

  function updateCountdown() {
    const now = new Date();
    const diff = TARGET - now;

    if (diff <= 0) {
      ["days", "hours", "mins", "secs"].forEach(id =>
        document.querySelector(`#cd-${id} .cd-num`).textContent = "00"
      );
      return;
    }

    const days = Math.floor(diff / 864e5);
    const hours = Math.floor((diff % 864e5) / 36e5);
    const mins = Math.floor((diff % 36e5) / 6e4);
    const secs = Math.floor((diff % 6e4) / 1e3);

    document.querySelector("#cd-days  .cd-num").textContent = String(days).padStart(2, "0");
    document.querySelector("#cd-hours .cd-num").textContent = String(hours).padStart(2, "0");
    document.querySelector("#cd-mins  .cd-num").textContent = String(mins).padStart(2, "0");
    document.querySelector("#cd-secs  .cd-num").textContent = String(secs).padStart(2, "0");
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Scroll reveal for About and Contact section cards
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        obs.unobserve(entry.target);
      }
    });
  }, { root: null, rootMargin: "0px", threshold: 0.12 });

  document.querySelectorAll(".topic-card.reveal, .contact-card.reveal").forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.08}s`;
    revealObserver.observe(card);
  });
}

/* ═══════════════════════════════════════
   REGISTRATION FORM
═══════════════════════════════════════ */
if (document.querySelector(".page-form")) {

  // ── State ──
  const formData = {
    category: "",
    name: "",
    email: "",
    phone: "",
    // dynamic
    schoolName: "",
    standard: "",
    collegeName: "",
    department: "",
    year: "",
    company: "",
    role: "",
    describe: "",
    timestamp: "",
  };

  let currentStep = 1;
  const TOTAL = 4;

  // ── DOM refs ──
  const steps = document.querySelectorAll(".form-step");
  const progSteps = document.querySelectorAll(".progress-step");
  const progressFill = document.getElementById("progressFill");

  // ── Helpers ──
  function showStep(n) {
    steps.forEach(s => s.classList.remove("active"));
    document.getElementById(`step-${n}`).classList.add("active");

    progSteps.forEach((ps, i) => {
      ps.classList.remove("active", "done");
      if (i + 1 === n) ps.classList.add("active");
      if (i + 1 < n) ps.classList.add("done");
    });

    const pct = ((n - 1) / (TOTAL - 1)) * 100;
    progressFill.style.width = pct + "%";
    currentStep = n;
  }

  function val(id) { return (document.getElementById(id)?.value || "").trim(); }

  // ── Step 1: category selection ──
  const catCards = document.querySelectorAll(".cat-card");
  const next1 = document.getElementById("next-1");

  catCards.forEach(card => {
    card.addEventListener("click", () => {
      catCards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      formData.category = card.dataset.cat;
      next1.disabled = false;
    });
  });

  next1.addEventListener("click", () => showStep(2));

  // ── Step 2: basic details ──
  document.getElementById("next-2").addEventListener("click", () => {
    const name = val("name");
    const email = val("email");
    const phone = val("phone");

    if (!name) { shake("name"); return; }
    if (!email || !email.includes("@")) { shake("email"); return; }
    if (!phone) { shake("phone"); return; }

    formData.name = name;
    formData.email = email;
    formData.phone = phone;

    // Show dynamic fields for step 3
    document.querySelectorAll(".dynamic-fields").forEach(f => f.classList.remove("active"));
    document.getElementById(`fields-${formData.category}`)?.classList.add("active");

    const titles = {
      school: "Your School Details",
      college: "Your College Details",
      professional: "Your Professional Details",
      enthusiast: "About You",
    };
    document.getElementById("step3-title").textContent = titles[formData.category] || "Additional Info";

    showStep(3);
  });

  document.getElementById("back-2").addEventListener("click", () => showStep(1));

  // ── Step 3: dynamic details ──
  document.getElementById("next-3").addEventListener("click", () => {
    const cat = formData.category;

    if (cat === "school") {
      formData.schoolName = val("school-name");
      formData.standard = val("standard");
      if (!formData.schoolName) { shake("school-name"); return; }
    } else if (cat === "college") {
      formData.collegeName = val("college-name");
      formData.department = val("department");
      formData.year = val("year");
      if (!formData.collegeName) { shake("college-name"); return; }
    } else if (cat === "professional") {
      formData.company = val("company");
      formData.role = val("role");
      if (!formData.company) { shake("company"); return; }
    } else if (cat === "enthusiast") {
      formData.describe = val("describe");
    }

    buildReview();
    showStep(4);
  });

  document.getElementById("back-3").addEventListener("click", () => showStep(2));
  document.getElementById("back-4").addEventListener("click", () => showStep(3));

  // ── Build review card ──
  function buildReview() {
    const cat = formData.category;
    const catLabels = {
      school: "School Student", college: "College Student",
      professional: "Working Professional", enthusiast: "Enthusiast"
    };

    let rows = [
      { k: "Category", v: catLabels[cat] || cat },
      { k: "Name", v: formData.name },
      { k: "Email", v: formData.email },
      { k: "Phone", v: formData.phone },
    ];

    if (cat === "school") {
      rows.push({ k: "School", v: formData.schoolName });
      rows.push({ k: "Standard", v: formData.standard });
    } else if (cat === "college") {
      rows.push({ k: "College", v: formData.collegeName });
      rows.push({ k: "Department", v: formData.department });
      rows.push({ k: "Year", v: formData.year });
    } else if (cat === "professional") {
      rows.push({ k: "Company", v: formData.company });
      rows.push({ k: "Role", v: formData.role });
    } else if (cat === "enthusiast") {
      if (formData.describe) rows.push({ k: "Description", v: formData.describe });
    }

    document.getElementById("review-card").innerHTML = rows
      .map(r => `<div class="review-row">
        <span class="review-key">${r.k}</span>
        <span class="review-val">${r.v || "—"}</span>
      </div>`).join("");
  }

  // ── Submit ──
  document.getElementById("submit-btn").addEventListener("click", async () => {
    formData.timestamp = new Date().toISOString();

    const spinner = document.getElementById("submit-spinner");
    const errEl = document.getElementById("submit-error");
    const submitBtn = document.getElementById("submit-btn");

    submitBtn.style.display = "none";
    spinner.style.display = "block";
    errEl.style.display = "none";

    // If no URL is configured, skip the actual fetch
    if (GOOGLE_SCRIPT_URL === "YOUR_GOOGLE_SCRIPT_URL") {
      await fakeDelay(1200);
      window.location.href = "success.html";
      return;
    }

    try {
      // ── STRICT VALIDATION ──
      const allowedCategories = ["school", "college", "professional", "enthusiast"];
      if (!allowedCategories.includes(formData.category)) {
        throw new Error("Invalid category: " + formData.category);
      }

      // ── STRICT MAPPING TO SHEET COLUMNS ──
      const submission = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        category: formData.category,
        school: formData.category === "school" ? formData.schoolName : "",
        standard: formData.category === "school" ? formData.standard : "",
        college: formData.category === "college" ? formData.collegeName : "",
        dept: formData.category === "college" ? formData.department : "",
        year: formData.category === "college" ? formData.year : "",
        company: formData.category === "professional" ? formData.company : "",
        role: formData.category === "professional" ? formData.role : "",
        description: formData.category === "enthusiast" ? formData.describe : "",
        timestamp: formData.timestamp,
      };

      const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(submission),
      });
      if (!res.ok) throw new Error("Server error");
      window.location.href = "success.html";
    } catch (e) {
      spinner.style.display = "none";
      submitBtn.style.display = "inline-flex";
      errEl.style.display = "block";
    }
  });

  // ── Shake animation for validation ──
  function shake(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.borderColor = "#e87878";
    el.animate([
      { transform: "translateX(0)" },
      { transform: "translateX(-5px)" },
      { transform: "translateX(5px)" },
      { transform: "translateX(-4px)" },
      { transform: "translateX(4px)" },
      { transform: "translateX(0)" },
    ], { duration: 320, easing: "ease" });
    el.focus();
    setTimeout(() => { el.style.borderColor = ""; }, 1500);
  }

  function fakeDelay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }
}

/* ═══════════════════════════════════════
   ADMIN PANEL
═══════════════════════════════════════ */
if (document.querySelector(".page-admin")) {

  const loginEl = document.getElementById("admin-login");
  const dashEl = document.getElementById("admin-dashboard");
  const loginBtn = document.getElementById("admin-login-btn");
  const passInput = document.getElementById("admin-pass");
  const loginError = document.getElementById("login-error");
  const catFilter = document.getElementById("cat-filter");
  const refreshBtn = document.getElementById("refresh-btn");
  const logoutBtn = document.getElementById("admin-logout");

  let allData = [];

  // ── Login ──
  function attemptLogin() {
    if (passInput.value === ADMIN_PASSWORD) {
      loginEl.style.display = "none";
      dashEl.style.display = "block";
      loadData();
    } else {
      loginError.style.display = "block";
      passInput.value = "";
      passInput.focus();
    }
  }
  loginBtn.addEventListener("click", attemptLogin);
  passInput.addEventListener("keydown", e => { if (e.key === "Enter") attemptLogin(); });
  logoutBtn.addEventListener("click", () => {
    loginEl.style.display = "flex";
    dashEl.style.display = "none";
    passInput.value = "";
  });

  // ── Case-insensitive key lookup helper ──
  // Finds a value in object r by trying key variants (case-insensitive + trimmed)
  function getField(r, ...keys) {
    // Build a lowercase map of all keys in r
    const lowerMap = {};
    for (const k of Object.keys(r)) {
      lowerMap[k.toLowerCase().trim()] = r[k];
    }
    for (const key of keys) {
      const v = lowerMap[key.toLowerCase().trim()];
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
    }
    return "";
  }

  // ── Normalize every row from Google Sheet ──
  function normalizeRow(r) {
    if (!normalizeRow._logged) {
      console.log("📋 Raw keys:", Object.keys(r));
      console.log("📋 First row:", r);
      normalizeRow._logged = true;
    }

    // Strict lowercase map for exact match
    const m = {};
    for (const k of Object.keys(r)) {
      m[k.toLowerCase().trim()] = String(r[k] || "").trim();
    }

    // Extract exactly the strict keys
    const name = m["name"] || "";
    const email = m["email"] || "";
    const phone = m["phone"] || "";

    // Category mapping & normalization
    let rawCat = (m["category"] || "").toLowerCase();
    let cat = "";
    if (rawCat === "school") cat = "school";
    else if (rawCat === "college") cat = "college";
    else if (rawCat === "professional") cat = "professional";
    else if (rawCat === "enthusiast") cat = "enthusiast";

    const schoolName = m["school"] || "";
    const standard = m["standard"] || "";
    const collegeName = m["college"] || "";
    const department = m["dept"] || "";
    const year = m["year"] || "";
    const company = m["company"] || "";
    const role = m["role"] || "";
    const describe = m["description"] || "";
    const timestamp = m["timestamp"] || "";

    return {
      _raw: r, name, email, phone, category: cat,
      schoolName, standard, collegeName, department, year,
      company, role, describe, timestamp
    };
  }


  // ── Load data ──
  async function loadData() {
    const loading = document.getElementById("admin-loading");
    const table = document.getElementById("admin-table");
    const emptyEl = document.getElementById("admin-empty");
    const fetchErr = document.getElementById("admin-fetch-error");
    const debugBox = document.getElementById("admin-debug");

    loading.style.display = "block";
    table.style.display = "none";
    emptyEl.style.display = "none";
    fetchErr.style.display = "none";
    if (debugBox) debugBox.style.display = "none";

    // Reset logged flag so new fetch logs fresh keys
    normalizeRow._logged = false;

    try {
      const res = await fetch(`${GOOGLE_SCRIPT_URL}?token=admin123`);
      const json = await res.json();
      const raw = Array.isArray(json) ? json : (json.data || []);

      // Show raw key names in debug box so admin can verify
      if (raw.length > 0 && debugBox) {
        const keys = Object.keys(raw[0]);
        debugBox.style.display = "block";
        debugBox.innerHTML = `<strong>📋 Sheet column names detected:</strong> <code>${keys.join(", ")}</code><br>
          <small>If category shows "—", one of these must be your category column. <a href="#" id="hide-debug" style="color:var(--accent)">Hide</a></small>`;
        document.getElementById("hide-debug")?.addEventListener("click", e => {
          e.preventDefault(); debugBox.style.display = "none";
        });
      }

      allData = raw.map(normalizeRow);
      renderTable(allData);
    } catch (e) {
      loading.style.display = "none";
      fetchErr.style.display = "block";
      console.error("Admin fetch error:", e);
    }
  }

  // ── Render table ──
  function renderTable(data) {
    const loading = document.getElementById("admin-loading");
    const table = document.getElementById("admin-table");
    const emptyEl = document.getElementById("admin-empty");
    const tbody = document.getElementById("admin-tbody");

    loading.style.display = "none";

    if (!data.length) {
      emptyEl.style.display = "block";
      table.style.display = "none";
      updateStats([]);
      return;
    }

    table.style.display = "table";
    emptyEl.style.display = "none";

    const catLabels = {
      school: "School Student",
      college: "College Student",
      professional: "Working Professional",
      enthusiast: "Enthusiast",
    };
    const badgeClass = {
      school: "badge-school",
      college: "badge-college",
      professional: "badge-professional",
      enthusiast: "badge-enthusiast",
    };

    tbody.innerHTML = data.map((row, i) => {
      const cat = row.category;
      const det = buildDetailStr(row);
      const time = row.timestamp
        ? new Date(row.timestamp).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })
        : "—";

      // If category wasn't recognized, show the raw value in orange so admin can debug
      const knownCats = ["school", "college", "professional", "enthusiast"];
      const catDisplay = knownCats.includes(cat)
        ? `<span class="cat-badge ${badgeClass[cat]}">${catLabels[cat]}</span>`
        : `<span class="cat-badge" style="border-color:rgba(255,120,60,.4);color:#ff8844;background:rgba(255,120,60,.08)">
            ⚠ ${esc(cat || Object.keys(row._raw || {}).join(", ").slice(0, 30))}
           </span>`;

      return `<tr>
        <td style="color:var(--text-dim)">${i + 1}</td>
        <td><strong>${esc(row.name || "—")}</strong></td>
        <td style="color:var(--text-muted)">${esc(row.email || "—")}</td>
        <td style="color:var(--text-muted)">${esc(row.phone || "—")}</td>
        <td>${catDisplay}</td>
        <td style="color:var(--text-muted);font-size:.8rem">${det}</td>
        <td style="color:var(--text-dim);font-size:.78rem;white-space:nowrap">${time}</td>
      </tr>`;
    }).join("");

    updateStats(data);
  }

  function buildDetailStr(row) {
    const cat = row.category;
    if (cat === "school") {
      // No separate school name column in sheet yet — show grade only
      const parts = [row.schoolName, row.standard].filter(Boolean);
      return parts.length ? parts.map(esc).join(" · ") : "—";
    }
    if (cat === "college") {
      const parts = [row.collegeName, row.department, row.year].filter(Boolean);
      return parts.length ? parts.map(esc).join(" · ") : "—";
    }
    if (cat === "professional") {
      const parts = [row.company, row.role].filter(Boolean);
      return parts.length ? parts.map(esc).join(" · ") : "—";
    }
    if (cat === "enthusiast") {
      const d = row.describe || "";
      return d ? esc(d.slice(0, 80) + (d.length > 80 ? "…" : "")) : "—";
    }
    return "—";
  }

  function updateStats(data) {
    document.getElementById("stat-total").textContent = data.length;
    document.getElementById("stat-school").textContent = data.filter(r => r.category === "school").length;
    document.getElementById("stat-college").textContent = data.filter(r => r.category === "college").length;
    document.getElementById("stat-pro").textContent = data.filter(r => r.category === "professional").length;
    document.getElementById("stat-enth").textContent = data.filter(r => r.category === "enthusiast").length;
  }

  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Filter — works on already-normalized allData ──
  catFilter.addEventListener("change", () => {
    const f = catFilter.value;
    const filtered = f === "all" ? allData : allData.filter(r => r.category === f);
    renderTable(filtered);
  });

  refreshBtn.addEventListener("click", () => {
    catFilter.value = "all";
    loadData();
  });
}