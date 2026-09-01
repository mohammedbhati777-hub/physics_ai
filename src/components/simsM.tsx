import { useEffect, useRef, useState } from "react";
import { LiveBuffer, fmt, useStageCanvas } from "../lib/labkit";
import { CtlBtn, SimShell, Toggle } from "./ui";

/* ============================================================
   MECHANICS SIMULATIONS — real integration, no canned loops
   ============================================================ */

export interface SimProps {
  vars: Record<string, number>;
  whatif?: Record<string, number> | null;
  buffer?: LiveBuffer;
}

const ST = {
  grid: "#333c46",
  body: "#c9d0d7",
  bodyDark: "#8b98a5",
  blue: "#7fb2e5",
  red: "#e58a7e",
  green: "#7fc79a",
  amber: "#dcae60",
  purple: "#a98fd6",
  text: "#9aa4ae",
};

export function arrow(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string, label?: string) {
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 4) return;
  const ux = dx / len, uy = dy / len;
  c.strokeStyle = color; c.fillStyle = color; c.lineWidth = 2;
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - ux * 6, y1 - uy * 6); c.stroke();
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x1 - ux * 8 - uy * 4, y1 - uy * 8 + ux * 4);
  c.lineTo(x1 - ux * 8 + uy * 4, y1 - uy * 8 - ux * 4);
  c.closePath(); c.fill();
  if (label) {
    c.font = "600 10px 'IBM Plex Mono', monospace";
    c.textAlign = "left";
    c.fillText(label, x1 + 5, y1 + 3);
  }
}

function hatch(c: CanvasRenderingContext2D, y: number, w: number) {
  c.strokeStyle = ST.grid; c.lineWidth = 1;
  c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke();
  for (let x = 0; x < w; x += 12) {
    c.beginPath(); c.moveTo(x, y); c.lineTo(x - 7, y + 8); c.stroke();
  }
}

function mono(c: CanvasRenderingContext2D, text: string, x: number, y: number, color = ST.text, align: CanvasTextAlign = "left", size = 10) {
  c.font = `${size}px 'IBM Plex Mono', monospace`;
  c.textAlign = align;
  c.fillStyle = color;
  c.fillText(text, x, y);
}

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

