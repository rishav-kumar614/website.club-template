/* ═══════════════════════════════════════════════════════
   INFERNO PIZZA — app.js v3
   Real Three.js 3D Pizza Model + Scroll Engine
═══════════════════════════════════════════════════════ */

'use strict';

/* ── UTILITIES ── */
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));
const ease  = t => t < .5 ? 2*t*t : -1+(4-2*t)*t;
const easeOut = t => 1 - Math.pow(1-t, 3);
const easeOutBack = t => { const c1=1.70158, c3=c1+1; return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2); };

/* ══════════════════════════════════════════════════════
   ▓▓▓  3D PIZZA MODEL BUILDER  ▓▓▓
   Builds a real pizza from Three.js geometry primitives
══════════════════════════════════════════════════════ */
class Pizza3D {
  constructor() {
    this.group       = new THREE.Group();
    this.sliceGroups = [];   // 6 individual slice groups
    this.toppings    = [];   // all topping meshes
    this.sliceOpen   = 0;    // 0=closed, 1=exploded

    this._build();
  }

  _build() {
    const G = this.group;

    // ── MATERIALS ──
    const doughMat = new THREE.MeshStandardMaterial({
      color: 0xd4956a, roughness: 0.95, metalness: 0.0,
    });
    const crustMat = new THREE.MeshStandardMaterial({
      color: 0xb06030, roughness: 0.98, metalness: 0.0,
    });
    const sauceMat = new THREE.MeshStandardMaterial({
      color: 0xcc2200, roughness: 0.75, metalness: 0.05,
    });
    const cheeseMat = new THREE.MeshStandardMaterial({
      color: 0xf5e08a, roughness: 0.7, metalness: 0.05,
    });
    const pepMat = new THREE.MeshStandardMaterial({
      color: 0x8b1818, roughness: 0.65, metalness: 0.1,
    });
    const mushMat = new THREE.MeshStandardMaterial({
      color: 0xb8997a, roughness: 0.85, metalness: 0.0,
    });
    const basilMat = new THREE.MeshStandardMaterial({
      color: 0x2d8c3c, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide,
    });
    const oliveMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a, roughness: 0.7, metalness: 0.1,
    });
    const pepperMat = new THREE.MeshStandardMaterial({
      color: 0xe8a020, roughness: 0.7, metalness: 0.05,
    });

    // ── 6 SLICES ──
    for (let i = 0; i < 6; i++) {
      const sliceGroup = new THREE.Group();
      const angle      = (i / 6) * Math.PI * 2;
      const span       = (Math.PI * 2) / 6;

      // Dough wedge
      const doughGeo = new THREE.CylinderGeometry(2.75, 2.85, 0.22, 40, 1, false, angle, span);
      sliceGroup.add(new THREE.Mesh(doughGeo, doughMat));

      // Sauce on top
      const sauceGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.045, 40, 1, false, angle + 0.02, span - 0.04);
      const sauceMesh = new THREE.Mesh(sauceGeo, sauceMat);
      sauceMesh.position.y = 0.13;
      sliceGroup.add(sauceMesh);

      // Cheese blobs (4–5 per slice)
      const cheeseCount = 4 + Math.floor(Math.random() * 2);
      for (let c = 0; c < cheeseCount; c++) {
        const r     = 0.6 + Math.random() * 1.6;
        const theta = angle + 0.15 + Math.random() * (span - 0.3);
        const cx    = Math.cos(theta) * r;
        const cz    = Math.sin(theta) * r;
        const sx    = 0.22 + Math.random() * 0.28;
        const sz    = 0.18 + Math.random() * 0.22;
        const sy    = 0.08 + Math.random() * 0.06;
        const cGeo  = new THREE.SphereGeometry(1, 8, 6);
        cGeo.scale(sx, sy, sz);
        const cMesh = new THREE.Mesh(cGeo, cheeseMat);
        cMesh.position.set(cx, 0.18, cz);
        sliceGroup.add(cMesh);
        this.toppings.push(cMesh);
      }

      this.sliceGroups.push(sliceGroup);
      G.add(sliceGroup);
    }

    // ── CRUST RING (full) ──
    const crustGeo = new THREE.TorusGeometry(2.82, 0.26, 14, 80);
    crustGeo.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
    const crustMesh = new THREE.Mesh(crustGeo, crustMat);
    crustMesh.position.y = 0.0;
    G.add(crustMesh);

    // ── PEPPERONI (8 pieces) ──
    const pepPositions = [
      [1.0,  0.0], [-0.8, 1.3], [-1.5, -0.4], [0.3, -1.6],
      [1.8,  1.0], [-1.8, 0.8], [0.8, 1.8],   [-0.3, 0.6],
    ];
    pepPositions.forEach(([px, pz]) => {
      const pGeo  = new THREE.CylinderGeometry(0.32, 0.32, 0.09, 16);
      const pMesh = new THREE.Mesh(pGeo, pepMat);
      pMesh.position.set(px, 0.24, pz);
      G.add(pMesh);
      this.toppings.push(pMesh);

      // Pepperoni surface dots
      for (let d = 0; d < 4; d++) {
        const dotGeo  = new THREE.SphereGeometry(0.04, 6, 6);
        const dotMesh = new THREE.Mesh(dotGeo, new THREE.MeshStandardMaterial({ color: 0x6b0e0e, roughness: 0.8 }));
        const da = Math.random() * Math.PI * 2;
        const dr = Math.random() * 0.2;
        dotMesh.position.set(px + Math.cos(da)*dr, 0.29, pz + Math.sin(da)*dr);
        G.add(dotMesh);
      }
    });

    // ── MUSHROOMS (5 pieces) ──
    const mushPositions = [
      [0.0, 1.4, 0.5], [1.6, -0.8, 0.4], [-1.3, -1.0, 0.45],
      [1.2, 0.9, 0.42], [-0.5, -1.8, 0.38],
    ];
    mushPositions.forEach(([mx, mz, ms]) => {
      // Cap
      const capGeo  = new THREE.SphereGeometry(ms, 10, 8, 0, Math.PI*2, 0, Math.PI/2);
      const capMesh = new THREE.Mesh(capGeo, mushMat);
      capMesh.position.set(mx, 0.26, mz);
      capMesh.scale.y = 0.5;
      G.add(capMesh);
      // Stem
      const stemGeo  = new THREE.CylinderGeometry(0.06, 0.09, 0.15, 8);
      const stemMesh = new THREE.Mesh(stemGeo, new THREE.MeshStandardMaterial({ color: 0xd4b89a, roughness: 0.9 }));
      stemMesh.position.set(mx, 0.18, mz);
      G.add(stemMesh);
      this.toppings.push(capMesh, stemMesh);
    });

    // ── BELL PEPPERS (slices) ──
    const pepperSegs = [
      { x: -0.6, z: 1.0,  rot: 0.3,  color: 0xe84040 },
      { x:  1.4, z: -1.2, rot: -0.8, color: 0xf5c400 },
      { x: -1.6, z: 0.2,  rot: 1.2,  color: 0x40c040 },
      { x:  0.2, z: -0.8, rot: 0.6,  color: 0xf5c400 },
    ];
    pepperSegs.forEach(({ x, z, rot, color }) => {
      const geo  = new THREE.TorusGeometry(0.22, 0.06, 6, 12, Math.PI * 0.75);
      const mat  = new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.05 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0.27, z);
      mesh.rotation.x = Math.PI / 2;
      mesh.rotation.z = rot;
      G.add(mesh);
      this.toppings.push(mesh);
    });

    // ── BASIL LEAVES (4 pieces) ──
    const basilPositions = [
      [0.3,  1.2,  0.2 ], [-1.0, 0.8, -0.4],
      [1.3, -0.5, -0.15], [-0.4, -1.3, 0.3],
    ];
    basilPositions.forEach(([bx, bz, br]) => {
      const geo  = new THREE.EllipseCurve(0, 0, 0.32, 0.2, 0, Math.PI*2, false, 0);
      const pts  = geo.getPoints(16);
      const shp  = new THREE.Shape(pts);
      const bGeo = new THREE.ShapeGeometry(shp);
      const bMesh = new THREE.Mesh(bGeo, basilMat);
      bMesh.position.set(bx, 0.3, bz);
      bMesh.rotation.x = -Math.PI / 2;
      bMesh.rotation.z = br;
      G.add(bMesh);
      this.toppings.push(bMesh);

      // Leaf vein
      const vGeo  = new THREE.PlaneGeometry(0.5, 0.015);
      const vMesh = new THREE.Mesh(vGeo, new THREE.MeshStandardMaterial({ color: 0x1a6b28, roughness: 0.9, side: THREE.DoubleSide }));
      vMesh.position.set(bx, 0.305, bz);
      vMesh.rotation.x = -Math.PI / 2;
      vMesh.rotation.z = br;
      G.add(vMesh);
    });

    // ── OLIVES (3 pieces) ──
    [[-0.9, -0.4], [1.0, 0.5], [-0.2, 1.7]].forEach(([ox, oz]) => {
      const geo  = new THREE.TorusGeometry(0.18, 0.09, 10, 16);
      const mesh = new THREE.Mesh(geo, oliveMat);
      mesh.position.set(ox, 0.25, oz);
      mesh.rotation.x = Math.PI / 2;
      G.add(mesh);
      // Olive center fill
      const fillGeo  = new THREE.CylinderGeometry(0.09, 0.09, 0.09, 12);
      const fillMat  = new THREE.MeshStandardMaterial({ color: 0xcc3300, roughness: 0.7 });
      const fillMesh = new THREE.Mesh(fillGeo, fillMat);
      fillMesh.position.set(ox, 0.25, oz);
      fillMesh.rotation.x = Math.PI / 2;
      G.add(fillMesh);
      this.toppings.push(mesh, fillMesh);
    });

    // Tilt the whole pizza slightly for dramatic view
    G.rotation.x = -0.15;
  }

  /* Open / close slices (0 = together, 1 = exploded) */
  setSliceOpen(t) {
    this.sliceOpen = t;
    const easedT = easeOut(t);
    this.sliceGroups.forEach((sg, i) => {
      const angle  = (i / 6) * Math.PI * 2;
      const spread = easedT * 1.4;
      sg.position.x = Math.cos(angle) * spread;
      sg.position.z = Math.sin(angle) * spread;
      sg.position.y = easedT * 0.2 * Math.sin(i * 1.3);
      sg.rotation.y = easedT * (i % 2 === 0 ? 0.15 : -0.15);
    });
  }
}

