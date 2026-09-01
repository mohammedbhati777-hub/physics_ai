import { useEffect, useMemo, useRef, useState } from "react";
import {
  LiveBuffer, cx, download, enc, fmt, profile, sfx, t, uid, useReducedMotion,
} from "../lib/labkit";
import {
  analyzeMistake, buildSolved, lightSlowFacts, varValue, whatIfSolve,
} from "../physics/core";
import type { ParseResult, Solved } from "../physics/types";
import { GraphCanvas } from "./Graph";
import { SIMS } from "./simsX";
import { AskBar, Btn, Chip, Icon, Panel, Tag, TactSlider } from "./ui";

/* ============================================================
   WORKSPACE — question → understand → solve → simulate → experiment
   ============================================================ */

type Mode = null | "why" | "eli10" | "teach" | "socratic" | "mistake";

export type WsSignal = { nonce: number } & (
  | { type: "preset"; label: string }
  | { type: "clearWhatif" }
  | { type: "mode"; mode: string | null }
  | { type: "setVar"; varId: string; value: number }
  | { type: "ask"; q: string }
);

export function Workspace({ solved, parse, onAsk, signal }: { solved: Solved; parse: ParseResult; onAsk: (q: string) => void; signal?: WsSignal | null }) {
  const reduced = useReducedMotion();
  const [vars, setVars] = useState<Record<string, number>>(() => initVars(solved));
  const [assumed, setAssumed] = useState<Record<string, boolean>>(() => initAssumed(solved));
  const [whatif, setWhatif] = useState<Record<string, number> | null>(
    parse.whatif ? presetAbs(solved, parse.whatif.varId, parse.whatif.mult, initVars(solved)) : null
  );
  const [mode, setMode] = useState<Mode>(null);
  const [stepsShown, setStepsShown] = useState(reduced ? 7 : 0);
  const bufferRef = useRef(new LiveBuffer(700));
  const varsRef = useRef(vars);
  varsRef.current = vars;

  /* expo-mode signal receiver */
  useEffect(() => {
    if (!signal) return;
    if (signal.type === "preset") {
      const p = solved.whatifPresets.find((x) => x.label === signal.label);
      if (p) { sfx.switchOn(); setWhatif(presetAbs(solved, p.varId, p.mult, varsRef.current)); }
    } else if (signal.type === "clearWhatif") {
      setWhatif(null);
    } else if (signal.type === "mode") {
      setMode((signal.mode as Mode) || null);
    } else if (signal.type === "setVar") {
      sfx.tick();
      setVars((old) => ({ ...old, [signal.varId]: signal.value }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal?.nonce]);

  useEffect(() => {
    setVars(initVars(solved));
    setAssumed(initAssumed(solved));
    setWhatif(parse.whatif ? presetAbs(solved, parse.whatif.varId, parse.whatif.mult, initVars(solved)) : null);
    setMode(null);
    setStepsShown(reduced ? 7 : 0);
    const iv = reduced ? null : setInterval(() => {
      setStepsShown((s) => {
        if (s >= 7) { if (iv) clearInterval(iv); return s; }
        sfx.tick();
        return s + 1;
      });
    }, 300);
    return () => { if (iv) clearInterval(iv); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved, reduced]);

  const values = useMemo(() => {
    const out: Record<string, { v: number; unit: string; assumed: boolean }> = {};
    for (const vd of solved.variables) out[vd.id] = { v: vars[vd.id] ?? vd.def, unit: vd.unit, assumed: !!assumed[vd.id] };
    return out;
  }, [solved, vars, assumed]);

  const current = useMemo(() => buildSolved(solved.id, values, solved.question, solved.source), [solved, values]);
  const whatifSolved = useMemo(() => (whatif ? whatIfSolve(current, whatif) : null), [current, whatif]);

  const Sim = SIMS[current.simKind];
  const simVars = useMemo(() => {
    const out: Record<string, number> = {};
    for (const vd of current.variables) out[vd.id] = vars[vd.id] ?? vd.def;
    return out;
  }, [current, vars]);

  const save = () => {
    const entry = {
      id: uid(), ts: Date.now(),
      question: solved.question, concept: current.conceptName, topic: current.topic,
      formula: current.formula,
      result: `${current.resultSym} = ${fmt(current.resultValue)} ${current.resultUnit}`,
    };
    const list = JSON.parse(localStorage.getItem("physix.notebook") || "[]");
    localStorage.setItem("physix.notebook", JSON.stringify([entry, ...list]));
    sfx.chime();
    profile.recordSolved(current.topic, current.conceptName);
    window.dispatchEvent(new Event("physix-notebook"));
  };

  const share = () => {
    const url = `${location.origin}${location.pathname}#x=${enc({ c: current.id, v: vars, q: solved.question })}`;
    navigator.clipboard?.writeText(url).then(
      () => sfx.chime(),
      () => sfx.buzz()
    );
  };

  const steps = [
    { label: t("given"), body: <GivenList current={current} /> },
    { label: t("find"), body: <p className="text-[13px] text-ink">{current.find}</p> },
    { label: t("formula"), body: (
        <div>
          <div className="border border-line bg-panel2 px-3 py-2 font-mono text-[17px] font-semibold italic tracking-wide text-ink">
            {current.formula}
          </div>
          <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink3">
            dimensions: {current.formulaUnits}
          </div>
        </div>
      ) },
    { label: t("substitute"), body: <CodeLines lines={current.substitute} /> },
    { label: t("calculate"), body: <CodeLines lines={current.calc} /> },
    { label: t("result"), body: (
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[30px] font-semibold tabular-nums text-ink">{fmt(current.resultValue)}</span>
            <span className="font-mono text-sm text-ink2">{current.resultUnit}</span>
          </div>
          <p className="mt-0.5 text-[12.5px] text-ink2">{current.resultText}</p>
          {current.extras.length > 0 && (
            <ul className="mt-2 space-y-1">
              {current.extras.map((e) => (
                <li key={e.label} className="flex justify-between gap-3 border-b border-dashed border-line pb-0.5 font-mono text-[10.5px]">
                  <span className="text-ink3">{e.label}</span>
                  <span className="font-medium text-ink">{e.value}</span>
                </li>
              ))}
            </ul>
          )}
          <ul className="mt-2 space-y-1">
            {current.sanity.map((s, i) => (
              <li key={i} className={cx("flex items-start gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.06em]", s.ok ? "text-energy" : "text-warn")}>
                <Icon name={s.ok ? "check" : "alert"} size={11} className="mt-[1px] shrink-0" />
                <span className="normal-case tracking-normal">{s.note}</span>
              </li>
            ))}
          </ul>
        </div>
      ) },
    { label: t("meaning"), body: <p className="text-[13px] leading-relaxed text-ink">{current.meaning}</p> },
  ];

  return (
    <div className="mx-auto max-w-[1500px] px-4 pb-16 pt-4 lg:px-6">
      <AskBar compact onSubmit={onAsk} />

      {/* analysis strip */}
      <div className="anim-rise mt-3 flex flex-wrap items-center gap-1.5" aria-label="Question analysis">
        <Tag color="var(--color-motion)">Topic · {current.topic}</Tag>
        <Tag color="var(--color-energy)">Concept · {current.conceptName}</Tag>
        <Tag color="var(--color-warn)">Type · {current.type}</Tag>
        <Tag>Level · {current.level}</Tag>
        <Tag color="var(--color-field)">
          Variables · {current.variables.map((v) => v.sym).join("  ")}
        </Tag>
        {current.source && <Tag color="var(--color-energy)">Source · {current.source}</Tag>}
        {parse.special?.startsWith("light-slow") && <Tag color="var(--color-force)">WHAT-IF · speed of light</Tag>}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)_330px]">
        {/* LEFT — derivation */}
        <div className="min-w-0">
          <Panel label={<span>Derivation · {current.conceptName}</span>}
            right={<button className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.14em] text-ink3 hover:text-ink" onClick={() => setStepsShown(7)}>show all</button>}
          >
            <ol className="max-h-[560px] overflow-y-auto p-3">
              {steps.map((s, i) => (
                <li key={i} className={cx("relative border-l-2 pb-4 pl-4 transition-opacity duration-300", i < stepsShown ? "opacity-100" : "opacity-25", i === stepsShown - 1 ? "border-motion" : "border-line")}>
                  <span className="absolute -left-[5px] top-1 h-2 w-2 bg-ink" />
                  <div className="mb-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.2em] text-ink3">
                    Step 0{i + 1} — {s.label}
                    {i === 2 && (
                      <button className="btn-press ml-2 cursor-pointer border border-line bg-panel px-1.5 text-[9px] text-force hover:border-force"
                        onClick={() => { setMode(mode === "why" ? null : "why"); sfx.click(); }}>
                        {t("why")}
                      </button>
                    )}
                  </div>
                  {s.body}
                </li>
              ))}
            </ol>
          </Panel>

          {/* mode switcher */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip active={mode === "eli10"} onClick={() => { setMode(mode === "eli10" ? null : "eli10"); sfx.click(); }}>ELI-10</Chip>
            <Chip active={mode === "teach"} onClick={() => { setMode(mode === "teach" ? null : "teach"); sfx.click(); }}>{t("teach")}</Chip>
            <Chip active={mode === "socratic"} onClick={() => { setMode(mode === "socratic" ? null : "socratic"); sfx.click(); }}>{t("socratic")}</Chip>
            <Chip active={mode === "mistake"} onClick={() => { setMode(mode === "mistake" ? null : "mistake"); sfx.click(); }}>Mistake Detective</Chip>
          </div>

          <div className="mt-3 space-y-3">
            {mode === "why" && <WhyCard s={current} onClose={() => setMode(null)} />}
            {mode === "eli10" && <Eli10Card s={current} onClose={() => setMode(null)} />}
            {mode === "teach" && <TeachCard s={current} onClose={() => setMode(null)} />}
            {mode === "socratic" && <SocraticCard s={current} onClose={() => setMode(null)} />}
            {mode === "mistake" && <MistakeCard onClose={() => setMode(null)} />}
            {parse.special?.startsWith("light-slow") && <LightCard factor={parseInt(parse.special.split("-")[2] || "10")} />}
          </div>

          <div className="mt-3 flex gap-1.5">
            <Btn onClick={save} kind="line" className="flex-1 justify-center"><Icon name="save" size={12} /> {t("save")}</Btn>
            <Btn onClick={share} kind="line" className="flex-1 justify-center"><Icon name="share" size={12} /> {t("share")}</Btn>
          </div>
        </div>

        {/* CENTER — stage + what-if */}
        <div className="min-w-0">
          <Sim vars={simVars} whatif={whatif} buffer={bufferRef.current} />
          <WhatIfPanel solved={current} vars={vars} whatif={whatif} setWhatif={setWhatif} whatifSolved={whatifSolved} />
        </div>

        {/* RIGHT — equation control + graph */}
        <div className="min-w-0 space-y-4">
          <Panel label={<span>{t("variables")} — live equation</span>}>
            <div className="space-y-3 p-3">
              <div className="border border-line bg-panel2 px-3 py-2 text-center font-mono text-[16px] font-semibold italic text-ink">
                {current.formula}
              </div>
              {current.variables.map((vd) => (
                <div key={vd.id}>
                  <TactSlider sym={vd.sym} name={vd.name} unit={vd.unit} min={vd.min} max={vd.max} step={vd.step}
                    value={vars[vd.id] ?? vd.def}
                    onChange={(v) => setVars((old) => ({ ...old, [vd.id]: v }))}
                    color={vd.color} />
                  {assumed[vd.id] && (
                    <p className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-warn">assumed — edit to match your problem</p>
                  )}
                </div>
              ))}
              {current.id === "projectile" && (
                <button type="button"
                  onClick={() => { setVars((o) => ({ ...o, th: 45 })); sfx.switchOn(); }}
                  className="btn-press w-full cursor-pointer border border-dashed border-warn px-2 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-warn hover:border-solid hover:bg-warn hover:text-paper">
                  ◎ Optimal angle → set θ = 45°
                </button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <LiveResult label={current.resultSym} value={current.resultValue} unit={current.resultUnit} color="var(--color-energy)" />
                {whatifSolved && (
                  <LiveResult label={`${current.resultSym} (what-if)`} value={whatifSolved.resultValue} unit={whatifSolved.resultUnit} color="var(--color-warn)" />
                )}
              </div>
            </div>
          </Panel>

          <Panel label={<span>Graph — simulated data</span>}>
            <GraphCanvas kind={current.graphKind} vars={simVars} buffer={bufferRef.current} whatifVars={whatif} height={200} />
          </Panel>

          <Panel label={<span>Experiment record</span>}>
            <div className="p-3">
              <p className="font-mono text-[10px] leading-relaxed text-ink2">
                <span className="text-ink3">Q — </span>{solved.question}
              </p>
              <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-ink2">
                <span className="text-ink3">A — </span>{current.resultText}
              </p>
              <p className="mt-2 border-t border-dashed border-line pt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-ink3">
                {current.assumption}
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */
function initVars(s: Solved): Record<string, number> {
  const out: Record<string, number> = {};
  s.given.forEach((g) => {
    const vd = s.variables.find((v) => v.sym === g.sym);
    if (vd) out[vd.id] = g.value;
  });
  return out;
}
function initAssumed(s: Solved): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  s.given.forEach((g) => {
    const vd = s.variables.find((v) => v.sym === g.sym);
    if (vd) out[vd.id] = g.assumed;
  });
  return out;
}
function presetAbs(s: Solved, varId: string, mult: number, vars: Record<string, number>): Record<string, number> {
  const vd = s.variables.find((v) => v.id === varId);
  if (!vd) return { [varId]: mult }; // special sim keys (g0, vmult)
  const abs = mult < 0 ? -mult : Math.min(vd.max, Math.max(vd.min, (vars[varId] ?? vd.def) * mult));
  return { [varId]: abs };
}

function GivenList({ current }: { current: Solved }) {
  return (
    <ul className="space-y-1">
      {current.given.map((g) => (
        <li key={g.sym} className="flex items-baseline justify-between gap-2 font-mono text-[12px]">
          <span className="italic text-motion">{g.sym}</span>
          <span className="text-ink3">{g.name}</span>
          <span className="font-semibold text-ink">
            {fmt(g.value)} {g.unit}
            {g.assumed && <sup className="ml-1 text-[8px] text-warn">ASSUMED</sup>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function CodeLines({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-0.5">
      {lines.map((l, i) => (
        <p key={i} className="font-mono text-[12px] text-ink">{l}</p>
      ))}
    </div>
  );
}

function LiveResult({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="border border-line bg-panel px-2 py-1.5">
      <div className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-ink3">{label}</div>
      <div className="font-mono text-lg font-semibold tabular-nums" style={{ color }}>
        {fmt(value)} <span className="text-[9px] font-normal text-ink3">{unit}</span>
      </div>
    </div>
  );
}

/* ---------------- WHAT IF ---------------- */
function WhatIfPanel({ solved, vars, whatif, setWhatif, whatifSolved }: {
  solved: Solved; vars: Record<string, number>;
  whatif: Record<string, number> | null; setWhatif: (w: Record<string, number> | null) => void;
  whatifSolved: Solved | null;
}) {
  const [open, setOpen] = useState(!!whatif);
  useEffect(() => { if (whatif) setOpen(true); }, [whatif]);
  const base = varValue(solved, solved.variables[0]?.id || "");
  void base;
  return (
    <Panel className="mt-4" label={<span>What-If Engine — current vs alternate universe</span>}
      right={
        <button className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.14em] text-ink3 hover:text-ink" onClick={() => setOpen(!open)}>
          {open ? "collapse" : "expand"}
        </button>
      }
    >
      {open && (
        <div className="p-3">
          <div className="flex flex-wrap gap-1.5">
            {solved.whatifPresets.map((p) => {
              const active = whatif && (
                p.mult < 0
                  ? whatif[p.varId] === -p.mult
                  : whatif[p.varId] !== undefined
              );
              return (
                <Chip key={p.label} active={!!active} onClick={() => {
                  sfx.switchOn();
                  setWhatif(whatif ? null : presetAbs(solved, p.varId, p.mult, vars));
                }}>
                  {p.label}
                </Chip>
              );
            })}
            {whatif && <Chip onClick={() => setWhatif(null)}>Clear ✕</Chip>}
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              {solved.variables.map((vd) => (
                <div key={vd.id} className="mb-2">
                  <TactSlider sym={vd.sym} name={`${vd.name} (what-if)`} unit={vd.unit}
                    min={vd.min} max={vd.max} step={vd.step}
                    value={whatif?.[vd.id] ?? vars[vd.id] ?? vd.def}
                    onChange={(v) => setWhatif({ ...(whatif || {}), [vd.id]: v })}
                    color="var(--color-warn)" />
                </div>
              ))}
            </div>
            <div className="border border-line bg-panel2 p-3">
              <div className="mb-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-ink3">
                <span>Current</span><span className="text-warn">What-if</span>
              </div>
              <CompareRow label={solved.resultSym} a={solved.resultValue} b={whatifSolved?.resultValue} unit={solved.resultUnit} />
              {whatifSolved && solved.extras.slice(0, 2).map((e, i) => {
                const numA = parseFloat(e.value);
                const numB = parseFloat(whatifSolved.extras[i]?.value ?? "");
                if (!isFinite(numA) || !isFinite(numB)) return null;
                return <CompareRow key={e.label} label={e.label.split(" ")[0]} a={numA} b={numB} unit="" />;
              })}
              {!whatifSolved && (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink3">
                  Select a preset or drag a what-if slider →
                </p>
              )}
              {whatifSolved && (
                <p className="mt-2 border-t border-dashed border-line pt-2 text-[11.5px] leading-relaxed text-ink2">
                  {whatifSolved.resultText}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}

function CompareRow({ label, a, b, unit }: { label: string; a: number; b?: number; unit: string }) {
  const d = b !== undefined && a !== 0 ? ((b - a) / Math.abs(a)) * 100 : 0;
  return (
    <div className="flex items-center justify-between border-b border-dashed border-line py-1 font-mono text-[11px]">
      <span className="text-ink3">{label}</span>
      <span className="tabular-nums text-ink">{fmt(a)} {unit}</span>
      <span className="tabular-nums text-warn">{b !== undefined ? `${fmt(b)}${unit ? " " + unit : ""}` : "—"}</span>
      <span className={cx("w-14 text-right tabular-nums", d > 0 ? "text-force" : d < 0 ? "text-motion" : "text-ink3")}>
        {b !== undefined ? `${d > 0 ? "+" : ""}${fmt(d, 3)}%` : ""}
      </span>
    </div>
  );
}

/* ---------------- WHY ---------------- */
function WhyCard({ s, onClose }: { s: Solved; onClose: () => void }) {
  return (
    <Panel label={<span className="text-force">Why this formula? — {s.formula}</span>} right={<button className="cursor-pointer text-ink3 hover:text-ink" onClick={onClose} aria-label="close"><Icon name="x" size={12} /></button>}>
      <div className="space-y-3 p-3 text-[12.5px] leading-relaxed">
        <section><h4 className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-motion">Simple</h4><p className="text-ink">{s.whySimple}</p></section>
        <section><h4 className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-energy">Mathematical</h4><p className="text-ink">{s.whyMath}</p></section>
        <section><h4 className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-warn">Visual demonstration</h4><p className="text-ink">{s.whyVisual}</p></section>
      </div>
    </Panel>
  );
}

/* ---------------- ELI10 ---------------- */
function Eli10Card({ s, onClose }: { s: Solved; onClose: () => void }) {
  return (
    <Panel label={<span className="text-motion">Explain like I'm 10</span>} right={<button className="cursor-pointer text-ink3 hover:text-ink" onClick={onClose} aria-label="close"><Icon name="x" size={12} /></button>}>
      <div className="space-y-3 p-3">
        <p className="font-display text-[19px] font-semibold leading-snug text-ink">{s.eliHook}</p>
        <div className="border-l-2 border-motion pl-3 text-[12.5px] leading-relaxed text-ink2">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-motion">Analogy — </span>{s.eliAnalogy}
        </div>
        <div className="border-l-2 border-energy pl-3 text-[12.5px] leading-relaxed text-ink2">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-energy">Try it — </span>{s.eliExample}
        </div>
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink3">Then play with the simulation — that's the real explanation.</p>
      </div>
    </Panel>
  );
}

/* ---------------- TEACH ME ---------------- */
function TeachCard({ s, onClose }: { s: Solved; onClose: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const ok = picked === s.quiz.answer;
  return (
    <Panel label={<span className="text-energy">Mini lesson — {s.conceptName}</span>} right={<button className="cursor-pointer text-ink3 hover:text-ink" onClick={onClose} aria-label="close"><Icon name="x" size={12} /></button>}>
      <div className="space-y-2.5 p-3 text-[12.5px] leading-relaxed">
        {[
          ["Concept", s.teachConcept, "var(--color-motion)"],
          ["Intuition", s.teachIntuition, "var(--color-energy)"],
          ["Formula", `${s.formula}   ·   ${s.formulaUnits}`, "var(--color-force)"],
          ["Visual", "The stage on this bench is the visual — every slider rewires it live.", "var(--color-warn)"],
          ["Example", s.teachExample, "var(--color-field)"],
        ].map(([h, body, col]) => (
          <section key={h as string} className="border-l-2 pl-3" style={{ borderColor: col as string }}>
            <h4 className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: col as string }}>{h}</h4>
            <p className="mt-0.5 text-ink">{body}</p>
          </section>
        ))}
        <section className="border border-line bg-panel2 p-2.5">
          <h4 className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-ink2">Quiz — check yourself</h4>
          <p className="mb-2 text-[12.5px] font-medium text-ink">{s.quiz.q}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {s.quiz.options.map((o, i) => (
              <button key={i} type="button"
                onClick={() => { setPicked(i); profile.recordQuiz(s.topic, i === s.quiz.answer); (i === s.quiz.answer ? sfx.chime : sfx.buzz)(); }}
                className={cx(
                  "btn-press cursor-pointer border px-2 py-1.5 text-left font-mono text-[10.5px]",
                  picked === null && "border-line bg-panel hover:border-ink",
                  picked !== null && i === s.quiz.answer && "border-energy bg-energy text-paper",
                  picked !== null && i === picked && i !== s.quiz.answer && "border-force bg-panel text-force",
                  picked !== null && i !== picked && i !== s.quiz.answer && "border-line opacity-40"
                )}>
                {o}
              </button>
            ))}
          </div>
          {picked !== null && (
            <p className={cx("mt-2 text-[11.5px]", ok ? "text-energy" : "text-force")}>
              {ok ? "Correct — " : "Not quite — "}{s.quiz.explain}
            </p>
          )}
        </section>
      </div>
    </Panel>
  );
}

/* ---------------- SOCRATIC ---------------- */
function SocraticCard({ s, onClose }: { s: Solved; onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  const [val, setVal] = useState("");
  const [state, setState] = useState<"ask" | "hint" | "done" | "next">("ask");
  const step = s.socratic[Math.min(idx, s.socratic.length - 1)];
  const done = idx >= s.socratic.length;

  const submit = () => {
    const low = val.toLowerCase();
    const hit = step.accept.some((a) => low.includes(a.toLowerCase()));
    if (hit) { setState("next"); sfx.chime(); profile.recordQuiz(s.topic, true); }
    else { setState("hint"); sfx.buzz(); }
  };

  return (
    <Panel label={<span className="text-field">Socratic tutor — discover it yourself</span>} right={<button className="cursor-pointer text-ink3 hover:text-ink" onClick={onClose} aria-label="close"><Icon name="x" size={12} /></button>}>
      <div className="p-3">
        {done ? (
          <div className="py-2 text-center">
            <p className="font-display text-[20px] font-semibold text-ink">You derived it yourself.</p>
            <p className="mt-1 text-[12px] text-ink2">That's how physics sticks — ask the next question on the bench.</p>
            <Btn className="mt-3" onClick={() => { setIdx(0); setVal(""); setState("ask"); }}>Restart dialogue</Btn>
          </div>
        ) : (
          <>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink3">Guiding question {idx + 1} / {s.socratic.length}</p>
            <p className="mt-1.5 text-[13.5px] font-medium leading-relaxed text-ink">{step.q}</p>
            <form className="mt-2.5 flex" onSubmit={(e) => { e.preventDefault(); submit(); }}>
              <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Your reasoning…" aria-label="Your answer"
                className="min-w-0 flex-1 border border-line bg-panel px-2.5 py-1.5 text-[12.5px] outline-none focus:border-motion" />
              <Btn kind="ink" onClick={submit} className="border-l-0">Check</Btn>
            </form>
            {state === "hint" && (
              <p className="mt-2 border-l-2 border-warn pl-2 text-[12px] text-warn">Hint — {step.hint}</p>
            )}
            {state === "next" && (
              <div className="mt-2 border-l-2 border-energy pl-2">
                <p className="text-[12px] text-energy">{step.follow}</p>
                <Btn className="mt-2" onClick={() => { setIdx(idx + 1); setVal(""); setState("ask"); }}>
                  {idx + 1 < s.socratic.length ? "Next question" : "Finish"} <Icon name="arrow" size={11} />
                </Btn>
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}

/* ---------------- MISTAKE DETECTIVE ---------------- */
function MistakeCard({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("m = 5 kg\nv = 10 m/s\nKE = mv²\nKE = 500 J");
  const [rep, setRep] = useState<ReturnType<typeof analyzeMistake> | null>(null);
  return (
    <Panel label={<span className="text-force">Mistake detective — paste your solution</span>} right={<button className="cursor-pointer text-ink3 hover:text-ink" onClick={onClose} aria-label="close"><Icon name="x" size={12} /></button>}>
      <div className="p-3">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} aria-label="Your solution"
          className="w-full border border-line bg-panel p-2 font-mono text-[11.5px] outline-none focus:border-motion" />
        <Btn kind="ink" className="mt-2" onClick={() => { const r = analyzeMistake(text); setRep(r); if (r.theirFormula === "KE = m v²") profile.recordMistake(); sfx.switchOn(); }}>
          Analyze solution
        </Btn>
        {rep && (
          <div className="mt-3 space-y-2">
            {rep.theirAnswer !== null && rep.correctAnswer !== null && (
              <div className="grid grid-cols-2 gap-2">
                <div className={cx("border p-2", rep.theirAnswer !== rep.correctAnswer ? "border-forcelt bg-[rgba(191,59,52,0.06)]" : "border-line")}>
                  <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-force">Your solution</p>
                  <p className="mt-1 font-mono text-[12px] text-ink">{rep.theirFormula || "—"} → {rep.theirAnswer} J</p>
                </div>
                <div className="border border-energylt bg-[rgba(31,122,77,0.06)] p-2">
                  <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-energy">Correct</p>
                  <p className="mt-1 font-mono text-[12px] text-ink">{rep.correctFormula} → {rep.correctAnswer} J</p>
                </div>
              </div>
            )}
            <ul className="space-y-1">
              {rep.lines.map((l, i) => (
                <li key={i} className={cx("flex items-start gap-1.5 font-mono text-[10.5px] leading-relaxed", l.startsWith("MISTAKE") ? "text-force" : l.startsWith("No error") ? "text-energy" : "text-ink2")}>
                  <span className="mt-[5px] h-1 w-1 shrink-0 bg-current" />{l}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ---------------- LIGHT WHAT-IF ---------------- */
function LightCard({ factor }: { factor: number }) {
  const facts = lightSlowFacts(factor);
  return (
    <Panel label={<span className="text-force">What-if — c ÷ {factor}</span>}>
      <ul className="space-y-1.5 p-3">
        {facts.map((f) => (
          <li key={f.label} className="flex justify-between gap-3 border-b border-dashed border-line pb-1 font-mono text-[10.5px]">
            <span className="text-ink3">{f.label}</span>
            <span className="text-right text-ink">{f.value}</span>
          </li>
        ))}
        <p className="pt-1 text-[11px] leading-relaxed text-ink2">
          Chemistry, electronics and causality would reshape — but Maxwell's equations stay self-consistent at any c.
        </p>
      </ul>
    </Panel>
  );
}

export function exportNotebookText(entries: { question: string; formula: string; result: string }[]) {
  return entries.map((e, i) => `${i + 1}. ${e.question}\n   ${e.formula}\n   ${e.result}`).join("\n\n");
}
void download;
