import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../../services/pedido.service';
import { AuditoriaPedido } from '../../../models/auditorias.model';

@Component({
  selector: 'app-pedido-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedido-audit.component.html',
  styleUrl: './pedido-audit.component.css'
})
export class PedidoAuditComponent implements OnInit{
  auditoriasPedidos: AuditoriaPedido[] = [];
  auditoriasPedidosFiltradas: AuditoriaPedido[] = [];
  
  cargando: boolean = false;
  error: string = '';

  // Filtros
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';
  filtroAccion: string = 'todas';
  filtroPedidoId: string = '';

  constructor(
    private pedidoService: PedidoService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarAuditoriasPedidos();
  }

  cargarAuditoriasPedidos() {
    this.cargando = true;
    this.error = '';
    
    this.pedidoService.obtenerAuditoriasPedidos().subscribe({
      next: (data) => {
        this.auditoriasPedidos = this.ordenarPorFechaDesc(data);
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar auditorías de pedidos';
        this.cargando = false;
        console.error('Error:', err);
      }
    });
  }

  ordenarPorFechaDesc(auditorias: AuditoriaPedido[]): AuditoriaPedido[] {
    return auditorias.sort((a, b) => 
      new Date(b.fechaAccion).getTime() - new Date(a.fechaAccion).getTime()
    );
  }

  aplicarFiltros() {
    this.auditoriasPedidosFiltradas = this.filtrarAuditorias(this.auditoriasPedidos);
  }

  filtrarAuditorias(auditorias: AuditoriaPedido[]): AuditoriaPedido[] {
    return auditorias.filter(auditoria => {
      // Filtro por acción
      if (this.filtroAccion !== 'todas' && auditoria.accion !== this.filtroAccion) {
        return false;
      }

      // Filtro por pedido ID
      if (this.filtroPedidoId.trim() !== '') {
        if (!auditoria.pedidoId.toString().includes(this.filtroPedidoId)) {
          return false;
        }
      }

      // Filtro por fecha
      const fechaAuditoria = new Date(auditoria.fechaAccion);
      
      if (this.filtroFechaInicio) {
        const fechaInicio = new Date(this.filtroFechaInicio);
        if (fechaAuditoria < fechaInicio) {
          return false;
        }
      }

      if (this.filtroFechaFin) {
        const fechaFin = new Date(this.filtroFechaFin);
        fechaFin.setHours(23, 59, 59, 999);
        if (fechaAuditoria > fechaFin) {
          return false;
        }
      }

      return true;
    });
  }

  limpiarFiltros() {
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    this.filtroAccion = 'todas';
    this.filtroPedidoId = '';
    this.aplicarFiltros();
  }

  getAccionesUnicas(): string[] {
    return [...new Set(this.auditoriasPedidos.map(a => a.accion))].sort();
  }

  parseJson(valor: string | null): any {
    if (!valor) return null;
    try {
      return JSON.parse(valor);
    } catch {
      return valor;
    }
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-AR');
  }

  getBadgeClass(accion: string): string {
    switch (accion) {
      case 'CREAR':
        return 'badge bg-success';
      case 'MODIFICAR':
        return 'badge bg-warning text-dark';
      case 'ELIMINAR':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  getIconoAccion(accion: string): string {
    switch (accion) {
      case 'CREAR':
        return 'fas fa-plus-circle';
      case 'MODIFICAR':
        return 'fas fa-edit';
      case 'ELIMINAR':
        return 'fas fa-trash';
      default:
        return 'fas fa-info-circle';
    }
  }

  volverALista() {
    this.router.navigate(['/admin/pedidos']);
  }

  verDetallePedido(pedidoId: number) {
    this.router.navigate(['/admin/pedidos/detalle', pedidoId]);
  }
}