/* ══════════════════════════════════════════════════════
   ▓▓▓  HERO MINI 3D PIZZA (floating in hero section) ▓▓▓
══════════════════════════════════════════════════════ */
function initHeroPizza() {
  const canvas = document.getElementById('hero-pizza-canvas');
  if (!canvas || !window.THREE) return;

  const W = canvas.parentElement.offsetWidth  || 480;
  const H = canvas.parentElement.offsetHeight || 480;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
  renderer.toneMapping       = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene  = new THREE.Scene();
  scene.fog    = new THREE.FogExp2(0x0d0d0d, 0.08);

  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 50);
  camera.position.set(0, 4.5, 5.5);
  camera.lookAt(0, 0, 0);

  // Lights
  const ambient = new THREE.AmbientLight(0xffddbb, 0.5);
  scene.add(ambient);

  const keyLight = new THREE.PointLight(0xff6030, 3.5, 18);
  keyLight.position.set(3, 6, 4);
  keyLight.castShadow = true;
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0x3366ff, 1.0, 20);
  fillLight.position.set(-5, 2, -3);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xff4422, 1.5, 15);
  rimLight.position.set(0, -3, -5);
  scene.add(rimLight);

  // Build pizza
  const pizza = new Pizza3D();
  pizza.group.scale.setScalar(0.72);
  scene.add(pizza.group);

  // Shadow disc on floor
  const shadowGeo = new THREE.CircleGeometry(2.5, 32);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0xe63946, transparent: true, opacity: 0.12 });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = -1.2;
  scene.add(shadowDisc);

  // Background glow particles
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(150 * 3);
  for (let i = 0; i < 150 * 3; i++) starPos[i] = (Math.random() - .5) * 14;
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xf4833d, size: 0.06, transparent: true, opacity: .35 })));

  let mouseX = 0, mouseY = 0;
  canvas.parentElement.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouseX = ((e.clientX - r.left) / r.width  - 0.5) * 2;
    mouseY = ((e.clientY - r.top)  / r.height - 0.5) * 2;
  });

  let t = 0;
  (function loop() {
    requestAnimationFrame(loop);
    t += 0.008;

    // Auto-rotate + mouse tilt
    pizza.group.rotation.y += 0.006;
    pizza.group.rotation.x = lerp(pizza.group.rotation.x, mouseY * 0.25 - 0.15, 0.05);
    pizza.group.rotation.z = lerp(pizza.group.rotation.z, mouseX * -0.12, 0.05);

    // Float up/down
    pizza.group.position.y = Math.sin(t) * 0.12;

    // Animate key light
    keyLight.position.x = Math.sin(t * 0.5) * 4;
    keyLight.position.z = Math.cos(t * 0.5) * 4;

    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', () => {
    const nW = canvas.parentElement.offsetWidth;
    const nH = canvas.parentElement.offsetHeight;
    camera.aspect = nW / nH;
    camera.updateProjectionMatrix();
    renderer.setSize(nW, nH);
  }, { passive: true });
}

