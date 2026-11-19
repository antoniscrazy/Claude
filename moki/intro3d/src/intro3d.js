// Moki Mega-Intro in 3D (Three.js). Wird von megaintro.js benutzt, wenn WebGL da ist. Sonst laeuft die 2D-Version.
// Alles ist eine reine Funktion der Zeit: render(t) zeichnet exakt Sekunde t (so lassen sich Bilder pruefen und die Tab-Pause bleibt sauber).
// Szenen: Logo (3D-Roehre mit Spiegelung, wird von einem leuchtenden Stift gezeichnet) -> Titel (3D-Buchstaben) -> "Das ist neu" (Kartenkugel im Hintergrund)
//        -> Flug durch den Tunnel aus allen Spielkarten -> "Leider raus" (rotes Dunkel) -> Hyperflug zur Kugel aus allen Karten -> Logo.
// Text und Zaehler zeichnet megaintro.js als 2D-Ebene darueber.
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import fontJson from "three/examples/fonts/helvetiker_bold.typeface.json";

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const eo = t => 1 - Math.pow(1 - clamp(t), 3);
const eo4 = t => 1 - Math.pow(1 - clamp(t), 4);
const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const back = t => { t = clamp(t); const s = 2; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
const rnd = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const MINT = 0x00e5a8, GOLD = 0xffd23f;
const B = .46875, kick = t => Math.exp(-((t % B) / B) * 6);

export function create(o) {
  const { host, games, gone, images, segs, T, plan } = o;
  let W = host.clientWidth || innerWidth, H = host.clientHeight || innerHeight;
  const small = Math.min(W, H) < 700;
  const pr = Math.min(devicePixelRatio || 1, small ? 1.25 : 1.5);

  // ---------- Renderer, Szene, Kamera ----------
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .85;
  const cvs = renderer.domElement; cvs.className = "mi-gl"; host.prepend(cvs);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03040c); scene.fog = new THREE.FogExp2(0x03040c, .02);
  const camera = new THREE.PerspectiveCamera(48, W / H, .1, 700);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .45;

  const key = new THREE.DirectionalLight(0xffffff, .7); key.position.set(4, 6, 7); scene.add(key, key.target);
  const rimA = new THREE.PointLight(MINT, 30, 40, 1.6), rimB = new THREE.PointLight(GOLD, 24, 40, 1.6); scene.add(rimA, rimB);

  // ---------- Nachbearbeitung: Leuchten (Bloom), Farbsaum, Vignette, Filmkorn ----------
  const composer = new EffectComposer(renderer); composer.setPixelRatio(pr); composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), .5, .5, .92); composer.addPass(bloom);
  const post = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uAber: { value: .0012 }, uVig: { value: .6 }, uGrain: { value: .05 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uAber, uVig, uGrain; varying vec2 vUv;
      void main(){ vec2 c = vUv - .5; float d = length(c); vec2 off = c * d * uAber * 6.0;
        vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
        col *= 1.0 - uVig * smoothstep(.3, .95, d * 1.3);
        float n = fract(sin(dot(vUv * vec2(1234.5, 4321.7) + uTime, vec2(12.9898, 78.233))) * 43758.5453);
        col += (n - .5) * uGrain;
        gl_FragColor = vec4(col, 1.0); }`
  });
  composer.addPass(post);
  composer.addPass(new OutputPass());

  // ---------- Staub (Tiefe und Geschwindigkeit) ----------
  const dustN = small ? 1800 : 3200, dp = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) { dp[i * 3] = (rnd(i) - .5) * 30; dp[i * 3 + 1] = (rnd(i + 7) - .5) * 20; dp[i * 3 + 2] = 40 - rnd(i + 13) * 420; }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xbfe9ff, size: .045, sizeAttenuation: true, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(dust);

  // ---------- Logo als 3D-Roehre ----------
  const S = 8 / 392;   // Logo-Einheiten -> Welt (Breite 8)
  const msvg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); msvg.setAttribute("aria-hidden", "true"); msvg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden"; host.appendChild(msvg);
  const cA = new THREE.Color(MINT), cB = new THREE.Color(GOLD), tmpC = new THREE.Color();
  const SPH = new THREE.SphereGeometry(1, 16, 12), CYL = new THREE.CylinderGeometry(1, 1, 1, 16, 1, true);
  const R = 12;
  const logoSegs = segs.map(sg => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "path"); el.setAttribute("d", sg.d); msvg.appendChild(el);
    const len = el.getTotalLength(), n = Math.max(6, Math.ceil(len / 6)), pts = [];
    for (let i = 0; i <= n; i++) { const p = el.getPointAtLength(len * i / n); pts.push([p.x - 182, p.y - 65]); }
    const parts = [], cum = []; let acc = 0;
    for (let i = 0; i <= n; i++) {
      const s = SPH.clone(); s.scale(R, R, R); s.translate(pts[i][0], pts[i][1], 0); parts.push(s); acc += s.index.count;
      if (i < n) {
        const a = new THREE.Vector3(pts[i][0], pts[i][1], 0), b = new THREE.Vector3(pts[i + 1][0], pts[i + 1][1], 0), dir = b.clone().sub(a), l = dir.length();
        if (l > 1e-3) { const c = CYL.clone(); c.scale(R, l, R); c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())); c.translate((a.x + b.x) / 2, (a.y + b.y) / 2, 0); parts.push(c); acc += c.index.count; }
      }
      cum.push(acc);
    }
    parts.forEach(g => { const p = g.attributes.position, c = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { tmpC.lerpColors(cA, cB, clamp((p.getX(i) + 182) / 362)); c[i * 3] = tmpC.r; c[i * 3 + 1] = tmpC.g; c[i * 3 + 2] = tmpC.b; } g.setAttribute("color", new THREE.BufferAttribute(c, 3)); });
    const geo = mergeGeometries(parts);
    return { sg, el, len, n, pts, cum, geo };
  });
  const shellMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, metalness: .35, roughness: .2, clearcoat: 1, clearcoatRoughness: .08, envMapIntensity: 1.0 });
  shellMat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n totalEmissiveRadiance += vColor.rgb * 0.32;"); };
  const mirrorMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .2, depthWrite: false });
  const triShape = new THREE.Shape([new THREE.Vector2(1, 1), new THREE.Vector2(25, 17), new THREE.Vector2(1, 33)]);
  const triGeo = new THREE.ExtrudeGeometry(triShape, { depth: 10, bevelEnabled: true, bevelThickness: 3, bevelSize: 3, bevelSegments: 2 }); triGeo.translate(-9, -17, -5);
  const triMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.0, roughness: .3 });
  const dotGeo = new THREE.SphereGeometry(14, 20, 16), dotMat = new THREE.MeshStandardMaterial({ color: GOLD, emissive: GOLD, emissiveIntensity: .6, roughness: .25, metalness: .2 });
  function assembleLogo(mirror) {
    const g = new THREE.Group(), meshes = logoSegs.map(ls => { const m = new THREE.Mesh(ls.geo, mirror ? mirrorMat : shellMat); g.add(m); return m; });
    const tri = new THREE.Mesh(triGeo, mirror ? new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .25, depthWrite: false }) : triMat); tri.position.set(9, 17, 0); g.add(tri);
    const dot = new THREE.Mesh(dotGeo, mirror ? new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: .25, depthWrite: false }) : dotMat); dot.position.set(168, -59, 0); g.add(dot);
    g.scale.set(S, mirror ? S : -S, S);   // SVG-y zeigt nach unten
    return { g, meshes, tri, dot };
  }
  const logo = new THREE.Group(), main = assembleLogo(false), refl = assembleLogo(true), floorY = -1.5;
  refl.g.position.y = 2 * floorY; logo.add(main.g, refl.g); scene.add(logo);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x010209, roughness: .55, metalness: .2, envMapIntensity: .08, transparent: true, opacity: .92 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = floorY; scene.add(floor);
  const logoLocal = (x, y) => new THREE.Vector3(x * S, -y * S, 0);
  const headAt = tl => {   // Stiftspitze (Logo-Koordinaten) zur Logo-Zeit tl
    let act = null;
    for (const ls of logoSegs) { const p = (tl - ls.sg.t0) / (ls.sg.t1 - ls.sg.t0); if (p > 0 && p < 1) act = { ls, p }; }
    if (!act) return null;
    const pt = act.ls.el.getPointAtLength(act.ls.len * eio(act.p)); return [pt.x - 182, pt.y - 65];
  };
  function setLogo(tl) {   // Logo-Zeit tl: Striche, Dreieck, Punkt
    logoSegs.forEach((ls, i) => {
      const p = eio((tl - ls.sg.t0) / (ls.sg.t1 - ls.sg.t0)), j = Math.floor(p * ls.n);
      ls.geo.setDrawRange(0, p <= .002 ? 0 : ls.cum[Math.min(ls.n, j)]);
      main.meshes[i].visible = refl.meshes[i].visible = p > .002;
    });
    const tk = tl > 1.62 ? back((tl - 1.62) / .4) : 0, dk = tl > 2.75 ? back((tl - 2.75) / .38) : 0;
    main.tri.scale.setScalar(Math.max(.0001, tk)); refl.tri.scale.setScalar(Math.max(.0001, tk));
    main.tri.visible = refl.tri.visible = tk > 0; main.dot.visible = refl.dot.visible = dk > 0;
    const dy = -59 - (1 - clamp((tl - 2.75) / .38)) * 40;
    main.dot.position.y = refl.dot.position.y = dy; main.dot.scale.setScalar(Math.max(.0001, dk)); refl.dot.scale.setScalar(Math.max(.0001, dk));
  }
  // Funkenspur und Stiftlicht
  const sparkN = 56, sp = new Float32Array(sparkN * 3), sc = new Float32Array(sparkN * 3);
  const sparkGeo = new THREE.BufferGeometry(); sparkGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3)); sparkGeo.setAttribute("color", new THREE.BufferAttribute(sc, 3));
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ size: .09, sizeAttenuation: true, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); sparks.frustumCulled = false; scene.add(sparks);
  const gcv = document.createElement("canvas"); gcv.width = gcv.height = 128; { const x = gcv.getContext("2d"), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.25, "rgba(0,229,168,.55)"); g.addColorStop(1, "rgba(0,229,168,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gcv), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); scene.add(glow);
  const penLight = new THREE.PointLight(MINT, 0, 7, 1.5); scene.add(penLight);
  function updatePen(tl) {
    logo.updateMatrixWorld(true);
    const h = tl > 0 ? headAt(tl) : null;
    glow.visible = !!h; penLight.intensity = h ? 6 : 0;
    if (h) { const v = logo.localToWorld(logoLocal(h[0], h[1])); glow.position.copy(v); penLight.position.copy(v); glow.scale.setScalar(.55 * logo.scale.x + .25); }
    for (let j = 0; j < sparkN; j++) {
      const hp = tl > 0 ? headAt(tl - (j + 1) * .018) : null;
      if (!hp) { sp[j * 3] = sp[j * 3 + 1] = 0; sp[j * 3 + 2] = -9999; continue; }
      const f = 1 - j / sparkN, a = rnd(j + Math.floor(tl * 20)) * 6.283, v = logo.localToWorld(logoLocal(hp[0], hp[1])), d = (j + 1) * .02 * logo.scale.x;
      sp[j * 3] = v.x + Math.cos(a) * d; sp[j * 3 + 1] = v.y + Math.sin(a) * d; sp[j * 3 + 2] = v.z + (rnd(j + 5) - .5) * d;
      tmpC.set(j % 2 ? MINT : GOLD).multiplyScalar(f * 1.4); sc[j * 3] = tmpC.r; sc[j * 3 + 1] = tmpC.g; sc[j * 3 + 2] = tmpC.b;
    }
    sparkGeo.attributes.position.needsUpdate = true; sparkGeo.attributes.color.needsUpdate = true;
  }
  // Schockring (flach, schaut zur Kamera)
  const ring = new THREE.Mesh(new THREE.RingGeometry(.96, 1, 96), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); ring.visible = false; scene.add(ring);
  function shock(t, at, pos, sizeMax, col) { const k = (t - at) / 1.1; if (k < 0 || k > 1) return; ring.visible = true; ring.position.copy(pos); ring.quaternion.copy(camera.quaternion); ring.scale.setScalar(.2 + eo(k) * Math.min(sizeMax, 9) * .5); ring.material.opacity = (1 - k) * .3; ring.material.color.set(col); }

  // ---------- 3D-Schrift ----------
  const font = new FontLoader().parse(fontJson);
  function word(txt, color) {
    const g = new TextGeometry(txt, { font, size: 1, depth: .32, curveSegments: 5, bevelEnabled: true, bevelThickness: .05, bevelSize: .035, bevelSegments: 2 });
    g.computeBoundingBox(); const bb = g.boundingBox; g.translate(-(bb.max.x + bb.min.x) / 2, -(bb.max.y + bb.min.y) / 2, -.16);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .32, metalness: .85, roughness: .28, envMapIntensity: 1.4 })); m.userData.w = bb.max.x - bb.min.x; m.userData.h = bb.max.y - bb.min.y; m.visible = false; scene.add(m); return m;
  }
  const words = [{ m: word("DAS", 0xffffff), h: .8, y: 2.25, at: .7, dir: 1 }, { m: word("MEGA", MINT), h: 1.7, y: .7, at: 1.15, dir: -1 }, { m: word("UPDATE", GOLD), h: 1.3, y: -1.15, at: 1.6, dir: 1 }];

  // ---------- Karten (alle Spiele) ----------
  function roundedPlane(s, r) {
    const sh = new THREE.Shape(), x = -s / 2, y = -s / 2, w = s;
    sh.moveTo(x + r, y); sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r); sh.lineTo(x + w, y + w - r); sh.quadraticCurveTo(x + w, y + w, x + w - r, y + w);
    sh.lineTo(x + r, y + w); sh.quadraticCurveTo(x, y + w, x, y + w - r); sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y);
    const g = new THREE.ShapeGeometry(sh, 5), p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / s + .5, p.getY(i) / s + .5); return g;
  }
  const cardGeo = roundedPlane(1, .17), glowGeo = roundedPlane(1.16, .2);
  const gameIndex = new Map(), cards = [];
  plan.forEach((seg, i) => seg.list.forEach((g, j) => gameIndex.set(g.id, { i, j })));
  const segCol = plan.map(s => new THREE.Color(s.col[0]));
  games.forEach((g, k) => {
    const img = images.get(g.image); let src = img;
    if (!src) { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"), gr = x.createLinearGradient(0, 0, 128, 128); gr.addColorStop(0, "#1d2566"); gr.addColorStop(1, "#0d1030"); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); src = c; }
    const tex = new THREE.Texture(src); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.needsUpdate = true;
    const mat = new THREE.MeshBasicMaterial({ map: tex }), mesh = new THREE.Mesh(cardGeo, mat);
    const gm = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); gm.position.z = -.01; mesh.add(gm);
    mesh.visible = false; scene.add(mesh);
    const gi = gameIndex.get(g.id) || { i: 0, j: k }, N = games.length, yy = 1 - 2 * (k + .5) / N, rr = Math.sqrt(1 - yy * yy), phi = k * 2.399963;
    cards.push({ g, mesh, mat, gm, gi, sph: new THREE.Vector3(Math.cos(phi) * rr, yy, Math.sin(phi) * rr).multiplyScalar(5.2), tun: new THREE.Vector3(), ti: 0 });
  });
  // Tunnel-Anordnung: pro Kategorie eine Spirale, die Kamera fliegt hindurch (ca. 7 Einheiten pro Sekunde)
  const segInfo = []; let zc = -40;
  plan.forEach(seg => { const n = seg.list.length, stepZ = n > 20 ? .78 : 1.05; segInfo.push({ z0: zc, stepZ, L: n * stepZ }); zc -= n * stepZ + 8; });
  cards.forEach(c => {
    const seg = plan[c.gi.i], si = segInfo[c.gi.i], j = c.gi.j, ang = j * .95 + c.gi.i * .8, rad = 2.9 + .8 * Math.sin(j * .8 + c.gi.i);
    c.tun.set(Math.cos(ang) * rad, Math.sin(ang) * rad * .8, si.z0 - j * si.stepZ - 4.5); c.ti = seg.tiles + j * seg.step;
  });
  const camKeys = []; plan.forEach((seg, i) => { const si = segInfo[i]; camKeys.push([seg.tiles, si.z0 + 6], [seg.end, si.z0 - si.L + 6]); });
  const camZ = t => { if (t <= camKeys[0][0]) return camKeys[0][1]; for (let i = 1; i < camKeys.length; i++) if (t <= camKeys[i][0]) { const a = camKeys[i - 1], b = camKeys[i]; return lerp(a[1], b[1], (t - a[0]) / (b[0] - a[0])); } const l = camKeys[camKeys.length - 1]; return l[1] - (t - l[0]) * 4; };
  // Splitter fuer "Leider raus"
  const shardN = 70, shards = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(.28), new THREE.MeshStandardMaterial({ color: 0x3a1418, roughness: .5, metalness: .6, emissive: 0x330a0e, emissiveIntensity: .8 }), shardN); shards.visible = false; scene.add(shards);
  const dummy = new THREE.Object3D(), zEnd = camKeys[camKeys.length - 1][1];

  // ---------- Kamera und Zustand je Zeit ----------
  const visW = d => 2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
  const look = new THREE.Vector3(), tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3();
  function render(t) {
    const aspect = W / H, beat = kick(t);
    camera.aspect = aspect; const wantFov = t >= T.SHOW && t < T.GONE ? 54 : 48; if (camera.fov !== wantFov) { camera.fov = wantFov; } camera.updateProjectionMatrix();
    const sceneId = t < T.TITLE ? 0 : t < T.INFO ? 1 : t < T.SHOW ? 2 : t < T.GONE ? 3 : t < T.WALL ? 4 : 5;
    // Standardwerte
    scene.fog.density = .02; scene.fog.color.set(0x03040c); scene.background.set(0x03040c);
    floor.visible = false; refl.g.visible = false; logo.visible = false; sparks.visible = false; glow.visible = false; penLight.intensity = 0; ring.visible = false; shards.visible = false;
    words.forEach(w => w.m.visible = false); dust.visible = true;
    rimA.intensity = 9 + 8 * beat; rimB.intensity = 7 + 6 * beat; key.intensity = .6 + .3 * beat;
    rimA.position.set(-6, 3, 6); rimB.position.set(6, -1, 5);
    let bloomS = .5 + .15 * beat, aber = .001 + .001 * beat, cardMode = 0, cardDim = 1;
    const logoFit = (d, k = .8) => Math.max(1, 8 / (visW(d) * k));   // Faktor, um das Logo ins Bild zu bekommen

    if (sceneId === 0) {   // ----- Logo wird von einem leuchtenden Stift gezeichnet -----
      const u = clamp(t / T.TITLE), tl = t - 1.3;
      logo.visible = true; floor.visible = true; refl.g.visible = true; logo.position.set(0, 0, 0); logo.scale.setScalar(1); logo.rotation.set(0, 0, 0); scene.fog.density = .06;
      const ang = lerp(-.7, .22, eio(u)), fit = 8 / (visW(1) * .78), Rr = Math.max(lerp(17, 10, eo(u)), fit * 1.0);
      camera.position.set(Math.sin(ang) * Rr, lerp(2.4, .45, eo(u)), Math.cos(ang) * Rr); camera.lookAt(0, .1, 0);
      setLogo(tl); updatePen(tl); sparks.visible = tl > 0;
      shock(t, 1.3 + 3.15, new THREE.Vector3(0, 0, 0), 14, MINT);
      const hit = 1.3 + 3.15; if (t > hit) { bloomS += .7 * Math.exp(-(t - hit) * 2.5); aber += .003 * Math.exp(-(t - hit) * 4); camera.position.z += .25 * Math.exp(-(t - hit) * 5); }
    } else if (sceneId === 1) {   // ----- Titel in 3D-Buchstaben -----
      const u = t - T.TITLE, ang = lerp(-.45, .45, eio(u / 4.8)), Rr = 10.5;
      camera.position.set(Math.sin(ang) * Rr, .9, Math.cos(ang) * Rr); camera.lookAt(0, .3, 0);
      logo.visible = true; setLogo(99); logo.rotation.set(0, 0, 0);
      const lw = Math.min(1, visW(Rr) * .62 / 8) * .55; logo.scale.setScalar(Math.max(.2, lw)); logo.position.set(0, lerp(0, 3.7, eio(u / .7)), 0);
      const maxW = visW(Rr) * .88;
      words.forEach(w => {
        const k = clamp((u - w.at) / .55), ex = clamp((t - (T.INFO - .55)) / .55); if (k <= 0 || ex >= 1) return;
        const base = w.h / w.m.userData.h, s = Math.min(base, maxW / w.m.userData.w) * (1 + .12 * ex);
        w.m.visible = true; w.m.scale.setScalar(s); w.m.position.set(0, w.y, lerp(-28, 0, eo4(k)) + eio(ex) * 16);
        w.m.rotation.set(0, (1 - eo4(k)) * 1.3 * w.dir + ex * .4 * w.dir, (1 - eo4(k)) * .3 * w.dir);
        if (k < .15 && t > 0) bloomS += .15;
      });
      words.forEach(w => { const at = T.TITLE + w.at; shock(t, at, new THREE.Vector3(0, w.y, 0), 9, w.m.material.color.getHex()); });
      aber += .003 * Math.exp(-Math.min(...words.map(w => Math.abs(t - (T.TITLE + w.at + .2)))) * 5);
    } else if (sceneId === 2) {   // ----- "Das ist neu": Kugel aus allen Karten im Hintergrund -----
      const u = t - T.INFO, a = t * .14 + .6, Rr = Math.max(14, 12 / (visW(1) * .7));
      camera.position.set(Math.sin(a) * Rr, 1.6 + Math.sin(t * .4), Math.cos(a) * Rr); camera.lookAt(0, 0, 0);
      cardMode = 1; cardDim = .5; bloomS = .45;
    } else if (sceneId === 3) {   // ----- Flug durch den Tunnel aus Spielkarten -----
      const z = camZ(t), sway = Math.sin(t * .5) * .35, swayY = Math.cos(t * .37) * .25;
      camera.position.set(sway + Math.sin(t * 2.2) * .03 * beat, swayY, z); look.set(sway * .6, swayY * .6, z - 10); camera.lookAt(look); camera.rotation.z += Math.sin(t * .6) * .05;
      const seg = plan.find(p => t < p.exit) || plan[plan.length - 1], c0 = segCol[plan.indexOf(seg)];
      scene.fog.density = .024; scene.fog.color.copy(c0).multiplyScalar(.06); scene.background.copy(c0).multiplyScalar(.04);
      rimA.color.copy(c0); rimB.color.set(seg.col[1]); rimA.position.set(-3, 2, z - 3); rimB.position.set(3, -2, z - 5); key.position.set(2, 3, z + 4); key.target.position.set(0, 0, z - 8); key.target.updateMatrixWorld();
      cardMode = 2; bloomS = .55 + .3 * beat; aber += .0006;
      if (t - T.SHOW < .5) bloomS += .8 * (1 - (t - T.SHOW) / .5);
    } else if (sceneId === 4) {   // ----- "Leider raus": rotes Dunkel, Splitter -----
      const u = t - T.GONE, z = camZ(T.GONE) - u * 1.4;
      camera.position.set(Math.sin(u * .3) * .6, Math.cos(u * .25) * .4, z); look.set(Math.sin(u * .2) * 2, 0, z - 10); camera.lookAt(look);
      scene.fog.density = .05; scene.fog.color.set(0x2a0508); scene.background.set(0x120305);
      rimA.color.set(0xff3b3b); rimB.color.set(0xff7a3d); rimA.position.set(-3, 2, z - 4); rimB.position.set(3, -2, z - 6); rimA.intensity = 40; rimB.intensity = 26;
      cardMode = 2; cardDim = .35; bloomS = .5; aber += .0015;
      shards.visible = true;
      for (let i = 0; i < shardN; i++) { dummy.position.set((rnd(i) - .5) * 16, (rnd(i + 3) - .5) * 9, z - 4 - rnd(i + 9) * 40 + Math.sin(t * .5 + i) * .8); dummy.rotation.set(t * (.3 + rnd(i + 2)), t * (.4 + rnd(i + 5)), i); dummy.scale.setScalar(.6 + rnd(i + 11) * 1.8); dummy.updateMatrix(); shards.setMatrixAt(i, dummy.matrix); }
      shards.instanceMatrix.needsUpdate = true;
    } else {   // ----- Hyperflug: alle Karten formen die Kugel, dann kommt das Logo -----
      const u = t - T.WALL, a = Math.sin(u * .35) * .5, Rr = Math.max(14, 12 / (visW(1) * .7));
      camera.position.set(Math.sin(a) * Rr, 1.1 + Math.sin(u * .3) * .4, Math.cos(a) * Rr); camera.lookAt(0, 0, 0);
      cardMode = 3; cardDim = u > 3.4 ? lerp(1, .3, eio((u - 3.4) / .6)) : 1; bloomS = .55 + .3 * beat; aber += Math.max(0, .006 * (1 - u / 1.4));
      const lu = u - 3.7;
      if (lu > 0) {
        logo.visible = true; floor.visible = false; refl.g.visible = false; logo.rotation.set(0, 0, 0);
        const lz = Rr - 7.2, lw = Math.min(1, visW(7.2) * .8 / 8); logo.scale.setScalar(Math.max(.2, lw)); logo.position.set(0, .2, lz);
        // Kamera schaut auf das Logo
        camera.position.set(Math.sin(a) * .8, .4, Rr); camera.lookAt(0, .2, lz);
        setLogo(lu); updatePen(lu); sparks.visible = lu > 0; bloomS += .2;
        const hit = T.WALL + 3.7 + 3.15; if (t > hit) { bloomS += .7 * Math.exp(-(t - hit) * 2.5); aber += .003 * Math.exp(-(t - hit) * 4); }
        shock(t, hit, new THREE.Vector3(0, .2, lz), 12, MINT);
      }
    }

    // ----- Karten setzen -----
    const N = cards.length, rotY = t * .22;
    cards.forEach((c, k) => {
      let vis = false, sc = 0, bri = 1, glowA = 0; const m = c.mesh;
      if (cardMode === 1) {   // Kugel (Hintergrund der Info-Szene)
        const ta = T.INFO + .2 + (k / N) * 1.3, age = t - ta, ex = clamp((t - (T.SHOW - .4)) / .4);
        if (age > 0 && ex < 1) { vis = true; sc = back(age / .5) * (1 - eio(ex)) * 1.2; bri = cardDim; tmpV.copy(c.sph).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY); m.position.copy(tmpV); tmpV2.copy(tmpV).multiplyScalar(2); m.lookAt(tmpV2); }
      } else if (cardMode === 2) {   // Tunnel
        const age = t - c.ti;
        if (age > -.01 && t >= T.SHOW) {
          vis = true; const si = segInfo[c.gi.i], pop = age < .6 ? (1 + .55 * Math.exp(-age * 4.5)) : 1;
          sc = (age < .5 ? back(age / .45) : 1) * pop; bri = (.8 + .4 * Math.exp(-Math.max(age, 0) * 3.5)) * cardDim; glowA = .45 * Math.exp(-Math.max(age, 0) * 2.2) * cardDim;
          m.position.copy(c.tun); m.position.x += Math.sin(c.tun.z * .12) * .25; m.lookAt(0, 0, c.tun.z + 3.5); m.rotation.z += (1 - clamp(age / .5)) * .9;
          c.gm.material.color.copy(segCol[c.gi.i]);
        }
      } else if (cardMode === 3) {   // Hyperflug zur Kugel
        const u = t - T.WALL, d = rnd(k) * .6, f = clamp((u - d) / 1.5);
        vis = true; sc = 1; bri = cardDim * (f < 1 ? 1.1 : .85); const ef = f < 1 ? 1 - Math.pow(1 - f, 3) : 1;
        tmpV.copy(c.sph).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY); m.position.lerpVectors(c.tun, tmpV, ef); m.lookAt(tmpV2.copy(tmpV).multiplyScalar(2));
        if (f < 1) m.rotation.z += (1 - f) * 3;
        glowA = f < 1 ? .5 * (1 - f) : 0; c.gm.material.color.set(MINT);
      }
      m.visible = vis && sc > .002; if (m.visible) { m.scale.setScalar(sc * (cardMode === 2 ? 1.45 : cardMode === 3 ? 1.2 : 1.25)); c.mat.color.setScalar(bri); c.gm.material.opacity = glowA; }
    });
    dust.position.z = camera.position.z * .0;   // Staub steht still, die Kamera fliegt hindurch
    bloom.strength = bloomS; post.uniforms.uAber.value = aber; post.uniforms.uTime.value = t % 7;
    composer.render();
  }

  function resize(w, h) {
    W = w; H = h; renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w / 2, h / 2); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  function dispose() { try { composer.dispose(); renderer.dispose(); cvs.remove(); msvg.remove(); } catch (e) {} }
  return { render, resize, dispose, canvas: cvs };
}
