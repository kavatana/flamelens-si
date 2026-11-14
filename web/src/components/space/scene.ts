import {
  AmbientLight,
  BackSide,
  Box3,
  Color,
  DirectionalLight,
  Fog,
  Group,
  LinearMipmapLinearFilter,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type MeshStandardMaterial,
  type Object3D,
  type Texture,
} from "three";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { flameGlow, gravityAt, stretchOf, warmthOf } from "@/lib/worlds";
import { createDust } from "./dust";
import { createFlame } from "./flame";
import { createMotes } from "./motes";

/**
 * The scene of the home page's first screen, drawn over the page's light background.
 *
 * Four of NASA's 3D models stand on an orbit around a flame: Earth, Mars, the Moon and the
 * space station. The one in front is large and sharp, with the flame standing right above
 * it; the others are smaller, paler and out of focus. The flame takes the shape that the
 * gravity of the place in front would give it. Dust near and far gives the pale sky its
 * depth. Turning the orbit is all the page ever asks of the scene.
 */

type Kind = "planet" | "station";
type Air = { color: number; rim: number; power: number; halo: number };
type Spec = { file: string; kind: Kind; size: number; tilt: [number, number]; spin: number; face: number; air?: Air; /** How much of its size the model fills, for placing its label. */ fills?: number; /** How far it is raised when in front. */ lift?: number };

/** In the order of the orbit. `face` is how many pixels of the map cover a quarter turn of the planet. */
const SPECS: Spec[] = [
  { file: "/hero/earth.glb", kind: "planet", size: 1.0, tilt: [0.42, 0.35], spin: 0.06, face: 1024, air: { color: 0x3f7dff, rim: 0.42, power: 2.6, halo: 0.36 } },
  { file: "/hero/mars.glb", kind: "planet", size: 0.92, tilt: [0.36, 0.6], spin: 0.05, face: 512, air: { color: 0xe58a4e, rim: 0.16, power: 3.0, halo: 0.22 } },
  { file: "/hero/moon.glb", kind: "planet", size: 0.86, tilt: [0.3, 2.4], spin: 0.04, face: 768 },
  { file: "/hero/station.glb", kind: "station", size: 1.3, tilt: [0.5, 0.3], spin: 0.26, face: 0, fills: 0.5, lift: 0.35 },
];

const QUARTER = Math.PI / 2;
/** Where on the orbit the place in front rests: straight ahead, so the flame stands right above it. */
const REST = 0;
/** The camera: how far it stands, how high it looks down from, and how much it sees. */
const FAR = 17;
const LOOK_DOWN = (20 * Math.PI) / 180;
const VIEW = 18.6;
const EYE = new Vector3(0, FAR * Math.sin(LOOK_DOWN), FAR * Math.cos(LOOK_DOWN));
const AIM = new Vector3(0, -0.2, 0);
const SUN = new Vector3(-0.42, 0.74, 0.52).normalize();
/** The colour of the page behind the scene. Far things fade toward it, as they do in haze. */
const HAZE = new Color(0xeef1f6);
/** How far the air glow reaches beyond the ground, as a share of the planet's radius. */
const HALO = 1.085;
const FLAME_SCALE = 1.08;

const backOut = (t: number) => {
  const x = Math.min(1, Math.max(0, t)) - 1;
  return 1 + 2.3 * x * x * x + 1.3 * x * x;
};

const bodyVertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vN;
varying vec3 vP;
void main() {
  vUv = uv;
  // NASA's planets are balls around their own middle, so the way out from the middle is the way up from the ground.
  vN = normalize(mat3(modelMatrix) * normalize(position));
  vec4 world = modelMatrix * vec4(position, 1.0);
  vP = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const bodyFragment = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uSun;
uniform float uBlur;
uniform float uFade;
uniform float uShown;
uniform float uTexels;
uniform float uMaxLod;
uniform vec3 uHaze;
uniform vec3 uAir;
uniform float uAirPower;
uniform vec3 uGlow;
uniform vec3 uGlowAt;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vP;
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(cameraPosition - vP);
  float facing = max(dot(n, v), 0.0);
  // How much of the map one pixel covers, worked out from the ball's own shape: the map is
  // six squares, and its own coordinates jump from one square to the next.
  float footprint = length(fwidth(n)) * 0.7071;
  float lod = min(log2(max(footprint * uTexels, 1.0)) + uBlur * 3.6, uMaxLod);
  vec3 ground = textureLod(uMap, vUv, lod).rgb;
  // Lit like an object on a desk: a clear bright side, and a shaded side that is never black.
  float day = smoothstep(-0.5, 0.82, dot(n, uSun));
  vec3 color = ground * (0.46 + 0.8 * day) * (0.84 + 0.16 * facing);
  color += uAir * pow(1.0 - facing, uAirPower) * (0.3 + 0.7 * day);
  // The flame's light on the side that faces it.
  vec3 toFlame = uGlowAt - vP;
  color += ground * uGlow * max(dot(n, normalize(toFlame)), 0.0) / (1.0 + 0.35 * dot(toFlame, toFlame));
  color = mix(color, uHaze, uFade);
  float edge = smoothstep(0.0, mix(0.03, 0.55, uBlur), facing);
  gl_FragColor = vec4(color, edge * uShown * (1.0 - 0.25 * uFade));
  #include <colorspace_fragment>
}`;

const haloVertex = /* glsl */ `
varying vec3 vN;
varying vec3 vP;
void main() {
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vP = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const haloFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uStrength;
uniform float uLimit;
varying vec3 vN;
varying vec3 vP;
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(cameraPosition - vP);
  // 1 where the glow touches the ground, 0 at its outer edge.
  float depth = clamp(-dot(n, v) / uLimit, 0.0, 1.0);
  gl_FragColor = vec4(uColor, pow(depth, 2.0) * uStrength);
  #include <colorspace_fragment>
}`;

/**
 * The orbit, drawn on the flat plane the worlds stand on: its line and the light around it,
 * the tail of light behind each world, two points of light that run along it, the rings
 * that leave the flame, and the flame's own light on the plane.
 */
const planeVertex = /* glsl */ `
varying vec3 vP;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vP = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const planeFragment = /* glsl */ `
uniform vec2 uRadii;
uniform vec3 uInk;
uniform vec3 uGlow;
uniform vec3 uLine;
uniform float uAngles[4];
uniform float uMove;
uniform float uShown;
uniform float uTime;
uniform float uTurn;
varying vec3 vP;
float lineAt(float r, float at, float w) {
  return 1.0 - smoothstep(0.35, 1.35, abs(r - at) / w);
}
void main() {
  vec2 q = vP.xz / uRadii;
  float r = length(q);
  if (r > 1.5) discard;
  float w = max(fwidth(r), 0.00001);
  float angle = atan(q.x, q.y);

  // The orbit: a fine line, with light around it.
  float orbit = lineAt(r, 1.0, w);
  float haze = exp(-pow((r - 1.0) / 0.04, 2.0));

  // Behind each world the orbit is lit for a stretch, like the tail of a comet.
  float tail = 0.0;
  for (int i = 0; i < 4; i++) {
    tail = max(tail, exp(-mod(uAngles[i] - angle, 6.2831853) / 0.8));
  }
  tail *= 0.5 + 0.5 * uMove;

  // Two points of light run slowly along the orbit, the way the worlds go round.
  float run = 0.0;
  for (int i = 0; i < 2; i++) {
    float head = uTime * 0.17 + float(i) * 3.1416 + uTurn * 1.5708;
    run = max(run, exp(-mod(head - angle, 6.2831853) / 0.26));
  }

  // Rings of light leave the flame and fade, one after another.
  float ripple = 0.0;
  for (int i = 0; i < 3; i++) {
    float phase = fract(uTime * 0.085 + float(i) / 3.0);
    ripple += lineAt(r, 0.1 + phase * 0.8, w * 1.25) * (1.0 - phase) * (1.0 - phase);
  }

  float outer = lineAt(r, 1.26, w);

  float pool = exp(-r * r / 0.03) * 0.42 + exp(-r * r / 0.26) * 0.16;
  // The small burner the flame stands on.
  float hub = 1.0 - smoothstep(0.1, 0.125, length(vP.xz));

  float aLight = pool + haze * (0.06 + 0.36 * tail + 0.22 * run);
  float aOrbit = orbit * (0.3 + 0.62 * tail + 0.5 * run);
  float aRipple = ripple * 0.34;
  float aOuter = outer * 0.1;
  vec3 orbitColor = mix(uLine, uInk, clamp(tail * 1.4 + run * 1.2, 0.0, 1.0));
  float total = aLight + aOrbit + aRipple + aOuter;
  if (total + hub < 0.003) discard;
  vec3 sum = uGlow * aLight + orbitColor * aOrbit + uInk * aRipple + uLine * aOuter;
  vec3 color = mix(sum / max(total, 0.0001), vec3(0.02, 0.024, 0.03), hub * 0.92);
  gl_FragColor = vec4(color, max(clamp(total, 0.0, 1.0), hub * 0.92) * uShown);
  #include <colorspace_fragment>
}`;