/* ══════════════════════════════════════════════════════
   ▓▓▓  4K PIZZA FRAME-SCRUB ENGINE (192 FRAMES)  ▓▓▓
   Driven by user scroll through #story3d
   Source: pizza_4k_frames.zip (frame_0001.jpg - frame_0192.jpg)
══════════════════════════════════════════════════════ */
function initScrollPizza() {
  const section    = document.getElementById('hero');
  const canvas     = document.getElementById('hero-frame-canvas');
  const progFill   = document.getElementById('tracker-fill');
  const stageName  = document.getElementById('tracker-stage-name');
  const stagePct   = document.getElementById('tracker-pct');
  const stepPills  = document.querySelectorAll('.step-pill');
  const dynamicDesc = document.getElementById('hero-dynamic-desc');

  if (!section || !canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const TOTAL_FRAMES = 192;
  const frames = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let firstFrameRendered = false;

  // Frame URL generator: frames/frame_0001.jpg -> frame_0192.jpg
  const getFrameUrl = i => `frames/frame_${String(i + 1).padStart(4, '0')}.jpg`;

  // Sizing canvas to match viewport and display DPI
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.parentElement ? canvas.parentElement.offsetWidth : window.innerWidth;
    const h = canvas.parentElement ? canvas.parentElement.offsetHeight : window.innerHeight;

    const targetW = Math.round(w * dpr);
    const targetH = Math.round(h * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width  = targetW;
      canvas.height = targetH;
    }
    renderCurrentFrame();
  }

  // Cover-fit drawing logic preserving composition
  function drawImageCover(img) {
    if (!img || !img.complete || !img.naturalWidth) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const scale = Math.max(cw / iw, ch / ih);
    const nw = iw * scale;
    const nh = ih * scale;

    // Align pizza nicely on the right (82% on desktop, 72% on mobile)
    const isMobile = window.innerWidth <= 768;
    const alignX = isMobile ? 0.72 : 0.82;
    const alignY = isMobile ? 0.35 : 0.50;

    const nx = (cw - nw) * alignX;
    const ny = (ch - nh) * alignY;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, nx, ny, nw, nh);
  }

  // Preloading system:
  // 1. Frame 0 (frame_0001.jpg) loaded immediately
  // 2. Keyframes loaded next for snappy scrubbing
  // 3. All intermediate frames loaded in background
  function preloadImages() {
    const firstImg = new Image();
    firstImg.src = getFrameUrl(0);
    firstImg.onload = () => {
      frames[0] = firstImg;
      loadedCount++;
      if (!firstFrameRendered) {
        firstFrameRendered = true;
        drawImageCover(firstImg);
      }
    };
    frames[0] = firstImg;

    // Preload keyframes (every 4th frame)
    const keyIndices = [];
    for (let i = 4; i < TOTAL_FRAMES; i += 4) {
      keyIndices.push(i);
    }

    keyIndices.forEach(i => {
      const img = new Image();
      img.src = getFrameUrl(i);
      img.onload = () => {
        frames[i] = img;
        loadedCount++;
      };
      frames[i] = img;
    });

    // Preload remaining frames
    setTimeout(() => {
      for (let i = 1; i < TOTAL_FRAMES; i++) {
        if (frames[i]) continue;
        const img = new Image();
        img.src = getFrameUrl(i);
        img.onload = () => {
          frames[i] = img;
          loadedCount++;
        };
        frames[i] = img;
      }
    }, 150);
  }

  // Fallback search to guarantee zero blank frames during scrub
  function getNearestLoadedFrame(targetIdx) {
    targetIdx = clamp(targetIdx, 0, TOTAL_FRAMES - 1);
    if (frames[targetIdx] && frames[targetIdx].complete && frames[targetIdx].naturalWidth) {
      return frames[targetIdx];
    }
    for (let delta = 1; delta < TOTAL_FRAMES; delta++) {
      const lower = targetIdx - delta;
      if (lower >= 0 && frames[lower] && frames[lower].complete && frames[lower].naturalWidth) {
        return frames[lower];
      }
      const upper = targetIdx + delta;
      if (upper < TOTAL_FRAMES && frames[upper] && frames[upper].complete && frames[upper].naturalWidth) {
        return frames[upper];
      }
    }
    return null;
  }

  let targetProgress = 0;
  let currentProgress = 0;
  let currentFrameIndex = 0;
  let activePhase = -1;

  const STAGE_DATA = [
    {
      title: 'STAGE 01 · 48H FERMENTED DOUGH',
      desc: 'Cold-fermented for 48 hours, our handcrafted dough is hand-stretched on floured slate into an airy Neapolitan base.'
    },
    {
      title: 'STAGE 02 · SAN MARZANO TOMATO SAUCE',
      desc: 'Crushed by hand and swirled in a signature spiral from the center outward, capturing sweet volcanic acidity.'
    },
    {
      title: 'STAGE 03 · FRESH ARTISANAL TOPPINGS',
      desc: 'Fresh DOP mozzarella, hand-sliced spicy pepperoni, earthy forest mushrooms, and sweet bell peppers rained onto the base.'
    },
    {
      title: 'STAGE 04 · WOOD-FIRED MASTERPIECE',
      desc: 'Crowned with garden-fresh basil leaves and extra virgin olive oil. Ready for its 90-second kiss in our 900°F oven.'
    }
  ];

  function getScrollProgress() {
    const rect = section.getBoundingClientRect();
    const scrollDistance = section.offsetHeight - window.innerHeight;
    if (scrollDistance <= 0) return 0;
    return clamp(-rect.top / scrollDistance, 0, 1);
  }

  function renderCurrentFrame() {
    const img = getNearestLoadedFrame(currentFrameIndex);
    if (img) drawImageCover(img);
  }

  function updateUI(p) {
    const pct = Math.round(p * 100);
    if (progFill) progFill.style.width = `${pct}%`;
    if (stagePct) stagePct.textContent = `${pct}%`;

    const phase = clamp(Math.floor(p * 4), 0, 3);
    if (phase !== activePhase) {
      activePhase = phase;
      const data = STAGE_DATA[phase];

      if (stageName && data) stageName.textContent = data.title;
      
      if (dynamicDesc && data) {
        dynamicDesc.style.opacity = '0';
        setTimeout(() => {
          dynamicDesc.textContent = data.desc;
          dynamicDesc.style.opacity = '1';
        }, 180);
      }

      stepPills.forEach((pill, i) => {
        pill.classList.toggle('active', i === phase);
      });
    }
  }

  // Animation Loop with smooth lerping
  function tick() {
    requestAnimationFrame(tick);

    targetProgress = getScrollProgress();
    currentProgress = lerp(currentProgress, targetProgress, 0.16);
    if (Math.abs(currentProgress - targetProgress) < 0.0002) {
      currentProgress = targetProgress;
    }

    const nextFrameIndex = clamp(Math.floor(currentProgress * (TOTAL_FRAMES - 1)), 0, TOTAL_FRAMES - 1);

    if (nextFrameIndex !== currentFrameIndex || !firstFrameRendered) {
      currentFrameIndex = nextFrameIndex;
      const img = getNearestLoadedFrame(currentFrameIndex);
      if (img) {
        drawImageCover(img);
        firstFrameRendered = true;
      }
    }

    updateUI(currentProgress);
  }

  // Step pills click: smoothly scrolls user to that crafting stage
  stepPills.forEach((pill, i) => {
    pill.addEventListener('click', () => {
      const scrollDistance = section.offsetHeight - window.innerHeight;
      const targetScroll = section.offsetTop + (i / 3) * scrollDistance;
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    });
  });

  window.addEventListener('resize', resizeCanvas, { passive: true });
  window.addEventListener('scroll', () => {
    targetProgress = getScrollProgress();
  }, { passive: true });

  resizeCanvas();
  preloadImages();
  tick();
}

