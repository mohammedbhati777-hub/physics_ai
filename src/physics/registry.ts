import { fmt } from "../lib/labkit";
import type {
  ConceptId,
  GraphKind,
  QuizItem,
  SanityNote,
  SimKind,
  SocraticStep,
  VarDef,
  WhatIfPreset,
} from "./types";

export const G = 6.674e-11;
export const M_EARTH = 5.972e24;
export const R_EARTH = 6.371e6;

export interface ComputeOut {
  resultSym: string;
  resultValue: number;
  resultUnit: string;
  resultText: string;
  extras: { label: string; value: string }[];
  substitute: string[];
  calc: string[];
  meaning: string;
  sanity: SanityNote[];
}

export interface ConceptMeta {
  topic: string;
  name: string;
  level: string;
  simKind: SimKind;
  graphKind: GraphKind;
  assumption: string;
  find: string;
  formula: string;
  formulaUnits: string;
  vars: VarDef[];
  whatifPresets: WhatIfPreset[];
  compute: (v: Record<string, number>) => ComputeOut;
  why: { simple: string; math: string; visual: string };
  eli: { hook: string; analogy: string; example: string };
  teach: { concept: string; intuition: string; example: string };
  quiz: QuizItem;
  socratic: SocraticStep[];
}

const V = (
  id: string,
  sym: string,
  name: string,
  unit: string,
  min: number,
  max: number,
  step: number,
  def: number,
  color: string
): VarDef => ({ id, sym, name, unit, min, max, step, def, color });

const BLUE = "var(--color-motion)";
const RED = "var(--color-force)";
const GREEN = "var(--color-energy)";
const AMBER = "var(--color-warn)";
const PURPLE = "var(--color-field)";

