import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { PedidoResponse } from '../../../models/pedido.model';
import { PedidoService } from '../../../services/pedido.service';
import { UserAuthService } from '../../../services/user-auth.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  pedidosPaginados: PedidoResponse[] = [];
  cargando = false;
  
  filtroNumeroPedido: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';
  
  // Paginación
  paginaActual: number = 1;
  pedidosPorPagina: number = 5;
  totalPaginas: number = 0;
  
  private usuarioId: number = 0;

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
    this.router.navigate(['/pedidos/detalle', pedidoId]);
  }

  volverAProductos(): void {
    this.router.navigate(['/productlist']);
  }

  exportarPedidoPDF(pedidoId: number): void {
    Swal.fire({
      title: 'Generando PDF...',
      text: 'Por favor espera mientras se genera el documento',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.pedidoService.obtenerPedidoPorId(pedidoId).subscribe({
      next: (pedido) => {
        this.generarPDF(pedido);
        Swal.close();
        this.mostrarAlertaExito('PDF generado correctamente');
      },
      error: (error) => {
        console.error('Error obteniendo detalle del pedido:', error);
        Swal.close();
        this.mostrarAlertaError('Error al generar el PDF');
      }
    });
  }

  private generarPDF(pedido: PedidoResponse): void {
    const doc = new jsPDF();
    
    const primaryColor: [number, number, number] = [237, 98, 12];
    const accentColor: [number, number, number] = [235, 237, 109];
    const darkColor: [number, number, number] = [44, 62, 80];
    
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('PINCELETAS', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Detalle del Pedido', 105, 30, { align: 'center' });
    
    let yPos = 50;
    doc.setTextColor(...darkColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Información del Pedido', 14, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const infoPedido = [
      [`Número de Pedido:`, pedido.numeroPedido],
      [`Fecha:`, this.formatearFechaCompleta(pedido.fechaCreacion)],
      [`Estado:`, this.translateStatus(pedido.estado)],
      [`Tipo de Entrega:`, this.obtenerTipoEntrega(pedido.tipoEntrega)],
      [`Estado de Pago:`, pedido.estadoPagoMp || 'No especificado']
    ];
    
    infoPedido.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 70, yPos);
      yPos += 7;
    });
    
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Productos', 14, yPos);
    yPos += 5;
    
    const productosData = pedido.items.map(item => {
      const subtotal = this.calcularSubtotal(item);
      return [
        item.nombreProducto,
        item.tipoOpcion || 'Sin opción',
        item.cantidad.toString(),
        `$${item.precioUnitario.toFixed(2)}`,
        item.descuentoPorcentaje > 0 ? `${item.descuentoPorcentaje}%` : '-',
        `$${subtotal.toFixed(2)}`
      ];
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [['Producto', 'Opción', 'Cant.', 'Precio Unit.', 'Desc.', 'Subtotal']],
      body: productosData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        textColor: darkColor
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 35 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 25, halign: 'right' }
      }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFillColor(...accentColor);
    doc.rect(140, yPos - 5, 56, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...darkColor);
    doc.text('TOTAL:', 145, yPos + 2);
    doc.setFontSize(14);
    doc.text(`$${pedido.total.toFixed(2)}`, 191, yPos + 2, { align: 'right' });
    
    yPos += 20;
    
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Información de Contacto', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Email: ${pedido.emailContacto}`, 14, yPos);
    yPos += 6;
    doc.text(`Teléfono: ${pedido.telefonoContacto}`, 14, yPos);
    yPos += 10;
    
    if (pedido.tipoEntrega === 'envio' || !pedido.tipoEntrega) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Información de Envío', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Dirección: ${pedido.direccionEnvio}`, 14, yPos);
      yPos += 6;
      doc.text(`Ciudad: ${pedido.ciudadEnvio}`, 14, yPos);
      yPos += 6;
      doc.text(`Provincia: ${pedido.provinciaEnvio}`, 14, yPos);
      yPos += 6;
      doc.text(`Código Postal: ${pedido.codigoPostalEnvio}`, 14, yPos);
    } else if (pedido.tipoEntrega === 'retiro') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Información de Retiro en Local', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Dirección: Barrio Nuevo Jardín, M77 L68', 14, yPos);
      yPos += 6;
      doc.text('Ciudad: Córdoba', 14, yPos);
      yPos += 6;
      doc.text('Provincia: Córdoba', 14, yPos);
      yPos += 6;
      doc.text('Código Postal: 5000', 14, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Horario de atención:', 14, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Lunes a Viernes: 9:00 - 18:00', 14, yPos);
      yPos += 5;
      doc.text('Sábados: 9:00 - 13:00', 14, yPos);
    }
    
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Página ${i} de ${pageCount}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')}`,
        105,
        doc.internal.pageSize.height - 5,
        { align: 'center' }
      );
    }
    
    doc.save(`Pedido_${pedido.numeroPedido}.pdf`);
  }

  private calcularSubtotal(item: any): number {
    const precioConDescuento = item.precioUnitario - (item.precioUnitario * item.descuentoPorcentaje / 100);
    return precioConDescuento * item.cantidad;
  }

  private obtenerTipoEntrega(tipo: string | null): string {
    if (tipo === 'envio') return 'Envío a domicilio';
    if (tipo === 'retiro') return 'Retiro en local';
    return 'Envío a domicilio';
  }

  private translateStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDIENTE': 'Pendiente',
      'PENDIENTE_PAGO': 'Pendiente de Pago',
      'PAGADO': 'Pagado',
      'PROCESANDO': 'Procesando',
      'ENVIADO': 'Enviado',
      'ENTREGADO': 'Entregado',
      'CANCELADO': 'Cancelado',
      'REEMBOLSADO': 'Reembolsado'
    };
    return statusMap[status] || status;
  }

  private formatearFechaCompleta(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
}