/* ══════════════════════════════════════════════════════
   ▓▓▓  MENU PIZZA 240-FRAME FULL-BLEED ENGINE  ▓▓▓
   Full background video scrubbing driven by scroll
   Source: 2nd pizza.mp4 (menu_frames/frame_0001.jpg - frame_0240.jpg)
══════════════════════════════════════════════════════ */
function initMenuPizzaScrub() {
  const section    = document.getElementById('menu');
  const canvas     = document.getElementById('menu-frame-canvas');
  const stageTitle = document.getElementById('menu-stage-title');
  const scrubFill  = document.getElementById('menu-scrub-fill');

  if (!section || !canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const TOTAL_FRAMES = 240;
  const frames = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let firstFrameRendered = false;

  const getFrameUrl = i => `menu_frames/frame_${String(i + 1).padStart(4, '0')}.jpg`;

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.parentElement ? canvas.parentElement.offsetWidth : window.innerWidth;
    const h = canvas.parentElement ? canvas.parentElement.offsetHeight : window.innerHeight;

    const targetW = Math.round(w * dpr);
    const targetH = Math.round(h * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    renderCurrentFrame();
  }

  function drawImageCover(img) {
    if (!img || !img.complete || !img.naturalWidth) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const scale = Math.max(cw / iw, ch / ih);
    const nw = iw * scale;
    const nh = ih * scale;

    // Align pizza to the right (80% on desktop, 65% on mobile)
    const isMobile = window.innerWidth <= 768;
    const alignX = isMobile ? 0.65 : 0.80;
    const alignY = 0.50;

    const nx = (cw - nw) * alignX;
    const ny = (ch - nh) * alignY;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, nx, ny, nw, nh);
  }

  function preloadImages() {
    // Frame 0 loaded immediately
    const firstImg = new Image();
    firstImg.src = getFrameUrl(0);
    firstImg.onload = () => {
      frames[0] = firstImg;
      loadedCount++;
      if (!firstFrameRendered) {
        firstFrameRendered = true;
        drawImageCover(firstImg);
      }
    };
    frames[0] = firstImg;

    // Preload keyframes (every 5th frame)
    for (let i = 5; i < TOTAL_FRAMES; i += 5) {
      const img = new Image();
      img.src = getFrameUrl(i);
      img.onload = () => {
        frames[i] = img;
        loadedCount++;
      };
      frames[i] = img;
    }

    // Preload remaining frames
    setTimeout(() => {
      for (let i = 1; i < TOTAL_FRAMES; i++) {
        if (frames[i]) continue;
        const img = new Image();
        img.src = getFrameUrl(i);
        img.onload = () => {
          frames[i] = img;
          loadedCount++;
        };
        frames[i] = img;
      }
    }, 200);
  }

  function getNearestLoadedFrame(targetIdx) {
    targetIdx = clamp(targetIdx, 0, TOTAL_FRAMES - 1);
    if (frames[targetIdx] && frames[targetIdx].complete && frames[targetIdx].naturalWidth) {
      return frames[targetIdx];
    }
    for (let delta = 1; delta < TOTAL_FRAMES; delta++) {
      const lower = targetIdx - delta;
      if (lower >= 0 && frames[lower] && frames[lower].complete && frames[lower].naturalWidth) {
        return frames[lower];
      }
      const upper = targetIdx + delta;
      if (upper < TOTAL_FRAMES && frames[upper] && frames[upper].complete && frames[upper].naturalWidth) {
        return frames[upper];
      }
    }
    return null;
  }

  let targetProgress = 0;
  let currentProgress = 0;
  let currentFrameIndex = 0;

  const STAGES = [
    'STAGE 01 · FRESH DOUGH & ARTISAN TOPPINGS',
    'STAGE 02 · 900°F BLISTERING CRUST',
    'STAGE 03 · BUBBLING FIOR DI LATTE',
    'STAGE 04 · THE ULTIMATE CHEESE PULL'
  ];

  function getScrollProgress() {
    const rect = section.getBoundingClientRect();
    const scrollDistance = section.offsetHeight - window.innerHeight;
    if (scrollDistance <= 0) return 0;
    return clamp(-rect.top / scrollDistance, 0, 1);
  }

  function renderCurrentFrame() {
    const img = getNearestLoadedFrame(currentFrameIndex);
    if (img) drawImageCover(img);
  }

  function updateUI(p) {
    const pct = Math.round(p * 100);
    if (scrubFill) scrubFill.style.width = `${pct}%`;

    const phase = clamp(Math.floor(p * 4), 0, 3);
    if (stageTitle) stageTitle.textContent = STAGES[phase];
  }

  function tick() {
    requestAnimationFrame(tick);

    targetProgress = getScrollProgress();
    currentProgress = lerp(currentProgress, targetProgress, 0.14);
    if (Math.abs(currentProgress - targetProgress) < 0.0002) {
      currentProgress = targetProgress;
    }

    const nextFrameIndex = clamp(Math.floor(currentProgress * (TOTAL_FRAMES - 1)), 0, TOTAL_FRAMES - 1);

    if (nextFrameIndex !== currentFrameIndex || !firstFrameRendered) {
      currentFrameIndex = nextFrameIndex;
      const img = getNearestLoadedFrame(currentFrameIndex);
      if (img) {
        drawImageCover(img);
        firstFrameRendered = true;
      }
    }

    updateUI(currentProgress);
  }

  window.addEventListener('resize', resizeCanvas, { passive: true });
  window.addEventListener('scroll', () => {
    targetProgress = getScrollProgress();
  }, { passive: true });

  resizeCanvas();
  preloadImages();
  tick();
}

