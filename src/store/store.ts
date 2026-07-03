import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { fetchAuditLog, fetchProjects, fetchQuestionEscalations } from '../lib/supabaseData';
import { QUESTIONNAIRE } from '../data/questionnaire';
import { PERSONAS } from '../data/personas';
import { calcLevel, calcScores, generateTasksForLevel } from '../lib/scoring';
import type {
  AuditEventType,
  AuditLogEntry,
  Project,
  ProjectStatus,
  ProjectTask,
  QuestionEscalation,
  QuestionnaireAnswers,
  RoleName,
  TaskStatus,
} from '../types';

const DEMO_USER = 'Demo';

interface GdcStore {
  session: Session | null;
  authChecked: boolean;
  initialized: boolean;
  projects: Project[];
  auditLog: AuditLogEntry[];
  aiDraftCount: number;
  questionEscalations: QuestionEscalation[];

  setSession: (session: Session | null) => void;
  setAuthChecked: (checked: boolean) => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;

  createProject: (data: { nombre: string; descripcion: string; area: string }) => Promise<string>;
  saveAnswers: (projectId: string, answers: QuestionnaireAnswers) => Promise<void>;
  generatePlan: (projectId: string) => Promise<void>;

  updateTaskStatus: (projectId: string, taskId: string, estado: TaskStatus) => Promise<void>;
  reassignTask: (projectId: string, taskId: string, personaId: string | undefined, manual: boolean) => Promise<void>;
  escalateTask: (projectId: string, taskId: string, justificacion: string, personaId: string) => Promise<void>;

  cancelProject: (projectId: string, motivo: string) => Promise<void>;
  registerAiDraft: () => void;

  raiseQuestionEscalation: (projectId: string, questionId: string, preguntaTexto: string, consulta: string) => Promise<void>;
  resolveQuestionEscalation: (escalationId: string, respuesta: string) => Promise<void>;
}

async function insertAudit(entry: Omit<AuditLogEntry, 'id' | 'fecha'>): Promise<AuditLogEntry> {
  const id = uuid();
  const fecha = new Date().toISOString();
  const { error } = await supabase.from('audit_log').insert({
    id,
    proyecto_id: entry.projectId,
    tarea_id: entry.taskId ?? null,
    usuario: entry.usuario,
    creado_en: fecha,
    tipo_evento: entry.tipo,
    detalle: entry.detalle,
    valor_anterior: entry.valorAnterior ?? null,
    valor_nuevo: entry.valorNuevo ?? null,
  });
  if (error) throw error;
  return { ...entry, id, fecha };
}

function answersToRespuestaRows(projectId: string, answers: QuestionnaireAnswers) {
  return QUESTIONNAIRE.filter((q) => answers[q.id] !== undefined).map((q) => ({
    proyecto_id: projectId,
    bloque: q.bloque,
    numero_pregunta: q.numero,
    valor: answers[q.id],
  }));
}

function computePersonasInvolucradas(tasks: ProjectTask[]): string[] {
  return Array.from(new Set(tasks.map((t) => t.personaAsignadaId).filter((id): id is string => !!id)));
}

function personaNombre(personaId: string | undefined): string {
  return PERSONAS.find((p) => p.id === personaId)?.nombre ?? 'Sin asignar';
}

