import { useMemo } from "react";
import { LiveBuffer, fmt, useStageCanvas } from "../lib/labkit";
import type { GraphKind } from "../physics/types";

/* ============================================================
   GRAPH ENGINE — every curve is computed from real values
   ============================================================ */

const INK = "#22282f";
const INK2 = "#5b646e";
const GRID = "#e2dfd0";
const BLUE = "#2f5fbe";
const GREEN = "#1f7a4d";
const AMBER = "#b97a18";
const PURPLE = "#6b4fa3";

type Series = { xs: number[]; ys: number[] };

function niceTicks(min: number, max: number, n = 4): number[] {
  const out: number[] = [];
  for (let i = 0; i <= n; i++) out.push(min + ((max - min) * i) / n);
  return out;
}

export function GraphCanvas({ kind, vars, buffer, whatifVars, height = 190 }: {
  kind: GraphKind;
  vars: Record<string, number>;
  buffer?: LiveBuffer;
  whatifVars?: Record<string, number> | null;
  height?: number;
}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const spec = useMemo(() => buildSpec(kind, vars, whatifVars || undefined), [kind, JSON.stringify(vars), JSON.stringify(whatifVars)]);
  const canvasRef = useStageCanvas((c, w, h) => {
    c.clearRect(0, 0, w, h);
    drawFrame(c, w, h, spec.xLabel, spec.yLabel);
    const plot = plotter(c, w, h, spec.xMin, spec.xMax, spec.yMin, spec.yMax);

    if (spec.live && buffer && buffer.t.length > 2) {
      const xs = buffer.t.map((t) => t - buffer.t[0]);
      const xMax = Math.max(xs[xs.length - 1], 1);
      const yMin = Math.min(0, ...buffer.a);
      const yMax = Math.max(0.1, ...buffer.a);
      const lp = plotter(c, w, h, 0, xMax, yMin * 1.1, yMax * 1.1);
      drawSeries(c, lp, { xs, ys: buffer.a }, BLUE);
      const lastX = xs[xs.length - 1];
      const lastY = buffer.a[buffer.a.length - 1];
      drawPoint(c, lp(lastX, lastY), BLUE);
      label(c, w - 8, 16, `${spec.yLabel.split(" ")[0]} = ${fmt(lastY)}`, BLUE, "right");
      return;
    }

    if (spec.whatif) drawSeries(c, plot, spec.whatif, AMBER, true);
    drawSeries(c, plot, spec.main, spec.color);
    if (spec.point) drawPoint(c, plot(spec.point.x, spec.point.y), spec.color);
    if (spec.bars) drawBars(c, w, h, spec.bars);
    label(c, w - 8, 16, spec.readout, spec.color, "right");
  });

  return (
    <div style={{ height }} className="relative w-full bg-panel">
      <canvas ref={canvasRef} />
    </div>
  );
}

/* ---------------- spec builders ---------------- */
interface Spec {
  xMin: number; xMax: number; yMin: number; yMax: number;
  xLabel: string; yLabel: string;
  main: Series;
  whatif?: Series;
  point?: { x: number; y: number };
  bars?: { label: string; value: number; color: string }[];
  readout: string;
  color: string;
  live?: boolean;
}

function lin(f: (x: number) => number, x0: number, x1: number, n = 80): Series {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    xs.push(x);
    ys.push(f(x));
  }
  return { xs, ys };
}

