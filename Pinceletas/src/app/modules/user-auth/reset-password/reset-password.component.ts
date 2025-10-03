import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserAuthService } from '../../../services/user-auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  email: string = '';
  loading: boolean = false;
  errorMessage: string = '';
  passwordReset: boolean = false;
  
  showTokenError: boolean = false;
  showPasswordError: boolean = false;
  showConfirmError: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: UserAuthService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
    });
  }

  onSubmit() {
    // Validaciones
    this.showTokenError = !this.isValidToken(this.token);
    this.showPasswordError = !this.isValidPassword(this.newPassword);
    this.showConfirmError = this.newPassword !== this.confirmPassword;

    if (this.showTokenError || this.showPasswordError || this.showConfirmError) {
      this.errorMessage = 'Por favor corrige los errores del formulario';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.resetPassword(
      this.token,
      this.newPassword,
      this.confirmPassword
    ).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.passwordReset = true;
        console.log('Contraseña restablecida:', response);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = typeof error === 'string' ? error : 'Error al restablecer la contraseña. Verifica el código.';
        console.error('Error al restablecer:', error);
      }
    });
  }

  resendCode() {
    if (!this.email) {
      this.errorMessage = 'Email no disponible para reenviar código';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.forgotPassword(this.email).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.errorMessage = '';
        alert('Código reenviado exitosamente. Revisa tu email.');
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Error al reenviar el código';
        console.error('Error al reenviar:', error);
      }
    });
  }

  private isValidToken(token: string): boolean {
    return token.length === 6 && /^\d+$/.test(token);
  }

  private isValidPassword(password: string): boolean {
    return password.length >= 6;
  }

  isFormValid(): boolean {
    return this.token.length > 0 && 
           this.newPassword.length >= 6 && 
           this.confirmPassword.length >= 6;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}