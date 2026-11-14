import { BufferAttribute, BufferGeometry, Color, Points, ShaderMaterial } from "three";

/**
 * Dust in the space around the orbit: small points near and far. What is out of focus is
 * larger and fainter, as through a lens, which is what gives the pale sky its depth. The
 * field turns a little with the orbit, so near points pass far ones.
 */

const vertex = /* glsl */ `
attribute vec3 aSeed;
uniform float uTime;
uniform float uTurn;
uniform float uPixel;
uniform float uFocus;
varying float vAlpha;
varying float vTint;
void main() {
  vec3 p = position;
  float turn = uTurn * 0.3 + uTime * 0.01;
  p.xz = mat2(cos(turn), -sin(turn), sin(turn), cos(turn)) * p.xz;
  p.y += sin(uTime * 0.22 + aSeed.y * 40.0) * 0.14;
  vec4 seen = viewMatrix * vec4(p, 1.0);
  float far = -seen.z;
  float soft = abs(far - uFocus) / uFocus;
  float size = (1.2 + 1.9 * aSeed.x) * (uFocus / far) * (1.0 + soft * 2.2);
  gl_PointSize = clamp(size * uPixel, 1.0, 9.0 * uPixel);
  float twinkle = 0.62 + 0.38 * sin(uTime * (0.5 + aSeed.y) + aSeed.y * 60.0);
  vAlpha = twinkle * (0.55 / (1.0 + soft * soft * 14.0) + 0.06);
  vTint = step(0.84, aSeed.z);
  gl_Position = projectionMatrix * seen;
}`;

const fragment = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uWarm;
uniform float uShown;
varying float vAlpha;
varying float vTint;
void main() {
  float d = length(gl_PointCoord - 0.5);
  gl_FragColor = vec4(mix(uColor, uWarm, vTint), smoothstep(0.5, 0.1, d) * vAlpha * uShown);
  #include <colorspace_fragment>
}`;

export type Dust = { points: Points; set: (seconds: number, turns: number, shown: number) => void; dispose: () => void };

/** `warm` is the flame's colour, shared with the scene: a few of the points carry it. `focus` is how far away things are sharp. */
export function createDust(count: number, pixel: number, focus: number, warm: Color): Dust {
  let s = 4021977;
  const random = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const position = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Around the orbit and beyond it, on every side and above.
    const angle = random() * Math.PI * 2;
    const reach = 2.2 + Math.pow(random(), 0.7) * 12.5;
    position.set([Math.cos(angle) * reach, -1.6 + random() * 7.4, Math.sin(angle) * reach], i * 3);
    seeds.set([random(), random(), random()], i * 3);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(position, 3));
  geometry.setAttribute("aSeed", new BufferAttribute(seeds, 3));
  const material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: { uTime: { value: 0 }, uTurn: { value: 0 }, uPixel: { value: pixel }, uFocus: { value: focus }, uShown: { value: 0 }, uColor: { value: new Color(0x4a5d86) }, uWarm: { value: warm } },
    transparent: true,
    depthWrite: false,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = -8;
  return {
    points,
    set(seconds, turns, shown) {
      material.uniforms.uTime.value = seconds;
      material.uniforms.uTurn.value = turns;
      material.uniforms.uShown.value = shown;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
