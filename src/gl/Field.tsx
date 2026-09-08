import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  MathUtils,
  NormalBlending,
  type BufferAttribute,
  type Points,
  type ShaderMaterial,
} from 'three';
import {
  SHAPE_COLOR,
  SHAPE_PRESENCE,
  SPIN_OFFSET,
  type FieldBuffers,
  type ShapeId,
} from './shapes';

/**
 * Only two shapes are ever on the GPU: the one being left (`position`) and the
 * one being entered (`aTo`). Adding a shape costs CPU memory, never per-vertex
 * bandwidth — which is the difference between smooth and unusable on a cheap
 * phone.
 */
const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uMix;
  uniform float uBoot;
  uniform float uSpin;
  uniform float uSpinFrom;
  uniform float uSpinTo;
  uniform vec3  uPointer;
  uniform float uPointerOn;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3  uColorFrom;
  uniform vec3  uColorTo;

  attribute vec3  aTo;
  attribute float aSeed;
  attribute vec3  aTint;

  varying vec3  vTint;
  varying float vFade;
  varying float vGlow;

  vec3 rotateY(vec3 p, float a) {
    float s = sin(a);
    float c = cos(a);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  }

  void main() {
    // Each dot arrives on its own beat, so the new shape assembles rather than
    // snapping into place all at once.
    float local = clamp((uMix - aSeed * 0.3) / 0.7, 0.0, 1.0);
    float m = local * local * (3.0 - 2.0 * local);
    float angle = uTime * 0.055 + uSpin;

    vec3 a = rotateY(position, angle * uSpinFrom);
    vec3 b = rotateY(aTo, angle * uSpinTo);
    vec3 pos = mix(a, b, m);

    // The dots lift away and fall back down into the next shape.
    float arc = sin(local * 3.14159265);
    pos.y += arc * (0.45 + aSeed * 0.7);
    pos.x += arc * (aSeed - 0.5) * 0.35;

    // Only the globe breathes. An emblem is a logo: once it has formed it
    // holds perfectly still until the next one is asked for.
    float globeness = mix(uSpinFrom, uSpinTo, m);
    float t = uTime * 0.35 + aSeed * 6.2831853;
    pos += vec3(
      sin(t + pos.y * 1.4),
      cos(t * 0.9 + pos.x * 1.2),
      sin(t * 1.1 + pos.z * 1.3)
    ) * mix(0.0, 0.005, globeness) * (1.0 - arc);

    vec3 scattered = normalize(pos + vec3(aSeed - 0.5, aSeed * 0.7 - 0.35, 0.5 - aSeed))
      * (2.8 + aSeed * 5.4);
    float boot = clamp(uBoot * 1.4 - aSeed * 0.4, 0.0, 1.0);
    boot = boot * boot * (3.0 - 2.0 * boot);
    pos = mix(scattered, pos, boot);

    // Repulsion happens in world space. Done in local space it is centred on
    // every shape's own origin, which punches a hole through the middle of
    // each emblem no matter where the pointer actually is.
    vec4 world = modelMatrix * vec4(pos, 1.0);
    vec2 delta = world.xy - uPointer.xy;
    float dist = length(delta);
    float push = uPointerOn * globeness * exp(-dist * dist * 1.6) * 0.42;
    world.xy += normalize(delta + vec2(0.0001)) * push;

    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.6 + aSeed * 0.85) * uPixelRatio * (9.0 / max(0.25, -mv.z));

    float colourMix = mix(0.86, 0.32, globeness);
    vTint = mix(aTint, mix(uColorFrom, uColorTo, m), colourMix);
    vFade = boot;
    vGlow = 0.6 + aSeed * 0.4;
  }
`;

const fragment = /* glsl */ `
  precision mediump float;

  uniform float uLight;
  uniform float uOpacity;

  varying vec3  vTint;
  varying float vFade;
  varying float vGlow;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c);
    if (d > 0.25) discard;
    float a = smoothstep(0.25, 0.02, d);
    vec3 col = mix(vTint * vGlow * 1.2, vTint * 0.28, uLight);
    gl_FragColor = vec4(col, a * vFade * mix(uOpacity, uOpacity * 1.6, uLight));
  }