/* ================= MOTION BENCH (KE / p / F=ma / work) ================= */
export function BenchSim({ vars, whatif, buffer }: SimProps) {
  const { run, setRun, runRef } = useRun();
  const [friction, setFriction] = useState(false);
  const [vectors, setVectors] = useState(true);
  const st = useRef({ x: 0, v: vars.v ?? 0, t: 0, last: -1, workAcc: 0 });
  const forceMode = vars.F !== undefined;
  const push = (t: number, v: number) => { if (runRef.current) buffer?.push(t, v); };

  useEffect(() => {
    st.current = { x: 0, v: vars.v ?? 0, t: 0, last: -1, workAcc: 0 };
    buffer?.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceMode, JSON.stringify(vars), friction]);

  const canvasRef = useStageCanvas((c, w, h) => {
    const s = st.current;
    const now = performance.now() / 1000;
    const dt = s.last < 0 ? 0.016 : Math.min(0.05, now - s.last);
    s.last = now;
    const g = 9.8;
    const m = vars.m ?? 2;
    const frictionless = whatif?.mu === 0;
    const mu = frictionless ? 0 : friction ? 0.35 : 0;

    if (runRef.current) {
      let a = 0;
      if (forceMode) {
        const F = Math.max(0, vars.F - mu * m * g * (s.v > 0 || vars.F > mu * m * g ? 1 : 0));
        a = Math.max(0, F) / m;
        if (vars.F <= mu * m * g && s.v <= 0) a = 0;
        s.workAcc += vars.F * s.v * dt;
      } else if (friction && s.v > 0) {
        a = -mu * g;
      }
      if (!forceMode && !friction) s.v = vars.v ?? 0;
      else s.v = Math.max(0, s.v + a * dt);
      s.x += s.v * dt;
      s.t += dt;
      push(s.t, s.v);
    }

    /* draw */
    c.clearRect(0, 0, w, h);
    const groundY = h * 0.72;
    // camera
    const scale = Math.min(46, Math.max(9, w / 46));
    const cam = Math.max(0, s.x * scale - w * 0.55);
    const X = (x: number) => x * scale - cam;

    // grid + rulers
    c.strokeStyle = ST.grid; c.lineWidth = 1;
    const step = scale > 22 ? 1 : 5;
    for (let mx = Math.floor(cam / scale / step) * step; X(mx) < w; mx += step) {
      c.globalAlpha = 0.5;
      c.beginPath(); c.moveTo(X(mx), groundY); c.lineTo(X(mx), groundY + 6); c.stroke();
      c.globalAlpha = 1;
      mono(c, `${mx}m`, X(mx), groundY + 18, ST.text, "center", 9);
    }
    hatch(c, groundY, w);

    // cart
    const cx = X(s.x);
    const size = 26 + m * 1.6;
    c.fillStyle = ST.body;
    c.strokeStyle = ST.bodyDark;
    c.lineWidth = 1.5;
    c.fillRect(cx - size / 2, groundY - size * 0.62 - 8, size, size * 0.62);
    c.strokeRect(cx - size / 2, groundY - size * 0.62 - 8, size, size * 0.62);
    mono(c, `${fmt(m)} kg`, cx, groundY - size * 0.62 - 14, ST.body, "center", 10);
    for (const wx of [-size / 3, size / 3]) {
      c.beginPath(); c.arc(cx + wx, groundY - 4, 4.5, 0, Math.PI * 2);
      c.fillStyle = ST.bodyDark; c.fill();
      c.beginPath(); c.arc(cx + wx, groundY - 4, 2, 0, Math.PI * 2);
      c.fillStyle = "#22282f"; c.fill();
    }

    const cy = groundY - size * 0.31 - 8;
    if (vectors) {
      if (forceMode && vars.F > 0) arrow(c, cx + size / 2 + 4, cy, cx + size / 2 + 4 + Math.min(90, vars.F * 0.8), cy, ST.red, `F=${fmt(vars.F)}N`);
      if (friction && s.v > 0.01) arrow(c, cx - size / 2 - 4, cy, cx - size / 2 - 4 - Math.min(70, mu * m * 9.8 * 0.8), cy, ST.amber, "f");
      if (s.v > 0.05) arrow(c, cx, cy - size * 0.5, cx + Math.min(110, s.v * 6), cy - size * 0.5, ST.blue, `v=${fmt(s.v)}m/s`);
    }

    // energy bar (right)
    const ke = 0.5 * m * s.v * s.v;
    const keMax = Math.max(0.5 * m * (vars.v ?? 10) ** 2, forceMode ? s.workAcc : 1, 1);
    const bh = Math.min(1, ke / keMax) * (h * 0.5);
    c.fillStyle = ST.green; c.globalAlpha = 0.9;
    c.fillRect(w - 26, groundY - bh, 12, bh);
    c.globalAlpha = 1;
    c.strokeStyle = ST.bodyDark; c.strokeRect(w - 26, h * 0.22, 12, h * 0.5);
    mono(c, "KE", w - 20, h * 0.22 - 6, ST.green, "center", 9);
    mono(c, `${fmt(ke)} J`, w - 20, groundY + 16, ST.green, "center", 9);
    if (vars.F !== undefined && vars.d !== undefined) {
      const W = Math.min(vars.F * s.x, vars.F * vars.d);
      mono(c, `W = ${fmt(W)} J`, 12, 24, ST.green, "left", 11);
    }
    mono(c, `t = ${s.t.toFixed(2)} s`, 12, h - 12, ST.text, "left", 10);
    mono(c, `a = ${forceMode ? fmt(Math.max(0, (vars.F - mu * m * 9.8 * (s.v > 0 || vars.F > mu * m * 9.8 ? 1 : 0)) / m)) : "0"} m/s²`, 12, h - 28, ST.amber, "left", 10);
    if (frictionless) mono(c, "WHAT-IF UNIVERSE: friction removed — the cart never stops", w / 2, 20, ST.amber, "center", 10.5);
  });

  return (
    <SimShell
      fig="FIG. 01"
      title="Motion Bench"
      footnote="Rigid cart on a bench; friction toggle applies μ = 0.35. Readouts from live integration."
      h="h-[340px]"
      right={
        <Controls run={run} setRun={setRun} reset={() => { st.current = { x: 0, v: vars.v ?? 0, t: 0, last: -1, workAcc: 0 }; buffer?.clear(); }}
          extra={
            <>
              <Toggle on={friction} onClick={() => setFriction(!friction)} label="Friction" />
              <Toggle on={vectors} onClick={() => setVectors(!vectors)} label="Vectors" />
            </>
          } />
      }
    >
      <canvas ref={canvasRef} />
    </SimShell>
  );
}

/* ================= PROJECTILE ================= */
interface Sample { t: number; x: number; y: number; vx: number; vy: number }
function simulateProjectile(vv: Record<string, number>, drag: boolean): Sample[] {
  const v = { v0: vv.v0 ?? 20, th: vv.th ?? 45, g: vv.g ?? 9.8 };
  const r = (v.th * Math.PI) / 180;
  let vx = v.v0 * Math.cos(r), vy = v.v0 * Math.sin(r);
  let x = 0, y = 0, t = 0;
  const dt = 1 / 240;
  const out: Sample[] = [{ t, x, y, vx, vy }];
  const k = drag ? 0.012 : 0;
  while (t < 60) {
    const sp = Math.hypot(vx, vy);
    const ax = -k * sp * vx;
    const ay = -v.g - k * sp * vy;
    vx += ax * dt; vy += ay * dt;
    x += vx * dt; y += vy * dt; t += dt;
    if (y < 0) { out.push({ t, x, y: 0, vx, vy }); break; }
    if (out.length % 4 === 0) out.push({ t, x, y, vx, vy });
  }
  return out;
}

