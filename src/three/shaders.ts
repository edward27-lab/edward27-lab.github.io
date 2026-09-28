// GLSL for the moon surface and the star field.
// Kept in a .ts file so Vite needs no extra loader.

export const moonVertex = /* glsl */ `
uniform sampler2D heightMap;
uniform float displacement;

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormalW;
varying vec3 vTangentW;
varying vec3 vBitangentW;
varying vec3 vNormalObj;

void main() {
  vUv = uv;
  // analytic tangent frame for a UV sphere: +u (east) and +v (north) directions
  vec3 n = normalize(normal);
  vec3 t = normalize(vec3(n.z, 0.0, -n.x));
  vec3 b = cross(n, t);
  vNormalObj = n;

  float h = texture2D(heightMap, uv).r - 0.5;
  vec3 displaced = position + n * (h * displacement);

  vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = worldPos.xyz;
  vNormalW = normalize(mat3(modelMatrix) * n);
  vTangentW = normalize(mat3(modelMatrix) * t);
  vBitangentW = normalize(mat3(modelMatrix) * b);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const moonFragment = /* glsl */ `
precision highp float;

uniform sampler2D albedoMap;
uniform sampler2D normalMap;
uniform vec3 sunDir;        // world space, normalised, points from moon to sun
uniform vec3 cameraPosW;
uniform float normalScale;
uniform float exposure;
uniform vec3 earthshineColor;
uniform float earthshine;
uniform float terminatorSoftness;
uniform float lambertMix;
uniform float oppositionB0;
uniform float oppositionH;
uniform float hgXi;
uniform float debugMode;
uniform sampler2D heightMap;
uniform float heightRange;   // world height span of the height map (in moon radii)
uniform float texelAngle;    // radians per texel at the equator
uniform float shadowStrength;

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormalW;
varying vec3 vTangentW;
varying vec3 vBitangentW;
varying vec3 vNormalObj;

// Henyey-Greenstein single-particle phase function (backscattering when xi < 0)
float hg(float cosg, float xi) {
  float d = 1.0 + 2.0 * xi * cosg + xi * xi;
  return (1.0 - xi * xi) / pow(max(d, 1e-4), 1.5);
}

