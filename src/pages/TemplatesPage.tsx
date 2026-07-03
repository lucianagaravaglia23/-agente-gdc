import { useState } from 'react';
import { TEMPLATES } from '../data/templates';
import { generateDraft } from '../lib/agentMock';
import { useGdcStore } from '../store/store';

export function TemplatesPage() {
  const registerAiDraft = useGdcStore((s) => s.registerAiDraft);
  const [draftOpenId, setDraftOpenId] = useState<string | null>(null);

  const handleGenerate = (id: string) => {
    registerAiDraft();
    setDraftOpenId(id);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800">Repositorio de templates</h1>
      <p className="mt-1 text-sm text-slate-500">Entregables oficiales asociados a cada tarea del plan de cambio.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <div key={t.id} className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="font-medium text-slate-800">{t.nombre}</p>
            <p className="mt-1 text-xs text-slate-500">Tarea: {t.tarea}</p>
            <p className="mt-2 flex-1 text-sm text-slate-600">{t.descripcion}</p>
            <div className="mt-3 flex gap-2 text-xs">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-slate-600 hover:bg-slate-50"
              >
                Descargar (mock)
              </button>
              <button
                type="button"
                onClick={() => handleGenerate(t.id)}
                className="rounded-md border border-brand-200 px-2 py-1 text-brand-600 hover:bg-brand-50"
              >
                Generar borrador con IA
              </button>
            </div>
            {draftOpenId === t.id && (
              <pre className="mt-3 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs text-slate-700">
                {generateDraft(t.tarea, 'Proyecto de ejemplo')}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
