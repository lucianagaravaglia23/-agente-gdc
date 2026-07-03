export type RoleName =
  | 'Equipo Experto de GDC'
  | 'Embajadores / Staffing Dinámico'
  | 'Embajadores de Red de Cambio'
  | 'Líder de Gestión del Cambio';

export type ImpactLevel = 'ALTO' | 'MEDIO' | 'BAJO';

export type ProjectStatus = 'En diagnóstico' | 'En curso' | 'Completado' | 'Cancelado';

export type TaskStatus = 'Pendiente' | 'En progreso' | 'Completada' | 'Bloqueada';

export type StageName = 'Preparar el Cambio' | 'Gestionar el Cambio' | 'Reforzar el Cambio';

export const STAGE_ORDER: StageName[] = ['Preparar el Cambio', 'Gestionar el Cambio', 'Reforzar el Cambio'];

export interface MatrixEntry {
  etapa: StageName;
  tarea: string;
  responsable: RoleName;
}

export interface ProjectTask {
  id: string;
  etapa: StageName;
  tarea: string;
  responsableRol: RoleName;
  personaAsignadaId?: string;
  asignacionManual: boolean;
  estado: TaskStatus;
  templateId?: string;
  escalada?: boolean;
}

export type QuestionBlock = 'Características del Cambio' | 'Atributos Organizacionales';

export interface QuestionOption {
  valor: 1 | 2 | 3 | 4 | 5;
  texto: string;
  esExplicita: boolean;
}

export interface QuestionnaireQuestion {
  id: string; // e.g. CS-1.01, AO-2.01
  bloque: QuestionBlock;
  numero: number;
  texto: string;
  opciones: QuestionOption[];
}

export type QuestionnaireAnswers = Record<string, 1 | 2 | 3 | 4 | 5>;

export type EscalationStatus = 'abierta' | 'resuelta';

export interface QuestionEscalation {
  id: string;
  projectId: string;
  questionId: string;
  preguntaTexto: string;
  consulta: string;
  usuario: string;
  fecha: string;
  estado: EscalationStatus;
  respuesta?: string;
  respondidoPor?: string;
  fechaRespuesta?: string;
}

export interface Project {
  id: string;
  nombre: string;
  descripcion: string;
  area: string;
  estado: ProjectStatus;
  createdAt: string;
  planGeneratedAt?: string;
  respuestas?: QuestionnaireAnswers;
  scoreCaracteristicasDelCambio?: number;
  scoreAtributosOrganizacionales?: number;
  nivelCalculado?: ImpactLevel;
  tasks: ProjectTask[];
  canceladoMotivo?: string;
  canceladoPor?: string;
  canceladoFecha?: string;
  personasInvolucradasIds: string[];
}

export type AuditEventType =
  | 'estado_tarea'
  | 'reasignacion'
  | 'cancelacion_proyecto'
  | 'escalamiento'
  | 'plan_generado';

export interface AuditLogEntry {
  id: string;
  projectId: string;
  taskId?: string;
  usuario: string;
  fecha: string;
  tipo: AuditEventType;
  detalle: string;
  valorAnterior?: string;
  valorNuevo?: string;
}

export interface Template {
  id: string;
  tarea: string;
  nombre: string;
  descripcion: string;
}
