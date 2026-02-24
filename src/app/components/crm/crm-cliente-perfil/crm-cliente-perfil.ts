import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// IMPORTAMOS SERVICIOS Y MODELOS
import { ClienteService } from '../../../services/cliente-service';
import { Cliente } from '../../../models/cliente';
import { CotizacionService } from '../../../services/cotizacion-service';
import { CotizacionResponse } from '../../../models/cotizacion';
import { VentaService } from '../../../services/venta-service'; // ✅ NUEVO
import { Venta } from '../../../models/venta'; // ✅ NUEVO

@Component({
  selector: 'app-crm-cliente-perfil',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatIconModule, 
    MatButtonModule, 
    MatChipsModule, 
    MatTabsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './crm-cliente-perfil.html',
  styleUrls: ['./crm-cliente-perfil.css']
})
export class CrmClientePerfilComponent implements OnInit {

  cliente: Cliente | null = null;
  isLoading: boolean = true;
  isLoadingCotizaciones: boolean = true;
  isLoadingVentas: boolean = true; // ✅ NUEVO ESTADO DE CARGA

  historialCotizaciones: CotizacionResponse[] = [];
  historialVentas: Venta[] = []; // ✅ AHORA USA TU MODELO REAL

  constructor(
    private route: ActivatedRoute,
    private clienteService: ClienteService,
    private cotizacionService: CotizacionService,
    private ventaService: VentaService, // ✅ INYECTAMOS EL SERVICIO
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.cargarDatosDelCliente(id);
    }
  }

  cargarDatosDelCliente(id: number): void {
    this.isLoading = true;
    this.clienteService.obtenerCliente(id).subscribe({
      next: (data) => {
        this.cliente = data;
        this.isLoading = false;
        
        // Disparamos ambas búsquedas en paralelo
        this.cargarCotizaciones(id);
        this.cargarVentas(id); // ✅ NUEVA LLAMADA
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar el cliente:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarCotizaciones(idCliente: number): void {
    this.isLoadingCotizaciones = true;
    this.cotizacionService.listar().subscribe({
      next: (data) => {
        this.historialCotizaciones = data.filter(cot => cot.cliente.id === idCliente);
        this.isLoadingCotizaciones = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar cotizaciones:', err);
        this.isLoadingCotizaciones = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ✅ NUEVO: CARGAR LAS VENTAS REALES DEL CLIENTE
  cargarVentas(idCliente: number): void {
    this.isLoadingVentas = true;
    this.ventaService.listarTodas().subscribe({
      next: (data) => {
        // Filtramos para obtener solo las ventas de este cliente
        this.historialVentas = data.filter(venta => venta.clienteId === idCliente);
        this.isLoadingVentas = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar ventas:', err);
        this.isLoadingVentas = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirWhatsApp() {
    if (this.cliente && this.cliente.telefono) {
      const url = `https://wa.me/51${this.cliente.telefono}`;
      window.open(url, '_blank');
    } else {
      alert('Este cliente no tiene un teléfono registrado.');
    }
  }
}