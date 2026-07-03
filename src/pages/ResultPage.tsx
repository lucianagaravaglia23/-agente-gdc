import { useNavigate, useParams, Link } from 'react-router-dom';
import { useGdcStore } from '../store/store';
import { isAnswersComplete } from '../lib/scoring';
import { hasOpenEscalations } from '../lib/escalations';
import { LevelBadge } from '../components/Badge';
import { exportDiagnosticXlsx } from '../lib/xlsxExport';

const SCORE_MIN = 12;
const SCORE_MAX = 60;
const pct = (score: number) => ((score - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100;

export function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = useGdcStore((s) => s.projects.find((p) => p.id === id));
  const questionEscalations = useGdcStore((s) => s.questionEscalations);
  const generatePlan = useGdcStore((s) => s.generatePlan);

  if (!project || project.scoreCaracteristicasDelCambio === undefined) {
    return <p className="text-sm text-slate-500">Todavía no se completó el cuestionario de este proyecto.</p>;
  }

  const scoreC = project.scoreCaracteristicasDelCambio;
  const scoreA = project.scoreAtributosOrganizacionales ?? 0;
  const planGenerado = project.tasks.length > 0;

  const respuestasCompletas = isAnswersComplete(project.respuestas);
  const consultasPendientes = hasOpenEscalations(questionEscalations, project.id);
  const puedeGenerarPlan = respuestasCompletas && !consultasPendientes;

  const handleGeneratePlan = () => {
    if (!puedeGenerarPlan) return;
    generatePlan(project.id);
    navigate(`/proyectos/${project.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-800">Resultado del diagnóstico</h1>
      <p className="mt-1 text-sm text-slate-500">Proyecto: {project.nombre}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ScoreCard label="Características del Cambio" score={scoreC} />
        <ScoreCard label="Atributos Organizacionales" score={scoreA} />
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Nivel de impacto calculado</p>
          <div className="mt-1">
            <LevelBadge level={project.nivelCalculado} />
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600">
          Características del Cambio = {scoreC} ({scoreC >= 30 ? '≥ 30' : '< 30'}) · Atributos Organizacionales ={' '}
          {scoreA} ({scoreA >= 30 ? '≥ 30' : '< 30'}) →{' '}
          {scoreC >= 30 && scoreA >= 30
            ? 'ambos scores ≥ 30 ⇒ ALTO'
            : scoreC >= 30 || scoreA >= 30
              ? 'un solo score ≥ 30 ⇒ MEDIO'
              : 'ambos scores < 30 ⇒ BAJO'}
        </p>

        <RiskMatrix scoreC={scoreC} scoreA={scoreA} />

        {!planGenerado && !puedeGenerarPlan && (
          <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-medium">Todavía no se puede generar el plan de trabajo.</p>
            <ul className="mt-1 list-inside list-disc text-amber-700">
              {consultasPendientes && <li>Hay consultas elevadas a GDC sin responder.</li>}
              {!respuestasCompletas && <li>Quedan preguntas del cuestionario sin responder.</li>}
            </ul>
            <Link
              to={`/proyectos/${project.id}/cuestionario`}
              className="mt-2 inline-block text-sm font-medium text-amber-800 hover:underline"
            >
              Volver al cuestionario →
            </Link>
          </div>
        )}

      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => void exportDiagnosticXlsx(project)}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Descargar Toolkit (.xlsx)
        </button>
        <button
          type="button"
          disabled={!planGenerado && !puedeGenerarPlan}
          onClick={handleGeneratePlan}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40"
        >
          {planGenerado ? 'Ir al plan de trabajo →' : 'Generar plan de trabajo →'}
        </button>
      </div>
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-800">
        {score}
        <span className="text-base font-normal text-slate-400"> / 60</span>
      </p>
    </div>
  );
}

function RiskMatrix({ scoreC, scoreA }: { scoreC: number; scoreA: number }) {
  const left = pct(scoreC);
  const bottom = pct(scoreA);
  return (
    <div className="mt-6">
      <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
        Matriz de riesgo (Características del Cambio × Atributos Organizacionales)
      </p>
      <div className="relative h-48 w-full rounded-md border border-slate-200">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          <div className="border-b border-r border-slate-200 bg-amber-50" />
          <div className="border-b border-slate-200 bg-red-50" />
          <div className="border-r border-slate-200 bg-emerald-50" />
          <div className="bg-amber-50" />
        </div>
        <div
          className="absolute h-3 w-3 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white bg-brand-600 shadow"
          style={{ left: `${left}%`, bottom: `${bottom}%` }}
          title={`Características: ${scoreC}, Atributos: ${scoreA}`}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>Características del Cambio: {SCORE_MIN}</span>
        <span>{SCORE_MAX}</span>
      </div>
    </div>
  );
}
