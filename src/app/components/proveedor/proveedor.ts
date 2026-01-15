import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; 
import { Proveedor } from '../../models/proveedor';
import { ProveedorService } from '../../services/proveedor-service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './proveedor.html',
  styleUrls: ['./proveedor.css']
})
export class ProveedorComponent implements OnInit {

  proveedores: Proveedor[] = [];
  terminoBusqueda: string = ''; 
  mensaje: string = '';
  tipoAlerta: string = ''; 

  constructor(
    private proveedorService: ProveedorService,
    private router: Router,
    private cd: ChangeDetectorRef 
  ) { }

  ngOnInit(): void {
    this.listarProveedores();
  }

  // --- CARGA DE DATOS ---
  listarProveedores(): void {
    this.proveedorService.listar().subscribe({
      next: (data) => {
        this.proveedores = data;
        this.cd.detectChanges(); // Fuerza la actualización de la tabla
      },
      error: (e) => {
        console.error(e);
        this.mostrarAlerta('Error al cargar proveedores', 'danger');
      }
    });
  }

  // --- LÓGICA DE LOS BOTONES DE ACCIÓN ---

  // 1. Lógica para el botón "NUEVO"
  irANuevo(): void {
    this.router.navigate(['/proveedores/nuevo']);
  }

  // 2. Lógica para el botón "EDITAR" (El lápiz)
  irAEditar(id: number): void {
    if (id) {
      // Esto navega a la ruta que configuramos: providers/editar/5
      this.router.navigate(['/proveedores/editar', id]);
    }
  }

  // 3. Lógica para el botón "ELIMINAR" (La basura)
  eliminar(id: number): void {
    // Confirmación simple (puedes cambiarlo por SweetAlert si prefieres)
    if (confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
      
      this.proveedorService.eliminar(id).subscribe({
        next: () => {
          // ÉXITO: Eliminamos el proveedor de la lista visualmente
          this.proveedores = this.proveedores.filter(p => p.id !== id);
          this.cd.detectChanges(); // Actualizamos la tabla
          this.mostrarAlerta('Proveedor eliminado correctamente', 'success');
        },
        error: (e) => {
          console.error(e);
          this.mostrarAlerta('No se pudo eliminar el proveedor', 'danger');
        }
      });
    }
  }

  // --- FILTROS Y BÚSQUEDA ---
  get proveedoresFiltrados(): Proveedor[] {
    if (!this.proveedores) return [];
    if (!this.terminoBusqueda) return this.proveedores;

    const termino = this.terminoBusqueda.toLowerCase().trim();

    return this.proveedores.filter(p => {
      const nombre = p.nombre ? p.nombre.toLowerCase() : '';
      const ruc = p.ruc ? p.ruc : '';
      const email = p.email ? p.email.toLowerCase() : '';
      const telefono = p.telefono ? p.telefono : '';

      return nombre.includes(termino) || 
             ruc.includes(termino) || 
             email.includes(termino) ||
             telefono.includes(termino);
    });
  }

  mostrarAlerta(msg: string, tipo: string): void {
    this.mensaje = msg;
    this.tipoAlerta = tipo;
    setTimeout(() => { this.mensaje = ''; }, 3000);
  }
}