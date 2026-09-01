import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/* ============================================================
   PHYSIX LAB KIT — shared utilities
   ============================================================ */

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

/* ---------------- number formatting ---------------- */
export function fmt(x: number, sig = 4): string {
  if (!isFinite(x)) return "—";
  if (x === 0) return "0";
  const a = Math.abs(x);
  if (a >= 1e6 || a < 1e-3) {
    const e = Math.floor(Math.log10(a));
    const m = x / Math.pow(10, e);
    return `${trim(m.toPrecision(3))}×10^${e}`;
  }
  return trim(x.toPrecision(sig));
}
function trim(s: string): string {
  return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
}
export const fmtFixed = (x: number, d = 2) =>
  isFinite(x) ? x.toFixed(d).replace(/\.?0+$/, "") : "—";

/* ---------------- language store ---------------- */
export type Lang = "en" | "hi" | "hx";
const LS_LANG = "physix.lang";
let lang: Lang = (localStorage.getItem(LS_LANG) as Lang) || "en";
const langSubs = new Set<() => void>();
export const getLang = () => lang;
export function setLang(l: Lang) {
  lang = l;
  localStorage.setItem(LS_LANG, l);
  langSubs.forEach((f) => f());
}
export function useLang(): Lang {
  return useSyncExternalStore(
    (cb) => {
      langSubs.add(cb);
      return () => langSubs.delete(cb);
    },
    () => lang
  );
}

const DICT: Record<string, { en: string; hi: string; hx: string }> = {
  askPlaceholder: {
    en: "Describe any physics problem, concept, experiment or curiosity…",
    hi: "कोई भी भौतिकी प्रश्न, अवधारणा या प्रयोग लिखें…",
    hx: "Koi bhi physics sawaal, concept ya experiment likho…",
  },
  askTitle: { en: "Ask the Lab", hi: "प्रयोगशाला से पूछो", hx: "Lab se poocho" },
  run: { en: "Run", hi: "चलाएँ", hx: "Chalao" },
  workbench: { en: "Workbench", hi: "कार्यबेंच", hx: "Workbench" },
  labs: { en: "Labs", hi: "प्रयोगशालाएँ", hx: "Labs" },
  notebook: { en: "Notebook", hi: "नोटबुक", hx: "Notebook" },
  profile: { en: "Physics Profile", hi: "भौतिकी प्रोफ़ाइल", hx: "Physics Profile" },
  given: { en: "Given", hi: "दिया गया", hx: "Diya gaya" },
  find: { en: "Find", hi: "ज्ञात करें", hx: "Dhundo" },
  formula: { en: "Formula", hi: "सूत्र", hx: "Formula" },
  substitute: { en: "Substitute", hi: "मान रखें", hx: "Values daalo" },
  calculate: { en: "Calculate", hi: "गणना", hx: "Calculate" },
  result: { en: "Result", hi: "परिणाम", hx: "Result" },
  meaning: { en: "Physical Meaning", hi: "भौतिक अर्थ", hx: "Physical Meaning" },
  why: { en: "Why?", hi: "क्यों?", hx: "Kyun?" },
  eli10: { en: "Explain Like I'm 10", hi: "आसान भाषा में", hx: "Simple mein samjhao" },
  teach: { en: "Teach Me", hi: "सिखाओ", hx: "Sikhao" },
  socratic: { en: "Socratic Tutor", hi: "सोक्रेटिक मार्गदर्शक", hx: "Socratic Tutor" },
  whatif: { en: "What If?", hi: "क्या होगा अगर…?", hx: "What If?" },
  save: { en: "Save to Notebook", hi: "नोटबुक में सेव करें", hx: "Notebook mein save karo" },
  share: { en: "Share", hi: "साझा करें", hx: "Share karo" },
  variables: { en: "Variables", hi: "चर", hx: "Variables" },
  start: { en: "Start", hi: "शुरू", hx: "Shuru" },
  pause: { en: "Pause", hi: "रोकें", hx: "Roko" },
  reset: { en: "Reset", hi: "रीसेट", hx: "Reset" },
  demo: { en: "Expo Mode", hi: "एक्सपो मोड", hx: "Expo Mode" },
  tagline: {
    en: "Ask Physics. See Physics. Experiment With Physics.",
    hi: "भौतिकी पूछें। भौतिकी देखें। भौतिकी के साथ प्रयोग करें।",
    hx: "Physics poocho. Physics dekho. Physics ke saath experiment karo.",
  },
  model: { en: "Model", hi: "मॉडल", hx: "Model" },
  detected: { en: "Detected Physics", hi: "पहचानी गई भौतिकी", hx: "Detected Physics" },
  estimated: {
    en: "ESTIMATED — inferred, not measured",
    hi: "अनुमानित — मापा नहीं गया",
    hx: "ESTIMATED — infer kiya gaya, measure nahi",
  },
};
export function t(key: string): string {
  const row = DICT[key];
  if (!row) return key;
  return row[lang] || row.en;
}

