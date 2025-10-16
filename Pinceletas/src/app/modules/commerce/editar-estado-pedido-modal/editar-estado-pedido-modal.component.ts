import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PedidoResponse } from '../../../models/pedido.model';

interface EstadoOpcion {
  value: string;
  label: string;
  color: string;
  icon: string;
  descripcion: string;
}

@Component({
  selector: 'app-editar-estado-pedido-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-estado-pedido-modal.component.html',
  styleUrl: './editar-estado-pedido-modal.component.css'
})
export class EditarEstadoPedidoModalComponent {
  @Input() pedido: PedidoResponse | null = null;
  @Output() estadoActualizado = new EventEmitter<string>();
  @Output() cerrarModal = new EventEmitter<void>();

  nuevoEstado: string = '';
  notas: string = '';

  estados: EstadoOpcion[] = [
    {
      value: 'PENDIENTE',
      label: 'Pendiente',
      color: 'warning',
      icon: 'clock',
      descripcion: 'El pedido está pendiente de procesamiento'
    },
    {
      value: 'PENDIENTE_PAGO',
      label: 'Pendiente de Pago',
      color: 'warning',
      icon: 'credit-card',
      descripcion: 'Esperando confirmación del pago'
    },
    {
      value: 'PAGADO',
      label: 'Pagado',
      color: 'info',
      icon: 'check-circle',
      descripcion: 'El pago ha sido confirmado'
    },
    {
      value: 'PROCESANDO',
      label: 'Procesando',
      color: 'info',
      icon: 'cog',
      descripcion: 'El pedido está siendo preparado'
    },
    {
      value: 'ENVIADO',
      label: 'Enviado',
      color: 'primary',
      icon: 'truck',
      descripcion: 'El pedido está en camino'
    },
    {
      value: 'ENTREGADO',
      label: 'Entregado',
      color: 'success',
      icon: 'check-double',
      descripcion: 'El pedido ha sido entregado'
    },
    {
      value: 'CANCELADO',
      label: 'Cancelado',
      color: 'danger',
      icon: 'times-circle',
      descripcion: 'El pedido ha sido cancelado'
    },
    {
      value: 'REEMBOLSADO',
      label: 'Reembolsado',
      color: 'danger',
      icon: 'undo',
      descripcion: 'Se ha procesado un reembolso'
    }
  ];

  ngOnInit(): void {
    if (this.pedido) {
      this.nuevoEstado = this.pedido.estado;
    }
  }

  seleccionarEstado(estado: string): void {
    this.nuevoEstado = estado;
  }

  guardarCambios(): void {
    if (this.nuevoEstado && this.nuevoEstado !== this.pedido?.estado) {
      this.estadoActualizado.emit(this.nuevoEstado);
    }
  }

  cerrar(): void {
    this.cerrarModal.emit();
  }

  getMensajeAlerta(): string | null {
    switch (this.nuevoEstado) {
      case 'CANCELADO':
        return 'Al cancelar el pedido, se notificará al cliente.';
      case 'ENTREGADO':
        return 'El pedido se marcará como completado.';
      case 'REEMBOLSADO':
        return 'Asegúrate de procesar el reembolso en el sistema de pagos.';
      default:
        return null;
    }
  }

  getTipoAlerta(): string {
    switch (this.nuevoEstado) {
      case 'CANCELADO':
      case 'REEMBOLSADO':
        return 'danger';
      case 'ENTREGADO':
        return 'success';
      default:
        return 'warning';
    }
  }
}
