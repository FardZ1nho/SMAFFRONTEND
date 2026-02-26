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
import { MatTooltipModule } from '@angular/material/tooltip'; // 🟢 NUEVO: Para el tooltip del botón
import { forkJoin } from 'rxjs';

// Servicios
import { VentaService } from '../../services/venta-service';
import { CompraService } from '../../services/compra-service';
import { MovimientoCajaService } from '../../services/movimiento-caja-service';  // 🟢 NUEVO: Importamos el servicio

// Modelos
import { Venta, MetodoPago, EstadoVenta } from '../../models/venta';
import { CompraResponse } from '../../models/compra';
import { MovimientoCajaResponse } from '../../models/movimiento-caja'; // 🟢 NUEVO: Importamos el modelo

// Componente Modal
import { NuevoMovimientoModalComponent } from './nuevo-movimiento-modal/nuevo-movimiento-modal'; // 🟢 NUEVO: Ajusta la ruta si es necesario

// Interfaz local para unificar Ventas, Compras y Ajustes en la vista
export interface MovimientoCaja {
  fecha: Date;
  tipo: 'INGRESO' | 'EGRESO';
  descripcion: string;
  referencia: string; // Código de boleta/factura o 'Ajuste Manual'
  monto: number;
  entidad: string; // Nombre del Cliente, Proveedor o Responsable
  metodoPago?: string; 
  esAjuste?: boolean; // 🟢 NUEVO: Para pintar diferente los manuales
}

@Component({
  selector: 'app-caja-chica',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, 
    MatIconModule, MatCardModule, MatProgressBarModule,
    MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule,
    MatTooltipModule, NuevoMovimientoModalComponent // 🟢 NUEVO: Agregado a los imports
  ],
  templateUrl: './caja-chica.html',
  styleUrls: ['./caja-chica.css']
})
export class CajaChicaComponent implements OnInit {

  movimientos: MovimientoCaja[] = [];
  dataSource = new MatTableDataSource<MovimientoCaja>([]);
  
  totalIngresosEfectivo: number = 0;
  totalEgresosEfectivo: number = 0;
  saldoEnCaja: number = 0;

  cargando: boolean = true;
  filtroFecha: Date | null = null; 

  // 🟢 NUEVO: Variables para el modal
  mostrarModalAjuste: boolean = false;

  displayedColumns: string[] = ['fecha', 'tipo', 'descripcion', 'entidad', 'monto'];

  constructor(
    private ventaService: VentaService,
    private compraService: CompraService,
    private movimientoManualService: MovimientoCajaService, // 🟢 NUEVO: Inyectado
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarFlujoCaja();
  }

  cargarFlujoCaja(): void {
    this.cargando = true;

    // 🟢 NUEVO: Agregamos las llamadas a los movimientos manuales al forkJoin
    forkJoin({
      ventas: this.ventaService.listarTodas(),
      compras: this.compraService.listarTodas(),
      ajustes: this.movimientoManualService.listar() // Llamamos a tu nuevo endpoint
    }).subscribe({
      next: (response) => {
        const { ventas, compras, ajustes } = response;
        
        const ingresos: MovimientoCaja[] = [];
        const egresos: MovimientoCaja[] = []; 

        // 1. Procesar INGRESOS (Ventas)
        ventas.forEach((v: Venta) => {
          if (v.estado !== EstadoVenta.CANCELADA && v.pagos && v.pagos.length > 0) {
            v.pagos.forEach(pago => {
              const metodoStr = String(pago.metodoPago).toUpperCase();

              if (metodoStr === 'EFECTIVO') {
                ingresos.push({
                  fecha: new Date(pago.fechaPago || v.fechaVenta),
                  tipo: 'INGRESO',
                  descripcion: `Cobro Venta #${v.codigo}`,
                  referencia: v.codigo,
                  monto: pago.monto,
                  entidad: v.nombreCliente || 'Cliente General',
                  metodoPago: 'EFECTIVO',
                  esAjuste: false
                });
              }
            });
          }
        });

        // 2. Procesar EGRESOS (Compras)
        compras.forEach((c: CompraResponse) => {
          if (c.estado !== 'ANULADA' && c.pagos && c.pagos.length > 0) {
            c.pagos.forEach(pago => {
              const metodoStr = String(pago.metodoPago).toUpperCase();

              if (metodoStr === 'EFECTIVO') {
                egresos.push({
                  fecha: new Date(pago.fechaPago || c.fechaEmision),
                  tipo: 'EGRESO',
                  descripcion: c.tipoCompra === 'BIEN' ? 'Compra de Mercadería' : 'Gasto / Servicio',
                  referencia: `${c.serie}-${c.numero}`,
                  monto: pago.monto, 
                  entidad: c.nombreProveedor || 'Proveedor General',
                  metodoPago: 'EFECTIVO',
                  esAjuste: false
                });
              }
            });
          }
        });

        // 🟢 NUEVO: 3. Procesar AJUSTES MANUALES (Los que creas desde el botón)
        ajustes.forEach((a: MovimientoCajaResponse) => {
          const ajusteMapeado: MovimientoCaja = {
            fecha: new Date(a.fechaHora),
            tipo: a.tipo,
            descripcion: a.motivo, // Lo que escribes en el modal
            referencia: 'Ajuste Manual',
            monto: a.monto,
            entidad: a.responsable, // Quien sacó o metió la plata
            metodoPago: 'EFECTIVO',
            esAjuste: true // Le ponemos true para pintarlo distinto si quieres
          };

          if (a.tipo === 'INGRESO') ingresos.push(ajusteMapeado);
          if (a.tipo === 'EGRESO') egresos.push(ajusteMapeado);
        });

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

  // 🟢 NUEVO: Funciones para manejar el Modal
  abrirModalAjuste(): void {
    this.mostrarModalAjuste = true;
  }

  onAjusteCreado(): void {
    this.mostrarModalAjuste = false;
    this.cargarFlujoCaja(); // Recargamos toda la info para que aparezca el nuevo ajuste en la tabla y sume/reste
  }
}