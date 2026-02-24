import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

// ✅ IMPORTAMOS TU SERVICIO Y MODELO REAL
import { ClienteService } from '../../../services/cliente-service'; 
import { Cliente } from '../../../models/cliente'; 

@Component({
  selector: 'app-crm-cliente-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './crm-cliente-list.html',
  styleUrls: ['./crm-cliente-list.css']
})
export class CrmClienteListComponent implements OnInit {

  // ✅ Ahora usamos tu modelo Cliente real
  clientesCrm: Cliente[] = [];

  displayedColumns: string[] = ['documento', 'nombre', 'contacto', 'estado', 'acciones'];

  // ✅ Inyectamos el servicio en el constructor
  constructor(private clienteService: ClienteService) { }

  ngOnInit(): void {
    this.cargarClientesReales();
  }

  cargarClientesReales(): void {
    this.clienteService.listarClientes().subscribe({
      next: (data) => {
        this.clientesCrm = data; // Llenamos la tabla con los datos de Spring Boot
      },
      error: (err) => {
        console.error('Error al cargar clientes desde el backend:', err);
      }
    });
  }

}