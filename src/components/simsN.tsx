import { useEffect, useRef, useState } from "react";
import { fmt, useStageCanvas } from "../lib/labkit";
import { arrow, type SimProps } from "./simsM";
import { CtlBtn, SimShell, Toggle } from "./ui";

/* ============================================================
   NEW MECHANICS + FLUIDS SIMULATIONS
   incline · circular · torque · buoyancy · atwood
   All integrate real equations — nothing loops for decoration.
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
const hatch = (c: CanvasRenderingContext2D, y: number, w: number) => {
  c.strokeStyle = ST.grid; c.lineWidth = 1;
  c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke();
  for (let x = 0; x < w; x += 12) { c.beginPath(); c.moveTo(x, y); c.lineTo(x - 7, y + 8); c.stroke(); }
};

function useRun() {
  const [run, setRun] = useState(true);
  const runRef = useRef(run);
  runRef.current = run;
  return { run, setRun, runRef };
}
function Controls({ run, setRun, reset, extra }: { run: boolean; setRun: (b: boolean) => void; reset: () => void; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <CtlBtn icon={run ? "pause" : "play"} onClick={() => setRun(!run)} title={run ? "Pause" : "Run"} active={run} />
      <CtlBtn icon="reset" onClick={reset} title="Reset" />
      {extra}
    </div>
  );
}

/* ================= INCLINED PLANE ================= */
export function InclineSim({ vars }: SimProps) {
  const { run, setRun, runRef } = useRun();
  const [components, setComponents] = useState(true);
  const st = useRef({ s: 0, v: 0, t: 0, last: -1 });

  useEffect(() => { st.current = { s: 0, v: 0, t: 0, last: -1 }; }, [JSON.stringify(vars)]); // eslint-disable-line react-hooks/exhaustive-deps

  const canvasRef = useStageCanvas((c, w, h) => {
    const now = performance.now() / 1000;
    const dt = st.current.last < 0 ? 0.016 : Math.min(0.05, now - st.current.last);
    st.current.last = now;
    const { m, th, mu } = { m: vars.m ?? 4, th: vars.th ?? 30, mu: vars.mu ?? 0 };
    const r = (th * Math.PI) / 180;
    const aMax = 9.8 * (Math.sin(r) - mu * Math.cos(r));
    const s = st.current;
    if (runRef.current && aMax > 1e-6) {
      s.v = Math.max(0, s.v + aMax * dt);
      s.s += s.v * dt;
      s.t += dt;
      if (s.s > 7.2) { s.s = 0; s.v = 0; }
    }

    c.clearRect(0, 0, w, h);
    const bx = w * 0.16, by = h * 0.86;
    const rampLen = Math.min(w * 0.72, h * 1.9);
    const tx = bx + rampLen * Math.cos(r), ty = by - rampLen * Math.sin(r);

    // wedge
    c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, by); c.lineTo(tx, ty); c.closePath();
    c.fillStyle = "#242b33"; c.fill();
    c.strokeStyle = ST.bodyDark; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); c.stroke();
    hatch(c, by, w);
    // angle arc
    c.strokeStyle = ST.amber; c.setLineDash([3, 3]);
    c.beginPath(); c.arc(tx, by, 40, -Math.PI, -Math.PI + r, true); c.stroke();
    c.setLineDash([]);
    mono(c, `${fmt(th)}°`, tx - 52, by - 12, ST.amber, "right", 10);

    // block position on slope (released from the top, travels s metres)
    const d = s.s * (rampLen / 7.2);
    const px = tx - d * Math.cos(r), py = ty + d * Math.sin(r);
    const size = 26 + m * 1.1;
    c.save();
    c.translate(px, py);
    c.rotate(-r);
    c.fillStyle = ST.body;
    c.fillRect(-size / 2, -size - 2, size, size);
    c.strokeStyle = ST.bodyDark; c.strokeRect(-size / 2, -size - 2, size, size);
    mono(c, `${fmt(m)} kg`, 0, -size / 2 - 4, "#22282f", "center", 9.5);
    if (components) {
      const gsc = m * 1.15;
      arrow(c, 0, -size / 2 - 2, 0, -size / 2 - 2 + gsc, ST.red, "mg");
      arrow(c, 0, -size / 2 - 2, gsc * Math.sin(r) * -1 * -1, -size / 2 - 2 + gsc * Math.cos(r), ST.amber, "");
    }
    c.restore();

    if (components && aMax > 1e-6) {
      const alen = Math.min(90, aMax * 12);
      arrow(c, px, py - size / 2, px + alen * Math.cos(r), py - size / 2 + alen * Math.sin(r), ST.blue, `a=${fmt(aMax)}`);
    }

    mono(c, `a = g(sinθ − μcosθ) = ${fmt(aMax)} m/s²`, 12, 20, aMax > 1e-6 ? ST.body : ST.red, "left", 10.5);
    mono(c, aMax > 1e-6
      ? `v = ${fmt(s.v)} m/s   s = ${fmt(s.s)} m   t = ${fmt(s.t)} s`
      : `μ ≥ tanθ (${fmt(Math.tan(r), 3)}) — static friction holds the block`, 12, 36, aMax > 1e-6 ? ST.text : ST.red, "left", 9.5);
    mono(c, "mass cancels — try doubling it", w - 12, 20, ST.text, "right", 9);
  });

  return (
    <SimShell fig="FIG. 12" title="Inclined Plane" footnote="Wedge at θ with adjustable μ; block released from the top integrates a = g(sinθ − μcosθ) when it slides."
      h="h-[360px]"
      right={<Controls run={run} setRun={setRun} reset={() => { st.current = { s: 0, v: 0, t: 0, last: -1 }; }}
        extra={<Toggle on={components} onClick={() => setComponents(!components)} label="Forces" />} />}
    >
      <canvas ref={canvasRef} />
    </SimShell>
  );
}

