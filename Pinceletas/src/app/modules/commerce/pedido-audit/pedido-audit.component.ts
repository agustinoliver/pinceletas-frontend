import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../../services/pedido.service';
import { CommerceService } from '../../../services/commerce.service';
import { UserAuthService } from '../../../services/user-auth.service'; // ✅ AGREGAR ESTE IMPORT
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
  
  cargando: boolean = false;
  error: string = '';

  // Filtros
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';
  filtroAccion: string = 'todas';
  filtroPedidoId: string = '';

  // Cache para productos
  productosCache: Map<number, string> = new Map();

  constructor(
    private pedidoService: PedidoService,
    private commerceService: CommerceService,
    private userAuthService: UserAuthService, // ✅ AGREGAR ESTE SERVICE
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarAuditoriasPrimero(); // ✅ MODIFICADO
  }

  // ✅ MODIFICADO: Cargar auditorías primero y luego usuarios
  cargarAuditoriasPrimero() {
    this.cargando = true;
    
    this.pedidoService.obtenerAuditoriasPedidos().subscribe({
      next: (data) => {
        console.log('Auditorías cargadas:', data);
        this.auditoriasPedidos = this.ordenarPorFechaDesc(data);
        
        // Extraer IDs de usuarios únicos de las auditorías
        const usuarioIds = this.obtenerUsuarioIdsUnicos(data);
        console.log('IDs de usuarios encontrados:', usuarioIds);
        
        // Cargar productos y usuarios en paralelo
        this.cargarProductosYUsuarios(usuarioIds);
      },
      error: (err) => {
        this.error = 'Error al cargar auditorías de pedidos';
        this.cargando = false;
        console.error('Error:', err);
      }
    });
  }

  // ✅ NUEVO: Obtener IDs de usuarios únicos de las auditorías
  obtenerUsuarioIdsUnicos(auditorias: AuditoriaPedido[]): number[] {
    const ids = auditorias
      .map(a => a.usuarioId)
      .filter(id => id !== 0); // Excluir usuario "Sistema"
    
    return [...new Set(ids)]; // Devolver únicos
  }

  // ✅ NUEVO: Cargar productos y usuarios
  cargarProductosYUsuarios(usuarioIds: number[]) {
    // Cargar productos
    this.commerceService.getProductos().subscribe({
      next: (productos) => {
        console.log('Productos cargados para cache:', productos);
        
        // Llenar cache de productos con ID -> Nombre
        productos.forEach(producto => {
          this.productosCache.set(producto.id, producto.nombre);
        });
        
        console.log('Cache de productos creado:', this.productosCache);
        
        // Ahora cargar usuarios al cache
        this.cargarUsuariosAlCache(usuarioIds);
      },
      error: (err) => {
        console.error('Error cargando productos, continuando sin nombres...', err);
        // Continuar con carga de usuarios aunque falle la carga de productos
        this.cargarUsuariosAlCache(usuarioIds);
      }
    });
  }

  // ✅ NUEVO: Cargar usuarios al cache
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
        // Continuar aunque falle la carga de usuarios
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
      // Información principal del pedido
      'numeroPedido',
      'estado',
      'total',
      'fechaCreacion',
      'fechaActualizacion',
      'tipoEntrega',
      
      // Información del usuario
      'usuarioId',
      'emailContacto',
      'telefonoContacto',
      
      // Dirección de envío
      'direccionEnvio',
      'ciudadEnvio',
      'provinciaEnvio',
      'codigoPostalEnvio',
      'paisEnvio',
      
      // Información de pago
      'preferenciaIdMp',
      'pagoIdMp',
      'estadoPagoMp',
      'fechaPagoMp',
      
      // Items del pedido
      'items'
    ];
  }

  // ✅ MODIFICADO: Actualizar el método getValorFormateado para el campo usuarioId
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
    
    // ✅ MODIFICADO: Campo usuarioId - detectar usuario del sistema (ID = 0)
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
      return ''; // No mostrar ID interno
    
    default:
      // Para texto largo, limitar longitud
      if (typeof valor === 'string' && valor.length > 50) {
        return `<span title="${valor}">${this.acortarTexto(valor, 50)}</span>`;
      }
      return String(valor);
  }
}


  // ✅ NUEVO: Obtener nombre del producto desde el cache
  getNombreProducto(productoId: number): string {
    return this.productosCache.get(productoId) || `Producto #${productoId}`;
  }

  // ✅ NUEVO: Obtener nombre del usuario usando el servicio
  getNombreUsuario(usuarioId: number): string {
  // ✅ NUEVO: Detectar si es eliminación automática del sistema
  if (usuarioId === 0) {
    return '🤖 Sistema Automático';
  }
  
  return this.userAuthService.getNombreUsuario(usuarioId);
}


  formatearFechaDesdeBackend(fecha: any): string {
    if (!fecha) return '<span class="text-muted">-</span>';
    
    try {
      let fechaParseada: Date;
      
      // Si es un array (formato [año, mes, día, hora, minuto, segundo, nanosegundo])
      if (Array.isArray(fecha)) {
        const [year, month, day, hour = 0, minute = 0, second = 0] = fecha;
        fechaParseada = new Date(year, month - 1, day, hour, minute, second);
      }
      // Si es string en formato ISO
      else if (typeof fecha === 'string') {
        fechaParseada = new Date(fecha);
      }
      // Si es objeto con propiedades separadas
      else if (typeof fecha === 'object' && fecha !== null) {
        const { year, month, day, hour = 0, minute = 0, second = 0 } = fecha;
        fechaParseada = new Date(year, month - 1, day, hour, minute, second);
      }
      // Si ya es un timestamp numérico
      else if (typeof fecha === 'number') {
        fechaParseada = new Date(fecha);
      }
      // Fallback
      else {
        fechaParseada = new Date(fecha);
      }
      
      // Validar que la fecha sea válida
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

  // ✅ CORREGIDO COMPLETAMENTE: Mostrar preview de items del pedido con nombres reales
  getItemsPreview(items: any[]): string {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return '<span class="text-muted">No hay items</span>';
    }

    const previews = items.slice(0, 3).map((item: any, index: number) => {
      // ✅ CORREGIDO: Usar el cache de productos para obtener nombres reales
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

  // Cache para estados de pedido
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

  //Auditoria de eliminación automática
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
          return '⏰ Pedido eliminado automáticamente: 7 días en estado PENDIENTE_PAGO sin completar el pago';
        default:
          return '🤖 Eliminado por el sistema automáticamente';
      }
    }
  } catch (e) {
    console.error('Error parseando motivo:', e);
  }
  
  return '🤖 Eliminado por el sistema automáticamente';
  }
}