import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGdcStore } from '../store/store';
import type { QuestionEscalation } from '../types';

export function GdcConsultationsPage() {
  const projects = useGdcStore((s) => s.projects);
  const questionEscalations = useGdcStore((s) => s.questionEscalations);
  const resolveQuestionEscalation = useGdcStore((s) => s.resolveQuestionEscalation);

  const [respuestas, setRespuestas] = useState<Record<string, string>>({});

  const abiertas = questionEscalations.filter((e) => e.estado === 'abierta');
  const resueltas = questionEscalations
    .filter((e) => e.estado === 'resuelta')
    .slice()
    .reverse();

  const handleResolve = (escalation: QuestionEscalation) => {
    const respuesta = (respuestas[escalation.id] ?? '').trim();
    if (!respuesta) return;
    void resolveQuestionEscalation(escalation.id, respuesta);
    setRespuestas((prev) => ({ ...prev, [escalation.id]: '' }));
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Consultas GDC</h1>
        <p className="mt-1 text-sm text-slate-500">
          Preguntas del cuestionario elevadas por los usuarios cuando el Asistente de IA no resolvió su duda. La
          pregunta queda bloqueada para el usuario hasta que se responda acá.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Abiertas ({abiertas.length})
        </h2>
        {abiertas.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            No hay consultas abiertas.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {abiertas.map((e) => {
              const proyecto = projects.find((p) => p.id === e.projectId);
              return (
                <div key={e.id} className="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <span>
                      {proyecto ? (
                        <Link to={`/proyectos/${proyecto.id}`} className="font-medium text-brand-700 hover:underline">
                          {proyecto.nombre}
                        </Link>
                      ) : (
                        'Proyecto eliminado'
                      )}{' '}
                      · Pregunta {e.questionId} · {e.usuario} ·{' '}
                      {new Date(e.fecha).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-800">{e.preguntaTexto}</p>
                  <p className="mt-1 text-sm text-slate-600">Consulta: {e.consulta}</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <textarea
                      value={respuestas[e.id] ?? ''}
                      onChange={(ev) => setRespuestas((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                      placeholder="Escribí la respuesta para desbloquear la pregunta…"
                      className="input flex-1"
                      rows={2}
                    />
                    <button
                      type="button"
                      disabled={!(respuestas[e.id] ?? '').trim()}
                      onClick={() => handleResolve(e)}
                      className="h-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40"
                    >
                      Responder
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Resueltas</h2>
        {resueltas.length === 0 ? (
          <p className="text-sm text-slate-500">Todavía no se resolvió ninguna consulta.</p>
        ) : (
          <ul className="flex flex-col gap-3 text-sm">
            {resueltas.map((e) => {
              const proyecto = projects.find((p) => p.id === e.projectId);
              return (
                <li key={e.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-400">
                    {proyecto?.nombre ?? 'Proyecto eliminado'} · Pregunta {e.questionId} · Respondido por{' '}
                    {e.respondidoPor ?? 'Usuario'} · {e.fechaRespuesta ? new Date(e.fechaRespuesta).toLocaleString() : ''}
                  </p>
                  <p className="mt-1 text-slate-700">
                    <span className="text-slate-500">Consulta:</span> {e.consulta}
                  </p>
                  <p className="mt-1 text-slate-700">
                    <span className="text-slate-500">Respuesta:</span> {e.respuesta}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