/* ---------------- sound design (subtle laboratory) ---------------- */
let audio: AudioContext | null = null;
let muted = localStorage.getItem("physix.mute") === "1";
const muteSubs = new Set<() => void>();
export const isMuted = () => muted;
export function toggleMute() {
  muted = !muted;
  localStorage.setItem("physix.mute", muted ? "1" : "0");
  muteSubs.forEach((f) => f());
}
export function useMuted() {
  return useSyncExternalStore(
    (cb) => {
      muteSubs.add(cb);
      return () => muteSubs.delete(cb);
    },
    () => muted
  );
}
function ctx(): AudioContext | null {
  try {
    if (!audio) audio = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    return audio;
  } catch {
    return null;
  }
}
function blip(freq: number, dur: number, type: OscillatorType, gain: number, when = 0) {
  if (muted) return;
  const a = ctx();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, a.currentTime + when);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + when + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + when + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + when);
  o.stop(a.currentTime + when + dur + 0.05);
}
export const sfx = {
  click: () => blip(1150, 0.05, "square", 0.025),
  tick: () => blip(720, 0.04, "triangle", 0.03),
  switchOn: () => {
    blip(520, 0.06, "square", 0.028);
    blip(880, 0.07, "square", 0.022, 0.05);
  },
  chime: () => {
    blip(660, 0.16, "sine", 0.05);
    blip(990, 0.22, "sine", 0.04, 0.09);
  },
  buzz: () => blip(160, 0.18, "sawtooth", 0.035),
  sweep: () => blip(340, 0.12, "sine", 0.03),
};

/* ---------------- learning analytics store ---------------- */
export interface ProfileData {
  solved: Record<string, number>;
  experiments: number;
  quiz: Record<string, { ok: number; total: number }>;
  mistakes: number;
  debates: string[];
  recent: string[];
}
const emptyProfile: ProfileData = {
  solved: {},
  experiments: 0,
  quiz: {},
  mistakes: 0,
  debates: [],
  recent: [],
};
function readProfile(): ProfileData {
  try {
    const raw = localStorage.getItem("physix.profile");
    if (raw) return { ...emptyProfile, ...(JSON.parse(raw) as ProfileData) };
  } catch {
    /* ignore */
  }
  return { ...emptyProfile };
}
const profSubs = new Set<() => void>();
export const profile = {
  data: readProfile(),
  save() {
    localStorage.setItem("physix.profile", JSON.stringify(this.data));
    profSubs.forEach((f) => f());
  },
  recordSolved(topic: string, label: string) {
    this.data.solved[topic] = (this.data.solved[topic] || 0) + 1;
    this.data.recent = [label, ...this.data.recent].slice(0, 8);
    this.save();
  },
  recordExperiment() {
    this.data.experiments += 1;
    this.save();
  },
  recordQuiz(topic: string, ok: boolean) {
    const q = this.data.quiz[topic] || { ok: 0, total: 0 };
    q.total += 1;
    if (ok) q.ok += 1;
    this.data.quiz[topic] = q;
    this.save();
  },
  recordMistake() {
    this.data.mistakes += 1;
    this.save();
  },
  recordDebate(claim: string) {
    this.data.debates = [claim, ...this.data.debates].slice(0, 5);
    this.save();
  },
  reset() {
    this.data = { ...emptyProfile };
    this.save();
  },
};
export function useProfile() {
  return useSyncExternalStore((cb) => {
    profSubs.add(cb);
    return () => profSubs.delete(cb);
  }, () => profile.data);
}
export function masteryPct(p: ProfileData, topic: string): number {
  const q = p.quiz[topic];
  const s = p.solved[topic] || 0;
  if (!q && s === 0) return 0;
  const quizPct = q ? (q.ok / q.total) * 100 : 0;
  return Math.min(100, Math.round(quizPct * 0.6 + Math.min(s, 10) * 4));
}

