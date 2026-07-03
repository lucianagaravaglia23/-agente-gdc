import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QUESTIONNAIRE } from '../data/questionnaire';
import { useGdcStore } from '../store/store';
import { isQuestionLocked, latestResolvedEscalation, openEscalation } from '../lib/escalations';
import { getQuestionAssistantReply, type AiChatMessage } from '../lib/agentMock';
import { isAnswersComplete } from '../lib/scoring';
import { Modal } from '../components/Modal';
import type { QuestionBlock, QuestionEscalation, QuestionnaireAnswers, QuestionnaireQuestion } from '../types';

const ASSISTANT_DISCLAIMER =
  'Este asistente ofrece sugerencias generales y orientativas. No reemplaza tu criterio ni toma la decisión por vos: la respuesta final del cuestionario es tu responsabilidad.';

const BLOQUES: QuestionBlock[] = ['Características del Cambio', 'Atributos Organizacionales'];

export function QuestionnairePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const saveAnswers = useGdcStore((s) => s.saveAnswers);
  const project = useGdcStore((s) => s.projects.find((p) => p.id === id));
  const questionEscalations = useGdcStore((s) => s.questionEscalations);
  const raiseQuestionEscalation = useGdcStore((s) => s.raiseQuestionEscalation);

  const [answers, setAnswers] = useState<QuestionnaireAnswers>(project?.respuestas ?? {});
  const [activeBloque, setActiveBloque] = useState<QuestionBlock>(BLOQUES[0]);
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);

  const [assistantOpenId, setAssistantOpenId] = useState<string | null>(null);
  const [chatByQuestion, setChatByQuestion] = useState<Record<string, AiChatMessage[]>>({});
  const [chatDraft, setChatDraft] = useState('');

  const [escalateOpenId, setEscalateOpenId] = useState<string | null>(null);
  const [escalateDraft, setEscalateDraft] = useState('');

  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (!pendingScrollId) return;
    const el = document.getElementById(`question-${pendingScrollId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setPendingScrollId(null);
  }, [activeBloque, pendingScrollId]);

  if (!project) {
    return <p className="text-sm text-slate-500">Proyecto no encontrado.</p>;
  }

  const total = QUESTIONNAIRE.length;
  const answeredCount = QUESTIONNAIRE.filter((q) => answers[q.id] !== undefined).length;
  const allAnswered = isAnswersComplete(answers);
  const pct = Math.round((answeredCount / total) * 100);
  const questionsForBloque = QUESTIONNAIRE.filter((q) => q.bloque === activeBloque);

  const countForBloque = (bloque: QuestionBlock) =>
    QUESTIONNAIRE.filter((q) => q.bloque === bloque && answers[q.id] !== undefined).length;
  const totalForBloque = (bloque: QuestionBlock) => QUESTIONNAIRE.filter((q) => q.bloque === bloque).length;

  const handleSelect = (question: QuestionnaireQuestion, valor: 1 | 2 | 3 | 4 | 5) => {
    if (isQuestionLocked(questionEscalations, project.id, question.id)) return;
    const next = { ...answers, [question.id]: valor };
    setAnswers(next);
    void saveAnswers(id as string, next);
  };

  const handleFinish = async () => {
    await saveAnswers(id as string, answers);
    navigate(`/proyectos/${id}/resultado`);
  };

  const handleSendChat = (question: QuestionnaireQuestion) => {
    const mensaje = chatDraft.trim();
    if (!mensaje) return;
    const reply = getQuestionAssistantReply(question.texto, mensaje);
    setChatByQuestion((prev) => ({
      ...prev,
      [question.id]: [...(prev[question.id] ?? []), { role: 'user', texto: mensaje }, { role: 'assistant', texto: reply }],
    }));
    setChatDraft('');
  };

  const handleEscalate = (question: QuestionnaireQuestion) => {
    const consulta = escalateDraft.trim();
    if (!consulta) return;
    void raiseQuestionEscalation(project.id, question.id, question.texto, consulta);
    setEscalateDraft('');
    setEscalateOpenId(null);
  };

  const goToQuestion = (question: QuestionnaireQuestion) => {
    setShowReview(false);
    setActiveBloque(question.bloque);
    setPendingScrollId(question.id);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Diagnóstico</p>
          <h1 className="text-xl font-semibold text-slate-800">{project.nombre}</h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">
            {answeredCount} / {total} preguntas
          </p>
          <p className="text-sm font-medium text-brand-600">{pct}% completado</p>
        </div>
      </div>

      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {BLOQUES.map((bloque, i) => (
            <button
              key={bloque}
              type="button"
              onClick={() => setActiveBloque(bloque)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeBloque === bloque
                  ? 'bg-brand-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {i + 1}. {bloque} ({countForBloque(bloque)}/{totalForBloque(bloque)})
            </button>
          ))}
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            disabled={!allAnswered}
            onClick={() => setShowReview(true)}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40"
          >
            Finalizar y ver resultado →
          </button>
          {!allAnswered && (
            <p className="text-xs text-amber-600">
              Respondé las {total - answeredCount} preguntas restantes para poder finalizar.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {questionsForBloque.map((question) => {
          const locked = isQuestionLocked(questionEscalations, project.id, question.id);
          return (
            <QuestionCard
              key={question.id}
              question={question}
              selected={answers[question.id]}
              locked={locked}
              pendingEscalation={openEscalation(questionEscalations, project.id, question.id)}
              resolvedEscalation={!locked ? latestResolvedEscalation(questionEscalations, project.id, question.id) : undefined}
              onSelect={(valor) => handleSelect(question, valor)}
              assistantOpen={assistantOpenId === question.id}
              onToggleAssistant={() => setAssistantOpenId((v) => (v === question.id ? null : question.id))}
              chat={chatByQuestion[question.id] ?? []}
              chatDraft={chatDraft}
              onChatDraftChange={setChatDraft}
              onSendChat={() => handleSendChat(question)}
              escalateOpen={escalateOpenId === question.id}
              onToggleEscalate={() => setEscalateOpenId((v) => (v === question.id ? null : question.id))}
              escalateDraft={escalateDraft}
              onEscalateDraftChange={setEscalateDraft}
              onConfirmEscalate={() => handleEscalate(question)}
            />
          );
        })}
      </div>

      {showReview && (
        <Modal title="Revisá tus respuestas antes de finalizar" onClose={() => setShowReview(false)} wide>
          <ReviewList answers={answers} onEdit={goToQuestion} />
          <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setShowReview(false)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Seguir revisando
            </button>
            <button
              type="button"
              onClick={() => void handleFinish()}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Confirmar y ver resultado →
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function QuestionCard({
  question,
  selected,
  locked,
  pendingEscalation,
  resolvedEscalation,
  onSelect,
  assistantOpen,
  onToggleAssistant,
  chat,
  chatDraft,
  onChatDraftChange,
  onSendChat,
  escalateOpen,
  onToggleEscalate,
  escalateDraft,
  onEscalateDraftChange,
  onConfirmEscalate,
}: {
  question: QuestionnaireQuestion;
  selected: 1 | 2 | 3 | 4 | 5 | undefined;
  locked: boolean;
  pendingEscalation: QuestionEscalation | undefined;
  resolvedEscalation: QuestionEscalation | undefined;
  onSelect: (valor: 1 | 2 | 3 | 4 | 5) => void;
  assistantOpen: boolean;
  onToggleAssistant: () => void;
  chat: AiChatMessage[];
  chatDraft: string;
  onChatDraftChange: (v: string) => void;
  onSendChat: () => void;
  escalateOpen: boolean;
  onToggleEscalate: () => void;
  escalateDraft: string;
  onEscalateDraftChange: (v: string) => void;
  onConfirmEscalate: () => void;
}) {
  return (
    <div
      id={`question-${question.id}`}
      className={`scroll-mt-4 rounded-lg border bg-white p-5 shadow-sm ${
        selected ? 'border-brand-200' : 'border-slate-200'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
            {question.id}
          </span>
          <h3 className="text-sm font-semibold text-slate-800">{question.texto}</h3>
        </div>
        <button
          type="button"
          onClick={onToggleAssistant}
          className="shrink-0 rounded-md border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50"
        >
          Asistente de IA
        </button>
      </div>

      {locked && pendingEscalation && (
        <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-medium">Consulta elevada al Equipo Experto de GDC — esperando respuesta.</p>
          <p className="mt-1 text-amber-700">
            Tu consulta: "{pendingEscalation.consulta}" ({new Date(pendingEscalation.fecha).toLocaleString()})
          </p>
        </div>
      )}

      {resolvedEscalation && (
        <div className="mt-3 rounded-md border border-brand-300 bg-brand-50 p-3 text-sm text-brand-800">
          <p className="font-medium">Respuesta del Equipo Experto de GDC</p>
          <p className="mt-1">{resolvedEscalation.respuesta}</p>
          <p className="mt-1 text-xs text-brand-700">
            Respondido por {resolvedEscalation.respondidoPor ?? 'Equipo GDC'}
            {resolvedEscalation.fechaRespuesta ? ` · ${new Date(resolvedEscalation.fechaRespuesta).toLocaleString()}` : ''}
          </p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {question.opciones.map((opcion) => {
          const isSelected = selected === opcion.valor;
          return (
            <button
              key={opcion.valor}
              type="button"
              disabled={locked}
              onClick={() => onSelect(opcion.valor)}
              className={`relative flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors ${
                locked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              } ${isSelected ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              {isSelected && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] text-white">
                  ✓
                </span>
              )}
              <span className="text-base font-semibold text-slate-700">{opcion.valor}</span>
              <span className="text-xs text-slate-500">
                {opcion.texto}
                {!opcion.esExplicita && <span className="ml-1 italic text-slate-400">(interpolado)</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          disabled={locked}
          onClick={onToggleEscalate}
          className="rounded-md border border-amber-300 px-2 py-1 text-amber-700 hover:bg-amber-50 disabled:opacity-40"
        >
          Elevar consulta a GDC
        </button>
      </div>

      {assistantOpen && (
        <div className="mt-3 rounded-md border border-brand-100 bg-brand-50/50 p-3">
          <p className="text-xs italic text-brand-800">{ASSISTANT_DISCLAIMER}</p>
          {chat.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {chat.map((m, i) => (
                <div
                  key={i}
                  className={`whitespace-pre-wrap rounded-md p-2 text-xs ${
                    m.role === 'user' ? 'bg-white text-slate-700' : 'bg-brand-100 text-brand-800'
                  }`}
                >
                  <span className="font-semibold">{m.role === 'user' ? 'Vos: ' : 'Asistente: '}</span>
                  {m.texto}
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <input
              value={chatDraft}
              onChange={(e) => onChatDraftChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSendChat()}
              placeholder="Escribí tu consulta sobre esta pregunta…"
              className="input flex-1 text-xs"
            />
            <button
              type="button"
              onClick={onSendChat}
              disabled={!chatDraft.trim()}
              className="rounded-md bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-40"
            >
              Enviar
            </button>
          </div>
        </div>
      )}

      {escalateOpen && !locked && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-700">
            Se va a notificar al Equipo Experto de GDC. La pregunta queda bloqueada hasta que respondan.
          </p>
          <textarea
            value={escalateDraft}
            onChange={(e) => onEscalateDraftChange(e.target.value)}
            placeholder="Describí tu duda para el equipo de GDC…"
            className="input mt-2 w-full text-xs"
            rows={2}
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onToggleEscalate}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!escalateDraft.trim()}
              onClick={onConfirmEscalate}
              className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
            >
              Confirmar consulta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewList({
  answers,
  onEdit,
}: {
  answers: QuestionnaireAnswers;
  onEdit: (question: QuestionnaireQuestion) => void;
}) {
  return (
    <div className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto pr-1">
      {BLOQUES.map((bloque) => (
        <div key={bloque}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{bloque}</p>
          <ul className="flex flex-col gap-2">
            {QUESTIONNAIRE.filter((q) => q.bloque === bloque).map((q) => {
              const valor = answers[q.id];
              const opcion = q.opciones.find((o) => o.valor === valor);
              return (
                <li
                  key={q.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-slate-200 p-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-400">{q.id}</p>
                    <p className="font-medium text-slate-800">{q.texto}</p>
                    <p className="mt-1 text-slate-600">
                      {valor ? (
                        <>
                          <span className="font-semibold text-brand-700">{valor}.</span> {opcion?.texto}
                        </>
                      ) : (
                        <span className="text-red-500">Sin responder</span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEdit(q)}
                    className="shrink-0 whitespace-nowrap text-sm text-brand-600 hover:underline"
                  >
                    Editar →
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
