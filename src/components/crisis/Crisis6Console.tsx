import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Input } from '@/components/ui/input';
import InstructorOverride from '@/components/InstructorOverride';
import { normalize } from '@/lib/validation';

export interface Crisis6Ref {
  validate: () => boolean;
  getStateDescription: () => string;
}

const STORAGE_KEY = 'crisis6_twins_v1';
const PICKING_KEYS = ['picking', 'alistamiento', 'recoleccion'];
const PACKING_KEYS = ['packing', 'empacado', 'embalaje'];

interface TwinState {
  text: string;
  correct: boolean;
  locked: boolean;
}

const emptyTwin: TwinState = { text: '', correct: false, locked: false };

const Crisis6Console = forwardRef<Crisis6Ref>((_, ref) => {
  const [twinA, setTwinA] = useState<TwinState>(emptyTwin);
  const [twinB, setTwinB] = useState<TwinState>(emptyTwin);
  const [draftA, setDraftA] = useState('');
  const [draftB, setDraftB] = useState('');

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.twinA) setTwinA(parsed.twinA);
        if (parsed.twinB) setTwinB(parsed.twinB);
      }
    } catch {/* noop */}
  }, []);

  // Persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ twinA, twinB }));
  }, [twinA, twinB]);

  useImperativeHandle(ref, () => ({
    validate: () => twinA.correct && twinB.correct,
    getStateDescription: () => {
      return `🃏 TUS RESPUESTAS (a ciegas):\n  Gemelo A (el viajero): "${twinA.text || '(vacío)'}" → ${twinA.correct ? 'CORRECTO' : 'INCORRECTO'}\n  Gemelo B (el empacador): "${twinB.text || '(vacío)'}" → ${twinB.correct ? 'CORRECTO' : 'INCORRECTO'}\n🎯 ESPERADO: Gemelo A = PICKING (alistamiento/recolección), Gemelo B = PACKING (empacado/embalaje)\n✅ POR QUÉ: PICKING (Pick = Recoger) es el operario que CAMINA por la bodega recolectando artículos. PACKING (Pack = Empacar) es la estación FIJA donde se arma la caja con burbujas y cinta. Cruzarlos genera devoluciones millonarias.`;
    },
  }));

  const evaluate = (text: string, validKeys: string[]): boolean => {
    const n = normalize(text);
    return validKeys.some(k => n === k || n.includes(k));
  };

  const submitA = () => {
    if (twinA.locked || !draftA.trim()) return;
    const correct = evaluate(draftA, PICKING_KEYS);
    setTwinA({ text: draftA.trim(), correct, locked: true });
  };

  const submitB = () => {
    if (twinB.locked || !draftB.trim()) return;
    const correct = evaluate(draftB, PACKING_KEYS);
    setTwinB({ text: draftB.trim(), correct, locked: true });
  };

  const unlockA = () => {
    setTwinA(emptyTwin);
    setDraftA('');
  };
  const unlockB = () => {
    setTwinB(emptyTwin);
    setDraftB('');
  };

  return (
    <div className="space-y-4">
      {/* Gemelo A */}
      <div className="bg-slate-800 border border-orange-500/30 rounded-xl p-5 shadow-lg">
        <div className="text-orange-300 text-lg font-bold mb-2">🧭 Gemelo A</div>
        <p className="text-slate-300 text-sm leading-relaxed mb-4">
          «Soy el viajero explorador. Camino kilómetros por los pasillos con un escáner y un carrito.
          Mi única misión es ir a las estanterías a <span className="text-orange-400 font-bold">BUSCAR y RECOLECTAR</span> los
          productos exactos que pide el cliente. ¿Quién soy?»
        </p>

        {twinA.locked ? (
          <InstructorOverride onUnlock={unlockA} sectionLabel="Crisis 6 — Gemelo A">
            <div className="bg-green-900/30 border border-green-500/40 rounded-lg px-4 py-3 text-green-300 font-mono text-xs">
              🔒 Ruta archivada en la auditoría. Tu respuesta será calificada en el Reporte Final.
            </div>
          </InstructorOverride>
        ) : (
          <Input
            type="text"
            value={draftA}
            onChange={(e) => setDraftA(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitA(); } }}
            placeholder="Escribe de qué proceso habla el acertijo y presiona Enter..."
            className="bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500 font-mono text-sm focus-visible:ring-orange-500"
            autoComplete="off"
          />
        )}
      </div>

      {/* Gemelo B */}
      <div className="bg-slate-800 border border-cyan-500/30 rounded-xl p-5 shadow-lg">
        <div className="text-cyan-300 text-lg font-bold mb-2">📦 Gemelo B</div>
        <p className="text-slate-300 text-sm leading-relaxed mb-4">
          «Soy el protector estático. Me quedo quieto en mi mesa de trabajo. Tengo cajas, plástico burbuja
          y cinta adhesiva. Mi misión es <span className="text-cyan-400 font-bold">EMPACAR</span> el producto que me traen, sellarlo
          y etiquetarlo para el rudo viaje en camión. ¿Quién soy?»
        </p>

        {twinB.locked ? (
          <InstructorOverride onUnlock={unlockB} sectionLabel="Crisis 6 — Gemelo B">
            <div className="bg-green-900/30 border border-green-500/40 rounded-lg px-4 py-3 text-green-300 font-mono text-xs">
              🔒 Ruta archivada en la auditoría. Tu respuesta será calificada en el Reporte Final.
            </div>
          </InstructorOverride>
        ) : (
          <Input
            type="text"
            value={draftB}
            onChange={(e) => setDraftB(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitB(); } }}
            placeholder="Escribe de qué proceso habla el acertijo y presiona Enter..."
            className="bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500 font-mono text-sm focus-visible:ring-cyan-500"
            autoComplete="off"
          />
        )}
      </div>
    </div>
  );
});

Crisis6Console.displayName = 'Crisis6Console';
export default Crisis6Console;
