import { useEffect, useRef, useState } from "react";
import { fmt, sfx, useStageCanvas } from "../lib/labkit";
import type { SimKind } from "../physics/types";
import { BenchSim, CollisionSim, FreeFallSim, PendulumSim, ProjectileSim, SpringSim, arrow, type SimProps } from "./simsM";
import { AtwoodSim, BuoyancySim, CircularSim, InclineSim, TorqueSim } from "./simsN";
import { CtlBtn, SimShell, TactSlider, Toggle } from "./ui";

/* ============================================================
   ELECTRICITY · WAVES · OPTICS · THERMO · ASTRO SIMULATIONS
   ============================================================ */

const ST = {
  grid: "#333c46", body: "#c9d0d7", bodyDark: "#8b98a5",
  blue: "#7fb2e5", red: "#e58a7e", green: "#7fc79a",
  amber: "#dcae60", purple: "#a98fd6", text: "#9aa4ae",
};
const mono = (c: CanvasRenderingContext2D, text: string, x: number, y: number, color = ST.text, align: CanvasTextAlign = "left", size = 10) => {
  c.font = `${size}px 'IBM Plex Mono', monospace`;
  c.textAlign = align; c.fillStyle = color; c.fillText(text, x, y);
};

/* ================= OHM CIRCUIT ================= */
export function OhmSim({ vars }: SimProps) {
  const [on, setOn] = useState(true);
  const st = useRef({ ph: 0, last: -1 });
  const I = on ? vars.V / vars.R : 0;
  const P = vars.V * I;

  const canvasRef = useStageCanvas((c, w, h) => {
    const now = performance.now() / 1000;
    const dt = st.current.last < 0 ? 0.016 : Math.min(0.05, now - st.current.last);
    st.current.last = now;
    if (on) st.current.ph += dt * (0.4 + I * 1.4);

    c.clearRect(0, 0, w, h);
    const L = 70, T = 66, R = w - 70, B = h - 60;
    c.strokeStyle = ST.body; c.lineWidth = 2.5;
    c.strokeRect(L, T, R - L, B - T);

    // battery (left side)
    const by = (T + B) / 2;
    c.fillStyle = "#22282f";
    c.fillRect(L - 3, by - 26, 6, 52);
    c.strokeStyle = ST.amber; c.lineWidth = 3;
    c.beginPath(); c.moveTo(L - 12, by - 12); c.lineTo(L - 12, by + 12); c.stroke();
    c.lineWidth = 5;
    c.beginPath(); c.moveTo(L + 0, by - 20); c.lineTo(L + 0, by + 20); c.stroke();
    mono(c, `+ ${fmt(vars.V)} V −`, L, by + 44, ST.amber, "center", 10);

    // resistor zigzag (top)
    const rx = (L + R) / 2;
    c.strokeStyle = ST.body; c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(rx - 52, T);
    for (let i = 0; i <= 8; i++) c.lineTo(rx - 52 + i * 13, T + (i % 2 === 0 ? 0 : i % 4 === 1 ? -12 : 12));
    c.lineTo(rx + 52, T);
    c.stroke();
    mono(c, `R = ${fmt(vars.R)} Ω`, rx, T - 16, ST.amber, "center", 10);
    mono(c, `V_R = IR = ${fmt(I * vars.R)} V`, rx, T + 34, ST.body, "center", 9);

    // lamp (right)
    const lx = R, ly = by;
    const glow = Math.min(1, P / 60);
    c.globalAlpha = 0.25 + glow * 0.7;
    c.fillStyle = ST.amber;
    c.beginPath(); c.arc(lx, ly, 16 + glow * 8, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1;
    c.strokeStyle = ST.body; c.lineWidth = 2;
    c.beginPath(); c.arc(lx, ly, 14, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(lx - 7, ly + 7); c.lineTo(lx + 7, ly - 7); c.moveTo(lx - 7, ly - 7); c.lineTo(lx + 7, ly + 7); c.stroke();
    mono(c, `P = ${fmt(P)} W`, lx, ly + 34, ST.amber, "center", 9.5);

    // switch (bottom)
    const sx = (L + R) / 2;
    c.strokeStyle = ST.body; c.lineWidth = 2.5;
    c.beginPath(); c.arc(sx - 16, B, 3.5, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(sx + 16, B, 3.5, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(sx - 16, B);
    if (on) c.lineTo(sx + 16, B); else c.lineTo(sx + 10, B - 20);
    c.stroke();
    mono(c, on ? "SWITCH: CLOSED" : "SWITCH: OPEN", sx, B + 20, on ? ST.green : ST.red, "center", 9.5);

    // charge dots around loop
    const perim = 2 * (R - L) + 2 * (B - T);
    const nDots = 14;
    for (let i = 0; i < nDots; i++) {
      const d = ((i / nDots) * perim + st.current.ph * 40) % perim;
      let px = 0, py = 0;
      const wTop = R - L, hSide = B - T;
      if (d < wTop) { px = L + d; py = T; }
      else if (d < wTop + hSide) { px = R; py = T + (d - wTop); }
      else if (d < 2 * wTop + hSide) { px = R - (d - wTop - hSide); py = B; }
      else { px = L; py = B - (d - 2 * wTop - hSide); }
      c.beginPath(); c.arc(px, py, 2.6, 0, Math.PI * 2);
      c.fillStyle = on ? ST.blue : ST.bodyDark; c.fill();
    }

    // ammeter
    c.beginPath(); c.arc(L + 90, B, 15, 0, Math.PI * 2);
    c.fillStyle = "#1b2026"; c.fill(); c.strokeStyle = ST.body; c.lineWidth = 1.5; c.stroke();
    mono(c, "A", L + 90, B - 4, ST.body, "center", 9);
    mono(c, I.toFixed(2), L + 90, B + 7, on ? ST.blue : ST.red, "center", 8.5);

    mono(c, `I = V/R = ${fmt(vars.V)}/${fmt(vars.R)} = ${I.toFixed(3)} A`, 14, 22, ST.body, "left", 10.5);
    if (!on) mono(c, "OPEN CIRCUIT — no closed path, no current", 14, 40, ST.red, "left", 9.5);
  });

  return (
    <SimShell fig="FIG. 06" title="Circuit Bench" footnote="Ohmic resistor, ideal battery. Dot speed ∝ current; lamp glow ∝ power I²R."
      h="h-[330px]"
      right={<CtlBtn icon="bolt" active={on} onClick={() => { setOn(!on); sfx.switchOn(); }} title="Toggle switch" />}
    >
      <canvas ref={canvasRef} />
    </SimShell>
  );
}

/* ================= WAVE STUDIO ================= */
export function WavesSim({ vars }: SimProps) {
  const [second, setSecond] = useState(true);
  const [f2, setF2] = useState(2);
  const [phase, setPhase] = useState(0);
  const [standing, setStanding] = useState(false);
  const st = useRef({ t: 0, last: -1 });

  const canvasRef = useStageCanvas((c, w, h) => {
    const now = performance.now() / 1000;
    const dt = st.current.last < 0 ? 0.016 : Math.min(0.05, now - st.current.last);
    st.current.last = now;
    st.current.t += dt;
    const t = st.current.t;

    const { f, lambda, A } = { f: vars.f, lambda: vars.lambda, A: vars.A ?? 0.3 };
    const v = f * lambda;
    const k1 = (2 * Math.PI) / lambda;
    const w1 = 2 * Math.PI * f;
    const k2 = (2 * Math.PI * f2) / v;
    const w2 = 2 * Math.PI * f2;

    c.clearRect(0, 0, w, h);
    const midY = h * 0.56;
    const span = lambda * 3.2; // metres visible
    const sc = (w - 40) / span;
    const amp = (h * 0.16) / Math.max(A, 0.05);

    c.strokeStyle = ST.grid; c.beginPath(); c.moveTo(20, midY); c.lineTo(w - 20, midY); c.stroke();
    for (let m = 0; m <= span; m += Math.max(0.5, Math.round(lambda))) {
      c.beginPath(); c.moveTo(20 + m * sc, midY - 4); c.lineTo(20 + m * sc, midY + 4); c.stroke();
      mono(c, `${m}m`, 20 + m * sc, midY + 16, ST.text, "center", 8.5);
    }

    const y1 = (x: number) => A * Math.sin(k1 * x - w1 * t);
    const y2 = (x: number) => A * Math.sin(k2 * x - w2 * t + phase);

    const trace = (fn: (x: number) => number, color: string, width: number, alpha = 1) => {
      c.strokeStyle = color; c.lineWidth = width; c.globalAlpha = alpha;
      c.beginPath();
      for (let px = 20; px <= w - 20; px += 2) {
        const x = (px - 20) / sc;
        const yy = midY - fn(x) * amp;
        if (px === 20) c.moveTo(px, yy); else c.lineTo(px, yy);
      }
      c.stroke(); c.globalAlpha = 1;
    };

    if (standing) {
      // y = 2A sin(kx) cos(ωt) — two counter-propagating waves superposed
      const env = (x: number) => 2 * A * Math.abs(Math.sin(k1 * x));
      c.strokeStyle = ST.amber; c.setLineDash([4, 4]); c.globalAlpha = 0.5; c.lineWidth = 1;
      c.beginPath();
      for (let px = 20; px <= w - 20; px += 3) { const x = (px - 20) / sc; const yy = midY - env(x) * amp; if (px === 20) c.moveTo(px, yy); else c.lineTo(px, yy); }
      c.stroke();
      c.beginPath();
      for (let px = 20; px <= w - 20; px += 3) { const x = (px - 20) / sc; const yy = midY + env(x) * amp; if (px === 20) c.moveTo(px, yy); else c.lineTo(px, yy); }
      c.stroke();
      c.setLineDash([]); c.globalAlpha = 1;
      trace((x) => 2 * A * Math.sin(k1 * x) * Math.cos(w1 * t), ST.blue, 2.2);
      for (let i = 0; i <= Math.floor(span * 2); i++) {
        const xn = (i * lambda) / 2;
        if (xn > span) break;
        c.fillStyle = ST.red;
        c.beginPath(); c.arc(20 + xn * sc, midY, 3, 0, Math.PI * 2); c.fill();
      }
      mono(c, `standing wave — nodes every λ/2 = ${fmt(lambda / 2)} m; resonance when the tank fits n·λ/2`, 14, h - 14, ST.amber, "left", 9.5);
    } else {
      trace(y1, ST.blue, 1.4, second ? 0.4 : 0.9);
      if (second) {
        trace(y2, ST.purple, 1.4, 0.4);
        trace((x) => y1(x) + y2(x), ST.amber, 2.4);
      }
    }

    mono(c, `wave speed v = fλ = ${fmt(v)} m/s`, 14, 22, ST.body, "left", 10.5);
    mono(c, `T = ${fmt(1 / f, 3)} s   k = ${fmt(k1, 3)} rad/m`, 14, 38, ST.text, "left", 9.5);
    if (second && Math.abs(f2 - f) < 0.001) {
      const asum = 2 * A * Math.abs(Math.cos(phase / 2));
      mono(c, `same f → A_sum = 2A·cos(φ/2) = ${fmt(asum, 3)} m  (${asum > A ? "constructive" : asum < A * 0.5 ? "destructive" : "partial"})`, 14, h - 14, ST.amber, "left", 9.5);
    } else if (second) {
      mono(c, `different f → beats at |f₁−f₂| = ${fmt(Math.abs(f - f2), 3)} Hz`, 14, h - 14, ST.amber, "left", 9.5);
    }
    mono(c, second ? "— wave 1   — wave 2   — superposition" : "single travelling wave", w - 14, 22, ST.text, "right", 9);
  });

  return (
    <SimShell fig="FIG. 07" title="Wave Tank" footnote="Linear superposition in a non-dispersive medium; the medium fixes v = fλ."
      h="h-[330px]"
      right={
        <div className="flex items-center gap-1.5">
          <Toggle on={second} onClick={() => { setSecond(!second); setStanding(false); }} label="2nd wave" />
          <Toggle on={standing} onClick={() => { setStanding(!standing); setSecond(false); }} label="Standing" />
        </div>
      }
    >
      <canvas ref={canvasRef} />
      {second && (
        <div className="absolute bottom-8 right-3 flex w-56 flex-col gap-2 border border-stageline bg-[rgba(27,32,38,0.92)] p-3">
          <TactSlider sym="f₂" name="Wave 2 freq" unit="Hz" min={0.2} max={20} step={0.1} value={f2} onChange={setF2} color="#a98fd6" />
          <TactSlider sym="φ" name="Phase" unit="rad" min={0} max={6.28} step={0.05} value={phase} onChange={setPhase} color="#dcae60" />
        </div>
      )}
    </SimShell>
  );
}

/* ================= OPTICS — REFRACTION BENCH ================= */
export function OpticsSim({ vars }: SimProps) {
  const canvasRef = useStageCanvas((c, w, h) => {
    const n1 = vars.n1, n2 = vars.n2, th1 = (vars.th1 * Math.PI) / 180;
    const sinT = (n1 * Math.sin(th1)) / n2;
    const tir = sinT > 1;
    const th2 = tir ? 0 : Math.asin(sinT);

    c.clearRect(0, 0, w, h);
    const iy = h * 0.5;
    // media
    c.fillStyle = `rgba(127,178,229,${0.04 + (n1 - 1) * 0.07})`;
    c.fillRect(0, 0, w, iy);
    c.fillStyle = `rgba(127,178,229,${0.05 + (n2 - 1) * 0.09})`;
    c.fillRect(0, iy, w, h - iy);
    c.strokeStyle = ST.body; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(0, iy); c.lineTo(w, iy); c.stroke();

    const ix = w * 0.48;
    // normal
    c.strokeStyle = ST.grid; c.setLineDash([4, 5]);
    c.beginPath(); c.moveTo(ix, iy - h * 0.42); c.lineTo(ix, iy + h * 0.42); c.stroke();
    c.setLineDash([]);
    mono(c, "normal", ix + 5, iy - h * 0.38, ST.text, "left", 9);

    const Lr = h * 0.42;
    // incident
    const x0 = ix - Lr * Math.sin(th1), y0 = iy - Lr * Math.cos(th1);
    arrow(c, x0, y0, ix, iy, ST.blue, "");
    // wavefronts on incident
    c.strokeStyle = ST.blue; c.globalAlpha = 0.4; c.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const fx = x0 + (ix - x0) * (i / 6), fy = y0 + (iy - y0) * (i / 6);
      c.beginPath();
      c.moveTo(fx - 10 * Math.cos(th1), fy + 10 * Math.sin(th1));
      c.lineTo(fx + 10 * Math.cos(th1), fy - 10 * Math.sin(th1));
      c.stroke();
    }
    c.globalAlpha = 1;
    // reflected
    arrow(c, ix, iy, ix + Lr * Math.sin(th1), iy - Lr * Math.cos(th1), ST.bodyDark, "");
    // refracted or TIR
    if (!tir) {
      const waveScale = n1 / n2;
      arrow(c, ix, iy, ix + Lr * Math.sin(th2), iy + Lr * Math.cos(th2), ST.amber, "");
      c.strokeStyle = ST.amber; c.globalAlpha = 0.45;
      const gap = 14 * waveScale;
      for (let i = 1; i < 6; i++) {
        const d = i * gap * 2.4;
        if (d > Lr) break;
        const fx = ix + d * Math.sin(th2), fy = iy + d * Math.cos(th2);
        c.beginPath();
        c.moveTo(fx - 10 * Math.cos(th2), fy - 10 * Math.sin(th2));
        c.lineTo(fx + 10 * Math.cos(th2), fy + 10 * Math.sin(th2));
        c.stroke();
      }
      c.globalAlpha = 1;
      // angle arcs
      c.strokeStyle = ST.blue; c.beginPath(); c.arc(ix, iy, 34, -Math.PI / 2 - th1, -Math.PI / 2); c.stroke();
      c.strokeStyle = ST.amber; c.beginPath(); c.arc(ix, iy, 34, Math.PI / 2 - th2, Math.PI / 2); c.stroke();
      mono(c, `θ₁=${fmt(vars.th1)}°`, ix - 46, iy - 40, ST.blue, "right", 10);
      mono(c, `θ₂=${fmt((th2 * 180) / Math.PI)}°`, ix + 46, iy + 46, ST.amber, "left", 10);
    } else {
      arrow(c, ix, iy, ix + Lr * Math.sin(th1), iy - Lr * Math.cos(th1), ST.red, "");
      mono(c, "TOTAL INTERNAL REFLECTION", ix + 20, iy + 30, ST.red, "left", 10.5);
    }
    mono(c, `n₁=${fmt(n1, 3)}`, 14, 22, ST.blue, "left", 10);
    mono(c, `n₂=${fmt(n2, 3)}`, 14, iy + 20, ST.amber, "left", 10);
    mono(c, "wavefronts compress where light is slower", w - 14, h - 12, ST.text, "right", 9);
  });

  return (
    <SimShell fig="FIG. 08" title="Optical Bench — Refraction" footnote="Monochromatic ray, plane interface. Wavefront spacing shows the speed change (λ ∝ 1/n)."
      h="h-[380px]"
    >
      <canvas ref={canvasRef} />
    </SimShell>
  );
}

/* ================= ORBIT + GRAVITY FORCE ================= */
const GM_REAL = 3.986e14;
const R_EARTH = 6.371e6;

export function OrbitSim({ vars, whatif }: SimProps) {
  const [vectors, setVectors] = useState(true);
  const [trail, setTrail] = useState(true);
  const st = useRef({ x: 0, y: 0, vx: 0, vy: 0, t: 0, last: -1, trail: [] as [number, number][], escaped: false });

  const gravOff = whatif?.g0 !== undefined;
  const vmult = whatif?.vmult ?? 1;
  const hEff = whatif?.h ?? vars.h ?? 400;
  const forceMode = vars.r !== undefined && vars.m1 !== undefined;
  const key = JSON.stringify([vars, whatif]);
  useEffect(() => {
    if (forceMode) return;
    const rN = 1 + (hEff * 1000) / R_EARTH;
    const vc = Math.sqrt(1 / rN) * vmult;
    st.current = { x: rN, y: 0, vx: 0, vy: vc, t: 0, last: -1, trail: [], escaped: false };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const canvasRef = useStageCanvas((c, w, h) => {
    /* ---------- static two-body force view (gravforce concept) ---------- */
    if (forceMode) {
      c.clearRect(0, 0, w, h);
      const G = 6.674e-11;
      const F = (G * vars.m1 * vars.m2) / (vars.r * vars.r);
      const cy = h * 0.55;
      const sc = (w - 220) / 10;
      const x1 = w / 2 - (vars.r / 2) * sc;
      const x2 = w / 2 + (vars.r / 2) * sc;
      // distance ruler
      c.strokeStyle = ST.grid; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x1, cy + 64); c.lineTo(x2, cy + 64); c.stroke();
      c.beginPath(); c.moveTo(x1, cy + 58); c.lineTo(x1, cy + 70); c.moveTo(x2, cy + 58); c.lineTo(x2, cy + 70); c.stroke();
      mono(c, `r = ${fmt(vars.r)} m`, w / 2, cy + 84, ST.text, "center", 10);
      const r1 = 18 + vars.m1 * 0.35, r2 = 18 + vars.m2 * 0.35;
      c.fillStyle = ST.blue; c.beginPath(); c.arc(x1, cy, r1, 0, Math.PI * 2); c.fill();
      c.fillStyle = ST.green; c.beginPath(); c.arc(x2, cy, r2, 0, Math.PI * 2); c.fill();
      mono(c, `m₁=${fmt(vars.m1)}kg`, x1, cy - r1 - 8, ST.blue, "center", 10);
      mono(c, `m₂=${fmt(vars.m2)}kg`, x2, cy - r2 - 8, ST.green, "center", 10);
      const Flen = Math.max(26, Math.min(110, 60 + Math.log10(F / 1e-9 + 1) * 22));
      arrow(c, x1 + r1 + 4, cy, x1 + r1 + 4 + Flen, cy, ST.red, "F");
      arrow(c, x2 - r2 - 4, cy, x2 - r2 - 4 - Flen, cy, ST.red, "F");
      mono(c, `F = Gm₁m₂/r² = ${fmt(F)} N`, 14, 22, ST.body, "left", 11);
      mono(c, "equal & opposite — Newton's third law", 14, 40, ST.text, "left", 9.5);
      mono(c, `×4 force when r halves (inverse square)`, w - 14, 22, ST.amber, "right", 9.5);
      return;
    }
    const now = performance.now() / 1000;
    const dt = st.current.last < 0 ? 0.016 : Math.min(0.05, now - st.current.last);
    st.current.last = now;
    const s = st.current;
    const rN = 1 + (hEff * 1000) / R_EARTH;

    // integrate (normalised units, GM = 1)
    for (let i = 0; i < 4; i++) {
      const r = Math.hypot(s.x, s.y);
      if (!gravOff && r > 0.2) {
        const a = -1 / (r * r);
        s.vx += (a * s.x / r) * (dt / 4) * 2.2;
        s.vy += (a * s.y / r) * (dt / 4) * 2.2;
      }
      s.x += s.vx * (dt / 4) * 2.2;
      s.y += s.vy * (dt / 4) * 2.2;
      s.t += dt / 4;
    }
    const rCur = Math.hypot(s.x, s.y);
    if (rCur > 12) s.escaped = true;
    if (rCur < 1) { // re-entered: restart
      const vc = Math.sqrt(1 / rN) * vmult;
      s.x = rN; s.y = 0; s.vx = 0; s.vy = vc; s.trail = []; s.escaped = false;
    }
    s.trail.push([s.x, s.y]);
    if (s.trail.length > 420) s.trail.shift();

    c.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const maxR = gravOff ? 12 : Math.max(rN * 2.4, 4);
    const sc = (Math.min(w, h) / 2 - 40) / maxR;
    const X = (x: number) => cx + x * sc;
    const Y = (y: number) => cy - y * sc;

    // Earth
    const er = Math.max(1 * sc, 26);
    c.beginPath(); c.arc(cx, cy, er, 0, Math.PI * 2);
    c.fillStyle = "#2e4257"; c.fill();
    c.strokeStyle = ST.blue; c.lineWidth = 1.5; c.stroke();
    mono(c, "EARTH", cx, cy + 3, "#7fb2e5", "center", 9);

    // reference circular orbit
    c.strokeStyle = ST.grid; c.setLineDash([3, 6]);
    c.beginPath(); c.arc(cx, cy, rN * sc, 0, Math.PI * 2); c.stroke();
    c.setLineDash([]);

    // trail
    if (trail && s.trail.length > 1) {
      c.strokeStyle = gravOff ? ST.red : ST.blue;
      c.lineWidth = 1.5;
      c.globalAlpha = 0.75;
      c.beginPath();
      s.trail.forEach(([tx, ty], i) => { const px = X(tx), py = Y(ty); if (i === 0) c.moveTo(px, py); else c.lineTo(px, py); });
      c.stroke();
      c.globalAlpha = 1;
    }

    // satellite
    const px = X(s.x), py = Y(s.y);
    c.fillStyle = ST.amber;
    c.beginPath(); c.arc(px, py, 5.5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#5c4a1e"; c.stroke();
    // solar panels
    c.fillStyle = ST.body;
    c.fillRect(px - 14, py - 2, 7, 4);
    c.fillRect(px + 7, py - 2, 7, 4);

    if (vectors && !s.escaped) {
      const vReal = Math.hypot(s.vx, s.vy);
      const vScale = 46 / Math.max(0.2, vReal);
      arrow(c, px, py, px + s.vx * vScale, py - s.vy * vScale, ST.blue, "v");
      if (!gravOff) {
        arrow(c, px, py, px - (s.x / rCur) * 38, py + (s.y / rCur) * 38, ST.red, "F=gravity");
      } else {
        mono(c, "GRAVITY OFF — Newton's 1st law: straight line", w / 2, h - 14, ST.red, "center", 10.5);
      }
    }

    const rReal = R_EARTH + hEff * 1000;
    const vReal = Math.sqrt(GM_REAL / rReal);
    const T = (2 * Math.PI * rReal) / vReal;
    mono(c, gravOff ? "WHAT-IF: gravity removed" : `v = √(GM/r) = ${fmt(vReal)} m/s`, 12, 20, gravOff ? ST.red : ST.body, "left", 10.5);
    if (!gravOff) mono(c, `T = ${fmt(T / 60)} min   alt = ${fmt(hEff)} km${vmult !== 1 ? `   v ×${fmt(vmult, 3)}` : ""}${whatif?.h !== undefined ? "  (WHAT-IF)" : ""}`, 12, 36, whatif?.h !== undefined ? ST.amber : ST.text, "left", 9.5);
    if (s.escaped) mono(c, "ESCAPED the system", w - 12, 20, ST.red, "right", 10.5);
    if (vmult >= 1.41 && !gravOff) mono(c, "v ≥ √2·v_orbit → escape trajectory", w - 12, 36, ST.amber, "right", 9.5);
  });

  return (
    <SimShell fig="FIG. 09" title="Orbital Chamber" footnote="Display distances scaled; readouts use real Earth values (GM = 3.986×10¹⁴ m³/s²). WHAT-IF presets alter gravity and speed."
      h="h-[400px]"
      right={
        <div className="flex items-center gap-1.5">
          <Toggle on={vectors} onClick={() => setVectors(!vectors)} label="Vectors" />
          <Toggle on={trail} onClick={() => setTrail(!trail)} label="Trail" />
        </div>
      }
    >
      <canvas ref={canvasRef} />
    </SimShell>
  );
}

/* ================= GAS CHAMBER (standalone thermo) ================= */
export function GasChamber({ vars }: { vars?: Record<string, number> }) {
  const [Ti, setT] = useState(300);
  const [Vi, setV] = useState(40);
  const [Ni, setN] = useState(70);
  const driven = !!(vars && vars.T !== undefined);
  const T = driven ? vars!.T : Ti;
  const V = driven ? (vars!.V ?? 0.1) * 1000 : Vi;
  const N = driven ? Math.round(Math.min(140, Math.max(10, (vars!.n ?? 2) * 35))) : Ni;
  const n = driven ? vars!.n ?? 2 : 0.5;
  const parts = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);
  const st = useRef({ last: -1 });

  useEffect(() => {
    parts.current = Array.from({ length: 140 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5), vy: (Math.random() - 0.5),
    }));
  }, []);

  const canvasRef = useStageCanvas((c, w, h) => {
    const now = performance.now() / 1000;
    const dt = st.current.last < 0 ? 0.016 : Math.min(0.05, now - st.current.last);
    st.current.last = now;
    const boxW = Math.min(1, Math.max(0.12, V / 100)) * (w - 140);
    const boxH = h - 120;
    const bx = 40, by = 50;
    const speed = Math.sqrt(T / 300) * 90;

    for (let i = 0; i < N; i++) {
      const p = parts.current[i];
      p.x += (p.vx * speed * dt) / boxW;
      p.y += (p.vy * speed * dt) / boxH;
      if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
      if (p.x > 1) { p.x = 1; p.vx = -Math.abs(p.vx); }
      if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
      if (p.y > 1) { p.y = 1; p.vy = -Math.abs(p.vy); }
    }

    c.clearRect(0, 0, w, h);
    // chamber
    c.strokeStyle = ST.body; c.lineWidth = 2;
    c.strokeRect(bx, by, boxW, boxH);
    c.fillStyle = `rgba(229,138,126,${Math.min(0.16, (T / 600) * 0.16)})`;
    c.fillRect(bx, by, boxW, boxH);
    // piston arrow
    arrow(c, bx + boxW + 26, by + boxH / 2, bx + boxW + 6, by + boxH / 2, ST.bodyDark, "");
    mono(c, "piston", bx + boxW + 30, by + boxH / 2 + 4, ST.text, "left", 9);

    for (let i = 0; i < N; i++) {
      const p = parts.current[i];
      c.beginPath();
      c.arc(bx + p.x * boxW, by + p.y * boxH, 2.4, 0, Math.PI * 2);
      c.fillStyle = T > 420 ? ST.red : T < 200 ? ST.blue : ST.body;
      c.fill();
    }

    const P = (n * 8.314 * T) / (V / 1000); // Pa
    mono(c, `T = ${fmt(T)} K`, 14, 22, ST.red, "left", 10.5);
    mono(c, `V = ${fmt(V)} L`, 14, 38, ST.blue, "left", 10.5);
    mono(c, `P = nRT/V = ${fmt(P / 1000)} kPa`, w - 14, 22, ST.amber, "right", 10.5);
    mono(c, `v_rms ∝ √T — particles visibly ${T > 350 ? "faster" : T < 250 ? "slower" : "steady"}`, w - 14, 38, ST.text, "right", 9.5);
    mono(c, "ideal-gas model: point particles, elastic wall collisions", w / 2, h - 12, ST.text, "center", 9);
  });

  return (
    <SimShell fig="FIG. 10" title="Particle Chamber" footnote="2-D idealised gas; pressure readout from PV = nRT with n = 0.5 mol. Particle speed ∝ √T."
      h="h-[360px]"
    >
      <canvas ref={canvasRef} />
      {!driven && (
        <div className="absolute bottom-3 left-3 flex w-64 flex-col gap-2 border border-stageline bg-[rgba(27,32,38,0.92)] p-3">
          <TactSlider sym="T" name="Temperature" unit="K" min={100} max={600} step={5} value={Ti} onChange={setT} color="#e58a7e" />
          <TactSlider sym="V" name="Volume" unit="L" min={15} max={100} step={1} value={Vi} onChange={setV} color="#7fb2e5" />
          <TactSlider sym="N" name="Particles" unit="" min={10} max={140} step={5} value={Ni} onChange={setN} color="#c9d0d7" />
        </div>
      )}
      {driven && (
        <p className="absolute bottom-2 left-3 font-mono text-[8.5px] uppercase tracking-[0.14em] text-[#9aa4ae]">
          driven by the equation panel — n = {fmt(n)} mol
        </p>
      )}
    </SimShell>
  );
}

/* ================= LENS RAY BENCH (standalone optics) ================= */
export function LensRay() {
  const [u, setU] = useState(40);
  const [f, setF] = useState(15);
  const canvasRef = useStageCanvas((c, w, h) => {
    c.clearRect(0, 0, w, h);
    const axisY = h * 0.56;
    const lx = w * 0.5;
    const sc = (w * 0.42) / 90;
    const ho = 46;

    // axis + lens
    c.strokeStyle = ST.grid; c.beginPath(); c.moveTo(20, axisY); c.lineTo(w - 20, axisY); c.stroke();
    c.strokeStyle = ST.blue; c.lineWidth = 2;
    c.beginPath();
    c.ellipse(lx, axisY, 7, 78, 0, 0, Math.PI * 2);
    c.stroke();
    // focal points
    for (const sgn of [-1, 1]) {
      c.fillStyle = ST.amber;
      c.beginPath(); c.arc(lx + sgn * f * sc, axisY, 3.5, 0, Math.PI * 2); c.fill();
      mono(c, "F", lx + sgn * f * sc, axisY + 16, ST.amber, "center", 9);
      c.beginPath(); c.arc(lx + sgn * 2 * f * sc, axisY, 2.5, 0, Math.PI * 2); c.fill();
      mono(c, "2F", lx + sgn * 2 * f * sc, axisY + 16, ST.amber, "center", 8);
    }

    const objX = lx - u * sc;
    // object
    arrow(c, objX, axisY, objX, axisY - ho, ST.body, "object");

    const v = (u * f) / (u - f); // image distance (signed)
    const m = -v / u;
    const hi = ho * m;
    const imgX = lx + v * sc;
    const real = v > 0;

    const ray = (x1: number, y1: number, x2: number, y2: number, col: string) => {
      c.strokeStyle = col; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    };
    const tipY = axisY - ho;
    if (real && imgX < w - 10) {
      ray(objX, tipY, lx, tipY, ST.amber); ray(lx, tipY, imgX, axisY - hi, ST.amber); // parallel → through F'
      ray(objX, tipY, lx + 0, axisY - (ho * (1 - 0)) + 0, ST.amber);
      // through-centre ray
      ray(objX, tipY, Math.min(w - 20, imgX + 30), axisY - hi + (hi / (imgX - lx)) * Math.min(30, w - 20 - imgX), ST.amber);
      // ray through F
      const slopeF = (tipY - axisY) / (objX - (lx - f * sc));
      ray(objX, tipY, lx, tipY + slopeF * (lx - objX) * 0 + (tipY - (axisY + slopeF * (objX - (lx - f * sc)))) * 0, ST.amber);
      // image
      arrow(c, imgX, axisY, imgX, axisY - hi, ST.red, real ? "real image" : "");
    } else {
      // virtual image
      const vAbs = Math.abs(v);
      const vX = lx - vAbs * sc;
      c.setLineDash([4, 4]);
      ray(objX, tipY, lx, tipY, ST.amber);
      const slope = (tipY - axisY) / (lx - (lx + f * sc));
      ray(lx, tipY, Math.min(w - 20, lx + 160), tipY + slope * 160, ST.amber);
      c.strokeStyle = ST.amber;
      c.beginPath(); c.moveTo(lx, tipY); c.lineTo(vX, axisY - hi); c.stroke();
      c.setLineDash([]);
      arrow(c, vX, axisY, vX, axisY - hi, ST.purple, "virtual image");
    }

    mono(c, `u = ${fmt(u)} cm   f = ${fmt(f)} cm`, 14, 22, ST.body, "left", 10.5);
    mono(c, `1/v = 1/f − 1/u  →  v = ${fmt(v)} cm   m = ${fmt(m, 3)}`, 14, 38, ST.text, "left", 9.5);
    mono(c, real ? (Math.abs(m) > 1 ? "magnified · inverted · real" : "diminished · inverted · real") : "magnified · upright · virtual", w - 14, 22, ST.amber, "right", 9.5);
  });

  return (
    <SimShell fig="FIG. 11" title="Ray Bench — Thin Lens" footnote="Principal-ray construction for a converging lens; sign convention: real images form on the far side."
      h="h-[340px]"
    >
      <canvas ref={canvasRef} />
      <div className="absolute bottom-3 left-3 flex w-64 flex-col gap-2 border border-stageline bg-[rgba(27,32,38,0.92)] p-3">
        <TactSlider sym="u" name="Object distance" unit="cm" min={8} max={85} step={1} value={u} onChange={setU} color="#c9d0d7" />
        <TactSlider sym="f" name="Focal length" unit="cm" min={5} max={30} step={0.5} value={f} onChange={setF} color="#dcae60" />
      </div>
    </SimShell>
  );
}

/* ================= SIM MAP ================= */
export const SIMS: Record<SimKind, React.ComponentType<SimProps>> = {
  bench: BenchSim,
  freefall: FreeFallSim,
  projectile: ProjectileSim,
  pendulum: PendulumSim,
  spring: SpringSim,
  collision: CollisionSim,
  ohm: OhmSim,
  waves: WavesSim,
  optics: OpticsSim,
  gas: GasChamber as unknown as React.ComponentType<SimProps>,
  orbit: OrbitSim,
  incline: InclineSim,
  circular: CircularSim,
  torque: TorqueSim,
  buoyancy: BuoyancySim,
  atwood: AtwoodSim,
};
