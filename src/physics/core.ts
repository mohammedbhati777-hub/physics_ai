import { CONCEPTS } from "./registry";
import type {
  ConceptId,
  Given,
  MistakeReport,
  ParseResult,
  PracticeProblem,
  RealWorldExperiment,
  SanityNote,
  Solved,
  TextbookProblem,
} from "./types";

/* ============================================================
   DETERMINISTIC PHYSICS CORE
   The LLM layer interprets; THIS engine computes. No guesses.
   ============================================================ */

export const EXAMPLES = [
  "Why does the Moon stay in orbit?",
  "Calculate the kinetic energy of a 2 kg object moving at 10 m/s.",
  "A stone is dropped from 20 m. How long does the fall take?",
  "Explain refraction.",
  "What happens if gravity doubles?",
  "A 12 V battery across a 4 Ω resistor — find the current.",
  "Find the period of a 1 m pendulum.",
  "A ball is launched at 20 m/s at 45°. Find its range.",
];

export const CLARIFY_CHIPS: { label: string; q: string }[] = [
  { label: "Kinetic energy", q: "Calculate the kinetic energy of a 2 kg object moving at 10 m/s." },
  { label: "Projectile", q: "A ball is launched at 25 m/s at 40°. Find its range." },
  { label: "Free fall", q: "A stone is dropped from 45 m. Find the fall time and impact speed." },
  { label: "Ohm's law", q: "A 24 V supply drives 3 A through a resistor. Find the resistance." },
  { label: "Pendulum", q: "Find the period of a 2 m pendulum on Earth." },
  { label: "Orbit", q: "Why does the Moon stay in orbit?" },
  { label: "Collision", q: "A 2 kg cart at 6 m/s hits a 3 kg cart at rest, e = 0.8. Find velocities after." },
  { label: "Refraction", q: "Light enters water from air at 40°. Find the refraction angle." },
];

/* ---------------- unit system ---------------- */
const UNIT_SI: Record<string, { kind: string; toSI: number }> = {
  "m/s²": { kind: "acc", toSI: 1 }, "m/s2": { kind: "acc", toSI: 1 }, "ms-2": { kind: "acc", toSI: 1 },
  "m/s": { kind: "vel", toSI: 1 }, "ms-1": { kind: "vel", toSI: 1 },
  "km/h": { kind: "vel", toSI: 1 / 3.6 }, "km/hr": { kind: "vel", toSI: 1 / 3.6 }, "kmph": { kind: "vel", toSI: 1 / 3.6 },
  "N/m": { kind: "k", toSI: 1 },
  "kn": { kind: "force", toSI: 1000 }, "n": { kind: "force", toSI: 1 }, "newton": { kind: "force", toSI: 1 }, "newtons": { kind: "force", toSI: 1 },
  "kg": { kind: "mass", toSI: 1 }, "g": { kind: "mass", toSI: 0.001 }, "mg": { kind: "mass", toSI: 1e-6 },
  "km": { kind: "len", toSI: 1000 }, "m": { kind: "len", toSI: 1 }, "cm": { kind: "len", toSI: 0.01 }, "mm": { kind: "len", toSI: 0.001 },
  "min": { kind: "time", toSI: 60 }, "s": { kind: "time", toSI: 1 },
  "v": { kind: "volt", toSI: 1 }, "kv": { kind: "volt", toSI: 1000 }, "volt": { kind: "volt", toSI: 1 }, "volts": { kind: "volt", toSI: 1 },
  "a": { kind: "curr", toSI: 1 }, "ma": { kind: "curr", toSI: 0.001 }, "amp": { kind: "curr", toSI: 1 }, "amps": { kind: "curr", toSI: 1 },
  "ω": { kind: "res", toSI: 1 }, "ohm": { kind: "res", toSI: 1 }, "ohms": { kind: "res", toSI: 1 },
  "hz": { kind: "freq", toSI: 1 }, "khz": { kind: "freq", toSI: 1000 }, "hertz": { kind: "freq", toSI: 1 },
  "j": { kind: "energy", toSI: 1 }, "kj": { kind: "energy", toSI: 1000 }, "joule": { kind: "energy", toSI: 1 }, "joules": { kind: "energy", toSI: 1 },
  "w": { kind: "power", toSI: 1 }, "kw": { kind: "power", toSI: 1000 },
  "°": { kind: "angle", toSI: 1 }, "deg": { kind: "angle", toSI: 1 }, "degree": { kind: "angle", toSI: 1 }, "degrees": { kind: "angle", toSI: 1 },
  "%": { kind: "pct", toSI: 1 },
};

/** which SI kind maps to which variable ids, per concept */
const KIND_TO_VARS: Record<ConceptId, Record<string, string[]>> = {
  ke: { mass: ["m"], vel: ["v"] },
  pe: { mass: ["m"], len: ["h"], acc: ["g"] },
  freefall: { len: ["h"], acc: ["g"], vel: ["v"] },
  projectile: { vel: ["v0"], angle: ["th"], acc: ["g"] },
  newton2: { force: ["F"], mass: ["m"], acc: ["a"] },
  momentum: { mass: ["m"], vel: ["v"] },
  ohm: { volt: ["V"], res: ["R"], curr: ["I"] },
  pendulum: { len: ["L"], acc: ["g"], angle: ["th0"] },
  spring: { k: ["k"], len: ["x0"], mass: ["m"] },
  collision: { mass: ["m1", "m2"], vel: ["v1", "v2"] },
  wave: { freq: ["f"], len: ["lambda"] },
  orbit: { len: ["h"] },
  work: { force: ["F"], len: ["d"], mass: ["m"] },
  gravforce: { mass: ["m1", "m2"], len: ["r"] },
  refraction: { angle: ["th1"] },
  incline: { mass: ["m"], angle: ["th"], len: ["d"] },
  circular: { mass: ["m"], vel: ["v"], len: ["r"] },
  torque: { force: ["F"], len: ["r"] },
  buoyancy: { len: ["V"] },
  atwood: { mass: ["m1", "m2"] },
  idealgas: { temp: ["T"] },
};

