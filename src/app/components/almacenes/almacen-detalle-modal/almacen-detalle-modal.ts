import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProductoAlmacenService } from '../../../services/producto-almacen-service';
import { ProductoService } from '../../../services/producto-service'; // ✅ 1. Importar servicio de productos
import { Almacen } from '../../../models/almacen';
import { forkJoin } from 'rxjs'; // ✅ 2. Importar forkJoin para peticiones simultáneas

@Component({
  selector: 'app-almacen-detalle-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './almacen-detalle-modal.html',
  styleUrls: ['./almacen-detalle-modal.css']
})
export class AlmacenDetalleModalComponent implements OnInit {
  
  productos: any[] = []; 
  productosFiltrados: any[] = []; 
  
  cargando: boolean = true;
  totalUnidades: number = 0;
  totalProductos: number = 0;

  filtroTexto: string = '';
  filtroCategoria: string = 'TODAS';
  categoriasDisponibles: string[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { almacen: Almacen },
    private dialogRef: MatDialogRef<AlmacenDetalleModalComponent>,
    private productoAlmacenService: ProductoAlmacenService,
    private productoService: ProductoService, // ✅ 3. Inyectar servicio
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDatosCombinados();
  }

  cargarDatosCombinados(): void {
    this.cargando = true;
    
    if (!this.data.almacen.id) {
        this.cargando = false;
        return;
    }

    // ✅ 4. LÓGICA DE CRUCE DE DATOS
    // Pedimos al mismo tiempo: El stock del almacén Y el catálogo completo de productos
    forkJoin({
      stockAlmacen: this.productoAlmacenService.listarProductosPorAlmacen(this.data.almacen.id),
      catalogoGlobal: this.productoService.listarProductos() // O listarProductosActivos()
    }).subscribe({
      next: (response) => {
        const { stockAlmacen, catalogoGlobal } = response;

        console.log('📦 Stock:', stockAlmacen);
        console.log('🌎 Catálogo:', catalogoGlobal);

        // A. Crear un mapa rápido de productos por ID para buscar rápido la categoría
        const mapaProductos = new Map();
        catalogoGlobal.forEach(p => mapaProductos.set(p.id, p));

        // B. Combinar la información
        this.productos = (stockAlmacen || []).map((item: any) => {
          
          // Buscamos el producto completo en el catálogo usando el ID
          const productoInfoCompleta = mapaProductos.get(item.productoId);

          // Obtenemos la categoría del catálogo global (donde SÍ existe)
          const categoriaReal = productoInfoCompleta?.nombreCategoria || 'Sin Categoría';

          return {
            ...item,
            _nombreDisplay: item.productoNombre || productoInfoCompleta?.nombre || 'S/N',
            _codigoDisplay: item.productoCodigo || productoInfoCompleta?.codigo || 'S/C',
            _categoriaDisplay: categoriaReal, // ✅ ¡Aquí asignamos la categoría recuperada!
            _stockDisplay: item.stock || 0
          };
        });
        
        // C. Extraer categorías para el filtro
        const uniqueCats = new Set<string>();
        this.productos.forEach(p => {
            if (p._categoriaDisplay && p._categoriaDisplay !== 'Sin Categoría') {
                uniqueCats.add(p._categoriaDisplay);
            }
        });
        this.categoriasDisponibles = Array.from(uniqueCats).sort();

        this.calcularTotales();
        this.aplicarFiltros(); 
        
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando datos', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  aplicarFiltros(): void {
    let resultado = [...this.productos];

    if (this.filtroTexto.trim()) {
      const texto = this.filtroTexto.toLowerCase();
      resultado = resultado.filter(p => 
        p._nombreDisplay.toLowerCase().includes(texto) ||
        p._codigoDisplay.toLowerCase().includes(texto)
      );
    }

    if (this.filtroCategoria !== 'TODAS') {
      resultado = resultado.filter(p => p._categoriaDisplay === this.filtroCategoria);
    }

    this.productosFiltrados = resultado;
  }

  limpiarFiltros(): void {
    this.filtroTexto = '';
    this.filtroCategoria = 'TODAS';
    this.aplicarFiltros();
  }

  calcularTotales(): void {
    this.totalProductos = this.productos.length;
    this.totalUnidades = this.productos.reduce((acc, curr) => acc + (curr._stockDisplay || 0), 0);
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  getStockClass(stock: number): string {
    if (stock <= 0) return 'stock-agotado';
    if (stock < 5) return 'stock-bajo';
    return 'stock-normal';
  }
}