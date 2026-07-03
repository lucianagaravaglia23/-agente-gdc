import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGdcStore } from '../store/store';
import { PERSONAS } from '../data/personas';
import { STAGE_ORDER } from '../types';
import type { StageName, TaskStatus } from '../types';
import { nivelFinal, progressPct } from '../lib/project';
import { isAnswersComplete } from '../lib/scoring';
import { LevelBadge, ProjectStatusBadge } from '../components/Badge';
import { TaskCard } from '../components/TaskCard';
import { Modal } from '../components/Modal';
import { exportDiagnosticXlsx } from '../lib/xlsxExport';

const KANBAN_COLUMNS: TaskStatus[] = ['Pendiente', 'En progreso', 'Completada', 'Bloqueada'];
const EQUIPO_EXPERTO_GDC = PERSONAS.filter((p) => p.rol === 'Equipo Experto de GDC');

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = useGdcStore((s) => s.projects.find((p) => p.id === id));
  const auditLog = useGdcStore((s) => s.auditLog);
  const updateTaskStatus = useGdcStore((s) => s.updateTaskStatus);
  const reassignTask = useGdcStore((s) => s.reassignTask);
  const escalateTask = useGdcStore((s) => s.escalateTask);
  const cancelProject = useGdcStore((s) => s.cancelProject);
  const registerAiDraft = useGdcStore((s) => s.registerAiDraft);

  const [expandedStages, setExpandedStages] = useState<Record<StageName, boolean>>({
    'Preparar el Cambio': true,
    'Gestionar el Cambio': true,
    'Reforzar el Cambio': true,
  });
  const [historyTaskId, setHistoryTaskId] = useState<string | null>(null);
  const [showFullLog, setShowFullLog] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const [escalateTaskId, setEscalateTaskId] = useState<string | null>(null);
  const [escalateStep, setEscalateStep] = useState<1 | 2>(1);
  const [escalateJustificacion, setEscalateJustificacion] = useState('');
  const [escalatePersonaId, setEscalatePersonaId] = useState('');

  if (!project) {
    return <p className="text-sm text-slate-500">Proyecto no encontrado.</p>;
  }

  const nivel = nivelFinal(project);
  const projectAuditLog = auditLog.filter((a) => a.projectId === project.id).slice().reverse();
  const taskAuditLog = auditLog.filter((a) => a.taskId === historyTaskId).slice().reverse();
  const editable = project.estado !== 'Cancelado';
  const escalateTaskObj = project.tasks.find((t) => t.id === escalateTaskId);

  const toggleStage = (stage: StageName) => setExpandedStages((prev) => ({ ...prev, [stage]: !prev[stage] }));

  const handleCancel = () => {
    if (!cancelMotivo.trim()) return;
    void cancelProject(project.id, cancelMotivo);
    setShowCancel(false);
    setCancelMotivo('');
  };

  const closeEscalateModal = () => {
    setEscalateTaskId(null);
    setEscalateStep(1);
    setEscalateJustificacion('');
    setEscalatePersonaId('');
  };

  const handleConfirmEscalate = () => {
    if (!escalateTaskId || !escalateJustificacion.trim() || !escalatePersonaId) return;
    void escalateTask(project.id, escalateTaskId, escalateJustificacion.trim(), escalatePersonaId);
    closeEscalateModal();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{project.nombre}</h1>
          <p className="mt-1 text-sm text-slate-500">{project.area}</p>
          <div className="mt-2 flex items-center gap-2">
            <LevelBadge level={nivel} />
            <ProjectStatusBadge status={project.estado} />
            <span className="text-xs text-slate-500">Avance: {progressPct(project)}%</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {project.scoreCaracteristicasDelCambio !== undefined && (
            <button
              type="button"
              onClick={() => void exportDiagnosticXlsx(project)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Descargar Toolkit (.xlsx)
            </button>
          )}
          {project.tasks.length > 0 && (
            <button
              type="button"
              onClick={() => setShowFullLog(true)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Ver log completo
            </button>
          )}
          {project.estado !== 'Cancelado' && (
            <button
              type="button"
              onClick={() => setShowCancel(true)}
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              Cancelar proyecto
            </button>
          )}
        </div>
      </div>

      {project.estado === 'Cancelado' && (
        <div className="rounded-md border border-slate-300 bg-slate-100 p-4 text-sm text-slate-600">
          Proyecto cancelado el {new Date(project.canceladoFecha as string).toLocaleString()} por{' '}
          {project.canceladoPor}. Motivo: {project.canceladoMotivo}
        </div>
      )}

      {project.tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          {!project.respuestas || Object.keys(project.respuestas).length === 0 ? (
            <>
              Este proyecto todavía no completó el cuestionario de impacto.{' '}
              <button
                type="button"
                className="text-brand-600 hover:underline"
                onClick={() => navigate(`/proyectos/${project.id}/cuestionario`)}
              >
                Completar cuestionario →
              </button>
            </>
          ) : !isAnswersComplete(project.respuestas) ? (
            <>
              El cuestionario de impacto quedó en progreso. Podés retomarlo donde lo dejaste.{' '}
              <button
                type="button"
                className="text-brand-600 hover:underline"
                onClick={() => navigate(`/proyectos/${project.id}/cuestionario`)}
              >
                Continuar cuestionario →
              </button>
            </>
          ) : (
            <>
              El diagnóstico ya se calculó pero todavía no se generó el plan de trabajo.{' '}
              <button
                type="button"
                className="text-brand-600 hover:underline"
                onClick={() => navigate(`/proyectos/${project.id}/resultado`)}
              >
                Ir al resultado →
              </button>
            </>
          )}
        </div>
      ) : (
        STAGE_ORDER.map((stage) => {
          const stageTasks = project.tasks.filter((t) => t.etapa === stage);
          if (stageTasks.length === 0) return null;
          return (
            <div key={stage} className="rounded-lg border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => toggleStage(stage)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="font-semibold text-slate-800">{stage}</span>
                <span className="text-slate-400">{expandedStages[stage] ? '▲' : '▼'}</span>
              </button>
              {expandedStages[stage] && (
                <div className="grid grid-cols-1 gap-3 border-t border-slate-100 p-4 md:grid-cols-4">
                  {KANBAN_COLUMNS.map((col) => {
                    const dropKey = `${stage}::${col}`;
                    const isDragOver = dragOverKey === dropKey;
                    return (
                      <div
                        key={col}
                        onDragOver={(e) => {
                          if (!editable) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dragOverKey !== dropKey) setDragOverKey(dropKey);
                        }}
                        onDragLeave={() => setDragOverKey((k) => (k === dropKey ? null : k))}
                        onDrop={(e) => {
                          if (!editable) return;
                          e.preventDefault();
                          setDragOverKey(null);
                          const taskId = e.dataTransfer.getData('text/plain');
                          const task = stageTasks.find((t) => t.id === taskId);
                          if (task && task.estado !== col) {
                            void updateTaskStatus(project.id, taskId, col);
                          }
                        }}
                        className={`flex min-h-24 flex-col gap-2 rounded-md p-1.5 transition-colors ${
                          isDragOver ? 'bg-brand-50 ring-2 ring-inset ring-brand-300' : ''
                        }`}
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{col}</p>
                        {stageTasks
                          .filter((t) => t.estado === col)
                          .map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              project={project}
                              personas={PERSONAS}
                              editable={editable}
                              canEscalate={nivel !== 'ALTO'}
                              onStatusChange={(estado) => void updateTaskStatus(project.id, task.id, estado)}
                              onReassign={(personaId, manual) => void reassignTask(project.id, task.id, personaId, manual)}
                              onEscalate={() => setEscalateTaskId(task.id)}
                              onShowHistory={() => setHistoryTaskId(task.id)}
                              onAiDraft={registerAiDraft}
                            />
                          ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}

      {historyTaskId && (
        <Modal title="Historial de la tarea" onClose={() => setHistoryTaskId(null)}>
          <AuditList entries={taskAuditLog} />
        </Modal>
      )}

      {showFullLog && (
        <Modal title="Log completo del proyecto" onClose={() => setShowFullLog(false)}>
          <AuditList entries={projectAuditLog} />
        </Modal>
      )}

      {showCancel && (
        <Modal title="Cancelar proyecto" onClose={() => setShowCancel(false)}>
          <p className="text-sm text-slate-600">
            Esta acción congela todas las tareas pendientes o en curso. No se puede deshacer desde este prototipo.
          </p>
          <label className="mt-3 flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Motivo de cancelación *</span>
            <textarea
              value={cancelMotivo}
              onChange={(e) => setCancelMotivo(e.target.value)}
              className="input"
              rows={3}
            />
          </label>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCancel(false)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600"
            >
              Volver
            </button>
            <button
              type="button"
              disabled={!cancelMotivo.trim()}
              onClick={handleCancel}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-40"
            >
              Confirmar cancelación
            </button>
          </div>
        </Modal>
      )}

      {escalateTaskObj && (
        <Modal title={`Escalar: ${escalateTaskObj.tarea}`} onClose={closeEscalateModal}>
          {escalateStep === 1 ? (
            <>
              <p className="text-sm text-slate-600">
                Paso 1 de 2 — Contanos por qué hace falta escalar esta tarea al Equipo Experto de GDC.
              </p>
              <label className="mt-3 flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Justificación *</span>
                <textarea
                  value={escalateJustificacion}
                  onChange={(e) => setEscalateJustificacion(e.target.value)}
                  className="input"
                  rows={3}
                />
              </label>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEscalateModal}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!escalateJustificacion.trim()}
                  onClick={() => setEscalateStep(2)}
                  className="rounded-md bg-amber-600 px-3 py-1.5 text-sm text-white disabled:opacity-40"
                >
                  Siguiente →
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Paso 2 de 2 — Elegí quién del Equipo Experto de GDC se va a hacer cargo.
              </p>
              <label className="mt-3 flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Persona del Equipo Experto de GDC *</span>
                <select
                  value={escalatePersonaId}
                  onChange={(e) => setEscalatePersonaId(e.target.value)}
                  className="input"
                >
                  <option value="">Elegí una persona…</option>
                  {EQUIPO_EXPERTO_GDC.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-4 flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setEscalateStep(1)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600"
                >
                  ← Volver
                </button>
                <button
                  type="button"
                  disabled={!escalatePersonaId}
                  onClick={handleConfirmEscalate}
                  className="rounded-md bg-amber-600 px-3 py-1.5 text-sm text-white disabled:opacity-40"
                >
                  Confirmar escalamiento
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

function AuditList({ entries }: { entries: { id: string; fecha: string; usuario: string; detalle: string }[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">Sin movimientos registrados todavía.</p>;
  }
  return (
    <ul className="flex flex-col gap-3 text-sm">
      {entries.map((e) => (
        <li key={e.id} className="border-b border-slate-100 pb-2 last:border-0">
          <p className="text-xs text-slate-400">
            {new Date(e.fecha).toLocaleString()} — {e.usuario}
          </p>
          <p className="text-slate-700">{e.detalle}</p>
        </li>
      ))}
    </ul>
  );
}
