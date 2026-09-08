import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Group, MathUtils } from 'three';
import { Field } from './Field';
import { Arcs } from './Arcs';
import { Globe } from './Globe';
import {
  BUDGET,
  EXTENT,
  buildField,
  detectTier,
  loadLandMask,
  type FieldBuffers,
  type ShapeId,
} from './shapes';

const FOV = 40;
const CAM_Z = 6.6;

/**
 * Places the field inside whatever slot the layout is currently offering,
 * converting that element's screen rectangle into world units. This is what
 * guarantees the dots never sit on top of the text: the page reserved the box.
 */
function Stage({
  slotEl,
  prevSlotEl,
  morph,
  children,
}: {
  slotEl: React.RefObject<HTMLElement | null>;
  prevSlotEl: React.RefObject<HTMLElement | null>;
  /** 0 while leaving the old slot, 1 once settled in the new one. */
  morph: React.RefObject<number>;
  children: React.ReactNode;
}) {
  const group = useRef<Group>(null);
  const { size } = useThree();

  useFrame(() => {
    const node = group.current;
    const to = slotEl.current;
    if (!node || !to) return;

    const visibleH = 2 * Math.tan((FOV * Math.PI) / 360) * CAM_Z;
    const visibleW = visibleH * (size.width / size.height);

    const place = (el: HTMLElement) => {
      const box = el.getBoundingClientRect();

      // Size is capped so a tall rail does not produce a giant emblem.
      const px = Math.min(box.width, box.height, size.height * 0.36);
      const half = px / 2;

      // Held at the middle of the screen while its box allows it, so the
      // emblem reads as perfectly still while the page scrolls past.
      const centreY = MathUtils.clamp(
        size.height / 2,
        Math.min(box.top + half, box.bottom - half),
        Math.max(box.top + half, box.bottom - half),
      );

      return {
        x: ((box.left + box.width / 2) / size.width - 0.5) * visibleW,
        y: (0.5 - centreY / size.height) * visibleH,
        s: ((px / size.height) * visibleH) / (EXTENT * 2),
      };
    };

    // Both ends are measured live, so each is glued to the page as it scrolls;
    // the field only moves between them while it is actually morphing. Damping
    // the position instead would make the page look like it scrolls by itself.
    const from = prevSlotEl.current ?? to;
    const a = place(from);
    const b = place(to);
    const t = MathUtils.clamp(morph.current ?? 1, 0, 1);

    // On an anchor jump the previous slot can be pages away, which would fling
    // the dots off screen. Clamp the start so the rush always stays in frame.
    const reach = visibleH * 0.9;
    const startX = MathUtils.clamp(a.x, b.x - reach, b.x + reach);
    const startY = MathUtils.clamp(a.y, b.y - reach, b.y + reach);

    node.position.x = MathUtils.lerp(startX, b.x, t);
    node.position.y = MathUtils.lerp(startY, b.y, t);
    node.scale.setScalar(MathUtils.lerp(a.s, b.s, t));
  });

  return <group ref={group}>{children}</group>;
}

/** Drops the pixel ratio if the device cannot hold a steady frame. */
function Governor() {
  const gl = useThree(state => state.gl);
  const setDpr = useThree(state => state.setDpr);
  const samples = useRef<number[]>([]);
  const dropped = useRef(false);

  useFrame((_, delta) => {
    if (dropped.current) return;
    const list = samples.current;
    list.push(delta);
    if (list.length < 90) return;

    const mean = list.reduce((a, b) => a + b, 0) / list.length;
    list.length = 0;
    if (mean > 0.028) {
      dropped.current = true;
      setDpr(Math.max(1, gl.getPixelRatio() * 0.75));
    }
  });

  return null;
}

export function Backdrop({
  shape,
  slotEl,
  prevSlotEl,
  active,
  light,
  reduced,
  onReady,
}: {
  shape: React.RefObject<ShapeId>;
  slotEl: React.RefObject<HTMLElement | null>;
  prevSlotEl: React.RefObject<HTMLElement | null>;
  active: React.RefObject<boolean>;
  light: boolean;
  reduced: boolean;
  onReady?: () => void;
}) {
  const [buffers, setBuffers] = useState<FieldBuffers | null>(null);
  const [budget] = useState(() => BUDGET[detectTier()]);
  const [failed, setFailed] = useState(false);
  const [awake, setAwake] = useState(true);
  const time = useRef(0);
  const globeness = useRef(1);
  const morph = useRef(1);

  useEffect(() => {
    let cancelled = false;

    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) {
      setFailed(true);
      onReady?.();
      return;
    }
    (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')?.loseContext();

    // Fonts first — the Bangla shape is rasterised from live type.
    Promise.all([document.fonts.ready, loadLandMask('/images/land-mask.png')])
      .then(([, mask]) => {
        if (cancelled) return;
        setBuffers(buildField(budget.count, mask));
        onReady?.();
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        onReady?.();
      });

    const visibility = () => setAwake(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [budget.count, onReady]);

  if (failed) return <div className="backdrop backdrop-static" aria-hidden="true" />;

  return (
    <div className="backdrop" aria-hidden="true" data-loaded={buffers ? 'true' : 'false'}>
      {buffers && (
        <Canvas
          camera={{ position: [0, 0, CAM_Z], fov: FOV, near: 0.1, far: 40 }}
          dpr={budget.dpr}
          frameloop={awake ? 'always' : 'never'}
          gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener(
              'webglcontextlost',
              event => {
                event.preventDefault();
                setFailed(true);
              },
              { once: true },
            );
          }}
        >
          <Governor />
          <Stage slotEl={slotEl} prevSlotEl={prevSlotEl} morph={morph}>
            <Globe globeness={globeness} light={light} />
            <Field
              buffers={buffers}
              shape={shape}
              time={time}
              globeness={globeness}
              morph={morph}
              active={active}
              size={budget.size}
              light={light}
              reduced={reduced}
            />
            <Arcs time={time} globeness={globeness} reduced={reduced} />
          </Stage>
        </Canvas>
      )}
    </div>
  );
}