/* ══════════════════════════════════════════════════════
   ▓▓▓  HERO BACKGROUND (Three.js rings)  ▓▓▓
══════════════════════════════════════════════════════ */
function initHeroBackground() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || !window.THREE) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 6;

  const colors = [0xe63946, 0xf4833d, 0xf7b731];
  const rings  = [];
  for (let i = 0; i < 9; i++) {
    const geo  = new THREE.TorusGeometry(Math.random()*2+0.5, 0.022, 10, 80);
    const mat  = new THREE.MeshBasicMaterial({ color: colors[i%3], transparent: true, opacity: 0.1 + Math.random()*0.08 });
    const m    = new THREE.Mesh(geo, mat);
    m.position.set((Math.random()-.5)*8, (Math.random()-.5)*5, (Math.random()-.5)*3 - 1);
    m.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
    m._sx = (Math.random()-.5)*.003; m._sy = (Math.random()-.5)*.003;
    scene.add(m); rings.push(m);
  }
  const pts = new Float32Array(200*3);
  for (let i = 0; i < 200*3; i++) pts[i] = (Math.random()-.5)*20;
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xf4833d, size: 0.05, transparent: true, opacity: .35 })));

  (function loop() {
    requestAnimationFrame(loop);
    rings.forEach(r => { r.rotation.x += r._sx; r.rotation.y += r._sy; });
    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, { passive: true });
}

