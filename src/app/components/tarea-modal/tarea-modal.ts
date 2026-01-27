import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // ✅ Importar ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core'; // ✅ Provider
import { MatIconModule } from '@angular/material/icon';

import { TareaService } from '../../services/tarea-service';
import { UsersService } from '../../services/user-service';
import { TareaRequest, PrioridadTarea } from '../../models/tarea';

@Component({
  selector: 'app-tarea-modal',
  standalone: true,
  providers: [provideNativeDateAdapter()], // ✅ Solución al error de DateAdapter
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule, 
    MatNativeDateModule, MatIconModule
  ],
  templateUrl: './tarea-modal.html',
  styleUrls: ['./tarea-modal.css']
})
export class TareaModalComponent implements OnInit {
  tareaForm!: FormGroup;
  usuarios: any[] = []; 
  prioridades = Object.values(PrioridadTarea);
  isLoadingUsers = true;

  constructor(
    private fb: FormBuilder,
    private tareaService: TareaService,
    private usersService: UsersService,
    private dialogRef: MatDialogRef<TareaModalComponent>,
    private cdr: ChangeDetectorRef // ✅ Inyectar detector
  ) {}

  ngOnInit(): void {
    this.tareaForm = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: [''],
      prioridad: ['MEDIA', Validators.required],
      fechaLimite: [new Date(), Validators.required],
      usuarioAsignadoId: [null, Validators.required]
    });

    this.cargarUsuarios();
  }

  cargarUsuarios() {
    // Ya estaba en true, pero nos aseguramos
    this.isLoadingUsers = true;
    this.cdr.detectChanges(); 

    this.usersService.listar().subscribe({
      next: (data: any[]) => {
        this.usuarios = data;
        this.isLoadingUsers = false;
        this.cdr.detectChanges(); // ✅ Actualizar vista cuando lleguen usuarios
      },
      error: (e) => {
        console.error("Error cargando usuarios", e);
        this.isLoadingUsers = false;
        this.cdr.detectChanges(); // ✅ Actualizar vista en error
      }
    });
  }

  guardar() {
    if (this.tareaForm.valid) {
      const val = this.tareaForm.value;
      
      const request: TareaRequest = {
        titulo: val.titulo,
        descripcion: val.descripcion,
        prioridad: val.prioridad,
        fechaLimite: val.fechaLimite.toISOString(), 
        usuarioAsignadoId: val.usuarioAsignadoId
      };

      this.tareaService.crear(request).subscribe({
        next: () => this.dialogRef.close(true),
        error: (e: any) => {
            console.error(e);
            alert('Error al asignar tarea');
        }
      });
    }
  }

  cancelar() { this.dialogRef.close(); }
}