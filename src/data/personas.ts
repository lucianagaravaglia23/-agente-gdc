import type { RoleName } from '../types';

export interface Persona {
  id: string;
  nombre: string;
  rol: RoleName;
}

export const PERSONAS: Persona[] = [
  { id: 'luciana', nombre: 'Luciana Garavaglia', rol: 'Equipo Experto de GDC' },
  { id: 'monica', nombre: 'Monica Galvez', rol: 'Equipo Experto de GDC' },
  { id: 'milagros', nombre: 'Maria de los Milagros', rol: 'Embajadores / Staffing Dinámico' },
  { id: 'jose', nombre: 'Jose Gonzalez', rol: 'Embajadores / Staffing Dinámico' },
  { id: 'ana', nombre: 'Ana Martínez', rol: 'Embajadores de Red de Cambio' },
];