const SYM_ALIASES: Record<string, string[]> = {
  m: ["m", "mass"], m1: ["m1", "m₁"], m2: ["m2", "m₂"],
  v: ["v", "velocity", "speed"], v0: ["v0", "u", "v₀"], v1: ["v1", "v₁"], v2: ["v2", "v₂"],
  F: ["F", "force"], a: ["a", "acceleration"], g: ["g", "gravity"],
  h: ["h", "height"], d: ["d", "distance"], L: ["L", "length", "l"],
  k: ["k"], x0: ["x0", "x", "x₀"], e: ["e"],
  V: ["V", "voltage", "potential"], R: ["R", "resistance"], I: ["I", "current"],
  f: ["f", "frequency", "nu"], lambda: ["lambda", "λ", "wavelength"],
  th: ["θ", "theta", "th", "angle"], th1: ["θ1", "th1", "θ₁"], th0: ["θ0", "th0", "θ₀"],
  n1: ["n1", "n₁"], n2: ["n2", "n₂"],
};

const MEDIA_N: [RegExp, number][] = [
  [/diamond/i, 2.42], [/glass/i, 1.5], [/water/i, 1.33], [/ice/i, 1.31], [/air|vacuum/i, 1.0],
];

/* ---------------- concept detection ---------------- */
const DETECTORS: [ConceptId, RegExp][] = [
  ["projectile", /projectile|range|launched|thrown at|fired at|kicked at|angle of projection|shot (from|at)/i],
  ["collision", /collid|collision|crash|hits? (a|the|another)|strikes|restitution/i],
  ["pendulum", /pendulum|\bbob\b|swing/i],
  ["spring", /spring|hooke|stiffness|elastic (force|limit)/i],
  ["orbit", /orbit|satellite|moon|space station|\biss\b|escape velocity|geostation/i],
  ["gravforce", /gravitational (force|attraction)|force of gravity between|attract/i],
  ["refraction", /refract|snell|bend(s|ing)? of light|light (bend|enter)|prism|critical angle/i],
  ["atwood", /atwood|pulley|counterweight|crane lifts|lifts? a .*mass over/i],
  ["incline", /incline|inclined plane|ramp|slides? down|smooth slope/i],
  ["torque", /torque|lever|seesaw|see-saw|wrench|door hinge|moment of (a )?force|turning effect/i],
  ["buoyancy", /buoyan|float(s|ing)?|archimedes|upthrust|submerged|ships? (float|sail)/i],
  ["circular", /centripetal|circular (motion|path|track)|banking|rounds a|takes a (curve|turn)|radius of/i],
  ["idealgas", /ideal gas|pv\s*=\s*nrt|gas law|moles? of|pressure of (a|the|an) .*gas/i],
  ["ohm", /\bcurrent\b|resistor|resistance|ohm|volt|battery|\bcircuit\b|ammeter/i],
  ["wave", /wave|frequency|wavelength|interference|sound (speed|travels)/i],
  ["freefall", /\bfall(s|ing)?\b|dropped|\bdrop\b|free.?fall|falls from/i],
  ["ke", /kinetic/i],
  ["pe", /potential/i],
  ["momentum", /momentum|impulse/i],
  ["work", /work done|\bwork\b|joules of work/i],
  ["newton2", /accelerat|net force|newton.?s (second|2nd)|\bF\s*=\s*ma\b/i],
];

