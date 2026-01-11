// src/app/components/almacenes/almacen-modal/almacen-modal.component.ts

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlmacenService } from '../../../services/almacen-service';
import { Almacen, AlmacenRequest } from '../../../models/almacen';

@Component({
  selector: 'app-almacen-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './almacen-modal.html',
  styleUrls: ['./almacen-modal.css']
})
export class AlmacenModalComponent implements OnInit {
  @Input() almacen: Almacen | null = null;
  @Input() modoEdicion: boolean = false;
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<void>();

  // Formulario
  codigo: string = '';
  nombre: string = '';
  direccion: string = '';
  activo: boolean = true;

  guardando: boolean = false;
  errorMensaje: string = '';

  constructor(private almacenService: AlmacenService) {}

  ngOnInit(): void {
    if (this.modoEdicion && this.almacen) {
      this.codigo = this.almacen.codigo;
      this.nombre = this.almacen.nombre;
      this.direccion = this.almacen.direccion || '';
      this.activo = this.almacen.activo;
    }
  }

  guardar(): void {
    // Validaciones
    if (!this.codigo.trim()) {
      this.errorMensaje = 'El código es obligatorio';
      return;
    }

    if (!this.nombre.trim()) {
      this.errorMensaje = 'El nombre es obligatorio';
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

    const operacion = this.modoEdicion && this.almacen
      ? this.almacenService.actualizarAlmacen(this.almacen.id!, request)
      : this.almacenService.crearAlmacen(request);

    operacion.subscribe({
      next: () => {
        this.guardando = false;
        this.guardado.emit();
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
    this.cerrar.emit();
  }

  limpiarError(): void {
    this.errorMensaje = '';
  }
}