/* ================= CIRCULAR MOTION ================= */
export function CircularSim({ vars }: SimProps) {
  const { run, setRun, runRef } = useRun();
  const [vectors, setVectors] = useState(true);
  const st = useRef({ a: 0, last: -1 });

  useEffect(() => { st.current.a = 0; }, [JSON.stringify(vars)]); // eslint-disable-line react-hooks/exhaustive-deps

  const canvasRef = useStageCanvas((c, w, h) => {
    const now = performance.now() / 1000;
    const dt = st.current.last < 0 ? 0.016 : Math.min(0.05, now - st.current.last);
    st.current.last = now;
    const { m, v, r } = { m: vars.m ?? 0.15, v: vars.v ?? 2.81, r: vars.r ?? 0.8 };
    const omega = v / r;
    if (runRef.current) st.current.a += omega * dt;
    const a = st.current.a;

    c.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2 + 6;
    const R = Math.max(36, 36 + (r / 5) * (Math.min(w, h) * 0.33));

    // track
    c.strokeStyle = ST.grid; c.lineWidth = 1.5;
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
    c.setLineDash([2, 6]);
    c.beginPath(); c.arc(cx, cy, R * 0.6, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(cx, cy, R * 1.35, 0, Math.PI * 2); c.stroke();
    c.setLineDash([]);
    // centre post + string
    const bx = cx + R * Math.cos(a), by = cy + R * Math.sin(a);
    c.strokeStyle = ST.body; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(bx, by); c.stroke();
    c.fillStyle = ST.bodyDark;
    c.beginPath(); c.arc(cx, cy, 4, 0, Math.PI * 2); c.fill();

    // swept angle arc
    c.strokeStyle = ST.amber;
    c.beginPath(); c.arc(cx, cy, 22, 0, a % (Math.PI * 2)); c.stroke();

    // ball
    const bs = 8 + m * 4;
    c.beginPath(); c.arc(bx, by, bs, 0, Math.PI * 2);
    c.fillStyle = ST.blue; c.fill();
    c.strokeStyle = "#16324f"; c.stroke();
    mono(c, `${fmt(m)} kg`, bx, by - bs - 6, ST.blue, "center", 9);

    const F = (m * v * v) / r;
    if (vectors) {
      // tangential velocity
      const ux = -Math.sin(a), uy = Math.cos(a);
      arrow(c, bx, by, bx + ux * Math.min(90, v * 12), by + uy * Math.min(90, v * 12), ST.blue, "v");
      // inward force (tension)
      arrow(c, bx, by, bx - Math.cos(a) * Math.min(80, F * 6), by - Math.sin(a) * Math.min(80, F * 6), ST.red, "F_c");
    }

    mono(c, `F_c = mv²/r = ${fmt(F)} N`, 12, 20, ST.body, "left", 10.5);
    mono(c, `ω = ${fmt(omega)} rad/s   T = ${fmt((2 * Math.PI) / omega)} s   a_c = ${fmt(v * v / r)} m/s²`, 12, 36, ST.text, "left", 9.5);
    mono(c, "v ⊥ F at every instant — speed never changes", w - 12, 20, ST.text, "right", 9);
  });

  return (
    <SimShell fig="FIG. 13" title="Centripetal Rig" footnote="Uniform circular motion: string tension supplies mv²/r. Velocity stays tangential — perpendicular to the force."
      h="h-[360px]"
      right={<Controls run={run} setRun={setRun} reset={() => { st.current.a = 0; }}
        extra={<Toggle on={vectors} onClick={() => setVectors(!vectors)} label="Vectors" />} />}
    >
      <canvas ref={canvasRef} />
    </SimShell>
  );
}

/* ================= TORQUE / SEESAW ================= */
export function TorqueSim({ vars }: SimProps) {
  const { run, setRun, runRef } = useRun();
  const st = useRef({ ph: 0, w: 0, last: -1 });

  useEffect(() => { st.current = { ph: 0, w: 0, last: -1 }; }, [JSON.stringify(vars)]); // eslint-disable-line react-hooks/exhaustive-deps

  const canvasRef = useStageCanvas((c, w, h) => {
    const now = performance.now() / 1000;
    const dt = st.current.last < 0 ? 0.016 : Math.min(0.05, now - st.current.last);
    st.current.last = now;
    const F = vars.F ?? 20, r = vars.r ?? 0.6;
    const tau = F * r;
    const tauLoad = 30 * 0.5; // fixed 30 N load at 0.5 m, opposing
    const net = tau - tauLoad;
    const s = st.current;
    if (runRef.current) {
      const alpha = net * 2.2;
      s.w += alpha * dt * 0.02;
      s.w *= 0.985;
      s.ph = Math.max(-0.5, Math.min(0.5, s.ph + s.w * dt));
      if (Math.abs(s.ph) >= 0.5) s.w *= -0.3;
    }

    c.clearRect(0, 0, w, h);
    const cx = w / 2, py = h * 0.62;
    const beam = Math.min(w * 0.4, 260);
    const sc = beam / 2; // half-beam = 2 m

    // fulcrum
    c.beginPath(); c.moveTo(cx, py); c.lineTo(cx - 22, h * 0.86); c.lineTo(cx + 22, h * 0.86); c.closePath();
    c.fillStyle = ST.bodyDark; c.fill();
    hatch(c, h * 0.86, w);

    // beam
    c.save();
    c.translate(cx, py);
    c.rotate(s.ph);
    c.fillStyle = ST.body;
    c.fillRect(-beam, -5, beam * 2, 10);
    c.strokeStyle = ST.bodyDark; c.strokeRect(-beam, -5, beam * 2, 10);
    // metre marks
    for (let mm = -2; mm <= 2; mm += 0.5) {
      c.beginPath(); c.moveTo(mm * sc, -5); c.lineTo(mm * sc, mm % 1 === 0 ? 5 : 0); c.strokeStyle = ST.grid; c.stroke();
    }
    // load (fixed 30 N at left 0.5 m)
    c.fillStyle = ST.green;
    c.fillRect(-0.5 * sc - 14, 5, 28, 24);
    mono(c, "30 N", -0.5 * sc, 21, "#12241a", "center", 9);
    // applied force at r (right side)
    const fx = r * sc;
    arrow(c, fx, -8 - Math.min(80, F * 0.7), fx, -8, ST.red, "");
    c.fillStyle = ST.red;
    c.beginPath(); c.arc(fx, -5, 4, 0, Math.PI * 2); c.fill();
    mono(c, `${fmt(F)} N`, fx + 8, -14 - Math.min(70, F * 0.6), ST.red, "left", 9.5);
    c.restore();

    // lever arm bracket
    c.strokeStyle = ST.amber; c.setLineDash([3, 3]);
    c.beginPath(); c.moveTo(cx, py + 34); c.lineTo(cx + r * sc * Math.cos(s.ph), py + 34); c.stroke();
    c.setLineDash([]);
    mono(c, `r = ${fmt(r)} m`, cx + (r * sc) / 2, py + 48, ST.amber, "center", 9.5);

    const balanced = Math.abs(net) < 0.5;
    mono(c, `τ = rF = ${fmt(tau)} N·m   vs load τ = ${fmt(tauLoad)} N·m`, 12, 20, ST.body, "left", 10.5);
    mono(c, balanced ? "BALANCED — Στ = 0, the beam rests in equilibrium" : net > 0 ? "your side wins — beam rotates anticlockwise" : "the load wins — beam rotates clockwise",
      12, 36, balanced ? ST.green : ST.amber, "left", 9.5);
    mono(c, `need F = ${fmt(tauLoad / Math.max(0.1, r))} N at this arm to balance`, w - 12, 20, ST.text, "right", 9);
  });

  return (
    <SimShell fig="FIG. 14" title="Lever Bench" footnote="A 30 N load sits at 0.5 m; your force at distance r must match its torque (30 × 0.5 = 15 N·m) to balance."
      h="h-[360px]"
      right={<Controls run={run} setRun={setRun} reset={() => { st.current = { ph: 0, w: 0, last: -1 }; }} />}
    >
      <canvas ref={canvasRef} />
    </SimShell>
  );
}

/* ================= BUOYANCY TANK ================= */
export function BuoyancySim({ vars }: SimProps) {
  const { run, setRun, runRef } = useRun();
  const [wave, setWave] = useState(true);
  const st = useRef({ y: 0, v: 0, t: 0, last: -1 });

  useEffect(() => { st.current = { y: 0.2, v: 0, t: 0, last: -1 }; }, [JSON.stringify(vars)]); // eslint-disable-line react-hooks/exhaustive-deps

  const canvasRef = useStageCanvas((c, w, h) => {
    const now = performance.now() / 1000;
    const dt = st.current.last < 0 ? 0.016 : Math.min(0.05, now - st.current.last);
    st.current.last = now;
    const rho = vars.rho ?? 600, V = vars.V ?? 0.005;
    const rhoF = 1000;
    const floats = rho < rhoF;
    const frac = Math.min(1, rho / rhoF); // submerged fraction at equilibrium
    const s = st.current;
    if (runRef.current) {
      // spring-damper toward equilibrium depth
      const eq = floats ? frac : 1;
      const k = 14, damp = 2.6;
      s.v += (-k * (s.y - eq) - damp * s.v) * dt;
      s.y += s.v * dt;
      s.t += dt;
    }

    c.clearRect(0, 0, w, h);
    const tankL = w * 0.14, tankR = w * 0.86;
    const surfY = h * 0.32, botY = h * 0.88;

    // tank
    c.strokeStyle = ST.body; c.lineWidth = 2;
    c.beginPath(); c.moveTo(tankL, surfY - 40); c.lineTo(tankL, botY); c.lineTo(tankR, botY); c.lineTo(tankR, surfY - 40); c.stroke();
    // water with subtle surface wave
    c.fillStyle = "rgba(127,178,229,0.14)";
    c.beginPath();
    c.moveTo(tankL, surfY);
    for (let x = tankL; x <= tankR; x += 6) {
      c.lineTo(x, surfY + (wave && runRef.current ? Math.sin(x * 0.05 + s.t * 2) * 2 : 0));
    }
    c.lineTo(tankR, botY); c.lineTo(tankL, botY); c.closePath(); c.fill();
    c.strokeStyle = ST.blue; c.lineWidth = 1.2;
    c.beginPath();
    for (let x = tankL; x <= tankR; x += 6) {
      const yy = surfY + (wave && runRef.current ? Math.sin(x * 0.05 + s.t * 2) * 2 : 0);
      if (x === tankL) c.moveTo(x, yy); else c.lineTo(x, yy);
    }
    c.stroke();

    // block (area grows with volume; √ keeps it on screen from cork to boat hull)
    const size = 30 + Math.sqrt(V) * 62;
    const depth = (botY - surfY - size) * Math.max(0.05, Math.min(1.02, s.y));
    const byTop = surfY + depth;
    const bx = (tankL + tankR) / 2;
    c.fillStyle = floats ? ST.green : ST.bodyDark;
    c.globalAlpha = 0.92;
    c.fillRect(bx - size / 2, byTop, size, size);
    c.globalAlpha = 1;
    c.strokeStyle = "rgba(0,0,0,0.4)"; c.strokeRect(bx - size / 2, byTop, size, size);
    mono(c, `ρ=${fmt(rho)}`, bx, byTop + size / 2 + 3, "#1b2026", "center", 9);

    // waterline marker on block
    if (floats) {
      c.strokeStyle = ST.amber; c.setLineDash([3, 3]);
      c.beginPath(); c.moveTo(bx - size / 2 - 8, surfY); c.lineTo(bx + size / 2 + 8, surfY); c.stroke();
      c.setLineDash([]);
    }

    // vectors
    const W = rho * V * 9.8;
    const Vsub = V * Math.min(1, (byTop + size - surfY) / size) * (floats ? 1 : 1);
    const Fb = rhoF * Math.max(0, Vsub) * 9.8 * Math.min(1, (byTop + size - surfY) / size > 0 ? 1 : 0);
    const FbEq = floats ? W : rhoF * V * 9.8;
    arrow(c, bx - size / 2 - 18, byTop + size / 2, bx - size / 2 - 18, byTop + size / 2 + Math.min(70, W * 1.4), ST.red, `W=${fmt(W)}N`);
    arrow(c, bx + size / 2 + 18, byTop + size / 2, bx + size / 2 + 18, byTop + size / 2 - Math.min(70, FbEq * 1.4), ST.blue, `F_b=${fmt(FbEq)}N`);
    void Fb;

    // depth ruler
    for (let mtr = 0; mtr <= 4; mtr++) {
      const yy = surfY + ((botY - surfY) * mtr) / 4;
      c.strokeStyle = ST.grid; c.beginPath(); c.moveTo(tankR - 8, yy); c.lineTo(tankR, yy); c.stroke();
      mono(c, `${(mtr * 0.25).toFixed(2)}`, tankR - 12, yy + 3, ST.text, "right", 8.5);
    }

    mono(c, floats
      ? `floating — ${fmt(frac * 100)}% submerged (ρ/ρ_water = ${fmt(frac, 3)}), F_b = W = ${fmt(W)} N`
      : `sinks — F_b = ${fmt(rhoF * V * 9.8)} N < W = ${fmt(W)} N, apparent weight ${fmt(W - rhoF * V * 9.8)} N`,
      12, 20, floats ? ST.green : ST.red, "left", 10.5);
    mono(c, "Archimedes: F_b equals the weight of displaced water", w - 12, 20, ST.text, "right", 9);
  });

  return (
    <SimShell fig="FIG. 15" title="Buoyancy Tank" footnote="The block settles where displaced water weighs the same as it — ρ < 1000 floats, ρ > 1000 sinks. Water ρ = 1000 kg/m³."
      h="h-[360px]"
      right={<Controls run={run} setRun={setRun} reset={() => { st.current = { y: 0.2, v: 0, t: 0, last: -1 }; }}
        extra={<Toggle on={wave} onClick={() => setWave(!wave)} label="Ripple" />} />}
    >
      <canvas ref={canvasRef} />
    </SimShell>
  );
}

/* ================= ATWOOD MACHINE ================= */
export function AtwoodSim({ vars }: SimProps) {
  const { run, setRun, runRef } = useRun();
  const [vectors, setVectors] = useState(true);
  const st = useRef({ y: 0, v: 0, t: 0, pulley: 0, last: -1 });

  useEffect(() => { st.current = { y: 0, v: 0, t: 0, pulley: 0, last: -1 }; }, [JSON.stringify(vars)]); // eslint-disable-line react-hooks/exhaustive-deps

  const canvasRef = useStageCanvas((c, w, h) => {
    const now = performance.now() / 1000;
    const dt = st.current.last < 0 ? 0.016 : Math.min(0.05, now - st.current.last);
    st.current.last = now;
    const m1 = vars.m1 ?? 5, m2 = vars.m2 ?? 3;
    const a = ((m1 - m2) * 9.8) / (m1 + m2);
    const T = (2 * m1 * m2 * 9.8) / (m1 + m2);
    const s = st.current;
    if (runRef.current) {
      s.v += a * dt;
      s.y += s.v * dt;
      s.t += dt;
      s.pulley += (s.v * dt) / 0.16;
      if (Math.abs(s.y) > 1.6) { s.y = 0; s.v = 0; s.t = 0; }
    }

    c.clearRect(0, 0, w, h);
    const cx = w / 2, py = h * 0.2;
    const sc = (h * 0.52) / 2;
    const lx = cx - w * 0.16, rx = cx + w * 0.16;

    // support
    c.fillStyle = ST.body; c.fillRect(cx - 70, py - 26, 140, 7);
    hatch(c, py - 26, w);
    c.beginPath(); c.moveTo(cx, py - 19); c.lineTo(cx, py - 8); c.strokeStyle = ST.bodyDark; c.lineWidth = 2; c.stroke();

    // pulley
    c.beginPath(); c.arc(cx, py, 17, 0, Math.PI * 2);
    c.fillStyle = "#242b33"; c.fill();
    c.strokeStyle = ST.body; c.lineWidth = 2; c.stroke();
    for (let i = 0; i < 4; i++) {
      const aa = s.pulley + (i * Math.PI) / 2;
      c.beginPath();
      c.moveTo(cx + Math.cos(aa) * 5, py + Math.sin(aa) * 5);
      c.lineTo(cx + Math.cos(aa) * 14, py + Math.sin(aa) * 14);
      c.strokeStyle = ST.bodyDark; c.lineWidth = 1.5; c.stroke();
    }

    // rope
    const y1 = py + sc * (1 + s.y), y2 = py + sc * (1 - s.y);
    c.strokeStyle = ST.body; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(lx, py); c.lineTo(lx, y1); c.stroke();
    c.beginPath(); c.arc(cx, py, 17, Math.PI, 0); c.stroke();
    c.beginPath(); c.moveTo(rx, py); c.lineTo(rx, y2); c.stroke();

    // masses
    const box = (mm: number) => 24 + mm * 2.2;
    const b1 = box(m1), b2 = box(m2);
    c.fillStyle = ST.blue;
    c.fillRect(lx - b1 / 2, y1, b1, b1);
    c.strokeStyle = "rgba(0,0,0,0.4)"; c.strokeRect(lx - b1 / 2, y1, b1, b1);
    mono(c, `m₁ ${fmt(m1)}`, lx, y1 + b1 / 2 + 3, "#16233a", "center", 9);
    c.fillStyle = ST.green;
    c.fillRect(rx - b2 / 2, y2, b2, b2);
    c.strokeRect(rx - b2 / 2, y2, b2, b2);
    mono(c, `m₂ ${fmt(m2)}`, rx, y2 + b2 / 2 + 3, "#12241a", "center", 9);

    if (vectors) {
      arrow(c, lx + b1 / 2 + 10, y1 + b1 / 2, lx + b1 / 2 + 10, y1 + b1 / 2 - Math.min(60, T * 0.9), ST.amber, "T");
      arrow(c, lx - b1 / 2 - 10, y1 + b1 / 2, lx - b1 / 2 - 10, y1 + b1 / 2 + Math.min(60, m1 * 9.8 * 0.9), ST.red, "m₁g");
      arrow(c, rx + b2 / 2 + 10, y2 + b2 / 2, rx + b2 / 2 + 10, y2 + b2 / 2 - Math.min(60, T * 0.9), ST.amber, "T");
      arrow(c, rx - b2 / 2 - 10, y2 + b2 / 2, rx - b2 / 2 - 10, y2 + b2 / 2 + Math.min(60, m2 * 9.8 * 0.9), ST.red, "m₂g");
    }

    mono(c, `a = (m₁−m₂)g/(m₁+m₂) = ${fmt(a)} m/s²`, 12, 20, ST.body, "left", 10.5);
    mono(c, `T = ${fmt(T)} N   ${Math.abs(a) < 0.001 ? "balanced — equilibrium" : a > 0 ? "m₁ descending" : "m₂ descending"}`, 12, 36, ST.text, "left", 9.5);
    mono(c, `t = ${s.t.toFixed(2)} s   v = ${fmt(Math.abs(s.v))} m/s`, w - 12, 20, ST.text, "right", 9.5);
  });

  return (
    <SimShell fig="FIG. 16" title="Atwood Machine" footnote="Massless string over a frictionless pulley: both masses share |a| and tension. Equal masses freeze the rig."
      h="h-[380px]"
      right={<Controls run={run} setRun={setRun} reset={() => { st.current = { y: 0, v: 0, t: 0, pulley: 0, last: -1 }; }}
        extra={<Toggle on={vectors} onClick={() => setVectors(!vectors)} label="Forces" />} />}
    >
      <canvas ref={canvasRef} />
    </SimShell>
  );
}
