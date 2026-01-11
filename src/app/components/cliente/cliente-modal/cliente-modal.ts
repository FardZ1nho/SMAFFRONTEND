import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';

import { ClienteService } from '../../../services/cliente-service';
import { ClienteRequest } from '../../../models/cliente';

@Component({
  selector: 'app-cliente-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatDividerModule
  ],
  templateUrl: './cliente-modal.html',
  styleUrls: ['./cliente-modal.css']
})
export class ClienteModalComponent implements OnInit {
  clienteForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  modoEdicion = false;

  tiposDocumentoPersona = [
    { value: 'DNI', label: 'DNI' },
    { value: 'PASAPORTE', label: 'Pasaporte' },
    { value: 'CARNET_EXTRANJERIA', label: 'Carnet de Extranjería' }
  ];

  departamentos = [
    'Lima', 'Arequipa', 'Cusco', 'La Libertad', 'Piura', 
    'Junín', 'Lambayeque', 'Callao', 'Ica', 'Ancash'
  ];

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    public dialogRef: MatDialogRef<ClienteModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    
    if (this.data?.cliente) {
      this.modoEdicion = true;
      this.cargarDatosCliente(this.data.cliente);
    }

    this.configurarValidacionesDinamicas();
  }

  inicializarFormulario(): void {
    this.clienteForm = this.fb.group({
      tipoCliente: ['PERSONA', Validators.required],
      
      // Datos básicos
      nombreCompleto: ['', Validators.required],
      razonSocial: [''],
      nombreContacto: [''],
      
      // Documento
      tipoDocumento: ['DNI'],
      numeroDocumento: [''],
      
      // Contacto
      telefono: [''],
      email: ['', [Validators.email]],
      
      // Dirección
      direccion: [''],
      distrito: [''],
      provincia: [''],
      departamento: [''],
      
      // Notas
      notas: ['']
    });
  }

  configurarValidacionesDinamicas(): void {
    this.clienteForm.get('tipoCliente')?.valueChanges.subscribe(tipo => {
      this.actualizarValidacionesPorTipo(tipo);
    });

    this.clienteForm.get('tipoDocumento')?.valueChanges.subscribe(tipoDoc => {
      this.actualizarValidacionesPorDocumento(tipoDoc);
    });

    // Trigger inicial
    this.actualizarValidacionesPorTipo(this.clienteForm.get('tipoCliente')?.value);
  }

  actualizarValidacionesPorTipo(tipo: string): void {
    const nombreCompletoControl = this.clienteForm.get('nombreCompleto');
    const razonSocialControl = this.clienteForm.get('razonSocial');
    const tipoDocumentoControl = this.clienteForm.get('tipoDocumento');

    if (tipo === 'PERSONA') {
      nombreCompletoControl?.setValidators([Validators.required]);
      razonSocialControl?.clearValidators();
      tipoDocumentoControl?.setValue('DNI');
      tipoDocumentoControl?.setValidators([Validators.required]);
    } else if (tipo === 'EMPRESA') {
      nombreCompletoControl?.clearValidators();
      razonSocialControl?.setValidators([Validators.required]);
      tipoDocumentoControl?.setValue('RUC');
      tipoDocumentoControl?.setValidators([Validators.required]);
    }

    nombreCompletoControl?.updateValueAndValidity({ emitEvent: false });
    razonSocialControl?.updateValueAndValidity({ emitEvent: false });
    tipoDocumentoControl?.updateValueAndValidity({ emitEvent: false });
  }

  actualizarValidacionesPorDocumento(tipoDoc: string): void {
    const numeroDocControl = this.clienteForm.get('numeroDocumento');
    
    if (tipoDoc === 'DNI') {
      numeroDocControl?.setValidators([
        Validators.required,
        Validators.pattern(/^\d{8}$/)
      ]);
    } else if (tipoDoc === 'RUC') {
      numeroDocControl?.setValidators([
        Validators.required,
        Validators.pattern(/^(10|20)\d{9}$/)
      ]);
    } else {
      numeroDocControl?.setValidators([Validators.required]);
    }
    
    numeroDocControl?.updateValueAndValidity({ emitEvent: false });
  }

  cargarDatosCliente(cliente: any): void {
    this.clienteForm.patchValue({
      tipoCliente: cliente.tipoCliente,
      nombreCompleto: cliente.nombreCompleto,
      razonSocial: cliente.razonSocial,
      nombreContacto: cliente.nombreContacto,
      tipoDocumento: cliente.tipoDocumento,
      numeroDocumento: cliente.numeroDocumento,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion,
      distrito: cliente.distrito,
      provincia: cliente.provincia,
      departamento: cliente.departamento,
      notas: cliente.notas
    });
  }

  esPersona(): boolean {
    return this.clienteForm.get('tipoCliente')?.value === 'PERSONA';
  }

  esEmpresa(): boolean {
    return this.clienteForm.get('tipoCliente')?.value === 'EMPRESA';
  }

  getErrorDocumento(): string {
    const control = this.clienteForm.get('numeroDocumento');
    const tipoDoc = this.clienteForm.get('tipoDocumento')?.value;

    if (control?.hasError('required')) {
      return 'El número de documento es obligatorio';
    }
    if (control?.hasError('pattern')) {
      if (tipoDoc === 'DNI') {
        return 'El DNI debe tener exactamente 8 dígitos';
      }
      if (tipoDoc === 'RUC') {
        return 'El RUC debe tener 11 dígitos y comenzar con 10 o 20';
      }
    }
    return '';
  }

  guardar(): void {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      this.errorMessage = 'Por favor, completa todos los campos obligatorios correctamente';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // 🔧 CORRECCIÓN: Limpiar campos vacíos/null antes de enviar
    const formValue = this.clienteForm.value;
    const clienteData: ClienteRequest = {
      tipoCliente: formValue.tipoCliente,
      nombreCompleto: formValue.nombreCompleto || null,
      razonSocial: formValue.razonSocial || null,
      nombreContacto: formValue.nombreContacto || null,
      tipoDocumento: formValue.tipoDocumento || null,
      numeroDocumento: formValue.numeroDocumento || null,
      telefono: formValue.telefono || null,
      email: formValue.email || null,
      direccion: formValue.direccion || null,
      distrito: formValue.distrito || null,
      provincia: formValue.provincia || null,
      departamento: formValue.departamento || null,
      notas: formValue.notas || null
    };

    // Log para debugging
    console.log('📤 Enviando cliente:', clienteData);

    const operacion = this.modoEdicion
      ? this.clienteService.actualizarCliente(this.data.cliente.id, clienteData)
      : this.clienteService.crearCliente(clienteData);

    operacion.subscribe({
      next: (response) => {
        console.log('✅ Cliente guardado:', response);
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('❌ Error completo:', error);
        console.error('❌ Error response:', error.error);
        
        // Mostrar mensaje de error más detallado
        if (error.error && typeof error.error === 'string') {
          this.errorMessage = error.error;
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Error al guardar el cliente. Verifica los datos ingresados.';
        }
        
        this.isLoading = false;
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}