/* ---------------- parser ---------------- */
export function parseQuestion(raw: string): ParseResult {
  const text = raw.trim();
  const lower = text.toLowerCase();
  const res: ParseResult = {
    concept: null,
    values: {},
    clarify: CLARIFY_CHIPS.map((c) => c.q),
    raw: text,
  };

  /* what-if / special phrases */
  const whatif = detectWhatIf(lower);
  if (whatif.special) res.special = whatif.special;

  /* concept */
  for (const [id, re] of DETECTORS) {
    if (re.test(text)) {
      res.concept = id;
      break;
    }
  }
  if (!res.concept) {
    if (whatif.varName && /gravity|gravitation/.test(lower)) res.concept = "freefall";
    else if (whatif.varName === "mu") res.concept = "newton2";
    else return res;
  }
  if (whatif.varName === "mu") res.whatif = { varId: "mu", mult: 0 };
  if (whatif.varName && res.concept === "orbit" && /disappear|vanish|switch.?off|turn.?off|zero/.test(lower)) {
    res.whatif = { varId: "g0", mult: 0 };
  }

  const meta = CONCEPTS[res.concept];
  const varIds = new Set(meta.vars.map((v) => v.id));
  const filled = new Set<string>();

  const assign = (id: string, si: number, varUnit: string) => {
    if (filled.has(id) || !varIds.has(id)) return;
    const converted = varUnit === "km" ? si / 1000 : si;
    res.values[id] = { v: round3(converted), unit: varUnit, assumed: false };
    filled.add(id);
  };

  /* pass 1: symbol = value  (e.g. "m = 5 kg") */
  const symRe = /([a-zA-Zλθ₀₁₂]+)\s*(?:=|:|is)\s*(-?\d+(?:\.\d+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = symRe.exec(text)) !== null) {
    const sym = m[1];
    const val = parseFloat(m[2]);
    const canon = Object.entries(SYM_ALIASES).find(([, aliases]) => aliases.includes(sym));
    if (!canon) continue;
    const id = canon[0];
    if (res.concept === "projectile" && id === "th") {
      // fine
    }
    const targetId = varIds.has(id) ? id : id === "x" && varIds.has("x0") ? "x0" : id === "v" && varIds.has("v0") && /launch|projectile|throw/i.test(text) ? "v0" : id;
    const vd = meta.vars.find((v) => v.id === targetId);
    if (vd) assign(targetId, val, vd.unit);
  }

  /* pass 2: number + unit */
  const numRe = /(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*(m\/s²|m\/s2|ms-2|m\/s|ms-1|km\/hr?|kmph|N\/m|kN|kJ|kW|kHz|kV|mA|kg|cm|km|mm|mg|min|ohms?|Ω|degrees?|deg|°|newtons?|metres?|meters?|seconds?|secs?|hertz|hz|volts?|joules?|amps?|amperes?|[mgsVJWNAF%])(?![a-zA-Z])/gi;
  while ((m = numRe.exec(text)) !== null) {
    const val = parseFloat(m[1]);
    const unitTok = (m[2] || "").toLowerCase();
    const info = UNIT_SI[unitTok];
    if (!info) continue;
    const candidates = KIND_TO_VARS[res.concept][info.kind] || [];
    for (const cid of candidates) {
      if (filled.has(cid)) continue;
      const vd = meta.vars.find((v) => v.id === cid);
      if (vd) {
        assign(cid, val * info.toSI, vd.unit);
        break;
      }
    }
  }

  /* pass 3: media words for refraction ("enters water from air") */
  if (res.concept === "refraction") {
    const nOf = (word: string) => MEDIA_N.find(([re]) => re.test(word))?.[1] ?? 1;
    const fromM = text.match(/from\s+(air|water|glass|diamond|ice|vacuum)/i);
    const enterM = text.match(/(?:enters?|into|to)\s+(?:a\s+)?(?:block of\s+|the\s+)?(air|water|glass|diamond|ice|vacuum)/i);
    if (fromM) assign("n1", nOf(fromM[1]), "–");
    if (enterM) assign("n2", nOf(enterM[1]), "–");
    const hits: { i: number; n: number }[] = [];
    for (const [re, n] of MEDIA_N) {
      const hit = re.exec(text);
      if (hit) hits.push({ i: hit.index, n });
    }
    hits.sort((a, b) => a.i - b.i);
    if (hits.length >= 2) {
      if (!filled.has("n1")) assign("n1", hits[0].n, "–");
      if (!filled.has("n2")) assign("n2", hits[1].n, "–");
    } else if (hits.length === 1) {
      if (!filled.has("n2")) assign("n2", hits[0].n, "–");
    }
  }

  /* what-if variable mapping onto this concept's vars */
  if (whatif.varName) {
    const cand: Record<string, string[]> = {
      g: ["g"], v: ["v", "v0", "v1"], m: ["m", "m1"], F: ["F"],
    };
    const ids = cand[whatif.varName] || [];
    const target = ids.find((id) => varIds.has(id));
    if (target) res.whatif = { varId: target, mult: whatif.mult };
    else if (whatif.varName === "g" && res.concept === "freefall") res.whatif = { varId: "g", mult: whatif.mult };
  }
  return res;
}

function detectWhatIf(lower: string): { varName?: string; mult: number; special?: string } {
  if (/speed of light|light (is|was|were)? .*slower|c .* slower/.test(lower)) {
    const mm = lower.match(/(\d+)\s*times?\s*slower/);
    return { mult: 1, special: mm ? `light-slow-${mm[1]}` : "light-slow-10" };
  }
  const pct = lower.match(/(increas|more|up)\w*\s+by\s+(\d+(?:\.\d+)?)\s*%/);
  const pctD = lower.match(/(decreas|less|down)\w*\s+by\s+(\d+(?:\.\d+)?)\s*%/);
  let varName: string | undefined;
  if (/gravity|gravitation|\bg\b/.test(lower)) varName = "g";
  else if (/velocity|speed/.test(lower)) varName = "v";
  else if (/mass|weight/.test(lower)) varName = "m";
  else if (/force/.test(lower)) varName = "F";
  if (/friction/.test(lower) && /zero|no |none|disappear|remove|without/.test(lower)) {
    return { varName: "mu", mult: 0 };
  }
  let mult = 1;
  if (/\b(double|doubled|twice|2x|x2|×2)\b/.test(lower)) mult = 2;
  else if (/\b(triple|tripled|three times|3x)\b/.test(lower)) mult = 3;
  else if (/\b(half|halved|halves)\b/.test(lower)) mult = 0.5;
  else if (pct) mult = 1 + parseFloat(pct[2]) / 100;
  else if (pctD) mult = 1 - parseFloat(pctD[2]) / 100;
  else if (!varName) return { mult: 1 };
  return { varName, mult };
}

const round3 = (x: number) => Math.round(x * 1000) / 1000;

/* ---------------- solver ---------------- */
export function buildSolved(
  concept: ConceptId,
  values?: Record<string, { v: number; unit: string; assumed: boolean }>,
  question = "",
  source?: string
): Solved {
  const meta = CONCEPTS[concept];
  const hasUserValues = !!values && Object.keys(values).length > 0;
  const vals: Record<string, number> = {};
  const given: Given[] = meta.vars.map((vd) => {
    const pv = values?.[vd.id];
    const v = pv ? clamp(pv.v, vd) : vd.def;
    vals[vd.id] = v;
    return { sym: vd.sym, name: vd.name, value: v, unit: vd.unit, assumed: !pv };
  });

  // For multi-target laws (F=ma, V=IR), zero-out assumed values so the
  // engine solves for the missing quantity rather than a default one.
  const computeVals = { ...vals };
  if (hasUserValues && (concept === "newton2" || concept === "ohm")) {
    for (const vd of meta.vars) if (!values![vd.id]) computeVals[vd.id] = 0;
  }

  const out = meta.compute(computeVals);
  const sanity: SanityNote[] = [...out.sanity];
  if (!isFinite(out.resultValue))
    sanity.push({ ok: false, note: "Computation produced a non-finite value — check the inputs." });

  return {
    id: concept,
    topic: meta.topic,
    conceptName: meta.name,
    type: hasUserValues ? "Numerical" : "Conceptual",
    level: meta.level,
    question: question || meta.name,
    source,
    variables: meta.vars,
    given,
    find: meta.find,
    formula: meta.formula,
    formulaUnits: meta.formulaUnits,
    substitute: out.substitute,
    calc: out.calc,
    resultSym: out.resultSym,
    resultValue: out.resultValue,
    resultUnit: out.resultUnit,
    resultText: out.resultText,
    extras: out.extras,
    meaning: out.meaning,
    sanity,
    simKind: meta.simKind,
    graphKind: meta.graphKind,
    whySimple: meta.why.simple,
    whyMath: meta.why.math,
    whyVisual: meta.why.visual,
    eliHook: meta.eli.hook,
    eliAnalogy: meta.eli.analogy,
    eliExample: meta.eli.example,
    teachConcept: meta.teach.concept,
    teachIntuition: meta.teach.intuition,
    teachExample: meta.teach.example,
    quiz: meta.quiz,
    socratic: meta.socratic,
    whatifPresets: meta.whatifPresets,
    assumption: meta.assumption,
  };
}

const clamp = (x: number, vd: { min: number; max: number }) =>
  Math.min(vd.max, Math.max(vd.min, x));

export function solveQuestion(raw: string): { solved: Solved | null; parse: ParseResult } {
  const parse = parseQuestion(raw);
  if (!parse.concept) return { solved: null, parse };
  return { solved: buildSolved(parse.concept, parse.values, raw), parse };
}

/** re-solve with absolute variable overrides (the WHAT-IF engine) */
export function whatIfSolve(
  solved: Solved,
  overrides: Record<string, number>
): Solved {
  const values: Record<string, { v: number; unit: string; assumed: boolean }> = {};
  for (const g of solved.given) {
    const vd = solved.variables.find((v) => v.sym === g.sym)!;
    values[vd.id] = {
      v: overrides[vd.id] !== undefined ? overrides[vd.id] : g.value,
      unit: vd.unit,
      assumed: false,
    };
  }
  const s = buildSolved(solved.id, values, solved.question);
  return s;
}

export function varValue(solved: Solved, id: string): number {
  const vd = solved.variables.find((v) => v.id === id);
  const g = solved.given.find((x) => x.sym === vd?.sym);
  return g ? g.value : vd?.def ?? 0;
}

/* ---------------- practice generator (self-validating) ---------------- */
const pick = (min: number, max: number, decimals: number) => {
  const v = min + Math.random() * (max - min);
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
};

export function genPractice(concept: ConceptId, level: "easy" | "medium" | "hard" | "jee"): PracticeProblem {
  const meta = CONCEPTS[concept];
  const dec = level === "easy" ? 0 : level === "medium" ? 1 : level === "jee" ? 2 : 1;
  const span = level === "easy" ? 0.35 : 1;
  const vals: Record<string, number> = {};
  for (const vd of meta.vars) {
    const lo = vd.min + (vd.max - vd.min) * (level === "easy" ? 0.25 : 0);
    const hi = vd.min + (vd.max - vd.min) * (level === "easy" ? 0.25 + span * 0.5 : span);
    vals[vd.id] = clamp(pick(lo, hi, dec), vd);
    if (vd.id === "v2" && concept === "collision") vals[vd.id] = 0;
    if (vd.id === "e" && concept === "collision") vals[vd.id] = level === "jee" ? 1 : pick(0.4, 1, 2);
  }
  if (concept === "newton2") { vals.a = 0; }
  if (concept === "ohm") { vals.I = 0; }

  const q = QUESTION_TEMPLATES[concept](vals);
  const out = meta.compute(vals);
  const ans = round3(out.resultValue);
  const unit = out.resultUnit;
  const options = shuffle([
    ans,
    round3(ans * 2),
    round3(ans / 2),
    round3(ans * 1.5) === ans ? round3(ans + 1) : round3(ans * 1.5),
  ]);
  return {
    topic: meta.topic,
    concept,
    question: q,
    answer: ans,
    unit,
    options: [...new Set(options)].slice(0, 4),
    hint: meta.formula,
  };
}

const F = (x: number) => String(round3(x));
const QUESTION_TEMPLATES: Record<ConceptId, (v: Record<string, number>) => string> = {
  ke: (v) => `Calculate the kinetic energy of a ${F(v.m)} kg object moving at ${F(v.v)} m/s.`,
  pe: (v) => `Find the gravitational potential energy of a ${F(v.m)} kg mass raised ${F(v.h)} m. (g = ${F(v.g)} m/s²)`,
  freefall: (v) => `A stone is dropped from ${F(v.h)} m. How long does it take to land? (g = ${F(v.g)} m/s²)`,
  projectile: (v) => `A ball is launched at ${F(v.v0)} m/s, ${F(v.th)}° above horizontal. Find its range. (g = ${F(v.g)} m/s²)`,
  newton2: (v) => `A net force of ${F(v.F)} N acts on a ${F(v.m)} kg block. Find its acceleration.`,
  momentum: (v) => `Find the momentum of a ${F(v.m)} kg body moving at ${F(v.v)} m/s.`,
  ohm: (v) => `A ${F(v.R)} Ω resistor is connected across a ${F(v.V)} V battery. Find the current.`,
  pendulum: (v) => `Find the period of a simple pendulum of length ${F(v.L)} m. (g = ${F(v.g)} m/s²)`,
  spring: (v) => `A spring (k = ${F(v.k)} N/m) is stretched ${F(v.x0)} m. Find the restoring force.`,
  collision: (v) => `A ${F(v.m1)} kg cart at ${F(v.v1)} m/s strikes a ${F(v.m2)} kg cart at rest (e = ${F(v.e)}). Find the second cart's speed after impact.`,
  wave: (v) => `A wave has frequency ${F(v.f)} Hz and wavelength ${F(v.lambda)} m. Find its speed.`,
  orbit: (v) => `Find the orbital speed of a satellite ${F(v.h)} km above Earth's surface.`,
  work: (v) => `A force of ${F(v.F)} N pushes a crate ${F(v.d)} m along the floor. Find the work done.`,
  gravforce: (v) => `Find the gravitational force between ${F(v.m1)} kg and ${F(v.m2)} kg placed ${F(v.r)} m apart.`,
  refraction: (v) => `Light enters glass (n = 1.5) from air at ${F(v.th1)}°. Find the angle of refraction.`,
  incline: (v) => `A ${F(v.m)} kg block slides down a ${F(v.th)}° incline (μ = ${F(v.mu)}). Find its acceleration.`,
  circular: (v) => `A ${F(v.m)} kg stone whirls on a ${F(v.r)} m string at ${F(v.v)} m/s. Find the centripetal force.`,
  torque: (v) => `A ${F(v.F)} N force acts perpendicular to a lever arm ${F(v.r)} m long. Find the torque.`,
  buoyancy: (v) => `An object of density ${F(v.rho)} kg/m³ and volume ${F(v.V)} m³ is placed in water. Find the buoyant force when it floats.`,
  atwood: (v) => `An Atwood machine has masses ${F(v.m1)} kg and ${F(v.m2)} kg. Find the acceleration of the system.`,
  idealgas: (v) => `${F(v.n)} mol of an ideal gas at ${F(v.T)} K occupies ${F(v.V)} m³. Find its pressure.`,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------------- mistake detective ---------------- */
export function analyzeMistake(text: string): MistakeReport {
  const lower = text.toLowerCase();
  const rep: MistakeReport = {
    found: false,
    givens: [],
    theirFormula: null,
    theirAnswer: null,
    correctFormula: "KE = ½ m v²",
    correctAnswer: null,
    lines: [],
  };
  const isKE = /kinetic|\bke\b/.test(lower) || /mv\s*2|mv²|mv\^2/.test(lower);
  if (!isKE) {
    rep.lines.push(
      "The detective currently specialises in kinetic-energy solutions (KE = ½mv²). Paste one like: m = 5 kg, v = 10 m/s, KE = mv², KE = 500 J."
    );
    return rep;
  }
  rep.found = true;
  const mMatch = lower.match(/m\s*[=:]\s*(\d+(?:\.\d+)?)\s*(kg)?/);
  const vMatch = lower.match(/v\s*[=:]\s*(\d+(?:\.\d+)?)\s*(m\/s)?/);
  const m = mMatch ? parseFloat(mMatch[1]) : 5;
  const v = vMatch ? parseFloat(vMatch[1]) : 10;
  rep.givens = [
    { sym: "m", value: m, unit: "kg" },
    { sym: "v", value: v, unit: "m/s" },
  ];
  const formulaMatch = lower.match(/\bke\s*=\s*([^\n,;]+)/);
  if (formulaMatch) {
    const f = formulaMatch[1].replace(/\s+/g, "");
    if (!/(1\/2|0\.5|½)/.test(f) && /mv/.test(f)) {
      rep.theirFormula = "KE = m v²";
    } else if (/(1\/2|0\.5|½)/.test(f)) {
      rep.theirFormula = "KE = ½ m v²";
    }
  }
  const answers = [...lower.matchAll(/\bke\s*=\s*(\d+(?:\.\d+)?)\s*(j\b)?/g)].map((x) => parseFloat(x[1]));
  rep.theirAnswer = answers.length ? answers[answers.length - 1] : null;
  rep.correctAnswer = round3(0.5 * m * v * v);

  rep.lines.push(`EXTRACTED GIVEN — m = ${m} kg, v = ${v} m/s.`);
  if (rep.theirFormula === "KE = m v²") {
    rep.lines.push("MISTAKE DETECTED — the ½ factor is missing from KE = mv².");
    rep.lines.push(`YOUR RESULT — KE = ${m}×${v}² = ${round3(m * v * v)} J.`);
    rep.lines.push(`CORRECT RESULT — KE = ½×${m}×${v}² = ${rep.correctAnswer} J. Exactly half.`);
    rep.lines.push("WHY ½ — work done accelerating from rest is ∫mv·dv = ½mv²; the integral supplies the half.");
  } else if (rep.theirAnswer !== null && Math.abs(rep.theirAnswer - rep.correctAnswer) > 1e-6) {
    rep.lines.push(`Formula looks right, but the arithmetic gives ${rep.correctAnswer} J, not ${rep.theirAnswer} J.`);
  } else {
    rep.lines.push(`No error detected — the solution yields ${rep.correctAnswer} J. ✓`);
  }
  return rep;
}

/* ---------------- hypothesis & debate ---------------- */
export function detectHypothesis(text: string): "fall-mass" | null {
  const lower = text.toLowerCase();
  if (/(heavy|heavier|weight|mass)/.test(lower) && /(fall|drop|land)/.test(lower)) return "fall-mass";
  return null;
}

/* ---------------- image → physics (honest inference) ---------------- */
export const IMAGE_OBJECTS: Record<string, { concepts: string[]; sim: ConceptId; note: string }> = {
  Bicycle: { concepts: ["Rotational motion", "Torque & gears", "Rolling friction", "Energy conversion"], sim: "ke", note: "Wheels convert pedalling torque into translational KE." },
  "Ceiling fan": { concepts: ["Angular velocity", "Torque", "Air momentum transfer"], sim: "momentum", note: "The motor's torque spins blades that push air downward." },
  Bridge: { concepts: ["Statics & equilibrium", "Force distribution", "Compression / tension"], sim: "newton2", note: "Every joint balances forces so the net force is zero." },
  Car: { concepts: ["Newton's second law", "Friction & braking", "Kinetic energy"], sim: "ke", note: "Engine force vs drag and friction decides acceleration." },
  Ball: { concepts: ["Projectile motion", "Bounce & restitution", "Energy loss"], sim: "projectile", note: "Flight is a parabola; each bounce keeps a fraction e of speed." },
  Speaker: { concepts: ["Sound waves", "Frequency & amplitude", "Resonance"], sim: "wave", note: "A vibrating cone compresses air into longitudinal waves." },
  "Electric motor": { concepts: ["Magnetic forces", "Torque on a coil", "V = IR in windings"], sim: "ohm", note: "Current in a magnetic field produces turning torque." },
  "Grandfather clock": { concepts: ["Pendulum period", "Escapement timing", "Energy loss & winding"], sim: "pendulum", note: "T = 2π√(L/g) keeps the beat; winding replaces lost energy." },
  Prism: { concepts: ["Refraction", "Dispersion", "Snell's law"], sim: "refraction", note: "Each colour refracts slightly differently — n depends on λ." },
  "Spring scale": { concepts: ["Hooke's law", "Elastic limit", "Force measurement"], sim: "spring", note: "Stretch is proportional to load: F = kx." },
  Planet: { concepts: ["Gravitation", "Orbital motion", "Escape velocity"], sim: "orbit", note: "Orbits are perpetual free fall around a mass." },
  "Water tank": { concepts: ["Pressure & depth", "Fluid statics", "Potential energy"], sim: "pe", note: "Pressure grows linearly with depth: P = ρgh." },
};

/* ============================================================
   TEXTBOOK QUESTION BANK — canonical problems from standard
   texts (NCERT, HRW, HC Verma). Numbers are the exact printed
   values; every answer is re-computed by the deterministic
   engine, never hardcoded.
   ============================================================ */
export const TEXTBOOK_BANK: TextbookProblem[] = [
  { id: "tb-ke-1", source: "NCERT Physics XI", chapter: "Ch 6 · Work, Energy & Power", q: "A 2 kg object is moving at 10 m/s. What is its kinetic energy?", concept: "ke", values: { m: 2, v: 10 }, textbookAnswer: "100 J", level: "Class 11" },
  { id: "tb-work-1", source: "NCERT Physics XI", chapter: "Ch 6 · Work, Energy & Power, Ex 6.3", q: "A body of mass 10 kg, initially at rest, is moved 5 m along a smooth horizontal table by a horizontal force of 20 N. Calculate the work done by the force — on a smooth surface it all becomes kinetic energy.", concept: "work", values: { F: 20, d: 5 }, textbookAnswer: "100 J", level: "Class 11" },
  { id: "tb-proj-1", source: "NCERT Physics XI", chapter: "Ch 4 · Motion in a Plane, Ex 4.7", q: "A cricket ball is thrown at 28 m/s at 30° above the horizontal. Find its horizontal range. (g = 9.8 m/s²)", concept: "projectile", values: { v0: 28, th: 30, g: 9.8 }, textbookAnswer: "69.3 m", level: "Class 11" },
  { id: "tb-circ-1", source: "NCERT Physics XI", chapter: "Ch 4 · Motion in a Plane, Ex 4.11", q: "A 0.15 kg stone tied to a 0.8 m string whirls in a horizontal circle, making 14 revolutions in 25 s. The speed is 2.81 m/s. Find the centripetal force on the stone.", concept: "circular", values: { m: 0.15, v: 2.81, r: 0.8 }, textbookAnswer: "≈ 1.5 N (a_c = 9.9 m/s²)", level: "Class 11" },
  { id: "tb-fall-1", source: "NCERT Physics XI", chapter: "Ch 3 · Motion in a Straight Line", q: "A ball is dropped from a height of 20 m. How long does it take to reach the ground? Take g = 10 m/s².", concept: "freefall", values: { h: 20, g: 10 }, textbookAnswer: "2 s", level: "Class 11" },
  { id: "tb-mom-1", source: "NCERT Science IX", chapter: "Ch 9 · Force and Laws of Motion", q: "A bullet of mass 0.05 kg is fired from a rifle at 35 m/s. Calculate its momentum. (Its recoil pushes the rifle back with the same momentum.)", concept: "momentum", values: { m: 0.05, v: 35 }, textbookAnswer: "1.75 kg·m/s", level: "Class 9" },
  { id: "tb-n2-1", source: "NCERT Science IX", chapter: "Ch 9 · Force and Laws of Motion", q: "A net force of 50 N acts on a 10 kg mass. Find the acceleration produced.", concept: "newton2", values: { F: 50, m: 10 }, textbookAnswer: "5 m/s²", level: "Class 9" },
  { id: "tb-incline-1", source: "NCERT Physics XI", chapter: "Ch 5 · Laws of Motion", q: "A 4 kg block slides down a frictionless incline of 30°. Find its acceleration. (g = 9.8 m/s²)", concept: "incline", values: { m: 4, th: 30, mu: 0 }, textbookAnswer: "4.9 m/s²", level: "Class 11" },
  { id: "tb-torque-1", source: "NCERT Physics XI", chapter: "Ch 7 · System of Particles & Rotation", q: "A force of 20 N is applied perpendicular to a door at 0.6 m from the hinge. Find the torque about the hinge.", concept: "torque", values: { F: 20, r: 0.6 }, textbookAnswer: "12 N·m", level: "Class 11" },
  { id: "tb-pend-1", source: "HC Verma, Concepts of Physics I", chapter: "Ch 12 · Simple Harmonic Motion", q: "A simple pendulum has length 0.993 m (the classic seconds pendulum). Find its period. (g = 9.8 m/s²)", concept: "pendulum", values: { L: 0.993 }, textbookAnswer: "2.0 s", level: "Class 11" },
  { id: "tb-spring-1", source: "NCERT Physics XI", chapter: "Ch 14 · Oscillations", q: "A 0.5 kg mass hangs from a spring of constant 250 N/m and oscillates. Find the period of oscillation.", concept: "spring", values: { m: 0.5, k: 250, x0: 0.1 }, textbookAnswer: "0.28 s", level: "Class 11" },
  { id: "tb-coll-1", source: "Halliday · Resnick · Walker", chapter: "Fundamentals of Physics, Ch 9 · Collisions", q: "A 2 kg block moving at 3 m/s makes a head-on elastic collision (e = 1) with a 1 kg block at rest. Find the velocity of the 1 kg block after the collision.", concept: "collision", values: { m1: 2, v1: 3, m2: 1, v2: 0, e: 1 }, textbookAnswer: "4 m/s", level: "University" },
  { id: "tb-atwood-1", source: "HC Verma, Concepts of Physics I", chapter: "Ch 5 · Newton's Laws of Motion", q: "In an Atwood machine, m₁ = 5 kg and m₂ = 3 kg hang over a light frictionless pulley. Find the acceleration of the masses. (g = 9.8 m/s²)", concept: "atwood", values: { m1: 5, m2: 3 }, textbookAnswer: "2.45 m/s², T = 36.75 N", level: "Class 11" },
  { id: "tb-buoy-1", source: "NCERT Science IX", chapter: "Ch 10 · Gravitation (Floatation)", q: "A wooden block of density 600 kg/m³ and volume 0.005 m³ floats in water (1000 kg/m³). Find the buoyant force acting on it.", concept: "buoyancy", values: { rho: 600, V: 0.005 }, textbookAnswer: "29.4 N (= weight)", level: "Class 9" },
  { id: "tb-ohm-1", source: "NCERT Physics XII", chapter: "Ch 3 · Current Electricity", q: "A 12 V battery is connected across a 4.8 Ω resistor. Find the current through it.", concept: "ohm", values: { V: 12, R: 4.8 }, textbookAnswer: "2.5 A", level: "Class 12" },
  { id: "tb-wave-1", source: "NCERT Physics XI", chapter: "Ch 15 · Waves", q: "A sound wave has frequency 1000 Hz and wavelength 0.34 m. Find its speed.", concept: "wave", values: { f: 1000, lambda: 0.34 }, textbookAnswer: "340 m/s", level: "Class 11" },
  { id: "tb-snell-1", source: "NCERT Physics XII", chapter: "Ch 9 · Ray Optics", q: "A light ray in air strikes a glass slab (n = 1.5) at an angle of incidence of 60°. Find the angle of refraction.", concept: "refraction", values: { n1: 1, n2: 1.5, th1: 60 }, textbookAnswer: "35.3°", level: "Class 12" },
  { id: "tb-gas-1", source: "NCERT Physics XI", chapter: "Ch 13 · Kinetic Theory", q: "2 mol of an ideal gas at 300 K occupy 0.1 m³. Calculate the pressure of the gas. (R = 8.314 J/mol·K)", concept: "idealgas", values: { n: 2, T: 300, V: 0.1 }, textbookAnswer: "4.99 × 10⁴ Pa", level: "Class 11" },
  { id: "tb-grav-1", source: "NCERT Physics XI", chapter: "Ch 8 · Gravitation", q: "Find the gravitational force between the Sun (2 × 10³⁰ kg) and the Earth (6 × 10²⁴ kg) separated by 1.5 × 10¹¹ m.", concept: "gravforce", values: { m1: 2e30, m2: 6e24, r: 1.5e11 }, textbookAnswer: "3.56 × 10²² N", level: "Class 11" },
  { id: "tb-orbit-1", source: "NCERT Physics XI", chapter: "Ch 8 · Gravitation", q: "Find the orbital speed of a satellite 400 km above the Earth's surface.", concept: "orbit", values: { h: 400 }, textbookAnswer: "7.67 km/s", level: "Class 11" },
  { id: "tb-pe-1", source: "NCERT Physics XI", chapter: "Ch 6 · Work, Energy & Power", q: "Find the gravitational potential energy of a 2 kg mass raised 10 m above the ground. (g = 9.8 m/s²)", concept: "pe", values: { m: 2, h: 10, g: 9.8 }, textbookAnswer: "196 J", level: "Class 11" },
];

/** Solve a bank entry with its exact printed numbers (engine computes the answer). */
export function solveFromBank(p: TextbookProblem): { solved: Solved; parse: ParseResult } {
  const meta = CONCEPTS[p.concept];
  const values: Record<string, { v: number; unit: string; assumed: boolean }> = {};
  for (const [id, v] of Object.entries(p.values)) {
    const vd = meta.vars.find((x) => x.id === id);
    if (vd) values[id] = { v, unit: vd.unit, assumed: false };
  }
  return {
    solved: buildSolved(p.concept, values, p.q, `${p.source} · ${p.chapter} · printed answer ${p.textbookAnswer}`),
    parse: { concept: p.concept, values, clarify: [], raw: p.q },
  };
}

/* ============================================================
   REAL-WORLD EXPERIMENTS — physics hiding in everyday things
   ============================================================ */
export const REAL_LIFE: RealWorldExperiment[] = [
  { id: "door", icon: "wrench", title: "Doors, Wrenches & Seesaws", setting: "door handles · jar lids · spanners · seesaws", physics: ["Torque τ = rF", "Moment arm", "Rotational equilibrium"], q: "A force of 15 N is applied perpendicular to a door handle 0.9 m from the hinge. What torque opens the door?", concept: "torque", values: { F: 15, r: 0.9 } },
  { id: "bike", icon: "bike", title: "A Bicycle Taking a Turn", setting: "cyclists · car corners · merry-go-rounds", physics: ["Centripetal force F = mv²/r", "Friction as the turn provider"], q: "A 70 kg cyclist rounds a curve of radius 25 m at 8 m/s. What centripetal force must friction provide?", concept: "circular", values: { m: 70, v: 8, r: 25 } },
  { id: "lift", icon: "lift", title: "An Elevator Starting Up", setting: "lifts · rocket launches · roller-coaster drops", physics: ["Newton's second law", "Net force = ma"], q: "A net force of 160 N acts on an 80 kg person as the elevator starts. What acceleration do they feel?", concept: "newton2", values: { F: 160, m: 80 } },
  { id: "boat", icon: "boat", title: "Why Boats Float", setting: "boats · submarines · hydrometers", physics: ["Archimedes' principle", "Float ⇔ F_b = W"], q: "A boat hull of average density 600 kg/m³ and volume 2 m³ floats in water. What buoyant force holds it up?", concept: "buoyancy", values: { rho: 600, V: 2 } },
  { id: "crane", icon: "crane", title: "A Construction Crane", setting: "cranes · wells · theatre fly systems", physics: ["Atwood dynamics", "Tension in the cable"], q: "A crane lowers a 50 kg load against a 45 kg counterweight on the same cable. Find the acceleration of the load.", concept: "atwood", values: { m1: 50, m2: 45 } },
  { id: "swing", icon: "pendulum", title: "The Park Swing", setting: "swings · grandfather clocks · metronomes", physics: ["Pendulum period T = 2π√(L/g)", "Mass-independent timing"], q: "A park swing behaves like a pendulum of length 2.5 m. Find its period. (g = 9.8 m/s²)", concept: "pendulum", values: { L: 2.5 } },
  { id: "car", icon: "car", title: "Braking a Car", setting: "disc brakes · skid marks · ABS", physics: ["Work–energy theorem", "Friction converts KE to heat"], q: "Brakes apply a retarding force of 4800 N over 50 m to stop a car. How much energy do they absorb?", concept: "work", values: { F: 4800, d: 50 } },
  { id: "pen", icon: "spring", title: "Click-Pens & Car Suspension", setting: "pens · mattresses · weighing scales · suspension", physics: ["Hooke's law F = −kx", "Elastic energy storage"], q: "A pen spring (k = 120 N/m) is compressed by 0.02 m. What restoring force does it exert?", concept: "spring", values: { k: 120, x0: 0.02 } },
  { id: "cooker", icon: "thermo", title: "The Pressure Cooker", setting: "cookers · car tyres · aerosol cans", physics: ["Ideal gas law PV = nRT", "P rises with T at fixed V"], q: "A cooker holds 0.5 mol of steam in 0.004 m³ at 400 K. What pressure builds inside?", concept: "idealgas", values: { n: 0.5, T: 400, V: 0.004 } },
  { id: "slide", icon: "ramp", title: "Playground Slides & Ramps", setting: "slides · wheelchair ramps · loading ramps", physics: ["Components of weight", "Friction vs slope angle"], q: "A 20 kg child slides down a 25° playground slide with friction coefficient 0.3. What acceleration do they experience?", concept: "incline", values: { m: 20, th: 25, mu: 0.3 } },
  { id: "throw", icon: "ball", title: "Bowling a Cricket Ball", setting: "cricket · football punts · water fountains", physics: ["Projectile motion", "R = v²sin2θ / g"], q: "A cricket ball is bowled at 25 m/s, 40° above horizontal. How far does it travel before landing? (g = 9.8 m/s²)", concept: "projectile", values: { v0: 25, th: 40, g: 9.8 } },
  { id: "fan", icon: "fan", title: "Ceiling Fan Blades", setting: "fans · washing machines · centrifuges", physics: ["Circular motion", "Blade root tension"], q: "A 0.3 kg fan blade tip travels at 12 m/s around a 0.6 m radius. What inward force acts on it?", concept: "circular", values: { m: 0.3, v: 12, r: 0.6 } },
];

/* ---------------- light-slow what-if ---------------- */
export function lightSlowFacts(factor: number) {
  const c = 299792458;
  const dSun = 1.496e11;
  const dMoon = 3.844e8;
  const cp = c / factor;
  return [
    { label: "New speed of light", value: `${Math.round(cp / 1000)} km/s (was ${Math.round(c / 1000)} km/s)` },
    { label: "Sunlight → Earth", value: `${((dSun / cp) / 60).toFixed(1)} min (was 8.3 min)` },
    { label: "Earth → Moon signal", value: `${(dMoon / cp).toFixed(1)} s (was 1.28 s)` },
    { label: "GPS timing error", value: `Clocks would need ${factor}× more correction — GPS would fail within seconds without relativity.` },
  ];
}
