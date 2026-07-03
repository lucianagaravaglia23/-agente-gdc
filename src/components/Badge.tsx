import type { ImpactLevel, ProjectStatus, TaskStatus } from '../types';

const base = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium';

function Dot() {
  return <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />;
}

export function LevelBadge({ level }: { level: ImpactLevel | undefined }) {
  if (!level)
    return (
      <span className={`${base} bg-slate-100 text-slate-500`}>
        <Dot />
        Sin calcular
      </span>
    );
  const styles: Record<ImpactLevel, string> = {
    ALTO: 'bg-red-100 text-red-700',
    MEDIO: 'bg-amber-100 text-amber-700',
    BAJO: 'bg-brand-100 text-brand-700',
  };
  return (
    <span className={`${base} ${styles[level]}`}>
      <Dot />
      {level}
    </span>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const styles: Record<ProjectStatus, string> = {
    'En diagnóstico': 'bg-slate-100 text-slate-600',
    'En curso': 'bg-blue-100 text-blue-700',
    Completado: 'bg-brand-100 text-brand-700',
    Cancelado: 'bg-slate-200 text-slate-500 line-through',
  };
  return (
    <span className={`${base} ${styles[status]}`}>
      <Dot />
      {status}
    </span>
  );
}

export const TASK_STATUS_STYLES: Record<TaskStatus, string> = {
  Pendiente: 'bg-slate-100 text-slate-600',
  'En progreso': 'bg-blue-100 text-blue-700',
  Completada: 'bg-brand-100 text-brand-700',
  Bloqueada: 'bg-red-100 text-red-700',
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`${base} ${TASK_STATUS_STYLES[status]}`}>
      <Dot />
      {status}
    </span>
  );
}
