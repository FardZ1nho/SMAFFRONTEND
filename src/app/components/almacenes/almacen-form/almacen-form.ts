// src/app/components/almacenes/almacen-form/almacen-form.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlmacenService } from '../../../services/almacen-service';
import { Almacen, AlmacenRequest } from '../../../models/almacen';

@Component({
  selector: 'app-almacen-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './almacen-form.html',
  styleUrls: ['./almacen-form.css']
})
export class AlmacenForm implements OnInit {

  // Modo del formulario
  modoEdicion: boolean = false;
  almacenId: number | null = null;

  // Campos del formulario
  codigo: string = '';
  nombre: string = '';
  direccion: string = '';
  activo: boolean = true;

  // Estados
  cargando: boolean = false;
  guardando: boolean = false;
  errorMensaje: string = '';

  constructor(
    private almacenService: AlmacenService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Verificar si es modo edición (si viene un ID en la ruta)
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.almacenId = parseInt(id);
      this.modoEdicion = true;
      this.cargarAlmacen();
    }
  }

  cargarAlmacen(): void {
    if (!this.almacenId) return;

    this.cargando = true;
    this.almacenService.obtenerAlmacenPorId(this.almacenId).subscribe({
      next: (almacen) => {
        this.codigo = almacen.codigo;
        this.nombre = almacen.nombre;
        this.direccion = almacen.direccion || '';
        this.activo = almacen.activo;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar almacén:', err);
        this.errorMensaje = 'Error al cargar el almacén';
        this.cargando = false;
      }
    });
  }

  validarFormulario(): boolean {
    this.errorMensaje = '';

    if (!this.codigo.trim()) {
      this.errorMensaje = 'El código es obligatorio';
      return false;
    }

    if (!this.nombre.trim()) {
      this.errorMensaje = 'El nombre es obligatorio';
      return false;
    }

    return true;
  }

  guardar(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.guardando = true;
    this.errorMensaje = '';

    const request: AlmacenRequest = {
      codigo: this.codigo.trim(),
      nombre: this.nombre.trim(),
      direccion: this.direccion.trim() || undefined,
      activo: this.activo
    };

    const operacion = this.modoEdicion && this.almacenId
      ? this.almacenService.actualizarAlmacen(this.almacenId, request)
      : this.almacenService.crearAlmacen(request);

    operacion.subscribe({
      next: () => {
        this.guardando = false;
        // Redirigir a la lista de almacenes
        this.router.navigate(['/almacenes']);
      },
      error: (error) => {
        console.error('Error al guardar almacén:', error);
        this.guardando = false;
        
        if (error.status === 400) {
          this.errorMensaje = error.error?.message || 'Datos inválidos';
        } else if (error.status === 409) {
          this.errorMensaje = 'Ya existe un almacén con ese código';
        } else {
          this.errorMensaje = 'Error al guardar el almacén';
        }
      }
    });
  }

  cancelar(): void {
    // Volver a la lista de almacenes
    this.router.navigate(['/almacenes']);
  }

  limpiarError(): void {
    this.errorMensaje = '';
  }
}