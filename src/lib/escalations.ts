import type { QuestionEscalation } from '../types';

export function openEscalation(
  escalations: QuestionEscalation[],
  projectId: string,
  questionId: string,
): QuestionEscalation | undefined {
  return escalations.find((e) => e.projectId === projectId && e.questionId === questionId && e.estado === 'abierta');
}

export function isQuestionLocked(escalations: QuestionEscalation[], projectId: string, questionId: string): boolean {
  return openEscalation(escalations, projectId, questionId) !== undefined;
}

export function hasOpenEscalations(escalations: QuestionEscalation[], projectId: string): boolean {
  return escalations.some((e) => e.projectId === projectId && e.estado === 'abierta');
}

export function latestResolvedEscalation(
  escalations: QuestionEscalation[],
  projectId: string,
  questionId: string,
): QuestionEscalation | undefined {
  const resueltas = escalations.filter(
    (e) => e.projectId === projectId && e.questionId === questionId && e.estado === 'resuelta',
  );
  return resueltas.at(-1);
}