/* ══════════════════════════════════════════════════════
   ▓▓▓  PARTICLE SYSTEM (hero)  ▓▓▓
══════════════════════════════════════════════════════ */
function initParticles() {
  const c = document.getElementById('particles');
  if (!c) return;
  const colors = ['#e63946','#f4833d','#f7b731','rgba(255,255,255,.4)'];
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const s = Math.random()*5+2;
    p.style.cssText = `width:${s}px;height:${s}px;left:${Math.random()*100}%;top:${Math.random()*100}%;background:${colors[i%4]};--dur:${Math.random()*8+5}s;--delay:${Math.random()*8}s`;
    c.appendChild(p);
  }
}

/* ══════════════════════════════════════════════════════
   ▓▓▓  NAVBAR  ▓▓▓
══════════════════════════════════════════════════════ */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

const hamburger = document.getElementById('hamburger');
const navLinks  = document.querySelector('.nav-links');
hamburger?.addEventListener('click', () => {
  navLinks.classList.toggle('mobile-open');
  hamburger.classList.toggle('open');
});
document.querySelectorAll('.nav-links a').forEach(a =>
  a.addEventListener('click', () => navLinks?.classList.remove('mobile-open'))
);

/* ═══════════════════════════════════
   MENU FILTER
═══════════════════════════════════ */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    document.querySelectorAll('.pizza-card').forEach(c =>
      c.classList.toggle('hidden', f !== 'all' && c.dataset.category !== f)
    );
  });
});

