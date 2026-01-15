import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // Agregamos ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router'; // Importante: ActivatedRoute
import { Proveedor } from '../../../models/proveedor';
import { ProveedorService } from '../../../services/proveedor-service';
import { MatIconModule } from '@angular/material/icon'; // Para los iconos

@Component({
  selector: 'app-proveedor-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './proveedor-form.html',
  styleUrls: ['./proveedor-form.css']
})
export class ProveedorFormComponent implements OnInit {

  // Objeto inicial vacío
  proveedor: Proveedor = {
    nombre: '',
    ruc: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    activo: true
  };

  esEdicion: boolean = false;
  titulo: string = 'Registrar Nuevo Proveedor';
  btnTexto: string = 'Guardar Proveedor';

  constructor(
    private proveedorService: ProveedorService,
    private router: Router,
    private activatedRoute: ActivatedRoute, // Para leer la URL
    private cd: ChangeDetectorRef // Para forzar actualización visual
  ) {}

  ngOnInit(): void {
    // Escuchamos la URL para ver si hay un ID (ej: /editar/5)
    this.activatedRoute.params.subscribe(params => {
      const id = params['id'];
      
      if (id) {
        console.log('🔄 Modo Edición detectado. ID:', id);
        this.esEdicion = true;
        this.titulo = 'Editar Información del Proveedor';
        this.btnTexto = 'Actualizar Datos';
        
        // Llamamos al backend para traer los datos
        this.cargarProveedor(id);
      } else {
        console.log('✨ Modo Creación (Nuevo)');
      }
    });
  }

  cargarProveedor(id: number): void {
    this.proveedorService.obtenerPorId(id).subscribe({
      next: (data) => {
        console.log('✅ Datos recibidos del Backend:', data);
        this.proveedor = data; // Asignamos los datos al formulario
        this.cd.detectChanges(); // Forzamos que se vean en pantalla
      },
      error: (e) => {
        console.error('❌ Error al cargar:', e);
        alert('No se pudo cargar la información del proveedor.');
        this.router.navigate(['/proveedores']);
      }
    });
  }

  guardar(): void {
    if (!this.proveedor.nombre || !this.proveedor.ruc) {
        alert('⚠️ Por favor complete la Razón Social y el RUC.');
        return;
    }

    if (this.esEdicion) {
      this.actualizar();
    } else {
      this.crear();
    }
  }

  crear(): void {
    this.proveedorService.crear(this.proveedor).subscribe({
      next: () => {
        alert('✅ Proveedor registrado correctamente');
        this.router.navigate(['/proveedores']);
      },
      error: (e) => this.manejarError(e)
    });
  }

  actualizar(): void {
    // Aseguramos que el ID exista
    if (!this.proveedor.id) return;

    this.proveedorService.actualizar(this.proveedor.id, this.proveedor).subscribe({
      next: () => {
        alert('✅ Proveedor actualizado correctamente');
        this.router.navigate(['/proveedores']);
      },
      error: (e) => this.manejarError(e)
    });
  }

  cancelar(): void {
    this.router.navigate(['/proveedores']);
  }

  private manejarError(e: any): void {
    console.error('Error completo:', e);
    let mensaje = 'Error desconocido';
    
    if (e.error && e.error.message) {
      mensaje = e.error.message;
    } else if (e.message) {
      mensaje = e.message;
    }
    
    alert('⛔ ' + mensaje);
  }
}