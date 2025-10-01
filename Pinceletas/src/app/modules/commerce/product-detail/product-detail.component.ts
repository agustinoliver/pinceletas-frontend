import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../../models/producto.model';
import { ActivatedRoute, Router } from '@angular/router';
import { CommerceService } from '../../../services/commerce.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  producto: Producto | null = null;
  opcionSeleccionada: number | null = null;
  private backendUrl = 'http://localhost:8080';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private commerceService: CommerceService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const productId = +params['id'];
      this.cargarProducto(productId);
    });
  }

  cargarProducto(id: number): void {
    this.commerceService.getProductoById(id).subscribe({
      next: (producto) => {
        this.producto = producto;
        // Si solo hay una opción, seleccionarla automáticamente
        if (producto.opciones && producto.opciones.length === 1) {
          this.opcionSeleccionada = producto.opciones[0].id;
        }
      },
      error: (error) => {
        console.error('Error al cargar el producto:', error);
        this.router.navigate(['/productlist']);
      }
    });
  }

  getImagenUrl(imagenPath: string): string {
    if (!imagenPath) return '';
    if (imagenPath.startsWith('http')) return imagenPath;
    return `${this.backendUrl}${imagenPath}`;
  }

  seleccionarOpcion(event: any): void {
    this.opcionSeleccionada = event.target.value ? +event.target.value : null;
  }

  volverALista(): void {
    this.router.navigate(['/productlist']);
  }

  handleImageError(event: any): void {
    event.target.style.display = 'none';
  }

  agregarAlCarrito(): void {
    if (this.producto) {
      // Validar que si tiene opciones, esté seleccionada una
      if (this.producto.opciones.length > 0 && !this.opcionSeleccionada) {
        alert('Por favor selecciona una opción antes de agregar al carrito');
        return;
      }
      
      // Aquí iría la lógica para agregar al carrito
      console.log('Producto agregado al carrito:', {
        producto: this.producto,
        opcionSeleccionada: this.opcionSeleccionada
      });
      
      alert('Producto agregado al carrito');
    }
  }
}