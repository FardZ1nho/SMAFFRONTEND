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
  filtroTexto: string = '';
  cargando: boolean = true;
  
  tabActual: 'ACTIVAS' | 'ANULADAS' = 'ACTIVAS';
  
  // ✅ NUEVO: Variable para el año actual
  anioActual: number = new Date().getFullYear();

  totales = {
    activas: 0,
    anuladas: 0,
    cantidadActivas: 0,
    anual: 0 // ✅ NUEVO: Guardará el total del año en curso
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
    console.log('🔄 Iniciando carga de compras...'); 

    this.compraService.listarTodas().subscribe({
      next: (data) => {
        if (!data || data.length === 0) {
            console.warn('⚠️ El backend devolvió una lista vacía.');
        }

        const dataLimpia = data.filter(item => item && item.id !== null);
        
        this.compras = dataLimpia.sort((a, b) => b.id - a.id);
        this.calcularTotales(); 
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

  // ✅ NUEVO: Lógica actualizada para incluir el cálculo anual
  calcularTotales() {
    let act = 0;
    let anu = 0;
    let cant = 0;
    let anual = 0;

    this.compras.forEach(c => {
      const factorCambio = c.moneda === 'USD' ? ((c as any).tipoCambio || 3.80) : 1;
      const monto = (c.total || 0) * factorCambio;

      if (c.estado === 'ANULADA') {
        anu += monto;
      } else {
        act += monto;
        cant++;

        // Calculamos el total anual (asegurando que sea del año actual y no esté anulada)
        if (c.fechaEmision) {
          const fechaCompra = new Date(c.fechaEmision);
          if (fechaCompra.getFullYear() === this.anioActual) {
            anual += monto;
          }
        }
      }
    });

    this.totales = { activas: act, anuladas: anu, cantidadActivas: cant, anual: anual };
  }

  cambiarTab(tab: 'ACTIVAS' | 'ANULADAS') {
    this.tabActual = tab;
    this.filtrar();
  }

  filtrar() {
    let baseFiltro = this.compras.filter(c => {
      if (this.tabActual === 'ACTIVAS') {
        return c.estado !== 'ANULADA'; 
      } else {
        return c.estado === 'ANULADA'; 
      }
    });

    if (!this.filtroTexto.trim()) {
      this.comprasFiltradas = baseFiltro;
      return;
    }

    const texto = this.filtroTexto.toLowerCase();
    this.comprasFiltradas = baseFiltro.filter(c => 
      (c.nombreProveedor && c.nombreProveedor.toLowerCase().includes(texto)) ||
      (c.serie && c.serie.toLowerCase().includes(texto)) ||
      (c.numero && c.numero.toLowerCase().includes(texto)) ||
      (c.rucProveedor && c.rucProveedor.includes(texto))
    );
  }

  limpiarFiltro() {
    this.filtroTexto = '';
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