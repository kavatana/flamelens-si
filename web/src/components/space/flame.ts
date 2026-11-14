import { Mesh, PlaneGeometry, ShaderMaterial, Vector3 } from "three";

/**
 * The flame of the home page and of the Safety page: an illustration, drawn by this code, of
 * how gravity shapes a candle flame. It is not footage and not a simulation of record.
 *
 * One number shapes it, `uStretch`: 1 is the flame of Earth, where hot gas rises and pulls the
 * flame into a slim teardrop that flickers; 0 is the flame of orbit, where nothing rises and
 * the flame is a still ball. A second, `uWarmth`, colours it: yellow and orange where soot
 * glows in a rising flame, blue where it does not. The two ends follow NASA's photographs of
 * the same candle; the shapes in between are estimates, and the page says so.
 *
 * A flame is the same from every side, so it is painted on a sheet that always faces the
 * viewer. The page is light, so the flame is drawn the way a flame is seen against daylight:
 * a pale core inside deeper colour, with a clean edge and a thin glow around it.
 */

/** The sheet the flame is painted on, in the flame's own units. The wick is at the origin. */
const WIDE = 2.8;
const TALL = 3.6;
const LIFT = 1.35;

const vertex = /* glsl */ `
uniform vec3 uOrigin;
uniform float uScale;
varying vec2 vP;
void main() {
  vP = position.xy + vec2(0.0, ${LIFT.toFixed(2)});
  // The sheet stands upright and turns to face the viewer.
  vec3 toEye = cameraPosition - uOrigin;
  vec3 right = normalize(vec3(toEye.z, 0.0, -toEye.x));
  vec3 world = uOrigin + (right * vP.x + vec3(0.0, 1.0, 0.0) * vP.y) * uScale;
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}`;

