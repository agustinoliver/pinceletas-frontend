import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommerceService } from '../../../services/commerce.service';
import { AuditoriaCategoria, AuditoriaProducto } from '../../../models/auditorias.model';
import { Categoria } from '../../../models/categoria.model';
import { OpcionProducto } from '../../../models/producto.model';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

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

  // Cache para categorías y opciones
  categoriasCache: Map<number, string> = new Map();
  opcionesCache: Map<number, string> = new Map();

  // Filtros
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';
  filtroAccion: string = 'todas';

  constructor(
    private commerceService: CommerceService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales() {
    this.cargando = true;
    
    // Cargar categorías y opciones primero
    forkJoin({
      categorias: this.commerceService.getCategoriasConProductos(),
      opciones: this.commerceService.getOpcionesProductos()
    }).subscribe({
      next: (result) => {
        console.log('Categorías cargadas:', result.categorias);
        console.log('Opciones cargadas:', result.opciones);
        
        // Llenar cache de categorías
        result.categorias.forEach(cat => {
          this.categoriasCache.set(cat.id, cat.nombre);
        });
        
        // Llenar cache de opciones
        result.opciones.forEach(op => {
          this.opcionesCache.set(op.id, op.tipo);
        });
        
        console.log('Cache de categorías:', this.categoriasCache);
        console.log('Cache de opciones:', this.opcionesCache);
        
        // Ahora cargar las auditorías
        this.cargarAuditoriasProductos();
      },
      error: (err) => {
        this.error = 'Error al cargar datos iniciales';
        this.cargando = false;
        console.error('Error:', err);
      }
    });
  }

  cargarAuditoriasProductos() {
    this.cargando = true;
    this.error = '';
    
    this.commerceService.getAuditoriasProductos().subscribe({
      next: (data) => {
        console.log('Auditorías de productos cargadas:', data);
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

  // Métodos para productos
  obtenerCambiosProducto(auditoria: AuditoriaProducto): any {
    const anteriores = this.parseJson(auditoria.valoresAnteriores);
    const nuevos = this.parseJson(auditoria.valoresNuevos);
    
    if (!anteriores && !nuevos) return null;

    console.log('Valores anteriores:', anteriores);
    console.log('Valores nuevos:', nuevos);

    // Filtrar campos y ordenar
    const camposFiltradosAnteriores = this.filtrarYOrdenarCamposProducto(anteriores);
    const camposFiltradosNuevos = this.filtrarYOrdenarCamposProducto(nuevos);

    return {
      anteriores: camposFiltradosAnteriores,
      nuevos: camposFiltradosNuevos,
      cambios: this.obtenerCamposModificados(anteriores, nuevos).filter(campo => 
        this.getCamposOrdenadosProducto().includes(campo)
      ),
      camposAnteriores: Object.keys(camposFiltradosAnteriores || {}),
      camposNuevos: Object.keys(camposFiltradosNuevos || {})
    };
  }

  filtrarYOrdenarCamposProducto(obj: any): any {
    if (!obj) return null;
    
    const camposPermitidos = this.getCamposOrdenadosProducto();
    const filtrado: any = {};
    
    camposPermitidos.forEach(campo => {
      if (obj && obj.hasOwnProperty(campo)) {
        filtrado[campo] = obj[campo];
      }
    });
    
    return Object.keys(filtrado).length > 0 ? filtrado : null;
  }

  getCamposOrdenadosProducto(): string[] {
    return ['nombre', 'precio', 'descuentoPorcentaje', 'descripcion', 'imagenes', 'activo', 'categoriaId', 'opcionesIds'];
  }

  // Métodos para categorías (solo nombre)
  obtenerCambiosCategoria(auditoria: AuditoriaCategoria): any {
    const anteriores = this.parseJson(auditoria.valoresAnteriores);
    const nuevos = this.parseJson(auditoria.valoresNuevos);
    
    if (!anteriores && !nuevos) return null;

    // Filtrar solo nombre
    const filtrarCampos = (obj: any) => {
      if (!obj) return null;
      const filtrado: any = {};
      if (obj.hasOwnProperty('nombre')) {
        filtrado['nombre'] = obj['nombre'];
      }
      return Object.keys(filtrado).length > 0 ? filtrado : null;
    };

    const anterioresFiltrado = filtrarCampos(anteriores);
    const nuevosFiltrado = filtrarCampos(nuevos);

    return {
      anteriores: anterioresFiltrado,
      nuevos: nuevosFiltrado,
      cambios: this.obtenerCamposModificados(anteriores, nuevos).filter(campo => campo === 'nombre'),
      camposAnteriores: anterioresFiltrado ? ['nombre'] : [],
      camposNuevos: nuevosFiltrado ? ['nombre'] : []
    };
  }

  obtenerCamposModificados(anteriores: any, nuevos: any): string[] {
    if (!anteriores || !nuevos) return [];
    
    const camposModificados: string[] = [];
    const todosCampos = new Set([...Object.keys(anteriores || {}), ...Object.keys(nuevos || {})]);
    
    todosCampos.forEach(campo => {
      const valorAnterior = anteriores?.[campo];
      const valorNuevo = nuevos?.[campo];
      
      if (JSON.stringify(valorAnterior) !== JSON.stringify(valorNuevo)) {
        camposModificados.push(campo);
      }
    });
    
    return camposModificados;
  }

  // ✅ MÉTODO MEJORADO: Formatear valores para mostrar
  getValorFormateado(campo: string, valor: any): string {
    if (valor === null || valor === undefined) return '-';
    
    switch (campo) {
      case 'precio':
        return `$${valor.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'descuentoPorcentaje':
        return `${valor}%`;
      case 'activo':
        return valor ? 
          '<span class="badge bg-success">Sí</span>' : 
          '<span class="badge bg-danger">No</span>';
      case 'imagenes':
        return this.getImagenesPreview(valor);
      case 'opcionesIds':
        if (Array.isArray(valor) && valor.length > 0) {
          const nombres = valor.map(id => this.opcionesCache.get(id) || `Opción ${id}`);
          return nombres.join(', ');
        }
        return '<span class="text-muted">Sin opciones</span>';
      case 'categoriaId':
        // USAR EL CACHE DE CATEGORÍAS
        const categoriaNombre = this.categoriasCache.get(Number(valor));
        return categoriaNombre ? 
          `<span class="badge bg-info text-dark">${categoriaNombre}</span>` : 
          `<span class="text-muted">Categoría ${valor}</span>`;
      case 'id':
        return ''; // No mostrar ID
      default:
        // Para texto largo como descripción, limitar longitud
        if (campo === 'descripcion' && String(valor).length > 100) {
          return String(valor).substring(0, 100) + '...';
        }
        return String(valor);
    }
  }

  getNombreCampo(campo: string): string {
    const nombres: { [key: string]: string } = {
      'nombre': 'Nombre',
      'descripcion': 'Descripción',
      'precio': 'Precio',
      'descuentoPorcentaje': 'Descuento',
      'activo': 'Activo',
      'categoriaId': 'Categoría',
      'imagenes': 'Imágenes',
      'opcionesIds': 'Opciones'
    };
    
    return nombres[campo] || campo;
  }

  // ✅ MÉTODO MEJORADO: Para mostrar imágenes en formato visual
  getImagenesPreview(imagenes: any): string {
    if (!imagenes || !Array.isArray(imagenes) || imagenes.length === 0) {
      return '<span class="text-muted">Sin imágenes</span>';
    }

    // Si es un array de strings (URLs)
    const urls = imagenes.filter(img => typeof img === 'string');
    
    if (urls.length === 0) {
      return '<span class="text-muted">Sin imágenes válidas</span>';
    }

    const previews = urls.slice(0, 4).map((img: string, index: number) => {
      const urlCompleta = img.startsWith('http') ? img : `http://localhost:8080${img}`;
      return `
        <div class="position-relative d-inline-block me-2 mb-1">
          <img src="${urlCompleta}" 
               class="audit-thumbnail" 
               alt="Imagen ${index + 1}" 
               title="${img}"
               onerror="this.style.display='none'">
          <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary">
            ${index + 1}
          </span>
        </div>
      `;
    }).join('');

    const extra = urls.length > 4 ? 
      `<span class="badge bg-secondary ms-1">+${urls.length - 4} más</span>` : '';

    return `
      <div class="d-flex flex-wrap align-items-center">
        ${previews}
        ${extra}
      </div>
    `;
  }

  // ✅ MÉTODO AUXILIAR: Para formateo simple (sin HTML)
  formatearValor(campo: string, valor: any): string {
    if (valor === null || valor === undefined) return '-';
    
    switch (campo) {
      case 'precio':
        return `$${valor.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'descuentoPorcentaje':
        return `${valor}%`;
      case 'activo':
        return valor ? 'Sí' : 'No';
      case 'imagenes':
        if (Array.isArray(valor) && valor.length > 0) {
          return `${valor.length} imagen(es)`;
        }
        return 'Sin imágenes';
      case 'opcionesIds':
        if (Array.isArray(valor) && valor.length > 0) {
          const nombres = valor.map(id => this.opcionesCache.get(id) || `Opción ${id}`);
          return nombres.join(', ');
        }
        return 'Sin opciones';
      case 'categoriaId':
        const categoriaNombre = this.categoriasCache.get(Number(valor));
        return categoriaNombre || `Categoría ${valor}`;
      default:
        return String(valor);
    }
  }

  volverALista() {
    this.router.navigate(['/admin/products']);
  }
}