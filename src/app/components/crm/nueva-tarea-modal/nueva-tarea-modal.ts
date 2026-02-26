import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- Necesario para ngFor y ngIf
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // <-- Agregamos ReactiveFormsModule aquí
import { TareaCrmService } from '../../../services/tarea-crm-service'; // Asegúrate de que la ruta sea correcta
import { TipoTareaCrm, TareaCrmRequest } from '../../../models/tarea-crm'; // Asegúrate de que la ruta sea correcta
@Component({
  selector: 'app-nueva-tarea-modal',
  standalone: true, // Indica que es standalone
  imports: [CommonModule, ReactiveFormsModule], // <-- Importamos los módulos directamente aquí
  templateUrl: './nueva-tarea-modal.html',
  styleUrls: ['./nueva-tarea-modal.css']
})
export class NuevaTareaModalComponent implements OnInit {

  @Input() cotizacionId!: number; 
  @Output() tareaCreada = new EventEmitter<void>(); 
  @Output() cerrarModal = new EventEmitter<void>();

  tareaForm!: FormGroup;
  tiposTarea = Object.values(TipoTareaCrm); 

  constructor(
    private fb: FormBuilder,
    private tareaCrmService: TareaCrmService
  ) { }

  ngOnInit(): void {
    this.tareaForm = this.fb.group({
      titulo: ['', Validators.required],
      tipo: [TipoTareaCrm.LLAMADA, Validators.required],
      fechaLimite: ['', Validators.required],
      descripcion: ['']
    });
  }

  guardarTarea(): void {
    if (this.tareaForm.invalid) {
      return;
    }

    const request: TareaCrmRequest = {
      cotizacionId: this.cotizacionId,
      titulo: this.tareaForm.value.titulo,
      descripcion: this.tareaForm.value.descripcion,
      fechaLimite: this.tareaForm.value.fechaLimite,
      tipo: this.tareaForm.value.tipo
    };

    this.tareaCrmService.crearTarea(request).subscribe({
      next: (response) => {
        console.log('Tarea creada con éxito:', response);
        this.tareaCreada.emit(); 
      },
      error: (err) => {
        console.error('Error al crear la tarea:', err);
      }
    });
  }
}