import { useEffect, useRef, useState } from "react";
import { cx, fmt, profile, sfx, t, useReducedMotion, useStageCanvas } from "../lib/labkit";
import { EXAMPLES, detectHypothesis } from "../physics/core";
import type { ConceptId } from "../physics/types";
import { AskBar, Btn, Icon } from "./ui";

/* ============================================================
   THE WORKBENCH — opening screen (not a hero: a laboratory)
   ============================================================ */

const FRAGMENTS = [
  { s: "F = ma", x: "6%", y: "16%", r: "-4deg", d: "0s" },
  { s: "E = ½mv²", x: "78%", y: "10%", r: "3deg", d: "1.2s" },
  { s: "T = 2π√(L/g)", x: "64%", y: "78%", r: "-2deg", d: "2.1s" },
  { s: "PV = nRT", x: "12%", y: "74%", r: "2deg", d: "0.6s" },
  { s: "n₁sinθ₁ = n₂sinθ₂", x: "40%", y: "6%", r: "1.5deg", d: "1.7s" },
  { s: "Δp = FΔt", x: "86%", y: "56%", r: "-3deg", d: "2.6s" },
  { s: "v = fλ", x: "30%", y: "88%", r: "-1.5deg", d: "0.9s" },
  { s: "∮E·dl = −dΦ/dt", x: "55%", y: "40%", r: "2.5deg", d: "3.1s" },
];

const LAB_DOORS: { id: string; n: string; name: string; desc: string; icon: string; color: string }[] = [
  { id: "mech", n: "01", name: "Mechanics", desc: "motion · force · energy · momentum · collisions", icon: "flask", color: "var(--color-motion)" },
  { id: "elec", n: "02", name: "Electricity", desc: "current · voltage · resistance · circuits", icon: "bolt", color: "var(--color-energy)" },
  { id: "waves", n: "03", name: "Waves", desc: "frequency · interference · superposition", icon: "wave", color: "var(--color-field)" },
  { id: "optics", n: "04", name: "Optics", desc: "refraction · lenses · ray diagrams", icon: "lens", color: "var(--color-warn)" },
  { id: "thermo", n: "05", name: "Thermodynamics", desc: "temperature · pressure · gas particles", icon: "thermo", color: "var(--color-force)" },
  { id: "astro", n: "06", name: "Astrophysics", desc: "gravity · orbits · escape trajectories", icon: "orbit", color: "var(--color-motion)" },
];

