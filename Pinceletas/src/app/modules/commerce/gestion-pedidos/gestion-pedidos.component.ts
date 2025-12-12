import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ActualizarEstadoPedido, PedidoResponse } from '../../../models/pedido.model';
import { PedidoService } from '../../../services/pedido.service';
import { EditarEstadoPedidoModalComponent } from "../editar-estado-pedido-modal/editar-estado-pedido-modal.component";

@Component({
  selector: 'app-gestion-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, EditarEstadoPedidoModalComponent],
  templateUrl: './gestion-pedidos.component.html',
  styleUrl: './gestion-pedidos.component.css'
})
export class GestionPedidosComponent implements OnInit {
  pedidos: PedidoResponse[] = [];
  pedidosFiltrados: PedidoResponse[] = [];
  pedidosPaginados: PedidoResponse[] = [];
  cargando = false;

  mostrarModalEditarEstado = false;
  pedidoSeleccionado: PedidoResponse | null = null;
  
  filtroNumeroPedido: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';
  
  // Paginación
  paginaActual: number = 1;
  pedidosPorPagina: number = 5;
  totalPaginas: number = 0;
  
  estados = ['PENDIENTE', 'PENDIENTE_PAGO', 'PAGADO', 'PROCESANDO', 'ENVIADO', 'ENTREGADO', 'CANCELADO', 'REEMBOLSADO'];
  
  private intervaloRefresh: any;

  constructor(
    private pedidoService: PedidoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    if (this.cargando) return;
    
    this.cargando = true;
    this.pedidoService.obtenerTodosLosPedidos().subscribe({
      next: (data) => {
        this.pedidos = data.sort((a, b) => 
          new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
        );
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando pedidos:', error);
        this.mostrarAlertaError('Error cargando los pedidos');
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
    this.paginaActual = 1;
    this.calcularPaginacion();
    this.actualizarPaginacion();
  }

  limpiarFiltros(): void {
    this.filtroNumeroPedido = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    this.aplicarFiltros();
  }

  calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.pedidosFiltrados.length / this.pedidosPorPagina);
    if (this.totalPaginas === 0) this.totalPaginas = 1;
  }

  actualizarPaginacion(): void {
    const inicio = (this.paginaActual - 1) * this.pedidosPorPagina;
    const fin = inicio + this.pedidosPorPagina;
    this.pedidosPaginados = this.pedidosFiltrados.slice(inicio, fin);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarPaginacion();
    }
  }

  getPaginasArray(): number[] {
    const paginas: number[] = [];
    const maxPaginas = 5;
    let inicio = Math.max(1, this.paginaActual - Math.floor(maxPaginas / 2));
    let fin = Math.min(this.totalPaginas, inicio + maxPaginas - 1);
    
    if (fin - inicio < maxPaginas - 1) {
      inicio = Math.max(1, fin - maxPaginas + 1);
    }
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }

  verDetallePedido(pedidoId: number): void {
    this.router.navigate(['/admin/pedidos/detalle', pedidoId]);
  }

  actualizarEstadoDesdeModal(nuevoEstado: string): void {
    if (!this.pedidoSeleccionado) return;

    const estadoUpdate: ActualizarEstadoPedido = { estado: nuevoEstado };
    
    this.pedidoService.actualizarEstadoPedido(this.pedidoSeleccionado.id, estadoUpdate).subscribe({
      next: (pedidoActualizado) => {
        const index = this.pedidos.findIndex(p => p.id === this.pedidoSeleccionado!.id);
        if (index !== -1) {
          this.pedidos[index] = pedidoActualizado;
          this.aplicarFiltros();
        }
        this.mostrarAlertaExito('Estado del pedido actualizado correctamente');
        this.cerrarModal();
      },
      error: (error) => {
        console.error('Error actualizando estado:', error);
        this.mostrarAlertaError('Error al actualizar el estado del pedido');
      }
    });
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

  abrirModalEditarEstado(pedido: PedidoResponse): void {
    this.pedidoSeleccionado = pedido;
    this.mostrarModalEditarEstado = true;
  }

  cerrarModal(): void {
    this.mostrarModalEditarEstado = false;
    this.pedidoSeleccionado = null;
  }

  private mostrarAlertaExito(mensaje: string): void {
    Swal.fire({
      title: '¡Éxito!',
      text: mensaje,
      icon: 'success',
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#28a745',
      timer: 3000,
      timerProgressBar: true
    });
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

  private mostrarConfirmacion(titulo: string): Promise<any> {
    return Swal.fire({
      title: titulo,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d'
    });
  }

  irAAuditoria() {
    this.router.navigate(['/admin/pedidos/auditoria']);
  }
}