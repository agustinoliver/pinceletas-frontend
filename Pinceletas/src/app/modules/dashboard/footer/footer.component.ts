import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TerminosCondiciones, Tienda } from '../../../models/config.model';
import { ConfigService } from '../../../services/config.service';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HandWaveAnimationComponent } from '../../extras/hand-wave-animation/hand-wave-animation.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HandWaveAnimationComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent implements OnInit, OnDestroy {
  tiendaConfig: Tienda | null = null;
  terminosConfig: TerminosCondiciones | null = null;
  politicaModalTitle = '';
  politicaModalContent = '';
  
  // WhatsApp Inteligente
  whatsappStatus = {
    isOnline: false,
    message: '',
    nextAvailable: '',
    horario: 'Lunes a Viernes 9:00 - 18:00, Sábados 9:00 - 13:00'
  };

  // Chatbase Bot
  showChatbaseFloat = true;
  showChatbaseIframe = false;

  // Botón flotante
  showWhatsAppFloat = true;
  isScrolled = false;
  showMessageOptions = false;

  // Mensajes personalizados para WhatsApp
  whatsappMessages = [
    {
      id: 'productos',
      icon: 'fas fa-shopping-bag',
      title: 'Consultar Productos',
      message: 'Hola, me interesa conocer más sobre un producto. ¿Podrían enviarme información?'
    },
    {
      id: 'seguimiento',
      icon: 'fas fa-truck',
      title: 'Seguimiento de Pedido',
      message: 'Hola, necesito hacer seguimiento de mi pedido. ¿Podrían ayudarme con la información?'
    },
    {
      id: 'soporte',
      icon: 'fas fa-tools',
      title: 'Soporte Técnico',
      message: 'Hola, necesito soporte técnico con un producto. ¿Me pueden asistir?'
    },
    {
      id: 'personalizado',
      icon: 'fas fa-comment',
      title: 'Mensaje Personalizado',
      message: 'Hola, me gustaría contactarme con ustedes para consultar sobre:'
    }
  ];

  selectedMessage = this.whatsappMessages[0];
  private configUpdateSubscription: Subscription | undefined;

  // 🆕 Animación Chatbase
  chatbaseMessages = [
    '¿Primera vez usando la app? Este es un buen lugar para empezar.',
    '¿Algo no te sale? Tranquilo, te damos una mano.',
    '¿Necesitas ayuda? Nuestro asistente virtual está aquí para ayudarte.',
    '¿Tienes preguntas? Pregúntale a nuestro asistente inteligente.'
  ];

  constructor(private configService: ConfigService) {}

  ngOnInit(): void {
    this.cargarConfiguracionFooter();
    this.checkWhatsAppAvailability();
    this.setupChatbaseAnimation(); // ✅ NUEVO

    // Actualizar estado cada minuto
    setInterval(() => {
      this.checkWhatsAppAvailability();
    }, 60000);

    // Escuchar eventos de actualización de configuración
    window.addEventListener('configUpdated', () => {
      console.log('Evento configUpdated recibido, recargando footer...');
      this.cargarConfiguracionFooter();
    });
  }

  ngOnDestroy(): void {
    if (this.configUpdateSubscription) {
      this.configUpdateSubscription.unsubscribe();
    }
    window.removeEventListener('configUpdated', () => {
      this.cargarConfiguracionFooter();
    });
  }

  // ✅ NUEVO MÉTODO
  private setupChatbaseAnimation(): void {
    // La animación se manejará automáticamente en el componente hijo
  }

  // MÉTODO CORREGIDO - Maneja correctamente el array de tiendas
  cargarConfiguracionFooter(): void {
    this.configService.getTiendas().subscribe({
      next: (tiendas) => {
        this.actualizarTiendaConfig(tiendas);
      },
      error: (error) => console.error('Error cargando configuración de tienda:', error)
    });

    this.configService.getTerminosCondiciones().subscribe({
      next: (terminos) => {
        this.actualizarTerminosConfig(terminos);
      },
      error: (error) => console.error('Error cargando términos y condiciones:', error)
    });
  }

  private actualizarTiendaConfig(tiendas: Tienda[]): void {
    if (tiendas && tiendas.length > 0) {
      this.tiendaConfig = { ...tiendas[0] };
      console.log('Tienda config actualizada:', this.tiendaConfig);
    } else {
      this.tiendaConfig = null;
      console.log('No hay tiendas configuradas');
    }
  }

  private actualizarTerminosConfig(terminos: TerminosCondiciones[]): void {
    if (terminos && terminos.length > 0) {
      this.terminosConfig = { ...terminos[0] };
      console.log('Términos config actualizados:', this.terminosConfig);
    } else {
      this.terminosConfig = null;
    }
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled = window.pageYOffset > 100;
  }

  checkWhatsAppAvailability(): void {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const day = now.getDay();
    const currentTime = hour + minutes / 100;

    const isWeekday = day >= 1 && day <= 5;
    const isSaturday = day === 6;
    const isBusinessHoursWeekday = currentTime >= 9 && currentTime < 18;
    const isBusinessHoursSaturday = currentTime >= 9 && currentTime < 13;

    this.whatsappStatus.isOnline = (isWeekday && isBusinessHoursWeekday) || 
                                  (isSaturday && isBusinessHoursSaturday);
    
    if (this.whatsappStatus.isOnline) {
      this.whatsappStatus.message = 'Disponible ahora';
      this.whatsappStatus.nextAvailable = '';
    } else {
      this.whatsappStatus.message = 'Fuera de horario';
      this.whatsappStatus.nextAvailable = this.calculateNextAvailable(day, hour);
    }
  }

  private calculateNextAvailable(day: number, hour: number): string {
    if (day === 0) {
      return 'Lunes 9:00hs';
    } else if (day === 6) {
      if (hour < 13) {
        return 'Hoy hasta 13:00hs';
      } else {
        return 'Lunes 9:00hs';
      }
    } else {
      if (hour < 9) {
        return 'Hoy 9:00hs';
      } else if (hour >= 18) {
        if (day === 5) {
          return 'Lunes 9:00hs';
        } else {
          return 'Mañana 9:00hs';
        }
      }
    }
    return '';
  }

  selectMessage(message: any): void {
    this.selectedMessage = message;
  }

  getWhatsAppHref(message?: any): string {
    const selected = message || this.selectedMessage;
    const baseMessage = selected.message;
    const finalMessage = this.whatsappStatus.isOnline ? 
      baseMessage : 
      `${baseMessage} (Consulta fuera de horario comercial)`;
    
    return `https://wa.me/5493512711316?text=${encodeURIComponent(finalMessage)}`;
  }

  toggleMessageOptions(): void {
    this.showMessageOptions = !this.showMessageOptions;
  }

  closeMessageOptions(): void {
    this.showMessageOptions = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const floatContainer = document.querySelector('.whatsapp-main-btn-container');
    
    if (floatContainer && !floatContainer.contains(target)) {
      this.showMessageOptions = false;
    }
  }

  mostrarPolitica(tipo: string): void {
    if (!this.terminosConfig) return;

    if (tipo === 'terminos') {
      this.politicaModalTitle = 'Términos de Servicio';
      this.politicaModalContent = this.terminosConfig.terminosServicio.replace(/\n/g, '<br>');
    } else if (tipo === 'privacidad') {
      this.politicaModalTitle = 'Política de Privacidad';
      this.politicaModalContent = this.terminosConfig.politicaPrivacidad.replace(/\n/g, '<br>');
    }

    const modalElement = document.getElementById('politicasModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  toggleWhatsAppFloat(): void {
    this.showWhatsAppFloat = !this.showWhatsAppFloat;
  }

  // -------------------------------------------------------------------------------
  // Métodos para Chatbase
  // -------------------------------------------------------------------------------
  toggleChatbaseIframe(): void {
    this.showChatbaseIframe = !this.showChatbaseIframe;
  }

  closeChatbaseIframe(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.showChatbaseIframe = false;
    }
  }

  toggleChatbaseFloat(): void {
    this.showChatbaseFloat = !this.showChatbaseFloat;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKeydown(event: KeyboardEvent): void {
    if (this.showChatbaseIframe) {
      this.showChatbaseIframe = false;
    }
  }
}
