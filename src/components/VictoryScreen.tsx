import { useEffect, useMemo, useState } from 'react';
import { Trophy, CheckCircle2, XCircle, Target, Brain, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { speak } from '@/lib/speech';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  buildFinalReport,
  analyzeCrisisJustification,
  clearAllAudits,
  type CrisisAuditEntry,
  type Phase13Entry,
} from '@/lib/finalReport';
import type { AuditEntry } from '@/components/ChannelBuilder';

interface VictoryScreenProps {
  teamName: string;
  elapsedSeconds: number;
  errorCount: number;
  errorLog: string[];
}

function calcGrade(errors: number): string {
  if (errors === 0) return '5.0 (Nivel Dios)';
  if (errors <= 2) return '4.5 (Excelente)';
  if (errors <= 4) return '4.0 (Sobresaliente)';
  if (errors <= 6) return '3.5 (Aceptable)';
  return '3.0 (Sobrevivió de milagro)';
}

// Tiny labeled status pill
function StatusPill({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono uppercase tracking-wider">
      <CheckCircle2 size={11} /> Acierto
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/40 text-red-300 text-[10px] font-mono uppercase tracking-wider">
      <XCircle size={11} /> Error
    </span>
  );
}

// Section heading with icon
function SectionHeading({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-6">
      <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-300">
        {icon}
      </div>
      <div>
        <p className="font-display text-sm text-orange-300 tracking-wider uppercase">{title}</p>
        <p className="text-[10px] text-slate-500 font-mono">{count} {count === 1 ? 'sección registrada' : 'secciones registradas'}</p>
      </div>
    </div>
  );
}

