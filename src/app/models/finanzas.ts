export interface TransaccionFinanciera {
  fechaHora: string;
  tipo: string;          // 'INGRESO' o 'EGRESO'
  origen: string;        // 'VENTA', 'COMPRA', 'CAJA_CHICA'
  tipoComprobante: string;
  comprobante: string;
  entidad: string;
  moneda: string;
  montoTotal: number;

  // ✅ NUEVOS CAMPOS PARA EL REPORTE CONTABLE
  ruc?: string;
  descripcion?: string;
  subTotal?: number;
  igv?: number;
  tipoCambio?: number;
  retencion: number;
  detraccion: number;
  percepcion: number;

  // ✅ CAMPO CLAVE PARA SABER SI ESTÁ ANULADA
  estado?: string; 
}

export interface FinanzasDashboard {
  totalIngresosEfectivos: number;
  totalEgresosEfectivos: number;
  balanceNeto: number;
  
  totalIgvPercibido: number;
  totalIgvPagado: number;
  balanceIgv: number;
  
  totalRetenciones: number;
  totalDetracciones: number;
  totalPercepciones: number;

  transacciones: TransaccionFinanciera[];
}