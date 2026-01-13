import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';

import { ClienteService } from '../../services/cliente-service';
import { Cliente } from '../../models/cliente';
import { ClienteModalComponent } from './cliente-modal/cliente-modal';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule
  ],
  templateUrl: './cliente.html',
  styleUrls: ['./cliente.css']
})
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  clientesFiltrados = new MatTableDataSource<Cliente>([]);
  terminoBusqueda: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  
  displayedColumns: string[] = [
    'tipoCliente',
    'nombreCompleto',
    'documento',
    'contacto',
    'direccion',
    'acciones'
  ];

  constructor(
    private clienteService: ClienteService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.clienteService.listarClientesActivos().subscribe({
      next: (data) => {
        console.log('✅ Clientes cargados:', data);
        this.clientes = data;
        this.clientesFiltrados.data = data;
        this.isLoading = false;
        this.cdr.detectChanges(); // ⭐ FORZAR ACTUALIZACIÓN
      },
      error: (error) => {
        console.error('❌ Error al cargar clientes:', error);
        this.errorMessage = 'Error al cargar los clientes';
        this.isLoading = false;
        this.mostrarMensaje('Error al cargar clientes', 'error');
        this.cdr.detectChanges(); // ⭐ FORZAR ACTUALIZACIÓN
      }
    });
  }

  abrirModalNuevoCliente(): void {
    const dialogRef = this.dialog.open(ClienteModalComponent, {
      width: '900px',
      maxWidth: '95vw',
      height: 'auto',
      maxHeight: '95vh',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.mostrarMensaje('✅ Cliente registrado exitosamente', 'success');
        // ⭐ RECARGAR DESPUÉS DE CERRAR EL MODAL
        setTimeout(() => {
          this.cargarClientes();
        }, 300);
      }
    });
  }

  buscarClientes(): void {
    if (!this.terminoBusqueda.trim()) {
      this.clientesFiltrados.data = this.clientes;
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase();
    this.clientesFiltrados.data = this.clientes.filter(cliente => 
      cliente.nombreCompleto.toLowerCase().includes(termino) ||
      (cliente.numeroDocumento && cliente.numeroDocumento.toLowerCase().includes(termino)) ||
      (cliente.email && cliente.email.toLowerCase().includes(termino))
    );
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.clientesFiltrados.data = this.clientes;
  }

  getTipoClienteClass(tipo: string): string {
    return tipo === 'PERSONA' ? 'tipo-persona' : 'tipo-empresa';
  }

  verDetalle(cliente: Cliente): void {
    console.log('Ver detalle:', cliente);
    this.mostrarMensaje('Función en desarrollo', 'error');
  }

  editarCliente(cliente: Cliente): void {
    const dialogRef = this.dialog.open(ClienteModalComponent, {
      width: '900px',
      maxWidth: '95vw',
      height: 'auto',
      maxHeight: '95vh',
      disableClose: false,
      data: { cliente }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.mostrarMensaje('✅ Cliente actualizado exitosamente', 'success');
        // ⭐ RECARGAR DESPUÉS DE CERRAR EL MODAL
        setTimeout(() => {
          this.cargarClientes();
        }, 300);
      }
    });
  }

  eliminarCliente(cliente: Cliente): void {
    if (confirm(`¿Estás seguro de que deseas eliminar al cliente "${cliente.nombreCompleto}"?`)) {
      this.ejecutarEliminacion(cliente);
    }
  }

  private ejecutarEliminacion(cliente: Cliente): void {
    this.clienteService.eliminarCliente(cliente.id).subscribe({
      next: () => {
        this.mostrarMensaje('✅ Cliente eliminado exitosamente', 'success');
        this.cargarClientes(); // ⭐ RECARGAR LISTA COMPLETA
      },
      error: (error) => {
        console.error('❌ Error al eliminar cliente:', error);
        this.mostrarMensaje('❌ Error al eliminar el cliente', 'error');
      }
    });
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: tipo === 'success' ? 'snackbar-success' : 'snackbar-error',
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  exportarDatos(): void {
    console.log('Exportar datos');
    this.mostrarMensaje('Función en desarrollo', 'error');
  }

  abrirFiltros(): void {
    console.log('Abrir filtros');
    this.mostrarMensaje('Función en desarrollo', 'error');
  }

  // ⭐⭐⭐ GETTERS CORRECTOS PARA EL REPORTE ⭐⭐⭐
  get totalClientes(): number {
    return this.clientesFiltrados.data.length;
  }

  get totalPersonas(): number {
    return this.clientesFiltrados.data.filter(c => c.tipoCliente === 'PERSONA').length;
  }

  get totalEmpresas(): number {
    return this.clientesFiltrados.data.filter(c => c.tipoCliente === 'EMPRESA').length;
  }
}