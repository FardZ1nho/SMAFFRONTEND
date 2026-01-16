export interface CuentaBancaria {
    id?: number;        // Opcional porque al crear una nueva no tiene ID aún
    nombre: string;     // Ej: "Yape Ventas", "Caja Chica"
    banco: string;      // Ej: "BCP", "INTERBANK", "BBVA"
    numero: string;     // Número de cuenta o celular
    cci?: string;  // ✅ NUEVO (Opcional porque Yape no usa CCI)
    moneda: string;     // "PEN" (Soles) o "USD" (Dólares)
    tipo: string;       // "DIGITAL" (Yape/Plin) o "BANCARIA"
    titular?: string;   // Opcional
    activa: boolean;    // true/false
}