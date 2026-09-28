import * as THREE from 'three';
import { moonVertex, moonFragment, starVertex, starFragment, glowVertex, glowFragment } from './shaders.ts';

export type MoonMode = 'hero' | 'dock' | 'ambient' | 'quiet';

interface ModeConfig {
  fx: number;       // screen x of the moon centre, 0..1
  fy: number;       // screen y of the moon centre, 0..1 (0 = top)
  rf: number;       // moon radius as a fraction of viewport height
  exposure: number;
  sunAz: number;    // sun azimuth (radians), 0 = behind the viewer (full moon)
  sunEl: number;    // sun elevation
  glow: number;
  starOpacity: number;
  autoSpin: number; // radians per second when idle
}

const MODES: Record<MoonMode, ModeConfig> = {
  hero:    { fx: 0.70, fy: 0.50, rf: 0.34, exposure: 1.35, sunAz: -0.95, sunEl: 0.18, glow: 0.28, starOpacity: 1.0, autoSpin: 0.012 },
  dock:    { fx: 0.21, fy: 0.5, rf: 0.23, exposure: 1.25, sunAz: -0.6,  sunEl: 0.12, glow: 0.35, starOpacity: 0.8, autoSpin: 0.0 },
  ambient: { fx: 0.94, fy: 0.86, rf: 0.40, exposure: 0.42, sunAz: -1.6,  sunEl: 0.28, glow: 0.14, starOpacity: 0.7, autoSpin: 0.006 },
  quiet:   { fx: 0.97, fy: 0.07, rf: 0.10, exposure: 1.1, sunAz: -1.2,  sunEl: 0.2,  glow: 0.15, starOpacity: 0.5, autoSpin: 0.01 },
};

// narrow-screen overrides
const MOBILE_MODES: Record<MoonMode, Partial<ModeConfig>> = {
  hero:    { fx: 0.5, fy: 0.26, rf: 0.19, exposure: 1.05, glow: 0.16 },
  dock:    { fx: 0.5, fy: 0.22, rf: 0.14 },
  ambient: { fx: 0.9, fy: 0.92, rf: 0.26, exposure: 0.32 },
  quiet:   { fx: 0.88, fy: 0.10, rf: 0.08 },
};

export interface MoonProjection { x: number; y: number; r: number; }

type DragListener = (dx: number, dy: number) => void;

const damp = (a: number, b: number, lambda: number, dt: number) => a + (b - a) * (1 - Math.exp(-lambda * dt));

export class MoonScene {
  readonly canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private moonGroup = new THREE.Group();
  private moon: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  private glow: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private stars: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private starGroup = new THREE.Group();
  private clock = new THREE.Clock();
  private raf = 0;
  private disposed = false;

  private mode: MoonMode = 'hero';
  private cfg: ModeConfig = { ...MODES.hero };
  private cur = { x: 0, y: 0, scale: 1, exposure: 1, sunAz: -0.95, sunEl: 0.18, glow: 0.5, starOpacity: 1 };
  private scroll = 0;
  private scrub = 0;
  private scrubActive = false;
  private pointer = { x: 0, y: 0 };      // -1..1
  private pointerTarget = { x: 0, y: 0 };
  private rotY = 0.6;
  private rotX = 0.05;
  private spinVel = 0;
  private dragging = false;
  private lastDrag = { x: 0, y: 0, t: 0 };
  private hover = false;
  private dragListeners: DragListener[] = [];
  private reducedMotion = false;
  private texturesReady = false;
  private cameraZ = 6;
  private hidden = false;
  private moonUniforms: Record<string, THREE.IUniform>;
  private starUniforms: Record<string, THREE.IUniform>;
  private glowUniforms: Record<string, THREE.IUniform>;
  private onVisibility = () => { this.hidden = document.visibilityState === 'hidden'; if (!this.hidden) this.clock.getDelta(); };

  constructor(canvas: HTMLCanvasElement, opts: { texturePath?: string; reducedMotion?: boolean } = {}) {
    this.canvas = canvas;
    this.reducedMotion = !!opts.reducedMotion;
    const texturePath = opts.texturePath ?? '/textures/moon';

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);
    this.camera.position.set(0, 0, this.cameraZ);

