"use client";

/**
 * The scene of the send: a paperlab sheet with the article printed on it,
 * lifted off the page, folded into a dart and thrown. Loaded only when a send
 * starts — see `paper-plane.ts` for the half that runs before it.
 *
 * The sheet is one unit wide, and the camera is placed so that a unit is the
 * sheet's width in CSS pixels at the depth it starts at. So the paper first
 * appears exactly over the article it is a picture of, and paperlab's lights,
 * set up for paper about a unit across, light it as they were meant to.
 */

import { useRef } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { getDeformer, PaperLighting, PaperMesh, registerDeformer, supportsWebGL } from "paperlab";
import type { DeformerInstanceConfigInput, PaperHandle } from "paperlab";
import type { Group } from "three";
import { z } from "zod";
import type { Sheet } from "./paper-plane";

const FOV = 35;

/*
 * When each step happens, in milliseconds. The folds take their time and pause
 * between them — a fold, a press along the crease, the next fold — the rhythm
 * of folding by hand; the lift and the throw are quick.
 */
const T = {
  lift: 170,
  settled: 700,
  corner: { from: 800, until: 1200 },
  edge: { from: 1360, until: 1760 },
  // The right side follows the left by this much, as one hand would.
  lag: 80,
  half: { from: 1920, until: 2320 },
  wings: { from: 2400, until: 2800 },
  windUp: 3000,
  gone: 3600,
};

// How big the sheet is, in pixels, once it has shrunk and is ready to fold.
const FOLDING_SIZE = 380;
// How steeply the wing folds leave the nose, across per unit down: the keel
// between them is a narrow triangle, deepest at the tail.
const KEEL = 0.17;
// How far the plane closes, and how far its wings open, in degrees. Short of
// flat both ways, so it keeps a little dihedral.
const CLOSE = 160;
const WING = 90;
// The bend at each crease, in sheet widths: paper never creases to an edge.
const CREASE = 0.012;

export const supported = supportsWebGL;

const clamp = (u: number) => Math.min(1, Math.max(0, u));
// Slow to lift off, still moving when it lands: the snap of a crease.
const snap = (u: number) => 2 * u * u - u * u * u;
const smooth = (u: number) => u * u * (3 - 2 * u);
const progress = (t: number, { from, until }: { from: number; until: number }, delay = 0) =>
  snap(clamp((t - from - delay) / (until - from)));

/** One paperlab `fold`: its line, and how far it has turned. */
type Fold = { angle: number; offset: number; foldAngle: number; radius: number };

/**
 * The dart as paperlab `fold`s.
 *
 * A fold turns whatever lies beyond its line — a line through the nose, the
 * top of the centre crease, for every fold here — and they run in order, so
 * each acts on the paper the earlier ones have already laid over: the edges
 * fold the corners with them, as they do in the hand. `angle` is the direction
 * the fold travels across the sheet, `offset` how far from the centre its line
 * is in that direction.
 *
 * The wings come before the centre in the order, though after it in time: a
 * fold has to be described on the sheet as it lay when the line was drawn on
 * it, and the wing lines are drawn while the dart is still flat. The left wing
 * opens a little further, because the centre fold has already carried it round
 * by less than a half turn.
 */
function dartFolds(height: number): Fold[] {
  const line = (angle: number): Fold => ({
    angle,
    offset: (height / 2) * Math.sin((angle * Math.PI) / 180),
    foldAngle: 0,
    radius: CREASE,
  });
  const edge = 22.5;
  const wing = (Math.atan(KEEL) * 180) / Math.PI;
  return [
    line(135),
    line(45),
    line(180 - edge),
    line(edge),
    line(180 - wing),
    line(wing),
    // In half: the left half turns back over onto the right.
    line(180),
  ];
}

/** How far each of `dartFolds` has turned at `t`, in the same order. */
function turnFolds(folds: Fold[], t: number) {
  const turns = [
    179 * progress(t, T.corner),
    179 * progress(t, T.corner, T.lag),
    178 * progress(t, T.edge),
    178 * progress(t, T.edge, T.lag),
    -(WING + 180 - CLOSE) * progress(t, T.wings),
    -WING * progress(t, T.wings, T.lag),
    -CLOSE * progress(t, T.half),
  ];
  turns.forEach((turn, i) => (folds[i].foldAngle = turn));
}