export function LabHome({ onAsk, onOpenLab }: { onAsk: (q: string) => void; onOpenLab: (lab: string, concept?: ConceptId) => void }) {
  const reduced = useReducedMotion();
  const [exIdx, setExIdx] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setExIdx((i) => (i + 1) % EXAMPLES.length), 3800);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="relative mx-auto max-w-[1400px] px-4 pb-20 pt-8 lg:px-8">
      {/* drifting equation fragments */}
      {!reduced && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {FRAGMENTS.map((f) => (
            <span key={f.s} className="anim-float absolute font-mono text-[15px] italic text-ink opacity-[0.09]"
              style={{ left: f.x, top: f.y, ["--rot" as string]: f.r, animationDelay: f.d }}>
              {f.s}
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink2">
          The digital physics laboratory <span className="text-ink3">· bench 01 · calibrated</span>
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-[clamp(56px,9vw,116px)] font-extrabold leading-[0.9] tracking-tight text-ink">
            ASK THE <span className="text-motion">LAB</span>
          </h1>
          <p className="mb-3 max-w-[240px] border-l-2 border-ink pl-3 font-mono text-[10.5px] uppercase leading-relaxed tracking-[0.18em] text-ink2">
            {t("tagline")}
          </p>
        </div>

        <div className="mt-6 max-w-[860px]">
          <AskBar onSubmit={onAsk} onOpenObject={(o) => onAsk(`What physics is in a ${o.toLowerCase()}?`)} />
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink3">specimens —</span>
            {EXAMPLES.slice(0, 4).map((ex, i) => (
              <button key={ex} type="button" onClick={() => onAsk(ex)}
                className={cx(
                  "btn-press cursor-pointer border border-dashed border-line bg-transparent px-2 py-1 font-mono text-[10px] text-ink2 transition-colors hover:border-ink hover:text-ink",
                  i === exIdx % 4 && "border-ink text-ink"
                )}>
                {ex}
              </button>
            ))}
            <span className="mx-1 h-3 w-px bg-line" />
            <button type="button" onClick={() => onOpenLab("__bank")}
              className="btn-press cursor-pointer border border-line bg-panel px-2 py-1 font-mono text-[10px] text-energy transition-colors hover:border-energy">
              ◫ Textbook bank
            </button>
            <button type="button" onClick={() => onOpenLab("__real")}
              className="btn-press cursor-pointer border border-line bg-panel px-2 py-1 font-mono text-[10px] text-motion transition-colors hover:border-motion">
              ◔ Real-life experiments
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-12">
          {/* pendulum instrument */}
          <div className="lg:col-span-4">
            <PendulumInstrument />
          </div>

          {/* lab doors */}
          <div className="lg:col-span-5">
            <section className="tick-corners border border-line bg-panel">
              <header className="flex items-center justify-between border-b border-line px-3 py-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">Universal physics lab — six rooms</span>
                <Icon name="grid" size={13} className="text-ink3" />
              </header>
              <ul>
                {LAB_DOORS.map((d) => (
                  <li key={d.id} className="border-b border-line last:border-b-0">
                    <button type="button" onClick={() => { sfx.click(); onOpenLab(d.id); }}
                      className="group flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-panel2">
                      <span className="font-display text-[22px] font-bold text-ink3 transition-colors group-hover:text-ink">{d.n}</span>
                      <span className="flex h-8 w-8 items-center justify-center border border-line" style={{ color: d.color }}>
                        <Icon name={d.icon} size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-[19px] font-bold uppercase leading-tight text-ink">{d.name}</span>
                        <span className="block truncate font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink3">{d.desc}</span>
                      </span>
                      <span className="text-ink3 transition-all group-hover:translate-x-1 group-hover:text-ink"><Icon name="arrow" size={15} /></span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* live trace + debate + constants */}
          <div className="space-y-4 lg:col-span-3">
            <LiveTrace />
            <DebateCard onAsk={onAsk} />
            <ConstantsStrip />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- live pendulum instrument ---------------- */
function PendulumInstrument() {
  const st = useRef({ th: 0.65, w: 0, last: -1, t0: 0 });
  const canvasRef = useStageCanvas((c, w, h) => {
    const now = performance.now() / 1000;
    const dt = st.current.last < 0 ? 0.016 : Math.min(0.05, now - st.current.last);
    st.current.last = now;
    const s = st.current;
    const L = 1.2, g = 9.8;
    for (let i = 0; i < 6; i++) {
      s.w += (-(g / L) * Math.sin(s.th)) * (dt / 6);
      s.th += s.w * (dt / 6);
    }
    c.clearRect(0, 0, w, h);
    const px = w / 2, py = 30;
    const sc = (h - 74) / 1.25;
    c.strokeStyle = "#39424c";
    c.setLineDash([2, 5]);
    c.beginPath(); c.arc(px, py, L * sc, Math.PI / 2 - 0.8, Math.PI / 2 + 0.8); c.stroke();
    c.setLineDash([]);
    c.fillStyle = "#c9d0d7"; c.fillRect(px - 30, py - 8, 60, 5);
    const bx = px + L * sc * Math.sin(s.th);
    const by = py + L * sc * Math.cos(s.th);
    c.strokeStyle = "#8b98a5"; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(px, py); c.lineTo(bx, by); c.stroke();
    c.beginPath(); c.arc(bx, by, 11, 0, Math.PI * 2);
    c.fillStyle = "#7fb2e5"; c.fill();
    c.font = "9px 'IBM Plex Mono', monospace";
    c.fillStyle = "#9aa4ae"; c.textAlign = "left";
    c.fillText(`θ = ${((s.th * 180) / Math.PI).toFixed(1)}°`, 10, h - 30);
    c.fillText(`T = 2π√(L/g) = ${fmt(2 * Math.PI * Math.sqrt(L / g), 3)} s`, 10, h - 16);
    c.textAlign = "right";
    c.fillStyle = "#7fc79a";
    c.fillText("INTEGRATING", w - 10, h - 16);
  });
  return (
    <section className="tick-corners overflow-hidden border border-line bg-panel">
      <header className="flex items-center justify-between border-b border-line px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">Fig. A — pendulum · live</span>
        <span className="anim-blink h-1.5 w-1.5 rounded-full bg-energy" />
      </header>
      <div className="relative h-[228px]" style={{ background: "var(--color-stage)" }}>
        <canvas ref={canvasRef} />
      </div>
    </section>
  );
}

/* ---------------- self-drawing trace ---------------- */
function LiveTrace() {
  const canvasRef = useStageCanvas((c, w, h) => {
    const t = performance.now() / 1000;
    c.clearRect(0, 0, w, h);
    c.strokeStyle = "#39424c"; c.lineWidth = 1;
    for (let y = 0; y < h; y += 22) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    const mid = h / 2;
    c.strokeStyle = "#7fc79a"; c.lineWidth = 1.8;
    c.beginPath();
    const sweep = ((t * 0.35) % 1);
    for (let x = 0; x < w * sweep; x += 2) {
      const xx = x / w;
      const y = mid - Math.sin(xx * 22 - t * 2.2) * Math.exp(-xx * 2.4) * (h * 0.36);
      if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
    const sx = w * sweep;
    c.fillStyle = "#7fc79a";
    c.fillRect(sx - 1, 6, 2, h - 12);
    c.font = "9px 'IBM Plex Mono', monospace";
    c.fillStyle = "#9aa4ae";
    c.fillText("damped oscillation — x(t) = A e^(−λt) sin ωt", 8, 14);
  });
  return (
    <section className="tick-corners overflow-hidden border border-line bg-panel">
      <header className="border-b border-line px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">Fig. B — live trace</span>
      </header>
      <div className="h-[120px]" style={{ background: "var(--color-stage)" }}>
        <canvas ref={canvasRef} />
      </div>
    </section>
  );
}

/* ---------------- debate card ---------------- */
function DebateCard({ onAsk }: { onAsk: (q: string) => void }) {
  const [vote, setVote] = useState<string | null>(null);
  const claim = "Heavier objects fall faster.";
  const isHypo = detectHypothesis(claim) !== null;
  void isHypo;
  return (
    <section className="tick-corners border border-line bg-panel">
      <header className="border-b border-line px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">Debate mode — take a side</span>
      </header>
      <div className="p-3">
        <p className="font-display text-[19px] font-bold leading-tight text-ink">“{claim}”</p>
        <div className="mt-2 flex gap-1.5">
          {["Agree", "Disagree", "Unsure"].map((v) => (
            <button key={v} type="button"
              onClick={() => { setVote(v); profile.recordDebate(claim); sfx.click(); onAsk("Do heavier objects fall faster than lighter ones? Drop both and test it."); }}
              className={cx("btn-press flex-1 cursor-pointer border px-2 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.1em]",
                vote === v ? "border-ink bg-ink text-paper" : "border-line text-ink2 hover:border-ink hover:text-ink")}>
              {v}
            </button>
          ))}
        </div>
        {vote && (
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-energy">
            Vote logged — the drop tower on the workbench will deliver the evidence.
          </p>
        )}
      </div>
    </section>
  );
}

/* ---------------- constants ---------------- */
function ConstantsStrip() {
  const consts: [string, string][] = [
    ["G", "6.674×10⁻¹¹ N·m²/kg²"],
    ["c", "299 792 458 m/s"],
    ["g", "9.80665 m/s²"],
    ["e", "1.602×10⁻¹⁹ C"],
    ["k_B", "1.381×10⁻²³ J/K"],
    ["h", "6.626×10⁻³⁴ J·s"],
  ];
  return (
    <section className="border border-line bg-panel2 p-3">
      <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink3">Bench constants</p>
      <ul className="space-y-1">
        {consts.map(([k, v]) => (
          <li key={k} className="flex justify-between font-mono text-[10px]">
            <span className="italic text-motion">{k}</span>
            <span className="text-ink2">{v}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HomeFootnote() {
  return (
    <div className="border-t border-line bg-panel2">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-6 py-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink3">
          AI explains · math calculates · simulation demonstrates · experiment verifies
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink3">
          Simplified models, stated assumptions — not a research-grade solver
        </p>
      </div>
    </div>
  );
}

export { Btn };