    // ---- placeholders until textures arrive --------------------------------
    const grey = new THREE.DataTexture(new Uint8Array([150, 146, 140, 255]), 1, 1);
    grey.colorSpace = THREE.SRGBColorSpace; grey.needsUpdate = true;
    const flatN = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1); flatN.needsUpdate = true;
    const flatH = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1); flatH.needsUpdate = true;

    this.moonUniforms = {
      albedoMap: { value: grey },
      normalMap: { value: flatN },
      heightMap: { value: flatH },
      displacement: { value: 0.0 },
      sunDir: { value: new THREE.Vector3(0, 0, 1) },
      cameraPosW: { value: new THREE.Vector3() },
      normalScale: { value: 1.0 },
      exposure: { value: 1.0 },
      earthshineColor: { value: new THREE.Color(0.55, 0.68, 1.0) },
      earthshine: { value: 0.02 },
      terminatorSoftness: { value: 0.12 },
      lambertMix: { value: 0.35 },
      oppositionB0: { value: 0.6 },
      oppositionH: { value: 0.06 },
      hgXi: { value: -0.28 },
      debugMode: { value: 0 },
      heightRange: { value: 0.06 },
      texelAngle: { value: (2 * Math.PI) / 2048 },
      shadowStrength: { value: 0.85 },
    };
    const moonMat = new THREE.ShaderMaterial({
      uniforms: this.moonUniforms,
      vertexShader: moonVertex,
      fragmentShader: moonFragment,
    });
    const geo = new THREE.SphereGeometry(1, 256, 160);
    this.moon = new THREE.Mesh(geo, moonMat);
    this.moon.rotation.y = this.rotY;
    this.moonGroup.add(this.moon);

    this.glowUniforms = {
      uIntensity: { value: 0.5 },
      uColor: { value: new THREE.Color(0.72, 0.8, 1.0) },
      uLightDir: { value: new THREE.Vector2(-1, 0) },
    };
    const glowMat = new THREE.ShaderMaterial({
      uniforms: this.glowUniforms, vertexShader: glowVertex, fragmentShader: glowFragment,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    });
    this.glow = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), glowMat);
    this.glow.position.z = -0.6;
    this.glow.renderOrder = -1;
    this.moonGroup.add(this.glow);
    this.scene.add(this.moonGroup);

    // ---- stars -------------------------------------------------------------
    this.starUniforms = { uTime: { value: 0 }, uPixelRatio: { value: this.renderer.getPixelRatio() }, uScale: { value: 1 }, uOpacity: { value: 1 } };
    this.stars = new THREE.Points(this.buildStars(), new THREE.ShaderMaterial({
      uniforms: this.starUniforms, vertexShader: starVertex, fragmentShader: starFragment,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.starGroup.add(this.stars);
    this.starGroup.rotation.set(0.3, 0.2, 0.15);
    this.scene.add(this.starGroup);

    this.loadTextures(texturePath);
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.applyMode('hero', true);
    this.raf = requestAnimationFrame(this.tick);
  }

  // ---------------------------------------------------------------- public API
  setMode(mode: MoonMode) { this.applyMode(mode, false); }
  getMode() { return this.mode; }
  getSunAzimuth() { return this.cur.sunAz; }
  /** Test/debug helper: jump straight to the current mode's resting state. */
  settle() { const t = this.targets(); Object.assign(this.cur, t); }
  setScroll(p: number) { this.scroll = Math.max(0, Math.min(1, p)); }
  /** Timeline scrub, 0..1. Drives rotation and phase in dock mode. */
  setScrub(t: number) { this.scrub = Math.max(0, Math.min(1, t)); this.scrubActive = true; }
  clearScrub() { this.scrubActive = false; }
  onDrag(fn: DragListener) { this.dragListeners.push(fn); return () => { this.dragListeners = this.dragListeners.filter((f) => f !== fn); }; }
  isHovering() { return this.hover; }
  isDragging() { return this.dragging; }
  /** Screen-space circle of the moon, in CSS pixels. */
  project(): MoonProjection {
    const h = this.canvas.clientHeight || window.innerHeight;
    const w = this.canvas.clientWidth || window.innerWidth;
    const worldH = 2 * this.cameraZ * Math.tan((this.camera.fov * Math.PI) / 360);
    const worldW = worldH * (w / h);
    const x = (this.cur.x / worldW + 0.5) * w;
    const y = (0.5 - this.cur.y / worldH) * h;
    const r = (this.cur.scale / worldH) * h;
    return { x, y, r };
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.moon.geometry.dispose();
    this.moon.material.dispose();
    this.stars.geometry.dispose();
    this.stars.material.dispose();
    this.renderer.dispose();
  }

  // ---------------------------------------------------------------- internals
  private isMobile() { return (this.canvas.clientWidth || window.innerWidth) < 760; }

  private applyMode(mode: MoonMode, immediate: boolean) {
    this.mode = mode;
    const base = MODES[mode];
    const over = this.isMobile() ? MOBILE_MODES[mode] : {};
    this.cfg = { ...base, ...over };
    if (immediate) {
      const t = this.targets();
      Object.assign(this.cur, t);
    }
  }

  private worldSize() {
    const h = this.canvas.clientHeight || window.innerHeight;
    const w = this.canvas.clientWidth || window.innerWidth;
    const worldH = 2 * this.cameraZ * Math.tan((this.camera.fov * Math.PI) / 360);
    return { worldH, worldW: worldH * (w / h) };
  }

  private targets() {
    const { worldH, worldW } = this.worldSize();
    const c = this.cfg;
    let fx = c.fx, fy = c.fy, rf = c.rf, sunAz = c.sunAz, exposure = c.exposure;
    const s = this.scroll;
    if (this.mode === 'hero') {
      // drift up and shrink a little as the page scrolls; the sun swings round so the phase changes
      fy = c.fy - s * 0.5;
      rf = c.rf * (1 - s * 0.35);
      sunAz = c.sunAz - s * 1.9;
      exposure = c.exposure * (1 - s * 0.62);
    } else if (this.mode === 'ambient') {
      fy = c.fy - s * 0.25;
      sunAz = c.sunAz + s * 0.8;
    } else if (this.mode === 'dock') {
      sunAz = c.sunAz - this.scrub * Math.PI * 3.0;
    } else if (this.mode === 'quiet') {
      sunAz = c.sunAz - s * 0.5;
    }
    return {
      x: (fx - 0.5) * worldW,
      y: (0.5 - fy) * worldH,
      scale: rf * worldH,
      exposure,
      sunAz,
      sunEl: c.sunEl,
      glow: c.glow,
      starOpacity: c.starOpacity,
    };
  }

  private resize = () => {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.starUniforms.uPixelRatio.value = this.renderer.getPixelRatio();
    this.starUniforms.uScale.value = Math.max(0.7, Math.min(1.2, h / 900));
    this.applyMode(this.mode, false);
  };

  private onPointerMove = (e: PointerEvent) => {
    const w = window.innerWidth, h = window.innerHeight;
    this.pointerTarget.x = (e.clientX / w) * 2 - 1;
    this.pointerTarget.y = (e.clientY / h) * 2 - 1;
    if (this.dragging) {
      const now = performance.now();
      const dx = e.clientX - this.lastDrag.x;
      const dy = e.clientY - this.lastDrag.y;
      const dt = Math.max(1, now - this.lastDrag.t) / 1000;
      this.lastDrag = { x: e.clientX, y: e.clientY, t: now };
      if (this.mode === 'dock' && this.dragListeners.length) {
        this.dragListeners.forEach((fn) => fn(dx, dy));
      } else {
        const k = 0.0065;
        this.rotY += dx * k;
        this.rotX = Math.max(-0.6, Math.min(0.6, this.rotX + dy * k * 0.6));
        this.spinVel = (dx * k) / dt;
      }
    } else {
      this.hover = this.hitTest(e.clientX, e.clientY) && !this.isInteractive(e.target);
    }
  };

  private isInteractive(t: EventTarget | null) {
    const el = t as HTMLElement | null;
    return !!el?.closest?.('a, button, input, textarea, select, [data-no-drag]');
  }

  private hitTest(cx: number, cy: number) {
    const p = this.project();
    const dx = cx - p.x, dy = cy - p.y;
    return dx * dx + dy * dy <= p.r * p.r * 1.05;
  }

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (this.isInteractive(e.target)) return;
    if (!this.hitTest(e.clientX, e.clientY)) return;
    this.dragging = true;
    this.spinVel = 0;
    this.lastDrag = { x: e.clientX, y: e.clientY, t: performance.now() };
    document.body.classList.add('moon-dragging');
    e.preventDefault();
  };

  private onPointerUp = () => {
    if (!this.dragging) return;
    this.dragging = false;
    document.body.classList.remove('moon-dragging');
  };

  private buildStars() {
    const rand = mulberry32(1337);
    const N = 2600, M = 5200;
    const total = N + M;
    const pos = new Float32Array(total * 3);
    const col = new Float32Array(total * 3);
    const size = new Float32Array(total);
    const phase = new Float32Array(total);
    const twk = new Float32Array(total);
    const R = 120;
    const tmp = new THREE.Vector3();
    const bandAxis = new THREE.Vector3(0.35, 1, 0.2).normalize();
    for (let i = 0; i < total; i++) {
      const milky = i >= N;
      if (!milky) {
        const z = rand() * 2 - 1, t = rand() * Math.PI * 2, s = Math.sqrt(1 - z * z);
        tmp.set(s * Math.cos(t), z, s * Math.sin(t));
      } else {
        // dense faint stars in a band (a great circle with gaussian spread)
        const t = rand() * Math.PI * 2;
        const spread = (rand() + rand() + rand() - 1.5) * 0.16;
        const u = new THREE.Vector3(1, 0, 0).cross(bandAxis).normalize();
        const v = bandAxis.clone().cross(u).normalize();
        tmp.copy(u).multiplyScalar(Math.cos(t)).addScaledVector(v, Math.sin(t)).addScaledVector(bandAxis, spread).normalize();
      }
      pos[i * 3] = tmp.x * R; pos[i * 3 + 1] = tmp.y * R; pos[i * 3 + 2] = tmp.z * R;
      // colour by "temperature"
      const temp = rand();
      let r = 1, g = 1, b = 1;
      if (temp < 0.25) { r = 0.72; g = 0.82; b = 1.0; }
      else if (temp < 0.6) { r = 0.92; g = 0.95; b = 1.0; }
      else if (temp < 0.85) { r = 1.0; g = 0.96; b = 0.88; }
      else { r = 1.0; g = 0.85; b = 0.7; }
      const mag = rand();
      let brightness = milky ? 0.22 + 0.3 * mag : 0.45 + 0.55 * mag * mag;
      let sz = milky ? 1.4 + mag * 1.0 : 1.8 + mag * mag * 4.0;
      if (!milky && mag > 0.985) { sz = 7.0; brightness = 1.0; }
      col[i * 3] = r * brightness; col[i * 3 + 1] = g * brightness; col[i * 3 + 2] = b * brightness;
      size[i] = sz;
      phase[i] = rand();
      twk[i] = milky ? 0.15 : 0.25 + 0.75 * rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    g.setAttribute('aTwinkle', new THREE.BufferAttribute(twk, 1));
    return g;
  }

  private loadTextures(base: string) {
    const loader = new THREE.TextureLoader();
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const load = (file: string, srgb: boolean) => new Promise<THREE.Texture>((resolve, reject) => {
      loader.load(`${base}/${file}`, (tex: THREE.Texture) => {
        tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        tex.anisotropy = maxAniso;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.generateMipmaps = true;
        resolve(tex);
      }, undefined, reject);
    });
    type MoonMeta = { width?: number; height?: number; heightRange?: number; seed?: number };
    const meta: Promise<MoonMeta> = fetch(`${base}/meta.json`).then((r) => (r.ok ? (r.json() as Promise<MoonMeta>) : {})).catch(() => ({}));
    Promise.all([load('albedo.webp', true), load('normal.webp', false), load('height.webp', false), meta])
      .then(([albedo, normal, height, m]) => {
        if (this.disposed) return;
        const range = typeof m?.heightRange === 'number' ? m.heightRange : 0.06;
        const width = typeof m?.width === 'number' ? m.width : ((height.image as { width?: number } | undefined)?.width ?? 2048);
        this.moonUniforms.albedoMap.value = albedo;
        this.moonUniforms.normalMap.value = normal;
        this.moonUniforms.heightMap.value = height;
        this.moonUniforms.heightRange.value = range;
        this.moonUniforms.texelAngle.value = (2 * Math.PI) / width;
        this.moonUniforms.displacement.value = range * 0.6;
        this.texturesReady = true;
        this.canvas.dispatchEvent(new CustomEvent('moon:ready'));
      })
      .catch((err) => console.warn('moon textures failed to load', err));
  }

  private tick = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.tick);
    if (this.hidden) return;
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;

    // pointer smoothing
    this.pointer.x = damp(this.pointer.x, this.pointerTarget.x, 6, dt);
    this.pointer.y = damp(this.pointer.y, this.pointerTarget.y, 6, dt);

    // mode targets
    const tg = this.targets();
    const L = 4.5;
    this.cur.x = damp(this.cur.x, tg.x, L, dt);
    this.cur.y = damp(this.cur.y, tg.y, L, dt);
    this.cur.scale = damp(this.cur.scale, tg.scale, L, dt);
    this.cur.exposure = damp(this.cur.exposure, tg.exposure, L, dt);
    this.cur.sunAz = damp(this.cur.sunAz, tg.sunAz, 3.5, dt);
    this.cur.sunEl = damp(this.cur.sunEl, tg.sunEl, 3.5, dt);
    this.cur.glow = damp(this.cur.glow, tg.glow, L, dt);
    this.cur.starOpacity = damp(this.cur.starOpacity, tg.starOpacity, L, dt);

    // rotation: drag inertia, idle spin, timeline scrub, libration
    if (!this.dragging) {
      this.spinVel *= Math.exp(-2.2 * dt);
      if (Math.abs(this.spinVel) < 0.0005) this.spinVel = 0;
      this.rotY += this.spinVel * dt;
      if (!this.reducedMotion) this.rotY += this.cfg.autoSpin * dt;
      this.rotX = damp(this.rotX, 0.05, 1.2, dt);
    }
    let rotY = this.rotY;
    let rotX = this.rotX;
    if (this.mode === 'dock' && this.scrubActive) {
      rotY = damp(this.moon.rotation.y, this.scrub * Math.PI * 2.5 + 0.6, 6, dt);
      this.rotY = rotY;
    }
    const lib = this.reducedMotion ? 0 : 1;
    this.moon.rotation.y = rotY + lib * 0.018 * Math.sin(t * 0.11);
    this.moon.rotation.x = rotX + lib * 0.012 * Math.sin(t * 0.07 + 1.3);
    this.moon.rotation.z = lib * 0.006 * Math.sin(t * 0.05);

    this.moonGroup.position.set(this.cur.x, this.cur.y, 0);
    this.moon.scale.setScalar(this.cur.scale);
    this.glow.scale.setScalar(this.cur.scale);

    // sun direction
    const az = this.cur.sunAz, el = this.cur.sunEl;
    const sun = this.moonUniforms.sunDir.value as THREE.Vector3;
    sun.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
    this.moonUniforms.exposure.value = this.cur.exposure;
    (this.moonUniforms.cameraPosW.value as THREE.Vector3).copy(this.camera.position);
    this.moonUniforms.normalScale.value = 1.0;

    // glow follows the lit side
    const litFrac = 0.5 + 0.5 * Math.cos(az);
    this.glowUniforms.uIntensity.value = this.cur.glow * (0.35 + 0.65 * litFrac) * (this.texturesReady ? 1 : 0.4);
    (this.glowUniforms.uLightDir.value as THREE.Vector2).set(Math.sin(az), Math.sin(el)).normalize();

    // camera parallax and star drift
    const px = this.pointer.x, py = this.pointer.y;
    this.camera.position.x = px * 0.10;
    this.camera.position.y = -py * 0.06;
    this.camera.lookAt(0, 0, 0);
    this.starGroup.rotation.y = 0.2 + px * 0.02 + (this.reducedMotion ? 0 : t * 0.0025);
    this.starGroup.rotation.x = 0.3 + py * 0.015;
    this.starUniforms.uTime.value = this.reducedMotion ? 0 : t;
    this.starUniforms.uOpacity.value = this.cur.starOpacity;

    this.renderer.render(this.scene, this.camera);
  };
}

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
