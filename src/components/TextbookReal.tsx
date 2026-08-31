import { useMemo, useState } from "react";
import { cx, fmt, sfx } from "../lib/labkit";
import { CONCEPTS } from "../physics/registry";
import { REAL_LIFE, TEXTBOOK_BANK, buildSolved, solveFromBank } from "../physics/core";
import type { ConceptId, ParseResult, Solved } from "../physics/types";
import { Btn, Chip, Icon } from "./ui";

/* ============================================================
   TEXTBOOK QUESTION BANK — problems lifted from standard texts,
   re-solved live by the deterministic engine
   ============================================================ */

const LEVEL_COLORS: Record<string, string> = {
  "Class 9": "var(--color-energy)",
  "Class 11": "var(--color-motion)",
  "Class 12": "var(--color-field)",
  "University": "var(--color-force)",
};

export function TextbookBank({ onSolve }: { onSolve: (s: Solved, p: ParseResult) => void }) {
  const [src, setSrc] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  return (
    <BankInner src={src} setSrc={setSrc} level={level} setLevel={setLevel} revealed={revealed} setRevealed={setRevealed} onSolve={onSolve} />
  );
}

function BankInner({ src, setSrc, level, setLevel, revealed, setRevealed, onSolve }: {
  src: string; setSrc: (s: string) => void;
  level: string; setLevel: (s: string) => void;
  revealed: Record<string, boolean>; setRevealed: (r: Record<string, boolean>) => void;
  onSolve: (s: Solved, p: ParseResult) => void;
}) {
  const srcs = useMemo(() => ["all", ...Array.from(new Set(TEXTBOOK_BANK.map((b) => b.source)))], []);
  const filtered = TEXTBOOK_BANK.filter((b) => (src === "all" || b.source === src) && (level === "all" || b.level === level));

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 lg:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink3">Library shelf · {TEXTBOOK_BANK.length} problems</p>
          <h2 className="font-display text-[44px] font-extrabold leading-none text-ink">Textbook Question Bank</h2>
        </div>
        <p className="max-w-[340px] font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-ink2">
          Canonical problems from NCERT, Halliday–Resnick–Walker and HC Verma. Answers are re-computed by the engine — the printed answer is shown only for verification.
        </p>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {srcs.map((s) => (
          <button key={s} type="button" onClick={() => { setSrc(s); sfx.click(); }}
            className={cx("btn-press cursor-pointer border px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.1em]",
              src === s ? "border-ink bg-ink text-paper" : "border-line bg-panel text-ink2 hover:border-ink hover:text-ink")}>
            {s}
          </button>
        ))}
        <span className="mx-2 h-4 w-px bg-line" />
        {["all", "Class 9", "Class 11", "Class 12", "University"].map((l) => (
          <button key={l} type="button" onClick={() => { setLevel(l); sfx.click(); }}
            className={cx("btn-press cursor-pointer border px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.1em]",
              level === l ? "border-ink bg-ink text-paper" : "border-line bg-panel text-ink2 hover:border-ink hover:text-ink")}>
            {l}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((b, i) => {
          const meta = CONCEPTS[b.concept];
          const open = !!revealed[b.id];
          return (
            <article key={b.id} className="anim-rise flex flex-col border border-line bg-panel"
              style={{ animationDelay: `${(i % 9) * 35}ms` }}>
              <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
                <span className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-ink3">{b.source}</span>
                <span className="border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em]" style={{ color: LEVEL_COLORS[b.level], borderColor: LEVEL_COLORS[b.level] }}>
                  {b.level}
                </span>
              </div>
              <div className="flex-1 px-3 py-2.5">
                <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-ink3">{b.chapter}</p>
                <p className="mt-1 text-[13.5px] font-medium leading-snug text-ink">{b.q}</p>
                <p className="mt-2 font-mono text-[10px] italic" style={{ color: "var(--color-motion)" }}>{meta.formula}</p>
              </div>
              <div className="flex items-center gap-2 border-t border-line px-3 py-2">
                <Btn kind="ink" onClick={() => {
                  const r = solveFromBank(b);
                  sfx.switchOn();
                  onSolve(r.solved, r.parse);
                }}>
                  <Icon name="play" size={10} /> Solve live
                </Btn>
                <button type="button"
                  onClick={() => { setRevealed({ ...revealed, [b.id]: !open }); sfx.click(); }}
                  className={cx("btn-press ml-auto cursor-pointer border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em]",
                    open ? "border-energy text-energy" : "border-line text-ink2 hover:border-ink hover:text-ink")}>
                  {open ? `book: ${b.textbookAnswer}` : "printed answer"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.12em] text-ink3">
        honesty note — the engine recomputes every answer from the printed numbers; reveal the book answer to confirm agreement.
      </p>
    </div>
  );
}

/* ============================================================
   REAL-WORLD EXPERIMENTS — physics hiding in everyday objects
   ============================================================ */

export function RealLife({ onSolve }: { onSolve: (s: Solved, p: ParseResult) => void }) {
  const open = (rid: string) => {
    const e = REAL_LIFE.find((x) => x.id === rid);
    if (!e) return;
    const meta = CONCEPTS[e.concept];
    const values: Record<string, { v: number; unit: string; assumed: boolean }> = {};
    for (const [id, v] of Object.entries(e.values)) {
      const vd = meta.vars.find((x) => x.id === id);
      if (vd) values[id] = { v, unit: vd.unit, assumed: false };
    }
    const solved = buildSolved(e.concept, values, e.q, `Real-world experiment · ${e.setting}`);
    sfx.switchOn();
    onSolve(solved, { concept: e.concept, values, clarify: [], raw: e.q });
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 lg:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink3">Field notes · {REAL_LIFE.length} experiments</p>
          <h2 className="font-display text-[44px] font-extrabold leading-none text-ink">Physics in Real Life</h2>
        </div>
        <p className="max-w-[340px] font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-ink2">
          Everyday objects are secretly running physics. Pick one up — the lab opens it with real numbers and a live experiment.
        </p>
      </header>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {REAL_LIFE.map((e, i) => (
          <button key={e.id} type="button" onClick={() => open(e.id)}
            className="anim-rise group flex cursor-pointer flex-col border border-line bg-panel p-4 text-left transition-all hover:-translate-y-1 hover:border-ink hover:shadow-[4px_4px_0_rgba(34,40,47,0.16)]"
            style={{ animationDelay: `${(i % 8) * 40}ms` }}>
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center border border-line text-ink2 transition-colors group-hover:border-ink group-hover:text-motion">
                <Icon name={e.icon} size={24} />
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink3">EXP-{String(i + 1).padStart(2, "0")}</span>
            </div>
            <span className="mt-3 block font-display text-[21px] font-bold leading-tight text-ink">{e.title}</span>
            <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.1em] text-ink3">{e.setting}</span>
            <span className="mt-2.5 flex flex-wrap gap-1">
              {e.physics.map((p) => (
                <span key={p} className="border border-dashed border-line px-1.5 py-0.5 font-mono text-[8.5px] text-ink2">{p}</span>
              ))}
            </span>
            <span className="mt-3 border-t border-dashed border-line pt-2 font-mono text-[10px] leading-relaxed text-ink2">
              ▸ {e.q}
            </span>
            <span className="mt-2 flex items-center gap-1 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-ink3 transition-colors group-hover:text-ink">
              run experiment <Icon name="arrow" size={10} />
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 border border-line bg-panel2 px-4 py-3">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink2">
          <span className="text-ink">How it works — </span>
          each card feeds the exact everyday numbers into the deterministic engine, then opens the matching laboratory bench
          (torque rig, centripetal rig, buoyancy tank, Atwood machine, gas chamber…) so you can push the variables and break the intuition.
        </p>
      </div>
    </div>
  );
}

export { Chip, fmt };
