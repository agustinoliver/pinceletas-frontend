import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommerceService } from '../../../services/commerce.service';
import { Categoria} from '../../../models/categoria.model';
import { calcularPrecioConDescuento, Producto } from '../../../models/producto.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [ CommonModule, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  categorias: Categoria[] = [];
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];

  categoriaSeleccionada: string = 'todas';
  filtroNombre: string = '';
  
  private backendUrl = 'http://localhost:8080';

  constructor(
    private commerceService: CommerceService,
    private router: Router
  ) {}

  getImagenUrl(imagenPath: string): string {
    if (!imagenPath) return '';
    if (imagenPath.startsWith('http')) return imagenPath;
    return `${this.backendUrl}${imagenPath}`;
  }

  ngOnInit(): void {
    this.commerceService.getCategoriasConProductos().subscribe((data) => {
      this.categorias = data;
      this.actualizarProductos();
    });
  }

  actualizarProductos(): void {
    // FILTRAR SOLO PRODUCTOS ACTIVOS
    const productos = this.categorias.flatMap((c) => 
      c.productos ? c.productos.filter(p => p.activo) : []
    );
    this.productos = productos;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let filtrados = [...this.productos];

    if (this.categoriaSeleccionada !== 'todas') {
      const categoria = this.categorias.find(
        (c) => c.nombre === this.categoriaSeleccionada
      );
      // FILTRAR SOLO PRODUCTOS ACTIVOS DE LA CATEGORÍA SELECCIONADA
      filtrados = categoria && categoria.productos 
        ? categoria.productos.filter(p => p.activo) 
        : [];
    }

    if (this.filtroNombre.trim() !== '') {
      filtrados = filtrados.filter((p) =>
        p.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase())
      );
    }

    this.productosFiltrados = filtrados;
  }

  verDetalleProducto(productoId: number): void {
    this.router.navigate(['/productdetail', productoId]);
  }

  handleImageError(event: any) {
    event.target.style.display = 'none';
  }

  limpiarFiltros(): void {
    this.categoriaSeleccionada = 'todas';
    this.filtroNombre = '';
    this.aplicarFiltros();
  }
  calcularPrecio(producto: Producto) {
    return calcularPrecioConDescuento(
      producto.precio,
      producto.descuentoPorcentaje || 0
    );
  }

  // ✅ NUEVO: Verificar si el producto tiene descuento
  tieneDescuento(producto: Producto): boolean {
    return (producto.descuentoPorcentaje || 0) > 0;
  }
}