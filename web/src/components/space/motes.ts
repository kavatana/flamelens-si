import { BufferAttribute, BufferGeometry, Color, Points, ShaderMaterial, Vector3 } from "three";

/**
 * Specks of hot gas, or of smoke, leaving a flame. With gravity they rise from its tip; with
 * none they drift slowly outward from its whole surface. It is the one motion that shows why
 * a flame on Earth and a flame in orbit differ: on Earth, what is hot goes up.
 */

const vertex = /* glsl */ `
attribute vec4 aSeed;
uniform float uTime;
uniform float uStretch;
uniform float uPixel;
uniform float uScale;
uniform float uAlpha;
uniform float uRise;
uniform float uSize;
uniform vec3 uOrigin;
varying float vAlpha;
void main() {
  float e = uStretch;
  float life = mix(6.0, 2.3, e) * (0.7 + 0.6 * aSeed.y);
  float age = fract(uTime / life + aSeed.x);
  float turn = aSeed.z * 6.2831853;
  float level = sqrt(max(0.0, 1.0 - aSeed.w * aSeed.w));
  vec3 out3 = vec3(cos(turn) * level, aSeed.w, sin(turn) * level);
  vec3 drifting = vec3(0.0, 0.55, 0.0) + out3 * (0.52 + age * 0.9);
  vec3 rising = vec3(cos(turn) * 0.14 * (0.4 + age), 1.95 + age * uRise, sin(turn) * 0.14 * (0.4 + age));
  rising.x += sin(age * 7.0 + aSeed.x * 20.0) * 0.07;
  vec3 local = mix(drifting, rising, e);
  vAlpha = sin(3.14159265 * age) * 0.6 * uAlpha;
  gl_PointSize = (1.7 + 1.9 * aSeed.y) * uPixel * uSize;
  gl_Position = projectionMatrix * viewMatrix * vec4(uOrigin + local * uScale, 1.0);
}`;

const fragment = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  gl_FragColor = vec4(uColor, smoothstep(0.5, 0.12, d) * vAlpha);
  #include <colorspace_fragment>
}`;

export type Motes = {
  points: Points;
  /** `stretch` is 1 where gravity lifts them and 0 where nothing does; `alpha` is how visible they are. */
  set: (seconds: number, stretch: number, alpha: number) => void;
  /** How far they rise above the flame's tip, in the flame's units, and how large they are drawn. */
  shape: (rise: number, size: number) => void;
  place: (origin: Vector3, scale: number) => void;
  dispose: () => void;
};

/** The specks are in the same places on every visit. `color` is shared: change it and they change. */
export function createMotes(count: number, pixel: number, color: Color): Motes {
  let s = 20261114;
  const random = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) seeds.set([random(), random(), random(), random() * 2 - 1], i * 4);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute("aSeed", new BufferAttribute(seeds, 4));
  const origin = new Vector3();
  const material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: { uTime: { value: 0 }, uStretch: { value: 1 }, uPixel: { value: pixel }, uScale: { value: 1 }, uAlpha: { value: 0 }, uRise: { value: 1.15 }, uSize: { value: 1 }, uOrigin: { value: origin }, uColor: { value: color } },
    transparent: true,
    depthWrite: false,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 11;
  return {
    points,
    set(seconds, stretch, alpha) {
      material.uniforms.uTime.value = seconds;
      material.uniforms.uStretch.value = stretch;
      material.uniforms.uAlpha.value = alpha;
    },
    shape(rise, size) {
      material.uniforms.uRise.value = rise;
      material.uniforms.uSize.value = size;
    },
    place(at, scale) {
      origin.copy(at);
      material.uniforms.uScale.value = scale;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
