import { useEffect, useState } from "react";
import {
  cx, download, fmt, masteryPct, profile, readNotebook, t, useProfile, writeNotebook,
} from "../lib/labkit";
import type { NotebookEntry } from "../lib/labkit";
import { Btn, Icon, Panel, Tag } from "./ui";

/* ============================================================
   RESEARCH NOTEBOOK + PHYSICS PROFILE
   ============================================================ */

export function NotebookView() {
  const [entries, setEntries] = useState<NotebookEntry[]>(() => readNotebook());
  useEffect(() => {
    const f = () => setEntries(readNotebook());
    window.addEventListener("physix-notebook", f);
    return () => window.removeEventListener("physix-notebook", f);
  }, []);

  const remove = (id: string) => {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    writeNotebook(next);
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-6 lg:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink3">Laboratory records</p>
          <h2 className="font-display text-[42px] font-bold leading-none text-ink">{t("notebook")}</h2>
        </div>
        <div className="flex gap-2">
          <Btn onClick={() => download("physix-notebook.json", JSON.stringify(entries, null, 2), "application/json")} kind="line">
            <Icon name="download" size={12} /> JSON
          </Btn>
          <Btn onClick={() => download("physix-notebook.txt", entries.map((e, i) => `${i + 1}. [${new Date(e.ts).toLocaleString()}]\n   Q: ${e.question}\n   ${e.formula}\n   ${e.result} — ${e.concept}`).join("\n\n"))} kind="line">
            <Icon name="download" size={12} /> TXT
          </Btn>
        </div>
      </header>

      {entries.length === 0 ? (
        <div className="notebook-rule mt-6 border border-line bg-panel p-10 text-center">
          <Icon name="book" size={30} className="mx-auto text-ink3" />
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink3">
            No experiments saved yet — solve something on the workbench and press “Save to Notebook”.
          </p>
        </div>
      ) : (
        <div className="notebook-rule mt-6 grid gap-3 md:grid-cols-2">
          {entries.map((e, i) => (
            <article key={e.id} className="anim-rise border border-line bg-panel p-4" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink3">
                  Exp. {String(entries.length - i).padStart(3, "0")} · {new Date(e.ts).toLocaleDateString()} {new Date(e.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <button className="cursor-pointer text-ink3 hover:text-force" onClick={() => remove(e.id)} aria-label="Delete entry">
                  <Icon name="x" size={12} />
                </button>
              </div>
              <p className="mt-2 text-[13.5px] font-medium leading-snug text-ink">{e.question}</p>
              <p className="mt-2 font-mono text-[12px] italic text-motion">{e.formula}</p>
              <p className="mt-1 font-mono text-[13px] font-semibold text-energy">{e.result}</p>
              <div className="mt-2 flex gap-1.5">
                <Tag color="var(--color-motion)">{e.topic}</Tag>
                <Tag>{e.concept}</Tag>
              </div>
            </article>
          ))}
        </div>
      )}

      <ProfilePanel />
    </div>
  );
}

/* ---------------- physics profile ---------------- */
const TOPICS = ["Mechanics", "Electricity", "Waves", "Optics", "Thermodynamics", "Astrophysics"];
const TOPIC_COLORS: Record<string, string> = {
  Mechanics: "var(--color-motion)",
  Electricity: "var(--color-energy)",
  Waves: "var(--color-field)",
  Optics: "var(--color-warn)",
  Thermodynamics: "var(--color-force)",
  Astrophysics: "var(--color-motion)",
};

export function ProfilePanel() {
  const p = useProfile();
  const scores = TOPICS.map((tp) => ({ tp, pct: masteryPct(p, tp) }));
  const weakest = [...scores].filter((s) => s.pct > 0).sort((a, b) => a.pct - b.pct)[0];
  const untried = scores.find((s) => s.pct === 0);
  const totalSolved = Object.values(p.solved).reduce((a, b) => a + b, 0);
  const quizTotals = Object.values(p.quiz).reduce((acc, q) => ({ ok: acc.ok + q.ok, total: acc.total + q.total }), { ok: 0, total: 0 });

  return (
    <div className="mt-10">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink3">Learning analytics — stored locally, private to this bench</p>
      <h3 className="mt-1 font-display text-[30px] font-bold text-ink">{t("profile")}</h3>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <Panel label={<span>Mastery by branch</span>}>
          <div className="space-y-3 p-4">
            {scores.map(({ tp, pct }) => (
              <div key={tp}>
                <div className="mb-1 flex justify-between font-mono text-[10.5px] uppercase tracking-[0.14em]">
                  <span className="text-ink2">{tp}</span>
                  <span className="font-semibold text-ink">{pct}%</span>
                </div>
                <div className="h-2.5 border border-line bg-panel2">
                  <div className="h-full transition-all duration-700" style={{ width: pct + "%", background: TOPIC_COLORS[tp] }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel label={<span>Lab statistics</span>}>
            <div className="grid grid-cols-2 gap-2 p-3">
              {[
                ["Solved", String(totalSolved)],
                ["Experiments", String(p.experiments)],
                ["Quiz accuracy", quizTotals.total ? Math.round((quizTotals.ok / quizTotals.total) * 100) + "%" : "—"],
                ["Mistakes caught", String(p.mistakes)],
              ].map(([l, v]) => (
                <div key={l} className="border border-line bg-panel2 px-2.5 py-2">
                  <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-ink3">{l}</p>
                  <p className="font-display text-[24px] font-bold text-ink">{v}</p>
                </div>
              ))}
            </div>
          </Panel>
          <Panel label={<span>AI recommendation</span>}>
            <p className="p-3 text-[12.5px] leading-relaxed text-ink2">
              {weakest
                ? <>Your thinnest evidence is in <strong className="text-ink">{weakest.tp}</strong> ({weakest.pct}%). Run one experiment there, then take its quiz — the profile updates live.</>
                : untried
                  ? <>You haven't touched <strong className="text-ink">{untried.tp}</strong> yet. Curiosity first: ask one question about it on the workbench.</>
                  : <>Fresh bench — ask a question like “Calculate the kinetic energy of a 2 kg object at 10 m/s” to start building your profile.</>}
            </p>
          </Panel>
          {p.recent.length > 0 && (
            <Panel label={<span>Recent on this bench</span>}>
              <ul className="space-y-1 p-3">
                {p.recent.map((r, i) => (
                  <li key={i} className={cx("font-mono text-[10px] text-ink2", i === 0 && "text-ink")}>▸ {r}</li>
                ))}
              </ul>
            </Panel>
          )}
          <Btn kind="danger" onClick={() => { if (confirm("Clear all local learning data?")) profile.reset(); }}>
            Reset local data
          </Btn>
        </div>
      </div>
      <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-ink3">
        Memory note: explanations reference your solved-count history ({fmt(totalSolved)} total) to pace difficulty. Nothing leaves this device.
      </p>
    </div>
  );
}
