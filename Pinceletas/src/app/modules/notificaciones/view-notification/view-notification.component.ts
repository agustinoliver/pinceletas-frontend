import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notificacion } from '../../../models/notification.model';

@Component({
  selector: 'app-view-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-notification.component.html',
  styleUrls: ['./view-notification.component.css']
})
export class ViewNotificationComponent implements OnInit {
  @Input() notificacion!: Notificacion;
  @Output() marcarLeida = new EventEmitter<number>();
  @Output() eliminarNotificacion = new EventEmitter<number>();

  ngOnInit() {
    console.log('Notificación cargada:', this.notificacion);
  }

  onLeerNotificacion(): void {
    if (this.notificacion.estado === 'NO_LEIDA') {
      this.marcarLeida.emit(this.notificacion.id);
    }
  }

  onEliminarNotificacion(event: Event): void {
    event.stopPropagation(); // Evita que se active el evento de leer
    this.eliminarNotificacion.emit(this.notificacion.id);
  }

  getIconoPorTipo(): string {
    switch (this.notificacion.tipo) {
        case 'INICIO_SESION':
            return 'fas fa-sign-in-alt';
        case 'INICIO_SESION_FIREBASE':
            return 'fab fa-google';
        case 'INICIO_SESION_FIREBASE_ADMIN':
            return 'fab fa-google';
        case 'NUEVO_REGISTRO':
            return 'fas fa-user-plus';
        case 'BIENVENIDA_REGISTRO': // 🔥 NUEVO
            return 'fas fa-paint-brush';
        default:
            return 'fas fa-bell';
    }
}

  getColorPorTipo(): string {
    switch (this.notificacion.tipo) {
        case 'INICIO_SESION':
            return 'text-primary';
        case 'INICIO_SESION_FIREBASE':
            return 'text-success';
        case 'INICIO_SESION_FIREBASE_ADMIN':
            return 'text-warning';
        case 'NUEVO_REGISTRO':
            return 'text-info';
        case 'BIENVENIDA_REGISTRO': // 🔥 NUEVO
            return 'text-accent';
        default:
            return 'text-secondary';
    }
  }
  
}