/*
 * The folds reach the paper as one deformer of our own, `dart`, rather than as
 * seven `fold`s handed to the sheet as props. paperlab keys the sheet's mesh on
 * its deformer props: new fold angles every frame meant a new, flat mesh every
 * frame, and whenever a frame was drawn before the folds were laid back over
 * it, the sheet flashed flat mid-fold. `dart` is declared once and never
 * changes; it is `animated`, so paperlab runs it again every frame, and each
 * time it applies paperlab's own `fold` seven times with the angles the frame
 * loop has just written into `folding`.
 *
 * One flight at a time, so one set of folds, module-wide.
 */
// An A4 sheet until a flight sets its own.
const folding: { folds: Fold[] } = { folds: dartFolds(Math.SQRT2) };

const fold = getDeformer("fold");
registerDeformer({
  id: "dart",
  label: "Dart",
  defaults: {},
  optionsSchema: z.object({}),
  animated: true,
  displace(out, uv, _options, context) {
    for (const each of folding.folds) fold.displace(out, uv, each, context);
  },
  geometry: {
    minSegments: fold.geometry?.minSegments,
    // As fine as the finest of its creases needs. They run every way, so the
    // demand is spread over the sheet rather than along one axis.
    autoSegments: (_options, sheet) =>
      Math.max(...folding.folds.map((each) => fold.geometry?.autoSegments?.(each, sheet) ?? 0)),
    axis: () => null,
  },
});

const DART: DeformerInstanceConfigInput[] = [{ type: "dart", options: {} }];

/** Where the sheet is, how big, and which way it is turned. Radians. */
type Pose = { x: number; y: number; z: number; s: number; rx: number; ry: number; rz: number };

const deg = Math.PI / 180;

/**
 * Whether the article is on the paper yet. paperlab loads an image's texture
 * after the sheet has mounted, and draws plain paper until it arrives; binding
 * it then changes the shader, which is recompiled — a blank sheet and then a
 * dark frame, exactly what the paper is meant to replace on screen.
 */
const printed = (paper: PaperHandle | null) => {
  const material = paper?.mesh?.material as { uniforms?: { uFrontMap?: { value: unknown } } } | undefined;
  return Boolean(material?.uniforms?.uFrontMap?.value);
};

// Frames to draw with the article on the paper, unseen, before showing it:
// the first after binding is the one that compiles the new shader.
const WARM_UP = 3;