export const CONCEPTS: Record<ConceptId, ConceptMeta> = {
  /* ------------------------------------------------ kinetic energy */
  ke: {
    topic: "Mechanics",
    name: "Kinetic Energy",
    level: "Class 11",
    simKind: "bench",
    graphKind: "ke-v",
    assumption: "Point mass, flat bench, no air drag. v ≪ c (non-relativistic).",
    find: "Kinetic energy KE",
    formula: "KE = ½ m v²",
    formulaUnits: "kg · m²/s²  =  J",
    vars: [
      V("m", "m", "Mass", "kg", 0.01, 50, 0.01, 2, BLUE),
      V("v", "v", "Velocity", "m/s", 0.5, 40, 0.1, 10, BLUE),
    ],
    whatifPresets: [
      { label: "Velocity × 2", varId: "v", mult: 2 },
      { label: "Velocity + 20%", varId: "v", mult: 1.2 },
      { label: "Mass × 2", varId: "m", mult: 2 },
      { label: "Mass × ½", varId: "m", mult: 0.5 },
      { label: "Friction → zero", varId: "mu", mult: 0 },
    ],
    compute: ({ m, v }) => {
      const ke = 0.5 * m * v * v;
      return {
        resultSym: "KE",
        resultValue: ke,
        resultUnit: "J",
        resultText: `The body carries ${fmt(ke)} J of kinetic energy.`,
        extras: [
          { label: "Momentum p = mv", value: `${fmt(m * v)} kg·m/s` },
          { label: "Stop-distance @ μ=0.5", value: `${fmt((v * v) / (2 * 0.5 * 9.8))} m` },
        ],
        substitute: [`KE = ½ × ${fmt(m)} kg × (${fmt(v)} m/s)²`],
        calc: [
          `v² = ${fmt(v * v)} m²/s²`,
          `KE = 0.5 × ${fmt(m)} × ${fmt(v * v)}`,
        ],
        meaning: `${fmt(ke)} J is the work needed to bring this body up to ${fmt(v)} m/s — or the work friction must do to stop it. Lifting a 1 kg book 1 m costs ~9.8 J, so this equals lifting that book ${fmt(ke / 9.8)} m.`,
        sanity: [
          { ok: ke >= 0, note: "Kinetic energy must be ≥ 0 (v is squared)." },
          {
            ok: v <= 343,
            note:
              v > 343
                ? "v exceeds the speed of sound in air (~343 m/s) — real bodies would face shock drag; the simple model ignores that."
                : "Speed is sub-sonic; drag is a small correction here.",
          },
        ],
      };
    },
    why: {
      simple: "Energy is stored motion. Doubling mass doubles the stored motion, but doubling speed quadruples it — every bit of the body moves faster AND there is 'more speed' to build up, so speed counts twice.",
      math: "Work–energy theorem: W = ∫F dx. With F = ma and a = dv/dt, ∫ma dx = ∫m v dv = ½mv². The ½ is the integral of v dv — it is unavoidable calculus, not convention.",
      visual: "In the bench sim, slide velocity to 2× and watch the energy bar: it grows 4×, while the momentum bar only doubles.",
    },
    eli: {
      hook: "Kinetic energy is how much 'oomph' a moving thing carries.",
      analogy: "A slow bicycle nudges you gently. The same bicycle racing downhill hits much harder — speed adds oomph FAST, much faster than adding weight does.",
      example: "A 2 kg ball at 10 m/s carries 100 J — about the energy of lifting 10 apples one metre up.",
    },
    teach: {
      concept: "Kinetic energy is the energy a body owns because of its velocity: KE = ½mv².",
      intuition: "To speed something up you must push it over a distance (do work). That work doesn't vanish — it is stored as motion.",
      example: "Braking a car converts KE into heat in the discs. Double the speed and the brakes must absorb 4× the energy — that's why stopping distance quadruples.",
    },
    quiz: {
      q: "A car doubles its speed. Its kinetic energy becomes…",
      options: ["2× larger", "4× larger", "unchanged", "½ as large"],
      answer: 1,
      explain: "KE ∝ v², so doubling v multiplies KE by 2² = 4.",
    },
    socratic: [
      {
        q: "If two trucks move at the same speed, one twice as heavy — which carries more kinetic energy, and by how much?",
        accept: ["twice", "2x", "2 x", "double", "heavier"],
        hint: "KE = ½mv². Only m differs.",
        follow: "Right — mass enters linearly, so double mass → double KE.",
      },
      {
        q: "Now the lighter truck doubles its speed instead. By what factor does its KE change?",
        accept: ["4", "four", "quadruple", "2 squared", "4x"],
        hint: "Which quantity is squared in the formula?",
        follow: "Exactly — velocity is squared, so 2² = 4. Speed matters more than mass.",
      },
    ],
  },

  /* ------------------------------------------------ potential energy */
  pe: {
    topic: "Mechanics",
    name: "Gravitational Potential Energy",
    level: "Class 11",
    simKind: "freefall",
    graphKind: "pe-h",
    assumption: "Uniform g near Earth's surface; height small compared to Earth's radius.",
    find: "Potential energy PE",
    formula: "PE = m g h",
    formulaUnits: "kg · (m/s²) · m  =  J",
    vars: [
      V("m", "m", "Mass", "kg", 0.2, 20, 0.1, 2, BLUE),
      V("g", "g", "Gravity", "m/s²", 1, 25, 0.1, 9.8, RED),
      V("h", "h", "Height", "m", 0.5, 100, 0.5, 10, GREEN),
    ],
    whatifPresets: [
      { label: "Gravity × 2", varId: "g", mult: 2 },
      { label: "Height × 2", varId: "h", mult: 2 },
      { label: "On the Moon (g÷6)", varId: "g", mult: 1 / 6 },
    ],
    compute: ({ m, g, h }) => {
      const pe = m * g * h;
      const vf = Math.sqrt(2 * g * h);
      return {
        resultSym: "PE",
        resultValue: pe,
        resultUnit: "J",
        resultText: `Stored gravitational energy is ${fmt(pe)} J.`,
        extras: [
          { label: "Impact speed if dropped", value: `${fmt(vf)} m/s` },
          { label: "Fall time", value: `${fmt(Math.sqrt((2 * h) / g))} s` },
        ],
        substitute: [`PE = ${fmt(m)} kg × ${fmt(g)} m/s² × ${fmt(h)} m`],
        calc: [`PE = ${fmt(m * g)} N × ${fmt(h)} m`],
        meaning: `Held at ${fmt(h)} m, this mass can release ${fmt(pe)} J — exactly the amount gravity would convert into motion during the fall (impact ≈ ${fmt(vf)} m/s).`,
        sanity: [
          { ok: pe >= 0, note: "PE ≥ 0 for h ≥ 0 with the ground as reference." },
          {
            ok: h <= 5000,
            note:
              h > 5000
                ? "At this height g weakens measurably — the uniform-g model starts to overestimate."
                : "Uniform-g is an excellent approximation at this height.",
          },
        ],
      };
    },
    why: {
      simple: "Lifting something stores the effort you spent against gravity. The higher (or heavier), the more stored — ready to be refunded as motion.",
      math: "W = ∫F·dh against weight mg gives mgh. PE is defined as the negative of work done by gravity, so PE = mgh above the reference level.",
      visual: "In the fall sim, the green PE bar drains into the blue KE bar as the ball drops — the total stays constant.",
    },
    eli: {
      hook: "Height is stored energy, like a stretched rubber band made of gravity.",
      analogy: "A brick on a tall shelf 'remembers' all the lifting you did. Drop it, and that memory turns into speed.",
      example: "A 2 kg melon 10 m up stores ~196 J — it hits like a firm throw.",
    },
    teach: {
      concept: "PE = mgh measures energy stored by position in a gravitational field.",
      intuition: "Nature keeps a ledger: work spent climbing is refunded when falling. The ledger entry is mgh.",
      example: "Hydroelectric dams store water high; each kilogram at height h can yield mgh joules downstream.",
    },
    quiz: {
      q: "Two books sit on a shelf — one 2 kg, one 1 kg, same height. The heavier book has…",
      options: ["half the PE", "the same PE", "twice the PE", "four times the PE"],
      answer: 2,
      explain: "PE = mgh is linear in mass: double mass, double stored energy.",
    },
    socratic: [
      {
        q: "You lift a box slowly to a shelf. Where does your effort go?",
        accept: ["stored", "potential", "pe", "gravity", "energy"],
        hint: "It isn't lost — it's banked somewhere.",
        follow: "Yes — stored as gravitational potential energy mgh.",
      },
      {
        q: "On the Moon (g ≈ 1.6 m/s²), lifting the same box the same height stores…?",
        accept: ["less", "1.6", "lower", "decreases"],
        hint: "Compare the Moon's g with Earth's 9.8.",
        follow: "Correct — weaker gravity, less stored energy per metre.",
      },
    ],
  },

  /* ------------------------------------------------ free fall */
  freefall: {
    topic: "Mechanics",
    name: "Free Fall",
    level: "Class 9–11",
    simKind: "freefall",
    graphKind: "fall-vt",
    assumption: "Vacuum fall (no air resistance), constant g.",
    find: "Fall time t and impact velocity v",
    formula: "h = ½ g t²   →   t = √(2h/g)",
    formulaUnits: "√(m / (m/s²))  =  s",
    vars: [
      V("h", "h", "Height", "m", 1, 120, 0.5, 20, GREEN),
      V("g", "g", "Gravity", "m/s²", 1, 25, 0.1, 9.8, RED),
    ],
    whatifPresets: [
      { label: "Gravity × 2", varId: "g", mult: 2 },
      { label: "Moon gravity", varId: "g", mult: 1.62 / 9.8 },
      { label: "Height × 2", varId: "h", mult: 2 },
    ],
    compute: ({ h, g }) => {
      const t = Math.sqrt((2 * h) / g);
      const v = g * t;
      return {
        resultSym: "t",
        resultValue: t,
        resultUnit: "s",
        resultText: `The fall lasts ${fmt(t)} s and impact speed is ${fmt(v)} m/s.`,
        extras: [
          { label: "Impact velocity v = gt", value: `${fmt(v)} m/s` },
          { label: "Mid-fall speed", value: `${fmt(g * (t / 2))} m/s` },
        ],
        substitute: [`t = √(2 × ${fmt(h)} m / ${fmt(g)} m/s²)`],
        calc: [`2h/g = ${fmt((2 * h) / g)} s²`, `t = √${fmt((2 * h) / g)}`],
        meaning: `Notice: mass never appears. A hammer and a feather (in vacuum) land together after ${fmt(t)} s — gravity accelerates everything equally.`,
        sanity: [
          { ok: t > 0, note: "Fall time is positive for h > 0." },
          {
            ok: v < 90,
            note:
              v >= 90
                ? "Real falls at this speed face strong air drag — terminal velocity would cap the true speed."
                : "At this speed air drag is a modest correction.",
          },
        ],
      };
    },
    why: {
      simple: "Gravity pulls every kilogram with the same acceleration, so heavy and light fall in step. Distance grows with t² because speed itself keeps growing.",
      math: "Integrating a = g twice: v = gt, h = ½gt². Solving h = ½gt² for t gives √(2h/g) — mass cancels because weight (mg) and inertia (m) scale together.",
      visual: "Run the drop sim with the two-ball hypothesis mode: different masses, identical landing.",
    },
    eli: {
      hook: "Gravity doesn't care how heavy you are — it speeds everyone up at the same rate.",
      analogy: "Imagine a conveyor belt that speeds everything up equally: a marble and a bowling ball race neck-and-neck all the way down.",
      example: "From 20 m (a 6-storey building), anything dropped in vacuum lands after ~2 s at ~70 km/h.",
    },
    teach: {
      concept: "Free fall is motion under gravity alone: a = g, v = gt, h = ½gt².",
      intuition: "Each second, gravity adds the same amount of speed (≈ 9.8 m/s on Earth) to everything.",
      example: "Galileo's leaning-tower story, done properly on the Moon by Apollo 15: hammer and feather landed together.",
    },
    quiz: {
      q: "In vacuum, a 1 kg and a 10 kg ball are dropped together. Which lands first?",
      options: ["the 10 kg ball", "the 1 kg ball", "they land together", "depends on size"],
      answer: 2,
      explain: "Acceleration g is mass-independent; with no air, both fall identically.",
    },
    socratic: [
      {
        q: "Aristotle said heavier things fall faster. What does h = ½gt² say about mass?",
        accept: ["no mass", "mass cancels", "same", "doesn't appear", "independent"],
        hint: "Look for m in the formula…",
        follow: "Exactly — m never appears. The formula predicts identical falls.",
      },
      {
        q: "If the fall time doubles, the drop height must be…?",
        accept: ["4", "four", "quadruple", "times 4"],
        hint: "h depends on t² .",
        follow: "Right — h = ½gt², so doubling t multiplies h by 4.",
      },
    ],
  },

  /* ------------------------------------------------ projectile */
  projectile: {
    topic: "Mechanics",
    name: "Projectile Motion",
    level: "Class 11",
    simKind: "projectile",
    graphKind: "proj-vy",
    assumption: "Point projectile, uniform g, flat ground; air drag optional in sim (off for the analytic result).",
    find: "Range R, max height H, flight time T",
    formula: "R = v₀² sin 2θ / g",
    formulaUnits: "(m/s)² / (m/s²)  =  m",
    vars: [
      V("v0", "v₀", "Launch speed", "m/s", 2, 60, 0.5, 20, BLUE),
      V("th", "θ", "Launch angle", "°", 5, 85, 1, 45, BLUE),
      V("g", "g", "Gravity", "m/s²", 1, 25, 0.1, 9.8, RED),
    ],
    whatifPresets: [
      { label: "Gravity × 2", varId: "g", mult: 2 },
      { label: "Speed + 20%", varId: "v0", mult: 1.2 },
      { label: "Angle → 45°", varId: "th", mult: -45 }, // special: absolute
      { label: "Moon gravity", varId: "g", mult: 1.62 / 9.8 },
    ],
    compute: ({ v0, th, g }) => {
      const r = (th * Math.PI) / 180;
      const T = (2 * v0 * Math.sin(r)) / g;
      const H = (v0 * v0 * Math.sin(r) * Math.sin(r)) / (2 * g);
      const R = (v0 * v0 * Math.sin(2 * r)) / g;
      return {
        resultSym: "R",
        resultValue: R,
        resultUnit: "m",
        resultText: `Range ${fmt(R)} m · peak ${fmt(H)} m · flight ${fmt(T)} s.`,
        extras: [
          { label: "Flight time T", value: `${fmt(T)} s` },
          { label: "Max height H", value: `${fmt(H)} m` },
          { label: "Apex speed (= v₀cosθ)", value: `${fmt(v0 * Math.cos(r))} m/s` },
        ],
        substitute: [`R = (${fmt(v0)} m/s)² × sin(${fmt(2 * th)}°) / ${fmt(g)} m/s²`],
        calc: [
          `v₀² = ${fmt(v0 * v0)} m²/s²`,
          `sin ${fmt(2 * th)}° = ${fmt(Math.sin(2 * r), 3)}`,
        ],
        meaning: `Horizontal motion coasts at constant v₀cosθ while gravity brakes and rebuilds the vertical component. At 45° the trade-off between hang-time and horizontal speed is optimal — ${Math.abs(th - 45) < 0.5 ? "you are exactly at the optimal angle." : `try 45° to see the maximum range.`}`,
        sanity: [
          { ok: R >= 0, note: "Range is non-negative for 0 < θ < 90°." },
          {
            ok: R < 40000,
            note:
              R >= 40000
                ? "Range approaches Earth's curvature scale — this becomes orbital mechanics, and the flat-ground model breaks."
                : "Flat-ground model is valid at this range.",
          },
        ],
      };
    },
    why: {
      simple: "A projectile is two independent motions wearing one costume: steady horizontal coasting plus vertical free fall. Gravity only touches the vertical part.",
      math: "x(t) = v₀cosθ·t and y(t) = v₀sinθ·t − ½gt². Eliminating t at y = 0 gives R = v₀²sin2θ/g, maximal when sin2θ = 1, i.e. θ = 45°.",
      visual: "In the sim, watch the velocity vector: its horizontal shadow never changes length; the vertical shadow shrinks, flips, and grows.",
    },
    eli: {
      hook: "Throw something and it falls while it travels — the two things happen at once, independently.",
      analogy: "A ball rolling off a table lands at the same time as a ball simply dropped — forward motion doesn't delay falling.",
      example: "A cricket ball at 20 m/s, 45°, travels ~40 m before landing ~2.9 s later.",
    },
    teach: {
      concept: "Projectile motion = constant-velocity x-motion + constant-acceleration y-motion.",
      intuition: "Split the launch velocity into two shadows (cosθ along ground, sinθ upward) and let gravity act on the vertical shadow only.",
      example: "Firefighters choose nozzle angles exactly this way: too steep wastes time in the air, too shallow doesn't climb high enough.",
    },
    quiz: {
      q: "Ignoring air, at which launch angle is the range maximum?",
      options: ["30°", "45°", "60°", "90°"],
      answer: 1,
      explain: "R ∝ sin2θ, and sin is maximized at 90° → θ = 45°.",
    },
    socratic: [
      {
        q: "At the very top of the arc, what is the vertical component of velocity?",
        accept: ["zero", "0", "none", "vanishes"],
        hint: "For one instant the projectile is neither rising nor falling…",
        follow: "Yes — v_y = 0 at the apex, while v_x = v₀cosθ continues.",
      },
      {
        q: "Ignoring air, what happens to horizontal velocity during flight?",
        accept: ["constant", "same", "unchanged", "stays"],
        hint: "Which force could change it — and does any act horizontally?",
        follow: "Correct — no horizontal force, so it never changes.",
      },
    ],
  },

  /* ------------------------------------------------ newton 2 */
  newton2: {
    topic: "Mechanics",
    name: "Newton's Second Law",
    level: "Class 9–11",
    simKind: "bench",
    graphKind: "bench-vt",
    assumption: "Constant net force, rigid body, bench friction shown separately in sim.",
    find: "Acceleration / Force / Mass (whichever is missing)",
    formula: "F = m a",
    formulaUnits: "kg · m/s²  =  N",
    vars: [
      V("F", "F", "Force", "N", 0, 2000, 1, 50, RED),
      V("m", "m", "Mass", "kg", 0.5, 200, 0.5, 5, BLUE),
      V("a", "a", "Acceleration", "m/s²", 0.1, 40, 0.1, 10, AMBER),
    ],
    whatifPresets: [
      { label: "Force × 2", varId: "F", mult: 2 },
      { label: "Mass × 2", varId: "m", mult: 2 },
      { label: "Force × ½", varId: "F", mult: 0.5 },
      { label: "Friction → zero", varId: "mu", mult: 0 },
    ],
    compute: (v) => {
      const has = (x: number | undefined) => x !== undefined && x > 0;
      // decide which quantity is the 'find' from provided values
      if (has(v.F) && has(v.m)) {
        const a = v.F / v.m;
        return {
          resultSym: "a", resultValue: a, resultUnit: "m/s²",
          resultText: `The body accelerates at ${fmt(a)} m/s².`,
          extras: [
            { label: "Speed after 3 s", value: `${fmt(a * 3)} m/s` },
            { label: "Distance in 3 s", value: `${fmt(0.5 * a * 9)} m` },
          ],
          substitute: [`a = F / m = ${fmt(v.F)} N / ${fmt(v.m)} kg`],
          calc: [`a = ${fmt(a)} m/s²  (≈ ${fmt(a / 9.8, 3)} g)`],
          meaning: `Each newton pushes each kilogram by 1 m/s². With ${fmt(v.F)} N on ${fmt(v.m)} kg, speed grows ${fmt(a)} m/s every second — steadily, forever, while the force lasts.`,
          sanity: [{ ok: a < 300, note: a >= 300 ? "Above ~30 g — humans black out near 5 g sustained." : "Acceleration is in a comfortable human/material range." }],
        };
      }
      if (has(v.m) && has(v.a)) {
        const F = v.m * v.a;
        return {
          resultSym: "F", resultValue: F, resultUnit: "N",
          resultText: `A net force of ${fmt(F)} N is required.`,
          extras: [{ label: "Weight of this mass", value: `${fmt(v.m * 9.8)} N` }],
          substitute: [`F = m a = ${fmt(v.m)} kg × ${fmt(v.a)} m/s²`],
          calc: [`F = ${fmt(F)} N`],
          meaning: `${fmt(F)} N is what your hand, engine or rope must supply (before friction) to give ${fmt(v.m)} kg that acceleration. About ${fmt(F / 9.8, 3)} kg-worth of push.`,
          sanity: [{ ok: F < 1e6, note: "Force within everyday engineering scale." }],
        };
      }
      const m = v.F / v.a;
      return {
        resultSym: "m", resultValue: m, resultUnit: "kg",
        resultText: `The mass must be ${fmt(m)} kg.`,
        extras: [{ label: "Its weight on Earth", value: `${fmt(m * 9.8)} N` }],
        substitute: [`m = F / a = ${fmt(v.F)} N / ${fmt(v.a)} m/s²`],
        calc: [`m = ${fmt(m)} kg`],
        meaning: `Mass is stubbornness: for the same push, more mass means less acceleration. This body resists exactly enough to give ${fmt(v.a)} m/s² under ${fmt(v.F)} N.`,
        sanity: [{ ok: m > 0, note: "Mass is positive." }],
      };
    },
    why: {
      simple: "Force is the price of changing motion. The more mass, the higher the price; the more force, the faster motion changes.",
      math: "Newton's second law defines F = dp/dt; for constant mass this reduces to F = ma — acceleration is net force divided by inertia.",
      visual: "On the bench, keep force fixed and raise mass: the velocity-time line tilts less steeply. Steepness IS acceleration.",
    },
    eli: {
      hook: "Pushes make things speed up. Heavy things need bigger pushes for the same speed-up.",
      analogy: "An empty shopping cart zooms with a small push; a cart full of bricks barely moves with the same push.",
      example: "50 N on 5 kg gives 10 m/s² — like a small car's gentle launch.",
    },
    teach: {
      concept: "F = ma links cause (force) to effect (acceleration) with mass as the exchange rate.",
      intuition: "Acceleration is how quickly speed changes; mass is how much the object argues back.",
      example: "Rocket liftoff: engines must push harder than weight (mg) or the acceleration stays zero or negative.",
    },
    quiz: {
      q: "The same force acts on 2 kg and 6 kg blocks. The 2 kg block accelerates…",
      options: ["3× more", "3× less", "the same", "9× more"],
      answer: 0,
      explain: "a = F/m; one third the mass → three times the acceleration.",
    },
    socratic: [
      {
        q: "A truck and a car feel the same net force. Which accelerates more — and why?",
        accept: ["car", "lighter", "less mass", "smaller mass"],
        hint: "a = F/m. Same F…",
        follow: "Right — smaller m means larger a for equal force.",
      },
      {
        q: "If the net force on a moving object drops to zero, what happens to its velocity?",
        accept: ["constant", "same", "stays", "keeps", "unchanged"],
        hint: "a = 0 means velocity is not changing…",
        follow: "Exactly — it coasts at constant velocity (Newton's first law).",
      },
    ],
  },

  /* ------------------------------------------------ momentum */
  momentum: {
    topic: "Mechanics",
    name: "Linear Momentum",
    level: "Class 9–11",
    simKind: "bench",
    graphKind: "p-v",
    assumption: "Single body, straight-line motion.",
    find: "Momentum p",
    formula: "p = m v",
    formulaUnits: "kg · m/s",
    vars: [
      V("m", "m", "Mass", "kg", 0.2, 20, 0.1, 2, BLUE),
      V("v", "v", "Velocity", "m/s", 0.5, 40, 0.1, 10, BLUE),
    ],
    whatifPresets: [
      { label: "Velocity × 2", varId: "v", mult: 2 },
      { label: "Mass × 2", varId: "m", mult: 2 },
    ],
    compute: ({ m, v }) => {
      const p = m * v;
      return {
        resultSym: "p", resultValue: p, resultUnit: "kg·m/s",
        resultText: `Momentum is ${fmt(p)} kg·m/s.`,
        extras: [
          { label: "Kinetic energy", value: `${fmt(0.5 * m * v * v)} J` },
          { label: "Impulse to stop it (F·Δt)", value: `${fmt(p)} N·s` },
        ],
        substitute: [`p = ${fmt(m)} kg × ${fmt(v)} m/s`],
        calc: [`p = ${fmt(p)} kg·m/s`],
        meaning: `Momentum is 'quantity of motion' — the thing conserved in every collision. Stopping this body needs ${fmt(p)} N·s of impulse: ${fmt(p / 1, 3)} N for 1 s, or a bigger force for less time.`,
        sanity: [{ ok: p > 0, note: "Momentum is positive along the motion direction." }],
      };
    },
    why: {
      simple: "Momentum counts how hard it is to stop something. Both weight and speed contribute — one at a time, not squared like energy.",
      math: "From F = dp/dt: force is the rate of momentum transfer. In collisions with no external force, Σp before = Σp after — a direct consequence of Newton's third law.",
      visual: "In the collision lab, the total momentum bar never changes during impact — only its split between the two carts.",
    },
    eli: {
      hook: "Momentum is how much 'moving' an object has.",
      analogy: "A slow truck is hard to stop; a fast tennis ball is not — momentum weighs both heaviness and speed.",
      example: "2 kg at 10 m/s has 20 kg·m/s — like 4 kg strolling at 5 m/s.",
    },
    teach: {
      concept: "p = mv is the conserved currency of collisions and rockets.",
      intuition: "Nature trades momentum between objects but never creates or destroys it (without outside pushes).",
      example: "A rifle kicks backward because the bullet carries forward momentum — the rifle must carry equal momentum the other way.",
    },
    quiz: {
      q: "A ball bounces off a wall at the same speed. Its momentum change is…",
      options: ["zero", "mv", "2mv", "mv²"],
      answer: 2,
      explain: "Momentum is a vector: from +mv to −mv is a change of 2mv.",
    },
    socratic: [
      {
        q: "A truck at 5 m/s and a bike at 40 m/s can share the same momentum. What does that tell you about their masses?",
        accept: ["truck heavier", "truck more mass", "bike lighter", "mass"],
        hint: "p = mv with equal p…",
        follow: "Yes — the slower one must be much more massive.",
      },
      {
        q: "In a collision with no outside forces, which total never changes?",
        accept: ["momentum", "p", "total momentum"],
        hint: "Energy can leak into sound and heat…",
        follow: "Correct — total momentum is always conserved; kinetic energy is not.",
      },
    ],
  },

  /* ------------------------------------------------ ohm */
  ohm: {
    topic: "Electricity",
    name: "Ohm's Law",
    level: "Class 10–12",
    simKind: "ohm",
    graphKind: "i-r",
    assumption: "Ohmic resistor at steady temperature (resistance constant).",
    find: "Current / Voltage / Resistance (whichever is missing)",
    formula: "V = I R",
    formulaUnits: "A · Ω  =  V",
    vars: [
      V("V", "V", "Voltage", "V", 0.5, 240, 0.5, 12, GREEN),
      V("R", "R", "Resistance", "Ω", 0.5, 500, 0.5, 4, AMBER),
      V("I", "I", "Current", "A", 0.01, 60, 0.01, 3, PURPLE),
    ],
    whatifPresets: [
      { label: "Resistance × 2", varId: "R", mult: 2 },
      { label: "Voltage × 2", varId: "V", mult: 2 },
      { label: "Resistance × ½", varId: "R", mult: 0.5 },
    ],
    compute: (v) => {
      const has = (x: number | undefined) => x !== undefined && x > 0;
      if (has(v.V) && has(v.R)) {
        const I = v.V / v.R;
        const P = v.V * I;
        return {
          resultSym: "I", resultValue: I, resultUnit: "A",
          resultText: `Current is ${fmt(I)} A; power dissipated ${fmt(P)} W.`,
          extras: [
            { label: "Power P = VI", value: `${fmt(P)} W` },
            { label: "Charge per second", value: `${fmt(I)} C/s` },
          ],
          substitute: [`I = V / R = ${fmt(v.V)} V / ${fmt(v.R)} Ω`],
          calc: [`I = ${fmt(I)} A`],
          meaning: `${fmt(v.V)} V pushes ${fmt(I)} coulombs through the resistor every second; each coulomb drops ${fmt(v.V)} J of energy there as heat (${fmt(P)} W).`,
          sanity: [
            { ok: P < 500, note: P >= 500 ? `P = ${fmt(P)} W — a real resistor would need serious cooling or it fails.` : "Power level is safe for a chunky power resistor." },
          ],
        };
      }
      if (has(v.V) && has(v.I)) {
        const R = v.V / v.I;
        return {
          resultSym: "R", resultValue: R, resultUnit: "Ω",
          resultText: `Resistance is ${fmt(R)} Ω.`,
          extras: [{ label: "Power P = VI", value: `${fmt(v.V * v.I)} W` }],
          substitute: [`R = V / I = ${fmt(v.V)} V / ${fmt(v.I)} A`],
          calc: [`R = ${fmt(R)} Ω`],
          meaning: `This component resists flow strongly enough that ${fmt(v.V)} V only drives ${fmt(v.I)} A.`,
          sanity: [{ ok: R > 0, note: "Resistance is positive for passive components." }],
        };
      }
      const V = v.I * v.R;
      return {
        resultSym: "V", resultValue: V, resultUnit: "V",
        resultText: `Required voltage is ${fmt(V)} V.`,
        extras: [{ label: "Power", value: `${fmt(V * v.I)} W` }],
        substitute: [`V = I R = ${fmt(v.I)} A × ${fmt(v.R)} Ω`],
        calc: [`V = ${fmt(V)} V`],
        meaning: `To shove ${fmt(v.I)} A through ${fmt(v.R)} Ω, the supply must provide ${fmt(V)} J per coulomb.`,
        sanity: [{ ok: V < 1000, note: V >= 1000 ? "Above ~1 kV, insulation and safety become dominant concerns." : "Voltage within common laboratory supplies." }],
      };
    },
    why: {
      simple: "Voltage is electrical push, resistance is the squeeze, current is how much gets through. More push → more flow; more squeeze → less flow.",
      math: "In ohmic materials, drift velocity of electrons is proportional to the electric field, so I ∝ V. The constant of proportionality is defined as 1/R.",
      visual: "In the circuit sim, raise R and watch the charge dots slow; raise V and they speed up — the ammeter obeys I = V/R live.",
    },
    eli: {
      hook: "Electricity flows like water through a pipe: voltage is the pump, resistance is the pipe being narrow.",
      analogy: "Same pump + narrower pipe = less water. Same pipe + stronger pump = more water. That's the whole law.",
      example: "A 12 V battery across 4 Ω pushes 3 A — like a steady little river.",
    },
    teach: {
      concept: "V = IR: the linear law linking push, flow and obstruction for ohmic conductors.",
      intuition: "Resistance converts electrical energy to heat; the voltage is the energy spent per coulomb making it through.",
      example: "A phone charger negotiates exactly this: fixed voltage, device sets effective resistance, current follows.",
    },
    quiz: {
      q: "Voltage stays fixed and resistance doubles. The current…",
      options: ["doubles", "halves", "stays the same", "quadruples"],
      answer: 1,
      explain: "I = V/R — current is inversely proportional to resistance.",
    },
    socratic: [
      {
        q: "Why do birds sit safely on high-voltage lines?",
        accept: ["no difference", "same potential", "no voltage across", "both feet same"],
        hint: "What matters is the voltage across the body…",
        follow: "Yes — almost no potential difference between its feet, so almost no current flows through the bird.",
      },
      {
        q: "If current through a resistor doubles at the same voltage, the resistance must have…",
        accept: ["halved", "half", "divided", "reduced by 2"],
        hint: "R = V/I.",
        follow: "Correct — R = V/I, so double I means half R.",
      },
    ],
  },

  /* ------------------------------------------------ pendulum */
  pendulum: {
    topic: "Mechanics",
    name: "Simple Pendulum",
    level: "Class 11",
    simKind: "pendulum",
    graphKind: "pend-theta",
    assumption: "Small-angle result T = 2π√(L/g) shown analytically; the sim integrates the full nonlinear equation.",
    find: "Period T",
    formula: "T = 2π √(L/g)",
    formulaUnits: "√(m / (m/s²))  =  s",
    vars: [
      V("L", "L", "Length", "m", 0.2, 5, 0.05, 1, BLUE),
      V("g", "g", "Gravity", "m/s²", 1, 25, 0.1, 9.8, RED),
      V("th0", "θ₀", "Release angle", "°", 5, 75, 1, 30, GREEN),
    ],
    whatifPresets: [
      { label: "Length × 4", varId: "L", mult: 4 },
      { label: "Gravity × 2", varId: "g", mult: 2 },
      { label: "Moon gravity", varId: "g", mult: 1.62 / 9.8 },
    ],
    compute: ({ L, g }) => {
      const T = 2 * Math.PI * Math.sqrt(L / g);
      return {
        resultSym: "T", resultValue: T, resultUnit: "s",
        resultText: `The period is ${fmt(T)} s (${fmt(1 / T, 3)} swings per second).`,
        extras: [
          { label: "Frequency f = 1/T", value: `${fmt(1 / T, 3)} Hz` },
          { label: "Length for a 1 s tick", value: `${fmt(9.8 / (4 * Math.PI * Math.PI), 3)} m` },
        ],
        substitute: [`T = 2π √(${fmt(L)} m / ${fmt(g)} m/s²)`],
        calc: [`L/g = ${fmt(L / g, 3)} s²`, `√(L/g) = ${fmt(Math.sqrt(L / g), 3)} s`],
        meaning: `Mass is absent again: a gold bob and a wooden bob of the same length swing in perfect synchrony. Length buys time as √L — quadruple the length to double the period.`,
        sanity: [
          { ok: T > 0, note: "Period is positive." },
          {
            ok: true,
            note: "At large release angles the true period is slightly longer than 2π√(L/g); the sim shows the real value.",
          },
        ],
      };
    },
    why: {
      simple: "A pendulum trades height for speed, over and over. The restoring push grows with angle, and gravity sets how urgent that push is — so time per swing depends only on length and g.",
      math: "For small θ, mLθ̈ = −mgθ → θ̈ = −(g/L)θ, the harmonic equation with ω² = g/L, hence T = 2π√(L/g). Mass cancels on both sides.",
      visual: "In the sim, double L and count the beats — the rhythm clearly halves in speed.",
    },
    eli: {
      hook: "A swing's rhythm depends on rope length — not on who sits on it.",
      analogy: "Short rope = quick little swings; long rope = slow lazy swings. Same on the Moon, just lazier.",
      example: "A 1 m pendulum ticks every ~2.0 s — grandfather clocks are built on this.",
    },
    teach: {
      concept: "Small-angle pendulums are nature's metronome: T = 2π√(L/g).",
      intuition: "Gravity supplies a restoring torque proportional to displacement — the recipe for steady oscillation.",
      example: "Galileo allegedly timed chandelier swings with his pulse and found the period independent of amplitude.",
    },
    quiz: {
      q: "To double a pendulum's period, you must make the length…",
      options: ["2× longer", "4× longer", "√2× longer", "8× longer"],
      answer: 1,
      explain: "T ∝ √L, so T ×2 needs L ×4.",
    },
    socratic: [
      {
        q: "A child and an adult sit on identical swings. Whose swing has the longer period?",
        accept: ["same", "equal", "neither", "identical"],
        hint: "Does mass appear in T = 2π√(L/g)?",
        follow: "Correct — mass cancels; the periods are identical.",
      },
      {
        q: "On the Moon (g ≈ 1.6), the same pendulum swings…",
        accept: ["slower", "longer period", "more slowly", "slower period"],
        hint: "g sits under the square root, in the denominator…",
        follow: "Yes — weaker gravity, gentler restoring pull, longer period (×~2.5).",
      },
    ],
  },

  /* ------------------------------------------------ spring */
  spring: {
    topic: "Mechanics",
    name: "Hooke's Law & SHM",
    level: "Class 11",
    simKind: "spring",
    graphKind: "spring-x",
    assumption: "Ideal massless spring within its elastic limit; sim adds adjustable damping.",
    find: "Restoring force F (and oscillation period)",
    formula: "F = −k x",
    formulaUnits: "(N/m) · m  =  N",
    vars: [
      V("k", "k", "Spring constant", "N/m", 5, 400, 1, 60, GREEN),
      V("x0", "x₀", "Initial stretch", "m", 0.02, 0.6, 0.01, 0.25, BLUE),
      V("m", "m", "Hanging mass", "kg", 0.2, 8, 0.1, 1.5, AMBER),
    ],
    whatifPresets: [
      { label: "Stiffness × 2", varId: "k", mult: 2 },
      { label: "Stretch × 2", varId: "x0", mult: 2 },
      { label: "Mass × 4", varId: "m", mult: 4 },
    ],
    compute: ({ k, x0, m }) => {
      const F = k * x0;
      const T = 2 * Math.PI * Math.sqrt(m / k);
      return {
        resultSym: "F", resultValue: F, resultUnit: "N",
        resultText: `The spring pulls back with ${fmt(F)} N; released, it oscillates every ${fmt(T)} s.`,
        extras: [
          { label: "Period T = 2π√(m/k)", value: `${fmt(T)} s` },
          { label: "Stored energy ½kx₀²", value: `${fmt(0.5 * k * x0 * x0)} J` },
        ],
        substitute: [`F = k x₀ = ${fmt(k)} N/m × ${fmt(x0)} m`],
        calc: [`F = ${fmt(F)} N`],
        meaning: `The minus sign is the soul of the law: the spring always argues against displacement. Released, that argument becomes oscillation — energy sloshing between spring and motion every ${fmt(T)} s.`,
        sanity: [{ ok: F < 2000, note: "Force is inside typical lab-spring limits." }],
      };
    },
    why: {
      simple: "Stretch a spring and it pulls back in proportion — twice the stretch, twice the pull. This linear pushback is what makes clean, musical oscillation possible.",
      math: "F = −kx gives ẍ = −(k/m)x — again the harmonic equation, now with ω² = k/m. Stiffer spring or lighter mass → faster vibration.",
      visual: "In the sim, the force arrow is always aimed at the rest point, longest at the extremes, zero at the middle — exactly −kx.",
    },
    eli: {
      hook: "Springs are grumpy: the more you stretch them, the harder they pull back.",
      analogy: "Like a rubber-band tug-of-war that gets stronger the further you drag it — let go, and it bounces back and forth.",
      example: "A 60 N/m spring stretched 25 cm pulls with 15 N — about the weight of 1.5 kg.",
    },
    teach: {
      concept: "Hooke's law F = −kx is the linear restoring force behind springs, bonds, and vibrations.",
      intuition: "Near equilibrium, almost every system pushes back proportionally to displacement — that's why so much of physics oscillates.",
      example: "Car suspension springs are chosen so k and the car's mass give a comfortable ~1 Hz bounce.",
    },
    quiz: {
      q: "A spring is cut in half. Each half is…",
      options: ["softer (smaller k)", "stiffer (larger k)", "unchanged", "k depends on length?"],
      answer: 1,
      explain: "Same force stretches a half-spring only half as far → k doubles.",
    },
    socratic: [
      {
        q: "Where in the swing of a mass on a spring is the force zero? Where is it largest?",
        accept: ["middle", "equilibrium", "extremes", "ends"],
        hint: "F = −kx. When is x zero?",
        follow: "Yes — zero force at equilibrium, maximum force at maximum stretch.",
      },
      {
        q: "To make a mass-spring system vibrate faster, should you add mass or remove it?",
        accept: ["remove", "less mass", "lighter", "decrease mass"],
        hint: "T = 2π√(m/k).",
        follow: "Correct — lighter mass, smaller T, faster vibration.",
      },
    ],
  },

  /* ------------------------------------------------ collision */
  collision: {
    topic: "Mechanics",
    name: "Collisions & Restitution",
    level: "Class 11",
    simKind: "collision",
    graphKind: "coll-bars",
    assumption: "1-D collision on a frictionless track; restitution e constant during impact.",
    find: "Velocities after collision",
    formula: "v₁′ = ((m₁ − e·m₂)v₁ + (1+e)m₂v₂) / (m₁+m₂)",
    formulaUnits: "m/s",
    vars: [
      V("m1", "m₁", "Cart 1 mass", "kg", 0.5, 10, 0.1, 2, BLUE),
      V("v1", "v₁", "Cart 1 speed", "m/s", 0, 20, 0.1, 6, BLUE),
      V("m2", "m₂", "Cart 2 mass", "kg", 0.5, 10, 0.1, 3, GREEN),
      V("v2", "v₂", "Cart 2 speed", "m/s", -20, 20, 0.1, 0, GREEN),
      V("e", "e", "Restitution", "–", 0, 1, 0.01, 0.85, AMBER),
    ],
    whatifPresets: [
      { label: "Perfectly elastic (e=1)", varId: "e", mult: -1 },
      { label: "Perfectly inelastic (e=0)", varId: "e", mult: -0.000001 },
      { label: "Cart 1 speed × 2", varId: "v1", mult: 2 },
    ],
    compute: ({ m1, v1, m2, v2, e }) => {
      const u1 = ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / (m1 + m2);
      const u2 = ((m2 - e * m1) * v2 + (1 + e) * m1 * v1) / (m1 + m2);
      const pb = m1 * v1 + m2 * v2;
      const pa = m1 * u1 + m2 * u2;
      const keb = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
      const kea = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2;
      const loss = keb > 0 ? ((keb - kea) / keb) * 100 : 0;
      return {
        resultSym: "v′", resultValue: u2, resultUnit: "m/s",
        resultText: `After impact: cart 1 → ${fmt(u1)} m/s, cart 2 → ${fmt(u2)} m/s.`,
        extras: [
          { label: "Momentum before / after", value: `${fmt(pb)} / ${fmt(pa)} kg·m/s` },
          { label: "KE before / after", value: `${fmt(keb)} / ${fmt(kea)} J` },
          { label: "KE lost", value: `${fmt(loss, 3)} %` },
        ],
        substitute: [
          `v₁′ = ((${fmt(m1)} − ${fmt(e)}·${fmt(m2)})·${fmt(v1)} + ${fmt(1 + e, 3)}·${fmt(m2)}·${fmt(v2)}) / ${fmt(m1 + m2)}`,
        ],
        calc: [`v₁′ = ${fmt(u1)} m/s`, `v₂′ = ${fmt(u2)} m/s`],
        meaning: `Momentum survived the crash exactly (${fmt(pb)} → ${fmt(pa)} kg·m/s); kinetic energy did not — ${fmt(loss, 3)}% became sound, heat and deformation. e = 1 keeps all KE; e = 0 welds the carts together.`,
        sanity: [
          { ok: Math.abs(pa - pb) < Math.max(1e-6, Math.abs(pb)) * 1e-6, note: "Momentum conservation verified numerically." },
          { ok: loss >= -1e-9, note: "KE never increases in a passive collision." },
        ],
      };
    },
    why: {
      simple: "During the brief crash, the carts push each other equally and oppositely — so what one loses in momentum, the other gains. How bouncy the materials are (e) decides how much speed survives.",
      math: "Two constraints: momentum conservation m₁v₁+m₂v₂ = m₁v₁′+m₂v₂′, plus Newton's restitution law v₂′−v₁′ = e(v₁−v₂). Two equations, two unknowns.",
      visual: "In the collision sim, watch the momentum bar: it never flinches through impact, while the KE bar dips by exactly the computed loss.",
    },
    eli: {
      hook: "When things crash, motion is shared — never destroyed.",
      analogy: "Like two shopping carts bumping: the fast one slows, the slow one speeds up, and together they keep the same total 'push'.",
      example: "A 2 kg cart at 6 m/s hits a parked 3 kg cart (e≈0.85): they part at ~1 and ~4 m/s.",
    },
    teach: {
      concept: "Collisions are solved by momentum conservation plus a restitution rule.",
      intuition: "Momentum always balances the books; kinetic energy only balances if the collision is perfectly elastic.",
      example: "Crumple zones make car crashes more inelastic on purpose — spreading the energy into bending metal instead of people.",
    },
    quiz: {
      q: "In every collision without external forces, which quantity is definitely conserved?",
      options: ["kinetic energy", "momentum", "speed", "restitution"],
      answer: 1,
      explain: "Momentum conservation follows from Newton's third law; KE is only conserved when e = 1.",
    },
    socratic: [
      {
        q: "A ball of putty sticks to a wall; a superball bounces back. Which delivers a bigger momentum kick to the wall?",
        accept: ["superball", "bounces", "bouncing", "elastic"],
        hint: "Compare Δp = final − initial momentum of each ball.",
        follow: "Right — the bounce reverses momentum (Δp ≈ 2mv), the putty only stops (Δp = mv).",
      },
      {
        q: "Two identical carts collide elastically, one initially at rest. What happens after?",
        accept: ["stops", "first stops", "exchange", "swap", "transfers"],
        hint: "Newton's cradle shows the answer…",
        follow: "Exactly — they swap velocities; the moving cart stops dead.",
      },
    ],
  },

  /* ------------------------------------------------ wave */
  wave: {
    topic: "Waves",
    name: "Wave Speed (v = fλ)",
    level: "Class 9–11",
    simKind: "waves",
    graphKind: "wave-f",
    assumption: "Linear, non-dispersive medium (speed independent of frequency).",
    find: "Wave speed v",
    formula: "v = f λ",
    formulaUnits: "(1/s) · m  =  m/s",
    vars: [
      V("f", "f", "Frequency", "Hz", 0.2, 2000, 0.1, 2, PURPLE),
      V("lambda", "λ", "Wavelength", "m", 0.05, 10, 0.05, 0.75, PURPLE),
      V("A", "A", "Amplitude", "m", 0.01, 1, 0.01, 0.3, BLUE),
    ],
    whatifPresets: [
      { label: "Frequency × 2", varId: "f", mult: 2 },
      { label: "Wavelength × ½", varId: "lambda", mult: 0.5 },
    ],
    compute: ({ f, lambda }) => {
      const v = f * lambda;
      return {
        resultSym: "v", resultValue: v, resultUnit: "m/s",
        resultText: `The wave travels at ${fmt(v)} m/s.`,
        extras: [
          { label: "Period T = 1/f", value: `${fmt(1 / f, 3)} s` },
          { label: "ω = 2πf", value: `${fmt(2 * Math.PI * f, 3)} rad/s` },
        ],
        substitute: [`v = ${fmt(f)} Hz × ${fmt(lambda)} m`],
        calc: [`v = ${fmt(v)} m/s`],
        meaning: `Every oscillation lays down one wavelength; f oscillations per second therefore advance the pattern f·λ metres. In a given medium the speed is fixed — raise f and λ must shrink to compensate.`,
        sanity: [{ ok: v > 0, note: "Wave speed is positive in the propagation direction." }],
      };
    },
    why: {
      simple: "Count the crests passing a point: f each second, each λ long — the pattern covers f·λ of distance per second.",
      math: "For y(x,t) = A sin(kx − ωt), a crest satisfies kx − ωt = const, so dx/dt = ω/k = (2πf)/(2π/λ) = fλ.",
      visual: "In the wave studio, fix λ and raise f: the crests visibly sprint across the tank.",
    },
    eli: {
      hook: "Waves move by rhythm: how often it wiggles × how long each wiggle is.",
      analogy: "A train: cars (wavelengths) pass you at a rhythm (frequency). Train speed = car length × cars per second.",
      example: "A 2 Hz ripple 0.75 m long slides across the pond at 1.5 m/s.",
    },
    teach: {
      concept: "v = fλ couples time-rhythm and spatial size of any travelling wave.",
      intuition: "The medium sets v; the source sets f; λ is what's left over.",
      example: "Sound in air (~343 m/s): a 440 Hz note has λ ≈ 0.78 m — roughly guitar-sized.",
    },
    quiz: {
      q: "Sound enters water where it travels ~4× faster. Its frequency…",
      options: ["quadruples", "stays the same", "quarters", "doubles"],
      answer: 1,
      explain: "The source sets frequency; the medium sets speed; wavelength adjusts.",
    },
    socratic: [
      {
        q: "You double the frequency of a wave on the same rope. What happens to its speed and wavelength?",
        accept: ["speed same", "wavelength halves", "half", "constant speed"],
        hint: "The rope decides the speed…",
        follow: "Correct — speed stays (set by the rope), wavelength halves.",
      },
      {
        q: "Why does a wave bend (refract) entering a new medium?",
        accept: ["speed changes", "velocity changes", "slower"],
        hint: "Which of v, f, λ is forced to change at the boundary?",
        follow: "Yes — v changes while f stays, so λ changes, and the wavefront pivots.",
      },
    ],
  },

  /* ------------------------------------------------ orbit */
  orbit: {
    topic: "Astrophysics",
    name: "Circular Orbital Motion",
    level: "Class 11+",
    simKind: "orbit",
    graphKind: "orbit-v",
    assumption: "Two-body problem, Earth as a point mass, circular orbit; sim scales distances for display, readouts use real values.",
    find: "Orbital speed v (and period T)",
    formula: "v = √(GM/r)",
    formulaUnits: "√((m³/kg·s²)·kg / m)  =  m/s",
    vars: [
      V("h", "h", "Altitude above surface", "km", 200, 36000, 50, 400, BLUE),
    ],
    whatifPresets: [
      { label: "Gravity disappears (g→0)", varId: "g0", mult: 0 },
      { label: "Speed × 0.7", varId: "vmult", mult: 0.7 },
      { label: "Speed × 1.4 (≈√2)", varId: "vmult", mult: 1.414 },
      { label: "Altitude × 2", varId: "h", mult: 2 },
    ],
    compute: ({ h }) => {
      const r = R_EARTH + h * 1000;
      const v = Math.sqrt((G * M_EARTH) / r);
      const T = (2 * Math.PI * r) / v;
      const gloc = (G * M_EARTH) / (r * r);
      return {
        resultSym: "v", resultValue: v, resultUnit: "m/s",
        resultText: `Orbital speed at ${fmt(h)} km altitude: ${fmt(v)} m/s (${fmt(v * 3.6)} km/h).`,
        extras: [
          { label: "Orbit period", value: `${fmt(T / 60)} min` },
          { label: "Local gravity g(r)", value: `${fmt(gloc, 3)} m/s²` },
          { label: "Escape speed √2·v", value: `${fmt(v * Math.SQRT2)} m/s` },
        ],
        substitute: [`v = √(6.674×10⁻¹¹ × 5.972×10²⁴ / ${fmt(r, 4)} m)`],
        calc: [`GM = 3.986×10¹⁴ m³/s²`, `v = √(GM/r) = ${fmt(v)} m/s`],
        meaning: `The satellite IS falling — but its sideways speed makes Earth's surface curve away exactly as fast as it falls. Astronauts float not because gravity is gone (it's still ${fmt((gloc / 9.8) * 100, 3)}% of surface g) but because everything falls together.`,
        sanity: [
          { ok: h >= 160, note: h < 160 ? "Below ~160 km, atmospheric drag decays orbits within days." : "Above practical drag limits for LEO." },
          { ok: v < 11200, note: "Below Earth's escape speed — a bound orbit, as expected." },
        ],
      };
    },
    why: {
      simple: "Orbiting is falling with style: throw anything fast enough sideways and the ground curves away before it can land.",
      math: "Set gravity as centripetal force: GMm/r² = mv²/r → v = √(GM/r). The mass m cancels — every satellite at radius r needs the same speed.",
      visual: "In the orbit sim, switch gravity off: the satellite obeys Newton's first law and leaves in a straight line — proof that gravity was the only thing bending the path.",
    },
    eli: {
      hook: "The Moon never stops falling toward Earth — it's just so fast sideways that it keeps missing.",
      analogy: "Roll a ball off a table: it lands nearby. Now imagine throwing it so fast the Earth curves beneath it forever. That's an orbit.",
      example: "The ISS circles at ~7.7 km/s — one lap every ~90 minutes, falling the whole time.",
    },
    teach: {
      concept: "Circular orbits balance gravitational pull against the speed needed to keep missing the planet.",
      intuition: "Gravity supplies the turning force; the required speed depends only on planet and radius.",
      example: "Geostationary satellites sit at 35,786 km where the period is exactly 24 h, so they hang over one spot.",
    },
    quiz: {
      q: "Inside the ISS, astronauts float because…",
      options: [
        "there is no gravity up there",
        "they are in continuous free fall",
        "air pressure cancels gravity",
        "the ISS shields gravity",
      ],
      answer: 1,
      explain: "Gravity at ISS altitude is ~90% of surface g; everything falls together, producing weightlessness.",
    },
    socratic: [
      {
        q: "If gravity suddenly switched off, what path would the satellite follow?",
        accept: ["straight", "straight line", "tangent", "linear"],
        hint: "Newton's first law with no force…",
        follow: "Exactly — a straight line along its instantaneous velocity (try the WHAT IF button).",
      },
      {
        q: "Is there gravity at the ISS's altitude (~400 km)?",
        accept: ["yes", "almost", "90", "most of it"],
        hint: "g weakens with r² — at 400 km, r has barely grown…",
        follow: "Yes — about 8.7 m/s². Weightlessness is free fall, not absence of gravity.",
      },
    ],
  },

  /* ------------------------------------------------ work */
  work: {
    topic: "Mechanics",
    name: "Work Done by a Force",
    level: "Class 9–11",
    simKind: "bench",
    graphKind: "work-d",
    assumption: "Constant force parallel to displacement.",
    find: "Work W",
    formula: "W = F d",
    formulaUnits: "N · m  =  J",
    vars: [
      V("F", "F", "Force", "N", 1, 10000, 1, 40, RED),
      V("d", "d", "Distance", "m", 0.5, 200, 0.5, 8, BLUE),
      V("m", "m", "Mass", "kg", 0.5, 30, 0.5, 5, AMBER),
    ],
    whatifPresets: [
      { label: "Force × 2", varId: "F", mult: 2 },
      { label: "Distance × 2", varId: "d", mult: 2 },
    ],
    compute: ({ F, d, m }) => {
      const W = F * d;
      const vf = Math.sqrt((2 * W) / m);
      return {
        resultSym: "W", resultValue: W, resultUnit: "J",
        resultText: `The force deposits ${fmt(W)} J of energy over ${fmt(d)} m.`,
        extras: [
          { label: "Final speed if all → KE", value: `${fmt(vf)} m/s` },
          { label: "Average power over 3 s", value: `${fmt(W / 3)} W` },
        ],
        substitute: [`W = ${fmt(F)} N × ${fmt(d)} m`],
        calc: [`W = ${fmt(W)} J`],
        meaning: `Pushing ${fmt(F)} N across ${fmt(d)} m transfers ${fmt(W)} J into the body — on a frictionless bench that becomes motion at ${fmt(vf)} m/s.`,
        sanity: [{ ok: W >= 0, note: "Positive work adds energy to the body." }],
      };
    },
    why: {
      simple: "Force alone doesn't spend energy — force times distance does. Pushing a wall all day is tiring but does zero joules of work on the wall.",
      math: "W = ∫F·dx. With F constant and parallel: W = Fd. The work-energy theorem then says ΔKE = W_net.",
      visual: "On the bench sim the green energy bar fills exactly as the cart crosses the measured distance.",
    },
    eli: {
      hook: "Work is effort that actually moves something.",
      analogy: "Carrying groceries up stairs does work; holding them still doesn't — no movement, no work, however sweaty.",
      example: "40 N over 8 m = 320 J — enough to warm a sip of tea by a fraction of a degree.",
    },
    teach: {
      concept: "W = Fd measures energy transferred by a force acting through a distance.",
      intuition: "The joule is a push of one newton travelling one metre.",
      example: "Climbing 3 m of stairs (mg·h ≈ 700·10·3? for 70 kg ≈ 2.1 kJ) — your legs do that much work.",
    },
    quiz: {
      q: "You push hard on a stuck car that doesn't move. Work done on the car is…",
      options: ["large", "zero", "equal to your force", "negative"],
      answer: 1,
      explain: "d = 0 → W = F·0 = 0. Your muscles burn energy internally, but no work reaches the car.",
    },
    socratic: [
      {
        q: "A waiter carries a tray horizontally at constant speed. Is he doing work on the tray?",
        accept: ["no", "zero", "none", "not really"],
        hint: "His upward force is perpendicular to the motion…",
        follow: "Correct — force ⊥ displacement means zero work (gravity does none either at constant height).",
      },
      {
        q: "Doubling the pushing distance with the same force doubles…?",
        accept: ["work", "energy", "w", "joules"],
        hint: "W = Fd is linear in d.",
        follow: "Yes — and by the work-energy theorem, doubles the KE gained.",
      },
    ],
  },

  /* ------------------------------------------------ gravforce */
  gravforce: {
    topic: "Astrophysics",
    name: "Newton's Law of Gravitation",
    level: "Class 9–11",
    simKind: "orbit",
    graphKind: "grav-r",
    assumption: "Point masses / spherical symmetry, no other bodies.",
    find: "Gravitational force F",
    formula: "F = G m₁ m₂ / r²",
    formulaUnits: "(m³/kg·s²)·kg² / m²  =  N",
    vars: [
      V("m1", "m₁", "Mass 1", "kg", 0.1, 3e30, 0.1, 50, BLUE),
      V("m2", "m₂", "Mass 2", "kg", 0.1, 3e30, 0.1, 80, GREEN),
      V("r", "r", "Separation", "m", 0.5, 2e11, 0.1, 1, RED),
    ],
    whatifPresets: [
      { label: "Distance × 2", varId: "r", mult: 2 },
      { label: "Distance × ½", varId: "r", mult: 0.5 },
      { label: "Mass 1 × 2", varId: "m1", mult: 2 },
    ],
    compute: ({ m1, m2, r }) => {
      const F = (G * m1 * m2) / (r * r);
      return {
        resultSym: "F", resultValue: F, resultUnit: "N",
        resultText: `The attraction is ${fmt(F)} N — tiny at human scales, but it rules planets.`,
        extras: [
          { label: "If both masses ×10", value: `${fmt(F * 100, 3)} N` },
          { label: "Earth–Moon equivalent F", value: "1.98×10²⁰ N" },
        ],
        substitute: [`F = 6.674×10⁻¹¹ × ${fmt(m1)} × ${fmt(m2)} / (${fmt(r)})²`],
        calc: [`F = ${fmt(F)} N`],
        meaning: `Every kilogram attracts every other kilogram. G is so small that you only notice when a planet is involved — yet this exact formula sent Apollo to the Moon.`,
        sanity: [{ ok: F > 0, note: "Gravity is always attractive between masses." }],
      };
    },
    why: {
      simple: "Mass whispers to mass across empty space: more mass, louder whisper; more distance, much quieter (squared).",
      math: "F = Gm₁m₂/r² — an inverse-square law, the same geometry as light spreading over a sphere's area 4πr².",
      visual: "In the force-view sim, drag separation and watch the arrow shrink by quarters as distance doubles.",
    },
    eli: {
      hook: "Everything with mass pulls on everything else — you are gently tugging the Moon right now.",
      analogy: "Gravity is like an invisible rubber band between any two things; fatter things, tighter band; farther apart, lazier band.",
      example: "Two people 1 m apart attract with ~10⁻⁷ N — a millionth of the weight of a grain of sand.",
    },
    teach: {
      concept: "Universal gravitation: every mass attracts every mass with F = Gm₁m₂/r².",
      intuition: "The same law that drops an apple holds the Moon — Newton's great unification.",
      example: "Cavendish 'weighed the Earth' by measuring G with lead balls and a torsion balance.",
    },
    quiz: {
      q: "The distance between two masses doubles. The gravitational force becomes…",
      options: ["half", "one quarter", "double", "unchanged"],
      answer: 1,
      explain: "Inverse-square: F ∝ 1/r² → doubling r divides F by 4.",
    },
    socratic: [
      {
        q: "The Moon is ~60 Earth-radii away. Surface gravity is 9.8 m/s². Guess the gravity at the Moon's distance.",
        accept: ["0.0027", "1/3600", "0.003", "3600"],
        hint: "Inverse square of 60…",
        follow: "Right — 9.8/60² ≈ 0.0027 m/s², exactly what keeps the Moon in its monthly orbit.",
      },
      {
        q: "If the Sun's mass doubled (size unchanged), Earth's orbital speed would…",
        accept: ["increase", "faster", "go up", "higher"],
        hint: "v = √(GM/r).",
        follow: "Correct — stronger pull demands a faster orbit at the same radius.",
      },
    ],
  },

  /* ------------------------------------------------ refraction */
  refraction: {
    topic: "Optics",
    name: "Refraction & Snell's Law",
    level: "Class 10–12",
    simKind: "optics",
    graphKind: "snell",
    assumption: "Plane interface between two transparent, isotropic media; monochromatic ray.",
    find: "Angle of refraction θ₂",
    formula: "n₁ sin θ₁ = n₂ sin θ₂",
    formulaUnits: "dimensionless",
    vars: [
      V("n1", "n₁", "Medium 1 index", "–", 1, 2.5, 0.01, 1, PURPLE),
      V("th1", "θ₁", "Incidence angle", "°", 5, 85, 1, 40, BLUE),
      V("n2", "n₂", "Medium 2 index", "–", 1, 2.5, 0.01, 1.5, PURPLE),
    ],
    whatifPresets: [
      { label: "Into water (n₂=1.33)", varId: "n2", mult: -1.33 },
      { label: "Into diamond (n₂=2.42)", varId: "n2", mult: -2.42 },
      { label: "Steeper incidence +20°", varId: "th1", mult: -60 },
    ],
    compute: ({ n1, th1, n2 }) => {
      const s = (n1 * Math.sin((th1 * Math.PI) / 180)) / n2;
      const tir = s > 1;
      const th2 = tir ? NaN : (Math.asin(s) * 180) / Math.PI;
      const crit = n1 > n2 ? (Math.asin(n2 / n1) * 180) / Math.PI : NaN;
      return {
        resultSym: "θ₂",
        resultValue: tir ? crit : th2,
        resultUnit: "°",
        resultText: tir
          ? `Total internal reflection — θ₁ exceeds the critical angle ${fmt(crit)}°. No ray escapes.`
          : `The ray bends to ${fmt(th2)}° ${n2 > n1 ? "toward" : "away from"} the normal.`,
        extras: [
          { label: "sin θ₂", value: tir ? `${fmt(s, 3)} > 1 (impossible)` : fmt(s, 3) },
          { label: "Critical angle", value: isNaN(crit) ? "none (n₁ ≤ n₂)" : `${fmt(crit)}°` },
          { label: "Speed ratio v₂/v₁ = n₁/n₂", value: fmt(n1 / n2, 3) },
        ],
        substitute: [`sin θ₂ = (n₁/n₂) sin θ₁ = (${fmt(n1, 3)}/${fmt(n2, 3)}) × sin ${fmt(th1)}°`],
        calc: [tir ? `sin θ₂ = ${fmt(s, 3)} → no solution: TIR` : `θ₂ = arcsin(${fmt(s, 3)}) = ${fmt(th2)}°`],
        meaning: tir
          ? `Past ${fmt(crit)}° the second medium cannot accept the ray — light is mirrored perfectly inside. Optical fibres live on this trick.`
          : `Light slows to ${fmt((n1 / n2) * 100, 3)}% of its first speed in medium 2; the wavefront pivot we call bending keeps the crests continuous across the boundary.`,
        sanity: [
          { ok: true, note: "Frequency never changes at a boundary; only speed and wavelength do." },
        ],
      };
    },
    why: {
      simple: "Light takes the route of least time (Fermat). Slower medium → light skews its path to spend less distance there — that skew is refraction.",
      math: "Matching wavefront phase across the boundary: the along-surface wavelength must agree, giving n₁sinθ₁ = n₂sinθ₂.",
      visual: "In the optics sim, raise n₂ and watch the transmitted ray swing toward the normal until it vanishes into total internal reflection.",
    },
    eli: {
      hook: "Light bends because it changes speed — like a cart whose wheels hit sand on one side first.",
      analogy: "Marching band crossing mud at an angle: the rows in mud slow down, the whole line pivots. That pivot is the bent ray.",
      example: "A straw in a glass of water looks snapped at the surface — that's Snell's law fooling your eyes.",
    },
    teach: {
      concept: "Snell's law n₁sinθ₁ = n₂sinθ₂ governs how rays bend between media.",
      intuition: "Index n = c/v: how much the medium slows light. Bigger n, closer the ray hugs the normal.",
      example: "Diamond's n = 2.42 gives a tiny critical angle (~24°), trapping light in sparkle.",
    },
    quiz: {
      q: "Light passes from water (n=1.33) to air (n=1). The ray bends…",
      options: ["toward the normal", "away from the normal", "not at all", "into a circle"],
      answer: 1,
      explain: "Entering a faster (lower-n) medium, the ray speeds up and bends away from the normal.",
    },
    socratic: [
      {
        q: "Which stays unchanged when light crosses into glass: speed, wavelength, or frequency?",
        accept: ["frequency", "f", "freq"],
        hint: "The boundary can't create or destroy wave crests…",
        follow: "Correct — frequency survives; speed and wavelength change together.",
      },
      {
        q: "When can light be totally reflected inside a medium?",
        accept: ["critical angle", "dense to rarer", "beyond critical", "tir"],
        hint: "It must travel from higher n to lower n, and…",
        follow: "Yes — from denser to rarer, beyond the critical angle: total internal reflection.",
      },
    ],
  },

  /* ------------------------------------------------ inclined plane */
  incline: {
    topic: "Mechanics",
    name: "Inclined Plane",
    level: "Class 11",
    simKind: "incline",
    graphKind: "incline-a",
    assumption: "Rigid block on a plane; kinetic friction μ constant once sliding; no air drag.",
    find: "Acceleration down the plane",
    formula: "a = g(sin θ − μ cos θ)",
    formulaUnits: "m/s²",
    vars: [
      V("m", "m", "Mass", "kg", 0.5, 20, 0.1, 4, BLUE),
      V("th", "θ", "Incline angle", "°", 5, 60, 1, 30, AMBER),
      V("mu", "μ", "Friction coeff.", "–", 0, 1, 0.01, 0, RED),
    ],
    whatifPresets: [
      { label: "Friction → zero", varId: "mu", mult: 0 },
      { label: "μ = 0.2", varId: "mu", mult: -0.2 },
      { label: "Angle → 45°", varId: "th", mult: 1.5 },
      { label: "Double mass", varId: "m", mult: 2 },
    ],
    compute: (v) => {
      const th = (v.th * Math.PI) / 180;
      const N = v.m * 9.8 * Math.cos(th);
      const amax = 9.8 * (Math.sin(th) - v.mu * Math.cos(th));
      const slides = amax > 1e-6;
      const a = slides ? amax : 0;
      const f = slides ? v.mu * N : v.m * 9.8 * Math.sin(th);
      return {
        resultSym: "a", resultValue: a, resultUnit: "m/s²",
        resultText: slides
          ? `The block accelerates down the plane at ${fmt(a)} m/s².`
          : `Static friction holds the block: a = 0 (needs μ < tan θ = ${fmt(Math.tan(th), 3)}).`,
        extras: [
          { label: "Normal reaction N", value: `${fmt(N)} N` },
          { label: "Friction force f", value: `${fmt(f)} N` },
          { label: "g sinθ (drive)", value: `${fmt(9.8 * Math.sin(th))} m/s²` },
          { label: "μg cosθ (brake)", value: `${fmt(9.8 * v.mu * Math.cos(th))} m/s²` },
        ],
        substitute: [`a = 9.8 × (sin ${fmt(v.th)}° − ${fmt(v.mu)} × cos ${fmt(v.th)}°)`],
        calc: [`a = 9.8 × (${fmt(Math.sin(th), 4)} − ${fmt(v.mu * Math.cos(th), 4)}) = ${fmt(amax)} m/s²`],
        meaning: slides
          ? "Resolve weight into mg sinθ down the slope and mg cosθ into the slope. Friction brakes with μN; whatever is left sets the acceleration — and mass cancels, so every block slides identically."
          : "Static friction is self-adjusting up to μN. Here its ceiling exceeds the downhill pull, so the block stays put.",
        sanity: [
          { ok: a <= 9.8001, note: "a ≤ g — a ramp can never beat free fall" },
          { ok: v.mu <= 1.05, note: `μ = ${fmt(v.mu)} is a realistic coefficient` },
        ],
      };
    },
    why: {
      simple: "Only the component of gravity parallel to the slope can pull the block along it — the rest is absorbed by the surface.",
      math: "Rotate axes by θ: ΣF∥ = mg sinθ − μN with N = mg cosθ, so a = F∥/m = g(sinθ − μcosθ). m cancels everywhere.",
      visual: "In the rig, red mg splits into two amber components; the blue downhill arrow minus the friction arrow is the net force.",
    },
    eli: {
      hook: "Slide vs staircase",
      analogy: "A playground slide is a gentle staircase. The steeper it is, the more of gravity's pull points along it.",
      example: "Lie a book flat on a board and tilt slowly — it only slides once the tilt beats friction, exactly at tan θ = μ.",
    },
    teach: {
      concept: "Weight is one force, but on a slope it has two jobs: press into the surface (mg cosθ) and pull downhill (mg sinθ).",
      intuition: "Friction is proportional to the pressing job, so rougher surfaces and gentler slopes both reduce the downhill winner.",
      example: "Ski wax lowers μ; a 30° slope with μ = 0.1 gives a = 9.8(0.5 − 0.087) = 4.05 m/s².",
    },
    quiz: {
      q: "A block sits on a 30° slope with μ = 0.7. What happens? (tan 30° ≈ 0.577)",
      options: ["It slides at 4.9 m/s²", "It stays at rest", "It slides at 9.8 m/s²", "It flies off"],
      answer: 1,
      explain: "Sliding needs μ < tan θ. Here 0.7 > 0.577, so static friction wins and a = 0.",
    },
    socratic: [
      { q: "On a slope, is the full weight mg pulling the block downhill?", accept: ["no", "not all", "only part", "component"], hint: "Split mg into two directions — one into the slope, one along it.", follow: "Exactly — only mg sinθ acts along the plane; mg cosθ presses into it." },
      { q: "If two blocks of different mass slide down the same frictionless slope, which lands first?", accept: ["same", "together", "both", "equal"], hint: "Write a = g sinθ. Where is the mass?", follow: "Right — mass cancels: both accelerate at g sinθ. Galileo was onto something." },
    ],
  },

  /* ------------------------------------------------ circular motion */
  circular: {
    topic: "Mechanics",
    name: "Circular Motion",
    level: "Class 11",
    simKind: "circular",
    graphKind: "circ-v",
    assumption: "Uniform circular motion; string/road supplies the centripetal force; no tangential forces.",
    find: "Centripetal force F_c",
    formula: "F_c = m v² / r",
    formulaUnits: "kg · m/s²  =  N",
    vars: [
      V("m", "m", "Mass", "kg", 0.05, 200, 0.05, 0.15, BLUE),
      V("v", "v", "Speed", "m/s", 0.5, 30, 0.1, 2.81, GREEN),
      V("r", "r", "Radius", "m", 0.2, 5, 0.05, 0.8, AMBER),
    ],
    whatifPresets: [
      { label: "Speed × 2", varId: "v", mult: 2 },
      { label: "Radius × 2", varId: "r", mult: 2 },
      { label: "Radius × ½", varId: "r", mult: 0.5 },
      { label: "Mass × 2", varId: "m", mult: 2 },
    ],
    compute: (v) => {
      const F = (v.m * v.v * v.v) / v.r;
      const w = v.v / v.r;
      const T = (2 * Math.PI * v.r) / v.v;
      return {
        resultSym: "F_c", resultValue: F, resultUnit: "N",
        resultText: `The inward (centripetal) force needed is ${fmt(F)} N — supplied by the string tension here.`,
        extras: [
          { label: "Centripetal accel a_c", value: `${fmt(v.v * v.v / v.r)} m/s²` },
          { label: "Angular speed ω", value: `${fmt(w)} rad/s` },
          { label: "Period T", value: `${fmt(T)} s` },
        ],
        substitute: [`F = ${fmt(v.m)} × ${fmt(v.v)}² / ${fmt(v.r)}`],
        calc: [`F = ${fmt(v.m)} × ${fmt(v.v * v.v, 4)} / ${fmt(v.r)} = ${fmt(F)} N`],
        meaning: "Speed is constant but velocity keeps turning — that turning needs an inward force. Double the speed and the demand quadruples; halve the radius and it doubles.",
        sanity: [
          { ok: F < 1e5, note: "Force within everyday laboratory scale" },
          { ok: v.v * v.v / v.r < 1e4, note: "Acceleration far below structural limits" },
        ],
      };
    },
    why: {
      simple: "Something has to keep yanking the object inward, otherwise its natural straight-line motion takes over.",
      math: "Velocity rotates at ω = v/r, so dv/dt has magnitude vω = v²/r toward the centre; Newton then demands F = mv²/r inward.",
      visual: "The rig shows velocity tangential (blue) and force radial (red) — perpendicular at every instant, which is why speed never changes.",
    },
    eli: {
      hook: "The bucket spin",
      analogy: "Swing a bucket of water in a vertical circle fast enough and the water stays in — your arm plays the string.",
      example: "In a turning car you feel pushed outward; really the car door is pushing you inward around the curve.",
    },
    teach: {
      concept: "Centripetal force is not a new force — it's the name for whatever real force (tension, friction, gravity) points to the centre.",
      intuition: "Sharp turn (small r) or high speed both demand more inward force; that's why highways bank curves.",
      example: "NCERT example: 0.15 kg stone, r = 0.8 m, 14 rev in 25 s → v = 2.81 m/s → a_c = 9.9 m/s², F = 1.5 N.",
    },
    quiz: {
      q: "A car doubles its speed on the same curve. The friction force needed to hold it…",
      options: ["doubles", "quadruples", "halves", "is unchanged"],
      answer: 1,
      explain: "F = mv²/r: v² means doubling speed multiplies the demand by 4.",
    },
    socratic: [
      { q: "In uniform circular motion, does the object accelerate even though its speed is constant?", accept: ["yes"], hint: "Acceleration is change of velocity — and velocity includes direction.", follow: "Yes! Direction changes continuously, so a = v²/r points inward." },
      { q: "Which way must the net force point?", accept: ["center", "centre", "inward", "toward the center", "towards centre"], hint: "Same direction as the acceleration.", follow: "Correct — inward, toward the centre. That's why it's called centripetal." },
    ],
  },

  /* ------------------------------------------------ torque */
  torque: {
    topic: "Mechanics",
    name: "Torque & Levers",
    level: "Class 11",
    simKind: "torque",
    graphKind: "torque-r",
    assumption: "Force applied perpendicular to the lever arm; rigid beam about a fixed hinge.",
    find: "Torque about the hinge",
    formula: "τ = r F sin θ   (θ = 90° → τ = rF)",
    formulaUnits: "N · m",
    vars: [
      V("F", "F", "Applied force", "N", 5, 100, 1, 20, RED),
      V("r", "r", "Lever arm", "m", 0.1, 2, 0.05, 0.6, AMBER),
    ],
    whatifPresets: [
      { label: "Double arm", varId: "r", mult: 2 },
      { label: "Arm × ½", varId: "r", mult: 0.5 },
      { label: "Force × 2", varId: "F", mult: 2 },
    ],
    compute: (v) => {
      const tau = v.F * v.r;
      return {
        resultSym: "τ", resultValue: tau, resultUnit: "N·m",
        resultText: `The torque about the hinge is ${fmt(tau)} N·m (anticlockwise for a push as drawn).`,
        extras: [
          { label: "If θ were 30°", value: `${fmt(v.F * v.r * 0.5)} N·m` },
          { label: "Force for same τ at 2r", value: `${fmt(v.F / 2)} N` },
        ],
        substitute: [`τ = ${fmt(v.r)} m × ${fmt(v.F)} N × sin 90°`],
        calc: [`τ = ${fmt(tau)} N·m`],
        meaning: "Turning effect is force times distance from the pivot. Door handles live at the far edge and wrenches are long for this exact reason: the same force, more torque.",
        sanity: [{ ok: tau < 500, note: "Torque within human-hand scale (< 500 N·m)" }],
      };
    },
    why: {
      simple: "The further from the hinge you push, the more each newton gets multiplied into turning.",
      math: "τ = r × F; with θ = 90° the cross product gives rF. Equilibrium needs Στ = 0 — the lever's trade of force for distance.",
      visual: "The beam rig shows the moment arm; slide the force outward and the beam swings faster with the identical force.",
    },
    eli: {
      hook: "The stubborn jar",
      analogy: "A wrench is a force amplifier: your hand pushes gently at the long end, the nut feels a big twist.",
      example: "Pushing a door near the hinge barely moves it — same you, same push, almost zero torque.",
    },
    teach: {
      concept: "Torque is the rotational cousin of force: it measures how hard something twists about a point.",
      intuition: "Archimedes' lever: give me a place to stand and a long enough beam, and a child can lift a car.",
      example: "A seesaw balances when m₁g·r₁ = m₂g·r₂ — torque equilibrium, not force equilibrium.",
    },
    quiz: {
      q: "To loosen a tight bolt with minimum effort you should…",
      options: ["push harder near the bolt", "use a longer wrench", "push along the wrench", "it cannot change"],
      answer: 1,
      explain: "τ = rF: increasing r multiplies torque for the same force.",
    },
    socratic: [
      { q: "Why are door handles placed far from the hinge?", accept: ["more torque", "bigger lever", "longer arm", "easier to open", "larger r"], hint: "Think τ = rF with the same F.", follow: "Exactly — bigger r, bigger torque for the same push." },
      { q: "Pushing a wrench along its length produces what torque?", accept: ["zero", "none", "0"], hint: "What is sin 0°?", follow: "Zero — force through the pivot has no moment arm." },
    ],
  },

  /* ------------------------------------------------ buoyancy */
  buoyancy: {
    topic: "Mechanics",
    name: "Buoyancy (Archimedes)",
    level: "Class 9",
    simKind: "buoyancy",
    graphKind: "buoy-rho",
    assumption: "Fresh water ρ_f = 1000 kg/m³; incompressible fluid; block at rest or fully supported.",
    find: "Buoyant force F_b",
    formula: "F_b = ρ_f V_sub g",
    formulaUnits: "kg/m³ · m³ · m/s²  =  N",
    vars: [
      V("rho", "ρ", "Object density", "kg/m³", 100, 2000, 10, 600, BLUE),
      V("V", "V", "Volume", "m³", 0.0005, 5, 0.0005, 0.005, GREEN),
    ],
    whatifPresets: [
      { label: "ρ → 400 (cork)", varId: "rho", mult: -400 },
      { label: "ρ → 1200 (sinks)", varId: "rho", mult: -1200 },
      { label: "Volume × 2", varId: "V", mult: 2 },
    ],
    compute: (v) => {
      const rhoF = 1000;
      const W = v.rho * v.V * 9.8;
      const floats = v.rho < rhoF;
      const Vsub = floats ? v.V * (v.rho / rhoF) : v.V;
      const Fb = rhoF * Vsub * 9.8;
      return {
        resultSym: "F_b", resultValue: Fb, resultUnit: "N",
        resultText: floats
          ? `The block floats with ${fmt((v.rho / rhoF) * 100)}% submerged; buoyancy exactly balances its weight: F_b = ${fmt(Fb)} N.`
          : `The block sinks; fully submerged buoyancy is ${fmt(Fb)} N, leaving an apparent weight of ${fmt(W - Fb)} N.`,
        extras: [
          { label: "Weight W", value: `${fmt(W)} N` },
          { label: "Submerged volume", value: `${fmt(Vsub, 4)} m³` },
          floats ? { label: "Status", value: "floating — F_b = W" } : { label: "Apparent weight", value: `${fmt(W - Fb)} N` },
        ],
        substitute: [`F_b = 1000 × ${fmt(Vsub, 4)} × 9.8`],
        calc: [`F_b = ${fmt(Fb)} N`],
        meaning: "The fluid pushes up with the weight of whatever it was asked to make room for. If that push can match the object's weight, it floats; otherwise it sinks but feels lighter.",
        sanity: [
          { ok: v.rho > 50 && v.rho < 25000, note: "Density within everyday materials" },
          { ok: Fb < 1e6, note: "Force within tank scale" },
        ],
      };
    },
    why: {
      simple: "Pressure grows with depth, so the fluid pushes harder on the block's bottom than its top — the leftover push is buoyancy.",
      math: "Integrate ρ_f g z over the submerged surface: the net equals the weight of displaced fluid, ρ_f V_sub g (Archimedes).",
      visual: "The tank shows the waterline settling exactly where displaced water weighs the same as the block.",
    },
    eli: {
      hook: "The bathtub crown",
      analogy: "Get into a full bath and water spills out — that spilled water is what's lifting you.",
      example: "A steel ship floats because its hull shape displaces a huge volume; solid steel would sink.",
    },
    teach: {
      concept: "Floating is a vote between two weights: the object's, and the water it displaces.",
      intuition: "Ice floats with 90% under water because 900/1000 = 0.9 — the submerged fraction is simply ρ_object/ρ_water.",
      example: "Submarine ballast tanks flood to raise average density past 1000 kg/m³ — then it sinks.",
    },
    quiz: {
      q: "An object of density 800 kg/m³ floats in water. What fraction is submerged?",
      options: ["20%", "80%", "100%", "50%"],
      answer: 1,
      explain: "At float, ρ_obj V g = ρ_w V_sub g → V_sub/V = 800/1000 = 0.8.",
    },
    socratic: [
      { q: "A floating block isn't moving. What does that say about the forces on it?", accept: ["balanced", "equal", "same", "net zero"], hint: "Weight down, buoyancy up…", follow: "Yes — F_b equals its weight exactly. That's the float condition." },
      { q: "Why does a steel ship float but a steel nail sinks?", accept: ["shape", "displaces", "hollow", "volume", "average density"], hint: "Compare the average density of ship-with-air to solid steel.", follow: "Right — the hull encloses air, lowering average density below water's." },
    ],
  },

  /* ------------------------------------------------ atwood machine */
  atwood: {
    topic: "Mechanics",
    name: "Atwood Machine",
    level: "Class 11",
    simKind: "atwood",
    graphKind: "atwood-a",
    assumption: "Massless inextensible string, frictionless pulley; both masses share |a| and tension T.",
    find: "Acceleration of the system",
    formula: "a = (m₁ − m₂) g / (m₁ + m₂)",
    formulaUnits: "m/s²",
    vars: [
      V("m1", "m₁", "Left mass", "kg", 1, 100, 0.5, 5, BLUE),
      V("m2", "m₂", "Right mass", "kg", 1, 100, 0.5, 3, GREEN),
    ],
    whatifPresets: [
      { label: "m₂ = m₁ (balance)", varId: "m2", mult: -5 },
      { label: "m₂ × ½", varId: "m2", mult: 0.5 },
      { label: "m₁ × 2", varId: "m1", mult: 2 },
    ],
    compute: (v) => {
      const a = ((v.m1 - v.m2) * 9.8) / (v.m1 + v.m2);
      const T = (2 * v.m1 * v.m2 * 9.8) / (v.m1 + v.m2);
      return {
        resultSym: "a", resultValue: a, resultUnit: "m/s²",
        resultText: a > 0.0005
          ? `The heavier side (m₁) accelerates down at ${fmt(a)} m/s².`
          : a < -0.0005
            ? `The heavier side (m₂) accelerates down at ${fmt(-a)} m/s².`
            : "The masses balance — a = 0, pure equilibrium.",
        extras: [
          { label: "String tension T", value: `${fmt(T)} N` },
          { label: "T vs m₁g", value: `${fmt(v.m1 * 9.8)} N (T < m₁g — it's accelerating)` },
          { label: "T vs m₂g", value: `${fmt(v.m2 * 9.8)} N (T > m₂g — it's being lifted)` },
        ],
        substitute: [`a = (${fmt(v.m1)} − ${fmt(v.m2)}) × 9.8 / (${fmt(v.m1)} + ${fmt(v.m2)})`],
        calc: [`a = ${fmt((v.m1 - v.m2) * 9.8, 3)} / ${fmt(v.m1 + v.m2)} = ${fmt(a)} m/s²`],
        meaning: "The net pull is the weight difference; the inertia is the total mass. Equal masses freeze the machine; tiny differences give gentle, measurable accelerations — that's why Atwood built it.",
        sanity: [
          { ok: Math.abs(a) <= 9.8001, note: "|a| ≤ g — bounded by free fall" },
          { ok: T > 0, note: "Tension positive — string stays taut" },
        ],
      };
    },
    why: {
      simple: "The heavier mass wins the tug-of-war, but it has to drag the lighter one too — so nobody falls at full g.",
      math: "m₁g − T = m₁a and T − m₂g = m₂a; adding eliminates T: a = (m₁−m₂)g/(m₁+m₂).",
      visual: "The rig shows both tension vectors equal and opposite on the string — one rope, one tension, one acceleration.",
    },
    eli: {
      hook: "The playground pulley",
      analogy: "Two kids on a rope over a branch: the heavier one slides down slowly because the lighter one holds on.",
      example: "With 5 kg vs 3 kg you'd expect a crash at g, but the system only does 2.45 m/s² — a quarter of free fall.",
    },
    teach: {
      concept: "One constraint ties both masses: same rope, same |a|. Newton's second law applied twice plus the constraint solves everything.",
      intuition: "Weight difference drives; total mass resists. That ratio is the whole story.",
      example: "Cranes use counterweights so the motor only overcomes a small net force — the Atwood trick at industrial scale.",
    },
    quiz: {
      q: "m₁ = m₂ in an Atwood machine. The tension in the string equals…",
      options: ["zero", "m g", "2 m g", "m g / 2"],
      answer: 1,
      explain: "a = 0, so each mass balances: T = m g exactly.",
    },
    socratic: [
      { q: "If m₁ = m₂, what is the acceleration?", accept: ["zero", "0", "none"], hint: "What is the net driving force?", follow: "Zero — equal weights cancel; the machine sits in equilibrium." },
      { q: "Is the tension bigger or smaller than m₁g while m₁ falls?", accept: ["smaller", "less", "lower"], hint: "If T equalled m₁g, would m₁ accelerate at all?", follow: "Smaller — the leftover m₁g − T is what accelerates m₁ down." },
    ],
  },

  /* ------------------------------------------------ ideal gas law */
  idealgas: {
    topic: "Thermodynamics",
    name: "Ideal Gas Law",
    level: "Class 11",
    simKind: "gas",
    graphKind: "gas-pt",
    assumption: "Point particles, elastic collisions, no interactions — the ideal gas model (good at low density, high T).",
    find: "Pressure of the gas",
    formula: "P V = n R T",
    formulaUnits: "Pa · m³  =  mol · J/(mol·K) · K",
    vars: [
      V("n", "n", "Amount of gas", "mol", 0.05, 5, 0.05, 2, BLUE),
      V("T", "T", "Temperature", "K", 100, 600, 5, 300, RED),
      V("V", "V", "Volume", "m³", 0.002, 0.3, 0.002, 0.1, GREEN),
    ],
    whatifPresets: [
      { label: "T × 2", varId: "T", mult: 2 },
      { label: "V × ½", varId: "V", mult: 0.5 },
      { label: "T → 100 K", varId: "T", mult: -100 },
      { label: "n × 2", varId: "n", mult: 2 },
    ],
    compute: (v) => {
      const R = 8.314;
      const P = (v.n * R * v.T) / v.V;
      const N = v.n * 6.022e23;
      const vrms = Math.sqrt((3 * R * v.T) / 0.028); // N₂ molar mass
      return {
        resultSym: "P", resultValue: P, resultUnit: "Pa",
        resultText: `The gas exerts ${fmt(P)} Pa (${fmt(P / 101325, 3)} atm). Particle speed ∝ √T — watch the chamber.`,
        extras: [
          { label: "In kilopascals", value: `${fmt(P / 1000)} kPa` },
          { label: "Molecules N = nN_A", value: N.toExponential(2) },
          { label: "v_rms (N₂)", value: `${fmt(vrms)} m/s` },
        ],
        substitute: [`P = ${fmt(v.n)} × 8.314 × ${fmt(v.T)} / ${fmt(v.V)}`],
        calc: [`P = ${fmt(v.n * R * v.T, 4)} / ${fmt(v.V)} = ${fmt(P)} Pa`],
        meaning: "Pressure is billions of tiny collisions per second. Heat the gas (raise T) and each hit is harder; squeeze it (lower V) and hits get more frequent. PV = nRT is the ledger that balances both.",
        sanity: [
          { ok: P < 1e7, note: "Below ~100 atm — vessel-safe region" },
          { ok: v.T >= 100, note: "Well above condensation for common gases" },
        ],
      };
    },
    why: {
      simple: "Gas pressure is just molecules bouncing off walls — temperature makes them bounce harder, volume decides how often.",
      math: "From kinetic theory, P = ⅓(N/V)m⟨v²⟩ with ½m⟨v²⟩ = 3/2 k_B T; substituting N = nN_A and R = N_A k_B yields PV = nRT.",
      visual: "In the chamber, raise T and the dots visibly speed up while the pressure readout climbs in lockstep.",
    },
    eli: {
      hook: "The bouncy-ball room",
      analogy: "Imagine a room full of super-bouncy balls. More balls, faster balls, or a smaller room — all push the walls harder.",
      example: "A hot car tyre reads higher pressure in summer: same air, same volume, higher T.",
    },
    teach: {
      concept: "PV = nRT unifies Boyle (P∝1/V), Charles (V∝T) and Avogadro (V∝n) into one surface.",
      intuition: "Hold any two quantities fixed and the third is pinned — that's why tyres, cookers and balloons all obey it.",
      example: "2 mol at 300 K in 0.1 m³: P = 2 × 8.314 × 300 / 0.1 ≈ 4.99 × 10⁴ Pa ≈ 0.49 atm.",
    },
    quiz: {
      q: "A sealed gas is heated from 300 K to 600 K at constant volume. Its pressure…",
      options: ["halves", "doubles", "stays the same", "quadruples"],
      answer: 1,
      explain: "P = nRT/V with n, V fixed → P ∝ T. Double T, double P.",
    },
    socratic: [
      { q: "Squeeze a sealed syringe (smaller V, same T). What happens to the pressure?", accept: ["increases", "goes up", "rises", "higher"], hint: "Boyle's law — same collisions, less room.", follow: "Up it goes: P ∝ 1/V at fixed temperature." },
      { q: "Why does a balloon expand near a heater?", accept: ["molecules faster", "pressure", "volume increases", "t expands"], hint: "Charles: V ∝ T at constant pressure.", follow: "Exactly — hotter molecules push the skin out until inside pressure matches the air again." },
    ],
  },
};

export const TOPIC_ORDER = ["Mechanics", "Electricity", "Waves", "Optics", "Thermodynamics", "Astrophysics"];
