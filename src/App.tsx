import { useEffect, useRef, useState } from "react";
import {
  cx, dec, profile, sfx, setLang, t, toggleMute, useLang, useMuted,
} from "./lib/labkit";
import { CLARIFY_CHIPS, IMAGE_OBJECTS, buildSolved, solveQuestion } from "./physics/core";
import { CONCEPTS } from "./physics/registry";
import type { ConceptId, ParseResult, Solved } from "./physics/types";
import { LabHome, HomeFootnote } from "./components/LabHome";
import { LabsView } from "./components/Labs";
import { NotebookView } from "./components/Notebook";
import { RealLife, TextbookBank } from "./components/TextbookReal";
import { Workspace } from "./components/Solver";
import { Btn, Chip, Icon } from "./components/ui";

/* ============================================================
   PHYSIX AI — the digital physics laboratory
   ============================================================ */

export type DemoAction =
  | { type: "ask"; q: string }
  | { type: "preset"; label: string }
  | { type: "clearWhatif" }
  | { type: "mode"; mode: string | null }
  | { type: "setVar"; varId: string; value: number };
export type DemoSignal = { nonce: number } & DemoAction;

type View = "home" | "lab" | "real" | "bank" | "notebook";

export default function App() {
  const [view, setView] = useState<View>("home");
  const [lab, setLab] = useState("mech");
  const [ws, setWs] = useState<{ solved: Solved; parse: ParseResult } | null>(null);
  const [clarify, setClarify] = useState<string | null>(null);
  const [detected, setDetected] = useState<{ object: string; concepts: string[]; note: string } | null>(null);
  const [signal, setSignal] = useState<DemoSignal | null>(null);
  const [hc, setHc] = useState(() => localStorage.getItem("physix.hc") === "1");
  const lang = useLang();
  const muted = useMuted();

  const [demo, setDemo] = useState<{ on: boolean; paused: boolean; caption: string; step: number; total: number }>({
    on: false, paused: false, caption: "", step: 0, total: 10,
  });
  const cancelRef = useRef(false);
  const pauseRef = useRef(false);

  useEffect(() => {
    document.body.classList.toggle("hc", hc);
    localStorage.setItem("physix.hc", hc ? "1" : "0");
  }, [hc]);

  /* shareable experiment links */
  useEffect(() => {
    const h = location.hash.match(/#x=(.+)/);
    if (!h) return;
    const data = dec<{ c: ConceptId; v: Record<string, number>; q: string }>(h[1]);
    if (!data || !CONCEPTS[data.c]) return;
    const values: ParseResult["values"] = {};
    for (const vd of CONCEPTS[data.c].vars) {
      if (data.v[vd.id] !== undefined) values[vd.id] = { v: data.v[vd.id], unit: vd.unit, assumed: false };
    }
    setWs({ solved: buildSolved(data.c, values, data.q || CONCEPTS[data.c].name), parse: { concept: data.c, values, clarify: [], raw: data.q || "" } });
  }, []);

  const ask = (q: string) => {
    setClarify(null);
    /* camera physics: "What physics is in a …?" or a bare object name */
    const objMatch =
      q.match(/what physics is in an?\s+(.+?)\??$/i) ||
      (Object.keys(IMAGE_OBJECTS).some((k) => k.toLowerCase() === q.trim().toLowerCase()) ? [q, q] : null);
    if (objMatch) {
      const key = Object.keys(IMAGE_OBJECTS).find((k) => k.toLowerCase() === objMatch[1].trim().toLowerCase());
      if (key) {
        const entry = IMAGE_OBJECTS[key];
        setDetected({ object: key, concepts: entry.concepts, note: entry.note });
        const s = buildSolved(entry.sim, undefined, `The physics inside a ${key.toLowerCase()} — ${entry.note}`);
        setWs({ solved: s, parse: { concept: entry.sim, values: {}, clarify: [], raw: q } });
        sfx.switchOn();
        return;
      }
    }
    setDetected(null);
    const { solved, parse } = solveQuestion(q);
    if (solved) {
      setWs({ solved, parse });
      profile.recordSolved(solved.topic, solved.conceptName);
    } else if (parse.special) {
      const s = buildSolved("freefall", parse.values, q);
      setWs({ solved: s, parse });
    } else {
      setClarify(q);
      sfx.buzz();
      setView("home");
      setWs(null);
    }
  };

  const openLab = (id: string) => {
    setWs(null); setClarify(null); setDetected(null);
    if (id === "__bank") { setView("bank"); return; }
    if (id === "__real") { setView("real"); return; }
    setLab(id); setView("lab");
  };

  /* ---------------- expo mode ---------------- */
  const emit = (a: DemoAction) => setSignal((s) => ({ ...a, nonce: (s?.nonce || 0) + 1 }));
  const sleep = async (ms: number) => {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      if (cancelRef.current) throw new Error("cancel");
      if (pauseRef.current) await new Promise((r) => setTimeout(r, 180));
      else await new Promise((r) => setTimeout(r, 60));
    }
  };
  const cap = (caption: string, step: number) => setDemo((d) => ({ ...d, caption, step }));

  const runDemo = async () => {
    cancelRef.current = false; pauseRef.current = false;
    setDemo({ on: true, paused: false, caption: "Calibrating…", step: 0, total: 10 });
    setWs(null); setView("home");
    try {
      cap("01 · Asking the lab — “Why does the Moon stay in orbit?”", 1); await sleep(1600);
      ask("Why does the Moon stay in orbit?");
      cap("02 · Understanding — topic, concept, type, level, variables", 2); await sleep(3400);
      cap("03 · The solver walks: GIVEN → FORMULA → CALCULATE → RESULT", 3); await sleep(3800);
      cap("04 · The orbital chamber — gravity and velocity vectors live", 4); await sleep(3200);
      cap("05 · WHAT IF gravity disappeared? → Newton's first law, a straight line", 5);
      emit({ type: "preset", label: "Gravity disappears (g→0)" }); await sleep(4600);
      emit({ type: "clearWhatif" });
      cap("06 · WHAT IF velocity dropped to 70%? → the orbit decays", 6);
      emit({ type: "preset", label: "Speed × 0.7" }); await sleep(4400);
      emit({ type: "clearWhatif" });
      cap("07 · Explain like I'm 10 — the falling-with-style picture", 7);
      emit({ type: "mode", mode: "eli10" }); await sleep(4000);
      emit({ type: "mode", mode: null });
      cap("08 · A numerical problem — KE of 2 kg at 10 m/s, solved stepwise", 8);
      ask("Calculate the kinetic energy of a 2 kg object moving at 10 m/s."); await sleep(4200);
      cap("09 · Doubling velocity on the live slider — KE quadruples (v²)", 9);
      emit({ type: "setVar", varId: "v", value: 20 }); await sleep(4200);
      cap("10 · AI explains · Math calculates · Simulation demonstrates · Experiment verifies", 10);
      await sleep(4600);
      setDemo({ on: false, paused: false, caption: "", step: 0, total: 10 });
    } catch {
      setDemo({ on: false, paused: false, caption: "", step: 0, total: 10 });
    }
  };

  return (
    <div className="lab-bg min-h-full">
      {/* ---------------- top bar ---------------- */}
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-[rgba(244,242,234,0.94)] backdrop-blur-[2px]">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between gap-3 px-4 lg:px-6">
          <button type="button" className="flex cursor-pointer items-center gap-2.5" onClick={() => { setWs(null); setClarify(null); setView("home"); }}>
            <span className="flex h-9 w-9 items-center justify-center border-2 border-ink bg-ink text-paper">
              <Icon name="pendulum" size={20} />
            </span>
            <span className="text-left">
              <span className="block font-display text-[22px] font-extrabold leading-none tracking-wide text-ink">
                PHYSIX <span className="text-motion">AI</span>
              </span>
              <span className="block font-mono text-[8px] uppercase tracking-[0.24em] text-ink3">digital physics laboratory</span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {([["home", t("workbench")], ["lab", t("labs")], ["real", "Real Life"], ["bank", "Textbook"], ["notebook", t("notebook")]] as [View, string][]).map(([v, label]) => (
              <button key={v} type="button"
                onClick={() => { setWs(null); setClarify(null); setView(v); sfx.click(); }}
                className={cx(
                  "btn-press cursor-pointer border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em]",
                  view === v && !ws ? "border-ink bg-ink text-paper" : "border-transparent text-ink2 hover:border-line hover:text-ink",
                  ws && v === "home" && "border-line"
                )}>
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <select value={lang} onChange={(e) => setLang(e.target.value as "en" | "hi" | "hx")} aria-label="Language"
              className="cursor-pointer border border-line bg-panel px-1.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] outline-none">
              <option value="en">EN</option><option value="hi">हिं</option><option value="hx">HX</option>
            </select>
            <button type="button" onClick={() => setHc(!hc)} aria-label="High contrast" title="High contrast"
              className={cx("btn-press h-7 w-7 cursor-pointer border font-mono text-[10px]", hc ? "border-ink bg-ink text-paper" : "border-line text-ink2 hover:border-ink")}>
              HC
            </button>
            <button type="button" onClick={toggleMute} aria-label="Toggle sound" title="Laboratory sound"
              className="btn-press flex h-7 w-7 cursor-pointer items-center justify-center border border-line text-ink2 hover:border-ink hover:text-ink">
              <Icon name={muted ? "mute" : "sound"} size={14} />
            </button>
            <Btn kind="ink" onClick={() => (demo.on ? undefined : runDemo())} className="hidden sm:inline-flex">
              <Icon name="demo" size={13} /> {t("demo")}
            </Btn>
          </div>
        </div>
        <div className="ruler-x h-[6px] w-full opacity-60" />
      </header>

      {/* ---------------- content ---------------- */}
      <main className="min-h-[calc(100vh-120px)]">
        {clarify && (
          <div className="mx-auto max-w-[860px] px-4 pt-5">
            <div className="tick-corners border border-warn bg-panel p-4">
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-warn">
                <Icon name="alert" size={13} /> Concept not confidently identified
              </p>
              <p className="mt-2 text-[13.5px] text-ink">
                The lab read “<em>{clarify}</em>” but won't guess an equation. Sharpen it with a concept or numbers — or pick a specimen:
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {CLARIFY_CHIPS.map((c) => (
                  <Chip key={c.label} onClick={() => ask(c.q)}>{c.label}</Chip>
                ))}
              </div>
            </div>
          </div>
        )}

        {ws && detected && (
          <div className="mx-auto max-w-[1500px] px-4 pt-4 lg:px-6">
            <div className="tick-corners border border-line bg-panel px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-ink2">
                  <Icon name="image" size={11} className="mr-1 inline" />{t("detected")} — {detected.object}
                </span>
                {detected.concepts.map((cn) => <Chip key={cn}>{cn}</Chip>)}
                <span className="ml-auto font-mono text-[8.5px] uppercase tracking-[0.14em] text-warn">{t("estimated")}</span>
              </div>
            </div>
          </div>
        )}

        {ws ? (
          <Workspace key={ws.solved.question + ws.solved.id} solved={ws.solved} parse={ws.parse} onAsk={ask} signal={signal} />
        ) : view === "home" ? (
          <LabHome onAsk={ask} onOpenLab={openLab} />
        ) : view === "real" ? (
          <RealLife onSolve={(solved, parse) => { setClarify(null); setDetected(null); setWs({ solved, parse }); }} />
        ) : view === "bank" ? (
          <TextbookBank onSolve={(solved, parse) => { setClarify(null); setDetected(null); setWs({ solved, parse }); }} />
        ) : view === "lab" ? (
          <div>
            <div className="border-b border-line bg-panel2">
              <div className="mx-auto flex max-w-[1400px] flex-wrap gap-1 px-4 py-2 lg:px-6">
                {[["mech", "Mechanics"], ["elec", "Electricity"], ["waves", "Waves"], ["optics", "Optics"], ["thermo", "Thermo"], ["astro", "Astro"]].map(([id, name]) => (
                  <Chip key={id} active={lab === id} onClick={() => { setLab(id); sfx.click(); }}>{name}</Chip>
                ))}
              </div>
            </div>
            <LabsView lab={lab} onRun={(solved, parse) => { setWs({ solved, parse }); window.scrollTo({ top: 0 }); }} />
          </div>
        ) : (
          <NotebookView />
        )}
      </main>

      {view === "home" && !ws && !clarify && <HomeFootnote />}

      {/* ---------------- expo control bar ---------------- */}
      {demo.on && (
        <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <div className="tick-corners w-full max-w-[720px] border-2 border-ink bg-panel shadow-[4px_4px_0_rgba(34,40,47,0.3)]">
            <div className="flex items-center gap-3 px-4 py-2.5">
              <span className="anim-blink h-2 w-2 shrink-0 rounded-full bg-force" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink">{demo.caption}</p>
                <div className="mt-1.5 h-1 w-full bg-panel2">
                  <div className="h-full bg-ink transition-all duration-500" style={{ width: `${(demo.step / demo.total) * 100}%` }} />
                </div>
              </div>
              <button type="button" onClick={() => { pauseRef.current = !pauseRef.current; setDemo((d) => ({ ...d, paused: !d.paused })); sfx.click(); }}
                className="btn-press flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border border-ink">
                <Icon name={demo.paused ? "play" : "pause"} size={13} />
              </button>
              <Btn kind="danger" onClick={() => { cancelRef.current = true; }}>Take control</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
