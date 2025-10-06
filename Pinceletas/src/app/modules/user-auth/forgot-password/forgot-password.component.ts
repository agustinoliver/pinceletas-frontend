import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserAuthService } from '../../../services/user-auth.service';

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
    this.errorMessage = 'Por favor ingresa un email válido';
    return;
  }

  this.loading = true;
  this.errorMessage = '';
  this.successMessage = '';
  this.showEmailError = false;

  this.authService.forgotPassword(this.email).subscribe({
    next: (response: any) => {
      this.loading = false;
      
      // SIEMPRE mostrar mensaje de éxito (según la lógica actual del backend)
      this.successMessage = response.message || 'Código enviado correctamente. Revisa tu email.';
      
      // Redirigir después de 2 segundos SOLO si fue exitoso
      setTimeout(() => {
        this.router.navigate(['/reset-password'], {
          queryParams: { email: this.email }
        });
      }, 2000);
    },
    error: (error: any) => {
      this.loading = false;
      
      // Manejar diferentes tipos de errores
      if (error?.message) {
        // Error con mensaje específico
        this.errorMessage = error.message;
      } else if (error?.error?.message) {
        // Error del backend con mensaje específico
        this.errorMessage = error.error.message;
      } else if (typeof error === 'string') {
        // Error como string
        this.errorMessage = error;
      } else if (error?.status === 404) {
        // Error 404 - email no encontrado
        this.errorMessage = 'El email ingresado no se encuentra registrado en el sistema';
      } else if (error?.status === 400) {
        // Error 400 - datos inválidos
        this.errorMessage = 'Email inválido o cuenta desactivada';
      } else if (error?.status === 500) {
        // Error del servidor
        this.errorMessage = 'Error del servidor. Por favor intenta más tarde.';
      } else {
        // Error genérico
        this.errorMessage = 'Error al enviar el código. Intenta nuevamente.';
      }
      
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
}