const fragment = /* glsl */ `
uniform float uTime;
uniform float uStretch;
uniform float uWarmth;
uniform float uGrow;
varying vec2 vP;

// A colour given the way a designer writes it, turned into light.
vec3 paint(float r, float g, float b) {
  return pow(vec3(r, g, b), vec3(2.2));
}

// The outline of a flame from its foot (0) to its tip (1): a ball without gravity, a teardrop with it.
float outlineAt(float s, float tip) {
  s = clamp(s, 0.0, 1.0);
  float ball = sqrt(max(0.0, 1.0 - (2.0 * s - 1.0) * (2.0 * s - 1.0)));
  float tear = pow(s, 0.45) * pow(1.0 - s, 1.15) / 0.386;
  return mix(ball, tear, tip);
}

// Lays one layer of paint over what is already there.
void over(inout vec3 color, inout float cover, vec3 layer, float amount) {
  float total = amount + cover * (1.0 - amount);
  color = (layer * amount + color * cover * (1.0 - amount)) / max(total, 0.00001);
  cover = total;
}

void main() {
  float e = uStretch;
  float w = uWarmth;
  // Any pull of gravity at all gives a flame its tip.
  float tip = smoothstep(0.0, 0.3, e);
  float lit = mix(0.3, 1.0, uGrow);
  float flicker = 1.0 + e * (0.03 * sin(uTime * 7.3) + 0.018 * sin(uTime * 12.7 + 1.3)) + (1.0 - e) * 0.012 * sin(uTime * 1.1);
  float H = mix(1.12, 2.1, e) * lit * flicker;
  float W = mix(0.56, 0.4, e) * mix(0.55, 1.0, uGrow);
  float s = vP.y / H;
  float up = clamp(s, 0.0, 1.0);

  // The flame leans and recovers, more toward its tip. Without gravity it holds still.
  float sway = e * up * up * (0.085 * sin(uTime * 2.3 + vP.y * 1.7) + 0.04 * sin(uTime * 4.1 + vP.y * 2.9));
  float x = vP.x - sway;
  float ripple = 1.0 + e * 0.028 * sin(vP.y * 9.0 - uTime * 7.0 + sin(vP.y * 4.0 - uTime * 3.0)) * smoothstep(0.1, 0.5, up);
  float R = W * outlineAt(s, tip) * ripple;

  // A flame has no hard edge: it thins out over the last part of its width, and toward its tip.
  float F = abs(x) - R;
  float inside = 1.0 - smoothstep(-0.2 * W, 0.05 * W, F);
  inside *= smoothstep(-0.02, 0.03, vP.y) * (1.0 - smoothstep(H * 0.9, H * 1.02, vP.y));

  // 0 on the flame's centre line, 1 at its edge; and how much flame lies behind this pixel.
  float u = clamp(abs(x) / max(R, 0.0001), 0.0, 1.0);
  float depth = sqrt(1.0 - u * u);

  // With gravity. Three flames one inside the other, each shorter and slimmer and a little
  // slower to lean: deep orange outside, amber within, pale yellow at the heart.
  float s2 = vP.y / (H * 0.68);
  float u2 = abs(vP.x - sway * 0.8) / max(W * 0.64 * outlineAt(s2, tip), 0.0001);
  float in2 = step(0.0, s2) * step(s2, 1.0);
  float s3 = vP.y / (H * 0.42);
  float u3 = abs(vP.x - sway * 0.6) / max(W * 0.36 * outlineAt(s3, tip), 0.0001);
  float in3 = step(0.0, s3) * step(s3, 1.0);
  vec3 warm = mix(paint(0.95, 0.33, 0.03), paint(1.0, 0.56, 0.06), smoothstep(0.0, 0.5, depth));
  warm = mix(warm, paint(1.0, 0.72, 0.16), (1.0 - smoothstep(0.3, 1.25, u2)) * in2);
  warm = mix(warm, paint(1.0, 0.86, 0.4), (1.0 - smoothstep(0.0, 1.0, u2)) * in2 * 0.85);
  warm = mix(warm, paint(1.0, 0.96, 0.74), (1.0 - smoothstep(0.0, 1.2, u3)) * in3 * 0.9);
  warm = mix(warm, paint(0.96, 0.36, 0.03), smoothstep(0.6, 1.0, up) * 0.55);
  // Around the wick a candle flame is nearly clear, and its tip thins out.
  float warmCover = inside * (0.94 - 0.5 * smoothstep(0.5, 1.0, up)) * mix(0.22, 1.0, smoothstep(0.02, 0.22, up));
  // Its foot is a thin cup of blue.
  float cup = inside * smoothstep(0.22, 0.02, up) * smoothstep(0.2, 0.88, u) * 0.8;

  // Without gravity. A ball of blue light, deepest at its edge and almost clear in the middle,
  // with a faint warm heart just above the wick, as in NASA's photograph.
  vec3 cold = mix(paint(0.09, 0.24, 0.86), paint(0.27, 0.5, 1.0), smoothstep(0.0, 0.5, depth));
  cold = mix(cold, paint(0.7, 0.83, 1.0), smoothstep(0.5, 1.0, depth));
  float coldCover = inside * mix(0.96, 0.34, smoothstep(0.05, 0.95, depth)) * mix(1.0, 0.74, up);
  float heartAt = (x * x + (vP.y - 0.2 * H) * (vP.y - 0.2 * H)) / (0.05 * H * H);
  float heart = exp(-heartAt) * inside;
  cold = mix(cold, paint(1.0, 0.7, 0.52), heart * 0.75);
  coldCover = max(coldCover, heart * 0.6);

  // The flame's light on the air just around it.
  float along = smoothstep(-0.12, 0.08, s) * (1.0 - smoothstep(0.96, 1.16, s));
  float halo = exp(-max(F, 0.0) / (0.3 * W)) * 0.2 * along;
  vec3 color = mix(paint(0.2, 0.42, 1.0), paint(1.0, 0.46, 0.05), w);
  float cover = halo;

  float body = mix(coldCover, warmCover, w);
  over(color, cover, (cold * coldCover * (1.0 - w) + warm * warmCover * w) / max(body, 0.00001), body);
  over(color, cover, paint(0.14, 0.36, 0.98), cup * w);

  // The wick.
  float wick = (1.0 - smoothstep(0.01, 0.024, abs(vP.x - 0.012 * sin(vP.y * 9.0)))) * smoothstep(-0.03, 0.0, vP.y) * (1.0 - smoothstep(0.08, 0.17, vP.y));
  over(color, cover, paint(0.13, 0.11, 0.1), wick * 0.7);

  cover *= min(1.0, uGrow * 1.6);
  if (cover < 0.004) discard;
  gl_FragColor = vec4(color, cover);
  #include <colorspace_fragment>
}`;

export type Flame = {
  mesh: Mesh;
  /** `stretch` is 1 on Earth and 0 in orbit, `warmth` 1 for a yellow flame and 0 for a blue one; `grow` is 0 before the flame is lit and 1 once it burns. */
  set: (stretch: number, warmth: number, seconds: number, grow: number) => void;
  /** Where the wick is, and how large the flame is drawn. */
  place: (origin: Vector3, scale: number) => void;
  dispose: () => void;
};

export function createFlame(): Flame {
  const origin = new Vector3();
  const material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: { uTime: { value: 0 }, uStretch: { value: 1 }, uWarmth: { value: 1 }, uGrow: { value: 1 }, uScale: { value: 1 }, uOrigin: { value: origin } },
    transparent: true,
    depthWrite: false,
  });
  const geometry = new PlaneGeometry(WIDE, TALL);
  const mesh = new Mesh(geometry, material);
  // The sheet is placed by its shader, so its own position says nothing about where it is.
  mesh.frustumCulled = false;
  mesh.renderOrder = 10;
  return {
    mesh,
    set(stretch, warmth, seconds, grow) {
      material.uniforms.uStretch.value = stretch;
      material.uniforms.uWarmth.value = warmth;
      material.uniforms.uTime.value = seconds;
      material.uniforms.uGrow.value = grow;
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
