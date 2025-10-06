// product-audit.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommerceService, } from '../../../services/commerce.service';
import { AuditoriaCategoria, AuditoriaProducto } from '../../../models/auditorias.model';


@Component({
  selector: 'app-product-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-audit.component.html',
  styleUrl: './product-audit.component.css'
})
export class ProductAuditComponent implements OnInit {
  auditoriasProductos: AuditoriaProducto[] = [];
  auditoriasCategorias: AuditoriaCategoria[] = [];
  auditoriasProductosFiltradas: AuditoriaProducto[] = [];
  auditoriasCategoriasFiltradas: AuditoriaCategoria[] = [];
  
  mostrarProductos: boolean = true;
  cargando: boolean = false;
  error: string = '';

  // Filtros
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';
  filtroAccion: string = 'todas';

  constructor(
    private commerceService: CommerceService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarAuditoriasProductos();
  }

  cargarAuditoriasProductos() {
    this.cargando = true;
    this.error = '';
    
    this.commerceService.getAuditoriasProductos().subscribe({
      next: (data) => {
        this.auditoriasProductos = this.ordenarPorFechaDesc(data);
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar auditorías de productos';
        this.cargando = false;
        console.error('Error:', err);
      }
    });
  }

  cargarAuditoriasCategorias() {
    this.cargando = true;
    this.error = '';
    
    this.commerceService.getAuditoriasCategorias().subscribe({
      next: (data) => {
        this.auditoriasCategorias = this.ordenarPorFechaDesc(data);
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar auditorías de categorías';
        this.cargando = false;
        console.error('Error:', err);
      }
    });
  }

  ordenarPorFechaDesc(auditorias: any[]): any[] {
    return auditorias.sort((a, b) => 
      new Date(b.fechaAccion).getTime() - new Date(a.fechaAccion).getTime()
    );
  }

  cambiarTipoAuditoria(mostrarProductos: boolean) {
    this.mostrarProductos = mostrarProductos;
    if (mostrarProductos && this.auditoriasProductos.length === 0) {
      this.cargarAuditoriasProductos();
    } else if (!mostrarProductos && this.auditoriasCategorias.length === 0) {
      this.cargarAuditoriasCategorias();
    } else {
      this.aplicarFiltros();
    }
  }

  aplicarFiltros() {
    if (this.mostrarProductos) {
      this.auditoriasProductosFiltradas = this.filtrarAuditorias(this.auditoriasProductos);
    } else {
      this.auditoriasCategoriasFiltradas = this.filtrarAuditorias(this.auditoriasCategorias);
    }
  }

  filtrarAuditorias(auditorias: any[]): any[] {
    return auditorias.filter(auditoria => {
      // Filtro por acción
      if (this.filtroAccion !== 'todas' && auditoria.accion !== this.filtroAccion) {
        return false;
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
        fechaFin.setHours(23, 59, 59, 999); // Incluir todo el día
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
    this.aplicarFiltros();
  }

  getAccionesUnicas(): string[] {
    const auditorias = this.mostrarProductos ? this.auditoriasProductos : this.auditoriasCategorias;
    return [...new Set(auditorias.map(a => a.accion))].sort();
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

  formatearFechaParaInput(fecha: string): string {
    return new Date(fecha).toISOString().split('T')[0];
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
    this.router.navigate(['/admin/products']);
  }
}