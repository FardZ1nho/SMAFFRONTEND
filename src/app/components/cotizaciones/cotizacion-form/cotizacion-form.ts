import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms'; // ✅ Importar ReactiveFormsModule y FormControl
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

// Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatAutocompleteModule } from '@angular/material/autocomplete'; // ✅ Importante
import { MatFormFieldModule } from '@angular/material/form-field';

import { CotizacionService } from '../../../services/cotizacion-service'; 
import { ClienteService } from '../../../services/cliente-service'; 
import { ProductoService } from '../../../services/producto-service'; 

@Component({
  selector: 'app-cotizacion-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule, // ✅ Agregar ReactiveFormsModule
    MatButtonModule, MatIconModule, MatInputModule, 
    MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatCardModule, MatAutocompleteModule, MatFormFieldModule
  ],
  templateUrl: './cotizacion-form.html',
  styleUrls: ['./cotizacion-form.css']
})
export class CotizacionFormComponent implements OnInit {

  cotizacion: any = {
    idCliente: null,
    fechaVencimiento: new Date(),
    moneda: 'PEN',
    tipoCambio: 3.75,
    observaciones: '',
    detalles: []
  };

  clientes: any[] = [];
  productos: any[] = [];
  
  // ✅ CONTROL PARA EL AUTOCOMPLETE
  productoControl = new FormControl('');
  productosFiltrados!: Observable<any[]>;

  prodSeleccionado: any = null;
  cantidadTemp: number = 1;
  precioTemp: number = 0;

  subTotal: number = 0;
  igv: number = 0;
  total: number = 0;

  constructor(
    private cotizacionService: CotizacionService,
    private clienteService: ClienteService,
    private productoService: ProductoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
    
    // Fecha vencimiento +15 días
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + 15);
    this.cotizacion.fechaVencimiento = hoy;

    // Cargar productos y configurar filtro
    this.cargarProductos();
  }

  cargarClientes() {
    this.clienteService.listarClientes().subscribe((data: any[]) => {
      this.clientes = data;
    });
  }

cargarProductos() {
    const service: any = this.productoService;
    const obs = service.listarProductos ? service.listarProductos() : service.listar();
    
    obs.subscribe((data: any[]) => {
      this.productos = data;

      // ✅ CORRECCIÓN: Tipar explícitamente 'value' como 'string | any'
      this.productosFiltrados = this.productoControl.valueChanges.pipe(
        startWith(''),
        map((value: string | any) => { // <--- AQUÍ ESTABA EL ERROR
          const nombre = typeof value === 'string' ? value : value?.nombre;
          return nombre ? this._filter(nombre as string) : this.productos.slice();
        })
      );
    });
  }

  // ✅ FUNCIÓN DE FILTRADO (Busca por Nombre o Código)
  private _filter(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.productos.filter(option => 
      option.nombre.toLowerCase().includes(filterValue) || 
      (option.codigo && option.codigo.toLowerCase().includes(filterValue))
    );
  }

  // ✅ MOSTRAR NOMBRE BONITO EN EL INPUT
  displayFn(producto: any): string {
    return producto && producto.nombre ? `${producto.codigo} - ${producto.nombre}` : '';
  }

  // ✅ CUANDO SELECCIONAS UN PRODUCTO DE LA LISTA
  seleccionarProducto(event: any) {
    const prod = event.option.value;
    if (!prod) return;

    this.prodSeleccionado = prod;
    this.precioTemp = prod.precioVenta || prod.precio || 0;
  }

  agregarDetalle() {
    if (!this.prodSeleccionado || this.cantidadTemp <= 0 || this.precioTemp < 0) return;

    const existe = this.cotizacion.detalles.find((d: any) => d.idProducto === this.prodSeleccionado.id);
    
    if (existe) {
      existe.cantidad += this.cantidadTemp;
      existe.precioUnitario = this.precioTemp;
    } else {
      this.cotizacion.detalles.push({
        idProducto: this.prodSeleccionado.id,
        nombreProducto: this.prodSeleccionado.nombre,
        codigo: this.prodSeleccionado.codigo,
        cantidad: this.cantidadTemp,
        precioUnitario: this.precioTemp
      });
    }

    // ✅ LIMPIAR EL BUSCADOR
    this.productoControl.setValue('');
    this.prodSeleccionado = null;
    this.cantidadTemp = 1;
    this.precioTemp = 0;

    this.calcularTotales();
  }

  eliminarDetalle(index: number) {
    this.cotizacion.detalles.splice(index, 1);
    this.calcularTotales();
  }

  calcularTotales() {
    let totalAcumulado = 0;
    this.cotizacion.detalles.forEach((d: any) => {
      totalAcumulado += (d.cantidad * d.precioUnitario);
    });
    this.total = totalAcumulado;
    this.subTotal = this.total / 1.18;
    this.igv = this.total - this.subTotal;
  }

  guardar() {
    if (!this.cotizacion.idCliente || this.cotizacion.detalles.length === 0) {
      alert("Debes seleccionar un cliente y agregar al menos un producto.");
      return;
    }

    const request = {
      idCliente: this.cotizacion.idCliente,
      fechaVencimiento: this.cotizacion.fechaVencimiento,
      moneda: this.cotizacion.moneda,
      tipoCambio: this.cotizacion.tipoCambio,
      observaciones: this.cotizacion.observaciones,
      subTotal: this.subTotal,
      igv: this.igv,
      total: this.total,
      detalles: this.cotizacion.detalles.map((d: any) => ({
        idProducto: d.idProducto,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario / 1.18
      }))
    };

    this.cotizacionService.registrar(request).subscribe({
      next: (resp) => {
        alert(`✅ Cotización ${resp.serie}-${resp.numero} creada.`);
        this.router.navigate(['/cotizaciones']);
      },
      error: (err) => {
        console.error(err);
        alert("Error al guardar.");
      }
    });
  }
}