/* ═══════════════════════════════════
   CART
═══════════════════════════════════ */
const cart = [];
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}
function renderCart() {
  const ci = document.getElementById('cart-items');
  const ct = document.getElementById('cart-total');
  const ta = document.getElementById('total-amount');
  if (!ci) return;
  if (!cart.length) { ci.innerHTML = '<p class="cart-empty">No items yet — add from the menu!</p>'; ct.style.display='none'; return; }
  ci.innerHTML = cart.map((it,i) =>
    `<div class="cart-item"><span>${it.name}</span><span style="color:var(--red);font-weight:600">$${it.price}</span><button class="cart-item-remove" onclick="removeFromCart(${i})">✕</button></div>`
  ).join('');
  ta.textContent = `$${cart.reduce((s,i)=>s+parseFloat(i.price),0).toFixed(2)}`;
  ct.style.display = 'flex';
}
window.removeFromCart = i => { cart.splice(i,1); renderCart(); showToast('Item removed'); };
document.querySelectorAll('.quick-add').forEach(btn =>
  btn.addEventListener('click', () => {
    cart.push({ name: btn.dataset.name, price: btn.dataset.price });
    renderCart(); showToast(`🍕 ${btn.dataset.name} added!`);
  })
);

/* ═══════════════════════════════════
   ORDER
═══════════════════════════════════ */
window.selectOption = type => {
  document.querySelectorAll('.order-option').forEach(o => o.classList.remove('active'));
  document.getElementById(`opt-${type}`)?.classList.add('active');
  const ag = document.getElementById('address-group');
  if (ag) ag.style.display = type === 'delivery' ? 'flex' : 'none';
};
window.submitOrder = e => {
  e.preventDefault();
  const btn = document.getElementById('submit-btn');
  const lbl = document.getElementById('btn-label');
  btn.disabled = true; lbl.textContent = '⏳ Placing Order...';
  setTimeout(() => {
    lbl.textContent = '✅ Order Confirmed! 🔥';
    btn.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
    showToast('🔥 Your pizza is on its way!');
    setTimeout(() => {
      lbl.textContent = 'Place Order 🍕';
      btn.style.background = ''; btn.disabled = false;
      document.getElementById('order-form').reset();
      cart.length = 0; renderCart();
    }, 4000);
  }, 1800);
};

