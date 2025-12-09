import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { PedidoResponse } from '../../../models/pedido.model';
import { PedidoService } from '../../../services/pedido.service';

@Component({
  selector: 'app-detalle-pedido',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-pedido.component.html',
  styleUrl: './detalle-pedido.component.css'
})
export class DetallePedidoComponent implements OnInit{
  pedido: PedidoResponse | null = null;
  cargando = false;
  private pedidoId: number = 0;

  constructor(
    private pedidoService: PedidoService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.pedidoId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.pedidoId) {
      this.cargarDetallePedido();
    }
  }

  cargarDetallePedido(): void {
    this.cargando = true;
    this.pedidoService.obtenerPedidoPorId(this.pedidoId).subscribe({
      next: (data) => {
        this.pedido = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando detalle del pedido:', error);
        this.mostrarAlertaError('Error cargando el detalle del pedido');
        this.cargando = false;
        this.volverALista();
      }
    });
  }

  volverALista(): void {
    const currentUrl = this.router.url;
    if (currentUrl.includes('/admin/')) {
      this.router.navigate(['/admin/pedidos']);
    } else {
      this.router.navigate(['/mis-pedidos']);
    }
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearMoneda(monto: number): string {
    return `$${monto.toFixed(2)}`;
  }

  calcularSubtotal(item: any): number {
    const precioConDescuento = item.precioUnitario - (item.precioUnitario * item.descuentoPorcentaje / 100);
    return precioConDescuento * item.cantidad;
  }

  getBadgeClass(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
      case 'PENDIENTE_PAGO':
        return 'badge bg-warning text-dark';
      case 'PAGADO':
      case 'PROCESANDO':
        return 'badge bg-info';
      case 'ENVIADO':
        return 'badge bg-primary';
      case 'ENTREGADO':
        return 'badge bg-success';
      case 'CANCELADO':
      case 'REEMBOLSADO':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  private mostrarAlertaError(mensaje: string): void {
    Swal.fire({
      title: 'Error',
      text: mensaje,
      icon: 'error',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#d33'
    });
  }
}
