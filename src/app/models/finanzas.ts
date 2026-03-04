export interface TransaccionFinanciera {
  fechaHora: string;
  tipo: string;          // 'INGRESO' o 'EGRESO'
  origen: string;        // 'VENTA', 'COMPRA', 'CAJA_CHICA'
  tipoComprobante: string;
  comprobante: string;
  entidad: string;
  moneda: string;
  montoTotal: number;
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