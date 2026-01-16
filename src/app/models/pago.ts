import { MetodoPago } from './venta';

export interface Pago {
  id: number;
  monto: number;
  fechaPago: string; // O Date, dependiendo de cómo lo manejes
  metodoPago: MetodoPago;
}