import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  Line,
  MathUtils,
  ShaderMaterial,
  Vector3,
} from 'three';
import { places, routes } from '../data/profile';
import { SPIN_OFFSET, lonLatToVec3 } from './shapes';

const R = 1.645;
const SEGMENTS = 110;

const arcVertex = /* glsl */ `
  attribute float aT;
  varying float vT;
  void main() {
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const arcFragment = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  uniform float uOffset;
  uniform float uFade;
  uniform vec3  uColor;
  varying float vT;

  void main() {
    float travel = fract(vT - uTime * 0.13 + uOffset);
    float comet = pow(1.0 - travel, 22.0);
    float edge = smoothstep(0.0, 0.05, vT) * smoothstep(1.0, 0.95, vT);
    float alpha = (0.09 + comet * 1.0) * edge * uFade;
    gl_FragColor = vec4(uColor + comet * 0.35, alpha);
  }
`;

const markerVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vPulse;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float p = sin(uTime * 1.6 + aSeed * 6.283) * 0.5 + 0.5;
    vPulse = p;
    gl_PointSize = (6.0 + p * 7.0 + aSeed * 2.0) * uPixelRatio * (9.0 / max(0.25, -mv.z));
  }
`;

const markerFragment = /* glsl */ `
  precision mediump float;
  uniform float uFade;
  uniform vec3  uColor;
  varying float vPulse;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float core = smoothstep(0.22, 0.0, d);
    float ring = smoothstep(0.5, 0.32, d) * smoothstep(0.28, 0.4, d) * vPulse;
    float alpha = (core + ring * 0.85) * uFade;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

/** Great-circle interpolation, lifted into an arc so the path reads as travel. */
function greatCircle(from: Vector3, to: Vector3, lift: number) {
  const positions = new Float32Array((SEGMENTS + 1) * 3);
  const ts = new Float32Array(SEGMENTS + 1);
  const omega = Math.acos(MathUtils.clamp(from.clone().normalize().dot(to.clone().normalize()), -1, 1));
  const sinOmega = Math.sin(omega) || 1e-6;
  const a = from.clone().normalize();
  const b = to.clone().normalize();

  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const s1 = Math.sin((1 - t) * omega) / sinOmega;
    const s2 = Math.sin(t * omega) / sinOmega;
    const point = a.clone().multiplyScalar(s1).add(b.clone().multiplyScalar(s2));
    point.normalize().multiplyScalar(R * (1 + lift * Math.sin(Math.PI * t)));
    positions[i * 3] = point.x;
    positions[i * 3 + 1] = point.y;
    positions[i * 3 + 2] = point.z;
    ts[i] = t;
  }
  return { positions, ts };
}

export function Arcs({
  time,
  globeness,
  reduced,
}: {
  time: React.RefObject<number>;
  globeness: React.RefObject<number>;
  reduced: boolean;
}) {
  const group = useRef<Group>(null);
  const markerMaterial = useRef<ShaderMaterial>(null);
  const fade = useRef(0);
  const pixelRatio = Math.min(2, typeof window === 'undefined' ? 1 : window.devicePixelRatio);

  // `<line>` in JSX resolves to the SVG element, so the arcs are constructed
  // directly and mounted through <primitive>.
  const arcs = useMemo(
    () =>
      routes.map(([fromKey, toKey], index) => {
        const [flon, flat] = places[fromKey];
        const [tlon, tlat] = places[toKey];
        const from = new Vector3(...lonLatToVec3(flon, flat, R));
        const to = new Vector3(...lonLatToVec3(tlon, tlat, R));
        const { positions, ts } = greatCircle(from, to, 0.09 + from.distanceTo(to) * 0.075);

        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new BufferAttribute(positions, 3));
        geometry.setAttribute('aT', new BufferAttribute(ts, 1));

        const material = new ShaderMaterial({
          vertexShader: arcVertex,
          fragmentShader: arcFragment,
          uniforms: {
            uTime: { value: 0 },
            uOffset: { value: index / routes.length },
            uFade: { value: 0 },
            uColor: { value: [0.208, 0.909, 0.608] },
          },
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
        });

        const line = new Line(geometry, material);
        line.frustumCulled = false;
        return { line, material };
      }),
    [],
  );

  useEffect(
    () => () => {
      for (const arc of arcs) {
        arc.line.geometry.dispose();
        arc.material.dispose();
      }
    },
    [arcs],
  );

  const markers = useMemo(() => {
    const keys = Object.keys(places) as Array<keyof typeof places>;
    const positions = new Float32Array(keys.length * 3);
    const seeds = new Float32Array(keys.length);
    keys.forEach((key, i) => {
      const [lon, lat] = places[key];
      const [x, y, z] = lonLatToVec3(lon, lat, R * 1.006);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      seeds[i] = key === 'dhaka' ? 0 : 0.2 + i * 0.13;
    });
    return { positions, seeds };
  }, []);

  useFrame((_, delta) => {
    const step = Math.min(delta, 0.05);
    const t = time.current ?? 0;
    if (group.current) group.current.rotation.y = t * 0.055 + SPIN_OFFSET;

    // Arcs belong to the globe. They leave as soon as the field morphs away.
    const g = globeness.current ?? 0;
    const visible = Math.max(0, (g - 0.5) / 0.5);
    fade.current = MathUtils.damp(fade.current, visible, 4, step);

    for (const arc of arcs) {
      arc.material.uniforms.uTime.value = t;
      arc.material.uniforms.uFade.value = fade.current;
    }
    if (markerMaterial.current) {
      markerMaterial.current.uniforms.uTime.value = reduced ? 0 : t;
      markerMaterial.current.uniforms.uFade.value = fade.current;
    }
  });

  return (
    <group ref={group}>
      {arcs.map((arc, index) => (
        <primitive object={arc.line} key={index} />
      ))}

      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[markers.positions, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[markers.seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={markerMaterial}
          vertexShader={markerVertex}
          fragmentShader={markerFragment}
          uniforms={{
            uTime: { value: 0 },
            uFade: { value: 0 },
            uPixelRatio: { value: pixelRatio },
            uColor: { value: [1.0, 0.98, 0.9] },
          }}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  );
}
