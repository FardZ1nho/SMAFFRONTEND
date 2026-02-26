import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MovimientoCajaService } from '../../../services/movimiento-caja-service';
import { MovimientoCajaRequest } from '../../../models/movimiento-caja'; 

@Component({
  selector: 'app-nuevo-movimiento-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './nuevo-movimiento-modal.html',
  styleUrls: ['./nuevo-movimiento-modal.css']
})
export class NuevoMovimientoModalComponent implements OnInit {

  @Output() cerrarModal = new EventEmitter<void>();
  @Output() movimientoCreado = new EventEmitter<void>();

  movimientoForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private movimientoService: MovimientoCajaService
  ) {}

  ngOnInit(): void {
    // Inicializamos el formulario. Por defecto lo ponemos en EGRESO que es lo más común (sacar plata)
    this.movimientoForm = this.fb.group({
      tipo: ['EGRESO', Validators.required],
      monto: [null, [Validators.required, Validators.min(0.1)]],
      motivo: ['', Validators.required],
      responsable: ['', Validators.required],
      fechaHora: ['', Validators.required]
    });
  }

  guardar(): void {
    if (this.movimientoForm.invalid) {
      return;
    }

    const request: MovimientoCajaRequest = this.movimientoForm.value;

    this.movimientoService.registrar(request).subscribe({
      next: (response) => {
        console.log('Movimiento guardado:', response);
        this.movimientoCreado.emit(); // Avisamos a la tabla de Caja Chica que recargue
      },
      error: (err) => {
        console.error('Error al guardar movimiento:', err);
      }
    });
  }
}