`;

export function Field({
  buffers,
  shape,
  time,
  globeness,
  morph,
  active,
  size,
  light,
  reduced,
}: {
  buffers: FieldBuffers;
  /** The shape the field should be heading toward, driven by the layout. */
  shape: React.RefObject<ShapeId>;
  /** Shared clock — the arcs rotate off the same value the globe spins by. */
  time: React.RefObject<number>;
  /** How globe-like the field currently is, so the occluder can follow. */
  globeness: React.RefObject<number>;
  /** Eased morph progress, shared so the stage can travel in step with it. */
  morph: React.RefObject<number>;
  /** False where the layout offers no slot — the field draws nothing there. */
  active: React.RefObject<boolean>;
  size: number;
  light: boolean;
  reduced: boolean;
}) {
  const points = useRef<Points>(null);
  const material = useRef<ShaderMaterial>(null);
  const { viewport, pointer } = useThree();
  const pointerOn = useRef(0);
  const pointerLive = useRef(false);

  // Until a real mouse moves, `pointer` sits at (0, 0) — dead centre of the
  // screen — and the repulsion would carve a hole out of whatever is there.
  // Touch devices never arm it at all.
  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches) return;
    const arm = () => {
      pointerLive.current = true;
    };
    window.addEventListener('pointermove', arm, { once: true, passive: true });
    return () => window.removeEventListener('pointermove', arm);
  }, []);

  // Two owned buffers, written in place. Nothing is reallocated on a change.
  const state = useMemo(() => {
    const count = buffers.count;
    const from = new Float32Array(buffers.shapes.globe);
    const to = new Float32Array(buffers.shapes.globe);
    return { from, to, count, fromId: 'globe' as ShapeId, toId: 'globe' as ShapeId, mix: 1 };
  }, [buffers]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMix: { value: 1 },
      uBoot: { value: reduced ? 1 : 0 },
      uSpin: { value: SPIN_OFFSET },
      uSpinFrom: { value: 1 },
      uSpinTo: { value: 1 },
      uPointer: { value: [0, 0, 0] as [number, number, number] },
      uPointerOn: { value: 0 },
      uSize: { value: size },
      uPixelRatio: { value: 1 },
      uColorFrom: { value: [...SHAPE_COLOR.globe] },
      uColorTo: { value: [...SHAPE_COLOR.globe] },
      uLight: { value: light ? 1 : 0 },
      uOpacity: { value: SHAPE_PRESENCE.globe },
    }),
    // Created once; every value is driven imperatively in useFrame below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [buffers],
  );

  useEffect(() => {
    if (material.current) material.current.uniforms.uSize.value = size;
  }, [size]);

  /**
   * Freezes the current blend into `from`, then aims at the next shape.
   * Uniforms are read and written through the live material — the object
   * passed as a prop is not guaranteed to be the one three ends up holding.
   */
  function retarget(m: ShaderMaterial, next: ShapeId) {
    const blend = state.mix * state.mix * (3 - 2 * state.mix);
    const { from, to } = state;

    // The common case is a settled shape, where the blend is a straight copy —
    // and a native set() is far cheaper than walking 78,000 floats by hand.
    if (state.mix >= 1) from.set(to);
    else for (let i = 0; i < from.length; i++) from[i] += (to[i] - from[i]) * blend;

    to.set(buffers.shapes[next]);

    const u = m.uniforms;
    u.uSpinFrom.value = MathUtils.lerp(u.uSpinFrom.value, u.uSpinTo.value, blend);
    u.uSpinTo.value = next === 'globe' ? 1 : 0;
    u.uColorFrom.value = [
      MathUtils.lerp(u.uColorFrom.value[0], u.uColorTo.value[0], blend),
      MathUtils.lerp(u.uColorFrom.value[1], u.uColorTo.value[1], blend),
      MathUtils.lerp(u.uColorFrom.value[2], u.uColorTo.value[2], blend),
    ];
    u.uColorTo.value = [...SHAPE_COLOR[next]];

    state.fromId = state.toId;
    state.toId = next;
    state.mix = 0;

    const geometry = points.current?.geometry;
    if (geometry) {
      (geometry.getAttribute('position') as BufferAttribute).needsUpdate = true;
      (geometry.getAttribute('aTo') as BufferAttribute).needsUpdate = true;
    }
  }

  useFrame((root, delta) => {
    const m = material.current;
    if (!m) return;
    const step = Math.min(delta, 0.05);

    if (!reduced) m.uniforms.uTime.value += step;
    time.current = m.uniforms.uTime.value;
    m.uniforms.uBoot.value = MathUtils.damp(m.uniforms.uBoot.value, 1, 1.15, step);
    m.uniforms.uPixelRatio.value = root.viewport.dpr;

    // Point size tracks how small the current slot is, so a compact emblem
    // stays legible instead of clogging into a solid shape.
    const stage = points.current?.parent?.scale.x ?? 0.75;
    m.uniforms.uSize.value = size * MathUtils.clamp(stage * 1.25, 0.34, 1.1);

    const wanted = shape.current ?? 'globe';
    if (wanted !== state.toId) retarget(m, wanted);

    state.mix = Math.min(1, state.mix + step * (reduced ? 4 : 1.05));
    m.uniforms.uMix.value = state.mix;

    const eased = state.mix * state.mix * (3 - 2 * state.mix);
    morph.current = eased;
    globeness.current = MathUtils.lerp(m.uniforms.uSpinFrom.value, m.uniforms.uSpinTo.value, eased);

    const presence = MathUtils.lerp(
      SHAPE_PRESENCE[state.fromId],
      SHAPE_PRESENCE[state.toId],
      eased,
    );
    // Nothing is drawn in sections that offer no slot, so there is never a
    // field of dots sitting behind the reading.
    const visible = active.current ? 1 : 0;
    m.uniforms.uOpacity.value = MathUtils.damp(
      m.uniforms.uOpacity.value,
      presence * visible * (light ? 0.7 : 1),
      3.4,
      step,
    );

    const wantPointer = reduced || !pointerLive.current ? 0 : 1;
    pointerOn.current = MathUtils.damp(pointerOn.current, wantPointer, 3, step);
    m.uniforms.uPointerOn.value = pointerOn.current;
    m.uniforms.uPointer.value = [
      (pointer.x * viewport.width) / 2,
      (pointer.y * viewport.height) / 2,
      0,
    ];

    m.uniforms.uLight.value = MathUtils.damp(m.uniforms.uLight.value, light ? 1 : 0, 4, step);
    m.blending = light ? NormalBlending : AdditiveBlending;
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[state.from, 3]} />
        <bufferAttribute attach="attributes-aTo" args={[state.to, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[buffers.seed, 1]} />
        <bufferAttribute attach="attributes-aTint" args={[buffers.tint, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertex}
        fragmentShader={fragment}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