export function ProjectileSim({ vars, whatif, buffer }: SimProps) {
  const { run, setRun, runRef } = useRun();
  const [drag, setDrag] = useState(false);
  const [vectors, setVectors] = useState(true);
  const [protractor, setProtractor] = useState(true);
  const [idx, setIdx] = useState(0);
  const idxRef = useRef(0);
  idxRef.current = idx;

  const samples = useRef<Sample[]>([]);
  const samplesW = useRef<Sample[] | null>(null);
  useEffect(() => {
    samples.current = simulateProjectile(vars, drag);
    samplesW.current = whatif ? simulateProjectile({ v0: whatif.v0 ?? vars.v0, th: whatif.th ?? vars.th, g: whatif.g ?? vars.g }, drag) : null;
    setIdx(0);
    buffer?.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(vars), JSON.stringify(whatif), drag]);

  const st = useRef({ last: -1, acc: 0 });
  const canvasRef = useStageCanvas((c, w, h) => {
    const S = samples.current;
    if (!S.length) return;
    const now = performance.now() / 1000;
    const dt = st.current.last < 0 ? 0.016 : Math.min(0.05, now - st.current.last);
    st.current.last = now;
    if (runRef.current) {
      if (st.current.acc < 0) {
        st.current.acc += dt; // brief hold at impact, then loop
        if (st.current.acc >= 0) { setIdx(0); buffer?.clear(); }
      } else {
        st.current.acc += dt;
        const target = Math.min(S.length - 1, Math.floor(st.current.acc * 60));
        if (target !== idxRef.current) setIdx(target);
        if (target >= S.length - 1) st.current.acc = -1.1;
      }
    }
    const i = Math.max(0, Math.min(idxRef.current, S.length - 1));
    const cur = S[i];

    const maxX = Math.max(...S.map((s) => s.x), 1);
    const maxY = Math.max(...S.map((s) => s.y), 1);
    const groundY = h - 46;
    const ox = 56, oy = groundY;
    const sc = Math.min((w - ox - 26) / maxX, (groundY - 40) / maxY);
    const X = (x: number) => ox + x * sc;
    const Y = (y: number) => oy - y * sc;

    c.clearRect(0, 0, w, h);
    // grid
    c.strokeStyle = ST.grid; c.globalAlpha = 0.55; c.lineWidth = 1;
    const gstep = sc > 14 ? 5 : 10;
    for (let gx = 0; X(gx) < w - 10; gx += gstep) { c.beginPath(); c.moveTo(X(gx), 26); c.lineTo(X(gx), groundY); c.stroke(); }
    for (let gy = 0; Y(gy) > 26; gy += gstep) { c.beginPath(); c.moveTo(ox, Y(gy)); c.lineTo(w - 10, Y(gy)); c.stroke(); }
    c.globalAlpha = 1;
    for (let gx = 0; X(gx) < w - 10; gx += gstep) mono(c, `${gx}`, X(gx), groundY + 14, ST.text, "center", 9);
    mono(c, "m", w - 14, groundY + 14, ST.text, "right", 9);

    hatch(c, groundY, w);

    // cannon
    const r = (vars.th * Math.PI) / 180;
    c.save();
    c.translate(ox, oy);
    c.rotate(-r);
    c.fillStyle = ST.bodyDark;
    c.fillRect(0, -5, 30, 10);
    c.restore();
    c.beginPath(); c.arc(ox, oy, 9, Math.PI, 0); c.fillStyle = ST.body; c.fill();

    if (protractor) {
      c.strokeStyle = ST.amber; c.setLineDash([3, 3]); c.lineWidth = 1;
      c.beginPath(); c.arc(ox, oy, 44, -r, 0); c.stroke();
      c.setLineDash([]);
      mono(c, `${fmt(vars.th)}°`, ox + 52 * Math.cos(r / 2), oy - 52 * Math.sin(r / 2) + 3, ST.amber, "left", 10);
    }

    // what-if path
    if (samplesW.current) {
      c.strokeStyle = ST.amber; c.lineWidth = 1.5; c.setLineDash([6, 5]);
      c.beginPath();
      samplesW.current.forEach((s, j) => { const px = X(s.x), py = Y(s.y); if (j === 0) c.moveTo(px, py); else c.lineTo(px, py); });
      c.stroke(); c.setLineDash([]);
      const e = samplesW.current[samplesW.current.length - 1];
      mono(c, `WHAT-IF R=${fmt(e.x)}m`, X(e.x), Y(0) - 8, ST.amber, "right", 9);
    }

    // path
    c.strokeStyle = ST.blue; c.lineWidth = 2;
    c.beginPath();
    for (let j = 0; j <= i; j++) { const px = X(S[j].x), py = Y(S[j].y); if (j === 0) c.moveTo(px, py); else c.lineTo(px, py); }
    c.stroke();
    // ghost full path
    c.globalAlpha = 0.22;
    c.beginPath();
    S.forEach((s, j) => { const px = X(s.x), py = Y(s.y); if (j === 0) c.moveTo(px, py); else c.lineTo(px, py); });
    c.stroke(); c.globalAlpha = 1;

    // ground shadow — shrinks as the ball climbs
    const shScale = Math.max(0.25, 1 - cur.y / Math.max(1, Math.max(...S.map((q) => q.y))));
    c.globalAlpha = 0.28 * shScale;
    c.fillStyle = "#000";
    c.beginPath(); c.ellipse(X(cur.x), groundY + 4, 4 + 8 * shScale, 2.6, 0, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1;

    // ball
    const bx = X(cur.x), by = Y(cur.y);
    c.beginPath(); c.arc(bx, by, 7, 0, Math.PI * 2);
    c.fillStyle = ST.blue; c.fill();
    c.strokeStyle = "#16324f"; c.lineWidth = 1.5; c.stroke();

    if (vectors) {
      arrow(c, bx, by, bx + cur.vx * 4, by, ST.blue, "vx");
      arrow(c, bx, by, bx, by - cur.vy * 4, ST.purple, "vy");
      arrow(c, bx, by, bx, by + 34, ST.red, "g");
    }

    buffer?.push(cur.t, cur.vy, cur.y);
    mono(c, `t=${cur.t.toFixed(2)}s  x=${fmt(cur.x)}m  y=${fmt(cur.y)}m  v=${fmt(Math.hypot(cur.vx, cur.vy))}m/s`, 12, 18, ST.body, "left", 10.5);
    const last = S[S.length - 1];
    mono(c, `R=${fmt(last.x)}m  H=${fmt(Math.max(...S.map((q) => q.y)))}m  T=${fmt(last.t)}s`, 12, 34, ST.text, "left", 9.5);
  });

  const total = samples.current.length - 1;
  return (
    <SimShell fig="FIG. 01" title="Projectile Range" footnote="Point mass, uniform g; drag toggle adds quadratic air resistance (numerical integration)."
      h="h-[380px]"
      right={
        <Controls run={run} setRun={setRun} reset={() => { st.current.acc = 0; st.current.last = -1; setIdx(0); buffer?.clear(); }}
          extra={
            <>
              <Toggle on={vectors} onClick={() => setVectors(!vectors)} label="Vectors" />
              <Toggle on={protractor} onClick={() => setProtractor(!protractor)} label="Angle" />
              <Toggle on={drag} onClick={() => setDrag(!drag)} label="Drag" />
            </>
          } />
      }
    >
      <canvas ref={canvasRef} />
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-[rgba(27,32,38,0.85)] px-3 py-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#9aa4ae]">Timeline</span>
        <input type="range" className="tact flex-1" style={{ "--fill": `${total ? (Math.max(0, idx) / total) * 100 : 0}%`, "--track-fill": "#7fb2e5" } as React.CSSProperties}
          min={0} max={Math.max(1, total)} step={1} value={Math.max(0, idx)}
          aria-label="Timeline scrubber"
          onChange={(e) => { const v = parseInt(e.target.value); setRun(false); setIdx(v); st.current.acc = v / 60; }} />
        <span className="w-14 text-right font-mono text-[10px] text-[#c9d0d7]">{(samples.current[idx]?.t ?? 0).toFixed(2)} s</span>
      </div>
    </SimShell>
  );
}

/* ================= FREE FALL (+ hypothesis two-ball) ================= */
export function FreeFallSim({ vars, whatif, buffer }: SimProps) {
  const { run, setRun, runRef } = useRun();
  const [hypo, setHypo] = useState(false);
  const [bars, setBars] = useState(true);
  const st = useRef({ t: 0, last: -1 });

  useEffect(() => { st.current = { t: 0, last: -1 }; buffer?.clear(); }, [JSON.stringify(vars), hypo]); // eslint-disable-line react-hooks/exhaustive-deps

  const canvasRef = useStageCanvas((c, w, h) => {
    const now = performance.now() / 1000;
    const dt = st.current.last < 0 ? 0.016 : Math.min(0.05, now - st.current.last);
    st.current.last = now;
    const g = vars.g;
    const H = vars.h;
    const T = Math.sqrt((2 * H) / g);
    if (runRef.current) {
      st.current.t += dt;
      if (st.current.t > T + 1.1) { st.current.t = 0; buffer?.clear(); }
    }
    const t = Math.min(st.current.t, T);
    const y = Math.max(0, H - 0.5 * g * t * t);
    const v = g * t;

    c.clearRect(0, 0, w, h);
    const top = 34, groundY = h - 40;
    const sc = (groundY - top - 16) / H;
    const Y = (yy: number) => groundY - yy * sc;

    // tower ruler
    c.strokeStyle = ST.grid; c.lineWidth = 1;
    const step = H > 60 ? 20 : H > 25 ? 10 : 5;
    for (let m = 0; m <= H; m += step) {
      c.beginPath(); c.moveTo(34, Y(m)); c.lineTo(44, Y(m)); c.stroke();
      mono(c, `${m}`, 30, Y(m) + 3, ST.text, "right", 9);
    }
    c.beginPath(); c.moveTo(40, top); c.lineTo(40, groundY); c.stroke();
    hatch(c, groundY, w);

    const balls = hypo
      ? [{ x: w * 0.38, m: 2, col: ST.blue }, { x: w * 0.56, m: 9, col: ST.green }]
      : [{ x: w * 0.45, m: 2, col: ST.blue }];

    for (const b of balls) {
      const r = 8 + b.m * 0.9;
      // rail
      c.strokeStyle = ST.grid; c.setLineDash([2, 5]);
      c.beginPath(); c.moveTo(b.x, top - 8); c.lineTo(b.x, groundY); c.stroke();
      c.setLineDash([]);
      const by = Y(y);
      c.beginPath(); c.arc(b.x, by, r, 0, Math.PI * 2);
      c.fillStyle = b.col; c.fill();
      c.strokeStyle = "rgba(0,0,0,0.35)"; c.stroke();
      mono(c, `${b.m} kg`, b.x, by - r - 6, b.col, "center", 9);
      if (vectors(bars)) arrow(c, b.x + r + 6, by, b.x + r + 6, by + Math.min(60, v * 5), ST.blue, v > 0.2 ? `v=${fmt(v)}` : "");
    }

    // what-if ghost (different g)
    if (whatif && whatif.g !== undefined && whatif.g !== g) {
      const gw = whatif.g;
      const Tw = Math.sqrt((2 * H) / gw);
      const tw = Math.min(st.current.t, Tw);
      const yw = Math.max(0, H - 0.5 * gw * tw * tw);
      c.beginPath(); c.arc(w * 0.72, Y(yw), 8, 0, Math.PI * 2);
      c.strokeStyle = ST.amber; c.setLineDash([4, 3]); c.lineWidth = 1.5; c.stroke(); c.setLineDash([]);
      mono(c, `g=${fmt(gw)}`, w * 0.72, Y(yw) - 14, ST.amber, "center", 9);
    }

    // energy bars
    if (bars) {
      const m = 2;
      const pe = m * g * y, ke = 0.5 * m * v * v, tot = m * g * H;
      const bx = w - 34, bw = 14, bmax = groundY - top - 10;
      c.fillStyle = ST.green; c.fillRect(bx - bw - 6, groundY - (pe / tot) * bmax, bw, (pe / tot) * bmax);
      c.fillStyle = ST.blue; c.fillRect(bx + 6, groundY - (ke / tot) * bmax, bw, (ke / tot) * bmax);
      mono(c, "PE", bx - bw + 1, top - 2, ST.green, "center", 9);
      mono(c, "KE", bx + 6 + bw / 2, top - 2, ST.blue, "center", 9);
    }

    buffer?.push(t, v, y);
    mono(c, `t=${t.toFixed(2)} s   v=${fmt(v)} m/s   h=${fmt(y)} m`, 54, 20, ST.body, "left", 10.5);
    if (hypo && st.current.t >= T) {
      mono(c, `BOTH LAND TOGETHER — t = √(2h/g) = ${fmt(T)} s, mass-independent`, w / 2, h - 12, ST.amber, "center", 10.5);
    }
  });

  const vectors = (_b: boolean) => true;
  return (
    <SimShell fig="FIG. 02" title="Drop Tower" footnote="Vacuum fall, constant g. Hypothesis mode drops 2 kg and 9 kg side by side."
      h="h-[380px]"
      right={
        <Controls run={run} setRun={setRun} reset={() => { st.current = { t: 0, last: -1 }; buffer?.clear(); }}
          extra={
            <>
              <Toggle on={hypo} onClick={() => setHypo(!hypo)} label="2-Ball Test" />
              <Toggle on={bars} onClick={() => setBars(!bars)} label="Energy" />
            </>
          } />
      }
    >
      <canvas ref={canvasRef} />
    </SimShell>
  );
}

/* ================= PENDULUM ================= */
export function PendulumSim({ vars, buffer }: SimProps) {
  const { run, setRun, runRef } = useRun();
  const [damping, setDamping] = useState(false);
  const [compare, setCompare] = useState(false);
  const st = useRef({ th: ((vars.th0 ?? 30) * Math.PI) / 180, w: 0, t: 0, last: -1, period: 0, lastCross: -1, prevTh: 0 });

  useEffect(() => {
    st.current = { th: ((vars.th0 ?? 30) * Math.PI) / 180, w: 0, t: 0, last: -1, period: 0, lastCross: -1, prevTh: (vars.th0 ?? 30) * Math.PI / 180 };
    buffer?.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(vars), damping]);

  const canvasRef = useStageCanvas((c, w, h) => {
    const now = performance.now() / 1000;
    const dt = st.current.last < 0 ? 0.016 : Math.min(0.05, now - st.current.last);
    st.current.last = now;
    const s = st.current;
    const { L, g, m } = { L: vars.L, g: vars.g, m: vars.m ?? 1.5 };
    const cDamp = damping ? 0.12 : 0;
    if (runRef.current) {
      const steps = 8;
      const hstep = dt / steps;
      for (let i = 0; i < steps; i++) {
        const a = -(g / L) * Math.sin(s.th) - cDamp * s.w;
        s.w += a * hstep;
        s.prevTh = s.th;
        s.th += s.w * hstep;
        s.t += hstep;
      }
      // period measurement: zero crossing upward
      if (s.prevTh < 0 && s.th >= 0 && s.w > 0) {
        if (s.lastCross > 0) s.period = s.t - s.lastCross;
        s.lastCross = s.t;
      }
      buffer?.push(s.t, s.th, s.w);
    }

    c.clearRect(0, 0, w, h);
    const px = w / 2, py = 46;
    const maxL = 5;
    const sc = Math.min((h - 120) / maxL, (w / 2 - 60) / maxL);
    const drawPend = (Lp: number, th: number, col: string, alpha: number, bobM: number) => {
      const bx = px + Lp * sc * Math.sin(th);
      const by = py + Lp * sc * Math.cos(th);
      c.globalAlpha = alpha;
      c.strokeStyle = col; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(px, py); c.lineTo(bx, by); c.stroke();
      const r = 9 + bobM * 1.4;
      c.beginPath(); c.arc(bx, by, r, 0, Math.PI * 2);
      c.fillStyle = col; c.fill();
      c.globalAlpha = 1;
      return [bx, by] as const;
    };

    // arc guide
    c.strokeStyle = ST.grid; c.setLineDash([2, 5]);
    c.beginPath(); c.arc(px, py, L * sc, Math.PI / 2 - 1.3, Math.PI / 2 + 1.3); c.stroke();
    c.setLineDash([]);
    // pivot
    c.fillStyle = ST.body; c.fillRect(px - 26, py - 10, 52, 6);
    c.beginPath(); c.arc(px, py, 4, 0, Math.PI * 2); c.fill();

    if (compare) drawPend(L * 0.5, s.th * 1.35, ST.amber, 0.75, 1);
    const [bx, by] = drawPend(L, s.th, ST.blue, 1, m);
    // velocity vector (tangential)
    const vt = s.w * L;
    if (Math.abs(vt) > 0.05) {
      const ux = Math.cos(s.th), uy = -Math.sin(s.th);
      arrow(c, bx, by, bx + ux * vt * 14, by + uy * vt * 14, ST.green, "v");
    }
    arrow(c, bx, by, bx, by + 26, ST.red, "mg");

    const ke = 0.5 * m * vt * vt;
    const pe = m * g * L * (1 - Math.cos(s.th));
    const tot = Math.max(ke + pe, 1e-6);
    const bmax = h * 0.34;
    c.fillStyle = ST.blue; c.fillRect(18, h - 30 - (ke / tot) * bmax, 12, (ke / tot) * bmax);
    c.fillStyle = ST.green; c.fillRect(40, h - 30 - (pe / tot) * bmax, 12, (pe / tot) * bmax);
    mono(c, "KE", 24, h - 34 - (ke / tot) * bmax, ST.blue, "center", 8);
    mono(c, "PE", 46, h - 34 - (pe / tot) * bmax, ST.green, "center", 8);

    mono(c, `θ=${((s.th * 180) / Math.PI).toFixed(1)}°  ω=${fmt(s.w)} rad/s`, 12, 20, ST.body, "left", 10.5);
    mono(c, `T theory=${fmt(2 * Math.PI * Math.sqrt(L / g))}s   T measured=${s.period ? s.period.toFixed(2) + "s" : "—"}`, 12, 36, ST.text, "left", 9.5);
  });

  return (
    <SimShell fig="FIG. 03" title="Pendulum Rig" footnote="Full nonlinear equation θ̈ = −(g/L)sinθ integrated numerically; period is measured from zero crossings."
      h="h-[380px]"
      right={
        <Controls run={run} setRun={setRun} reset={() => { st.current = { th: ((vars.th0 ?? 30) * Math.PI) / 180, w: 0, t: 0, last: -1, period: 0, lastCross: -1, prevTh: 0 }; buffer?.clear(); }}
          extra={
            <>
              <Toggle on={damping} onClick={() => setDamping(!damping)} label="Damping" />
              <Toggle on={compare} onClick={() => setCompare(!compare)} label="L/2 Twin" />
            </>
          } />
      }
    >
      <canvas ref={canvasRef} />
    </SimShell>
  );
}

/* ================= SPRING (Hooke / SHM) ================= */
export function SpringSim({ vars, buffer }: SimProps) {
  const { run, setRun, runRef } = useRun();
  const [damping, setDamping] = useState(false);
  const st = useRef({ x: vars.x0 ?? 0.25, v: 0, t: 0, last: -1 });

  useEffect(() => {
    st.current = { x: vars.x0 ?? 0.25, v: 0, t: 0, last: -1 };
    buffer?.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(vars), damping]);

  const canvasRef = useStageCanvas((c, w, h) => {
    const now = performance.now() / 1000;
    const dt = st.current.last < 0 ? 0.016 : Math.min(0.05, now - st.current.last);
    st.current.last = now;
    const s = st.current;
    const { k, m } = { k: vars.k, m: vars.m };
    const cd = damping ? 0.9 : 0;
    if (runRef.current) {
      const steps = 10;
      const hs = dt / steps;
      for (let i = 0; i < steps; i++) {
        const a = -(k / m) * s.x - (cd / m) * s.v;
        s.v += a * hs;
        s.x += s.v * hs;
        s.t += hs;
      }
      buffer?.push(s.t, s.x, s.v);
    }

    c.clearRect(0, 0, w, h);
    const px = w * 0.42;
    const topY = 34;
    const eqY = h * 0.52;
    const sc = Math.min((h * 0.3) / 0.7, 260);
    const my = eqY + s.x * sc;

    // ceiling
    c.fillStyle = ST.body; c.fillRect(px - 60, topY - 12, 120, 8);
    hatch(c, topY - 12, w);
    c.fillStyle = ST.body; c.fillRect(px - 60, topY - 12, 120, 8);

    // spring coils
    const coils = 9;
    const len = my - 14 - topY;
    c.strokeStyle = ST.body; c.lineWidth = 2;
    c.beginPath();
    c.moveTo(px, topY - 4);
    for (let i = 1; i <= coils * 2; i++) {
      const yy = topY - 4 + (len * i) / (coils * 2);
      c.lineTo(px + (i % 2 === 0 ? -16 : 16), yy);
    }
    c.lineTo(px, my - 14);
    c.stroke();

    // mass
    const size = 30 + m * 3;
    c.fillStyle = ST.body; c.strokeStyle = ST.bodyDark; c.lineWidth = 1.5;
    c.fillRect(px - size / 2, my - 14, size, size);
    c.strokeRect(px - size / 2, my - 14, size, size);
    mono(c, `${fmt(m)} kg`, px, my - 14 + size / 2 + 3, "#22282f", "center", 10);

    // equilibrium line
    c.strokeStyle = ST.grid; c.setLineDash([4, 4]);
    c.beginPath(); c.moveTo(px - 90, eqY - 14 + 0); c.lineTo(px + 150, eqY - 14); c.stroke();
    c.setLineDash([]);
    mono(c, "equilibrium", px + 154, eqY - 10, ST.text, "left", 9);

    // displacement marker
    if (Math.abs(s.x) > 0.004) {
      c.strokeStyle = ST.amber; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(px + 60, eqY - 14); c.lineTo(px + 60, my - 14); c.stroke();
      arrow(c, px + 60, eqY - 14, px + 60, my - 14, ST.amber, `x=${s.x.toFixed(2)}m`);
    }
    // force vector
    const F = -k * s.x;
    if (Math.abs(F) > 0.5) {
      arrow(c, px - size / 2 - 12, my - 14 + size / 2, px - size / 2 - 12, my - 14 + size / 2 - Math.sign(F) * Math.min(70, Math.abs(F) * 0.5), ST.red, `F=${fmt(F)}N`);
    }

    // strip chart on right
    const sx = w - 150, sw = 130;
    c.strokeStyle = ST.grid; c.strokeRect(sx, 40, sw, h - 90);
    if (buffer && buffer.t.length > 2) {
      const n = buffer.a.length;
      const t0 = buffer.t[0], t1 = buffer.t[n - 1];
      c.strokeStyle = ST.blue; c.lineWidth = 1.5;
      c.beginPath();
      for (let i = 0; i < n; i++) {
        const xx = sx + ((buffer.t[i] - t0) / Math.max(0.5, t1 - t0)) * sw;
        const xm = Math.max(0.05, ...buffer.a.map(Math.abs));
        const yy = 40 + (h - 90) / 2 - (buffer.a[i] / xm) * ((h - 90) / 2 - 8);
        if (i === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy);
      }
      c.stroke();
    }
    mono(c, "x(t)", sx + sw / 2, 34, ST.text, "center", 9);

    mono(c, `x=${s.x.toFixed(3)} m   F=${fmt(-k * s.x)} N   T=2π√(m/k)=${fmt(2 * Math.PI * Math.sqrt(m / k))} s`, 12, 20, ST.body, "left", 10.5);
  });

  return (
    <SimShell fig="FIG. 04" title="Spring Rig" footnote="Ideal spring, F = −kx; semi-implicit integration. Strip chart plots live displacement."
      h="h-[380px]"
      right={
        <Controls run={run} setRun={setRun} reset={() => { st.current = { x: vars.x0 ?? 0.25, v: 0, t: 0, last: -1 }; buffer?.clear(); }}
          extra={<Toggle on={damping} onClick={() => setDamping(!damping)} label="Damping" />} />
      }
    >
      <canvas ref={canvasRef} />
    </SimShell>
  );
}

/* ================= COLLISION TRACK ================= */
export function CollisionSim({ vars, buffer }: SimProps) {
  const { run, setRun, runRef } = useRun();
  const [labels, setLabels] = useState(true);
  const st = useRef({ x1: 0, x2: 6, v1: vars.v1 ?? 4, v2: vars.v2 ?? 0, phase: "run" as "run" | "hit" | "done", hitT: 0, last: -1 });

  useEffect(() => {
    st.current = { x1: 0, x2: 6, v1: vars.v1 ?? 4, v2: vars.v2 ?? 0, phase: "run", hitT: 0, last: -1 };
    buffer?.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(vars)]);

  const canvasRef = useStageCanvas((c, w, h) => {
    const now = performance.now() / 1000;
    const dt = st.current.last < 0 ? 0.016 : Math.min(0.05, now - st.current.last);
    st.current.last = now;
    const s = st.current;
    const { m1, m2, e } = { m1: vars.m1, m2: vars.m2, e: vars.e };

    if (runRef.current) {
      if (s.phase === "run") {
        s.x1 += s.v1 * dt; s.x2 += s.v2 * dt;
        if (s.x2 - s.x1 <= 1.15) {
          const u1 = ((m1 - e * m2) * s.v1 + (1 + e) * m2 * s.v2) / (m1 + m2);
          const u2 = ((m2 - e * m1) * s.v2 + (1 + e) * m1 * s.v1) / (m1 + m2);
          s.v1 = u1; s.v2 = u2; s.phase = "hit"; s.hitT = 0;
        }
      } else if (s.phase === "hit") {
        s.hitT += dt;
        s.x1 += s.v1 * dt * 0.2; s.x2 += s.v2 * dt * 0.2;
        if (s.hitT > 0.35) s.phase = "done";
      } else {
        s.x1 += s.v1 * dt; s.x2 += s.v2 * dt;
        s.hitT += dt;
        if (s.hitT > 3) { st.current = { x1: 0, x2: 6, v1: vars.v1 ?? 4, v2: vars.v2 ?? 0, phase: "run", hitT: 0, last: s.last }; }
      }
    }

    c.clearRect(0, 0, w, h);
    const groundY = h * 0.66;
    const sc = (w - 80) / 14;
    const X = (x: number) => 40 + x * sc;
    hatch(c, groundY, w);

    const cart = (x: number, m: number, v: number, col: string, tag: string) => {
      const cxp = X(x);
      const size = 30 + m * 4;
      c.fillStyle = col; c.globalAlpha = 0.92;
      c.fillRect(cxp - size / 2, groundY - size * 0.6 - 8, size, size * 0.6);
      c.globalAlpha = 1;
      c.strokeStyle = "rgba(0,0,0,0.4)"; c.strokeRect(cxp - size / 2, groundY - size * 0.6 - 8, size, size * 0.6);
      for (const wxp of [-size / 3, size / 3]) {
        c.beginPath(); c.arc(cxp + wxp, groundY - 4, 4.5, 0, Math.PI * 2); c.fillStyle = ST.bodyDark; c.fill();
      }
      if (labels) {
        mono(c, `${tag} ${fmt(m)}kg`, cxp, groundY - size * 0.6 - 16, col, "center", 9.5);
        if (Math.abs(v) > 0.05) arrow(c, cxp, groundY - size * 0.3 - 8, cxp + Math.max(-80, Math.min(80, v * 9)), groundY - size * 0.3 - 8, col, `v=${fmt(v)}`);
      }
    };
    cart(s.x1, m1, s.v1, ST.blue, "m₁");
    cart(s.x2, m2, s.v2, ST.green, "m₂");

    if (s.phase === "hit") {
      c.strokeStyle = ST.amber; c.lineWidth = 2;
      const cxm = X((s.x1 + s.x2) / 2);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + s.hitT * 9;
        c.beginPath();
        c.moveTo(cxm + Math.cos(a) * 14, groundY - 30 + Math.sin(a) * 10);
        c.lineTo(cxm + Math.cos(a) * 26, groundY - 30 + Math.sin(a) * 20);
        c.stroke();
      }
    }

    const p = m1 * s.v1 + m2 * s.v2;
    const ke = 0.5 * m1 * s.v1 ** 2 + 0.5 * m2 * s.v2 ** 2;
    buffer?.push(now - (st.current.last - dt), p, ke);
    mono(c, `Σp = ${fmt(p)} kg·m/s (conserved)`, 12, 20, ST.body, "left", 10.5);
    mono(c, `ΣKE = ${fmt(ke)} J   e = ${fmt(e)}`, 12, 36, ST.text, "left", 9.5);
    mono(c, s.phase === "run" ? "APPROACH" : s.phase === "hit" ? "IMPACT" : "SEPARATION", w - 12, 20, s.phase === "hit" ? ST.amber : ST.text, "right", 9.5);
  });

  return (
    <SimShell fig="FIG. 05" title="Collision Track" footnote="1-D impact on a frictionless track; restitution e sets elasticity. Momentum is conserved by construction."
      h="h-[340px]"
      right={
        <Controls run={run} setRun={setRun} reset={() => { st.current = { x1: 0, x2: 6, v1: vars.v1 ?? 4, v2: vars.v2 ?? 0, phase: "run", hitT: 0, last: -1 }; }}
          extra={<Toggle on={labels} onClick={() => setLabels(!labels)} label="Vectors" />} />
      }
    >
      <canvas ref={canvasRef} />
    </SimShell>
  );
}
