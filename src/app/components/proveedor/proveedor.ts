import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'; // Para *ngIf, *ngFor
import { FormsModule } from '@angular/forms'; // Para [(ngModel)]
import { MatIconModule } from '@angular/material/icon'; // Para <mat-icon>
import { Proveedor } from '../../models/proveedor';
import { ProveedorService } from '../../services/proveedor-service';

// 1. IMPORTANTE: Importamos el componente hijo
// Asegúrate de que la ruta termine en '.component' si así se llama tu archivo
import { ProveedorFormComponent } from './proveedor-form/proveedor-form'; 
@Component({
  selector: 'app-proveedor',
  standalone: true,
  // 2. IMPORTANTE: El hijo debe estar en los imports para que funcione en el HTML
  imports: [
    CommonModule, 
    FormsModule, 
    MatIconModule, 
    ProveedorFormComponent 
  ],
  templateUrl: './proveedor.html',
  styleUrls: ['./proveedor.css']
})
export class ProveedorComponent implements OnInit {

  // Lista de datos
  proveedores: Proveedor[] = [];
  
  // Filtros
  terminoBusqueda: string = '';

  // Variables para controlar el MODAL FLOTANTE
  mostrarModal: boolean = false;
  idParaEditar: number | null = null; // null = Crear nuevo, número = Editar existente

  constructor(
    private proveedorService: ProveedorService,
    private cd: ChangeDetectorRef // Inyectamos el detector de cambios
  ) { }

  ngOnInit(): void {
    this.listarProveedores();
  }

  // --- LÓGICA DE CARGA DE DATOS (FIX: Actualización automática) ---
  listarProveedores(): void {
    this.proveedorService.listar().subscribe({
      next: (data) => {
        console.log('✅ Datos recibidos:', data);
        this.proveedores = data;
        
        // ESTO ARREGLA QUE NO SALGAN HASTA DAR CLIC
        this.cd.detectChanges(); 
      },
      error: (e) => {
        console.error('Error al cargar proveedores:', e);
      }
    });
  }

  // --- LÓGICA DEL MODAL (ABRIR Y CERRAR) ---

  // Se llama desde el botón "Nuevo" (sin ID) o el botón "Editar" (con ID)
  abrirModal(id: number | null = null): void {
    this.idParaEditar = id;
    this.mostrarModal = true;
  }

  // Se llama cuando el hijo emite el evento (onCerrar)
  cerrarModal(seGuardoCambios: boolean): void {
    this.mostrarModal = false; // Oculta el modal
    this.idParaEditar = null;  // Resetea el ID
    
    // Si el formulario nos dice "true" (se guardó algo), recargamos la lista
    if (seGuardoCambios) {
      this.listarProveedores();
    }
  }

  // --- OTRAS ACCIONES ---

  eliminar(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
      this.proveedorService.eliminar(id).subscribe({
        next: () => {
          this.listarProveedores(); // Recargamos la lista tras eliminar
        },
        error: (e) => console.error('Error al eliminar:', e)
      });
    }
  }

  // --- FILTRO DE BÚSQUEDA ---
  get proveedoresFiltrados(): Proveedor[] {
    if (!this.terminoBusqueda) return this.proveedores;
    
    const termino = this.terminoBusqueda.toLowerCase().trim();
    
    return this.proveedores.filter(p => {
      const nombre = p.nombre ? p.nombre.toLowerCase() : '';
      const ruc = p.ruc ? p.ruc.toLowerCase() : '';
      const pais = p.pais ? p.pais.toLowerCase() : ''; // Agregado: búsqueda por país
      
      return nombre.includes(termino) || ruc.includes(termino) || pais.includes(termino);
    });
  }
}