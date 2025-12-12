import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../../services/pedido.service';
import { CommerceService } from '../../../services/commerce.service';
import { UserAuthService } from '../../../services/user-auth.service';
import { AuditoriaPedido } from '../../../models/auditorias.model';
import { Producto } from '../../../models/producto.model';

@Component({
  selector: 'app-pedido-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedido-audit.component.html',
  styleUrl: './pedido-audit.component.css'
})
export class PedidoAuditComponent implements OnInit {
  auditoriasPedidos: AuditoriaPedido[] = [];
  auditoriasPedidosFiltradas: AuditoriaPedido[] = [];
  auditoriasPaginadas: AuditoriaPedido[] = [];
  
  cargando: boolean = false;
  error: string = '';

  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';
  filtroAccion: string = 'todas';
  filtroPedidoId: string = '';

  productosCache: Map<number, string> = new Map();

  // Paginación
  paginaActual: number = 1;
  itemsPorPagina: number = 4;
  totalPaginas: number = 0;

  constructor(
    private pedidoService: PedidoService,
    private commerceService: CommerceService,
    private userAuthService: UserAuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarAuditoriasPrimero();
  }

  cargarAuditoriasPrimero() {
    this.cargando = true;
    
    this.pedidoService.obtenerAuditoriasPedidos().subscribe({
      next: (data) => {
        console.log('Auditorías cargadas:', data);
        this.auditoriasPedidos = this.ordenarPorFechaDesc(data);
        
        const usuarioIds = this.obtenerUsuarioIdsUnicos(data);
        console.log('IDs de usuarios encontrados:', usuarioIds);
        
        this.cargarProductosYUsuarios(usuarioIds);
      },
      error: (err) => {
        this.error = 'Error al cargar auditorías de pedidos';
        this.cargando = false;
        console.error('Error:', err);
      }
    });
  }

  obtenerUsuarioIdsUnicos(auditorias: AuditoriaPedido[]): number[] {
    const ids = auditorias
      .map(a => a.usuarioId)
      .filter(id => id !== 0);
    
    return [...new Set(ids)];
  }

  cargarProductosYUsuarios(usuarioIds: number[]) {
    this.commerceService.getProductos().subscribe({
      next: (productos) => {
        console.log('Productos cargados para cache:', productos);
        
        productos.forEach(producto => {
          this.productosCache.set(producto.id, producto.nombre);
        });
        
        console.log('Cache de productos creado:', this.productosCache);
        
        this.cargarUsuariosAlCache(usuarioIds);
      },
      error: (err) => {
        console.error('Error cargando productos, continuando sin nombres...', err);
        this.cargarUsuariosAlCache(usuarioIds);
      }
    });
  }

  cargarUsuariosAlCache(usuarioIds: number[]) {
    if (usuarioIds.length === 0) {
      console.log('No hay usuarios para cargar en el cache');
      this.aplicarFiltros();
      this.cargando = false;
      return;
    }

    console.log('Cargando usuarios al cache:', usuarioIds);
    
    this.userAuthService.cargarUsuariosAlCache(usuarioIds).subscribe({
      next: () => {
        console.log('Usuarios cargados exitosamente al cache');
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando usuarios al cache:', err);
        this.aplicarFiltros();
        this.cargando = false;
      }
    });
  }

