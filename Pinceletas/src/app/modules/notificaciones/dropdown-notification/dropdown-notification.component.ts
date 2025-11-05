import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../../services/notification.service';
import { UserAuthService } from '../../../services/user-auth.service';
import { ViewNotificationComponent } from '../view-notification/view-notification.component';
import { Notificacion } from '../../../models/notification.model';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-dropdown-notification',
  standalone: true,
  imports: [CommonModule, ViewNotificationComponent],
  templateUrl: './dropdown-notification.component.html',
  styleUrl: './dropdown-notification.component.css'
})
export class DropdownNotificationComponent implements OnInit, OnDestroy {
  isOpen = false;
  notificaciones: Notificacion[] = [];
  contadorNoLeidas = 0;
  currentUser: User | null = null;
  
  private userSubscription?: Subscription;

  constructor(
    private notificationService: NotificationService,
    private authService: UserAuthService
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user && user.id) {
        this.cargarNotificaciones(user.id);
        this.cargarContadorNoLeidas(user.id);
      } else {
        this.notificaciones = [];
        this.contadorNoLeidas = 0;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  // 🔥 NUEVO: Cerrar dropdown al hacer click fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.notification-dropdown');
    
    if (!clickedInside && this.isOpen) {
      this.isOpen = false;
    }
  }

  // 🔥 NUEVO: Prevenir que se cierre al hacer click dentro del dropdown
  @HostListener('click', ['$event'])
  onDropdownClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  cargarNotificaciones(usuarioId: number): void {
    this.notificationService.getNotificacionesPorUsuario(usuarioId).subscribe({
      next: (notificaciones) => {
        this.notificaciones = notificaciones;
      },
      error: (error) => {
        console.error('Error cargando notificaciones:', error);
      }
    });
  }

  cargarContadorNoLeidas(usuarioId: number): void {
    this.notificationService.getContadorNoLeidas(usuarioId).subscribe({
      next: (contador) => {
        this.contadorNoLeidas = contador;
      },
      error: (error) => {
        console.error('Error cargando contador:', error);
      }
    });
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation(); // 🔥 IMPORTANTE: Prevenir propagación
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.currentUser?.id) {
      this.cargarNotificaciones(this.currentUser.id);
    }
  }

  onMarcarLeida(notificacionId: number): void {
    if (this.currentUser?.id) {
      this.notificationService.marcarComoLeida(notificacionId, this.currentUser.id).subscribe({
        next: () => {
          // Actualizar estado local
          const notificacion = this.notificaciones.find(n => n.id === notificacionId);
          if (notificacion) {
            notificacion.estado = 'LEIDA';
          }
          this.contadorNoLeidas = Math.max(0, this.contadorNoLeidas - 1);
        },
        error: (error) => {
          console.error('Error marcando como leída:', error);
        }
      });
    }
  }

  onEliminarNotificacion(notificacionId: number): void {
    if (this.currentUser?.id) {
      this.notificationService.eliminarNotificacion(notificacionId, this.currentUser.id).subscribe({
        next: () => {
          // Remover de la lista local
          const notificacion = this.notificaciones.find(n => n.id === notificacionId);
          if (notificacion && notificacion.estado === 'NO_LEIDA') {
            this.contadorNoLeidas = Math.max(0, this.contadorNoLeidas - 1);
          }
          this.notificaciones = this.notificaciones.filter(n => n.id !== notificacionId);
        },
        error: (error) => {
          console.error('Error eliminando notificación:', error);
        }
      });
    }
  }

  marcarTodasComoLeidas(): void {
    if (this.currentUser?.id && this.contadorNoLeidas > 0) {
      this.notificationService.marcarTodasComoLeidas(this.currentUser.id).subscribe({
        next: () => {
          this.notificaciones.forEach(n => n.estado = 'LEIDA');
          this.contadorNoLeidas = 0;
        },
        error: (error) => {
          console.error('Error marcando todas como leídas:', error);
        }
      });
    }
  }

  get tieneNotificaciones(): boolean {
    return this.notificaciones.length > 0;
  }
}