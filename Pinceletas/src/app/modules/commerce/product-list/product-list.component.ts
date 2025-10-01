import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommerceService } from '../../../services/commerce.service';
import { Categoria} from '../../../models/categoria.model';
import { Producto } from '../../../models/producto.model';

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
  
  // Agregar esta propiedad
  private backendUrl = 'http://localhost:8080';

  constructor(private commerceService: CommerceService) {}

  // Agregar este método
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
    const productos = this.categorias.flatMap((c) => c.productos);
    this.productos = productos;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let filtrados = [...this.productos];

    if (this.categoriaSeleccionada !== 'todas') {
      const categoria = this.categorias.find(
        (c) => c.nombre === this.categoriaSeleccionada
      );
      filtrados = categoria ? [...categoria.productos] : [];
    }

    if (this.filtroNombre.trim() !== '') {
      filtrados = filtrados.filter((p) =>
        p.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase())
      );
    }

    this.productosFiltrados = filtrados;
  }
}