import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGdcStore } from '../store/store';

export function NewProjectPage() {
  const navigate = useNavigate();
  const createProject = useGdcStore((s) => s.createProject);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [area, setArea] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !area.trim()) {
      setError('Completá todos los campos obligatorios.');
      return;
    }
    const id = await createProject({ nombre, descripcion, area });
    navigate(`/proyectos/${id}/cuestionario`);
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold text-slate-800">Nuevo proyecto</h1>
      <p className="mt-1 text-sm text-slate-500">
        Cargá los datos básicos. Después vas a completar el cuestionario de evaluación de impacto.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6">
        <Field label="Nombre del proyecto *">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="input" />
        </Field>
        <Field label="Descripción">
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="input" rows={3} />
        </Field>
        <Field label="Área solicitante *">
          <input value={area} onChange={(e) => setArea(e.target.value)} className="input" />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Continuar al cuestionario de impacto →
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