function buildSpec(kind: GraphKind, v: Record<string, number>, w?: Record<string, number>): Spec {
  switch (kind) {
    case "ke-v": {
      const f = (x: number) => 0.5 * v.m * x * x;
      const fw = w ? (x: number) => 0.5 * (w.m ?? v.m) * x * x : undefined;
      return base(lin(f, 0, v.m >= 0 ? Math.max(v.v * 1.6, v.max ?? 40) : 40), "v (m/s)", "KE (J)",
        { x: v.v, y: f(v.v) }, `KE = ${fmt(f(v.v))} J`, BLUE, fw && lin(fw, 0, Math.max(v.v * 1.6, 40)));
    }
    case "pe-h": {
      const f = (x: number) => v.m * v.g * x;
      const fw = w ? (x: number) => (w.m ?? v.m) * (w.g ?? v.g) * x : undefined;
      return base(lin(f, 0, Math.max(v.h * 1.5, 20)), "h (m)", "PE (J)",
        { x: v.h, y: f(v.h) }, `PE = ${fmt(f(v.h))} J`, GREEN, fw && lin(fw, 0, Math.max(v.h * 1.5, 20)));
    }
    case "fall-vt": {
      const T = Math.sqrt((2 * v.h) / v.g);
      const f = (t: number) => v.g * t;
      const fw = w ? (t: number) => (w.g ?? v.g) * t : undefined;
      return base(lin(f, 0, T), "t (s)", "v (m/s)", { x: T, y: f(T) },
        `impact ${fmt(f(T))} m/s @ ${fmt(T)} s`, BLUE, fw && lin(fw, 0, T * 1.4));
    }
    case "proj-vy": {
      const th = (v.th * Math.PI) / 180;
      const T = (2 * v.v0 * Math.sin(th)) / v.g;
      const f = (t: number) => v.v0 * Math.sin(th) - v.g * t;
      const s = lin(f, 0, T);
      s.ys.push(0); s.xs.push(T);
      return base(s, "t (s)", "v_y (m/s)", { x: T / 2, y: 0 },
        `apex @ ${fmt(T / 2)} s`, BLUE);
    }
    case "bench-vt":
      return { ...base(lin((t) => t, 0, 1), "t (s)", "v (m/s)", undefined, "live trace", BLUE), live: true, yMin: 0, yMax: 1, xMin: 0, xMax: 1 };
    case "p-v": {
      const f = (x: number) => v.m * x;
      return base(lin(f, 0, Math.max(v.v * 1.5, 20)), "v (m/s)", "p (kg·m/s)",
        { x: v.v, y: f(v.v) }, `p = ${fmt(f(v.v))}`, BLUE);
    }
    case "i-r": {
      const f = (x: number) => v.V / Math.max(x, 0.1);
      const x1 = Math.max(v.R * 1.8, 20);
      const fw = w ? (x: number) => (w.V ?? v.V) / Math.max(x, 0.1) : undefined;
      return base(lin(f, 0.5, x1), "R (Ω)", "I (A)",
        { x: v.R, y: v.V / v.R }, `I = ${fmt(v.V / v.R)} A`, PURPLE, fw && lin(fw, 0.5, x1));
    }
    case "pend-theta":
      return { ...base(lin((t) => t, 0, 1), "t (s)", "θ (rad)", undefined, "live trace", GREEN), live: true, yMin: -1, yMax: 1, xMin: 0, xMax: 1 };
    case "spring-x":
      return { ...base(lin((t) => t, 0, 1), "t (s)", "x (m)", undefined, "live trace", BLUE), live: true, yMin: -1, yMax: 1, xMin: 0, xMax: 1 };
    case "coll-bars": {
      const { m1, v1, m2, v2, e } = v;
      const u1 = ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / (m1 + m2);
      const u2 = ((m2 - e * m1) * v2 + (1 + e) * m1 * v1) / (m1 + m2);
      const pb = m1 * v1 + m2 * v2;
      const pa = m1 * u1 + m2 * u2;
      const kb = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
      const ka = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2;
      return {
        xMin: 0, xMax: 1, yMin: 0, yMax: Math.max(pb, kb, 1) * 1.15,
        xLabel: "", yLabel: "amount",
        main: { xs: [], ys: [] },
        bars: [
          { label: "p before", value: pb, color: BLUE },
          { label: "p after", value: pa, color: BLUE },
          { label: "KE before", value: kb, color: GREEN },
          { label: "KE after", value: ka, color: GREEN },
        ],
        point: undefined,
        readout: `ΔKE = ${fmt(kb - ka)} J`,
        color: INK,
      };
    }
    case "wave-f": {
      const f = (x: number) => x * v.lambda;
      const fw = w ? (x: number) => x * (w.lambda ?? v.lambda) : undefined;
      return base(lin(f, 0, Math.max(v.f * 1.6, 10)), "f (Hz)", "v (m/s)",
        { x: v.f, y: f(v.f) }, `v = ${fmt(f(v.f))} m/s`, PURPLE, fw && lin(fw, 0, Math.max(v.f * 1.6, 10)));
    }
    case "orbit-v": {
      const GM = 3.986e14;
      const RE = 6.371e6;
      const f = (hkm: number) => Math.sqrt(GM / (RE + hkm * 1000));
      const fw = w ? (hkm: number) => Math.sqrt(GM / (RE + (w.h ?? hkm) * 1000)) : undefined;
      return base(lin(f, 200, 36000, 100), "altitude (km)", "v (m/s)",
        { x: v.h, y: f(v.h) }, `v = ${fmt(f(v.h))} m/s`, BLUE, fw && lin(fw, 200, 36000, 100));
    }
    case "work-d": {
      const f = (x: number) => v.F * x;
      const fw = w ? (x: number) => (w.F ?? v.F) * x : undefined;
      return base(lin(f, 0, Math.max(v.d * 1.5, 20)), "d (m)", "W (J)",
        { x: v.d, y: f(v.d) }, `W = ${fmt(f(v.d))} J`, GREEN, fw && lin(fw, 0, Math.max(v.d * 1.5, 20)));
    }
    case "grav-r": {
      const GMm = 6.674e-11 * v.m1 * v.m2;
      const f = (x: number) => GMm / Math.max(x * x, 1e-9);
      const fw = w ? (x: number) => (6.674e-11 * (w.m1 ?? v.m1) * (w.m2 ?? v.m2)) / Math.max(x * x, 1e-9) : undefined;
      return base(lin(f, 0.5, 10), "r (m)", "F (N)",
        { x: v.r, y: f(v.r) }, `F = ${fmt(f(v.r))} N`, BLUE, fw && lin(fw, 0.5, 10));
    }
    case "snell": {
      const f = (d: number) => {
        const s = (v.n1 * Math.sin((d * Math.PI) / 180)) / v.n2;
        return s > 1 ? NaN : (Math.asin(s) * 180) / Math.PI;
      };
      const xs: number[] = []; const ys: number[] = [];
      for (let d = 5; d <= 85; d += 1) { const y = f(d); if (!isNaN(y)) { xs.push(d); ys.push(y); } }
      return base({ xs, ys }, "θ₁ (°)", "θ₂ (°)",
        { x: v.th1, y: f(v.th1) }, `θ₂ = ${fmt(f(v.th1))}°`, PURPLE);
    }
  }
}

