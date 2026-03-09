import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; 

import { ClienteService } from '../../../services/cliente-service';
import { ConsultaService } from '../../../services/consulta-service'; 
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
    MatDividerModule,
    MatSnackBarModule 
  ],
  templateUrl: './cliente-modal.html',
  styleUrls: ['./cliente-modal.css']
})
export class ClienteModalComponent implements OnInit {
  clienteForm!: FormGroup;
  isLoading = false;
  isSearchingApi = false; 
  modoEdicion = false;

  tiposDocumentoPersona = [
    { value: 'DNI', label: 'DNI' },
    { value: 'PASAPORTE', label: 'Pasaporte' },
    { value: 'CARNET_EXTRANJERIA', label: 'Carnet de Extranjería' }
  ];

  departamentos = [
    'Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho',
    'Cajamarca', 'Callao', 'Cusco', 'Huancavelica', 'Huánuco',
    'Ica', 'Junín', 'La Libertad', 'Lambayeque', 'Lima',
    'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 'Piura',
    'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali'
  ];

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private cdr: ChangeDetectorRef, 
    private snackBar: MatSnackBar,
    private consultaService: ConsultaService, 
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
      tipoCliente: ['EMPRESA', Validators.required],
      nombreCompleto: [''],
      razonSocial: ['', Validators.required],
      nombreContacto: [''],
      tipoDocumento: ['RUC'],
      numeroDocumento: [''],
      telefono: [''],
      email: ['', [Validators.email]],
      direccion: [''],
      distrito: [''],
      provincia: [''],
      departamento: [''],
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

    this.actualizarValidacionesPorTipo(this.clienteForm.get('tipoCliente')?.value);
  }

  actualizarValidacionesPorTipo(tipo: string): void {
    const nombreCompleto = this.clienteForm.get('nombreCompleto');
    const razonSocial = this.clienteForm.get('razonSocial');
    const tipoDocumento = this.clienteForm.get('tipoDocumento');

    nombreCompleto?.clearValidators();
    razonSocial?.clearValidators();

    if (tipo === 'PERSONA') {
      nombreCompleto?.setValidators([Validators.required]);
      
      if (tipoDocumento?.value === 'RUC') {
        tipoDocumento?.setValue('DNI', { emitEvent: false });
        this.actualizarValidacionesPorDocumento('DNI');
      }
      
    } else { // EMPRESA
      razonSocial?.setValidators([Validators.required]);
      
      tipoDocumento?.setValue('RUC', { emitEvent: false });
      this.actualizarValidacionesPorDocumento('RUC');
    }

    nombreCompleto?.updateValueAndValidity();
    razonSocial?.updateValueAndValidity();
    
    this.cdr.detectChanges();
  }

  actualizarValidacionesPorDocumento(tipoDoc: string): void {
    const numeroDoc = this.clienteForm.get('numeroDocumento');
    numeroDoc?.clearValidators();

    if (tipoDoc === 'DNI') {
      numeroDoc?.setValidators([Validators.required, Validators.pattern(/^\d{8}$/)]);
    } else if (tipoDoc === 'RUC') {
      numeroDoc?.setValidators([Validators.required, Validators.pattern(/^(10|15|17|20)\d{9}$/)]);
    } else {
      numeroDoc?.setValidators([Validators.required]);
    }
    
    numeroDoc?.updateValueAndValidity();
  }

  cargarDatosCliente(cliente: any): void {
    this.clienteForm.patchValue(cliente);
    this.cdr.detectChanges();
  }

  esPersona(): boolean { return this.clienteForm.get('tipoCliente')?.value === 'PERSONA'; }
  esEmpresa(): boolean { return this.clienteForm.get('tipoCliente')?.value === 'EMPRESA'; }

  getErrorDocumento(): string {
    const control = this.clienteForm.get('numeroDocumento');
    const tipoDoc = this.clienteForm.get('tipoDocumento')?.value;

    if (control?.hasError('required')) return 'Documento obligatorio';
    if (control?.hasError('pattern')) {
      if (tipoDoc === 'DNI') return 'DNI inválido (8 dígitos)';
      if (tipoDoc === 'RUC') return 'RUC inválido (11 dígitos)';
      return 'Formato inválido';
    }
    return '';
  }

  // ⭐ BÚSQUEDA MÁGICA EN SUNAT / RENIEC ⭐
  buscarDocumentoApi(): void {
    const documento = this.clienteForm.get('numeroDocumento')?.value;

    if (!documento || (documento.length !== 8 && documento.length !== 11)) {
      this.snackBar.open('El documento debe tener 8 (DNI) o 11 (RUC) dígitos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isSearchingApi = true;
    this.cdr.detectChanges();

    this.consultaService.consultarDocumento(documento).subscribe({
      next: (data: any) => {
        // Si es RUC
        if (documento.length === 11) {
          this.clienteForm.patchValue({
            // Leemos razon_social según manual de Decolecta
            razonSocial: data.razon_social || data.razonSocial || '',
            direccion: data.direccion || '',
            departamento: data.departamento ? this.capitalizarPrimeraLetra(data.departamento) : '',
            provincia: data.provincia ? this.capitalizarPrimeraLetra(data.provincia) : '',
            distrito: data.distrito ? this.capitalizarPrimeraLetra(data.distrito) : ''
          });
        } 
        // Si es DNI
        else if (documento.length === 8) {
          // Prevenimos campos nulos o formatos diferentes
          const nombres = data.nombres || '';
          const apPaterno = data.apellido_paterno || data.apellidoPaterno || '';
          const apMaterno = data.apellido_materno || data.apellidoMaterno || '';
          
          this.clienteForm.patchValue({
            nombreCompleto: `${nombres} ${apPaterno} ${apMaterno}`.trim()
          });
        }

        this.snackBar.open('¡Datos encontrados exitosamente!', 'OK', { duration: 2000, panelClass: 'snackbar-success' });
        this.isSearchingApi = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.snackBar.open('Documento no encontrado o API no disponible', 'Cerrar', { duration: 3000, panelClass: 'error-snackbar' });
        this.isSearchingApi = false;
        this.cdr.detectChanges();
      }
    });
  }

  private capitalizarPrimeraLetra(texto: string): string {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  }

  guardar(): void {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.clienteForm.value;

    const clienteData: ClienteRequest = {
      tipoCliente: formValue.tipoCliente,
      nombreCompleto: this.esPersona() ? formValue.nombreCompleto : null,
      razonSocial: this.esEmpresa() ? formValue.razonSocial : null,
      nombreContacto: this.esEmpresa() ? formValue.nombreContacto : null,
      tipoDocumento: formValue.tipoDocumento,
      numeroDocumento: formValue.numeroDocumento,
      telefono: formValue.telefono || null,
      email: formValue.email || null,
      direccion: formValue.direccion || null,
      distrito: formValue.distrito || null,
      provincia: formValue.provincia || null,
      departamento: formValue.departamento || null,
      notas: formValue.notas || null
    };

    const operacion = this.modoEdicion
      ? this.clienteService.actualizarCliente(this.data.cliente.id, clienteData)
      : this.clienteService.crearCliente(clienteData);

    operacion.subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Error:', error);
        const mensajeError = error.error?.mensaje || 'Error al guardar el cliente.';
        this.snackBar.open(mensajeError, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}