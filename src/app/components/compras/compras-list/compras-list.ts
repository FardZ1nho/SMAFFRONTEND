import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // 1. IMPORTAR ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompraService } from '../../../services/compra-service'; 
import { CompraResponse } from '../../../models/compra';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";

@Component({
  selector: 'app-compras-list',
  standalone: true,
  // Asegúrate de importar estos módulos para que la tabla y botones funcionen
  imports: [CommonModule, FormsModule, MatTableModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './compras-list.html',
  styleUrls: ['./compras-list.css']
})
export class ComprasListComponent implements OnInit {

  compras: CompraResponse[] = [];
  comprasFiltradas: CompraResponse[] = [];
  
  terminoBusqueda: string = '';
  cargando: boolean = false;

  constructor(
    private compraService: CompraService,
    private router: Router,
    private cd: ChangeDetectorRef // 2. INYECTARLO AQUÍ
  ) { }

  ngOnInit(): void {
    this.cargarCompras();
  }

  cargarCompras(): void {
    this.cargando = true;
    this.compraService.listarTodas().subscribe({
      next: (data) => {
        console.log('Datos recibidos:', data);
        this.compras = data;
        this.comprasFiltradas = data;
        this.cargando = false;
        
        // 3. LA SOLUCIÓN AL BUG DE CARGA
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar compras', err);
        this.cargando = false;
      }
    });
  }

  filtrar(): void {
    const termino = this.terminoBusqueda.toLowerCase();
    this.comprasFiltradas = this.compras.filter(c => 
      c.numero.toLowerCase().includes(termino) || 
      c.nombreProveedor.toLowerCase().includes(termino) ||
      c.serie.toLowerCase().includes(termino)
    );
  }

  // --- ACCIONES ---

  irANuevaCompra(): void {
    this.router.navigate(['/compras/nueva']);
  }

  verDetalle(id: number): void {
    // Navega al componente de detalle que crearemos abajo
    this.router.navigate(['/compras/detalle', id]);
  }

  editarCompra(id: number): void {
      // Opcional: Implementar si tu lógica de negocio permite editar facturas
      alert('La edición de facturas cerradas requiere permisos de administrador.');
  }

  eliminarCompra(id: number): void {
    if(confirm('¿Está seguro de anular esta compra? El stock será revertido.')) {
        // Aquí llamarías a tu servicio de anular
        console.log('Anulando compra', id);
        // this.compraService.anular(id)... 
    }
  }
}