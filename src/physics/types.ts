/* PHYSIX deterministic physics engine — type contracts */

export type ConceptId =
  | "ke"
  | "pe"
  | "freefall"
  | "projectile"
  | "newton2"
  | "momentum"
  | "ohm"
  | "pendulum"
  | "spring"
  | "collision"
  | "wave"
  | "orbit"
  | "work"
  | "gravforce"
  | "refraction"
  | "incline"
  | "circular"
  | "torque"
  | "buoyancy"
  | "atwood"
  | "idealgas";

export type SimKind =
  | "bench"
  | "freefall"
  | "projectile"
  | "pendulum"
  | "spring"
  | "collision"
  | "ohm"
  | "waves"
  | "optics"
  | "gas"
  | "orbit"
  | "incline"
  | "circular"
  | "torque"
  | "buoyancy"
  | "atwood";

export type GraphKind =
  | "ke-v"
  | "pe-h"
  | "fall-vt"
  | "proj-vy"
  | "bench-vt"
  | "p-v"
  | "i-r"
  | "pend-theta"
  | "spring-x"
  | "coll-bars"
  | "wave-f"
  | "orbit-v"
  | "work-d"
  | "grav-r"
  | "snell"
  | "incline-a"
  | "circ-v"
  | "torque-r"
  | "buoy-rho"
  | "atwood-a"
  | "gas-pt";

export interface VarDef {
  id: string;
  sym: string;
  name: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  def: number;
  color: string; // css color token for sliders/highlights
}

export interface Given {
  sym: string;
  name: string;
  value: number;
  unit: string;
  assumed: boolean;
}

export interface QuizItem {
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

export interface SocraticStep {
  q: string;
  accept: string[];
  hint: string;
  follow: string;
}

export interface WhatIfPreset {
  label: string;
  varId: string;
  mult: number;
}

export interface SanityNote {
  ok: boolean;
  note: string;
}

export interface Solved {
  id: ConceptId;
  topic: string;
  conceptName: string;
  type: "Numerical" | "Conceptual";
  level: string;
  question: string;
  source?: string; // textbook citation when the problem comes from a published source
  variables: VarDef[];
  given: Given[];
  find: string;
  formula: string;
  formulaUnits: string;
  substitute: string[];
  calc: string[];
  resultSym: string;
  resultValue: number;
  resultUnit: string;
  resultText: string;
  extras: { label: string; value: string }[];
  meaning: string;
  sanity: SanityNote[];
  simKind: SimKind;
  graphKind: GraphKind;
  whySimple: string;
  whyMath: string;
  whyVisual: string;
  eliHook: string;
  eliAnalogy: string;
  eliExample: string;
  teachConcept: string;
  teachIntuition: string;
  teachExample: string;
  quiz: QuizItem;
  socratic: SocraticStep[];
  whatifPresets: WhatIfPreset[];
  assumption: string;
}

export interface ParseResult {
  concept: ConceptId | null;
  values: Record<string, { v: number; unit: string; assumed: boolean }>;
  whatif?: { varId: string; mult: number };
  special?: string; // e.g. 'light-slow'
  clarify: string[];
  raw: string;
}

export interface PracticeProblem {
  topic: string;
  concept: ConceptId;
  question: string;
  answer: number;
  unit: string;
  options: number[];
  hint: string;
}

export interface MistakeReport {
  found: boolean;
  givens: { sym: string; value: number; unit: string }[];
  theirFormula: string | null;
  theirAnswer: number | null;
  correctFormula: string;
  correctAnswer: number | null;
  lines: string[];
}

export interface TextbookProblem {
  id: string;
  source: string; // textbook name
  chapter: string;
  q: string; // full problem statement, solvable by the engine
  concept: ConceptId;
  values: Record<string, number>; // keyed by variable id — exact textbook numbers
  textbookAnswer: string; // the printed answer, for verification
  level: "Class 9" | "Class 11" | "Class 12" | "University";
}

export interface RealWorldExperiment {
  id: string;
  icon: string;
  title: string;
  setting: string; // where you meet it in daily life
  physics: string[]; // the physics hiding inside it
  q: string; // the question the lab will actually solve
  concept: ConceptId;
  values: Record<string, number>;
}