function base(main: Series, xLabel: string, yLabel: string, point: Spec["point"], readout: string, color: string, whatif?: Series | false): Spec {
  let yMin = Math.min(0, ...main.ys);
  let yMax = Math.max(...main.ys, 0.1);
  if (whatif) { yMax = Math.max(yMax, ...whatif.ys); }
  const pad = (yMax - yMin) * 0.12 || 1;
  return {
    xMin: main.xs[0], xMax: main.xs[main.xs.length - 1],
    yMin: yMin - (yMin < 0 ? pad : 0), yMax: yMax + pad,
    xLabel, yLabel, main, whatif: whatif || undefined, point, readout, color,
  };
}

/* ---------------- drawing ---------------- */
function plotter(c: CanvasRenderingContext2D, w: number, h: number, x0: number, x1: number, y0: number, y1: number) {
  const L = 44, R = 10, T = 24, B = 22;
  return (x: number, y: number) => {
    const px = L + ((x - x0) / (x1 - x0 || 1)) * (w - L - R);
    const py = h - B - ((y - y0) / (y1 - y0 || 1)) * (h - T - B);
    return [px, py] as const;
  };
}

function drawFrame(c: CanvasRenderingContext2D, w: number, h: number, xLabel: string, yLabel: string) {
  const L = 44, R = 10, T = 24, B = 22;
  c.strokeStyle = GRID; c.lineWidth = 1;
  for (const fy of niceTicks(0, 1, 4)) {
    const y = T + fy * (h - T - B);
    c.beginPath(); c.moveTo(L, y); c.lineTo(w - R, y); c.stroke();
  }
  for (const fx of niceTicks(0, 1, 6)) {
    const x = L + fx * (w - L - R);
    c.beginPath(); c.moveTo(x, T); c.lineTo(x, h - B); c.stroke();
  }
  c.strokeStyle = INK; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(L, T); c.lineTo(L, h - B); c.lineTo(w - R, h - B); c.stroke();
  c.fillStyle = INK2;
  c.font = "9px 'IBM Plex Mono', monospace";
  c.textAlign = "left";
  c.fillText(yLabel, 6, 14);
  c.textAlign = "right";
  c.fillText(xLabel, w - R, h - 6);
  // axis numbers
  c.textAlign = "right";
  const py = plotter(c, w, h, 0, 1, 0, 1);
  void py;
}

