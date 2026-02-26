import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { CotizacionService } from '../../../services/cotizacion-service';
import { CotizacionResponse, EstadoPipeline } from '../../../models/cotizacion';

// Importamos el modal que creamos (Asegúrate de que la ruta coincida con el nombre de tu archivo)
import { NuevaTareaModalComponent } from '../nueva-tarea-modal/nueva-tarea-modal'; 

@Component({
  selector: 'app-crm-tablero',
  standalone: true,
  imports: [
    CommonModule, 
    DragDropModule, 
    MatIconModule, 
    MatButtonModule, 
    MatTooltipModule, 
    MatSnackBarModule,
    NuevaTareaModalComponent
  ],
  templateUrl: './crm-tablero.html',
  styleUrls: ['./crm-tablero.css']
})
export class CrmTableroComponent implements OnInit {

  // Nuestras "Columnas" del embudo
  contactoInicial: CotizacionResponse[] = [];
  cotizacionEnviada: CotizacionResponse[] = [];
  enNegociacion: CotizacionResponse[] = [];
  ganada: CotizacionResponse[] = [];
  perdida: CotizacionResponse[] = [];

  // Variables para controlar el modal de Tareas
  mostrarModalTarea: boolean = false;
  cotizacionSeleccionadaId: number = 0;

  constructor(
    private cotizacionService: CotizacionService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarTablero();
  }

  cargarTablero(): void {
    this.cotizacionService.listar().subscribe({
      next: (data) => {
        // Limpiamos las columnas
        this.contactoInicial = [];
        this.cotizacionEnviada = [];
        this.enNegociacion = [];
        this.ganada = [];
        this.perdida = [];

        // Distribuimos las cotizaciones según su estado
        data.forEach(cot => {
          if (cot.estado === 'CONTACTO_INICIAL') this.contactoInicial.push(cot);
          else if (cot.estado === 'COTIZACION_ENVIADA') this.cotizacionEnviada.push(cot);
          else if (cot.estado === 'EN_NEGOCIACION') this.enNegociacion.push(cot);
          else if (cot.estado === 'GANADA') this.ganada.push(cot);
          else if (cot.estado === 'PERDIDA') this.perdida.push(cot);
        });

        // Forzar actualización de la vista al terminar de cargar
        this.cdr.detectChanges();
      },
      error: () => this.mostrarMensaje('Error al cargar el CRM', 'error')
    });
  }

  drop(event: CdkDragDrop<CotizacionResponse[]>, nuevoEstado: EstadoPipeline) {
    // Si se mueve dentro de la misma columna (reordenar)
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } 
    // Si se mueve a una columna diferente
    else {
      const cotizacionMovida = event.previousContainer.data[event.previousIndex];
      let motivo = undefined;

      // Si la arrastran a PERDIDA, preguntamos por qué
      if (nuevoEstado === 'PERDIDA') {
        const respuesta = prompt('¿Por qué se perdió esta venta? (Ej: Muy caro, Compró a la competencia)');
        if (respuesta === null) return; 
        motivo = respuesta;
      }

      // Movemos la tarjeta visualmente al instante
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Forzar actualización visual inmediata (para que no haya lag visual)
      this.cdr.detectChanges();

      // Le avisamos al Backend del cambio
      this.cotizacionService.actualizarEstadoPipeline(cotizacionMovida.id, nuevoEstado, motivo).subscribe({
        next: () => {
          this.mostrarMensaje(`Cotización #${cotizacionMovida.numero} movida a ${nuevoEstado}`, 'success');
          
          if (nuevoEstado === 'GANADA') {
            // Un pequeño delay (300ms) para que se vea bonita la animación de la tarjeta cayendo
            setTimeout(() => {
              const deseaFacturar = confirm(`🎉 ¡Excelente cierre!\n\n¿Deseas generar el comprobante de venta para la cotización #${cotizacionMovida.numero} ahora mismo?`);
              
              if (deseaFacturar) {
                this.router.navigate(['/ventas/nueva'], { queryParams: { cotizacionId: cotizacionMovida.id } }); 
              }
            }, 300);
          }
          
          this.cdr.detectChanges();
        },
        error: () => {
          this.mostrarMensaje('Error al guardar el cambio. Recargando...', 'error');
          this.cargarTablero(); 
        }
      });
    }
  }

  descargarPDF(id: number): void {
    this.cotizacionService.descargarPdf(id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      window.open(url); 
    });
  }

  // BOTÓN WHATSAPP INTELIGENTE
  abrirWhatsApp(telefono: string, cliente: string, numeroCotizacion: string, estado: EstadoPipeline): void {
    if (!telefono) {
      this.mostrarMensaje('El cliente no tiene teléfono registrado', 'warning');
      return;
    }

    let mensaje = '';

    // Elegimos el mensaje según la columna donde esté la tarjeta
    switch (estado) {
      case 'CONTACTO_INICIAL':
        mensaje = `Hola ${cliente}, te saluda Patrick de SMAF. Vi que estabas interesado en nuestros productos. Te escribo por aquí para enviarte la cotización #${numeroCotizacion} y resolver cualquier duda que tengas. ¿Pudiste revisarla?`;
        break;
      
      case 'COTIZACION_ENVIADA':
        mensaje = `Hola ${cliente}, ¿qué tal? Te escribe Patrick de SMAF. Te contacto para hacer un seguimiento rápido a la cotización #${numeroCotizacion} que te enviamos hace unos días. ¿Tienes alguna consulta sobre los equipos o los precios?`;
        break;
      
      case 'EN_NEGOCIACION':
        mensaje = `Hola ${cliente}, soy Patrick de SMAF. Sobre la cotización #${numeroCotizacion} que estamos conversando, me gustaría saber si tienes alguna contrapropuesta o si hay algún detalle que podamos ajustar para cerrar el trato de una vez. ¡Quedo atento!`;
        break;
      
      case 'GANADA':
        mensaje = `¡Hola ${cliente}! Muchas gracias por confirmar tu pedido (Cotización #${numeroCotizacion}). Por este medio te comparto nuestros números de cuenta (BCP / Yape) para que puedas realizar el abono y proceder con el despacho de tus herramientas de inmediato.`;
        break;
      
      case 'PERDIDA':
        mensaje = `Hola ${cliente}. Vimos que decidiste no avanzar con la cotización #${numeroCotizacion}. En SMAF valoramos mucho tu interés. Si en el futuro necesitas herramientas para concreto, no dudes en escribirnos. ¡Que tengas un excelente día!`;
        break;
        
      default:
        mensaje = `Hola ${cliente}, te escribe Patrick de SMAF. Te contacto sobre la cotización #${numeroCotizacion}.`;
    }

    // Limpiamos el número de espacios o guiones (ej. "999 999 999" -> "999999999")
    const numeroLimpio = telefono.replace(/\D/g, ''); 
    
    const url = `https://wa.me/51${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  private mostrarMensaje(msj: string, tipo: string) {
    this.snackBar.open(msj, 'Cerrar', { duration: 3000, panelClass: `snackbar-${tipo}` });
  }

  // FUNCIONES PARA ABRIR Y CERRAR EL MODAL
  abrirModalNuevaTarea(idCotizacion: number) {
    this.cotizacionSeleccionadaId = idCotizacion;
    this.mostrarModalTarea = true;
  }

  onTareaCreada() {
    this.mostrarModalTarea = false;
    this.mostrarMensaje('¡Recordatorio guardado con éxito!', 'success');
  }
}