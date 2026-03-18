import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// MATERIAL
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

// SERVICIOS Y MODELOS
import { CompraService } from '../../../services/compra-service';
import { CompraResponse } from '../../../models/compra';

@Component({
  selector: 'app-compras-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './compras-list.html',
  styleUrls: ['./compras-list.css']
})
export class ComprasListComponent implements OnInit {

  compras: CompraResponse[] = [];
  comprasFiltradas: CompraResponse[] = [];
  cargando: boolean = true;
  
  // TABS Y BÚSQUEDA RÁPIDA
  tabActual: 'ACTIVAS' | 'ANULADAS' = 'ACTIVAS';
  filtroTexto: string = '';

  // ✅ NUEVO: VARIABLES PARA FILTROS AVANZADOS
  mostrarFiltrosAvanzados: boolean = false;
  filtroMes: string = ''; // Formato: 'YYYY-MM'
  filtroTipo: string = 'TODOS';
  filtroMoneda: string = 'TODAS';
  tiposComprobanteDisponibles: string[] = [];
  
  anioActual: number = new Date().getFullYear();

  totales = {
    activas: 0,
    anuladas: 0,
    cantidadActivas: 0,
    anual: 0,
    filtroMonto: 0 // ✅ NUEVO: Total del dinero que se muestra en la tabla actual
  };

  constructor(
    private compraService: CompraService,
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.cargarCompras();
  }

  cargarCompras() {
    this.cargando = true;
    
    this.compraService.listarTodas().subscribe({
      next: (data) => {
        if (!data || data.length === 0) {
            console.warn('⚠️ El backend devolvió una lista vacía.');
        }

        const dataLimpia = data.filter(item => item && item.id !== null);
        this.compras = dataLimpia.sort((a, b) => b.id - a.id);
        
        // Extraemos los tipos de comprobantes únicos que existen en la BD
        this.extraerTiposComprobantes();
        
        this.calcularTotalesHistoricos(); 
        this.filtrar(); 
        
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ ERROR CRÍTICO al cargar compras:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ✅ Extrae dinámicamente qué tipos de comprobante tienes (Factura, Boleta, etc.)
  extraerTiposComprobantes() {
    const tipos = this.compras.map(c => c.tipoComprobante).filter(t => !!t) as string[];
    this.tiposComprobanteDisponibles = [...new Set(tipos)];
  }

  calcularTotalesHistoricos() {
    let act = 0; let anu = 0; let cant = 0; let anual = 0;

    this.compras.forEach(c => {
      const factorCambio = c.moneda === 'USD' ? ((c as any).tipoCambio || 3.80) : 1;
      const monto = (c.total || 0) * factorCambio;

      if (c.estado === 'ANULADA') {
        anu += monto;
      } else {
        act += monto;
        cant++;
        if (c.fechaEmision) {
          const fechaCompra = new Date(c.fechaEmision);
          if (fechaCompra.getFullYear() === this.anioActual) {
            anual += monto;
          }
        }
      }
    });

    this.totales.activas = act;
    this.totales.anuladas = anu;
    this.totales.cantidadActivas = cant;
    this.totales.anual = anual;
  }

  cambiarTab(tab: 'ACTIVAS' | 'ANULADAS') {
    this.tabActual = tab;
    this.filtrar();
  }

  toggleFiltrosAvanzados() {
    this.mostrarFiltrosAvanzados = !this.mostrarFiltrosAvanzados;
  }

  // ✅ NUEVO: Función de filtrado súper vitaminada
  filtrar() {
    let baseFiltro = this.compras.filter(c => {
      // 1. Filtro por Pestaña (Estado)
      if (this.tabActual === 'ACTIVAS' && c.estado === 'ANULADA') return false;
      if (this.tabActual === 'ANULADAS' && c.estado !== 'ANULADA') return false;

      // 2. Filtro Avanzado: Tipo Comprobante
      if (this.filtroTipo !== 'TODOS' && c.tipoComprobante !== this.filtroTipo) return false;

      // 3. Filtro Avanzado: Moneda
      if (this.filtroMoneda !== 'TODAS' && c.moneda !== this.filtroMoneda) return false;

      // 4. Filtro Avanzado: Mes
      if (this.filtroMes && c.fechaEmision) {
        // Formateamos la fecha de la compra a "YYYY-MM" para compararlo con el input type="month"
        const fechaObj = new Date(c.fechaEmision);
        const mesCompra = `${fechaObj.getFullYear()}-${(fechaObj.getMonth() + 1).toString().padStart(2, '0')}`;
        if (mesCompra !== this.filtroMes) return false;
      }

      return true;
    });

    // 5. Filtro de Búsqueda de Texto
    if (this.filtroTexto.trim()) {
      const texto = this.filtroTexto.toLowerCase();
      baseFiltro = baseFiltro.filter(c => 
        (c.nombreProveedor && c.nombreProveedor.toLowerCase().includes(texto)) ||
        (c.serie && c.serie.toLowerCase().includes(texto)) ||
        (c.numero && c.numero.toLowerCase().includes(texto)) ||
        (c.rucProveedor && c.rucProveedor.includes(texto))
      );
    }

    this.comprasFiltradas = baseFiltro;
    this.calcularTotalesDinamicos();
  }

  // ✅ NUEVO: Calcula el dinero solo de lo que estás viendo en la tabla
  calcularTotalesDinamicos() {
    let montoFiltro = 0;
    this.comprasFiltradas.forEach(c => {
      if (c.estado !== 'ANULADA') {
        const factorCambio = c.moneda === 'USD' ? ((c as any).tipoCambio || 3.80) : 1;
        montoFiltro += (c.total || 0) * factorCambio;
      }
    });
    this.totales.filtroMonto = montoFiltro;
  }

  limpiarFiltro() {
    this.filtroTexto = '';
    this.filtroMes = '';
    this.filtroTipo = 'TODOS';
    this.filtroMoneda = 'TODAS';
    this.filtrar();
  }

  formatearTipo(tipo: string | null | undefined): string {
    if (!tipo) return 'ND'; 
    return tipo.replace(/_/g, ' ');
  }

  verDetalle(id: number | null | undefined) {
    if (!id) return;
    this.router.navigate(['/compras/detalle', id]);
  }

  editarCompra(id: number | null | undefined) {
    if (!id) return;
    this.router.navigate(['/compras/editar', id]); 
  }

  nuevaCompra() {
    this.router.navigate(['/compras/nueva']);
  }

  anularCompra(id: number) {
    if (confirm('¿Está seguro de anular esta compra? Esto revertirá el stock y pasará al historial de Anuladas.')) {
      this.compraService.anular(id).subscribe({
        next: () => {
          this.cargarCompras(); 
        },
        error: (e) => alert('Error al anular: ' + e.message)
      });
    }
  }
  
  getMonedaSymbol(moneda: string): string {
    return moneda === 'USD' ? '$' : 'S/';
  }
}