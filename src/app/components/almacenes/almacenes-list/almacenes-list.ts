import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // ✅ Importado

import { AlmacenService } from '../../../services/almacen-service'; 
import { Almacen } from '../../../models/almacen';
import { AlmacenModalComponent } from '../almacen-modal/almacen-modal';
import { AlmacenDetalleModalComponent } from '../almacen-detalle-modal/almacen-detalle-modal'; // ✅ Importado

@Component({
  selector: 'app-almacenes-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AlmacenModalComponent, MatDialogModule],
  templateUrl: './almacenes-list.html',
  styleUrls: ['./almacenes-list.css']
})
export class AlmacenesListComponent implements OnInit {

  almacenes: Almacen[] = [];
  almacenesFiltrados: Almacen[] = [];
  cargando: boolean = true;
  error: string = '';
  
  mostrarModal: boolean = false;
  almacenSeleccionado: Almacen | null = null;
  modoEdicion: boolean = false;
  
  filtroTexto: string = '';
  filtroEstado: 'todos' | 'activos' | 'inactivos' = 'todos';

  constructor(
    private almacenService: AlmacenService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog // ✅ Inyectado
  ) { }

  ngOnInit(): void {
    this.cargarAlmacenes();
  }

  cargarAlmacenes(): void {
    this.cargando = true;
    this.error = '';
    
    this.almacenService.listarTodosLosAlmacenes().subscribe({
      next: (data) => {
        this.almacenes = data;
        this.aplicarFiltros();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar almacenes:', err);
        this.error = 'Error al cargar los almacenes';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  aplicarFiltros(): void {
    let resultado = [...this.almacenes];

    if (this.filtroTexto) {
      const textoLower = this.filtroTexto.toLowerCase();
      resultado = resultado.filter(a => 
        a.codigo.toLowerCase().includes(textoLower) ||
        a.nombre.toLowerCase().includes(textoLower) ||
        (a.direccion && a.direccion.toLowerCase().includes(textoLower))
      );
    }

    if (this.filtroEstado === 'activos') {
      resultado = resultado.filter(a => a.activo);
    } else if (this.filtroEstado === 'inactivos') {
      resultado = resultado.filter(a => !a.activo);
    }

    this.almacenesFiltrados = resultado;
  }

  onFiltroTextoChange(texto: string): void {
    this.filtroTexto = texto;
    this.aplicarFiltros();
  }

  onFiltroEstadoChange(estado: 'todos' | 'activos' | 'inactivos'): void {
    this.filtroEstado = estado;
    this.aplicarFiltros();
  }

  // ✅ NUEVA FUNCIÓN: Abrir Inventario
 verInventario(almacen: Almacen): void {
    this.dialog.open(AlmacenDetalleModalComponent, {
      width: '1100px', // 👈 AUMENTADO (Antes 800px)
      maxWidth: '95vw',
      height: '85vh', // Altura fija para que se vea imponente
      data: { almacen: almacen },
      autoFocus: false,
      panelClass: 'modal-soft-ui' // Opcional si tienes estilos globales
    });
  }

  abrirModalCrear(): void {
    this.almacenSeleccionado = null;
    this.modoEdicion = false;
    this.mostrarModal = true;
  }

  abrirModalEditar(almacen: Almacen): void {
    this.almacenSeleccionado = almacen;
    this.modoEdicion = true;
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.almacenSeleccionado = null;
    this.modoEdicion = false;
  }

  onAlmacenGuardado(): void {
    this.cerrarModal();
    this.cargarAlmacenes();
  }

  cambiarEstado(almacen: Almacen): void {
    const nuevoEstado = !almacen.activo;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    
    if (confirm(`¿Estás seguro de ${accion} el almacén "${almacen.nombre}"?`)) {
      this.almacenService.cambiarEstadoAlmacen(almacen.id!, nuevoEstado).subscribe({
        next: () => {
          almacen.activo = nuevoEstado;
          this.aplicarFiltros();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cambiar estado:', err);
          alert('Error al cambiar el estado del almacén');
        }
      });
    }
  }

  eliminarAlmacen(almacen: Almacen): void {
    if (confirm(`¿Estás seguro de eliminar el almacén "${almacen.nombre}"? Esta acción no se puede deshacer.`)) {
      this.almacenService.eliminarAlmacen(almacen.id!).subscribe({
        next: () => {
          this.cargarAlmacenes();
        },
        error: (err) => {
          console.error('Error al eliminar almacén:', err);
          alert('Error al eliminar el almacén. Puede que tenga productos asociados.');
        }
      });
    }
  }

  get totalAlmacenes(): number { return this.almacenes.length; }
  get almacenesActivos(): number { return this.almacenes.filter(a => a.activo).length; }
  get almacenesInactivos(): number { return this.almacenes.filter(a => !a.activo).length; }
}