void main() {
  vec3 albedo = texture2D(albedoMap, vUv).rgb;
  vec3 nm = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;
  nm.xy *= normalScale;
  vec3 Ng = normalize(vNormalW);
  vec3 N = normalize(vTangentW * nm.x + vBitangentW * nm.y + Ng * nm.z);

  vec3 L = normalize(sunDir);
  vec3 V = normalize(cameraPosW - vWorldPos);

  float mu0g = dot(Ng, L);              // geometric sun angle (drives the terminator)
  float mu0 = max(dot(N, L), 0.0);      // detailed sun angle (crater relief)
  float mu = max(dot(N, V), 0.0);
  float cosg = clamp(dot(L, V), -1.0, 1.0);
  float g = acos(cosg);                 // phase angle

  // Long shadows: a soft horizon term that darkens the last degrees before the terminator.
  float horizon = smoothstep(-0.02, terminatorSoftness, mu0g);
  // Sharpen relief near the terminator so craters cast pseudo-shadows.
  float relief = smoothstep(0.0, 0.18, mu0);
  float lit = mu0 * relief * horizon;

  // Cast shadows: march the height field toward the sun near the terminator.
  // Crater rims and mountains block low sunlight, which is what makes the
  // terminator look three-dimensional.
  if (shadowStrength > 0.0 && mu0g < 0.55 && mu0g > -0.05) {
    vec3 Lt = vec3(dot(L, normalize(vTangentW)), dot(L, normalize(vBitangentW)), max(dot(L, Ng), 0.02));
    float horiz = max(length(Lt.xy), 1e-4);
    vec2 dir = Lt.xy / horiz;
    float rise = Lt.z / horiz;                    // ray height gained per unit horizontal distance
    float cosLat = max(sqrt(1.0 - vNormalObj.y * vNormalObj.y), 0.05);
    float h0 = (texture2D(heightMap, vUv).r - 0.5) * heightRange;
    float shadow = 0.0;
    float step = texelAngle * 1.6;
    for (int i = 1; i <= 14; i++) {
      float s = step * float(i) * (1.0 + 0.12 * float(i));
      vec2 duv = vec2(dir.x * s / (6.2831853 * cosLat), dir.y * s / 3.1415926);
      float hs = (texture2D(heightMap, vUv + duv).r - 0.5) * heightRange;
      float hr = h0 + s * rise;
      shadow = max(shadow, clamp((hs - hr) / (heightRange * 0.06), 0.0, 1.0));
    }
    float fade = 1.0 - smoothstep(0.35, 0.55, mu0g);   // only near the terminator
    lit *= 1.0 - shadow * shadowStrength * fade;
  }

  // Lommel-Seeliger keeps the disc flat and bright at full phase (the "moon look");
  // a little Lambert brings back some curvature for gibbous phases.
  float ls = min(2.0 * lit / max(mu0 + mu, 1e-3), 1.25);
  float lam = lit;
  float shading = mix(ls, lam, lambertMix);

  // Opposition surge + backscatter phase function, normalised to 1 at full phase.
  float surge = 1.0 + oppositionB0 / (1.0 + tan(0.5 * g) / oppositionH);
  float surge0 = 1.0 + oppositionB0;
  float phase = hg(cosg, hgXi) / hg(1.0, hgXi) * surge / surge0;
  phase = mix(phase, 1.0, 0.35);

  vec3 sunlight = vec3(1.0, 0.99, 0.975);
  vec3 color = albedo * shading * phase * sunlight;

  // Earthshine: the night side is faintly lit from the observer's direction.
  float night = 1.0 - smoothstep(-0.15, 0.05, mu0g);
  float earthLit = max(dot(N, V), 0.0);
  color += albedo * earthshineColor * earthshine * earthLit * (0.35 + 0.65 * night);

  // faint starlight ambient so the limb never disappears completely
  color += albedo * 0.0035;

  color *= exposure;

  // slight limb darkening from regolith scattering at grazing view angles
  float limb = smoothstep(0.0, 0.25, dot(Ng, V));
  color *= 0.75 + 0.25 * limb;

  if (debugMode > 0.5 && debugMode < 1.5) color = albedo;
  if (debugMode > 1.5 && debugMode < 2.5) color = vec3(shading);
  if (debugMode > 2.5 && debugMode < 3.5) color = vec3(phase);
  if (debugMode > 3.5) color = N * 0.5 + 0.5;
  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export const starVertex = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute float aTwinkle;
attribute vec3 aColor;
uniform float uTime;
uniform float uPixelRatio;
uniform float uScale;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vColor = aColor;
  float tw = 0.65 + 0.35 * sin(uTime * (0.8 + aTwinkle * 2.2) + aPhase * 6.2831);
  vAlpha = mix(1.0, tw, aTwinkle);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uPixelRatio * uScale;
  gl_Position = projectionMatrix * mv;
}
`;

export const starFragment = /* glsl */ `
precision highp float;
varying vec3 vColor;
varying float vAlpha;
uniform float uOpacity;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  float core = exp(-d * d * 6.0);
  float halo = exp(-d * d * 1.6) * 0.25;
  float a = (core + halo) * vAlpha * uOpacity;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor * a, a);
}
`;

export const glowVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const glowFragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uIntensity;
uniform vec3 uColor;
uniform vec2 uLightDir; // screen-space direction of the sun, for an offset halo

void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float r = length(p);
  // halo brightest just outside the limb (r ~ 0.55 in sprite space), skewed toward the sun
  float skew = 0.5 + 0.5 * dot(normalize(p + 1e-4), uLightDir);
  float ring = exp(-pow((r - 0.56) / 0.10, 2.0)) * (0.35 + 0.65 * skew);
  float wide = exp(-r * r * 3.0) * 0.22;
  float a = (ring + wide) * uIntensity;
  a *= smoothstep(1.0, 0.7, r);
  gl_FragColor = vec4(uColor * a, a);
}
`;
