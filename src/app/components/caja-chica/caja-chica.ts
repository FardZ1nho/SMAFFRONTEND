import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { forkJoin } from 'rxjs';

// Servicios
import { VentaService } from '../../services/venta-service';
import { CompraService } from '../../services/compra-service';

// Modelos (Importamos tus modelos reales)
import { Venta, MetodoPago, EstadoVenta } from '../../models/venta';
import { CompraResponse } from '../../models/compra';

// Interfaz local para unificar Ventas y Compras en la vista
export interface MovimientoCaja {
  fecha: Date;
  tipo: 'INGRESO' | 'EGRESO';
  descripcion: string;
  referencia: string; // Código de boleta/factura
  monto: number;
  entidad: string; // Nombre del Cliente o Proveedor
  metodoPago?: string; // Para mostrar detalles
}

@Component({
  selector: 'app-caja-chica',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, 
    MatIconModule, MatCardModule, MatProgressBarModule,
    MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule
  ],
  templateUrl: './caja-chica.html',
  styleUrls: ['./caja-chica.css']
})
export class CajaChicaComponent implements OnInit {

  // Datos
  movimientos: MovimientoCaja[] = [];
  dataSource = new MatTableDataSource<MovimientoCaja>([]);
  
  // Totales Financieros
  totalIngresosEfectivo: number = 0;
  totalEgresosEfectivo: number = 0;
  saldoEnCaja: number = 0;

  // Estado
  cargando: boolean = true;
  filtroFecha: Date | null = null; 

  displayedColumns: string[] = ['fecha', 'tipo', 'descripcion', 'entidad', 'monto'];

  constructor(
    private ventaService: VentaService,
    private compraService: CompraService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarFlujoCaja();
  }

  cargarFlujoCaja(): void {
    this.cargando = true;

    // 1. Llamada simultánea a Ventas y Compras
    forkJoin({
      ventas: this.ventaService.listarTodas(),
      compras: this.compraService.listarTodas()
    }).subscribe({
      next: (response) => {
        const { ventas, compras } = response;
        
        // --- DIAGNÓSTICO EN CONSOLA ---
        console.log('🔍 TOTAL VENTAS RECIBIDAS:', ventas.length);
        // -------------------------------

        const ingresos: MovimientoCaja[] = [];

        ventas.forEach((v: Venta) => {
          // --- LOGS INDIVIDUALES PARA DETECTAR ERRORES ---
          if (!v.pagos || v.pagos.length === 0) {
             // Si ves esto en la consola, es que al guardar la venta NO se guardó el pago
             console.warn(`⚠️ Venta ${v.codigo} (ID: ${v.id}) NO TIENE PAGOS registrados. Estado: ${v.estado}`);
          } else {
             console.log(`✅ Venta ${v.codigo} tiene ${v.pagos.length} pagos.`, v.pagos);
          }
          // -----------------------------------------------

          // Solo procesamos ventas que no estén canceladas y tengan pagos
          if (v.estado !== EstadoVenta.CANCELADA && v.pagos && v.pagos.length > 0) {
            
            v.pagos.forEach(pago => {
              // MEJORA DE ROBUSTEZ: Forzamos a mayúsculas y string para evitar errores de tipo
              const metodoStr = String(pago.metodoPago).toUpperCase();

              // Filtramos solo si es EFECTIVO
              if (metodoStr === 'EFECTIVO') {
                ingresos.push({
                  fecha: new Date(pago.fechaPago || v.fechaVenta),
                  tipo: 'INGRESO',
                  descripcion: `Cobro Venta #${v.codigo}`,
                  referencia: v.codigo,
                  monto: pago.monto,
                  entidad: v.nombreCliente || 'Cliente General',
                  metodoPago: 'EFECTIVO'
                });
              }
            });
          }
        });

        // 3. Procesar EGRESOS (Compras)
        const egresos: MovimientoCaja[] = compras.map((c: CompraResponse) => ({
            fecha: new Date(c.fechaEmision),
            tipo: 'EGRESO',
            descripcion: c.tipoCompra === 'BIEN' ? 'Compra de Mercadería' : 'Gasto / Servicio',
            referencia: `${c.serie}-${c.numero}`,
            monto: c.total,
            entidad: c.nombreProveedor,
            metodoPago: 'CONTADO'
        }));

        // 4. Unificar y Ordenar (Más reciente primero)
        this.movimientos = [...ingresos, ...egresos].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
        
        this.dataSource.data = this.movimientos;
        this.calcularTotales();
        
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando caja chica', err);
        this.cargando = false;
      }
    });
  }

  calcularTotales(): void {
    // Calculamos sobre los datos actualmente visibles (por si aplicamos filtros)
    const datos = this.dataSource.data;

    this.totalIngresosEfectivo = datos
      .filter(m => m.tipo === 'INGRESO')
      .reduce((acc, m) => acc + m.monto, 0);

    this.totalEgresosEfectivo = datos
      .filter(m => m.tipo === 'EGRESO')
      .reduce((acc, m) => acc + m.monto, 0);

    this.saldoEnCaja = this.totalIngresosEfectivo - this.totalEgresosEfectivo;
  }

  aplicarFiltroFecha(): void {
    if (!this.filtroFecha) {
      this.dataSource.data = this.movimientos;
    } else {
      // Filtramos solo por día (ignorando hora)
      const fechaSel = this.filtroFecha.toDateString();
      this.dataSource.data = this.movimientos.filter(m => 
        m.fecha.toDateString() === fechaSel
      );
    }
    this.calcularTotales();
  }

  limpiarFiltro(): void {
    this.filtroFecha = null;
    this.dataSource.data = this.movimientos;
    this.calcularTotales();
  }
}