function Flight({
  sheet,
  onShow,
  onDone,
}: {
  sheet: Sheet;
  onShow: () => void;
  onDone: () => void;
}) {
  const group = useRef<Group>(null);
  const paper = useRef<PaperHandle>(null);
  const warmed = useRef(0);
  const start = useRef<number | null>(null);
  const done = useRef(false);
  const height = sheet.height / sheet.width;
  const { size } = useThree();

  // Pixels to world units: a unit is the sheet's width.
  const unit = 1 / sheet.width;
  const at = (px: number, py: number) => ({
    x: (px - size.width / 2) * unit,
    y: (size.height / 2 - py) * unit,
  });
  const origin = at(sheet.left + sheet.width / 2, sheet.top + sheet.height / 2);
  const shrunk = FOLDING_SIZE / Math.max(sheet.width, sheet.height);

  const poses: [number, Pose][] = [
    [0, { ...origin, z: 0, s: 1, rx: 0, ry: 0, rz: 0 }],
    [T.lift, { ...origin, z: 0.04, s: 0.97, rx: 0, ry: 0, rz: 0 }],
    // Laid back like paper on a table, so the folds rise off it and land.
    [T.settled, { x: 0, y: 0, z: 0, s: shrunk, rx: -38 * deg, ry: 0, rz: 0 }],
    [T.half.from, { x: 0, y: 0, z: 0, s: shrunk, rx: -38 * deg, ry: 0, rz: 0 }],
    // Side on while it closes, the way folded paper is held up to look at.
    [T.half.until, { x: 0, y: 0, z: 0, s: shrunk, rx: -18 * deg, ry: -68 * deg, rz: 0 }],
    // Wings out, nose round towards where it is going.
    [T.wings.until, { x: 0, y: 0, z: 0, s: shrunk * 0.9, rx: -50 * deg, ry: 0, rz: -42 * deg }],
    // A step back to wind up…
    [T.windUp, { x: -0.06, y: -0.05, z: 0, s: shrunk * 0.9, rx: -54 * deg, ry: 0, rz: -46 * deg }],
    // …and away, off the top right and into the distance.
    [
      T.gone,
      {
        x: size.width * unit,
        y: size.height * unit,
        z: -3,
        s: shrunk * 0.9,
        rx: -60 * deg,
        ry: 0,
        rz: -56 * deg,
      },
    ],
  ];

  const pose = (t: number): Pose => {
    const i = poses.findIndex(([time]) => time > t);
    if (i === -1) return poses[poses.length - 1][1];
    if (i === 0) return poses[0][1];
    const [t0, a] = poses[i - 1];
    const [t1, b] = poses[i];
    // The throw accelerates away; everything else eases in and out.
    const u = clamp((t - t0) / (t1 - t0));
    const k = t1 === T.gone ? u * u * u : smooth(u);
    const mix = (key: keyof Pose) => a[key] + (b[key] - a[key]) * k;
    return {
      x: mix("x"),
      y: mix("y"),
      z: mix("z"),
      s: mix("s"),
      rx: mix("rx"),
      ry: mix("ry"),
      rz: mix("rz"),
    };
  };

  useFrame(() => {
    const now = performance.now();
    // Held at its first pose, unseen, until the article is printed on it and
    // the shader that prints it has been compiled; only then shown, and the
    // clock started.
    if (start.current === null) {
      if (printed(paper.current)) warmed.current += 1;
      if (warmed.current >= WARM_UP) {
        start.current = now;
        onShow();
      }
    }
    const t = start.current === null ? 0 : now - start.current;
    const p = pose(t);
    group.current?.position.set(p.x, p.y, p.z);
    group.current?.scale.setScalar(p.s);
    group.current?.rotation.set(p.rx, p.ry, p.rz);
    turnFolds(folding.folds, t);
    if (t >= T.gone && !done.current) {
      done.current = true;
      onDone();
    }
  });

  return (
    <group ref={group}>
      <PaperMesh
        ref={paper}
        sheet={{ width: 1, height }}
        stock="printer"
        content={{ type: "image", src: sheet.image, fit: "cover" }}
        deformers={DART}
        reducedMotion={false}
      />
    </group>
  );
}

/**
 * Mounts the scene over the page, plays it once, and takes it down. `onShow`
 * is called as the paper appears, for whatever it replaces to step aside.
 * Resolves when the plane is gone — or, at the latest, a little after it
 * should have been: a page that is not on screen does not draw frames, and a
 * send made from a background tab must not hold its receipt until the tab
 * comes back.
 */
export function fly(sheet: Sheet, onShow: () => void): Promise<void> {
  const host = document.createElement("div");
  Object.assign(host.style, {
    position: "fixed",
    inset: "0",
    zIndex: "60",
    pointerEvents: "none",
  } satisfies Partial<CSSStyleDeclaration>);
  host.setAttribute("aria-hidden", "true");
  // Unseen until the paper is ready to be seen; see `Flight`.
  host.style.opacity = "0";
  document.body.appendChild(host);
  const show = () => {
    // Up through the dialog as it fades, not over it in a single frame.
    host.style.opacity = "1";
    host.animate([{ opacity: 0 }, { opacity: 1 }], { duration: T.lift, easing: "ease-out" });
    onShow();
  };

  // Before the sheet first renders, so its mesh is sized for these creases.
  folding.folds = dartFolds(sheet.height / sheet.width);
  const root = createRoot(host);
  const distance = window.innerHeight / 2 / sheet.width / Math.tan((FOV / 2) * deg);

  return new Promise((resolve) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      // After the frame in which the plane left, not during it.
      queueMicrotask(() => {
        root.unmount();
        host.remove();
        resolve();
      });
    };
    // The texture is a picture already in memory and loads in a frame or
    // two; the margin is for the frames themselves.
    setTimeout(finish, T.gone + 1500);
    root.render(
      <Canvas
        camera={{ fov: FOV, position: [0, 0, distance], near: 0.01, far: 100 }}
        gl={{ alpha: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <PaperLighting preset="studio" contactShadow={false} shadowMapSize={0} />
        <Flight sheet={sheet} onShow={show} onDone={finish} />
      </Canvas>,
    );
  });
}
