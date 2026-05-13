/**
 * விண்வெளில் ஒரு பயணம் — IARRD Astronomy Workshop
 * script.js — All pages
 *
 * ⚙️  CONFIGURE YOUR GOOGLE APPS SCRIPT URL HERE:
 */
const BACKEND_URL = "https://vinvelil-workshop.onrender.com";

// old url :"https://script.google.com/macros/s/AKfycbwwleBrM0mXl6RstdxeUnanh3VGOtrmiG9Szul6dGvN5WJRR0GYRS4IYOsKyNQtq96I/exec"
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyXbLR7egPx3VerVUI3kqB50kSl5WZajoz1ThGy1hU2WZNl3CT-pSHvOyx_koXHm8zGDg/exec";

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
   CINEMATIC BLACK HOLE (landing page)
═══════════════════════════════════════ */
/* ═══════════════════════════════════════
   CINEMATIC SOLAR SYSTEM (landing page)
═══════════════════════════════════════ */
(function initSolarSystem3D() {
  const container = document.getElementById("solar-system-3d");
  if (!container || typeof THREE === "undefined") return;

  const W = window.innerWidth;
  const H = window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  let composer;
  const renderScene = typeof THREE.RenderPass !== "undefined" ? new THREE.RenderPass(new THREE.Scene(), new THREE.Camera()) : null;

  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    if(composer) composer.setSize(window.innerWidth, window.innerHeight);
  });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
  camera.position.set(0, 5, 25);
  camera.lookAt(0, 0, 0);
  
  if (renderScene) {
    renderScene.scene = scene;
    renderScene.camera = camera;
  }

  // Texture Loader
  const textureLoader = new THREE.TextureLoader();
  textureLoader.crossOrigin = "Anonymous";
  
  // Create generic noise texture for planets if CDN fails
  const createNoiseTex = (color1, color2) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    for(let i=0; i<512; i+=4) {
      for(let j=0; j<512; j+=4) {
        ctx.fillStyle = Math.random() > 0.5 ? color1 : color2;
        ctx.fillRect(i, j, 4, 4);
      }
    }
    return new THREE.CanvasTexture(canvas);
  };

  // LIGHTING
  const ambientLight = new THREE.AmbientLight(0x0a1525, 0.2); // deep space dark blue
  scene.add(ambientLight);

  const sunLight = new THREE.PointLight(0xffeedd, 3.5, 300);
  sunLight.position.set(-15, 0, -10); // Sun on the left
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.bias = -0.001;
  scene.add(sunLight);

  const systemGroup = new THREE.Group();
  scene.add(systemGroup);

  // 1. SUN (Left Side)
  const sunGeo = new THREE.SphereGeometry(8, 64, 64);
  
  const sunShaderMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPos;
      void main() {
        vUv = uv; vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec2 vUv;
      varying vec3 vPos;
      float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
      float noise(vec3 x) {
        vec3 p = floor(x); vec3 f = fract(x);
        f = f*f*(3.0-2.0*f);
        return mix(mix(mix(hash(p+vec3(0,0,0)), hash(p+vec3(1,0,0)),f.x),
                       mix(hash(p+vec3(0,1,0)), hash(p+vec3(1,1,0)),f.x),f.y),
                   mix(mix(hash(p+vec3(0,0,1)), hash(p+vec3(1,0,1)),f.x),
                       mix(hash(p+vec3(0,1,1)), hash(p+vec3(1,1,1)),f.x),f.y),f.z);
      }
      void main() {
        float n = noise(vPos * 0.8 + time * 0.2);
        n += 0.5 * noise(vPos * 2.0 - time * 0.5);
        vec3 color = mix(vec3(0.9, 0.3, 0.0), vec3(1.0, 0.9, 0.6), n);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  });
  const sun = new THREE.Mesh(sunGeo, sunShaderMat);
  sun.position.copy(sunLight.position);
  systemGroup.add(sun);

  const haloGeo = new THREE.SphereGeometry(8.5, 32, 32);
  const haloMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, side: THREE.BackSide });
  const sunHalo = new THREE.Mesh(haloGeo, haloMat);
  sun.add(sunHalo);

  // 2. EARTH (Center)
  const earthGeo = new THREE.SphereGeometry(2, 64, 64);
  const earthMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg', undefined, undefined, () => {
      earthMat.map = createNoiseTex('rgba(10,50,150,1)', 'rgba(20,100,50,1)');
      earthMat.needsUpdate = true;
    }),
    roughness: 0.7,
    metalness: 0.1
  });
  const earth = new THREE.Mesh(earthGeo, earthMat);
  earth.position.set(4, -1, -2);
  earth.castShadow = true;
  earth.receiveShadow = true;
  systemGroup.add(earth);

  const atmosGeo = new THREE.SphereGeometry(2.05, 32, 32);
  const atmosMat = new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, side: THREE.BackSide });
  const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
  earth.add(atmosphere);

  // 3. SATURN (Top Right)
  const saturnGeo = new THREE.SphereGeometry(3.5, 64, 64);
  const createSaturnTex = () => {
    const c = document.createElement('canvas'); c.width = 1; c.height = 128;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0,0,0,128);
    grad.addColorStop(0, '#dcb588'); grad.addColorStop(0.2, '#c4996b'); grad.addColorStop(0.4, '#e3caa0');
    grad.addColorStop(0.6, '#b78c62'); grad.addColorStop(0.8, '#e3caa0'); grad.addColorStop(1, '#dcb588');
    ctx.fillStyle = grad; ctx.fillRect(0,0,1,128);
    return new THREE.CanvasTexture(c);
  };
  const saturnMat = new THREE.MeshStandardMaterial({ map: createSaturnTex(), roughness: 0.8 });
  const saturn = new THREE.Mesh(saturnGeo, saturnMat);
  saturn.position.set(22, 6, -15);
  saturn.castShadow = true;
  saturn.receiveShadow = true;
  systemGroup.add(saturn);

  // Saturn Rings
  const ringGeo = new THREE.RingGeometry(4.5, 8.5, 128);
  const createRingTex = () => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 1;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0,0,256,0);
    grad.addColorStop(0, 'rgba(200,180,150,0)');
    grad.addColorStop(0.1, 'rgba(200,180,150,0.8)');
    grad.addColorStop(0.3, 'rgba(220,200,180,0.9)');
    grad.addColorStop(0.35, 'rgba(0,0,0,0)'); 
    grad.addColorStop(0.4, 'rgba(180,160,130,0.7)');
    grad.addColorStop(0.8, 'rgba(160,140,110,0.5)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad; ctx.fillRect(0,0,256,1);
    return new THREE.CanvasTexture(c);
  };
  
  const ringMat = new THREE.MeshStandardMaterial({
    map: createRingTex(),
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    roughness: 0.8
  });
  
  const pos = ringGeo.attributes.position;
  const uvs = ringGeo.attributes.uv;
  for(let i=0; i<pos.count; i++) {
    const r = Math.sqrt(pos.x[i]*pos.x[i] + pos.y[i]*pos.y[i]);
    uvs.setXY(i, (r - 4.5) / (8.5 - 4.5), 0.5);
  }
  
  const rings = new THREE.Mesh(ringGeo, ringMat);
  rings.rotation.x = Math.PI / 2 + 0.2;
  rings.rotation.y = 0.1;
  rings.receiveShadow = true;
  rings.castShadow = true;
  saturn.add(rings);

  // 4. MARS
  const marsGeo = new THREE.SphereGeometry(0.8, 32, 32);
  const marsMat = new THREE.MeshStandardMaterial({ color: 0x993322, roughness: 0.9 });
  const mars = new THREE.Mesh(marsGeo, marsMat);
  mars.position.set(-5, -6, 8);
  mars.receiveShadow = true;
  mars.castShadow = true;
  systemGroup.add(mars);

  // 5. ASTEROID DUST
  const dustGeo = new THREE.BufferGeometry();
  const dustCount = 1500;
  const dustPos = new Float32Array(dustCount * 3);
  for(let i=0; i<dustCount; i++) {
    dustPos[i*3] = (Math.random() - 0.5) * 100;
    dustPos[i*3+1] = (Math.random() - 0.5) * 40;
    dustPos[i*3+2] = (Math.random() - 0.5) * 80 - 10;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.05, transparent: true, opacity: 0.4 });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // 6. POST PROCESSING (Subtle Bloom)
  if (typeof THREE.EffectComposer !== "undefined" && typeof THREE.UnrealBloomPass !== "undefined") {
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderScene);
    const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(W, H), 0.4, 0.5, 0.8);
    bloomPass.threshold = 0.5; 
    bloomPass.strength = 0.8;
    bloomPass.radius = 0.6;
    composer.addPass(bloomPass);
  }

  systemGroup.rotation.x = 0.1;
  systemGroup.rotation.y = 0.05;

  // 7. ANIMATION LOOP
  let time = 0;
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    time += delta;

    sunShaderMat.uniforms.time.value = time;

    earth.rotation.y += 0.002;
    saturn.rotation.y += 0.001;
    mars.rotation.y += 0.003;

    earth.position.x = 4 + Math.sin(time * 0.05) * 0.5;
    earth.position.z = -2 + Math.cos(time * 0.05) * 0.5;
    
    saturn.position.x = 22 + Math.sin(time * 0.02 + 1) * 1.0;
    saturn.position.z = -15 + Math.cos(time * 0.02 + 1) * 1.0;

    dust.rotation.y = time * 0.005;

    const scrollY = window.scrollY;
    camera.position.x = Math.sin(time * 0.1) * 0.5;
    
    // For mobile (portrait), we might want to push the camera back a bit to see the sun on the left and earth in the center
    const isMobile = window.innerWidth < 768;
    const zOffset = isMobile ? 35 : 25;
    const yOffset = isMobile ? 8 : 5;
    
    camera.position.y = yOffset + Math.cos(time * 0.08) * 0.3 - scrollY * 0.005;
    camera.position.z = zOffset - scrollY * 0.01;
    
    // Adjust lookAt slightly based on mobile
    camera.lookAt(isMobile ? 2 : 0, 0, 0);

    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  animate();
})();

