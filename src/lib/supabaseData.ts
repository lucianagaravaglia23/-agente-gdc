import { supabase } from './supabase';
import type {
  AuditEventType,
  AuditLogEntry,
  EscalationStatus,
  ImpactLevel,
  Project,
  ProjectStatus,
  ProjectTask,
  QuestionBlock,
  QuestionEscalation,
  QuestionnaireAnswers,
  RoleName,
  StageName,
  TaskStatus,
} from '../types';

const BLOQUE_PREFIX: Record<QuestionBlock, string> = {
  'Características del Cambio': 'CS',
  'Atributos Organizacionales': 'AO',
};

function questionIdFromRow(bloque: QuestionBlock, numero: number): string {
  return `${BLOQUE_PREFIX[bloque]}-${numero.toString().padStart(2, '0')}`;
}

interface TareaRow {
  id: string;
  etapa: StageName;
  nombre: string;
  responsable_rol: RoleName;
  persona_asignada_id: string | null;
  asignacion_manual: boolean;
  estado: TaskStatus;
  escalada: boolean;
  orden: number;
}

interface RespuestaRow {
  bloque: QuestionBlock;
  numero_pregunta: number;
  valor: 1 | 2 | 3 | 4 | 5;
}

interface ProyectoRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  area: string;
  estado: ProjectStatus;
  nivel_calculado: ImpactLevel | null;
  score_caracteristicas_del_cambio: number | null;
  score_atributos_organizacionales: number | null;
  creado_en: string;
  plan_generado_en: string | null;
  cancelado_motivo: string | null;
  cancelado_por: string | null;
  cancelado_en: string | null;
  personas_involucradas_ids: string[];
  tareas: TareaRow[];
  respuestas_diagnostico: RespuestaRow[];
}

interface AuditLogRow {
  id: string;
  proyecto_id: string;
  tarea_id: string | null;
  usuario: string;
  creado_en: string;
  tipo_evento: AuditEventType;
  detalle: string;
  valor_anterior: string | null;
  valor_nuevo: string | null;
}

interface QuestionEscalationRow {
  id: string;
  proyecto_id: string;
  question_id: string;
  pregunta_texto: string;
  consulta: string;
  usuario: string;
  creado_en: string;
  estado: EscalationStatus;
  respuesta: string | null;
  respondido_por: string | null;
  respondido_en: string | null;
}

function mapTarea(row: TareaRow): ProjectTask {
  return {
    id: row.id,
    etapa: row.etapa,
    tarea: row.nombre,
    responsableRol: row.responsable_rol,
    personaAsignadaId: row.persona_asignada_id ?? undefined,
    asignacionManual: row.asignacion_manual,
    estado: row.estado,
    escalada: row.escalada,
  };
}

function mapRespuestas(rows: RespuestaRow[]): QuestionnaireAnswers | undefined {
  if (rows.length === 0) return undefined;
  const answers: QuestionnaireAnswers = {};
  for (const row of rows) {
    answers[questionIdFromRow(row.bloque, row.numero_pregunta)] = row.valor;
  }
  return answers;
}

function mapProyecto(row: ProyectoRow): Project {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion ?? '',
    area: row.area,
    estado: row.estado,
    createdAt: row.creado_en,
    planGeneratedAt: row.plan_generado_en ?? undefined,
    respuestas: mapRespuestas(row.respuestas_diagnostico ?? []),
    scoreCaracteristicasDelCambio: row.score_caracteristicas_del_cambio ?? undefined,
    scoreAtributosOrganizacionales: row.score_atributos_organizacionales ?? undefined,
    nivelCalculado: row.nivel_calculado ?? undefined,
    tasks: (row.tareas ?? [])
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map(mapTarea),
    canceladoMotivo: row.cancelado_motivo ?? undefined,
    canceladoPor: row.cancelado_por ?? undefined,
    canceladoFecha: row.cancelado_en ?? undefined,
    personasInvolucradasIds: row.personas_involucradas_ids ?? [],
  };
}

function mapAuditLog(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    projectId: row.proyecto_id,
    taskId: row.tarea_id ?? undefined,
    usuario: row.usuario,
    fecha: row.creado_en,
    tipo: row.tipo_evento,
    detalle: row.detalle,
    valorAnterior: row.valor_anterior ?? undefined,
    valorNuevo: row.valor_nuevo ?? undefined,
  };
}

function mapQuestionEscalation(row: QuestionEscalationRow): QuestionEscalation {
  return {
    id: row.id,
    projectId: row.proyecto_id,
    questionId: row.question_id,
    preguntaTexto: row.pregunta_texto,
    consulta: row.consulta,
    usuario: row.usuario,
    fecha: row.creado_en,
    estado: row.estado,
    respuesta: row.respuesta ?? undefined,
    respondidoPor: row.respondido_por ?? undefined,
    fechaRespuesta: row.respondido_en ?? undefined,
  };
}

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('proyectos')
    .select('*, tareas(*), respuestas_diagnostico(*)')
    .order('creado_en', { ascending: true });
  if (error) throw error;
  return (data as ProyectoRow[]).map(mapProyecto);
}

export async function fetchAuditLog(): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase.from('audit_log').select('*').order('creado_en', { ascending: true });
  if (error) throw error;
  return (data as AuditLogRow[]).map(mapAuditLog);
}

export async function fetchQuestionEscalations(): Promise<QuestionEscalation[]> {
  const { data, error } = await supabase
    .from('question_escalations')
    .select('*')
    .order('creado_en', { ascending: true });
  if (error) throw error;
  return (data as QuestionEscalationRow[]).map(mapQuestionEscalation);
}