  cargarAuditoriasPedidos() {
    this.cargando = true;
    this.error = '';
    
    this.pedidoService.obtenerAuditoriasPedidos().subscribe({
      next: (data) => {
        console.log('Auditorías cargadas:', data);
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
    this.paginaActual = 1;
    this.calcularPaginacion();
    this.actualizarPaginacion();
  }

  filtrarAuditorias(auditorias: AuditoriaPedido[]): AuditoriaPedido[] {
    return auditorias.filter(auditoria => {
      if (this.filtroAccion !== 'todas' && auditoria.accion !== this.filtroAccion) {
        return false;
      }

      if (this.filtroPedidoId.trim() !== '') {
        if (!auditoria.pedidoId.toString().includes(this.filtroPedidoId)) {
          return false;
        }
      }

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

  calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.auditoriasPedidosFiltradas.length / this.itemsPorPagina);
    if (this.totalPaginas === 0) this.totalPaginas = 1;
  }

  actualizarPaginacion(): void {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.auditoriasPaginadas = this.auditoriasPedidosFiltradas.slice(inicio, fin);
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

  obtenerCambiosPedido(auditoria: AuditoriaPedido): any {
    const anteriores = this.parseJson(auditoria.valoresAnteriores);
    const nuevos = this.parseJson(auditoria.valoresNuevos);
    
    if (!anteriores && !nuevos) return null;

    return {
      anteriores: anteriores,
      nuevos: nuevos,
      cambios: this.obtenerCamposModificados(anteriores, nuevos),
      camposAnteriores: Object.keys(anteriores || {}),
      camposNuevos: Object.keys(nuevos || {})
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

  getCamposOrdenados(): string[] {
    return [
      'numeroPedido',
      'estado',
      'total',
      'fechaCreacion',
      'fechaActualizacion',
      'tipoEntrega',
      
      'usuarioId',
      'emailContacto',
      'telefonoContacto',
      
      'direccionEnvio',
      'ciudadEnvio',
      'provinciaEnvio',
      'codigoPostalEnvio',
      'paisEnvio',
      
      'preferenciaIdMp',
      'pagoIdMp',
      'estadoPagoMp',
      'fechaPagoMp',
      
      'items'
    ];
  }

  getValorFormateado(campo: string, valor: any): string {
  if (valor === null || valor === undefined || valor === '') {
    return '<span class="text-muted">-</span>';
  }

  switch (campo) {
    case 'total':
      return `$${Number(valor).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    case 'estado':
      const estado = this.estadosPedido.get(valor) || valor;
      return `<span class="badge ${this.getBadgeClassEstado(valor)}">${estado}</span>`;
    
    case 'fechaCreacion':
    case 'fechaActualizacion':
    case 'fechaPagoMp':
      return this.formatearFechaDesdeBackend(valor);
    
    case 'tipoEntrega':
      return valor === 'envio' ? 
        '<span class="badge bg-info">Envío a domicilio</span>' : 
        '<span class="badge bg-secondary">Retiro en local</span>';
    
    case 'items':
      return this.getItemsPreview(valor);
    
    case 'usuarioId':
      if (valor === 0) {
        return '<strong class="text-info"><i class="fas fa-robot me-1"></i>Sistema Automático</strong>';
      }
      const nombreUsuario = this.userAuthService.getNombreUsuario(valor);
      return `<strong class="text-primary">${nombreUsuario}</strong>`;
    
    case 'numeroPedido':
      return `<code class="text-primary fw-bold">${valor}</code>`;
    
    case 'preferenciaIdMp':
    case 'pagoIdMp':
      return valor ? `<code class="text-info">${this.acortarTexto(valor, 20)}</code>` : '<span class="text-muted">-</span>';
    
    case 'estadoPagoMp':
      return valor ? `<span class="badge bg-warning text-dark">${valor}</span>` : '<span class="text-muted">-</span>';
    
    case 'id':
      return '';
    
    default:
      if (typeof valor === 'string' && valor.length > 50) {
        return `<span title="${valor}">${this.acortarTexto(valor, 50)}</span>`;
      }
      return String(valor);
  }
}


  getNombreProducto(productoId: number): string {
    return this.productosCache.get(productoId) || `Producto #${productoId}`;
  }

  getNombreUsuario(usuarioId: number): string {
  if (usuarioId === 0) {
    return ' Sistema Automático';
  }
  
  return this.userAuthService.getNombreUsuario(usuarioId);
}


  formatearFechaDesdeBackend(fecha: any): string {
    if (!fecha) return '<span class="text-muted">-</span>';
    
    try {
      let fechaParseada: Date;
      
      if (Array.isArray(fecha)) {
        const [year, month, day, hour = 0, minute = 0, second = 0] = fecha;
        fechaParseada = new Date(year, month - 1, day, hour, minute, second);
      }
      else if (typeof fecha === 'string') {
        fechaParseada = new Date(fecha);
      }
      else if (typeof fecha === 'object' && fecha !== null) {
        const { year, month, day, hour = 0, minute = 0, second = 0 } = fecha;
        fechaParseada = new Date(year, month - 1, day, hour, minute, second);
      }
      else if (typeof fecha === 'number') {
        fechaParseada = new Date(fecha);
      }
      else {
        fechaParseada = new Date(fecha);
      }
      
      if (isNaN(fechaParseada.getTime())) {
        console.warn('Fecha inválida detectada:', fecha);
        return '<span class="text-warning">Fecha inválida</span>';
      }
      
      return fechaParseada.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
    } catch (error) {
      console.error('Error formateando fecha:', error, 'Valor original:', fecha);
      return '<span class="text-danger">Error en fecha</span>';
    }
  }

  acortarTexto(texto: string, maxLength: number): string {
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength) + '...';
  }

  getBadgeClassEstado(estado: string): string {
    switch (estado) {
      case 'PENDIENTE_PAGO':
        return 'bg-warning text-dark';
      case 'PENDIENTE':
        return 'bg-secondary';
      case 'PAGADO':
        return 'bg-success';
      case 'PREPARACION':
        return 'bg-info';
      case 'EN_CAMINO':
        return 'bg-primary';
      case 'ENTREGADO':
        return 'bg-success';
      case 'CANCELADO':
        return 'bg-danger';
      case 'REEMBOLSADO':
        return 'bg-dark';
      default:
        return 'bg-secondary';
    }
  }

  getItemsPreview(items: any[]): string {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return '<span class="text-muted">No hay items</span>';
    }

    const previews = items.slice(0, 3).map((item: any, index: number) => {
      const nombreProducto = this.getNombreProducto(item.productoId);
      const cantidad = item.cantidad || 1;
      const precioUnitario = item.precioUnitario ? Number(item.precioUnitario).toLocaleString('es-AR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }) : '';
      
      return `
        <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
          <div class="flex-grow-1">
            <small class="fw-medium d-block text-primary">
              <i class="fas fa-cube me-1"></i>
              ${nombreProducto}
            </small>
            <small class="text-muted">$${precioUnitario} c/u</small>
          </div>
          <small class="badge bg-primary ms-2">x${cantidad}</small>
        </div>
      `;
    }).join('');

    const extra = items.length > 3 ? 
      `<div class="text-center mt-2">
        <small class="badge bg-secondary">+${items.length - 3} productos más</small>
      </div>` : '';

    return `
      <div class="items-preview">
        ${previews}
        ${extra}
      </div>
    `;
  }

  getNombreCampo(campo: string): string {
    const nombres: { [key: string]: string } = {
      'numeroPedido': 'Número de Pedido',
      'usuarioId': 'Usuario',
      'total': 'Total',
      'estado': 'Estado del Pedido',
      'fechaCreacion': 'Fecha de Creación',
      'fechaActualizacion': 'Fecha de Actualización',
      'tipoEntrega': 'Tipo de Entrega',
      'direccionEnvio': 'Dirección de Envío',
      'ciudadEnvio': 'Ciudad',
      'provinciaEnvio': 'Provincia',
      'codigoPostalEnvio': 'Código Postal',
      'paisEnvio': 'País',
      'emailContacto': 'Email de Contacto',
      'telefonoContacto': 'Teléfono',
      'preferenciaIdMp': 'ID Preferencia MP',
      'pagoIdMp': 'ID Pago MP',
      'estadoPagoMp': 'Estado Pago MP',
      'fechaPagoMp': 'Fecha Pago MP',
      'items': 'Productos del Pedido'
    };
    
    return nombres[campo] || this.formatearNombreCampo(campo);
  }

  formatearNombreCampo(campo: string): string {
    return campo
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  getCamposParaMostrar(campos: string[]): string[] {
    const camposExcluir = ['id'];
    return campos.filter(campo => !camposExcluir.includes(campo) && this.getCamposOrdenados().includes(campo))
                 .sort((a, b) => {
                   const indexA = this.getCamposOrdenados().indexOf(a);
                   const indexB = this.getCamposOrdenados().indexOf(b);
                   return indexA - indexB;
                 });
  }

  volverALista() {
    this.router.navigate(['/admin/pedidos']);
  }

  verDetallePedido(pedidoId: number) {
    this.router.navigate(['/admin/pedidos/detalle', pedidoId]);
  }

  estadosPedido: Map<string, string> = new Map([
    ['PENDIENTE_PAGO', 'Pendiente de Pago'],
    ['PENDIENTE', 'Pendiente'],
    ['PAGADO', 'Pagado'],
    ['PREPARACION', 'En Preparación'],
    ['EN_CAMINO', 'En Camino'],
    ['ENTREGADO', 'Entregado'],
    ['CANCELADO', 'Cancelado'],
    ['REEMBOLSADO', 'Reembolsado']
  ]);

  esEliminacionAutomatica(auditoria: AuditoriaPedido): boolean {
  return auditoria.accion === 'ELIMINAR' && auditoria.usuarioId === 0;
  }
  
  obtenerMotivoEliminacion(auditoria: AuditoriaPedido): string {
  if (!this.esEliminacionAutomatica(auditoria)) {
    return '';
  }

  try {
    const nuevos = this.parseJson(auditoria.valoresNuevos);
    if (nuevos && nuevos.razon) {
      switch (nuevos.razon) {
        case '7_DIAS_PENDIENTE_PAGO':
          return ' Pedido eliminado automáticamente: 7 días en estado PENDIENTE_PAGO sin completar el pago';
        default:
          return ' Eliminado por el sistema automáticamente';
      }
    }
  } catch (e) {
    console.error('Error parseando motivo:', e);
  }
  
  return ' Eliminado por el sistema automáticamente';
  }
}