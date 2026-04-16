import { useState, useRef, ReactNode } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const ADMIN_PASS = 'admin123';

interface InstructorOverrideProps {
  /** Contenido visible (banner verde, etiqueta 🔒, etc.) que el alumno verá como estático */
  children: ReactNode;
  /** Callback que ejecuta el desbloqueo real: limpiar localStorage parcial + resetear UI */
  onUnlock: () => void;
  /** Etiqueta visible en el modal para identificar la sección */
  sectionLabel?: string;
  /** className opcional para el wrapper */
  className?: string;
}

/**
 * Easter-egg: doble clic sobre el contenedor abre el modal de override.
 * UX estricta: NO hay cursor-pointer, hover, ni indicios visuales.
 */
export default function InstructorOverride({
  children,
  onUnlock,
  sectionLabel,
  className,
}: InstructorOverrideProps) {
  const [open, setOpen] = useState(false);
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (pass === ADMIN_PASS) {
      onUnlock();
      setOpen(false);
      setPass('');
      setError(false);
      toast.success('🔓 Sección desbloqueada por instructor', {
        description: 'El alumno puede volver a intentarlo.',
      });
    } else {
      setError(true);
      setPass('');
      toast.error('Clave inválida. Intento registrado.', {
        description: 'Acceso denegado al override de instructor.',
      });
      inputRef.current?.focus();
    }
  };

  return (
    <>
      {/* Wrapper con doble clic invisible — sin cursor-pointer ni hover */}
      <div
        onDoubleClick={(e) => {
          e.stopPropagation();
          setOpen(true);
          setError(false);
          setPass('');
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={className}
      >
        {children}
      </div>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setPass('');
            setError(false);
          }
        }}
      >
        <DialogContent className="bg-slate-950 border-slate-700 text-slate-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm tracking-wider text-orange-300">
              🛠️ Override de Instructor
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-400 font-mono">
              {sectionLabel
                ? `Sección: ${sectionLabel}`
                : 'Desbloqueo manual de sección bloqueada.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <Input
              ref={inputRef}
              type="password"
              value={pass}
              onChange={(e) => {
                setPass(e.target.value);
                if (error) setError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ingrese código de autorización..."
              className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 font-mono text-xs"
              autoComplete="off"
            />

            {error && (
              <p className="text-[11px] text-red-400 font-mono">
                Clave inválida. Intento registrado.
              </p>
            )}

            <button
              onClick={handleSubmit}
              className="w-full py-2.5 rounded-md bg-orange-500 hover:bg-orange-600 transition-colors text-white font-mono text-xs tracking-wider uppercase"
            >
              Desbloquear Sección
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
