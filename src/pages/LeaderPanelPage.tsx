import { useGdcStore } from '../store/store';
import { nivelFinal } from '../lib/project';
import { computeKpis } from '../lib/kpis';
import { LevelBadge } from '../components/Badge';

export function LeaderPanelPage() {
  const projects = useGdcStore((s) => s.projects);
  const auditLog = useGdcStore((s) => s.auditLog);
  const aiDraftCount = useGdcStore((s) => s.aiDraftCount);

  const kpis = computeKpis(projects, auditLog, aiDraftCount);

  const porNivel = (['ALTO', 'MEDIO', 'BAJO'] as const).map((nivel) => ({
    nivel,
    cantidad: projects.filter((p) => nivelFinal(p) === nivel).length,
  }));

  const bloqueadas = projects.flatMap((p) =>
    p.tasks
      .filter((t) => t.estado === 'Bloqueada')
      .map((t) => ({ proyecto: p.nombre, tarea: t.tarea, responsable: t.responsableRol })),
  );

  const escalamientos = auditLog.filter((a) => a.tipo === 'escalamiento');

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Panel del Líder GDC</h1>
        <p className="mt-1 text-sm text-slate-500">Vista de solo lectura con reporting agregado del programa.</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Indicadores</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-2xl font-semibold text-brand-700">{kpi.value}</p>
              <p className="mt-1 text-xs font-medium text-slate-600">{kpi.label}</p>
              <p className="mt-1 text-xs text-slate-400">{kpi.meta}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Proyectos por nivel</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {porNivel.map(({ nivel, cantidad }) => (
              <li key={nivel} className="flex items-center justify-between text-sm">
                <LevelBadge level={nivel} />
                <span className="font-medium text-slate-700">{cantidad} proyectos</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Cuellos de botella (tareas bloqueadas)
          </h2>
          {bloqueadas.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No hay tareas bloqueadas actualmente.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {bloqueadas.map((b, i) => (
                <li key={i} className="border-b border-slate-100 pb-2 last:border-0">
                  <p className="font-medium text-slate-700">{b.tarea}</p>
                  <p className="text-xs text-slate-500">
                    {b.proyecto} · {b.responsable}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Historial de decisiones de escalamiento
        </h2>
        {escalamientos.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Todavía no hubo escalamientos al equipo experto.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {escalamientos.map((e) => {
              const proyecto = projects.find((p) => p.id === e.projectId);
              return (
                <li key={e.id} className="border-b border-slate-100 pb-2 last:border-0">
                  <p className="text-xs text-slate-400">
                    {new Date(e.fecha).toLocaleString()} — {e.usuario} · {proyecto?.nombre}
                  </p>
                  <p className="text-slate-700">{e.detalle}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