type Body = { spec: Spec; group: Group; turning: Object3D; material?: ShaderMaterial; halo?: ShaderMaterial; born: number; shown: number };

/** Where things are on the page, in CSS pixels from the top left of the canvas, for the labels drawn over the scene. */
export type Spot = { x: number; y: number; r: number; focus: number; shown: number; /** True while the world is on the far side of the flame. */ behind: boolean };
export type Layout = { bodies: Spot[]; slot: { x: number; y: number; r: number }; flame: { x: number; y: number; top: number } };

export type SpaceScene = {
  /** Draws one frame with the orbit `turns` quarter turns round, `seconds` into the animation, and says where things ended up. */
  draw: (turns: number, seconds: number, delta: number) => Layout;
  /** Keeps the scene inside the part of the canvas that is free of words: so many pixels down from the top and up from the bottom. */
  frame: (top: number, bottom: number) => void;
  /** Leans the camera a little toward the pointer; x and y run from -1 to 1. */
  lean: (x: number, y: number) => void;
  dispose: () => void;
};

export function createSpaceScene(canvas: HTMLCanvasElement, options: { still: boolean; small: boolean }): SpaceScene {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  // One and a half device pixels to a page pixel is as sharp as the eye asks for here, and far less work than two.
  const pixel = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(pixel);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  // Only the station is lit by lights and thinned by this haze; the planets carry their own.
  scene.fog = new Fog(HAZE, 1, 1000);
  const camera = new PerspectiveCamera(VIEW, 2, 0.5, 120);
  const insets = { top: 0, bottom: 0 };
  const lean = { x: 0, y: 0, toX: 0, toY: 0 };
  const ring = { across: 5, depth: 4 };
  let width = 0;
  let height = 0;

  const flame = createFlame();
  flame.place(new Vector3(0, 0, 0), FLAME_SCALE);
  scene.add(flame.mesh);
  const flameAt = new Vector3(0, 0.75, 0);
  const glow = new Color();
  const ink = new Color();
  const flameLight = new Color();

  const plane = new ShaderMaterial({
    vertexShader: planeVertex,
    fragmentShader: planeFragment,
    uniforms: { uRadii: { value: [ring.across, ring.depth] }, uInk: { value: ink }, uGlow: { value: glow }, uLine: { value: new Color(0x8a94a3) }, uAngles: { value: [0, 0, 0, 0] }, uMove: { value: 0 }, uShown: { value: 0 }, uTime: { value: 0 }, uTurn: { value: 0 } },
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const floorGeometry = new PlaneGeometry(1, 1);
  const floor = new Mesh(floorGeometry, plane);
  floor.rotation.x = -Math.PI / 2;
  floor.renderOrder = -5;
  scene.add(floor);

  const dust = createDust(options.small ? 180 : 420, pixel, EYE.length(), glow);
  scene.add(dust.points);

  const motes = createMotes(options.small ? 14 : 24, pixel, glow);
  motes.place(new Vector3(), FLAME_SCALE);
  scene.add(motes.points);

  const sun = new DirectionalLight(0xffffff, 3.2);
  sun.position.copy(SUN).multiplyScalar(20);
  const fill = new AmbientLight(0xffffff, 1.5);
  scene.add(sun, fill);

  const bodies: (Body | null)[] = SPECS.map(() => null);
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const sphere = new SphereGeometry(1, 64, 40);
  let disposed = false;
  let clock = 0;
  let turnsWas = 0;
  let moving = 0;

  function addPlanet(index: number, spec: Spec, root: Object3D) {
    let found: Mesh | null = null;
    root.traverse((child) => {
      if (!found && (child as Mesh).isMesh) found = child as Mesh;
    });
    if (!found) return;
    const source = found as Mesh;
    const map = (source.material as MeshStandardMaterial).map as Texture;
    map.generateMipmaps = true;
    map.minFilter = LinearMipmapLinearFilter;
    map.needsUpdate = true;
    const air = spec.air;
    const material = new ShaderMaterial({
      vertexShader: bodyVertex,
      fragmentShader: bodyFragment,
      uniforms: {
        uMap: { value: map },
        uSun: { value: SUN },
        uBlur: { value: 1 },
        uFade: { value: 0 },
        uShown: { value: 0 },
        uTexels: { value: spec.face / QUARTER },
        // Beyond this the map's six squares would bleed into each other.
        uMaxLod: { value: Math.log2(spec.face / 14) },
        uHaze: { value: HAZE },
        uAir: { value: new Color(air?.color ?? 0x000000).multiplyScalar(air?.rim ?? 0) },
        uAirPower: { value: air?.power ?? 3 },
        uGlow: { value: flameLight },
        uGlowAt: { value: flameAt },
      },
      transparent: true,
    });
    source.geometry.computeBoundingSphere();
    const ball = new Mesh(source.geometry, material);
    ball.scale.setScalar(1 / (source.geometry.boundingSphere?.radius || 1));
    const turning = new Group();
    turning.add(ball);
    const group = new Group();
    group.rotation.set(spec.tilt[0], 0, 0);
    group.add(turning);
    let halo: ShaderMaterial | undefined;
    if (air && air.halo > 0) {
      halo = new ShaderMaterial({
        vertexShader: haloVertex,
        fragmentShader: haloFragment,
        uniforms: { uColor: { value: new Color(air.color) }, uStrength: { value: 0 }, uLimit: { value: Math.sqrt(1 - 1 / (HALO * HALO)) } },
        side: BackSide,
        transparent: true,
        depthWrite: false,
      });
      const shell = new Mesh(sphere, halo);
      shell.scale.setScalar(HALO);
      group.add(shell);
    }
    turning.rotation.y = spec.tilt[1];
    group.scale.setScalar(0.0001);
    scene.add(group);
    bodies[index] = { spec, group, turning, material, halo, born: clock, shown: 0 };
  }

  function addStation(index: number, spec: Spec, root: Object3D) {
    const box = new Box3().setFromObject(root);
    const middle = box.getCenter(new Vector3());
    const reach = box.getSize(new Vector3()).length() / 2 || 1;
    root.position.sub(middle);
    const turning = new Group();
    turning.add(root);
    turning.scale.setScalar(1 / reach);
    const group = new Group();
    group.rotation.set(spec.tilt[0], 0, 0.2);
    group.add(turning);
    turning.rotation.y = spec.tilt[1];
    group.scale.setScalar(0.0001);
    scene.add(group);
    bodies[index] = { spec, group, turning, born: clock, shown: 0 };
  }

  // One after another, in the order a visitor meets them, so the first is not kept waiting by the last.
  (async () => {
    for (let i = 0; i < SPECS.length; i++) {
      const spec = SPECS[i];
      try {
        const file = await loader.loadAsync(spec.file);
        if (disposed) return;
        if (spec.kind === "planet") addPlanet(i, spec, file.scene);
        else addStation(i, spec, file.scene);
      } catch {
        // A model that does not arrive leaves its place on the orbit empty; the flame and the others go on.
      }
    }
  })();

  /** Fits the picture into the part of the canvas that is free of words. */
  function fit() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    const free = Math.max(140, height - insets.top - insets.bottom);
    // The camera is set for the free part alone, then the view is widened to the whole canvas around it.
    const whole = free + 2 * Math.max(insets.top, insets.bottom);
    const half = Math.tan((VIEW * Math.PI) / 360);
    camera.fov = (Math.atan((half * whole) / free) * 360) / Math.PI;
    camera.setViewOffset(width, whole, 0, whole / 2 - (insets.top + free / 2), width, height);
    camera.updateProjectionMatrix();
    // The orbit is as wide as the page allows: wide on a desk, close to round on a phone.
    const reach = EYE.distanceTo(AIM) * half * (width / free);
    ring.across = Math.min(5.3, Math.max(1.9, reach * 0.74 - 0.55));
    // Deep enough that the place in front stands clear below the flame's foot.
    ring.depth = width / free < 1.5 ? 3.4 : 4.0;
    plane.uniforms.uRadii.value = [ring.across, ring.depth];
    floor.scale.set(ring.across * 3.1, ring.depth * 3.1, 1);
  }

  const layout: Layout = { bodies: SPECS.map(() => ({ x: 0, y: 0, r: 0, focus: 0, shown: 0, behind: false })), slot: { x: 0, y: 0, r: 0 }, flame: { x: 0, y: 0, top: 0 } };
  const at = new Vector3();
  const side = new Vector3();
  const right = new Vector3();

  /** A point of the scene as a place on the page. */
  function onPage(point: Vector3): { x: number; y: number } {
    at.copy(point).project(camera);
    return { x: ((at.x + 1) / 2) * width, y: ((1 - at.y) / 2) * height };
  }
  function spot(center: Vector3, radius: number, into: { x: number; y: number; r: number }) {
    const middle = onPage(center);
    side.copy(center).addScaledVector(right, radius);
    into.x = middle.x;
    into.y = middle.y;
    into.r = Math.abs(onPage(side).x - middle.x);
  }

  const where = new Vector3();
  let flameX = 0;
  let flameHalf = 0;
  function place(body: Body, index: number, turns: number, seconds: number, delta: number) {
    const angle = (turns - index) * QUARTER + REST;
    const front = (1 + Math.cos((turns - index) * QUARTER)) / 2;
    const focus = front * front;
    // Each one bobs a little, out of step with the others.
    const bob = options.still ? 0 : Math.sin(seconds * 0.7 + index * 1.9) * 0.05;
    where.set(ring.across * Math.sin(angle), bob + (body.spec.lift ?? 0) * focus, ring.depth * Math.cos(angle));
    const pop = options.still ? 1 : backOut((seconds - body.born) / 0.95);
    const size = body.spec.size * (0.72 + 0.28 * focus);
    const blur = 1 - focus;
    const fade = 0.56 * Math.pow(1 - front, 1.2);
    body.shown = Math.min(1, body.shown + delta * 2.2);
    const mark = layout.bodies[index];
    spot(where, size * (body.spec.fills ?? 1), mark);
    // Behind the flame a world would only peek round its edges, so there it steps out of sight.
    const clear = where.z < 0 ? Math.min(1, Math.max(0, (Math.abs(mark.x - flameX) - (mark.r * 0.5 + flameHalf)) / 70)) : 1;
    body.group.position.copy(where);
    // Out of focus a model loses its soft edge, so it is drawn a little larger to keep its place.
    body.group.scale.setScalar(Math.max(0.0001, size * pop * (1 + 0.1 * blur) * (0.5 + 0.5 * clear)));
    body.group.visible = clear > 0.01;
    // A planet turns on its axis. The station only rocks, so its long truss always lies across the picture.
    if (!options.still) body.turning.rotation.y = body.spec.tilt[1] + (body.spec.kind === "planet" ? seconds * body.spec.spin : Math.sin(seconds * body.spec.spin) * 0.42);
    if (body.material) {
      body.material.uniforms.uBlur.value = blur;
      body.material.uniforms.uFade.value = fade;
      body.material.uniforms.uShown.value = body.shown * clear;
      if (body.halo) body.halo.uniforms.uStrength.value = (body.spec.air?.halo ?? 0) * (0.12 + 0.88 * focus) * body.shown;
    } else {
      // The station is the only thing the scene's haze touches: placing the haze around it thins it by exactly `fade`.
      const fog = scene.fog as Fog;
      fog.near = camera.position.distanceTo(where) - fade * 1000;
      fog.far = fog.near + 1000;
    }
    mark.focus = focus;
    mark.behind = where.z < 0;
    mark.shown = body.shown * Math.min(1, pop) * clear;
  }

  function draw(turns: number, seconds: number, delta: number): Layout {
    clock = seconds;
    if (!width || !height) return layout;
    const g = gravityAt(turns);
    const stretch = stretchOf(g);
    // The flame is lit a moment after the page opens.
    const grow = options.still ? 1 : backOut((seconds - 0.2) / 1.1);
    flame.set(stretch, warmthOf(g), options.still ? 0 : seconds, grow);
    flameAt.set(0, (0.5 + 0.5 * stretch) * FLAME_SCALE, 0);
    const [r, gr, b] = flameGlow(g);
    glow.setRGB(r / 255, gr / 255, b / 255, SRGBColorSpace);
    ink.copy(glow).multiplyScalar(0.82);
    flameLight.copy(glow).multiplyScalar(0.9 * Math.min(1, grow));
    motes.set(options.still ? 0 : seconds, stretch, options.still ? 0 : Math.min(1, grow));
    dust.set(options.still ? 0 : seconds, turns, options.still ? 1 : Math.min(1, Math.max(0, seconds / 1.2)));

    lean.x += (lean.toX - lean.x) * Math.min(1, delta * 2.5);
    lean.y += (lean.toY - lean.y) * Math.min(1, delta * 2.5);
    camera.position.set(EYE.x + lean.x * 0.45, EYE.y + lean.y * 0.22, EYE.z);
    camera.lookAt(AIM);
    camera.updateMatrixWorld();
    right.setFromMatrixColumn(camera.matrixWorld, 0);

    moving += (Math.min(1, Math.abs(turns - turnsWas) / Math.max(delta, 0.001) / 0.9) - moving) * Math.min(1, delta * 6);
    turnsWas = turns;
    plane.uniforms.uMove.value = moving;
    plane.uniforms.uTime.value = options.still ? 0 : seconds;
    plane.uniforms.uTurn.value = turns;
    plane.uniforms.uShown.value = options.still ? 1 : Math.min(1, Math.max(0, (seconds - 0.1) / 0.9));
    flameX = onPage(where.set(0, 0, 0)).x;
    flameHalf = Math.abs(onPage(where.set(0.5 * FLAME_SCALE, 0, 0)).x - flameX);
    const angles = plane.uniforms.uAngles.value as number[];
    for (let i = 0; i < bodies.length; i++) {
      angles[i] = (turns - i) * QUARTER + REST;
      const body = bodies[i];
      if (body) place(body, i, turns, seconds, delta);
      else layout.bodies[i].shown = 0;
    }

    where.set(ring.across * Math.sin(REST), 0, ring.depth * Math.cos(REST));
    spot(where, 0.96, layout.slot);
    const foot = onPage(where.set(0, 0, 0));
    const tip = onPage(where.set(0, (1.12 + 0.98 * stretch) * FLAME_SCALE, 0));
    layout.flame.x = foot.x;
    layout.flame.y = foot.y;
    layout.flame.top = tip.y;

    renderer.render(scene, camera);
    return layout;
  }

  fit();

  return {
    draw,
    frame(top, bottom) {
      insets.top = top;
      insets.bottom = bottom;
      fit();
    },
    lean(x, y) {
      lean.toX = x;
      lean.toY = y;
    },
    dispose() {
      disposed = true;
      flame.dispose();
      floorGeometry.dispose();
      plane.dispose();
      motes.dispose();
      dust.dispose();
      sphere.dispose();
      for (const body of bodies) {
        if (!body) continue;
        body.group.traverse((child) => {
          const mesh = child as Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry.dispose();
          for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
            const map = (material as MeshStandardMaterial).map ?? ((material as ShaderMaterial).uniforms?.uMap?.value as Texture | undefined);
            map?.dispose();
            material.dispose();
          }
        });
      }
      renderer.dispose();
    },
  };
}
