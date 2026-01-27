// src/app/models/tarea.ts

// ==========================================
// 🛠️ ENUMS (Deben coincidir con el Backend)
// ==========================================
export enum PrioridadTarea {
  ALTA = 'ALTA',
  MEDIA = 'MEDIA',
  BAJA = 'BAJA'
}

export enum EstadoTarea {
  PENDIENTE = 'PENDIENTE',
  COMPLETADA = 'COMPLETADA'
}

// ==========================================
// 📤 REQUEST: Lo que enviamos para crear
// ==========================================
export interface TareaRequest {
  titulo: string;
  descripcion?: string;
  fechaLimite: string; // Formato ISO: '2023-12-31T23:59:00'
  prioridad: PrioridadTarea;
  usuarioAsignadoId: number; // ID del usuario (Long en Java -> number en TS)
}

// ==========================================
// 📥 RESPONSE: Lo que recibimos del servidor
// ==========================================
export interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  fechaLimite: string;
  prioridad: PrioridadTarea; // O string si prefieres no ser tan estricto
  estado: EstadoTarea;
  
  // Datos informativos extra
  usuarioAsignadoId: number;
  usernameAsignado: string;
  usernameCreador: string;
  fechaCreacion: string;
  
  // Calculado por el backend
  vencida: boolean;
}