export const useGdcStore = create<GdcStore>((set, get) => ({
  session: null,
  authChecked: false,
  initialized: false,
  projects: [],
  auditLog: [],
  aiDraftCount: 0,
  questionEscalations: [],

  setSession: (session) => set({ session }),
  setAuthChecked: (checked) => set({ authChecked: checked }),

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ projects: [], auditLog: [], questionEscalations: [], initialized: false });
  },

  initialize: async () => {
    if (get().initialized) return;
    try {
      const [projects, auditLog, questionEscalations] = await Promise.all([
        fetchProjects(),
        fetchAuditLog(),
        fetchQuestionEscalations(),
      ]);
      set({ projects, auditLog, questionEscalations, initialized: true });
    } catch (err) {
      console.error('Error inicializando datos desde Supabase', err);
    }
  },

  createProject: async (data) => {
    const id = uuid();
    const { error } = await supabase.from('proyectos').insert({
      id,
      nombre: data.nombre,
      descripcion: data.descripcion || null,
      area: data.area,
      estado: 'En diagnóstico',
    });
    if (error) {
      console.error(error);
      throw error;
    }
    const project: Project = {
      id,
      nombre: data.nombre,
      descripcion: data.descripcion,
      area: data.area,
      estado: 'En diagnóstico' as ProjectStatus,
      createdAt: new Date().toISOString(),
      tasks: [],
      personasInvolucradasIds: [],
    };
    set((state) => ({ projects: [...state.projects, project] }));
    return id;
  },

  saveAnswers: async (projectId, answers) => {
    const { scoreCaracteristicasDelCambio, scoreAtributosOrganizacionales } = calcScores(answers);
    const nivelCalculado = calcLevel(scoreCaracteristicasDelCambio, scoreAtributosOrganizacionales);

    const rows = answersToRespuestaRows(projectId, answers);
    if (rows.length > 0) {
      const { error } = await supabase
        .from('respuestas_diagnostico')
        .upsert(rows, { onConflict: 'proyecto_id,bloque,numero_pregunta' });
      if (error) {
        console.error(error);
        return;
      }
    }

    const { error: projError } = await supabase
      .from('proyectos')
      .update({
        score_caracteristicas_del_cambio: scoreCaracteristicasDelCambio,
        score_atributos_organizacionales: scoreAtributosOrganizacionales,
        nivel_calculado: nivelCalculado,
      })
      .eq('id', projectId);
    if (projError) {
      console.error(projError);
      return;
    }

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, respuestas: answers, scoreCaracteristicasDelCambio, scoreAtributosOrganizacionales, nivelCalculado }
          : p,
      ),
    }));
  },

  generatePlan: async (projectId) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project?.nivelCalculado) return;
    const nivel = project.nivelCalculado;
    const tasks = generateTasksForLevel(nivel).map((t) => ({ ...t, id: uuid() }));

    const rows = tasks.map((t, index) => ({
      id: t.id,
      proyecto_id: projectId,
      etapa: t.etapa,
      nombre: t.tarea,
      responsable_rol: t.responsableRol,
      persona_asignada_id: null,
      asignacion_manual: false,
      estado: 'Pendiente',
      escalada: false,
      orden: index,
    }));
    const { error } = await supabase.from('tareas').insert(rows);
    if (error) {
      console.error(error);
      return;
    }

    const planGeneradoEn = new Date().toISOString();
    const { error: projError } = await supabase
      .from('proyectos')
      .update({ estado: 'En curso', plan_generado_en: planGeneradoEn })
      .eq('id', projectId);
    if (projError) {
      console.error(projError);
      return;
    }

    const audit = await insertAudit({
      projectId,
      usuario: DEMO_USER,
      tipo: 'plan_generado' as AuditEventType,
      detalle: `Se generó el plan de trabajo (nivel ${nivel}).`,
    });

    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, tasks, estado: 'En curso' as ProjectStatus, planGeneratedAt: planGeneradoEn }
          : p,
      ),
      auditLog: [...s.auditLog, audit],
    }));
  },

  updateTaskStatus: async (projectId, taskId, estado) => {
    const project = get().projects.find((p) => p.id === projectId);
    const task = project?.tasks.find((t) => t.id === taskId);
    if (!project || !task) return;
    const estadoAnterior = task.estado;

    const { error } = await supabase.from('tareas').update({ estado }).eq('id', taskId);
    if (error) {
      console.error(error);
      return;
    }

    const audit = await insertAudit({
      projectId,
      taskId,
      usuario: DEMO_USER,
      tipo: 'estado_tarea',
      detalle: `Cambió el estado de "${task.tarea}" de "${estadoAnterior}" a "${estado}"`,
      valorAnterior: estadoAnterior,
      valorNuevo: estado,
    });

    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, estado } : t)) } : p,
      ),
      auditLog: [...s.auditLog, audit],
    }));
  },

  reassignTask: async (projectId, taskId, personaId, manual) => {
    const project = get().projects.find((p) => p.id === projectId);
    const task = project?.tasks.find((t) => t.id === taskId);
    if (!project || !task) return;
    const personaAnterior = personaNombre(task.personaAsignadaId);
    const personaNueva = personaNombre(personaId);

    const { error } = await supabase
      .from('tareas')
      .update({ persona_asignada_id: personaId ?? null, asignacion_manual: manual })
      .eq('id', taskId);
    if (error) {
      console.error(error);
      return;
    }

    const updatedTasks = project.tasks.map((t) =>
      t.id === taskId ? { ...t, personaAsignadaId: personaId, asignacionManual: manual } : t,
    );
    const personasInvolucradasIds = computePersonasInvolucradas(updatedTasks);
    const { error: projError } = await supabase
      .from('proyectos')
      .update({ personas_involucradas_ids: personasInvolucradasIds })
      .eq('id', projectId);
    if (projError) console.error(projError);

    const audit = await insertAudit({
      projectId,
      taskId,
      usuario: DEMO_USER,
      tipo: 'reasignacion',
      detalle: `Persona asignada: ${personaAnterior} → ${personaNueva}`,
      valorAnterior: personaAnterior,
      valorNuevo: personaNueva,
    });

    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, tasks: updatedTasks, personasInvolucradasIds } : p,
      ),
      auditLog: [...s.auditLog, audit],
    }));
  },

  escalateTask: async (projectId, taskId, justificacion, personaId) => {
    const project = get().projects.find((p) => p.id === projectId);
    const task = project?.tasks.find((t) => t.id === taskId);
    if (!project || !task) return;
    const nuevoRol: RoleName = 'Equipo Experto de GDC';

    const { error } = await supabase
      .from('tareas')
      .update({
        responsable_rol: nuevoRol,
        persona_asignada_id: personaId,
        asignacion_manual: true,
        escalada: true,
      })
      .eq('id', taskId);
    if (error) {
      console.error(error);
      return;
    }

    const updatedTasks = project.tasks.map((t) =>
      t.id === taskId
        ? { ...t, responsableRol: nuevoRol, personaAsignadaId: personaId, asignacionManual: true, escalada: true }
        : t,
    );
    const personasInvolucradasIds = computePersonasInvolucradas(updatedTasks);
    const { error: projError } = await supabase
      .from('proyectos')
      .update({ personas_involucradas_ids: personasInvolucradasIds })
      .eq('id', projectId);
    if (projError) console.error(projError);

    const audit = await insertAudit({
      projectId,
      taskId,
      usuario: DEMO_USER,
      tipo: 'escalamiento',
      detalle: `Se escaló la tarea "${task.tarea}" a ${personaNombre(personaId)} (Equipo Experto de GDC). Justificación: ${justificacion}`,
    });

    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, tasks: updatedTasks, personasInvolucradasIds } : p,
      ),
      auditLog: [...s.auditLog, audit],
    }));
  },

  cancelProject: async (projectId, motivo) => {
    const canceladoEn = new Date().toISOString();
    const { error } = await supabase
      .from('proyectos')
      .update({ estado: 'Cancelado', cancelado_motivo: motivo, cancelado_por: DEMO_USER, cancelado_en: canceladoEn })
      .eq('id', projectId);
    if (error) {
      console.error(error);
      return;
    }

    const audit = await insertAudit({
      projectId,
      usuario: DEMO_USER,
      tipo: 'cancelacion_proyecto',
      detalle: `Proyecto cancelado. Motivo: ${motivo}`,
    });

    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, estado: 'Cancelado' as ProjectStatus, canceladoMotivo: motivo, canceladoPor: DEMO_USER, canceladoFecha: canceladoEn }
          : p,
      ),
      auditLog: [...s.auditLog, audit],
    }));
  },

  registerAiDraft: () => set((s) => ({ aiDraftCount: s.aiDraftCount + 1 })),

  raiseQuestionEscalation: async (projectId, questionId, preguntaTexto, consulta) => {
    const id = uuid();
    const fecha = new Date().toISOString();
    const { error } = await supabase.from('question_escalations').insert({
      id,
      proyecto_id: projectId,
      question_id: questionId,
      pregunta_texto: preguntaTexto,
      consulta,
      usuario: DEMO_USER,
      creado_en: fecha,
      estado: 'abierta',
    });
    if (error) {
      console.error(error);
      return;
    }

    const escalation: QuestionEscalation = {
      id,
      projectId,
      questionId,
      preguntaTexto,
      consulta,
      usuario: DEMO_USER,
      fecha,
      estado: 'abierta',
    };

    const audit = await insertAudit({
      projectId,
      usuario: DEMO_USER,
      tipo: 'escalamiento',
      detalle: `Elevó consulta sobre la pregunta ${questionId} del cuestionario al Equipo Experto de GDC.`,
    });

    set((s) => ({
      questionEscalations: [...s.questionEscalations, escalation],
      auditLog: [...s.auditLog, audit],
    }));
  },

  resolveQuestionEscalation: async (escalationId, respuesta) => {
    const escalation = get().questionEscalations.find((e) => e.id === escalationId);
    if (!escalation) return;
    const fechaRespuesta = new Date().toISOString();

    const { error } = await supabase
      .from('question_escalations')
      .update({ estado: 'resuelta', respuesta, respondido_por: DEMO_USER, respondido_en: fechaRespuesta })
      .eq('id', escalationId);
    if (error) {
      console.error(error);
      return;
    }

    const audit = await insertAudit({
      projectId: escalation.projectId,
      usuario: DEMO_USER,
      tipo: 'escalamiento',
      detalle: `Respondió la consulta sobre la pregunta ${escalation.questionId} del cuestionario.`,
    });

    set((s) => ({
      questionEscalations: s.questionEscalations.map((e) =>
        e.id === escalationId
          ? { ...e, estado: 'resuelta' as const, respuesta, respondidoPor: DEMO_USER, fechaRespuesta }
          : e,
      ),
      auditLog: [...s.auditLog, audit],
    }));
  },
}));
