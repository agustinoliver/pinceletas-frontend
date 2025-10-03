import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserAuthService } from '../../../services/user-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  loading: boolean = false;
  googleLoading: boolean = false;
  errorMessage: string = '';
  returnUrl: string = '/';

  constructor(
    private authService: UserAuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Obtener returnUrl de los parámetros de ruta o usar '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  /**
   * Login normal con email y password
   */
  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const loginData = {
      email: this.email,
      password: this.password
    };

    this.authService.login(loginData).subscribe({
      next: (response) => {
        this.loading = false;
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
        console.error('Login error:', error);
      }
    });
  }

  /**
   * Iniciar sesión con Google
   */
  loginWithGoogle(): void {
    this.googleLoading = true;
    this.errorMessage = '';

    this.authService.loginWithGoogle().subscribe({
      next: (response) => {
        this.googleLoading = false;
        console.log('Google login successful:', response);
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (error) => {
        this.googleLoading = false;
        this.errorMessage = error;
        console.error('Google login error:', error);
      }
    });
  }

  /**
   * Ir a registro
   */
  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  /**
   * Ir a recuperar contraseña
   */
  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
}