/* ═══════════════════════════════════
   COUNTDOWN
═══════════════════════════════════ */
let h=2, m=44, s=59;
const pad = n => String(n).padStart(2,'0');
setInterval(() => {
  if(--s<0){s=59;if(--m<0){m=59;if(--h<0){h=2;m=59;s=59;}}}
  const th=document.getElementById('timer-h');
  const tm=document.getElementById('timer-m');
  const ts=document.getElementById('timer-s');
  if(th)th.textContent=pad(h);
  if(tm)tm.textContent=pad(m);
  if(ts)ts.textContent=pad(s);
}, 1000);

/* ═══════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════ */
const io = new IntersectionObserver(entries =>
  entries.forEach((e,i) => { if(e.isIntersecting) setTimeout(()=>e.target.classList.add('visible'), i*80); }),
  { threshold: 0.1 }
);
document.querySelectorAll('.pizza-card,.testimonial-card,.about-grid,.section-header').forEach(el => {
  el.classList.add('reveal'); io.observe(el);
});

/* ═══════════════════════════════════
   ACTIVE NAV
═══════════════════════════════════ */
window.addEventListener('scroll', () => {
  const sy = window.scrollY + 120;
  document.querySelectorAll('section[id]').forEach(sec => {
    const link = document.querySelector(`.nav-links a[href="#${sec.id}"]`);
    if (link) link.style.color = (sy>=sec.offsetTop && sy<sec.offsetTop+sec.offsetHeight) ? 'var(--red)' : '';
  });
}, { passive: true });

/* ── MOBILE NAV ── */
const ms = document.createElement('style');
ms.textContent = `
  .nav-links.mobile-open{display:flex!important;position:fixed;inset:0;background:rgba(13,13,13,.97);backdrop-filter:blur(20px);flex-direction:column;align-items:center;justify-content:center;gap:2.5rem;z-index:999}
  .nav-links.mobile-open a{font-size:1.75rem;font-weight:700}
  .hamburger.open span:nth-child(1){transform:rotate(45deg) translate(5px,5px)}
  .hamburger.open span:nth-child(2){opacity:0}
  .hamburger.open span:nth-child(3){transform:rotate(-45deg) translate(5px,-5px)}
  @keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
`;
document.head.appendChild(ms);

/* ══════════════════════════════════════════════════════
   ▓▓▓  INIT ALL  ▓▓▓
══════════════════════════════════════════════════════ */
// Video playback assurance & Three.js 3D Scroll story initialization
function initHeroVideo() {
  const video = document.getElementById('hero-video');
  if (!video) return;

  // Ensure muted and playsinline for mobile & modern browsers autoplay policy
  video.muted = true;
  video.playsInline = true;

  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch(err => {
      // Autoplay with sound restricted, retry muted or wait for user touch/click
      console.log('Video autoplay waiting for interaction:', err);
      const startVideoOnTouch = () => {
        video.play().catch(() => {});
        document.removeEventListener('touchstart', startVideoOnTouch);
        document.removeEventListener('click', startVideoOnTouch);
      };
      document.addEventListener('touchstart', startVideoOnTouch, { passive: true });
      document.addEventListener('click', startVideoOnTouch, { passive: true });
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  initHeroVideo();
  if (typeof initScrollPizza === 'function') {
    initScrollPizza();
  }
  if (typeof initMenuPizzaScrub === 'function') {
    initMenuPizzaScrub();
  }
});

window.addEventListener('load', () => {
  initHeroVideo();
});
