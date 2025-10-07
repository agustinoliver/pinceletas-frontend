import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserAuthService } from '../../../services/user-auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email: string = '';
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  showEmailError: boolean = false;

  constructor(
    private authService: UserAuthService,
    private router: Router
  ) {}

  onSubmit() {
    // Validar email
    if (!this.isValidEmail(this.email)) {
      this.showEmailError = true;
      this.mostrarAlertaError('Por favor ingresa un email válido');
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.showEmailError = false;

    this.authService.forgotPassword(this.email).subscribe({
      next: (response: any) => {
        this.loading = false;
        
        // Mostrar alerta de éxito
        this.mostrarAlertaExito(response.message || 'Código enviado correctamente. Revisa tu email.')
          .then(() => {
            // Redirigir después de que el usuario cierre la alerta
            this.router.navigate(['/reset-password'], {
              queryParams: { email: this.email }
            });
          });
      },
      error: (error: any) => {
        this.loading = false;
        
        // Manejar diferentes tipos de errores
        let mensajeError = 'Error al enviar el código. Intenta nuevamente.';
        
        if (error?.message) {
          mensajeError = error.message;
        } else if (error?.error?.message) {
          mensajeError = error.error.message;
        } else if (typeof error === 'string') {
          mensajeError = error;
        } else if (error?.status === 404) {
          mensajeError = 'El email ingresado no se encuentra registrado en el sistema';
        } else if (error?.status === 400) {
          mensajeError = 'Email inválido o cuenta desactivada';
        } else if (error?.status === 500) {
          mensajeError = 'Error del servidor. Por favor intenta más tarde.';
        }
        
        // Mostrar alerta de error
        this.mostrarAlertaError(mensajeError);
        console.error('Error en recuperación:', error);
      }
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  // Método para mostrar alertas de éxito
  private mostrarAlertaExito(mensaje: string): Promise<any> {
    return Swal.fire({
      title: '¡Éxito!',
      text: mensaje,
      icon: 'success',
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#ed620c',
      timer: 3000,
      timerProgressBar: true,
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });
  }

  // Método para mostrar alertas de error
  private mostrarAlertaError(mensaje: string): void {
    Swal.fire({
      title: 'Error',
      text: mensaje,
      icon: 'error',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#d33',
      showClass: {
        popup: 'animate__animated animate__shakeX'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });
  }

  // Método para mostrar confirmación antes de enviar (opcional)
  private mostrarConfirmacion(): Promise<any> {
    return Swal.fire({
      title: '¿Enviar código de recuperación?',
      text: `Se enviará un código al email: ${this.email}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ed620c',
      cancelButtonColor: '#6c757d',
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      }
    });
  }
}