// ============= PHASE 1-3 CARD =============
function Phase13Card({ entry }: { entry: Phase13Entry }) {
  return (
    <Card className={`bg-slate-900/80 ${entry.isCorrect ? 'border-emerald-500/40' : 'border-red-500/50'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="text-left">
            <CardTitle className="text-xs text-foreground font-display">{entry.caseTitle}</CardTitle>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{entry.step}</p>
          </div>
          <StatusPill ok={entry.isCorrect} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-left text-xs">
        <div className="grid grid-cols-1 gap-1">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Tu respuesta:</span>
            <p className={`font-mono text-xs ${entry.isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>{entry.studentAnswer}</p>
          </div>
          <div>
            <span className="text-[10px] font-mono text-orange-400 uppercase tracking-wider">💡 Respuesta correcta:</span>
            <p className="font-mono text-xs text-orange-200">{entry.correctAnswer}</p>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-700/60">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">¿Por qué?</span>
          <p className="text-xs text-slate-300 leading-relaxed mt-0.5">{entry.explanation}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============= TALLER (Phase 4) CARD =============
function TallerCard({ entry }: { entry: AuditEntry }) {
  return (
    <Card className={`bg-slate-900/80 ${entry.isCorrect ? 'border-emerald-500/40' : 'border-red-500/50'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xs text-foreground font-display flex items-center gap-2 text-left">
            <span className="text-lg">{entry.productEmoji}</span>
            <span>{entry.productTitle}</span>
          </CardTitle>
          <StatusPill ok={entry.isCorrect} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-left text-xs">
        <div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Tu ruta:</span>
          <p className="text-xs text-foreground mt-0.5">
            {entry.studentRoute.map((n, i) => {
              const sp = i > 0 ? entry.studentSubPoints[i - 1] : null;
              return (
                <span key={i}>
                  {sp && <span className="text-orange-400">[{sp.emoji} {sp.label}] </span>}
                  <span className={entry.isCorrect ? 'text-emerald-300' : 'text-red-300'}>{n.emoji} {n.label}</span>
                  {i < entry.studentRoute.length - 1 && <span className="text-orange-400"> ➔ </span>}
                </span>
              );
            })}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-mono text-orange-400 uppercase tracking-wider">💡 Ruta correcta:</span>
          <p className="text-xs text-orange-200 mt-0.5">
            {entry.correctRoute.map((n, i) => (
              <span key={i}>
                {n.emoji} {n.label}
                {i < entry.correctRoute.length - 1 && <span className="text-orange-400"> ➔ </span>}
              </span>
            ))}
          </p>
        </div>
        <div className="pt-2 border-t border-slate-700/60">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">¿Por qué?</span>
          <p className="text-xs text-slate-300 leading-relaxed mt-0.5">{entry.whyTheory}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============= CRISIS (Phase 5) CARD with NLP keyword analysis =============
function CrisisCard({ entry }: { entry: CrisisAuditEntry }) {
  const nlp = analyzeCrisisJustification(entry.justification, entry.crisisNumber);
  const scorePct = nlp ? Math.round(nlp.score * 100) : 0;

  return (
    <Card className={`bg-slate-900/80 ${entry.isCorrect ? 'border-emerald-500/40' : 'border-red-500/50'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="text-left">
            <p className="text-[10px] font-mono text-red-400 uppercase tracking-widest">Crisis {entry.crisisNumber} de 6</p>
            <CardTitle className="text-xs text-foreground font-display mt-0.5">{entry.title}</CardTitle>
          </div>
          <StatusPill ok={entry.isCorrect} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-left text-xs">
        {/* State of the game (interactive console answer) */}
        <div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Estado de tu consola:</span>
          <p className="text-xs text-slate-300 leading-relaxed mt-0.5 whitespace-pre-line font-mono bg-slate-950/60 border border-slate-700/60 rounded-md p-2">
            {entry.studentStateDescription || '(sin datos)'}
          </p>
        </div>

        {/* Written justification + NLP analysis */}
        <div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">📝 Tu justificación gerencial:</span>
          <p className="text-xs text-slate-200 leading-relaxed mt-0.5 italic bg-slate-950/60 border border-slate-700/60 rounded-md p-2">
            "{entry.justification || '(no escribiste justificación)'}"
          </p>
        </div>

        {nlp && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Brain size={11} /> Análisis de palabras clave
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] font-mono ${
                  scorePct >= 70 ? 'border-emerald-500/50 text-emerald-300' :
                  scorePct >= 40 ? 'border-amber-500/50 text-amber-300' :
                  'border-red-500/50 text-red-300'
                }`}
              >
                {nlp.found.length}/{nlp.found.length + nlp.missing.length} ({scorePct}%)
              </Badge>
            </div>

            {nlp.found.length > 0 && (
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">✅ Términos que SÍ usaste:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {nlp.found.map((kw) => (
                    <span key={kw} className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
                      ✓ {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {nlp.missing.length > 0 && (
              <div>
                <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider">❌ Términos que TE FALTARON:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {nlp.missing.map((kw) => (
                    <span key={kw} className="px-2 py-0.5 rounded bg-red-500/15 border border-red-500/40 text-red-300 text-[10px] font-mono">
                      ✗ {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-slate-700/60">
          <span className="text-[10px] font-mono text-orange-400 uppercase tracking-wider">💡 Justificación teórica correcta:</span>
          <p className="text-xs text-slate-300 leading-relaxed mt-0.5 whitespace-pre-line">{entry.theoryExplanation}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VictoryScreen({ teamName, elapsedSeconds, errorCount, errorLog }: VictoryScreenProps) {
  const [studentEmail, setStudentEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const report = useMemo(() => buildFinalReport(), []);

  const mins = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
  const secs = String(elapsedSeconds % 60).padStart(2, '0');
  const timeStr = `${mins}:${secs}`;
  const grade = calcGrade(errorCount);

  useEffect(() => {
    speak('Operación logística maestra completada con éxito. Son verdaderos gerentes de operaciones. Felicidades ' + teamName);
    const end = Date.now() + 4000;
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [teamName]);

  // Build a plain-text version of the entire report for the email
  const buildEmailReport = (): string => {
    const lines: string[] = [];
    lines.push('=== REPORTE FINAL — SIMULADOR LOGÍSTICA ===');
    lines.push(`Estudiante: ${teamName}`);
    lines.push(`Tiempo: ${timeStr}`);
    lines.push(`Errores: ${errorCount}`);
    lines.push(`Nota: ${grade}`);
    lines.push(`Aciertos: ${report.totals.correctSections}/${report.totals.totalSections}`);
    lines.push('');

    if (report.phase13.length > 0) {
      lines.push('--- FASES 1-3: CANALES + PINES ---');
      report.phase13.forEach((e, i) => {
        lines.push(`${i + 1}. ${e.caseTitle} — ${e.step}`);
        lines.push(`   Veredicto: ${e.isCorrect ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
        lines.push(`   Tu respuesta: ${e.studentAnswer}`);
        lines.push(`   Correcta: ${e.correctAnswer}`);
        lines.push(`   Por qué: ${e.explanation}`);
        lines.push('');
      });
    }

    if (report.taller.length > 0) {
      lines.push('--- FASE 4: TALLER PRÁCTICO (RUTAS) ---');
      report.taller.forEach((e) => {
        const studentRouteStr = e.studentRoute.map((n, i) => {
          const sp = i > 0 ? e.studentSubPoints[i - 1] : null;
          return (sp ? `[${sp.emoji} ${sp.label}] ` : '') + `${n.emoji} ${n.label}`;
        }).join(' ➔ ');
        const correctRouteStr = e.correctRoute.map(n => `${n.emoji} ${n.label}`).join(' ➔ ');
        lines.push(`${e.productEmoji} ${e.productTitle}`);
        lines.push(`   Veredicto: ${e.isCorrect ? '✅ VISIÓN IMPECABLE' : '❌ ESTRATEGIA FALLIDA'}`);
        lines.push(`   Tu ruta: ${studentRouteStr}`);
        lines.push(`   Correcta: ${correctRouteStr}`);
        lines.push(`   Por qué: ${e.whyTheory}`);
        lines.push('');
      });
    }

    if (report.crisis.length > 0) {
      lines.push('--- FASE 5: CRISIS GERENCIALES ---');
      report.crisis.forEach((e) => {
        const nlp = analyzeCrisisJustification(e.justification, e.crisisNumber);
        lines.push(`Crisis ${e.crisisNumber}: ${e.title}`);
        lines.push(`   Veredicto: ${e.isCorrect ? '✅ DECISIÓN CORRECTA' : '❌ DECISIÓN ERRADA'}`);
        lines.push(`   Estado consola: ${e.studentStateDescription.replace(/\n/g, ' | ')}`);
        lines.push(`   Justificación: "${e.justification}"`);
        if (nlp) {
          lines.push(`   Términos usados: [${nlp.found.join(', ') || 'ninguno'}]`);
          lines.push(`   Términos faltantes: [${nlp.missing.join(', ') || 'ninguno'}]`);
          lines.push(`   Score keywords: ${Math.round(nlp.score * 100)}%`);
        }
        lines.push(`   Teoría correcta: ${e.theoryExplanation}`);
        lines.push('');
      });
    }

    if (errorLog.length > 0) {
      lines.push('--- BITÁCORA DE ERRORES (cronológica) ---');
      errorLog.forEach((entry, i) => {
        lines.push(`Error #${i + 1}: ${entry}`);
        lines.push('');
      });
    }

    return lines.join('\n');
  };

  const handleSilentSend = () => {
    if (!studentEmail) {
      alert('Por favor ingresa tu correo institucional para registrar la nota.');
      return;
    }
    setIsSending(true);

    fetch('https://formsubmit.co/ajax/tabaresmaria329@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        _subject: '🎓 NOTA SIMULADOR - ' + teamName,
        '1. Nombre del Estudiante': teamName,
        '2. Correo del Estudiante': studentEmail,
        '3. NOTA FINAL': grade,
        '4. Tiempo Total': timeStr,
        '5. Total de Errores': errorCount,
        '6. Aciertos / Total': `${report.totals.correctSections}/${report.totals.totalSections}`,
        '7. REPORTE FORENSE COMPLETO': buildEmailReport(),
      }),
    })
      .then((response) => response.json())
      .then(() => {
        setIsSent(true);
        setIsSending(false);
        clearAllAudits();
      })
      .catch(() => {
        alert('Error de conexión. Revisa tu internet e intenta de nuevo.');
        setIsSending(false);
      });
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 text-center bg-background">
      <Trophy className="text-yellow-400 mb-4 mt-4" size={120} />
      <h1 className="font-display text-2xl text-gradient-orange mb-2">OPERACIÓN LOGÍSTICA MAESTRA</h1>
      <p className="text-foreground text-base mb-6">¡ERES UN GERENTE LOGÍSTICO NIVEL DIOS!</p>

      {/* Headline cards */}
      <div className="bg-card border border-border rounded-xl p-4 mb-3 w-full max-w-md">
        <p className="text-muted-foreground text-xs mb-1">Estudiante</p>
        <p className="font-display text-xl text-foreground">{teamName}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 w-full max-w-md">
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-muted-foreground text-[10px] mb-1 uppercase tracking-wider">Tiempo</p>
          <p className="font-display text-xl text-orange">{timeStr}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-muted-foreground text-[10px] mb-1 uppercase tracking-wider">Errores</p>
          <p className="font-display text-xl text-red-400">{errorCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-muted-foreground text-[10px] mb-1 uppercase tracking-wider">Aciertos</p>
          <p className="font-display text-xl text-emerald-400">{report.totals.correctSections}/{report.totals.totalSections}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 mb-6 w-full max-w-md">
        <p className="text-muted-foreground text-xs mb-1">Nota del Sistema</p>
        <p className="font-display text-3xl text-green-400">{grade}</p>
      </div>

      {/* Master report header */}
      <div className="w-full max-w-md text-left">
        <div className="flex items-center gap-2 mb-2 px-1">
          <Sparkles className="text-orange-400" size={16} />
          <h2 className="font-display text-base text-orange-300 uppercase tracking-wider">📑 Reporte Forense Final</h2>
        </div>
        <p className="text-[11px] text-slate-400 px-1 mb-2 leading-relaxed">
          Detalle de TODAS tus decisiones, respuestas, flujos, palabras clave usadas y justificaciones teóricas.
          Aquí ves exactamente en qué acertaste y en qué fallaste.
        </p>
      </div>

      {/* === PHASE 1-3: Channel Questions + PINs === */}
      {report.phase13.length > 0 && (
        <div className="w-full max-w-md">
          <SectionHeading icon={<Target size={16} />} title="Fases 1-3 — Canales & Pines" count={report.phase13.length} />
          <div className="space-y-3">
            {report.phase13.map((e, i) => <Phase13Card key={i} entry={e} />)}
          </div>
        </div>
      )}

      {/* === PHASE 4: Taller Práctico === */}
      {report.taller.length > 0 && (
        <div className="w-full max-w-md">
          <SectionHeading icon={<Target size={16} />} title="Fase 4 — Taller Práctico" count={report.taller.length} />
          <div className="space-y-3">
            {report.taller.map((e) => <TallerCard key={e.productIdx} entry={e} />)}
          </div>
        </div>
      )}

      {/* === PHASE 5: Crisis Gerenciales === */}
      {report.crisis.length > 0 && (
        <div className="w-full max-w-md">
          <SectionHeading icon={<Brain size={16} />} title="Fase 5 — Crisis Gerenciales" count={report.crisis.length} />
          <div className="space-y-3">
            {report.crisis.map((e) => <CrisisCard key={e.crisisNumber} entry={e} />)}
          </div>
        </div>
      )}

      {/* Cronological error log (kept as backup) */}
      {errorLog.length > 0 && (
        <div className="w-full max-w-md mt-6">
          <SectionHeading icon={<XCircle size={16} />} title="Bitácora cronológica" count={errorLog.length} />
          <div className="space-y-2">
            {errorLog.map((entry, i) => (
              <div key={i} className="text-left text-xs leading-relaxed text-slate-300 bg-slate-900/60 border border-red-500/30 p-3 rounded-lg">
                <span className="text-red-400 font-bold text-[10px] font-mono uppercase tracking-wider">🔴 Error #{i + 1}</span>
                <p className="mt-1 whitespace-pre-wrap">{entry}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === EMAIL FORM === */}
      <div className="w-full max-w-md mt-8">
        {!isSent ? (
          <div className="flex flex-col gap-3 border-t border-slate-700 pt-4">
            <p className="text-sm text-slate-300 mb-1 text-left">📧 Para oficializar tu nota con la profesora, envía tu reporte completo:</p>
            <input
              type="email"
              placeholder="✉️ Escribe TU correo (Estudiante)..."
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              className="w-full p-4 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-base"
            />
            <button
              onClick={handleSilentSend}
              disabled={isSending}
              className={`w-full py-4 rounded-lg font-bold text-white text-base transition-colors shadow-lg ${isSending ? 'bg-orange-500 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isSending ? '⏳ ENVIANDO REPORTE AL SISTEMA...' : '🚀 ENVIAR CALIFICACIÓN OFICIAL'}
            </button>
            <p className="text-red-400 text-[11px] mt-1 font-bold text-center">⚠️ Si no envías tu reporte, tu nota será 0.0</p>
          </div>
        ) : (
          <div className="p-5 bg-green-900/40 border border-green-500 rounded-lg text-center animate-fade-in">
            <p className="text-green-400 font-bold text-lg mb-2">✅ ¡REPORTE ENVIADO EXITOSAMENTE!</p>
            <p className="text-slate-300 text-sm">Tu calificación y bitácora completa han sido registradas en el sistema de la profesora. Ya puedes cerrar esta ventana.</p>
          </div>
        )}
      </div>
    </div>
  );
}
