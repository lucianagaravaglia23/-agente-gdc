import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGdcStore } from '../store/store';
import { PERSONAS } from '../data/personas';
import { nivelFinal, progressPct } from '../lib/project';
import { LevelBadge, ProjectStatusBadge } from '../components/Badge';
import type { ImpactLevel, ProjectStatus } from '../types';

export function DashboardPage() {
  const projects = useGdcStore((s) => s.projects);

  const [filtroNivel, setFiltroNivel] = useState<ImpactLevel | 'todos'>('todos');
  const [filtroEstado, setFiltroEstado] = useState<ProjectStatus | 'todos'>('todos');
  const [filtroResponsable, setFiltroResponsable] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');

  const kpiResumen = useMemo(
    () => ({
      total: projects.length,
      alto: projects.filter((p) => nivelFinal(p) === 'ALTO').length,
      medio: projects.filter((p) => nivelFinal(p) === 'MEDIO').length,
      bajo: projects.filter((p) => nivelFinal(p) === 'BAJO').length,
      enCurso: projects.filter((p) => p.estado === 'En curso').length,
      completados: projects.filter((p) => p.estado === 'Completado').length,
    }),
    [projects],
  );

  const filtrados = projects.filter((p) => {
    if (filtroNivel !== 'todos' && nivelFinal(p) !== filtroNivel) return false;
    if (filtroEstado !== 'todos' && p.estado !== filtroEstado) return false;
    if (filtroResponsable !== 'todos' && !p.personasInvolucradasIds.includes(filtroResponsable)) return false;
    if (busqueda && !p.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">Bienvenida/o, Demo.</p>
        </div>
        <Link
          to="/proyectos/nuevo"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Nuevo proyecto
        </Link>
      </div>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <SummaryCard label="Proyectos totales" value={kpiResumen.total} />
        <SummaryCard label="Impacto Alto" value={kpiResumen.alto} />
        <SummaryCard label="Impacto Medio" value={kpiResumen.medio} />
        <SummaryCard label="Impacto Bajo" value={kpiResumen.bajo} />
        <SummaryCard label="En curso" value={kpiResumen.enCurso} />
        <SummaryCard label="Completados" value={kpiResumen.completados} />
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Proyectos</h2>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre…"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
          <select
            value={filtroNivel}
            onChange={(e) => setFiltroNivel(e.target.value as ImpactLevel | 'todos')}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="todos">Todos los niveles</option>
            <option value="ALTO">Alto</option>
            <option value="MEDIO">Medio</option>
            <option value="BAJO">Bajo</option>
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as ProjectStatus | 'todos')}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="todos">Todos los estados</option>
            <option value="En diagnóstico">En diagnóstico</option>
            <option value="En curso">En curso</option>
            <option value="Completado">Completado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
          <select
            value={filtroResponsable}
            onChange={(e) => setFiltroResponsable(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="todos">Todos los responsables</option>
            {PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        {filtrados.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            No hay proyectos que coincidan con los filtros.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Área</th>
                  <th className="px-4 py-3">Nivel</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Avance</th>
                  <th className="px-4 py-3">Personas involucradas</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.nombre}</td>
                    <td className="px-4 py-3 text-slate-600">{p.area}</td>
                    <td className="px-4 py-3">
                      <LevelBadge level={nivelFinal(p)} />
                    </td>
                    <td className="px-4 py-3">
                      <ProjectStatusBadge status={p.estado} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{progressPct(p)}%</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.personasInvolucradasIds.length === 0 ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          p.personasInvolucradasIds.map((id) => {
                            const persona = PERSONAS.find((per) => per.id === id);
                            if (!persona) return null;
                            return (
                              <span
                                key={id}
                                className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700"
                              >
                                {persona.nombre}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/proyectos/${p.id}`} className="text-brand-600 hover:underline">
                        Ver detalle →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="text-2xl font-semibold text-slate-800">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}
