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
        console.log('✅ DATOS RECIBIDOS DEL BACKEND:', data); 

        if (!data || data.length === 0) {
            console.warn('⚠️ El backend devolvió una lista vacía.');
        }

        // Filtro de seguridad para datos nulos
        const dataLimpia = data.filter(item => item && item.id !== null);
        
        this.compras = dataLimpia.sort((a, b) => b.id - a.id);
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

  filtrar() {
    if (!this.filtroTexto.trim()) {
      this.comprasFiltradas = this.compras;
      return;
    }

    const texto = this.filtroTexto.toLowerCase();
    this.comprasFiltradas = this.compras.filter(c => 
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

  // ✅ ESTA ES LA FUNCIÓN QUE TE FALTABA
  editarCompra(id: number | null | undefined) {
    if (!id) return;
    // Navega a la ruta de edición pasando el ID
    this.router.navigate(['/compras/editar', id]); 
  }

  nuevaCompra() {
    this.router.navigate(['/compras/nueva']);
  }

  anularCompra(id: number) {
    if (confirm('¿Está seguro de anular esta compra? Esto revertirá el stock.')) {
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