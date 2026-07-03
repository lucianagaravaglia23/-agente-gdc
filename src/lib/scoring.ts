import { QUESTIONNAIRE } from '../data/questionnaire';
import { IMPACT_MATRIX } from '../data/impactMatrix';
import type { ImpactLevel, ProjectTask, QuestionnaireAnswers } from '../types';

export function isAnswersComplete(answers: QuestionnaireAnswers | undefined): boolean {
  if (!answers) return false;
  return QUESTIONNAIRE.every((q) => answers[q.id] !== undefined);
}

export function calcScores(answers: QuestionnaireAnswers): {
  scoreCaracteristicasDelCambio: number;
  scoreAtributosOrganizacionales: number;
} {
  let scoreCaracteristicasDelCambio = 0;
  let scoreAtributosOrganizacionales = 0;
  for (const question of QUESTIONNAIRE) {
    const respuesta = answers[question.id] ?? 0;
    if (question.bloque === 'Características del Cambio') {
      scoreCaracteristicasDelCambio += respuesta;
    } else {
      scoreAtributosOrganizacionales += respuesta;
    }
  }
  return { scoreCaracteristicasDelCambio, scoreAtributosOrganizacionales };
}

// Réplica de Tablero!F26. El PRD pide usar >=30 de forma consistente en las tres ramas
// para no dejar el hueco lógico que sí tiene el IF original del Excel (que usa >30 en dos ramas).
export function calcLevel(scoreCaracteristicasDelCambio: number, scoreAtributosOrganizacionales: number): ImpactLevel {
  const altaCaracteristicas = scoreCaracteristicasDelCambio >= 30;
  const altaAtributos = scoreAtributosOrganizacionales >= 30;
  if (altaCaracteristicas && altaAtributos) return 'ALTO';
  if (altaCaracteristicas || altaAtributos) return 'MEDIO';
  return 'BAJO';
}

export function generateTasksForLevel(level: ImpactLevel): ProjectTask[] {
  return IMPACT_MATRIX[level].map((entry, index) => ({
    id: `task-${level}-${index}-${Date.now()}`,
    etapa: entry.etapa,
    tarea: entry.tarea,
    responsableRol: entry.responsable,
    personaAsignadaId: undefined,
    asignacionManual: false,
    estado: 'Pendiente',
  }));
}
