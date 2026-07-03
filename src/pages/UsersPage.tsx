import { PERSONAS } from '../data/personas';

export function UsersPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800">Usuarios</h1>
      <p className="mt-1 text-sm text-slate-500">
        Personas disponibles para asignar tareas del plan de cambio, con su rol correspondiente. Este listado es fijo
        y solo de lectura — no se pueden crear ni editar usuarios desde acá.
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Rol</th>
            </tr>
          </thead>
          <tbody>
            {PERSONAS.map((persona) => (
              <tr key={persona.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">{persona.nombre}</td>
                <td className="px-4 py-3 text-slate-600">{persona.rol}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
