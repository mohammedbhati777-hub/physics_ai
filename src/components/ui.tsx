import { useEffect, useRef, useState, type ReactNode } from "react";
import { cx, fmt, sfx, t, useAnimatedNumber } from "../lib/labkit";
import { IMAGE_OBJECTS } from "../physics/core";

/* ---------------- icons (hand-drawn inline SVG) ---------------- */
export function Icon({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  const s = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className };
  switch (name) {
    case "pendulum": return (<svg {...s}><circle cx="12" cy="4" r="2" fill="currentColor" stroke="none" /><line x1="12" y1="4" x2="17" y2="16" /><circle cx="17" cy="16" r="3.4" /><path d="M5 20c4-2 10-2 14 0" opacity="0.5" /></svg>);
    case "play": return (<svg {...s}><path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none" /></svg>);
    case "pause": return (<svg {...s}><rect x="6" y="4.5" width="4" height="15" fill="currentColor" stroke="none" /><rect x="14" y="4.5" width="4" height="15" fill="currentColor" stroke="none" /></svg>);
    case "reset": return (<svg {...s}><path d="M4 10a8 8 0 1 1 2 6" /><path d="M4 4v6h6" /></svg>);
    case "mic": return (<svg {...s}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>);
    case "image": return (<svg {...s}><rect x="3" y="4" width="18" height="16" rx="1" /><circle cx="9" cy="10" r="2" /><path d="M3 17l5-4 4 3 4-4 5 4" /></svg>);
    case "flask": return (<svg {...s}><path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3" /><path d="M7.5 15h9" /></svg>);
    case "bolt": return (<svg {...s}><path d="M13 2 5 13h6l-1 9 9-12h-6z" /></svg>);
    case "wave": return (<svg {...s}><path d="M2 12c2.5-6 5-6 7.5 0s5 6 7.5 0 3-4.5 5-3" /></svg>);
    case "lens": return (<svg {...s}><ellipse cx="12" cy="12" rx="5" ry="9" /><path d="M2 12h4M18 12h4" /></svg>);
    case "thermo": return (<svg {...s}><path d="M10 4a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0z" /><circle cx="12" cy="17" r="1.6" fill="currentColor" stroke="none" /></svg>);
    case "orbit": return (<svg {...s}><circle cx="12" cy="12" r="3.2" /><ellipse cx="12" cy="12" rx="10" ry="4.5" /><circle cx="21" cy="9.5" r="1.4" fill="currentColor" stroke="none" /></svg>);
    case "book": return (<svg {...s}><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17.5H6.5A2.5 2.5 0 0 0 4 22z" /><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /></svg>);
    case "share": return (<svg {...s}><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.3 10.8 15.7 7M8.3 13.2l7.4 3.6" /></svg>);
    case "save": return (<svg {...s}><path d="M5 3h11l3 3v15H5z" /><path d="M8 3v5h7V3M8 21v-7h8v7" /></svg>);
    case "sound": return (<svg {...s}><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>);
    case "mute": return (<svg {...s}><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M17 9l5 6M22 9l-5 6" /></svg>);
    case "check": return (<svg {...s}><path d="M4 12.5 9.5 18 20 6.5" /></svg>);
    case "x": return (<svg {...s}><path d="M6 6l12 12M18 6L6 18" /></svg>);
    case "alert": return (<svg {...s}><path d="M12 3 1.8 20.5h20.4z" /><path d="M12 10v5" /><circle cx="12" cy="17.8" r="0.4" fill="currentColor" /></svg>);
    case "arrow": return (<svg {...s}><path d="M4 12h15M13 6l6 6-6 6" /></svg>);
    case "ruler": return (<svg {...s}><rect x="2" y="9" width="20" height="6" /><path d="M6 9v3M10 9v3M14 9v3M18 9v3" /></svg>);
    case "demo": return (<svg {...s}><rect x="3" y="4" width="18" height="12" /><path d="M8 20h8M12 16v4M8 8l3 2-3 2M13 12h4" /></svg>);
    case "download": return (<svg {...s}><path d="M12 3v12M7 10l5 5 5-5M4 20h16" /></svg>);
    case "sigma": return (<svg {...s}><path d="M18 5H6l6 7-6 7h12" /></svg>);
    case "target": return (<svg {...s}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.8" fill="currentColor" /></svg>);
    case "grid": return (<svg {...s}><rect x="3" y="3" width="18" height="18" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></svg>);
    case "magnet": return (<svg {...s}><path d="M5 4v7a7 7 0 0 0 14 0V4h-4v7a3 3 0 0 1-6 0V4z" /><path d="M5 8h4M15 8h4" /></svg>);
    default: return null;
  }
}

/* ---------------- panels ---------------- */
export function Panel({ label, right, children, className, tone }: { label?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; tone?: "ink" | "paper" | "stage" }) {
  return (
    <section
      className={cx(
        "tick-corners border border-line bg-panel",
        tone === "paper" && "bg-panel2",
        className
      )}
    >
      {(label || right) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-3 py-1.5">
          <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ink2">{label}</div>
          {right && <div className="flex items-center gap-2">{right}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Tag({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-line bg-panel px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
      {color && <span className="h-1.5 w-1.5" style={{ background: color }} />}
      {children}
    </span>
  );
}

/* ---------------- buttons ---------------- */
export function Btn({ children, onClick, kind = "line", className, title, disabled, ariaLabel }: {
  children: ReactNode; onClick?: () => void; kind?: "ink" | "line" | "ghost" | "danger"; className?: string; title?: string; disabled?: boolean; ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "btn-press inline-flex cursor-pointer items-center gap-1.5 border px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        kind === "ink" && "border-ink bg-ink text-paper shadow-[2px_2px_0_rgba(34,40,47,0.25)] hover:bg-[#333b45]",
        kind === "line" && "border-line bg-panel text-ink hover:border-ink",
        kind === "ghost" && "border-transparent bg-transparent text-ink2 hover:text-ink",
        kind === "danger" && "border-forcelt bg-panel text-force hover:border-force",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Chip({ active, onClick, children, color }: { active?: boolean; onClick?: () => void; children: ReactNode; color?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "btn-press cursor-pointer border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.1em] transition-colors",
        active ? "border-ink bg-ink text-paper" : "border-line bg-panel text-ink2 hover:border-ink hover:text-ink"
      )}
    >
      {color && !active && <span className="mr-1.5 inline-block h-1.5 w-1.5 align-middle" style={{ background: color }} />}
      {children}
    </button>
  );
}

/* ---------------- tactile slider ---------------- */
export function TactSlider({ sym, name, unit, min, max, step, value, onChange, color }: {
  sym: string; name: string; unit: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void; color?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const lastTick = useRef(0);
  return (
    <div className="group">
      <div className="mb-0.5 flex items-baseline justify-between">
        <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
          <span className="italic" style={{ color: color || "var(--color-ink)" }}>{sym}</span>
          <span className="ml-1.5 normal-case tracking-normal">{name}</span>
        </label>
        <output className="font-mono text-[12px] font-semibold text-ink">
          {fmt(value)} <span className="text-ink3">{unit}</span>
        </output>
      </div>
      <input
        type="range"
        className="tact"
        aria-label={`${name} (${unit})`}
        min={min} max={max} step={step} value={value}
        style={{ "--fill": pct + "%", "--track-fill": color || "var(--color-ink)" } as React.CSSProperties}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onPointerUp={() => { if (performance.now() - lastTick.current > 120) { sfx.tick(); lastTick.current = performance.now(); } }}
      />
      <div className="flex justify-between font-mono text-[9px] text-ink3">
        <span>{min}</span>
        <span className="opacity-60">·</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

/* ---------------- animated readout ---------------- */
export function ReadOut({ label, value, unit, color, big }: { label: string; value: number; unit: string; color?: string; big?: boolean }) {
  const v = useAnimatedNumber(value);
  return (
    <div className="border border-line bg-panel px-2.5 py-1.5">
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink3">{label}</div>
      <div className={cx("font-mono font-semibold tabular-nums", big ? "text-2xl" : "text-[15px]")} style={{ color: color || "var(--color-ink)" }}>
        {fmt(v)} <span className="text-[10px] font-normal text-ink3">{unit}</span>
      </div>
    </div>
  );
}

export function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => { onClick(); sfx.click(); }}
      aria-pressed={on}
      className={cx(
        "btn-press flex cursor-pointer items-center gap-1.5 border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]",
        on ? "border-ink bg-ink text-paper" : "border-stageline bg-transparent text-[#9aa4ae] hover:text-[#d7dde3]"
      )}
    >
      <span className={cx("h-2 w-2 border", on ? "border-paper bg-paper" : "border-stageline")} />
      {label}
    </button>
  );
}

/* ---------------- ASK THE LAB ---------------- */
export function AskBar({ onSubmit, compact, onOpenObject }: { onSubmit: (q: string) => void; compact?: boolean; onOpenObject?: (o: string) => void }) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"text" | "voice" | "image">("text");
  const [listening, setListening] = useState(false);
  const [objOpen, setObjOpen] = useState(false);
  const recRef = useRef<{ stop: () => void } | null>(null);

  const submit = (q: string) => {
    const s = q.trim();
    if (!s) return;
    sfx.switchOn();
    onSubmit(s);
    setText("");
  };

  const startVoice = () => {
    const SR = (window as unknown as { webkitSpeechRecognition?: new () => { lang: string; onresult: (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void; onend: () => void; start: () => void; stop: () => void } }).webkitSpeechRecognition;
    if (!SR) {
      submit("Explain why astronauts appear weightless.");
      return;
    }
    const r = new SR();
    recRef.current = r;
    r.lang = "en-US";
    setListening(true);
    sfx.tick();
    r.onresult = (e) => setText(e.results[0][0].transcript);
    r.onend = () => { setListening(false); sfx.tick(); };
    r.start();
  };

  useEffect(() => () => recRef.current?.stop(), []);

  return (
    <div className={cx("border border-ink bg-panel", compact ? "" : "tick-corners")}>
      <div className="flex items-center justify-between border-b border-line px-3 py-1">
        <div className="flex items-center gap-2">
          <Icon name="flask" size={13} className="text-ink2" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ink">{t("askTitle")}</span>
        </div>
        <div className="flex items-center gap-1">
          {(["text", "voice", "image"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); sfx.click(); if (m === "voice") startVoice(); if (m === "image") setObjOpen(true); }}
              aria-label={`${m} input`}
              className={cx(
                "btn-press cursor-pointer border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em]",
                mode === m ? "border-ink bg-ink text-paper" : "border-transparent text-ink2 hover:text-ink",
                m === "voice" && listening && "anim-blink border-force text-force"
              )}
            >
              {m === "text" ? "TEXT" : m === "voice" ? (listening ? "LISTENING…" : "VOICE") : "IMAGE"}
            </button>
          ))}
        </div>
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); submit(text); }}
        className={cx("flex items-stretch", compact ? "h-10" : "h-14")}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("askPlaceholder")}
          aria-label="Physics question"
          className={cx(
            "min-w-0 flex-1 bg-transparent px-4 font-body text-ink outline-none placeholder:text-ink3",
            compact ? "text-sm" : "text-[17px]"
          )}
        />
        <button
          type="submit"
          className="btn-press flex cursor-pointer items-center gap-2 border-l border-ink bg-ink px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-paper hover:bg-[#333b45]"
        >
          {t("run")} <Icon name="arrow" size={13} />
        </button>
      </form>
      {objOpen && (
        <div className="border-t border-line bg-panel2 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
              Camera physics — select the object in frame
            </span>
            <Btn kind="ghost" onClick={() => setObjOpen(false)} ariaLabel="close">✕</Btn>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(IMAGE_OBJECTS).map((o) => (
              <Chip key={o} onClick={() => { setObjOpen(false); (onOpenObject || onSubmit)(o); }}>
                {o}
              </Chip>
            ))}
          </div>
          <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.1em] text-warn">
            {t("estimated")}
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------------- simulation shell ---------------- */
export function SimShell({ fig, title, footnote, right, children, h = "h-[380px]" }: {
  fig: string; title: string; footnote?: string; right?: ReactNode; children: ReactNode; h?: string;
}) {
  return (
    <Panel
      label={<span>{fig} — {title}</span>}
      right={right}
      className="overflow-hidden"
    >
      <div className="ruler-x h-[7px] w-full border-b border-stageline" style={{ background: "#1b2026" }} />
      <div className={cx("stage-frame relative w-full overflow-hidden", h)} style={{ background: "var(--color-stage)" }}>
        {children}
      </div>
      {footnote && (
        <div className="flex items-start gap-2 border-t border-line bg-panel2 px-3 py-1.5">
          <Icon name="alert" size={11} className="mt-0.5 shrink-0 text-warn" />
          <p className="font-mono text-[9.5px] leading-relaxed uppercase tracking-[0.08em] text-ink2">
            <span className="text-warn">{t("model")}: </span>{footnote}
          </p>
        </div>
      )}
    </Panel>
  );
}

export function CtlBtn({ onClick, label, icon, active, title }: { onClick: () => void; label?: string; icon: string; active?: boolean; title?: string }) {
  return (
    <button
      type="button"
      onClick={() => { onClick(); sfx.click(); }}
      title={title || label}
      aria-label={title || label || icon}
      className={cx(
        "btn-press flex h-7 w-7 cursor-pointer items-center justify-center border",
        active ? "border-paper bg-paper text-stage" : "border-stageline text-[#c3cad1] hover:border-[#8b98a5] hover:text-white"
      )}
    >
      <Icon name={icon} size={13} />
    </button>
  );
}

export function useHoverPos(ref: React.RefObject<HTMLDivElement | null>) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
    };
    const leave = () => setPos(null);
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    return () => { el.removeEventListener("mousemove", move); el.removeEventListener("mouseleave", leave); };
  }, [ref]);
  return pos;
}
