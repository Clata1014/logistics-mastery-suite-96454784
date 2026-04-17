// Centralized final report aggregation.
// Pulls data from localStorage written by ChannelBuilder + CrisisWrapper
// and from per-channel-question / pin entries (kept here as a generic log).

import { loadAudit, type AuditEntry } from '@/components/ChannelBuilder';

// ============= CRISIS AUDIT (Phase 5: Crisis 1-6) =============
const CRISIS_KEY = 'crisis_audit_v1';

export interface CrisisAuditEntry {
  crisisNumber: number;
  title: string;
  isCorrect: boolean;
  studentStateDescription: string; // formatted "TU FLUJO/RESPUESTA: ..."
  justification: string;            // user's written justification
  theoryExplanation: string;        // why-theory / errorExplanation
  timestamp: number;
}

export function loadCrisisAudit(): CrisisAuditEntry[] {
  try {
    const raw = localStorage.getItem(CRISIS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveCrisisAuditEntry(entry: CrisisAuditEntry) {
  const all = loadCrisisAudit().filter(e => e.crisisNumber !== entry.crisisNumber);
  all.push(entry);
  all.sort((a, b) => a.crisisNumber - b.crisisNumber);
  localStorage.setItem(CRISIS_KEY, JSON.stringify(all));
}

export function clearCrisisAudit() {
  localStorage.removeItem(CRISIS_KEY);
}

// ============= PHASES 1-3 LOG (Channel Questions + PIN entries) =============
const PHASE13_KEY = 'phase13_audit_v1';

export interface Phase13Entry {
  step: string;            // e.g. "Caso 1 — Pregunta de canal"
  caseTitle: string;       // e.g. "📦 CASO 1: POSTOBÓN"
  isCorrect: boolean;
  studentAnswer: string;
  correctAnswer: string;
  explanation: string;
  timestamp: number;
}

export function loadPhase13(): Phase13Entry[] {
  try {
    const raw = localStorage.getItem(PHASE13_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function savePhase13Entry(entry: Phase13Entry) {
  const all = loadPhase13();
  all.push(entry);
  localStorage.setItem(PHASE13_KEY, JSON.stringify(all));
}

export function clearPhase13() {
  localStorage.removeItem(PHASE13_KEY);
}

// ============= GLOBAL CLEAR =============
export function clearAllAudits() {
  clearCrisisAudit();
  clearPhase13();
  try { localStorage.removeItem('taller_audit_v1'); } catch {}
}

// ============= KEYWORD ANALYSIS for Crisis justifications =============
// Per-crisis keyword rules (based on the theory each crisis is testing).
// Used to highlight which key terms the student used vs missed in their
// 40+ char written justification.

export interface CrisisKeywordRule {
  required: string[];   // canonical keywords expected in a perfect answer
}

export const CRISIS_KEYWORDS: Record<number, CrisisKeywordRule> = {
  1: { required: ['recepcion', 'clasificacion', 'picking', 'packing', 'despacho', 'wms', 'cadena de frio', 'perecedero'] },
  2: { required: ['mayorista', 'minorista', 'tat', 'canal largo', 'cobertura', 'fraccionar', 'tienda'] },
  3: { required: ['austeridad', 'precio', 'sku', 'rotacion', 'hard discount', 'gondola', 'caja'] },
  4: { required: ['ultima milla', 'last mile', '53', 'trafico', 'reentrega', 'urbano', 'costo'] },
  5: { required: ['rfid', 'radiofrecuencia', 'ondas', 'trazabilidad', 'pallet', 'automatico', 'tiempo real'] },
  6: { required: ['picking', 'recolecta', 'recoger', 'packing', 'empaca', 'embalaje', 'estacion', 'pasillo'] },
};

export interface KeywordAnalysis {
  found: string[];
  missing: string[];
  score: number; // 0..1
}

function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function analyzeCrisisJustification(
  text: string,
  crisisNumber: number
): KeywordAnalysis | null {
  const rule = CRISIS_KEYWORDS[crisisNumber];
  if (!rule) return null;
  const norm = normalizeText(text);
  const found = rule.required.filter(kw => norm.includes(normalizeText(kw)));
  const missing = rule.required.filter(kw => !norm.includes(normalizeText(kw)));
  const score = rule.required.length === 0 ? 1 : found.length / rule.required.length;
  return { found, missing, score };
}

// ============= UNIFIED REPORT BUILDER =============
export interface FinalReport {
  phase13: Phase13Entry[];
  taller: AuditEntry[];      // ChannelBuilder (Phase 4)
  crisis: CrisisAuditEntry[]; // Phase 5 crisis
  totals: {
    totalSections: number;
    correctSections: number;
    incorrectSections: number;
  };
}

export function buildFinalReport(): FinalReport {
  const phase13 = loadPhase13();
  const taller = loadAudit();
  const crisis = loadCrisisAudit();

  const allCorrect =
    phase13.filter(e => e.isCorrect).length +
    taller.filter(e => e.isCorrect).length +
    crisis.filter(e => e.isCorrect).length;
  const total = phase13.length + taller.length + crisis.length;

  return {
    phase13,
    taller,
    crisis,
    totals: {
      totalSections: total,
      correctSections: allCorrect,
      incorrectSections: total - allCorrect,
    },
  };
}
