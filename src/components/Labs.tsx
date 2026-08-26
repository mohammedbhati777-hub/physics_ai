import { useRef, useState } from "react";
import { cx, fmt, profile, sfx, useStageCanvas } from "../lib/labkit";
import { CONCEPTS } from "../physics/registry";
import { buildSolved, genPractice } from "../physics/core";
import type { ConceptId, ParseResult, PracticeProblem, Solved } from "../physics/types";
import { GasChamber, LensRay } from "./simsX";
import { Btn, Icon, Panel } from "./ui";

/* ============================================================
   LABS — experiment shelves, drills, and special instruments
   ============================================================ */

const LAB_META: Record<string, { name: string; icon: string; color: string; concepts: ConceptId[]; blurb: string }> = {
  mech: { name: "Mechanics Lab", icon: "flask", color: "var(--color-motion)", concepts: ["projectile", "freefall", "newton2", "ke", "pe", "momentum", "work", "pendulum", "spring", "collision"], blurb: "The physical bench: carts, towers, springs and pendulums." },
  elec: { name: "Electricity Lab", icon: "bolt", color: "var(--color-energy)", concepts: ["ohm"], blurb: "Circuit-board aesthetic: batteries, resistors, live current." },
  waves: { name: "Waves Lab", icon: "wave", color: "var(--color-field)", concepts: ["wave"], blurb: "A fluid tank for superposition, beats and interference." },
  optics: { name: "Optics Lab", icon: "lens", color: "var(--color-warn)", concepts: ["refraction"], blurb: "A clean optical bench: rays, interfaces, lenses." },
  thermo: { name: "Thermodynamics Lab", icon: "thermo", color: "var(--color-force)", concepts: [], blurb: "A transparent particle chamber obeying PV = nRT." },
  astro: { name: "Astrophysics Lab", icon: "orbit", color: "var(--color-motion)", concepts: ["orbit", "gravforce"], blurb: "A minimal observatory: orbits, escape, inverse-square." },
};

