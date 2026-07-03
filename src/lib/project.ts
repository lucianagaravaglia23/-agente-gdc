import type { ImpactLevel, Project } from '../types';

export function nivelFinal(project: Project): ImpactLevel | undefined {
  return project.nivelCalculado;
}

export function progressPct(project: Project): number {
  if (project.tasks.length === 0) return 0;
  const completadas = project.tasks.filter((t) => t.estado === 'Completada').length;
  return Math.round((completadas / project.tasks.length) * 100);
}