/* ═══════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════ */
if (document.querySelector(".page-landing")) {

  const header = document.querySelector(".site-header");
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 40);
  });

  const TARGET = new Date("2026-05-17T18:00:00");

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

  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        obs.unobserve(entry.target);
      }
    });
  }, { root: null, rootMargin: "0px", threshold: 0.12 });

  document.querySelectorAll(".mission-file-card.reveal, .crew-card.reveal, .test-card.reveal, .payment-card.reveal, .contact-card.reveal").forEach((card, i) => {
    card.style.transitionDelay = `${(i % 5) * 0.08}s`;
    revealObserver.observe(card);
  });
}

/* ═══════════════════════════════════════
   REGISTRATION FORM - PAYMENT HANDLER (FIXED)
═══════════════════════════════════════ */
if (document.querySelector(".page-form")) {

  const formData = {
    category: "",
    name: "",
    email: "",
    phone: "",
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

  const steps = document.querySelectorAll(".form-step");
  const progSteps = document.querySelectorAll(".progress-step");
  const progressFill = document.getElementById("progressFill");

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

  // ── Submit Button Handler ──
  document.getElementById("submit-btn").addEventListener("click", async () => {

    // Privacy checkbox validation
    const privacyCheck = document.getElementById("privacy-agree");
    if (!privacyCheck || !privacyCheck.checked) {
      const consentBox = privacyCheck?.closest(".privacy-consent");
      if (consentBox) {
        consentBox.style.outline = "1px solid #e87878";
        consentBox.style.borderColor = "#e87878";
        consentBox.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          consentBox.style.outline = "";
          consentBox.style.borderColor = "";
        }, 2000);
      }
      return;
    }

    formData.timestamp = new Date().toISOString();

    const spinner = document.getElementById("submit-spinner");
    const errEl = document.getElementById("submit-error");
    const submitBtn = document.getElementById("submit-btn");

    submitBtn.style.display = "none";
    spinner.style.display = "block";
    errEl.style.display = "none";

    // Demo mode
    if (GOOGLE_SCRIPT_URL === "YOUR_GOOGLE_SCRIPT_URL") {
      await fakeDelay(1200);
      window.location.href = "success.html";
      return;
    }

    try {
      const allowedCategories = ["school", "college", "professional", "enthusiast"];
      if (!allowedCategories.includes(formData.category)) {
        throw new Error("Invalid category: " + formData.category);
      }

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

      console.log("📤 Starting payment process...", submission);

      // ═════════════════════════════════════════
      // STEP 1: CREATE RAZORPAY ORDER
      // ═════════════════════════════════════════
      console.log("📦 Creating Razorpay order...");
      
      let orderRes;
      try {
        orderRes = await fetch(`${BACKEND_URL}/api/payment/create-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
      } catch (fetchErr) {
        // ✅ FIX: Network error handling
        throw new Error(`Network error: ${fetchErr.message}. Check your internet connection.`);
      }

      // ✅ FIX: Check HTTP status BEFORE parsing JSON
      if (!orderRes.ok) {
        const errText = await orderRes.text();
        throw new Error(`Server error ${orderRes.status}: ${errText || "Order creation failed"}`);
      }

      const orderData = await orderRes.json();

      if (!orderData.success || !orderData.order) {
        throw new Error(`Order failed: ${orderData.message || "Unknown error"}`);
      }

      console.log(`✅ Order created: ${orderData.order.id}, Amount: ₹${orderData.order.amount / 100}`);

      // ═════════════════════════════════════════
      // STEP 2: OPEN RAZORPAY POPUP
      // ═════════════════════════════════════════
      console.log("💳 Opening Razorpay checkout...");

      // ✅ FIX: Prevent duplicate Razorpay instances
      let razorpayOpened = false;

      const options = {
        key: orderData.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "IARRD Astronomy Workshop",
        description: "Workshop Registration — விண்வெளில் ஒரு பயணம் 2.0",
        order_id: orderData.order.id,
        theme: { color: "#d4a853" },
        prefill: {
          email: formData.email,
          contact: formData.phone,
          name: formData.name
        },

        // ═════════════════════════════════════════
        // PAYMENT SUCCESS HANDLER
        // ═════════════════════════════════════════
        handler: async function (response) {
          console.log("✅ Payment completed by Razorpay");
          console.log(`   Payment ID: ${response.razorpay_payment_id}`);
          console.log(`   Order ID: ${response.razorpay_order_id}`);
          
          try {
            // ─────────────────────────────────────
            // STEP 3: VERIFY PAYMENT SIGNATURE
            // ─────────────────────────────────────
            console.log("🔐 Verifying payment signature...");
            
            let verifyRes;
            try {
              verifyRes = await fetch(`${BACKEND_URL}/api/payment/verify-payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response)
              });
            } catch (fetchErr) {
              // ✅ FIX: Network error in verification
              throw new Error(`Verification network error: ${fetchErr.message}`);
            }

            // ✅ FIX: Check HTTP status before parsing
            if (!verifyRes.ok) {
              const errText = await verifyRes.text();
              throw new Error(`Verification server error ${verifyRes.status}: ${errText}`);
            }

            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
              throw new Error(`Signature verification failed: ${verifyData.message}`);
            }

            console.log("✅ Payment signature verified!");

            // ─────────────────────────────────────
            // STEP 4: SAVE TO GOOGLE SHEETS
            // ─────────────────────────────────────
            console.log("📊 Saving to Google Sheets...");
            
            try {
              await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",  // ← Required for Google Apps Script
                headers: { "Content-Type": "text/plain" },  // ← Must be text/plain with no-cors
                body: JSON.stringify({
                  ...submission,
                  paymentStatus: "PAID",
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id
                })
              });
              console.log("✅ Google Sheets request sent (no-cors mode)");
            } catch (sheetsErr) {
              // ✅ FIX: no-cors always "fails" at client - that's OK
              console.warn("⚠️  Google Sheets response unreadable (expected with no-cors):", sheetsErr.message);
            }

            // ─────────────────────────────────────
            // STEP 5: REDIRECT TO SUCCESS
            // ─────────────────────────────────────
            console.log("⏳ Waiting for Google Sheets to process...");
            await new Promise(res => setTimeout(res, 1500));

            console.log("🚀 Redirecting to success page...");
            window.location.href = "success.html";

          } catch (err) {
            // ✅ FIX: Show error to user
            console.error("❌ Payment handler error:", err);
            spinner.style.display = "none";
            submitBtn.style.display = "inline-flex";
            errEl.style.display = "block";
            errEl.textContent = `❌ Error: ${err.message}`;
            errEl.style.color = "#e87878";
          }
        },

        // ═════════════════════════════════════════
        // PAYMENT FAILURE/DISMISS HANDLER
        // ═════════════════════════════════════════
        modal: {
          ondismiss: function () {
            console.log("⚠️  User dismissed payment popup");
            
            // ✅ FIX: Only reset if payment didn't complete
            if (spinner.style.display === "block") {
              spinner.style.display = "none";
              submitBtn.style.display = "inline-flex";
              errEl.style.display = "block";
              errEl.textContent = "Payment cancelled. Please try again.";
            }
          }
        }
      };

      // ✅ FIX: Single Razorpay instance (prevent duplicates)
      if (!razorpayOpened) {
        razorpayOpened = true;
        console.log("🎯 Creating Razorpay instance...");
        const razorpay = new Razorpay(options);
        razorpay.open();
      }

    } catch (e) {
      // ✅ FIX: Outer try-catch for all errors
      console.error("❌ Payment submission error:", e);
      spinner.style.display = "none";
      submitBtn.style.display = "inline-flex";
      errEl.style.display = "block";
      errEl.textContent = `❌ Error: ${e.message}`;
      errEl.style.color = "#e87878";
    }
  });

  // Helper functions (unchanged)
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

  function getField(r, ...keys) {
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

  function normalizeRow(r) {
    if (!normalizeRow._logged) {
      console.log("📋 Raw keys:", Object.keys(r));
      console.log("📋 First row:", r);
      normalizeRow._logged = true;
    }

    const m = {};
    for (const k of Object.keys(r)) {
      m[k.toLowerCase().trim()] = String(r[k] || "").trim();
    }

    const name = m["name"] || "";
    const email = m["email"] || "";
    const phone = m["phone"] || "";

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

    normalizeRow._logged = false;

    try {
      const res = await fetch(`${GOOGLE_SCRIPT_URL}?token=admin123`);
      const json = await res.json();
      const raw = Array.isArray(json) ? json : (json.data || []);

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