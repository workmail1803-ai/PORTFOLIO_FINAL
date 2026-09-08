import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, type Mesh, type ShaderMaterial } from 'three';

/**
 * An opaque sphere sitting just inside the particle shell.
 *
 * Without it the land points on the far side render straight through the near
 * side and the continents read as noise. It also gives the globe a body: a
 * near-black core with a lit rim. It scales away the moment the field morphs
 * out of the globe state, so it never occludes the other shapes.
 */

const vertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  precision mediump float;
  uniform float uLight;
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    float facing = max(0.0, dot(normalize(vNormal), normalize(vView)));
    float rim = pow(1.0 - facing, 3.4);

    vec3 darkCore = vec3(0.016, 0.055, 0.036);
    vec3 darkRim  = vec3(0.055, 0.30, 0.20);
    vec3 lightCore = vec3(0.945, 0.941, 0.918);
    vec3 lightRim  = vec3(0.78, 0.82, 0.78);

    vec3 core = mix(darkCore, lightCore, uLight);
    vec3 edge = mix(darkRim, lightRim, uLight);
    gl_FragColor = vec4(mix(core, edge, rim), 1.0);
  }
`;

export function Globe({
  globeness,
  light,
}: {
  /** 1 while the field is the globe, 0 once it has morphed into anything else. */
  globeness: React.RefObject<number>;
  light: boolean;
}) {
  const mesh = useRef<Mesh>(null);
  const material = useRef<ShaderMaterial>(null);

  useFrame((_, delta) => {
    const node = mesh.current;
    if (!node) return;
    const step = Math.min(delta, 0.05);

    // Gone as soon as the field stops being a globe, so it never occludes
    // the flat shapes.
    const g = globeness.current ?? 0;
    const wanted = MathUtils.clamp((g - 0.45) / 0.55, 0, 1);
    const scale = MathUtils.damp(node.scale.x, wanted, 5, step);
    node.scale.setScalar(scale);
    node.visible = scale > 0.03;

    if (material.current) {
      material.current.uniforms.uLight.value = MathUtils.damp(
        material.current.uniforms.uLight.value,
        light ? 1 : 0,
        4,
        step,
      );
    }
  });

  return (
    <mesh ref={mesh} frustumCulled={false}>
      <sphereGeometry args={[1.572, 64, 48]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={{ uLight: { value: light ? 1 : 0 } }}
      />
    </mesh>
  );
}
