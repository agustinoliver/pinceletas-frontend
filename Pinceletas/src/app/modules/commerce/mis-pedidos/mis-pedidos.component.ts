import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { PedidoResponse } from '../../../models/pedido.model';
import { PedidoService } from '../../../services/pedido.service';
import { UserAuthService } from '../../../services/user-auth.service';

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-pedidos.component.html',
  styleUrl: './mis-pedidos.component.css'
})
export class MisPedidosComponent implements OnInit{
  pedidos: PedidoResponse[] = [];
  pedidosFiltrados: PedidoResponse[] = [];
  cargando = false;
  
  filtroNumeroPedido: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';
  
  private usuarioId: number = 0;
  private intervaloRefresh: any;

  constructor(
    private pedidoService: PedidoService,
    private authService: UserAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id) {
      this.usuarioId = currentUser.id;
      this.cargarPedidos();
      
      
    } else {
      this.mostrarAlertaError('Debes estar logueado para ver tus pedidos');
      this.router.navigate(['/login']);
    }
  }

  

  cargarPedidos(): void {
    if (this.cargando) return;
    
    this.cargando = true;
    this.pedidoService.obtenerPedidosPorUsuario(this.usuarioId).subscribe({
      next: (data) => {
        this.pedidos = data.sort((a, b) => 
          new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
        );
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando pedidos:', error);
        this.mostrarAlertaError('Error cargando tus pedidos');
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    let filtrados = [...this.pedidos];

    if (this.filtroNumeroPedido.trim() !== '') {
      filtrados = filtrados.filter(pedido =>
        pedido.numeroPedido.toLowerCase().includes(this.filtroNumeroPedido.toLowerCase())
      );
    }

    if (this.filtroFechaInicio) {
      const fechaInicio = new Date(this.filtroFechaInicio);
      filtrados = filtrados.filter(pedido => 
        new Date(pedido.fechaCreacion) >= fechaInicio
      );
    }

    if (this.filtroFechaFin) {
      const fechaFin = new Date(this.filtroFechaFin);
      fechaFin.setHours(23, 59, 59, 999);
      filtrados = filtrados.filter(pedido => 
        new Date(pedido.fechaCreacion) <= fechaFin
      );
    }

    this.pedidosFiltrados = filtrados;
  }

  limpiarFiltros(): void {
    this.filtroNumeroPedido = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    this.aplicarFiltros();
  }

  verDetallePedido(pedidoId: number): void {
    this.router.navigate(['/pedidos/detalle', pedidoId]);
  }

  volverAProductos(): void {
    this.router.navigate(['/productlist']);
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
