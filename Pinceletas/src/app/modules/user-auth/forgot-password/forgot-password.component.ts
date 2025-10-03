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
        this.successMessage = 'Código enviado correctamente. Revisa tu email.';
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/reset-password'], {
            queryParams: { email: this.email }
          });
        }, 2000);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = typeof error === 'string' ? error : 'Error al enviar el código. Intenta nuevamente.';
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