export function LabsView({ lab, onRun }: { lab: string; onRun: (s: Solved, p: ParseResult) => void }) {
  const meta = LAB_META[lab] || LAB_META.mech;
  const run = (cid: ConceptId) => {
    sfx.switchOn();
    profile.recordExperiment();
    const label = `${meta.name} — ${CONCEPTS[cid].name}`;
    const solved = buildSolved(cid, undefined, `${CONCEPTS[cid].name} experiment`);
    onRun(solved, { concept: cid, values: {}, clarify: [], raw: label });
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 lg:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-4">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center border-2 border-ink" style={{ color: meta.color }}>
            <Icon name={meta.icon} size={30} />
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink3">Room {lab.toUpperCase()} · universal physics lab</p>
            <h2 className="font-display text-[44px] font-extrabold leading-none text-ink">{meta.name}</h2>
          </div>
        </div>
        <p className="max-w-[300px] font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-ink2">{meta.blurb}</p>
      </header>

      {meta.concepts.length > 0 && (
        <>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink3">Experiment shelf — each opens a live bench with real defaults</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {meta.concepts.map((cid, i) => {
              const m = CONCEPTS[cid];
              return (
                <button key={cid} type="button" onClick={() => run(cid)}
                  className="anim-rise group cursor-pointer border border-line bg-panel p-3 text-left transition-all hover:-translate-y-0.5 hover:border-ink hover:shadow-[3px_3px_0_rgba(34,40,47,0.18)]"
                  style={{ animationDelay: `${i * 35}ms` }}>
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink3">EXP-{String(i + 1).padStart(2, "0")} · {m.topic}</span>
                  <span className="mt-1 block font-display text-[19px] font-bold leading-tight text-ink">{m.name}</span>
                  <span className="mt-1.5 block font-mono text-[11px] italic" style={{ color: meta.color }}>{m.formula}</span>
                  <span className="mt-2 flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink3 group-hover:text-ink">
                    start experiment <Icon name="arrow" size={10} />
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* room-specific instruments */}
      <div className="mt-6 space-y-4">
        {lab === "thermo" && <GasChamber />}
        {lab === "optics" && <LensRay />}
        {(lab === "mech" || lab === "elec" || lab === "astro") && (
          <DrillPanel concepts={meta.concepts} color={meta.color} />
        )}
        {lab === "mech" && <DrawGraphLab />}
      </div>
    </div>
  );
}

/* ---------------- practice drill (validated problems) ---------------- */
function DrillPanel({ concepts, color }: { concepts: ConceptId[]; color: string }) {
  const [cid, setCid] = useState<ConceptId>(concepts[0] || "ke");
  const [level, setLevel] = useState<"easy" | "medium" | "hard" | "jee">("medium");
  const [prob, setProb] = useState<PracticeProblem | null>(null);
  const [guess, setGuess] = useState("");
  const [verdict, setVerdict] = useState<null | boolean>(null);
  const [score, setScore] = useState({ ok: 0, n: 0 });

  const gen = () => {
    setProb(genPractice(cid, level));
    setGuess("");
    setVerdict(null);
    sfx.click();
  };
  const check = () => {
    if (!prob) return;
    const g = parseFloat(guess);
    const ok = isFinite(g) && Math.abs(g - prob.answer) <= Math.max(0.02 * Math.abs(prob.answer), 0.01);
    setVerdict(ok);
    setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), n: s.n + 1 }));
    profile.recordQuiz(CONCEPTS[cid].topic, ok);
    (ok ? sfx.chime : sfx.buzz)();
  };

  return (
    <Panel label={<span>Numerical drill — examiner mode · problems validated by the engine before display</span>}
      right={<span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink3">score {score.ok}/{score.n}</span>}>
      <div className="p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <select value={cid} onChange={(e) => { setCid(e.target.value as ConceptId); setProb(null); setVerdict(null); }}
            aria-label="Topic" className="cursor-pointer border border-line bg-panel px-2 py-1 font-mono text-[10.5px] uppercase tracking-[0.08em] outline-none">
            {concepts.map((c) => <option key={c} value={c}>{CONCEPTS[c].name}</option>)}
          </select>
          {(["easy", "medium", "hard", "jee"] as const).map((l) => (
            <button key={l} type="button" onClick={() => { setLevel(l); setProb(null); setVerdict(null); }}
              className={cx("btn-press cursor-pointer border px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.1em]",
                level === l ? "border-ink bg-ink text-paper" : "border-line text-ink2 hover:border-ink")}>
              {l}
            </button>
          ))}
          <Btn kind="ink" onClick={gen}>{prob ? "New problem" : "Generate problem"}</Btn>
        </div>

        {prob && (
          <div className="anim-rise mt-3 border-l-2 pl-3" style={{ borderColor: color }}>
            <p className="text-[14px] font-medium text-ink">{prob.question}</p>
            <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink3">hint: {prob.hint}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <input value={guess} onChange={(e) => setGuess(e.target.value)} onKeyDown={(e) => e.key === "Enter" && check()}
                placeholder={`answer (${prob.unit})`} aria-label="Your answer"
                className="w-44 border border-line bg-panel px-2.5 py-1.5 font-mono text-[12.5px] outline-none focus:border-motion" />
              <Btn kind="ink" onClick={check} disabled={verdict !== null}>Submit</Btn>
              {verdict !== null && (
                <span className={cx("font-mono text-[11px] font-semibold uppercase tracking-[0.1em]", verdict ? "text-energy" : "text-force")}>
                  {verdict ? "✓ correct" : `✗ answer: ${fmt(prob.answer)} ${prob.unit}`}
                </span>
              )}
              {verdict === false && (
                <div className="flex gap-1.5">
                  {prob.options.filter((o) => o !== prob.answer).slice(0, 3).map((o) => (
                    <span key={o} className="border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink3">{fmt(o)}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ---------------- GRAPH → PHYSICS sketch lab ---------------- */
function DrawGraphLab() {
  const ptsRef = useRef<{ x: number; y: number }[]>([]);
  const [analysis, setAnalysis] = useState<string[] | null>(null);
  const [replay, setReplay] = useState(0); // increments to restart
  const drawing = useRef(false);

  const canvasRef = useStageCanvas((c, w, h) => {
    c.clearRect(0, 0, w, h);
    // axes
    const L = 40, B = h - 26, T = 20;
    c.strokeStyle = "#39424c";
    for (let i = 0; i <= 4; i++) {
      const y = T + ((B - T) * i) / 4;
      c.beginPath(); c.moveTo(L, y); c.lineTo(w - 12, y); c.stroke();
    }
    c.strokeStyle = "#8b98a5"; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(L, T); c.lineTo(L, B); c.lineTo(w - 12, B); c.stroke();
    c.font = "9px 'IBM Plex Mono', monospace";
    c.fillStyle = "#9aa4ae";
    c.fillText("v (m/s)", 6, 14);
    c.fillText("t (s)", w - 34, h - 8);

    const pts = ptsRef.current;
    if (pts.length > 1) {
      c.strokeStyle = "#7fb2e5"; c.lineWidth = 2.2;
      c.beginPath();
      pts.forEach((p, i) => {
        const x = L + p.x * (w - L - 12);
        const y = B - p.y * (B - T);
        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
      });
      c.stroke();
    }

    // cart replay driven by drawn v(t)
    if (analysis && pts.length > 1) {
      const t = (performance.now() / 1000 + replay) % 6;
      const frac = Math.min(1, t / 5);
      const idx = Math.min(pts.length - 1, Math.floor(frac * (pts.length - 1)));
      // integrate x
      let x = 0;
      for (let i = 1; i <= idx; i++) x += ((pts[i].y + pts[i - 1].y) / 2) * (5 / pts.length);
      const cy = T - 0 + 0;
      void cy;
      const cxp = L + Math.min(0.96, Math.abs(x) / 12) * (w - L - 40);
      c.fillStyle = "#dcae60";
      c.fillRect(cxp - 9, T + 2, 18, 10);
      c.beginPath(); c.arc(cxp - 4, T + 14, 2.5, 0, Math.PI * 2); c.arc(cxp + 4, T + 14, 2.5, 0, Math.PI * 2);
      c.fillStyle = "#8b98a5"; c.fill();
      c.fillStyle = "#c9d0d7";
      c.fillText(`cart x = ${x.toFixed(1)} m   t = ${(frac * 5).toFixed(1)} s`, L + 6, B - 8);
    }
  });

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left - 40) / (r.width - 52))), y: Math.min(1, Math.max(0, 1 - (e.clientY - r.top - 20) / (r.height - 46))) };
  };

  const analyze = () => {
    const pts = ptsRef.current;
    if (pts.length < 6) { setAnalysis(null); return; }
    const segs = 4;
    const lines: string[] = [];
    for (let s = 0; s < segs; s++) {
      const a = pts.slice(Math.floor((pts.length * s) / segs), Math.floor((pts.length * (s + 1)) / segs));
      if (a.length < 2) continue;
      const slope = (a[a.length - 1].y - a[0].y) / Math.max(0.05, a[a.length - 1].x - a[0].x);
      const mid = a[Math.floor(a.length / 2)].y;
      const t0 = (a[0].x * 5).toFixed(1), t1 = (a[a.length - 1].x * 5).toFixed(1);
      if (Math.abs(slope) < 0.12) lines.push(`t ${t0}–${t1} s: constant velocity (${mid > 0.08 ? "cruising" : "at rest"})`);
      else if (slope > 0) lines.push(`t ${t0}–${t1} s: accelerating, a ≈ +${(slope * 2).toFixed(2)} m/s²`);
      else lines.push(`t ${t0}–${t1} s: decelerating, a ≈ ${(slope * 2).toFixed(2)} m/s²`);
    }
    setAnalysis(lines);
    setReplay((r) => r + 7.3);
    sfx.switchOn();
    profile.recordExperiment();
  };

  return (
    <Panel label={<span>Graph → Physics — sketch a velocity–time curve, the bench replays it as real motion</span>}>
      <div className="p-3">
        <div className="relative h-[240px] cursor-crosshair overflow-hidden" style={{ background: "var(--color-stage)" }}>
          <canvas ref={canvasRef}
            onPointerDown={(e) => { drawing.current = true; ptsRef.current = [pos(e)]; setAnalysis(null); e.currentTarget.setPointerCapture(e.pointerId); }}
            onPointerMove={(e) => { if (drawing.current) ptsRef.current.push(pos(e)); }}
            onPointerUp={() => { drawing.current = false; }} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Btn kind="ink" onClick={analyze}>Analyze & run cart</Btn>
          <Btn onClick={() => { ptsRef.current = []; setAnalysis(null); }}>Clear</Btn>
          {analysis && (
            <ul className="ml-2 flex flex-wrap gap-1.5">
              {analysis.map((l) => (
                <li key={l} className="border border-line bg-panel2 px-2 py-0.5 font-mono text-[9.5px] text-ink2">{l}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  );
}