/* ---------------- notebook store ---------------- */
export interface NotebookEntry {
  id: string;
  ts: number;
  question: string;
  concept: string;
  topic: string;
  formula: string;
  result: string;
  note?: string;
}
export function readNotebook(): NotebookEntry[] {
  try {
    return JSON.parse(localStorage.getItem("physix.notebook") || "[]") as NotebookEntry[];
  } catch {
    return [];
  }
}
export function writeNotebook(entries: NotebookEntry[]) {
  localStorage.setItem("physix.notebook", JSON.stringify(entries));
}

/* ---------------- live data buffer (sim → graph) ---------------- */
export class LiveBuffer {
  t: number[] = [];
  a: number[] = [];
  b: number[] = [];
  max: number;
  constructor(max = 900) {
    this.max = max;
  }
  push(t: number, a: number, b = 0) {
    this.t.push(t);
    this.a.push(a);
    this.b.push(b);
    if (this.t.length > this.max) {
      this.t.shift();
      this.a.shift();
      this.b.shift();
    }
  }
  clear() {
    this.t = [];
    this.a = [];
    this.b = [];
  }
}

/* ---------------- hooks ---------------- */
export function useAnimatedNumber(target: number, speed = 0.18): number {
  const [val, setVal] = useState(target);
  const ref = useRef(target);
  useEffect(() => {
    let raf = 0;
    const step = () => {
      const d = target - ref.current;
      if (Math.abs(d) < Math.max(1e-4, Math.abs(target) * 1e-4)) {
        ref.current = target;
        setVal(target);
        return;
      }
      ref.current += d * speed;
      setVal(ref.current);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, speed]);
  return val;
}

export function useReducedMotion(): boolean {
  const [r, setR] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const f = () => setR(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return r;
}

/** canvas + rAF plumbing with DPR scaling */
export function useStageCanvas(
  draw: (c: CanvasRenderingContext2D, w: number, h: number, t: number) => void
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const c = cv.getContext("2d");
    if (!c) return;
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      const parent = cv.parentElement;
      if (parent) {
        const r = parent.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const W = Math.max(10, Math.floor(r.width));
        const H = Math.max(10, Math.floor(r.height));
        if (cv.width !== W * dpr || cv.height !== H * dpr) {
          cv.width = W * dpr;
          cv.height = H * dpr;
          cv.style.width = W + "px";
          cv.style.height = H + "px";
        }
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawRef.current(c, W, H, (now - t0) / 1000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return canvasRef;
}

/* ---------------- misc ---------------- */
export function download(name: string, text: string, mime = "text/plain") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
export const enc = (o: unknown) => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
export const dec = <T,>(s: string): T | null => {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(s)))) as T;
  } catch {
    return null;
  }
};
export const uid = () => Math.random().toString(36).slice(2, 9);