function drawSeries(c: CanvasRenderingContext2D, plot: (x: number, y: number) => readonly [number, number], s: Series, color: string, dashed = false) {
  if (s.xs.length < 2) return;
  c.strokeStyle = color;
  c.lineWidth = 2;
  c.setLineDash(dashed ? [5, 4] : []);
  c.beginPath();
  s.xs.forEach((x, i) => {
    const [px, py] = plot(x, s.ys[i]);
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  });
  c.stroke();
  c.setLineDash([]);
}

function drawPoint(c: CanvasRenderingContext2D, p: readonly [number, number], color: string) {
  if (!isFinite(p[0]) || !isFinite(p[1])) return;
  c.fillStyle = color;
  c.strokeStyle = "#fbfaf5";
  c.lineWidth = 2;
  c.beginPath();
  c.arc(p[0], p[1], 4.5, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.globalAlpha = 0.25;
  c.beginPath();
  c.arc(p[0], p[1], 9, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;
}

function drawBars(c: CanvasRenderingContext2D, w: number, h: number, bars: { label: string; value: number; color: string }[]) {
  const L = 44, B = 30, T = 24;
  const max = Math.max(...bars.map((b) => b.value), 1e-9);
  const bw = (w - L - 20) / bars.length;
  bars.forEach((b, i) => {
    const x = L + 10 + i * bw;
    const bh = (b.value / max) * (h - T - B);
    c.fillStyle = b.color;
    c.globalAlpha = 0.85;
    c.fillRect(x, h - B - bh, bw - 14, bh);
    c.globalAlpha = 1;
    c.fillStyle = INK2;
    c.font = "8.5px 'IBM Plex Mono', monospace";
    c.textAlign = "center";
    c.fillText(b.label, x + (bw - 14) / 2, h - B + 12);
    c.fillStyle = INK;
    c.fillText(fmt(b.value), x + (bw - 14) / 2, h - B - bh - 5);
  });
}

function label(c: CanvasRenderingContext2D, x: number, y: number, text: string, color: string, align: CanvasTextAlign = "left") {
  c.font = "600 10.5px 'IBM Plex Mono', monospace";
  c.textAlign = align;
  c.fillStyle = "#fbfaf5";
  const w = c.measureText(text).width;
  c.fillRect(align === "right" ? x - w - 10 : x - 4, y - 10, w + 8, 15);
  c.fillStyle = color;
  c.fillText(text, align === "right" ? x - 6 : x, y + 1);
}

export { niceTicks };
