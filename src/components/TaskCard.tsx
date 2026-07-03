import { useState } from 'react';
import { TEMPLATES } from '../data/templates';
import { getAgentHelp, generateDraft } from '../lib/agentMock';
import { TASK_STATUS_STYLES, TaskStatusBadge } from './Badge';
import type { Persona } from '../data/personas';
import type { Project, ProjectTask, TaskStatus } from '../types';

const STATUS_ORDER: TaskStatus[] = ['Pendiente', 'En progreso', 'Completada', 'Bloqueada'];
const nextStatus = (status: TaskStatus): TaskStatus =>
  STATUS_ORDER[(STATUS_ORDER.indexOf(status) + 1) % STATUS_ORDER.length];

export function TaskCard({
  task,
  project,
  personas,
  editable,
  canEscalate,
  onStatusChange,
  onReassign,
  onEscalate,
  onShowHistory,
  onAiDraft,
}: {
  task: ProjectTask;
  project: Project;
  personas: Persona[];
  editable: boolean;
  canEscalate: boolean;
  onStatusChange: (status: TaskStatus) => void;
  onReassign: (personaId: string | undefined, manual: boolean) => void;
  onEscalate: () => void;
  onShowHistory: () => void;
  onAiDraft: () => void;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [draftOpen, setDraftOpen] = useState(false);
  const template = TEMPLATES.find((t) => t.tarea === task.tarea);

  const candidatesByRole = personas.filter((p) => p.rol === task.responsableRol);
  const candidates = candidatesByRole.length > 0 ? candidatesByRole : personas;
  const forcedManual = candidatesByRole.length === 0;

  const handleAssign = (personaId: string) => {
    onReassign(personaId || undefined, forcedManual);
  };

  const handleAiDraft = () => {
    onAiDraft();
    setDraftOpen(true);
  };

  return (
    <div
      draggable={editable}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={`w-full min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm ${
        editable ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <p className="min-w-0 break-words text-sm font-medium text-slate-800">{task.tarea}</p>
        {editable ? (
          <button
            type="button"
            title="Click para avanzar al siguiente estado"
            onClick={() => onStatusChange(nextStatus(task.estado))}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium transition hover:brightness-95 ${TASK_STATUS_STYLES[task.estado]}`}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
            {task.estado}
          </button>
        ) : (
          <TaskStatusBadge status={task.estado} />
        )}
      </div>
      <p className="mt-1 truncate text-xs text-slate-500" title={`Responsable: ${task.responsableRol}`}>
        Responsable: {task.responsableRol}
      </p>

      <div className="mt-2 flex flex-col gap-1.5 text-sm">
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-xs text-slate-500">Persona asignada</span>
          <select
            disabled={!editable}
            value={task.personaAsignadaId ?? ''}
            onChange={(e) => handleAssign(e.target.value)}
            className="input w-full min-w-0 py-1 text-xs"
          >
            <option value="">Sin asignar</option>
            {candidates.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          {task.asignacionManual && task.personaAsignadaId && (
            <span className="break-words text-xs text-amber-600">Asignación manual (fuera del rol responsable)</span>
          )}
        </label>

        {template && (
          <p className="min-w-0 break-words text-xs text-slate-500">
            Entregable: <span className="font-medium text-slate-700">{template.nombre}</span>
          </p>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
        <button
          type="button"
          onClick={() => setHelpOpen((v) => !v)}
          className="rounded-md border border-brand-200 px-2 py-1 text-brand-600 hover:bg-brand-50"
        >
          Asistente
        </button>
        {template && (
          <button
            type="button"
            onClick={handleAiDraft}
            className="rounded-md border border-brand-200 px-2 py-1 text-brand-600 hover:bg-brand-50"
          >
            Borrador IA
          </button>
        )}
        {editable && canEscalate && (
          <button
            type="button"
            onClick={onEscalate}
            className="rounded-md border border-amber-300 px-2 py-1 text-amber-700 hover:bg-amber-50"
          >
            Escalar
          </button>
        )}
        <button
          type="button"
          onClick={onShowHistory}
          className="rounded-md border border-slate-200 px-2 py-1 text-slate-600 hover:bg-slate-50"
        >
          Historial
        </button>
      </div>

      {helpOpen && (
        <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-brand-50 p-2 text-xs text-brand-800">
          {getAgentHelp(task.tarea, project.nombre)}
        </pre>
      )}
      {draftOpen && (
        <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-slate-50 p-2 text-xs text-slate-700">
          {generateDraft(task.tarea, project.nombre)}
        </pre>
      )}
    </div>
  );
}
