import type { AuditLogEntry, Project } from '../types';
import { nivelFinal } from './project';

export interface Kpi {
  label: string;
  value: string;
  meta: string;
}

// Los 5 KPIs del PRD (sección 6), recalculados en base a los proyectos y al log de auditoría
// del prototipo. No hay baseline real disponible, así que las metas se muestran como referencia fija.
export function computeKpis(projects: Project[], auditLog: AuditLogEntry[], aiDraftCount: number): Kpi[] {
  const medioProjects = projects.filter((p) => nivelFinal(p) === 'MEDIO' && p.estado !== 'En diagnóstico');
  const medioSinApoyo = medioProjects.filter(
    (p) => !auditLog.some((a) => a.projectId === p.id && a.tipo === 'escalamiento'),
  );
  const pctMedioSinApoyo = medioProjects.length ? Math.round((medioSinApoyo.length / medioProjects.length) * 100) : null;

  const proyectosConPlan = projects.filter((p) => p.planGeneratedAt);
  const tiemposArmadoMs = proyectosConPlan.map(
    (p) => new Date(p.planGeneratedAt as string).getTime() - new Date(p.createdAt).getTime(),
  );
  const tiempoPromedioMin = tiemposArmadoMs.length
    ? Math.round(tiemposArmadoMs.reduce((a, b) => a + b, 0) / tiemposArmadoMs.length / 60000)
    : null;

  const totalTareas = projects.reduce((acc, p) => acc + p.tasks.length, 0);
  const pctEntregablesIA = totalTareas ? Math.min(100, Math.round((aiDraftCount / totalTareas) * 100)) : null;

  const proyectosAcompanados = projects.filter((p) => p.estado !== 'Cancelado').length;

  const bajoProjects = projects.filter((p) => nivelFinal(p) === 'BAJO');
  const tareasExpertoEnBajo = bajoProjects.reduce(
    (acc, p) => acc + p.tasks.filter((t) => t.responsableRol === 'Equipo Experto de GDC').length,
    0,
  );
  const escalamientosEnBajo = auditLog.filter(
    (a) => a.tipo === 'escalamiento' && bajoProjects.some((p) => p.id === a.projectId),
  ).length;
  const horasExpertoBajo = (tareasExpertoEnBajo + escalamientosEnBajo) * 2;

  return [
    {
      label: '% proyectos de impacto Medio ejecutados sin apoyo experto',
      value: pctMedioSinApoyo === null ? '—' : `${pctMedioSinApoyo}%`,
      meta: 'Meta: +50% vs baseline',
    },
    {
      label: 'Tiempo de armado de un plan de cambio',
      value: tiempoPromedioMin === null ? '—' : `${tiempoPromedioMin} min`,
      meta: 'Meta: -50% vs baseline',
    },
    {
      label: '% de entregables generados desde el agente',
      value: pctEntregablesIA === null ? '—' : `${pctEntregablesIA}%`,
      meta: 'Meta: >80%',
    },
    {
      label: 'Cantidad de proyectos acompañados',
      value: `${proyectosAcompanados}`,
      meta: 'Meta: +30% vs baseline (por trimestre)',
    },
    {
      label: 'Horas de expertos en proyectos de bajo impacto',
      value: `${horasExpertoBajo} hs (estimado)`,
      meta: 'Meta: tendencia a la baja',
    },
  ];
}
